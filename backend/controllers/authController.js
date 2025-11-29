const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');
const { jwt: jwtCfg } = require('../config/configdb');
const { generateSlug, generateBusinessQRCode, ensureUniqueSlug } = require('../utils/qrGenerator');

const { normalizePhoneDigits, isPasswordStrong, hasNoInternalSpaces, isNotBlank, isValidPHPhone } = require('../utils/validators');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');
const fs = require('fs');
const path = require('path');
const { getSupabase } = require('../config/supabaseClient');



// register Business
async function registerBusiness(req, res) {
  let { name, email, phone, password, category, staff = [], max_queue_length, reserve_slots, notify_customer, available_kitchen_staff, allow_delay, allow_online_payment } = req.body;
  console.log('[registerBusiness] incoming', { name, email, phone, category, staffCount: Array.isArray(staff)? staff.length : 'n/a' });
  if (!name || !email || !phone || !password || !category) {
    return res.status(400).json({ success: false, message: 'Missing required business fields' });
  }

  if (!isNotBlank(name) || !isNotBlank(email) || !isNotBlank(phone) || !isNotBlank(password)) {
    return res.status(400).json({ success: false, message: 'Required fields cannot be blank' });
  }
  if (!hasNoInternalSpaces(email) || !hasNoInternalSpaces(phone)) {
    return res.status(400).json({ success: false, message: 'Email and phone must not contain spaces' });
  }
  if (!isPasswordStrong(password)) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters with at least one letter and one number' });
  }
  const phoneDigits = normalizePhoneDigits(phone);
  if (!isValidPHPhone(phoneDigits)) {
    return res.status(400).json({ success: false, message: 'Phone must be a valid 11-digit PH number starting with 09' });
  }
  if (typeof staff === 'string') {
    try { staff = JSON.parse(staff); } catch {}
  }
  if (!Array.isArray(staff) || staff.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one staff (owner) user required' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Proof of business registration is required (JPG/PNG/PDF up to 5MB)' });
  }
  try {
    const existingBiz = await query('SELECT id FROM businesses WHERE email = ? OR name = ?', [email, name]);
    if (existingBiz.length) {
      return res.status(409).json({ success: false, message: 'Business name, email, or phone already exists' });
    }

    const userConflicts = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (userConflicts.length) {
      return res.status(409).json({ success: false, message: 'Email or phone already used by a user' });
    }

    if (staff.some(s => !s.email || !s.name || !s.password)) {
      return res.status(400).json({ success: false, message: 'Each staff must include name, email, password' });
    }

    for (const s of staff) {
      if (!hasNoInternalSpaces(s.email) || !isNotBlank(s.name)) {
        return res.status(400).json({ success: false, message: 'Invalid staff name or email (no spaces in email; name required)' });
      }
      if (!isPasswordStrong(s.password)) {
        return res.status(400).json({ success: false, message: 'Staff password must be at least 8 characters with a letter and a number' });
      }
    }
    const staffEmails = staff.map(s => s.email);
    const dupEmailSet = new Set(staffEmails);
    if (dupEmailSet.size !== staffEmails.length) {
      return res.status(400).json({ success: false, message: 'Duplicate staff emails in request' });
    }
    const existingStaffEmails = await query(`SELECT email FROM users WHERE email IN (${staffEmails.map(()=>'?').join(',')})`, staffEmails);
    if (existingStaffEmails.length) {
      return res.status(409).json({ success: false, message: 'Some staff emails already exist', conflictEmails: existingStaffEmails.map(r=>r.email) });
    }

    const existingBizEmails = await query(`SELECT email FROM businesses WHERE email IN (${staffEmails.map(()=>'?').join(',')})`, staffEmails);
    if (existingBizEmails.length) {
      return res.status(409).json({ success: false, message: 'Some staff emails conflict with existing businesses' });
    }


    const baseSlug = generateSlug(name);
    const slugExistsRows = await query('SELECT slug FROM businesses WHERE slug = ?', [baseSlug]);
    let slug = baseSlug;
    if (slugExistsRows.length) {
      slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
  const insertBiz = await query('INSERT INTO businesses (name, email, phone, password, category, slug, max_queue_length) VALUES (?,?,?,?,?,?,?)', [name, email, phoneDigits, hashedPassword, category, slug, max_queue_length || 50]);
    const business_id = insertBiz.insertId;

  try {
    const f = req.file;
    if (f && f.path && (f.size != null)) {
      const supabase = await getSupabase();
      const bucket = 'business-proofs';
      const fileBuffer = fs.readFileSync(f.path);
      const safeName = `${Date.now()}_${String(f.originalname || 'proof').replace(/[^a-zA-Z0-9._-]+/g, '_')}`;
      const objectPath = `proofs/${safeName}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(objectPath, fileBuffer, {
        contentType: f.mimetype || 'application/octet-stream',
        upsert: true
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(objectPath);
      const publicUrl = pub?.publicUrl || null;
      if (publicUrl) {
        await query('UPDATE businesses SET proof_url = ? WHERE id = ?', [publicUrl, business_id]);
      }
      try { fs.unlinkSync(f.path); } catch {}
    }
  } catch (e) { console.warn('[registerBusiness] proof upload skipped:', e?.message || e); }


  try {
    const { ensureSettingsColumns } = require('../database/ensureSchema');
    await ensureSettingsColumns();
  } catch (e) { /* non-fatal */ }
  await query(
    'INSERT INTO settings (business_id, reserve_slots, notify_customer, available_kitchen_staff, allow_delay, allow_online_payment) VALUES (?,?,?,?,?,?)',
    [
      business_id,
      reserve_slots || 0,
      (notify_customer !== undefined ? !!notify_customer : true),
      (available_kitchen_staff != null ? Number(available_kitchen_staff) : 1),
      (allow_delay == null ? 1 : (String(allow_delay).toLowerCase() === 'false' || Number(allow_delay) === 0 ? 0 : 1)),
      (allow_online_payment == null ? 0 : (String(allow_online_payment).toLowerCase() === 'true' || Number(allow_online_payment) === 1 ? 1 : 0))
    ]
  );


    for (let i = 0; i < staff.length; i++) {
      const member = staff[i];
      const role = member.role || (i === 0 ? 'owner' : 'staff');
      const hashed = await bcrypt.hash(member.password, 10);
  await query('INSERT INTO users (business_id, name, email, phone, password, role) VALUES (?,?,?,?,?,?)', [business_id, member.name, member.email, (member.phone ? normalizePhoneDigits(member.phone) : null), hashed, role]);
    }



  const feHost = process.env.FRONTEND_HOST || process.env.PUBLIC_BASE_URL || req.get('host');
  const fePort = process.env.FRONTEND_PORT || '';
  const baseUrl = fePort && !/\:\d+$/.test(feHost) ? `http://${feHost}:${fePort}` : (/^https?:\/\//.test(feHost) ? feHost : `http://${feHost}`);
    const qr = await generateBusinessQRCode({ baseUrl, slug });
    await query('UPDATE businesses SET qr_code_url = ?, qr_code_img = ? WHERE id = ?', [qr.url, qr.image, business_id]);

    return res.status(201).json({ success: true, data: { id: business_id, slug, qr_code_url: qr.url, qr_code_img: qr.image } });
  } catch (err) {
    console.error('[registerBusiness]', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}



//login
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Missing email or password' });
  try {
    const bizRows = await query('SELECT * FROM businesses WHERE email = ?', [email]);
    let userData = null;
    if (bizRows.length) {
      const biz = bizRows[0];
      const match = await bcrypt.compare(password, biz.password);
      if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      userData = { id: biz.id, business_id: biz.id, role: 'owner', name: biz.name, businessName: biz.name, category: biz.category, is_admin: 0, slug: biz.slug };
      const token = jwt.sign({ id: userData.id, business_id: userData.business_id, role: userData.role, is_admin: userData.is_admin }, jwtCfg.secret, { expiresIn: jwtCfg.expiresIn });
      return res.json({ success: true, token, user: userData, qr: { qr_code_url: biz.qr_code_url, qr_code_img: biz.qr_code_img } });
    } else {
      const urows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
      if (!urows.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      const user = urows[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });

      if (user.is_admin) {
        // Independent super admin
        userData = { id: user.id, business_id: null, role: user.role || 'manager', name: user.name, is_admin: 1 };
      } else {
        const b = await query('SELECT id, name, category, slug, qr_code_url, qr_code_img FROM businesses WHERE id = ? LIMIT 1', [user.business_id]);
        if (!b.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });
        const biz = b[0];
        userData = { id: user.id, business_id: user.business_id, role: user.role, name: user.name, businessName: biz.name, category: biz.category, is_admin: 0, slug: biz.slug };
        const token = jwt.sign({ id: userData.id, business_id: userData.business_id, role: userData.role, is_admin: userData.is_admin }, jwtCfg.secret, { expiresIn: jwtCfg.expiresIn });
        return res.json({ success: true, token, user: userData, qr: { qr_code_url: biz.qr_code_url, qr_code_img: biz.qr_code_img } });
      }
    }

    // Independent super admin reaches here (business/staff returned earlier)
    const token = jwt.sign({ id: userData.id, business_id: userData.business_id, role: userData.role, is_admin: userData.is_admin || 0 }, jwtCfg.secret, { expiresIn: jwtCfg.expiresIn });
    return res.json({ success: true, token, user: userData, qr: null });
  } catch (err) {
    console.error('[login]', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}



// logout
async function logout(req, res) {
  return res.json({ success: true, message: 'Logged out' });
}

module.exports = { registerBusiness, login, logout };

// Unified Forgot/Reset Password for users and businesses
async function forgotPassword(req, res) {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
  try {
    const front = (process.env.FRONTEND_URL || process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    //users
    const urows = await query('SELECT id, email, name FROM users WHERE email = ? LIMIT 1', [email]);
    if (urows && urows.length) {
      const user = urows[0];
      try { await query('UPDATE users SET reset_token=?, reset_expires=? WHERE id=?', [token, expires, user.id]); } catch {}
      const resetUrl = `${front || ''}/reset-password?token=${encodeURIComponent(token)}`;
      try {
        await sendEmail({
          to: user.email,
          subject: 'QueueMe Password Reset',
          html: `<p>Hello ${user.name || ''},</p><p>Use the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
        });
      } catch (e) {
        console.warn('[forgotPassword][users] email send failed, token stored:', e?.message || e);
      }
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent' });
    }

    //businesses
    const brows = await query('SELECT id, email, name FROM businesses WHERE email = ? LIMIT 1', [email]);
    if (brows && brows.length) {
      const biz = brows[0];
      try { await query('UPDATE businesses SET reset_token=?, reset_expires=? WHERE id=?', [token, expires, biz.id]); } catch {}
      const resetUrl = `${front || ''}/reset-password?token=${encodeURIComponent(token)}`;
      try {
        await sendEmail({
          to: biz.email,
          subject: 'QueueMe Password Reset',
          html: `<p>Hello ${biz.name || ''},</p><p>Use the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
        });
      } catch (e) {
        console.warn('[forgotPassword][businesses] email send failed, token stored:', e?.message || e);
      }
    }
    // Always return success to avoid enumeration
    return res.json({ success: true, message: 'If that email exists, a reset link has been sent' });
  } catch (e) {
    console.error('[forgotPassword][unified]', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function resetPassword(req, res) {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Missing token or password' });
  if (!isPasswordStrong(newPassword)) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters with at least one letter and one number' });
  try {
    // users
    let rows = await query('SELECT id FROM users WHERE reset_token = ? AND reset_expires IS NOT NULL AND reset_expires > NOW() LIMIT 1', [token]);
    if (rows && rows.length) {
      const id = rows[0].id;
      const hashed = await bcrypt.hash(newPassword, 10);
      await query('UPDATE users SET password=?, reset_token=NULL, reset_expires=NULL WHERE id=?', [hashed, id]);
      return res.json({ success: true, message: 'Password has been reset' });
    }
    // businesses
    rows = await query('SELECT id FROM businesses WHERE reset_token = ? AND reset_expires IS NOT NULL AND reset_expires > NOW() LIMIT 1', [token]);
    if (rows && rows.length) {
      const id = rows[0].id;
      const hashed = await bcrypt.hash(newPassword, 10);
      await query('UPDATE businesses SET password=?, reset_token=NULL, reset_expires=NULL WHERE id=?', [hashed, id]);
      return res.json({ success: true, message: 'Password has been reset' });
    }
    return res.status(400).json({ success: false, message: 'Invalid or expired token' });
  } catch (e) {
    console.error('[resetPassword][unified]', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports.forgotPassword = forgotPassword;
module.exports.resetPassword = resetPassword;

// Change password for authenticated users
async function changePassword(req, res) {
  const { current_password, new_password } = req.body || {};
  if (!current_password || !new_password) return res.status(400).json({ success: false, message: 'Current and new password are required' });
  if (!isPasswordStrong(new_password)) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters with at least one letter and one number' });
  try {
    // If super admin, allow change by user id only
    let userRows;
    if (req.user && req.user.is_admin) {
      userRows = await query('SELECT id, password FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    } else {
      userRows = await query('SELECT id, password FROM users WHERE id = ? AND business_id = ? LIMIT 1', [req.user.id, req.user.business_id]);
    }
    if (userRows.length) {
      const ok = await bcrypt.compare(String(current_password), String(userRows[0].password || ''));
      if (!ok) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      const hashed = await bcrypt.hash(String(new_password), 10);
      await query('UPDATE users SET password=? WHERE id=?', [hashed, req.user.id]);
      return res.json({ success: true, message: 'Password updated' });
    }
    const bizRows = await query('SELECT id, password FROM businesses WHERE id = ? LIMIT 1', [req.user.business_id]);
    if (!bizRows.length) return res.status(404).json({ success: false, message: 'Account not found' });
    const ok = await bcrypt.compare(String(current_password), String(bizRows[0].password || ''));
    if (!ok) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(String(new_password), 10);
    await query('UPDATE businesses SET password=? WHERE id=?', [hashed, req.user.business_id]);
    return res.json({ success: true, message: 'Password updated' });
  } catch (e) {
    console.error('[changePassword]', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports.changePassword = changePassword;
