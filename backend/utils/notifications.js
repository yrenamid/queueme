// High-level notification helpers (email + PH SMS)
const { sendEmail: sgSendEmail } = require('./email');
const { sendPhilSms } = require('./philsms');

// Email
async function sendEmail({ to, subject, html, text }) {
  return sgSendEmail({ to, subject, html, text });
}

// SMS
async function sendSMS({ to, message }) {
  return sendPhilSms(to, message);
}

// Backward-compat alias
async function sendPhilSMS({ to, message }) {
  return sendPhilSms(to, message);
}

module.exports = { sendEmail, sendSMS, sendPhilSMS };
