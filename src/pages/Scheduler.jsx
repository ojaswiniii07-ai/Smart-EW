import { useState, useMemo } from 'react';
import { RefreshCw, Info } from 'lucide-react';
import { generateCandidates } from '../data/mockData';

function ScoreBreakdown({ candidate: c }) {
  const scores = [
    { key: 'Predicted Prob.',  val: c.predicted_prob,  color: 'var(--accent)',        desc: 'ML model output probability of active signal' },
    { key: 'Historical Rate',  val: c.historical_rate, color: 'var(--pred)',           desc: 'Empirical activity rate from past observations' },
    { key: 'Info Gain',        val: c.info_gain,       color: 'var(--gt)',             desc: 'Expected information from observing this band' },
    { key: 'Exploration',      val: c.exploration,     color: 'var(--false-alarm)',    desc: 'Bonus for under-explored bands (UCB)' },
    { key: 'Periodicity',      val: c.periodicity,     color: '#a78bfa',               desc: 'Estimated periodic activity score' },
    { key: 'Exploitation',     val: c.exploitation,    color: 'var(--hit)',            desc: 'Reward from exploiting high-prob bands' },
  ];
  return (
    <div>
      {scores.map(({ key, val, color, desc }) => (
        <div key={key} style={{ marginBottom: 10 }}>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }} data-tip={desc}>{key}</span>
            <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color }}>{val.toFixed(3)}</span>
          </div>
          <div className="progress">
            <div className="progress-fill" style={{ width: `${val * 100}%`, background: color }} />
          </div>
        </div>
      ))}
      <div className="divider" />
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Total Score</span>
        <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)' }}>
          {c.total_score.toFixed(3)}
        </span>
      </div>
    </div>
  );
}

export default function SchedulerPage() {
  const [strategy, setStrategy] = useState('ml');
  const [candidates, setCandidates] = useState(() => generateCandidates());
  const [selected, setSelected] = useState(null);

  const refresh = () => {
    const c = generateCandidates();
    setCandidates(c);
    setSelected(null);
  };

  const selectedCandidate = selected !== null ? candidates[selected] : candidates[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Scheduler</h1>
          <p className="page-subtitle">Decision explanation and candidate observation ranking</p>
        </div>
        <button className="btn btn-secondary" onClick={refresh}>
          <RefreshCw size={13} /> Refresh Candidates
        </button>
      </div>

      {/* Strategy selector */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">⚙️ Strategy Configuration</div>
          <span className="badge badge-info">{strategy}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { id: 'fixed',    label: 'Fixed Sweep',        desc: 'Sequential band scan' },
            { id: 'random',   label: 'Random',             desc: 'Uniform random' },
            { id: 'adaptive', label: 'Adaptive Stat.',     desc: 'History-based' },
            { id: 'ml',       label: 'ML-Adaptive',        desc: 'Supervised ML' },
            { id: 'bandit',   label: 'Contextual Bandit',  desc: 'Explore/exploit' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => { setStrategy(s.id); refresh(); }}
              className="btn"
              style={{
                background: strategy === s.id ? 'var(--accent-glow)' : 'var(--bg-card)',
                borderColor: strategy === s.id ? 'rgba(59,130,246,0.4)' : 'var(--border)',
                color: strategy === s.id ? 'var(--accent)' : 'var(--text-secondary)',
                flexDirection: 'column', gap: 2, padding: '8px 14px',
              }}
            >
              <span style={{ fontWeight: 600 }}>{s.label}</span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
        {/* Candidate list */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 Ranked Candidate Observations</div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{candidates.length} candidates · Sorted by decision score</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px 80px 80px 80px', gap: 4, padding: '4px 10px', marginBottom: 4 }}>
            {['Band', 'Frequency', 'P(active)', 'Uncert.', 'Recency', 'Score'].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {candidates.map((c, i) => (
            <div
              key={c.band}
              onClick={() => setSelected(i)}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 80px 80px 80px 80px',
                alignItems: 'center',
                gap: 4,
                padding: '8px 10px',
                borderRadius: 8,
                marginBottom: 4,
                cursor: 'pointer',
                background: (selected === i || (selected === null && i === 0))
                  ? 'var(--accent-glow)'
                  : i % 2 === 0 ? 'var(--bg-primary)' : 'transparent',
                border: `1px solid ${(selected === i || (selected === null && i === 0)) ? 'rgba(59,130,246,0.3)' : 'transparent'}`,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: c.selected ? 'var(--accent)' : 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                {c.selected && '★'} B{c.band}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.freq_label}</span>
              <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)' }}>{c.predicted_prob.toFixed(3)}</span>
              <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--false-alarm)' }}>{c.uncertainty.toFixed(3)}</span>
              <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>{c.recency.toFixed(1)}s</span>
              <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'var(--hit)' }}>{c.total_score.toFixed(3)}</span>
            </div>
          ))}
        </div>

        {/* Score breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">🔍 Score Breakdown</div>
              {selectedCandidate.selected && <span className="badge badge-hit">★ Selected</span>}
            </div>
            <div style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--bg-primary)', borderRadius: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)' }}>
                Band {selectedCandidate.band} · {selectedCandidate.freq_label}
              </div>
            </div>
            <ScoreBreakdown candidate={selectedCandidate} />
          </div>

          {/* Explanation */}
          <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
            <div className="card-title mb-2">
              <Info size={13} /> Human-Readable Explanation
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Band {selectedCandidate.band}</strong> was selected because:
              predicted activity is <strong style={{ color: 'var(--accent)' }}>high ({selectedCandidate.predicted_prob.toFixed(3)})</strong>,
              uncertainty is <strong style={{ color: selectedCandidate.uncertainty < 0.2 ? 'var(--hit)' : 'var(--false-alarm)' }}>
                {selectedCandidate.uncertainty < 0.2 ? 'low' : 'moderate'} ({selectedCandidate.uncertainty.toFixed(3)})
              </strong>,
              and it has not been observed for <strong style={{ color: 'var(--pred)' }}>{selectedCandidate.recency.toFixed(1)} s</strong>.
              Historical activity rate is {selectedCandidate.historical_rate.toFixed(3)}.
            </p>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontStyle: 'italic' }}>
              Generated from structured fields — not a free-form model claim.
            </div>
          </div>

          {/* Expl/Exploit */}
          <div className="card">
            <div className="card-title mb-3">⚖️ Exploration vs Exploitation</div>
            <div style={{ display: 'flex', gap: 0, height: 32, borderRadius: 6, overflow: 'hidden' }}>
              <div style={{
                width: `${selectedCandidate.exploration / (selectedCandidate.exploration + selectedCandidate.exploitation) * 100}%`,
                background: 'var(--false-alarm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, color: '#000',
              }}>
                Explore {(selectedCandidate.exploration * 100).toFixed(0)}%
              </div>
              <div style={{
                flex: 1,
                background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, color: '#fff',
              }}>
                Exploit {(selectedCandidate.exploitation * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
