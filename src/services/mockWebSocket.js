// ─── Mock WebSocket / SSE Simulation ─────────────────────────────────────────
// Emits deterministic simulation events on a timer.
// Replace with real WS /api/v1/runs/{id}/stream when backend is ready.
import { liveEventTemplates } from '../data/mockData';

export class MockWebSocket {
  constructor(onEvent, intervalMs = 1800) {
    this.onEvent = onEvent;
    this.intervalMs = intervalMs;
    this.timer = null;
    this.tick = 0;
    this.connected = false;
  }

  connect() {
    this.connected = true;
    this.tick = 0;
    this.timer = setInterval(() => {
      const template = liveEventTemplates[this.tick % liveEventTemplates.length];
      const event = template(this.tick * 5);
      this.onEvent(event);
      this.tick++;
    }, this.intervalMs);
    return this;
  }

  disconnect() {
    this.connected = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }
}

export function useMockStream(onEvent, active, intervalMs = 1800) {
  // Returns a ref-based socket that connects/disconnects based on `active`
  return { connect: () => new MockWebSocket(onEvent, intervalMs).connect() };
}
