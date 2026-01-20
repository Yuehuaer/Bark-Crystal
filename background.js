/**
 * @author Yuehuaer
 * ==============================================================================
 * 【脚本免责声明】
 * 1. 此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断。
 * 2. 必须在下载后 24 小时内完全删除，本人对使用后果不承担责任。
 * 3. 严禁用于商业或非法目的。
 * 4. 涉及应用与本人无关。
 * 5. 本人对脚本错误不负责。
 * 6. 若侵权请通知删除。
 * 7. 使用即代表接受此声明。
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