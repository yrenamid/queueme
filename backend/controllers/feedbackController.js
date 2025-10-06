const { query } = require('../database/connection');



// create Feedback
async function createFeedback(req, res) {
  try {
    const { business_id, queue_id, rating, comment } = req.body || {};
    const bizId = Number(business_id);
    const qid = Number(queue_id);
    const rate = Number(rating);
    if (!Number.isInteger(bizId) || bizId <= 0) return res.status(400).json({ success:false, message:'business_id required' });
    if (!Number.isInteger(qid) || qid <= 0) return res.status(400).json({ success:false, message:'queue_id required' });
    if (!Number.isInteger(rate) || rate < 1 || rate > 5) return res.status(400).json({ success:false, message:'rating must be 1-5' });

    const [row] = await query('SELECT id, business_id, status FROM queues WHERE id=?', [qid]);
    if (!row) return res.status(404).json({ success:false, message:'Queue not found' });
    if (Number(row.business_id) !== bizId) return res.status(400).json({ success:false, message:'Queue does not belong to business' });
    if (String(row.status).toLowerCase() !== 'served') return res.status(400).json({ success:false, message:'Feedback allowed only after service is completed' });

    try {
      await query('INSERT INTO feedback (business_id, queue_id, rating, comment) VALUES (?,?,?,?)', [bizId, qid, rate, comment ?? null]);
    } catch (e) {
      if (e && e.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success:false, message:'Feedback already submitted for this queue' });
      }
      throw e;
    }
    return res.status(201).json({ success:true, message:'Thank you for your feedback!' });
  } catch (e) {
    console.error('[createFeedback]', e);
    res.status(500).json({ success:false, message:'Server error' });
  }
}



//get Business Feedback
async function getBusinessFeedback(req, res) {
  try {
    const businessIdParam = Number(req.params.businessId);
    const authBiz = Number(req.user?.business_id);
    const bizId = (Number.isInteger(businessIdParam) && businessIdParam > 0) ? businessIdParam : authBiz;
    if (!bizId || bizId !== authBiz) return res.status(403).json({ success:false, message:'Forbidden' });

    const list = await query(`
      SELECT f.id, f.rating, f.comment, f.created_at,
             q.id AS queue_id, q.queue_number, q.customer_name
      FROM feedback f
      JOIN queues q ON q.id = f.queue_id
      WHERE f.business_id = ?
      ORDER BY f.created_at DESC
      LIMIT 1000
    `, [bizId]);

    const [[stats]] = await Promise.all([
      query('SELECT AVG(rating) AS avg_rating, COUNT(*) AS total FROM feedback WHERE business_id=?', [bizId])
    ]);

    return res.json({ success:true, data: { list, stats: { avg: Number(stats?.avg_rating || 0).toFixed ? Number(Number(stats.avg_rating).toFixed(2)) : Number(stats?.avg_rating || 0), total: Number(stats?.total || 0) } } });
  } catch (e) {
    console.error('[getBusinessFeedback]', e);
    res.status(500).json({ success:false, message:'Server error' });
  }
}

module.exports = { createFeedback, getBusinessFeedback };
