const { query } = require('../database/connection');



//  get Notification Settings
async function getNotificationSettings(req, res) {
  try {
  const [row] = await query('SELECT notify_via_email, notify_via_sms, notify_template_email, notify_template_sms FROM settings WHERE business_id=?', [req.user.business_id]);
  if (!row) return res.json({ success: true, data: { notify_via_email: 0, notify_via_sms: 0, notify_template_email: null, notify_template_sms: null } });
    res.json({ success: true, data: row });
  } catch (e) {
    console.error('[getNotificationSettings]', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}



//  update Notification Settings
async function updateNotificationSettings(req, res) {
  try {
  let { emailEnabled, smsEnabled, emailTemplate, smsTemplate } = req.body || {};

    if (emailEnabled === undefined && req.body?.notify_via_email !== undefined) emailEnabled = req.body.notify_via_email;
    if (smsEnabled === undefined && req.body?.notify_via_sms !== undefined) smsEnabled = req.body.notify_via_sms;
    if (emailTemplate === undefined && req.body?.notify_template_email !== undefined) emailTemplate = req.body.notify_template_email;
    if (smsTemplate === undefined && req.body?.notify_template_sms !== undefined) smsTemplate = req.body.notify_template_sms;
  await query('UPDATE settings SET notify_via_email=COALESCE(?, notify_via_email), notify_via_sms=COALESCE(?, notify_via_sms), notify_template_email=COALESCE(?, notify_template_email), notify_template_sms=COALESCE(?, notify_template_sms) WHERE business_id=?', [emailEnabled, smsEnabled, emailTemplate, smsTemplate, req.user.business_id]);
    res.json({ success: true, message: 'Notification settings saved' });
  } catch (e) {
    console.error('[updateNotificationSettings]', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}



module.exports = { getNotificationSettings, updateNotificationSettings };
