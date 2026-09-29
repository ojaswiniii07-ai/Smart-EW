import { Link } from 'react-router-dom';
import { Play, Plus, BarChart3, Radio, ArrowRight, Target, AlertTriangle, Crosshair, Clock, Award, Layers, ChevronRight, ExternalLink } from 'lucide-react';
import { CumulativeRewardChart, HitMissTimeline } from '../components/charts';
import { generateHitMissTimeline, generateRewardCurves, kpiSummary, benchmarkData } from '../data/mockData';
import { useMemo } from 'react';

// KPIs updated to reflect TSRD / deinterleaving metrics
const KPIS = [
  { key: 'pd',          label: 'V-Measure',       fmt: v => (v * 100).toFixed(1) + '%', icon: Target,        pos: true,  tooltip: 'Primary TSRD challenge metric — harmonic mean of homogeneity & completeness' },
  { key: 'obs_rate',    label: 'Homogeneity',      fmt: v => (v * 100).toFixed(1) + '%', icon: Crosshair,     pos: true,  tooltip: 'Each cluster contains only pulses from a single emitter' },
  { key: 'avg_latency', label: 'Completeness',     fmt: v => (v * 100).toFixed(1) + '%', icon: Clock,         pos: true,  tooltip: 'All pulses from an emitter belong to the same cluster' },
  { key: 'coverage',    label: 'AMI',              fmt: v => (v * 100).toFixed(1) + '%', icon: Layers,        pos: true,  tooltip: 'Adjusted Mutual Information — corrects for chance' },
  { key: 'far',         label: 'False Alarm Rate', fmt: v => (v * 100).toFixed(1) + '%', icon: AlertTriangle, pos: false, tooltip: 'Rate of incorrectly attributed pulses' },
  { key: 'reward',      label: 'Throughput Score', fmt: v => v.toFixed(1),               icon: Award,         pos: true,  tooltip: 'Processing throughput benchmark score' },
];

const DELTAS = {
  pd: +0.266, far: -0.052, obs_rate: +0.172, avg_latency: +0.175, coverage: +0.183, reward: +288.5,
};

function KPICard({ label, value, delta, fmt, pos, tooltip }) {
  const positive  = pos ? delta > 0 : delta < 0;
  const display   = fmt ? fmt(value) : value;
  const absDelta  = Math.abs(delta * (typeof value === 'number' && value <= 1 ? 100 : 1)).toFixed(1);
  const suffix    = typeof value === 'number' && value <= 1 ? 'pp' : '';
  return (
    <div className="kpi-card" title={tooltip}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{display}</div>
      {delta !== undefined && (
        <div className={`kpi-delta ${positive ? 'pos' : 'neg'}`}>
          {positive ? '+' : '−'}{absDelta}{suffix} vs DBSCAN
        </div>
      )}
    </div>
  );
}

// Deinterleaving pipeline diagram
function DeinterleavingDiagram() {
  const steps = [
    { label: 'Multiple\nRadar Emitters', symbol: 'Tx', color: '#818cf8' },
    { label: 'Interleaved\nPulse Train',  symbol: '~',  color: '#f59e0b' },
    { label: 'PDW\nExtraction',           symbol: 'PDW', color: 'var(--text-sub)' },
    { label: 'Embedding\nModel',          symbol: 'E',  color: 'var(--accent)' },
    { label: 'Cluster\n& Label',          symbol: 'C',  color: 'var(--hit)' },
    { label: 'V-Measure\nEvaluation',     symbol: 'V',  color: '#f59e0b' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', flexWrap: 'wrap', gap: 8 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="loop-step">
            <div className="loop-icon">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500, color: s.color }}>{s.symbol}</span>
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
          Deinterleaving pipeline — PDW = {'{'}ToA, CF, PW, AoA, Amplitude{'}'} · Primary metric: V-measure (TSRD Challenge)
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
          <p className="page-subtitle">
            Radar Pulse Deinterleaving · TSRD Benchmark Platform ·{' '}
            <a
              href="https://huggingface.co/datasets/alan-turing-institute/turing-synthetic-radar-dataset"
              target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--accent)', textDecoration: 'none' }}
            >
              Turing Synthetic Radar Dataset <ExternalLink size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </a>
          </p>
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

      {/* TSRD Info Banner */}
      <div className="card section" style={{ borderColor: 'rgba(59,130,246,0.25)', background: 'rgba(59,130,246,0.04)', marginBottom: 16 }}>
        <div className="flex items-center justify-between">
          <div style={{ fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-base)' }}>Turing Synthetic Radar Dataset (TSRD)</strong> — 
            The first publicly available, comprehensively simulated pulse train dataset for radar deinterleaving research.
            Over <strong style={{ color: 'var(--accent)' }}>4 billion pulses</strong> across{' '}
            <strong style={{ color: 'var(--accent)' }}>6,000 pulse trains</strong>, up to{' '}
            <strong style={{ color: 'var(--accent)' }}>90 simultaneous emitters</strong> per train.
            Each pulse described by 5 PDW parameters: ToA · CF · PW · AoA · Amplitude.
          </div>
          <div className="flex gap-2" style={{ flexShrink: 0, marginLeft: 16 }}>
            <a
              href="https://huggingface.co/datasets/alan-turing-institute/turing-synthetic-radar-dataset"
              target="_blank" rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
            >
              <ExternalLink size={11} /> HuggingFace
            </a>
            <Link to="/datasets" className="btn btn-ghost btn-sm">
              <Layers size={11} /> Dataset Manager
            </Link>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            <Target size={12} aria-hidden="true" /> Deinterleaving Performance Metrics
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
            TransformerDeinterleaver · TSRD-Stare · Seed 42
          </span>
        </div>
        <div className="kpi-grid">
          {KPIS.map(({ key, label, fmt, pos, tooltip }) => (
            <KPICard
              key={key}
              label={label}
              value={kpiSummary[key]}
              delta={DELTAS[key]}
              fmt={fmt}
              pos={pos}
              tooltip={tooltip}
            />
          ))}
        </div>
      </div>

      {/* Mid row */}
      <div className="grid-2 section">
        {/* Pulse Classification Timeline */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Radio size={12} aria-hidden="true" /> Pulse Classification Timeline</div>
            <div className="flex gap-2">
              <span className="badge badge-hit">CORRECT</span>
              <span className="badge badge-miss">WRONG</span>
              <span className="badge badge-fa">AMBIGUOUS</span>
            </div>
          </div>
          <HitMissTimeline events={events} height={180} />
        </div>

        {/* Current Deinterleaving Decision */}
        <div className="card card-live">
          <div className="card-header">
            <div className="card-title">Active Deinterleaving</div>
            <span className="badge badge-info">TransformerDeinterleaver</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 12 }}>
            Active model: <strong style={{ color: 'var(--text-base)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>TransformerDeinterleaver v1.0.0</strong>
          </div>
          <div style={{ background: 'var(--bg-inset)', padding: 14, marginBottom: 12 }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Latest Classified Pulse</span>
              <span className="badge badge-info">CF: 2320 MHz · AoA: 120.3°</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 400, color: 'var(--accent)', lineHeight: 1 }}>
              Emitter #5 · P(match) = 0.913
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
              PW = 1.8 μs · ToA = 1247.32 μs · Amplitude = −55 dBm
            </div>
          </div>
          <div className="panel-accent" style={{ fontSize: 12, color: 'var(--text-mid)' }}>
            High confidence assignment: CF and AoA closely match Emitter #5 embedding.
            V-measure contribution: +0.0012.
          </div>
          <div className="divider" />
          <div className="grid-2" style={{ gap: 10 }}>
            {[['CF Match', '0.94'], ['AoA Match', '0.89'], ['PW Match', '0.77'], ['ToA δ', '±2.1 μs']].map(([k, v]) => (
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
            <div className="card-title"><Award size={12} aria-hidden="true" /> Model Performance Over Pulse Trains</div>
            <Link to="/analytics" className="btn btn-ghost btn-sm">
              Full Analytics <ArrowRight size={11} aria-hidden="true" />
            </Link>
          </div>
          <CumulativeRewardChart data={rewardData} height={220} />
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><BarChart3 size={12} aria-hidden="true" /> Deinterleaving Benchmark</div>
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>V-measure · AMI · Completeness</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>V-Measure</th>
                <th>AMI</th>
                <th>Complete.</th>
                <th>Homogen.</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkData.schedulers.map((s, i) => (
                <tr key={s}>
                  <td style={{ fontFamily: 'inherit', color: i >= 2 ? 'var(--accent)' : 'var(--text-base)', fontWeight: i >= 2 ? 600 : 400 }}>
                    {i >= 2 && <span style={{ color: 'var(--accent)', marginRight: 4 }}>★</span>}
                    {s}
                  </td>
                  <td className="mono text-hit">{(benchmarkData.v_measure[i] * 100).toFixed(1)}%</td>
                  <td className="mono">{(benchmarkData.ami[i] * 100).toFixed(1)}%</td>
                  <td className="mono">{(benchmarkData.completeness[i] * 100).toFixed(1)}%</td>
                  <td className="mono text-accent">{(benchmarkData.homogeneity[i] * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deinterleaving Pipeline */}
      <div className="card section">
        <div className="card-header">
          <div className="card-title">Radar Pulse Deinterleaving Pipeline</div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>TSRD Challenge · Apache-2.0 · Synthetic data only</span>
        </div>
        <DeinterleavingDiagram />
      </div>

      {/* Quick actions */}
      <div className="section">
        <div className="section-title mb-3">Quick Actions</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/simulation"  className="btn btn-primary">  <Radio    size={13} aria-hidden="true" /> Live Simulation</Link>
          <Link to="/experiments" className="btn btn-secondary"><Plus     size={13} aria-hidden="true" /> New Experiment</Link>
          <Link to="/analytics"   className="btn btn-secondary"><BarChart3 size={13} aria-hidden="true" /> Compare Runs</Link>
          <Link to="/models"      className="btn btn-secondary"><Layers   size={13} aria-hidden="true" /> Model Lab</Link>
          <Link to="/datasets"    className="btn btn-ghost">    <ExternalLink size={13} aria-hidden="true" /> Dataset Manager</Link>
        </div>
      </div>
    </div>
  );
}
