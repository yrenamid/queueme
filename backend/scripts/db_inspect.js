require('dotenv').config();
const { query } = require('../database/connection');

(async function run() {
  try {
    const tables = await query('SHOW TABLES');
    const key = tables.length ? Object.keys(tables[0])[0] : null;
    console.log('[inspect] tables found:', tables.map(r => r[key]));
    for (const r of tables) {
      const t = r[key];
      try {
        const cols = await query('SHOW COLUMNS FROM `' + t + '`');
        console.log(`\n[inspect] Table: ${t}`);
        cols.forEach(c => console.log('  -', c.Field, c.Type, c.Null === 'YES' ? 'NULL' : 'NOT NULL', c.Key || '', c.Default == null ? '' : 'DEFAULT=' + c.Default));
      } catch (e) {
        console.error('[inspect] failed columns for', t, e.message);
      }
    }
    process.exit(0);
  } catch (e) {
    console.error('[inspect] failed:', e.code, e.message);
    process.exit(1);
  }
})();
