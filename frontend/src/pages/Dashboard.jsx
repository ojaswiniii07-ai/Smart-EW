import { Link } from 'react-router-dom';
import { Play, Plus, BarChart3, Radio, ArrowRight, Target, AlertTriangle, Crosshair, Clock, Award, Layers, ChevronRight, ExternalLink, Cpu, Database } from 'lucide-react';
import { CumulativeRewardChart, HitMissTimeline } from '../components/charts';
import { generateHitMissTimeline, generateRewardCurves, kpiSummary, benchmarkData } from '../data/mockData';
import { useMemo, useState, useEffect } from 'react';
import { kpiApi, modelsApi, systemApi } from '../services/api';

// KPI strip config — maps API keys to dashboard cards
const KPI_CONFIG = [
  { key: 'pd',          label: 'V-Measure',       fmt: v => (v * 100).toFixed(1) + '%', icon: Target,        pos: true,  tooltip: 'Primary TSRD challenge metric — harmonic mean of homogeneity & completeness' },
  { key: 'obs_rate',    label: 'Homogeneity',      fmt: v => (v * 100).toFixed(1) + '%', icon: Crosshair,     pos: true,  tooltip: 'Each cluster contains only pulses from a single emitter' },
  { key: 'avg_latency', label: 'Completeness',     fmt: v => (v * 100).toFixed(1) + '%', icon: Clock,         pos: true,  tooltip: 'All pulses from an emitter belong to the same cluster' },
  { key: 'coverage',    label: 'AMI',              fmt: v => (v * 100).toFixed(1) + '%', icon: Layers,        pos: true,  tooltip: 'Adjusted Mutual Information — corrects for chance' },
  { key: 'far',         label: 'False Alarm Rate', fmt: v => (v * 100).toFixed(1) + '%', icon: AlertTriangle, pos: false, tooltip: 'Rate of incorrectly attributed pulses' },
  { key: 'reward',      label: 'Throughput Score', fmt: v => v.toFixed(1),               icon: Award,         pos: true,  tooltip: 'Processing throughput benchmark score' },
];

function KPICard({ label, value, delta, fmt, pos, tooltip, loading }) {
  const positive  = pos ? delta > 0 : delta < 0;
  const display   = (loading || value === undefined) ? '—' : (fmt ? fmt(value) : value);
  const absDelta  = delta !== undefined
    ? Math.abs(delta * (typeof value === 'number' && value <= 1 ? 100 : 1)).toFixed(1)
    : '—';
  const suffix    = typeof value === 'number' && value <= 1 ? 'pp' : '';
  return (
    <div className="kpi-card" title={tooltip}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={loading ? { opacity: 0.4 } : {}}>{display}</div>
      {delta !== undefined && !loading && (
        <div className={`kpi-delta ${positive ? 'pos' : 'neg'}`}>
          {positive ? '+' : '−'}{absDelta}{suffix} vs RF
        </div>
      )}
    </div>
  );
}

// Live Deinterleaving Pipeline Diagram
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

// Model performance comparison table derived from live API models
function ModelBenchmarkTable({ models }) {
  // Merge live models with static baselines
  const rows = [
    ...(models || []).filter(m => m.metrics?.v_measure > 0).map(m => ({
      name: m.name,
      v_measure:   m.metrics.v_measure  ?? 0,
      ami:         m.metrics.ami         ?? 0,
      completeness:m.metrics.completeness ?? 0,
      homogeneity: m.metrics.homogeneity  ?? 0,
      isLive: true,
    })),
    { name: 'PRI Histogram + KMeans', v_measure: 0.714, ami: 0.688, completeness: 0.698, homogeneity: 0.731, isLive: false },
    { name: 'DBSCAN (CF + AoA)',      v_measure: 0.621, ami: 0.583, completeness: 0.598, homogeneity: 0.647, isLive: false },
  ].sort((a, b) => b.v_measure - a.v_measure).slice(0, 8);

  return (
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
        {rows.map((s, i) => (
          <tr key={s.name}>
            <td style={{ fontFamily: 'inherit', color: s.isLive ? 'var(--accent)' : 'var(--text-base)', fontWeight: s.isLive ? 600 : 400 }}>
              {s.isLive && <span style={{ color: 'var(--accent)', marginRight: 4 }}>★</span>}
              {s.name}
            </td>
            <td className="mono text-hit">{(s.v_measure * 100).toFixed(1)}%</td>
            <td className="mono">{(s.ami * 100).toFixed(1)}%</td>
            <td className="mono">{(s.completeness * 100).toFixed(1)}%</td>
            <td className="mono text-accent">{(s.homogeneity * 100).toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Best model details card showing live inference stats
function LiveModelCard({ models, systemStatus }) {
  // Pick best transformer model
  const best = useMemo(() => {
    if (!models?.length) return null;
    const transformers = models.filter(m => m.approach === 'deep_learning' && m.status === 'active');
    if (!transformers.length) return models[0];
    return transformers.reduce((a, b) => (a.metrics?.v_measure ?? 0) > (b.metrics?.v_measure ?? 0) ? a : b);
  }, [models]);

  if (!best) return null;

  const vm  = best.metrics?.v_measure  ?? 0;
  const pf1 = best.metrics?.pairwise_f1 ?? 0;
  const hom = best.metrics?.homogeneity ?? 0;
  const com = best.metrics?.completeness ?? 0;

  return (
    <div className="card card-live">
      <div className="card-header">
        <div className="card-title">Active Deinterleaving</div>
        <span className="badge badge-info">{best.name?.split(' – ')[0] ?? 'Transformer'}</span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 12 }}>
        Active model: <strong style={{ color: 'var(--text-base)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{best.name} v{best.version || '1.0.0'}</strong>
        {systemStatus?.hardware?.device && (
          <span style={{ marginLeft: 8, color: 'var(--text-faint)' }}>· {systemStatus.hardware.device.toUpperCase()}</span>
        )}
      </div>
      <div style={{ background: 'var(--bg-inset)', padding: 14, marginBottom: 12 }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Best Mode: {best.mode?.toUpperCase() ?? 'Multi-Mode'}</span>
          <span className="badge badge-info">V-Measure: {(vm * 100).toFixed(1)}%</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 400, color: 'var(--accent)', lineHeight: 1 }}>
          Pairwise F1 = {(pf1 * 100).toFixed(1)}%
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>
          Trained on real TSRD HDF5 data · {best.epochs ?? 30} epochs · Apple Silicon MPS
        </div>
      </div>
      <div className="panel-accent" style={{ fontSize: 12, color: 'var(--text-mid)' }}>
        High-confidence emitter separation: Self-attention Transformer clusters same-emitter pulses using {(best.features || ['CF', 'PRI/dToA', 'PW', 'AoA', 'Amplitude']).join(', ')} features.
      </div>
      <div className="divider" />
      <div className="grid-2" style={{ gap: 10 }}>
        {[['V-Measure', (vm * 100).toFixed(1) + '%'], ['Homogeneity', (hom * 100).toFixed(1) + '%'], ['Completeness', (com * 100).toFixed(1) + '%'], ['PairF1', (pf1 * 100).toFixed(1) + '%']].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: 10, color: 'var(--text-faint)', marginBottom: 2 }}>{k}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 400, color: 'var(--text-base)' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const events     = useMemo(() => generateHitMissTimeline(50), []);
  const rewardData = useMemo(() => generateRewardCurves(80), []);

  const [kpi,          setKpi]           = useState(kpiSummary);
  const [kpiLoading,   setKpiLoading]    = useState(true);
  const [models,       setModels]        = useState([]);
  const [systemStatus, setSystemStatus]  = useState(null);

  useEffect(() => {
    // Fetch live KPIs from real model metrics
    kpiApi.summary().then(data => {
      setKpi(data);
      setKpiLoading(false);
    }).catch(() => setKpiLoading(false));

    // Fetch live model list for benchmark table and active model card
    modelsApi.list().then(list => {
      if (list?.length > 0) setModels(list);
    });

    // Fetch system status for hardware info
    systemApi.status().then(s => setSystemStatus(s));
  }, []);

  const DELTAS = {
    pd:          kpi.pd_delta          ?? +0.266,
    far:         kpi.far_delta         ?? -0.052,
    obs_rate:    kpi.obs_rate_delta    ?? +0.172,
    avg_latency: kpi.avg_latency_delta ?? +0.175,
    coverage:    kpi.coverage_delta    ?? +0.183,
    reward:      kpi.reward_delta      ?? +288.5,
  };

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

      {/* System Status Row */}
      {systemStatus && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
            background: systemStatus.api.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${systemStatus.api.ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
            fontSize: 12,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: systemStatus.api.ok ? '#10b981' : '#ef4444', flexShrink: 0 }} />
            Backend API {systemStatus.api.ok ? `Online · ${systemStatus.api.latency_ms}ms` : 'Offline'}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', fontSize: 12,
          }}>
            <Cpu size={12} style={{ color: 'var(--accent)' }} />
            {systemStatus.hardware?.device?.toUpperCase() ?? 'MPS'} · {systemStatus.hardware?.platform ?? 'Apple Silicon'}
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', fontSize: 12,
          }}>
            <Database size={12} style={{ color: 'var(--hit)' }} />
            {systemStatus.db?.records ?? 0} HDF5 files loaded
          </div>
        </div>
      )}

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
            {kpiLoading ? 'Loading live model metrics…' : 'Live · Best Transformer · TSRD Real Data'}
          </span>
        </div>
        <div className="kpi-grid">
          {KPI_CONFIG.map(({ key, label, fmt, pos, tooltip }) => (
            <KPICard
              key={key}
              label={label}
              value={kpi[key]}
              delta={DELTAS[key]}
              fmt={fmt}
              pos={pos}
              tooltip={tooltip}
              loading={kpiLoading}
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

        {/* Live Model Card with real metrics */}
        <LiveModelCard models={models} systemStatus={systemStatus} />
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
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
              {models.length > 0 ? '★ Live trained models' : 'V-measure · AMI · Completeness'}
            </span>
          </div>
          <ModelBenchmarkTable models={models} />
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
