require('dotenv').config();
const bcrypt = require('bcrypt');
const { query } = require('../database/connection');

async function main() {
  const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD; 
  const ADMIN_PASSWORD_HASH = process.env.SUPER_ADMIN_PASSWORD_HASH;
  const ADMIN_NAME = process.env.SUPER_ADMIN_NAME || 'Super Admin';

  if (!ADMIN_EMAIL || (!ADMIN_PASSWORD && !ADMIN_PASSWORD_HASH)) {
    console.error('[seed] Missing required env. Please set SUPER_ADMIN_EMAIL and either SUPER_ADMIN_PASSWORD or SUPER_ADMIN_PASSWORD_HASH in backend/.env, then re-run.');
    process.exit(1);
  }

  console.log('[seed] Target admin email:', ADMIN_EMAIL);

  const bizRows = await query('SELECT id, name FROM businesses ORDER BY id ASC LIMIT 1');
  if (!bizRows.length) {
    console.error('[seed] No businesses found. Please register a business first, then re-run this script.');
    process.exit(1);
  }
  const business = bizRows[0];
  console.log('[seed] Using business id:', business.id, 'name:', business.name);

  const conflictBiz = await query('SELECT id FROM businesses WHERE email = ? LIMIT 1', [ADMIN_EMAIL]);
  if (conflictBiz.length) {
    console.error('[seed] The admin email conflicts with a business email. Choose a different SUPER_ADMIN_EMAIL.');
    process.exit(1);
  }

  const userRows = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [ADMIN_EMAIL]);
  const hashed = ADMIN_PASSWORD_HASH || await bcrypt.hash(ADMIN_PASSWORD, 10);

  if (userRows.length) {
    const id = userRows[0].id;
    await query('UPDATE users SET is_admin=1, password=?, role=COALESCE(role, "manager") WHERE id=?', [hashed, id]);
    console.log('[seed] Existing user promoted to super admin:', ADMIN_EMAIL);
  } else {
    await query('INSERT INTO users (business_id, name, email, phone, password, role, is_admin) VALUES (?,?,?,?,?,?,1)', [business.id, ADMIN_NAME, ADMIN_EMAIL, null, hashed, 'manager']);
    console.log('[seed] Super admin user created:', ADMIN_EMAIL);
  }

  console.log('\nSeed complete.');
  console.log('  Email   :', ADMIN_EMAIL);
  console.log('  Password: [set from env]');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
