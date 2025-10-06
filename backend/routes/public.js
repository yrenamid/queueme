// Public routes: customer redirects, business metadata, catalog, join/status, payments, and cancellations
const express = require('express');
const router = express.Router();
const { query } = require('../database/connection');
const axios = require('axios');
// Redirects backend QR path to the frontend customer landing
router.get('/customer/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const rows = await query('SELECT id as business_id, category FROM businesses WHERE slug = ?', [slug]);
    if (!rows.length) return res.status(404).send('<h3>Business not found</h3>');
    const base = (process.env.FRONTEND_URL || process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
    if (base) {
      return res.redirect(302, `${base}/customer/${encodeURIComponent(slug)}`);
    }
    return res.status(200).send(`<!doctype html><meta http-equiv="refresh" content="0;url=/customer/${encodeURIComponent(slug)}"><p>Redirecting…</p>`);
  } catch (e) {
    return res.status(500).send('Server error');
  }
});


router.get('/businesses/:slug/qrcode', async (req, res) => {
  try {
    const { slug } = req.params;
    const rows = await query('SELECT qr_code_url, qr_code_img FROM businesses WHERE slug = ?', [slug]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, data:{ url: rows[0].qr_code_url, image: rows[0].qr_code_img } });
  } catch(e){ res.status(500).json({ success:false, message:'Server error' }); }
});



router.get('/businesses/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const rows = await query('SELECT id as business_id, category, name FROM businesses WHERE slug = ?', [slug]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, data: rows[0] });
  } catch(e){ res.status(500).json({ success:false, message:'Server error' }); }
});



router.get('/businesses/id/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) return res.status(400).json({ success:false, message:'Invalid business id' });
    const rows = await query('SELECT id as business_id, category, name, slug FROM businesses WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, data: rows[0] });
  } catch(e){ res.status(500).json({ success:false, message:'Server error' }); }
});


// Stubbed push-enabled status for legacy clients (always disabled)
router.get('/push/enabled', async (req, res) => {
  return res.json({ success: true, data: { enabled: false } });
});


//queue summary metrics 
router.get('/queue-summary', async (req, res) => {
  try {
    const businessId = Number(req.query.business_id);
    if (!businessId || Number.isNaN(businessId)) return res.status(400).json({ success:false, message:'business_id is required' });

    let category = null;
    try { const rows = await query('SELECT category FROM businesses WHERE id=?', [businessId]); category = rows[0]?.category ? String(rows[0].category).toLowerCase() : null; } catch(_) {}
    let includeUnpaid = false;
    try {
      const [set] = await query('SELECT allow_online_payment FROM settings WHERE business_id=?', [businessId]);
      includeUnpaid = !Number(set?.allow_online_payment || 0);
    } catch(_) {}
    const inQueueRows = (category === 'service')
      ? await query('SELECT COUNT(*) AS inQueue FROM queues WHERE business_id=? AND status IN ("waiting","delayed")', [businessId])
      : (includeUnpaid
          ? await query('SELECT COUNT(*) AS inQueue FROM queues WHERE business_id=? AND status IN ("waiting","delayed")', [businessId])
          : await query('SELECT COUNT(*) AS inQueue FROM queues WHERE business_id=? AND status IN ("waiting","delayed") AND payment_status="paid"', [businessId])
        );
    const inQueue = Number(inQueueRows[0]?.inQueue) || 0;

    let maxQueueLength = 0;
    try {
      const maxRows = await query('SELECT max_queue_length FROM businesses WHERE id=?', [businessId]);
      maxQueueLength = Number(maxRows[0]?.max_queue_length) || 0;
    } catch(_) { maxQueueLength = 0; }
    const waits = await query(
      'SELECT estimated_wait_time FROM queues WHERE business_id=? AND status IN ("waiting","delayed")',
      [businessId]
    );
    const avgWait = waits.length ? Math.round(waits.reduce((a, r) => a + (Number(r.estimated_wait_time) || 0), 0) / waits.length) : 0;
    return res.json({ success:true, data: { inQueue, avgWait, maxQueueLength } });
  } catch(e){
    console.error('[public][queue-summary]', e);
    res.status(500).json({ success:false, message:'Server error' });
  }
});


// Lists available menu items
router.get('/menu', async (req, res) => {
  try {
    const businessId = Number(req.query.business_id);
    if (!businessId || Number.isNaN(businessId)) return res.status(400).json({ success:false, message:'business_id is required' });
    const rows = await query('SELECT id,name,description,price,category,duration_minutes,is_available FROM menu_items WHERE business_id=? AND is_available=1 ORDER BY id DESC', [businessId]);
    const data = rows.map(r => ({ id: r.id, name: r.name, description: r.description, price: Number(r.price), category: r.category || null, duration: r.duration_minutes, is_available: !!r.is_available }));
    res.json({ success:true, data });
  } catch(e){ console.error('[public][menu]', e); res.status(500).json({ success:false, message:'Server error' }); }
});


// Lists available services
router.get('/services', async (req, res) => {
  try {
    const businessId = Number(req.query.business_id);
    if (!businessId || Number.isNaN(businessId)) return res.status(400).json({ success:false, message:'business_id is required' });
    const rows = await query('SELECT id,name,description,price,duration_minutes,is_available FROM services WHERE business_id=? AND is_available=1 ORDER BY id DESC', [businessId]);
    const data = rows.map(r => ({ id: r.id, name: r.name, description: r.description, price: Number(r.price), duration: r.duration_minutes, is_available: !!r.is_available }));
    res.json({ success:true, data });
  } catch(e){ console.error('[public][services]', e); res.status(500).json({ success:false, message:'Server error' }); }
});


// Public join request to enter a business queue
router.post('/join', async (req, res) => {
  try {
    const { business_id, customer_name, customer_email, customer_phone, party_size, order_items = [], order_total = 0, notes } = req.body || {};
    const { normalizePhoneDigits, isNotBlank, hasNoInternalSpaces, isValidPHPhone } = require('../utils/validators');
    const businessId = Number(business_id);
    if (!businessId || Number.isNaN(businessId)) return res.status(400).json({ success:false, message:'business_id required' });
    if (!isNotBlank(customer_name)) return res.status(400).json({ success:false, message:'Name is required' });

    const email = (customer_email || '').trim();
    const phoneDigits = normalizePhoneDigits(customer_phone || '');
    if (!phoneDigits) return res.status(400).json({ success:false, message:'Phone is required' });
    if (!isValidPHPhone(phoneDigits)) return res.status(400).json({ success:false, message:'Enter a valid PH phone number (11 digits starting with 09)' });
    if (email && !hasNoInternalSpaces(email)) return res.status(400).json({ success:false, message:'Email must not contain spaces' });

    let bizMeta = { max_queue_length: 0, category: null };
    try {
      const [biz] = await query('SELECT max_queue_length, category FROM businesses WHERE id=?', [businessId]);
      bizMeta.max_queue_length = Number(biz?.max_queue_length) || 0;
      bizMeta.category = (biz?.category ? String(biz.category).toLowerCase() : null);
    } catch(_) { bizMeta = { max_queue_length: 0, category: null }; }
    const isServiceBased = bizMeta.category === 'service';


    try {
      const cap = Number(bizMeta.max_queue_length) || 0;
      if (cap > 0) {
        const [cntRows] = isServiceBased
          ? await query('SELECT COUNT(*) AS cnt FROM queues WHERE business_id=? AND status IN ("waiting","delayed")', [businessId])
          : await query('SELECT COUNT(*) AS cnt FROM queues WHERE business_id=? AND status IN ("waiting","delayed") AND payment_status="paid"', [businessId]);
        const cnt = Number((Array.isArray(cntRows) ? cntRows[0]?.cnt : cntRows?.cnt) || 0);
        if (cnt >= cap) {
          return res.status(400).json({ success:false, message:'Queue is full. Please try again later.' });
        }
      }
    } catch(e) {

    }


    try {
      const conflict1 = await query('SELECT id FROM businesses WHERE email=? OR phone=?', [email || '', phoneDigits]);
      const conflict2 = await query('SELECT id FROM users WHERE email=? OR phone=?', [email || '', phoneDigits]);
      if ((conflict1 && conflict1.length) || (conflict2 && conflict2.length)) {
        return res.status(409).json({ success:false, message:'Phone or email already registered' });
      }
      const conflictQ = await query('SELECT id FROM queues WHERE business_id=? AND status IN ("pending","waiting","called","delayed","pending_payment") AND (customer_phone = ? OR customer_email = ?)', [businessId, phoneDigits, email || null]);
      if (conflictQ.length) return res.status(409).json({ success:false, message:'This contact is already in the current queue' });
    } catch(_) {}


    const row = await query('SELECT MAX(queue_number) as maxNum FROM queues WHERE business_id = ?', [businessId]);
    const nextNumber = (row[0]?.maxNum || 0) + 1;
    const itemsJson = JSON.stringify(order_items || []);

    const initialStatus = isServiceBased ? 'waiting' : 'pending';
    const result = await query(
      'INSERT INTO queues (business_id, customer_name, customer_email, customer_phone, party_size, queue_number, order_items, order_total, is_priority, notes, status, payment_status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())',
      [businessId, customer_name, email || null, phoneDigits || null, (party_size!=null ? Number(party_size) : null), nextNumber, itemsJson, Number(order_total)||0, 0, notes || null, initialStatus, 'pending']
    );
    const insertedId = result.insertId;


    try {
      let staff = 1; let avgFallback = 5; let menuMap = new Map(); let svcMap = new Map();
      try { const [set] = await query('SELECT available_kitchen_staff FROM settings WHERE business_id=?', [businessId]); staff = (set && set.available_kitchen_staff != null) ? Number(set.available_kitchen_staff) : 1; if (!Number.isFinite(staff) || staff <= 0) staff = 1; } catch {}
      try { const [b] = await query('SELECT avg_prep_time FROM businesses WHERE id=?', [businessId]); if (b && b.avg_prep_time != null) avgFallback = Number(b.avg_prep_time) || 5; } catch {}
      try { const menuRows = await query('SELECT id, duration_minutes FROM menu_items WHERE business_id=?', [businessId]); menuMap = new Map(menuRows.map(r => [Number(r.id), (r.duration_minutes != null ? Number(r.duration_minutes) : null)])); } catch {}
      try { const svcRows = await query('SELECT id, duration_minutes FROM services WHERE business_id=?', [businessId]); svcMap = new Map(svcRows.map(r => [Number(r.id), (r.duration_minutes != null ? Number(r.duration_minutes) : null)])); } catch {}

      function parseItems(val){ if (!val) return []; if (Array.isArray(val)) return val; try { const arr = JSON.parse(val); return Array.isArray(arr) ? arr : []; } catch { return []; } }
      function itemDuration(it){ const q = Math.max(1, Number(it?.quantity || 1)); let per = null; if (it && it.duration != null) per = Number(it.duration); if ((per == null || Number.isNaN(per)) && it && it.id != null) { const idNum = Number(it.id); per = (menuMap.get(idNum) ?? svcMap.get(idNum) ?? null); } if (per == null || !Number.isFinite(per)) per = avgFallback; return Math.max(0, Number(per)) * q; }

      const thisItems = parseItems(order_items);
  let thisTotalDuration = 0;
  for (const it of thisItems) { thisTotalDuration += itemDuration(it); }
  const staffRaw = Math.max(1, Number(staff || 1));
  const effectiveStaff = 1 + 0.7 * (staffRaw - 1);
  const thisOrderMinutes = (thisTotalDuration / Math.max(1, effectiveStaff));
  const aheadRows = await query('SELECT status, estimated_wait_time, initial_estimated_wait_time FROM queues WHERE business_id=? AND status IN ("waiting","called","delayed") AND is_priority=0 AND queue_number < ? ORDER BY queue_number ASC', [businessId, nextNumber]);
      const vals = (aheadRows||[]).map(r => {
        const isDelayed = String(r.status || '').toLowerCase() === 'delayed';
        if (isDelayed && r.initial_estimated_wait_time != null) return Math.max(0, Number(r.initial_estimated_wait_time) || 0);
        return Math.max(0, Number(r.estimated_wait_time) || 0);
      });
      const aheadAvg = vals.length ? (vals.reduce((a,b)=>a+b,0) / vals.length) : 0;
      const newEWT = Math.ceil(Math.max(0, thisOrderMinutes) + Math.max(0, aheadAvg));
  await query('UPDATE queues SET estimated_wait_time=?, initial_estimated_wait_time=? WHERE id=? AND business_id=?', [newEWT, newEWT, insertedId, businessId]);
    } catch(e){ console.warn('[public][join][ewt]', e); }


    try {
      const { broadcast } = require('../utils/realtime');
      broadcast('queue:joined', {
        id: insertedId,
        queue_number: nextNumber,
        business_id: businessId,
        customer_name,
        customer_email: customer_email || null,
        customer_phone: customer_phone || null,
        party_size: (party_size!=null ? Number(party_size) : null),
        order_items: order_items || [],
        order_total: Number(order_total)||0,
        is_priority: 0,
        notes: notes || null,
        status: initialStatus,
        payment_status: 'pending'
      });
    } catch(_) {  }
    return res.status(201).json({ success:true, data: { id: insertedId, queue_number: nextNumber } });
  } catch(e){ console.error('[public][join]', e); res.status(500).json({ success:false, message:'Server error' }); }
});


router.get('/queue-live', async (req, res) => {
  try {
    const businessId = Number(req.query.business_id);
    if (!businessId || Number.isNaN(businessId)) return res.status(400).json({ success:false, message:'business_id is required' });

    let category = null;
    try { const rows = await query('SELECT category FROM businesses WHERE id=?', [businessId]); category = rows[0]?.category ? String(rows[0].category).toLowerCase() : null; } catch(_) {}
    let includeUnpaidLive = false;
    try {
      const [set] = await query('SELECT allow_online_payment FROM settings WHERE business_id=?', [businessId]);
      includeUnpaidLive = !Number(set?.allow_online_payment || 0);
    } catch(_) {}
    const inQueueRows = (category === 'service')
      ? await query('SELECT COUNT(*) AS inQueue FROM queues WHERE business_id=? AND status IN ("waiting","delayed")', [businessId])
      : (includeUnpaidLive
          ? await query('SELECT COUNT(*) AS inQueue FROM queues WHERE business_id=? AND status IN ("waiting","delayed")', [businessId])
          : await query('SELECT COUNT(*) AS inQueue FROM queues WHERE business_id=? AND status IN ("waiting","delayed") AND payment_status="paid"', [businessId])
        );
    const inQueue = Number(inQueueRows[0]?.inQueue) || 0;
    const nowRows = await query('SELECT MIN(queue_number) AS nowServing FROM queues WHERE business_id=? AND status="called"', [businessId]);
    let nowServing = Number(nowRows[0]?.nowServing) || null;
    if (!nowServing) {
      const servedRows = await query('SELECT MAX(queue_number) AS lastServed FROM queues WHERE business_id=? AND status="served" AND DATE(served_at)=CURDATE()', [businessId]);
      nowServing = Number(servedRows[0]?.lastServed) || 0;
    }
    res.json({ success:true, data: { inQueue, nowServing } });
  } catch(e){ console.error('[public][queue-live]', e); res.status(500).json({ success:false, message:'Server error' }); }
});



router.get('/my-status', async (req, res) => {
  try {
    const businessId = Number(req.query.business_id);
    const id = req.query.id != null ? Number(req.query.id) : null;
    const queueNumber = req.query.queue_number != null ? Number(req.query.queue_number) : null;
    if (!businessId || Number.isNaN(businessId)) return res.status(400).json({ success:false, message:'business_id is required' });
    if ((!id || Number.isNaN(id)) && (!queueNumber || Number.isNaN(queueNumber))) {
      return res.status(400).json({ success:false, message:'id or queue_number is required' });
    }


    let row;
    if (id) {
      const rows = await query('SELECT id, queue_number, status, payment_status, estimated_wait_time, order_items, order_total, is_priority FROM queues WHERE business_id=? AND id=?', [businessId, id]);
      row = rows[0];
    } else {
      const rows = await query('SELECT id, queue_number, status, payment_status, estimated_wait_time, order_items, order_total, is_priority FROM queues WHERE business_id=? AND queue_number=? ORDER BY id DESC LIMIT 1', [businessId, queueNumber]);
      row = rows[0];
    }
    if (!row) return res.status(404).json({ success:false, message:'Not found' });

    let allowDelay = 1;
    try {
      const st = await query('SELECT allow_delay FROM settings WHERE business_id=?', [businessId]);
      if (st && st[0] && st[0].allow_delay != null) allowDelay = Number(st[0].allow_delay) ? 1 : 0;
    } catch(_) {  }


    const aheadRows = await query(
      'SELECT COUNT(*) AS ahead FROM queues WHERE business_id=? AND id<>? AND is_priority=0 AND queue_number < ? AND status IN ("pending","waiting","called","delayed")',
      [businessId, row.id, row.queue_number]
    );
    const ahead = Number(aheadRows[0]?.ahead) || 0;



    let parsedItems = [];
    try { parsedItems = row?.order_items ? JSON.parse(row.order_items) : []; if (!Array.isArray(parsedItems)) parsedItems = []; } catch { parsedItems = []; }
    const data = {
      id: row.id,
      queue_number: row.queue_number,
      status: row.status,
      payment_status: row.payment_status,
      estimated_wait_time: Number(row.estimated_wait_time) || 0,
      ahead,
      order_total: Number(row.order_total) || 0,
      order_items: parsedItems,
      is_priority: !!row.is_priority,
      allow_delay: !!allowDelay,
    };
    return res.json({ success:true, data });
  } catch(e){
    console.error('[public][my-status]', e);
    res.status(500).json({ success:false, message:'Server error' });
  }
});




router.post('/request-more-time', async (req, res) => {
  try {
    const { business_id, id, queue_number, minutes } = req.body || {};
    const businessId = Number(business_id);
    const mins = Number(minutes);
    const allowed = [2,4,6,8,10];
    if (!businessId || Number.isNaN(businessId)) return res.status(400).json({ success:false, message:'business_id is required' });
    if (!allowed.includes(mins)) return res.status(400).json({ success:false, message:'Invalid minutes' });
    const idNum = (id != null ? Number(id) : null);
    const qn = (queue_number != null ? Number(queue_number) : null);
    if ((!idNum || Number.isNaN(idNum)) && (!qn || Number.isNaN(qn))) return res.status(400).json({ success:false, message:'id or queue_number is required' });


    let rows;
    if (idNum) rows = await query('SELECT id, queue_number, status, estimated_wait_time FROM queues WHERE business_id=? AND id=?', [businessId, idNum]);
    else rows = await query('SELECT id, queue_number, status, estimated_wait_time FROM queues WHERE business_id=? AND queue_number=? ORDER BY id DESC LIMIT 1', [businessId, qn]);
    const row = rows && rows[0];
    if (!row) return res.status(404).json({ success:false, message:'Not found' });

    try {
      const st = await query('SELECT allow_delay FROM settings WHERE business_id=?', [businessId]);
      const allow = (st && st[0] && st[0].allow_delay != null) ? Number(st[0].allow_delay) : 1;
      if (!allow) return res.status(400).json({ success:false, message:'Delay feature is disabled for this business' });
    } catch(_) {  }

    if (String(row.status).toLowerCase() === 'delayed') return res.status(400).json({ success:false, message:'You have already requested a delay' });
    if (String(row.status).toLowerCase() !== 'waiting') return res.status(400).json({ success:false, message:'Delay is only available before you are called' });

    const currentEwt = Math.max(0, Number(row.estimated_wait_time) || 0);
    const newEwt = currentEwt + mins;
    await query('UPDATE queues SET estimated_wait_time=?, status="delayed", updated_at = NOW() WHERE id=? AND business_id=?', [newEwt, row.id, businessId]);
    try {
      const { broadcast } = require('../utils/realtime');
      broadcast('queue:status', { id: Number(row.id), status: 'delayed', business_id: businessId, queue_number: row.queue_number, estimated_wait_time: newEwt });
    } catch(_) {  }
    return res.json({ success:true, data: { id: row.id, queue_number: row.queue_number, estimated_wait_time: newEwt, status: 'delayed' } });
  } catch(e){ console.error('[public][request-more-time]', e); res.status(500).json({ success:false, message:'Server error' }); }
});




router.post('/pay/initiate', async (req, res) => {
  try {
    const { business_id, id, queue_number } = req.body || {};
    const businessId = Number(business_id);
    const idNum = (id != null ? Number(id) : null);
    const qn = (queue_number != null ? Number(queue_number) : null);
    if (!businessId || Number.isNaN(businessId)) return res.status(400).json({ success:false, message:'business_id is required' });
    if ((!idNum || Number.isNaN(idNum)) && (!qn || Number.isNaN(qn))) return res.status(400).json({ success:false, message:'id or queue_number is required' });


    let rows;
    if (idNum) rows = await query('SELECT id, queue_number, order_total FROM queues WHERE business_id=? AND id=?', [businessId, idNum]);
    else rows = await query('SELECT id, queue_number, order_total FROM queues WHERE business_id=? AND queue_number=? ORDER BY id DESC LIMIT 1', [businessId, qn]);
    const row = rows && rows[0];
    if (!row) return res.status(404).json({ success:false, message:'Not found' });


  // if no API key or business disabled online payments, return 503 without calling PayMongo
  const secretKey = process.env.PAYMONGO_SECRET || '';
    try {
      const [st] = await query('SELECT allow_online_payment FROM settings WHERE business_id=?', [businessId]);
      const allowOnline = Number(st?.allow_online_payment || 0) === 1;
      if (!secretKey || !allowOnline) {
        return res.status(503).json({ success:false, message:'Online payments are not available. Please pay at the counter.', code:'PAYMENTS_UNAVAILABLE' });
      }
    } catch (_) {
      if (!secretKey) return res.status(503).json({ success:false, message:'Online payments are not available. Please pay at the counter.', code:'PAYMENTS_UNAVAILABLE' });
    }
    const baseUrl = process.env.PUBLIC_BASE_URL || process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
    const amount = Math.max(0, Math.round(Number(row.order_total || 0) * 100)); // centavos
    const successUrl = `${baseUrl}/api/public/pay/success?business_id=${businessId}&id=${row.id}&qn=${row.queue_number}`;
    const cancelUrl = `${baseUrl}/api/public/pay/cancel?business_id=${businessId}&id=${row.id}&qn=${row.queue_number}`;

    try {
      const payload = {
        data: {
          attributes: {
            line_items: [
              { name: `Order #${row.queue_number}`, amount, currency: 'PHP', quantity: 1 },
            ],
            payment_method_types: ['gcash','paymaya'],

            description: `BIZ:${businessId};ID:${row.id};QN:${row.queue_number}`,
            metadata: {
              business_id: String(businessId),
              id: String(row.id),
              queue_number: String(row.queue_number)
            },
            show_line_items: true,
            show_description: true,
            send_email_receipt: false,
            success_url: successUrl,
            cancel_url: cancelUrl,
          }
        }
      };
      const resp = await axios.post('https://api.paymongo.com/v1/checkout_sessions', payload, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000,
      });
      const payment_url = resp?.data?.data?.attributes?.checkout_url;
      if (!payment_url) throw new Error('Bad response from PayMongo');
      return res.json({ success:true, data: { payment_url, amount: Number(row.order_total)||0 } });
    } catch (err) {
      console.error('[public][pay][initiate] PayMongo error:', err?.response?.data || err?.message || err);
      return res.status(503).json({ success:false, message:'Online payments are not available. Please pay at the counter.', code:'PAYMENTS_UNAVAILABLE' });
    }
  } catch(e){ console.error('[public][pay][initiate]', e); res.status(500).json({ success:false, message:'Server error' }); }
});


router.get('/pay/success', async (req, res) => {
  try {
    const businessId = Number(req.query.business_id);
    const idNum = req.query.id != null ? Number(req.query.id) : null;
    const qn = req.query.qn != null ? Number(req.query.qn) : null;
    if (!businessId || Number.isNaN(businessId)) return res.status(400).send('Invalid business');

    let targetId = idNum;
    if (!targetId && qn != null) {
      const rows = await query('SELECT id FROM queues WHERE business_id=? AND queue_number=? ORDER BY id DESC LIMIT 1', [businessId, qn]);
      targetId = rows?.[0]?.id;
    }
    if (!targetId) return res.status(400).send('Invalid order');

    let isService = false;
    try { const rows = await query('SELECT category FROM businesses WHERE id=?', [businessId]); isService = (rows[0]?.category ? String(rows[0].category).toLowerCase() === 'service' : false); } catch(_) {}
    if (isService) {

      const [r] = await query('SELECT status FROM queues WHERE id=? AND business_id=?', [targetId, businessId]);
      const st = r ? String(r.status).toLowerCase() : '';
      if (st === 'pending_payment') {
        await query('UPDATE queues SET payment_status="paid", status="served", served_at=NOW(), updated_at=NOW() WHERE id=? AND business_id=?', [targetId, businessId]);
      } else {
        await query('UPDATE queues SET payment_status="paid", updated_at=NOW() WHERE id=? AND business_id=?', [targetId, businessId]);
      }
    } else {
      await query('UPDATE queues SET payment_status="paid", status="waiting", updated_at=NOW(), waiting_at=NOW() WHERE id=? AND business_id=?', [targetId, businessId]);
    }
    try {
      const { broadcast } = require('../utils/realtime');

      if (isService) {
        const [r2] = await query('SELECT status FROM queues WHERE id=? AND business_id=?', [targetId, businessId]);
        const st2 = r2 ? String(r2.status).toLowerCase() : '';
        broadcast('queue:status', { id: Number(targetId), business_id: businessId, status: (st2 === 'served' ? 'served' : undefined), payment_status: 'paid' });
      } else {
        broadcast('queue:status', { id: Number(targetId), business_id: businessId, status: 'waiting', payment_status: 'paid' });
      }
    } catch(_) {  }

    res.send('<html><head><title>Payment Success</title></head><body><h2>Payment successful!</h2><p>You may return to the QueueMe tab. This window can be closed.</p></body></html>');
  } catch (e) {
    console.error('[public][pay][success]', e);
    res.status(500).send('Server error');
  }
});


router.get('/pay/cancel', async (req, res) => {
  try {
    res.send('<html><head><title>Payment Cancelled</title></head><body><h2>Payment cancelled.</h2><p>No changes were made to your order. You may close this window.</p></body></html>');
  } catch(e) {
    res.status(500).send('Server error');
  }
});



router.post('/pay/webhook', express.json({ type: 'application/json' }), async (req, res) => {
  try {
    const secret = process.env.PAYMONGO_WEBHOOK_SECRET || null;
    const sigHeader = req.get('Paymongo-Signature') || req.get('PayMongo-Signature') || req.get('paymongo-signature') || null;

    if (secret && !sigHeader) {
      console.warn('[pay][webhook] Missing signature header');
    }
    const evt = req.body || {};

    const type = String(evt?.data?.attributes?.type || evt?.type || '').toLowerCase();
    const paidLike = type.includes('payment.paid') || type.includes('checkout_session.payment.paid');
    if (!paidLike) {
      return res.status(200).json({ received: true });
    }

    const attrData = evt?.data?.attributes?.data || evt?.data?.attributes || {};
    const metadata = attrData?.attributes?.metadata || attrData?.metadata || {};
    let businessId = metadata?.business_id ? Number(metadata.business_id) : null;
    let id = metadata?.id ? Number(metadata.id) : null;
    let qn = metadata?.queue_number ? Number(metadata.queue_number) : null;
    if (!businessId || !id) {

      const desc = String(attrData?.attributes?.description || attrData?.description || '');
      const mBiz = desc.match(/BIZ:(\d+)/i);
      const mId = desc.match(/ID:(\d+)/i);
      const mQn = desc.match(/QN:(\d+)/i);
      businessId = businessId || (mBiz ? Number(mBiz[1]) : null);
      id = id || (mId ? Number(mId[1]) : null);
      qn = qn || (mQn ? Number(mQn[1]) : null);
    }
    if (!businessId || (!id && !qn)) {
      console.warn('[pay][webhook] Missing identifiers; ignoring event.');
      return res.status(200).json({ received: true });
    }

    let targetId = id;
    if (!targetId && qn != null) {
      try {
        const rows = await query('SELECT id FROM queues WHERE business_id=? AND queue_number=? ORDER BY id DESC LIMIT 1', [businessId, qn]);
        targetId = rows?.[0]?.id || null;
      } catch (_) {}
    }
    if (!targetId) {
      console.warn('[pay][webhook] Could not resolve target id');
      return res.status(200).json({ received: true });
    }

    try {
      let isService = false;
      try { const rows = await query('SELECT category FROM businesses WHERE id=?', [businessId]); isService = (rows[0]?.category ? String(rows[0].category).toLowerCase() === 'service' : false); } catch(_) {}
      if (isService) {
        const [r] = await query('SELECT status FROM queues WHERE id=? AND business_id=?', [targetId, businessId]);
        const st = r ? String(r.status).toLowerCase() : '';
        if (st === 'pending_payment') {
          await query('UPDATE queues SET payment_status="paid", status="served", served_at=NOW(), updated_at=NOW() WHERE id=? AND business_id=?', [targetId, businessId]);
        } else {
          await query('UPDATE queues SET payment_status="paid", updated_at=NOW() WHERE id=? AND business_id=?', [targetId, businessId]);
        }
      } else {
        await query('UPDATE queues SET payment_status="paid", status=IF(status IN ("pending"), "waiting", status), waiting_at = IF(status IN ("pending"), NOW(), waiting_at), updated_at=NOW() WHERE id=? AND business_id=?', [targetId, businessId]);
      }
    } catch (e) {
      console.error('[pay][webhook][update]', e?.message || e);
    }
    try {
      const { broadcast } = require('../utils/realtime');

      let isService = false;
      try { const rows = await query('SELECT category FROM businesses WHERE id=?', [businessId]); isService = (rows[0]?.category ? String(rows[0].category).toLowerCase() === 'service' : false); } catch(_) {}
      if (isService) {
        const [r2] = await query('SELECT status FROM queues WHERE id=? AND business_id=?', [targetId, businessId]);
        const st2 = r2 ? String(r2.status).toLowerCase() : '';
        broadcast('queue:status', { id: Number(targetId), business_id: businessId, status: (st2 === 'served' ? 'served' : undefined), payment_status: 'paid' });
      } else {
        broadcast('queue:status', { id: Number(targetId), business_id: businessId, status: 'waiting', payment_status: 'paid' });
      }

      broadcast('payment:webhook', { business_id: businessId, id: Number(targetId), ok: true, ts: Date.now() });
    } catch (_) {  }
    return res.status(200).json({ received: true });
  } catch (e) {
    console.error('[public][pay][webhook]', e);
    return res.status(200).json({ received: true }); 
  }
});




router.post('/cancel', async (req, res) => {
  try {
    const { business_id, id, queue_number } = req.body || {};
    const businessId = Number(business_id);
    // Handles idNum
    const idNum = (id != null ? Number(id) : null);
    // Handles qn
    const qn = (queue_number != null ? Number(queue_number) : null);
    if (!businessId || Number.isNaN(businessId)) return res.status(400).json({ success:false, message:'business_id is required' });
    if ((!idNum || Number.isNaN(idNum)) && (!qn || Number.isNaN(qn))) return res.status(400).json({ success:false, message:'id or queue_number is required' });


    let rows;
    if (idNum) rows = await query('SELECT id, payment_status, status FROM queues WHERE business_id=? AND id=?', [businessId, idNum]);
    else rows = await query('SELECT id, payment_status, status FROM queues WHERE business_id=? AND queue_number=? ORDER BY id DESC LIMIT 1', [businessId, qn]);
    const row = rows && rows[0];
    if (!row) return res.status(404).json({ success:false, message:'Not found' });
    if (String(row.payment_status).toLowerCase() === 'paid') {
      return res.status(400).json({ success:false, message:'Cannot cancel a paid order' });
    }
    const st = String(row.status || '').toLowerCase();
    const cancellable = ['pending','pending_payment','waiting','delayed'];
    if (!cancellable.includes(st)) {
      return res.status(400).json({ success:false, message:'You can only cancel before you are called or served' });
    }
    await query('UPDATE queues SET status="cancelled", updated_at = NOW() WHERE id=? AND business_id=?', [row.id, businessId]);
    try {
      const { broadcast } = require('../utils/realtime');
      broadcast('queue:status', { id: Number(row.id), status: 'cancelled', business_id: businessId });
    } catch(_) {  }
    try {
      const { recomputeEWTForActive } = require('../controllers/queueController');
      await recomputeEWTForActive(businessId);
    } catch(_) {  }
    return res.json({ success:true, data: { id: Number(row.id) } });
  } catch (e) {
    console.error('[public][cancel]', e);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

module.exports = router;
