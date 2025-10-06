const { query, getConnection } = require('../database/connection');
const { broadcast } = require('../utils/realtime');
const { sendEmail, sendSMS } = require('../utils/notifications');



// Recomputes EWT for all active queues of a business
async function recomputeEWTForActive(businessId) {

  let staff = 1;
  let avgFallback = 5;
  let menuMap = new Map();
  let svcMap = new Map();
  try {
    const [set] = await query('SELECT available_kitchen_staff FROM settings WHERE business_id=?', [businessId]);
    staff = (set && set.available_kitchen_staff != null) ? Number(set.available_kitchen_staff) : 1;
    if (!Number.isFinite(staff) || staff <= 0) staff = 1;
  } catch {}
  try {
    const [b] = await query('SELECT avg_prep_time FROM businesses WHERE id=?', [businessId]);
    if (b && b.avg_prep_time != null) avgFallback = Number(b.avg_prep_time) || 5;
  } catch {}
  try {
    const menuRows = await query('SELECT id, duration_minutes FROM menu_items WHERE business_id=?', [businessId]);
    menuMap = new Map(menuRows.map(r => [Number(r.id), (r.duration_minutes != null ? Number(r.duration_minutes) : null)]));
  } catch {}
  try {
    const svcRows = await query('SELECT id, duration_minutes FROM services WHERE business_id=?', [businessId]);
    svcMap = new Map(svcRows.map(r => [Number(r.id), (r.duration_minutes != null ? Number(r.duration_minutes) : null)]));
  } catch {}


  const active = await query(
    'SELECT id, order_items, is_priority, queue_number, status, estimated_wait_time, initial_estimated_wait_time FROM queues WHERE business_id=? AND status IN ("pending","waiting","called","delayed") ORDER BY queue_number ASC',
    [businessId]
  );


  // Computes this order's duration in minutes
  function computeThisOrderMinutes(row) {
    let items = [];
    try { items = Array.isArray(row.order_items) ? row.order_items : JSON.parse(row.order_items || '[]'); } catch {}
  let totalDur = 0, totalQty = 0;
    for (const it of items) {
      const q = Math.max(1, Number(it?.quantity || 1));
      let per = null;
      const maybe = Number(it?.duration);
      if (Number.isFinite(maybe) && maybe > 0) per = maybe;
      if ((per == null || !Number.isFinite(per)) && it && it.id != null) {
        const idNum = Number(it.id);
        per = (menuMap.get(idNum) ?? svcMap.get(idNum) ?? null);
      }
      const perMin = Number.isFinite(per) && per > 0 ? per : avgFallback;
      totalDur += perMin * q; totalQty += q;
    }
    const effStaffRaw = Math.max(1, Number(staff) || 1);
    const effStaff = 1 + 0.7 * (effStaffRaw - 1); 
    return (totalDur / Math.max(1, effStaff));
  }


  const prio = active.filter(r => !!r.is_priority).sort((a,b)=> a.queue_number - b.queue_number);
  const reg = active.filter(r => !r.is_priority).sort((a,b)=> a.queue_number - b.queue_number);
  // Recomputes EWT for a prioritized group, then regular group
  async function recomputeGroup(rows) {
    const prev = [];
    const prevNonPending = [];
    for (const row of rows) {
      const base = Math.max(0, computeThisOrderMinutes(row));
      const aheadAvg = prevNonPending.length ? (prevNonPending.reduce((a,b)=>a+b,0) / prevNonPending.length) : 0;
      const newEWT = Math.ceil(base + Math.max(0, aheadAvg));
      try {
        console.log('[EWT][recompute-avg]', {
          id: row.id,
          queue_number: row.queue_number,
          baseTime: Number(base.toFixed ? base.toFixed(2) : base),
          aheadAvg: Number(aheadAvg.toFixed ? aheadAvg.toFixed(2) : aheadAvg),
          finalEWT: newEWT,
          staff_used: staff
        });
      } catch {}
      // Update estimated_wait_time
      try {
        await query('UPDATE queues SET estimated_wait_time=?, initial_estimated_wait_time=COALESCE(initial_estimated_wait_time, ?) WHERE id=? AND business_id=?', [newEWT, newEWT, row.id, businessId]);
      } catch (_) {
        await query('UPDATE queues SET estimated_wait_time=? WHERE id=? AND business_id=?', [newEWT, row.id, businessId]);
      }

      try {
        broadcast('queue:updated', { business_id: businessId, id: Number(row.id), queue_number: Number(row.queue_number), estimated_wait_time: Number(newEWT) });
      } catch(_) {  }
      const isPending = String(row.status).toLowerCase() === 'pending';
      const isDelayed = String(row.status).toLowerCase() === 'delayed';
      const valForAvg = isDelayed && (row.initial_estimated_wait_time != null)
        ? Math.max(0, Number(row.initial_estimated_wait_time) || 0)
        : Math.max(0, Number(newEWT) || 0);
      prev.push(valForAvg);
      if (!isPending) prevNonPending.push(valForAvg);
    }
  }
  await recomputeGroup(prio);
  await recomputeGroup(reg);
}



// join Queue
async function joinQueue(req, res) {
  const { customer_name, customer_email, customer_phone, order_items = [], order_total = 0, is_priority = false, notes, party_size } = req.body;
  const { normalizePhoneDigits, isNotBlank, isValidPHPhone } = require('../utils/validators');
  if (!isNotBlank(customer_name)) return res.status(400).json({ success:false, message:'Missing customer name' });
  const phoneDigits = customer_phone ? normalizePhoneDigits(customer_phone) : '';
  if (phoneDigits) {
    if (!isValidPHPhone(phoneDigits)) return res.status(400).json({ success:false, message:'Enter a valid PH phone number (11 digits starting with 09)' });

    const c1 = await query('SELECT id FROM users WHERE phone=?', [phoneDigits]);
    const c2 = await query('SELECT id FROM businesses WHERE phone=?', [phoneDigits]);
    if (c1.length || c2.length) return res.status(409).json({ success:false, message:'Phone already registered in the system' });

    try {
      const dup = await query('SELECT id FROM queues WHERE business_id=? AND customer_phone=? AND status IN ("pending","waiting","called","pending_payment","delayed") LIMIT 1', [req.user.business_id, phoneDigits]);
      if (Array.isArray(dup) && dup.length) {
        return res.status(409).json({ success:false, message:'This phone is already in the active queue.' });
      }
    } catch(_){  }
  }
  const businessId = req.user.business_id;

  let isServiceBased = false;
  try {
    const [biz] = await query('SELECT category FROM businesses WHERE id=?', [businessId]);
    isServiceBased = (biz?.category ? String(biz.category).toLowerCase() === 'service' : false);
  } catch(_) { isServiceBased = false; }
  const initialStatus = isServiceBased ? 'waiting' : 'pending';
  let inserted = null;
  let nextNumber = null;
  let priorityAllowed = !!is_priority;
  let lockConn = null;

  try {
    const [biz] = await query('SELECT max_queue_length FROM businesses WHERE id=?', [businessId]);
    const cap = Number(biz?.max_queue_length) || 0;
    if (cap > 0) {
      const [cntRows] = await query('SELECT COUNT(*) AS cnt FROM queues WHERE business_id=? AND status IN ("waiting","delayed") AND payment_status="paid"', [businessId]);
      const cnt = Array.isArray(cntRows) ? (cntRows[0]?.cnt || 0) : (cntRows?.cnt || 0);
      if (Number(cnt) >= cap) {
        return res.status(400).json({ success:false, message:'Queue is full. Please try again later.' });
      }
    }
  } catch(e) {

  }
  try {

    if (priorityAllowed) {
      lockConn = await getConnection();
      try {
        await lockConn.beginTransaction();
        const lockKey = `priority_cap_${businessId}`;
        const [lockRows] = await lockConn.query('SELECT GET_LOCK(?, 5) AS got', [lockKey]);
        const got = Array.isArray(lockRows) ? (lockRows[0]?.got ?? lockRows[0]?.GET_LOCK) : 0;
        if (!Number(got)) {

          await lockConn.rollback();
          lockConn.release();
          lockConn = null;
          return res.status(429).json({ success:false, message:'Please try again (system busy).' });
        }

        try {
          const [biz] = await lockConn.query('SELECT max_queue_length FROM businesses WHERE id=?', [businessId]);
          const cap = Number((Array.isArray(biz) ? biz[0]?.max_queue_length : biz?.max_queue_length) || 0);
          if (cap > 0) {
            const [cntRows] = await lockConn.query('SELECT COUNT(*) AS cnt FROM queues WHERE business_id=? AND status IN ("waiting","delayed") AND payment_status="paid"', [businessId]);
            const cnt = Array.isArray(cntRows) ? (cntRows[0]?.cnt || 0) : (cntRows?.cnt || 0);
            if (Number(cnt) >= cap) {
              await lockConn.query('DO RELEASE_LOCK(?)', [lockKey]);
              await lockConn.rollback();
              lockConn.release();
              lockConn = null;
              return res.status(400).json({ success:false, message:'Queue is full. Please try again later.' });
            }
          }
        } catch(_) {  }

        const [setRows] = await lockConn.query('SELECT reserve_slots FROM settings WHERE business_id=?', [businessId]);
        const set = Array.isArray(setRows) ? setRows[0] : null;
        const cap = (set && set.reserve_slots != null) ? Number(set.reserve_slots) : 0;

        if (cap <= 0) {
          await lockConn.query('DO RELEASE_LOCK(?)', [lockKey]);
          await lockConn.rollback();
          lockConn.release();
          lockConn = null;
          return res.status(400).json({ success:false, message:'Priority customers are disabled (0 reserved slots).' });
        }
        if (cap > 0) {
          const [cntRows] = await lockConn.query(
            'SELECT COUNT(*) AS cnt FROM queues WHERE business_id=? AND is_priority=1 AND status IN ("pending","waiting","called")',
            [businessId]
          );
          const cnt = Array.isArray(cntRows) ? (cntRows[0]?.cnt || 0) : 0;
          try { console.log('[priority-cap][join][locked]', { business_id: businessId, cap, activeCnt: Number(cnt) }); } catch {}
          if (Number(cnt) >= cap) {
            await lockConn.query('DO RELEASE_LOCK(?)', [lockKey]);
            await lockConn.rollback();
            lockConn.release();
            lockConn = null;
            return res.status(400).json({ success:false, message: `Priority slots are full (${cap}).` });
          }
        }

        const [maxRows] = await lockConn.query('SELECT MAX(queue_number) AS maxNum FROM queues WHERE business_id = ?', [businessId]);
        const maxNum = Array.isArray(maxRows) ? (maxRows[0]?.maxNum || 0) : 0;
        nextNumber = (maxNum || 0) + 1;
        const [insRes] = await lockConn.query(
          'INSERT INTO queues (business_id, customer_name, customer_email, customer_phone, party_size, queue_number, order_items, order_total, is_priority, notes, status, payment_status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())',
          [businessId, customer_name, customer_email, phoneDigits || null, (party_size!=null ? Number(party_size) : null), nextNumber, JSON.stringify(order_items), order_total, 1, notes || null, initialStatus, 'pending']
        );
        inserted = { insertId: insRes.insertId, is_priority: 1 };
        await lockConn.commit();

        try { await lockConn.query('DO RELEASE_LOCK(?)', [`priority_cap_${businessId}`]); } catch {}
        lockConn.release();
        lockConn = null;
      } catch (e) {
        try {
          if (lockConn) {
            try { await lockConn.rollback(); } catch {}
            try { await lockConn.query('DO RELEASE_LOCK(?)', [`priority_cap_${businessId}`]); } catch {}
            lockConn.release();
          }
        } catch {}
        console.error('[joinQueue][locked] error', e);
        return res.status(500).json({ success:false, message:'Server error' });
      }
    } else {

      const row = await query('SELECT MAX(queue_number) as maxNum FROM queues WHERE business_id = ?', [businessId]);
      nextNumber = (row[0].maxNum || 0) + 1;
      const result = await query(
        'INSERT INTO queues (business_id, customer_name, customer_email, customer_phone, party_size, queue_number, order_items, order_total, is_priority, notes, status, payment_status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())',
        [businessId, customer_name, customer_email, phoneDigits || null, (party_size!=null ? Number(party_size) : null), nextNumber, JSON.stringify(order_items), order_total, 0, notes || null, initialStatus, 'pending']
      );
      inserted = { insertId: result.insertId, is_priority: 0 };
    }

    try {

      let staff = 1;
      let avgFallback = 5; 
      let menuMap = new Map();
      let svcMap = new Map();
      try {
        const [set] = await query('SELECT available_kitchen_staff FROM settings WHERE business_id=?', [businessId]);
        staff = (set && set.available_kitchen_staff != null) ? Number(set.available_kitchen_staff) : 1;
        if (!Number.isFinite(staff) || staff <= 0) staff = 1; 
      } catch {}
      try {
        const [b] = await query('SELECT avg_prep_time FROM businesses WHERE id=?', [businessId]);
        if (b && b.avg_prep_time != null) avgFallback = Number(b.avg_prep_time) || 5;
      } catch {}
      try {
        const menuRows = await query('SELECT id, duration_minutes FROM menu_items WHERE business_id=?', [businessId]);
        menuMap = new Map(menuRows.map(r => [Number(r.id), (r.duration_minutes != null ? Number(r.duration_minutes) : null)]));
      } catch {}
      try {
        const svcRows = await query('SELECT id, duration_minutes FROM services WHERE business_id=?', [businessId]);
        svcMap = new Map(svcRows.map(r => [Number(r.id), (r.duration_minutes != null ? Number(r.duration_minutes) : null)]));
      } catch {}

      function parseItems(val){
        if (!val) return [];
        if (Array.isArray(val)) return val;
        try { const arr = JSON.parse(val); return Array.isArray(arr) ? arr : []; } catch { return []; }
      }
      function itemDuration(it){

        const q = Math.max(1, Number(it?.quantity || 1));
        let per = null;
        if (it && it.duration != null) per = Number(it.duration);
        if ((per == null || Number.isNaN(per)) && it && it.id != null) {
          const idNum = Number(it.id);
          per = (menuMap.get(idNum) ?? svcMap.get(idNum) ?? null);
        }
        if (per == null || !Number.isFinite(per)) per = avgFallback;
        return Math.max(0, Number(per)) * q; 
      }


    const thisItems = parseItems(order_items);
    let thisTotalDuration = 0;
    for (const it of thisItems) { thisTotalDuration += itemDuration(it); }
    const staffRaw = Math.max(1, Number(staff || 1));
    const effectiveStaff = 1 + 0.7 * (staffRaw - 1);
    const thisOrderMinutes = (thisTotalDuration / Math.max(1, effectiveStaff));


      const aheadRows = await query(
        'SELECT status, estimated_wait_time, initial_estimated_wait_time FROM queues WHERE business_id=? AND status IN ("waiting","called","delayed") AND is_priority=? AND queue_number < ? ORDER BY queue_number ASC',
        [businessId, inserted?.is_priority ? 1 : 0, nextNumber]
      );
      const vals = (aheadRows||[]).map(r => {
        const isDelayed = String(r.status || '').toLowerCase() === 'delayed';
        if (isDelayed && r.initial_estimated_wait_time != null) return Math.max(0, Number(r.initial_estimated_wait_time) || 0);
        return Math.max(0, Number(r.estimated_wait_time) || 0);
      });
      const aheadAvg = vals.length ? (vals.reduce((a,b)=>a+b,0) / vals.length) : 0;
      const newEWT = Math.ceil(Math.max(0, thisOrderMinutes) + Math.max(0, aheadAvg));

  await query('UPDATE queues SET estimated_wait_time=?, initial_estimated_wait_time=? WHERE id=? AND business_id=?', [newEWT, newEWT, inserted.insertId, businessId]);
      try {
        console.log('[EWT][join]', {
          id: inserted.insertId,
          queue_number: nextNumber,
          baseTime: Number(thisOrderMinutes.toFixed ? thisOrderMinutes.toFixed(2) : thisOrderMinutes),
          aheadAvg,
          finalEWT: newEWT,
          staff_used: effectiveStaff
        });
      } catch {}
    } catch (calcErr) { console.warn('[joinQueue][ewt]', calcErr); }

  const data = { id: inserted.insertId, queue_number: nextNumber, is_priority: inserted.is_priority ? 1 : 0 };

  try { broadcast('queue:joined', { id: data.id, queue_number: nextNumber, business_id: businessId, status: initialStatus, payment_status: 'pending' }); } catch {}
    res.status(201).json({ success:true, data });
  } catch (e) { console.error(e); res.status(500).json({ success:false, message:'Server error' }); }
}


// list Queue
async function listQueue(req, res) {
  try {
  const allowed = ['pending','waiting','called','pending_payment','delayed','served','cancelled','no_show'];
  const { status } = req.query;
    let sql = 'SELECT * FROM queues WHERE business_id = ?';
    const params = [req.user.business_id];
    if (status) {
      const s = String(status).split(',').map(v => v.trim()).filter(v => allowed.includes(v));
      if (!s.length) return res.status(400).json({ success:false, message:'Invalid status filter' });
      if (s.length === 1) {
        sql += ' AND status = ?';
        params.push(s[0]);
      } else {
        sql += ` AND status IN (${s.map(()=>'?').join(',')})`;
        params.push(...s);
      }
    } else {
        sql += ' AND status IN ("pending","waiting","called","pending_payment","delayed")';
    }

    if (!status || status === 'waiting' || status === 'called' || String(status).includes('waiting') || String(status).includes('called')) {
      sql += ' ORDER BY is_priority DESC, queue_number ASC LIMIT 500';
    } else if (status === 'served') {
      sql += ' ORDER BY served_at DESC, updated_at DESC LIMIT 500';
    } else if (status === 'cancelled') {
      sql += ' ORDER BY updated_at DESC LIMIT 500';
    } else {
      sql += ' ORDER BY updated_at DESC LIMIT 500';
    }

    const rows = await query(sql, params);

    return res.json({ success:true, data: rows });
  } catch(e){ console.error('[listQueue]', e); res.status(500).json({ success:false, message:'Server error' }); }
}


//  update Queue Status
async function updateQueueStatus(req, res) {
  const { id } = req.params;
  const { status, payment_status, payment_method } = req.body;
   const allowed = ['pending','waiting','called','served','cancelled','delayed','pending_payment'];
  const allowedPayment = ['pending','paid','cancelled'];
  const allowedMethod = ['cash','online'];
  if (!allowed.includes(status)) return res.status(400).json({ success:false, message:'Invalid status'});
  if (payment_status && !allowedPayment.includes(payment_status)) return res.status(400).json({ success:false, message:'Invalid payment status'});
  if (payment_method && !allowedMethod.includes(payment_method)) return res.status(400).json({ success:false, message:'Invalid payment method'});
  try {

    let callerId = null;
    try {
      if (req.user?.id) {
        const [u] = await query('SELECT id FROM users WHERE id=? AND business_id=?', [req.user.id, req.user.business_id]);
        if (u && u.id) callerId = Number(u.id);
      }
    } catch {}

    if (status === 'cancelled') {
      const [row] = await query('SELECT payment_status FROM queues WHERE id=? AND business_id=?', [id, req.user.business_id]);
      if (!row) return res.status(404).json({ success:false, message:'Not found' });
      if (row.payment_status === 'paid') return res.status(400).json({ success:false, message:'Cannot cancel a paid order' });
    }
  const sql = 'UPDATE queues SET status = ?, payment_status = COALESCE(?, payment_status), payment_method = COALESCE(?, payment_method), called_by = IF(? = "called", ' + (callerId != null ? '?' : 'NULL') + ', called_by), served_by = IF(? = "served", ' + (callerId != null ? '?' : 'NULL') + ', served_by), waiting_at = IF(?="waiting", NOW(), waiting_at), called_at = IF(?="called", NOW(), called_at), served_at = IF(?="served", NOW(), served_at) WHERE id=? AND business_id=?';
    const params = callerId != null
  ? [status, payment_status || null, payment_method || null, status, callerId, status, callerId, status, status, status, id, req.user.business_id]
  : [status, payment_status || null, payment_method || null, status, status, status, status, status, id, req.user.business_id];
    try {
      await query(sql, params);
    } catch (err) {

      if (err && err.code === 'ER_NO_REFERENCED_ROW_2') {
  const fallbackSql = 'UPDATE queues SET status = ?, payment_status = COALESCE(?, payment_status), payment_method = COALESCE(?, payment_method), called_by = IF(? = "called", NULL, called_by), served_by = IF(? = "served", NULL, served_by), waiting_at = IF(?="waiting", NOW(), waiting_at), called_at = IF(?="called", NOW(), called_at), served_at = IF(?="served", NOW(), served_at) WHERE id=? AND business_id=?';
  const fallbackParams = [status, payment_status || null, payment_method || null, status, status, status, status, status, id, req.user.business_id];
        await query(fallbackSql, fallbackParams);
      } else {
        throw err;
      }
    }

    try {
      if (status === 'served' || status === 'cancelled') {
        await recomputeEWTForActive(req.user.business_id);
      }
    } catch (reErr) { console.warn('[recomputeEWTForActive]', reErr); }
    try {

      let enriched = null;
      try {
        const [row] = await query('SELECT queue_number, estimated_wait_time, payment_status FROM queues WHERE id=? AND business_id=?', [id, req.user.business_id]);
        if (row) enriched = { queue_number: row.queue_number, estimated_wait_time: row.estimated_wait_time, payment_status: row.payment_status };
      } catch {}
      broadcast('queue:status', { id: Number(id), status, payment_status: (payment_status || enriched?.payment_status) || undefined, business_id: req.user.business_id, queue_number: enriched?.queue_number, estimated_wait_time: enriched?.estimated_wait_time });
    } catch {}

    try {
    if (status === 'called') {
  const [bizSet] = await query('SELECT notify_customer, notify_via_email, notify_via_sms, notify_template_email, notify_template_sms, sms_notifications_enabled, sms_message_template FROM settings WHERE business_id=?', [req.user.business_id]);
        const [row] = await query('SELECT customer_name, customer_email, customer_phone, queue_number FROM queues WHERE id=? AND business_id=?', [id, req.user.business_id]);
        const context = { customer_name: row?.customer_name || 'Customer', queue_number: row?.queue_number || '-', business_id: req.user.business_id };

        const render = (tpl, fallback) => {
          const src = String(tpl || fallback || '');
          return src

            .replace(/\{\{\s*customer_name\s*\}\}/gi, context.customer_name)
            .replace(/\{\{\s*queue_number\s*\}\}/gi, String(context.queue_number))
// update Queue Details
            .replace(/\{\s*customer_name\s*\}/gi, context.customer_name)
            .replace(/\{\s*queue_number\s*\}/gi, String(context.queue_number));
        };

        const notifyEnabled = (bizSet?.notify_customer == null) ? true : !!Number(bizSet.notify_customer);
        if (notifyEnabled && bizSet?.notify_via_email && row?.customer_email) {
          const subject = 'You are being called';
          const body = render(bizSet.notify_template_email, 'Hello {{customer_name}}, your queue number {{queue_number}} is being called now.');
          try { await sendEmail({ to: row.customer_email, subject, html: `<p>${body}</p>` }); } catch(e) { console.warn('[notify][email]', e?.message || e); }
        }

        const smsEnabled = notifyEnabled && !!(bizSet?.notify_via_sms || bizSet?.sms_notifications_enabled);
        if (smsEnabled && row?.customer_phone) {
          const text = render(bizSet.notify_template_sms || bizSet?.sms_message_template, 'Hello {{customer_name}}, your queue number {{queue_number}} is being called.');
          try { await sendSMS({ to: row.customer_phone, message: text }); } catch(e) { console.warn('[notify][sms]', e?.message || e); }
        }

      }
    } catch (e) { console.warn('[notify][updateQueueStatus]', e?.message || e); }
    res.json({ success:true, message:'Status updated'});
  } catch(e){ console.error(e); res.status(500).json({ success:false, message:'Server error' }); }
}



// update Queue Details
async function updateQueueDetails(req, res) {
  const { id } = req.params;
  const businessId = req.user.business_id;
  let beforePrio = 0;
  let afterPrio = null;
  let needRecompute = false;
  let lockConn = null;
  try {
    let { customer_name, customer_email, customer_phone, order_items, order_total, notes, is_priority, party_size } = req.body;
    if (order_items && typeof order_items === 'string') {
      try { order_items = JSON.parse(order_items); } catch { order_items = []; }
    }
    if (Array.isArray(order_items) && (order_total === undefined || order_total === null)) {
      order_total = order_items.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0), 0);
    }


  // enforce reserved-slots capacity with a DB lock
    const wantPriorityToggle = (is_priority != null) ? !!is_priority : null;
    if (wantPriorityToggle === true) {
      lockConn = await getConnection();
      try {
        await lockConn.beginTransaction();
        const lockKey = `priority_cap_${businessId}`;
        const [lockRows] = await lockConn.query('SELECT GET_LOCK(?, 5) AS got', [lockKey]);
        const got = Array.isArray(lockRows) ? (lockRows[0]?.got ?? lockRows[0]?.GET_LOCK) : 0;
        if (!Number(got)) {
          await lockConn.rollback();
          lockConn.release();
          lockConn = null;
          return res.status(429).json({ success:false, message:'Please try again (system busy).' });
        }

        const [setRows] = await lockConn.query('SELECT reserve_slots FROM settings WHERE business_id=?', [businessId]);
        const set = Array.isArray(setRows) ? setRows[0] : null;
        const cap = (set && set.reserve_slots != null) ? Number(set.reserve_slots) : 0;

        if (cap <= 0) {
          await lockConn.query('DO RELEASE_LOCK(?)', [lockKey]);
          await lockConn.rollback();
          lockConn.release();
          lockConn = null;
          return res.status(400).json({ success:false, message:'Priority customers are disabled (0 reserved slots).' });
        }
        if (cap > 0) {
          const [cntRows] = await lockConn.query(
            'SELECT COUNT(*) AS cnt FROM queues WHERE business_id=? AND is_priority=1 AND status IN ("pending","waiting","called") AND id<>?',
            [businessId, id]
          );
          const cnt = Array.isArray(cntRows) ? (cntRows[0]?.cnt || 0) : 0;
          try { console.log('[priority-cap][update][locked]', { business_id: businessId, cap, activeCnt: Number(cnt), excludeId: Number(id) }); } catch {}
          if (Number(cnt) >= cap) {
            await lockConn.query('DO RELEASE_LOCK(?)', [lockKey]);
            await lockConn.rollback();
            lockConn.release();
            lockConn = null;
            return res.status(400).json({ success:false, message: `Priority slots are full (${cap}).` });
          }
        }

        try {
          const [rowRows] = await lockConn.query('SELECT is_priority FROM queues WHERE id=? AND business_id=? FOR UPDATE', [id, businessId]);
          const row = Array.isArray(rowRows) ? rowRows[0] : null;
          beforePrio = row ? Number(row.is_priority)||0 : 0;
        } catch {}
        afterPrio = 1;
        needRecompute = Number(afterPrio) !== Number(beforePrio);

        await lockConn.query(
          'UPDATE queues SET customer_name = COALESCE(?, customer_name), customer_email = COALESCE(?, customer_email), customer_phone = COALESCE(?, customer_phone), party_size = COALESCE(?, party_size), order_items = COALESCE(?, order_items), order_total = COALESCE(?, order_total), notes = COALESCE(?, notes), is_priority = 1 WHERE id=? AND business_id=?',
          [customer_name || null, customer_email || null, customer_phone || null, (party_size != null ? Number(party_size) : null), order_items ? JSON.stringify(order_items) : null, order_total != null ? order_total : null, notes ?? null, id, businessId]
        );

        if (order_items != null || order_total != null) {
          needRecompute = true;
        }

    await lockConn.commit();
    try { await lockConn.query('DO RELEASE_LOCK(?)', [lockKey]); } catch {}
        lockConn.release();
        lockConn = null;
      } catch (e) {
        try {
          if (lockConn) {
            try { await lockConn.rollback(); } catch {}
            try { await lockConn.query('DO RELEASE_LOCK(?)', [`priority_cap_${businessId}`]); } catch {}
            lockConn.release();
          }
        } catch {}
        console.error('[updateQueueDetails][locked] error', e);
        return res.status(500).json({ success:false, message:'Server error' });
      }
    } else {

      try { const [row] = await query('SELECT is_priority FROM queues WHERE id=? AND business_id=?', [id, businessId]); beforePrio = row ? Number(row.is_priority)||0 : 0; } catch {}
      if (is_priority != null) { afterPrio = is_priority ? 1 : 0; needRecompute = Number(afterPrio) !== Number(beforePrio); }
      await query(
        'UPDATE queues SET customer_name = COALESCE(?, customer_name), customer_email = COALESCE(?, customer_email), customer_phone = COALESCE(?, customer_phone), party_size = COALESCE(?, party_size), order_items = COALESCE(?, order_items), order_total = COALESCE(?, order_total), notes = COALESCE(?, notes), is_priority = COALESCE(?, is_priority) WHERE id=? AND business_id=?',
        [customer_name || null, customer_email || null, customer_phone || null, (party_size != null ? Number(party_size) : null), order_items ? JSON.stringify(order_items) : null, order_total != null ? order_total : null, notes ?? null, (is_priority==null ? null : (is_priority ? 1 : 0)), id, businessId]
      );

      if (order_items != null || order_total != null) {
        needRecompute = true;
      }
    }


    try {
      if (needRecompute) { await recomputeEWTForActive(businessId); }
    } catch (e) { console.warn('[updateQueueDetails][recompute after priority toggle]', e); }

    try {
      const [row] = await query('SELECT id, queue_number, customer_name, customer_email, customer_phone, party_size, order_items, order_total, notes, is_priority, status, payment_status, estimated_wait_time FROM queues WHERE id=? AND business_id=?', [id, businessId]);
      if (row) {
        const payload = {
          id: Number(row.id),
          business_id: businessId,
          queue_number: row.queue_number,
          customer_name: row.customer_name,
          customer_email: row.customer_email,
          customer_phone: row.customer_phone,
          party_size: row.party_size,
          order_items: (() => { try { return JSON.parse(row.order_items||'[]'); } catch { return []; } })(),
          order_total: row.order_total,
          notes: row.notes,
          is_priority: !!row.is_priority,
          status: row.status,
          payment_status: row.payment_status,
          estimated_wait_time: row.estimated_wait_time
        };
        broadcast('queue:updated', payload);
      }
    } catch (_) {  }
    res.json({ success:true, message:'Queue updated' });
  } catch(e){ console.error(e); res.status(500).json({ success:false, message:'Server error' }); }
}


//  call Selected Customers
async function callSelectedCustomers(req, res) {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'ids array required' });
  }
  const cleanIds = ids.map(Number).filter((n) => Number.isInteger(n) && n > 0);
  if (!cleanIds.length) return res.status(400).json({ success: false, message: 'No valid ids' });
  try {

    let category = null;
    try {
      const [biz] = await query('SELECT category FROM businesses WHERE id=?', [req.user.business_id]);
      category = biz?.category ? String(biz.category).toLowerCase() : null;
    } catch(_) { category = null; }

    const [[{ cnt_called }]] = await Promise.all([
      query('SELECT COUNT(*) AS cnt_called FROM queues WHERE business_id=? AND status="called"', [req.user.business_id])
    ]);
    let inUse = Number(cnt_called) || 0;
    let staff = 1;
    try {
      const [set] = await query('SELECT available_kitchen_staff FROM settings WHERE business_id=?', [req.user.business_id]);
      staff = (set && set.available_kitchen_staff != null) ? Number(set.available_kitchen_staff) : 1;
      if (!Number.isFinite(staff) || staff < 0) staff = 0;
    } catch {}
    const remaining = Math.max(0, staff - inUse);


    const placeholders = cleanIds.map(() => '?').join(',');
    const eligSql = (category === 'service')
      ? `SELECT id FROM queues WHERE business_id = ? AND status IN ('waiting','delayed') AND id IN (${placeholders}) ORDER BY is_priority DESC, queue_number ASC`
      : `SELECT id FROM queues WHERE business_id = ? AND status IN ('waiting','delayed') AND payment_status = 'paid' AND id IN (${placeholders}) ORDER BY is_priority DESC, queue_number ASC`;
    const eligRows = await query(eligSql, [req.user.business_id, ...cleanIds]);
    const eligibleIdsOrdered = eligRows.map(r => Number(r.id));

    if (!eligibleIdsOrdered.length || remaining === 0) {
      return res.json({ success: true, data: { updated: [], skipped: cleanIds, capacity: { staff, in_use: inUse, remaining } } });
    }

    const toUpdate = eligibleIdsOrdered.slice(0, remaining);
    const updPlaceholders = toUpdate.map(() => '?').join(',');

    let callerId = null;
    try {
      if (req.user?.id) {
        const [u] = await query('SELECT id FROM users WHERE id=? AND business_id=?', [req.user.id, req.user.business_id]);
        if (u && u.id) callerId = Number(u.id);
      }
    } catch {}
    const updSql = (category === 'service')
      ? `UPDATE queues SET status='called', called_by=${callerId != null ? '?' : 'NULL'}, called_at = NOW() WHERE business_id = ? AND id IN (${updPlaceholders}) AND status IN ('waiting','delayed')`
      : `UPDATE queues SET status='called', called_by=${callerId != null ? '?' : 'NULL'}, called_at = NOW() WHERE business_id = ? AND id IN (${updPlaceholders}) AND status IN ('waiting','delayed') AND payment_status='paid'`;
    const updParams = callerId != null ? [callerId, req.user.business_id, ...toUpdate] : [req.user.business_id, ...toUpdate];
    await query(updSql, updParams);


    try {
      toUpdate.forEach((id) => {
        try { broadcast('queue:status', { id, status: 'called', business_id: req.user.business_id }); } catch {}
      });
    } catch {}


    try {
      const idsForNotify = toUpdate;
      if (idsForNotify.length) {
    const [bizSet] = await query('SELECT notify_via_email, notify_via_sms, notify_template_email, notify_template_sms, sms_notifications_enabled, sms_message_template FROM settings WHERE business_id=?', [req.user.business_id]);
        const rows = await query(`SELECT id, customer_name, customer_email, customer_phone, queue_number FROM queues WHERE business_id=? AND id IN (${idsForNotify.map(()=>'?').join(',')})`, [req.user.business_id, ...idsForNotify]);
        for (const r of rows) {
          const context = { customer_name: r.customer_name || 'Customer', queue_number: r.queue_number || '-', business_id: req.user.business_id };
          // basic template
          const render = (tpl, fallback) => String(tpl || fallback)
            .replace(/\{\{\s*customer_name\s*\}\}/gi, context.customer_name)
            .replace(/\{\{\s*queue_number\s*\}\}/gi, String(context.queue_number))
            .replace(/\{\s*customer_name\s*\}/gi, context.customer_name)
            .replace(/\{\s*queue_number\s*\}/gi, String(context.queue_number));
          if (bizSet?.notify_via_email && r.customer_email) {
            const subject = 'You are being called';
            const body = render(bizSet.notify_template_email, 'Hello {{customer_name}}, your queue number {{queue_number}} is being called now.');
            try { await sendEmail({ to: r.customer_email, subject, html: `<p>${body}</p>` }); } catch(_) {}
          }
          const smsEnabled = !!(bizSet?.notify_via_sms || bizSet?.sms_notifications_enabled);
          if (smsEnabled && r.customer_phone) {
            const text = render(bizSet.notify_template_sms || bizSet?.sms_message_template, 'Hello {{customer_name}}, your queue number {{queue_number}} is being called.');
            try { await sendSMS({ to: r.customer_phone, message: text }); } catch(_) {}
          }
        }
      }
    } catch(e) { console.warn('[notify][callSelectedCustomers]', e?.message || e); }

    const updatedSet = new Set(toUpdate);
    const skipped = cleanIds.filter(id => !updatedSet.has(id));
    return res.json({ success: true, data: { updated: toUpdate, skipped, capacity: { staff, in_use: inUse + toUpdate.length, remaining: Math.max(0, staff - (inUse + toUpdate.length)) } } });
  } catch (e) {
    console.error('[callSelectedCustomers]', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { joinQueue, listQueue, updateQueueStatus, updateQueueDetails, callSelectedCustomers, recomputeEWTForActive };


