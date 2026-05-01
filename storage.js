// IndexedDB 封裝，管理 issues 與同步時間的本地快取
class LocalStorage {
  constructor() {
    this.dbName = 'ProjectManagerDB';
    this.version = 3;
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
        if (event.oldVersion < 3) {
          const draftsStore = db.createObjectStore('drafts', { keyPath: 'key' });
          draftsStore.createIndex('projectId', 'projectId', { unique: false });
        }
      };
    });
  }
  // 儲存 draft（key 為 projectId_issueNumber，整體 upsert）
  async saveDraft(projectId, issueNumber, draft) {
    const key = `${projectId}_${issueNumber}`;
    const tx = this.db.transaction('drafts', 'readwrite');
    return new Promise((resolve, reject) => {
      tx.objectStore('drafts').put({ ...draft, key, projectId, issueNumber, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  // 取得單一 draft
  async getDraft(projectId, issueNumber) {
    const key = `${projectId}_${issueNumber}`;
    const tx = this.db.transaction('drafts', 'readonly');
    return new Promise((resolve, reject) => {
      const req = tx.objectStore('drafts').get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }
  // 刪除單一 draft
  async deleteDraft(projectId, issueNumber) {
    const key = `${projectId}_${issueNumber}`;
    const tx = this.db.transaction('drafts', 'readwrite');
    return new Promise((resolve, reject) => {
      tx.objectStore('drafts').delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  // 取得指定專案的所有 drafts
  async getDraftsByProject(projectId) {
    const tx = this.db.transaction('drafts', 'readonly');
    return new Promise((resolve, reject) => {
      const req = tx.objectStore('drafts').index('projectId').getAll(projectId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }
  // 從 issue 物件解析 status / urgency / branchName / cancelled / linkedPRs：
  // - status:* 只接受 todo / process / review（done 已改由 state 判定）
  // - cancelled = 是否帶 `cancel` label（決定 closed issue 屬於 Done 還是 Cancel 欄）
  // - branchName 從 body 隱藏 pm-meta 註解解析（legacy）
  // - linkedPRs 從 pm-meta 解析手動連結的 PR 編號陣列
  static parseIssueMetadata(issue) {
    let status = null;
    let urgency = null;
    let branchName = null;
    let cancelled = false;
    let linkedPRs = [];
    const validStatus = new Set(['todo', 'process', 'review']);
    const urgencyMap = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
    for (const label of (issue.labels || [])) {
      const name = typeof label === 'string' ? label : label.name;
      if (name.startsWith('status:')) {
        const s = name.slice(7);
        if (validStatus.has(s)) {
          status = s;
        }
      } else if (name.startsWith('priority:')) {
        urgency = urgencyMap[name.slice(9)] || null;
      } else if (name === 'cancel') {
        cancelled = true;
      }
    }
    if (issue.body) {
      const m = issue.body.match(/<!--\s*pm-meta:\s*({[^]*?})\s*-->/);
      if (m) {
        try {
          const meta = JSON.parse(m[1]);
          if (meta.branch) {
            branchName = meta.branch;
          }
          if (Array.isArray(meta.linkedPRs)) {
            linkedPRs = meta.linkedPRs.filter(n => Number.isInteger(n));
          }
        } catch (e) {
          // metadata 解析失敗就忽略
        }
      }
    }
    return { status, urgency, branchName, cancelled, linkedPRs };
  }
  // 用 GitHub 最新資料覆寫指定專案的所有 issues，並從 labels / body 解析元資料
  async saveProjectIssues(projectId, issues) {
    const existing = await this.getIssuesByProject(projectId);
    const tx = this.db.transaction('issues', 'readwrite');
    const store = tx.objectStore('issues');
    existing.forEach(issue => store.delete(issue.id));
    issues.forEach(issue => {
      const parsed = LocalStorage.parseIssueMetadata(issue);
      const merged = {
        branchName: parsed.branchName || null,
        status: parsed.status || null,
        urgency: parsed.urgency || null,
        cancelled: parsed.cancelled,
        linkedPRs: parsed.linkedPRs
      };
      // issue.id 只在單一 repo 內唯一，加上 projectId 避免跨 repo 碰撞
      store.put({ ...issue, id: `${projectId}_${issue.id}`, projectId, ...merged });
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