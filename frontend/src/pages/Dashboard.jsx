import { Link } from 'react-router-dom';
import { Play, Plus, BarChart3, Radio, ArrowRight, Target, AlertTriangle, Crosshair, Clock, Award, Layers, ChevronRight } from 'lucide-react';
import { CumulativeRewardChart, HitMissTimeline } from '../components/charts';
import { generateHitMissTimeline, generateRewardCurves, kpiSummary, benchmarkData } from '../data/mockData';
import { useMemo } from 'react';

const KPIS = [
  { key: 'pd',          label: 'Prob. of Detection',  fmt: v => (v * 100).toFixed(1) + '%', icon: Target,        pos: true  },
  { key: 'far',         label: 'False Alarm Rate',     fmt: v => (v * 100).toFixed(1) + '%', icon: AlertTriangle, pos: false },
  { key: 'obs_rate',    label: 'Observation Rate',     fmt: v => (v * 100).toFixed(1) + '%', icon: Crosshair,     pos: true  },
  { key: 'avg_latency', label: 'Avg Obs. Latency',     fmt: v => v.toFixed(1) + ' s',        icon: Clock,         pos: false },
  { key: 'coverage',    label: 'Spectrum Coverage',    fmt: v => (v * 100).toFixed(1) + '%', icon: Layers,        pos: true  },
  { key: 'reward',      label: 'Cumulative Reward',    fmt: v => v.toFixed(1),               icon: Award,         pos: true  },
];

const DELTAS = { pd: +0.429, far: -0.049, obs_rate: +0.401, avg_latency: -13.0, coverage: +0.22, reward: +288.5 };

function KPICard({ label, value, delta, fmt, pos }) {
  const positive  = pos ? delta > 0 : delta < 0;
  const display   = fmt ? fmt(value) : value;
  const absDelta  = Math.abs(delta * (typeof value === 'number' && value <= 1 ? 100 : 1)).toFixed(1);
  const suffix    = typeof value === 'number' && value <= 1 ? 'pp' : '';
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{display}</div>
      {delta !== undefined && (
        <div className={`kpi-delta ${positive ? 'pos' : 'neg'}`}>
          {positive ? '+' : '−'}{absDelta}{suffix} vs fixed sweep
        </div>
      )}
    </div>
  );
}

function LoopDiagram() {
  const steps = [
    { label: 'Simulated\nEnvironment', symbol: '~' },
    { label: 'Virtual\nReceiver',      symbol: 'Rx' },
    { label: 'Observation\n& Features', symbol: 'f' },
    { label: 'ML\nPrediction',         symbol: 'p' },
    { label: 'Scheduler\nDecision',    symbol: 'S' },
    { label: 'Hit / Miss\nOutcome',    symbol: 'H' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', flexWrap: 'wrap', gap: 8 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="loop-step">
            <div className="loop-icon">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: 'var(--accent)' }}>{s.symbol}</span>
            </div>
            <div className="loop-label">{s.label}</div>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight size={14} color="var(--text-faint)" style={{ flexShrink: 0 }} aria-hidden="true" />
          )}
        </div>
      ))}
      <div style={{ width: '100%', textAlign: 'center', marginTop: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
          Closed feedback loop — outcomes update scheduler state before next decision
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const events     = useMemo(() => generateHitMissTimeline(50), []);
  const rewardData = useMemo(() => generateRewardCurves(80), []);

  return (
    <div>
      {/* Page heading */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">Intelligent spectrum observation scheduler · Research platform</p>
        </div>
        <div className="flex gap-2">
          <Link to="/simulation" className="btn btn-primary">
            <Play size={13} aria-hidden="true" /> Start Demo
          </Link>
          <Link to="/experiments" className="btn btn-secondary">
            <Plus size={13} aria-hidden="true" /> New Experiment
          </Link>
          <Link to="/analytics" className="btn btn-ghost">
            <BarChart3 size={13} aria-hidden="true" /> Compare Runs
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            <Target size={12} aria-hidden="true" /> Key Performance Indicators
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
            run-004 · ML-Adaptive · sc-001 · Seed 42
          </span>
        </div>
        <div className="kpi-grid">
          {KPIS.map(({ key, label, fmt, pos }) => (
            <KPICard
              key={key}
              label={label}
              value={kpiSummary[key]}
              delta={DELTAS[key]}
              fmt={fmt}
              pos={pos}
            />
          ))}
        </div>
      </div>

      {/* Mid row */}
      <div className="grid-2 section">
        {/* Hit/Miss Timeline */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Radio size={12} aria-hidden="true" /> Hit / Miss Timeline</div>
            <div className="flex gap-2">
              <span className="badge badge-hit">HIT</span>
              <span className="badge badge-miss">MISS</span>
              <span className="badge badge-fa">FA</span>
            </div>
          </div>
          <HitMissTimeline events={events} height={180} />
        </div>

        {/* Scheduler Decision */}
        <div className="card card-live">
          <div className="card-header">
            <div className="card-title">Scheduler Decision</div>
            <span className="badge badge-info">ML-Adaptive</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 12 }}>
            Active model: <strong style={{ color: 'var(--text-base)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>GradientBoostEW v1.0.0</strong>
          </div>
          <div style={{ background: 'var(--bg-inset)', padding: 14, marginBottom: 12 }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Selected Observation</span>
              <span className="badge badge-info">Band 5 · 1025 MHz</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 400, color: 'var(--accent)', lineHeight: 1 }}>
              P(active) = 0.913
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
              Uncertainty σ = 0.082 · Score = 0.871
            </div>
          </div>
          <div className="panel-accent" style={{ fontSize: 12, color: 'var(--text-mid)' }}>
            Selected because predicted activity is high (0.913) and uncertainty is low (0.082),
            with 4.2 s since last observation.
          </div>
          <div className="divider" />
          <div className="grid-2" style={{ gap: 10 }}>
            {[['Historical Rate','0.74'],['Recency','4.2 s'],['Periodicity','0.61'],['Info Gain','0.53']].map(([k,v]) => (
              <div key={k}>
                <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 2 }}>{k}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 400, color: 'var(--text-base)' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reward + Comparison */}
      <div className="grid-2 section">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Award size={12} aria-hidden="true" /> Cumulative Reward</div>
            <Link to="/analytics" className="btn btn-ghost btn-sm">
              Full Analytics <ArrowRight size={11} aria-hidden="true" />
            </Link>
          </div>
          <CumulativeRewardChart data={rewardData} height={220} />
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><BarChart3 size={12} aria-hidden="true" /> Strategy Comparison</div>
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Pd · FAR · Coverage</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Scheduler</th>
                <th>Pd</th>
                <th>FAR</th>
                <th>Coverage</th>
                <th>Reward</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkData.schedulers.map((s, i) => (
                <tr key={s}>
                  <td style={{ fontFamily: 'inherit', color: i === 3 ? 'var(--accent)' : 'var(--text-base)', fontWeight: i === 3 ? 600 : 400 }}>
                    {i === 3 && <span style={{ color: 'var(--accent)', marginRight: 4 }}>★</span>}
                    {s}
                  </td>
                  <td className="mono text-hit">{(benchmarkData.pd[i] * 100).toFixed(1)}%</td>
                  <td className="mono text-warn">{(benchmarkData.far[i] * 100).toFixed(1)}%</td>
                  <td className="mono">{(benchmarkData.coverage[i] * 100).toFixed(1)}%</td>
                  <td className="mono text-accent">{benchmarkData.reward[i].toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback Loop */}
      <div className="card section">
        <div className="card-header">
          <div className="card-title">How SMART-EW Works</div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Simulated data only · No operational receiver control</span>
        </div>
        <LoopDiagram />
      </div>

      {/* Quick actions */}
      <div className="section">
        <div className="section-title mb-3">Quick Actions</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/simulation"  className="btn btn-primary">  <Radio    size={13} aria-hidden="true" /> Live Simulation</Link>
          <Link to="/experiments" className="btn btn-secondary"><Plus     size={13} aria-hidden="true" /> New Experiment</Link>
          <Link to="/analytics"   className="btn btn-secondary"><BarChart3 size={13} aria-hidden="true" /> Compare Runs</Link>
          <Link to="/models"      className="btn btn-secondary"><Layers   size={13} aria-hidden="true" /> Model Lab</Link>
        </div>
      </div>
    </div>
  );
}
