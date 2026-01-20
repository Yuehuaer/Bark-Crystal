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

const DEFAULT_KEY = "";
const DEFAULT_SERVER = "https://api.day.app";

document.addEventListener('DOMContentLoaded', () => {
    // 字段映射
    const fields = {
        title: 'pushTitle',
        subtitle: 'pushSubtitle',
        content: 'pushContent',
        badge: 'pushBadge',
        group: 'pushGroup',
        icon: 'pushIcon',
        image: 'pushImage'
    };
    
    // 特殊处理 Markdown 开关
    const mdSwitch = document.getElementById('isMarkdown');
    const getVal = (id) => document.getElementById(id).value;
    const statusDiv = document.getElementById('status');

    function showStatus(msg, type = 'normal') {
        statusDiv.innerText = msg;
        statusDiv.className = 'status-visible';
        if (type === 'success') statusDiv.classList.add('success-msg');
        else if (type === 'error') statusDiv.classList.add('error-msg');
        setTimeout(() => {
            statusDiv.className = '';
            statusDiv.innerText = '';
        }, 3000);
    }

    // --- 草稿自动保存 (包含开关状态) ---
    const saveDraft = () => {
        const draft = {};
        Object.values(fields).forEach(id => {
            draft[id] = document.getElementById(id).value;
        });
        // 保存开关状态
        draft['isMarkdown'] = mdSwitch.checked;
        chrome.storage.local.set({ 'bark_draft': draft });
    };

    const restoreDraft = () => {
        chrome.storage.local.get(['bark_draft'], (result) => {
            if (result.bark_draft) {
                const draft = result.bark_draft;
                Object.values(fields).forEach(id => {
                    if (draft[id]) document.getElementById(id).value = draft[id];
                });
                // 恢复开关
                if (draft['isMarkdown'] !== undefined) {
                    mdSwitch.checked = draft['isMarkdown'];
                }
                updatePreview();
            }
        });
    };

    // --- 实时预览 ---
    const updatePreview = () => {
        document.getElementById('prevTitle').innerText = getVal(fields.title) || "标题预览";
        
        const sub = getVal(fields.subtitle);
        const subEl = document.getElementById('prevSubtitle');
        subEl.innerText = sub || "";
        subEl.style.display = sub ? 'block' : 'none';
        
        const content = getVal(fields.content);
        const prevBody = document.getElementById('prevBody');

        // 根据开关决定预览渲染方式
        if (mdSwitch.checked && typeof marked !== 'undefined') {
            // MD 开启时，预览也模拟“自动换行”效果：先把单换行替换成双换行
            const previewContent = content.replace(/\n/g, '\n\n');
            prevBody.innerHTML = marked.parse(previewContent || "");
        } else {
            // MD 关闭时，显示纯文本，保留换行
            prevBody.innerText = content;
        }

        const imgUrl = getVal(fields.image);
        const prevImg = document.getElementById('prevImage');
        if(imgUrl) {
            prevImg.src = imgUrl;
            prevImg.classList.remove('hidden');
        } else {
            prevImg.classList.add('hidden');
        }
    };

    // 绑定输入事件
    Object.values(fields).forEach(id => {
        document.getElementById(id).oninput = () => {
            updatePreview();
            saveDraft();
        };
    });
    
    // 绑定开关事件
    mdSwitch.onchange = () => {
        updatePreview();
        saveDraft();
    };

    restoreDraft();

    document.getElementById('grabUrl').onclick = async () => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        document.getElementById(fields.title).value = tab.title;
        document.getElementById(fields.content).value = `[原文链接](${tab.url})`;
        if (tab.favIconUrl) document.getElementById(fields.icon).value = tab.favIconUrl;
        // 抓取链接通常意味着包含 MD 语法，自动打开开关
        mdSwitch.checked = true; 
        updatePreview();
        saveDraft();
        showStatus('✅ 已抓取', 'success');
    };

    // --- 发送逻辑 (核心智能处理) ---
    document.getElementById('sendBtn').onclick = async () => {
        const key = document.getElementById('deviceKey').value || DEFAULT_KEY;
        let server = document.getElementById('serverUrl').value || DEFAULT_SERVER;
        server = server.replace(/\/$/, "");

        const btn = document.getElementById('sendBtn');
        const originalText = btn.innerText;
        btn.innerText = '📡 ...';
        btn.disabled = true;

        const rawContent = getVal(fields.content);
        
        // ✨ 智能处理 ✨
        // 如果开启 MD：使用 markdown 字段，并把单换行替换成双换行 (\n -> \n\n)
        // 如果关闭 MD：使用 body 字段，原样发送
        const isMD = mdSwitch.checked;
        const processedContent = isMD ? rawContent.replace(/\n/g, '\n\n') : rawContent;

        const payload = {
            device_key: key,
            title: getVal(fields.title),
            subtitle: getVal(fields.subtitle),
            body: isMD ? undefined : rawContent, // 纯文本模式传 body
            markdown: isMD ? processedContent : undefined, // MD 模式传 markdown
            badge: parseInt(getVal(fields.badge)) || undefined,
            group: getVal(fields.group) || "Crystal",
            icon: getVal(fields.icon) || undefined,
            image: getVal(fields.image) || undefined,
            action: 'alert'
        };

        try {
            const response = await fetch(`${server}/push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            
            if(data.code === 200) {
                showStatus('🚀 成功', 'success');
                chrome.storage.local.remove('bark_draft');
            } else {
                showStatus('❌ ' + data.message, 'error');
            }
        } catch (e) {
            showStatus('🚫 失败', 'error');
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };

    // 设置逻辑
    document.getElementById('settingsBtn').onclick = () => {
        const main = document.getElementById('mainView');
        const set = document.getElementById('settingsView');
        main.classList.toggle('hidden');
        set.classList.toggle('hidden');
    };

    chrome.storage.sync.get(['key', 'server'], (res) => {
        document.getElementById('deviceKey').value = res.key || DEFAULT_KEY;
        document.getElementById('serverUrl').value = res.server || DEFAULT_SERVER;
    });

    document.getElementById('saveBtn').onclick = () => {
        chrome.storage.sync.set({
            key: document.getElementById('deviceKey').value,
            server: document.getElementById('serverUrl').value
        }, () => {
            showStatus('✅ 已保存', 'success');
            setTimeout(() => {
                document.getElementById('settingsView').classList.add('hidden');
                document.getElementById('mainView').classList.remove('hidden');
            }, 800);
        });
    };
});