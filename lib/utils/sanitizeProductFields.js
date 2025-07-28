// lib/sanitize/sanitizeProductFields.js
import sanitizeHtml from 'sanitize-html';

export function sanitizeProductFields(input) {
  return {
    name: sanitizeText(input.name),
    description: sanitizeHtml(input.description || '', {
      allowedTags: [],
      allowedAttributes: {},
    }),
    price: sanitizeNumber(input.price),
    stock: sanitizeInteger(input.stock),
    image_url: sanitizeUrl(input.image_url),
    image_public_id: sanitizeText(input.image_public_id),
    category: sanitizeText(input.category),
    is_active: input.is_active === 1 ? 1 : 0,
    is_favorite: input.is_favorite === 1 ? 1 : 0,
  };
}

function sanitizeText(text) {
  return String(text || '').trim().slice(0, 255);
}

function sanitizeNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) || num < 0 ? 0 : num;
}

function sanitizeInteger(value) {
  const int = parseInt(value, 10);
  return isNaN(int) || int < 0 ? 0 : int;
}

function sanitizeUrl(url) {
  try {
    const u = new URL(url);
    return u.href;
  } catch {
    return '';
  }
}

