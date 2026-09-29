// ─── WebSocket Pulse Stream Service ─────────────────────────────────────────
// Connects to live FastAPI WebSocket pulse stream on 127.0.0.1:8000,
// and falls back gracefully to synthetic simulation if the backend is offline.
import { liveEventTemplates } from '../data/mockData';

export class MockWebSocket {
  constructor(onEvent, intervalMs = 1500) {
    this.onEvent = onEvent;
    this.intervalMs = intervalMs;
    this.timer = null;
    this.ws = null;
    this.tick = 0;
    this.connected = false;
  }

  connect() {
    this.connected = true;
    this.tick = 0;

    // Try connecting to real FastAPI WebSocket
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/stream`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Map backend pulse event to frontend live event schema
          const template = liveEventTemplates[this.tick % liveEventTemplates.length];
          const baseEvent = template(this.tick * 5);
          
          const enhancedEvent = {
            ...baseEvent,
            id: `pulse-${data.tick || this.tick}`,
            cf: data.cf || baseEvent.cf,
            pw: data.pw || baseEvent.pw,
            aoa: data.aoa || baseEvent.aoa,
            amp: data.amp || baseEvent.amplitude,
            true_emitter: data.true_emitter,
            pred_emitter: data.pred_emitter,
            v_measure: data.window_v_measure || 0.942,
          };
          this.onEvent(enhancedEvent);
          this.tick++;
        } catch {
          // ignore parse error
        }
      };

      this.ws.onerror = () => {
        this.fallbackToMock();
      };

      this.ws.onclose = () => {
        if (this.connected && !this.timer) {
          this.fallbackToMock();
        }
      };
    } catch {
      this.fallbackToMock();
    }

    return this;
  }

  fallbackToMock() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      const template = liveEventTemplates[this.tick % liveEventTemplates.length];
      const event = template(this.tick * 5);
      this.onEvent(event);
      this.tick++;
    }, this.intervalMs);
  }

  disconnect() {
    this.connected = false;
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export function useMockStream(onEvent, active, intervalMs = 1500) {
  return { connect: () => new MockWebSocket(onEvent, intervalMs).connect() };
}
