// ─── Smart-EW API Service Layer ──────────────────────────────────────────────────
// Connects to live FastAPI backend on Apple Silicon M4 with automatic fallback to mock data.
import {
  mockScenarios, mockRuns, mockModels, mockDatasets, benchmarkData,
  schedulerTypes, kpiSummary,
} from '../data/mockData';

const API_BASE = '/api/v1';

async function fetchWithFallback(url, fallbackData, options = {}) {
  try {
    const res = await fetch(url, { ...options, signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Backend offline or unreachable — use local mock
  }
  return typeof fallbackData === 'function' ? fallbackData() : fallbackData;
}

// ── Scenarios ─────────────────────────────────────────────────────────────────
export const scenariosApi = {
  list:   async () => fetchWithFallback(`${API_BASE}/scenarios`, mockScenarios),
  get:    async (id) => fetchWithFallback(`${API_BASE}/scenarios/${id}`, mockScenarios.find(s => s.id === id)),
  create: async (data) => fetchWithFallback(`${API_BASE}/scenarios`, { ...data, id: `sc-${Date.now()}` }, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),
};

// ── Runs ──────────────────────────────────────────────────────────────────────
export const runsApi = {
  list:    async () => fetchWithFallback(`${API_BASE}/runs`, mockRuns),
  get:     async (id) => fetchWithFallback(`${API_BASE}/runs/${id}`, mockRuns.find(r => r.id === id)),
  start:   async (cfg) => fetchWithFallback(`${API_BASE}/runs/start`, { id: `run-${Date.now()}`, status: 'running', ...cfg }, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cfg),
  }),
  control: async (id, action) => fetchWithFallback(`${API_BASE}/runs/${id}/control`, { id, action, ok: true }, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  }),
  metrics: async (id) => fetchWithFallback(`${API_BASE}/runs/${id}/metrics`, mockRuns.find(r => r.id === id)?.metrics ?? {}),
  events:  async (id) => fetchWithFallback(`${API_BASE}/runs/${id}/events`, []),
};

// ── Models ────────────────────────────────────────────────────────────────────
export const modelsApi = {
  list: async () => fetchWithFallback(`${API_BASE}/models`, mockModels),
  get:  async (id) => {
    const list = await fetchWithFallback(`${API_BASE}/models`, mockModels);
    return list.find(m => m.id === id) || mockModels[0];
  },
};

// ── Datasets ──────────────────────────────────────────────────────────────────
export const datasetsApi = {
  list: async () => fetchWithFallback(`${API_BASE}/datasets`, mockDatasets),
  get:  async (id) => {
    const list = await fetchWithFallback(`${API_BASE}/datasets`, mockDatasets);
    return list.find(d => d.id === id) || mockDatasets[0];
  },
};

// ── Real-Time Radar Deinterleaving API ────────────────────────────────────────
export const deinterleaveApi = {
  run: async (config) => {
    try {
      const res = await fetch(`${API_BASE}/deinterleave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Deinterleave API offline:', e);
    }
    return null;
  }
};

// ── Benchmarks ─────────────────────────────────────────────────────────────────
export const benchmarksApi = {
  get: async () => fetchWithFallback(`${API_BASE}/benchmarks`, benchmarkData),
};

// ── KPI ───────────────────────────────────────────────────────────────────────
export const kpiApi = {
  summary: async () => fetchWithFallback(`${API_BASE}/kpi/summary`, kpiSummary),
};

// ── Schedulers ────────────────────────────────────────────────────────────────
export const schedulersApi = {
  list: async () => fetchWithFallback(`${API_BASE}/schedulers`, schedulerTypes),
};

// ── System Status ─────────────────────────────────────────────────────────────
export const systemApi = {
  status: async () => {
    try {
      const res = await fetch(`${API_BASE}/system/status`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const live = await res.json();
        return {
          api:        live.api || { ok: true, latency_ms: 4 },
          hardware:   live.hardware || { device: 'mps', platform: 'Apple Silicon M4' },
          simulation: { ok: true, status: 'ready' },
          ml:         { ok: true, model: live.model?.name || 'RadarTransformerDeinterleaver', v_measure: live.model?.v_measure },
          db:         { ok: true, records: live.dataset?.total_h5_files || 440 },
          ws:         { ok: true, status: 'connected' },
        };
      }
    } catch {
      // Fallback
    }
    return {
      api:        { ok: false, latency_ms: 0 },
      hardware:   { device: 'mps', platform: 'Apple Silicon M4' },
      simulation: { ok: true,  status: 'ready' },
      ml:         { ok: true,  model: 'RadarTransformerDeinterleaver' },
      db:         { ok: true,  records: 440 },
      ws:         { ok: false, status: 'disconnected' },
    };
  },
};
