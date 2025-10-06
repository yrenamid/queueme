const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const { sendEmail, sendPhilSMS } = require('../utils/notifications');

router.get('/ping', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

router.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});


router.post('/echo', (req, res) => {
  res.json({
    ok: true,
    headers: req.headers,
    body: req.body,
    contentType: req.get('content-type') || null,
  });
});

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


router.post('/sms-test', auth, role(['owner','manager']), async (req, res) => {
  try {
    const { to, message } = req.body || {};
    if (!to) return res.status(400).json({ success: false, message: 'to is required' });
    const text = message || 'This is a test SMS from QueueMe.';
    const result = await sendPhilSMS({ to, message: text });
    if (result?.skipped) return res.status(200).json({ success: true, skipped: true, message: 'PhilSMS not configured; set PHILSMS_* env vars to send real SMS.' });
    res.json({ success: true, message: 'Test SMS request sent', result });
  } catch (e) {
    console.error('[health][sms-test]', e?.response?.data || e?.message || e);
    res.status(500).json({ success: false, message: 'Failed to send test SMS' });
  }
});

module.exports = router;
