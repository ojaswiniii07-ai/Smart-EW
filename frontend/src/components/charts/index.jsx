import Plot from 'react-plotly.js';
import { useMemo } from 'react';
import { generateWaterfallData, NUM_BANDS, NUM_TIME_SLOTS } from '../../data/radarConstants';

// ── Read current CSS custom properties (works for both light and dark) ─────────
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function getChartTheme() {
  const grid  = cssVar('--border')    || 'rgba(255,255,255,0.08)';
  const text  = cssVar('--text-faint')|| '#7a90b0';
  const text2 = cssVar('--text-sub')  || '#b4bfd4';
  const font  = { family: "'JetBrains Mono', 'DM Mono', monospace", color: text2, size: 10 };
  const tick  = { family: "'JetBrains Mono', 'DM Mono', monospace", color: text,  size: 9 };
  return { grid, font, tick, text2 };
}

const CONFIG = { displayModeBar: false, responsive: true };

function makeLayout(overrides = {}) {
  const { grid, font, tick, text2 } = getChartTheme();
  const base = {
    paper_bgcolor: 'transparent',
    plot_bgcolor:  'transparent',
    font,
    margin: { t: 10, r: 16, b: 42, l: 54 },
    xaxis: {
      gridcolor: grid, zerolinecolor: grid,
      linecolor: grid, tickfont: tick,
      title: { font: { size: 11, family: "'JetBrains Mono', monospace" } },
    },
    yaxis: {
      gridcolor: grid, zerolinecolor: grid,
      linecolor: grid, tickfont: tick,
      title: { font: { size: 11, family: "'JetBrains Mono', monospace" } },
    },
    legend: {
      bgcolor: 'transparent',
      bordercolor: grid,
      borderwidth: 1,
      font: { size: 10, family: "'JetBrains Mono', monospace", color: text2 },
      x: 0.01, y: 0.99,
    },
  };
  // Deep merge overrides
  return {
    ...base,
    ...overrides,
    xaxis: { ...base.xaxis, ...(overrides.xaxis || {}) },
    yaxis: { ...base.yaxis, ...(overrides.yaxis || {}) },
    legend: { ...base.legend, ...(overrides.legend || {}) },
  };
}

// ── Waterfall / Spectrogram ────────────────────────────────────────────────────
export function WaterfallChart({ height = 320, currentBand = 5 }) {
  const z = useMemo(() => generateWaterfallData(), []);
  const layout = makeLayout({
    height,
    xaxis: { title: { text: 'Time Slot →' } },
    yaxis: { title: { text: '← Frequency Band' } },
  });

  const accent = cssVar('--accent') || '#4f6ef7';
  const traces = [
    {
      type: 'heatmap', z,
      colorscale: [
        [0.0, 'transparent'],
        [0.15, 'rgba(79, 110, 247, 0.12)'],
        [0.35, 'rgba(79, 110, 247, 0.32)'],
        [0.6, 'rgba(79, 110, 247, 0.65)'],
        [0.85, '#4f6ef7'],
        [1.0, '#2dd68a'],
      ],
      showscale: true,
      colorbar: {
        thickness: 8, outlinewidth: 0, len: 0.82,
        tickfont: { size: 9, color: cssVar('--text-faint') || '#7a90b0', family: "'JetBrains Mono', monospace" },
        title: { text: 'Power', font: { size: 10, color: cssVar('--text-sub') || '#b4bfd4' } },
      },
      name: 'Ground Truth',
      hovertemplate: 'Band %{y} · Slot %{x}<br>Power: %{z:.2f}<extra></extra>',
    },
    {
      type: 'scatter', x: [NUM_TIME_SLOTS - 1], y: [currentBand], mode: 'markers',
      marker: { symbol: 'diamond', size: 12, color: accent, line: { color: '#ffffff', width: 2 } },
      name: 'Observation',
      hovertemplate: 'Current Observation<br>Band %{y}<extra></extra>',
    },
  ];

  return (
    <Plot data={traces} layout={layout} config={CONFIG} style={{ width: '100%' }} useResizeHandler />
  );
}

// ── Occupancy Heatmap ──────────────────────────────────────────────────────────
export function OccupancyHeatmap({ height = 240 }) {
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const bands = Array.from({ length: NUM_BANDS }, (_, i) => `B${i}`);
  const z = useMemo(() =>
    Array.from({ length: NUM_BANDS }, (_, b) =>
      Array.from({ length: 24 }, () => {
        const hot = [5, 12, 18, 23, 28, 7, 15];
        return hot.includes(b) ? 0.45 + Math.random() * 0.5 : Math.random() * 0.22;
      })
    ), []
  );
  const layout = makeLayout({
    height,
    xaxis: { title: { text: 'Hour of Day' } },
    yaxis: { title: { text: 'Band' }, tickfont: { size: 8 } },
  });
  return (
    <Plot
      data={[{
        type: 'heatmap', z, x: hours, y: bands,
        colorscale: [
          [0.0, 'transparent'],
          [0.3, 'rgba(79, 110, 247, 0.16)'],
          [0.65, 'rgba(79, 110, 247, 0.65)'],
          [1.0, '#2dd68a'],
        ],
        showscale: true,
        colorbar: { thickness: 8, outlinewidth: 0, tickfont: { size: 9, color: cssVar('--text-faint') || '#7a90b0', family: "'JetBrains Mono', monospace" } },
        hovertemplate: '%{y} · %{x}<br>Occupancy: %{z:.2f}<extra></extra>',
      }]}
      layout={layout}
      config={CONFIG} style={{ width: '100%' }} useResizeHandler
    />
  );
}

// ── Hit/Miss Timeline ──────────────────────────────────────────────────────────
export function HitMissTimeline({ events = [], height = 180 }) {
  const hits   = events.filter(e => e.result === 'hit');
  const misses = events.filter(e => e.result === 'miss');
  const fas    = events.filter(e => e.result === 'false_alarm');
  const layout = makeLayout({
    height,
    xaxis: { title: { text: 'Simulation Time →' } },
    yaxis: { title: { text: 'Band' } },
  });
  const hitColor  = cssVar('--hit')  || '#2dd68a';
  const missColor = cssVar('--miss') || '#f46464';
  const faColor   = cssVar('--warn') || '#f7b955';

  return (
    <Plot
      data={[
        { type: 'scatter', mode: 'markers', name: 'Hit',
          x: hits.map(e => e.t), y: hits.map(e => e.band),
          marker: { color: hitColor, size: 7, symbol: 'circle' },
          hovertemplate: 't=%{x}  Band %{y}<br>HIT<extra></extra>' },
        { type: 'scatter', mode: 'markers', name: 'Miss',
          x: misses.map(e => e.t), y: misses.map(e => e.band),
          marker: { color: missColor, size: 7, symbol: 'x' },
          hovertemplate: 't=%{x}  Band %{y}<br>MISS<extra></extra>' },
        { type: 'scatter', mode: 'markers', name: 'False Alarm',
          x: fas.map(e => e.t), y: fas.map(e => e.band),
          marker: { color: faColor, size: 7, symbol: 'triangle-up' },
          hovertemplate: 't=%{x}  Band %{y}<br>FALSE ALARM<extra></extra>' },
      ]}
      layout={layout}
      config={CONFIG} style={{ width: '100%' }} useResizeHandler
    />
  );
}

// ── Cumulative Reward ──────────────────────────────────────────────────────────
export function CumulativeRewardChart({ data, height = 220 }) {
  const { t, fixed, random, adaptive, ml } = data;
  const layout = makeLayout({
    height,
    xaxis: { title: { text: 'Step →' } },
    yaxis: { title: { text: 'Cumulative Reward' } },
  });
  const accent  = cssVar('--accent')      || '#4f6ef7';
  const pred    = cssVar('--pred')        || '#5ca3f7';
  const sub     = cssVar('--text-sub')    || '#7a90b0';
  const faint   = cssVar('--border-dark') || '#445570';

  return (
    <Plot
      data={[
        { type: 'scatter', mode: 'lines', name: 'Fixed Sweep', x: t, y: fixed,
          line: { color: faint, dash: 'dot', width: 1.5 } },
        { type: 'scatter', mode: 'lines', name: 'Random', x: t, y: random,
          line: { color: sub, width: 1.5 } },
        { type: 'scatter', mode: 'lines', name: 'Adaptive Stat.', x: t, y: adaptive,
          line: { color: pred, width: 2 } },
        { type: 'scatter', mode: 'lines', name: 'ML-Adaptive', x: t, y: ml,
          line: { color: accent, width: 2.5 } },
      ]}
      layout={layout}
      config={CONFIG} style={{ width: '100%' }} useResizeHandler
    />
  );
}

// ── Latency Distribution ───────────────────────────────────────────────────────
export function LatencyDistChart({ data, height = 220 }) {
  const accent = cssVar('--accent') || '#4f6ef7';
  const layout = makeLayout({
    height, bargap: 0.08,
    xaxis: { title: { text: 'Latency (s)' } },
    yaxis: { title: { text: 'Count' } },
  });
  return (
    <Plot
      data={[{
        type: 'histogram', x: data, nbinsx: 30,
        marker: { color: 'rgba(79, 110, 247, 0.35)', line: { color: accent, width: 1 } },
        name: 'Latency',
      }]}
      layout={layout}
      config={CONFIG} style={{ width: '100%' }} useResizeHandler
    />
  );
}

// ── Benchmark Bar Chart ────────────────────────────────────────────────────────
export function BenchmarkBar({ metric = 'V-Measure', values = [], labels = [], height = 320, yLabel = '' }) {
  const accent = cssVar('--accent') || '#4f6ef7';
  const hit    = cssVar('--hit')    || '#2dd68a';
  const pred   = cssVar('--pred')   || '#5ca3f7';
  const gt     = cssVar('--gt')     || '#b39dfa';
  const border = cssVar('--border') || 'rgba(255,255,255,0.08)';

  const safeLabels = Array.isArray(labels) ? labels : [];
  const safeValues = (Array.isArray(values) ? values : []).map(v => (typeof v === 'number' && !isNaN(v) ? v : 0));

  const isRatio = safeValues.length > 0 && safeValues.every(v => v <= 1.05 && v >= 0);

  const colors = safeLabels.map((_, i) => {
    if (i === 0) return hit;
    if (i === 1) return accent;
    if (i === 2) return pred;
    if (i === 3) return gt;
    if (i >= safeLabels.length - 2) return cssVar('--border-dark') || '#445570';
    return cssVar('--border-mid') || '#5a6a82';
  });

  // When metric is a ratio (0–1), scale bars to 0–100 so percentage values match visual heights
  const yValues = isRatio ? safeValues.map(v => +(v * 100).toFixed(2)) : safeValues;
  const textDisplay = safeValues.map(v => (isRatio ? `${(v * 100).toFixed(1)}%` : v.toFixed(1)));
  
  const maxY = Math.max(...yValues, 1);
  // Ensure generous top headroom (18–25%) so outside value labels never touch the top boundary or title
  const yRange = isRatio ? [0, Math.min(125, Math.max(105, maxY * 1.18))] : [0, maxY * 1.2];

  const layout = makeLayout({
    height,
    margin: { t: 40, r: 24, b: 80, l: 64 },
    xaxis: {
      title: { text: '' },
      tickangle: -25,
      automargin: true,
      tickfont: { family: "'JetBrains Mono', monospace", size: 10, color: cssVar('--text-sub') || '#b4bfd4' },
    },
    yaxis: {
      title: { text: yLabel || (isRatio ? `${metric} (%)` : metric), font: { size: 11, family: "'JetBrains Mono', monospace" } },
      ticksuffix: isRatio ? '%' : '',
      range: yRange,
      automargin: true,
    },
    bargap: 0.28,
  });

  return (
    <Plot
      data={[{
        type: 'bar',
        x: safeLabels,
        y: yValues,
        marker: {
          color: colors,
          line: { color: border, width: 1 },
        },
        text: textDisplay,
        textposition: 'outside',
        textfont: { size: 10.5, color: cssVar('--text-base') || '#e8edf8', family: "'JetBrains Mono', monospace" },
        cliponaxis: false,
        hovertemplate: '%{x}<br>' + (yLabel || metric) + ': %{text}<extra></extra>',
      }]}
      layout={layout}
      config={CONFIG}
      style={{ width: '100%', height: `${height}px` }}
      useResizeHandler
    />
  );
}

// ── ROC Curve ──────────────────────────────────────────────────────────────────
export function ROCCurve({ data, height = 240 }) {
  const accent = cssVar('--accent') || '#4f6ef7';
  const border = cssVar('--border-dark') || '#445570';

  const layout = makeLayout({
    height,
    xaxis: { title: { text: 'False Positive Rate' }, range: [0, 1] },
    yaxis: { title: { text: 'True Positive Rate' },  range: [0, 1] },
  });
  return (
    <Plot
      data={[
        { type: 'scatter', mode: 'lines', name: `AUC = ${data.auc}`,
          x: data.fpr, y: data.tpr,
          line: { color: accent, width: 2.2 },
          fill: 'tozeroy', fillcolor: 'rgba(79, 110, 247, 0.08)' },
        { type: 'scatter', mode: 'lines', name: 'Random Chance',
          x: [0, 1], y: [0, 1],
          line: { color: border, dash: 'dash', width: 1 } },
      ]}
      layout={layout}
      config={CONFIG} style={{ width: '100%' }} useResizeHandler
    />
  );
}

// ── Feature Importance ─────────────────────────────────────────────────────────
export function FeatureImportanceChart({ data, height = 240 }) {
  const sorted = [...data].sort((a, b) => a.importance - b.importance);
  const { tick } = getChartTheme();
  const layout = makeLayout({
    height,
    margin: { t: 8, r: 16, b: 40, l: 120 },
    xaxis: { title: { text: 'Importance' } },
    yaxis: { automargin: true, tickfont: { ...tick, size: 9 } },
  });
  return (
    <Plot
      data={[{
        type: 'bar', orientation: 'h',
        x: sorted.map(d => d.importance),
        y: sorted.map(d => d.feature),
        marker: { color: sorted.map((_, i, arr) => {
          const t = i / Math.max(1, arr.length - 1);
          return `rgba(79, 110, 247, ${0.35 + t * 0.65})`;
        })},
        hovertemplate: '%{y}<br>Importance: %{x:.3f}<extra></extra>',
      }]}
      layout={layout}
      config={CONFIG} style={{ width: '100%' }} useResizeHandler
    />
  );
}

// ── Calibration Curve ──────────────────────────────────────────────────────────
export function CalibrationCurve({ data, height = 240 }) {
  const accent = cssVar('--accent') || '#4f6ef7';
  const border = cssVar('--border-dark') || '#445570';

  const layout = makeLayout({
    height,
    xaxis: { title: { text: 'Mean Predicted Probability' }, range: [0, 1] },
    yaxis: { title: { text: 'Fraction of Positives' },     range: [0, 1] },
  });
  return (
    <Plot
      data={[
        { type: 'scatter', mode: 'lines+markers', name: 'Model',
          x: data.predicted, y: data.actual,
          line: { color: accent, width: 2 },
          marker: { color: accent, size: 6 } },
        { type: 'scatter', mode: 'lines', name: 'Perfect Calibration',
          x: [0, 1], y: [0, 1],
          line: { color: border, dash: 'dash', width: 1 } },
      ]}
      layout={layout}
      config={CONFIG} style={{ width: '100%' }} useResizeHandler
    />
  );
}

// ── Confusion Matrix ───────────────────────────────────────────────────────────
export function ConfusionMatrix({ height = 260, matrix, labels }) {
  const defaultZ = [[412, 38], [91, 459]];
  const defaultLabels = ['No Signal', 'Signal'];
  
  const z = matrix && matrix.length > 0 ? matrix : defaultZ;
  const xLabels = (labels && labels.length === z[0].length ? labels : defaultLabels).map(l => `Pred: ${l}`);
  const yLabels = (labels && labels.length === z.length ? labels : defaultLabels).map(l => `True: ${l}`);

  const text = z.map(row => row.map(v => typeof v === 'number' ? (v < 1 ? v.toFixed(2) : String(Math.round(v))) : String(v)));
  const layout = makeLayout({
    height,
    margin: { t: 8, r: 16, b: 60, l: 110 },
    xaxis: { tickangle: -25 },
    yaxis: { autorange: 'reversed' }
  });
  return (
    <Plot
      data={[{
        type: 'heatmap', z,
        x: xLabels,
        y: yLabels,
        colorscale: [
          [0.0, 'transparent'],
          [0.5, 'rgba(79, 110, 247, 0.2)'],
          [1.0, '#2dd68a'],
        ],
        showscale: true,
        colorbar: { thickness: 8, outlinewidth: 0 },
        text, texttemplate: '%{text}',
        textfont: { size: z.length > 4 ? 10 : 15, color: cssVar('--text-base') || '#e8edf8', family: "'JetBrains Mono', monospace" },
        hovertemplate: '%{y}<br>%{x}<br>Value: %{z:.3f}<extra></extra>',
      }]}
      layout={layout}
      config={CONFIG} style={{ width: '100%' }} useResizeHandler
    />
  );
}

// ── Radar / Spider ─────────────────────────────────────────────────────────────
export function SchedulerRadar({ height = 300 }) {
  const { grid, font, tick } = getChartTheme();
  const cats = ['Pd', 'Low FAR', 'Obs Rate', 'Low Latency', 'Coverage', 'Reward'];
  const accent = cssVar('--accent') || '#4f6ef7';
  const pred   = cssVar('--pred')   || '#5ca3f7';
  const border = cssVar('--border-dark') || '#445570';

  return (
    <Plot
      data={[
        { type: 'scatterpolar', fill: 'toself', name: 'Fixed Sweep',
          r: [0.41, 0.91, 0.31, 0.18, 0.71, 0.30], theta: cats,
          line: { color: border }, fillcolor: 'rgba(150,150,150,0.1)' },
        { type: 'scatterpolar', fill: 'toself', name: 'Adaptive',
          r: [0.67, 0.94, 0.54, 0.47, 0.87, 0.70], theta: cats,
          line: { color: pred }, fillcolor: 'rgba(92,163,247,0.12)' },
        { type: 'scatterpolar', fill: 'toself', name: 'ML-Adaptive',
          r: [0.84, 0.96, 0.71, 0.73, 0.93, 1.00], theta: cats,
          line: { color: accent, width: 2.2 }, fillcolor: 'rgba(79,110,247,0.18)' },
      ]}
      layout={{
        paper_bgcolor: 'transparent',
        plot_bgcolor:  'transparent',
        font,
        polar: {
          bgcolor: 'transparent',
          radialaxis: { visible: true, range: [0, 1], gridcolor: grid, tickfont: tick },
          angularaxis: { gridcolor: grid, tickfont: { ...tick, size: 10 } },
        },
        legend: {
          bgcolor: 'transparent', bordercolor: grid, borderwidth: 1,
          font: { ...font, size: 10 }, x: 0.01, y: 0.99,
        },
        height,
        margin: { t: 24, r: 24, b: 24, l: 24 },
      }}
      config={CONFIG} style={{ width: '100%' }} useResizeHandler
    />
  );
}
