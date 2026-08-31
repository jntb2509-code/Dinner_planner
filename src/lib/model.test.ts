import { describe, expect, it } from 'vitest';
import { isLegacyEvent, resolveEvent, type Household, type Person, type StoredEvent } from './model';
import { buildCoverage } from '@/core/matching';

function person(id: string, over: Partial<Person> = {}): Person {
  return {
    id,
    name: id,
    diets: [],
    blocked: [],
    disliked: [],
    loved: [],
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

function household(people: Person[]): Household {
  return {
    id: 'h1',
    ownerToken: 'tok',
    name: 'משפחת בדיקה',
    people,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function stored(attendeeIds: string[], over: Partial<StoredEvent> = {}): StoredEvent {
  return {
    id: 'e1',
    householdId: 'h1',
    cookToken: 'ctok',
    title: 'ארוחה',
    attendeeIds,
    dishes: [],
    minDishesPerPerson: 2,
    minMainsPerPerson: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

describe('חיבור אירוע למשק בית', () => {
  it('מביא את ההעדפות מהקבוצה, לא מהאירוע', () => {
    const h = household([person('סבתא', { diets: ['kosher'] }), person('דוד', { blocked: ['nuts'] })]);
    const resolved = resolveEvent(h, stored(['סבתא', 'דוד']));
    expect(resolved.participants.map((p) => p.name)).toEqual(['סבתא', 'דוד']);
    expect(resolved.participants[0].diets).toEqual(['kosher']);
  });

  it('מזמין רק את מי שסומן, לא את כל הקבוצה', () => {
    const h = household([person('א'), person('ב'), person('ג')]);
    const resolved = resolveEvent(h, stored(['א', 'ג']));
    expect(resolved.participants.map((p) => p.id)).toEqual(['א', 'ג']);
  });

  it('אדם שהוסר מהקבוצה נושר מהארוחה במקום להישאר כרשומה יתומה', () => {
    const h = household([person('א')]);
    const resolved = resolveEvent(h, stored(['א', 'נמחק']));
    expect(resolved.participants.map((p) => p.id)).toEqual(['א']);
  });

  it('עדכון העדפה בקבוצה משפיע מיד על ארוחה קיימת', () => {
    const before = household([person('דנה')]);
    const event = stored(['דנה'], {
      dishes: [
        { id: 'd1', name: 'לזניה', tags: ['hard-cheese', 'pasta'], isMain: true },
        { id: 'd2', name: 'סלט ירקות', tags: ['cucumber', 'tomato'], isMain: false },
      ],
    });
    expect(buildCoverage(resolveEvent(before, event)).allCovered).toBe(true);

    // דנה מגלה שהיא רגישה ללקטוז ומעדכנת בקבוצה — בלי לגעת בארוחה
    const after = household([person('דנה', { diets: ['lactose-free'] })]);
    const report = buildCoverage(resolveEvent(after, event));
    expect(report.allCovered).toBe(false);
    expect(report.uncovered[0].name).toBe('דנה');
    // הלזניה נחסמה, אז נשארה לה רק תוספת ואף מנה עיקרית
    expect(report.uncovered[0].problems).toContain('אין אף מנה עיקרית');
  });

  it('שומר על הגדרות הסף של האירוע', () => {
    const h = household([person('א')]);
    const resolved = resolveEvent(h, stored(['א'], { minDishesPerPerson: 4, minMainsPerPerson: 2 }));
    expect(resolved.minDishesPerPerson).toBe(4);
    expect(resolved.minMainsPerPerson).toBe(2);
  });
});

describe('זיהוי אירוע מהגרסה הקודמת', () => {
  it('מזהה אירוע ישן לפי participants בלי householdId', () => {
    expect(isLegacyEvent({ id: 'x', participants: [], dishes: [] })).toBe(true);
  });

  it('לא מסמן אירוע תקין כישן', () => {
    expect(isLegacyEvent(stored(['א']))).toBe(false);
  });
});
