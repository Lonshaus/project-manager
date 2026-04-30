// IndexedDB 封裝，管理 issues 與同步時間的本地快取
class LocalStorage {
  constructor() {
    this.dbName = 'ProjectManagerDB';
    this.version = 2;
    this.db = null;
  }
  // 初始化 IndexedDB，建立 schema（含版本升級 migration）
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
        if (event.oldVersion < 1) {
          const issueStore = db.createObjectStore('issues', { keyPath: 'id' });
          issueStore.createIndex('type', 'type', { unique: false });
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
        if (event.oldVersion < 2) {
          const issueStore = event.target.transaction.objectStore('issues');
          if (!issueStore.indexNames.contains('projectId')) {
            issueStore.createIndex('projectId', 'projectId', { unique: false });
          }
        }
      };
    });
  }
  // 用 GitHub 最新資料覆寫指定專案的所有 issues，保留 local-only 欄位
  async saveProjectIssues(projectId, issues) {
    const existing = await this.getIssuesByProject(projectId);
    // branchName/status 是 local-only 欄位，GitHub API 不知道，sync 時必須手動保留
    const localMap = new Map(existing.map(e => [e.number, { branchName: e.branchName || null, status: e.status || null }]));
    const tx = this.db.transaction('issues', 'readwrite');
    const store = tx.objectStore('issues');
    existing.forEach(issue => store.delete(issue.id));
    issues.forEach(issue => {
      const local = localMap.get(issue.number) || {};
      // issue.id 只在單一 repo 內唯一，加上 projectId 避免跨 repo 碰撞
      store.put({ ...issue, id: `${projectId}_${issue.id}`, projectId, ...local });
    });
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  // 部分更新 IndexedDB 中單一 issue 的指定欄位
  async patchIssue(id, fields) {
    const tx = this.db.transaction('issues', 'readwrite');
    const store = tx.objectStore('issues');
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) {
          store.put({ ...req.result, ...fields });
        }
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }
  // 取得指定專案的所有本地快取 issues
  async getIssuesByProject(projectId) {
    const tx = this.db.transaction('issues', 'readonly');
    return new Promise((resolve, reject) => {
      const request = tx.objectStore('issues').index('projectId').getAll(projectId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  // 從 IndexedDB 刪除單一 issue
  async deleteIssue(id) {
    const tx = this.db.transaction('issues', 'readwrite');
    return new Promise((resolve, reject) => {
      tx.objectStore('issues').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  // 新增或覆寫單一 issue（upsert）
  async saveIssue(issue) {
    const tx = this.db.transaction('issues', 'readwrite');
    return new Promise((resolve, reject) => {
      tx.objectStore('issues').put(issue);
      tx.oncomplete = () => resolve(issue);
      tx.onerror = () => reject(tx.error);
    });
  }
  // 記錄指定專案的最後 GitHub 同步時間
  async setLastSync(projectId, timestamp) {
    const tx = this.db.transaction('metadata', 'readwrite');
    return new Promise((resolve, reject) => {
      tx.objectStore('metadata').put({ key: `lastSync_${projectId}`, value: timestamp });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  // 取得指定專案的最後 GitHub 同步時間
  async getLastSync(projectId) {
    const tx = this.db.transaction('metadata', 'readonly');
    return new Promise((resolve, reject) => {
      const request = tx.objectStore('metadata').get(`lastSync_${projectId}`);
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }
}