// chart-ownership.js：第 1 區「誰在持有」— 世界地圖 + 國家排行長條圖

// 地圖檔裡的國名和我們資料的英文名不同的，在這裡對照
const MAP_NAME = {
  USA: 'United States of America',
  KOR: 'South Korea',
  CZE: 'Czechia'
};

let mapChart, rankChart;

function initOwnership() {
  mapChart = echarts.init(document.getElementById('chart-map'));
  rankChart = echarts.init(document.getElementById('chart-rank'));

  drawRank('top');
  setupButtons('rank-filter', btn => drawRank(btn.dataset.filter));

  loadWorldMap();

  // 滑鼠移到長條圖 → 地圖上同一個國家也亮起來
  rankChart.on('mouseover', params => {
    const d = DATA.ownership.find(c => c.zh === params.name);
    if (d) mapChart.dispatchAction({ type: 'highlight', name: MAP_NAME[d.iso3] || d.en });
  });
  rankChart.on('mouseout', () => mapChart.dispatchAction({ type: 'downplay' }));
}

// ---------- 排行長條圖 ----------
function drawRank(filter) {
  let list = DATA.ownership;
  if (filter === 'top') list = list.slice(0, 15);
  if (filter === 'asia') list = list.filter(d => d.region === '亞洲');

  // 長條圖由上到下排，所以要反過來（ECharts 的 y 軸由下往上）
  list = list.slice().reverse();

  rankChart.setOption({
    tooltip: {
      ...TOOLTIP,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: p => {
        const d = list[p[0].dataIndex];
        return `<b>${d.zh}</b> ${d.en}<br>持有率 <b>${d.pct}%</b><br>54 國中第 ${d.rank} 名`;
      }
    },
    grid: { left: 90, right: 50, top: 28, bottom: 30 },
    xAxis: { ...AXIS, type: 'value', axisLabel: { ...AXIS.axisLabel, formatter: '{value}%' } },
    yAxis: {
      ...AXIS,
      type: 'category',
      data: list.map(d => d.zh),
      axisLabel: { ...AXIS.axisLabel, color: COLORS.ink, interval: 0, fontSize: list.length > 20 ? 10 : 12 },
      splitLine: { show: false }
    },
    series: [{
      type: 'bar',
      barMaxWidth: 18,
      data: list.map(d => ({
        value: d.pct,
        // 台灣用橘色標出來
        itemStyle: { color: d.iso3 === 'TWN' ? COLORS.orange : COLORS.teal, borderRadius: [0, 3, 3, 0] }
      })),
      label: { show: list.length <= 20, position: 'right', formatter: '{c}%', color: COLORS.muted, fontSize: 11 },
      // 全球平均的參考線
      markLine: {
        symbol: 'none',
        silent: true,
        lineStyle: { color: COLORS.ink, type: 'dashed' },
        label: { formatter: '全球平均 9.9%', position: 'end', color: COLORS.ink, fontSize: 11 },
        data: [{ xAxis: DATA.kpi.internet_owner_pct }]
      }
    }]
  }, true);
}

// ---------- 世界地圖 ----------
// 地圖形狀從網路載入（Natural Earth 1:110m，台灣是獨立區塊）
// 如果沒網路，地圖會顯示提示，其它圖表照常運作
const TOPOJSON_URL = 'https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js';
const WORLD_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function loadWorldMap() {
  mapChart.showLoading({ text: '地圖載入中…', color: COLORS.teal });
  try {
    await loadScript(TOPOJSON_URL);
    const topo = await fetch(WORLD_URL).then(r => r.json());
    const geo = topojson.feature(topo, topo.objects.countries);
    // 拿掉南極洲，地圖比較好看
    geo.features = geo.features.filter(f => f.properties.name !== 'Antarctica');
    echarts.registerMap('world', geo);
    mapChart.hideLoading();
    drawMap();
  } catch (err) {
    mapChart.hideLoading();
    document.getElementById('map-note').textContent = '⚠ 地圖需要網路連線才能載入，請連上網路後重新整理。右邊排行圖不受影響。';
  }
}

function drawMap() {
  mapChart.setOption({
    tooltip: {
      ...TOOLTIP,
      trigger: 'item',
      formatter: p => p.data ? `<b>${p.data.zh}</b><br>持有率 <b>${p.data.value}%</b>` : `${p.name}<br>無調查資料`
    },
    visualMap: {
      min: 0,
      max: 26,
      left: 10,
      bottom: 10,
      text: ['26%', '0%'],
      calculable: true,
      inRange: { color: ['#e0f2ef', '#5eb8a9', '#0f766e', '#073b36'] },
      textStyle: { color: COLORS.muted }
    },
    series: [{
      type: 'map',
      map: 'world',
      roam: true,          // 可以拖曳、滾輪縮放
      zoom: 1.15,
      itemStyle: { areaColor: '#ebe6db', borderColor: '#fff', borderWidth: 0.5 },
      emphasis: { label: { show: false }, itemStyle: { areaColor: COLORS.orange } },
      select: { disabled: true },
      data: DATA.ownership.map(d => ({
        name: MAP_NAME[d.iso3] || d.en,
        value: d.pct,
        zh: d.zh
      }))
    }]
  });
}
