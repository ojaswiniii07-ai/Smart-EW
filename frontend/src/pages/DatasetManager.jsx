import { useState, useEffect } from 'react';
import { Upload, Eye, Download, ExternalLink, Database, Layers, Radio, RefreshCw } from 'lucide-react';
import { mockDatasets, PDW_PARAMS, TSRD_STATS } from '../data/mockData';
import { datasetsApi } from '../services/api';

const STATUS_COLORS = { ready: 'badge-success', preprocessing: 'badge-warn', error: 'badge-error' };

// PDW Schema — the 5 canonical parameters of the Turing Synthetic Radar Dataset
const PDW_SCHEMA = [
  { col: 'toa',       type: 'float64', unit: 'μs',  missing: '0.0%', description: 'Time of Arrival — pulse leading-edge timestamp. Used for PRI estimation.' },
  { col: 'cf',        type: 'float32', unit: 'MHz',  missing: '0.0%', description: 'Centre Frequency — carrier frequency. Primary emitter discriminator.' },
  { col: 'pw',        type: 'float32', unit: 'μs',  missing: '0.0%', description: 'Pulse Width — envelope duration. Indicates radar type / operational mode.' },
  { col: 'aoa',       type: 'float32', unit: '°',   missing: '0.0%', description: 'Angle of Arrival — spatial pulse direction. Spatial emitter discrimination.' },
  { col: 'amplitude', type: 'float32', unit: 'dBm', missing: '0.8%', description: 'Amplitude / Power — peak received power. Relates to emitter range and power.' },
  { col: 'emitter_label', type: 'int32', unit: '—', missing: '0.0%', description: 'Ground truth emitter ID (arbitrary per pulse train — not cross-train consistent).' },
];

// TSRD dataset statistics table
function TSRDStatsTable({ mode, stats }) {
  const rows = [
    ['n trains', stats.train.n_trains, stats.val.n_trains, stats.test.n_trains,
      stats.train.n_trains + stats.val.n_trains + stats.test.n_trains],
    ['Total pulses', stats.train.total_pulses, stats.val.total_pulses, stats.test.total_pulses,
      mode === 'stare' ? '3.86B' : '282.8M'],
    ['Max pulses', stats.train.max_pulses, stats.val.max_pulses, stats.test.max_pulses,
      mode === 'stare' ? '5.92M' : '505.1K'],
    ['Mean pulses', stats.train.mean_pulses, stats.val.mean_pulses, stats.test.mean_pulses, '—'],
    ['Max emitters', stats.train.max_emitters, stats.val.max_emitters, stats.test.max_emitters,
      mode === 'stare' ? 85 : 90],
    ['Mean emitters', stats.train.mean_emitters.toFixed(1), stats.val.mean_emitters.toFixed(1),
      stats.test.mean_emitters.toFixed(1), mode === 'stare' ? '37.2' : '38.5'],
  ];
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th>Train</th>
          <th>Val</th>
          <th>Test</th>
          <th>All</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([metric, train, val, test, all]) => (
          <tr key={metric}>
            <td style={{ color: 'var(--text-sub)', fontFamily: 'inherit' }}>{metric}</td>
            <td className="mono">{train}</td>
            <td className="mono">{val}</td>
            <td className="mono">{test}</td>
            <td className="mono text-accent">{all}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DatasetManager() {
  const [datasets, setDatasets]   = useState(mockDatasets);
  const [rawSplits, setRawSplits] = useState([]);
  const [selected, setSelected]   = useState(null); // null = auto-select first
  const [statsMode, setStatsMode] = useState('stare');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      datasetsApi.list(),
      datasetsApi.rawSplits(),
    ]).then(([shaped, raw]) => {
      if (shaped?.length > 0) {
        setDatasets(shaped);
        setSelected(shaped[0].id);
      }
      if (raw?.length > 0) setRawSplits(raw);
    }).finally(() => setLoading(false));
  }, []);

  const ds = datasets.find(d => d.id === selected) ?? datasets[0];

  const handleRefresh = () => {
    setLoading(true);
    Promise.all([
      datasetsApi.list(),
      datasetsApi.rawSplits(),
    ]).then(([shaped, raw]) => {
      if (shaped?.length > 0) { setDatasets(shaped); if (!selected) setSelected(shaped[0].id); }
      if (raw?.length > 0) setRawSplits(raw);
    }).finally(() => setLoading(false));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Dataset Manager</h1>
          <p className="page-subtitle">
            TSRD catalog · PDW schema · Quality · Splits ·{' '}
            <a
              href="https://huggingface.co/datasets/alan-turing-institute/turing-synthetic-radar-dataset"
              target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--accent)', textDecoration: 'none' }}
            >
              Turing Synthetic Radar Dataset ↗
            </a>
          </p>
        </div>
      <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} /> {loading ? 'Loading…' : 'Refresh'}
          </button>
          <button className="btn btn-ghost btn-sm">
            <Download size={13} /> Export Schema
          </button>
          <button className="btn btn-secondary">
            <Upload size={13} /> Import Dataset
          </button>
        </div>
      </div>

      {/* TSRD Banner */}
      <div className="card section" style={{ borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.05)', marginBottom: 16 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database size={18} style={{ color: 'var(--accent)' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-base)' }}>
                Turing Synthetic Radar Dataset (TSRD) · Apache-2.0
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>
                First publicly available, comprehensively simulated pulse train dataset for radar deinterleaving.
                Created by The Alan Turing Institute DARe team. &gt;4 billion pulses across stare + scan receiver modes.
              </div>
            </div>
          </div>
          <a
            href="https://huggingface.co/datasets/alan-turing-institute/turing-synthetic-radar-dataset"
            target="_blank" rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
          >
            <ExternalLink size={11} /> HuggingFace
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        {/* Catalog + Schema */}
        <div>
          {/* Dataset Catalog */}
          <div className="card mb-4">
            <div className="card-header">
              <div className="card-title"><Layers size={12} aria-hidden="true" /> Dataset Catalog</div>
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                {loading ? 'Loading…' : `${datasets.length} datasets · local tsrd_subset/`}
              </span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Rx Mode</th>
                  <th>License</th>
                  <th>Size (local)</th>
                  <th>Files</th>
                  <th>Status</th>
                  <th>Quality</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {datasets.map(d => (
                  <tr
                    key={d.id}
                    onClick={() => setSelected(d.id)}
                    style={{ cursor: 'pointer', background: selected === d.id ? 'rgba(59,130,246,0.05)' : 'transparent' }}
                  >
                    <td style={{ color: 'var(--accent)', fontFamily: 'inherit' }}>
                      {d.name}
                      {d.hf_url && (
                        <a href={d.hf_url} target="_blank" rel="noopener noreferrer"
                          style={{ marginLeft: 6 }} onClick={e => e.stopPropagation()}>
                          <ExternalLink size={10} style={{ color: 'var(--text-faint)' }} />
                        </a>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-info">{d.receiver_mode}</span>
                    </td>
                    <td style={{ fontFamily: 'inherit', fontSize: 11 }}>{d.license}</td>
                    <td className="mono">{d.size_mb >= 1000 ? `${(d.size_mb / 1000).toFixed(1)} GB` : `${d.size_mb} MB`}</td>
                    <td className="mono">{d.total_files ?? '—'}</td>
                    <td><span className={`badge ${STATUS_COLORS[d.status]}`}>{d.status}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="progress" style={{ width: 50 }}>
                          <div className="progress-fill hit" style={{ width: `${d.quality_score * 100}%` }} />
                        </div>
                        {(d.quality_score * 100).toFixed(0)}%
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-icon btn-sm"><Eye size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PDW Schema */}
          <div className="card mb-4">
            <div className="card-header">
              <div className="card-title"><Radio size={12} aria-hidden="true" /> PDW Schema — Pulse Descriptor Words</div>
              <span className="badge badge-info">TSRD Standard</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 12, lineHeight: 1.6 }}>
              Each pulse in the dataset is represented as a <strong style={{ color: 'var(--text-base)' }}>Pulse Descriptor Word (PDW)</strong> — 
              a 5-parameter feature vector capturing the measurable characteristics of a radar pulse. 
              PDWs serve as the fundamental input for deinterleaving algorithms.
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Type</th>
                  <th>Unit</th>
                  <th>Missing %</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {PDW_SCHEMA.map(({ col, type, unit, missing, description }) => (
                  <tr key={col}>
                    <td style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{col}</td>
                    <td style={{ color: 'var(--pred)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{type}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-sub)' }}>{unit}</td>
                    <td style={{ color: +missing > 1 ? 'var(--false-alarm)' : 'var(--hit)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{missing}</td>
                    <td style={{ fontFamily: 'inherit', color: 'var(--text-sub)', fontSize: 11 }}>{description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TSRD Dataset Statistics */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📊 TSRD Dataset Statistics</div>
              <div className="flex gap-2">
                {['stare', 'scan'].map(mode => (
                  <button
                    key={mode}
                    className={`btn btn-sm ${statsMode === mode ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setStatsMode(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 10 }}>
              {statsMode === 'stare'
                ? 'Stare mode: oracle receiver observing the entire electromagnetic environment simultaneously (except randomly dropped pulses).'
                : 'Scan mode: receiver sweeping through frequency bands at deterministic intervals — more realistic setup.'}
            </div>
            <TSRDStatsTable mode={statsMode} stats={TSRD_STATS[statsMode]} />
          </div>
        </div>

          {/* Live Split Breakdown from backend */}
          {rawSplits.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">📂 Local Split Inventory (tsrd_subset/)</div>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{rawSplits.reduce((a, s) => a + s.file_count, 0)} total files</span>
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>Mode</th><th>Split</th><th>Files</th><th>Size (MB)</th></tr>
                </thead>
                <tbody>
                  {rawSplits.map(s => (
                    <tr key={`${s.mode}-${s.split}`}>
                      <td><span className="badge badge-info">{s.mode}</span></td>
                      <td className="mono" style={{ color: 'var(--text-sub)' }}>{s.split}</td>
                      <td className="mono text-accent">{s.file_count}</td>
                      <td className="mono">{s.size_mb.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        {/* Dataset Detail Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div className="card-title mb-3">🔍 {ds.name}</div>
            {[
              ['Source',         ds.source],
              ['Receiver Mode',  ds.receiver_mode],
              ['Version',        ds.version],
              ['License',        ds.license],
              ['Modality',       ds.modality],
              ['Size',           ds.size_mb >= 1000 ? `${(ds.size_mb / 1000).toFixed(1)} GB` : `${ds.size_mb} MB`],
              ['Freq Range',     ds.freq_range],
              ['Coverage',       ds.time_coverage],
              ['Max Emitters',   ds.max_emitters],
              ['Mean Emitters',  ds.mean_emitters?.toFixed(1) ?? '—'],
              ['Missing',        `${ds.missing_pct.toFixed(1)}%`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{k}</span>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-base)' }}>{v}</span>
              </div>
            ))}
            {ds.hf_url && (
              <a
                href={ds.hf_url}
                target="_blank" rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}
              >
                <ExternalLink size={11} /> View on HuggingFace
              </a>
            )}
          </div>

          {/* Train / Val / Test Splits */}
          <div className="card">
            <div className="card-title mb-3">✂️ Train / Val / Test Split</div>
            <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: `${ds.train_pct}%`, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 600 }}>
                {ds.train_pct}%
              </div>
              <div style={{ width: `${ds.val_pct}%`, background: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 600 }}>
                {ds.val_pct}%
              </div>
              <div style={{ width: `${ds.test_pct}%`, background: '#4a5d78', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 600 }}>
                {ds.test_pct}%
              </div>
            </div>
            <div className="flex gap-3" style={{ fontSize: 11, marginBottom: 8 }}>
              <span style={{ color: 'var(--accent)' }}>■ Train {ds.n_train?.toLocaleString() ?? `${ds.train_pct}%`}</span>
              <span style={{ color: '#818cf8' }}>■ Val {ds.n_val?.toLocaleString() ?? `${ds.val_pct}%`}</span>
              <span style={{ color: '#4a5d78' }}>■ Test {ds.n_test?.toLocaleString() ?? `${ds.test_pct}%`}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
              Emitter labels are arbitrary numbers, consistent only within the same pulse train.
              Label <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>1</code> in
              pulse train A may be a different emitter than label <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>1</code> in pulse train B.
            </div>
          </div>

          {/* Deinterleaving Metrics */}
          <div className="card">
            <div className="card-title mb-3">📏 Evaluation Metrics</div>
            {[
              { name: 'V-Measure',   desc: 'Primary TSRD challenge metric. Harmonic mean of homogeneity and completeness.' },
              { name: 'Homogeneity', desc: 'Each cluster contains only pulses from a single emitter.' },
              { name: 'Completeness', desc: 'All pulses from an emitter belong to the same cluster.' },
              { name: 'AMI',         desc: 'Adjusted Mutual Information. Corrects for chance.' },
            ].map(({ name, desc }) => (
              <div key={name} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>{name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-sub)' }}>{desc}</div>
              </div>
            ))}
          </div>

          {/* Data Policy */}
          <div className="card" style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}>
            <div style={{ fontSize: 12, color: 'var(--false-alarm)', fontWeight: 600, marginBottom: 6 }}>
              ⚠ Data Policy
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-sub)', lineHeight: 1.6 }}>
              TSRD is purely synthetic. No real-world operational sensor data is included.
              Emitter parameters were derived from publicly available sources.
              Licensed under Apache-2.0 by The Alan Turing Institute.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
