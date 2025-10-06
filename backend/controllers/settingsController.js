const { query } = require('../database/connection');
const { broadcast } = require('../utils/realtime');



// Handles ensure Settings Column
async function ensureSettingsColumn(column, typeSql) {
  try {
    const rows = await query('SHOW COLUMNS FROM settings LIKE ?', [column]);
    if (!rows || rows.length === 0) {
      try { await query(`ALTER TABLE settings ADD COLUMN ${column} ${typeSql}`); } catch (_) {  }
    }
  } catch (_) {  }
}



//  get Settings
async function getSettings(req, res) {
  try {
    await ensureSettingsColumn('allow_online_payment', 'TINYINT(1) NULL DEFAULT 0');
    await ensureSettingsColumn('allow_delay', 'TINYINT(1) NULL DEFAULT 1');
    let rows = await query('SELECT * FROM settings WHERE business_id=?', [req.user.business_id]);
    if (!rows.length) {
      await query('INSERT INTO settings (business_id) VALUES (?)', [req.user.business_id]);
      rows = await query('SELECT * FROM settings WHERE business_id=?', [req.user.business_id]);
    }

  const biz = await query('SELECT max_queue_length FROM businesses WHERE id=?', [req.user.business_id]);
  const data = { ...rows[0], max_queue_length: biz[0]?.max_queue_length };
    if (data.allow_delay === undefined || data.allow_delay === null) data.allow_delay = 1;
    res.json({ success:true, data });
  } catch(e){ console.error('[getSettings]', e); res.status(500).json({ success:false, message:'Server error' }); }
}



// update Settings
async function updateSettings(req, res) {

  let { allow_online_payment, notify_via_sms, notify_via_email, reserve_slots, notify_customer, max_queue_length, available_kitchen_staff, opening_time, closing_time, allow_delay } = req.body || {};
  if (reserve_slots === undefined && req.body.reserveSlots !== undefined) reserve_slots = req.body.reserveSlots;
  if (notify_customer === undefined && req.body.notifyCustomer !== undefined) notify_customer = req.body.notifyCustomer;
  if (max_queue_length === undefined && req.body.maxQueueLength !== undefined) max_queue_length = req.body.maxQueueLength;
  if (available_kitchen_staff === undefined && req.body.availableKitchenStaff !== undefined) available_kitchen_staff = req.body.availableKitchenStaff;
  if (opening_time === undefined && req.body.openingTime !== undefined) opening_time = req.body.openingTime;
  if (closing_time === undefined && req.body.closingTime !== undefined) closing_time = req.body.closingTime;
  if (allow_delay === undefined && req.body.allowDelay !== undefined) allow_delay = req.body.allowDelay;
  function to01(v){ if (v === undefined || v === null) return null; const s = String(v).toLowerCase(); if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return 1; if (s === 'false' || s === '0' || s === 'no' || s === 'off') return 0; return Number(v); }
  allow_online_payment = to01(allow_online_payment);
  notify_via_sms = to01(notify_via_sms);
  notify_via_email = to01(notify_via_email);
  notify_customer = to01(notify_customer);
  allow_delay = to01(allow_delay);
  reserve_slots = (reserve_slots == null ? null : Number(reserve_slots));
  available_kitchen_staff = (available_kitchen_staff == null ? null : Number(available_kitchen_staff));
  const vals = [allow_online_payment, notify_via_sms, notify_via_email, reserve_slots, available_kitchen_staff, notify_customer, opening_time || null, closing_time || null, allow_delay];
  try {

    console.log('[updateSettings] body', req.body);

    await ensureSettingsColumn('allow_delay', 'TINYINT(1) NULL DEFAULT 1');
    const ex = await query('SELECT id FROM settings WHERE business_id=?', [req.user.business_id]);
    if (!ex.length) {
      await query('INSERT INTO settings (business_id) VALUES (?)', [req.user.business_id]);
    }
  await query('UPDATE settings SET allow_online_payment=COALESCE(?,allow_online_payment), notify_via_sms=COALESCE(?,notify_via_sms), notify_via_email=COALESCE(?,notify_via_email), reserve_slots=COALESCE(?,reserve_slots), available_kitchen_staff=COALESCE(?,available_kitchen_staff), notify_customer=COALESCE(?,notify_customer), opening_time=COALESCE(?,opening_time), closing_time=COALESCE(?,closing_time), allow_delay=COALESCE(?,allow_delay) WHERE business_id=?', [...vals, req.user.business_id]);

    try {
      if (available_kitchen_staff !== undefined && available_kitchen_staff !== null) {
        const [biz] = await query('SELECT category FROM businesses WHERE id=?', [req.user.business_id]);
        const isService = (biz?.category && String(biz.category).toLowerCase() === 'service');
        if (isService) {
          const { recomputeEWTForActive } = require('./queueController');
          await recomputeEWTForActive(req.user.business_id);
        }
      }
    } catch (reErr) { console.warn('[settings][recomputeEWTForActive]', reErr); }
    if (max_queue_length !== undefined && max_queue_length !== null) {
      await query('UPDATE businesses SET max_queue_length=? WHERE id=?', [max_queue_length, req.user.business_id]);
    }
    try { broadcast('settings:updated', { business_id: req.user.business_id }); } catch {}
    res.json({ success:true, message:'Updated' });
  } catch(e){ console.error('[updateSettings] Error executing update', e); res.status(500).json({ success:false, message:'Server error' }); }
}

module.exports = { getSettings, updateSettings };
