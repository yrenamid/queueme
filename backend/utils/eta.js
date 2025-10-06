
// Parse JSON array field safely, returning [] when invalid
function safeParseJson(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  return [];
}

// Estimate single order duration in minutes based on items
function computeOrderDurationMinutes(order, avgPrepMin = 5) {
  const items = safeParseJson(order.order_items);
  let duration = 0;
  if (items.length) {
    for (const it of items) {
      const qty = Number(it?.quantity ?? 1) || 1;
      const itemDur = Number(it?.duration) || 0;
      duration += (itemDur > 0 ? itemDur : avgPrepMin) * qty;
    }
  } else {
    const totalQty = Number(order?.total_qty ?? 1) || 1;
    duration = avgPrepMin * totalQty;
  }
  return Math.max(1, Math.round(duration));
}

// Remaining minutes for a called order (0 for served soon), else total estimate
function remainingMinutes(order, avgPrepMin) {
  const total = computeOrderDurationMinutes(order, avgPrepMin);
  if (order.status !== 'called' || !order.called_at) return total;
  const calledAt = new Date(order.called_at);
  if (isNaN(calledAt.getTime())) return total;
  const elapsed = Math.max(0, (Date.now() - calledAt.getTime()) / 60000);
  return Math.max(0, Math.ceil(total - elapsed));
}

// Compute ETAs. priorities first
function computeEtas(orders, staffCount = 1, avgPrepMin = 5, opts = {}) {
  const c = Math.max(1, Number(staffCount) || 1);
  const mode = (opts && (opts.mode === 'finish' || opts.mode === 'start')) ? opts.mode : 'start';
  const treatCalledAsBusy = opts.treatCalledAsBusy !== undefined ? !!opts.treatCalledAsBusy : true;
  const currentStatuses = new Set(['pending','waiting','called','delayed']);
  const filtered = (orders || []).filter(o => currentStatuses.has(String(o.status).toLowerCase()));

  const sorted = [...filtered].sort((a, b) => {
    const ap = a.is_priority ? 1 : 0;
    const bp = b.is_priority ? 1 : 0;
    if (bp !== ap) return bp - ap;
    const aj = new Date(a.joined_at || a.created_at || 0).getTime();
    const bj = new Date(b.joined_at || b.created_at || 0).getTime();
    return aj - bj;
  });


  const workers = new Array(c).fill(0);
  const etaMap = new Map();
  const called = sorted.filter(o => String(o.status).toLowerCase() === 'called')
    .sort((a,b) => new Date(a.called_at || a.joined_at || 0) - new Date(b.called_at || b.joined_at || 0));
  const nowAssigned = [];
  if (treatCalledAsBusy) {
    for (let i = 0; i < Math.min(c, called.length); i++) {
      const o = called[i];
      const rem = remainingMinutes(o, avgPrepMin);
      workers[i] = rem;
      nowAssigned.push(o.id);

      etaMap.set(o.id, 0); 
    }
  } else {

    for (const o of called) etaMap.set(o.id, 0);
  }

  for (const o of sorted) {
    if (nowAssigned.includes(o.id)) continue;
  const dur = remainingMinutes(o, avgPrepMin);

    let wi = 0;
    for (let i = 1; i < c; i++) if (workers[i] < workers[wi]) wi = i;
    const startAt = workers[wi];
    const etaVal = mode === 'finish' ? (startAt + dur) : startAt;
    etaMap.set(o.id, Math.max(0, Math.round(etaVal)));
    workers[wi] = startAt + dur; 
  return etaMap;
}

// Simple ETA model with diminishing returns and priority lanes
function computeEtasFoodSimple(orders, staffCount = 1, avgPrepMin = 5) {
  const Sraw = Math.max(1, Number(staffCount) || 1);
  const S = 1 + 0.7 * (Sraw - 1); 
  const currentStatuses = new Set(['pending','waiting','called','delayed']);
  const rows = (orders || []).filter(o => currentStatuses.has(String(o.status).toLowerCase()));

  const sorted = [...rows].sort((a,b) => new Date(a.joined_at || a.created_at || 0) - new Date(b.joined_at || b.created_at || 0));

  const D = new Map();
  for (const o of sorted) D.set(o.id, computeOrderPrepTimeBatch(o, avgPrepMin, S));

  const prio = sorted.filter(o => !!o.is_priority && String(o.status).toLowerCase() !== 'called');
  const reg = sorted.filter(o => !o.is_priority && String(o.status).toLowerCase() !== 'called');

  const prioPrefix = [0];
  for (const o of prio) prioPrefix.push(prioPrefix[prioPrefix.length-1] + (D.get(o.id) || 0));
  const regPrefix = [0];
  for (const o of reg) regPrefix.push(regPrefix[regPrefix.length-1] + (D.get(o.id) || 0));
  const prioIndex = new Map(); prio.forEach((o,i)=>prioIndex.set(o.id,i));
  const regIndex = new Map(); reg.forEach((o,i)=>regIndex.set(o.id,i));
  const prioTotal = prioPrefix[prioPrefix.length-1] || 0;

  const etaMap = new Map();
  for (const o of sorted) {
    const status = String(o.status).toLowerCase();
  if (status === 'called') { etaMap.set(o.id, 0); continue; }
    const dSelf = D.get(o.id) || 1;
    let workAhead = 0;
    if (o.is_priority) {
      const idx = prioIndex.get(o.id) || 0;
      workAhead = prioPrefix[idx]; 
    } else {
      const idx = regIndex.get(o.id) || 0;
      workAhead = prioTotal + regPrefix[idx];
    }
    const waitUntilStart = workAhead / Math.max(1, S);
    const eta = Math.max(1, Math.round(waitUntilStart + dSelf));
    etaMap.set(o.id, eta);
  }
  return etaMap;
}


function computeOrderPrepTimeBatch(order, avgPrepMin = 5, staffCount = 1) {
  const Sraw = Math.max(1, Number(staffCount) || 1);
  const S = 1 + 0.7 * (Sraw - 1); 
  const items = safeParseJson(order?.order_items);
  let total = 0;
  if (!items.length) {
    const qty = Math.max(1, Number(order?.total_qty || 1) || 1);
    total = qty * avgPrepMin;
  } else {
    for (const it of items) {
      const qty = Math.max(1, Number(it?.quantity ?? 1) || 1);
      const per = Math.max(1, Number(it?.duration) || avgPrepMin);
      total += per * qty;
    }
  }
  return Math.max(1, Math.round(total / Math.max(1, S)));
}

// Parallel worker ETA model using greedy scheduling
function computeEtasFoodParallel(orders, staffCount = 1, avgPrepMin = 5) {
  const Sraw = Math.max(1, Number(staffCount) || 1);
  const S = 1 + 0.7 * (Sraw - 1); 
  const rows = Array.isArray(orders) ? orders : [];
  const etaMap = new Map();

  const toSchedule = [];
  for (const o of rows) {
    const status = String(o?.status || '').toLowerCase();
    if (status === 'called') { etaMap.set(o.id, 0); continue; }
    if (status === 'pending' || status === 'waiting' || status === 'delayed') {
      toSchedule.push(o);
    }
  }

  const sorted = [...toSchedule].sort((a, b) => {
    const aj = new Date(a.joined_at || a.created_at || 0).getTime();
    const bj = new Date(b.joined_at || b.created_at || 0).getTime();
    if (aj !== bj) return aj - bj;
    const ap = a.is_priority ? 1 : 0;
    const bp = b.is_priority ? 1 : 0;
    if (bp !== ap) return bp - ap;
    return (Number(a.id) || 0) - (Number(b.id) || 0);
  });

  const D = new Map();
  for (const o of sorted) {
    D.set(o.id, computeOrderPrepTimeBatch(o, avgPrepMin, S));
  }
  const workers = new Array(S).fill(0);
  for (const o of sorted) {

    let wi = 0;
    for (let i = 1; i < S; i++) if (workers[i] < workers[wi]) wi = i;
    const startAt = workers[wi];
    const dur = D.get(o.id) || 1;
    const finish = startAt + dur;
    etaMap.set(o.id, Math.max(1, Math.round(finish)));
    workers[wi] = finish;
  }
  return etaMap;
}

module.exports = { computeOrderDurationMinutes, remainingMinutes, computeEtas, computeEtasFoodSimple, computeOrderPrepTimeBatch, computeEtasFoodParallel };}
