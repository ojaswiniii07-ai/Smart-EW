import { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

function StatusRow({ label, ok, detail, latency }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-10">
        {ok === true  && <CheckCircle size={15} color="var(--hit)" />}
        {ok === false && <XCircle size={15} color="var(--miss)" />}
        {ok === null  && <AlertCircle size={15} color="var(--false-alarm)" />}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
          {detail && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{detail}</div>}
        </div>
      </div>
      <div className="flex items-center gap-8">
        {latency && <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>{latency}</span>}
        <span className={`badge ${ok === true ? 'badge-success' : ok === false ? 'badge-error' : 'badge-warn'}`}>
          {ok === true ? 'OK' : ok === false ? 'DOWN' : 'WARN'}
        </span>
      </div>
    </div>
  );
}

export default function Settings() {
  const [theme, setTheme] = useState('dark');
  const [logLevel, setLogLevel] = useState('info');
  const [defaultScheduler, setDefaultScheduler] = useState('ml');
  const [defaultScenario, setDefaultScenario] = useState('sc-001');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [dataRetention, setDataRetention] = useState(30);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const STATUS = [
    { label: 'REST API Service',     ok: true,  detail: 'http://localhost:8000 · FastAPI',        latency: '12 ms' },
    { label: 'Simulation Engine',    ok: true,  detail: 'Mock simulator v1.0 · Ready',             latency: '' },
    { label: 'ML Inference Service', ok: true,  detail: 'GradientBoostEW v1.0.0 loaded',           latency: '3 ms' },
    { label: 'Database',             ok: true,  detail: '142,831 records · SQLite (dev)',          latency: '0.4 ms' },
    { label: 'WebSocket Stream',     ok: false, detail: '/api/v1/runs/:id/stream · Disconnected',  latency: '' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Settings & System Status</h1>
          <p className="page-subtitle">UI preferences · Simulation defaults · API connectivity</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          {saved ? '✅ Saved' : '💾 Save Settings'}
        </button>
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        {/* System Status */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔌 System Status</div>
            <button className="btn btn-ghost btn-sm btn-icon"><RefreshCw size={13} /></button>
          </div>
          {STATUS.map(s => <StatusRow key={s.label} {...s} />)}
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
            Last checked: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Active versions */}
        <div className="card">
          <div className="card-title mb-3">📦 Active Versions</div>
          <table className="data-table">
            <tbody>
              {[
                ['Platform',       'SMART-EW v1.0.0'],
                ['Active Model',   'GradientBoostEW v1.0.0'],
                ['Active Dataset', 'synthetic-v3'],
                ['Scheduler',      'ML-Adaptive'],
                ['Simulator',      'Mock Simulator v1.0'],
                ['React',          '19.x'],
                ['Vite',           '6.x'],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ fontFamily: 'inherit', color: 'var(--text-secondary)', fontWeight: 500 }}>{k}</td>
                  <td style={{ color: 'var(--accent)' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* UI Preferences */}
        <div className="card">
          <div className="card-title mb-3">🎨 UI Preferences</div>
          <div className="form-group">
            <label>Theme</label>
            <select value={theme} onChange={e => setTheme(e.target.value)}>
              <option value="dark">Dark (recommended for spectrum views)</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div className="form-group">
            <label>Reduced Motion (accessibility)</label>
            <div className="flex items-center gap-2" style={{ marginTop: 6 }}>
              <input type="checkbox" id="reducedMotion" checked={reducedMotion} onChange={e => setReducedMotion(e.target.checked)} />
              <label htmlFor="reducedMotion" style={{ margin: 0, cursor: 'pointer' }}>Disable animated spectrum views</label>
            </div>
          </div>
          <div className="form-group">
            <label>Logging Level</label>
            <select value={logLevel} onChange={e => setLogLevel(e.target.value)}>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error only</option>
            </select>
          </div>
        </div>

        {/* Simulation defaults */}
        <div className="card">
          <div className="card-title mb-3">⚙️ Simulation Defaults</div>
          <div className="form-group">
            <label>Default Scheduler</label>
            <select value={defaultScheduler} onChange={e => setDefaultScheduler(e.target.value)}>
              <option value="fixed">Fixed Sweep</option>
              <option value="random">Random</option>
              <option value="adaptive">Adaptive Statistical</option>
              <option value="ml">ML-Adaptive</option>
              <option value="bandit">Contextual Bandit</option>
            </select>
          </div>
          <div className="form-group">
            <label>Default Scenario</label>
            <select value={defaultScenario} onChange={e => setDefaultScenario(e.target.value)}>
              <option value="sc-001">sc-001 · No Prior Information</option>
              <option value="sc-002">sc-002 · Periodic Activity</option>
              <option value="sc-003">sc-003 · Burst / Short Duration</option>
              <option value="sc-004">sc-004 · High False-Alarm</option>
              <option value="sc-005">sc-005 · Distribution Shift</option>
            </select>
          </div>
          <div className="form-group">
            <label>Data Retention (days)</label>
            <input type="number" value={dataRetention} min={1} max={365}
              onChange={e => setDataRetention(+e.target.value)} />
          </div>
        </div>

        {/* Safety Notice */}
        <div className="card" style={{ gridColumn: '1 / -1', borderColor: 'rgba(59,130,246,0.3)' }}>
          <div className="card-title mb-2">🔒 Safety Boundary & Disclaimer</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            SMART-EW is a <strong style={{ color: 'var(--text-primary)' }}>hardware-agnostic research and simulation platform</strong>.
            It does not implement transmit, jamming, spoofing, or attack functionality.
            It does not contain operational military receiver-control commands.
            All RF activity is simulated or explicitly authorized research data.
            Model predictions are not equivalent to real-world ground truth.
            This frontend is suitable for simulation, academic experimentation, and authorized laboratory research.
          </div>
        </div>
      </div>
    </div>
  );
}
