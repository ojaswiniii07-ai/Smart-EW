import { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, SkipForward, RotateCcw, Layers, Eye, EyeOff, Zap, Info } from 'lucide-react';
import { WaterfallChart, HitMissTimeline } from '../components/charts';
import { useSimStore } from '../store';
import { MockWebSocket } from '../services/mockWebSocket';
import { generateCandidates, generateHitMissTimeline } from '../data/mockData';

const RESULT_COLORS = { hit: 'var(--hit)', miss: 'var(--miss)', false_alarm: 'var(--false-alarm)' };

function ScoreBar({ label, value, color = 'var(--accent)' }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color }}>{value.toFixed(3)}</span>
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
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (status === 'running') {
      wsRef.current = new MockWebSocket((ev) => {
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Live Simulation</h1>
          <p className="page-subtitle">Closed-loop scheduler visualization · Simulated environment only</p>
        </div>
        <div className="flex gap-2 items-center">
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            SimTime: <span className="mono text-accent">{simTime.toFixed(0).padStart(5, '0')}</span>
          </span>
          {/* Playback controls */}
          {status === 'idle' || status === 'paused' ? (
            <button className="btn btn-primary" onClick={status === 'idle' ? start : resume}>
              <Play size={13} /> {status === 'idle' ? 'Start' : 'Resume'}
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={pause}>
              <Pause size={13} /> Pause
            </button>
          )}
          <button className="btn btn-secondary" onClick={step} disabled={status === 'running'}>
            <SkipForward size={13} /> Step
          </button>
          <button className="btn btn-ghost" onClick={reset}>
            <RotateCcw size={13} /> Reset
          </button>
          <select value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ width: 80 }}>
            {[0.5, 1, 2, 4].map(s => <option key={s} value={s}>{s}×</option>)}
          </select>
        </div>
      </div>

      {/* Layer toggles */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'showGroundTruth', val: showGroundTruth, label: 'Ground Truth', color: 'var(--gt)' },
          { key: 'showObserved',    val: showObserved,    label: 'Observed',     color: 'var(--pred)' },
          { key: 'showPredictions', val: showPredictions, label: 'Predictions',  color: 'var(--accent)' },
        ].map(({ key, val, label, color }) => (
          <button
            key={key}
            onClick={() => toggleLayer(key)}
            className="btn btn-sm"
            style={{
              background: val ? `rgba(${color === 'var(--gt)' ? '167,139,250' : color === 'var(--pred)' ? '56,189,248' : '59,130,246'},0.15)` : 'var(--bg-card)',
              borderColor: val ? color : 'var(--border)',
              color: val ? color : 'var(--text-muted)',
            }}
          >
            {val ? <Eye size={12} /> : <EyeOff size={12} />} {label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Scheduler:</span>
          <select value={scheduler} onChange={e => { setScheduler(e.target.value); refreshCandidates(); }} style={{ width: 150 }}>
            <option value="fixed">Fixed Sweep</option>
            <option value="random">Random</option>
            <option value="adaptive">Adaptive Stat.</option>
            <option value="ml">ML-Adaptive</option>
            <option value="bandit">Contextual Bandit</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Main waterfall */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div className="card-title">
                <Waves size={14} style={{ display: 'inline' }} /> Time-Frequency Waterfall
                {status === 'running' && <span className="dot dot-running" style={{ marginLeft: 6 }} />}
              </div>
              <div className="flex gap-2">
                {showGroundTruth  && <span className="badge badge-gt">Ground Truth</span>}
                {showObserved     && <span className="badge badge-pred">Observed</span>}
                {showPredictions  && <span className="badge badge-info">Predictions</span>}
              </div>
            </div>
            <WaterfallChart height={300} currentBand={currentEvent?.band ?? 5} />
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              ◆ Blue diamond = current receiver observation · Color = simulated signal power · Not real-world sensor data
            </div>
          </div>

          {/* Hit/Miss Timeline */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📊 Hit / Miss / False-Alarm Timeline</div>
              <div className="flex gap-2">
                <span className="badge badge-hit">HIT</span>
                <span className="badge badge-miss">MISS</span>
                <span className="badge badge-fa">FA</span>
              </div>
            </div>
            <HitMissTimeline events={events} height={160} />
          </div>
        </div>

        {/* Right sidebar panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Current Observation */}
          <div className="card">
            <div className="card-title mb-3">📡 Current Observation</div>
            {currentEvent ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Result</span>
                  <span className={`badge badge-${currentEvent.result === 'hit' ? 'hit' : currentEvent.result === 'false_alarm' ? 'fa' : 'miss'}`}>
                    {currentEvent.result.toUpperCase().replace('_', ' ')}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Band <strong style={{ color: 'var(--text-primary)' }}>{currentEvent.band}</strong> · t={currentEvent.timestamp}
                </div>
                <ScoreBar label="Pred. Probability" value={currentEvent.prediction_probability} color="var(--accent)" />
                <ScoreBar label="Uncertainty σ" value={currentEvent.uncertainty} color="var(--uncertain)" />
                <ScoreBar label="Decision Score" value={currentEvent.decision_score} color="var(--hit)" />
              </>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                Press Start to begin simulation
              </div>
            )}
          </div>

          {/* Scheduler Candidates */}
          <div className="card" style={{ flex: 1 }}>
            <div className="card-title mb-3">🧭 Candidate Observations</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Ranked by decision score</div>
            {top5.map((c, i) => (
              <div
                key={c.band}
                style={{
                  padding: '7px 10px', borderRadius: 8, marginBottom: 4,
                  background: c.selected ? 'var(--accent-glow)' : 'var(--bg-primary)',
                  border: `1px solid ${c.selected ? 'rgba(59,130,246,0.3)' : 'transparent'}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 12, fontWeight: c.selected ? 700 : 400, color: c.selected ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {c.selected && '★ '} Band {c.band} · {c.freq_label}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>
                    {c.total_score.toFixed(3)}
                  </span>
                </div>
                <div className="progress" style={{ height: 3 }}>
                  <div className="progress-fill" style={{ width: `${c.total_score * 100}%`, background: c.selected ? 'var(--accent)' : 'var(--text-muted)' }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                  P={c.predicted_prob.toFixed(2)} σ={c.uncertainty.toFixed(2)} recency={c.recency.toFixed(1)}s
                </div>
              </div>
            ))}
          </div>

          {/* Environment State */}
          <div className="card">
            <div className="card-title mb-3">🌐 Environment State</div>
            {[['Noise Level', `${(noiseLevel * 100).toFixed(0)}%`, 'warn'],
              ['Obs. BW', '10 MHz', 'info'],
              ['Scan Duration', '5 ms', 'info'],
              ['Active Signals', '7', 'hit']].map(([k, v, cls]) => (
              <div key={k} className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{k}</span>
                <span className={`badge badge-${cls}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Waves({ size, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
      <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" />
    </svg>
  );
}
