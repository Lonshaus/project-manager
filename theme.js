// 頁面載入時從 chrome.storage 讀取並立即套用主題設定

// 套用儲存的主題到 document root
async function applyTheme() {
  const { theme } = await chrome.storage.sync.get('theme');
  if (theme && theme !== 'system') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
applyTheme();