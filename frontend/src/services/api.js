// ─── Mock API Service Layer ──────────────────────────────────────────────────
// Typed service functions that simulate REST API calls.
// Replace fetch() bodies with real FastAPI calls when backend is ready.
import {
  mockScenarios, mockRuns, mockModels, mockDatasets, benchmarkData,
  schedulerTypes, kpiSummary,
} from '../data/mockData';

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

// ── Scenarios ─────────────────────────────────────────────────────────────────
export const scenariosApi = {
  list:   async () => { await delay(); return mockScenarios; },
  get:    async (id) => { await delay(); return mockScenarios.find(s => s.id === id); },
  create: async (data) => { await delay(500); return { ...data, id: `sc-${Date.now()}` }; },
};

// ── Runs ──────────────────────────────────────────────────────────────────────
export const runsApi = {
  list:    async () => { await delay(); return mockRuns; },
  get:     async (id) => { await delay(); return mockRuns.find(r => r.id === id); },
  start:   async (cfg) => { await delay(600); return { id: `run-${Date.now()}`, status: 'running', ...cfg }; },
  control: async (id, action) => { await delay(200); return { id, action, ok: true }; },
  metrics: async (id) => { await delay(); const r = mockRuns.find(r => r.id === id); return r?.metrics ?? {}; },
  events:  async (id) => { await delay(); return []; },
};

// ── Models ────────────────────────────────────────────────────────────────────
export const modelsApi = {
  list: async () => { await delay(); return mockModels; },
  get:  async (id) => { await delay(); return mockModels.find(m => m.id === id); },
};

// ── Datasets ──────────────────────────────────────────────────────────────────
export const datasetsApi = {
  list: async () => { await delay(); return mockDatasets; },
  get:  async (id) => { await delay(); return mockDatasets.find(d => d.id === id); },
};

// ── Benchmarks ─────────────────────────────────────────────────────────────────
export const benchmarksApi = {
  get: async () => { await delay(); return benchmarkData; },
};

// ── KPI ───────────────────────────────────────────────────────────────────────
export const kpiApi = {
  summary: async () => { await delay(200); return kpiSummary; },
};

// ── Schedulers ────────────────────────────────────────────────────────────────
export const schedulersApi = {
  list: async () => { await delay(); return schedulerTypes; },
};

// ── System Status ─────────────────────────────────────────────────────────────
export const systemApi = {
  status: async () => {
    await delay(150);
    return {
      api:        { ok: true,  latency_ms: 12  },
      simulation: { ok: true,  status: 'ready' },
      ml:         { ok: true,  model: 'GradientBoostEW v1.0.0' },
      db:         { ok: true,  records: 142831 },
      ws:         { ok: false, status: 'disconnected' },
    };
  },
};
