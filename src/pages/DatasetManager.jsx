import { useState } from 'react';
import { Upload, Eye, Download } from 'lucide-react';
import { mockDatasets } from '../data/mockData';

const STATUS_COLORS = { ready: 'badge-success', preprocessing: 'badge-warn', error: 'badge-error' };

export default function DatasetManager() {
  const [selected, setSelected] = useState('ds-001');
  const ds = mockDatasets.find(d => d.id === selected) ?? mockDatasets[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Dataset Manager</h1>
          <p className="page-subtitle">Dataset catalog · Schema · Quality · Splits · Simulated or authorized research data only</p>
        </div>
        <button className="btn btn-secondary"><Upload size={13} /> Import Dataset</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        {/* Catalog */}
        <div>
          <div className="card mb-4">
            <div className="card-header">
              <div className="card-title">📦 Dataset Catalog</div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{mockDatasets.length} datasets registered</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Source</th>
                  <th>License</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Quality</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {mockDatasets.map(d => (
                  <tr key={d.id} onClick={() => setSelected(d.id)} style={{ cursor: 'pointer', background: selected === d.id ? 'rgba(59,130,246,0.05)' : 'transparent' }}>
                    <td style={{ color: 'var(--accent)', fontFamily: 'inherit' }}>{d.name}</td>
                    <td style={{ fontFamily: 'inherit', color: 'var(--text-secondary)' }}>{d.source}</td>
                    <td style={{ fontFamily: 'inherit', fontSize: 11 }}>{d.license}</td>
                    <td>{d.size_mb} MB</td>
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

          {/* Schema preview */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📋 Schema Preview — {ds.name}</div>
              <span className="badge badge-info">v{ds.version}</span>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Column</th><th>Type</th><th>Missing %</th><th>Description</th></tr>
              </thead>
              <tbody>
                {[
                  ['timestamp',        'int64',   '0.0%',  'Simulation time index'],
                  ['band_index',       'int32',   '0.0%',  'Frequency band ID [0, N)'],
                  ['is_active',        'bool',    '0.0%',  'Ground truth signal activity'],
                  ['snr_db',           'float32', `${ds.missing_pct.toFixed(1)}%`, 'Estimated SNR in dB'],
                  ['activity_rate',    'float32', '0.0%',  'Historical activity rate'],
                  ['recency_s',        'float32', '0.0%',  'Seconds since last obs.'],
                  ['periodicity_score','float32', '0.0%',  'Periodicity estimate'],
                  ['observed',         'bool',    '0.0%',  'Whether this slot was observed'],
                  ['result',           'str',     '0.1%',  'hit / miss / false_alarm / none'],
                ].map(([col, type, miss, desc]) => (
                  <tr key={col}>
                    <td style={{ color: 'var(--accent)' }}>{col}</td>
                    <td style={{ color: 'var(--pred)' }}>{type}</td>
                    <td style={{ color: +miss > 1 ? 'var(--false-alarm)' : 'var(--hit)' }}>{miss}</td>
                    <td style={{ fontFamily: 'inherit', color: 'var(--text-secondary)' }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dataset detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div className="card-title mb-3">🔍 {ds.name}</div>
            {[
              ['Source',        ds.source],
              ['Version',       ds.version],
              ['License',       ds.license],
              ['Modality',      ds.modality],
              ['Size',          `${ds.size_mb} MB`],
              ['Freq Range',    ds.freq_range],
              ['Time Coverage', ds.time_coverage],
              ['Missing',       `${ds.missing_pct.toFixed(1)}%`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Train/Val/Test splits */}
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
            <div className="flex gap-3" style={{ fontSize: 11 }}>
              <span style={{ color: 'var(--accent)' }}>■ Train {ds.train_pct}%</span>
              <span style={{ color: '#818cf8' }}>■ Val {ds.val_pct}%</span>
              <span style={{ color: '#4a5d78' }}>■ Test {ds.test_pct}%</span>
            </div>
          </div>

          {/* Class distribution */}
          <div className="card">
            <div className="card-title mb-3">📊 Class Distribution</div>
            {Object.entries(ds.class_distribution).map(([cls, frac]) => (
              <div key={cls} style={{ marginBottom: 8 }}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{cls}</span>
                  <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: cls === 'active' ? 'var(--hit)' : 'var(--text-muted)' }}>
                    {(frac * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="progress">
                  <div className="progress-fill" style={{
                    width: `${frac * 100}%`,
                    background: cls === 'active' ? 'var(--hit)' : 'var(--border-bright)',
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Data policy notice */}
          <div className="card" style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}>
            <div style={{ fontSize: 12, color: 'var(--false-alarm)', fontWeight: 600, marginBottom: 6 }}>
              ⚠ Data Policy
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              No raw sensitive operational data is displayed. All datasets are synthetic or explicitly authorized public research data.
              Source, version, and license are recorded for every experiment.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
