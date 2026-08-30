import { buildCoverage, evaluateDish, resolveConstraints } from './matching';
import type { Dish, MealEvent, Participant } from './types';

export interface Suggestion {
  dish: Dish;
  /** כמה משתתפים שכרגע חסרי כיסוי המנה הזו עוזרת להם. */
  helps: string[];
  /** הסבר קצר להצגה בממשק. */
  reason: string;
  score: number;
}

/**
 * השלמת חורים בתפריט.
 *
 * זו בעיית כיסוי-קבוצות, אבל בגדלים של ארוחה משפחתית (עד ~25 איש,
 * ~20 מנות) פתרון חמדני עם ניקוד נותן תוצאה טובה מיידית, ובניגוד
 * לפותר אילוצים אפשר להסביר למשתמש למה כל מנה נבחרה. אם זה יתברר
 * כלא מספיק, החלפת הפונקציה הזו לא נוגעת בשום דבר אחר במערכת.
 */
export interface SuggestOptions {
  maxSuggestions?: number;
  /**
   * להציע מנות גם כשכל המשתתפים כבר מכוסים. ברירת המחדל היא לא: כשאין
   * חור בתפריט, "עוד הצעה" היא רעש. הטבח יכול לבקש זאת במפורש מהממשק.
   */
  includeCrowdPleasers?: boolean;
}

export function suggestDishes(
  event: MealEvent,
  candidates: Dish[],
  options: SuggestOptions = {},
): Suggestion[] {
  const { maxSuggestions = 5, includeCrowdPleasers = false } = options;
  const chosen: Dish[] = [];
  const suggestions: Suggestion[] = [];
  const usedIds = new Set(event.dishes.map((d) => d.id));
  const usedNames = new Set(event.dishes.map((d) => normalize(d.name)));

  const constraintsByParticipant = new Map(
    event.participants.map((p) => [p.id, resolveConstraints(p)] as const),
  );

  for (let round = 0; round < maxSuggestions; round++) {
    const working: MealEvent = { ...event, dishes: [...event.dishes, ...chosen] };
    const coverage = buildCoverage(working);
    if (coverage.allCovered && !includeCrowdPleasers) break;

    const needy = new Map(coverage.uncovered.map((c) => [c.participantId, c]));
    let best: Suggestion | null = null;

    for (const candidate of candidates) {
      if (usedIds.has(candidate.id) || usedNames.has(normalize(candidate.name))) continue;

      const helps: string[] = [];
      let likes = 0;
      let dislikes = 0;
      let blocks = 0;

      for (const participant of event.participants) {
        const verdict = evaluateDish(candidate, constraintsByParticipant.get(participant.id)!);
        if (verdict.status === 'blocked' || verdict.status === 'uncertain') {
          blocks++;
          continue;
        }
        if (verdict.status === 'loved') likes++;
        if (verdict.status === 'disliked') dislikes++;

        const need = needy.get(participant.id);
        if (need && helpsParticipant(need, candidate, working)) helps.push(participant.name);
      }

      // עדיפות מוחלטת לכיסוי חורים; רק אחר כך טעם. מנה שפותרת בעיה לשניים
      // עדיפה תמיד על מנה שכולם אוהבים אבל לא פותרת כלום.
      const score = helps.length * 1000 + likes * 10 - dislikes * 5 - blocks;
      if (helps.length === 0 && coverage.uncovered.length > 0) continue;
      if (!best || score > best.score) {
        best = { dish: candidate, helps, reason: explain(helps, likes, blocks, event.participants), score };
      }
    }

    if (!best) break;
    suggestions.push(best);
    chosen.push(best.dish);
    usedIds.add(best.dish.id);
    usedNames.add(normalize(best.dish.name));
  }

  return suggestions;
}

/** האם המנה מקדמת את המשתתף לעבר הסף שהוא לא עומד בו. */
function helpsParticipant(
  need: { safeDishIds: string[]; safeMainDishIds: string[] },
  candidate: Dish,
  event: MealEvent,
): boolean {
  if (need.safeDishIds.length < event.minDishesPerPerson) return true;
  if (need.safeMainDishIds.length < event.minMainsPerPerson && candidate.isMain) return true;
  return false;
}

function explain(helps: string[], likes: number, blocks: number, participants: Participant[]): string {
  const parts: string[] = [];
  if (helps.length) parts.push(`פותרת את הבעיה של ${helps.join(', ')}`);
  const eats = participants.length - blocks;
  parts.push(`${eats} מתוך ${participants.length} יכולים לאכול`);
  if (likes) parts.push(`${likes} אוהבים במיוחד`);
  return parts.join(' · ');
}

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}
