// 管理介面內的設定側面板邏輯（GitHub Username、Token、主題切換）
class SettingsPanel {
  constructor() {
    this.setupEventListeners();
  }
  // 綁定設定面板的所有事件
  setupEventListeners() {
    document.getElementById('settings-btn').addEventListener('click', () => this.open());
    document.getElementById('close-settings-btn').addEventListener('click', () => this.close());
    document.getElementById('settings-overlay').addEventListener('click', () => this.close());
    document.getElementById('save-account-btn').addEventListener('click', () => this.saveAccount());
    document.getElementById('settings-theme').addEventListener('change', (e) => this.saveTheme(e.target.value));
  }
  // 開啟設定面板並填入現有設定
  async open() {
    const { githubToken, owner, theme } = await chrome.storage.sync.get(['githubToken', 'owner', 'theme']);
    document.getElementById('settings-owner').value = owner || '';
    document.getElementById('settings-token').value = githubToken || '';
    document.getElementById('settings-theme').value = theme || 'system';
    document.getElementById('settings-panel').classList.add('open');
    document.getElementById('settings-overlay').classList.add('open');
  }
  // 關閉設定面板
  close() {
    document.getElementById('settings-panel').classList.remove('open');
    document.getElementById('settings-overlay').classList.remove('open');
  }
  // 儲存 GitHub Username 與 Token 到 chrome.storage
  async saveAccount() {
    const owner = document.getElementById('settings-owner').value.trim();
    const token = document.getElementById('settings-token').value.trim();
    if (!owner || !token) {
      return;
    }
    await chrome.storage.sync.set({ owner, githubToken: token });
    this.showTokenMessage('帳戶設定已保存');
  }
  // 顯示帳戶儲存成功的短暫提示
  showTokenMessage(text) {
    const el = document.getElementById('token-message');
    el.textContent = text;
    el.style.display = 'block';
    setTimeout(() => {
      el.style.display = 'none';
    }, 2500);
  }
  // 儲存主題設定並立即套用到 document
  async saveTheme(theme) {
    await chrome.storage.sync.set({ theme });
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
}