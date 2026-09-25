import { useMemo, useState } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { BenchmarkBar, SchedulerRadar, CumulativeRewardChart, LatencyDistChart } from '../components/charts';
import { benchmarkData, generateRewardCurves, generateLatencyData } from '../data/mockData';

const METRICS = [
  { key: 'pd',          label: 'Prob. of Detection',    values: benchmarkData.pd,          yLabel: 'Pd',         fmt: v => (v*100).toFixed(1)+'%' },
  { key: 'far',         label: 'False Alarm Rate',      values: benchmarkData.far,         yLabel: 'FAR',        fmt: v => (v*100).toFixed(1)+'%' },
  { key: 'obs_rate',    label: 'Observation Rate',      values: benchmarkData.obs_rate,    yLabel: 'Obs. Rate',  fmt: v => (v*100).toFixed(1)+'%' },
  { key: 'avg_latency', label: 'Avg Latency (s)',       values: benchmarkData.avg_latency, yLabel: 'Latency (s)',fmt: v => v.toFixed(1)+'s' },
  { key: 'coverage',    label: 'Coverage',              values: benchmarkData.coverage,    yLabel: 'Coverage',   fmt: v => (v*100).toFixed(1)+'%' },
  { key: 'reward',      label: 'Cumulative Reward',     values: benchmarkData.reward,      yLabel: 'Reward',     fmt: v => v.toFixed(0) },
];

export default function Analytics() {
  const [activeMetric, setActiveMetric] = useState('pd');
  const [tab, setTab] = useState('benchmark');
  const rewardData = useMemo(() => generateRewardCurves(100), []);
  const latencyFixed = useMemo(() => generateLatencyData(200).map(v => v + 12), []);
  const latencyML    = useMemo(() => generateLatencyData(200), []);

  const metric = METRICS.find(m => m.key === activeMetric) ?? METRICS[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Analytics & Benchmarking</h1>
          <p className="page-subtitle">Side-by-side scheduler comparison with confidence intervals · All runs seed 42 · sc-001</p>
        </div>
        <button className="btn btn-secondary btn-sm"><Download size={13} /> Export Report</button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { id: 'benchmark', label: 'Benchmark Comparison' },
          { id: 'radar',     label: 'Strategy Radar' },
          { id: 'reward',    label: 'Reward Curves' },
          { id: 'latency',   label: 'Latency Analysis' },
        ].map(t => (
          <div key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      {tab === 'benchmark' && (
        <>
          {/* Metric selector */}
          <div className="flex gap-2 mb-4 wrap">
            {METRICS.map(m => (
              <button
                key={m.key}
                className="btn btn-sm"
                onClick={() => setActiveMetric(m.key)}
                style={{
                  background: activeMetric === m.key ? 'var(--accent-glow)' : 'var(--bg-card)',
                  borderColor: activeMetric === m.key ? 'rgba(59,130,246,0.4)' : 'var(--border)',
                  color: activeMetric === m.key ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="card mb-4">
            <div className="card-header">
              <div className="card-title"><BarChart3 size={14} /> {metric.label} by Scheduler</div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>5 repeated runs per strategy · 95% CI</span>
            </div>
            <BenchmarkBar
              metric={metric.key}
              values={metric.values}
              labels={benchmarkData.schedulers}
              yLabel={metric.yLabel}
              height={300}
            />
          </div>

          {/* Full comparison table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📊 Full Benchmark Table</div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>All metrics · ★ = best per column</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Scheduler</th>
                    <th>Pd ↑</th>
                    <th>FAR ↓</th>
                    <th>Obs Rate ↑</th>
                    <th>Avg Latency ↓</th>
                    <th>Coverage ↑</th>
                    <th>Reward ↑</th>
                    <th>CI (Pd)</th>
                  </tr>
                </thead>
                <tbody>
                  {benchmarkData.schedulers.map((s, i) => {
                    const best = {
                      pd: i === 4, far: i === 4, obs: i === 4, lat: i === 4, cov: i === 4, rwd: i === 4,
                    };
                    return (
                      <tr key={s} style={{ background: i === 4 ? 'rgba(34,197,94,0.04)' : 'transparent' }}>
                        <td style={{ fontFamily: 'inherit', fontWeight: i >= 3 ? 600 : 400, color: i === 3 ? 'var(--accent)' : i === 4 ? 'var(--hit)' : 'var(--text-primary)' }}>
                          {i >= 3 && '★ '}{s}
                        </td>
                        <td style={{ color: 'var(--hit)' }}>{(benchmarkData.pd[i] * 100).toFixed(1)}%</td>
                        <td style={{ color: 'var(--false-alarm)' }}>{(benchmarkData.far[i] * 100).toFixed(1)}%</td>
                        <td style={{ color: 'var(--accent)' }}>{(benchmarkData.obs_rate[i] * 100).toFixed(1)}%</td>
                        <td style={{ color: 'var(--pred)' }}>{benchmarkData.avg_latency[i].toFixed(1)}s</td>
                        <td>{(benchmarkData.coverage[i] * 100).toFixed(1)}%</td>
                        <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{benchmarkData.reward[i].toFixed(0)}</td>
                        <td style={{ color: 'var(--text-muted)' }}>±{(benchmarkData.ci_pd[i] * 100).toFixed(1)}pp</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'radar' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">🕸 Scheduler Performance Radar</div>
            <div className="flex gap-2">
              <span style={{ fontSize: 11, color: 'var(--hit)' }}>ML-Adaptive</span>
              <span style={{ fontSize: 11, color: '#818cf8' }}>Adaptive Stat.</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Fixed Sweep</span>
            </div>
          </div>
          <SchedulerRadar height={420} />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Axes normalized 0–1. "Low FAR" and "Low Latency" are inverted (higher = better on chart).
          </div>
        </div>
      )}

      {tab === 'reward' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">🏆 Cumulative Reward Over Simulation Steps</div>
          </div>
          <CumulativeRewardChart data={rewardData} height={380} />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Shaded region = ±1σ across 5 repeated runs per strategy.
          </div>
        </div>
      )}

      {tab === 'latency' && (
        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <div className="card-title">⏱ Latency: Fixed Sweep</div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Avg = 18.4 s</span>
            </div>
            <LatencyDistChart data={latencyFixed} height={280} />
          </div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">⏱ Latency: ML-Adaptive</div>
              <span style={{ fontSize: 11, color: 'var(--hit)' }}>Avg = 5.4 s</span>
            </div>
            <LatencyDistChart data={latencyML} height={280} />
          </div>
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <div className="card-title">📊 Latency Statistics</div>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Scheduler</th><th>Mean</th><th>Median</th><th>P90</th><th>P99</th><th>Max</th></tr>
              </thead>
              <tbody>
                {[
                  ['Fixed Sweep',   18.4, 17.2, 28.1, 41.3, 56.2],
                  ['Random',        15.2, 14.1, 24.8, 36.7, 49.1],
                  ['Adaptive Stat.', 9.8,  8.4, 16.2, 24.5, 33.7],
                  ['ML-Adaptive',    5.4,  4.8,  9.1, 14.2, 21.3],
                  ['Bandit',         4.9,  4.3,  8.4, 13.1, 19.8],
                ].map(([name, ...vals]) => (
                  <tr key={name}>
                    <td style={{ fontFamily: 'inherit' }}>{name}</td>
                    {vals.map((v, i) => (
                      <td key={i} style={{ color: name === 'ML-Adaptive' ? 'var(--accent)' : 'inherit' }}>{v.toFixed(1)}s</td>
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
