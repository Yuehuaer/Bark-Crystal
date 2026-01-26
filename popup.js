/**
 * @author Yuehuaer
 * ==============================================================================
 * 【脚本免责声明】
 * 1. 此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
 * 2. 由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
 * 3. 请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
 * 4. 此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
 * 5. 本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
 * 6. 如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
 * 7. 所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明, 本人保留随时更改或补充此声明的权利, 一旦您使用或复制了此脚本，即视为您已接受此免责声明。
 * ==============================================================================
 */

// 默认配置
const DEFAULT_KEY = "";
const DEFAULT_SERVER = "https://api.day.app";
const MP_DEFAULT_USER = "";
const MP_DEFAULT_KEY = "";
const MP_SERVER_BASE = "https://messagepush.luckfast.com/send";

document.addEventListener('DOMContentLoaded', () => {
    // 字段映射
    const fields = { 
        title: 'pushTitle', subtitle: 'pushSubtitle', content: 'pushContent', 
        badge: 'pushBadge', group: 'pushGroup', icon: 'pushIcon', 
        image: 'pushImage', url: 'pushUrl' 
    };
    const mdSwitch = document.getElementById('isMarkdown');
    const mdContainer = document.querySelector('.switch-container');
    const statusDiv = document.getElementById('status');
    const getVal = (id) => document.getElementById(id).value;
    const setVal = (id, val) => { document.getElementById(id).value = val || ''; };

    // 模式切换变量
    let currentMode = 'bark';
    const serviceSwitch = document.getElementById('serviceSwitch');
    const serviceName = document.getElementById('serviceName');
    
    const settingsView = document.getElementById('settingsView');
    const mainView = document.getElementById('mainView');
    const configField1 = document.getElementById('configField1');
    const configField2 = document.getElementById('configField2');

    function showStatus(msg, type = 'normal') {
        statusDiv.innerText = msg; statusDiv.className = 'status-visible';
        if (type === 'success') statusDiv.classList.add('success-msg'); else if (type === 'error') statusDiv.classList.add('error-msg');
        setTimeout(() => { statusDiv.className = ''; statusDiv.innerText = ''; }, 3000);
    }

    // 草稿保存
    const saveDraft = () => {
        const draft = {};
        Object.values(fields).forEach(id => { draft[id] = getVal(id); });
        if(currentMode === 'bark') draft['isMarkdown'] = mdSwitch.checked;
        chrome.storage.local.set({ 'bark_draft': draft });
    };

    const restoreDraft = () => {
        chrome.storage.local.get(['bark_draft'], (result) => {
            if (result.bark_draft) {
                const draft = result.bark_draft;
                Object.values(fields).forEach(id => {
                    if (draft[id] !== undefined) setVal(id, draft[id]);
                });
                if (currentMode === 'bark' && draft['isMarkdown'] !== undefined) {
                    mdSwitch.checked = draft['isMarkdown'];
                }
                updatePreview();
            }
        });
    };

    // 清空按钮逻辑
    document.getElementById('clearBtn').onclick = () => {
        Object.values(fields).forEach(id => setVal(id, ''));
        chrome.storage.local.remove('bark_draft');
        updatePreview();
        showStatus('🗑️ 已清空', 'success');
    };

    // 模式切换UI
    const updateModeUI = () => {
        const lbl1 = document.getElementById('lblField1');
        const lbl2 = document.getElementById('lblField2');
        const stTitle = document.getElementById('settingsTitle');

        if (currentMode === 'bark') {
            serviceName.innerText = "Bark";
            serviceSwitch.classList.remove('mode-mp');
            stTitle.innerText = "Bark 配置";
            lbl1.innerText = "Device Key";
            lbl2.innerText = "服务器地址";
            mdContainer.classList.remove('disabled');
            mdSwitch.disabled = false;
        } else {
            serviceName.innerText = "助手";
            serviceSwitch.classList.add('mode-mp');
            stTitle.innerText = "消息助手 配置";
            lbl1.innerText = "User ID";
            lbl2.innerText = "User Key";
            mdSwitch.checked = false;
            mdSwitch.disabled = true;
            mdContainer.classList.add('disabled');
        }
        updatePreview();
    };

    // 加载配置
    const loadConfig = () => {
        chrome.storage.sync.get(['bark_key', 'bark_server', 'mp_user', 'mp_key', 'push_mode'], (res) => {
            if (res.push_mode) currentMode = res.push_mode;
            updateModeUI();
            
            if (currentMode === 'bark') {
                configField1.value = res.bark_key || DEFAULT_KEY;
                configField2.value = res.bark_server || DEFAULT_SERVER;
            } else {
                configField1.value = res.mp_user || MP_DEFAULT_USER;
                configField2.value = res.mp_key || MP_DEFAULT_KEY;
            }
            restoreDraft();
        });
    };

    // 切换服务
    serviceSwitch.onclick = () => {
        if (currentMode === 'bark') {
            chrome.storage.sync.set({ bark_key: configField1.value, bark_server: configField2.value });
            currentMode = 'mphelper';
        } else {
            chrome.storage.sync.set({ mp_user: configField1.value, mp_key: configField2.value });
            currentMode = 'bark';
        }
        chrome.storage.sync.set({ push_mode: currentMode });
        loadConfig();
        showStatus(`切换至: ${currentMode === 'bark' ? 'Bark' : '消息助手'}`);
    };

    // 抓取逻辑
    document.getElementById('grabUrl').onclick = async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) return;
            setVal(fields.title, tab.title);
            setVal(fields.url, tab.url);
            setVal(fields.content, `[原文链接](${tab.url})`);
            if (tab.favIconUrl && tab.favIconUrl.startsWith('http')) setVal(fields.icon, tab.favIconUrl);
            saveDraft();
            updatePreview();
            showStatus('✅ 已抓取', 'success');
        } catch (e) { console.error(e); showStatus('⚠️ 无法抓取', 'error'); }
    };

    // 预览逻辑
    const updatePreview = () => {
        document.getElementById('prevTitle').innerText = getVal(fields.title) || "标题预览";
        const sub = getVal(fields.subtitle);
        const subEl = document.getElementById('prevSubtitle');
        subEl.innerText = sub || ""; subEl.style.display = sub ? 'block' : 'none';
        
        const content = getVal(fields.content);
        const prevBody = document.getElementById('prevBody');
        
        if (currentMode === 'bark' && mdSwitch.checked && typeof marked !== 'undefined') {
            const previewContent = content.replace(/\n/g, '\n\n');
            prevBody.innerHTML = marked.parse(previewContent || "");
        } else {
            prevBody.innerText = content;
        }

        const imgUrl = getVal(fields.image);
        const prevImg = document.getElementById('prevImage');
        if(imgUrl) { prevImg.src = imgUrl; prevImg.classList.remove('hidden'); } else { prevImg.classList.add('hidden'); }
    };

    Object.values(fields).forEach(id => { document.getElementById(id).oninput = () => { updatePreview(); saveDraft(); }; });
    mdSwitch.onchange = () => { updatePreview(); saveDraft(); };

    // 历史与Tab
    const tabPreview = document.getElementById('tabPreview');
    const tabHistory = document.getElementById('tabHistory');
    const viewPreview = document.getElementById('viewPreview');
    const viewHistory = document.getElementById('viewHistory');
    const historyList = document.getElementById('historyList');

    const switchTab = (tab) => {
        if(tab === 'preview') {
            tabPreview.classList.add('active-tab'); tabHistory.classList.remove('active-tab');
            viewPreview.classList.add('active-view'); viewHistory.classList.remove('active-view');
        } else {
            tabHistory.classList.add('active-tab'); tabPreview.classList.remove('active-tab');
            viewHistory.classList.add('active-view'); viewPreview.classList.remove('active-view');
            renderHistory();
        }
    };
    tabPreview.onclick = () => switchTab('preview');
    tabHistory.onclick = () => switchTab('history');

    const renderHistory = () => {
        chrome.storage.local.get(['bark_history'], (res) => {
            const history = res.bark_history || [];
            historyList.innerHTML = history.length === 0 ? '<div style="text-align:center;color:#999;margin-top:20px;font-size:12px;">暂无历史</div>' : '';
            history.forEach(item => {
                const div = document.createElement('div');
                div.className = 'history-item';
                const tag = item.isMD ? '<span class="history-tag md">MD</span>' : '<span class="history-tag">TXT</span>';
                div.innerHTML = `
                    <div class="history-item-title">${item.title || '无标题'}</div>
                    <div class="history-item-desc">${item.content || '无内容'}</div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:5px;">
                        ${tag} <span style="font-size:10px;color:#ccc;">${item.time.split(' ')[1]}</span>
                    </div>
                `;
                div.onclick = () => {
                    setVal(fields.title, item.title); setVal(fields.subtitle, item.subtitle);
                    setVal(fields.content, item.content); setVal(fields.image, item.image);
                    setVal(fields.url, item.url);
                    if(currentMode === 'bark') mdSwitch.checked = item.isMD;
                    updatePreview(); saveDraft(); switchTab('preview'); showStatus('🔄 已恢复', 'success');
                };
                historyList.appendChild(div);
            });
        });
    };

    const addToHistory = (data) => {
        chrome.storage.local.get(['bark_history'], (res) => {
            let history = res.bark_history || [];
            history.unshift({ ...data, time: new Date().toLocaleString('zh-CN', { hour12: false }) });
            if (history.length > 20) history.pop();
            chrome.storage.local.set({ 'bark_history': history });
        });
    };

    // 发送
    document.getElementById('sendBtn').onclick = async () => {
        const btn = document.getElementById('sendBtn');
        const originalText = btn.innerText;
        btn.innerText = '📡 ...'; btn.disabled = true;

        const title = getVal(fields.title);
        const subtitle = getVal(fields.subtitle);
        const content = getVal(fields.content);
        const url = getVal(fields.url);
        const icon = getVal(fields.icon);
        const image = getVal(fields.image);
        const badge = getVal(fields.badge);
        const group = getVal(fields.group);
        const isMD = mdSwitch.checked && currentMode === 'bark';

        try {
            if (currentMode === 'bark') {
                const key = configField1.value || DEFAULT_KEY;
                let server = (configField2.value || DEFAULT_SERVER).replace(/\/$/, "");
                const processed = isMD ? content.replace(/\n/g, '\n\n') : content;
                
                const payload = {
                    device_key: key, title, subtitle,
                    body: isMD ? undefined : content, 
                    markdown: isMD ? processed : undefined,
                    badge: parseInt(badge) || undefined, 
                    group: group || "Crystal",
                    icon: icon || undefined, image: image || undefined,
                    url: url || undefined
                };

                const res = await fetch(`${server}/push`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
                const data = await res.json();
                if (data.code !== 200) throw new Error(data.message);

            } else {
                // 助手模式
                const uid = configField1.value || MP_DEFAULT_USER;
                const ukey = configField2.value || MP_DEFAULT_KEY;
                const params = new URLSearchParams();
                if(title) params.append('title', title);
                if(subtitle) params.append('subtitle', subtitle);
                if(content) params.append('message', content);
                if(icon) params.append('icon', icon);
                if(image) params.append('image', image);
                if(url) params.append('url', url);
                
                // ✨ 修正：仅追加 badge，移除 group
                if(badge) params.append('badge', badge);
                
                const res = await fetch(`${MP_SERVER_BASE}/${uid}/${ukey}?${params.toString()}`);
                if (!res.ok) throw new Error('Network Error');
            }
            
            showStatus('🚀 成功', 'success');
            addToHistory({ title, subtitle, content, image, url, isMD });

        } catch (e) {
            showStatus('🚫 ' + e.message, 'error');
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };

    document.getElementById('settingsBtn').onclick = () => { mainView.classList.add('hidden'); settingsView.classList.remove('hidden'); };
    document.getElementById('backToMain').onclick = () => { settingsView.classList.add('hidden'); mainView.classList.remove('hidden'); };
    document.getElementById('saveBtn').onclick = () => {
        if (currentMode === 'bark') chrome.storage.sync.set({ bark_key: configField1.value, bark_server: configField2.value });
        else chrome.storage.sync.set({ mp_user: configField1.value, mp_key: configField2.value });
        showStatus('✅ 已保存', 'success');
        setTimeout(() => document.getElementById('backToMain').click(), 500);
    };

    loadConfig();
});