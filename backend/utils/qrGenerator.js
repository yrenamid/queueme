// QR code and slug utilities for business public URLs
const QRCode = require('qrcode');
const crypto = require('crypto');


// Generate a URL-friendly slug from a name
function generateSlug(name) {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .substring(0, 100);
}


// Build public customer URL for a business
function buildBusinessPublicUrl(baseUrl, slug) {

  return `${baseUrl.replace(/\/$/, '')}/customer/${slug}`;
}


// Generate a DataURL QR image for the business public URL
async function generateBusinessQRCode({ baseUrl, slug, urlOverride }) {
  const url = urlOverride || buildBusinessPublicUrl(baseUrl, slug);
  const qrImage = await QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 2, width: 300 });
  return { url, image: qrImage };
}


// Ensure slug uniqueness by appending random suffixes if needed
function ensureUniqueSlug(baseSlug, existingChecker) {
  let slug = baseSlug;
  let counter = 0;
  while (existingChecker(slug)) {
    const rand = crypto.randomBytes(2).toString('hex');
    slug = `${baseSlug}-${rand}`;
    if (++counter > 5) break; // prevent endless loop
  }
  return slug;
}

module.exports = { generateSlug, generateBusinessQRCode, ensureUniqueSlug, buildBusinessPublicUrl };
