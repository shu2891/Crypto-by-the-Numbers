// theme.js：所有圖表共用的顏色和小工具

const COLORS = {
  ink: '#1d2433',
  muted: '#667085',
  grid: '#ece7dc',
  teal: '#0f766e',
  tealLight: '#99d5cb',
  orange: '#e8590c',
  orangeLight: '#ffc9a3',
  // 散點圖的地區顏色
  region: {
    '亞洲': '#0f766e',
    '歐洲': '#3b82f6',
    '美洲': '#e8590c',
    '非洲': '#a16207',
    '中東': '#be185d',
    '大洋洲': '#7c3aed'
  }
};

const FONT = '"Noto Sans TC", "Microsoft JhengHei", sans-serif';

// 共用的 tooltip 樣式
const TOOLTIP = {
  backgroundColor: '#fff',
  borderColor: '#e4ded1',
  textStyle: { color: COLORS.ink, fontFamily: FONT, fontSize: 13 },
  extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,.12); border-radius: 6px;'
};

// 共用的座標軸樣式
const AXIS = {
  axisLine: { lineStyle: { color: COLORS.grid } },
  axisTick: { show: false },
  axisLabel: { color: COLORS.muted, fontFamily: FONT },
  splitLine: { lineStyle: { color: COLORS.grid, type: 'dashed' } },
  nameTextStyle: { color: COLORS.muted, fontFamily: FONT }
};

// 皮爾森相關係數（跟 build_data.py 裡的公式一樣）
function pearson(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let cov = 0, sx = 0, sy = 0;
  for (let i = 0; i < n; i++) {
    cov += (xs[i] - mx) * (ys[i] - my);
    sx += (xs[i] - mx) ** 2;
    sy += (ys[i] - my) ** 2;
  }
  return cov / Math.sqrt(sx * sy);
}

// 讓一組按鈕只能選一個，選了之後呼叫 onChange(按鈕)
function setupButtons(groupId, onChange) {
  const buttons = document.querySelectorAll('#' + groupId + ' button');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      onChange(btn);
    });
  });
}
