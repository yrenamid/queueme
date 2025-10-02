// Helper from Knock blog
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const statusEl = document.getElementById('status');
const enableBtn = document.getElementById('enable');
const sendBtn = document.getElementById('send');

async function getPublicKey() {
  const res = await fetch('/api/push/public-key');
  const data = await res.json();
  return data.publicKey;
}

async function enablePush() {
  statusEl.textContent = 'Requesting permission…';
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    statusEl.textContent = 'Permission denied';
    return;
  }

  if (!('serviceWorker' in navigator)) {
    statusEl.textContent = 'Service workers not supported';
    return;
  }

  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const publicKey = await getPublicKey();
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });

  statusEl.textContent = 'Subscribed';
}

async function sendTest() {
  await fetch('/api/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'QueueMe', body: 'Hello from server!' }),
  });
}

enableBtn.addEventListener('click', enablePush);
sendBtn.addEventListener('click', sendTest);
