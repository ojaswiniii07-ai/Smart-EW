import { useMemo, useCallback, useRef, useEffect } from 'react';
import { create } from 'zustand';
import { generateCandidates, generateHitMissTimeline, liveEventTemplates } from '../data/mockData';

// ─── UI Store ────────────────────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('ew-theme', theme);
}

const savedTheme = localStorage.getItem('ew-theme') ?? 'light';
applyTheme(savedTheme);

export const useUIStore = create((set) => ({
  theme: savedTheme,
  sidebarOpen: true,
  activeRun: 'run-004',
  setTheme: (theme) => { applyTheme(theme); set({ theme }); },
  toggleTheme: () => set((s) => {
    const next = s.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    return { theme: next };
  }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveRun: (id) => set({ activeRun: id }),
}));

// ─── Simulation Store ─────────────────────────────────────────────────────────
export const useSimStore = create((set, get) => ({
  status: 'idle',           // idle | running | paused | replaying
  simTime: 0,
  speed: 1,
  scheduler: 'ml',
  showGroundTruth: true,
  showObserved: true,
  showPredictions: true,
  events: generateHitMissTimeline(40),
  candidates: generateCandidates(),
  currentEvent: null,
  noiseLevel: 0.15,
  observationBW: 10,
  scanDuration: 5,

  start:  () => set({ status: 'running' }),
  pause:  () => set({ status: 'paused' }),
  resume: () => set({ status: 'running' }),
  reset:  () => set({ status: 'idle', simTime: 0, events: generateHitMissTimeline(40) }),
  step:   () => set((s) => ({ simTime: s.simTime + 1 })),
  setSpeed: (speed) => set({ speed }),
  setScheduler: (scheduler) => set({ scheduler, candidates: generateCandidates() }),
  toggleLayer: (layer) => set((s) => ({ [layer]: !s[layer] })),
  setSimTime: (simTime) => set({ simTime }),
  appendEvent: (ev) => set((s) => ({ events: [...s.events.slice(-59), ev], currentEvent: ev })),
  refreshCandidates: () => set({ candidates: generateCandidates() }),
}));

// ─── Experiment Store ─────────────────────────────────────────────────────────
export const useExpStore = create((set) => ({
  selectedScenario: 'sc-001',
  selectedScheduler: 'ml',
  selectedModel: 'mdl-003',
  seed: 42,
  repetitions: 5,
  bands: 32,
  duration: 300,
  noiseLevel: 0.15,
  explorationRate: 0.15,
  setField: (key, val) => set({ [key]: val }),
}));
