const { query } = require('../database/connection');




function normalizeService(r){
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    price: Number(r.price),
    duration: r.duration_minutes,
    is_available: !!r.is_available
  };
}



// list Services
async function listServices(req, res){
  try {
    const rows = await query('SELECT id,name,description,price,duration_minutes,is_available FROM services WHERE business_id=? ORDER BY id DESC', [req.user.business_id]);
    res.json({ success:true, data: rows.map(normalizeService) });
  } catch(e){ console.error('[listServices]', e); res.status(500).json({ success:false, message:'Server error' }); }
}



// create Service
async function createService(req, res){
  const { name, description, price, duration, is_available, available } = req.body;
  if(!name || price == null) return res.status(400).json({ success:false, message:'Missing name or price' });
  const numericPrice = Number(price); if(Number.isNaN(numericPrice)) return res.status(400).json({ success:false, message:'Price must be numeric' });
  const durationMinutes = duration != null ? Number(duration) : null; if(durationMinutes!=null && Number.isNaN(durationMinutes)) return res.status(400).json({ success:false, message:'Duration must be numeric' });
  const availability = (typeof is_available === 'boolean') ? is_available : (typeof available === 'boolean' ? available : true);
  try {
    const result = await query('INSERT INTO services (business_id,name,description,price,duration_minutes,is_available) VALUES (?,?,?,?,?,?)', [req.user.business_id, name, description || null, numericPrice, durationMinutes, availability]);
    const inserted = await query('SELECT id,name,description,price,duration_minutes,is_available FROM services WHERE id=?', [result.insertId]);
    res.status(201).json({ success:true, data: normalizeService(inserted[0]) });
  } catch(e){ console.error('[createService]', e); res.status(500).json({ success:false, message:'Server error' }); }
}



// update Service
async function updateService(req, res){
  const { id } = req.params; const { name, description, price, duration, is_available, available } = req.body;
  const updates = []; const params = [];

  // dynamic update SQL
  function push(col,val){ updates.push(col+'=?'); params.push(val); }
  if(name !== undefined) push('name', name || null);
  if(description !== undefined) push('description', description || null);
  if(price !== undefined){ const p = Number(price); if(Number.isNaN(p)) return res.status(400).json({ success:false, message:'Price must be numeric'}); push('price', p); }
  if(duration !== undefined){ const d = duration != null ? Number(duration) : null; if(d!=null && Number.isNaN(d)) return res.status(400).json({ success:false, message:'Duration must be numeric'}); push('duration_minutes', d); }
  if(is_available !== undefined) push('is_available', is_available ? 1 : 0); else if(available !== undefined) push('is_available', available ? 1 : 0);
  if(!updates.length) return res.json({ success:true, message:'No changes' });
  try {
    params.push(id, req.user.business_id);
    await query(`UPDATE services SET ${updates.join(', ')} WHERE id=? AND business_id=?`, params);
    const rows = await query('SELECT id,name,description,price,duration_minutes,is_available FROM services WHERE id=? AND business_id=?', [id, req.user.business_id]);
    res.json({ success:true, data: rows.length ? normalizeService(rows[0]) : null });
  } catch(e){ console.error('[updateService]', e); res.status(500).json({ success:false, message:'Server error' }); }
}



// delete Service
async function deleteService(req, res){
  const { id } = req.params;
  try { await query('DELETE FROM services WHERE id=? AND business_id=?', [id, req.user.business_id]); res.json({ success:true, message:'Deleted' }); }
  catch(e){ console.error('[deleteService]', e); res.status(500).json({ success:false, message:'Server error' }); }
}



module.exports = { listServices, createService, updateService, deleteService };
