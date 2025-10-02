// Push notifications removed; provide minimal no-op exports for legacy requires.
function getVapidKeys() {
  return { publicKey: null, privateKey: null };
}
function getSubscriptions() { return []; }
function saveSubscriptions() { /* no-op */ }
function addSubscription() { /* no-op */ }
function removeSubscriptionsByEndpoint() { return 0; }

module.exports = { getVapidKeys, getSubscriptions, saveSubscriptions, addSubscription, removeSubscriptionsByEndpoint };
