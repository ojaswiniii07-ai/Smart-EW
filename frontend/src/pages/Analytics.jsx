import { useMemo, useState } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { BenchmarkBar, SchedulerRadar, CumulativeRewardChart, LatencyDistChart } from '../components/charts';
import { benchmarkData, generateRewardCurves, generateLatencyData } from '../data/mockData';

const METRICS = [
  { key: 'pd',          label: 'Prob. of Detection',  values: benchmarkData.pd,          yLabel: 'Pd',          fmt: v => (v*100).toFixed(1)+'%' },
  { key: 'far',         label: 'False Alarm Rate',     values: benchmarkData.far,         yLabel: 'FAR',         fmt: v => (v*100).toFixed(1)+'%' },
  { key: 'obs_rate',    label: 'Observation Rate',     values: benchmarkData.obs_rate,    yLabel: 'Obs. Rate',   fmt: v => (v*100).toFixed(1)+'%' },
  { key: 'avg_latency', label: 'Avg Latency (s)',      values: benchmarkData.avg_latency, yLabel: 'Latency (s)', fmt: v => v.toFixed(1)+'s' },
  { key: 'coverage',    label: 'Coverage',             values: benchmarkData.coverage,    yLabel: 'Coverage',    fmt: v => (v*100).toFixed(1)+'%' },
  { key: 'reward',      label: 'Cumulative Reward',    values: benchmarkData.reward,      yLabel: 'Reward',      fmt: v => v.toFixed(0) },
];

export default function Analytics() {
  const [activeMetric, setActiveMetric] = useState('pd');
  const [tab, setTab] = useState('benchmark');
  const rewardData   = useMemo(() => generateRewardCurves(100), []);
  const latencyFixed = useMemo(() => generateLatencyData(200).map(v => v + 12), []);
  const latencyML    = useMemo(() => generateLatencyData(200), []);

  const metric = METRICS.find(m => m.key === activeMetric) ?? METRICS[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Analytics &amp; Benchmarking</h1>
          <p className="page-subtitle">Side-by-side scheduler comparison · All runs seed 42 · sc-001 · 95% CI shown</p>
        </div>
        <button className="btn btn-secondary btn-sm">
          <Download size={13} aria-hidden="true" /> Export Report
        </button>
      </div>

      <div className="tabs" role="tablist">
        {[
          { id: 'benchmark', label: 'Benchmark' },
          { id: 'radar',     label: 'Strategy Radar' },
          { id: 'reward',    label: 'Reward Curves' },
          { id: 'latency',   label: 'Latency Analysis' },
        ].map(t => (
          <div
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
            role="tab"
            aria-selected={tab === t.id}
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setTab(t.id)}
          >
            {t.label}
          </div>
        ))}
      </div>

      {tab === 'benchmark' && (
        <>
          <div className="flex gap-2 mb-4 wrap">
            {METRICS.map(m => (
              <button
                key={m.key}
                className="btn btn-sm"
                onClick={() => setActiveMetric(m.key)}
                aria-pressed={activeMetric === m.key}
                style={{
                  background:   activeMetric === m.key ? 'var(--accent-bg)' : 'var(--bg-panel)',
                  borderColor:  activeMetric === m.key ? 'var(--accent-border)' : 'var(--border-mid)',
                  color:        activeMetric === m.key ? 'var(--accent)' : 'var(--text-sub)',
                  fontWeight:   activeMetric === m.key ? 600 : 400,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="card mb-4">
            <div className="card-header">
              <div className="card-title"><BarChart3 size={12} aria-hidden="true" /> {metric.label} by Scheduler</div>
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>5 repeated runs per strategy · 95% CI</span>
            </div>
            <BenchmarkBar metric={metric.key} values={metric.values} labels={benchmarkData.schedulers} yLabel={metric.yLabel} height={300} />
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Full Benchmark Table</div>
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>All metrics · ★ = best per column</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Scheduler</th>
                    <th>Pd ↑</th><th>FAR ↓</th><th>Obs Rate ↑</th>
                    <th>Avg Latency ↓</th><th>Coverage ↑</th><th>Reward ↑</th><th>CI (Pd)</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkData.schedulers.map((s, i) => (
                    <tr key={s} style={{ background: i === 4 ? 'var(--hit-bg)' : 'transparent' }}>
                      <td style={{ fontFamily: 'inherit', fontWeight: i >= 3 ? 600 : 400, color: i === 3 ? 'var(--accent)' : i === 4 ? 'var(--hit)' : 'var(--text-base)' }}>
                        {i >= 3 && '★ '}{s}
                      </td>
                      <td className="mono text-hit">{(benchmarkData.pd[i] * 100).toFixed(1)}%</td>
                      <td className="mono text-warn">{(benchmarkData.far[i] * 100).toFixed(1)}%</td>
                      <td className="mono text-accent">{(benchmarkData.obs_rate[i] * 100).toFixed(1)}%</td>
                      <td className="mono text-pred">{benchmarkData.avg_latency[i].toFixed(1)}s</td>
                      <td className="mono">{(benchmarkData.coverage[i] * 100).toFixed(1)}%</td>
                      <td className="mono text-accent" style={{ fontWeight: 600 }}>{benchmarkData.reward[i].toFixed(0)}</td>
                      <td className="mono text-muted">±{(benchmarkData.ci_pd[i] * 100).toFixed(1)}pp</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'radar' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Scheduler Performance Radar</div>
            <div className="flex gap-3">
              <span style={{ fontSize: 11, color: 'var(--hit)' }}>ML-Adaptive</span>
              <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>Adaptive Stat.</span>
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Fixed Sweep</span>
            </div>
          </div>
          <SchedulerRadar height={420} />
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
            Axes normalized 0–1. Low FAR and Low Latency are inverted so higher always means better on this chart.
          </div>
        </div>
      )}

      {tab === 'reward' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Cumulative Reward Over Simulation Steps</div>
          </div>
          <CumulativeRewardChart data={rewardData} height={380} />
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
            Shaded region represents ±1σ across 5 repeated runs per strategy.
          </div>
        </div>
      )}

      {tab === 'latency' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Latency Distribution — Fixed Sweep</div>
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Avg = 18.4 s</span>
            </div>
            <LatencyDistChart data={latencyFixed} height={280} />
          </div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Latency Distribution — ML-Adaptive</div>
              <span style={{ fontSize: 11, color: 'var(--hit)' }}>Avg = 5.4 s</span>
            </div>
            <LatencyDistChart data={latencyML} height={280} />
          </div>
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <div className="card-title">Latency Statistics</div>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Scheduler</th><th>Mean</th><th>Median</th><th>P90</th><th>P99</th><th>Max</th></tr>
              </thead>
              <tbody>
                {[
                  ['Fixed Sweep',    18.4, 17.2, 28.1, 41.3, 56.2],
                  ['Random',         15.2, 14.1, 24.8, 36.7, 49.1],
                  ['Adaptive Stat.', 9.8,  8.4,  16.2, 24.5, 33.7],
                  ['ML-Adaptive',    5.4,  4.8,  9.1,  14.2, 21.3],
                  ['Bandit',         4.9,  4.3,  8.4,  13.1, 19.8],
                ].map(([name, ...vals]) => (
                  <tr key={name}>
                    <td style={{ fontFamily: 'inherit', color: name === 'ML-Adaptive' ? 'var(--accent)' : 'inherit', fontWeight: name === 'ML-Adaptive' ? 600 : 400 }}>{name}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="mono" style={{ color: name === 'ML-Adaptive' ? 'var(--accent)' : 'inherit' }}>{v.toFixed(1)}s</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
