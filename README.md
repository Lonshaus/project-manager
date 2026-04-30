# Project Manager

簡化版的 GitHub issue 專案管理 Chrome Extension。

## 功能

- 管理多個 GitHub repo（專案）
- 切換專案查看對應的 issues
- 按需同步（重整按鈕）
- 設定面板從右側滑入，不開新頁面
- 暗黑模式（跟隨系統 / 亮色 / 暗色）

## 檔案結構

```
├── manifest.json
├── popup.html / popup.js       工具列按鈕
├── manager.html / manager.js   全畫面管理面板
├── settings.js                 設定面板邏輯
├── options.html                跳轉至 manager（設定入口）
├── github-api.js               GitHub API 封裝
├── storage.js                  IndexedDB 本地快取
└── theme.js                    主題套用邏輯
```

## 資料儲存

- **主儲存**：GitHub API（issues、labels）
- **本地快取**：IndexedDB，以 projectId 區分不同專案的 issues
- **設定**：chrome.storage.sync（token、projects、activeProjectId、theme）

## 開發進度

- [x] manifest.json 基本結構
- [x] GitHub API 認證和 token 管理
- [x] IndexedDB 本地快取（多專案支援）
- [x] 全畫面管理面板（新 tab）
- [x] 設定面板（右側滑入）
- [x] 多個專案切換
- [x] 暗黑模式
- [ ] 新增 issue
- [ ] 編輯 / 關閉 issue