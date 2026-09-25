import { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { WaterfallChart, HitMissTimeline } from '../components/charts';
import { useSimStore } from '../store';
import { MockWebSocket } from '../services/mockWebSocket';
import { generateCandidates } from '../data/mockData';

const RESULT_COLORS = {
  hit:         'var(--hit)',
  miss:        'var(--miss)',
  false_alarm: 'var(--warn)',
};

function ScoreBar({ label, value, color }) {
  return (
    <div className="score-bar-row">
      <div className="score-bar-label">
        <span style={{ color: 'var(--text-sub)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color }}>{value.toFixed(3)}</span>
      </div>
      <div className="progress">
        <div className="progress-fill" style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  );
}

export default function LiveSimulation() {
  const {
    status, simTime, speed, scheduler, showGroundTruth, showObserved, showPredictions,
    events, candidates, currentEvent, noiseLevel,
    start, pause, resume, reset, step, setSpeed, setScheduler, toggleLayer, appendEvent, refreshCandidates,
  } = useSimStore();

  const wsRef = useRef(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (status === 'running') {
      wsRef.current = new MockWebSocket(ev => {
        appendEvent(ev);
        setTick(t => t + 1);
      }, 1500).connect();
    } else {
      wsRef.current?.disconnect();
    }
    return () => wsRef.current?.disconnect();
  }, [status]);

  useEffect(() => {
    if (status === 'running') {
      const t = setInterval(() => useSimStore.setState(s => ({ simTime: s.simTime + 1 })), 1000 / speed);
      return () => clearInterval(t);
    }
  }, [status, speed]);

  const top5 = candidates.slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Live Simulation</h1>
          <p className="page-subtitle">Closed-loop scheduler visualization · Simulated environment only</p>
        </div>
        <div className="flex gap-2 items-center">
          <span style={{ fontSize: 12, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
            t = <span style={{ color: 'var(--accent)' }}>{String(simTime.toFixed(0)).padStart(5, '0')}</span>
          </span>
          {status === 'idle' || status === 'paused' ? (
            <button className="btn btn-primary" onClick={status === 'idle' ? start : resume}>
              <Play size={13} aria-hidden="true" /> {status === 'idle' ? 'Start' : 'Resume'}
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={pause}>
              <Pause size={13} aria-hidden="true" /> Pause
            </button>
          )}
          <button className="btn btn-secondary" onClick={step} disabled={status === 'running'} aria-label="Step forward">
            <SkipForward size={13} aria-hidden="true" />
          </button>
          <button className="btn btn-ghost" onClick={reset} aria-label="Reset simulation">
            <RotateCcw size={13} aria-hidden="true" />
          </button>
          <select
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            style={{ width: 76 }}
            aria-label="Playback speed"
          >
            {[0.5, 1, 2, 4].map(s => <option key={s} value={s}>{s}×</option>)}
          </select>
        </div>
      </div>

      {/* Layer toggles + scheduler selector */}
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        {[
          { key: 'showGroundTruth', val: showGroundTruth, label: 'Ground Truth', color: 'var(--gt)' },
          { key: 'showObserved',    val: showObserved,    label: 'Observed',     color: 'var(--pred)' },
          { key: 'showPredictions', val: showPredictions, label: 'Predictions',  color: 'var(--accent)' },
        ].map(({ key, val, label, color }) => (
          <button
            key={key}
            onClick={() => toggleLayer(key)}
            className="btn btn-sm"
            aria-pressed={val}
            style={{
              background: val ? `color-mix(in srgb, ${color} 10%, var(--bg))` : 'var(--bg-panel)',
              borderColor: val ? color : 'var(--border-mid)',
              color:       val ? color : 'var(--text-sub)',
            }}
          >
            {val ? <Eye size={11} aria-hidden="true" /> : <EyeOff size={11} aria-hidden="true" />}
            {label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="scheduler-select" style={{ margin: 0, display: 'inline', fontSize: 11 }}>Scheduler</label>
          <select
            id="scheduler-select"
            value={scheduler}
            onChange={e => { setScheduler(e.target.value); refreshCandidates(); }}
            style={{ width: 160 }}
          >
            <option value="fixed">Fixed Sweep</option>
            <option value="random">Random</option>
            <option value="adaptive">Adaptive Stat.</option>
            <option value="ml">ML-Adaptive</option>
            <option value="bandit">Contextual Bandit</option>
          </select>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        {/* Main panels */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div className="card-title">
                Time-Frequency Waterfall
                {status === 'running' && <span className="dot dot-running" style={{ marginLeft: 6 }} aria-hidden="true" />}
              </div>
              <div className="flex gap-2">
                {showGroundTruth && <span className="badge badge-gt">Ground Truth</span>}
                {showObserved    && <span className="badge badge-pred">Observed</span>}
                {showPredictions && <span className="badge badge-info">Predictions</span>}
              </div>
            </div>
            <WaterfallChart height={290} currentBand={currentEvent?.band ?? 5} />
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-faint)' }}>
              Diamond marker = current receiver observation · Color encodes simulated signal power · Not real-world sensor data
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Hit / Miss / False-Alarm Timeline</div>
              <div className="flex gap-2">
                <span className="badge badge-hit">HIT</span>
                <span className="badge badge-miss">MISS</span>
                <span className="badge badge-fa">FA</span>
              </div>
            </div>
            <HitMissTimeline events={events} height={160} />
          </div>
        </div>

        {/* Right panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Current observation */}
          <div className="card">
            <div className="card-title mb-3">Current Observation</div>
            {currentEvent ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>Result</span>
                  <span className={`badge badge-${currentEvent.result === 'hit' ? 'hit' : currentEvent.result === 'false_alarm' ? 'fa' : 'miss'}`}>
                    {currentEvent.result.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 10, fontFamily: 'var(--font-mono)' }}>
                  Band {currentEvent.band} · t = {currentEvent.timestamp}
                </div>
                <ScoreBar label="Pred. Probability" value={currentEvent.prediction_probability} color="var(--accent)" />
                <ScoreBar label="Uncertainty σ"     value={currentEvent.uncertainty}            color="var(--warn)" />
                <ScoreBar label="Decision Score"    value={currentEvent.decision_score}         color="var(--hit)" />
              </>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', padding: '16px 0' }}>
                Press Start to begin simulation
              </div>
            )}
          </div>

          {/* Scheduler candidates */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-title mb-1">Candidate Observations</div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 10 }}>Ranked by decision score</div>
            {top5.map(c => (
              <div
                key={c.band}
                style={{
                  padding: '7px 10px',
                  marginBottom: 3,
                  background: c.selected ? 'var(--accent-bg)' : 'var(--bg-inset)',
                  border: `1px solid ${c.selected ? 'var(--accent-border)' : 'transparent'}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 12, fontWeight: c.selected ? 600 : 400, color: c.selected ? 'var(--accent)' : 'var(--text-base)' }}>
                    {c.selected && '★ '}Band {c.band} · {c.freq_label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-base)' }}>
                    {c.total_score.toFixed(3)}
                  </span>
                </div>
                <div className="progress" style={{ height: 2 }}>
                  <div className="progress-fill" style={{ width: `${c.total_score * 100}%`, background: c.selected ? 'var(--accent)' : 'var(--border-dark)' }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
                  P={c.predicted_prob.toFixed(2)} σ={c.uncertainty.toFixed(2)} recency={c.recency.toFixed(1)}s
                </div>
              </div>
            ))}
          </div>

          {/* Environment state */}
          <div className="card">
            <div className="card-title mb-3">Environment State</div>
            {[
              ['Noise Level',    `${(noiseLevel * 100).toFixed(0)}%`, 'badge-warn'],
              ['Obs. Bandwidth', '10 MHz',                             'badge-info'],
              ['Scan Duration',  '5 ms',                               'badge-info'],
              ['Active Signals', '7',                                  'badge-hit'],
            ].map(([k, v, cls]) => (
              <div key={k} className="flex items-center justify-between" style={{ marginBottom: 7 }}>
                <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>{k}</span>
                <span className={`badge ${cls}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
