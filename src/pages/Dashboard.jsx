import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Play, Plus, BarChart3, Radio,
  ArrowRight, Target, AlertTriangle, Crosshair, Clock, Award, Layers,
  ChevronRight, Info,
} from 'lucide-react';
import { kpiApi, runsApi } from '../services/api';
import { CumulativeRewardChart, HitMissTimeline } from '../components/charts';
import { generateHitMissTimeline, generateRewardCurves, kpiSummary, benchmarkData } from '../data/mockData';
import { useMemo } from 'react';

const KPIS = [
  { key: 'pd',           label: 'Prob. of Detection',       fmt: v => (v * 100).toFixed(1) + '%', icon: Target,    pos: true },
  { key: 'far',          label: 'False Alarm Rate',          fmt: v => (v * 100).toFixed(1) + '%', icon: AlertTriangle, pos: false },
  { key: 'obs_rate',     label: 'Observation Rate',          fmt: v => (v * 100).toFixed(1) + '%', icon: Crosshair, pos: true },
  { key: 'avg_latency',  label: 'Avg Obs. Latency',          fmt: v => v.toFixed(1) + ' s',        icon: Clock,     pos: false },
  { key: 'coverage',     label: 'Spectrum Coverage',         fmt: v => (v * 100).toFixed(1) + '%', icon: Layers,    pos: true },
  { key: 'reward',       label: 'Cumulative Reward',         fmt: v => v.toFixed(1),               icon: Award,     pos: true },
];

function KPICard({ label, value, delta, fmt, icon: Icon, pos }) {
  const positive = pos ? delta > 0 : delta < 0;
  const display = fmt ? fmt(value) : value;
  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between mb-2">
        <div className="kpi-label">{label}</div>
        <Icon size={14} color="var(--text-muted)" />
      </div>
      <div className="kpi-value">{display}</div>
      {delta !== undefined && (
        <div className={`kpi-delta ${positive ? 'pos' : 'neg'}`}>
          {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs((delta * (typeof value === 'number' && value <= 1 ? 100 : 1))).toFixed(1)}
          {typeof value === 'number' && value <= 1 ? 'pp' : ''} vs fixed sweep
        </div>
      )}
    </div>
  );
}

const DELTAS = { pd: +0.429, far: -0.049, obs_rate: +0.401, avg_latency: -13.0, coverage: +0.22, reward: +288.5 };

function LoopDiagram() {
  const steps = [
    { icon: '🌐', label: 'Simulated\nEnvironment' },
    { icon: '📡', label: 'Virtual\nReceiver' },
    { icon: '🔬', label: 'Observation\n& Features' },
    { icon: '🤖', label: 'ML\nPrediction' },
    { icon: '🧭', label: 'Scheduler\nDecision' },
    { icon: '✅', label: 'Hit / Miss\nOutcome' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', flexWrap: 'wrap', gap: 8 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="loop-step">
            <div className="loop-icon">{s.icon}</div>
            <div className="loop-label" style={{ whiteSpace: 'pre-line' }}>{s.label}</div>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          )}
        </div>
      ))}
      <div style={{ width: '100%', textAlign: 'center', marginTop: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          ↩ Closed feedback loop — outcomes update scheduler state → next decision
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const events = useMemo(() => generateHitMissTimeline(50), []);
  const rewardData = useMemo(() => generateRewardCurves(80), []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Overview Dashboard</h1>
          <p className="page-subtitle">Intelligent spectrum observation scheduler · Research platform</p>
        </div>
        <div className="flex gap-2">
          <Link to="/simulation" className="btn btn-primary">
            <Play size={14} /> Start Demo
          </Link>
          <Link to="/experiments" className="btn btn-secondary">
            <Plus size={14} /> New Experiment
          </Link>
          <Link to="/analytics" className="btn btn-ghost">
            <BarChart3 size={14} /> Compare Runs
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="section">
        <div className="section-header">
          <div className="section-title"><Target size={14} /> Key Performance Indicators</div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Run run-004 · ML-Adaptive · Scenario sc-001 · Seed 42</span>
        </div>
        <div className="kpi-grid">
          {KPIS.map(({ key, label, fmt, icon, pos }) => (
            <KPICard
              key={key}
              label={label}
              value={kpiSummary[key]}
              delta={DELTAS[key]}
              fmt={fmt}
              icon={icon}
              pos={pos}
            />
          ))}
        </div>
      </div>

      {/* Mid row: Hit/Miss + Scheduler card */}
      <div className="grid-2 section">
        {/* Hit/Miss Timeline */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Radio size={14} /> Hit / Miss Timeline</div>
            <div className="flex gap-2">
              <span className="badge badge-hit">● HIT</span>
              <span className="badge badge-miss">✕ MISS</span>
              <span className="badge badge-fa">▲ FA</span>
            </div>
          </div>
          <HitMissTimeline events={events} height={180} />
        </div>

        {/* Current Scheduler Decision */}
        <div className="card card-live">
          <div className="card-header">
            <div className="card-title">🧭 Scheduler Decision</div>
            <span className="badge badge-info">ML-Adaptive</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Current strategy: <strong style={{ color: 'var(--pred)' }}>GradientBoostEW v1.0.0</strong>
          </div>
          <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Selected Observation</span>
              <span className="badge badge-info">Band 5 · 1025 MHz</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
              P(active) = 0.913
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Uncertainty σ = 0.082 &nbsp;·&nbsp; Score = 0.871
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--bg-primary)', borderRadius: 8, padding: 10, borderLeft: '3px solid var(--accent)' }}>
            <Info size={12} style={{ display: 'inline', marginRight: 4 }} />
            Selected because predicted activity is high (0.913) and uncertainty is low (0.082), with 4.2 s since last observation.
          </div>
          <div className="divider" />
          <div className="grid-2" style={{ gap: 8 }}>
            {[['Historical Rate','0.74'],['Recency','4.2 s'],['Periodicity','0.61'],['Info Gain','0.53']].map(([k,v]) => (
              <div key={k}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cumulative Reward + Baseline */}
      <div className="grid-2 section">
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Award size={14} /> Cumulative Reward Over Time</div>
            <Link to="/analytics" className="btn btn-ghost btn-sm">Full Analytics <ArrowRight size={11} /></Link>
          </div>
          <CumulativeRewardChart data={rewardData} height={220} />
        </div>

        {/* Baseline Comparison */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><BarChart3 size={14} /> Strategy Comparison</div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pd · FAR · Coverage</span>
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
                  <td style={{ fontFamily: 'inherit', color: i === 3 ? 'var(--accent)' : 'var(--text-primary)', fontWeight: i === 3 ? 600 : 400 }}>
                    {i === 3 && <span style={{ color: 'var(--accent)', marginRight: 4 }}>★</span>}
                    {s}
                  </td>
                  <td style={{ color: 'var(--hit)' }}>{(benchmarkData.pd[i] * 100).toFixed(1)}%</td>
                  <td style={{ color: 'var(--false-alarm)' }}>{(benchmarkData.far[i] * 100).toFixed(1)}%</td>
                  <td>{(benchmarkData.coverage[i] * 100).toFixed(1)}%</td>
                  <td style={{ color: 'var(--accent)' }}>{benchmarkData.reward[i].toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback Loop */}
      <div className="card section">
        <div className="card-header">
          <div className="card-title">🔄 How SMART-EW Works — Closed Feedback Loop</div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Simulated data only · No operational receiver control</span>
        </div>
        <LoopDiagram />
      </div>

      {/* Quick Actions */}
      <div className="section">
        <div className="section-title mb-3">Quick Actions</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { to: '/simulation', label: 'Open Live Simulation', icon: <Radio size={14} />, cls: 'btn-primary' },
            { to: '/experiments', label: 'New Experiment', icon: <Plus size={14} />, cls: 'btn-secondary' },
            { to: '/analytics', label: 'Compare Runs', icon: <BarChart3 size={14} />, cls: 'btn-secondary' },
            { to: '/models', label: 'Model Lab', icon: <Layers size={14} />, cls: 'btn-secondary' },
          ].map(({ to, label, icon, cls }) => (
            <Link key={to} to={to} className={`btn ${cls}`}>{icon} {label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
