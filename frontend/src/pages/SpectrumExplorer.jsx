import { useState, useMemo } from 'react';
import { Download, Filter, ZoomIn } from 'lucide-react';
import { WaterfallChart, OccupancyHeatmap, HitMissTimeline } from '../components/charts';
import { generateHitMissTimeline } from '../data/mockData';

export default function SpectrumExplorer() {
  const [scenario, setScenario] = useState('sc-001');
  const [overlay, setOverlay] = useState('all');
  const [timeWindow, setTimeWindow] = useState([0, 64]);
  const events = useMemo(() => generateHitMissTimeline(60), []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Spectrum Explorer</h1>
          <p className="page-subtitle">Interactive time-frequency analysis · Simulated data only</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm"><Download size={13} /> Export PNG</button>
          <button className="btn btn-secondary btn-sm"><Filter size={13} /> Filter</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
            <label htmlFor="se-scenario">Scenario</label>
            <select id="se-scenario" value={scenario} onChange={e => setScenario(e.target.value)}>
              <option value="sc-001">sc-001 · No Prior Info</option>
              <option value="sc-002">sc-002 · Periodic Activity</option>
              <option value="sc-003">sc-003 · Burst / Short Duration</option>
              <option value="sc-004">sc-004 · High False-Alarm</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
            <label htmlFor="se-overlay">Overlay</label>
            <select id="se-overlay" value={overlay} onChange={e => setOverlay(e.target.value)}>
              <option value="all">All Layers</option>
              <option value="gt">Ground Truth Only</option>
              <option value="obs">Observed Only</option>
              <option value="pred">Predictions Only</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
            <label htmlFor="se-pattern">Activity Pattern</label>
            <select id="se-pattern">
              <option>All Patterns</option>
              <option>Periodic</option>
              <option>Burst</option>
              <option>Continuous</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
            <label htmlFor="se-result">Result Filter</label>
            <select id="se-result">
              <option>All Results</option>
              <option>Hits Only</option>
              <option>Misses Only</option>
              <option>False Alarms</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main spectrogram */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">Time-Frequency Spectrogram</div>
          <div className="flex gap-2">
            <span className="badge badge-gt">Ground Truth</span>
            <span className="badge badge-pred">Observed</span>
            <span className="badge badge-info">Predictions</span>
          </div>
        </div>
        <WaterfallChart height={340} />
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-faint)' }}>
          Hover for tooltip · X = Time slot · Y = Band index · Color = Signal power estimate
        </div>
      </div>

      {/* Occupancy + Hit/Miss row */}
      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Activity Occupancy Heatmap</div>
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Band × Hour of Day</span>
          </div>
          <OccupancyHeatmap height={260} />
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
            Occupancy fraction 0–1. Darker color = higher activity probability.
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Observation Results</div>
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Hit / Miss / FA scatter</span>
          </div>
          <HitMissTimeline events={events} height={260} />
        </div>
      </div>

      {/* Band detail table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Band Activity Summary</div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>Hover a row for details</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Band</th>
                <th>Frequency</th>
                <th>Activity Rate</th>
                <th>Hits</th>
                <th>Misses</th>
                <th>FA</th>
                <th>Avg SNR</th>
                <th>Prediction</th>
              </tr>
            </thead>
            <tbody>
              {[5,12,18,23,28,7,15].map(b => {
                const rate = 0.45 + Math.random() * 0.4;
                const hits = Math.floor(rate * 40);
                const misses = Math.floor((1 - rate) * 20);
                const fas = Math.floor(Math.random() * 5);
                return (
                  <tr key={b}>
                    <td className="mono text-accent">B{b}</td>
                    <td className="mono">{(100 + b * 185).toFixed(0)} MHz</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="progress" style={{ width: 60 }}>
                          <div className="progress-fill hit" style={{ width: `${rate * 100}%` }} />
                        </div>
                        <span className="mono">{(rate * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="mono text-hit">{hits}</td>
                    <td className="mono text-miss">{misses}</td>
                    <td className="mono text-warn">{fas}</td>
                    <td className="mono">{(8 + Math.random() * 20).toFixed(1)} dB</td>
                    <td className="mono text-pred">{(rate + (Math.random() - 0.5) * 0.1).toFixed(3)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
