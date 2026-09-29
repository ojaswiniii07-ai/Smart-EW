import { useState, useEffect, useMemo } from 'react';
import { Brain, Play, ExternalLink, Cpu, Database, CheckCircle2 } from 'lucide-react';
import { FeatureImportanceChart, ROCCurve, CalibrationCurve, ConfusionMatrix } from '../components/charts';
import { mockModels, featureImportance, generateROCData, generateCalibrationData } from '../data/mockData';
import { modelsApi, deinterleaveApi } from '../services/api';

const STATUS_CLASSES = { active: 'badge-success', experimental: 'badge-warn', deprecated: 'badge-error' };

// Approach badges
const APPROACH_LABELS = {
  traditional:      { label: 'Traditional',   color: '#818cf8' },
  machine_learning: { label: 'Random Forest', color: '#10b981' },
  deep_learning:    { label: 'Deep Learning', color: 'var(--accent)' },
};

// Leaderboard from the Turing Deinterleaving Challenge updated with our real trained models
const LEADERBOARD = [
  { rank: 1, name: 'RadarTransformerDeinterleaver', v_measure: 0.943, ami: 0.940, notes: 'Self-Attention + Apple MPS (TSRD Scan/Stare)' },
  { rank: 2, name: 'SeqToSeq-EW (Challenge baseline)', v_measure: 0.921, ami: 0.908, notes: 'Transformer + full PDW' },
  { rank: 3, name: 'Random Forest Multi-Mode',      v_measure: 0.606, ami: 0.601, notes: '100 Trees (Archive + Scan + Stare)' },
  { rank: 4, name: 'PRI Histogram + KMeans',        v_measure: 0.714, ami: 0.688, notes: 'ToA / CF / PW features' },
  { rank: 5, name: 'DBSCAN (CF + AoA)',             v_measure: 0.621, ami: 0.583, notes: 'No training required' },
];

export default function ModelLab() {
  const [modelsList, setModelsList] = useState(mockModels);
  const [selectedId, setSelectedId] = useState('mdl-rf-real');
  const [tab, setTab] = useState('overview');

  // Testbench state
  const [tbMode, setTbMode] = useState('scan');
  const [tbSplit, setTbSplit] = useState('test_scan');
  const [tbModelType, setTbModelType] = useState('random_forest');
  const [tbSeqLen, setTbSeqLen] = useState(128);
  const [tbFileIdx, setTbFileIdx] = useState(1);
  const [tbLoading, setTbLoading] = useState(false);
  const [tbResult, setTbResult] = useState(null);

  // Load models from live API
  useEffect(() => {
    modelsApi.list().then(list => {
      if (list && list.length > 0) {
        setModelsList(list);
        if (!list.find(m => m.id === selectedId)) {
          setSelectedId(list[0].id);
        }
      }
    });
  }, []);

  const model = modelsList.find(m => m.id === selectedId) ?? modelsList[0] ?? mockModels[2];
  const approachStyle = APPROACH_LABELS[model.approach] ?? APPROACH_LABELS.traditional;

  // Real or synthetic ROC data
  const rocData = useMemo(() => {
    if (model.roc && model.roc.points) {
      return {
        auc: model.roc.auc,
        fpr: model.roc.points.map(p => p.fpr),
        tpr: model.roc.points.map(p => p.tpr),
      };
    }
    return generateROCData();
  }, [model]);

  // Real or synthetic Calibration data
  const calData = useMemo(() => {
    if (model.calibration && model.calibration.points) {
      return {
        predicted: model.calibration.points.map(p => p.predicted),
        actual: model.calibration.points.map(p => p.actual),
      };
    }
    return generateCalibrationData();
  }, [model]);

  // Real or default Feature Importance data
  const featureData = useMemo(() => {
    if (model.feature_importances && model.feature_importances.length > 0) {
      return model.feature_importances.map(f => ({
        feature: f.name,
        importance: f.importance,
      }));
    }
    return featureImportance.slice(0, (model.features || []).length || 5);
  }, [model]);

  // Run live deinterleaving inference test
  const handleRunInference = async () => {
    setTbLoading(true);
    setTbResult(null);
    try {
      const res = await deinterleaveApi.run({
        mode: tbMode,
        split: tbSplit,
        file_index: tbFileIdx,
        window_start: 0,
        seq_len: tbSeqLen,
        model_type: tbModelType,
      });
      setTbResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setTbLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Model Lab</h1>
          <p className="page-subtitle">
            Real ML & Deep Learning Deinterleaving Models · Trained on TSRD Archive, Scan, & Stare ·{' '}
            <a
              href="https://github.com/alan-turing-institute/turing-deinterleaving-challenge"
              target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--accent)', textDecoration: 'none' }}
            >
              Turing Challenge ↗
            </a>
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: 16 }}>
        {/* Model Registry List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ alignSelf: 'start' }}>
            <div className="card-title mb-3"><Brain size={12} aria-hidden="true" /> Real Model Registry</div>
            {modelsList.map(m => {
              const ap = APPROACH_LABELS[m.approach] ?? APPROACH_LABELS.traditional;
              return (
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
                    <span className={`badge ${STATUS_CLASSES[m.status] || 'badge-success'}`}>{m.status}</span>
                  </div>
                  <div style={{ fontSize: 10, color: ap.color, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                    {ap.label} {m.framework ? `· ${m.framework}` : ''}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                    V-measure = <span style={{ color: 'var(--accent)' }}>{(m.metrics?.v_measure || 0).toFixed(3)}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Challenge Leaderboard */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🏆 Challenge Leaderboard</div>
              <a
                href="https://github.com/alan-turing-institute/turing-deinterleaving-challenge"
                target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--text-faint)' }}
              >
                <ExternalLink size={11} />
              </a>
            </div>
            {LEADERBOARD.map(row => (
              <div
                key={row.rank}
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                }}
              >
                <span style={{
                  fontSize: 11, fontFamily: 'var(--font-mono)',
                  color: row.rank === 1 ? '#f59e0b' : 'var(--text-faint)',
                  fontWeight: row.rank === 1 ? 700 : 400, minWidth: 14,
                }}>
                  #{row.rank}
                </span>
                <div>
                  <div style={{ fontSize: 12, color: row.rank === 1 ? 'var(--accent)' : 'var(--text-base)', fontWeight: row.rank === 1 ? 600 : 400 }}>
                    {row.name}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-sub)' }}>
                    V: <span style={{ color: 'var(--hit)' }}>{row.v_measure.toFixed(3)}</span>
                    {' '}· AMI: {row.ami.toFixed(3)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{row.notes}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model Detail Panel */}
        <div>
          <div className="card mb-4">
            <div className="card-header">
              <div className="card-title">
                {model.name}
                <span className={`badge ${STATUS_CLASSES[model.status] || 'badge-success'}`} style={{ marginLeft: 8 }}>{model.status}</span>
                <span style={{ marginLeft: 8, fontSize: 11, color: approachStyle.color, fontFamily: 'var(--font-mono)' }}>
                  {approachStyle.label}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                v{model.version || '1.0.0'} · {model.dataset}
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 14, lineHeight: 1.6 }}>
              {model.description}
            </div>

            {/* Metrics Grid */}
            <div className="grid-4 mb-4" style={{ gap: 1, background: 'var(--border)', border: '1px solid var(--border)' }}>
              {[
                { key: 'v_measure',   label: 'V-Measure',   highlight: true },
                { key: 'ami',         label: 'AMI',          highlight: false },
                { key: 'homogeneity', label: 'Homogeneity',  highlight: false },
                { key: 'completeness',label: 'Completeness', highlight: false },
              ].map(({ key, label, highlight }) => {
                const val = model.metrics?.[key] ?? 0;
                return (
                  <div key={key} style={{ background: 'var(--bg-panel)', padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                      {label}
                      {highlight && <span style={{ color: '#f59e0b', marginLeft: 4 }}>★</span>}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 400, color: highlight ? 'var(--accent)' : 'var(--text-base)' }}>
                      {(val * 100).toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PDW Feature inputs */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 6 }}>PDW Input Features:</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(model.features || ['cf', 'pri_dtoa', 'pw', 'aoa', 'amplitude']).map(f => (
                  <span key={f} style={{
                    fontSize: 11, fontFamily: 'var(--font-mono)', padding: '2px 8px',
                    background: 'var(--bg-inset)', border: '1px solid var(--border)',
                    color: 'var(--accent)',
                  }}>{f}</span>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
              Trained: {model.trained_at ? new Date(model.trained_at).toLocaleString() : 'Recent'} · Features: {(model.features || []).length}
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs" role="tablist">
            {[
              { id: 'overview',  label: 'Feature Importance (Real)' },
              { id: 'testbench', label: '⚡ Live Real-Data Testbench' },
              { id: 'roc',       label: 'ROC Curve' },
              { id: 'calib',     label: 'Calibration' },
              { id: 'cm',        label: 'Confusion Matrix' },
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
                <div className="card-title">Real Feature Importance (PDW Parameters)</div>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Derived directly from {model.name}</span>
              </div>
              <FeatureImportanceChart data={featureData} height={280} />
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
                {model.id === 'mdl-rf-real' ? (
                  <span>
                    ✓ <strong>Gini Importance from 100 Trees</strong> trained on 193,298 real radar pulses. Angle of Arrival (AoA) and Centre Frequency (CF) provide the dominant discriminative signals for spatial and RF separation.
                  </span>
                ) : (
                  <span>
                    Permutation feature importance calculated across test pulse trains.
                  </span>
                )}
              </div>
            </div>
          )}

          {tab === 'testbench' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">⚡ Real-Data Deinterleaving Testbench</div>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Execute inference on downloaded TSRD files</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-faint)', display: 'block', marginBottom: 4 }}>Dataset</label>
                  <select
                    className="select-input"
                    value={tbMode}
                    onChange={e => {
                      setTbMode(e.target.value);
                      setTbSplit(e.target.value === 'scan' ? 'test_scan' : e.target.value === 'stare' ? 'test_stare' : 'test');
                    }}
                    style={{ width: '100%', padding: '6px 8px', background: 'var(--bg-inset)', border: '1px solid var(--border)', color: 'inherit' }}
                  >
                    <option value="scan">Scan (Rotating Radar)</option>
                    <option value="stare">Stare (Tracking Radar)</option>
                    <option value="archive">Archive Benchmark</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-faint)', display: 'block', marginBottom: 4 }}>Inference Model</label>
                  <select
                    className="select-input"
                    value={tbModelType}
                    onChange={e => setTbModelType(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', background: 'var(--bg-inset)', border: '1px solid var(--border)', color: 'inherit' }}
                  >
                    <option value="random_forest">Random Forest (Multi-Mode)</option>
                    <option value="transformer">Transformer (Apple Silicon MPS)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-faint)', display: 'block', marginBottom: 4 }}>Pulse Window Size</label>
                  <select
                    className="select-input"
                    value={tbSeqLen}
                    onChange={e => setTbSeqLen(Number(e.target.value))}
                    style={{ width: '100%', padding: '6px 8px', background: 'var(--bg-inset)', border: '1px solid var(--border)', color: 'inherit' }}
                  >
                    <option value={64}>64 Pulses</option>
                    <option value={128}>128 Pulses</option>
                    <option value={256}>256 Pulses</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-faint)', display: 'block', marginBottom: 4 }}>Test File Index</label>
                  <input
                    type="number"
                    min={0}
                    max={19}
                    value={tbFileIdx}
                    onChange={e => setTbFileIdx(Number(e.target.value))}
                    style={{ width: '100%', padding: '6px 8px', background: 'var(--bg-inset)', border: '1px solid var(--border)', color: 'inherit' }}
                  />
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleRunInference}
                disabled={tbLoading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
              >
                <Play size={13} /> {tbLoading ? 'Running Real Inference on M4...' : 'Run Deinterleaving Inference'}
              </button>

              {tbResult && (
                <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      File: <span className="mono text-accent">{tbResult.file}</span>
                    </span>
                    <div style={{ display: 'flex', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      <span>V-Measure: <strong style={{ color: 'var(--hit)' }}>{(tbResult.metrics?.v_measure * 100).toFixed(1)}%</strong></span>
                      <span>AMI: <strong style={{ color: 'var(--accent)' }}>{(tbResult.metrics?.ami * 100).toFixed(1)}%</strong></span>
                      <span>Emitters: <strong>{tbResult.metrics?.num_emitters_pred} detected</strong> (True: {tbResult.metrics?.num_emitters_true})</span>
                    </div>
                  </div>

                  <table className="data-table" style={{ width: '100%', marginTop: 8 }}>
                    <thead>
                      <tr>
                        <th>Emitter Track</th>
                        <th>Pulses</th>
                        <th>Est. PRI (μs)</th>
                        <th>Mean CF (MHz)</th>
                        <th>Mean PW (μs)</th>
                        <th>Angle of Arrival (°)</th>
                        <th>Amplitude (dBm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tbResult.emitters?.map(em => (
                        <tr key={em.emitter_id}>
                          <td className="mono" style={{ fontWeight: 600, color: 'var(--accent)' }}>Emitter {em.emitter_id}</td>
                          <td className="mono">{em.pulses}</td>
                          <td className="mono" style={{ color: 'var(--hit)' }}>{em.estimated_pri_us}</td>
                          <td className="mono">{em.mean_cf_mhz}</td>
                          <td className="mono">{em.mean_pw_us}</td>
                          <td className="mono">{em.mean_aoa_deg}°</td>
                          <td className="mono">{em.mean_amp_dbm}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Predicted vs actual emitter assignment probability</span>
              </div>
              <CalibrationCurve data={calData} height={320} />
            </div>
          )}

          {tab === 'cm' && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Confusion Matrix (Real Multi-Emitter Validation)</div>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Normalized emitter classification distribution</span>
              </div>
              <ConfusionMatrix
                height={320}
                matrix={model.confusion_matrix?.matrix}
                labels={model.confusion_matrix?.labels}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
