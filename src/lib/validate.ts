import { DIET_BY_ID, TAG_BY_ID } from '@/core/taxonomy';
import type { Dish, Participant, TagId } from '@/core/types';

/**
 * הקלט מגיע מדפדפן של בן משפחה, אבל הלינק ציבורי — אז מנקים אותו
 * כמו כל קלט לא אמין. חשוב לא פחות: תגית שלא קיימת בטקסונומיה נזרקת
 * במקום להישמר, אחרת המנוע היה שותק עליה והמשתתף היה חושב שהוא מוגן.
 */

const MAX_NAME = 60;
const MAX_NOTES = 500;
const MAX_TAGS = 60;
const MAX_DISHES = 60;

export class ValidationError extends Error {}

function text(value: unknown, max: number, field: string, required = true): string {
  if (typeof value !== 'string') {
    if (!required) return '';
    throw new ValidationError(`${field} חסר`);
  }
  const trimmed = value.trim();
  if (required && !trimmed) throw new ValidationError(`${field} חסר`);
  return trimmed.slice(0, max);
}

function tagList(value: unknown, field: string): TagId[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new ValidationError(`${field} אינו רשימה`);
  const seen = new Set<TagId>();
  for (const item of value.slice(0, MAX_TAGS)) {
    if (typeof item === 'string' && TAG_BY_ID.has(item)) seen.add(item);
  }
  return [...seen];
}

function dietList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const item of value.slice(0, 20)) {
    if (typeof item === 'string' && DIET_BY_ID.has(item)) seen.add(item);
  }
  return [...seen];
}

export function parseParticipant(body: unknown, id: string): Participant {
  if (!body || typeof body !== 'object') throw new ValidationError('גוף הבקשה אינו תקין');
  const raw = body as Record<string, unknown>;
  return {
    id,
    name: text(raw.name, MAX_NAME, 'שם'),
    diets: dietList(raw.diets),
    blocked: tagList(raw.blocked, 'חסימות'),
    disliked: tagList(raw.disliked, 'לא אוהב'),
    loved: tagList(raw.loved, 'אוהב'),
    notes: text(raw.notes, MAX_NOTES, 'הערות', false) || undefined,
    updatedAt: new Date().toISOString(),
  };
}

export function parseDishes(body: unknown): Dish[] {
  if (!body || typeof body !== 'object') throw new ValidationError('גוף הבקשה אינו תקין');
  const raw = (body as Record<string, unknown>).dishes;
  if (!Array.isArray(raw)) throw new ValidationError('רשימת המנות חסרה');

  const dishes: Dish[] = [];
  const usedIds = new Set<string>();
  for (const item of raw.slice(0, MAX_DISHES)) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;
    const name = text(entry.name, MAX_NAME, 'שם מנה');
    let id = typeof entry.id === 'string' && entry.id ? entry.id.slice(0, 40) : `d${dishes.length}`;
    while (usedIds.has(id)) id = `${id}_`;
    usedIds.add(id);
    dishes.push({
      id,
      name,
      tags: tagList(entry.tags, 'מרכיבים'),
      mayContain: tagList(entry.mayContain, 'עלול להכיל'),
      isMain: entry.isMain !== false,
      notes: text(entry.notes, MAX_NOTES, 'הערות מנה', false) || undefined,
    });
  }
  return dishes;
}

/**
 * השוואת טוקנים בזמן קבוע. הפרש זמן בהשוואת מחרוזות רגילה הוא דליפה
 * תיאורטית כאן, אבל זה זול מספיק כדי פשוט לא להשאיר אותה פתוחה.
 */
export function tokenMatches(expected: string, provided: string | null): boolean {
  if (!provided || expected.length !== provided.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  return diff === 0;
}
