import { buildCoverage, buildMatrix } from '@/core/matching';
import type { MealEvent } from '@/core/types';

/**
 * התשובה המלאה לטבח. שלוש נקודות קצה מחזירות אותה, ואם המבנה יתפצל
 * ביניהן הממשק יתחיל להציג מצב ישן אחרי חלק מהפעולות.
 */
export function cookView(event: MealEvent) {
  const matrix = buildMatrix(event.dishes, event.participants);
  return {
    event,
    coverage: buildCoverage(event),
    matrix: Object.fromEntries(
      [...matrix].map(([participantId, row]) => [participantId, Object.fromEntries(row)]),
    ),
  };
}
