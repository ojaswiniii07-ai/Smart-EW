import { useState, useMemo } from 'react';
import { FeatureImportanceChart, ROCCurve, CalibrationCurve, ConfusionMatrix } from '../components/charts';
import { mockModels, featureImportance, generateROCData, generateCalibrationData } from '../data/mockData';

const STATUS_COLORS = { active: 'badge-success', experimental: 'badge-warn', deprecated: 'badge-error' };
const TYPE_ICONS = {
  'Logistic Regression': '📈',
  'Random Forest': '🌲',
  'Gradient Boosting': '⚡',
  'Neural Network': '🧠',
};

export default function ModelLab() {
  const [selectedId, setSelectedId] = useState('mdl-003');
  const [tab, setTab] = useState('overview');
  const model = mockModels.find(m => m.id === selectedId) ?? mockModels[2];
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

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        {/* Model registry */}
        <div>
          <div className="card">
            <div className="card-title mb-3">🗂 Model Registry</div>
            {mockModels.map(m => (
              <div
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                style={{
                  padding: '10px 12px', borderRadius: 8, marginBottom: 6, cursor: 'pointer',
                  background: selectedId === m.id ? 'var(--accent-glow)' : 'var(--bg-primary)',
                  border: `1px solid ${selectedId === m.id ? 'rgba(59,130,246,0.3)' : 'transparent'}`,
                  transition: 'all 0.15s',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 13, fontWeight: 600, color: selectedId === m.id ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {TYPE_ICONS[m.type]} {m.name}
                  </span>
                  <span className={`badge ${STATUS_COLORS[m.status]}`}>{m.status}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {m.type} · v{m.version}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  AUC = <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>{m.metrics.auc.toFixed(3)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model detail */}
        <div>
          <div className="card mb-4">
            <div className="card-header">
              <div className="card-title">
                {TYPE_ICONS[model.type]} {model.name}
                <span className={`badge ${STATUS_COLORS[model.status]}`} style={{ marginLeft: 8 }}>{model.status}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                v{model.version} · {model.type} · Dataset: {model.dataset}
              </div>
            </div>

            <div className="grid-4 mb-4" style={{ gap: 12 }}>
              {Object.entries(model.metrics).map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)' }}>
                    {(v * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Trained: {new Date(model.trained_at).toLocaleString()} · Features: {model.features.length}
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {[
              { id: 'overview', label: 'Feature Importance' },
              { id: 'roc',     label: 'ROC / PR Curve' },
              { id: 'calib',   label: 'Calibration' },
              { id: 'cm',      label: 'Confusion Matrix' },
              { id: 'schema',  label: 'Input Schema' },
            ].map(t => (
              <div key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </div>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">📊 Feature Importance</div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Top features for {model.name}</span>
              </div>
              <FeatureImportanceChart data={featureImportance.slice(0, model.features.length)} height={280} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                Importance derived from permutation / Gini impurity. Ground truth labels from simulation only.
              </div>
            </div>
          )}

          {tab === 'roc' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">📈 ROC Curve</div>
                <span className="badge badge-info">AUC = {rocData.auc}</span>
              </div>
              <ROCCurve data={rocData} height={320} />
            </div>
          )}

          {tab === 'calib' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">🎯 Calibration Curve</div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Predicted vs actual probability</span>
              </div>
              <CalibrationCurve data={calData} height={320} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                Well-calibrated model stays close to the diagonal. Deviation indicates systematic over/under-confidence.
              </div>
            </div>
          )}

          {tab === 'cm' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">🔢 Confusion Matrix</div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Detection / No-Detection</span>
              </div>
              <ConfusionMatrix height={280} />
            </div>
          )}

          {tab === 'schema' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">📋 Input Feature Schema</div>
              </div>
              <table className="data-table">
                <thead><tr><th>Feature</th><th>Type</th><th>Range</th><th>Description</th></tr></thead>
                <tbody>
                  {[
                    ['activity_rate',    'float32', '[0, 1]',    'Historical band activity rate'],
                    ['recency',          'float32', '[0, ∞)',     'Seconds since last observation'],
                    ['snr_estimate',     'float32', '[-∞, ∞)',    'Estimated SNR for the band'],
                    ['periodicity_score','float32', '[0, 1]',    'Periodicity strength estimate'],
                    ['burst_count',      'int32',   '[0, ∞)',     'Number of burst events observed'],
                    ['neighbor_activity','float32', '[0, 1]',    'Avg activity of adjacent bands'],
                    ['time_since_hit',   'float32', '[0, ∞)',     'Seconds since last hit event'],
                    ['uncertainty',      'float32', '[0, 1]',    'Model epistemic uncertainty'],
                    ['spectral_entropy', 'float32', '[0, ∞)',     'Shannon entropy of band spectrum'],
                    ['cross_band_corr',  'float32', '[-1, 1]',   'Cross-band correlation estimate'],
                  ].filter((_, idx) => idx < model.features.length).map(([feat, type, range, desc]) => (
                    <tr key={feat}>
                      <td style={{ color: 'var(--accent)' }}>{feat}</td>
                      <td style={{ color: 'var(--pred)' }}>{type}</td>
                      <td>{range}</td>
                      <td style={{ fontFamily: 'inherit', color: 'var(--text-secondary)' }}>{desc}</td>
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
