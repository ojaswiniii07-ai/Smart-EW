import { useState } from 'react';
import { Plus, Play, Pause, Copy, Trash2, Download, RotateCcw, ChevronRight } from 'lucide-react';
import { mockScenarios, mockRuns, schedulerTypes } from '../data/mockData';
import { useExpStore } from '../store';

const STATUS_BADGE = {
  completed: 'badge-success',
  running:   'badge-info',
  queued:    'badge-neutral',
  failed:    'badge-error',
  paused:    'badge-warn',
};

export default function Experiments() {
  const store = useExpStore();
  const [creating, setCreating] = useState(false);
  const [runs, setRuns] = useState(mockRuns);
  const [notification, setNotification] = useState(null);

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStart = () => {
    const newRun = {
      id: `run-${Date.now()}`,
      scenario_id: store.selectedScenario,
      scheduler_id: store.selectedScheduler,
      model_id: store.selectedModel,
      seed: store.seed,
      status: 'running',
      started_at: new Date().toISOString(),
      ended_at: null,
      metrics: { pd: null, far: null, obs_rate: null, avg_latency: null, coverage: null, reward: null },
      version: '1.0.0',
    };
    setRuns(r => [newRun, ...r]);
    setCreating(false);
    notify('✅ Experiment queued and started');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Experiments</h1>
          <p className="page-subtitle">Configure, run, and compare reproducible simulation experiments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(c => !c)}>
          <Plus size={13} /> New Experiment
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="card mb-4" style={{ borderColor: 'rgba(59,130,246,0.3)' }}>
          <div className="card-header">
            <div className="card-title">🔬 Configure New Experiment</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setCreating(false)}>✕</button>
          </div>
          <div className="grid-3 mb-4" style={{ gap: 12 }}>
            <div className="form-group">
              <label>Scenario</label>
              <select value={store.selectedScenario} onChange={e => store.setField('selectedScenario', e.target.value)}>
                {mockScenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Scheduler</label>
              <select value={store.selectedScheduler} onChange={e => store.setField('selectedScheduler', e.target.value)}>
                {schedulerTypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>ML Model</label>
              <select value={store.selectedModel} onChange={e => store.setField('selectedModel', e.target.value)}>
                <option value="">None (Baseline)</option>
                <option value="mdl-001">LogisticBaseline v1.0</option>
                <option value="mdl-002">RandomForestV2</option>
                <option value="mdl-003">GradientBoostEW v1.0</option>
                <option value="mdl-004">NeuralEWNet v0.9 (Exp.)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Frequency Bands</label>
              <input type="number" value={store.bands} min={4} max={128}
                onChange={e => store.setField('bands', +e.target.value)} />
            </div>
            <div className="form-group">
              <label>Duration (s)</label>
              <input type="number" value={store.duration} min={10} max={3600}
                onChange={e => store.setField('duration', +e.target.value)} />
            </div>
            <div className="form-group">
              <label>Noise Level</label>
              <input type="range" min={0} max={0.5} step={0.01}
                value={store.noiseLevel}
                onChange={e => store.setField('noiseLevel', +e.target.value)} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{(store.noiseLevel * 100).toFixed(0)}%</div>
            </div>
            <div className="form-group">
              <label>Exploration Rate</label>
              <input type="range" min={0} max={0.5} step={0.01}
                value={store.explorationRate}
                onChange={e => store.setField('explorationRate', +e.target.value)} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{(store.explorationRate * 100).toFixed(0)}%</div>
            </div>
            <div className="form-group">
              <label>Random Seed</label>
              <input type="number" value={store.seed}
                onChange={e => store.setField('seed', +e.target.value)} />
            </div>
            <div className="form-group">
              <label>Repetitions</label>
              <input type="number" value={store.repetitions} min={1} max={100}
                onChange={e => store.setField('repetitions', +e.target.value)} />
            </div>
          </div>

          <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Experiment Configuration Preview</div>
            <code style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>
              {JSON.stringify({ scenario: store.selectedScenario, scheduler: store.selectedScheduler, seed: store.seed, bands: store.bands, duration: store.duration, repetitions: store.repetitions }, null, 2)}
            </code>
          </div>

          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={handleStart}><Play size={13} /> Run Experiment</button>
            <button className="btn btn-secondary"><Download size={13} /> Save Config JSON</button>
            <button className="btn btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Run list */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">📂 Experiment Runs</div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{runs.length} runs</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Scenario</th>
                <th>Scheduler</th>
                <th>Seed</th>
                <th>Status</th>
                <th>Pd</th>
                <th>FAR</th>
                <th>Latency</th>
                <th>Reward</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(r => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--accent)' }}>{r.id}</td>
                  <td style={{ fontFamily: 'inherit', color: 'var(--text-secondary)' }}>
                    {mockScenarios.find(s => s.id === r.scenario_id)?.name ?? r.scenario_id}
                  </td>
                  <td style={{ fontFamily: 'inherit' }}>
                    {schedulerTypes.find(s => s.id === r.scheduler_id)?.name ?? r.scheduler_id}
                  </td>
                  <td>{r.seed}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[r.status] ?? 'badge-neutral'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--hit)' }}>
                    {r.metrics.pd != null ? (r.metrics.pd * 100).toFixed(1) + '%' : '—'}
                  </td>
                  <td style={{ color: 'var(--false-alarm)' }}>
                    {r.metrics.far != null ? (r.metrics.far * 100).toFixed(1) + '%' : '—'}
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {r.metrics.avg_latency != null ? r.metrics.avg_latency.toFixed(1) + ' s' : '—'}
                  </td>
                  <td style={{ color: 'var(--accent)' }}>
                    {r.metrics.reward != null ? r.metrics.reward.toFixed(0) : '—'}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-sm btn-icon" title="Clone"><Copy size={12} /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Replay"><RotateCcw size={12} /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Delete" style={{ color: 'var(--miss)' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}
    </div>
  );
}
