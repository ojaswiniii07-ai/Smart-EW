import { NavLink } from 'react-router-dom';
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

      {/* System status footer */}
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-2">
          <span className="dot dot-active" aria-hidden="true" />
          <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>Simulation Ready</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="dot dot-running" aria-hidden="true" />
          <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>ML Service Active</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 10, fontFamily: 'var(--font-mono)' }}>
          SMART-EW v1.0.0 · Research Platform
        </div>
      </div>
    </nav>
  );
}
