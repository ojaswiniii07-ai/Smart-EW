import { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useUIStore } from '../store';

function StatusRow({ label, ok, detail, latency }) {
  return (
    <div className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {ok === true  && <CheckCircle size={14} color="var(--hit)"  aria-label="OK"      style={{ marginTop: 1, flexShrink: 0 }} />}
        {ok === false && <XCircle     size={14} color="var(--miss)" aria-label="Down"    style={{ marginTop: 1, flexShrink: 0 }} />}
        {ok === null  && <AlertCircle size={14} color="var(--warn)" aria-label="Warning" style={{ marginTop: 1, flexShrink: 0 }} />}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-base)' }}>{label}</div>
          {detail && <div style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{detail}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {latency && <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-faint)' }}>{latency}</span>}
        <span className={`badge ${ok === true ? 'badge-success' : ok === false ? 'badge-error' : 'badge-warn'}`}>
          {ok === true ? 'OK' : ok === false ? 'DOWN' : 'WARN'}
        </span>
      </div>
    </div>
  );
}

export default function Settings() {
  const { theme, setTheme } = useUIStore();
  const [logLevel,         setLogLevel]         = useState('info');
  const [defaultScheduler, setDefaultScheduler] = useState('ml');
  const [defaultScenario,  setDefaultScenario]  = useState('sc-001');
  const [reducedMotion,    setReducedMotion]    = useState(false);
  const [dataRetention,    setDataRetention]    = useState(30);
  const [saved,            setSaved]            = useState(false);
  const [notification,     setNotification]     = useState(null);

  const handleSave = () => {
    setSaved(true);
    setNotification('Settings saved');
    setTimeout(() => { setSaved(false); setNotification(null); }, 2500);
  };

  const STATUS = [
    { label: 'REST API Service',     ok: true,  detail: 'http://localhost:8000 · FastAPI',       latency: '12 ms' },
    { label: 'Simulation Engine',    ok: true,  detail: 'Mock simulator v1.0 · Ready',            latency: '' },
    { label: 'ML Inference Service', ok: true,  detail: 'GradientBoostEW v1.0.0 loaded',          latency: '3 ms' },
    { label: 'Database',             ok: true,  detail: '142,831 records · SQLite (dev)',         latency: '0.4 ms' },
    { label: 'WebSocket Stream',     ok: false, detail: '/api/v1/runs/:id/stream · Disconnected', latency: '' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Settings &amp; System Status</h1>
          <p className="page-subtitle">UI preferences · Simulation defaults · API connectivity</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} aria-disabled={saved}>
          {saved ? 'Saved' : 'Save Settings'}
        </button>
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        {/* System Status */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">System Status</div>
            <button className="btn btn-ghost btn-sm btn-icon" aria-label="Refresh status"><RefreshCw size={13} /></button>
          </div>
          {STATUS.map(s => <StatusRow key={s.label} {...s} />)}
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 12, fontFamily: 'var(--font-mono)' }}>
            Last checked: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Active versions */}
        <div className="card">
          <div className="card-title mb-3">Active Versions</div>
          <table className="data-table">
            <tbody>
              {[
                ['Platform',        'SMART-EW v1.0.0'],
                ['Active Model',    'GradientBoostEW v1.0.0'],
                ['Active Dataset',  'synthetic-v3'],
                ['Scheduler',       'ML-Adaptive'],
                ['Simulator',       'Mock Simulator v1.0'],
                ['React',           '19.x'],
                ['Vite',            '6.x'],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td style={{ fontFamily: 'inherit', color: 'var(--text-sub)', fontWeight: 500 }}>{k}</td>
                  <td className="mono text-accent">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* UI Preferences */}
        <div className="card">
          <div className="card-title mb-3">UI Preferences</div>
          <div className="form-group">
            <label htmlFor="pref-theme">Theme</label>
            <select id="pref-theme" value={theme} onChange={e => setTheme(e.target.value)}>
              <option value="light">Light (warm neutral)</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="pref-reduced-motion" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
              <input
                id="pref-reduced-motion"
                type="checkbox"
                checked={reducedMotion}
                onChange={e => setReducedMotion(e.target.checked)}
              />
              Reduce motion (accessibility)
            </label>
          </div>
          <div className="form-group">
            <label htmlFor="pref-log">Logging Level</label>
            <select id="pref-log" value={logLevel} onChange={e => setLogLevel(e.target.value)}>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error only</option>
            </select>
          </div>
        </div>

        {/* Simulation defaults */}
        <div className="card">
          <div className="card-title mb-3">Simulation Defaults</div>
          <div className="form-group">
            <label htmlFor="def-scheduler">Default Scheduler</label>
            <select id="def-scheduler" value={defaultScheduler} onChange={e => setDefaultScheduler(e.target.value)}>
              <option value="fixed">Fixed Sweep</option>
              <option value="random">Random</option>
              <option value="adaptive">Adaptive Statistical</option>
              <option value="ml">ML-Adaptive</option>
              <option value="bandit">Contextual Bandit</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="def-scenario">Default Scenario</label>
            <select id="def-scenario" value={defaultScenario} onChange={e => setDefaultScenario(e.target.value)}>
              <option value="sc-001">sc-001 · No Prior Information</option>
              <option value="sc-002">sc-002 · Periodic Activity</option>
              <option value="sc-003">sc-003 · Burst / Short Duration</option>
              <option value="sc-004">sc-004 · High False-Alarm</option>
              <option value="sc-005">sc-005 · Distribution Shift</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="def-retention">Data Retention (days)</label>
            <input id="def-retention" type="number" value={dataRetention} min={1} max={365}
              onChange={e => setDataRetention(+e.target.value)} />
          </div>
        </div>

        {/* Safety Notice */}
        <div className="card" style={{ gridColumn: '1 / -1', borderColor: 'var(--border-mid)' }}>
          <div className="card-title mb-2">Safety Boundary &amp; Disclaimer</div>
          <div style={{ fontSize: 12, color: 'var(--text-sub)', lineHeight: 1.75 }}>
            SMART-EW is a <strong style={{ color: 'var(--text-base)' }}>hardware-agnostic research and simulation platform</strong>.
            It does not implement transmit, jamming, spoofing, or attack functionality.
            It does not contain operational military receiver-control commands.
            All RF activity is simulated or explicitly authorized research data.
            Model predictions are not equivalent to real-world ground truth.
            This frontend is suitable for simulation, academic experimentation, and authorized laboratory research.
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-faint)' }}>
            <a href="/privacy" style={{ color: 'var(--text-sub)', textDecoration: 'underline', marginRight: 16 }}>Privacy Policy (draft)</a>
            <a href="/terms"   style={{ color: 'var(--text-sub)', textDecoration: 'underline' }}>Terms of Service (draft)</a>
          </div>
        </div>
      </div>

      {notification && (
        <div className="notification" role="status" aria-live="polite">{notification}</div>
      )}
    </div>
  );
}
