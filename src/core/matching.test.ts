import { describe, expect, it } from 'vitest';
import { buildCoverage, evaluateDish, mixesMeatAndDairy, resolveConstraints } from './matching';
import { descendantsOf, expandDown, expandUp } from './taxonomy';
import { suggestDishes } from './suggest';
import { DISH_LIBRARY } from './library';
import type { Dish, MealEvent, Participant } from './types';

function person(name: string, over: Partial<Participant> = {}): Participant {
  return {
    id: name,
    name,
    diets: [],
    blocked: [],
    disliked: [],
    loved: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

function dish(id: string, tags: string[], isMain = true, mayContain?: string[]): Dish {
  return { id, name: id, tags, isMain, mayContain };
}

function event(participants: Participant[], dishes: Dish[], over: Partial<MealEvent> = {}): MealEvent {
  return {
    id: 'e1',
    cookToken: 't',
    title: 'ארוחה',
    participants,
    dishes,
    minDishesPerPerson: 2,
    minMainsPerPerson: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

describe('היררכיית תגיות', () => {
  it('חסימת אב חוסמת את כל הצאצאים', () => {
    const blocked = expandDown(['nuts']);
    expect(blocked.has('almond')).toBe(true);
    expect(blocked.has('pecan')).toBe(true);
    expect(blocked.has('nuts')).toBe(true);
  });

  it('בוטנים אינם תת-קבוצה של אגוזים ולהפך', () => {
    expect(descendantsOf('nuts')).not.toContain('peanut');
    expect(descendantsOf('peanut')).not.toContain('almond');
  });

  it('תגית של מנה מתפשטת כלפי מעלה', () => {
    const tags = expandUp(['hard-cheese']);
    expect(tags.has('dairy')).toBe(true);
  });

  it('חסימה עמוקה עובדת דרך שתי רמות', () => {
    // פסטה -> חיטה -> גלוטן
    const p = person('דנה', { diets: ['gluten-free'] });
    const verdict = evaluateDish(dish('d', ['pasta']), resolveConstraints(p));
    expect(verdict.status).toBe('blocked');
  });
});

describe('הערכת מנה בודדת', () => {
  it('אלרגיה חוסמת מנה', () => {
    const p = person('יוסי', { blocked: ['nuts'] });
    const verdict = evaluateDish(dish('d', ['almond', 'rice']), resolveConstraints(p));
    expect(verdict.status).toBe('blocked');
    expect(verdict.blockedBy).toContain('שקדים');
  });

  it('״לא אוהב״ אינו חוסם', () => {
    const p = person('רותי', { disliked: ['cilantro'] });
    const verdict = evaluateDish(dish('d', ['cilantro', 'rice']), resolveConstraints(p));
    expect(verdict.status).toBe('disliked');
  });

  it('״עלול להכיל״ מסומן כלא ודאי, לא כחסום ולא כבטוח', () => {
    const p = person('נועה', { blocked: ['nuts'] });
    const verdict = evaluateDish(dish('d', ['gluten'], true, ['nuts']), resolveConstraints(p));
    expect(verdict.status).toBe('uncertain');
    expect(verdict.uncertainBy).toContain('אגוזים');
  });

  it('חסימה גוברת על אהבה כשיש התנגשות', () => {
    const p = person('אבי', { blocked: ['dairy'], loved: ['hard-cheese'] });
    const verdict = evaluateDish(dish('d', ['hard-cheese']), resolveConstraints(p));
    expect(verdict.status).toBe('blocked');
  });

  it('מנה נקייה מסומנת כאהובה כשיש בה מרכיב אהוב', () => {
    const p = person('מיכל', { loved: ['salmon'] });
    const verdict = evaluateDish(dish('d', ['salmon', 'rice']), resolveConstraints(p));
    expect(verdict.status).toBe('loved');
  });
});

describe('דיאטות', () => {
  it('טבעוני חוסם חלב, ביצים, בשר ודגים', () => {
    const c = resolveConstraints(person('שיר', { diets: ['vegan'] }));
    for (const tag of ['milk', 'egg', 'chicken', 'salmon', 'honey']) {
      expect(c.blocked.has(tag)).toBe(true);
    }
    expect(c.blocked.has('rice')).toBe(false);
  });

  it('צמחוני מתיר חלב וביצים', () => {
    const c = resolveConstraints(person('גל', { diets: ['vegetarian'] }));
    expect(c.blocked.has('egg')).toBe(false);
    expect(c.blocked.has('hard-cheese')).toBe(false);
    expect(c.blocked.has('beef')).toBe(true);
  });

  it('כשרות חוסמת ערבוב בשר וחלב', () => {
    const lasagna = dish('lasagna', ['beef', 'hard-cheese', 'pasta']);
    expect(mixesMeatAndDairy(lasagna)).toBe(true);
    const p = person('דוד', { diets: ['kosher'] });
    expect(evaluateDish(lasagna, resolveConstraints(p)).status).toBe('blocked');
  });

  it('כשרות לא חוסמת מנה בשרית נקייה', () => {
    const p = person('דוד', { diets: ['kosher'] });
    expect(evaluateDish(dish('d', ['beef', 'rice']), resolveConstraints(p)).status).toBe('ok');
  });

  it('צירוף של שתי דיאטות מצטבר', () => {
    const c = resolveConstraints(person('תמר', { diets: ['vegetarian', 'gluten-free'] }));
    expect(c.blocked.has('beef')).toBe(true);
    expect(c.blocked.has('pasta')).toBe(true);
  });
});

describe('דוח כיסוי', () => {
  it('מזהה משתתף בלי אף מנה', () => {
    const e = event(
      [person('אלרגי', { blocked: ['gluten'] })],
      [dish('a', ['gluten']), dish('b', ['bread'])],
    );
    const report = buildCoverage(e);
    expect(report.allCovered).toBe(false);
    expect(report.uncovered[0].problems[0]).toBe('אין אף מנה שאפשר לאכול');
  });

  it('מזהה משתתף שיש לו רק תוספות ואין מנה עיקרית', () => {
    const e = event(
      [person('צמחוני', { diets: ['vegetarian'] })],
      [dish('meat1', ['beef']), dish('salad', ['cucumber'], false), dish('bread', ['gluten'], false)],
    );
    const report = buildCoverage(e);
    expect(report.uncovered[0].problems).toContain('אין אף מנה עיקרית');
  });

  it('מנה שלא אוהבים נספרת ככיסוי אבל לא ככיסוי טוב', () => {
    const e = event(
      [person('בררן', { disliked: ['mushroom'] })],
      [dish('m', ['mushroom']), dish('m2', ['mushroom'], false)],
    );
    const report = buildCoverage(e);
    const cov = report.perParticipant[0];
    expect(cov.safeDishIds).toHaveLength(2);
    expect(cov.goodDishIds).toHaveLength(0);
    expect(cov.ok).toBe(false);
  });

  it('מנה לא ודאית אינה נספרת ככיסוי בטוח', () => {
    const e = event(
      [person('אלרגי', { blocked: ['peanut'] })],
      [dish('a', ['rice'], true, ['peanut']), dish('b', ['potato']), dish('c', ['carrot'], false)],
    );
    const cov = buildCoverage(e).perParticipant[0];
    expect(cov.uncertainDishIds).toEqual(['a']);
    expect(cov.safeDishIds).toEqual(['b', 'c']);
  });

  it('אירוע תקין מסומן ככזה', () => {
    const e = event(
      [person('א'), person('ב', { diets: ['vegetarian'] })],
      [dish('rice', ['rice']), dish('veg', ['carrot']), dish('salad', ['cucumber'], false)],
    );
    expect(buildCoverage(e).allCovered).toBe(true);
  });

  it('משתתף בלי שום העדפה מכוסה על ידי כל תפריט סביר', () => {
    const e = event([person('כלביא')], [dish('a', ['beef']), dish('b', ['gluten'])]);
    expect(buildCoverage(e).allCovered).toBe(true);
  });
});

describe('הצעות השלמה', () => {
  it('מציעה מנה שפותרת משתתף לא מכוסה', () => {
    const e = event(
      [person('טבעוני', { diets: ['vegan'] }), person('רגיל')],
      [dish('meat', ['beef']), dish('cheese', ['hard-cheese'])],
    );
    const suggestions = suggestDishes(e, DISH_LIBRARY, { maxSuggestions: 5 });
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].helps).toContain('טבעוני');

    // התפריט המשולב אמור לכסות את כולם
    const merged = { ...e, dishes: [...e.dishes, ...suggestions.map((s) => s.dish)] };
    expect(buildCoverage(merged).allCovered).toBe(true);
  });

  it('לא מציעה מנה שכבר נמצאת בתפריט', () => {
    const e = event(
      [person('טבעוני', { diets: ['vegan'] })],
      [{ ...DISH_LIBRARY.find((d) => d.id === 'lib-mujadara')!, id: 'mine' }],
    );
    const suggestions = suggestDishes(e, DISH_LIBRARY, { maxSuggestions: 5 });
    expect(suggestions.map((s) => s.dish.name)).not.toContain('מג׳דרה');
  });

  it('מכבדת אלרגיה קשה של משתתף אחד גם כשהיא נדירה', () => {
    const e = event(
      [person('אלרגי לשומשום', { blocked: ['sesame'] }), person('רגיל')],
      [dish('x', ['sesame'])],
    );
    for (const s of suggestDishes(e, DISH_LIBRARY, { maxSuggestions: 5 })) {
      expect(expandUp(s.dish.tags).has('sesame')).toBe(false);
    }
  });

  it('מסתפקת בכלום כשהכל כבר מכוסה', () => {
    const e = event([person('א')], [dish('a', ['rice']), dish('b', ['carrot'], false)]);
    expect(suggestDishes(e, DISH_LIBRARY, { maxSuggestions: 5 })).toHaveLength(0);
  });

  it('כן מציעה תוספות כשמבקשים במפורש', () => {
    const e = event([person('א')], [dish('a', ['rice']), dish('b', ['carrot'], false)]);
    const extras = suggestDishes(e, DISH_LIBRARY, {
      maxSuggestions: 3,
      includeCrowdPleasers: true,
    });
    expect(extras).toHaveLength(3);
  });
});

describe('תרחיש משפחתי מלא', () => {
  it('מייצר תפריט שמכסה משפחה עם אילוצים מנוגדים', () => {
    const family = [
      person('סבתא', { diets: ['kosher'], disliked: ['spicy'] }),
      person('דוד', { blocked: ['nuts', 'peanut'] }),
      person('מיכל', { diets: ['vegan'] }),
      person('יונתן', { diets: ['gluten-free'] }),
      person('נועה', { disliked: ['cilantro', 'mushroom'], loved: ['salmon'] }),
      person('איתי'),
    ];
    const e = event(family, [], { minDishesPerPerson: 3, minMainsPerPerson: 1 });
    const suggestions = suggestDishes(e, DISH_LIBRARY, { maxSuggestions: 12 });
    const merged = { ...e, dishes: suggestions.map((s) => s.dish) };
    const report = buildCoverage(merged);
    expect(report.uncovered.map((u) => u.name)).toEqual([]);
  });
});
