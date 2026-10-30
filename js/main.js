// main.js：程式進入點，填 KPI 數字、啟動三個區塊的圖表

function fillKpis() {
  const k = DATA.kpi;
  document.getElementById('kpi-owners').textContent = (k.owners_million / 100).toFixed(1) + ' 億人';
  document.getElementById('kpi-internet').textContent = k.internet_owner_pct + '%';
  document.getElementById('kpi-twh').textContent = Math.round(k.btc_twh_2025) + ' TWh';
  document.getElementById('kpi-taiwan').textContent = k.btc_vs_taiwan_pct + '%';
}

fillKpis();
initOwnership();
initInflation();
initEnergy();

// 視窗大小改變時，所有圖表跟著重新排版
window.addEventListener('resize', () => {
  [mapChart, rankChart, scatterChart, energyChart, compareChart].forEach(c => c && c.resize());
});
