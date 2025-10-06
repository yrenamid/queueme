const { query } = require('../database/connection');



// get Dashboard Stats
async function getDashboardStats(req, res) {
  try {
  const [today] = await query('SELECT COUNT(*) as totalWaiting FROM queues WHERE business_id=? AND status IN ("waiting","delayed")', [req.user.business_id]);
    const [served] = await query('SELECT COUNT(*) as servedToday FROM queues WHERE business_id=? AND DATE(served_at)=CURDATE()', [req.user.business_id]);
    const analytics = await query('SELECT * FROM analytics WHERE business_id=? ORDER BY date DESC LIMIT 7', [req.user.business_id]);
    res.json({ success:true, data: { queueWaiting: today.totalWaiting, servedToday: served.servedToday, recentAnalytics: analytics } });
  } catch(e){ console.error(e); res.status(500).json({ success:false, message:'Server error' }); }
}



//get Queue Summary
async function getQueueSummary(req, res) {
  try {
    const businessId = req.user.business_id;
    const inQueueRows = await query(
      'SELECT COUNT(*) AS inQueue FROM queues WHERE business_id=? AND status IN ("waiting","delayed") AND payment_status="paid"',
      [businessId]
    );
    const inQueue = Number(inQueueRows[0]?.inQueue) || 0;
    const waits = await query(
      'SELECT estimated_wait_time FROM queues WHERE business_id=? AND status IN ("waiting","delayed")',
      [businessId]
    );
    const avgWait = waits.length ? Math.round(waits.reduce((a, r) => a + (Number(r.estimated_wait_time) || 0), 0) / waits.length) : 0;
    const completedRows = await query(
      'SELECT COUNT(*) AS completedToday FROM queues WHERE business_id=? AND status="served" AND DATE(served_at)=CURDATE()',
      [businessId]
    );
    const completedToday = Number(completedRows[0]?.completedToday) || 0;
    const cancelledRows = await query(
      'SELECT COUNT(*) AS cancelled FROM queues WHERE business_id=? AND status="cancelled" AND DATE(updated_at)=CURDATE()',
      [businessId]
    );
    const cancelled = Number(cancelledRows[0]?.cancelled) || 0;
    return res.json({ success: true, data: { inQueue, avgWait, completedToday, cancelled } });
  } catch (e) {
    console.error('[analytics][queue-summary]', e);
    res.status(500).json({ success:false, message:'Server error' });
  }
}



// get Overview Metrics
async function getOverviewMetrics(req, res) {
  try {
    const businessId = req.user.business_id;
    const completedRows = await query(
      'SELECT COUNT(*) AS completedToday FROM queues WHERE business_id=? AND status="served" AND DATE(served_at)=CURDATE()',
      [businessId]
    );
    const completedToday = Number(completedRows[0]?.completedToday) || 0;
    const cancelledRows = await query(
      'SELECT COUNT(*) AS cancelledToday FROM queues WHERE business_id=? AND status="cancelled" AND DATE(updated_at)=CURDATE()',
      [businessId]
    );
    const cancelledToday = Number(cancelledRows[0]?.cancelledToday) || 0;
    const totalCustomers = completedToday + cancelledToday;
  const waits = await query('SELECT estimated_wait_time FROM queues WHERE business_id=? AND status IN ("waiting","delayed")', [businessId]);
    const avgWait = waits.length ? Math.round(waits.reduce((a, r) => a + (Number(r.estimated_wait_time) || 0), 0) / waits.length) : 0;
    return res.json({ success:true, data: { totalCustomers, avgWait, completedToday, cancelledToday } });
  } catch (e) {
    console.error('[analytics][overview]', e);
    res.status(500).json({ success:false, message:'Server error' });
  }
}

module.exports = { getDashboardStats, getQueueSummary, getOverviewMetrics };


// get Recent Activity
async function getRecentActivity(req, res) {
  try {
    const businessId = req.user.business_id;

    const sql = `
      (
        SELECT id, queue_number, customer_name, 'Added' AS action, COALESCE(waiting_at, created_at, updated_at) AS ts
        FROM queues
        WHERE business_id = ? AND COALESCE(waiting_at, created_at, updated_at) IS NOT NULL
      )
      UNION ALL
      (
        SELECT id, queue_number, customer_name, 'Served' AS action, served_at AS ts
        FROM queues
        WHERE business_id = ? AND status = 'served' AND served_at IS NOT NULL
      )
      UNION ALL
      (
        SELECT id, queue_number, customer_name, 'Called' AS action, called_at AS ts
        FROM queues
        WHERE business_id = ? AND status = 'called' AND called_at IS NOT NULL
      )
      UNION ALL
      (
        SELECT id, queue_number, customer_name, 'Cancelled' AS action, updated_at AS ts
        FROM queues
        WHERE business_id = ? AND status = 'cancelled' AND updated_at IS NOT NULL
      )
      ORDER BY ts DESC
      LIMIT 10`;
    const rows = await query(sql, [businessId, businessId, businessId, businessId]);
    const items = (rows || []).filter(r => r.ts).map(r => ({
      id: Number(r.id),
      queue_number: r.queue_number,
      customer_name: r.customer_name,
      text: r.action,
      time: new Date(r.ts).getTime(),
      business_id: businessId
    }));
    res.json({ success: true, data: items });
  } catch (e) {
    console.error('[analytics][recent-activity]', e);
    res.status(500).json({ success:false, message:'Server error' });
  }
}

module.exports.getRecentActivity = getRecentActivity;



//get Analytics Series
async function getAnalyticsSeries(req, res) {
  try {
    const businessId = req.user.business_id;
    const range = String(req.query.range || 'today').toLowerCase();
    let start, end, granularity;

    const now = new Date();

    function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
    function endOfDay(d) { const x = new Date(d); x.setHours(23,59,59,999); return x; }
    function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
    function fmt(dt){

      const pad=(n)=>String(n).padStart(2,'0');
      const y=dt.getFullYear(); const m=pad(dt.getMonth()+1); const d=pad(dt.getDate());
      const hh=pad(dt.getHours()); const mm=pad(dt.getMinutes()); const ss=pad(dt.getSeconds());
      return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
    }

    if (range === 'today') {
      start = startOfDay(now); end = endOfDay(now); granularity = 'hour';
    } else if (range === 'week') {
      end = endOfDay(now); start = startOfDay(addDays(now, -6)); granularity = 'day';
    } else if (range === 'month') {
      end = endOfDay(now); const first = new Date(now.getFullYear(), now.getMonth(), 1); start = startOfDay(first); granularity = 'day';
    } else if (range === 'custom') {
      const sRaw = req.query.start; const eRaw = req.query.end;
      if (!sRaw || !eRaw) return res.status(400).json({ success:false, message:'start and end required for custom range' });
      const s = new Date(sRaw); const e = new Date(eRaw);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return res.status(400).json({ success:false, message:'Invalid date format' });

      start = startOfDay(s); end = endOfDay(e);

      const diffDays = Math.ceil((end - start)/(1000*60*60*24));
      if (diffDays > 62) return res.status(400).json({ success:false, message:'Custom range is limited to 2 months (62 days)' });
      granularity = (start.toDateString() === end.toDateString()) ? 'hour' : 'day';
    } else {
      return res.status(400).json({ success:false, message:'Invalid range' });
    }


    const rows = await query(
      'SELECT served_at, COALESCE(waiting_at, created_at) AS joined_at FROM queues WHERE business_id=? AND status="served" AND served_at BETWEEN ? AND ? ORDER BY served_at ASC',
      [businessId, fmt(start), fmt(end)]
    );


    const labels = [];
    const servedCounts = [];
    const avgWaits = [];


    function labelHour(h){ const ampm = h>=12 ? 'PM' : 'AM'; const hr = ((h+11)%12)+1; return `${hr}${ampm}`; }

    function dateKey(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

    if (granularity === 'hour') {

      for (let h=0; h<24; h++) {
        labels.push(labelHour(h));
        const inBucket = rows.filter(r => {
          const t = new Date(r.served_at);
          return t.getHours() === h && t >= start && t <= end;
        });
        servedCounts.push(inBucket.length);
        if (inBucket.length) {
          const total = inBucket.reduce((acc, r) => {
            const served = new Date(r.served_at).getTime();
            const joined = r.joined_at ? new Date(r.joined_at).getTime() : served;
            const mins = Math.max(0, Math.round((served - joined)/60000));
            return acc + mins;
          }, 0);
          avgWaits.push(Math.round(total / inBucket.length));
        } else {
          avgWaits.push(0);
        }
      }
    } else {

      for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
        const key = dateKey(d);
        labels.push(key);
        const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);
        const inBucket = rows.filter(r => {
          const t = new Date(r.served_at);
          return t >= dayStart && t <= dayEnd;
        });
        servedCounts.push(inBucket.length);
        if (inBucket.length) {
          const total = inBucket.reduce((acc, r) => {
            const served = new Date(r.served_at).getTime();
            const joined = r.joined_at ? new Date(r.joined_at).getTime() : served;
            const mins = Math.max(0, Math.round((served - joined)/60000));
            return acc + mins;
          }, 0);
          avgWaits.push(Math.round(total / inBucket.length));
        } else {
          avgWaits.push(0);
        }
      }
    }

    return res.json({ success:true, data: { labels, servedCounts, avgWaits, granularity, range, start: fmt(start), end: fmt(end) } });
  } catch (e) {
    console.error('[analytics][series]', e);
    res.status(500).json({ success:false, message:'Server error' });
  }
}

module.exports.getAnalyticsSeries = getAnalyticsSeries;
