import { useState } from 'react';
import { Bell, Zap, Activity, Info } from 'lucide-react';

export default function Header() {
  const [time] = useState(() => new Date().toLocaleTimeString('en-US', { hour12: false }));

  return (
    <header className="app-header" role="banner">
      {/* Logo */}
      <div className="logo">
        <div className="logo-icon">
          <Zap size={16} color="#fff" />
        </div>
        <span>SMART<span className="logo-accent">-EW</span></span>
      </div>

      {/* Center meta */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 20, marginLeft: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="dot dot-running" />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Experiment sc-001 · Seed 42</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          SimTime: <span className="mono text-accent">04:52.3</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Scheduler: <span style={{ color: 'var(--pred)' }}>ML-Adaptive</span>
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}
          title="System time"
        >
          {time}
        </div>
        <button className="btn btn-ghost btn-icon" aria-label="Notifications">
          <Bell size={15} />
        </button>
        <div className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Activity size={10} /> Research Mode
        </div>
      </div>
    </header>
  );
}
