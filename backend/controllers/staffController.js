const bcrypt = require('bcrypt');
const { query } = require('../database/connection');
const { isPasswordStrong, hasNoInternalSpaces, isNotBlank, normalizePhoneDigits } = require('../utils/validators');



// list Staff
async function listStaff(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 10, 1), 100);
    const offset = (page - 1) * pageSize;
    const [rows, totalRows] = await Promise.all([
      query("SELECT id,name,email,role,created_at FROM users WHERE business_id=? ORDER BY (role='owner') DESC, created_at DESC LIMIT ? OFFSET ?", [req.user.business_id, pageSize, offset]),
      query('SELECT COUNT(*) as cnt FROM users WHERE business_id=?', [req.user.business_id])
    ]);
    res.json({ success:true, data: rows, pagination: { page, pageSize, total: totalRows[0].cnt, totalPages: Math.ceil(totalRows[0].cnt / pageSize) } });
  }
  catch(e){ console.error(e); res.status(500).json({ success:false, message:'Server error' }); }
}



//create Staff
async function createStaff(req, res) {
  const { name, email, password, role = 'cashier', phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success:false, message:'Missing fields' });
  if (!isNotBlank(name) || !hasNoInternalSpaces(email)) return res.status(400).json({ success:false, message:'Invalid name or email' });
  if (!isPasswordStrong(password)) return res.status(400).json({ success:false, message:'Password must be at least 8 characters with a letter and a number' });

  if (req.user.role === 'manager' && role !== 'cashier') {
    return res.status(403).json({ success:false, message:'Not allowed to assign this role' });
  }
  if (req.user.role !== 'owner' && role === 'owner') {
    return res.status(403).json({ success:false, message:'Cannot create owner' });
  }
  try {
    console.log('[createStaff] incoming', { name, email, role, by: req.user.id });
    const existing = await query('SELECT id FROM users WHERE email=?', [email]);
    if (existing.length) {
      console.warn('[createStaff] email conflict', email);
      return res.status(409).json({ success:false, message:'Email already in use' });
    }

    const bizConf = await query('SELECT id FROM businesses WHERE email=?', [email]);
    if (bizConf.length) return res.status(409).json({ success:false, message:'Email already used by a business' });
    let phoneDigits = null;
    if (phone) {
      phoneDigits = normalizePhoneDigits(phone);

      const p1 = await query('SELECT id FROM users WHERE phone=?', [phoneDigits]);
      const p2 = await query('SELECT id FROM businesses WHERE phone=?', [phoneDigits]);
      if (p1.length || p2.length) return res.status(409).json({ success:false, message:'Phone already in use' });
    }
    const hashed = await bcrypt.hash(password, 10);

  const normalizedRole = ['owner','manager','cashier'].includes(role) ? role : 'cashier';
  const result = await query('INSERT INTO users (business_id,name,email,phone,password,role) VALUES (?,?,?,?,?,?)', [req.user.business_id, name, email, phoneDigits, hashed, normalizedRole]);
    res.status(201).json({ success:true, data:{ id: result.insertId, name, email, role } });
  } catch(e){ console.error(e); res.status(500).json({ success:false, message:'Server error' }); }
}



// update Staff
async function updateStaff(req, res) {
  const { id } = req.params;
  const { name, role, password, email } = req.body;

  if (req.user.role === 'manager' && role && role !== 'cashier' && role !== 'manager') {
    return res.status(403).json({ success:false, message:'Not allowed to assign this role' });
  }
  if (req.user.role !== 'owner' && role === 'owner') return res.status(403).json({ success:false, message:'Cannot elevate to owner'});
  try {
    if (email && !hasNoInternalSpaces(email)) return res.status(400).json({ success:false, message:'Email must not contain spaces' });
    if (password && !isPasswordStrong(password)) return res.status(400).json({ success:false, message:'Password must be at least 8 characters with a letter and a number' });
    if (email) {
      const e1 = await query('SELECT id FROM users WHERE email=? AND id<>?', [email, id]);
      const e2 = await query('SELECT id FROM businesses WHERE email=?', [email]);
      if (e1.length || e2.length) return res.status(409).json({ success:false, message:'Email already in use' });
    }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      const normalizedRole = role && ['owner','manager','cashier'].includes(role) ? role : undefined;
      await query('UPDATE users SET name=COALESCE(?,name), email=COALESCE(?,email), role=COALESCE(?,role), password=? WHERE id=? AND business_id=?', [name, email, normalizedRole, hashed, id, req.user.business_id]);
    } else {
      const normalizedRole = role && ['owner','manager','cashier'].includes(role) ? role : undefined;
      await query('UPDATE users SET name=COALESCE(?,name), email=COALESCE(?,email), role=COALESCE(?,role) WHERE id=? AND business_id=?', [name, email, normalizedRole, id, req.user.business_id]);
    }
    res.json({ success:true, message:'Updated'});
  } catch(e){ console.error(e); res.status(500).json({ success:false, message:'Server error' }); }
}



// delete Staff
async function deleteStaff(req, res) {
  const { id } = req.params;
  try {

    const rows = await query('SELECT role FROM users WHERE id=? AND business_id=?', [id, req.user.business_id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    if (rows[0].role === 'owner') return res.status(403).json({ success:false, message:'Cannot delete owner'});
    await query('DELETE FROM users WHERE id=? AND business_id=?', [id, req.user.business_id]);
    res.json({ success:true, message:'Deleted'});
  }
  catch(e){ console.error(e); res.status(500).json({ success:false, message:'Server error'}); }
}

module.exports = { listStaff, createStaff, updateStaff, deleteStaff };
