
// Push notifications have been removed. This module remains as a no-op shim.
async function sendPush() {
  return { skipped: true };
}

module.exports = { sendPush };
