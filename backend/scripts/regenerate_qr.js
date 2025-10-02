require('dotenv').config();
const path = require('path');
const { query, getPool } = require('../database/connection');
const { generateBusinessQRCode } = require('../utils/qrGenerator');

async function main() {
  try {
    const args = process.argv.slice(2);
    // Support --base <url> or BASE_URL env
    let baseIdx = args.indexOf('--base');
    let baseUrl = process.env.BASE_URL || '';
    if (baseIdx !== -1 && args[baseIdx + 1]) {
      baseUrl = String(args[baseIdx + 1]);
    }
    if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
      console.error('Usage: node scripts/regenerate_qr.js --base https://your-tunnel.ngrok-free.dev');
      console.error('Or set BASE_URL env var.');
      process.exit(1);
    }
    baseUrl = baseUrl.replace(/\/$/, '');

    console.log('[qr] Using base URL:', baseUrl);
    await getPool();

    const businesses = await query('SELECT id, slug, name FROM businesses', []);
    if (!businesses.length) {
      console.log('[qr] No businesses found.');
      process.exit(0);
    }

    let updated = 0;
    const startedAt = Date.now();
    for (const biz of businesses) {
      const slug = String(biz.slug);
      const urlOverride = `${baseUrl}/customer/${encodeURIComponent(slug)}?v=${Date.now()}`;
      try {
        const qr = await generateBusinessQRCode({ baseUrl, slug, urlOverride });
        await query('UPDATE businesses SET qr_code_url = ?, qr_code_img = ? WHERE id = ?', [qr.url, qr.image, biz.id]);
        updated++;
        console.log(`[qr] Updated ${biz.name || biz.id} (${slug}) -> ${qr.url}`);
      } catch (e) {
        console.error(`[qr] Failed for ${biz.name || biz.id} (${slug})`, e.message || e);
      }
    }

    console.log(`[qr] Done. Updated ${updated}/${businesses.length} businesses in ${Date.now() - startedAt}ms.`);
    process.exit(0);
  } catch (e) {
    console.error('[qr] Fatal error', e);
    process.exit(1);
  }
}

main();
