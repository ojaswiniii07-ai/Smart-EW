import { useState, useMemo } from 'react';
import { RefreshCw, Info } from 'lucide-react';
import { generateCandidates } from '../data/mockData';

const SCORE_COLORS = {
  'Predicted Prob.':  'var(--accent)',
  'Historical Rate':  'var(--pred)',
  'Info Gain':        'var(--gt)',
  'Exploration':      'var(--warn)',
  'Periodicity':      '#6d28d9',
  'Exploitation':     'var(--hit)',
};
function ScoreBreakdown({ candidate: c }) {
  const scores = [
    { key: 'Predicted Prob.', val: c.predicted_prob,  color: 'var(--accent)', desc: 'ML model output probability of active signal' },
    { key: 'Historical Rate', val: c.historical_rate, color: 'var(--pred)',   desc: 'Empirical activity rate from past observations' },
    { key: 'Info Gain',       val: c.info_gain,       color: 'var(--gt)',     desc: 'Expected information from observing this band' },
    { key: 'Exploration',     val: c.exploration,     color: 'var(--warn)',   desc: 'Bonus for under-explored bands (UCB)' },
    { key: 'Periodicity',     val: c.periodicity,     color: '#6d28d9',       desc: 'Estimated periodic activity score' },
    { key: 'Exploitation',    val: c.exploitation,    color: 'var(--hit)',    desc: 'Reward from exploiting high-prob bands' },
  ];
  return (
    <div>
      {scores.map(({ key, val, color, desc }) => (
        <div key={key} style={{ marginBottom: 10 }}>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: 12, color: 'var(--text-sub)' }} data-tip={desc}>{key}</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color }}>{val.toFixed(3)}</span>
          </div>
          <div className="progress">
            <div className="progress-fill" style={{ width: `${val * 100}%`, background: color }} />
          </div>
        </div>
      ))}
      <div className="divider" />
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-base)' }}>Total Score</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 400, color: 'var(--accent)' }}>
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
          <div className="card-title">Strategy Configuration</div>
          <span className="badge badge-info">{strategy}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { id: 'fixed',    label: 'Fixed Sweep',       desc: 'Sequential band scan' },
            { id: 'random',   label: 'Random',            desc: 'Uniform random' },
            { id: 'adaptive', label: 'Adaptive Stat.',    desc: 'History-based' },
            { id: 'ml',       label: 'ML-Adaptive',       desc: 'Supervised ML' },
            { id: 'bandit',   label: 'Contextual Bandit', desc: 'Explore/exploit' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => { setStrategy(s.id); refresh(); }}
              className="btn"
              aria-pressed={strategy === s.id}
              style={{
                background:   strategy === s.id ? 'var(--accent-bg)'     : 'var(--bg-well)',
                borderColor:  strategy === s.id ? 'var(--accent-border)' : 'var(--border-mid)',
                color:        strategy === s.id ? 'var(--accent)'        : 'var(--text-sub)',
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
            <div className="card-title">Ranked Candidate Observations</div>
            <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{candidates.length} candidates · sorted by score</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px 80px 80px 80px', gap: 4, padding: '4px 10px', marginBottom: 4 }}>
            {['Band', 'Frequency', 'P(active)', 'Uncert.', 'Recency', 'Score'].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
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
                padding: '7px 10px',
                marginBottom: 3,
                cursor: 'pointer',
                background: (selected === i || (selected === null && i === 0))
                  ? 'var(--accent-bg)'
                  : i % 2 === 0 ? 'var(--bg-inset)' : 'transparent',
                border: `1px solid ${(selected === i || (selected === null && i === 0)) ? 'var(--accent-border)' : 'transparent'}`,
                transition: 'background var(--dur) var(--ease)',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: c.selected ? 'var(--accent)' : 'var(--text-base)', fontFamily: 'var(--font-mono)' }}>
                {c.selected && '★'} B{c.band}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>{c.freq_label}</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{c.predicted_prob.toFixed(3)}</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--warn)' }}>{c.uncertainty.toFixed(3)}</span>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-sub)' }}>{c.recency.toFixed(1)}s</span>
              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--hit)' }}>{c.total_score.toFixed(3)}</span>
            </div>
          ))}
        </div>

        {/* Score breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Score Breakdown</div>
              {selectedCandidate.selected && <span className="badge badge-hit">Selected</span>}
            </div>
            <div style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--bg-inset)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 400, color: 'var(--accent)' }}>
                Band {selectedCandidate.band} · {selectedCandidate.freq_label}
              </div>
            </div>
            <ScoreBreakdown candidate={selectedCandidate} />
          </div>

          {/* Explanation */}
          <div className="card panel-accent">
            <div className="card-title mb-2">Human-Readable Explanation</div>
            <p style={{ fontSize: 12, color: 'var(--text-mid)', lineHeight: 1.65 }}>
              <strong style={{ color: 'var(--text-base)' }}>Band {selectedCandidate.band}</strong> was selected because
              predicted activity is <strong style={{ color: 'var(--accent)' }}>high ({selectedCandidate.predicted_prob.toFixed(3)})</strong>,
              uncertainty is <strong style={{ color: selectedCandidate.uncertainty < 0.2 ? 'var(--hit)' : 'var(--warn)' }}>
                {selectedCandidate.uncertainty < 0.2 ? 'low' : 'moderate'} ({selectedCandidate.uncertainty.toFixed(3)})
              </strong>,
              and it has not been observed for <strong style={{ color: 'var(--pred)' }}>{selectedCandidate.recency.toFixed(1)} s</strong>.
              Historical activity rate is {selectedCandidate.historical_rate.toFixed(3)}.
            </p>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
              Generated from structured fields. Not a free-form model claim.
            </div>
          </div>

          {/* Expl/Exploit balance */}
          <div className="card">
            <div className="card-title mb-3">Exploration vs Exploitation</div>
            <div style={{ display: 'flex', gap: 0, height: 30, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div style={{
                width: `${selectedCandidate.exploration / (selectedCandidate.exploration + selectedCandidate.exploitation) * 100}%`,
                background: 'var(--warn-bg)', borderRight: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, color: 'var(--warn)',
              }}>
                Explore {(selectedCandidate.exploration * 100).toFixed(0)}%
              </div>
              <div style={{
                flex: 1,
                background: 'var(--accent-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, color: 'var(--accent)',
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
