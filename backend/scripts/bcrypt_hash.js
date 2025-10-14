
require('dotenv').config();
const bcrypt = require('bcrypt');

async function main() {
  const pwd = process.argv[2] || process.env.PASSWORD;
  if (!pwd) {
    console.error('Usage: node scripts/bcrypt_hash.js <password>');
    console.error('   or: PASSWORD=yourSecret node scripts/bcrypt_hash.js');
    process.exit(1);
  }
  const hash = await bcrypt.hash(pwd, 10);
  console.log('BCRYPT_HASH=', hash);
}

main().catch((e) => { console.error(e); process.exit(1); });
