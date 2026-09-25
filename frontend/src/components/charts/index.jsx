import Plot from 'react-plotly.js';
import { useMemo } from 'react';
import { generateWaterfallData, NUM_BANDS, NUM_TIME_SLOTS } from '../../data/mockData';

const LAYOUT_BASE = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: { family: 'JetBrains Mono, monospace', color: '#8da0bc', size: 10 },
  margin: { t: 8, r: 12, b: 40, l: 50 },
  xaxis: {
    title: { text: 'Time Slot', font: { size: 11 } },
    gridcolor: '#1e2d47',
    zerolinecolor: '#1e2d47',
    tickfont: { size: 9 },
  },
  yaxis: {
    title: { text: 'Band Index', font: { size: 11 } },
    gridcolor: '#1e2d47',
    zerolinecolor: '#1e2d47',
    tickfont: { size: 9 },
  },
};

const CONFIG = { displayModeBar: false, responsive: true };

// ── Waterfall / Spectrogram ──────────────────────────────────────────────────
export function WaterfallChart({ height = 320, observations = [], currentBand = 5 }) {
  const z = useMemo(() => generateWaterfallData(), []);

  const traces = [
    {
      type: 'heatmap',
      z: z,
      colorscale: [
        [0.0, '#0a0d14'],
        [0.1, '#0d2040'],
        [0.3, '#0e3f8e'],
        [0.5, '#1a6fc4'],
        [0.7, '#2daacc'],
        [0.85,'#4aeaac'],
        [1.0, '#e8ffa0'],
      ],
      showscale: true,
      colorbar: {
        thickness: 10,
        outlinewidth: 0,
        tickfont: { size: 9, color: '#8da0bc' },
        len: 0.8,
        title: { text: 'Power', font: { size: 10, color: '#8da0bc' } },
      },
      name: 'Ground Truth',
      hovertemplate: 'Band %{y} · Slot %{x}<br>Power: %{z:.2f}<extra></extra>',
    },
    // Receiver observation marker
    {
      type: 'scatter',
      x: [NUM_TIME_SLOTS - 1],
      y: [currentBand],
      mode: 'markers',
      marker: { symbol: 'diamond', size: 12, color: '#3b82f6', line: { color: '#fff', width: 1 } },
      name: 'Observation',
      hovertemplate: 'Current Observation<br>Band %{y}<extra></extra>',
    },
  ];

  const layout = {
    ...LAYOUT_BASE,
    height,
    xaxis: { ...LAYOUT_BASE.xaxis, title: { text: 'Time Slot →' } },
    yaxis: { ...LAYOUT_BASE.yaxis, title: { text: '← Band' } },
    legend: {
      bgcolor: 'rgba(13,19,41,0.9)',
      bordercolor: '#1e2d47',
      borderwidth: 1,
      font: { size: 10, color: '#8da0bc' },
      x: 0.01, y: 0.99,
    },
  };

  return <Plot data={traces} layout={layout} config={CONFIG} style={{ width: '100%' }} useResizeHandler />;
}

// ── Occupancy Heatmap ─────────────────────────────────────────────────────────
export function OccupancyHeatmap({ height = 240 }) {
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const bands = Array.from({ length: NUM_BANDS }, (_, i) => `B${i}`);
  const z = useMemo(() => {
    return Array.from({ length: NUM_BANDS }, (_, b) =>
      Array.from({ length: 24 }, (_, t) => {
        const hot = [5, 12, 18, 23, 28, 7, 15];
        return hot.includes(b) ? 0.45 + Math.random() * 0.5 : Math.random() * 0.22;
      })
    );
  }, []);

  return (
    <Plot
      data={[{
        type: 'heatmap',
        z, x: hours, y: bands,
        colorscale: [[0,'#0a0d14'],[0.3,'#0e3f8e'],[0.6,'#2daacc'],[1,'#22c55e']],
        showscale: true,
        colorbar: { thickness: 10, outlinewidth: 0, tickfont: { size: 9, color: '#8da0bc' } },
        hovertemplate: '%{y} · %{x}<br>Occupancy: %{z:.2f}<extra></extra>',
      }]}
      layout={{
        ...LAYOUT_BASE, height,
        xaxis: { ...LAYOUT_BASE.xaxis, title: { text: 'Hour of Day' } },
        yaxis: { ...LAYOUT_BASE.yaxis, title: { text: 'Band' }, tickfont: { size: 8 } },
      }}
      config={CONFIG}
      style={{ width: '100%' }}
      useResizeHandler
    />
  );
}

// ── Hit/Miss Timeline ─────────────────────────────────────────────────────────
export function HitMissTimeline({ events = [], height = 180 }) {
  const hits   = events.filter(e => e.result === 'hit');
  const misses = events.filter(e => e.result === 'miss');
  const fas    = events.filter(e => e.result === 'false_alarm');

  return (
    <Plot
      data={[
        { type: 'scatter', mode: 'markers', name: 'Hit',
          x: hits.map(e => e.t), y: hits.map(e => e.band),
          marker: { color: '#22c55e', size: 8, symbol: 'circle' },
          hovertemplate: 't=%{x}  Band %{y}<br>HIT<extra></extra>' },
        { type: 'scatter', mode: 'markers', name: 'Miss',
          x: misses.map(e => e.t), y: misses.map(e => e.band),
          marker: { color: '#ef4444', size: 8, symbol: 'x' },
          hovertemplate: 't=%{x}  Band %{y}<br>MISS<extra></extra>' },
        { type: 'scatter', mode: 'markers', name: 'False Alarm',
          x: fas.map(e => e.t), y: fas.map(e => e.band),
          marker: { color: '#f59e0b', size: 8, symbol: 'triangle-up' },
          hovertemplate: 't=%{x}  Band %{y}<br>FALSE ALARM<extra></extra>' },
      ]}
      layout={{
        ...LAYOUT_BASE, height,
        xaxis: { ...LAYOUT_BASE.xaxis, title: { text: 'Simulation Time →' } },
        yaxis: { ...LAYOUT_BASE.yaxis, title: { text: 'Band' } },
        legend: { bgcolor: 'rgba(13,19,41,0.9)', bordercolor: '#1e2d47', borderwidth: 1, font: { size: 10, color: '#8da0bc' } },
      }}
      config={CONFIG}
      style={{ width: '100%' }}
      useResizeHandler
    />
  );
}

// ── Cumulative Reward ─────────────────────────────────────────────────────────
export function CumulativeRewardChart({ data, height = 220 }) {
  const { t, fixed, random, adaptive, ml } = data;
  return (
    <Plot
      data={[
        { type: 'scatter', mode: 'lines', name: 'Fixed Sweep', x: t, y: fixed,
          line: { color: '#4a5d78', dash: 'dot', width: 1.5 } },
        { type: 'scatter', mode: 'lines', name: 'Random', x: t, y: random,
          line: { color: '#8da0bc', width: 1.5 } },
        { type: 'scatter', mode: 'lines', name: 'Adaptive Stat.', x: t, y: adaptive,
          line: { color: '#818cf8', width: 2 } },
        { type: 'scatter', mode: 'lines', name: 'ML-Adaptive', x: t, y: ml,
          line: { color: '#3b82f6', width: 2.5 } },
      ]}
      layout={{
        ...LAYOUT_BASE, height,
        xaxis: { ...LAYOUT_BASE.xaxis, title: { text: 'Step →' } },
        yaxis: { ...LAYOUT_BASE.yaxis, title: { text: 'Cumulative Reward' } },
        legend: { bgcolor: 'rgba(13,19,41,0.9)', bordercolor: '#1e2d47', borderwidth: 1, font: { size: 10, color: '#8da0bc' } },
      }}
      config={CONFIG}
      style={{ width: '100%' }}
      useResizeHandler
    />
  );
}

// ── Latency Distribution ──────────────────────────────────────────────────────
export function LatencyDistChart({ data, height = 220 }) {
  return (
    <Plot
      data={[{
        type: 'histogram',
        x: data,
        nbinsx: 30,
        marker: { color: 'rgba(59,130,246,0.6)', line: { color: '#3b82f6', width: 1 } },
        name: 'ML-Adaptive',
      }]}
      layout={{
        ...LAYOUT_BASE, height,
        xaxis: { ...LAYOUT_BASE.xaxis, title: { text: 'Latency (s)' } },
        yaxis: { ...LAYOUT_BASE.yaxis, title: { text: 'Count' } },
        bargap: 0.05,
      }}
      config={CONFIG}
      style={{ width: '100%' }}
      useResizeHandler
    />
  );
}

// ── Benchmark Bar Chart ───────────────────────────────────────────────────────
export function BenchmarkBar({ metric, values, labels, height = 260, yLabel = '' }) {
  const colors = ['#4a5d78', '#8da0bc', '#818cf8', '#3b82f6', '#22c55e'];
  return (
    <Plot
      data={[{
        type: 'bar',
        x: labels,
        y: values,
        marker: { color: colors.slice(0, labels.length) },
        text: values.map(v => v.toFixed(3)),
        textposition: 'outside',
        textfont: { size: 10, color: '#8da0bc' },
        hovertemplate: '%{x}<br>' + metric + ': %{y:.3f}<extra></extra>',
      }]}
      layout={{
        ...LAYOUT_BASE, height,
        yaxis: { ...LAYOUT_BASE.yaxis, title: { text: yLabel || metric } },
        xaxis: { ...LAYOUT_BASE.xaxis, title: { text: '' }, tickfont: { size: 10 } },
        margin: { t: 24, r: 12, b: 60, l: 55 },
      }}
      config={CONFIG}
      style={{ width: '100%' }}
      useResizeHandler
    />
  );
}

// ── ROC Curve ─────────────────────────────────────────────────────────────────
export function ROCCurve({ data, height = 240 }) {
  return (
    <Plot
      data={[
        { type: 'scatter', mode: 'lines', name: `AUC = ${data.auc}`,
          x: data.fpr, y: data.tpr,
          line: { color: '#3b82f6', width: 2 },
          fill: 'tozeroy', fillcolor: 'rgba(59,130,246,0.08)' },
        { type: 'scatter', mode: 'lines', name: 'Random Chance',
          x: [0,1], y: [0,1],
          line: { color: '#4a5d78', dash: 'dash', width: 1 } },
      ]}
      layout={{
        ...LAYOUT_BASE, height,
        xaxis: { ...LAYOUT_BASE.xaxis, title: { text: 'False Positive Rate' }, range: [0,1] },
        yaxis: { ...LAYOUT_BASE.yaxis, title: { text: 'True Positive Rate' }, range: [0,1] },
        legend: { bgcolor: 'rgba(13,19,41,0.9)', bordercolor: '#1e2d47', borderwidth: 1, font: { size: 10, color: '#8da0bc' } },
      }}
      config={CONFIG}
      style={{ width: '100%' }}
      useResizeHandler
    />
  );
}

// ── Feature Importance ────────────────────────────────────────────────────────
export function FeatureImportanceChart({ data, height = 240 }) {
  const sorted = [...data].sort((a, b) => a.importance - b.importance);
  return (
    <Plot
      data={[{
        type: 'bar', orientation: 'h',
        x: sorted.map(d => d.importance),
        y: sorted.map(d => d.feature),
        marker: { color: sorted.map((_, i) => `rgba(59,130,246,${0.4 + i * 0.07})`) },
        hovertemplate: '%{y}<br>Importance: %{x:.3f}<extra></extra>',
      }]}
      layout={{
        ...LAYOUT_BASE, height,
        xaxis: { ...LAYOUT_BASE.xaxis, title: { text: 'Importance' } },
        yaxis: { ...LAYOUT_BASE.yaxis, automargin: true, tickfont: { size: 9 } },
        margin: { t: 8, r: 12, b: 40, l: 110 },
      }}
      config={CONFIG}
      style={{ width: '100%' }}
      useResizeHandler
    />
  );
}

// ── Calibration Curve ─────────────────────────────────────────────────────────
export function CalibrationCurve({ data, height = 240 }) {
  return (
    <Plot
      data={[
        { type: 'scatter', mode: 'lines+markers', name: 'Model',
          x: data.predicted, y: data.actual,
          line: { color: '#3b82f6', width: 2 },
          marker: { color: '#3b82f6', size: 6 } },
        { type: 'scatter', mode: 'lines', name: 'Perfect Calibration',
          x: [0,1], y: [0,1],
          line: { color: '#4a5d78', dash: 'dash', width: 1 } },
      ]}
      layout={{
        ...LAYOUT_BASE, height,
        xaxis: { ...LAYOUT_BASE.xaxis, title: { text: 'Mean Predicted Probability' }, range: [0,1] },
        yaxis: { ...LAYOUT_BASE.yaxis, title: { text: 'Fraction of Positives' }, range: [0,1] },
        legend: { bgcolor: 'rgba(13,19,41,0.9)', bordercolor: '#1e2d47', borderwidth: 1, font: { size: 10, color: '#8da0bc' } },
      }}
      config={CONFIG}
      style={{ width: '100%' }}
      useResizeHandler
    />
  );
}

// ── Confusion Matrix ──────────────────────────────────────────────────────────
export function ConfusionMatrix({ height = 240 }) {
  const z = [[412, 38], [91, 459]];
  const text = z.map(row => row.map(v => `${v}`));
  return (
    <Plot
      data={[{
        type: 'heatmap',
        z,
        x: ['Pred: No Signal', 'Pred: Signal'],
        y: ['True: No Signal', 'True: Signal'],
        colorscale: [[0,'#0a0d14'],[0.5,'#0e3f8e'],[1,'#22c55e']],
        showscale: false,
        text,
        texttemplate: '%{text}',
        textfont: { size: 16, color: '#e8edf8' },
        hovertemplate: '%{y}<br>%{x}<br>Count: %{z}<extra></extra>',
      }]}
      layout={{
        ...LAYOUT_BASE, height,
        margin: { t: 8, r: 12, b: 50, l: 90 },
      }}
      config={CONFIG}
      style={{ width: '100%' }}
      useResizeHandler
    />
  );
}

// ── Radar / Spider ─────────────────────────────────────────────────────────────
export function SchedulerRadar({ height = 300 }) {
  const cats = ['Pd', 'Low FAR', 'Obs Rate', 'Low Latency', 'Coverage', 'Reward'];
  return (
    <Plot
      data={[
        { type: 'scatterpolar', fill: 'toself', name: 'Fixed Sweep',
          r: [0.41, 0.91, 0.31, 0.18, 0.71, 0.30],
          theta: cats, line: { color: '#4a5d78' }, fillcolor: 'rgba(74,93,120,0.15)' },
        { type: 'scatterpolar', fill: 'toself', name: 'Adaptive',
          r: [0.67, 0.94, 0.54, 0.47, 0.87, 0.70],
          theta: cats, line: { color: '#818cf8' }, fillcolor: 'rgba(129,140,248,0.15)' },
        { type: 'scatterpolar', fill: 'toself', name: 'ML-Adaptive',
          r: [0.84, 0.96, 0.71, 0.73, 0.93, 1.00],
          theta: cats, line: { color: '#3b82f6' }, fillcolor: 'rgba(59,130,246,0.2)' },
      ]}
      layout={{
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { family: 'JetBrains Mono, monospace', color: '#8da0bc', size: 10 },
        polar: {
          bgcolor: 'transparent',
          radialaxis: { visible: true, range: [0, 1], gridcolor: '#1e2d47', tickfont: { size: 9 } },
          angularaxis: { gridcolor: '#1e2d47', tickfont: { size: 10, color: '#8da0bc' } },
        },
        legend: { bgcolor: 'rgba(13,19,41,0.9)', bordercolor: '#1e2d47', borderwidth: 1, font: { size: 10, color: '#8da0bc' } },
        height,
        margin: { t: 20, r: 20, b: 20, l: 20 },
      }}
      config={CONFIG}
      style={{ width: '100%' }}
      useResizeHandler
    />
  );
}
