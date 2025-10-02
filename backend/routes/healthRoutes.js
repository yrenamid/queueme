
// Health routes: diagnostics like email test
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const { sendEmail } = require('../utils/notifications');


router.post('/email-test', auth, role(['owner','manager']), async (req, res) => {
  try {
    const { to, subject, text, html } = req.body || {};
    if (!to) return res.status(400).json({ success: false, message: 'to is required' });
    const subj = subject || 'QueueMe Email Test';
    const plain = text || 'This is a test email from QueueMe.';
    const markup = html || `<p>This is a <strong>test email</strong> from QueueMe.</p>`;
    await sendEmail({ to, subject: subj, text: plain, html: markup });
    res.json({ success: true, message: 'Test email sent' });
  } catch (e) {
    console.error('[health][email-test]', e?.response?.body || e?.message || e);
    res.status(500).json({ success: false, message: 'Failed to send test email' });
  }
});

module.exports = router;
