import { useState, useMemo } from 'react';
import { FeatureImportanceChart, ROCCurve, CalibrationCurve, ConfusionMatrix } from '../components/charts';
import { mockModels, featureImportance, generateROCData, generateCalibrationData } from '../data/mockData';

const STATUS_CLASSES = { active: 'badge-success', experimental: 'badge-warn', deprecated: 'badge-error' };

export default function ModelLab() {
  const [selectedId, setSelectedId] = useState('mdl-003');
  const [tab, setTab] = useState('overview');
  const model   = mockModels.find(m => m.id === selectedId) ?? mockModels[2];
  const rocData = useMemo(() => generateROCData(), [selectedId]);
  const calData = useMemo(() => generateCalibrationData(), [selectedId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Model Lab</h1>
          <p className="page-subtitle">Model registry · Feature inspection · Evaluation results</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
        {/* Registry */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-title mb-3">Model Registry</div>
          {mockModels.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 12px', marginBottom: 4, cursor: 'pointer',
                background: selectedId === m.id ? 'var(--accent-bg)' : 'var(--bg-well)',
                border: `1px solid ${selectedId === m.id ? 'var(--accent-border)' : 'transparent'}`,
                transition: 'background var(--dur) var(--ease)',
              }}
              aria-pressed={selectedId === m.id}
            >
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 13, fontWeight: 600, color: selectedId === m.id ? 'var(--accent)' : 'var(--text-base)' }}>
                  {m.name}
                </span>
                <span className={`badge ${STATUS_CLASSES[m.status]}`}>{m.status}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                {m.type} · v{m.version}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 2 }}>
                AUC = <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{m.metrics.auc.toFixed(3)}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Detail */}
        <div>
          <div className="card mb-4">
            <div className="card-header">
              <div className="card-title">
                {model.name}
                <span className={`badge ${STATUS_CLASSES[model.status]}`} style={{ marginLeft: 8 }}>{model.status}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                v{model.version} · {model.type} · Dataset: {model.dataset}
              </div>
            </div>

            <div className="grid-4 mb-4" style={{ gap: 1, background: 'var(--border)', border: '1px solid var(--border)' }}>
              {Object.entries(model.metrics).map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg-panel)', padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{k}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 400, color: 'var(--accent)' }}>
                    {(v * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
              Trained: {new Date(model.trained_at).toLocaleString()} · Features: {model.features.length}
            </div>
          </div>

          <div className="tabs" role="tablist">
            {[
              { id: 'overview', label: 'Feature Importance' },
              { id: 'roc',     label: 'ROC Curve' },
              { id: 'calib',   label: 'Calibration' },
              { id: 'cm',      label: 'Confusion Matrix' },
              { id: 'schema',  label: 'Input Schema' },
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

          {tab === 'overview' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Feature Importance</div>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Top features for {model.name}</span>
              </div>
              <FeatureImportanceChart data={featureImportance.slice(0, model.features.length)} height={280} />
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
                Importance derived from permutation / Gini impurity. Ground truth labels from simulation only.
              </div>
            </div>
          )}

          {tab === 'roc' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">ROC Curve</div>
                <span className="badge badge-info">AUC = {rocData.auc}</span>
              </div>
              <ROCCurve data={rocData} height={320} />
            </div>
          )}

          {tab === 'calib' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Calibration Curve</div>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Predicted vs actual probability</span>
              </div>
              <CalibrationCurve data={calData} height={320} />
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
                A well-calibrated model stays close to the diagonal. Deviation indicates systematic over- or under-confidence.
              </div>
            </div>
          )}

          {tab === 'cm' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Confusion Matrix</div>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Detection / No-Detection</span>
              </div>
              <ConfusionMatrix height={280} />
            </div>
          )}

          {tab === 'schema' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Input Feature Schema</div>
              </div>
              <table className="data-table">
                <thead><tr><th>Feature</th><th>Type</th><th>Range</th><th>Description</th></tr></thead>
                <tbody>
                  {[
                    ['activity_rate',    'float32', '[0, 1]',   'Historical band activity rate'],
                    ['recency',          'float32', '[0, ∞)',    'Seconds since last observation'],
                    ['snr_estimate',     'float32', '(−∞, ∞)',   'Estimated SNR for the band'],
                    ['periodicity_score','float32', '[0, 1]',   'Periodicity strength estimate'],
                    ['burst_count',      'int32',   '[0, ∞)',    'Number of burst events observed'],
                    ['neighbor_activity','float32', '[0, 1]',   'Avg activity of adjacent bands'],
                    ['time_since_hit',   'float32', '[0, ∞)',    'Seconds since last hit event'],
                    ['uncertainty',      'float32', '[0, 1]',   'Model epistemic uncertainty'],
                    ['spectral_entropy', 'float32', '[0, ∞)',    'Shannon entropy of band spectrum'],
                    ['cross_band_corr',  'float32', '[−1, 1]',  'Cross-band correlation estimate'],
                  ].filter((_, idx) => idx < model.features.length).map(([feat, type, range, desc]) => (
                    <tr key={feat}>
                      <td className="mono text-accent">{feat}</td>
                      <td className="mono text-pred">{type}</td>
                      <td className="mono">{range}</td>
                      <td style={{ fontFamily: 'inherit', color: 'var(--text-sub)' }}>{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
