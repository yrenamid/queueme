const sgMail = require('@sendgrid/mail');


const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
} else {
  console.warn('[email] SENDGRID_API_KEY not set; emails will be skipped');
}

// HTML to plaintext conversion
function htmlToText(html) {
  if (!html) return '';
  let s = String(html);
  s = s.replace(/<br\s*\/?>(\n)?/gi, '\n');
  s = s.replace(/<p[^>]*>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  s = s.replace(/[\t ]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return s;
}


async function sendEmail({ to, subject, text, html, replyTo, categories }) {
  if (!apiKey) {
    console.warn('[email] SendGrid not configured; skipping email to', to);
    return { skipped: true };
  }
  const from = process.env.EMAIL_FROM || 'QueueMe <noreply@queueme.email>';
  const safeText = text || htmlToText(html);
  const msg = {
    to,
    from,
    subject,
    text: safeText,
    html,

    trackingSettings: {
      clickTracking: { enable: false, enable_text: false },
      openTracking: { enable: false }
    },

    mailSettings: {
      bypass_list_management: { enable: true }
    }
  };
  if (replyTo) msg.replyTo = replyTo;
  if (Array.isArray(categories) && categories.length) msg.categories = categories.slice(0, 10);
  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (e) {
    console.error('[email] send failed', e?.response?.body || e?.message || e);
    throw e;
  }
}

module.exports = { sendEmail };
