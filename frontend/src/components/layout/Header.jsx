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
      {/* Active session — the brand now lives in the sidebar */}
      <div className="flex items-center gap-4 wrap flex-1" style={{ minWidth: 0 }}>
        <div className="flex items-center gap-2">
          <span className="dot dot-running" aria-hidden="true" />
          <span style={{ fontSize: 12, color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>
            Experiment sc-001 · Seed 42
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
          SimTime&nbsp;
          <span className="mono text-accent" style={{ fontSize: 12 }}>04:52.3</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
          Scheduler&nbsp;
          <span style={{ color: 'var(--pred)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>ML-Adaptive</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
        <span
          className="mono"
          style={{ fontSize: 12, color: 'var(--text-faint)' }}
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
        <div className="badge badge-info">
          <Activity size={9} aria-hidden="true" />
          Research
        </div>
      </div>
    </header>
  );
}
