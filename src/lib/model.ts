import type { Dish, MealEvent, Participant } from '@/core/types';

/**
 * מודל האחסון של M2.
 *
 * ההעדפות של סבתא לא משתנות בין ארוחה לארוחה — הן נתון של אדם, לא של
 * אירוע. לכן הן חיות במשק הבית, וארוחה היא רק "מי מהם מגיע הפעם ומה
 * מבשלים". התוצאה: פותחים ארוחה חדשה ומקבלים דוח כיסוי מיידי, בלי
 * לרדוף אחרי אף אחד בוואטסאפ.
 */

/** אדם קבוע במשק הבית. זהה במבנה ל-Participant שהמנוע מקבל. */
export type Person = Participant;

export interface Household {
  id: string;
  /** סוד שמקנה גישה לניהול משק הבית ולפתיחת ארוחות. */
  ownerToken: string;
  name: string;
  people: Person[];
  createdAt: string;
}

export interface StoredEvent {
  id: string;
  householdId: string;
  cookToken: string;
  title: string;
  date?: string;
  /** מזהי האנשים שמגיעים. תת-קבוצה של אנשי משק הבית. */
  attendeeIds: string[];
  dishes: Dish[];
  minDishesPerPerson: number;
  minMainsPerPerson: number;
  createdAt: string;
}

/**
 * חיבור אירוע שמור עם משק הבית שלו, לצורה שמנוע ההתאמה מקבל.
 *
 * אדם שהוסר ממשק הבית אחרי שכבר סומן כמגיע פשוט נושר מהרשימה — עדיף
 * מלהחזיק רשומה יתומה שתופיע בדוח הכיסוי בלי העדפות.
 */
export function resolveEvent(household: Household, stored: StoredEvent): MealEvent {
  const byId = new Map(household.people.map((p) => [p.id, p]));
  const participants = stored.attendeeIds
    .map((id) => byId.get(id))
    .filter((p): p is Person => p !== undefined);

  return {
    id: stored.id,
    cookToken: stored.cookToken,
    title: stored.title,
    date: stored.date,
    participants,
    dishes: stored.dishes,
    minDishesPerPerson: stored.minDishesPerPerson,
    minMainsPerPerson: stored.minMainsPerPerson,
    createdAt: stored.createdAt,
  };
}

/**
 * אירוע מהגרסה שלפני משקי הבית, שבה ההעדפות ישבו בתוך האירוע עצמו.
 * מזוהה כדי להחזיר הודעה מובנת במקום להתרסק על שדה חסר.
 */
export function isLegacyEvent(row: unknown): boolean {
  return (
    !!row &&
    typeof row === 'object' &&
    !('householdId' in row) &&
    'participants' in row
  );
}
