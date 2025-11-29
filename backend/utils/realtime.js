// WebSocket for realtime updates
const { WebSocketServer } = require('ws');

let wss = null;

function init(server) {
  if (wss) return wss;
  wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws) => {
    try { ws.send(JSON.stringify({ type: 'hello', data: { time: Date.now() } })); } catch {}

    ws._subscription = { business_id: null };

    ws.on('message', (msg) => {
      try {
        const parsed = JSON.parse(String(msg || ''));
        if (parsed && parsed.type === 'subscribe') {
          const bid = parsed.business_id;
          if (bid != null && (Number.isFinite(Number(bid)) || typeof bid === 'string')) {
            ws._subscription.business_id = String(bid);
          }
        }
      } catch (_) { /* ignore malformed messages */ }
    });
  });
  console.log('[realtime] WebSocket server started at /ws');
  return wss;
}

function broadcast(type, data) {
  if (!wss) return;
  const payload = JSON.stringify({ type, data });
  const hasBiz = data && data.business_id != null;
  const eventBiz = hasBiz ? String(data.business_id) : null;
  wss.clients.forEach((client) => {
    if (client.readyState !== 1) return;
    if (hasBiz) {
      const sub = (client._subscription && client._subscription.business_id != null) ? String(client._subscription.business_id) : null;
      if (!sub || sub !== eventBiz) return; // deliver only to matching business subscribers
    }
    try { client.send(payload); } catch {}
  });
}

module.exports = { init, broadcast };
