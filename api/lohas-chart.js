const { fetchHistory } = require('./_lib/yahoo');
const { computeLohas } = require('./_lib/lohas');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

// ─── Chart Configuration ──────────────────────────────────────────────────────
const WIDTH = 1080;
const HEIGHT = 620;

const LINE_COLORS = {
  plus2s: '#f43f5e',
  plus1s: '#f4a0ab',
  trend:  '#8b949e',
  minus1s:'#79c0ff',
  minus2s:'#388bfd',
  close:  '#1a1a2e',
};

const LINE_LABELS = {
  plus2s: '樂觀線（+2σ）',
  plus1s: '相對樂觀（+1σ）',
  trend:  '趨勢線',
  minus1s:'相對悲觀（-1σ）',
  minus2s:'悲觀線（-2σ）',
  close:  '收盤價',
};

// ─── Render PNG ───────────────────────────────────────────────────────────────
async function renderPNG(ticker, data, periodYears, sigmaMult) {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: WIDTH,
    height: HEIGHT,
    backgroundColour: '#ffffff',
  });

  const labels = data.chartData.map(d => d.date);
  const last = data.chartData[data.chartData.length - 1];

  // Show ~6 x-axis labels
  const tickInterval = Math.max(1, Math.floor(labels.length / 6));

  const configuration = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: LINE_LABELS.plus2s,
          data: data.chartData.map(d => d.plus2s),
          borderColor: LINE_COLORS.plus2s,
          borderWidth: 1.5,
          borderDash: [6, 3],
          pointRadius: 0,
          fill: false,
        },
        {
          label: LINE_LABELS.plus1s,
          data: data.chartData.map(d => d.plus1s),
          borderColor: LINE_COLORS.plus1s,
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
        },
        {
          label: LINE_LABELS.trend,
          data: data.chartData.map(d => d.trend),
          borderColor: LINE_COLORS.trend,
          borderWidth: 2,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
        },
        {
          label: LINE_LABELS.minus1s,
          data: data.chartData.map(d => d.minus1s),
          borderColor: LINE_COLORS.minus1s,
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
        },
        {
          label: LINE_LABELS.minus2s,
          data: data.chartData.map(d => d.minus2s),
          borderColor: LINE_COLORS.minus2s,
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
        },
        {
          label: LINE_LABELS.close,
          data: data.chartData.map(d => d.close),
          borderColor: LINE_COLORS.close,
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
        },
      ],
    },
    options: {
      responsive: false,
      animation: false,
      layout: {
        padding: { top: 80, right: 70, bottom: 10, left: 10 },
      },
      scales: {
        x: {
          ticks: {
            callback: function (val, idx) {
              if (idx % tickInterval !== 0) return '';
              const label = labels[idx];
              if (!label) return '';
              // Show year only or year-month
              const d = new Date(label);
              return `${d.getFullYear()}`;
            },
            maxRotation: 0,
            color: '#666',
            font: { size: 12 },
          },
          grid: { display: false },
        },
        y: {
          position: 'left',
          ticks: {
            color: '#666',
            font: { size: 12 },
            callback: (v) => v.toFixed(2),
          },
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            pointStyle: 'line',
            padding: 16,
            font: { size: 11 },
          },
        },
        title: {
          display: true,
          text: `樂活五線譜 — ${ticker}`,
          font: { size: 18, weight: 'bold' },
          color: '#1a1a2e',
          padding: { bottom: 4 },
        },
        subtitle: {
          display: true,
          text: `對數線性迴歸 ± 標準差波段｜使用調整後收盤價｜期間 ${periodYears} 年`,
          font: { size: 12 },
          color: '#888',
          padding: { bottom: 10 },
        },
      },
    },
    plugins: [
      {
        // Draw line value labels on the right side and current price badge
        id: 'lineValueLabels',
        afterDraw(chart) {
          const ctx = chart.ctx;
          const chartArea = chart.chartArea;

          // Draw value labels to the right of chart
          const lineKeys = ['plus2s', 'plus1s', 'trend', 'minus1s', 'minus2s'];
          const lineLabels = {
            plus2s: `${last.plus2s.toFixed(2)}`,
            plus1s: `${last.plus1s.toFixed(2)}`,
            trend:  `${last.trend.toFixed(2)}`,
            minus1s:`${last.minus1s.toFixed(2)}`,
            minus2s:`${last.minus2s.toFixed(2)}`,
          };

          const yScale = chart.scales.y;
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'left';

          for (const key of lineKeys) {
            const val = last[key];
            const y = yScale.getPixelForValue(val);
            const color = LINE_COLORS[key];

            // Draw colored pill background
            const text = lineLabels[key];
            const textWidth = ctx.measureText(text).width;
            const pillX = chartArea.right + 6;
            const pillY = y - 8;
            const pillW = textWidth + 12;
            const pillH = 18;
            const radius = 4;

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(pillX, pillY, pillW, pillH, radius);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.fillText(text, pillX + 6, y + 4);
          }

          // Draw current price badge
          const priceY = yScale.getPixelForValue(data.currentPrice);
          ctx.fillStyle = '#1a1a2e';
          ctx.font = 'bold 12px sans-serif';
          const priceText = `● ${data.currentPrice.toFixed(2)}`;
          const ptw = ctx.measureText(priceText).width;
          // Draw at the right edge
          ctx.fillStyle = '#1a1a2e';
          ctx.beginPath();
          ctx.roundRect(chartArea.right + 6, priceY - 10, ptw + 14, 22, 4);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.fillText(priceText, chartArea.right + 12, priceY + 4);
        },
      },
    ],
  };

  return chartJSNodeCanvas.renderToBuffer(configuration);
}

// ─── Render HTML ──────────────────────────────────────────────────────────────
function renderHTML(ticker, data, periodYears, sigmaMult) {
  const last = data.chartData[data.chartData.length - 1];
  const chartDataJSON = JSON.stringify(data.chartData);

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>樂活五線譜 — ${ticker}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; padding: 24px; }
  .card { background: #fff; border-radius: 16px; padding: 32px; max-width: 1080px; margin: 0 auto; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  h1 { font-size: 22px; color: #1a1a2e; margin-bottom: 4px; }
  .subtitle { color: #888; font-size: 13px; margin-bottom: 20px; }
  .line-values { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-bottom: 16px; }
  .line-tag { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; border: 1.5px solid; }
  .tag-plus2s { color: #f43f5e; border-color: #f43f5e; background: #fff5f5; }
  .tag-plus1s { color: #e88b98; border-color: #f4a0ab; background: #fff9fa; }
  .tag-trend  { color: #666; border-color: #ccc; background: #fafafa; }
  .tag-minus1s { color: #4a9ede; border-color: #79c0ff; background: #f0f8ff; }
  .tag-minus2s { color: #388bfd; border-color: #388bfd; background: #eef6ff; }
  .tag-close { color: #1a1a2e; border-color: #1a1a2e; background: #f0f0f5; }
  .chart-wrap { position: relative; height: 420px; }
</style>
</head>
<body>
<div class="card">
  <h1>樂活五線譜 — ${ticker}</h1>
  <p class="subtitle">對數線性迴歸 ± 標準差波段｜使用調整後收盤價｜期間 ${periodYears} 年</p>
  <div class="line-values">
    <span class="line-tag tag-plus2s">— ${last.plus2s.toFixed(2)}</span>
    <span class="line-tag tag-plus1s">— ${last.plus1s.toFixed(2)}</span>
    <span class="line-tag tag-trend">— ${last.trend.toFixed(2)}</span>
    <span class="line-tag tag-minus1s">— ${last.minus1s.toFixed(2)}</span>
    <span class="line-tag tag-minus2s">— ${last.minus2s.toFixed(2)}</span>
    <span class="line-tag tag-close">● ${data.currentPrice.toFixed(2)}</span>
  </div>
  <div class="chart-wrap">
    <canvas id="chart"></canvas>
  </div>
</div>
<script>
const raw = ${chartDataJSON};
const labels = raw.map(d => d.date);
const tickInterval = Math.max(1, Math.floor(labels.length / 6));
new Chart(document.getElementById('chart'), {
  type: 'line',
  data: {
    labels,
    datasets: [
      { label: '樂觀線（+2σ）', data: raw.map(d=>d.plus2s), borderColor:'#f43f5e', borderWidth:1.5, borderDash:[6,3], pointRadius:0, fill:false },
      { label: '相對樂觀（+1σ）', data: raw.map(d=>d.plus1s), borderColor:'#f4a0ab', borderWidth:1.5, pointRadius:0, fill:false },
      { label: '趨勢線', data: raw.map(d=>d.trend), borderColor:'#8b949e', borderWidth:2, borderDash:[4,4], pointRadius:0, fill:false },
      { label: '相對悲觀（-1σ）', data: raw.map(d=>d.minus1s), borderColor:'#79c0ff', borderWidth:1.5, pointRadius:0, fill:false },
      { label: '悲觀線（-2σ）', data: raw.map(d=>d.minus2s), borderColor:'#388bfd', borderWidth:1.5, pointRadius:0, fill:false },
      { label: '收盤價', data: raw.map(d=>d.close), borderColor:'#1a1a2e', borderWidth:1.5, pointRadius:0, fill:false },
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          callback(val,idx){ return idx%tickInterval===0 ? new Date(labels[idx]).getFullYear() : ''; },
          maxRotation: 0, color:'#666', font:{size:12}
        },
        grid: { display: false }
      },
      y: { ticks: { color:'#666', font:{size:12} }, grid: { color:'rgba(0,0,0,0.06)' } }
    },
    plugins: {
      legend: { position:'top', labels:{ usePointStyle:true, pointStyle:'line', padding:16, font:{size:11} } }
    }
  }
});
</script>
</body>
</html>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ticker, period, sigma, format } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: '缺少必要參數：ticker（例如 0050.TW）' });
  }

  const periodYears = parseInt(period, 10) || 3;
  if (![3, 5, 10].includes(periodYears)) {
    return res.status(400).json({ error: '期間僅支援 3、5、10 年' });
  }

  const sigmaMult = parseFloat(sigma) || 2;
  if (sigmaMult < 0.5 || sigmaMult > 3) {
    return res.status(400).json({ error: '標準差倍數須介於 0.5 ~ 3' });
  }

  const outputFormat = (format || 'png').toLowerCase();
  if (!['png', 'html', 'json'].includes(outputFormat)) {
    return res.status(400).json({ error: 'format 僅支援 png、html、json' });
  }

  try {
    const now = new Date();
    const period1 = new Date(now.getFullYear() - periodYears, now.getMonth(), now.getDate());
    const period2 = now;

    const history = await fetchHistory(ticker, period1, period2);

    if (!history || history.length < 10) {
      return res.status(404).json({
        error: `找不到 "${ticker}" 的歷史資料。台股請加 .TW（如 0050.TW），美股直接輸入代號（如 VOO）。`,
      });
    }

    history.sort((a, b) => a.date - b.date);
    const data = computeLohas(history, sigmaMult);
    const tickerUpper = ticker.trim().toUpperCase();

    if (outputFormat === 'json') {
      return res.json({ ticker: tickerUpper, period: periodYears, sigmaMult, ...data });
    }

    if (outputFormat === 'html') {
      const html = renderHTML(tickerUpper, data, periodYears, sigmaMult);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    // Default: PNG
    const buffer = await renderPNG(tickerUpper, data, periodYears, sigmaMult);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="lohas-${tickerUpper}-${periodYears}y.png"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(buffer);
  } catch (err) {
    console.error(err);
    const msg = err.message || '未知錯誤';
    res.status(500).json({ error: `圖表生成失敗：${msg}` });
  }
};
