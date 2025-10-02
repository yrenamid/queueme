// Philippine SMS helper using PhilSMS API
const axios = require('axios');


const API_URL = 'https://app.philsms.com/api/v3/sms/send';
const API_KEY = process.env.PHILSMS_API_KEY;
const SENDER_ID = process.env.PHILSMS_SENDER_ID;


// Normalize local PH numbers to E.164 (+63...)
function toE164PH(num) {
  if (!num) return null;
  let s = String(num).trim();
  s = s.replace(/[\s\-()]/g, '');
  if (s.startsWith('+')) return s; // assume already E.164
  if (/^0\d{10}$/.test(s)) return '+63' + s.slice(1);
  if (/^9\d{9}$/.test(s)) return '+63' + s;
  if (/^63\d{10}$/.test(s)) return '+' + s;
  return null;
}


// Send an SMS via PhilSMS; returns API response or throws
async function sendPhilSms(recipientPhone, message) {
  if (!API_KEY || !SENDER_ID) {
    console.warn('[philsms] API not configured; skipping SMS to', recipientPhone);
    return { skipped: true };
  }
  const e164 = toE164PH(recipientPhone);
  if (!e164) {
    const msg = `Invalid PH phone number format: ${recipientPhone}`;
    console.warn('[philsms]', msg);
    throw new Error(msg);
  }
  const masked = e164.replace(/(\+?\d{3})\d+(\d{2})/, '$1******$2');
  try {
    const res = await axios.post(
      API_URL,
      {
        recipient: e164,
        sender_id: SENDER_ID,
        type: 'plain',
        message: String(message ?? '')
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    console.log('[philsms] sent to', masked, 'status', res.status);
    return res.data;
  } catch (err) {
    const code = err?.response?.status;
    const data = err?.response?.data;
    console.warn('[philsms] send failed', code || '', data || err?.message || err);
    throw err;
  }
}

module.exports = { sendPhilSms };
