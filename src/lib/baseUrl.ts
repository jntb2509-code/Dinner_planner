/**
 * הכתובת שממנה נבנים הלינקים לשיתוף.
 *
 * לא משתמשים ב-window.location.origin כברירת מחדל, כי לטבח קל להגיע
 * לכתובת של פריסה ספציפית (למשל בלחיצה על Visit מתוך עמוד הפריסה
 * ב-Vercel). כתובות כאלה מוגנות בדרישת התחברות, ולינק שנבנה מהן
 * ידרוש מכל בן משפחה להתחבר ל-Vercel — כלומר ישבור את כל הרעיון.
 *
 * סדר העדיפויות:
 * 1. NEXT_PUBLIC_BASE_URL — הגדרה מפורשת, גוברת על הכל.
 * 2. כתובת הייצור ש-Vercel חושפת אוטומטית.
 * 3. הכתובת הנוכחית בדפדפן — נכון בפיתוח מקומי.
 */
export function shareBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (explicit) return normalize(explicit);

  const production = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return normalize(production);

  return typeof window === 'undefined' ? '' : window.location.origin;
}

function normalize(value: string): string {
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withScheme.replace(/\/+$/, '');
}
