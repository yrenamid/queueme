const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');
const { jwt: jwtCfg } = require('../config/configdb');
const { generateSlug, generateBusinessQRCode, ensureUniqueSlug } = require('../utils/qrGenerator');

const { normalizePhoneDigits, isPasswordStrong, hasNoInternalSpaces, isNotBlank, isValidPHPhone } = require('../utils/validators');



// register Business
async function registerBusiness(req, res) {
  const { name, email, phone, password, category, staff = [], max_queue_length, reserve_slots, notify_customer } = req.body;
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
  if (!Array.isArray(staff) || staff.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one staff (owner) user required' });
  }
  try {

    const existingBiz = await query('SELECT id FROM businesses WHERE email = ? OR phone = ? OR name = ?', [email, phoneDigits, name]);
    if (existingBiz.length) {
      return res.status(409).json({ success: false, message: 'Business name, email, or phone already exists' });
    }

    const userConflicts = await query('SELECT id FROM users WHERE email = ? OR phone = ?', [email, phoneDigits]);
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


  await query('INSERT INTO settings (business_id, reserve_slots, notify_customer) VALUES (?,?,?)', [business_id, reserve_slots || 0, notify_customer !== undefined ? !!notify_customer : true]);


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
    let isBusiness = false;
    if (bizRows.length) {
      const biz = bizRows[0];
      const match = await bcrypt.compare(password, biz.password);
      if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      isBusiness = true;
      userData = { id: biz.id, business_id: biz.id, role: 'owner', name: biz.name, businessName: biz.name, category: biz.category };
    } else {
      const staffRows = await query('SELECT u.*, b.name as businessName, b.category FROM users u JOIN businesses b ON b.id = u.business_id WHERE u.email = ?', [email]);
      if (!staffRows.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      const staff = staffRows[0];
      const match = await bcrypt.compare(password, staff.password);
      if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      userData = { id: staff.id, business_id: staff.business_id, role: staff.role, name: staff.name, businessName: staff.businessName, category: staff.category };
    }

    const token = jwt.sign({ id: userData.id, business_id: userData.business_id, role: userData.role }, jwtCfg.secret, { expiresIn: jwtCfg.expiresIn });
    const biz = await query('SELECT slug, qr_code_url, qr_code_img FROM businesses WHERE id = ?', [userData.business_id]);
    if (biz && biz[0] && biz[0].slug) {
      userData.slug = biz[0].slug;
    }
    return res.json({ success: true, token, user: userData, qr: { qr_code_url: biz[0]?.qr_code_url, qr_code_img: biz[0]?.qr_code_img } });
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
