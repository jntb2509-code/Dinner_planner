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
  // ======================= חלבון מן החי =======================
  { id: 'meat', he: 'בשר', kind: 'protein', common: true },
  { id: 'beef', he: 'בקר', parent: 'meat', kind: 'protein', common: true },
  { id: 'veal', he: 'עגל', parent: 'meat', kind: 'protein' },
  { id: 'lamb', he: 'כבש', parent: 'meat', kind: 'protein', common: true },
  { id: 'pork', he: 'חזיר', parent: 'meat', kind: 'protein' },
  { id: 'poultry', he: 'עוף והודו', parent: 'meat', kind: 'protein', common: true },
  { id: 'chicken', he: 'עוף', parent: 'poultry', kind: 'protein', common: true },
  { id: 'turkey', he: 'הודו', parent: 'poultry', kind: 'protein' },
  { id: 'duck', he: 'ברווז', parent: 'poultry', kind: 'protein' },
  { id: 'processed-meat', he: 'בשר מעובד (נקניק, קבב תעשייתי)', parent: 'meat', kind: 'protein' },
  { id: 'organ-meat', he: 'איברים פנימיים', parent: 'meat', kind: 'protein' },
  { id: 'liver', he: 'כבד', parent: 'organ-meat', kind: 'protein' },

  { id: 'fish', he: 'דגים', kind: 'protein', common: true },
  { id: 'salmon', he: 'סלמון', parent: 'fish', kind: 'protein' },
  { id: 'tuna', he: 'טונה', parent: 'fish', kind: 'protein' },
  { id: 'white-fish', he: 'דג לבן', parent: 'fish', kind: 'protein' },
  { id: 'sea-bass', he: 'לברק', parent: 'white-fish', kind: 'protein' },
  { id: 'denis', he: 'דניס', parent: 'white-fish', kind: 'protein' },
  { id: 'trout', he: 'פורל', parent: 'fish', kind: 'protein' },
  { id: 'sardine', he: 'סרדינים', parent: 'fish', kind: 'protein' },
  { id: 'herring', he: 'הרינג ומטיאס', parent: 'fish', kind: 'protein' },
  { id: 'anchovy', he: 'אנשובי', parent: 'fish', kind: 'protein' },

  // האיחוד האירופי מפריד סרטנים מרכיכות — שתי אלרגיות נפרדות, ואדם
  // יכול להיות אלרגי לאחת ולא לאחרת.
  { id: 'seafood', he: 'פירות ים', kind: 'protein', common: true },
  { id: 'crustacean', he: 'סרטנים', parent: 'seafood', kind: 'protein' },
  { id: 'shrimp', he: 'שרימפס', parent: 'crustacean', kind: 'protein' },
  { id: 'crab', he: 'סרטן', parent: 'crustacean', kind: 'protein' },
  { id: 'lobster', he: 'לובסטר', parent: 'crustacean', kind: 'protein' },
  { id: 'mollusc', he: 'רכיכות', parent: 'seafood', kind: 'protein' },
  { id: 'calamari', he: 'קלמארי', parent: 'mollusc', kind: 'protein' },
  { id: 'octopus', he: 'תמנון', parent: 'mollusc', kind: 'protein' },
  { id: 'shellfish', he: 'צדפות', parent: 'mollusc', kind: 'protein' },
  { id: 'mussels', he: 'מולים', parent: 'mollusc', kind: 'protein' },

  { id: 'egg', he: 'ביצים', kind: 'protein', common: true },

  // ======================= חלב =======================
  // מפוצל לפי מקור החי ולא רק לפי סוג המוצר: רבים שרגישים לחלב פרה
  // מסתדרים היטב עם עזים וכבשים, וללא ההפרדה אי אפשר לבטא את זה.
  { id: 'dairy', he: 'חלב ומוצריו', kind: 'dairy', common: true },

  { id: 'cow-dairy', he: 'מוצרי חלב פרה', parent: 'dairy', kind: 'dairy', common: true },
  { id: 'milk', he: 'חלב', parent: 'cow-dairy', kind: 'dairy' },
  { id: 'hard-cheese', he: 'גבינה צהובה/קשה', parent: 'cow-dairy', kind: 'dairy', common: true },
  { id: 'soft-cheese', he: 'גבינה לבנה/רכה', parent: 'cow-dairy', kind: 'dairy', common: true },
  { id: 'blue-cheese', he: 'גבינת עובש', parent: 'cow-dairy', kind: 'dairy' },
  { id: 'yogurt', he: 'יוגורט', parent: 'cow-dairy', kind: 'dairy' },
  { id: 'cream', he: 'שמנת', parent: 'cow-dairy', kind: 'dairy' },
  { id: 'butter', he: 'חמאה', parent: 'cow-dairy', kind: 'dairy' },

  { id: 'goat-dairy', he: 'מוצרי חלב עזים', parent: 'dairy', kind: 'dairy', common: true },
  { id: 'goat-cheese', he: 'גבינת עזים', parent: 'goat-dairy', kind: 'dairy' },
  { id: 'goat-yogurt', he: 'יוגורט עזים', parent: 'goat-dairy', kind: 'dairy' },

  { id: 'sheep-dairy', he: 'מוצרי חלב כבשים', parent: 'dairy', kind: 'dairy' },
  { id: 'feta', he: 'פטה', parent: 'sheep-dairy', kind: 'dairy' },
  { id: 'sheep-yogurt', he: 'יוגורט כבשים', parent: 'sheep-dairy', kind: 'dairy' },

  // ======================= דגנים ופחמימות =======================
  { id: 'gluten', he: 'גלוטן', kind: 'grain', common: true },
  { id: 'wheat', he: 'חיטה', parent: 'gluten', kind: 'grain' },
  { id: 'bread', he: 'לחם', parent: 'wheat', kind: 'grain', common: true },
  { id: 'pasta', he: 'פסטה', parent: 'wheat', kind: 'grain' },
  { id: 'couscous', he: 'קוסקוס', parent: 'wheat', kind: 'grain' },
  { id: 'bulgur', he: 'בורגול', parent: 'wheat', kind: 'grain' },
  { id: 'freekeh', he: 'פריקה', parent: 'wheat', kind: 'grain' },
  { id: 'semolina', he: 'סולת', parent: 'wheat', kind: 'grain' },
  { id: 'spelt', he: 'כוסמין', parent: 'wheat', kind: 'grain' },
  { id: 'barley', he: 'שעורה', parent: 'gluten', kind: 'grain' },
  { id: 'pearl-barley', he: 'גריסי פנינה', parent: 'barley', kind: 'grain' },
  { id: 'rye', he: 'שיפון', parent: 'gluten', kind: 'grain' },
  // שיבולת שועל אינה מכילה גלוטן מטבעה, אבל כמעט תמיד מעובדת יחד עם
  // חיטה. משויכת לגלוטן בכוונה: עדיף לחסום מנה שאולי הייתה בטוחה
  // מאשר להגיש שיבולת שועל למי שחוסם גלוטן.
  { id: 'oats', he: 'שיבולת שועל', parent: 'gluten', kind: 'grain' },

  { id: 'rice', he: 'אורז', kind: 'grain', common: true },
  { id: 'rice-milk', he: 'משקה אורז', parent: 'rice', kind: 'grain' },
  { id: 'quinoa', he: 'קינואה', kind: 'grain' },
  // כוסמת אינה קרובת משפחה של חיטה ואינה מכילה גלוטן, למרות השם.
  { id: 'buckwheat', he: 'כוסמת', kind: 'grain' },
  { id: 'millet', he: 'דוחן', kind: 'grain' },
  { id: 'amaranth', he: 'אמרנט', kind: 'grain' },
  { id: 'potato', he: 'תפוח אדמה', kind: 'grain', common: true },
  { id: 'sweet-potato', he: 'בטטה', kind: 'grain' },
  { id: 'corn', he: 'תירס', kind: 'grain' },

  // ======================= קטניות =======================
  { id: 'legumes', he: 'קטניות', kind: 'protein', common: true },
  { id: 'chickpea', he: 'חומוס (גרגרי)', parent: 'legumes', kind: 'protein', common: true },
  { id: 'lentil', he: 'עדשים', parent: 'legumes', kind: 'protein' },
  { id: 'beans', he: 'שעועית יבשה', parent: 'legumes', kind: 'protein' },
  { id: 'peas', he: 'אפונה', parent: 'legumes', kind: 'protein' },
  { id: 'mung', he: 'מאש', parent: 'legumes', kind: 'protein' },
  // פול נפרד ומסומן במפורש: פאביזם (רגישות G6PD) נפוץ במיוחד באגן
  // הים התיכון ובמזרח התיכון, והתגובה היא רפואית ולא עניין של טעם.
  { id: 'fava', he: 'פול', parent: 'legumes', kind: 'protein', common: true },
  { id: 'lupin', he: 'תורמוס', parent: 'legumes', kind: 'protein' },
  { id: 'soy', he: 'סויה', parent: 'legumes', kind: 'protein', common: true },
  { id: 'tofu', he: 'טופו', parent: 'soy', kind: 'protein' },
  { id: 'edamame', he: 'אדממה', parent: 'soy', kind: 'protein' },
  { id: 'soy-milk', he: 'משקה סויה', parent: 'soy', kind: 'protein' },
  // בוטנים אינם תחת אגוזים: אלרגיה לבוטנים ואלרגיה לאגוזי עץ הן שתי
  // אלרגיות נפרדות, ומיזוגן היה יוצר חסימות שגויות לשני הכיוונים.
  { id: 'peanut', he: 'בוטנים', kind: 'nut', common: true },

  // ======================= אגוזים וזרעים =======================
  { id: 'nuts', he: 'אגוזים', kind: 'nut', common: true },
  { id: 'almond', he: 'שקדים', parent: 'nuts', kind: 'nut' },
  { id: 'almond-milk', he: 'משקה שקדים', parent: 'almond', kind: 'nut' },
  { id: 'walnut', he: 'אגוז מלך', parent: 'nuts', kind: 'nut' },
  { id: 'pecan', he: 'פקאן', parent: 'nuts', kind: 'nut' },
  { id: 'cashew', he: 'קשיו', parent: 'nuts', kind: 'nut' },
  { id: 'pistachio', he: 'פיסטוק', parent: 'nuts', kind: 'nut' },
  { id: 'hazelnut', he: 'אגוז לוז', parent: 'nuts', kind: 'nut' },
  { id: 'macadamia', he: 'מקדמיה', parent: 'nuts', kind: 'nut' },
  { id: 'brazil-nut', he: 'אגוז ברזיל', parent: 'nuts', kind: 'nut' },
  { id: 'pine-nut', he: 'צנוברים', parent: 'nuts', kind: 'nut' },
  { id: 'chestnut', he: 'ערמונים', parent: 'nuts', kind: 'nut' },

  { id: 'sesame', he: 'שומשום', kind: 'nut', common: true },
  { id: 'tahini', he: 'טחינה', parent: 'sesame', kind: 'nut', common: true },
  { id: 'sesame-oil', he: 'שמן שומשום', parent: 'sesame', kind: 'nut' },
  { id: 'sunflower-seed', he: 'גרעיני חמנייה', kind: 'nut' },
  { id: 'pumpkin-seed', he: 'גרעיני דלעת', kind: 'nut' },
  { id: 'chia', he: 'צ׳יה', kind: 'nut' },
  { id: 'flax', he: 'פשתן', kind: 'nut' },
  { id: 'poppy', he: 'פרג', kind: 'nut' },

  // ======================= ירקות =======================
  { id: 'onion', he: 'בצל', kind: 'vegetable', common: true },
  { id: 'spring-onion', he: 'בצל ירוק', parent: 'onion', kind: 'vegetable' },
  { id: 'leek', he: 'כרישה', parent: 'onion', kind: 'vegetable' },
  { id: 'garlic', he: 'שום', kind: 'vegetable', common: true },
  { id: 'tomato', he: 'עגבנייה', kind: 'vegetable', common: true },
  { id: 'cucumber', he: 'מלפפון', kind: 'vegetable' },
  { id: 'eggplant', he: 'חציל', kind: 'vegetable', common: true },
  { id: 'zucchini', he: 'קישוא', kind: 'vegetable' },
  { id: 'pepper', he: 'פלפל מתוק', kind: 'vegetable' },
  { id: 'mushroom', he: 'פטריות', kind: 'vegetable', common: true },
  { id: 'olive', he: 'זיתים', kind: 'vegetable', common: true },
  { id: 'olive-oil', he: 'שמן זית', parent: 'olive', kind: 'vegetable' },

  // סלרי הוא אחד מ-14 האלרגנים שחובה לסמן באיחוד האירופי, ומופיע
  // כמעט בכל מרק ירקות וסלט ישראלי.
  { id: 'celery', he: 'סלרי', kind: 'vegetable', common: true },
  { id: 'celeriac', he: 'שורש סלרי', parent: 'celery', kind: 'vegetable' },

  { id: 'carrot', he: 'גזר', kind: 'vegetable' },
  { id: 'beet', he: 'סלק', kind: 'vegetable', common: true },
  { id: 'radish', he: 'צנון וצנונית', kind: 'vegetable' },
  { id: 'kohlrabi', he: 'קולרבי', kind: 'vegetable' },
  { id: 'fennel', he: 'שומר', kind: 'vegetable' },
  { id: 'parsley-root', he: 'שורש פטרוזיליה', kind: 'vegetable' },
  { id: 'pumpkin', he: 'דלעת', kind: 'vegetable' },
  { id: 'okra', he: 'במיה', kind: 'vegetable', common: true },
  { id: 'artichoke', he: 'ארטישוק', kind: 'vegetable' },
  { id: 'green-beans', he: 'שעועית ירוקה', kind: 'vegetable' },
  { id: 'asparagus', he: 'אספרגוס', kind: 'vegetable' },

  { id: 'cabbage', he: 'כרוב', kind: 'vegetable' },
  { id: 'brussels-sprouts', he: 'כרוב ניצנים', parent: 'cabbage', kind: 'vegetable' },
  { id: 'cauliflower', he: 'כרובית', kind: 'vegetable' },
  { id: 'broccoli', he: 'ברוקולי', kind: 'vegetable' },

  { id: 'leafy-greens', he: 'עלים ירוקים', kind: 'vegetable' },
  { id: 'lettuce', he: 'חסה', parent: 'leafy-greens', kind: 'vegetable' },
  { id: 'spinach', he: 'תרד', parent: 'leafy-greens', kind: 'vegetable', common: true },
  { id: 'chard', he: 'מנגולד', parent: 'leafy-greens', kind: 'vegetable' },
  { id: 'arugula', he: 'רוקט', parent: 'leafy-greens', kind: 'vegetable' },
  { id: 'kale', he: 'קייל', parent: 'leafy-greens', kind: 'vegetable' },
  { id: 'sprouts', he: 'נבטים', parent: 'leafy-greens', kind: 'vegetable' },

  { id: 'seaweed', he: 'אצות', kind: 'vegetable' },
  { id: 'nori', he: 'נורי', parent: 'seaweed', kind: 'vegetable' },

  // ======================= עשבי תיבול =======================
  { id: 'herbs', he: 'עשבי תיבול', kind: 'herb' },
  { id: 'parsley', he: 'פטרוזיליה', parent: 'herbs', kind: 'herb' },
  // כוסברה היא המפלגת הקלאסית — יש מי שטעמה סבון עבורו, גנטית.
  { id: 'cilantro', he: 'כוסברה', parent: 'herbs', kind: 'herb', common: true },
  { id: 'dill', he: 'שמיר', parent: 'herbs', kind: 'herb', common: true },
  { id: 'mint', he: 'נענע', parent: 'herbs', kind: 'herb', common: true },
  { id: 'basil', he: 'בזיליקום', parent: 'herbs', kind: 'herb', common: true },
  { id: 'chives', he: 'עירית', parent: 'herbs', kind: 'herb' },
  { id: 'thyme', he: 'תימין', parent: 'herbs', kind: 'herb' },
  { id: 'oregano', he: 'אורגנו', parent: 'herbs', kind: 'herb' },
  { id: 'rosemary', he: 'רוזמרין', parent: 'herbs', kind: 'herb' },
  { id: 'sage', he: 'מרווה', parent: 'herbs', kind: 'herb' },
  { id: 'zaatar', he: 'זעתר ואזוב', parent: 'herbs', kind: 'herb' },
  { id: 'bay-leaf', he: 'עלה דפנה', parent: 'herbs', kind: 'herb' },

  // ======================= תבלינים =======================
  { id: 'spicy', he: 'חריף', kind: 'spice', common: true },
  { id: 'hot-pepper', he: 'פלפל חריף וצ׳ילי', parent: 'spicy', kind: 'spice' },
  // חרדל הוא אחד מ-14 האלרגנים שחובה לסמן באיחוד האירופי.
  { id: 'mustard', he: 'חרדל', kind: 'spice', common: true },
  { id: 'turmeric', he: 'כורכום', kind: 'spice' },
  { id: 'ginger', he: 'ג׳ינג׳ר', kind: 'spice', common: true },
  { id: 'cinnamon', he: 'קינמון', kind: 'spice' },
  { id: 'cumin', he: 'כמון', kind: 'spice' },
  // זרעי כוסברה אינם מקושרים לעלי הכוסברה: מי שסולד מהעלים בדרך כלל
  // אינו מזהה כלל את הזרעים במנה.
  { id: 'coriander-seed', he: 'זרעי כוסברה', kind: 'spice' },
  { id: 'cardamom', he: 'הל', kind: 'spice' },
  { id: 'sumac', he: 'סומאק', kind: 'spice' },
  { id: 'paprika', he: 'פפריקה', kind: 'spice' },
  { id: 'hawaij', he: 'חוויאג׳', kind: 'spice' },
  { id: 'curry', he: 'קארי', kind: 'spice' },
  { id: 'nutmeg', he: 'אגוז מוסקט', kind: 'spice' },
  { id: 'black-pepper', he: 'פלפל שחור', kind: 'spice' },

  // ======================= פירות =======================
  { id: 'citrus', he: 'הדרים', kind: 'fruit' },
  { id: 'lemon', he: 'לימון', parent: 'citrus', kind: 'fruit' },
  { id: 'orange', he: 'תפוז', parent: 'citrus', kind: 'fruit' },
  { id: 'grapefruit', he: 'אשכולית', parent: 'citrus', kind: 'fruit' },
  { id: 'apple', he: 'תפוח', kind: 'fruit' },
  { id: 'pear', he: 'אגס', kind: 'fruit' },
  { id: 'banana', he: 'בננה', kind: 'fruit' },
  { id: 'berries', he: 'פירות יער', kind: 'fruit' },
  { id: 'strawberry', he: 'תות שדה', parent: 'berries', kind: 'fruit', common: true },
  { id: 'blueberry', he: 'אוכמניות', parent: 'berries', kind: 'fruit' },
  { id: 'raspberry', he: 'פטל', parent: 'berries', kind: 'fruit' },
  { id: 'stone-fruit', he: 'פירות גלעיניים', kind: 'fruit' },
  { id: 'peach', he: 'אפרסק', parent: 'stone-fruit', kind: 'fruit' },
  { id: 'nectarine', he: 'נקטרינה', parent: 'stone-fruit', kind: 'fruit' },
  { id: 'plum', he: 'שזיף', parent: 'stone-fruit', kind: 'fruit' },
  { id: 'apricot', he: 'משמש', parent: 'stone-fruit', kind: 'fruit' },
  { id: 'cherry', he: 'דובדבן', parent: 'stone-fruit', kind: 'fruit' },
  { id: 'grape', he: 'ענבים', kind: 'fruit' },
  { id: 'melon', he: 'מלון', kind: 'fruit' },
  { id: 'watermelon', he: 'אבטיח', kind: 'fruit' },
  { id: 'mango', he: 'מנגו', kind: 'fruit' },
  { id: 'papaya', he: 'פפאיה', kind: 'fruit' },
  { id: 'pineapple', he: 'אננס', kind: 'fruit' },
  { id: 'kiwi', he: 'קיווי', kind: 'fruit' },
  { id: 'pomegranate', he: 'רימון', kind: 'fruit' },
  { id: 'fig', he: 'תאנה', kind: 'fruit' },
  { id: 'persimmon', he: 'אפרסמון', kind: 'fruit' },
  { id: 'avocado', he: 'אבוקדו', kind: 'fruit', common: true },
  { id: 'dates', he: 'תמרים', kind: 'fruit' },
  { id: 'coconut', he: 'קוקוס', kind: 'fruit' },
  { id: 'coconut-milk', he: 'משקה קוקוס', parent: 'coconut', kind: 'fruit' },

  // ======================= אחר =======================
  { id: 'honey', he: 'דבש', kind: 'other', common: true },
  { id: 'alcohol', he: 'אלכוהול', kind: 'other' },
  { id: 'wine', he: 'יין', parent: 'alcohol', kind: 'other' },
  { id: 'beer', he: 'בירה', parent: 'alcohol', kind: 'other' },
  { id: 'mayo', he: 'מיונז', kind: 'other', common: true },
  { id: 'vinegar', he: 'חומץ', kind: 'other' },
  { id: 'yeast', he: 'שמרים', kind: 'other' },
  // סולפיטים הם אחד מ-14 האלרגנים שחובה לסמן באיחוד האירופי, ומעוררים
  // אסתמה. נמצאים בפירות יבשים לא-אורגניים וביין.
  { id: 'sulphite', he: 'סולפיטים (גופרית)', kind: 'other' },
  { id: 'coconut-oil', he: 'שמן קוקוס', parent: 'coconut', kind: 'other' },
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
  {
    id: 'halal',
    he: 'חלאל',
    note: 'חוסם חזיר ואלכוהול.',
    blocks: ['pork', 'alcohol'],
  },
  {
    // מופיע כדיאטה ולא כתגית חסומה כי כך אנשים מזהים את עצמם: מי
    // שיודע שיש לו רגישות G6PD מחפש את השם, לא את שם הקטנייה.
    id: 'favism',
    he: 'פאביזם (רגישות G6PD)',
    note: 'חוסם פול. תגובה רפואית, לא עניין של טעם.',
    blocks: ['fava'],
  },
  {
    id: 'no-nuts',
    he: 'ללא אגוזים ובוטנים',
    blocks: ['nuts', 'peanut'],
  },
  {
    id: 'no-eggs',
    he: 'ללא ביצים',
    blocks: ['egg'],
  },
];

export const DIET_BY_ID: ReadonlyMap<string, Diet> = new Map(DIETS.map((d) => [d.id, d]));
