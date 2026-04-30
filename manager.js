// 主介面邏輯，管理專案與 issues 的顯示、建立、同步等操作
class ProjectManager {
  constructor() {
    this.storage = new LocalStorage();
    this.github = null;
    this.projects = [];
    this.activeProjectId = null;
    this.owner = null;
  }
  // 初始化 app，載入設定並渲染頁面
  async init() {
    await this.storage.init();
    new SettingsPanel();
    this.setupEventListeners();
    await this.reload();
    if (new URLSearchParams(window.location.search).get('settings') === 'open') {
      document.getElementById('settings-btn').click();
    }
  }
  // 綁定所有 DOM 事件
  setupEventListeners() {
    document.getElementById('refresh-btn').addEventListener('click', () => this.onRefreshClick());
    document.getElementById('project-dropdown-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });
    document.addEventListener('click', () => this.closeDropdown());
    document.getElementById('add-issue-btn').addEventListener('click', () => this.openAddIssueModal());
    document.getElementById('close-add-issue-btn').addEventListener('click', () => this.closeAddIssueModal());
    document.getElementById('cancel-add-issue-btn').addEventListener('click', () => this.closeAddIssueModal());
    document.getElementById('confirm-add-issue-btn').addEventListener('click', () => this.confirmAddIssue());
    document.getElementById('add-issue-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeAddIssueModal();
      }
    });
    document.getElementById('close-add-project-btn').addEventListener('click', () => this.closeAddProjectModal());
    document.getElementById('cancel-add-project-btn').addEventListener('click', () => this.closeAddProjectModal());
    document.getElementById('confirm-add-project-btn').addEventListener('click', () => this.confirmAddProject());
    document.getElementById('add-project-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeAddProjectModal();
      }
    });
    document.getElementById('close-remove-project-btn').addEventListener('click', () => this.closeRemoveProjectModal());
    document.getElementById('cancel-remove-project-btn').addEventListener('click', () => this.closeRemoveProjectModal());
    document.getElementById('confirm-remove-project-btn').addEventListener('click', () => this.confirmRemoveProject());
    document.getElementById('remove-confirm-input').addEventListener('input', (e) => this.onRemoveConfirmInput(e.target.value));
    document.getElementById('remove-project-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeRemoveProjectModal();
      }
    });
    document.getElementById('close-issue-detail-btn').addEventListener('click', () => this.closeIssueDetail());
    document.getElementById('issue-detail-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeIssueDetail();
      }
    });
    document.getElementById('issue-detail-toggle-btn').addEventListener('click', () => this.toggleIssueState());
    document.getElementById('issue-detail-delete-btn').addEventListener('click', () => this.openDeleteIssueModal());
    document.getElementById('issue-comment-submit-btn').addEventListener('click', () => this.submitComment());
    document.getElementById('issue-status-select').addEventListener('change', (e) => this.updateLocalStatus(e.target.value));
    document.getElementById('copy-branch-btn').addEventListener('click', () => this.copyBranchName());
    document.getElementById('close-delete-issue-btn').addEventListener('click', () => this.closeDeleteIssueModal());
    document.getElementById('cancel-delete-issue-btn').addEventListener('click', () => this.closeDeleteIssueModal());
    document.getElementById('confirm-delete-issue-btn').addEventListener('click', () => this.confirmDeleteIssue());
    document.getElementById('delete-issue-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeDeleteIssueModal();
      }
    });
    document.getElementById('close-init-issue-btn').addEventListener('click', () => this.closeInitIssueModal());
    document.getElementById('cancel-init-issue-btn').addEventListener('click', () => this.closeInitIssueModal());
    document.getElementById('confirm-init-issue-btn').addEventListener('click', () => this.confirmInitIssue());
    document.getElementById('init-issue-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeInitIssueModal();
      }
    });
  }
  // 從 chrome.storage 重新讀取設定並重新渲染頁面
  async reload() {
    const { githubToken, owner, projects, activeProjectId } = await chrome.storage.sync.get([
      'githubToken',
      'owner',
      'projects',
      'activeProjectId'
    ]);
    this.projects = projects || [];
    this.activeProjectId = activeProjectId || this.projects[0]?.id || null;
    this.owner = owner || null;
    this.github = githubToken ? new GitHubAPI(githubToken) : null;
    this.renderDropdown();
    document.getElementById('message').className = 'message';
    document.getElementById('add-issue-btn').style.display = this.projects.length > 0 ? '' : 'none';
    if (!githubToken) {
      this.showMessage('請先在設定中輸入 GitHub Token', 'error');
      this.showEmptyState('尚未設定 GitHub Token，請點右上角「設定」');
      return;
    }
    if (this.projects.length === 0) {
      this.showEmptyState('還沒有任何專案，點擊下拉選單新增');
      return;
    }
    await this.renderIssues();
  }
  // 重新渲染專案選擇下拉選單
  renderDropdown() {
    const label = document.getElementById('project-dropdown-label');
    const menu = document.getElementById('project-dropdown-menu');
    const active = this.projects.find(p => p.id === this.activeProjectId);
    label.textContent = active ? active.name : '選擇專案';
    const projectItems = this.projects.map(p => {
      const item = document.createElement('div');
      item.className = `dropdown-item${p.id === this.activeProjectId ? ' active' : ''}`;
      item.textContent = p.name;
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectProject(p.id);
      });
      return item.outerHTML;
    }).join('');
    const divider = this.projects.length > 0 ? '<div class="dropdown-divider"></div>' : '';
    const removeItem = this.activeProjectId
      ? `<div class="dropdown-item remove-item" id="dropdown-remove-item">移除此專案</div>`
      : '';
    menu.innerHTML = projectItems + divider +
      `<div class="dropdown-item add-item" id="dropdown-add-item">＋ 新增專案</div>` +
      removeItem;
    menu.querySelector('#dropdown-add-item').addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeDropdown();
      this.openAddProjectModal();
    });
    const removeEl = menu.querySelector('#dropdown-remove-item');
    if (removeEl) {
      removeEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeDropdown();
        this.openRemoveProjectModal();
      });
    }
    menu.querySelectorAll('.dropdown-item:not(.add-item):not(.remove-item)').forEach((el, i) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectProject(this.projects[i].id);
      });
    });
  }
  // 切換下拉選單開關
  toggleDropdown() {
    document.getElementById('project-dropdown-menu').classList.toggle('open');
  }
  // 關閉下拉選單
  closeDropdown() {
    document.getElementById('project-dropdown-menu').classList.remove('open');
  }
  // 切換目前使用的專案
  async selectProject(projectId) {
    this.activeProjectId = projectId;
    await chrome.storage.sync.set({ activeProjectId: projectId });
    this.closeDropdown();
    this.renderDropdown();
    await this.renderIssues();
  }
  // 開啟新增專案 modal
  openAddProjectModal() {
    document.getElementById('modal-project-name').value = '';
    document.getElementById('modal-project-repo').value = '';
    document.getElementById('add-project-modal').classList.add('open');
    document.getElementById('modal-project-name').focus();
  }
  // 關閉新增專案 modal
  closeAddProjectModal() {
    document.getElementById('add-project-modal').classList.remove('open');
  }
  // 儲存新專案並執行初始化流程
  async confirmAddProject() {
    const name = document.getElementById('modal-project-name').value.trim();
    const repo = document.getElementById('modal-project-repo').value.trim();
    if (!name || !repo) {
      return;
    }
    // 直接從 storage 讀取，避免設定面板儲存後 this.owner 尚未更新的問題
    const { owner } = await chrome.storage.sync.get('owner');
    if (!owner) {
      this.showMessage('請先在設定中填寫 GitHub Username', 'error');
      return;
    }
    this.owner = owner;
    const newProject = { id: `proj_${Date.now()}`, name, owner, repo };
    this.projects.push(newProject);
    this.activeProjectId = newProject.id;
    await chrome.storage.sync.set({ projects: this.projects, activeProjectId: this.activeProjectId });
    this.closeAddProjectModal();
    if (!this.github) {
      await this.reload();
      return;
    }
    await this.initializeProject(newProject);
  }
  // 新增專案後自動建立 init issue（視 repo 是否為空決定行為）
  async initializeProject(project) {
    let isEmpty = false;
    try {
      isEmpty = await this.github.isRepoEmpty(project.owner, project.repo);
    } catch (e) {
      await this.reload();
      return;
    }
    if (!isEmpty) {
      try {
        await this.github.createLabel(project.owner, project.repo, 'init', '6f42c1');
        const issue = await this.github.createIssue(
          project.owner, project.repo,
          '專案初始化',
          '此專案的初始化 issue，自動建立。',
          ['init']
        );
        await this.github.updateIssue(project.owner, project.repo, issue.number, { state: 'closed' });
        await this.storage.saveIssue({
          ...issue,
          state: 'closed',
          id: `${project.id}_${issue.id}`,
          projectId: project.id,
          branchName: null,
          status: 'done'
        });
      } catch (e) {
        this.showMessage('初始化 issue 建立失敗: ' + e.message, 'error');
      }
      await this.reload();
    } else {
      this._initProject = project;
      // 先 reload 讓專案出現在 dropdown，再開 modal
      await this.reload();
      this.openInitIssueModal();
    }
  }
  // 開啟空 repo 的手動初始化 issue modal
  openInitIssueModal() {
    document.getElementById('init-issue-title').value = '';
    document.getElementById('init-issue-body').value = '';
    document.getElementById('init-issue-modal').classList.add('open');
    document.getElementById('init-issue-title').focus();
  }
  // 關閉初始化 issue modal
  closeInitIssueModal() {
    document.getElementById('init-issue-modal').classList.remove('open');
  }
  // 建立初始化 issue 並儲存 init branch 名稱
  async confirmInitIssue() {
    const title = document.getElementById('init-issue-title').value.trim();
    const body = document.getElementById('init-issue-body').value.trim();
    if (!title) {
      return;
    }
    const project = this._initProject;
    if (!project || !this.github) {
      return;
    }
    const btn = document.getElementById('confirm-init-issue-btn');
    btn.disabled = true;
    btn.textContent = '建立中...';
    try {
      await this.github.createLabel(project.owner, project.repo, 'init', '6f42c1');
      const issue = await this.github.createIssue(project.owner, project.repo, title, body, ['init']);
      const randomNum = Math.floor(Math.random() * 9000) + 1000;
      const branchName = `init-${randomNum}`;
      try {
        const { sha } = await this.github.getDefaultBranchSHA(project.owner, project.repo);
        await this.github.createBranch(project.owner, project.repo, branchName, sha);
      } catch (branchErr) {
        // 空 repo 無 commit，無法建立 branch ref；名稱已存好，等第一次 push 後 branch 名稱對齊即可
      }
      await this.storage.saveIssue({
        ...issue,
        id: `${project.id}_${issue.id}`,
        projectId: project.id,
        branchName,
        status: 'todo'
      });
      this.closeInitIssueModal();
      this._initProject = null;
      await this.renderIssues();
    } catch (error) {
      this.showMessage('建立初始化 issue 失敗: ' + error.message, 'error');
    }
    btn.disabled = false;
    btn.textContent = '建立 Issue';
  }
  // 開啟移除專案確認 modal
  openRemoveProjectModal() {
    const project = this.projects.find(p => p.id === this.activeProjectId);
    if (!project) {
      return;
    }
    document.getElementById('remove-project-name-hint').textContent = `「${project.name}」`;
    document.getElementById('remove-confirm-input').value = '';
    document.getElementById('confirm-remove-project-btn').disabled = true;
    document.getElementById('remove-project-modal').classList.add('open');
    document.getElementById('remove-confirm-input').focus();
  }
  // 關閉移除專案 modal
  closeRemoveProjectModal() {
    document.getElementById('remove-project-modal').classList.remove('open');
  }
  // 驗證輸入的專案名稱是否正確，控制確認按鈕的啟用狀態
  onRemoveConfirmInput(value) {
    const project = this.projects.find(p => p.id === this.activeProjectId);
    document.getElementById('confirm-remove-project-btn').disabled = value !== project?.name;
  }
  // 從清單移除目前專案
  async confirmRemoveProject() {
    if (!this.activeProjectId) {
      return;
    }
    this.projects = this.projects.filter(p => p.id !== this.activeProjectId);
    this.activeProjectId = this.projects[0]?.id || null;
    await chrome.storage.sync.set({ projects: this.projects, activeProjectId: this.activeProjectId });
    this.closeRemoveProjectModal();
    await this.reload();
  }
  // 開啟新增 issue modal
  openAddIssueModal() {
    document.getElementById('issue-title').value = '';
    document.getElementById('issue-type').value = 'bug';
    document.getElementById('issue-body').value = '';
    document.getElementById('add-issue-modal').classList.add('open');
    document.getElementById('issue-title').focus();
  }
  // 關閉新增 issue modal
  closeAddIssueModal() {
    document.getElementById('add-issue-modal').classList.remove('open');
  }
  // 建立 issue 並在 GitHub 建立對應 branch
  async confirmAddIssue() {
    const title = document.getElementById('issue-title').value.trim();
    const type = document.getElementById('issue-type').value;
    const body = document.getElementById('issue-body').value.trim();
    if (!title) {
      return;
    }
    const project = this.projects.find(p => p.id === this.activeProjectId);
    if (!project || !this.github) {
      return;
    }
    const btn = document.getElementById('confirm-add-issue-btn');
    btn.disabled = true;
    btn.textContent = '建立中...';
    try {
      const issue = await this.github.createIssue(project.owner, project.repo, title, body, [type]);
      let branchName = null;
      const randomNum = Math.floor(Math.random() * 9000) + 1000;
      const tentativeBranch = `${type}-${randomNum}`;
      try {
        const { sha } = await this.github.getDefaultBranchSHA(project.owner, project.repo);
        await this.github.createBranch(project.owner, project.repo, tentativeBranch, sha);
        branchName = tentativeBranch;
      } catch (branchErr) {
        this.showMessage(`Issue 已建立，但 branch 建立失敗: ${branchErr.message}`, 'error');
      }
      await this.storage.saveIssue({
        ...issue,
        id: `${this.activeProjectId}_${issue.id}`,
        projectId: this.activeProjectId,
        branchName,
        status: branchName ? 'todo' : null
      });
      this.closeAddIssueModal();
      await this.renderIssues();
    } catch (error) {
      this.showMessage('建立 issue 失敗: ' + error.message, 'error');
    }
    btn.disabled = false;
    btn.textContent = '建立 Issue';
  }
  // 回傳 null 表示找不到對應 PR，呼叫方應保留使用者手動設定的狀態，不應覆寫
  computeIssueStatus(branchName, prs) {
    if (!branchName) {
      return null;
    }
    const pr = prs.find(p => p.head.ref === branchName);
    if (!pr) {
      return null;
    }
    if (pr.merged_at) {
      return 'done';
    }
    if (pr.state === 'open' && pr.draft) {
      return 'process';
    }
    if (pr.state === 'open') {
      return 'review';
    }
    return null;
  }
  // 將 status key 轉換為顯示文字與 CSS class（回傳 [label, cssClass]）
  statusDisplay(status) {
    const map = {
      todo: ['Todo', 'todo'],
      process: ['In Progress', 'process'],
      review: ['Review', 'review'],
      done: ['Done', 'done']
    };
    return map[status] || null;
  }
  // 在 issues-container 顯示空狀態提示
  showEmptyState(message) {
    document.getElementById('issues-container').innerHTML =
      `<div class="empty-state">${message}</div>`;
  }
  // 將本地快取的 issues 渲染為分欄 grid
  async renderIssues() {
    const container = document.getElementById('issues-container');
    if (!this.activeProjectId) {
      this.showEmptyState('請先選擇或新增專案');
      return;
    }
    try {
      const issues = await this.storage.getIssuesByProject(this.activeProjectId);
      if (issues.length === 0) {
        this.showEmptyState('暫無 issues，點擊「重整」來同步，或點「＋ 新增 Issue」');
        return;
      }
      const columns = [
        { key: 'init', label: 'Init' },
        { key: 'bug', label: 'Bug' },
        { key: 'feature', label: 'Feature' }
      ];
      const grouped = { init: [], bug: [], feature: [], other: [] };
      issues.forEach(issue => {
        const labelNames = issue.labels.map(l => l.name);
        const matched = columns.find(c => labelNames.includes(c.key));
        grouped[matched ? matched.key : 'other'].push(issue);
      });
      const hasOther = grouped.other.length > 0;
      const allColumns = hasOther ? [...columns, { key: 'other', label: '其他' }] : columns;
      container.innerHTML = `<div class="issues-grid">` +
        allColumns.map(col => `<div class="issues-column">
          <div class="issues-column-header">
            <span>${col.label}</span>
            <span class="issues-column-count">${grouped[col.key].length}</span>
          </div>
          <div>${grouped[col.key].length === 0
            ? '<div class="issues-column-empty">無</div>'
            : grouped[col.key].map(issue => this.createIssueElement(issue)).join('')
          }</div>
        </div>`).join('') +
        `</div>`;
      container.querySelectorAll('.issue-item').forEach(el => {
        el.addEventListener('click', () => this.openIssueDetail(Number(el.dataset.issueNumber)));
      });
    } catch (error) {
      this.showMessage('載入 issues 失敗: ' + error.message, 'error');
    }
  }
  // 產生單一 issue 卡片的 HTML 字串
  createIssueElement(issue) {
    const sd = issue.status ? this.statusDisplay(issue.status) : null;
    const badge = sd
      ? `<span class="status-badge status-${sd[1]}">${sd[0]}</span>`
      : `<span style="font-size: 11px; color: var(--text-muted);">${issue.state === 'open' ? '開啟' : '關閉'}</span>`;
    return `<div class="issue-item" data-issue-number="${issue.number}">
      <div class="issue-title">#${issue.number} ${issue.title}</div>
      <div class="issue-meta">${badge}</div>
    </div>`;
  }
  // 開啟 issue 詳情 modal，同步從 GitHub 讀取最新資料並與本地快取合併
  async openIssueDetail(issueNumber) {
    const project = this.projects.find(p => p.id === this.activeProjectId);
    if (!project || !this.github) {
      return;
    }
    this._detailIssueNumber = issueNumber;
    this._detailProject = project;
    this._detailIssue = null;
    document.getElementById('issue-detail-title').textContent = '載入中...';
    document.getElementById('issue-detail-meta').innerHTML = '';
    document.getElementById('issue-detail-body').textContent = '';
    document.getElementById('issue-detail-comments').innerHTML = '';
    document.getElementById('issue-comment-input').value = '';
    document.getElementById('issue-branch-display').textContent = '';
    document.getElementById('issue-detail-modal').classList.add('open');
    try {
      const cached = await this.storage.getIssuesByProject(this.activeProjectId);
      const cachedIssue = cached.find(i => i.number === issueNumber);
      const [issue, comments] = await Promise.all([
        this.github.getIssue(project.owner, project.repo, issueNumber),
        this.github.getIssueComments(project.owner, project.repo, issueNumber)
      ]);
      const merged = {
        ...issue,
        branchName: cachedIssue?.branchName || null,
        status: cachedIssue?.status || null,
        id: cachedIssue?.id || issue.id
      };
      this._detailIssue = merged;
      this.renderIssueDetail(merged, comments);
    } catch (error) {
      document.getElementById('issue-detail-title').textContent = '載入失敗: ' + error.message;
    }
  }
  // 將 issue 資料與留言填入詳情 modal
  renderIssueDetail(issue, comments) {
    const labels = issue.labels.map(l => `<span class="issue-label">${l.name}</span>`).join('');
    const state = issue.state === 'open' ? '開啟' : '關閉';
    document.getElementById('issue-detail-title').textContent = `#${issue.number} ${issue.title}`;
    document.getElementById('issue-detail-meta').innerHTML =
      `${labels}<span style="font-size: 12px; color: var(--text-secondary);">狀態: ${state}</span>`;
    document.getElementById('issue-detail-toggle-btn').textContent =
      issue.state === 'open' ? '關閉 Issue' : '重新開啟';
    const statusSelect = document.getElementById('issue-status-select');
    statusSelect.value = issue.status || 'todo';
    statusSelect.style.display = issue.branchName ? '' : 'none';
    statusSelect.previousElementSibling.style.display = issue.branchName ? '' : 'none';
    document.getElementById('issue-branch-display').textContent = issue.branchName || '';
    document.getElementById('copy-branch-btn').style.display = issue.branchName ? '' : 'none';
    document.getElementById('issue-detail-body').textContent = issue.body || '（無說明）';
    const commentsEl = document.getElementById('issue-detail-comments');
    if (comments.length === 0) {
      commentsEl.innerHTML = '<div style="font-size: 13px; color: var(--text-muted);">尚無留言</div>';
    } else {
      commentsEl.innerHTML = comments.map(c => {
        const date = new Date(c.created_at).toLocaleString('zh-TW');
        return `<div class="comment-item">
          <div class="comment-meta">${c.user.login} · ${date}</div>
          <div class="comment-body">${c.body}</div>
        </div>`;
      }).join('');
    }
  }
  // 複製 branch 名稱到剪貼簿，並短暫顯示「已複製」回饋
  async copyBranchName() {
    const name = document.getElementById('issue-branch-display').textContent;
    if (!name) {
      return;
    }
    await navigator.clipboard.writeText(name);
    const btn = document.getElementById('copy-branch-btn');
    btn.textContent = '已複製';
    setTimeout(() => {
      btn.textContent = '複製';
    }, 1500);
  }
  // 關閉 issue 詳情 modal 並清空暫存狀態
  closeIssueDetail() {
    document.getElementById('issue-detail-modal').classList.remove('open');
    this._detailIssue = null;
    this._detailIssueNumber = null;
    this._detailProject = null;
  }
  // 更新 issue 本地進度並重新渲染列表
  async updateLocalStatus(newStatus) {
    if (!this._detailIssue) {
      return;
    }
    this._detailIssue.status = newStatus;
    await this.storage.patchIssue(this._detailIssue.id, { status: newStatus });
    await this.renderIssues();
  }
  // 在 GitHub 切換 issue 的開啟/關閉狀態
  async toggleIssueState() {
    if (!this._detailIssue || !this._detailProject || !this.github) {
      return;
    }
    const btn = document.getElementById('issue-detail-toggle-btn');
    btn.disabled = true;
    const newState = this._detailIssue.state === 'open' ? 'closed' : 'open';
    try {
      const updated = await this.github.updateIssue(
        this._detailProject.owner, this._detailProject.repo,
        this._detailIssueNumber, { state: newState }
      );
      const issues = await this.github.getIssues(this._detailProject.owner, this._detailProject.repo);
      await this.storage.saveProjectIssues(this.activeProjectId, issues);
      const merged = {
        ...updated,
        branchName: this._detailIssue.branchName,
        status: this._detailIssue.status,
        id: this._detailIssue.id
      };
      this._detailIssue = merged;
      const comments = await this.github.getIssueComments(
        this._detailProject.owner, this._detailProject.repo, this._detailIssueNumber
      );
      this.renderIssueDetail(merged, comments);
      await this.renderIssues();
    } catch (error) {
      this.showMessage('操作失敗: ' + error.message, 'error');
    }
    btn.disabled = false;
  }
  // 開啟刪除 issue 確認 modal
  openDeleteIssueModal() {
    if (!this._detailIssue) {
      return;
    }
    document.getElementById('delete-issue-name-hint').textContent =
      `#${this._detailIssue.number} ${this._detailIssue.title}`;
    document.getElementById('delete-issue-modal').classList.add('open');
  }
  // 關閉刪除 issue modal
  closeDeleteIssueModal() {
    document.getElementById('delete-issue-modal').classList.remove('open');
  }
  // 從 GitHub 和本地永久刪除 issue
  async confirmDeleteIssue() {
    if (!this._detailIssue || !this._detailProject || !this.github) {
      return;
    }
    const btn = document.getElementById('confirm-delete-issue-btn');
    btn.disabled = true;
    btn.textContent = '刪除中...';
    try {
      await this.github.deleteIssue(this._detailIssue.node_id);
      await this.storage.deleteIssue(this._detailIssue.id);
      this.closeDeleteIssueModal();
      this.closeIssueDetail();
      await this.renderIssues();
    } catch (error) {
      this.showMessage('刪除失敗: ' + error.message, 'error');
      btn.disabled = false;
      btn.textContent = '確認刪除';
    }
  }
  // 送出留言到 GitHub 並更新顯示
  async submitComment() {
    const body = document.getElementById('issue-comment-input').value.trim();
    if (!body || !this._detailIssueNumber || !this._detailProject || !this.github) {
      return;
    }
    const btn = document.getElementById('issue-comment-submit-btn');
    btn.disabled = true;
    btn.textContent = '送出中...';
    try {
      await this.github.addComment(
        this._detailProject.owner, this._detailProject.repo,
        this._detailIssueNumber, body
      );
      document.getElementById('issue-comment-input').value = '';
      const comments = await this.github.getIssueComments(
        this._detailProject.owner, this._detailProject.repo, this._detailIssueNumber
      );
      this.renderIssueDetail(this._detailIssue, comments);
    } catch (error) {
      this.showMessage('留言失敗: ' + error.message, 'error');
    }
    btn.disabled = false;
    btn.textContent = '送出留言';
  }
  // 從 GitHub 同步最新 issues，並依 PR 狀態自動更新進度
  async onRefreshClick() {
    if (!this.github || !this.activeProjectId) {
      return;
    }
    const project = this.projects.find(p => p.id === this.activeProjectId);
    if (!project) {
      return;
    }
    const btn = document.getElementById('refresh-btn');
    btn.disabled = true;
    btn.textContent = '同步中...';
    try {
      const [issues, prs] = await Promise.all([
        this.github.getIssues(project.owner, project.repo),
        this.github.getPullRequests(project.owner, project.repo)
      ]);
      await this.storage.saveProjectIssues(this.activeProjectId, issues);
      const cached = await this.storage.getIssuesByProject(this.activeProjectId);
      for (const ci of cached) {
        if (!ci.branchName) {
          continue;
        }
        const autoStatus = this.computeIssueStatus(ci.branchName, prs);
        if (autoStatus !== null) {
          await this.storage.patchIssue(ci.id, { status: autoStatus });
        }
      }
      await this.storage.setLastSync(this.activeProjectId, Date.now());
      await this.renderIssues();
    } catch (error) {
      this.showMessage('同步失敗: ' + error.message, 'error');
    }
    btn.textContent = '重整';
    btn.disabled = false;
  }
  // 在頁首顯示錯誤或一般訊息提示
  showMessage(text, type) {
    const el = document.getElementById('message');
    el.textContent = text;
    el.className = `message ${type}`;
  }
}
const manager = new ProjectManager();
manager.init();