// 擴充功能 popup 視窗的按鈕互動（manifest 已移除 popup，此檔案目前未使用）
const openManagerBtn = document.getElementById('open-manager');
const openSettingsLink = document.getElementById('open-settings');
openManagerBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('manager.html') });
  window.close();
});
openSettingsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
  window.close();
});