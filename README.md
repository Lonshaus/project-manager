# Project Manager

簡化版的 GitHub issue 專案管理 Chrome Extension。把多個 GitHub repo 視為「專案」，提供看板式 issue 管理介面，所有資料以 GitHub 為真相來源。

## 功能

### 專案管理
- 多專案切換：每個 GitHub repo 對應一個專案，下拉選單一鍵切換
- 新增專案時驗證 repo 是否存在（呼叫 `GET /repos/{owner}/{repo}`，404 不寫入）
- 空 repo 自動產生第一個 commit（README.md）讓使用者後續操作有 base branch 可用
- 已有 init issue 的 repo：自動沿用，不重複建立
- 完整移除專案：清除本地快取與 chrome.storage 內的記錄（GitHub 端不動）

### Issue 看板
- 五欄看板：Todo / In Progress / In Review / Done / Canceled
- Issue 卡片顯示類型 badge（bug/feature/init）與緊急度燈號
- 自動 status（依連結的 PR 集合聚合，只給 open issue 用）：
  - 任何 open 非 draft → review
  - 全 open 都是 draft → process
  - **全部 closed/merged → 自動 PATCH issue state=closed → Done**
- 手動切換 status：detail modal 的 status dropdown 提供 Todo / In Progress / In Review / Done 四個選項
  - 選 Todo / In Progress / In Review → state=open（若原本已關閉則自動 reopen）
  - 選 Done → state=closed 且不帶 cancel label
  - Cancel 仍由獨立按鈕觸發（state=closed + cancel label）
- 自動同步狀態到 GitHub label（避免本地與遠端不一致）

### Issue 編輯（Draft 機制）
- 修改 title、body、status、緊急度、開關狀態 → 寫入 in-memory draft，**不立即送 API**
- **點 X 關閉**：背景批次送出（PATCH issue + PUT labels），UI 立即關閉不停頓
- **點 modal 外**：存到 IndexedDB drafts store，下次打開自動載入
- API 失敗自動 fallback 為 draft，不會丟資料
- 卡片有未送出變更時：左側灰色邊條 + 凹陷感 + 右上角「未儲存」標籤
- Modal 重開時若有 draft：banner 顯示「有未送出的變更（X 分鐘前）」+ 捨棄按鈕

### Issue Identifier 與 PR 連結
- 每個 issue 都有一個算出來的識別碼：`{owner}-{issueNumber}`（例 `lonshaus-9`）
- 顯示在 detail modal meta 列，可一鍵複製
- 使用者本機自己創 branch，名稱以 identifier + dash 為前綴：
  ```
  git checkout -b lonshaus-9-add-toolbar
  git push -u origin lonshaus-9-add-toolbar
  ```
- 開 PR 後，extension 透過 `pr.head.ref.startsWith('lonshaus-9-')` 自動匹配 issue
- **多 PR 支援**：一個 issue 可關聯多個 PR，detail modal「LINKED PRS」區塊顯示為可點擊 badge（連到 GitHub PR 頁），帶狀態 dot：綠（open）／灰圈（draft）／紫（merged）／紅（closed）
- **手動連結**：當 branch 沒照命名規則時，可在 detail modal 點「＋ Link PR」輸入 PR 編號手動加入；手動連結存在 issue body 結尾的 `<!-- pm-meta: {"linkedPRs":[...]} -->` 註解
- **全部 PR closed → 自動 Done**：refresh 或開啟 issue 時偵測到 linked PR 全部 closed/merged，自動 PATCH issue state=closed

### 緊急度
- 四級：Low / Medium / High / Urgent
- 視覺化：紅色訊號條 1/2/3 格 + 紅色驚嘆號（Urgent）
- 主畫面卡片標題後 + detail modal Priority dropdown 都看得到
- 儲存為 GitHub label（`priority:low/medium/high/urgent`）

### 留言
- 即時送出（不進 draft），按鈕為 textarea 右下角的藍色紙飛機 icon
- 留言來自 GitHub Issue Comments API

### 設定
- 從右側滑入面板（不另開頁面）
- GitHub Username + Personal Access Token
- 主題：跟隨系統 / 亮色 / 暗色（CSS variables + `prefers-color-scheme`）
- 語言：跟隨瀏覽器 / English / 繁體中文 / 日本語（切換後 reload 頁面套用）

### i18n
- 自有 i18n 系統（`i18n.js`）支援執行時切換（Chrome 內建 `chrome.i18n` API 不支援）
- HTML 用 `data-i18n` / `data-i18n-placeholder` / `data-i18n-title` 屬性
- JS 用 `t(key, params)` 樣板插值
- 三語：en / zh-TW / ja
- Issue 類型（bug/feature）、緊急度（Low/Medium/High/Urgent）、狀態欄位名稱（Todo/In Progress 等）固定英文

## 技術實作

### 真相來源（Source of Truth）

GitHub 為唯一真相來源，沒有任何 metadata 只存在本地：

| 元資料 | 儲存位置 | 格式 |
|---|---|---|
| Issue 標題、內容、開關狀態 | GitHub Issue 標準欄位 | 原生 |
| Status（todo/process/review） | GitHub Label | `status:{key}` |
| Done | GitHub Issue state | `state: closed`（無 `cancel` label） |
| Canceled | GitHub Issue state + label | `state: closed` + `cancel` label |
| 緊急度 | GitHub Label | `priority:{level}` |
| Issue ↔ PR 自動連結 | 純算 + branch 命名約定 | `pr.head.ref.startsWith('${owner}-${number}-')` |
| Issue ↔ PR 手動連結 | Issue body 結尾隱藏註解 | `<!-- pm-meta: {"linkedPRs":[14,15]} -->` |
| 留言 | GitHub Issue Comments | 原生 |

這個設計的好處：重新安裝擴充功能、換瀏覽器、清除本地資料 → 只要重整一次就能完全還原所有元資料，無需匯入匯出，也無需在 issue body 寫任何隱藏 metadata。

### 資料流

讀取（解析 GitHub → 內部格式）：
```
GitHub API → LocalStorage.parseIssueMetadata(issue)
  ├─ labels 過濾 status:* / priority:* / cancel
  └─ body 解析 pm-meta { branch, linkedPRs }
→ { status, urgency, cancelled, branchName, linkedPRs }
```

寫入（內部格式 → GitHub）：
```
編輯動作 → this._detailDraft.{title|body|state|status|urgency|cancelled|linkedPRs}
        → 點 X
        → commitDraft(snapshot)
            ├─ buildIssueLabels: 過濾既有 labels 後加新的 status:* / priority:* / cancel
            ├─ buildIssueBody: displayBody + pm-meta { branch?, linkedPRs? }
            ├─ updateIssue (PATCH title + body + state)
            └─ setIssueLabels (PUT labels)
        → patchIssue 同步本地快取
        → deleteDraft
```

PR 狀態 → Issue status 推算（open issue 用）：
```
getLinkedPRs(issueNumber, legacyBranchName, manualLinkedPRs, prs, owner)
  ├─ identifier prefix 匹配（pr.head.ref.startsWith(`${identifier}-`)）
  ├─ legacy branchName 精準匹配（給舊 issue）
  ├─ manual linkedPRs（pm-meta 陣列）
  └─ 三者去重聯集

computeIssueStatus(...)
  ├─ 沒有 linked PR → null
  ├─ 全部 closed/merged → 'all-closed'（caller 自動 PATCH state=closed → Done）
  ├─ 任何 open 非 draft → 'review'
  └─ 全 open 都 draft → 'process'
```

### 本地快取

IndexedDB（v3 schema）：
- `issues` store：以 `${projectId}_${githubIssueId}` 為 key，避免跨 repo 碰撞，依 `projectId` index 查詢
- `metadata` store：記錄每個專案的最後同步時間
- `drafts` store：以 `${projectId}_${issueNumber}` 為 key，存未送出變更與 `updatedAt` timestamp

`chrome.storage.sync`（跨裝置同步）：
- `githubToken`、`owner`、`projects`、`activeProjectId`、`theme`、`language`

`chrome.storage.local`（裝置本地）：
- `labelsEnsured_{owner}_{repo}`：已建立系統 labels 的 repo 名單，避免每次都跑

### 系統 Labels

第一次操作 repo 時 `ensureSystemLabels` 會：
1. `GET /repos/{owner}/{repo}/labels` 取得既有 labels
2. 比對需要的 8 個系統 label，只 POST 缺的（避免 422 雜訊）
3. 顏色固定：status 跟看板燈號同色、priority 由淺紅到深紅遞增

8 個系統 label：
- `status:todo` `status:process` `status:review` `status:done`
- `priority:low` `priority:medium` `priority:high` `priority:urgent`

UI 顯示時自動過濾掉這些系統 label，避免和 type label 混在一起。

### Draft 系統

設計目標：使用者改完就走、不停頓、不丟資料。

關鍵實作：
- 編輯動作只更新 `_detailDraft`，**完全不碰 API**
- `mergedDetailIssue()` 把 draft 蓋在 fresh issue 上提供顯示
- X 關閉：snapshot 完整 draft 狀態 → 立即關 modal → 背景 fire-and-forget commit
- 點外面：await persistDraft 存到 IDB → 關閉
- API 失敗：catch 後自動 saveDraft，使用者下次開 issue 看到 banner 提示

## 檔案結構

```
├── manifest.json              Manifest V3 設定
├── background.js              Service Worker（攔截圖示點擊開 manager）
├── manager.html / manager.js  主面板（看板、modal、編輯邏輯）
├── settings.js                設定面板邏輯（含主題、語言切換）
├── i18n.js                    自有 i18n（en / zh-TW / ja）
├── github-api.js              GitHub REST + GraphQL 封裝
├── storage.js                 IndexedDB 封裝（含 parseIssueMetadata）
├── theme.js                   主題套用（讀 chrome.storage 並設 data-theme）
├── options.html               chrome://extensions 點「選項」時跳轉到 manager 設定
└── CLAUDE.md                  專案規範文件
```