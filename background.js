/**
 * @author Yuehuaer
 * ==============================================================================
 * 【脚本免责声明】
 *  1. 此插件和脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
 *  2. 由于此插件和脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
 *  3. 请勿将此插件和脚本用于任何商业或非法目的，若违反规定请自行对此负责。
 *  4. 此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
 *  5. 本人对任何插件和脚本引发的问题概不负责，包括但不限于由插件和脚本错误引起的任何损失和损害。
 *  6. 如果任何单位或个人认为此插件和脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此插件和脚本。
 *  7. 所有直接或间接使用、查看此插件和脚本的人均应该仔细阅读此声明, 本人保留随时更改或补充此声明的权利, 一旦您使用或复制了此插件和脚本，即视为您已接受此免责声明。
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