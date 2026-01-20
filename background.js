/**
 * @author Yuehuaer
 * ==============================================================================
 * 插件和脚本声明:
 * 1. 本插件和脚本仅用于学习研究，禁止用于商业用途
 * 2. 本插件和脚本不保证准确性、可靠性、完整性和及时性
 * 3. 任何个人或组织均可无需经过通知而自由使用
 * 4. 作者对任何插件和脚本问题概不负责，包括由此产生的任何损失
 * 5. 如果任何单位或个人认为该脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明、所有权证明，我将在收到认证文件确认后删除
 * 6. 请勿将本脚本用于商业用途，由此引起的问题与作者无关
 * 7. 本脚本及其更新版权归作者所有
 * ==============================================================================
 */

// 安装时创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "extractToBark",
    title: "提取选中文字到 Bark 草稿箱",
    contexts: ["selection"]
  });
});

// 监听点击事件
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "extractToBark") {
    
    // 1. 读取当前的草稿（防止覆盖掉你之前填的 Key 或其他设置）
    const storage = await chrome.storage.local.get(['bark_draft']);
    let draft = storage.bark_draft || {};

    // 2. 组装新内容：引用选中的文字 + 来源链接
    // 格式采用了 Markdown 的引用语法 >
    const newContent = `> ${info.selectionText}\n\n[来源: ${tab.title}](${tab.url})`;

    // 3. 更新草稿对象
    draft.pushContent = newContent;
    draft.pushTitle = tab.title; // 顺便把标题也填了
    
    // 自动把 Markdown 开关打开，因为我们用了 Markdown 语法
    draft.isMarkdown = true; 

    // 尝试抓取图标 (如果存在)
    if (tab.favIconUrl) {
        draft.pushIcon = tab.favIconUrl;
    }

    // 4. 保存回本地存储
    await chrome.storage.local.set({ 'bark_draft': draft });

    // 5. 弹出系统通知告诉用户好了 (因为无法自动打开插件窗口)
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png', // 确保你的文件夹里有 icon.png
      title: 'Bark Crystal Pro',
      message: '✅ 内容已提取！请点击插件图标进行发送。',
      priority: 2
    });
  }
});