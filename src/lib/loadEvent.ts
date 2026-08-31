import { getStore } from './store';
import { isLegacyEvent, resolveEvent, type Household, type StoredEvent } from './model';
import type { MealEvent } from '@/core/types';

/** אירוע שנוצר לפני מודל משקי הבית ואינו ניתן לפענוח בגרסה הנוכחית. */
export class LegacyEventError extends Error {
  constructor() {
    super('הארוחה הזו נוצרה בגרסה קודמת של המערכת. פתח ארוחה חדשה מתוך הקבוצה שלך.');
  }
}

export interface LoadedEvent {
  stored: StoredEvent;
  household: Household;
  /** האירוע בצורה שמנוע ההתאמה מקבל. */
  resolved: MealEvent;
}

/**
 * טעינת אירוע יחד עם משק הבית שלו. ההעדפות חיות במשק הבית, אז כל
 * תצוגה של אירוע דורשת את שניהם — וכך גם עדכון של אדם משתקף מיד בכל
 * הארוחות העתידיות שהוא מוזמן אליהן.
 */
export async function loadEvent(eventId: string): Promise<LoadedEvent | null> {
  const store = getStore();
  const stored = await store.events.get(eventId);
  if (!stored) return null;
  if (isLegacyEvent(stored)) throw new LegacyEventError();

  const household = await store.households.get(stored.householdId);
  if (!household) return null;

  return { stored, household, resolved: resolveEvent(household, stored) };
}
