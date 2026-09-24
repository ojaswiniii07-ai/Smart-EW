// ─── Mock Data Layer ────────────────────────────────────────────────────────
// All data here is synthetic / simulated research data only.
// No real-world operational sensor or mission data.

export const NUM_BANDS = 32;
export const NUM_TIME_SLOTS = 64;

// ── Scenarios ────────────────────────────────────────────────────────────────
export const mockScenarios = [
  {
    id: 'sc-001', name: 'No Prior Information', seed: 42,
    bands: 32, duration: 300, description: 'Baseline: scheduler has zero prior knowledge.',
    noise: 0.15, activity_density: 0.3, tags: ['baseline', 'no-prior'],
  },
  {
    id: 'sc-002', name: 'Periodic Activity', seed: 77,
    bands: 32, duration: 300, description: 'Signals follow regular temporal patterns.',
    noise: 0.1, activity_density: 0.4, tags: ['periodic'],
  },
  {
    id: 'sc-003', name: 'Burst / Short Duration', seed: 101,
    bands: 32, duration: 300, description: 'Short-lived burst emitters.',
    noise: 0.2, activity_density: 0.25, tags: ['burst', 'challenging'],
  },
  {
    id: 'sc-004', name: 'High False-Alarm Environment', seed: 55,
    bands: 32, duration: 300, description: 'High noise causing many false alarms.',
    noise: 0.4, activity_density: 0.35, tags: ['noisy', 'false-alarm'],
  },
  {
    id: 'sc-005', name: 'Distribution Shift', seed: 200,
    bands: 32, duration: 300, description: 'Training and evaluation environments differ.',
    noise: 0.18, activity_density: 0.45, tags: ['shift', 'ood'],
  },
];

// ── Schedulers ───────────────────────────────────────────────────────────────
export const schedulerTypes = [
  { id: 'fixed', name: 'Fixed Sweep', description: 'Sequential fixed-order band sweep.' },
  { id: 'random', name: 'Random', description: 'Uniformly random band selection.' },
  { id: 'adaptive', name: 'Adaptive Statistical', description: 'History-based activity estimates.' },
  { id: 'ml', name: 'ML-Adaptive', description: 'Supervised ML predictions with uncertainty.' },
  { id: 'bandit', name: 'Contextual Bandit', description: 'Exploration/exploitation balance.' },
];

// ── Models ───────────────────────────────────────────────────────────────────
export const mockModels = [
  {
    id: 'mdl-001', name: 'LogisticBaseline', type: 'Logistic Regression',
    dataset: 'synthetic-v2', version: '1.0.0', status: 'active',
    trained_at: '2026-09-10T08:00:00Z',
    metrics: { accuracy: 0.741, precision: 0.713, recall: 0.768, f1: 0.739, auc: 0.812 },
    features: ['activity_rate', 'recency', 'snr_estimate', 'time_of_day'],
  },
  {
    id: 'mdl-002', name: 'RandomForestV2', type: 'Random Forest',
    dataset: 'synthetic-v2', version: '2.1.0', status: 'active',
    trained_at: '2026-09-15T10:30:00Z',
    metrics: { accuracy: 0.861, precision: 0.843, recall: 0.879, f1: 0.861, auc: 0.921 },
    features: ['activity_rate', 'recency', 'snr_estimate', 'periodicity_score', 'burst_count', 'neighbor_activity'],
  },
  {
    id: 'mdl-003', name: 'GradientBoostEW', type: 'Gradient Boosting',
    dataset: 'synthetic-v3', version: '1.0.0', status: 'active',
    trained_at: '2026-09-20T14:00:00Z',
    metrics: { accuracy: 0.887, precision: 0.871, recall: 0.903, f1: 0.887, auc: 0.944 },
    features: ['activity_rate', 'recency', 'snr_estimate', 'periodicity_score', 'burst_count', 'neighbor_activity', 'time_since_hit', 'uncertainty'],
  },
  {
    id: 'mdl-004', name: 'NeuralEWNet', type: 'Neural Network',
    dataset: 'synthetic-v3', version: '0.9.2', status: 'experimental',
    trained_at: '2026-09-22T09:00:00Z',
    metrics: { accuracy: 0.901, precision: 0.888, recall: 0.914, f1: 0.901, auc: 0.961 },
    features: ['activity_rate', 'recency', 'snr_estimate', 'periodicity_score', 'burst_count', 'neighbor_activity', 'time_since_hit', 'uncertainty', 'spectral_entropy', 'cross_band_correlation'],
  },
];

// ── Datasets ─────────────────────────────────────────────────────────────────
export const mockDatasets = [
  {
    id: 'ds-001', name: 'synthetic-v2', source: 'Internal Simulator',
    version: '2.0.0', license: 'Research Internal', modality: 'Synthetic RF',
    size_mb: 128, freq_range: '100–6000 MHz', time_coverage: '300 s × 1000 scenarios',
    status: 'ready', quality_score: 0.98, missing_pct: 0.0,
    train_pct: 70, val_pct: 15, test_pct: 15,
    class_distribution: { active: 0.31, inactive: 0.69 },
  },
  {
    id: 'ds-002', name: 'synthetic-v3', source: 'Internal Simulator',
    version: '3.0.0', license: 'Research Internal', modality: 'Synthetic RF',
    size_mb: 512, freq_range: '100–6000 MHz', time_coverage: '300 s × 5000 scenarios',
    status: 'ready', quality_score: 0.99, missing_pct: 0.0,
    train_pct: 70, val_pct: 15, test_pct: 15,
    class_distribution: { active: 0.34, inactive: 0.66 },
  },
  {
    id: 'ds-003', name: 'public-radiohound-2024', source: 'Public Research Dataset',
    version: '1.0.0', license: 'CC BY 4.0', modality: 'Measured RF',
    size_mb: 2048, freq_range: '400–3000 MHz', time_coverage: '24 h × 12 locations',
    status: 'preprocessing', quality_score: 0.84, missing_pct: 2.3,
    train_pct: 70, val_pct: 15, test_pct: 15,
    class_distribution: { active: 0.22, inactive: 0.78 },
  },
];

// ── Runs ─────────────────────────────────────────────────────────────────────
export const mockRuns = [
  {
    id: 'run-001', scenario_id: 'sc-001', scheduler_id: 'fixed',
    model_id: null, seed: 42, status: 'completed',
    started_at: '2026-09-24T10:00:00Z', ended_at: '2026-09-24T10:05:23Z',
    metrics: { pd: 0.412, far: 0.091, obs_rate: 0.312, avg_latency: 18.4, coverage: 0.71, reward: 124.3 },
    version: '1.0.0',
  },
  {
    id: 'run-002', scenario_id: 'sc-001', scheduler_id: 'random',
    model_id: null, seed: 42, status: 'completed',
    started_at: '2026-09-24T10:06:00Z', ended_at: '2026-09-24T10:11:44Z',
    metrics: { pd: 0.481, far: 0.108, obs_rate: 0.361, avg_latency: 15.2, coverage: 0.78, reward: 163.7 },
    version: '1.0.0',
  },
  {
    id: 'run-003', scenario_id: 'sc-001', scheduler_id: 'adaptive',
    model_id: null, seed: 42, status: 'completed',
    started_at: '2026-09-24T10:12:00Z', ended_at: '2026-09-24T10:17:31Z',
    metrics: { pd: 0.672, far: 0.063, obs_rate: 0.541, avg_latency: 9.8, coverage: 0.87, reward: 289.4 },
    version: '1.0.0',
  },
  {
    id: 'run-004', scenario_id: 'sc-001', scheduler_id: 'ml',
    model_id: 'mdl-003', seed: 42, status: 'completed',
    started_at: '2026-09-24T10:18:00Z', ended_at: '2026-09-24T10:23:17Z',
    metrics: { pd: 0.841, far: 0.042, obs_rate: 0.713, avg_latency: 5.4, coverage: 0.93, reward: 412.8 },
    version: '1.0.0',
  },
  {
    id: 'run-005', scenario_id: 'sc-001', scheduler_id: 'bandit',
    model_id: 'mdl-003', seed: 42, status: 'running',
    started_at: '2026-09-24T10:24:00Z', ended_at: null,
    metrics: { pd: 0.863, far: 0.038, obs_rate: 0.741, avg_latency: 4.9, coverage: 0.95, reward: 441.2 },
    version: '1.0.0',
  },
];

// ── Benchmark ─────────────────────────────────────────────────────────────────
export const benchmarkData = {
  schedulers: ['Fixed Sweep', 'Random', 'Adaptive Stat.', 'ML-Adaptive', 'Bandit'],
  pd:          [0.412, 0.481, 0.672, 0.841, 0.863],
  far:         [0.091, 0.108, 0.063, 0.042, 0.038],
  obs_rate:    [0.312, 0.361, 0.541, 0.713, 0.741],
  avg_latency: [18.4,  15.2,  9.8,   5.4,   4.9],
  coverage:    [0.71,  0.78,  0.87,  0.93,  0.95],
  reward:      [124.3, 163.7, 289.4, 412.8, 441.2],
  ci_pd:       [0.031, 0.028, 0.021, 0.014, 0.012],
};

// ── Waterfall / Spectrogram ──────────────────────────────────────────────────
export function generateWaterfallData(bands = NUM_BANDS, slots = NUM_TIME_SLOTS) {
  const z = [];
  // Simulate persistent emitters + noise
  const emitters = [
    { band: 5,  start: 0, end: 64, strength: 0.85 },
    { band: 12, start: 10, end: 50, strength: 0.72 },
    { band: 18, start: 0,  end: 30, strength: 0.91 },
    { band: 23, start: 40, end: 64, strength: 0.68 },
    { band: 28, start: 20, end: 45, strength: 0.77 },
    { band: 7,  start: 5,  end: 20, strength: 0.61 },
    { band: 15, start: 30, end: 55, strength: 0.88 },
  ];
  for (let t = 0; t < slots; t++) {
    const row = [];
    for (let b = 0; b < bands; b++) {
      let val = Math.random() * 0.18; // noise floor
      for (const em of emitters) {
        if (em.band === b && t >= em.start && t <= em.end) {
          val += em.strength + (Math.random() - 0.5) * 0.1;
        }
      }
      row.push(Math.min(1, val));
    }
    z.push(row);
  }
  return z;
}

// ── Occupancy Heatmap ─────────────────────────────────────────────────────────
export function generateOccupancyData(bands = NUM_BANDS, slots = 24) {
  return Array.from({ length: bands }, (_, b) =>
    Array.from({ length: slots }, (_, t) => {
      const emitters = [5, 12, 18, 23, 28, 7, 15];
      if (emitters.includes(b)) return 0.5 + Math.random() * 0.5;
      return Math.random() * 0.25;
    })
  );
}

// ── Hit/Miss Timeline ─────────────────────────────────────────────────────────
export function generateHitMissTimeline(n = 60) {
  const events = [];
  let t = 0;
  for (let i = 0; i < n; i++) {
    t += Math.floor(Math.random() * 8) + 1;
    const band = Math.floor(Math.random() * NUM_BANDS);
    const prob = Math.random();
    events.push({
      t, band,
      result: prob > 0.72 ? 'hit' : prob > 0.62 ? 'miss' : prob > 0.58 ? 'false_alarm' : 'miss',
      prediction: +(Math.random() * 0.6 + 0.3).toFixed(3),
      uncertainty: +(Math.random() * 0.3).toFixed(3),
      scheduler: 'ml',
    });
  }
  return events;
}

// ── Scheduler Candidates ──────────────────────────────────────────────────────
export function generateCandidates(selected = 5) {
  const bands = Array.from({ length: NUM_BANDS }, (_, i) => i)
    .sort(() => Math.random() - 0.5)
    .slice(0, 12);
  return bands.map((b, i) => ({
    band: b,
    freq_label: `${(100 + b * 185).toFixed(0)} MHz`,
    predicted_prob: +(Math.random() * 0.7 + 0.3).toFixed(3),
    uncertainty: +(Math.random() * 0.35).toFixed(3),
    historical_rate: +(Math.random() * 0.8).toFixed(3),
    recency: +(Math.random() * 20).toFixed(1),
    periodicity: +(Math.random() * 0.9).toFixed(3),
    info_gain: +(Math.random() * 0.7).toFixed(3),
    exploration: +(Math.random() * 0.5).toFixed(3),
    exploitation: +(Math.random() * 0.5).toFixed(3),
    total_score: +(Math.random() * 0.6 + 0.4).toFixed(3),
    selected: i === 0,
  })).sort((a, b) => b.total_score - a.total_score)
    .map((c, i) => ({ ...c, selected: i === 0 }));
}

// ── Latency Distribution ──────────────────────────────────────────────────────
export function generateLatencyData(n = 200) {
  return Array.from({ length: n }, () => {
    const base = Math.abs(5 + (Math.random() - 0.5) * 8 + Math.random() * Math.random() * 10);
    return +base.toFixed(2);
  });
}

// ── Cumulative Reward ─────────────────────────────────────────────────────────
export function generateRewardCurves(steps = 100) {
  const t = Array.from({ length: steps }, (_, i) => i);
  const fixed = t.map((_, i) => +(1.2 * i + (Math.random() - 0.5) * 4).toFixed(2));
  const random = t.map((_, i) => +(1.6 * i + (Math.random() - 0.5) * 6).toFixed(2));
  const adaptive = t.map((_, i) => +(2.8 * i + (Math.random() - 0.5) * 5).toFixed(2));
  const ml = t.map((_, i) => +(4.1 * i + (Math.random() - 0.5) * 4).toFixed(2));
  return { t, fixed, random, adaptive, ml };
}

// ── Feature Importance ────────────────────────────────────────────────────────
export const featureImportance = [
  { feature: 'activity_rate', importance: 0.281 },
  { feature: 'recency', importance: 0.198 },
  { feature: 'snr_estimate', importance: 0.167 },
  { feature: 'periodicity_score', importance: 0.134 },
  { feature: 'burst_count', importance: 0.089 },
  { feature: 'neighbor_activity', importance: 0.071 },
  { feature: 'time_since_hit', importance: 0.041 },
  { feature: 'spectral_entropy', importance: 0.019 },
];

// ── ROC Curve data ────────────────────────────────────────────────────────────
export function generateROCData() {
  const pts = 50;
  const fpr = Array.from({ length: pts }, (_, i) => i / (pts - 1));
  const tpr = fpr.map(x => Math.min(1, Math.pow(x, 0.28) + Math.random() * 0.04));
  return { fpr, tpr, auc: 0.944 };
}

// ── Calibration data ──────────────────────────────────────────────────────────
export function generateCalibrationData() {
  const bins = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  const predicted = bins.map(b => b - 0.05);
  const actual = bins.map((b, i) => Math.min(1, b + (Math.random() - 0.5) * 0.08));
  return { predicted, actual };
}

// ── KPI Summary ───────────────────────────────────────────────────────────────
export const kpiSummary = {
  pd: 0.841,
  pd_delta: +0.061,
  far: 0.042,
  far_delta: -0.021,
  obs_rate: 0.713,
  obs_rate_delta: +0.172,
  avg_latency: 5.4,
  avg_latency_delta: -4.4,
  coverage: 0.93,
  coverage_delta: +0.06,
  reward: 412.8,
  reward_delta: +123.4,
};

// ── Simulation live events ─────────────────────────────────────────────────────
export const liveEventTemplates = [
  (t) => ({ type: 'observation.completed', timestamp: t, band: 5,  result: 'hit',        prediction_probability: 0.91, uncertainty: 0.08, scheduler: 'ml', decision_score: 0.87 }),
  (t) => ({ type: 'observation.completed', timestamp: t, band: 18, result: 'hit',        prediction_probability: 0.84, uncertainty: 0.11, scheduler: 'ml', decision_score: 0.81 }),
  (t) => ({ type: 'observation.completed', timestamp: t, band: 9,  result: 'miss',       prediction_probability: 0.42, uncertainty: 0.28, scheduler: 'ml', decision_score: 0.61 }),
  (t) => ({ type: 'observation.completed', timestamp: t, band: 23, result: 'hit',        prediction_probability: 0.77, uncertainty: 0.15, scheduler: 'ml', decision_score: 0.74 }),
  (t) => ({ type: 'observation.completed', timestamp: t, band: 14, result: 'false_alarm',prediction_probability: 0.58, uncertainty: 0.32, scheduler: 'ml', decision_score: 0.55 }),
  (t) => ({ type: 'observation.completed', timestamp: t, band: 28, result: 'hit',        prediction_probability: 0.89, uncertainty: 0.09, scheduler: 'ml', decision_score: 0.85 }),
];
