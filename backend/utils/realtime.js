// WebSocket for realtime updates
const { WebSocketServer } = require('ws');

let wss = null;

function init(server) {
  if (wss) return wss;
  wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws) => {
    try { ws.send(JSON.stringify({ type: 'hello', data: { time: Date.now() } })); } catch {}
  });
  console.log('[realtime] WebSocket server started at /ws');
  return wss;
}

function broadcast(type, data) {
  if (!wss) return;
  const payload = JSON.stringify({ type, data });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      try { client.send(payload); } catch {}
    }
  });
}

module.exports = { init, broadcast };
