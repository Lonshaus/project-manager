# Chrome Web Store Listing 文案

本檔收集送審 Chrome Web Store 時開發者後台會用到的所有文字內容。送審時逐欄複製貼上即可。所有長度限制依 CWS 2025 表單實況。

---

## 1. Short summary（132 字符上限）

### English（default locale）

> Lightweight GitHub issue project manager with a five-column kanban, native sub-issues, and automatic PR↔issue linking.

### 繁體中文

> 輕量化 GitHub Issue 專案管理工具，五欄看板、原生 Sub-issue、自動 PR↔Issue 連結，所有資料以 GitHub 為唯一真相來源。

### 日本語

> GitHub Issue を軽量に管理。5列カンバン、ネイティブ Sub-issue、PR↔Issue 自動リンク。データは GitHub を単一の真実とします。

---

## 2. Detailed description

### English

```
Project Manager turns any GitHub repository into a kanban-style project board, directly inside Chrome.

What it does
• Five-column board: Todo / In Progress / In Review / Done / Cancelled
• Native sub-issue support via GitHub's official sub-issue API (no metadata stored locally)
• Automatic PR↔Issue linking by branch naming convention ({owner}-{issueNumber}-{slug}); manual linking is also supported
• Auto status sync: when all linked PRs are merged or closed, the issue is closed and moved to Done automatically; while any linked PR is open and not draft, the issue moves to In Review; if every open linked PR is draft, the issue stays In Progress
• Urgency tagging with four levels (Low / Medium / High / Urgent)
• Inline editing with a draft system: changes are kept locally and committed on close, never blocking the UI
• Three-language UI (English / 繁體中文 / 日本語), light / dark / system theme

Source of truth
Everything lives on GitHub. Status is stored as labels (status:todo / process / review). Cancelled is GitHub state=closed plus a "cancel" label. PR↔Issue links are derived from branch names, with optional manual links stored as a hidden metadata comment in the issue body. Uninstall the extension and your data is intact on GitHub.

Permissions
• storage: needed to keep your GitHub Personal Access Token, project list, theme and language preference inside Chrome's local storage. Nothing is sent to any third party.
• host access to api.github.com: needed to call GitHub's REST and GraphQL APIs.

Source code
https://github.com/Lonshaus/project-manager
```

### 繁體中文

```
Project Manager 將任何 GitHub repository 直接在 Chrome 內呈現為看板式專案管理介面。

功能
• 五欄看板：Todo / In Progress / In Review / Done / Cancelled
• 原生 Sub-issue：透過 GitHub 官方 sub-issue API 維護親子關係，本機完全不存 metadata
• PR↔Issue 自動連結：依 branch 命名 ({owner}-{issueNumber}-{slug}) 自動配對；也支援手動連結
• 狀態自動同步：linked PR 全部 merge/closed → 自動關閉 issue 進 Done；有 open 非 draft PR → In Review；全 open 都 draft → In Progress
• 四級緊急度標記（Low / Medium / High / Urgent）
• 內建 Draft 機制：編輯隨改隨走，關閉 modal 時批次送出，UI 不卡頓
• 三語介面（英 / 繁中 / 日），亮色 / 暗色 / 跟隨系統主題

真相來源
所有資料以 GitHub 為唯一來源。狀態以 label 儲存（status:todo / process / review）。Cancelled 為 state=closed + 「cancel」label。PR↔Issue 連結由 branch 名稱推算，手動連結存在 issue body 的隱藏註解。移除 extension 後資料仍完整留在 GitHub。

權限說明
• storage：本機保存 GitHub Personal Access Token、專案清單、主題與語系設定，不傳送至任何第三方。
• api.github.com host access：呼叫 GitHub REST 與 GraphQL API 所需。

原始碼
https://github.com/Lonshaus/project-manager
```

### 日本語

```
Project Manager は、任意の GitHub リポジトリを Chrome 上のカンバン型プロジェクト管理画面に変換します。

機能
• 5列カンバン：Todo / In Progress / In Review / Done / Cancelled
• ネイティブ Sub-issue：GitHub 公式 sub-issue API を利用、ローカルにメタデータを保存しません
• PR↔Issue 自動リンク：ブランチ命名規則（{owner}-{issueNumber}-{slug}）で自動マッチ。手動リンクも可
• ステータス自動同期：紐づく PR がすべて merge/close → Issue を自動 close（Done へ）。Draft でない open PR があれば In Review、すべて Draft なら In Progress
• 4段階の優先度（Low / Medium / High / Urgent）
• Draft 編集：変更はローカルに保持され、Modal を閉じた際にまとめて送信。操作が止まりません
• 3言語（English / 繁體中文 / 日本語）、ライト / ダーク / システム連動テーマ

真実の源
すべてのデータは GitHub に保存されます。ステータスはラベル（status:todo / process / review）として保存。Cancelled は state=closed と「cancel」ラベルの組み合わせ。PR↔Issue リンクはブランチ名から導出し、手動リンクは Issue 本文の隠しコメントに保存されます。Extension をアンインストールしてもデータは GitHub に残ります。

権限について
• storage：GitHub Personal Access Token、プロジェクト一覧、テーマ・言語設定を Chrome ローカルに保存します。第三者には送信しません。
• api.github.com への host access：GitHub REST / GraphQL API 呼び出しに必要です。

ソースコード
https://github.com/Lonshaus/project-manager
```

---

## 3. Single purpose（送審表單字段）

### English

> Manage GitHub issues as a kanban board inside Chrome, with native sub-issue support and automatic pull-request linking.

### 繁體中文

> 在 Chrome 內以看板形式管理 GitHub Issue，支援原生 Sub-issue 與自動 PR 連結。

---

## 4. Permission justifications（送審表單，每項各一句）

| Permission | Justification（英文版供送審表單填寫） |
|---|---|
| `storage` | Store the user's GitHub Personal Access Token, list of tracked repositories, and UI preferences (theme, language) locally in Chrome. |
| Host: `https://api.github.com/*` | Required to read and write issues, pull requests, labels and sub-issue relationships through GitHub's REST and GraphQL APIs. |

---

## 5. Data usage disclosure（送審表單 Privacy practices）

### 會收集的使用者資料

勾選：
- **Authentication information** — GitHub Personal Access Token

補充說明（送審表單對話框）：

> The user provides their own GitHub Personal Access Token in the settings panel. The token is stored in chrome.storage.sync so it can sync across the user's Chrome instances. The token is only sent to https://api.github.com in standard Authorization headers; it is never transmitted to any other endpoint, server, or third party.

### 不會收集

不勾選：Personally identifiable information、Health information、Financial and payment information、Web history、User activity、Website content。

### Certifications（送審表單最後 3 項勾選）

全部三項都可以勾「Yes / I certify」：

- ✅ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ✅ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ✅ I do not use or transfer user data to determine creditworthiness or for lending purposes.

---

## 6. Remote code 聲明

送審表單勾：**No, I am not using remote code**。

理由（如需補充說明）：

> All third-party libraries (marked, DOMPurify) are bundled in the extension under the `vendor/` directory. The extension does not load, fetch, or execute any code from remote servers.

---

## 7. Privacy policy 全文（建議貼到 GitHub Pages 或 repo 公開頁）

```markdown
# Privacy Policy — Project Manager (Chrome Extension)

_Last updated: 2026-05-13_

## Overview

Project Manager is a Chrome extension that turns GitHub repositories into kanban-style project boards. It is provided as-is by Lonshaus.

## Data we access

The extension only interacts with GitHub on behalf of the user. To do so it asks the user to provide a personal access token (PAT) inside the extension's settings panel.

| Data | Stored where | Purpose | Transmitted to |
|---|---|---|---|
| GitHub Personal Access Token | `chrome.storage.sync` (browser-managed, syncs with the user's Google account) | Authenticate requests to GitHub | api.github.com only, via the standard `Authorization` HTTP header |
| GitHub username | `chrome.storage.sync` | Compose API request URLs | api.github.com only |
| Repository list, active project, theme, language preference | `chrome.storage.sync` | UI state | Not transmitted |
| Cached issues, comments, drafts | `chrome.storage.local` / IndexedDB on the user's device | Offline rendering and unsent-change preservation | Not transmitted |

## Data we do NOT collect

We do not run any backend server. We do not collect analytics, telemetry, usage statistics, IP addresses, or any personal identifier. We do not share, sell, or transfer any data to third parties.

## Third-party services

The only external service the extension contacts is **GitHub** (`https://api.github.com/`). All requests are governed by [GitHub's Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

## User control

- The user may revoke the token at any time from <https://github.com/settings/tokens>.
- Uninstalling the extension removes all locally-cached data; data stored on GitHub is unaffected.
- Clearing the extension's storage from `chrome://extensions` also removes all locally-stored values, including the token.

## Contact

Questions or requests: open an issue at <https://github.com/Lonshaus/project-manager/issues>.
```

---

## 8. 類別建議

CWS Developer Dashboard 上選 **Productivity / Developer Tools**。

---

## 9. 送審後可能補件清單

如果 Google 退件，常見要求：

- Permission justification 寫不夠具體 → 把第 4 節的句子寫詳細點（解釋為什麼這個 permission 是「最低必要」）
- Single purpose 描述過長或多用途 → 縮成單句
- Privacy policy URL 404 → 確認 GitHub Pages 已 publish
- Icon 尺寸 / 透明度 / 比例不符 → 重做 icons（128 必須正方形，建議內容留 padding）