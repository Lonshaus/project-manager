# Chrome Web Store 送審指南

本文件記錄 Project Manager extension 上架 Chrome Web Store 的完整流程，後續每次發版都照表操作。

---

## 0. 前置條件（一次性）

- [ ] 申請 [Chrome Web Store Developer 帳號](https://chrome.google.com/webstore/devconsole)（USD 5 一次性）
- [ ] 該 Google 帳號完成發行者驗證（綁定可驗證的 email）

---

## 1. 送審前 checklist

### 1.1 程式碼

- [ ] `manifest.json` `version` 已 bump（例如從 `0.1.0` → `1.0.0`）
- [ ] `manifest.json` 內已宣告 `icons`（16 / 32 / 48 / 128）與 `action.default_icon`
- [ ] `_locales/{en, zh_TW, ja}/messages.json` 內容已 review
- [ ] 本機 `Load unpacked` 載入測試一輪：登 token → 新增專案 → 開 issue → sub-issue → merge PR auto-close 全部跑過

### 1.2 圖片素材（**使用者需另行準備**，未含在本 repo）

- [ ] **Icons**（PNG，**透明背景，正方形**，建議內容留 12% padding）
   - `icons/icon-16.png`
   - `icons/icon-32.png`
   - `icons/icon-48.png`
   - `icons/icon-128.png`
- [ ] **Store icon**：另外的 128×128，可與 manifest 內 icon-128 共用同一張
- [ ] **截圖**：1280×800 **或** 640×400 的 PNG / JPG，1–5 張
   - 推薦張數：3 張，分別呈現「看板總覽」「Issue detail modal」「設定面板」
- [ ] **Small promo tile**（選填但推薦）：440×280 PNG

> 圖片做好後請放到 repo 根目錄的 `icons/` 與 `screenshots/`（或任何位置），並把 icons 路徑寫進 `manifest.json`。

### 1.3 隱私權頁面

- [ ] 把 `STORE_LISTING.md` 第 7 節「Privacy policy 全文」貼到一個**公開 URL**
   - 推薦：repo 開啟 GitHub Pages，建立 `docs/privacy.md`
   - 或：直接以該 commit 永久連結（permalink）形式提供

---

## 2. 打包 zip

CWS 要求上傳 zip。**zip 內必須是檔案直接在根目錄**，不能包一層資料夾。

### 排除清單

| 路徑 | 為什麼排除 |
|---|---|
| `.git/`、`.gitignore` | 版本控制資料夾 |
| `.claude/` | 開發者私用 |
| `.DS_Store` | macOS 系統檔 |
| `CLAUDE.md` | 開發者規範文件 |
| `RELEASE.md`、`STORE_LISTING.md` | 上架流程文件 |
| `README.md` | 開發者文件（送審 description 不從這裡讀） |
| `screenshots/`（若放在 repo） | 商店素材，非執行碼 |

### 指令範例（macOS / Linux）

從 repo 根目錄執行：

```sh
# 1. 確認當下在乾淨的 master HEAD（沒未 commit 改動）
git status

# 2. 建立打包暫存
rm -rf .build && mkdir .build && cp -R . .build/pm && cd .build/pm

# 3. 移除不該進 zip 的項目（注意：在 .build/pm 內操作）
rm -rf .git .claude .DS_Store CLAUDE.md RELEASE.md STORE_LISTING.md README.md screenshots .gitignore .build

# 4. 確認 manifest.json 在根目錄
ls manifest.json

# 5. 打包
zip -r ../project-manager.zip . -x "*.DS_Store"

# 6. 回到 repo 根目錄，產物在 .build/project-manager.zip
cd ../..
ls -lh .build/project-manager.zip
```

### 上傳前最後檢查

```sh
unzip -l .build/project-manager.zip | head -30
```

確認：
- `manifest.json` 在第一層
- 沒看到 `.git`、`.claude`、`CLAUDE.md`
- `_locales/` 結構完整
- `icons/`（如已加入 manifest）已在內

---

## 3. CWS Developer Dashboard 操作

1. 進 <https://chrome.google.com/webstore/devconsole>
2. 點「New item」→ 上傳 `project-manager.zip`
3. 等系統自動解析 manifest（30 秒內）
4. 進入該 item 的 listing 編輯頁，依下表逐欄填寫——文字全部從 `STORE_LISTING.md` 複製：

   | 欄位 | 來源 |
   |---|---|
   | Short description | `STORE_LISTING.md` § 1（先填英文，其他語系於 Language 區塊另填） |
   | Detailed description | `STORE_LISTING.md` § 2 |
   | Category | Productivity 或 Developer Tools（見 § 8） |
   | Language | Add 「English」「Chinese (Traditional)」「Japanese」，各填對應描述 |
   | Store icon | 128×128 PNG |
   | Screenshots | 上傳 1–5 張 |
   | Promo tile | 440×280 PNG（選填） |
   | Single purpose | `STORE_LISTING.md` § 3 |
   | Permission justifications | `STORE_LISTING.md` § 4 |
   | Privacy practices → Data usage | `STORE_LISTING.md` § 5 |
   | Privacy policy URL | 1.3 步驟發佈的公開頁面 URL |
   | Remote code | `STORE_LISTING.md` § 6，選「No」 |
   | Distribution | 設 **Unlisted**（私用）或 **Public**（公開） |

5. 全部完成後點「Submit for review」
6. 等待 1–3 個工作天

---

## 4. 送審後追蹤

- **被退件**時，dashboard 會給具體原因。常見原因：
  - Permission justification 過短 → 把 `STORE_LISTING.md` § 4 寫更具體
  - Privacy policy URL 不可訪問 → 確認 GitHub Pages publish 設為 public
  - Icon 比例 / 透明度 / 留白不符 → 重做 128×128
  - Single purpose 寫得太籠統 → 縮成單句、避免「and / 與 / 以及」串多個功能
- 修正後重新送審不另收費

---

## 5. 版本更新流程（每次發版）

1. 修 code、merge 進 master
2. `git pull` 在本機拿到最新
3. `manifest.json` 的 `version` bump（例：`1.0.0` → `1.0.1`）
4. 跑 §2 打包流程
5. CWS dashboard → 該 item → 「Package」→ Upload new package → 上傳新 zip
6. 重新 Submit for review
7. （重要）listing 文案如有改動，到 Store Listing tab 一起更新後再 submit

> Tip：版本號只允許往上走、最多 4 段（`x.y.z.w`），且每段 0–65535。

---

## 6. 緊急下架

若需暫時下架（例如 PAT 處理流程有改）：CWS dashboard → 該 item → 點選「Unpublish」即可，原使用者已安裝版本仍可用，但無法在商店再被找到。

---

## 附錄 A：本 repo 內各檔案在送審流程中的角色

| 檔案 | 角色 | 進 zip？ |
|---|---|---|
| `manifest.json` | 必要、商店根據此檔解析 | ✅ |
| `_locales/` | manifest 多語化資料 | ✅ |
| `background.js` `manager.html` `manager.js` 等 | 執行碼 | ✅ |
| `vendor/` | 第三方 bundle | ✅ |
| `STORE_LISTING.md` | 提供給送審者填表的素材 | ❌ |
| `RELEASE.md` | 本文件 | ❌ |
| `CLAUDE.md` `.claude/` | 開發者規範與 agent 設定 | ❌ |
| `README.md` | repo 介紹 | ❌（送審不從這讀） |
| `icons/` | manifest 引用 | ✅ |
| `screenshots/` | 商店預覽素材 | ❌ |