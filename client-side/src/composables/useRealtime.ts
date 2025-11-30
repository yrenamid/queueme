let socket: WebSocket | null = null;
const listeners: { [type: string]: Array<(data: any) => void> } = {};
let pendingSubscribeBusinessId: number | null = null;


function computeWsUrl(baseUrl?: string) {
  if (baseUrl) return baseUrl;
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


export function connectRealtime(baseUrl?: string) {
  const url = computeWsUrl(baseUrl);

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
  socket = new WebSocket(url);
  socket.onopen = () => {
    try {
      const subId = pendingSubscribeBusinessId != null
        ? pendingSubscribeBusinessId
        : ((typeof window !== 'undefined') ? Number(window.localStorage.getItem('businessId') || 'NaN') : NaN);
      if (Number.isFinite(subId)) {
        socket?.send(JSON.stringify({ type: 'subscribe', business_id: Number(subId) }));
      }
    } catch (_) { /* noop */ }
  };
  socket.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      const { type, data } = msg || {};
      (listeners[type] || []).forEach((fn) => {
        try {
          fn(data);
        } catch (err) {
          const isDev = !!((import.meta as any)?.env?.DEV);
          if (isDev) {
            console.warn('[realtime] listener error', err);
          }
        }
      });
    } catch (err) {
      const isDev = !!((import.meta as any)?.env?.DEV);
      if (isDev) {
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

export function subscribeBusiness(businessId: number) {
  if (!Number.isFinite(businessId)) return;
  pendingSubscribeBusinessId = Number(businessId);
  try {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'subscribe', business_id: Number(businessId) }));
    }
  } catch (_) { /* noop */ }
}
