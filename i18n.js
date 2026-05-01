// 多語言 (en / zh-TW / ja)：擴充自有的 i18n 系統，因 chrome.i18n 無法執行時切換語言
const I18N_STRINGS = {
  en: {
    'app.openManager': 'Open Project Manager',
    'app.settings': 'Settings',
    'app.refresh': 'Refresh',
    'app.addIssue': '+ New Issue',
    'app.addProject': '+ New Project',
    'app.removeProject': 'Remove this project',
    'app.selectProject': 'Select project',
    'settings.account': 'Account',
    'settings.appearance': 'Appearance',
    'settings.theme': 'Theme',
    'settings.theme.system': 'System',
    'settings.theme.light': 'Light',
    'settings.theme.dark': 'Dark',
    'settings.language': 'Language',
    'settings.language.auto': 'Browser default',
    'settings.saveAccount': 'Save Account',
    'settings.usernamePlaceholder': 'GitHub Username',
    'settings.tokenPlaceholder': 'GitHub Personal Access Token',
    'modal.cancel': 'Cancel',
    'modal.save': 'Save',
    'modal.add': 'Add',
    'modal.create': 'Create',
    'modal.confirmRemove': 'Confirm Remove',
    'modal.confirmDelete': 'Confirm Delete',
    'modal.link': 'Link',
    'project.add.title': 'New Project',
    'project.add.name': 'Display Name',
    'project.add.namePlaceholder': 'My Project',
    'project.add.repo': 'Repository',
    'project.add.repoPlaceholder': 'repo-name',
    'project.remove.title': 'Remove Project',
    'project.remove.warning': 'This cannot be undone. Local cached issues will also be cleared.',
    'project.remove.confirmHint': 'Type project name {name} to confirm removal:',
    'project.remove.placeholder': 'Project name',
    'issue.add.title': 'New Issue',
    'issue.add.titleField': 'Title',
    'issue.add.titlePlaceholder': 'Brief description of the issue or request',
    'issue.add.type': 'Type',
    'issue.add.priority': 'Priority (optional)',
    'issue.add.body': 'Description (optional)',
    'issue.add.bodyPlaceholder': 'Detailed description...',
    'issue.add.create': 'Create Issue',
    'issue.delete.title': 'Delete Issue',
    'issue.delete.warning': 'This cannot be undone. The issue will be permanently deleted on GitHub.',
    'issue.init.title': 'Create Init Issue',
    'issue.init.intro': 'This repo is currently empty. Please create an init issue as the project starting point.',
    'issue.init.titlePlaceholder': 'Project Init',
    'issue.init.bodyPlaceholder': 'Describe the initialization content for this project...',
    'issue.detail.editTitle': 'Edit title',
    'issue.detail.editBody': 'Edit description',
    'issue.detail.copyIdentifier': 'Copy issue identifier',
    'issue.detail.body': 'DESCRIPTION',
    'issue.detail.comments': 'COMMENTS',
    'issue.detail.commentPlaceholder': 'Add a comment...',
    'issue.detail.sendComment': 'Send comment',
    'issue.detail.delete': 'Delete Issue',
    'issue.detail.markClosed': 'Mark as Closed',
    'issue.detail.markCancel': 'Mark as Canceled',
    'issue.detail.noBody': '(no description)',
    'issue.detail.noComments': 'No comments yet',
    'issue.detail.draftBanner': 'Unsent changes ({time})',
    'issue.detail.discardDraft': 'Discard changes',
    'issue.detail.unsavedBadge': 'UNSAVED',
    'issue.detail.priority': 'Priority',
    'issue.detail.linkedPRs': 'LINKED PRS',
    'issue.detail.linkPR': 'Link PR',
    'issue.detail.unlinkPR': 'Unlink',
    'issue.detail.linkPRInputPlaceholder': 'PR number',
    'issue.detail.subIssues': 'SUB-ISSUES',
    'issue.detail.parent': 'Parent',
    'issue.detail.addSubIssue': 'Add Sub-issue',
    'issue.detail.unlinkSubIssue': 'Unlink',
    'issue.detail.subIssueProgress': '{completed}/{total}',
    'issue.detail.subIssueInputPlaceholder': 'Issue number',
    'column.todo': 'Todo',
    'column.process': 'In Progress',
    'column.review': 'In Review',
    'column.done': 'Done',
    'column.closed': 'Closed',
    'column.cancel': 'Canceled',
    'column.other': 'Uncategorized',
    'column.empty': 'None',
    'time.justNow': 'just now',
    'time.minAgo': '{n} min ago',
    'time.hourAgo': '{n}h ago',
    'time.dayAgo': '{n}d ago',
    'state.loading': 'Loading...',
    'state.syncing': 'Syncing...',
    'state.creating': 'Creating...',
    'state.saving': 'Saving...',
    'state.validating': 'Validating...',
    'state.deleting': 'Deleting...',
    'state.sending': 'Sending...',
    'empty.noToken': 'GitHub Token not set. Click "Settings" on top-right.',
    'empty.noProject': 'No projects yet. Use the dropdown to add one.',
    'empty.selectProject': 'Please select or create a project first.',
    'empty.noIssues': 'No issues. Click "Refresh" to sync, or "+ New Issue".',
    'msg.tokenRequired': 'Please set GitHub Token in settings first.',
    'msg.usernameRequired': 'Please set GitHub Username in settings first.',
    'msg.repoNotFound': 'Repo "{name}" not found. Check name and permissions.',
    'msg.branchNotFound': 'Branch "{name}" not found. Check the name.',
    'msg.prNotFound': 'PR #{n} not found in this repo.',
    'msg.subIssueNotFound': 'Issue #{n} not found in this repo.',
    'msg.subIssueLimitReached': 'Sub-issues limit reached (100).',
    'msg.subIssueDepthLimit': 'Sub-issue depth limit reached.',
    'msg.subIssueAlreadyHasParent': 'Issue #{n} already has a parent.',
    'msg.subIssueCrossRepoUnsupported': 'Cross-repo sub-issues are not supported.',
    'msg.subIssueSelfRef': 'An issue cannot be its own sub-issue.',
    'msg.subIssueAddFailed': 'Failed to add sub-issue: {msg}',
    'msg.repoValidateFailed': 'Failed to validate repo: {msg}',
    'msg.branchValidateFailed': 'Failed to validate branch: {msg}',
    'msg.syncFailed': 'Sync failed: {msg}',
    'msg.loadFailed': 'Load failed: {msg}',
    'msg.commentFailed': 'Comment failed: {msg}',
    'msg.linkFailed': 'Link failed: {msg}',
    'msg.saveFailed': 'Save failed: {msg}',
    'msg.operationFailed': 'Operation failed: {msg}',
    'msg.createIssueFailed': 'Failed to create issue: {msg}',
    'msg.initIssueCreated': 'Issue created, but branch creation failed: {msg}',
    'msg.createInitIssueFailed': 'Failed to create init issue: {msg}',
    'msg.initIssueFailed': 'Failed to create init issue: {msg}',
    'msg.initFailed': 'Initialization failed: {msg}',
    'msg.updateStatusFailed': 'Failed to update status: {msg}',
    'msg.updatePriorityFailed': 'Failed to update priority: {msg}',
    'msg.issueNotFound': 'Issue not found',
    'msg.commitFailed': 'Send failed, changes saved as unsent: {msg}',
    'msg.deleteFailed': 'Delete failed: {msg}',
    'msg.accountSaved': 'Account settings saved',
    'msg.tokenInputRequired': 'Please enter token',
    'msg.usernameInputRequired': 'Please enter GitHub Username',
    'init.issueAutoBody': `This issue was auto-created by the Project Manager extension to mark the project's starting point.

## Project Purpose
(Please edit to describe what this project does)

## Labels & Metadata Conventions
- \`status:*\` — issue board columns (todo / process / review / done)
- \`priority:*\` — urgency level (low / medium / high / urgent)
- The \`<!-- pm-meta: {...} -->\` comment at the end of issue body stores the linked branch name; do not delete it manually`,
    'init.issueAutoTitle': 'Project Init',
    'init.bodyTemplate': `## Project Purpose
(One sentence: what problem does this project solve, or what value does it provide?)

## Use Cases
(Who uses it? When?)

## Tech Stack
- Language / framework:
- Data storage:
- Deployment:

---

> This issue is maintained by the Project Manager extension:
> - \`status:*\` labels map to board columns
> - \`priority:*\` labels indicate urgency
> - The \`<!-- pm-meta -->\` comment at the end stores the linked branch; do not delete it manually`
  },
  'zh-TW': {
    'app.openManager': '開啟專案管理',
    'app.settings': '設定',
    'app.refresh': '重整',
    'app.addIssue': '＋ 新增 Issue',
    'app.addProject': '＋ 新增專案',
    'app.removeProject': '移除此專案',
    'app.selectProject': '選擇專案',
    'settings.account': '帳戶',
    'settings.appearance': '外觀',
    'settings.theme': '主題',
    'settings.theme.system': '跟隨系統',
    'settings.theme.light': '亮色',
    'settings.theme.dark': '暗色',
    'settings.language': '語言',
    'settings.language.auto': '跟隨瀏覽器',
    'settings.saveAccount': '保存帳戶設定',
    'settings.usernamePlaceholder': 'GitHub Username',
    'settings.tokenPlaceholder': 'GitHub Personal Access Token',
    'modal.cancel': '取消',
    'modal.save': '儲存',
    'modal.add': '新增',
    'modal.create': '建立',
    'modal.confirmRemove': '確認移除',
    'modal.confirmDelete': '確認刪除',
    'modal.link': '連結',
    'project.add.title': '新增專案',
    'project.add.name': '顯示名稱',
    'project.add.namePlaceholder': '我的專案',
    'project.add.repo': 'Repository',
    'project.add.repoPlaceholder': 'repo-name',
    'project.remove.title': '移除專案',
    'project.remove.warning': '此操作無法復原，本地快取的 issues 也將一併清除。',
    'project.remove.confirmHint': '請輸入專案名稱 {name} 來確認移除：',
    'project.remove.placeholder': '輸入專案名稱',
    'issue.add.title': '新增 Issue',
    'issue.add.titleField': '標題',
    'issue.add.titlePlaceholder': '簡短描述問題或需求',
    'issue.add.type': '類型',
    'issue.add.priority': 'Priority（選填）',
    'issue.add.body': '說明（選填）',
    'issue.add.bodyPlaceholder': '詳細描述...',
    'issue.add.create': '建立 Issue',
    'issue.delete.title': '刪除 Issue',
    'issue.delete.warning': '此操作無法復原，issue 將從 GitHub 永久刪除。',
    'issue.init.title': '建立初始化 Issue',
    'issue.init.intro': '此 repo 目前為空，請建立一個初始化 issue 作為專案起點。',
    'issue.init.titlePlaceholder': '專案初始化',
    'issue.init.bodyPlaceholder': '描述此專案的初始化內容...',
    'issue.detail.editTitle': '編輯標題',
    'issue.detail.editBody': '編輯說明',
    'issue.detail.copyIdentifier': '複製 issue 識別碼',
    'issue.detail.body': '說明',
    'issue.detail.comments': '留言',
    'issue.detail.commentPlaceholder': '新增留言...',
    'issue.detail.sendComment': '送出留言',
    'issue.detail.delete': '刪除 Issue',
    'issue.detail.markClosed': '設為關閉',
    'issue.detail.markCancel': '標記為取消',
    'issue.detail.noBody': '（無說明）',
    'issue.detail.noComments': '尚無留言',
    'issue.detail.draftBanner': '有未送出的變更（{time}）',
    'issue.detail.discardDraft': '捨棄變更',
    'issue.detail.unsavedBadge': '未儲存',
    'issue.detail.priority': 'Priority',
    'issue.detail.linkedPRs': '連結的 PR',
    'issue.detail.linkPR': '連結 PR',
    'issue.detail.subIssues': '子任務',
    'issue.detail.parent': '父任務',
    'issue.detail.addSubIssue': '加入子任務',
    'issue.detail.unlinkSubIssue': '移除',
    'issue.detail.subIssueProgress': '{completed}/{total}',
    'issue.detail.subIssueInputPlaceholder': 'Issue 編號',
    'issue.detail.unlinkPR': '取消連結',
    'issue.detail.linkPRInputPlaceholder': 'PR 編號',
    'column.todo': 'Todo',
    'column.process': 'In Progress',
    'column.review': 'In Review',
    'column.done': 'Done',
    'column.closed': 'Closed',
    'column.cancel': 'Canceled',
    'column.other': '未分類',
    'column.empty': '無',
    'time.justNow': '剛剛',
    'time.minAgo': '{n} 分鐘前',
    'time.hourAgo': '{n} 小時前',
    'time.dayAgo': '{n} 天前',
    'state.loading': '載入中...',
    'state.syncing': '同步中...',
    'state.creating': '建立中...',
    'state.saving': '儲存中...',
    'state.validating': '驗證中...',
    'state.deleting': '刪除中...',
    'state.sending': '送出中...',
    'empty.noToken': '尚未設定 GitHub Token，請點右上角「設定」',
    'empty.noProject': '還沒有任何專案，點擊下拉選單新增',
    'empty.selectProject': '請先選擇或新增專案',
    'empty.noIssues': '暫無 issues，點擊「重整」來同步，或點「＋ 新增 Issue」',
    'msg.tokenRequired': '請先在設定中輸入 GitHub Token',
    'msg.usernameRequired': '請先在設定中填寫 GitHub Username',
    'msg.repoNotFound': '找不到 repo「{name}」，請確認名稱與權限',
    'msg.branchNotFound': '找不到 branch「{name}」，請確認名稱是否正確',
    'msg.prNotFound': '找不到 PR #{n}',
    'msg.subIssueNotFound': '此 repo 找不到 Issue #{n}',
    'msg.subIssueLimitReached': '子任務數量已達上限（100 個）',
    'msg.subIssueDepthLimit': '子任務巢狀深度已達上限',
    'msg.subIssueAlreadyHasParent': 'Issue #{n} 已有父任務',
    'msg.subIssueCrossRepoUnsupported': '不支援跨 repo 的子任務',
    'msg.subIssueSelfRef': '不能將 issue 設為自己的子任務',
    'msg.subIssueAddFailed': '加入子任務失敗：{msg}',
    'msg.repoValidateFailed': '驗證 repo 失敗：{msg}',
    'msg.branchValidateFailed': '驗證 branch 失敗：{msg}',
    'msg.syncFailed': '同步失敗: {msg}',
    'msg.loadFailed': '載入失敗: {msg}',
    'msg.commentFailed': '留言失敗: {msg}',
    'msg.linkFailed': '連結失敗: {msg}',
    'msg.saveFailed': '儲存失敗: {msg}',
    'msg.operationFailed': '操作失敗: {msg}',
    'msg.createIssueFailed': '建立 issue 失敗: {msg}',
    'msg.initIssueCreated': 'Issue 已建立，但 branch 建立失敗: {msg}',
    'msg.createInitIssueFailed': '建立初始化 issue 失敗: {msg}',
    'msg.initIssueFailed': '初始化 issue 建立失敗: {msg}',
    'msg.initFailed': '初始化失敗：{msg}',
    'msg.updateStatusFailed': '更新狀態失敗: {msg}',
    'msg.updatePriorityFailed': '更新緊急度失敗: {msg}',
    'msg.issueNotFound': '找不到對應的 issue',
    'msg.commitFailed': '送出失敗，已暫存未儲存的變更: {msg}',
    'msg.deleteFailed': '刪除失敗：{msg}',
    'msg.accountSaved': '帳戶設定已保存',
    'msg.tokenInputRequired': '請輸入 token',
    'msg.usernameInputRequired': '請輸入 GitHub Username',
    'init.issueAutoBody': `此 issue 由 Project Manager 擴充功能自動建立，標記專案起點。

## 專案目的
（請編輯說明本專案在做什麼）

## 標籤與 metadata 約定
- \`status:*\` — issue 看板欄位（todo / process / review / done）
- \`priority:*\` — 緊急度（low / medium / high / urgent）
- Issue body 結尾的 \`<!-- pm-meta: {...} -->\` 註解儲存連結的 branch 名稱，請勿手動刪除`,
    'init.issueAutoTitle': '專案初始化',
    'init.bodyTemplate': `## 專案目的
（一句話說明這個專案要解決什麼問題或提供什麼價值）

## 使用情境
（誰會用？什麼時候用？）

## 技術堆疊
- 主要語言／框架：
- 資料儲存：
- 部署：

---

> 此 issue 由 Project Manager 擴充功能維護專案元資料：
> - \`status:*\` labels 對應看板欄位
> - \`priority:*\` labels 標示緊急度
> - body 結尾的 \`<!-- pm-meta -->\` 為 branch 連結，請勿手動刪除`
  },
  ja: {
    'app.openManager': 'プロジェクト管理を開く',
    'app.settings': '設定',
    'app.refresh': '更新',
    'app.addIssue': '＋ 新規Issue',
    'app.addProject': '＋ 新規プロジェクト',
    'app.removeProject': 'このプロジェクトを削除',
    'app.selectProject': 'プロジェクトを選択',
    'settings.account': 'アカウント',
    'settings.appearance': '外観',
    'settings.theme': 'テーマ',
    'settings.theme.system': 'システム',
    'settings.theme.light': 'ライト',
    'settings.theme.dark': 'ダーク',
    'settings.language': '言語',
    'settings.language.auto': 'ブラウザに従う',
    'settings.saveAccount': 'アカウントを保存',
    'settings.usernamePlaceholder': 'GitHub Username',
    'settings.tokenPlaceholder': 'GitHub Personal Access Token',
    'modal.cancel': 'キャンセル',
    'modal.save': '保存',
    'modal.add': '追加',
    'modal.create': '作成',
    'modal.confirmRemove': '削除を確認',
    'modal.confirmDelete': '削除を確認',
    'modal.link': 'リンク',
    'project.add.title': '新規プロジェクト',
    'project.add.name': '表示名',
    'project.add.namePlaceholder': 'マイプロジェクト',
    'project.add.repo': 'Repository',
    'project.add.repoPlaceholder': 'repo-name',
    'project.remove.title': 'プロジェクトを削除',
    'project.remove.warning': 'この操作は元に戻せません。ローカルキャッシュのIssueも削除されます。',
    'project.remove.confirmHint': 'プロジェクト名 {name} を入力して削除を確認：',
    'project.remove.placeholder': 'プロジェクト名を入力',
    'issue.add.title': '新規Issue',
    'issue.add.titleField': 'タイトル',
    'issue.add.titlePlaceholder': '問題や要望を簡潔に説明',
    'issue.add.type': 'タイプ',
    'issue.add.priority': 'Priority（任意）',
    'issue.add.body': '説明（任意）',
    'issue.add.bodyPlaceholder': '詳細を入力...',
    'issue.add.create': 'Issueを作成',
    'issue.delete.title': 'Issueを削除',
    'issue.delete.warning': 'この操作は元に戻せません。IssueはGitHubから完全に削除されます。',
    'issue.init.title': '初期化Issueを作成',
    'issue.init.intro': 'このrepoは現在空です。プロジェクトの開始点として初期化Issueを作成してください。',
    'issue.init.titlePlaceholder': 'プロジェクト初期化',
    'issue.init.bodyPlaceholder': 'プロジェクトの初期化内容を入力...',
    'issue.detail.editTitle': 'タイトルを編集',
    'issue.detail.editBody': '説明を編集',
    'issue.detail.copyIdentifier': 'issue 識別子をコピー',
    'issue.detail.body': '説明',
    'issue.detail.comments': 'コメント',
    'issue.detail.commentPlaceholder': 'コメントを追加...',
    'issue.detail.sendComment': 'コメントを送信',
    'issue.detail.delete': 'Issueを削除',
    'issue.detail.markClosed': 'クローズ',
    'issue.detail.markCancel': 'キャンセルする',
    'issue.detail.noBody': '（説明なし）',
    'issue.detail.noComments': 'コメントなし',
    'issue.detail.draftBanner': '未送信の変更があります（{time}）',
    'issue.detail.discardDraft': '変更を破棄',
    'issue.detail.unsavedBadge': '未保存',
    'issue.detail.priority': 'Priority',
    'issue.detail.linkedPRs': 'リンクされたPR',
    'issue.detail.linkPR': 'PRをリンク',
    'issue.detail.subIssues': 'サブIssue',
    'issue.detail.parent': '親Issue',
    'issue.detail.addSubIssue': 'サブIssueを追加',
    'issue.detail.unlinkSubIssue': '解除',
    'issue.detail.subIssueProgress': '{completed}/{total}',
    'issue.detail.subIssueInputPlaceholder': 'Issue番号',
    'issue.detail.unlinkPR': 'リンク解除',
    'issue.detail.linkPRInputPlaceholder': 'PR番号',
    'column.todo': 'Todo',
    'column.process': 'In Progress',
    'column.review': 'In Review',
    'column.done': 'Done',
    'column.closed': 'Closed',
    'column.cancel': 'Canceled',
    'column.other': '未分類',
    'column.empty': 'なし',
    'time.justNow': 'たった今',
    'time.minAgo': '{n}分前',
    'time.hourAgo': '{n}時間前',
    'time.dayAgo': '{n}日前',
    'state.loading': '読み込み中...',
    'state.syncing': '同期中...',
    'state.creating': '作成中...',
    'state.saving': '保存中...',
    'state.validating': '検証中...',
    'state.deleting': '削除中...',
    'state.sending': '送信中...',
    'empty.noToken': 'GitHub Tokenが未設定です。右上の「設定」をクリック。',
    'empty.noProject': 'プロジェクトがありません。ドロップダウンから追加してください。',
    'empty.selectProject': 'プロジェクトを選択または作成してください。',
    'empty.noIssues': 'Issueがありません。「更新」または「＋ 新規Issue」をクリック。',
    'msg.tokenRequired': '設定でGitHub Tokenを入力してください',
    'msg.usernameRequired': '設定でGitHub Usernameを入力してください',
    'msg.repoNotFound': 'repo「{name}」が見つかりません。名前と権限を確認してください',
    'msg.branchNotFound': 'branch「{name}」が見つかりません',
    'msg.prNotFound': 'PR #{n} が見つかりません',
    'msg.subIssueNotFound': 'このrepoにIssue #{n} が見つかりません',
    'msg.subIssueLimitReached': 'サブIssueの上限（100件）に達しました',
    'msg.subIssueDepthLimit': 'サブIssueの階層上限に達しました',
    'msg.subIssueAlreadyHasParent': 'Issue #{n} には既に親があります',
    'msg.subIssueCrossRepoUnsupported': 'repo間のサブIssueはサポートされていません',
    'msg.subIssueSelfRef': 'Issueを自身のサブIssueにすることはできません',
    'msg.subIssueAddFailed': 'サブIssueの追加に失敗しました：{msg}',
    'msg.repoValidateFailed': 'repoの検証に失敗：{msg}',
    'msg.branchValidateFailed': 'branchの検証に失敗：{msg}',
    'msg.syncFailed': '同期失敗: {msg}',
    'msg.loadFailed': '読み込み失敗: {msg}',
    'msg.commentFailed': 'コメント送信失敗: {msg}',
    'msg.linkFailed': 'リンク失敗: {msg}',
    'msg.saveFailed': '保存失敗: {msg}',
    'msg.operationFailed': '操作失敗: {msg}',
    'msg.createIssueFailed': 'Issue作成失敗: {msg}',
    'msg.initIssueCreated': 'Issueは作成されましたが、branch作成に失敗: {msg}',
    'msg.createInitIssueFailed': '初期化Issue作成失敗: {msg}',
    'msg.initIssueFailed': '初期化Issue作成失敗: {msg}',
    'msg.initFailed': '初期化失敗：{msg}',
    'msg.updateStatusFailed': 'ステータス更新失敗: {msg}',
    'msg.updatePriorityFailed': 'Priority更新失敗: {msg}',
    'msg.issueNotFound': '対応するIssueが見つかりません',
    'msg.commitFailed': '送信失敗、未保存の変更を一時保存: {msg}',
    'msg.deleteFailed': '削除失敗：{msg}',
    'msg.accountSaved': 'アカウント設定を保存しました',
    'msg.tokenInputRequired': 'tokenを入力してください',
    'msg.usernameInputRequired': 'GitHub Usernameを入力してください',
    'init.issueAutoBody': `このissueはProject Manager拡張機能によって自動作成され、プロジェクトの起点を示します。

## プロジェクトの目的
（このプロジェクトが何をするのか説明してください）

## ラベルとメタデータの規約
- \`status:*\` — issueボードのカラム（todo / process / review / done）
- \`priority:*\` — 緊急度（low / medium / high / urgent）
- issue body末尾の \`<!-- pm-meta: {...} -->\` コメントはリンクされたbranch名を保存します。手動で削除しないでください`,
    'init.issueAutoTitle': 'プロジェクト初期化',
    'init.bodyTemplate': `## プロジェクトの目的
（このプロジェクトが解決する問題や提供する価値を一文で）

## ユースケース
（誰が、いつ使う？）

## 技術スタック
- 言語／フレームワーク：
- データストア：
- デプロイ：

---

> このissueはProject Manager拡張機能によってメタデータが管理されています：
> - \`status:*\` ラベルはボードカラムに対応
> - \`priority:*\` ラベルは緊急度を示します
> - body末尾の \`<!-- pm-meta -->\` はリンクされたbranchです。手動で削除しないでください`
  }
};
// 從 chrome.i18n 偵測使用者語言，無支援語系時退回 en
function detectLocale() {
  let lang = 'en';
  try {
    lang = chrome.i18n.getUILanguage() || navigator.language || 'en';
  } catch (e) {
    lang = navigator.language || 'en';
  }
  if (lang.startsWith('zh-TW') || lang.startsWith('zh-Hant') || lang === 'zh') {
    return 'zh-TW';
  }
  if (lang.startsWith('ja')) {
    return 'ja';
  }
  return 'en';
}
let CURRENT_LOCALE = detectLocale();
// 從 chrome.storage 讀取使用者覆寫的語系設定，沒有設則沿用瀏覽器偵測值
async function loadUserLocale() {
  try {
    const { language } = await chrome.storage.sync.get('language');
    if (language && I18N_STRINGS[language]) {
      CURRENT_LOCALE = language;
    }
  } catch (e) {
    // 忽略，沿用 detectLocale
  }
}
// 設定使用者覆寫語系（'' 代表自動跟隨瀏覽器）
async function setUserLocale(locale) {
  if (!locale) {
    await chrome.storage.sync.remove('language');
    CURRENT_LOCALE = detectLocale();
  } else if (I18N_STRINGS[locale]) {
    await chrome.storage.sync.set({ language: locale });
    CURRENT_LOCALE = locale;
  }
}
// 取得目前語系下的字串，支援 {key} 樣板插值
function t(key, params) {
  const dict = I18N_STRINGS[CURRENT_LOCALE] || I18N_STRINGS.en;
  const str = dict[key] || I18N_STRINGS.en[key] || key;
  if (!params) {
    return str;
  }
  return str.replace(/\{(\w+)\}/g, (_, k) => params[k] !== undefined ? params[k] : `{${k}}`);
}
// 套用 i18n 到所有帶 data-i18n / data-i18n-placeholder / data-i18n-title / data-i18n-content 的元素
function applyI18nToDOM(root) {
  const scope = root || document;
  scope.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  scope.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  scope.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  // CSS content: attr() 用，例如「未儲存」pill
  scope.querySelectorAll('[data-i18n-attr]').forEach(el => {
    el.setAttribute(el.dataset.i18nAttrTarget || 'data-label', t(el.dataset.i18nAttr));
  });
}