const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');
const { query } = require('../database/connection');
const { getAdminProfile, updateAdminProfile } = require('../controllers/adminController');
const mysql = require('mysql2');

// GET /api/admin/businesses?search=&category=&page=1&pageSize=20
router.get('/businesses', auth, adminOnly, async (req, res) => {
  const { search = '', category = '', page = '1', pageSize = '20' } = req.query;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const offset = (p - 1) * ps;

  const where = [];
  const params = [];
  if (search) {
    where.push('(b.name LIKE ? OR b.email LIKE ? OR b.phone LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category) {
    where.push('b.category = ?');
    params.push(String(category));
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const totalRows = await query(`SELECT COUNT(*) as cnt FROM businesses b ${whereSql}`, params);
    const total = Number(totalRows?.[0]?.cnt || 0);

    const colCheck = async (table, col) => {
      try {
        const r = await query(
          'SELECT COUNT(*) as cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
          [table, col]
        );
        return Number(r?.[0]?.cnt || 0) > 0;
      } catch (e) {
        console.warn('[admin businesses] information_schema unavailable for', table, col, e?.message || e);
        return false;
      }
    };
    const tableCheck = async (table) => {
      try {
        const r = await query(
          'SELECT COUNT(*) as cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
          [table]
        );
        return Number(r?.[0]?.cnt || 0) > 0;
      } catch (e) {
        console.warn('[admin businesses] information_schema TABLES unavailable for', table, e?.message || e);
        return false;
      }
    };
    const hasProofUrl = await colCheck('businesses', 'proof_url');
    const hasAvgPrepTime = await colCheck('businesses', 'avg_prep_time');
    const hasQrCodeUrl = await colCheck('businesses', 'qr_code_url');
    const hasSettingsTable = await tableCheck('settings');
    const hasAllowDelay = hasSettingsTable && await colCheck('settings', 'allow_delay');
    const hasAllowOnline = hasSettingsTable && await colCheck('settings', 'allow_online_payment');
    const hasNotifyCustomer = hasSettingsTable && await colCheck('settings', 'notify_customer');

    const globalRows = await query(`SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN LOWER(category) = 'food' THEN 1 ELSE 0 END) AS food,
        SUM(CASE WHEN LOWER(category) = 'service' THEN 1 ELSE 0 END) AS service
      FROM businesses`);
    const global = {
      total: Number(globalRows?.[0]?.total || 0),
      food: Number(globalRows?.[0]?.food || 0),
      service: Number(globalRows?.[0]?.service || 0)
    };

    const bizFields = ['b.id','b.name','b.email','b.phone','b.category','b.slug','b.created_at','b.max_queue_length'];
    if (hasAvgPrepTime) bizFields.push('b.avg_prep_time');
    if (hasQrCodeUrl) bizFields.push('b.qr_code_url');
    if (hasProofUrl) bizFields.push('b.proof_url');

    const settingsFields = [];
    if (hasSettingsTable) {
      settingsFields.push('s.reserve_slots','s.available_kitchen_staff');
      if (hasNotifyCustomer) settingsFields.push('s.notify_customer');
      if (hasAllowDelay) settingsFields.push('s.allow_delay');
      if (hasAllowOnline) settingsFields.push('s.allow_online_payment');
    }

    const selectParts = [];
    selectParts.push(bizFields.join(', '));
    if (settingsFields.length) selectParts.push(settingsFields.join(', '));
    selectParts.push(`(SELECT u.email FROM users u WHERE u.business_id = b.id AND u.role = 'owner' ORDER BY u.id ASC LIMIT 1) AS owner_email`);

    const joins = [];
    if (hasSettingsTable) joins.push('LEFT JOIN settings s ON s.business_id = b.id');

    const selectSql = `SELECT 
      ${selectParts.join(', ')}
      FROM businesses b
      ${joins.join(' ')}
      ${whereSql}
      ORDER BY b.created_at DESC
      LIMIT ${ps} OFFSET ${offset}`;

    let rows;
    try {
      rows = await query(selectSql, params);
    } catch (e) {
      const code = String(e?.code || '');
      if (code === 'ER_BAD_FIELD_ERROR' || code === 'ER_NO_SUCH_TABLE') {
        const minimalSql = `SELECT b.id, b.name, b.email, b.phone, b.category, b.slug, b.created_at
          FROM businesses b ${whereSql} ORDER BY b.created_at DESC LIMIT ${ps} OFFSET ${offset}`;
        rows = await query(minimalSql, params);
      } else {
        throw e;
      }
    }

    
  const reqBase = `${req.protocol}://${req.get('host') || ''}`;
  const envBase = process.env.PUBLIC_BASE_URL || '';
  const base = (reqBase || envBase).replace(/\/$/, '');
    const norm = (u) => {
      if (!u) return u;
      const s = String(u);
      if (/^https?:\/\//i.test(s)) {
        try {
          const url = new URL(s);
          const p = url.pathname || '';
          if (p.startsWith('/public/uploads') || p.startsWith('/uploads')) {
            return `${base}${p}`;
          }
          return s;
        } catch { return s; }
      }
      const path = s.startsWith('/') ? s : `/${s}`;
      return `${base}${path}`;
    };
  const outRows = Array.isArray(rows) ? rows.map(r => ({ ...r, proof_url: norm(r.proof_url) })) : rows;

    return res.json({ success: true, data: { total, page: p, pageSize: ps, rows: outRows, global } });
  } catch (err) {
    console.error('[admin businesses]', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/profile', auth, adminOnly, getAdminProfile);
router.put('/profile', auth, adminOnly, updateAdminProfile);

// GET /api/admin/db/tables - list tables and columns (super admin diagnostic)
router.get('/db/tables', auth, adminOnly, async (req, res) => {
  try {
    const tables = await query('SHOW TABLES');
    const keyName = tables.length ? Object.keys(tables[0])[0] : null;
    const list = [];
    for (const row of tables) {
      const t = keyName ? row[keyName] : null;
      if (!t) continue;
      let columns = [];
      try {
        columns = await query('SHOW COLUMNS FROM `' + t + '`');
      } catch (e) {
        columns = [{ error: e.message || String(e) }];
      }
      list.push({ table: t, columns });
    }
    return res.json({ success: true, data: list });
  } catch (e) {
    console.error('[admin db tables]', e);
    return res.status(500).json({ success: false, message: 'Failed to list tables', error: e.message || e });
  }
});

module.exports = router;
