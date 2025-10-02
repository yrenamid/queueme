
// QR routes: regenerate customer QR with optional base URL override
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const { query } = require('../database/connection');
const { generateBusinessQRCode } = require('../utils/qrGenerator');


router.post('/regenerate', auth, role(['owner','manager']), async (req, res) => {
  try {
    const bizRows = await query('SELECT slug FROM businesses WHERE id = ?', [req.user.business_id]);
    if (!bizRows.length) return res.status(404).json({ success:false, message:'Business not found'});
    const slug = bizRows[0].slug;

    // Optional base URL override via body.base_url
  const overrideBase = (req.body && req.body.base_url) ? String(req.body.base_url) : '';
  const fullFront = process.env.FRONTEND_URL;
  const fullPublic = process.env.PUBLIC_BASE_URL;
  let baseUrl = '';
  if (overrideBase && /^https?:\/\//.test(overrideBase)) {
    baseUrl = overrideBase;
  } else if (fullFront && /^https?:\/\//.test(fullFront)) {
    baseUrl = fullFront;
  } else if (fullPublic && /^https?:\/\//.test(fullPublic)) {
    baseUrl = fullPublic;
  } else {
    const feHost = process.env.FRONTEND_HOST || req.get('host');
    const fePort = process.env.FRONTEND_PORT || '';
  // Derive scheme and port when not fully specified
    const scheme = (process.env.FRONTEND_SCHEME || (process.env.FRONTEND_HTTPS === 'true' ? 'https' : 'http'));
    if (fePort && !/\:\d+$/.test(feHost)) {
      baseUrl = `${scheme}://${feHost}:${fePort}`;
    } else if (/^https?:\/\//.test(feHost)) {
      baseUrl = feHost;
    } else {
      baseUrl = `${scheme}://${feHost}`;
    }
  }

    const urlBase = `${baseUrl.replace(/\/$/, '')}/customer/${slug}`;
    const version = Date.now();
    const urlOverride = `${urlBase}?v=${version}`;
    const qr = await generateBusinessQRCode({ baseUrl, slug, urlOverride });
    await query('UPDATE businesses SET qr_code_url=?, qr_code_img=? WHERE id=?', [qr.url, qr.image, req.user.business_id]);
    res.json({ success:true, data: qr });
  } catch(e){ console.error(e); res.status(500).json({ success:false, message:'Server error' }); }
});

module.exports = router;
