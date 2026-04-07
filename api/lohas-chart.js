const path = require('path');
const fs = require('fs');
const { fetchHistory } = require('./_lib/yahoo');
const { computeLohas } = require('./_lib/lohas');
const { Resvg } = require('@resvg/resvg-js');

// ─── Chart Configuration ──────────────────────────────────────────────────────
const WIDTH = 1080;
const HEIGHT = 620;
const PADDING = { top: 100, right: 90, bottom: 50, left: 70 };
const CHART_W = WIDTH - PADDING.left - PADDING.right;
const CHART_H = HEIGHT - PADDING.top - PADDING.bottom;

// PNG labels use English only (no CJK font needed on Vercel)
const LINES = [
  { key: 'plus2s',  color: '#f43f5e', label: '+2s Optimistic',    dash: '6,3' },
  { key: 'plus1s',  color: '#f4a0ab', label: '+1s',               dash: '' },
  { key: 'trend',   color: '#8b949e', label: 'Trend',             dash: '4,4' },
  { key: 'minus1s', color: '#79c0ff', label: '-1s',               dash: '' },
  { key: 'minus2s', color: '#388bfd', label: '-2s Pessimistic',   dash: '' },
  { key: 'close',   color: '#1a1a2e', label: 'Close',             dash: '' },
];

// Load bundled font for resvg (Vercel has no system fonts)
const FONT_PATH = path.join(__dirname, '_lib', 'fonts', 'Inter.ttf');
let fontBuffer = null;
try { fontBuffer = fs.readFileSync(FONT_PATH); } catch (_) { /* fallback */ }

// ─── SVG helpers ──────────────────────────────────────────────────────────────
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function niceScale(min, max, maxTicks = 8) {
  const range = max - min || 1;
  const roughStep = range / maxTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / mag;
  let step;
  if (residual <= 1.5) step = 1 * mag;
  else if (residual <= 3) step = 2 * mag;
  else if (residual <= 7) step = 5 * mag;
  else step = 10 * mag;
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = niceMin; v <= niceMax + step * 0.01; v += step) {
    ticks.push(Math.round(v * 100) / 100);
  }
  return { min: niceMin, max: niceMax, ticks };
}

function buildPolyline(chartData, key, yMin, yMax) {
  const points = [];
  const n = chartData.length;
  for (let i = 0; i < n; i++) {
    const x = PADDING.left + (i / (n - 1)) * CHART_W;
    const yFrac = (chartData[i][key] - yMin) / (yMax - yMin);
    const y = PADDING.top + CHART_H - yFrac * CHART_H;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(' ');
}

// ─── Render SVG (for PNG conversion — English only) ──────────────────────────
function renderSVG(ticker, data, periodYears) {
  const chartData = data.chartData;
  const last = chartData[chartData.length - 1];

  // Compute Y range across all values
  let yMin = Infinity, yMax = -Infinity;
  for (const d of chartData) {
    for (const key of ['plus2s', 'plus1s', 'trend', 'minus1s', 'minus2s', 'close']) {
      if (d[key] < yMin) yMin = d[key];
      if (d[key] > yMax) yMax = d[key];
    }
  }
  const yPad = (yMax - yMin) * 0.05;
  const scale = niceScale(yMin - yPad, yMax + yPad);

  // X-axis labels (~6 evenly spaced)
  const tickInterval = Math.max(1, Math.floor(chartData.length / 6));
  const xLabels = [];
  for (let i = 0; i < chartData.length; i += tickInterval) {
    const d = new Date(chartData[i].date);
    const x = PADDING.left + (i / (chartData.length - 1)) * CHART_W;
    xLabels.push({ x, label: `${d.getFullYear()}` });
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff" rx="16"/>
`;

  // Title (English for PNG compatibility)
  svg += `<text x="${PADDING.left}" y="36" font-size="20" font-weight="700" fill="#1a1a2e" font-family="Inter,sans-serif">LOHAS Five Lines - ${esc(ticker)}</text>\n`;
  svg += `<text x="${PADDING.left}" y="56" font-size="12" fill="#888" font-family="Inter,sans-serif">Log-Linear Regression +/- Std Dev Bands | Adj. Close | ${periodYears}Y</text>\n`;

  // Legend row at top-right
  let legendX = PADDING.left + CHART_W + PADDING.right - 10;
  const legendY = 36;
  for (let i = LINES.length - 1; i >= 0; i--) {
    const line = LINES[i];
    const labelW = line.label.length * 7 + 28;
    legendX -= labelW;
    const dashAttr = line.dash ? ` stroke-dasharray="${line.dash}"` : '';
    svg += `<line x1="${legendX}" y1="${legendY}" x2="${legendX + 16}" y2="${legendY}" stroke="${line.color}" stroke-width="2"${dashAttr}/>\n`;
    svg += `<text x="${legendX + 20}" y="${legendY + 4}" font-size="11" fill="#555" font-family="Inter,sans-serif">${esc(line.label)}</text>\n`;
  }

  // Value pills row
  const pillY = 72;
  let pillX = PADDING.left;
  for (const line of LINES) {
    const val = last[line.key].toFixed(2);
    const isClose = line.key === 'close';
    const prefix = isClose ? 'Close ' : '';
    const displayText = `${prefix}${val}`;
    const textW = displayText.length * 7.5 + 18;
    svg += `<rect x="${pillX}" y="${pillY}" width="${textW}" height="22" rx="6" fill="${isClose ? '#f0f0f5' : '#fff'}" stroke="${line.color}" stroke-width="1.5"/>`;
    svg += `<text x="${pillX + textW / 2}" y="${pillY + 15}" text-anchor="middle" font-size="11" font-weight="600" fill="${line.color}" font-family="Inter,sans-serif">${esc(displayText)}</text>\n`;
    pillX += textW + 8;
  }

  // Y-axis grid lines and labels
  for (const tick of scale.ticks) {
    const yFrac = (tick - scale.min) / (scale.max - scale.min);
    const y = PADDING.top + CHART_H - yFrac * CHART_H;
    svg += `<line x1="${PADDING.left}" y1="${y}" x2="${PADDING.left + CHART_W}" y2="${y}" stroke="#e8e8e8" stroke-width="1"/>\n`;
    svg += `<text x="${PADDING.left - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#666" font-family="Inter,sans-serif">${tick.toFixed(2)}</text>\n`;
  }

  // X-axis labels
  for (const { x, label } of xLabels) {
    svg += `<text x="${x}" y="${PADDING.top + CHART_H + 20}" text-anchor="middle" font-size="11" fill="#666" font-family="Inter,sans-serif">${esc(label)}</text>\n`;
  }

  // Chart border (bottom)
  svg += `<line x1="${PADDING.left}" y1="${PADDING.top + CHART_H}" x2="${PADDING.left + CHART_W}" y2="${PADDING.top + CHART_H}" stroke="#ccc" stroke-width="1"/>\n`;

  // Draw lines
  for (const line of LINES) {
    const points = buildPolyline(chartData, line.key, scale.min, scale.max);
    const dashAttr = line.dash ? ` stroke-dasharray="${line.dash}"` : '';
    const width = line.key === 'trend' ? 2 : 1.5;
    svg += `<polyline points="${points}" fill="none" stroke="${line.color}" stroke-width="${width}"${dashAttr} stroke-linejoin="round" stroke-linecap="round"/>\n`;
  }

  // Right-side value labels (with collision avoidance)
  const rightLabels = LINES.map((line) => {
    const val = last[line.key];
    const yFrac = (val - scale.min) / (scale.max - scale.min);
    const y = PADDING.top + CHART_H - yFrac * CHART_H;
    return { line, val, y };
  });
  // Sort by Y position and push apart overlapping labels
  rightLabels.sort((a, b) => a.y - b.y);
  const MIN_GAP = 22;
  for (let i = 1; i < rightLabels.length; i++) {
    const diff = rightLabels[i].y - rightLabels[i - 1].y;
    if (diff < MIN_GAP) {
      rightLabels[i].y = rightLabels[i - 1].y + MIN_GAP;
    }
  }

  for (const { line, val, y } of rightLabels) {
    const text = val.toFixed(2);
    const textW = text.length * 7.5 + 14;
    const labelX = PADDING.left + CHART_W + 6;

    svg += `<rect x="${labelX}" y="${y - 10}" width="${textW}" height="20" rx="4" fill="${line.color}"/>`;
    svg += `<text x="${labelX + textW / 2}" y="${y + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="#fff" font-family="Inter,sans-serif">${esc(text)}</text>\n`;
  }

  svg += `</svg>`;
  return svg;
}

// ─── Render PNG from SVG ──────────────────────────────────────────────────────
function renderPNG(svgString) {
  const opts = {
    fitTo: { mode: 'width', value: WIDTH * 2 },
    font: {
      loadSystemFonts: false,
      fontFiles: fontBuffer ? [FONT_PATH] : [],
      defaultFontFamily: 'Inter',
    },
  };

  const resvg = new Resvg(svgString, opts);
  const pngData = resvg.render();
  return pngData.asPng();
}

// ─── Render HTML (keeps Chinese — rendered client-side with browser fonts) ───
function renderHTML(ticker, data, periodYears) {
  const last = data.chartData[data.chartData.length - 1];
  const chartDataJSON = JSON.stringify(data.chartData);

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>樂活五線譜 — ${esc(ticker)}</title>
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
  <h1>樂活五線譜 — ${esc(ticker)}</h1>
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
    return res.status(400).json({ error: 'Missing required param: ticker (e.g. 0050.TW)' });
  }

  const periodYears = parseInt(period, 10) || 3;
  if (![3, 5, 10].includes(periodYears)) {
    return res.status(400).json({ error: 'period must be 3, 5, or 10' });
  }

  const sigmaMult = parseFloat(sigma) || 2;
  if (sigmaMult < 0.5 || sigmaMult > 3) {
    return res.status(400).json({ error: 'sigma must be between 0.5 and 3' });
  }

  const outputFormat = (format || 'png').toLowerCase();
  if (!['png', 'svg', 'html', 'json'].includes(outputFormat)) {
    return res.status(400).json({ error: 'format must be png, svg, html, or json' });
  }

  try {
    const now = new Date();
    const period1 = new Date(now.getFullYear() - periodYears, now.getMonth(), now.getDate());
    const period2 = now;

    const history = await fetchHistory(ticker, period1, period2);

    if (!history || history.length < 10) {
      return res.status(404).json({
        error: `No data found for "${ticker}". Use .TW suffix for Taiwan stocks (e.g. 0050.TW).`,
      });
    }

    history.sort((a, b) => a.date - b.date);
    const data = computeLohas(history, sigmaMult);
    const tickerUpper = ticker.trim().toUpperCase();

    if (outputFormat === 'json') {
      return res.json({ ticker: tickerUpper, period: periodYears, sigmaMult, ...data });
    }

    if (outputFormat === 'html') {
      const html = renderHTML(tickerUpper, data, periodYears);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    const svgString = renderSVG(tickerUpper, data, periodYears);

    if (outputFormat === 'svg') {
      res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(svgString);
    }

    // Default: PNG (SVG → PNG via resvg)
    const pngBuffer = renderPNG(svgString);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="lohas-${tickerUpper}-${periodYears}y.png"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(Buffer.from(pngBuffer));
  } catch (err) {
    console.error(err);
    const msg = err.message || 'Unknown error';
    res.status(500).json({ error: `Chart generation failed: ${msg}` });
  }
};
