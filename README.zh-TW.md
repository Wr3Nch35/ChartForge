# ChartForge

---

<p align="center">
  <img src="ChartForge.png" width="160" height="160" alt="ChartForge 圖示">
</p>

<p align="center">
  <a href="README.md">English</a> | <strong>繁體中文</strong>
</p>

ChartForge 是一套可完全離線使用的 Chrome／Microsoft Edge 瀏覽器擴充功能，用來建立適合簡報使用的高解析度圖表。

> ChartForge 完全在瀏覽器內執行，不使用 CDN、外部 API、遠端伺服器或雲端同步。

## 功能特色

---

- 建立圓餅圖、長條圖及折線圖
- 自訂項目名稱、數值與顏色
- 輸出 16:9、4:3、1:1 圖片比例
- 支援 1x 至 4x PNG 輸出解析度
- 切換亮色、暗色及跟隨瀏覽器主題
- 從瀏覽器本機儲存空間恢復最近使用的設定
- 安裝後可完全離線運作

## 下載

---

### 下載 ZIP

1. 開啟 Repository 的 **Code** 選單。
2. 選擇 **Download ZIP**。
3. 下載完成後，將 ZIP 完整解壓縮到固定位置。

> 請勿直接從 ZIP 壓縮檔內載入 ChartForge，必須先完整解壓縮。

### 使用 Git Clone

電腦已安裝 Git 時，可執行：

```bash
git clone https://github.com/YOUR_USERNAME/ChartForge.git
cd ChartForge
```

請將 `YOUR_USERNAME` 替換成實際的 GitHub 使用者名稱或組織名稱。

## 安裝到瀏覽器

---

### Google Chrome

1. 在網址列開啟 `chrome://extensions/`。
2. 開啟「開發人員模式」。
3. 點選「載入未封裝項目」。
4. 選擇下載或 Clone 後的 `ChartForge` 資料夾。
5. 確認所選資料夾內直接包含 `manifest.json`。
6. 可將 ChartForge 固定在瀏覽器工具列。

### Microsoft Edge

1. 在網址列開啟 `edge://extensions/`。
2. 開啟「開發人員模式」。
3. 點選「載入解壓縮的擴充功能」。
4. 選擇下載或 Clone 後的 `ChartForge` 資料夾。
5. 確認所選資料夾內直接包含 `manifest.json`。
6. 可將 ChartForge 固定在瀏覽器工具列。

## 更新

---

取得 Repository 的最新內容：

```bash
git pull
```

接著回到 `chrome://extensions/` 或 `edge://extensions/`，在 ChartForge 卡片上點選「重新載入」。

## 專案結構

---

```text
ChartForge/
├─ manifest.json
├─ popup.html
├─ popup.css
├─ popup.js
├─ chart.html
├─ chart.css
├─ chart.js
├─ shared.js
├─ lib/
│  └─ echarts.min.js
└─ icons/
   ├─ icon16.png
   ├─ icon32.png
   ├─ icon48.png
   └─ icon128.png
```

ChartForge 不需要執行 `npm install`，也不需要 Vite、開發伺服器或網路連線。
