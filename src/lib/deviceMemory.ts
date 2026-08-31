'use client';

/**
 * זיכרון המכשיר.
 *
 * אין הרשמה ואין סיסמאות — הגישה היא דרך לינקים סודיים. הבעיה בכך היא
 * שהמארגן הופך למנהל לינקים: ארבע כתובות שונות, בלי מקום שמרכז אותן,
 * ואובדן לינק פירושו אובדן גישה.
 *
 * הפתרון: המכשיר זוכר. הכתובת הראשית הופכת ללוח בקרה אישי, והלינק
 * הפרטי נשאר גיבוי במקום להיות ממשק המשתמש.
 *
 * מגבלה שחשוב להכיר: זיכרון מכשיר אינו חשבון. ניקוי הדפדפן או מעבר
 * למכשיר אחר מאבדים אותו, ולכן הלינק הפרטי עדיין מוצג בהגדרות הקבוצה
 * כדי שאפשר יהיה לשמור אותו בצד.
 */

const OWNED_KEY = 'dp:owned';
const MEMBER_KEY = 'dp:memberships';

export interface OwnedHousehold {
  id: string;
  name: string;
  ownerToken: string;
}

export interface Membership {
  householdId: string;
  name: string;
  personId: string;
}

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    // localStorage חסום (גלישה פרטית) או תוכן פגום — מתנהגים כמו ריק.
    return [];
  }
}

function write<T>(key: string, value: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // אין לאן לשמור. האפליקציה עדיין עובדת דרך הלינקים עצמם.
  }
}

export function ownedHouseholds(): OwnedHousehold[] {
  return read<OwnedHousehold>(OWNED_KEY);
}

export function rememberOwned(entry: OwnedHousehold): void {
  const rest = ownedHouseholds().filter((h) => h.id !== entry.id);
  write(OWNED_KEY, [entry, ...rest]);
}

export function forgetOwned(id: string): void {
  write(OWNED_KEY, ownedHouseholds().filter((h) => h.id !== id));
}

export function memberships(): Membership[] {
  return read<Membership>(MEMBER_KEY);
}

export function membershipIn(householdId: string): Membership | null {
  return memberships().find((m) => m.householdId === householdId) ?? null;
}

export function rememberMembership(entry: Membership): void {
  const rest = memberships().filter((m) => m.householdId !== entry.householdId);
  write(MEMBER_KEY, [entry, ...rest]);
}

export function forgetMembership(householdId: string): void {
  write(MEMBER_KEY, memberships().filter((m) => m.householdId !== householdId));
}

/** ההעדפות האחרונות שמולאו — ממלאות מראש הצטרפות לקבוצה נוספת. */
const PROFILE_KEY = 'dp:profile';

export function lastProfile<T>(): T | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function rememberProfile(profile: unknown): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // כנ"ל — לא קריטי, ההעדפות נשמרו בשרת.
  }
}
