import { DIET_BY_ID, expandDown, expandUp, tagName } from './taxonomy';
import type {
  CoverageReport,
  Dish,
  DishStatus,
  DishVerdict,
  MealEvent,
  Participant,
  ParticipantCoverage,
  TagId,
} from './types';

/**
 * סט האילוצים של משתתף אחד, אחרי הרחבת דיאטות והיררכיה.
 * זה מה שהמנוע באמת עובד מולו — הוא לא יודע מה זה "טבעוני".
 */
export interface ResolvedConstraints {
  blocked: Set<TagId>;
  disliked: Set<TagId>;
  loved: Set<TagId>;
  noMeatDairyMix: boolean;
}

export function resolveConstraints(participant: Participant): ResolvedConstraints {
  const blockedSeeds: TagId[] = [...participant.blocked];
  let noMeatDairyMix = false;

  for (const dietId of participant.diets) {
    const diet = DIET_BY_ID.get(dietId);
    if (!diet) continue;
    blockedSeeds.push(...diet.blocks);
    if (diet.rules?.includes('no-meat-dairy-mix')) noMeatDairyMix = true;
  }

  const blocked = expandDown(blockedSeeds);
  const disliked = expandDown(participant.disliked);
  const loved = expandDown(participant.loved);

  // חסימה גוברת על "לא אוהב" ועל "אוהב" — אין טעם להציג סתירה לטבח.
  for (const id of blocked) {
    disliked.delete(id);
    loved.delete(id);
  }
  // "לא אוהב" גובר על "אוהב" אם המשתתף סימן את שניהם.
  for (const id of disliked) loved.delete(id);

  return { blocked, disliked, loved, noMeatDairyMix };
}

const MEAT_TAGS = expandDown(['meat']);
const DAIRY_TAGS = expandDown(['dairy']);

function hasAny(dishTags: Set<TagId>, group: Set<TagId>): boolean {
  for (const t of dishTags) if (group.has(t)) return true;
  return false;
}

/** האם המנה מערבבת בשר וחלב (רלוונטי לכשרות). */
export function mixesMeatAndDairy(dish: Dish): boolean {
  const tags = expandUp(dish.tags);
  return hasAny(tags, MEAT_TAGS) && hasAny(tags, DAIRY_TAGS);
}

/**
 * הערכת מנה בודדת מול משתתף בודד.
 *
 * סדר העדיפויות קבוע ומכוון: חסימה > אי-ודאות > לא אוהב > אוהב > ניטרלי.
 * אי-ודאות ("עלול להכיל") מדורגת מעל "לא אוהב" כי היא בטיחותית באופייה —
 * מנה שאולי מכילה אגוזים לא נספרת ככיסוי בטוח למי שאלרגי אליהם.
 */
export function evaluateDish(dish: Dish, constraints: ResolvedConstraints): DishVerdict {
  const dishTags = expandUp(dish.tags);
  const blockedBy: string[] = [];
  const dislikedBy: string[] = [];
  const lovedBy: string[] = [];
  const uncertainBy: string[] = [];

  for (const tag of dish.tags) {
    // בודקים מול התגיות שהוזנו במפורש ומול אבותיהן, כדי שההסבר לטבח
    // יצביע על המרכיב האמיתי במנה ולא על שורש מופשט בהיררכיה.
    for (const t of expandUp([tag])) {
      if (constraints.blocked.has(t)) {
        blockedBy.push(tagName(tag));
        break;
      }
    }
    if (constraints.disliked.has(tag)) dislikedBy.push(tagName(tag));
    if (constraints.loved.has(tag)) lovedBy.push(tagName(tag));
  }

  if (constraints.noMeatDairyMix && mixesMeatAndDairy(dish)) {
    blockedBy.push('ערבוב בשר וחלב');
  }

  for (const tag of dish.mayContain ?? []) {
    for (const t of expandUp([tag])) {
      if (constraints.blocked.has(t)) {
        uncertainBy.push(tagName(tag));
        break;
      }
    }
  }

  let status: DishStatus;
  if (blockedBy.length) status = 'blocked';
  else if (uncertainBy.length) status = 'uncertain';
  else if (dislikedBy.length) status = 'disliked';
  else if (lovedBy.length) status = 'loved';
  else status = 'ok';

  return {
    status,
    blockedBy: dedupe(blockedBy),
    dislikedBy: dedupe(dislikedBy),
    lovedBy: dedupe(lovedBy),
    uncertainBy: dedupe(uncertainBy),
  };
}

function dedupe(list: string[]): string[] {
  return [...new Set(list)];
}

/** המטריצה המלאה: מנה × משתתף. זה מה שהדשבורד של הטבח מציג. */
export type VerdictMatrix = Map<string, Map<string, DishVerdict>>;

export function buildMatrix(dishes: Dish[], participants: Participant[]): VerdictMatrix {
  const matrix: VerdictMatrix = new Map();
  for (const participant of participants) {
    const constraints = resolveConstraints(participant);
    const row = new Map<string, DishVerdict>();
    for (const dish of dishes) row.set(dish.id, evaluateDish(dish, constraints));
    matrix.set(participant.id, row);
  }
  return matrix;
}

/**
 * דוח הכיסוי — התרגום הישיר של הדרישה
 * "לכל אחד יהיו לפחות כמה מנות שהוא יכול לקחת מהן".
 *
 * מנה נחשבת בטוחה רק אם היא loved/ok/disliked. "לא אוהב" נספר ככיסוי
 * (אפשר לאכול), אבל נספר בנפרד גם ככיסוי "טוב" כדי שהטבח יראה את ההבדל
 * בין מישהו שיש לו שלוש מנות שהוא אוהב לבין מישהו שנשארו לו שלוש מנות
 * שהוא סובל בקושי.
 */
export function buildCoverage(event: MealEvent): CoverageReport {
  const matrix = buildMatrix(event.dishes, event.participants);

  const perParticipant: ParticipantCoverage[] = event.participants.map((participant) => {
    const row = matrix.get(participant.id)!;
    const safeDishIds: string[] = [];
    const goodDishIds: string[] = [];
    const safeMainDishIds: string[] = [];
    const uncertainDishIds: string[] = [];
    const blockedDishIds: string[] = [];

    for (const dish of event.dishes) {
      const verdict = row.get(dish.id)!;
      switch (verdict.status) {
        case 'blocked':
          blockedDishIds.push(dish.id);
          break;
        case 'uncertain':
          uncertainDishIds.push(dish.id);
          break;
        default:
          safeDishIds.push(dish.id);
          if (verdict.status !== 'disliked') goodDishIds.push(dish.id);
          if (dish.isMain) safeMainDishIds.push(dish.id);
      }
    }

    const problems: string[] = [];
    if (safeDishIds.length < event.minDishesPerPerson) {
      problems.push(
        safeDishIds.length === 0
          ? 'אין אף מנה שאפשר לאכול'
          : `יש רק ${safeDishIds.length} מנות אפשריות (צריך ${event.minDishesPerPerson})`,
      );
    }
    if (safeMainDishIds.length < event.minMainsPerPerson) {
      problems.push(
        safeMainDishIds.length === 0
          ? 'אין אף מנה עיקרית'
          : `יש רק ${safeMainDishIds.length} מנות עיקריות (צריך ${event.minMainsPerPerson})`,
      );
    }
    if (!problems.length && goodDishIds.length === 0) {
      problems.push('כל המנות האפשריות הן כאלה שהוא/היא לא אוהב/ת');
    }

    return {
      participantId: participant.id,
      name: participant.name,
      safeDishIds,
      goodDishIds,
      safeMainDishIds,
      uncertainDishIds,
      blockedDishIds,
      ok: problems.length === 0,
      problems,
    };
  });

  const uncovered = perParticipant.filter((p) => !p.ok);
  return { perParticipant, uncovered, allCovered: uncovered.length === 0 };
}
