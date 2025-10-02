let socket: WebSocket | null = null;
const listeners: { [type: string]: Array<(data: any) => void> } = {};


// Handles compute Ws Url
function computeWsUrl(baseUrl?: string) {
  if (baseUrl) return baseUrl;

  // Use optional access to avoid TS errors in non-Vite contexts
  const env: any = (import.meta as any)?.env || {};
  if (env.DEV && typeof window !== 'undefined') {
    const loc = window.location;
    const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${loc.host}/ws`;
  }

  const apiBase = env.VITE_API_BASE as string | undefined;
  if (apiBase) {

    return apiBase.replace(/^http/, 'ws').replace(/\/?api$/, '') + '/ws';
  }

  if (typeof window !== 'undefined') {
    const loc = window.location;
    const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${loc.host}/ws`;
  }

  return 'ws://localhost/ws';
}


// Handles connect Realtime
export function connectRealtime(baseUrl?: string) {
  const url = computeWsUrl(baseUrl);

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
  socket = new WebSocket(url);
  socket.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      const { type, data } = msg || {};
      (listeners[type] || []).forEach((fn) => {
        try {
          fn(data);
        } catch (err) {
          // Swallow listener errors to avoid breaking the stream, but log for debugging
          const isDev = !!((import.meta as any)?.env?.DEV);
          if (isDev) {
            // eslint-disable-next-line no-console
            console.warn('[realtime] listener error', err);
          }
        }
      });
    } catch (err) {
      // Ignore malformed messages, but log in development
      const isDev = !!((import.meta as any)?.env?.DEV);
      if (isDev) {
        // eslint-disable-next-line no-console
        console.warn('[realtime] failed to parse message', err, ev?.data);
      }
    }
  };
  socket.onclose = () => {

    setTimeout(() => connectRealtime(baseUrl), 2000);
  };
}

export function onRealtime(type: string, cb: (data: any) => void) {
  if (!listeners[type]) listeners[type] = [];
  listeners[type].push(cb);
  return () => {
    const arr = listeners[type];
    if (!arr) return;
    const i = arr.indexOf(cb);
    if (i >= 0) arr.splice(i, 1);
  };
}
