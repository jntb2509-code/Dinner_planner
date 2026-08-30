/**
 * מודל הנתונים של המערכת.
 *
 * העיקרון המרכזי: העדפה היא לא בוליאנית. יש שלוש דרגות שמתנהגות שונה
 * לגמרי באלגוריתם — חסימה מוחלטת (אלרגיה/כשרות/אורח חיים), "לא אוהב"
 * (רצוי להימנע), ו"אוהב במיוחד" (בונוס בלבד).
 */

export type TagId = string;

export type TagKind =
  | 'protein'
  | 'dairy'
  | 'grain'
  | 'vegetable'
  | 'fruit'
  | 'nut'
  | 'other';

export interface Tag {
  id: TagId;
  he: string;
  /** תגית אב בהיררכיה. חסימה של אב חוסמת אוטומטית את כל צאצאיו. */
  parent?: TagId;
  kind: TagKind;
  /** האם להציג ברשימה המהירה בטופס המשתתף. */
  common?: boolean;
}

/** אילוץ שאינו "מרכיב אסור" אלא כלל על צירוף מרכיבים. */
export type DietRule = 'no-meat-dairy-mix';

export interface DietId {
  id: string;
}

/** הגדרת דיאטה — מתרחבת לתגיות חסומות + כללים. */
export interface Diet {
  id: string;
  he: string;
  note?: string;
  blocks: TagId[];
  rules?: DietRule[];
}

export interface Participant {
  id: string;
  name: string;
  /** מזהי דיאטות שנבחרו (צמחוני, כשר, ללא גלוטן...). */
  diets: string[];
  /** תגיות שהמשתתף חוסם ידנית — אלרגיה או סירוב מוחלט. */
  blocked: TagId[];
  /** תגיות שהמשתתף לא אוהב, אבל יכול לשבת לידן. */
  disliked: TagId[];
  /** תגיות שהמשתתף אוהב במיוחד. */
  loved: TagId[];
  /** טקסט חופשי — מוצג לטבח, לא נכנס לאלגוריתם. */
  notes?: string;
  updatedAt: string;
}

export interface Dish {
  id: string;
  name: string;
  /** מרכיבי המנה, כתגיות מהטקסונומיה. */
  tags: TagId[];
  /**
   * מרכיבים שייתכן שנמצאים במנה (״עלול להכיל״). מיועד בעיקר לאלרגיות —
   * מנה כזו תסומן כלא-ודאית ולא תיספר ככיסוי בטוח.
   */
  mayContain?: TagId[];
  /** מנה משביעה (עיקרית) — להבדיל מסלט, לחם או תוספת. */
  isMain: boolean;
  notes?: string;
}

export interface MealEvent {
  id: string;
  /** סוד שנדרש כדי לגשת לתצוגת הטבח. */
  cookToken: string;
  title: string;
  date?: string;
  participants: Participant[];
  dishes: Dish[];
  /** כמה מנות בטוחות נדרשות לכל משתתף. */
  minDishesPerPerson: number;
  /** כמה מהן חייבות להיות מנות עיקריות. */
  minMainsPerPerson: number;
  createdAt: string;
}

/** מצב מנה עבור משתתף מסוים. */
export type DishStatus = 'loved' | 'ok' | 'disliked' | 'uncertain' | 'blocked';

export interface DishVerdict {
  status: DishStatus;
  /** תגיות/כללים שגרמו לחסימה או לאי-אהבה — להצגה לטבח. */
  blockedBy: string[];
  dislikedBy: string[];
  lovedBy: string[];
  uncertainBy: string[];
}

export interface ParticipantCoverage {
  participantId: string;
  name: string;
  /** מנות שהמשתתף יכול לאכול בוודאות (loved/ok/disliked). */
  safeDishIds: string[];
  /** מתוכן, אלה שהוא גם אוהב או ניטרלי כלפיהן. */
  goodDishIds: string[];
  safeMainDishIds: string[];
  uncertainDishIds: string[];
  blockedDishIds: string[];
  /** האם עומד בסף המינימלי שהוגדר לאירוע. */
  ok: boolean;
  /** למה לא — להצגה כהתראה. */
  problems: string[];
}

export interface CoverageReport {
  perParticipant: ParticipantCoverage[];
  /** משתתפים שאינם עומדים בסף. */
  uncovered: ParticipantCoverage[];
  allCovered: boolean;
}
