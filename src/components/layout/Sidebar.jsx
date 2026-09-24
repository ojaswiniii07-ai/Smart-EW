import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Radio, Waves, BrainCircuit, FlaskConical,
  FileText, BarChart3, Cpu, Database, Settings, ChevronRight,
  Zap,
} from 'lucide-react';

const NAV = [
  { label: 'Core', items: [
    { to: '/',            icon: LayoutDashboard, label: 'Overview',        tag: null },
    { to: '/simulation',  icon: Radio,           label: 'Live Simulation', tag: 'LIVE' },
    { to: '/spectrum',    icon: Waves,           label: 'Spectrum Explorer', tag: null },
    { to: '/scheduler',  icon: BrainCircuit,    label: 'Scheduler',       tag: null },
  ]},
  { label: 'Research', items: [
    { to: '/experiments', icon: FlaskConical,    label: 'Experiments',     tag: null },
    { to: '/runs',        icon: FileText,        label: 'Run Detail',      tag: null },
    { to: '/analytics',  icon: BarChart3,       label: 'Analytics',       tag: null },
  ]},
  { label: 'ML', items: [
    { to: '/models',     icon: Cpu,             label: 'Model Lab',       tag: 'P1' },
    { to: '/datasets',   icon: Database,        label: 'Dataset Manager', tag: 'P1' },
  ]},
  { label: 'System', items: [
    { to: '/settings',   icon: Settings,        label: 'Settings',        tag: null },
  ]},
];

export default function Sidebar() {
  return (
    <nav className="app-sidebar" aria-label="Main navigation">
      {NAV.map(section => (
        <div key={section.label} style={{ marginBottom: 12 }}>
          <div className="nav-section-label">{section.label}</div>
          {section.items.map(({ to, icon: Icon, label, tag }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={15} />
              {label}
              {tag && <span className="badge">{tag}</span>}
            </NavLink>
          ))}
        </div>
      ))}

      {/* System Health Footer */}
      <div style={{ marginTop: 'auto', padding: '12px 12px 0' }}>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="dot dot-active" />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Simulation Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="dot dot-running" />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>ML Service Active</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
            SMART-EW v1.0.0 · Research Platform
          </div>
        </div>
      </div>
    </nav>
  );
}
