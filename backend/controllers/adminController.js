const bcrypt = require('bcrypt');
const { query } = require('../database/connection');

// GET /api/admin/profile
async function getAdminProfile(req, res) {
  try {
    const rows = await query('SELECT id, name, email, is_admin FROM users WHERE id = ? AND is_admin = 1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Admin profile not found' });
    const u = rows[0];
    return res.json({ success: true, data: { id: u.id, name: u.name, email: u.email } });
  } catch (e) {
    console.error('[admin:getProfile]', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// PUT /api/admin/profile
async function updateAdminProfile(req, res) {
  try {
    const { name, password, current_password } = req.body || {};
    if (!name && !password) return res.status(400).json({ success: false, message: 'Nothing to update' });
    if (name) {
      await query('UPDATE users SET name=? WHERE id=? AND is_admin=1', [name, req.user.id]);
    }
    if (password) {
      if (String(password).length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      if (!current_password) return res.status(400).json({ success: false, message: 'Current password is required' });
      const rows = await query('SELECT password FROM users WHERE id=? AND is_admin=1', [req.user.id]);
      if (!rows.length) return res.status(404).json({ success: false, message: 'Admin profile not found' });
      const ok = await bcrypt.compare(String(current_password), String(rows[0].password || ''));
      if (!ok) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      const hashed = await bcrypt.hash(String(password), 10);
      await query('UPDATE users SET password=? WHERE id=? AND is_admin=1', [hashed, req.user.id]);
    }
    return res.json({ success: true, message: 'Updated' });
  } catch (e) {
    console.error('[admin:updateProfile]', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getAdminProfile, updateAdminProfile };
