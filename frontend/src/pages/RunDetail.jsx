import { useMemo, useState } from 'react';
import { Download, RotateCcw, Activity } from 'lucide-react';
import { mockRuns, mockScenarios, mockModels, schedulerTypes, generateHitMissTimeline, generateLatencyData, generateRewardCurves } from '../data/mockData';
import { HitMissTimeline, LatencyDistChart, CumulativeRewardChart } from '../components/charts';

export default function RunDetail() {
  const [runId, setRunId] = useState('run-004');
  const run = mockRuns.find(r => r.id === runId) ?? mockRuns[3];
  const scenario = mockScenarios.find(s => s.id === run.scenario_id);
  const model = mockModels.find(m => m.id === run.model_id);
  const scheduler = schedulerTypes.find(s => s.id === run.scheduler_id);
  const events = useMemo(() => generateHitMissTimeline(60), [runId]);
  const latency = useMemo(() => generateLatencyData(200), [runId]);
  const reward = useMemo(() => generateRewardCurves(80), [runId]);

  const hits   = events.filter(e => e.result === 'hit').length;
  const misses = events.filter(e => e.result === 'miss').length;
  const fas    = events.filter(e => e.result === 'false_alarm').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Run Detail</h1>
          <p className="page-subtitle">Full timeline, metrics, and event breakdown</p>
        </div>
        <div className="flex gap-2">
          <select value={runId} onChange={e => setRunId(e.target.value)} style={{ width: 160 }}>
            {mockRuns.map(r => <option key={r.id} value={r.id}>{r.id}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm"><RotateCcw size={13} /> Replay</button>
          <button className="btn btn-secondary btn-sm"><Download size={13} /> Export</button>
        </div>
      </div>

      {/* Run Metadata */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">📋 Run Metadata</div>
          <span className={`badge ${run.status === 'completed' ? 'badge-success' : run.status === 'running' ? 'badge-info' : 'badge-neutral'}`}>
            {run.status}
          </span>
        </div>
        <div className="grid-4" style={{ gap: 12 }}>
          {[
            ['Run ID',      run.id],
            ['Scenario',    scenario?.name ?? run.scenario_id],
            ['Scheduler',   scheduler?.name ?? run.scheduler_id],
            ['ML Model',    model?.name ?? 'N/A'],
            ['Dataset',     model?.dataset ?? 'N/A'],
            ['Model Version', model?.version ?? 'N/A'],
            ['Seed',        run.seed],
            ['Version',     run.version],
            ['Started',     run.started_at ? new Date(run.started_at).toLocaleString() : '—'],
            ['Ended',       run.ended_at   ? new Date(run.ended_at).toLocaleString()   : '—'],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{k}</div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all' }}>{String(v)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics */}
      {run.metrics.pd != null && (
        <div className="section">
          <div className="section-title mb-3"><Activity size={13} /> Performance Metrics</div>
          <div className="kpi-grid">
            {[
              { label: 'Prob. Detection',    val: (run.metrics.pd * 100).toFixed(1) + '%',   color: 'var(--hit)' },
              { label: 'False Alarm Rate',   val: (run.metrics.far * 100).toFixed(1) + '%',  color: 'var(--false-alarm)' },
              { label: 'Observation Rate',   val: (run.metrics.obs_rate * 100).toFixed(1) + '%', color: 'var(--accent)' },
              { label: 'Avg Latency',        val: run.metrics.avg_latency.toFixed(1) + ' s', color: 'var(--pred)' },
              { label: 'Coverage',           val: (run.metrics.coverage * 100).toFixed(1) + '%', color: 'var(--gt)' },
              { label: 'Cumulative Reward',  val: run.metrics.reward.toFixed(0),              color: 'var(--accent)' },
            ].map(({ label, val, color }) => (
              <div key={label} className="kpi-card">
                <div className="kpi-label">{label}</div>
                <div className="kpi-value" style={{ color, fontSize: 22 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <div className="card-title">📊 Observation Timeline</div>
            <div className="flex gap-2">
              <span style={{ fontSize: 11, color: 'var(--hit)' }}>● {hits} hits</span>
              <span style={{ fontSize: 11, color: 'var(--miss)' }}>✕ {misses} misses</span>
              <span style={{ fontSize: 11, color: 'var(--false-alarm)' }}>▲ {fas} FA</span>
            </div>
          </div>
          <HitMissTimeline events={events} height={200} />
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">⏱ Latency Distribution</div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Observation latency (s)</span>
          </div>
          <LatencyDistChart data={latency} height={200} />
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">🏆 Cumulative Reward vs Other Strategies</div>
        </div>
        <CumulativeRewardChart data={reward} height={200} />
      </div>

      {/* Event log */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">📜 Event Log</div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last {events.length} events</span>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 320, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>t</th>
                <th>Band</th>
                <th>Result</th>
                <th>Prediction</th>
                <th>Uncertainty</th>
                <th>Scheduler</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 30).map((e, i) => (
                <tr key={i}>
                  <td>{e.t}</td>
                  <td style={{ color: 'var(--accent)' }}>B{e.band}</td>
                  <td>
                    <span className={`badge badge-${e.result === 'hit' ? 'hit' : e.result === 'false_alarm' ? 'fa' : 'miss'}`}>
                      {e.result.toUpperCase().replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ color: 'var(--pred)' }}>{e.prediction.toFixed(3)}</td>
                  <td style={{ color: 'var(--false-alarm)' }}>{e.uncertainty.toFixed(3)}</td>
                  <td style={{ fontFamily: 'inherit', color: 'var(--text-secondary)' }}>{e.scheduler}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
