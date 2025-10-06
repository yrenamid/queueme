const { query } = require('../database/connection');



function normalizeRow(r){
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    price: Number(r.price),
    category: r.category || null,
    duration: r.duration_minutes,
    is_available: !!r.is_available
  };
}



// list Menu
async function listMenu(req, res) {
  try {
    const rows = await query('SELECT id, name, description, price, category, duration_minutes, is_available FROM menu_items WHERE business_id = ? ORDER BY id DESC', [req.user.business_id]);
    res.json({ success: true, data: rows.map(normalizeRow) });
  } catch (e) { console.error('[listMenu]', e); res.status(500).json({ success:false, message:'Server error' }); }
}



// create Menu Item
async function createMenuItem(req, res) {
  const { name, description, price, category = null, duration, is_available, available } = req.body;
  if (!name || price == null) return res.status(400).json({ success:false, message:'Missing name or price' });
  const numericPrice = Number(price);
  if (Number.isNaN(numericPrice)) return res.status(400).json({ success:false, message:'Price must be numeric' });
  const durationMinutes = duration != null ? Number(duration) : null;
  if (durationMinutes != null && Number.isNaN(durationMinutes)) return res.status(400).json({ success:false, message:'Duration must be numeric' });
  const availability = (typeof is_available === 'boolean') ? is_available : (typeof available === 'boolean' ? available : true);
  try {
    const result = await query('INSERT INTO menu_items (business_id,name,description,price,category,duration_minutes,is_available) VALUES (?,?,?,?,?,?,?)', [req.user.business_id, name, description || null, numericPrice, category, durationMinutes, availability]);
    const inserted = await query('SELECT id,name,description,price,category,duration_minutes,is_available FROM menu_items WHERE id=?', [result.insertId]);
    res.status(201).json({ success:true, data: normalizeRow(inserted[0]) });
  } catch (e) { console.error('[createMenuItem]', e); res.status(500).json({ success:false, message:'Server error' }); }
}



//  update Menu Item
async function updateMenuItem(req, res) {
  const { id } = req.params;
  const { name, description, price, category, duration, is_available, available } = req.body;
  const updates = [];
  const params = [];

  // dynamic update SQL
  function push(column, value){ updates.push(`${column} = ?`); params.push(value); }
  if (name !== undefined) push('name', name || null);
  if (description !== undefined) push('description', description || null);
  if (price !== undefined){
    const numericPrice = Number(price); if (Number.isNaN(numericPrice)) return res.status(400).json({ success:false, message:'Price must be numeric' }); push('price', numericPrice); }
  if (category !== undefined) push('category', category || null);
  if (duration !== undefined){
    const dur = duration != null ? Number(duration) : null; if (dur!=null && Number.isNaN(dur)) return res.status(400).json({ success:false, message:'Duration must be numeric' }); push('duration_minutes', dur); }
  if (is_available !== undefined) push('is_available', is_available ? 1 : 0);
  else if (available !== undefined) push('is_available', available ? 1 : 0);
  if (!updates.length) return res.json({ success:true, message:'No changes' });
  try {
    params.push(id, req.user.business_id);
    await query(`UPDATE menu_items SET ${updates.join(', ')} WHERE id=? AND business_id=?`, params);
    const rows = await query('SELECT id,name,description,price,category,duration_minutes,is_available FROM menu_items WHERE id=? AND business_id=?', [id, req.user.business_id]);
    res.json({ success:true, data: rows.length? normalizeRow(rows[0]) : null });
  } catch (e) { console.error('[updateMenuItem]', e); res.status(500).json({ success:false, message:'Server error' }); }
}



// delete Menu Item
async function deleteMenuItem(req, res) {
  const { id } = req.params;
  try { await query('DELETE FROM menu_items WHERE id=? AND business_id=?', [id, req.user.business_id]); res.json({ success:true, message:'Deleted' }); }
  catch(e){ console.error('[deleteMenuItem]', e); res.status(500).json({ success:false, message:'Server error' }); }
}



module.exports = { listMenu, createMenuItem, updateMenuItem, deleteMenuItem };
