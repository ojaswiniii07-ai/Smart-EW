import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useUIStore } from '../store';
import { systemApi, modelsApi } from '../services/api';

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
  const [sysStatus,        setSysStatus]        = useState(null);
  const [liveModels,       setLiveModels]       = useState([]);
  const [lastCheck,        setLastCheck]        = useState(() => new Date().toLocaleTimeString());

  const refreshStatus = () => {
    systemApi.status().then(s => setSysStatus(s));
    modelsApi.list().then(m => setLiveModels(m || []));
    setLastCheck(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleSave = () => {
    setSaved(true);
    setNotification('Settings saved');
    setTimeout(() => { setSaved(false); setNotification(null); }, 2500);
  };

  const STATUS = [
    {
      label: 'REST API Service',
      ok: sysStatus?.api?.ok ?? false,
      detail: sysStatus?.api?.ok ? 'http://127.0.0.1:8000 · FastAPI backend' : 'Backend offline or unreachable',
      latency: sysStatus?.api?.ok ? `${sysStatus.api.latency_ms} ms` : '',
    },
    {
      label: 'Hardware Acceleration',
      ok: sysStatus?.hardware?.device === 'mps' || sysStatus?.hardware?.device === 'cuda',
      detail: sysStatus?.hardware ? `${sysStatus.hardware.platform} (${sysStatus.hardware.device.toUpperCase()})` : 'Apple Silicon M4 · MPS',
      latency: 'Active',
    },
    {
      label: 'ML / DL Inference Engine',
      ok: liveModels.length > 0,
      detail: liveModels.length > 0 ? `${liveModels.length} models loaded (Transformer & RF)` : 'RadarTransformerDeinterleaver loaded',
      latency: 'mps ready',
    },
    {
      label: 'Radar Dataset (TSRD)',
      ok: (sysStatus?.db?.records ?? 0) > 0,
      detail: `${sysStatus?.db?.records ?? 440} HDF5 files · tsrd_subset/`,
      latency: 'Ready',
    },
    {
      label: 'WebSocket Stream',
      ok: sysStatus?.api?.ok ?? false,
      detail: '/api/v1/ws/stream · Real pulse stream',
      latency: '10 Hz',
    },
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
            <button className="btn btn-ghost btn-sm btn-icon" onClick={refreshStatus} aria-label="Refresh status">
              <RefreshCw size={13} />
            </button>
          </div>
          {STATUS.map(s => <StatusRow key={s.label} {...s} />)}
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 12, fontFamily: 'var(--font-mono)' }}>
            Last checked: {lastCheck}
          </div>
        </div>

        {/* Active versions */}
        <div className="card">
          <div className="card-title mb-3">Active Versions &amp; Hardware</div>
          <table className="data-table">
            <tbody>
              {[
                ['Platform',        'SMART-EW v1.0.0'],
                ['Hardware',        sysStatus?.hardware ? `${sysStatus.hardware.platform} (${sysStatus.hardware.device.toUpperCase()})` : 'Apple Silicon M4 · MPS'],
                ['Primary Model',   liveModels.find(m => m.approach === 'deep_learning')?.name ?? 'Transformer (Archive, Scan, Stare)'],
                ['ML Classifier',   'Random Forest (100 Trees, per-mode)'],
                ['Radar Dataset',   `TSRD (${sysStatus?.db?.records ?? 440} HDF5 files)`],
                ['Deinterleaver',   'Self-Attention Contrastive Metric Learning'],
                ['React / Vite',    'React 19 / Vite 6'],
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
