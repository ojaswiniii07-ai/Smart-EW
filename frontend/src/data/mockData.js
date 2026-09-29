// ─── Mock Data Layer ────────────────────────────────────────────────────────
// All data here is synthetic / simulated research data only.
// Based on the Turing Synthetic Radar Dataset (TSRD) from the Alan Turing Institute.
// Reference: https://huggingface.co/datasets/alan-turing-institute/turing-synthetic-radar-dataset
// Challenge: https://github.com/alan-turing-institute/turing-deinterleaving-challenge

export const NUM_BANDS     = 32;
export const NUM_TIME_SLOTS = 64;

// ── PDW Parameters (Pulse Descriptor Words) ─────────────────────────────────
// The fundamental input for deinterleaving algorithms
// Each PDW characterises: ToA, CF, PW, AoA, Amplitude
export const PDW_PARAMS = [
  { key: 'toa',       label: 'Time of Arrival (ToA)',    unit: 'μs',  description: 'Timestamp when pulse leading edge is detected. Enables PRI estimation.' },
  { key: 'cf',        label: 'Centre Frequency (CF)',     unit: 'MHz', description: 'Carrier frequency of the radar pulse. Primary discriminator for frequency-agile emitters.' },
  { key: 'pw',        label: 'Pulse Width (PW)',          unit: 'μs',  description: 'Duration of the pulse envelope. Indicates radar type and operational mode.' },
  { key: 'aoa',       label: 'Angle of Arrival (AoA)',   unit: '°',   description: 'Spatial direction from which the pulse arrives. Provides spatial emitter discrimination.' },
  { key: 'amplitude', label: 'Amplitude / Power',         unit: 'dBm', description: 'Peak power level of received pulse. Relates to emitter power and propagation distance.' },
];

// ── TSRD Dataset Configuration ───────────────────────────────────────────────
// Turing Synthetic Radar Dataset statistics from the challenge README
export const TSRD_STATS = {
  stare: {
    train: { n_trains: 2500, total_pulses: '3.17B', max_pulses: '5.76M', min_pulses: 0, mean_pulses: '1.27M', max_emitters: 83, min_emitters: 0, mean_emitters: 36.7 },
    val:   { n_trains: 250,  total_pulses: '316.7M', max_pulses: '5.92M', min_pulses: 91, mean_pulses: '1.27M', max_emitters: 77, min_emitters: 1, mean_emitters: 36.0 },
    test:  { n_trains: 250,  total_pulses: '367.5M', max_pulses: '4.38M', min_pulses: 1587, mean_pulses: '1.47M', max_emitters: 85, min_emitters: 1, mean_emitters: 43.3 },
  },
  scan: {
    train: { n_trains: 2500, total_pulses: '233.2M', max_pulses: '390.5K', min_pulses: 0,   mean_pulses: '93.3K', max_emitters: 85, min_emitters: 0, mean_emitters: 38.1 },
    val:   { n_trains: 250,  total_pulses: '22.7M',  max_pulses: '505.1K', min_pulses: 4,   mean_pulses: '90.8K', max_emitters: 79, min_emitters: 1, mean_emitters: 37.1 },
    test:  { n_trains: 250,  total_pulses: '27.0M',  max_pulses: '354.8K', min_pulses: 103, mean_pulses: '107.9K', max_emitters: 90, min_emitters: 1, mean_emitters: 44.3 },
  },
};

// ── Scenarios ────────────────────────────────────────────────────────────────
export const mockScenarios = [
  {
    id: 'sc-001', name: 'Low Emitter Density', seed: 42,
    bands: 32, n_emitters: 8, duration_ms: 1000,
    description: 'Sparse electromagnetic environment with few simultaneous emitters.',
    receiver_mode: 'stare', noise: 0.05, tags: ['baseline', 'low-density'],
  },
  {
    id: 'sc-002', name: 'High Emitter Density', seed: 77,
    bands: 32, n_emitters: 50, duration_ms: 1000,
    description: 'Dense environment simulating 50 simultaneous radar emitters.',
    receiver_mode: 'stare', noise: 0.08, tags: ['dense', 'challenging'],
  },
  {
    id: 'sc-003', name: 'Mobile Emitters (Scan)', seed: 101,
    bands: 32, n_emitters: 20, duration_ms: 1000,
    description: 'Emitters moving on 2D plane at constant velocity, scan receiver mode.',
    receiver_mode: 'scan', noise: 0.12, tags: ['mobile', 'scan'],
  },
  {
    id: 'sc-004', name: 'Frequency-Agile Emitters', seed: 55,
    bands: 32, n_emitters: 15, duration_ms: 1000,
    description: 'Emitters with frequency-agile patterns making CF less discriminative.',
    receiver_mode: 'stare', noise: 0.10, tags: ['freq-agile', 'hard'],
  },
  {
    id: 'sc-005', name: 'Distribution Shift (OOD)', seed: 200,
    bands: 32, n_emitters: 35, duration_ms: 1000,
    description: 'Evaluation environment differs from training distribution.',
    receiver_mode: 'scan', noise: 0.15, tags: ['ood', 'shift'],
  },
];

// ── Schedulers ───────────────────────────────────────────────────────────────
export const schedulerTypes = [
  { id: 'fixed',    name: 'Fixed Sweep',         description: 'Sequential fixed-order band sweep.' },
  { id: 'random',   name: 'Random',               description: 'Uniformly random band selection.' },
  { id: 'adaptive', name: 'Adaptive Statistical', description: 'History-based activity estimates.' },
  { id: 'ml',       name: 'ML-Adaptive',          description: 'Supervised ML predictions with uncertainty.' },
  { id: 'bandit',   name: 'Contextual Bandit',    description: 'Exploration/exploitation balance.' },
];

// ── Deinterleaving Models ─────────────────────────────────────────────────────
// Models evaluated with V-measure (primary metric), AMI, and Silhouette
export const mockModels = [
  {
    id: 'mdl-001', name: 'DBSCAN Baseline', type: 'Clustering (Traditional)',
    dataset: 'TSRD-stare-v1', version: '1.0.0', status: 'active',
    trained_at: '2026-09-10T08:00:00Z',
    approach: 'traditional',
    description: 'Density-based spatial clustering on PDW feature space (CF + AoA). No training required.',
    metrics: { v_measure: 0.621, ami: 0.583, homogeneity: 0.647, completeness: 0.598 },
    features: ['cf', 'aoa'],
  },
  {
    id: 'mdl-002', name: 'PRI Histogram + KMeans', type: 'Clustering (Traditional)',
    dataset: 'TSRD-stare-v1', version: '1.2.0', status: 'active',
    trained_at: '2026-09-15T10:30:00Z',
    approach: 'traditional',
    description: 'PRI histogram analysis combined with K-means clustering on full PDW feature space.',
    metrics: { v_measure: 0.714, ami: 0.688, homogeneity: 0.731, completeness: 0.698 },
    features: ['toa', 'cf', 'pw'],
  },
  {
    id: 'mdl-003', name: 'TransformerDeinterleaver', type: 'Transformer + Triplet Loss',
    dataset: 'TSRD-stare-v1', version: '1.0.0', status: 'active',
    trained_at: '2026-09-20T14:00:00Z',
    approach: 'deep_learning',
    description: 'Self-attention transformer trained with triplet loss. Learns pulse embeddings where same-emitter pulses cluster tightly.',
    metrics: { v_measure: 0.887, ami: 0.871, homogeneity: 0.903, completeness: 0.873 },
    features: ['toa', 'cf', 'pw', 'aoa', 'amplitude'],
  },
  {
    id: 'mdl-004', name: 'SeqToSeq-EW Transformer', type: 'Seq2Seq Transformer',
    dataset: 'TSRD-scan-v1', version: '0.9.2', status: 'experimental',
    trained_at: '2026-09-22T09:00:00Z',
    approach: 'deep_learning',
    description: 'Sequence-to-sequence model processing entire pulse trains simultaneously with self-attention to capture long-range PRI dependencies.',
    metrics: { v_measure: 0.921, ami: 0.908, homogeneity: 0.934, completeness: 0.909 },
    features: ['toa', 'cf', 'pw', 'aoa', 'amplitude'],
  },
];

// ── Datasets (TSRD-based) ─────────────────────────────────────────────────────
export const mockDatasets = [
  {
    id: 'ds-001', name: 'TSRD-Stare v1.0',
    source: 'Alan Turing Institute / HuggingFace',
    hf_url: 'https://huggingface.co/datasets/alan-turing-institute/turing-synthetic-radar-dataset',
    version: '1.0.0', license: 'Apache-2.0', modality: 'Synthetic Radar (PDW)',
    receiver_mode: 'stare',
    size_mb: 38600, freq_range: '100–18,000 MHz', time_coverage: '3,000 pulse trains · 3.86B pulses',
    status: 'ready', quality_score: 0.99, missing_pct: 0.0,
    train_pct: 83, val_pct: 8, test_pct: 8,
    n_train: 2500, n_val: 250, n_test: 250,
    max_emitters: 85, mean_emitters: 37.2,
    class_distribution: { emitter_type_A: 0.34, emitter_type_B: 0.28, emitter_type_C: 0.22, other: 0.16 },
  },
  {
    id: 'ds-002', name: 'TSRD-Scan v1.0',
    source: 'Alan Turing Institute / HuggingFace',
    hf_url: 'https://huggingface.co/datasets/alan-turing-institute/turing-synthetic-radar-dataset',
    version: '1.0.0', license: 'Apache-2.0', modality: 'Synthetic Radar (PDW)',
    receiver_mode: 'scan',
    size_mb: 2800, freq_range: '100–18,000 MHz', time_coverage: '3,000 pulse trains · 282.8M pulses',
    status: 'ready', quality_score: 0.99, missing_pct: 0.0,
    train_pct: 83, val_pct: 8, test_pct: 8,
    n_train: 2500, n_val: 250, n_test: 250,
    max_emitters: 90, mean_emitters: 38.5,
    class_distribution: { emitter_type_A: 0.31, emitter_type_B: 0.30, emitter_type_C: 0.25, other: 0.14 },
  },
  {
    id: 'ds-003', name: 'Custom-Synthetic-v2',
    source: 'Internal Simulator',
    hf_url: null,
    version: '2.0.0', license: 'Research Internal', modality: 'Synthetic RF',
    receiver_mode: 'stare',
    size_mb: 512, freq_range: '100–6,000 MHz', time_coverage: '300 s × 5,000 scenarios',
    status: 'ready', quality_score: 0.97, missing_pct: 0.0,
    train_pct: 70, val_pct: 15, test_pct: 15,
    n_train: 3500, n_val: 750, n_test: 750,
    max_emitters: 40, mean_emitters: 18.2,
    class_distribution: { active: 0.34, inactive: 0.66 },
  },
];

// ── Runs ─────────────────────────────────────────────────────────────────────
export const mockRuns = [
  {
    id: 'run-001', scenario_id: 'sc-001', scheduler_id: 'fixed',
    model_id: 'mdl-001', seed: 42, status: 'completed',
    started_at: '2026-09-24T10:00:00Z', ended_at: '2026-09-24T10:05:23Z',
    metrics: { v_measure: 0.621, ami: 0.583, homogeneity: 0.647, completeness: 0.598 },
    version: '1.0.0',
  },
  {
    id: 'run-002', scenario_id: 'sc-001', scheduler_id: 'fixed',
    model_id: 'mdl-002', seed: 42, status: 'completed',
    started_at: '2026-09-24T10:06:00Z', ended_at: '2026-09-24T10:11:44Z',
    metrics: { v_measure: 0.714, ami: 0.688, homogeneity: 0.731, completeness: 0.698 },
    version: '1.0.0',
  },
  {
    id: 'run-003', scenario_id: 'sc-001', scheduler_id: 'adaptive',
    model_id: 'mdl-003', seed: 42, status: 'completed',
    started_at: '2026-09-24T10:12:00Z', ended_at: '2026-09-24T10:17:31Z',
    metrics: { v_measure: 0.887, ami: 0.871, homogeneity: 0.903, completeness: 0.873 },
    version: '1.0.0',
  },
  {
    id: 'run-004', scenario_id: 'sc-002', scheduler_id: 'ml',
    model_id: 'mdl-003', seed: 42, status: 'completed',
    started_at: '2026-09-24T10:18:00Z', ended_at: '2026-09-24T10:23:17Z',
    metrics: { v_measure: 0.841, ami: 0.823, homogeneity: 0.859, completeness: 0.824 },
    version: '1.0.0',
  },
  {
    id: 'run-005', scenario_id: 'sc-002', scheduler_id: 'bandit',
    model_id: 'mdl-004', seed: 42, status: 'running',
    started_at: '2026-09-24T10:24:00Z', ended_at: null,
    metrics: { v_measure: 0.921, ami: 0.908, homogeneity: 0.934, completeness: 0.909 },
    version: '1.0.0',
  },
];

// ── Benchmark ─────────────────────────────────────────────────────────────────
// Comparing deinterleaving approaches on TSRD
export const benchmarkData = {
  schedulers: ['DBSCAN', 'PRI+KMeans', 'Transformer (Stare)', 'Transformer (Scan)', 'SeqToSeq-EW'],
  v_measure:   [0.621, 0.714, 0.887, 0.841, 0.921],
  ami:         [0.583, 0.688, 0.871, 0.823, 0.908],
  homogeneity: [0.647, 0.731, 0.903, 0.859, 0.934],
  completeness:[0.598, 0.698, 0.873, 0.824, 0.909],
  // Legacy fields kept for chart compatibility
  pd:          [0.62,  0.71,  0.89,  0.84,  0.92],
  far:         [0.09,  0.06,  0.03,  0.04,  0.02],
  obs_rate:    [0.58,  0.69,  0.87,  0.82,  0.90],
  avg_latency: [18.4,  15.2,  9.8,   5.4,   4.9],
  coverage:    [0.71,  0.78,  0.87,  0.93,  0.95],
  reward:      [124.3, 163.7, 289.4, 412.8, 441.2],
  ci_pd:       [0.031, 0.028, 0.021, 0.014, 0.012],
};

// ── Waterfall / Spectrogram ──────────────────────────────────────────────────
// Simulates interleaved pulse trains across frequency bands
export function generateWaterfallData(bands = NUM_BANDS, slots = NUM_TIME_SLOTS) {
  const z = [];
  // TSRD-style emitters: each emitter has distinct CF and PRI
  const emitters = [
    { band: 5,  start: 0,  end: 64, strength: 0.85, pri: 4  }, // Emitter A: 925 MHz
    { band: 12, start: 10, end: 50, strength: 0.72, pri: 7  }, // Emitter B: 2320 MHz
    { band: 18, start: 0,  end: 30, strength: 0.91, pri: 3  }, // Emitter C: 3430 MHz
    { band: 23, start: 40, end: 64, strength: 0.68, pri: 11 }, // Emitter D: 4355 MHz
    { band: 28, start: 20, end: 45, strength: 0.77, pri: 5  }, // Emitter E: 5260 MHz
    { band: 7,  start: 5,  end: 20, strength: 0.61, pri: 9  }, // Emitter F: 1295 MHz
    { band: 15, start: 30, end: 55, strength: 0.88, pri: 6  }, // Emitter G: 2875 MHz
  ];
  for (let t = 0; t < slots; t++) {
    const row = [];
    for (let b = 0; b < bands; b++) {
      let val = Math.random() * 0.12; // noise floor
      for (const em of emitters) {
        if (em.band === b && t >= em.start && t <= em.end) {
          // Simulate pulse repetition: pulse appears every `pri` slots
          if (t % em.pri === 0) val += em.strength + (Math.random() - 0.5) * 0.08;
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

// ── PDW Stream Simulation ─────────────────────────────────────────────────────
// Generates synthetic interleaved PDW stream for visualisation
export function generatePDWStream(n_pulses = 200, n_emitters = 8) {
  const pulses = [];
  const emitterConfigs = Array.from({ length: n_emitters }, (_, i) => ({
    id: i,
    cf: 200 + i * 220 + (Math.random() - 0.5) * 40,    // MHz
    pw: 1.0 + Math.random() * 19,                         // μs
    aoa: (Math.random() * 360).toFixed(1),               // degrees
    amplitude: -60 + Math.random() * 30,                 // dBm
    pri: 50 + Math.random() * 950,                        // μs pulse repetition interval
  }));

  let toa = 0;
  for (let i = 0; i < n_pulses; i++) {
    const emitter = emitterConfigs[Math.floor(Math.random() * n_emitters)];
    toa += emitter.pri * (0.9 + Math.random() * 0.2);    // jitter
    pulses.push({
      toa: +toa.toFixed(2),
      cf: +(emitter.cf + (Math.random() - 0.5) * 2).toFixed(2),
      pw: +(emitter.pw + (Math.random() - 0.5) * 0.5).toFixed(3),
      aoa: +(+emitter.aoa + (Math.random() - 0.5) * 3).toFixed(2),
      amplitude: +(emitter.amplitude + (Math.random() - 0.5) * 4).toFixed(2),
      true_emitter: emitter.id,   // ground truth label (only available in TSRD)
    });
  }
  return pulses.sort((a, b) => a.toa - b.toa); // sort by ToA
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
  const fixed    = t.map((_, i) => +(1.2 * i + (Math.random() - 0.5) * 4).toFixed(2));
  const random   = t.map((_, i) => +(1.6 * i + (Math.random() - 0.5) * 6).toFixed(2));
  const adaptive = t.map((_, i) => +(2.8 * i + (Math.random() - 0.5) * 5).toFixed(2));
  const ml       = t.map((_, i) => +(4.1 * i + (Math.random() - 0.5) * 4).toFixed(2));
  return { t, fixed, random, adaptive, ml };
}

// ── Feature Importance (PDW-based) ────────────────────────────────────────────
export const featureImportance = [
  { feature: 'centre_frequency',  importance: 0.312 },
  { feature: 'time_of_arrival',   importance: 0.241 },
  { feature: 'pulse_width',       importance: 0.187 },
  { feature: 'angle_of_arrival',  importance: 0.143 },
  { feature: 'amplitude',         importance: 0.089 },
  { feature: 'pri_estimate',      importance: 0.028 },
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
  const actual    = bins.map((b) => Math.min(1, b + (Math.random() - 0.5) * 0.08));
  return { predicted, actual };
}

// ── KPI Summary (Deinterleaving Metrics) ─────────────────────────────────────
export const kpiSummary = {
  pd: 0.887,          // V-measure (primary TSRD challenge metric)
  pd_delta: +0.173,
  far: 0.031,         // Emitter false-positive rate
  far_delta: -0.052,
  obs_rate: 0.903,    // Homogeneity score
  obs_rate_delta: +0.172,
  avg_latency: 0.873, // Completeness score
  avg_latency_delta: +0.175,
  coverage: 0.871,    // AMI (Adjusted Mutual Information)
  coverage_delta: +0.183,
  reward: 412.8,      // Processing throughput score
  reward_delta: +123.4,
};

// ── Simulation live events ─────────────────────────────────────────────────────
export const liveEventTemplates = [
  (t) => ({ type: 'pulse.classified', timestamp: t, emitter_id: 2,  cf_mhz: 925,  result: 'correct',    v_measure: 0.91, confidence: 0.88, pdw: { toa: t, cf: 925, pw: 3.2, aoa: 45.1, amplitude: -42 } }),
  (t) => ({ type: 'pulse.classified', timestamp: t, emitter_id: 5,  cf_mhz: 2320, result: 'correct',    v_measure: 0.84, confidence: 0.81, pdw: { toa: t, cf: 2320, pw: 1.8, aoa: 120.3, amplitude: -55 } }),
  (t) => ({ type: 'pulse.classified', timestamp: t, emitter_id: 1,  cf_mhz: 580,  result: 'incorrect',  v_measure: 0.42, confidence: 0.38, pdw: { toa: t, cf: 580, pw: 8.4, aoa: 220.7, amplitude: -38 } }),
  (t) => ({ type: 'pulse.classified', timestamp: t, emitter_id: 7,  cf_mhz: 4355, result: 'correct',    v_measure: 0.77, confidence: 0.74, pdw: { toa: t, cf: 4355, pw: 0.9, aoa: 310.2, amplitude: -62 } }),
  (t) => ({ type: 'pulse.classified', timestamp: t, emitter_id: 3,  cf_mhz: 1295, result: 'ambiguous',  v_measure: 0.58, confidence: 0.55, pdw: { toa: t, cf: 1295, pw: 12.1, aoa: 90.0, amplitude: -48 } }),
  (t) => ({ type: 'pulse.classified', timestamp: t, emitter_id: 6,  cf_mhz: 5260, result: 'correct',    v_measure: 0.89, confidence: 0.85, pdw: { toa: t, cf: 5260, pw: 2.7, aoa: 175.5, amplitude: -35 } }),
];
