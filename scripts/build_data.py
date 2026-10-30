"""
build_data.py
把 data/raw/ 裡的原始資料整理成網頁要用的 data/data.js

執行方式：python scripts/build_data.py
只用 Python 標準函式庫，不需要安裝任何套件。

輸出成 .js（而不是 .json）的原因：
瀏覽器直接雙擊開啟 index.html（file://）時，fetch() 讀不到本機 JSON，
但 <script src="data/data.js"> 可以，所以老師不用架伺服器也能打開。
"""
import csv
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "data.js"

# 中文國名（網頁顯示用）
ZH = {
    "TUR": "土耳其", "BRA": "巴西", "ZAF": "南非", "NGA": "奈及利亞", "ARG": "阿根廷",
    "NLD": "荷蘭", "ARE": "阿聯", "PRT": "葡萄牙", "NOR": "挪威", "CHE": "瑞士",
    "HRV": "克羅埃西亞", "THA": "泰國", "MYS": "馬來西亞", "AUS": "澳洲", "IDN": "印尼",
    "SGP": "新加坡", "KOR": "南韓", "CHL": "智利", "VNM": "越南", "POL": "波蘭",
    "BGR": "保加利亞", "PHL": "菲律賓", "USA": "美國", "CZE": "捷克", "AUT": "奧地利",
    "CAN": "加拿大", "HUN": "匈牙利", "GRC": "希臘", "IND": "印度", "IRL": "愛爾蘭",
    "HKG": "香港", "SRB": "塞爾維亞", "GBR": "英國", "DNK": "丹麥", "KEN": "肯亞",
    "SWE": "瑞典", "BEL": "比利時", "COL": "哥倫比亞", "MEX": "墨西哥", "DEU": "德國",
    "GHA": "迦納", "NZL": "紐西蘭", "ESP": "西班牙", "TWN": "台灣", "ROU": "羅馬尼亞",
    "FRA": "法國", "SAU": "沙烏地阿拉伯", "ISR": "以色列", "ITA": "義大利", "EGY": "埃及",
    "JPN": "日本", "RUS": "俄羅斯", "CHN": "中國", "MAR": "摩洛哥",
}

# 地區分類（散點圖上色用）
REGION = {
    "亞洲": ["THA", "MYS", "IDN", "SGP", "KOR", "VNM", "PHL", "IND", "HKG", "TWN", "JPN", "CHN"],
    "歐洲": ["NLD", "PRT", "NOR", "CHE", "HRV", "POL", "BGR", "CZE", "AUT", "HUN", "GRC",
             "IRL", "SRB", "GBR", "DNK", "SWE", "BEL", "DEU", "ESP", "ROU", "FRA", "ITA", "RUS"],
    "美洲": ["BRA", "ARG", "CHL", "USA", "CAN", "COL", "MEX"],
    "非洲": ["ZAF", "NGA", "KEN", "GHA", "EGY", "MAR"],
    "中東": ["TUR", "ARE", "SAU", "ISR"],
    "大洋洲": ["AUS", "NZL"],
}
REGION_OF = {iso: r for r, isos in REGION.items() for iso in isos}


def pearson(xs, ys):
    """皮爾森相關係數 r：-1 完全負相關、0 無關、1 完全正相關"""
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    cov = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    sx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    sy = math.sqrt(sum((y - my) ** 2 for y in ys))
    return cov / (sx * sy)


# ---------- 1. 持有率 ----------
ownership = []
with open(RAW / "ownership_datareportal_2025.csv", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        iso = row["iso3"]
        ownership.append({
            "iso3": iso,
            "en": row["country"],
            "zh": ZH[iso],
            "pct": float(row["ownership_pct"]),
            "region": REGION_OF[iso],
        })
ownership.sort(key=lambda d: d["pct"], reverse=True)
for rank, d in enumerate(ownership, start=1):
    d["rank"] = rank

# ---------- 2. 通膨（World Bank）合併 ----------
wb = json.loads((RAW / "worldbank_inflation_2023_2024.json").read_text(encoding="utf-8"))
scatter = []
missing = []
for d in ownership:
    w = wb.get(d["iso3"])
    if not w or w.get("2024") is None:
        missing.append(d["zh"])  # 例如台灣：World Bank 沒有收錄
        continue
    scatter.append({
        "iso3": d["iso3"], "zh": d["zh"], "en": d["en"], "region": d["region"],
        "own": d["pct"],
        "inf2024": round(w["2024"], 2),
        "inf2023": round(w["2023"], 2),
        "pop": w["pop"],
    })


def corr(year, drop=()):
    rows = [s for s in scatter if s["iso3"] not in drop and s[year] > 0]
    xs = [math.log10(s[year]) for s in rows]  # 通膨差距太大，用 log 才不會被阿根廷拉走
    ys = [s["own"] for s in rows]
    return round(pearson(xs, ys), 2), len(rows)


stats = {}
for year in ("inf2024", "inf2023"):
    r_all, n_all = corr(year)
    r_drop, n_drop = corr(year, drop=("ARG", "TUR"))
    stats[year] = {"r": r_all, "n": n_all, "r_without_ARG_TUR": r_drop, "n_without": n_drop}

# ---------- 3. 比特幣用電（CBECI） ----------
yearly = json.loads((RAW / "cbeci_yearly.json").read_text(encoding="utf-8"))
monthly = json.loads((RAW / "cbeci_annualised_monthly.json").read_text(encoding="utf-8"))
countries = json.loads((RAW / "cbeci_country_electricity.json").read_text(encoding="utf-8"))
cb = json.loads((RAW / "cbeci_stats.json").read_text(encoding="utf-8"))

btc_2025 = dict(yearly)["2025"]
ZH_ELEC = {"CN": "中國", "US": "美國", "IN": "印度", "RU": "俄羅斯", "JP": "日本", "BR": "巴西",
           "CA": "加拿大", "KR": "南韓", "DE": "德國", "FR": "法國", "SA": "沙烏地阿拉伯",
           "ID": "印尼", "IR": "伊朗", "MX": "墨西哥", "TR": "土耳其", "VN": "越南", "IT": "義大利",
           "TW": "台灣", "GB": "英國", "AU": "澳洲", "ES": "西班牙", "TH": "泰國", "ZA": "南非",
           "MY": "馬來西亞", "EG": "埃及", "AE": "阿聯", "PL": "波蘭", "NO": "挪威", "PK": "巴基斯坦",
           "SE": "瑞典", "AR": "阿根廷", "KZ": "哈薩克", "PH": "菲律賓", "NL": "荷蘭", "CO": "哥倫比亞",
           "BD": "孟加拉", "UA": "烏克蘭", "CL": "智利", "FI": "芬蘭", "BE": "比利時", "SG": "新加坡",
           "CH": "瑞士", "HK": "香港", "NZ": "紐西蘭", "DK": "丹麥", "IE": "愛爾蘭", "NG": "奈及利亞"}
elec = [{"code": c, "en": en, "zh": ZH_ELEC.get(c, en), "twh": twh,
         "ratio": round(btc_2025 / twh, 2)} for c, en, twh in countries]

taiwan_twh = next(e["twh"] for e in elec if e["code"] == "TW")

data = {
    "updated": "2026-10-30",
    "kpi": {
        "owners_million": 560,             # Triple-A 2024
        "internet_owner_pct": 9.9,         # DataReportal / GWI
        "btc_twh_2025": btc_2025,          # CBECI 年度合計
        "btc_world_share_pct": cb["bitcoin_share_pct"],
        "btc_vs_taiwan_pct": round(btc_2025 / taiwan_twh * 100),
        "sustainable_pct": cb["sustainable_share_pct_2025"],
    },
    "ownership": ownership,
    "scatter": scatter,
    "scatterMissing": missing,
    "corr": stats,
    "btcYearly": yearly,
    "btcMonthly": monthly,     # [日期, 下限, 最佳估計, 上限]（年化 TWh）
    "btcRange": {"min": cb["min_TWh"], "guess": cb["bitcoin_best_guess_TWh"], "max": cb["max_TWh"]},
    "elec": elec,
    "elecOthers": [
        {"zh": "全球資料中心", "twh": cb["data_centers_TWh"]},
        {"zh": "全球黃金開採", "twh": cb["gold_mining_TWh"]},
        {"zh": "美國所有冰箱", "twh": cb["us_fridges_TWh"]},
        {"zh": "美國所有電視", "twh": cb["us_tvs_TWh"]},
    ],
}

OUT.write_text(
    "// 由 scripts/build_data.py 自動產生，請勿手動修改\n"
    "window.DATA = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n",
    encoding="utf-8",
)
print(f"寫入 {OUT.relative_to(ROOT)}")
print(f"持有率 {len(ownership)} 國；散點 {len(scatter)} 國；缺通膨資料：{missing}")
print("相關係數：", json.dumps(stats, ensure_ascii=False))
print(f"比特幣 2025 年用電 {btc_2025} TWh ＝ 台灣的 {data['kpi']['btc_vs_taiwan_pct']}%")
