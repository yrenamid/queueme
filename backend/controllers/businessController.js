const { query } = require('../database/connection');



// get Business Profile
async function getBusinessProfile(req, res) {
  try {
  const rows = await query('SELECT id,name,email,phone,category,slug,qr_code_url,qr_code_img,max_queue_length,avg_prep_time,settings, created_at FROM businesses WHERE id = ?', [req.user.business_id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Business not found' });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[getBusinessProfile]', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}



//update Business
async function updateBusiness(req, res) {
  const { name, phone, max_queue_length, avg_prep_time, settings } = req.body;
  try {
    await query('UPDATE businesses SET name = COALESCE(?, name), phone = COALESCE(?, phone), max_queue_length = COALESCE(?, max_queue_length), avg_prep_time = COALESCE(?, avg_prep_time), settings = COALESCE(?, settings) WHERE id = ?', [name, phone, max_queue_length, avg_prep_time, settings ? JSON.stringify(settings) : null, req.user.business_id]);
    return res.json({ success: true, message: 'Updated' });
  } catch (err) {
    console.error('[updateBusiness]', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}



// list Businesses
async function listBusinesses(req, res) {
  try {
    const rows = await query('SELECT id,name,category,slug,qr_code_url FROM businesses ORDER BY created_at DESC LIMIT 100');
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[listBusinesses]', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getBusinessProfile, updateBusiness, listBusinesses };
