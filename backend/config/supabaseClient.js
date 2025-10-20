let _client = null;

async function getSupabase() {
  if (_client) return _client;
  const { createClient } = await import('@supabase/supabase-js');
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) in environment');
  }
  _client = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  return _client;
}

module.exports = { getSupabase };
