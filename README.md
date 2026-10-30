# Crypto by the Numbers：加密貨幣的真相（初版）

用三組開放資料回答三個問題：

1. **誰在持有加密貨幣？**：世界地圖 + 國家排行長條圖
2. **通膨越高，越多人買加密貨幣嗎？**：散點圖（對數座標）+ 相關係數
3. **比特幣吃掉多少電？**：用電趨勢（折線 + 範圍帶／年度長條）+ 與各國比較長條圖

## 怎麼打開

直接雙擊 `index.html` 就能看，不需要架伺服器。
世界地圖的形狀從網路（jsDelivr）載入，**沒有網路時地圖不會顯示**，其他圖表照常運作。

## 資料夾結構

```
index.html              頁面結構
css/style.css           樣式（配色都在最上面的 :root）
js/theme.js             共用顏色、tooltip 樣式、相關係數、按鈕切換
js/chart-ownership.js   01 地圖 + 排行
js/chart-inflation.js   02 散點圖
js/chart-energy.js      03 用電趨勢 + 比較
js/main.js              程式進入點
data/raw/               原始資料（下載後未修改）
data/data.js            由 build_data.py 產生，網頁讀這個
scripts/build_data.py   資料處理：合併、計算相關係數與倍數
assets/echarts.min.js   Apache ECharts（本機）
```

## 重新產生資料

```
python scripts/build_data.py
```

只用 Python 標準函式庫。會印出相關係數，網頁上的 r 是用同一個公式在瀏覽器重算的，兩邊數字應該一樣。

## 資料來源（擷取日期 2026-10-30）

| 檔案 | 內容 | 來源 |
|---|---|---|
| `ownership_datareportal_2025.csv` | 54 國 16–64 歲網路使用者持有加密貨幣比例 | DataReportal Digital 2025（GWI 問卷），數字經 DemandSage 整理轉載 |
| `worldbank_inflation_2023_2024.json` | CPI 通膨率、人口 | World Bank API，指標 FP.CPI.TOTL.ZG、SP.POP.TOTL |
| `cbeci_yearly.json` | 比特幣每年用電 TWh | Cambridge CBECI API `/cbeci/api/data/yearly/0.05` |
| `cbeci_annualised_monthly.json` | 每月 1 日的年化估計（下限、最佳、上限） | Cambridge CBECI API `/cbeci/api/data/0.05` |
| `cbeci_country_electricity.json` | 各國年用電 | CBECI Comparisons 頁（原始來源 U.S. EIA，約 2019 年） |
| `cbeci_stats.json` | 全球占比、其他用途比較 | CBECI Comparisons 頁、劍橋 2025 挖礦調查 |

全球 5.6 億持有人來自 Triple-A 2024 年報告。

## 已知限制

- 持有率是問卷，只代表網路使用者，而且是二手轉載，報告前建議對照 DataReportal 原始投影片確認。
- World Bank 沒有台灣資料，所以台灣不在散點圖中（可以自己補主計總處的 CPI）。
- 各國用電是 2019 年左右的數字，比特幣是 2025 年，年份不同。
- 地圖使用 Natural Earth 1:110m，新加坡、香港太小所以沒有形狀。

## 待辦（給自己）

- [ ] 改成自己想要的程式架構
- [ ] 確認持有率資料原始出處
- [ ] 補上台灣通膨
- [ ] 記錄自己修改了哪些部分（簡報第 10 頁）

> 初版由 AI（Claude）協助產生，包含資料整理與程式；後續修改請記錄在這裡。
