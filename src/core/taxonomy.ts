import type { Diet, Tag, TagId } from './types';

/**
 * הטקסונומיה — אוצר מילים סגור והיררכי של מרכיבים.
 *
 * ההיררכיה היא מה שגורם להתאמה לעבוד: מי שחוסם "אגוזים" חוסם אוטומטית
 * את כל סוגי האגוזים, בלי למנות אותם אחד-אחד.
 *
 * שים לב: בוטנים אינם תחת "אגוזים" — אלרגיה לבוטנים ואלרגיה לאגוזי עץ
 * הן שתי אלרגיות נפרדות, ומיזוג שלהן היה יוצר חסימות שגויות לשני הכיוונים.
 */
export const TAGS: Tag[] = [
  // ---------- חלבון מן החי ----------
  { id: 'meat', he: 'בשר', kind: 'protein', common: true },
  { id: 'beef', he: 'בקר', parent: 'meat', kind: 'protein', common: true },
  { id: 'lamb', he: 'כבש', parent: 'meat', kind: 'protein', common: true },
  { id: 'pork', he: 'חזיר', parent: 'meat', kind: 'protein' },
  { id: 'poultry', he: 'עוף והודו', parent: 'meat', kind: 'protein', common: true },
  { id: 'chicken', he: 'עוף', parent: 'poultry', kind: 'protein', common: true },
  { id: 'turkey', he: 'הודו', parent: 'poultry', kind: 'protein' },
  { id: 'processed-meat', he: 'בשר מעובד (נקניק, קבב תעשייתי)', parent: 'meat', kind: 'protein' },
  { id: 'organ-meat', he: 'איברים פנימיים (כבד, לב)', parent: 'meat', kind: 'protein' },

  { id: 'fish', he: 'דגים', kind: 'protein', common: true },
  { id: 'salmon', he: 'סלמון', parent: 'fish', kind: 'protein' },
  { id: 'tuna', he: 'טונה', parent: 'fish', kind: 'protein' },
  { id: 'white-fish', he: 'דג לבן', parent: 'fish', kind: 'protein' },

  { id: 'seafood', he: 'פירות ים', kind: 'protein', common: true },
  { id: 'shrimp', he: 'שרימפס', parent: 'seafood', kind: 'protein' },
  { id: 'calamari', he: 'קלמארי', parent: 'seafood', kind: 'protein' },
  { id: 'shellfish', he: 'צדפות', parent: 'seafood', kind: 'protein' },

  { id: 'egg', he: 'ביצים', kind: 'protein', common: true },

  // ---------- חלב ----------
  { id: 'dairy', he: 'חלב ומוצריו', kind: 'dairy', common: true },
  { id: 'milk', he: 'חלב', parent: 'dairy', kind: 'dairy' },
  { id: 'hard-cheese', he: 'גבינה צהובה/קשה', parent: 'dairy', kind: 'dairy', common: true },
  { id: 'soft-cheese', he: 'גבינה לבנה/רכה', parent: 'dairy', kind: 'dairy', common: true },
  { id: 'blue-cheese', he: 'גבינת עובש', parent: 'dairy', kind: 'dairy' },
  { id: 'yogurt', he: 'יוגורט', parent: 'dairy', kind: 'dairy' },
  { id: 'cream', he: 'שמנת', parent: 'dairy', kind: 'dairy' },
  { id: 'butter', he: 'חמאה', parent: 'dairy', kind: 'dairy' },

  // ---------- דגנים ופחמימות ----------
  { id: 'gluten', he: 'גלוטן', kind: 'grain', common: true },
  { id: 'wheat', he: 'חיטה', parent: 'gluten', kind: 'grain' },
  { id: 'bread', he: 'לחם', parent: 'wheat', kind: 'grain' },
  { id: 'pasta', he: 'פסטה', parent: 'wheat', kind: 'grain' },
  { id: 'couscous', he: 'קוסקוס', parent: 'wheat', kind: 'grain' },
  { id: 'bulgur', he: 'בורגול', parent: 'wheat', kind: 'grain' },
  { id: 'barley', he: 'שעורה', parent: 'gluten', kind: 'grain' },
  { id: 'rye', he: 'שיפון', parent: 'gluten', kind: 'grain' },
  { id: 'oats', he: 'שיבולת שועל', kind: 'grain' },
  { id: 'rice', he: 'אורז', kind: 'grain', common: true },
  { id: 'quinoa', he: 'קינואה', kind: 'grain' },
  { id: 'potato', he: 'תפוח אדמה', kind: 'grain', common: true },
  { id: 'sweet-potato', he: 'בטטה', kind: 'grain' },
  { id: 'corn', he: 'תירס', kind: 'grain' },

  // ---------- קטניות ----------
  { id: 'legumes', he: 'קטניות', kind: 'protein', common: true },
  { id: 'chickpea', he: 'חומוס (גרגרי)', parent: 'legumes', kind: 'protein' },
  { id: 'lentil', he: 'עדשים', parent: 'legumes', kind: 'protein' },
  { id: 'beans', he: 'שעועית', parent: 'legumes', kind: 'protein' },
  { id: 'peas', he: 'אפונה', parent: 'legumes', kind: 'protein' },
  { id: 'soy', he: 'סויה', parent: 'legumes', kind: 'protein', common: true },
  { id: 'tofu', he: 'טופו', parent: 'soy', kind: 'protein' },
  { id: 'peanut', he: 'בוטנים', kind: 'nut', common: true },

  // ---------- אגוזים וזרעים ----------
  { id: 'nuts', he: 'אגוזים', kind: 'nut', common: true },
  { id: 'almond', he: 'שקדים', parent: 'nuts', kind: 'nut' },
  { id: 'walnut', he: 'אגוז מלך', parent: 'nuts', kind: 'nut' },
  { id: 'pecan', he: 'פקאן', parent: 'nuts', kind: 'nut' },
  { id: 'cashew', he: 'קשיו', parent: 'nuts', kind: 'nut' },
  { id: 'pistachio', he: 'פיסטוק', parent: 'nuts', kind: 'nut' },
  { id: 'hazelnut', he: 'אגוז לוז', parent: 'nuts', kind: 'nut' },
  { id: 'sesame', he: 'שומשום וטחינה', kind: 'nut', common: true },
  { id: 'sunflower-seed', he: 'גרעיני חמנייה', kind: 'nut' },

  // ---------- ירקות ----------
  { id: 'onion', he: 'בצל', kind: 'vegetable', common: true },
  { id: 'garlic', he: 'שום', kind: 'vegetable', common: true },
  { id: 'tomato', he: 'עגבנייה', kind: 'vegetable', common: true },
  { id: 'cucumber', he: 'מלפפון', kind: 'vegetable' },
  { id: 'eggplant', he: 'חציל', kind: 'vegetable', common: true },
  { id: 'zucchini', he: 'קישוא', kind: 'vegetable' },
  { id: 'pepper', he: 'פלפל', kind: 'vegetable' },
  { id: 'mushroom', he: 'פטריות', kind: 'vegetable', common: true },
  { id: 'cilantro', he: 'כוסברה', kind: 'vegetable', common: true },
  { id: 'parsley', he: 'פטרוזיליה', kind: 'vegetable' },
  { id: 'olive', he: 'זיתים', kind: 'vegetable', common: true },
  { id: 'cabbage', he: 'כרוב', kind: 'vegetable' },
  { id: 'cauliflower', he: 'כרובית', kind: 'vegetable' },
  { id: 'broccoli', he: 'ברוקולי', kind: 'vegetable' },
  { id: 'beet', he: 'סלק', kind: 'vegetable' },
  { id: 'carrot', he: 'גזר', kind: 'vegetable' },
  { id: 'pumpkin', he: 'דלעת', kind: 'vegetable' },
  { id: 'leafy-greens', he: 'עלים ירוקים', kind: 'vegetable' },

  // ---------- פירות ----------
  { id: 'citrus', he: 'הדרים', kind: 'fruit' },
  { id: 'banana', he: 'בננה', kind: 'fruit' },
  { id: 'apple', he: 'תפוח', kind: 'fruit' },
  { id: 'berries', he: 'פירות יער', kind: 'fruit' },
  { id: 'avocado', he: 'אבוקדו', kind: 'fruit', common: true },
  { id: 'dates', he: 'תמרים', kind: 'fruit' },
  { id: 'coconut', he: 'קוקוס', kind: 'fruit' },

  // ---------- אחר ----------
  { id: 'spicy', he: 'חריף', kind: 'other', common: true },
  { id: 'honey', he: 'דבש', kind: 'other' },
  { id: 'alcohol', he: 'אלכוהול', kind: 'other' },
  { id: 'mayo', he: 'מיונז', kind: 'other' },
  { id: 'vinegar', he: 'חומץ', kind: 'other' },
];

export const TAG_BY_ID: ReadonlyMap<TagId, Tag> = new Map(TAGS.map((t) => [t.id, t]));

export function tagName(id: TagId): string {
  return TAG_BY_ID.get(id)?.he ?? id;
}

/** ילדים ישירים לכל תגית — נבנה פעם אחת. */
const CHILDREN = new Map<TagId, TagId[]>();
for (const tag of TAGS) {
  if (!tag.parent) continue;
  const list = CHILDREN.get(tag.parent);
  if (list) list.push(tag.id);
  else CHILDREN.set(tag.parent, [tag.id]);
}

/** תגית + כל צאצאיה, בכל עומק. */
export function descendantsOf(id: TagId): TagId[] {
  const out: TagId[] = [];
  const stack = [id];
  while (stack.length) {
    const current = stack.pop()!;
    out.push(current);
    const kids = CHILDREN.get(current);
    if (kids) stack.push(...kids);
  }
  return out;
}

/** תגית + כל אבותיה עד השורש. */
export function ancestorsOf(id: TagId): TagId[] {
  const out: TagId[] = [];
  let current: TagId | undefined = id;
  const seen = new Set<TagId>();
  while (current && !seen.has(current)) {
    seen.add(current);
    out.push(current);
    current = TAG_BY_ID.get(current)?.parent;
  }
  return out;
}

/**
 * הרחבת קבוצת תגיות כלפי מטה בהיררכיה.
 * חסימת "אגוזים" => חסימת שקדים, פקאן, קשיו...
 */
export function expandDown(ids: Iterable<TagId>): Set<TagId> {
  const out = new Set<TagId>();
  for (const id of ids) for (const d of descendantsOf(id)) out.add(d);
  return out;
}

/**
 * הרחבת תגיות של מנה כלפי מעלה.
 * מנה שמתויגת "גבינה צהובה" נחשבת גם כמכילה "חלב ומוצריו".
 */
export function expandUp(ids: Iterable<TagId>): Set<TagId> {
  const out = new Set<TagId>();
  for (const id of ids) for (const a of ancestorsOf(id)) out.add(a);
  return out;
}

/**
 * דיאטות — קיצורי דרך שמתרחבים לתגיות חסומות ולכללים.
 * המנוע עצמו לא יודע מה זה "טבעוני"; הוא מקבל רק סט מורחב.
 */
export const DIETS: Diet[] = [
  {
    id: 'vegetarian',
    he: 'צמחוני',
    blocks: ['meat', 'fish', 'seafood'],
  },
  {
    id: 'vegan',
    he: 'טבעוני',
    blocks: ['meat', 'fish', 'seafood', 'dairy', 'egg', 'honey'],
  },
  {
    id: 'pescatarian',
    he: 'פסקטריאני (דגים כן, בשר לא)',
    blocks: ['meat'],
  },
  {
    id: 'kosher',
    he: 'כשר',
    note: 'חוסם חזיר ופירות ים, ומונע מנות שמערבבות בשר וחלב.',
    blocks: ['pork', 'seafood'],
    rules: ['no-meat-dairy-mix'],
  },
  {
    id: 'gluten-free',
    he: 'ללא גלוטן',
    blocks: ['gluten'],
  },
  {
    id: 'lactose-free',
    he: 'ללא לקטוז',
    blocks: ['dairy'],
  },
  {
    id: 'no-legumes-passover',
    he: 'ללא קטניות',
    blocks: ['legumes'],
  },
];

export const DIET_BY_ID: ReadonlyMap<string, Diet> = new Map(DIETS.map((d) => [d.id, d]));
