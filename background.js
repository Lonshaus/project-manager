// Service Worker，監聽擴充功能圖示點擊並開啟管理介面
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('manager.html') });
});