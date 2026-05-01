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
    await loadUserLocale();
    applyI18nToDOM();
    this.configureMarkdown();
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
    document.addEventListener('click', () => {
      this.closeDropdown();
      this.closeStatusDropdown();
      this.closeUrgencyDropdown();
    });
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
    document.getElementById('close-issue-detail-btn').addEventListener('click', () => this.commitDraftAndClose());
    document.getElementById('issue-detail-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.saveDraftAndClose();
      }
    });
    document.getElementById('issue-detail-toggle-btn').addEventListener('click', () => this.toggleIssueState());
    document.getElementById('issue-detail-delete-btn').addEventListener('click', () => this.openDeleteIssueModal());
    document.getElementById('issue-comment-submit-btn').addEventListener('click', () => this.submitComment());
    document.getElementById('close-delete-issue-btn').addEventListener('click', () => this.closeDeleteIssueModal());
    document.getElementById('cancel-delete-issue-btn').addEventListener('click', () => this.closeDeleteIssueModal());
    document.getElementById('confirm-delete-issue-btn').addEventListener('click', () => this.confirmDeleteIssue());
    document.getElementById('delete-issue-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeDeleteIssueModal();
      }
    });
    document.getElementById('issue-title-edit-btn').addEventListener('click', () => this.enterTitleEditMode());
    document.getElementById('issue-title-save-btn').addEventListener('click', () => this.saveTitleEdit());
    document.getElementById('issue-title-cancel-btn').addEventListener('click', () => this.cancelTitleEditMode());
    document.getElementById('issue-title-edit-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.saveTitleEdit();
      } else if (e.key === 'Escape') {
        this.cancelTitleEditMode();
      }
    });
    document.getElementById('issue-body-edit-btn').addEventListener('click', () => this.enterBodyEditMode());
    document.getElementById('issue-body-edit-input').addEventListener('input', (e) => {
      e.target.style.height = 'auto';
      e.target.style.height = `${Math.max(80, e.target.scrollHeight)}px`;
    });
    document.getElementById('issue-detail-body').addEventListener('click', (e) => {
      // 點到連結 / 程式碼選取等不要觸發編輯模式
      if (e.target.closest('a')) {
        return;
      }
      // 拖曳選取文字時不進入編輯
      if (window.getSelection && window.getSelection().toString()) {
        return;
      }
      this.enterBodyEditMode();
    });
    document.getElementById('issue-body-save-btn').addEventListener('click', () => this.saveIssueBody());
    document.getElementById('issue-body-cancel-btn').addEventListener('click', () => this.cancelBodyEditMode());
    document.getElementById('close-init-issue-btn').addEventListener('click', () => this.closeInitIssueModal());
    document.getElementById('cancel-init-issue-btn').addEventListener('click', () => this.closeInitIssueModal());
    document.getElementById('confirm-init-issue-btn').addEventListener('click', () => this.confirmInitIssue());
    document.getElementById('init-issue-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.closeInitIssueModal();
      }
    });
    document.getElementById('issue-link-branch-save-btn').addEventListener('click', () => this.saveBranchLink());
    document.getElementById('issue-link-branch-cancel-btn').addEventListener('click', () => this.closeLinkBranchForm());
    document.getElementById('issue-draft-discard-btn').addEventListener('click', () => this.discardDraft());
    document.getElementById('issue-link-branch-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.saveBranchLink();
      } else if (e.key === 'Escape') {
        this.closeLinkBranchForm();
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
      this.showMessage(t('msg.tokenRequired'), 'error');
      this.showEmptyState(t('empty.noToken'));
      return;
    }
    if (this.projects.length === 0) {
      this.showEmptyState(t('empty.noProject'));
      return;
    }
    await this.renderIssues();
  }
  // 重新渲染專案選擇下拉選單
  renderDropdown() {
    const label = document.getElementById('project-dropdown-label');
    const menu = document.getElementById('project-dropdown-menu');
    const active = this.projects.find(p => p.id === this.activeProjectId);
    label.textContent = active ? active.name : t('app.selectProject');
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
      ? `<div class="dropdown-item remove-item" id="dropdown-remove-item">${t('app.removeProject')}</div>`
      : '';
    menu.innerHTML = projectItems + divider +
      `<div class="dropdown-item add-item" id="dropdown-add-item">${t('app.addProject')}</div>` +
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
  // 關閉狀態下拉選單
  closeStatusDropdown() {
    const menu = document.getElementById('issue-status-dropdown-menu');
    if (menu) {
      menu.style.display = 'none';
    }
  }
  // 關閉緊急度下拉選單
  closeUrgencyDropdown() {
    const menu = document.getElementById('issue-urgency-dropdown-menu');
    if (menu) {
      menu.style.display = 'none';
    }
  }
  // 回傳緊急度對應的 SVG icon HTML
  urgencyIcon(urgency) {
    const red = '#ef4444';
    const dim = 'rgba(239,68,68,0.25)';
    const bars = (n) => `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" style="flex-shrink: 0;"><rect x="0" y="9" width="3" height="4" rx="0.5" fill="${n >= 1 ? red : dim}"/><rect x="5" y="5" width="3" height="8" rx="0.5" fill="${n >= 2 ? red : dim}"/><rect x="10" y="1" width="3" height="12" rx="0.5" fill="${n >= 3 ? red : dim}"/></svg>`;
    const exclaim = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none" style="flex-shrink: 0;"><rect x="5" y="1" width="3" height="7" rx="1" fill="${red}"/><rect x="5" y="10" width="3" height="2" rx="1" fill="${red}"/></svg>`;
    const map = { Low: bars(1), Medium: bars(2), High: bars(3), Urgent: exclaim };
    return map[urgency] || null;
  }
  // 回傳對應 status 的燈號 CSS class
  statusDotClass(status) {
    const map = {
      todo: 'dot-todo',
      process: 'dot-process',
      review: 'dot-review',
      done: 'dot-done',
      closed: 'dot-closed'
    };
    return map[status] || 'dot-closed';
  }
  // 設定 marked + DOMPurify（init 時呼叫一次）
  configureMarkdown() {
    if (typeof marked !== 'undefined') {
      marked.use({ gfm: true, breaks: true });
    }
    if (typeof DOMPurify !== 'undefined') {
      // 所有 <a> 在新分頁開啟，避免 manager 頁被替換掉
      DOMPurify.addHook('afterSanitizeAttributes', (node) => {
        if (node.tagName === 'A') {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      });
    }
  }
  // 把 markdown 文字轉成 sanitize 過的 HTML（給 innerHTML 用）
  renderMarkdown(text) {
    if (!text || typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
      return '';
    }
    return DOMPurify.sanitize(marked.parse(text));
  }
  // 取得使用者可見的 body 內容（去除尾端的 pm-meta 隱藏註解）
  displayBody(body) {
    return (body || '').replace(/\s*<!--\s*pm-meta:[^]*?-->\s*$/, '').trimEnd();
  }
  // 組合送回 GitHub 的 issue body：使用者內容 + pm-meta 註解
  buildIssueBody(displayBody, branchName) {
    const cleaned = (displayBody || '').replace(/\s*<!--\s*pm-meta:[^]*?-->\s*$/, '').trimEnd();
    if (!branchName) {
      return cleaned;
    }
    const meta = JSON.stringify({ branch: branchName });
    return cleaned ? `${cleaned}\n\n<!-- pm-meta: ${meta} -->` : `<!-- pm-meta: ${meta} -->`;
  }
  // 在現有 labels 上替換 status:* 與 priority:*，保留其他（type 等）
  buildIssueLabels(currentLabels, { status, urgency }) {
    const out = (currentLabels || [])
      .map(l => typeof l === 'string' ? l : l.name)
      .filter(n => !n.startsWith('status:') && !n.startsWith('priority:'));
    if (status) {
      out.push(`status:${status}`);
    }
    if (urgency) {
      out.push(`priority:${urgency.toLowerCase()}`);
    }
    return Array.from(new Set(out));
  }
  // 確保系統 labels 在 repo 中已建立。狀態存 chrome.storage.local 持久化，每個 repo 只跑一次
  async ensureLabelsOnce(owner, repo) {
    const storeKey = `labelsEnsured_${owner}_${repo}`;
    if (!this._labelsEnsured) {
      this._labelsEnsured = new Set();
    }
    if (this._labelsEnsured.has(storeKey)) {
      return;
    }
    const stored = await chrome.storage.local.get(storeKey);
    if (stored[storeKey]) {
      this._labelsEnsured.add(storeKey);
      return;
    }
    await this.github.ensureSystemLabels(owner, repo);
    await chrome.storage.local.set({ [storeKey]: true });
    this._labelsEnsured.add(storeKey);
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
    document.getElementById('add-project-error').style.display = 'none';
    document.getElementById('add-project-modal').classList.add('open');
    document.getElementById('modal-project-name').focus();
  }
  // 關閉新增專案 modal
  closeAddProjectModal() {
    document.getElementById('add-project-modal').classList.remove('open');
    document.getElementById('add-project-error').style.display = 'none';
  }
  // 儲存新專案並執行初始化流程
  async confirmAddProject() {
    const name = document.getElementById('modal-project-name').value.trim();
    const repo = document.getElementById('modal-project-repo').value.trim();
    const errEl = document.getElementById('add-project-error');
    errEl.style.display = 'none';
    if (!name || !repo) {
      return;
    }
    // 直接從 storage 讀取，避免設定面板儲存後 this.owner 尚未更新的問題
    const { owner } = await chrome.storage.sync.get('owner');
    if (!owner) {
      errEl.textContent = t('msg.usernameRequired');
      errEl.style.display = 'block';
      return;
    }
    this.owner = owner;
    if (!this.github) {
      errEl.textContent = t('msg.tokenRequired');
      errEl.style.display = 'block';
      return;
    }
    const btn = document.getElementById('confirm-add-project-btn');
    btn.disabled = true;
    btn.textContent = t('state.validating');
    try {
      const exists = await this.github.repoExists(owner, repo);
      if (!exists) {
        errEl.textContent = t('msg.repoNotFound', { name: `${owner}/${repo}` });
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = t('modal.add');
        return;
      }
    } catch (err) {
      errEl.textContent = t('msg.repoValidateFailed', { msg: err.message });
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = t('modal.add');
      return;
    }
    const newProject = { id: `proj_${Date.now()}`, name, owner, repo };
    this.projects.push(newProject);
    this.activeProjectId = newProject.id;
    await chrome.storage.sync.set({ projects: this.projects, activeProjectId: this.activeProjectId });
    this.closeAddProjectModal();
    btn.disabled = false;
    btn.textContent = t('modal.add');
    await this.initializeProject(newProject);
  }
  // 新增專案後自動建立 init issue（視 repo 是否為空決定行為）
  async initializeProject(project) {
    let isEmpty = false;
    try {
      isEmpty = await this.github.isRepoEmpty(project.owner, project.repo);
    } catch (e) {
      this.showMessage(t('msg.initFailed', { msg: e.message }), 'error');
      await this.reload();
      return;
    }
    if (!isEmpty) {
      try {
        await this.github.createLabel(project.owner, project.repo, 'init', '6f42c1');
        await this.ensureLabelsOnce(project.owner, project.repo);
        // 先抓現有 issues，若已存在帶 init label 的 issue 就直接沿用，不重複建立
        const existingIssues = await this.github.getIssues(project.owner, project.repo);
        const hasInit = existingIssues.some(i =>
          (i.labels || []).some(l => (typeof l === 'string' ? l : l.name) === 'init')
        );
        if (!hasInit) {
          await this.github.createIssue(
            project.owner, project.repo,
            t('init.issueAutoTitle'),
            t('init.issueAutoBody'),
            ['init', 'status:done']
          );
        }
        // 一次同步全部 issues（含剛建立的 init 或既有的 init），用標準 sync 邏輯解析 labels/body
        const refreshed = hasInit ? existingIssues : await this.github.getIssues(project.owner, project.repo);
        await this.storage.saveProjectIssues(project.id, refreshed);
      } catch (e) {
        this.showMessage(t('msg.initIssueFailed', { msg: e.message }), 'error');
      }
      await this.reload();
    } else {
      this._initProject = project;
      // 背景建立空白 README.md 以產生第一個 commit，讓之後 branch 建立可以成功
      this._initReadmePromise = this.github.createFile(
        project.owner, project.repo, 'README.md', '', 'Initial commit', 'master'
      );
      // 先 reload 讓專案出現在 dropdown，再開 modal
      await this.reload();
      this.openInitIssueModal();
    }
  }
  // 開啟空 repo 的手動初始化 issue modal
  openInitIssueModal() {
    document.getElementById('init-issue-title').value = '';
    // 預填 body 為結構化範本，使用者可直接編輯
    document.getElementById('init-issue-body').value = t('init.bodyTemplate');
    document.getElementById('init-issue-modal').classList.add('open');
    document.getElementById('init-issue-title').focus();
  }
  // 關閉初始化 issue modal
  closeInitIssueModal() {
    document.getElementById('init-issue-modal').classList.remove('open');
    this._initReadmePromise = null;
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
    btn.textContent = t('state.creating');
    try {
      // 等背景 README commit 完成，確保 branch 建立不會因為空 repo 而失敗
      if (this._initReadmePromise) {
        try {
          await this._initReadmePromise;
        } catch (e) {
          // 若背景作業失敗（例如 README 已存在），繼續嘗試建立 branch
        }
        this._initReadmePromise = null;
      }
      await this.github.createLabel(project.owner, project.repo, 'init', '6f42c1');
      await this.ensureLabelsOnce(project.owner, project.repo);
      const randomNum = Math.floor(Math.random() * 9000) + 1000;
      const branchName = `init-${randomNum}`;
      const issueBody = this.buildIssueBody(body, branchName);
      const issue = await this.github.createIssue(
        project.owner, project.repo, title, issueBody, ['init', 'status:todo']
      );
      try {
        const { sha } = await this.github.getDefaultBranchSHA(project.owner, project.repo);
        await this.github.createBranch(project.owner, project.repo, branchName, sha);
      } catch (branchErr) {
        this.showMessage(t('msg.initIssueCreated', { msg: branchErr.message }), 'error');
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
      this.showMessage(t('msg.createInitIssueFailed', { msg: error.message }), 'error');
    }
    btn.disabled = false;
    btn.textContent = t('issue.add.create');
  }
  // 開啟移除專案確認 modal
  openRemoveProjectModal() {
    const project = this.projects.find(p => p.id === this.activeProjectId);
    if (!project) {
      return;
    }
    document.getElementById('remove-project-confirm-line').innerHTML =
      t('project.remove.confirmHint', { name: `<strong>「${project.name}」</strong>` });
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
    document.getElementById('add-issue-branch').value = '';
    document.getElementById('add-issue-branch-error').style.display = 'none';
    document.getElementById('add-issue-urgency').value = '';
    document.getElementById('add-issue-modal').classList.add('open');
    document.getElementById('issue-title').focus();
  }
  // 關閉新增 issue modal
  closeAddIssueModal() {
    document.getElementById('add-issue-modal').classList.remove('open');
  }
  // 建立 issue 並在 GitHub 建立對應 branch，或連結指定的現有 branch
  async confirmAddIssue() {
    const title = document.getElementById('issue-title').value.trim();
    const type = document.getElementById('issue-type').value;
    const urgency = document.getElementById('add-issue-urgency').value;
    const body = document.getElementById('issue-body').value.trim();
    const linkedBranch = document.getElementById('add-issue-branch').value.trim();
    const branchErrorEl = document.getElementById('add-issue-branch-error');
    if (!title) {
      return;
    }
    const project = this.projects.find(p => p.id === this.activeProjectId);
    if (!project || !this.github) {
      return;
    }
    if (linkedBranch) {
      branchErrorEl.style.display = 'none';
      try {
        const exists = await this.github.branchExists(project.owner, project.repo, linkedBranch);
        if (!exists) {
          branchErrorEl.textContent = t('msg.branchNotFound', { name: linkedBranch });
          branchErrorEl.style.display = 'block';
          return;
        }
      } catch (err) {
        branchErrorEl.textContent = t('msg.branchValidateFailed', { msg: err.message });
        branchErrorEl.style.display = 'block';
        return;
      }
    }
    const btn = document.getElementById('confirm-add-issue-btn');
    btn.disabled = true;
    btn.textContent = t('state.creating');
    try {
      await this.ensureLabelsOnce(project.owner, project.repo);
      const randomNum = Math.floor(Math.random() * 9000) + 1000;
      const autoBranchName = `${type}-${randomNum}`;
      const branchName = linkedBranch || autoBranchName;
      const issueBody = this.buildIssueBody(body, branchName);
      const labels = [type, 'status:todo'];
      if (urgency) {
        labels.push(`priority:${urgency.toLowerCase()}`);
      }
      const issue = await this.github.createIssue(project.owner, project.repo, title, issueBody, labels);
      if (!linkedBranch) {
        try {
          const { sha } = await this.github.getDefaultBranchSHA(project.owner, project.repo);
          await this.github.createBranch(project.owner, project.repo, branchName, sha);
        } catch (branchErr) {
          this.showMessage(t('msg.initIssueCreated', { msg: branchErr.message }), 'error');
        }
      }
      await this.storage.saveIssue({
        ...issue,
        id: `${this.activeProjectId}_${issue.id}`,
        projectId: this.activeProjectId,
        branchName,
        urgency: urgency || null,
        status: 'todo'
      });
      this.closeAddIssueModal();
      await this.renderIssues();
    } catch (error) {
      this.showMessage(t('msg.createIssueFailed', { msg: error.message }), 'error');
    }
    btn.disabled = false;
    btn.textContent = t('issue.add.create');
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
      review: ['In Review', 'review'],
      done: ['Done', 'done']
    };
    return map[status] || null;
  }
  // 將 issue labels 轉換為類型 badge HTML
  typeBadge(labels) {
    const names = labels.map(l => l.name);
    const typeMap = {
      init: ['init', 'init'],
      bug: ['bug', 'bug'],
      feature: ['feature', 'feature']
    };
    for (const [key, [label, cls]] of Object.entries(typeMap)) {
      if (names.includes(key)) {
        return `<span class="status-badge status-${cls}">${label}</span>`;
      }
    }
    if (names.length > 0) {
      return `<span class="status-badge status-label">${names[0].toLowerCase()}</span>`;
    }
    return '';
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
      this.showEmptyState(t('empty.selectProject'));
      return;
    }
    try {
      const issues = await this.storage.getIssuesByProject(this.activeProjectId);
      if (issues.length === 0) {
        this.showEmptyState(t('empty.noIssues'));
        return;
      }
      const drafts = await this.storage.getDraftsByProject(this.activeProjectId);
      const draftSet = new Set(drafts.map(d => d.issueNumber));
      const columns = [
        { key: 'todo', label: t('column.todo') },
        { key: 'process', label: t('column.process') },
        { key: 'review', label: t('column.review') },
        { key: 'done', label: t('column.done') },
        { key: 'closed', label: t('column.closed') }
      ];
      const grouped = { todo: [], process: [], review: [], done: [], closed: [], other: [] };
      issues.forEach(issue => {
        if (issue.state === 'closed') {
          grouped.closed.push(issue);
        } else {
          const key = issue.status && grouped[issue.status] !== undefined ? issue.status : 'other';
          grouped[key].push(issue);
        }
      });
      const hasOther = grouped.other.length > 0;
      const allColumns = hasOther ? [...columns, { key: 'other', label: t('column.other') }] : columns;
      const colDotClass = { todo: 'dot-todo', process: 'dot-process', review: 'dot-review', done: 'dot-done', closed: 'dot-closed', other: 'dot-closed' };
      container.innerHTML = `<div class="issues-grid">` +
        allColumns.map(col => `<div class="issues-column">
          <div class="issues-column-header">
            <span style="display: flex; align-items: center; gap: 6px;">
              <span class="status-dot ${colDotClass[col.key] || 'dot-closed'}"></span>
              <span>${col.label}</span>
            </span>
            <span class="issues-column-count">${grouped[col.key].length}</span>
          </div>
          <div>${grouped[col.key].length === 0
            ? `<div class="issues-column-empty">${t('column.empty')}</div>`
            : grouped[col.key].map(issue => this.createIssueElement(issue, draftSet.has(issue.number))).join('')
          }</div>
        </div>`).join('') +
        `</div>`;
      container.querySelectorAll('.issue-item').forEach(el => {
        el.addEventListener('click', () => this.openIssueDetail(Number(el.dataset.issueNumber)));
      });
    } catch (error) {
      this.showMessage(t('msg.loadFailed', { msg: error.message }), 'error');
    }
  }
  // 產生單一 issue 卡片的 HTML 字串
  createIssueElement(issue, hasDraft = false) {
    const badge = this.typeBadge(issue.labels);
    const urgency = issue.urgency ? this.urgencyIcon(issue.urgency) : '';
    const draftAttr = hasDraft ? ` data-unsaved-label="${t('issue.detail.unsavedBadge')}"` : '';
    return `<div class="issue-item${hasDraft ? ' has-draft' : ''}" data-issue-number="${issue.number}"${draftAttr}>
      <div class="issue-title" style="display: flex; align-items: center; gap: 5px;">${issue.title}${urgency}</div>
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
    this._detailDraft = {};
    document.getElementById('issue-detail-title').textContent = t('state.loading');
    document.getElementById('issue-detail-meta').innerHTML = '';
    document.getElementById('issue-detail-body').textContent = '';
    document.getElementById('issue-detail-comments').innerHTML = '';
    document.getElementById('issue-comment-input').value = '';
    document.getElementById('issue-detail-modal').classList.add('open');
    try {
      const cached = await this.storage.getIssuesByProject(this.activeProjectId);
      const cachedIssue = cached.find(i => i.number === issueNumber);
      // 一律順便抓 PR（branchName 可能在 body metadata 而非 cache 內，事先無法判斷）
      const [issue, comments, prs] = await Promise.all([
        this.github.getIssue(project.owner, project.repo, issueNumber),
        this.github.getIssueComments(project.owner, project.repo, issueNumber),
        this.github.getPullRequests(project.owner, project.repo)
      ]);
      // 從 fresh issue 的 labels / body / legacy title 解析元資料（GitHub 端為真相來源）
      const parsed = LocalStorage.parseIssueMetadata(issue);
      let status = parsed.status || cachedIssue?.status || null;
      const branchName = parsed.branchName || cachedIssue?.branchName || null;
      const urgency = parsed.urgency || cachedIssue?.urgency || null;
      let needsRerender = false;
      if (cachedIssue && cachedIssue.state !== issue.state) {
        await this.storage.patchIssue(cachedIssue.id, { state: issue.state });
        needsRerender = true;
      }
      if (prs && branchName) {
        const autoStatus = this.computeIssueStatus(branchName, prs);
        if (autoStatus !== null && autoStatus !== status) {
          status = autoStatus;
          // 推到 GitHub label，避免本地與 GitHub 不一致
          try {
            const newLabels = this.buildIssueLabels(issue.labels, { status, urgency });
            const result = await this.github.setIssueLabels(project.owner, project.repo, issueNumber, newLabels);
            issue.labels = result;
          } catch (e) {
            // 失敗只記錯誤，繼續本地更新
          }
          if (cachedIssue) {
            await this.storage.patchIssue(cachedIssue.id, { status, labels: issue.labels });
          }
          needsRerender = true;
        }
      }
      if (needsRerender) {
        await this.renderIssues();
      }
      const baseIssue = {
        ...issue,
        branchName,
        urgency,
        status,
        id: cachedIssue?.id || issue.id
      };
      this._detailIssue = baseIssue;
      // 載入該 issue 在 IndexedDB 的草稿（若存在），覆蓋顯示用值
      const savedDraft = await this.storage.getDraft(this.activeProjectId, issueNumber);
      this._draftSavedAt = null;
      if (savedDraft) {
        const { key, projectId, issueNumber: _n, updatedAt, ...draftFields } = savedDraft;
        this._detailDraft = draftFields;
        this._draftSavedAt = updatedAt;
      }
      this.refreshDetailFromDraft();
    } catch (error) {
      document.getElementById('issue-detail-title').textContent = t('msg.loadFailed', { msg: error.message });
    }
  }
  // 切換標題到編輯模式
  enterTitleEditMode() {
    if (!this._detailIssue) {
      return;
    }
    document.getElementById('issue-detail-title').style.display = 'none';
    document.getElementById('issue-title-edit-btn').style.display = 'none';
    const input = document.getElementById('issue-title-edit-input');
    input.value = this._detailIssue.title || '';
    input.style.display = '';
    document.getElementById('issue-title-save-btn').style.display = '';
    document.getElementById('issue-title-cancel-btn').style.display = '';
    input.focus();
    input.select();
  }
  // 取消標題編輯
  cancelTitleEditMode() {
    document.getElementById('issue-detail-title').style.display = '';
    document.getElementById('issue-title-edit-btn').style.display = '';
    document.getElementById('issue-title-edit-input').style.display = 'none';
    document.getElementById('issue-title-save-btn').style.display = 'none';
    document.getElementById('issue-title-cancel-btn').style.display = 'none';
  }
  // 儲存編輯後的標題到 draft（不立即送 GitHub）
  saveTitleEdit() {
    if (!this._detailIssue) {
      return;
    }
    const newTitle = document.getElementById('issue-title-edit-input').value.trim();
    if (!newTitle) {
      return;
    }
    this._detailDraft.title = newTitle;
    document.getElementById('issue-detail-title').textContent = newTitle;
    this.cancelTitleEditMode();
  }
  // 切換說明到編輯模式：textarea 自動撐到內容高度
  enterBodyEditMode() {
    if (!this._detailIssue) {
      return;
    }
    const bodyEl = document.getElementById('issue-detail-body');
    // 取目前顯示區的高度當作 textarea 起始高度
    const targetHeight = Math.max(80, bodyEl.offsetHeight);
    bodyEl.style.display = 'none';
    document.getElementById('issue-body-edit-btn').style.display = 'none';
    const textarea = document.getElementById('issue-body-edit-input');
    textarea.value = this.displayBody(this._detailIssue.body);
    textarea.style.display = '';
    textarea.style.height = `${targetHeight}px`;
    // scrollHeight 在還沒佈局完前會不準，下一個 frame 再校正一次
    requestAnimationFrame(() => {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(80, textarea.scrollHeight)}px`;
    });
    document.getElementById('issue-body-edit-actions').style.display = 'flex';
    textarea.focus();
  }
  // 取消說明編輯
  cancelBodyEditMode() {
    document.getElementById('issue-detail-body').style.display = '';
    document.getElementById('issue-body-edit-btn').style.display = '';
    document.getElementById('issue-body-edit-input').style.display = 'none';
    document.getElementById('issue-body-edit-actions').style.display = 'none';
  }
  // 儲存編輯後的說明到 draft
  saveIssueBody() {
    if (!this._detailIssue) {
      return;
    }
    const newDisplayBody = document.getElementById('issue-body-edit-input').value.trim();
    this._detailDraft.body = newDisplayBody;
    const bodyEl = document.getElementById('issue-detail-body');
    if (newDisplayBody) {
      bodyEl.classList.add('markdown-body');
      bodyEl.innerHTML = this.renderMarkdown(newDisplayBody);
    } else {
      bodyEl.classList.remove('markdown-body');
      bodyEl.textContent = t('issue.detail.noBody');
    }
    this.cancelBodyEditMode();
  }
  // 將 issue 資料與留言填入詳情 modal
  renderIssueDetail(issue, comments) {
    this._detailComments = comments;
    this.cancelTitleEditMode();
    this.cancelBodyEditMode();
    this.closeLinkBranchForm();
    // 草稿提示橫幅：僅當有從 IndexedDB 載入的舊 draft 時顯示
    const banner = document.getElementById('issue-draft-banner');
    if (this._draftSavedAt) {
      banner.style.display = 'flex';
      document.getElementById('issue-draft-banner-text').textContent =
        t('issue.detail.draftBanner', { time: this.formatRelativeTime(this._draftSavedAt) });
    } else {
      banner.style.display = 'none';
    }
    // 過濾掉系統 labels（status:* / priority:*），只顯示 type 等使用者 label
    const visibleLabels = (issue.labels || []).filter(l => {
      const name = typeof l === 'string' ? l : l.name;
      return !name.startsWith('status:') && !name.startsWith('priority:');
    });
    const labels = visibleLabels.map(l => `<span class="issue-label">${typeof l === 'string' ? l : l.name}</span>`).join('');
    const state = issue.state;
    document.getElementById('issue-detail-title').textContent = issue.title;
    const iconClipboard = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    const iconBranch = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>`;
    const branchPart = issue.branchName ? `
      <span style="display: inline-flex; align-items: center; gap: 4px; color: var(--text-muted); font-size: 12px; margin-left: 4px;">
        ${iconBranch}
        <span id="issue-branch-display" style="font-family: monospace;">${issue.branchName}</span>
        <button id="copy-branch-btn" class="copy-btn" title="${t('issue.detail.copyBranch')}">${iconClipboard}</button>
      </span>` : '';
    const statusDropdown = issue.branchName ? `
      <div style="position: relative; display: inline-flex;">
        <button id="issue-status-dropdown-btn" style="display: inline-flex; align-items: center; gap: 5px; padding: 2px 7px; background: var(--btn-secondary-bg); border: 1px solid var(--border); border-radius: 10px; font-size: 11px; color: var(--text); cursor: pointer; font-family: inherit;">
          <span class="status-dot ${this.statusDotClass(issue.status || 'todo')}" id="issue-status-dot"></span>
          <span style="font-size: 9px; opacity: 0.5;">▾</span>
        </button>
        <div id="issue-status-dropdown-menu" style="display: none; position: absolute; top: calc(100% + 4px); left: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 250; overflow: hidden; min-width: 130px;"></div>
      </div>` : '';
    const linkBranchBtn = !issue.branchName ? `<button id="link-branch-btn" class="copy-btn" title="${t('issue.detail.linkBranch')}" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; border: 1px dashed var(--border); border-radius: 10px; font-size: 11px; color: var(--text-secondary);">${iconBranch} ＋</button>` : '';
    const urgencyBtnContent = issue.urgency
      ? this.urgencyIcon(issue.urgency)
      : `<span style="font-size: 11px; color: var(--text-secondary);">Priority</span>`;
    const urgencyDropdown = `<div style="position: relative; display: inline-flex;">
      <button id="issue-urgency-dropdown-btn" style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; background: var(--btn-secondary-bg); border: 1px solid var(--border); border-radius: 10px; cursor: pointer; font-family: inherit;">${urgencyBtnContent}<span style="font-size: 9px; opacity: 0.5; color: var(--text);">▾</span></button>
      <div id="issue-urgency-dropdown-menu" style="display: none; position: absolute; top: calc(100% + 4px); left: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 250; overflow: hidden; min-width: 110px;"></div>
    </div>`;
    document.getElementById('issue-detail-meta').innerHTML = `${labels}${statusDropdown}${urgencyDropdown}${branchPart}${linkBranchBtn}`;
    document.getElementById('issue-detail-toggle-btn').textContent =
      issue.state === 'open' ? t('issue.detail.markClosed') : t('issue.detail.reopen');
    if (issue.branchName) {
      document.getElementById('issue-status-dropdown-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = document.getElementById('issue-status-dropdown-menu');
        menu.style.display = menu.style.display === 'none' ? '' : 'none';
      });
      document.getElementById('copy-branch-btn').addEventListener('click', () => this.copyBranchName());
      const statuses = [
        { key: 'todo', label: 'Todo' },
        { key: 'process', label: 'In Progress' },
        { key: 'review', label: 'In Review' },
        { key: 'done', label: 'Done' }
      ];
      const statusMenu = document.getElementById('issue-status-dropdown-menu');
      statusMenu.innerHTML = statuses.map(s =>
        `<div class="status-menu-item" data-value="${s.key}" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-size: 12px; cursor: pointer; color: var(--text);">
          <span class="status-dot ${this.statusDotClass(s.key)}"></span>
          <span>${s.label}</span>
        </div>`
      ).join('');
      statusMenu.querySelectorAll('.status-menu-item').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this.updateLocalStatus(el.dataset.value);
          this.closeStatusDropdown();
        });
      });
    } else {
      document.getElementById('link-branch-btn').addEventListener('click', () => {
        document.getElementById('issue-link-branch-row').style.display = 'flex';
        document.getElementById('issue-link-branch-input').focus();
      });
    }
    document.getElementById('issue-urgency-dropdown-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = document.getElementById('issue-urgency-dropdown-menu');
      menu.style.display = menu.style.display === 'none' ? '' : 'none';
    });
    const urgencies = [
      { key: '', label: '—' },
      { key: 'Low', label: 'Low' },
      { key: 'Medium', label: 'Medium' },
      { key: 'High', label: 'High' },
      { key: 'Urgent', label: 'Urgent' }
    ];
    const urgencyMenu = document.getElementById('issue-urgency-dropdown-menu');
    urgencyMenu.innerHTML = urgencies.map(u =>
      `<div class="status-menu-item" data-value="${u.key}" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-size: 12px; cursor: pointer; color: var(--text);">
        ${u.key ? this.urgencyIcon(u.key) : `<span style="display: inline-block; width: 13px;"></span>`}
        <span>${u.label}</span>
      </div>`
    ).join('');
    urgencyMenu.querySelectorAll('.status-menu-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.updateUrgency(el.dataset.value);
        this.closeUrgencyDropdown();
      });
    });
    const bodyEl = document.getElementById('issue-detail-body');
    const displayed = this.displayBody(issue.body);
    if (displayed) {
      bodyEl.classList.add('markdown-body');
      bodyEl.innerHTML = this.renderMarkdown(displayed);
    } else {
      bodyEl.classList.remove('markdown-body');
      bodyEl.textContent = t('issue.detail.noBody');
    }
    const commentsEl = document.getElementById('issue-detail-comments');
    if (comments.length === 0) {
      commentsEl.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">${t('issue.detail.noComments')}</div>`;
    } else {
      commentsEl.innerHTML = comments.map(c => {
        const date = new Date(c.created_at).toLocaleString('zh-TW');
        return `<div class="comment-item">
          <div class="comment-meta">${c.user.login} · ${date}</div>
          <div class="comment-body markdown-body">${this.renderMarkdown(c.body)}</div>
        </div>`;
      }).join('');
    }
  }
  // 複製 branch 名稱到剪貼簿，並短暫以打勾 icon 回饋
  async copyBranchName() {
    const name = document.getElementById('issue-branch-display').textContent;
    if (!name) {
      return;
    }
    await navigator.clipboard.writeText(name);
    const btn = document.getElementById('copy-branch-btn');
    const iconClipboard = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    const iconCheck = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    btn.innerHTML = iconCheck;
    setTimeout(() => {
      btn.innerHTML = iconClipboard;
    }, 1500);
  }
  // 關閉 issue 詳情 modal 並清空暫存狀態（不觸發 API 與草稿儲存）
  closeIssueDetail() {
    document.getElementById('issue-detail-modal').classList.remove('open');
    this._detailIssue = null;
    this._detailIssueNumber = null;
    this._detailProject = null;
    this._detailComments = null;
    this._detailDraft = null;
    this._draftSavedAt = null;
  }
  // 將 _detailIssue 與 _detailDraft 合併成顯示用的 issue 物件
  mergedDetailIssue() {
    const issue = this._detailIssue;
    if (!issue) {
      return null;
    }
    const draft = this._detailDraft || {};
    const branchName = 'branchName' in draft ? draft.branchName : issue.branchName;
    const displayBody = 'body' in draft ? draft.body : this.displayBody(issue.body);
    return {
      ...issue,
      title: 'title' in draft ? draft.title : issue.title,
      body: this.buildIssueBody(displayBody, branchName),
      state: 'state' in draft ? draft.state : issue.state,
      status: 'status' in draft ? draft.status : issue.status,
      urgency: 'urgency' in draft ? draft.urgency : issue.urgency,
      branchName
    };
  }
  // 用目前 draft 重新渲染 detail modal
  refreshDetailFromDraft() {
    const merged = this.mergedDetailIssue();
    if (merged) {
      this.renderIssueDetail(merged, this._detailComments || []);
    }
  }
  // 草稿是否有任何欄位異動
  hasDraftChanges() {
    return this._detailDraft && Object.keys(this._detailDraft).length > 0;
  }
  // 把 draft 寫入 IndexedDB（modal 外部點擊或 commit 失敗時的 fallback）
  async persistDraft() {
    if (!this._detailIssue || !this.hasDraftChanges()) {
      return;
    }
    await this.storage.saveDraft(this.activeProjectId, this._detailIssue.number, this._detailDraft);
  }
  // 把 draft 一次送到 GitHub。可傳入 snapshot 讓背景送出（modal 已關閉時用），不傳則用目前 detail state
  async commitDraft(issueArg, projectArg, draftArg, projectIdArg) {
    const issue = issueArg || this._detailIssue;
    const project = projectArg || this._detailProject;
    const draft = draftArg !== undefined ? draftArg : this._detailDraft;
    const projectId = projectIdArg || this.activeProjectId;
    if (!issue || !project || !this.github) {
      return true;
    }
    if (!draft || Object.keys(draft).length === 0) {
      // 沒變更也順便清掉舊 draft（萬一前次留下）
      await this.storage.deleteDraft(projectId, issue.number);
      return true;
    }
    const patch = {};
    if ('title' in draft) {
      patch.title = draft.title;
    }
    if ('state' in draft) {
      patch.state = draft.state;
    }
    if ('body' in draft || 'branchName' in draft) {
      const displayBody = 'body' in draft ? draft.body : this.displayBody(issue.body);
      const branchName = 'branchName' in draft ? draft.branchName : issue.branchName;
      patch.body = this.buildIssueBody(displayBody, branchName);
    }
    const labelsChanged = 'status' in draft || 'urgency' in draft;
    const finalStatus = 'status' in draft ? draft.status : issue.status;
    const finalUrgency = 'urgency' in draft ? draft.urgency : issue.urgency;
    const newLabels = labelsChanged ? this.buildIssueLabels(issue.labels, { status: finalStatus, urgency: finalUrgency }) : null;
    try {
      let updatedIssue = null;
      if (Object.keys(patch).length > 0) {
        updatedIssue = await this.github.updateIssue(project.owner, project.repo, issue.number, patch);
      }
      let updatedLabels = null;
      if (newLabels) {
        await this.ensureLabelsOnce(project.owner, project.repo);
        updatedLabels = await this.github.setIssueLabels(project.owner, project.repo, issue.number, newLabels);
      }
      // 同步本地快取
      const cached = await this.storage.getIssuesByProject(projectId);
      const match = cached.find(i => i.number === issue.number);
      if (match) {
        const localPatch = {};
        if (updatedIssue) {
          localPatch.title = updatedIssue.title;
          localPatch.body = updatedIssue.body;
          localPatch.state = updatedIssue.state;
        }
        if (updatedLabels) {
          localPatch.labels = updatedLabels;
        }
        if ('status' in draft) {
          localPatch.status = draft.status;
        }
        if ('urgency' in draft) {
          localPatch.urgency = draft.urgency;
        }
        if ('branchName' in draft) {
          localPatch.branchName = draft.branchName;
        }
        if (Object.keys(localPatch).length > 0) {
          await this.storage.patchIssue(match.id, localPatch);
        }
      }
      await this.storage.deleteDraft(projectId, issue.number);
      return true;
    } catch (e) {
      this.showMessage(t('msg.commitFailed', { msg: e.message }), 'error');
      // commit 失敗時 fallback 存成 draft（用 snapshot 而非 this._，避免 modal 已關閉時 NPE）
      await this.storage.saveDraft(projectId, issue.number, draft);
      return false;
    }
  }
  // 點 X：立即關閉 modal，背景送 commit（API 失敗會自動 fallback 為 draft）
  async commitDraftAndClose() {
    const issueSnapshot = this._detailIssue;
    const projectSnapshot = this._detailProject;
    const draftSnapshot = this._detailDraft;
    const projectIdSnapshot = this.activeProjectId;
    this.closeIssueDetail();
    await this.renderIssues();
    if (!issueSnapshot || !draftSnapshot || Object.keys(draftSnapshot).length === 0) {
      return;
    }
    // 不 await：fire-and-forget，讓 UI 立即跳走
    this.commitDraft(issueSnapshot, projectSnapshot, draftSnapshot, projectIdSnapshot)
      .then(() => this.renderIssues())
      .catch(() => {});
  }
  // 點 modal 外：存 draft 然後關閉
  async saveDraftAndClose() {
    await this.persistDraft();
    this.closeIssueDetail();
    await this.renderIssues();
  }
  // 捨棄目前 issue 的 draft
  async discardDraft() {
    if (!this._detailIssue) {
      return;
    }
    await this.storage.deleteDraft(this.activeProjectId, this._detailIssue.number);
    this._detailDraft = {};
    this._draftSavedAt = null;
    this.refreshDetailFromDraft();
    await this.renderIssues();
  }
  // 把 timestamp 轉換成「X 分鐘前 / X 小時前 / X 天前」
  formatRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    const min = Math.floor(diff / 60000);
    if (min < 1) {
      return t('time.justNow');
    }
    if (min < 60) {
      return t('time.minAgo', { n: min });
    }
    const hr = Math.floor(min / 60);
    if (hr < 24) {
      return t('time.hourAgo', { n: hr });
    }
    const day = Math.floor(hr / 24);
    return t('time.dayAgo', { n: day });
  }
  // 收起 branch 連結輸入列並清空
  closeLinkBranchForm() {
    const row = document.getElementById('issue-link-branch-row');
    if (row) {
      row.style.display = 'none';
    }
    const input = document.getElementById('issue-link-branch-input');
    if (input) {
      input.value = '';
    }
  }
  // 將輸入的 branch 名稱寫入本地 storage 並重新渲染（儲存前先驗證 branch 存在）
  async saveBranchLink() {
    const input = document.getElementById('issue-link-branch-input');
    const branchName = input.value.trim();
    if (!branchName || !this._detailIssue || !this._detailProject || !this.github) {
      return;
    }
    const btn = document.getElementById('issue-link-branch-save-btn');
    btn.disabled = true;
    btn.textContent = t('state.validating');
    try {
      const exists = await this.github.branchExists(
        this._detailProject.owner, this._detailProject.repo, branchName
      );
      if (!exists) {
        this.showMessage(t('msg.branchNotFound', { name: branchName }), 'error');
        btn.disabled = false;
        btn.textContent = t('modal.link');
        return;
      }
      // branch 驗證成功後寫入 draft，由 commit 階段送 GitHub
      this._detailDraft.branchName = branchName;
      this.closeLinkBranchForm();
      this.refreshDetailFromDraft();
    } catch (error) {
      this.showMessage(t('msg.linkFailed', { msg: error.message }), 'error');
      btn.disabled = false;
      btn.textContent = t('modal.link');
    }
  }
  // 更新 issue 緊急度到 draft
  updateUrgency(newUrgency) {
    if (!this._detailIssue) {
      return;
    }
    this._detailDraft.urgency = newUrgency || null;
    this.refreshDetailFromDraft();
  }
  // 更新 issue 進度到 draft
  updateLocalStatus(newStatus) {
    if (!this._detailIssue) {
      return;
    }
    this._detailDraft.status = newStatus;
    const dot = document.getElementById('issue-status-dot');
    if (dot) {
      dot.className = `status-dot ${this.statusDotClass(newStatus)}`;
    }
  }
  // 在 GitHub 切換 issue 的開啟/關閉狀態
  // 切換 issue 狀態到 draft（open ↔ closed）
  toggleIssueState() {
    if (!this._detailIssue) {
      return;
    }
    const merged = this.mergedDetailIssue();
    const newState = merged.state === 'open' ? 'closed' : 'open';
    this._detailDraft.state = newState;
    document.getElementById('issue-detail-toggle-btn').textContent =
      newState === 'open' ? t('issue.detail.markClosed') : t('issue.detail.reopen');
  }
  // 開啟刪除 issue 確認 modal
  openDeleteIssueModal() {
    if (!this._detailIssue) {
      return;
    }
    document.getElementById('delete-issue-name-hint').textContent = this._detailIssue.title;
    document.getElementById('delete-issue-modal').classList.add('open');
  }
  // 關閉刪除 issue modal
  closeDeleteIssueModal() {
    document.getElementById('delete-issue-modal').classList.remove('open');
    document.getElementById('delete-issue-error').style.display = 'none';
  }
  // 從 GitHub 和本地永久刪除 issue
  async confirmDeleteIssue() {
    if (!this._detailIssue || !this._detailProject || !this.github) {
      return;
    }
    const btn = document.getElementById('confirm-delete-issue-btn');
    const errEl = document.getElementById('delete-issue-error');
    btn.disabled = true;
    btn.textContent = t('state.deleting');
    errEl.style.display = 'none';
    try {
      await this.github.deleteIssue(this._detailIssue.node_id);
      const cached = await this.storage.getIssuesByProject(this.activeProjectId);
      const match = cached.find(i => i.number === this._detailIssue.number);
      if (match) {
        await this.storage.deleteIssue(match.id);
      }
      // 一併清掉該 issue 的草稿，避免之後切回時看到孤兒 draft
      await this.storage.deleteDraft(this.activeProjectId, this._detailIssue.number);
      this.closeDeleteIssueModal();
      this.closeIssueDetail();
      await this.renderIssues();
    } catch (error) {
      errEl.textContent = t('msg.deleteFailed', { msg: error.message });
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = t('modal.confirmDelete');
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
    btn.style.opacity = '0.5';
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
      this.showMessage(t('msg.commentFailed', { msg: error.message }), 'error');
    }
    btn.disabled = false;
    btn.style.opacity = '';
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
    btn.textContent = t('state.syncing');
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
        if (autoStatus !== null && autoStatus !== ci.status) {
          // 同步把新 status 推到 GitHub label，避免本地與 GitHub 不一致
          try {
            const newLabels = this.buildIssueLabels(ci.labels, { status: autoStatus, urgency: ci.urgency });
            const result = await this.github.setIssueLabels(project.owner, project.repo, ci.number, newLabels);
            await this.storage.patchIssue(ci.id, { status: autoStatus, labels: result });
          } catch (e) {
            // label 更新失敗不阻擋整體 refresh，只更新本地
            await this.storage.patchIssue(ci.id, { status: autoStatus });
          }
        }
      }
      await this.storage.setLastSync(this.activeProjectId, Date.now());
      await this.renderIssues();
    } catch (error) {
      this.showMessage(t('msg.syncFailed', { msg: error.message }), 'error');
    }
    btn.textContent = t('app.refresh');
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