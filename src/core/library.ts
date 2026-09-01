import type { Dish } from './types';

/**
 * מאגר מנות התחלתי — מנות נפוצות בארוחה משפחתית ישראלית, מתויגות
 * בטקסונומיה. משמש שני דברים: הצעות השלמה לתפריט, והשלמה אוטומטית
 * כשהטבח מקליד שם מנה.
 *
 * התיוג מכוון להיות שמרני: עדיף לתייג מרכיב שאולי לא תמיד נמצא במנה
 * מאשר לפספס אותו ולהגיש למישהו משהו שהוא לא יכול לאכול. מרכיב שתלוי
 * במתכון הספציפי נכנס ל-mayContain.
 */
export const DISH_LIBRARY: Dish[] = [
  // ---------- עיקריות בשריות ----------
  { id: 'lib-schnitzel', name: 'שניצל עוף', tags: ['chicken', 'gluten', 'egg'], isMain: true },
  { id: 'lib-roast-chicken', name: 'עוף בתנור', tags: ['chicken'], mayContain: ['honey'], isMain: true },
  { id: 'lib-chicken-rice', name: 'עוף עם אורז', tags: ['chicken', 'rice', 'onion'], isMain: true },
  { id: 'lib-meatballs', name: 'קציצות בשר ברוטב עגבניות', tags: ['beef', 'tomato', 'onion', 'egg'], mayContain: ['gluten'], isMain: true },
  { id: 'lib-kebab', name: 'קבב על האש', tags: ['beef', 'lamb', 'onion', 'parsley'], isMain: true },
  { id: 'lib-goulash', name: 'גולש בקר', tags: ['beef', 'onion', 'carrot', 'potato'], isMain: true },
  { id: 'lib-stuffed-veg', name: 'ממולאים', tags: ['beef', 'rice', 'tomato', 'pepper'], isMain: true },
  { id: 'lib-hamin', name: 'חמין / דפינה', tags: ['beef', 'beans', 'potato', 'egg', 'gluten'], isMain: true },
  { id: 'lib-shakshuka-meat', name: 'שקשוקה עם קבב', tags: ['beef', 'egg', 'tomato', 'pepper', 'spicy'], isMain: true },

  // ---------- עיקריות דגים ----------
  { id: 'lib-salmon-oven', name: 'סלמון בתנור', tags: ['salmon', 'citrus'], mayContain: ['honey'], isMain: true },
  { id: 'lib-fish-tomato', name: 'דג במרוקאית', tags: ['white-fish', 'tomato', 'pepper', 'garlic', 'spicy'], isMain: true },
  { id: 'lib-tuna-pasta', name: 'פסטה ברוטב טונה', tags: ['tuna', 'pasta', 'gluten', 'tomato', 'garlic'], isMain: true },

  // ---------- עיקריות חלביות ----------
  { id: 'lib-lasagna', name: 'לזניה', tags: ['pasta', 'gluten', 'hard-cheese', 'cream', 'tomato', 'beef'], isMain: true },
  { id: 'lib-mac-cheese', name: 'פסטה ברוטב גבינה', tags: ['pasta', 'gluten', 'hard-cheese', 'cream'], isMain: true },
  { id: 'lib-quiche', name: 'קיש ירקות', tags: ['gluten', 'egg', 'hard-cheese', 'cream', 'onion'], isMain: true },
  { id: 'lib-shakshuka', name: 'שקשוקה', tags: ['egg', 'tomato', 'pepper', 'garlic'], mayContain: ['spicy', 'soft-cheese'], isMain: true },
  { id: 'lib-pizza', name: 'פיצה ביתית', tags: ['gluten', 'hard-cheese', 'tomato'], isMain: true },

  // ---------- עיקריות צמחוניות/טבעוניות ----------
  { id: 'lib-mujadara', name: 'מג׳דרה', tags: ['rice', 'lentil', 'onion'], isMain: true },
  { id: 'lib-stuffed-peppers-veg', name: 'פלפלים ממולאים אורז', tags: ['rice', 'pepper', 'tomato', 'onion'], isMain: true },
  { id: 'lib-veg-curry', name: 'קארי ירקות עם אורז', tags: ['rice', 'coconut', 'carrot', 'pepper', 'onion'], mayContain: ['spicy'], isMain: true },
  { id: 'lib-lentil-stew', name: 'תבשיל עדשים', tags: ['lentil', 'carrot', 'onion', 'garlic'], isMain: true },
  { id: 'lib-tofu-stirfry', name: 'טופו מוקפץ עם ירקות', tags: ['tofu', 'soy', 'pepper', 'carrot', 'garlic'], isMain: true },
  { id: 'lib-veg-couscous', name: 'קוסקוס עם ירקות', tags: ['couscous', 'gluten', 'pumpkin', 'carrot', 'zucchini', 'chickpea'], isMain: true },
  { id: 'lib-potato-bake', name: 'תפוחי אדמה בתנור', tags: ['potato', 'garlic'], isMain: true },
  { id: 'lib-rice-plain', name: 'אורז לבן', tags: ['rice'], isMain: true },
  { id: 'lib-roasted-veg', name: 'ירקות שורש בתנור', tags: ['sweet-potato', 'carrot', 'onion', 'pumpkin'], isMain: true },
  { id: 'lib-quinoa-salad', name: 'סלט קינואה', tags: ['quinoa', 'cucumber', 'tomato', 'parsley', 'citrus'], isMain: true },
  { id: 'lib-bean-stew', name: 'תבשיל שעועית', tags: ['beans', 'tomato', 'onion', 'garlic'], isMain: true },

  // ---------- סלטים ותוספות ----------
  { id: 'lib-israeli-salad', name: 'סלט ירקות ישראלי', tags: ['cucumber', 'tomato', 'onion', 'lemon'], mayContain: ['parsley', 'cilantro'], isMain: false },
  { id: 'lib-green-salad', name: 'סלט עלים ירוקים', tags: ['leafy-greens', 'cucumber'], isMain: false },
  { id: 'lib-hummus', name: 'חומוס', tags: ['chickpea', 'tahini', 'garlic', 'lemon', 'cumin'], isMain: false },
  { id: 'lib-tahini', name: 'טחינה', tags: ['tahini', 'garlic', 'lemon'], mayContain: ['parsley'], isMain: false },
  { id: 'lib-matbucha', name: 'מטבוחה', tags: ['tomato', 'pepper', 'garlic', 'spicy'], isMain: false },
  { id: 'lib-eggplant-tahini', name: 'חציל בטחינה', tags: ['eggplant', 'tahini', 'garlic'], isMain: false },
  { id: 'lib-beet-salad', name: 'סלט סלק', tags: ['beet', 'vinegar'], isMain: false },
  { id: 'lib-cabbage-salad', name: 'סלט כרוב', tags: ['cabbage', 'carrot'], mayContain: ['mayo'], isMain: false },
  { id: 'lib-potato-salad', name: 'סלט תפוחי אדמה', tags: ['potato', 'mayo', 'egg', 'onion'], mayContain: ['mustard', 'dill'], isMain: false },
  { id: 'lib-corn-salad', name: 'סלט תירס', tags: ['corn', 'pepper', 'mayo'], isMain: false },
  { id: 'lib-avocado-salad', name: 'סלט אבוקדו', tags: ['avocado', 'citrus', 'tomato'], isMain: false },
  { id: 'lib-bread', name: 'לחם / חלה', tags: ['bread', 'gluten'], mayContain: ['sesame', 'egg'], isMain: false },
  { id: 'lib-pita', name: 'פיתות', tags: ['bread', 'gluten'], isMain: false },
  { id: 'lib-olives', name: 'זיתים', tags: ['olive'], isMain: false },
  { id: 'lib-cheese-platter', name: 'מגש גבינות', tags: ['hard-cheese', 'soft-cheese'], mayContain: ['blue-cheese', 'goat-cheese', 'feta'], isMain: false },

  // ---------- תוספות נוספות ----------
  { id: 'lib-tabbouleh', name: 'טאבולה', tags: ['bulgur', 'gluten', 'parsley', 'mint', 'tomato', 'lemon'], isMain: false },
  { id: 'lib-babaganoush', name: 'בבא גנוש', tags: ['eggplant', 'tahini', 'garlic', 'lemon'], isMain: false },
  { id: 'lib-fennel-salad', name: 'סלט שומר והדרים', tags: ['fennel', 'orange', 'olive-oil'], isMain: false },
  { id: 'lib-spinach-pie', name: 'פשטידת תרד', tags: ['spinach', 'egg', 'soft-cheese', 'onion'], mayContain: ['gluten'], isMain: false },
  { id: 'lib-roasted-cauliflower', name: 'כרובית בתנור', tags: ['cauliflower', 'olive-oil', 'garlic'], mayContain: ['tahini'], isMain: false },
  { id: 'lib-okra-tomato', name: 'במיה ברוטב עגבניות', tags: ['okra', 'tomato', 'garlic', 'onion'], isMain: false },
  { id: 'lib-artichoke', name: 'ארטישוק במילוי', tags: ['artichoke', 'rice', 'lemon', 'dill'], isMain: false },
  { id: 'lib-green-beans-garlic', name: 'שעועית ירוקה בשום', tags: ['green-beans', 'garlic', 'olive-oil'], isMain: false },
  { id: 'lib-carrot-salad', name: 'סלט גזר מרוקאי', tags: ['carrot', 'garlic', 'cumin', 'lemon'], mayContain: ['spicy'], isMain: false },
  { id: 'lib-pickles', name: 'חמוצים', tags: ['cucumber', 'vinegar', 'garlic', 'dill'], isMain: false },

  // ---------- עיקריות נוספות ----------
  { id: 'lib-fish-tahini', name: 'דג בטחינה', tags: ['white-fish', 'tahini', 'lemon', 'garlic'], isMain: true },
  { id: 'lib-stuffed-cabbage', name: 'כרוב ממולא', tags: ['cabbage', 'beef', 'rice', 'tomato'], isMain: true },
  { id: 'lib-chicken-soup', name: 'מרק עוף עם ירקות', tags: ['chicken', 'carrot', 'celery', 'onion', 'parsley'], mayContain: ['gluten'], isMain: true },
  { id: 'lib-lentil-soup', name: 'מרק עדשים', tags: ['lentil', 'carrot', 'celery', 'onion', 'cumin'], isMain: true },
  { id: 'lib-buckwheat-veg', name: 'כוסמת עם ירקות', tags: ['buckwheat', 'onion', 'carrot', 'mushroom'], isMain: true },
  { id: 'lib-sweet-potato-bake', name: 'בטטות בתנור', tags: ['sweet-potato', 'olive-oil'], mayContain: ['honey'], isMain: true },
  { id: 'lib-veg-shakshuka-green', name: 'שקשוקה ירוקה', tags: ['egg', 'spinach', 'zucchini', 'garlic'], mayContain: ['soft-cheese'], isMain: true },
  { id: 'lib-tofu-curry', name: 'קארי טופו', tags: ['tofu', 'soy', 'coconut-milk', 'curry', 'pepper'], mayContain: ['spicy'], isMain: true },
  { id: 'lib-fish-oven-veg', name: 'סלמון עם ירקות שורש', tags: ['salmon', 'carrot', 'sweet-potato', 'olive-oil'], isMain: true },
  { id: 'lib-quinoa-veg', name: 'קינואה עם ירקות צלויים', tags: ['quinoa', 'zucchini', 'pepper', 'onion', 'olive-oil'], isMain: true },

  // ---------- קינוחים ----------
  { id: 'lib-fruit-platter', name: 'מגש פירות', tags: ['apple', 'orange', 'banana', 'grape'], mayContain: ['melon', 'strawberry'], isMain: false },
  { id: 'lib-chocolate-cake', name: 'עוגת שוקולד', tags: ['gluten', 'egg', 'butter', 'dairy'], mayContain: ['nuts'], isMain: false },
  { id: 'lib-cheesecake', name: 'עוגת גבינה', tags: ['gluten', 'egg', 'soft-cheese', 'cream', 'dairy'], isMain: false },
  { id: 'lib-fruit-sorbet', name: 'סורבה פירות', tags: ['berries', 'citrus'], isMain: false },
  { id: 'lib-date-balls', name: 'כדורי תמרים', tags: ['dates', 'nuts', 'coconut'], isMain: false },
  { id: 'lib-watermelon-feta', name: 'אבטיח עם פטה', tags: ['watermelon', 'feta', 'mint'], isMain: false },
  { id: 'lib-baked-apples', name: 'תפוחים אפויים בקינמון', tags: ['apple', 'cinnamon'], mayContain: ['nuts', 'honey'], isMain: false },
  { id: 'lib-malabi', name: 'מלבי', tags: ['milk', 'coconut'], mayContain: ['pistachio'], isMain: false },
];
