import { randomBytes } from 'node:crypto';

/**
 * מזהים קצרים וקריאים ללינקים. אלפבית בלי תווים מתבלבלים (0/O, 1/l/I)
 * כדי שאפשר יהיה להכתיב אותם בטלפון.
 */
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

export function shortId(length = 8): string {
  const bytes = randomBytes(length);
  let out = '';
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return out;
}

/** טוקן הטבח — ארוך יותר, כי הוא זה שמגן על הדשבורד. */
export function cookToken(): string {
  return shortId(24);
}
