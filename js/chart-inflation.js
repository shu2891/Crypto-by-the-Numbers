// chart-inflation.js：第 2 區「通膨 × 持有率」散點圖

let scatterChart;
let infYear = 'inf2024';     // 目前用哪一年的通膨
let dropOutliers = false;    // 是否排除阿根廷、土耳其

function initInflation() {
  scatterChart = echarts.init(document.getElementById('chart-scatter'));

  setupButtons('inf-year', btn => {
    infYear = btn.dataset.year;
    drawScatter();
  });
  document.getElementById('drop-outliers').addEventListener('change', e => {
    dropOutliers = e.target.checked;
    drawScatter();
  });

  drawScatter();
}

function drawScatter() {
  // 1. 篩選資料（對數軸不能有 0 或負數，所以只留通膨 > 0 的國家）
  let rows = DATA.scatter.filter(d => d[infYear] > 0);
  if (dropOutliers) rows = rows.filter(d => d.iso3 !== 'ARG' && d.iso3 !== 'TUR');

  // 2. 重新計算相關係數（通膨取 log10）
  const r = pearson(rows.map(d => Math.log10(d[infYear])), rows.map(d => d.own));
  document.getElementById('corr-r').textContent = r.toFixed(2);
  document.getElementById('corr-text').textContent =
    `（${rows.length} 國，` + describeR(r) + '）';

  // 3. 每個地區一組 series，這樣圖例可以點選開關
  const regions = Object.keys(COLORS.region);
  const series = regions.map(region => ({
    name: region,
    type: 'scatter',
    data: rows.filter(d => d.region === region).map(d => ({
      value: [d[infYear], d.own],
      name: d.zh,
      pop: d.pop,
      en: d.en
    }))
  }));
  series.forEach(s => {
    // 點的大小跟人口開根號成正比，避免印度、中國大到蓋住別人
    s.symbolSize = (val, params) => 8 + Math.sqrt(params.data.pop / 1e6) * 1.1;
    s.itemStyle = { color: COLORS.region[s.name], opacity: 0.8, borderColor: '#fff', borderWidth: 1 };
    s.emphasis = { focus: 'self', itemStyle: { opacity: 1 } };
    // 只幫幾個「故事主角」加上名字
    s.label = {
      show: true,
      position: 'right',
      fontSize: 11,
      color: COLORS.ink,
      formatter: p => ['阿根廷', '土耳其', '奈及利亞', '埃及', '泰國', '中國', '美國', '迦納', '南非'].includes(p.name) ? p.name : ''
    };
  });

  scatterChart.setOption({
    tooltip: {
      ...TOOLTIP,
      trigger: 'item',
      formatter: p => `<b>${p.name}</b> ${p.data.en}<br>` +
        `通膨率 <b>${p.value[0].toFixed(1)}%</b><br>` +
        `持有率 <b>${p.value[1]}%</b><br>` +
        `人口 ${(p.data.pop / 1e6).toFixed(1)} 百萬`
    },
    legend: { top: 0, textStyle: { color: COLORS.ink, fontFamily: FONT } },
    grid: { left: 60, right: 40, top: 46, bottom: 50 },
    xAxis: {
      ...AXIS,
      type: 'log',
      name: (infYear === 'inf2024' ? '2024' : '2023') + ' 年通膨率（對數刻度）',
      nameLocation: 'middle',
      nameGap: 32,
      min: 0.1,
      max: 300,
      axisLabel: { ...AXIS.axisLabel, formatter: v => v + '%' }
    },
    yAxis: {
      ...AXIS,
      type: 'value',
      name: '加密貨幣持有率',
      max: 30,
      axisLabel: { ...AXIS.axisLabel, formatter: '{value}%' }
    },
    series: series
  }, true);
}

function describeR(r) {
  const a = Math.abs(r);
  if (a < 0.2) return '幾乎沒有相關';
  if (a < 0.4) return '弱到中度相關';
  if (a < 0.7) return '中度相關';
  return '強相關';
}
