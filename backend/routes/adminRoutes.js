const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');
const { query } = require('../database/connection');
const { getAdminProfile, updateAdminProfile } = require('../controllers/adminController');

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
    const rows = await query(
      `SELECT b.id, b.name, b.email, b.phone, b.category, b.slug, b.created_at, b.max_queue_length, b.avg_prep_time, b.qr_code_url, b.proof_url,
              s.reserve_slots, s.notify_customer, s.available_kitchen_staff, s.allow_delay, s.allow_online_payment,
        (SELECT u.email FROM users u WHERE u.business_id = b.id AND u.role = 'owner' ORDER BY u.id ASC LIMIT 1) AS owner_email
       FROM businesses b
       LEFT JOIN settings s ON s.business_id = b.id
       ${whereSql}
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
       [...params, ps, offset]
    );
    return res.json({ success: true, data: { total, page: p, pageSize: ps, rows, global } });
  } catch (err) {
    console.error('[admin businesses]', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/profile', auth, adminOnly, getAdminProfile);
router.put('/profile', auth, adminOnly, updateAdminProfile);

module.exports = router;
