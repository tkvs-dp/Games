# Save Point · 我的遊戲收藏

手機優先靜態網站。直接開啟 `index.html` 即可使用；也可以在本資料夾執行 `python -m http.server 5181`，瀏覽 http://localhost:5181。

### 提示詞

建立一個手機優先的「我的遊戲收藏」靜態網站。
- 網站以真正喜歡玩的遊戲為核心，不要做成普通遊戲資料庫。
- 每款遊戲包含遊戲介紹、玩法、推薦原因與個人遊玩心得。(可以參考 Steam)
- 首頁要有明顯的遊戲世界氣氛與視覺特色。
- 加入可以直接在網頁中玩的簡單迷你遊戲或互動挑戰。
- 可以使用 SVG、JavaScript、Three.js 或可持續的動畫效果增加遊戲感。
- 使用 frontend-design Skill，並遵循 DESIGN.md。
- 手機上必須能順暢操作網站與迷你遊戲。

遊戲清單
- Minecraft
- Plants vs. Zombies
- Hollow Knight
- ゼルダの伝説ブレスオブザワイルド
- The Witcher 3: Wild Hunt

我不喜歡迷你挑戰，移除它，改做成類似 Hollow Knight 的 2D橫向卷軸跳躍遊戲，位置不要放在現在收藏筆記的右側，改到下方已佔據更多版面方便使用者操作

五款遊戲可透過卡匣或首頁方向鍵切換。每篇包含介紹、玩法、推薦原因、遊玩心得和官方來源。第一人稱心得是示範稿，可在 `app.js` 的 `games` 陣列替換成實際經驗。

「微光遺跡」位於收藏筆記下方，是可直接遊玩的 2D 橫向卷軸平台遊戲。用雙段跳躍、空中衝刺穿過洞窟，沿途自由收集五枚微光，並抵達光門。沿途的存檔燈可作為受傷後的重生位置。

操作：方向鍵或 A / D 移動；空白鍵、W 或上方向鍵跳躍；Shift 或 X 衝刺；P 暫停。手機可同時按住方向鍵與跳躍／衝刺鍵。離開遊戲畫面或切換分頁會暫停，可手動繼續。生命耗盡後可重試，抵達終點後可重玩。

## 檔案

- `index.html`：主頁與內容說明。
- `style.css`：響應式主機面板設計。
- `app.js`：遊戲文案與切換行為。
- `platformer.js`：Canvas 遊戲、物理、關卡、觸控操作與狀態管理。
- `assets/`：本機遊戲圖片及網站圖示。
- `nintendo-2001-DESIGN.md`：使用者提供的設計規範。
- `DESIGN-PLAN.md`：規範到手機版型的設計安排。

## 驗證

安裝 Playwright（`npm install --no-save playwright`、`npx playwright install chromium`），啟動上述伺服器後執行 `node tests/check.mjs` 與 `node tests/play.mjs`。測試亦可使用工作區現有的 Playwright。結果與桌面、手機、闖關截圖存於 `tests/artifacts/`。

圖片源自 Minecraft 官方網站、Nintendo 官方網站與 Steam CDN，權利屬各遊戲原權利人。素材與介紹來源見頁尾與各篇筆記連結。

已驗證：320 / 390 / 768 / 1440px 全寬排列、完整關卡通關、兩個存檔燈、雙段跳、衝刺、受傷與生命耗盡、暫停／繼續、重玩，以及手機多點觸控的移動＋跳躍和按鍵釋放。
