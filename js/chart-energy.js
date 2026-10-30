// chart-energy.js：第 3 區「比特幣用電」— 趨勢圖 + 比較長條圖

let energyChart, compareChart;

function initEnergy() {
  energyChart = echarts.init(document.getElementById('chart-energy'));
  compareChart = echarts.init(document.getElementById('chart-compare'));

  drawEnergyBand();
  setupButtons('energy-mode', btn => {
    if (btn.dataset.mode === 'band') drawEnergyBand();
    else drawEnergyYearly();
  });

  drawCompare('near');
  setupButtons('compare-mode', btn => drawCompare(btn.dataset.mode));
}

// ---------- 趨勢圖 A：每月的年化估計（含上下限） ----------
function drawEnergyBand() {
  const rows = DATA.btcMonthly;           // [日期, 下限, 最佳估計, 上限]
  const dates = rows.map(r => r[0]);
  const low = rows.map(r => r[1]);
  const guess = rows.map(r => r[2]);
  const range = rows.map(r => +(r[3] - r[1]).toFixed(2));   // 上限 - 下限 = 帶狀高度

  document.getElementById('energy-note').textContent =
    '深色線是最佳估計，淺色帶是可能範圍（下限～上限），單位 TWh／年。';

  energyChart.setOption({
    tooltip: {
      ...TOOLTIP,
      trigger: 'axis',
      formatter: p => {
        const i = p[0].dataIndex;
        return `<b>${dates[i].slice(0, 7)}</b><br>最佳估計 <b>${guess[i]} TWh</b><br>範圍 ${rows[i][1]} ～ ${rows[i][3]} TWh`;
      }
    },
    grid: { left: 50, right: 20, top: 34, bottom: 30 },
    xAxis: {
      ...AXIS,
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLabel: { ...AXIS.axisLabel, formatter: v => v.slice(0, 4), interval: 11 },
      splitLine: { show: false }
    },
    yAxis: { ...AXIS, type: 'value', name: 'TWh／年' },
    series: [
      // 帶狀區域的做法：先畫一條透明的「下限」，再疊一層「上限-下限」並填色
      { name: '下限', type: 'line', data: low, stack: 'band', symbol: 'none', lineStyle: { opacity: 0 } },
      {
        name: '範圍', type: 'line', data: range, stack: 'band', symbol: 'none',
        lineStyle: { opacity: 0 }, areaStyle: { color: COLORS.orangeLight, opacity: 0.6 }
      },
      {
        name: '最佳估計', type: 'line', data: guess, symbol: 'none',
        lineStyle: { color: COLORS.orange, width: 2.5 },
        // 2021 年 6 月中國全面禁止挖礦，用一條直線標出來
        markLine: {
          symbol: 'none',
          silent: true,
          lineStyle: { color: COLORS.muted, type: 'dashed' },
          label: { formatter: '2021 中國禁止挖礦', color: COLORS.ink, fontSize: 11 },
          data: [{ xAxis: '2021-07-01' }]
        }
      }
    ]
  }, true);
}

// ---------- 趨勢圖 B：每年的實際總和 ----------
function drawEnergyYearly() {
  const rows = DATA.btcYearly.filter(r => +r[0] >= 2014);
  document.getElementById('energy-note').textContent =
    '每年實際用掉的電（每日估計加總），單位 TWh。2025 年約 189 TWh。';

  energyChart.setOption({
    tooltip: { ...TOOLTIP, trigger: 'axis', valueFormatter: v => v + ' TWh' },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: { ...AXIS, type: 'category', data: rows.map(r => r[0]), splitLine: { show: false } },
    yAxis: { ...AXIS, type: 'value', name: 'TWh' },
    series: [{
      name: '年度用電',
      type: 'bar',
      data: rows.map(r => r[1]),
      itemStyle: { color: COLORS.orange, borderRadius: [3, 3, 0, 0] },
      label: { show: true, position: 'top', fontSize: 10, color: COLORS.muted, formatter: p => Math.round(p.value) }
    }]
  }, true);
}

// ---------- 比較長條圖 ----------
function drawCompare(mode) {
  const btc = DATA.kpi.btc_twh_2025;
  let items;

  if (mode === 'near') {
    // 用電量跟比特幣最接近的 10 個國家
    items = DATA.elec.slice()
      .sort((a, b) => Math.abs(a.twh - btc) - Math.abs(b.twh - btc))
      .slice(0, 10)
      .map(e => ({ name: e.zh, twh: e.twh }));
  } else if (mode === 'asia') {
    const asia = ['TW', 'KR', 'JP', 'VN', 'TH', 'MY', 'PH', 'SG', 'HK'];
    items = DATA.elec.filter(e => asia.includes(e.code)).map(e => ({ name: e.zh, twh: e.twh }));
  } else {
    items = DATA.elecOthers.map(e => ({ name: e.zh, twh: e.twh }));
  }

  // 加入比特幣自己，再由大到小排序
  items.push({ name: '比特幣', twh: btc, isBtc: true });
  items.sort((a, b) => a.twh - b.twh);

  compareChart.setOption({
    tooltip: {
      ...TOOLTIP,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: p => {
        const it = items[p[0].dataIndex];
        if (it.isBtc) return `<b>比特幣</b>（2025）<br>${it.twh} TWh`;
        return `<b>${it.name}</b><br>${it.twh} TWh<br>比特幣是它的 <b>${(btc / it.twh * 100).toFixed(0)}%</b>`;
      }
    },
    grid: { left: 90, right: 60, top: 10, bottom: 30 },
    xAxis: { ...AXIS, type: 'value', name: 'TWh' },
    yAxis: {
      ...AXIS,
      type: 'category',
      data: items.map(i => i.name),
      axisLabel: { ...AXIS.axisLabel, color: COLORS.ink, interval: 0 },
      splitLine: { show: false }
    },
    series: [{
      type: 'bar',
      barMaxWidth: 18,
      data: items.map(i => ({
        value: i.twh,
        itemStyle: { color: i.isBtc ? COLORS.orange : '#c9c2b3', borderRadius: [0, 3, 3, 0] }
      })),
      label: { show: true, position: 'right', fontSize: 11, color: COLORS.muted, formatter: p => Math.round(p.value) }
    }]
  }, true);
}
