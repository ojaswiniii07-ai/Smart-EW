import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, Radio, Waves, BrainCircuit, FlaskConical,
  FileText, BarChart3, Cpu, Database, Settings,
} from 'lucide-react';

const NAV = [
  { label: 'Core', items: [
    { to: '/',            icon: LayoutDashboard, label: 'Overview'         },
    { to: '/simulation',  icon: Radio,           label: 'Live Simulation', tag: 'LIVE' },
    { to: '/spectrum',    icon: Waves,           label: 'Spectrum Explorer' },
    { to: '/scheduler',  icon: BrainCircuit,    label: 'Scheduler'        },
  ]},
  { label: 'Research', items: [
    { to: '/experiments', icon: FlaskConical,    label: 'Experiments'     },
    { to: '/runs',        icon: FileText,        label: 'Run Detail'      },
    { to: '/analytics',  icon: BarChart3,       label: 'Analytics'       },
  ]},
  { label: 'ML', items: [
    { to: '/models',     icon: Cpu,             label: 'Model Lab',       tag: 'P1' },
    { to: '/datasets',   icon: Database,        label: 'Dataset Manager', tag: 'P1' },
  ]},
  { label: 'System', items: [
    { to: '/settings',   icon: Settings,        label: 'Settings'        },
  ]},
];

export default function Sidebar() {
  return (
    <nav className="app-sidebar" aria-label="Main navigation">
      <Link to="/" className="logo" aria-label="SMART-EW home">
        <div className="logo-mark" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <span>
          <span className="logo-wordmark">SMART<span className="logo-sub">-EW</span></span>
          <span className="logo-tagline">Deinterleaving</span>
        </span>
      </Link>

      {NAV.map(section => (
        <div key={section.label} className="nav-group">
          <div className="nav-group-label">{section.label}</div>
          {section.items.map(({ to, icon: Icon, label, tag }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={14} aria-hidden="true" />
              <span>{label}</span>
              {tag && <span className="nav-badge">{tag}</span>}
            </NavLink>
          ))}
        </div>
      ))}

      {/* Live system status */}
      <div className="nav-status">
        <div className="nav-status-row">
          <span><span className="dot dot-active" aria-hidden="true" /> Simulation</span>
          <span className="nav-status-value">Ready</span>
        </div>
        <div className="nav-status-row">
          <span><span className="dot dot-running" aria-hidden="true" /> ML service</span>
          <span className="nav-status-value">Active</span>
        </div>
        <div className="nav-status-meta">SMART-EW v1.0.0 · Research</div>
      </div>
    </nav>
  );
}
