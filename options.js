// 擴充功能 Options Page，提供 GitHub Token、owner、repo 與主題的設定介面
const tokenInput = document.getElementById('token');
const ownerInput = document.getElementById('owner');
const repoInput = document.getElementById('repo');
const themeSelect = document.getElementById('theme');
const saveButton = document.getElementById('save');
const message = document.getElementById('message');
// 從 chrome.storage 讀取已儲存的設定並填入表單
async function loadOptions() {
  const { githubToken, owner, repo, theme } = await chrome.storage.sync.get([
    'githubToken',
    'owner',
    'repo',
    'theme'
  ]);
  if (githubToken) {
    tokenInput.value = githubToken;
  }
  if (owner) {
    ownerInput.value = owner;
  }
  if (repo) {
    repoInput.value = repo;
  }
  themeSelect.value = theme || 'system';
}
// 驗證表單並將設定儲存到 chrome.storage
async function saveOptions() {
  const token = tokenInput.value.trim();
  const owner = ownerInput.value.trim();
  const repo = repoInput.value.trim();
  const theme = themeSelect.value;
  if (!token) {
    showMessage('請輸入 token', 'error');
    return;
  }
  if (!owner) {
    showMessage('請輸入 owner', 'error');
    return;
  }
  if (!repo) {
    showMessage('請輸入 repo', 'error');
    return;
  }
  await chrome.storage.sync.set({ githubToken: token, owner, repo, theme });
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  showMessage('設定已保存', 'success');
}
// 顯示成功或錯誤訊息，success 類型會在 3 秒後自動消失
function showMessage(text, type) {
  message.textContent = text;
  message.className = `message ${type}`;
  if (type === 'success') {
    setTimeout(() => {
      message.className = 'message';
    }, 3000);
  }
}
saveButton.addEventListener('click', saveOptions);
tokenInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveOptions();
  }
});
ownerInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveOptions();
  }
});
repoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    saveOptions();
  }
});
loadOptions();