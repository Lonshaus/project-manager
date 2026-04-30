# Chrome Extension 儲存方案完整指南

## 1. 三大儲存方案對比

### 方案 A：純 GitHub API（推薦初期使用）

**概念：** 所有 issue 資料都存在 GitHub，Extension 只負責讀取和編輯

```
你的 Extension
     ↓
GitHub API 請求
     ↓
GitHub 伺服器（issues、labels、comments）
```

**優點：**
- ✅ 零建設成本，無需自己的伺服器
- ✅ 資料永遠是最新且安全（GitHub 備份）
- ✅ 可跨瀏覽器同步（GitHub 帳戶同步）
- ✅ 適合個人或小團隊

**缺點：**
- ❌ 需要 GitHub Personal Access Token（洩露有風險）
- ❌ API 有速率限制（60 req/hr 未認證，6000 req/hr 認證）
- ❌ 網路不穩定時無法離線工作
- ❌ 每次查詢都是網路請求，速度較慢

**程式碼示例：**

```javascript
class GitHubAPI {
  constructor(token) {
    this.token = token;
    this.baseURL = 'https://api.github.com';
  }
  async getIssues(owner, repo) {
    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}/issues`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    return response.json();
  }
  async createIssue(owner, repo, title, body, labels) {
    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          title,
          body,
          labels
        })
      }
    );
    return response.json();
  }
  async updateIssue(owner, repo, issueNumber, updates) {
    const response = await fetch(
      `${this.baseURL}/repos/${owner}/${repo}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify(updates)
      }
    );
    return response.json();
  }
}
```

---

### 方案 B：IndexedDB 本地緩存（推薦搭配方案 A）

**概念：** 在瀏覽器本地建立一個「迷你資料庫」，快速查詢，後台定期與 GitHub 同步

```
Extension UI
     ↓
IndexedDB（本地讀寫，快速）
     ↓
後台同步（每 5 分鐘或手動）
     ↓
GitHub API
```

**優點：**
- ✅ UI 超快（直接讀本地資料）
- ✅ 可以離線查看（已緩存的 issue）
- ✅ 減少 API 呼叫，節省配額
- ✅ 支援複雜查詢（過濾、搜尋）

**缺點：**
- ❌ 儲存容量有限（通常 50MB - 1GB）
- ❌ 需要同步邏輯（資料可能過時）
- ❌ 瀏覽器清除快取會刪除資料

**程式碼示例：**

```javascript
class LocalStorage {
  constructor() {
    this.dbName = 'ProjectManagerDB';
    this.version = 1;
    this.db = null;
  }
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('issues')) {
          const issueStore = db.createObjectStore('issues', { keyPath: 'id' });
          issueStore.createIndex('status', 'status', { unique: false });
          issueStore.createIndex('type', 'type', { unique: false });
        }
        if (!db.objectStoreNames.contains('repos')) {
          db.createObjectStore('repos', { keyPath: 'full_name' });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }
  async saveIssue(issue) {
    const tx = this.db.transaction('issues', 'readwrite');
    return new Promise((resolve, reject) => {
      tx.objectStore('issues').put(issue);
      tx.oncomplete = () => resolve(issue);
      tx.onerror = () => reject(tx.error);
    });
  }
  async saveIssues(issues) {
    const tx = this.db.transaction('issues', 'readwrite');
    const store = tx.objectStore('issues');
    store.clear();
    issues.forEach(issue => store.put(issue));
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  async getAllIssues() {
    const tx = this.db.transaction('issues', 'readonly');
    return new Promise((resolve, reject) => {
      const request = tx.objectStore('issues').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async getIssuesByType(type) {
    const tx = this.db.transaction('issues', 'readonly');
    return new Promise((resolve, reject) => {
      const request = tx.objectStore('issues').index('type').getAll(type);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async setLastSync(timestamp) {
    const tx = this.db.transaction('metadata', 'readwrite');
    return new Promise((resolve, reject) => {
      tx.objectStore('metadata').put({ key: 'lastSync', value: timestamp });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  async getLastSync() {
    const tx = this.db.transaction('metadata', 'readonly');
    return new Promise((resolve, reject) => {
      const request = tx.objectStore('metadata').get('lastSync');
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }
}
const storage = new LocalStorage();
await storage.init();
await storage.saveIssue({ id: 1, title: 'Bug fix', type: 'bug', status: 'open' });
const allIssues = await storage.getAllIssues();
const bugs = await storage.getIssuesByType('bug');
```

---

### 方案 C：Firebase/Supabase（複雜專案用）

**概念：** 自己的雲端資料庫，完全掌控，但需要更多設置和成本

```
Extension UI
     ↓
你的後端（Firebase / Supabase）
     ↓
本地 IndexedDB 快取
     ↓
GitHub API（可選同步）
```

**優點：**
- ✅ 完全掌控資料
- ✅ 支援即時同步（多裝置、多使用者）
- ✅ 容量無限制
- ✅ 支援複雜的業務邏輯

**缺點：**
- ❌ 需要學習和維護
- ❌ 有月費（Firebase 免費額度有限）
- ❌ 多一層複雜度
- ❌ 隱私考量（資料存在第三方）

**不推薦初期使用**，除非你有多人協作需求。

---

## 2. 推薦架構：方案 A + 方案 B（按需更新）

```
┌─────────────────────────────────────────┐
│       Chrome Extension UI               │
│  (manager.html + manager.js)            │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼────────┐
        │   IndexedDB     │
        │   本地快取      │
        └────────┬────────┘
                 │
  ┌──────────────┴──────────────┐
  │  觸發更新的時機：          │
  │  • 用戶按「重整」按鈕       │
  │  • 打開管理面板時           │
  │  • 新增/編輯 issue 後       │
  └──────────────┬──────────────┘
                 │
           ┌─────▼─────┐
           │GitHub API │
           └───────────┘
```

---

## 3. 程式碼流程示例（按需更新）

```javascript
class ProjectManager {
  constructor() {
    this.localStorage = new LocalStorage();
    this.github = null;
  }
  async init() {
    await this.localStorage.init();
    const { token } = await chrome.storage.sync.get('githubToken');
    this.github = new GitHubAPI(token);
    await this.renderIssues();
  }
  async renderIssues() {
    const issues = await this.localStorage.getAllIssues();
    this.displayIssues(issues);
  }
  async onRefreshClick() {
    try {
      const issues = await this.github.getIssues('yourname', 'yourrepo');
      await this.localStorage.saveIssues(issues);
      await this.localStorage.setLastSync(Date.now());
      await this.renderIssues();
    } catch (error) {
      console.error('同步失敗:', error);
    }
  }
  async createNewIssue(title, body, type) {
    const issue = await this.github.createIssue('yourname', 'yourrepo', title, body, [type]);
    await this.localStorage.saveIssue(issue);
    await this.renderIssues();
  }
}
```

---

## 4. Token 安全儲存

Chrome Extension 有專用的儲存 API，資料會加密：

```javascript
await chrome.storage.sync.set({
  githubToken: 'ghp_xxxxxxxxxxxx'
});
const { githubToken } = await chrome.storage.sync.get('githubToken');
await chrome.storage.sync.remove('githubToken');
```

**重要：** `chrome.storage.sync` 會同步到登入的 Google 帳戶，資料自動加密。

---

## 5. 儲存容量參考

| 儲存方式 | 容量 | 適用 |
|---------|------|------|
| IndexedDB | 50MB - 1GB | 本地快取✓ |
| localStorage | 5-10MB | 小資料✓ |
| chrome.storage.sync | 100KB | Token 等小資料✓ |
| chrome.storage.local | 10MB | 較大本地資料✓ |
| GitHub | 無限 | 主要資料✓ |

---

## 6. 初期實作步驟

1. **第一步：** 實作方案 A（GitHub API）
   - 驗證 token
   - 測試取得 issues API

2. **第二步：** 實作方案 B（IndexedDB）
   - 建立資料庫模式
   - 測試存/取功能

3. **第三步：** 整合 UI
   - 從本地快取讀取顯示
   - 後台自動同步

4. **第四步：** CRUD 功能
   - 新增、編輯、刪除 issue

---

## 概念總結

- **GitHub API**：你的資料存在 GitHub 的「雲端保險箱」
- **IndexedDB**：瀏覽器的「本地暫存區」，快速讀取
- **按需同步**：只在用戶操作時才與 GitHub 同步（按重整、新增issue、打開面板）
- **Token**：Chrome 的「鑰匙」，加密保存在瀏覽器