import Plot from 'react-plotly.js';
import { useMemo } from 'react';
import { generateWaterfallData, NUM_BANDS, NUM_TIME_SLOTS } from '../../data/mockData';

// ── Read current CSS custom properties (works for both light and dark) ─────────
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function getChartTheme() {
  const grid  = cssVar('--border')    || '#d4cfc8';
  const text  = cssVar('--text-faint')|| '#a8a29a';
  const text2 = cssVar('--text-sub')  || '#78716c';
  const font  = { family: "'DM Mono', monospace", color: text2, size: 10 };
  const tick  = { family: "'DM Mono', monospace", color: text,  size: 9 };
  return { grid, font, tick, text2 };
}

const CONFIG = { displayModeBar: false, responsive: true };

function makeLayout(overrides = {}) {
  const { grid, font, tick, text2 } = getChartTheme();
  const base = {
    paper_bgcolor: 'transparent',
    plot_bgcolor:  'transparent',
    font,
    margin: { t: 8, r: 12, b: 40, l: 52 },
    xaxis: {
      gridcolor: grid, zerolinecolor: grid,
      linecolor: grid, tickfont: tick,
      title: { font: { size: 11 } },
    },
    yaxis: {
      gridcolor: grid, zerolinecolor: grid,
      linecolor: grid, tickfont: tick,
      title: { font: { size: 11 } },
    },
    legend: {
      bgcolor: 'rgba(0,0,0,0)',
      bordercolor: grid,
      borderwidth: 1,
      font: { size: 10, family: "'DM Mono', monospace", color: text2 },
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
    yaxis: { title: { text: '← Band' } },
  });

  const traces = [
    {
      type: 'heatmap', z,
      colorscale: [
        [0.0, 'var(--bg)'],
        [0.1, '#e8e4de'], [0.25,'#d4cfc8'], [0.45,'#c0bab2'],
        [0.65,'#a8a29a'], [0.8, '#78716c'], [1.0, '#c25b2a'],
      ],
      showscale: true,
      colorbar: {
        thickness: 10, outlinewidth: 0, len: 0.8,
        tickfont: { size: 9, color: cssVar('--text-faint') || '#a8a29a', family: "'DM Mono', monospace" },
        title: { text: 'Power', font: { size: 10, color: cssVar('--text-sub') || '#78716c' } },
      },
      name: 'Ground Truth',
      hovertemplate: 'Band %{y} · Slot %{x}<br>Power: %{z:.2f}<extra></extra>',
    },
    {
      type: 'scatter', x: [NUM_TIME_SLOTS - 1], y: [currentBand], mode: 'markers',
      marker: { symbol: 'diamond', size: 12, color: '#c25b2a', line: { color: '#fff', width: 1.5 } },
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
        colorscale: [[0,'transparent'],[0.3,'#e0dbd5'],[0.6,'#a8a29a'],[1,'#2d6a4f']],
        showscale: true,
        colorbar: { thickness: 10, outlinewidth: 0, tickfont: { size: 9, color: cssVar('--text-faint')||'#a8a29a', family: "'DM Mono',monospace" } },
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
  return (
    <Plot
      data={[
        { type: 'scatter', mode: 'markers', name: 'Hit',
          x: hits.map(e => e.t), y: hits.map(e => e.band),
          marker: { color: '#2d6a4f', size: 7, symbol: 'circle' },
          hovertemplate: 't=%{x}  Band %{y}<br>HIT<extra></extra>' },
        { type: 'scatter', mode: 'markers', name: 'Miss',
          x: misses.map(e => e.t), y: misses.map(e => e.band),
          marker: { color: '#9b1c1c', size: 7, symbol: 'x' },
          hovertemplate: 't=%{x}  Band %{y}<br>MISS<extra></extra>' },
        { type: 'scatter', mode: 'markers', name: 'False Alarm',
          x: fas.map(e => e.t), y: fas.map(e => e.band),
          marker: { color: '#92400e', size: 7, symbol: 'triangle-up' },
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
  return (
    <Plot
      data={[
        { type: 'scatter', mode: 'lines', name: 'Fixed Sweep', x: t, y: fixed,
          line: { color: '#c0bab2', dash: 'dot', width: 1.5 } },
        { type: 'scatter', mode: 'lines', name: 'Random', x: t, y: random,
          line: { color: '#a8a29a', width: 1.5 } },
        { type: 'scatter', mode: 'lines', name: 'Adaptive Stat.', x: t, y: adaptive,
          line: { color: '#78716c', width: 2 } },
        { type: 'scatter', mode: 'lines', name: 'ML-Adaptive', x: t, y: ml,
          line: { color: '#c25b2a', width: 2.5 } },
      ]}
      layout={layout}
      config={CONFIG} style={{ width: '100%' }} useResizeHandler
    />
  );
}

// ── Latency Distribution ───────────────────────────────────────────────────────
export function LatencyDistChart({ data, height = 220 }) {
  const layout = makeLayout({
    height, bargap: 0.05,
    xaxis: { title: { text: 'Latency (s)' } },
    yaxis: { title: { text: 'Count' } },
  });
  return (
    <Plot
      data={[{
        type: 'histogram', x: data, nbinsx: 30,
        marker: { color: 'rgba(194,91,42,0.45)', line: { color: '#c25b2a', width: 0.8 } },
        name: 'Latency',
      }]}
      layout={layout}
      config={CONFIG} style={{ width: '100%' }} useResizeHandler
    />
  );
}

// ── Benchmark Bar Chart ────────────────────────────────────────────────────────
export function BenchmarkBar({ metric, values, labels, height = 280, yLabel = '' }) {
  const accent = cssVar('--accent') || '#c25b2a';
  const colors = [
    cssVar('--border-dark') || '#a8a29a',
    cssVar('--border-mid')  || '#c0bab2',
    cssVar('--text-faint')  || '#a8a29a',
    accent,
    cssVar('--hit')         || '#2d6a4f',
  ];
  const layout = makeLayout({
    height,
    margin: { t: 48, r: 16, b: 80, l: 60 },
    xaxis: {
      title: { text: '' },
      tickfont: { family: "'DM Mono', monospace", size: 11, color: cssVar('--text-sub') || '#78716c' },
    },
    yaxis: { title: { text: yLabel || metric } },
    bargap: 0.32,
  });
  return (
    <Plot
      data={[{
        type: 'bar',
        x: labels,
        y: values,
        marker: {
          color: colors.slice(0, labels.length),
          line: { color: cssVar('--border') || '#d4cfc8', width: 1 },
        },
        text: values.map(v => v.toFixed(3)),
        textposition: 'outside',
        textfont: { size: 10, color: cssVar('--text-sub') || '#78716c', family: "'DM Mono', monospace" },
        cliponaxis: false,
        hovertemplate: '%{x}<br>' + metric + ': %{y:.3f}<extra></extra>',
      }]}
      layout={layout}
      config={CONFIG} style={{ width: '100%' }} useResizeHandler
    />
  );
}

// ── ROC Curve ──────────────────────────────────────────────────────────────────
export function ROCCurve({ data, height = 240 }) {
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
          line: { color: '#c25b2a', width: 2 },
          fill: 'tozeroy', fillcolor: 'rgba(194,91,42,0.07)' },
        { type: 'scatter', mode: 'lines', name: 'Random Chance',
          x: [0, 1], y: [0, 1],
          line: { color: '#c0bab2', dash: 'dash', width: 1 } },
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
    margin: { t: 8, r: 12, b: 40, l: 120 },
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
          const t = i / (arr.length - 1);
          return `rgba(194,91,42,${0.3 + t * 0.65})`;
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
          line: { color: '#c25b2a', width: 2 },
          marker: { color: '#c25b2a', size: 6 } },
        { type: 'scatter', mode: 'lines', name: 'Perfect Calibration',
          x: [0, 1], y: [0, 1],
          line: { color: '#c0bab2', dash: 'dash', width: 1 } },
      ]}
      layout={layout}
      config={CONFIG} style={{ width: '100%' }} useResizeHandler
    />
  );
}

// ── Confusion Matrix ───────────────────────────────────────────────────────────
export function ConfusionMatrix({ height = 240 }) {
  const z = [[412, 38], [91, 459]];
  const text = z.map(row => row.map(v => `${v}`));
  const layout = makeLayout({ height, margin: { t: 8, r: 12, b: 50, l: 90 } });
  return (
    <Plot
      data={[{
        type: 'heatmap', z,
        x: ['Pred: No Signal', 'Pred: Signal'],
        y: ['True: No Signal', 'True: Signal'],
        colorscale: [[0, cssVar('--bg') || '#f5f3f0'], [0.5, '#e8e4de'], [1, '#2d6a4f']],
        showscale: false,
        text, texttemplate: '%{text}',
        textfont: { size: 18, color: cssVar('--text-base') || '#18181b' },
        hovertemplate: '%{y}<br>%{x}<br>Count: %{z}<extra></extra>',
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
  return (
    <Plot
      data={[
        { type: 'scatterpolar', fill: 'toself', name: 'Fixed Sweep',
          r: [0.41, 0.91, 0.31, 0.18, 0.71, 0.30], theta: cats,
          line: { color: '#c0bab2' }, fillcolor: 'rgba(192,186,178,0.15)' },
        { type: 'scatterpolar', fill: 'toself', name: 'Adaptive',
          r: [0.67, 0.94, 0.54, 0.47, 0.87, 0.70], theta: cats,
          line: { color: '#78716c' }, fillcolor: 'rgba(120,113,108,0.15)' },
        { type: 'scatterpolar', fill: 'toself', name: 'ML-Adaptive',
          r: [0.84, 0.96, 0.71, 0.73, 0.93, 1.00], theta: cats,
          line: { color: '#c25b2a', width: 2 }, fillcolor: 'rgba(194,91,42,0.12)' },
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
          bgcolor: 'rgba(0,0,0,0)', bordercolor: grid, borderwidth: 1,
          font: { ...font, size: 10 }, x: 0.01, y: 0.99,
        },
        height,
        margin: { t: 20, r: 20, b: 20, l: 20 },
      }}
      config={CONFIG} style={{ width: '100%' }} useResizeHandler
    />
  );
}
