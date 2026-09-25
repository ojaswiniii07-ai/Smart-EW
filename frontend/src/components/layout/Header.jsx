import { useState, useEffect } from 'react';
import { Bell, Activity, Sun, Moon } from 'lucide-react';
import { useUIStore } from '../../store';

export default function Header() {
  const { theme, toggleTheme } = useUIStore();
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour12: false })
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="app-header" role="banner">
      {/* Logo */}
      <a href="/" className="logo" aria-label="SMART-EW home">
        <div className="logo-mark" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <span className="logo-wordmark">SMART<span className="logo-sub">-EW</span></span>
      </a>

      {/* Center — active session */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 20, marginLeft: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="dot dot-running" aria-hidden="true" />
          <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>
            Experiment sc-001 · Seed 42
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
          SimTime&nbsp;
          <span className="mono text-accent" style={{ fontSize: 12 }}>04:52.3</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
          Scheduler&nbsp;
          <span style={{ color: 'var(--pred)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>ML-Adaptive</span>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{ fontSize: 12, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}
          title="System time"
          aria-label={`System time: ${time}`}
        >
          {time}
        </span>
        <button
          className="btn btn-ghost btn-icon"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button className="btn btn-ghost btn-icon" aria-label="Notifications">
          <Bell size={14} />
        </button>
        <div className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Activity size={9} aria-hidden="true" />
          Research
        </div>
      </div>
    </header>
  );
}
