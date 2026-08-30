import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { tokenMatches } from '@/lib/validate';
import { buildCoverage, buildMatrix } from '@/core/matching';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/**
 * שתי תצוגות מאותו אירוע:
 * - בלי טוקן: תצוגת משתתף. רק מה שדרוש כדי למלא טופס — שם הארוחה ומי
 *   כבר מילא. ההעדפות של האחרים (כולל מידע רפואי) לא נשלחות.
 * - עם טוקן הטבח: הכל, כולל המטריצה ודוח הכיסוי.
 */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const event = await getStore().get(id);
  if (!event) return NextResponse.json({ error: 'האירוע לא נמצא' }, { status: 404 });

  const token = new URL(request.url).searchParams.get('token');
  if (!tokenMatches(event.cookToken, token)) {
    return NextResponse.json({
      id: event.id,
      title: event.title,
      date: event.date,
      filledBy: event.participants.map((p) => ({ id: p.id, name: p.name })),
    });
  }

  const coverage = buildCoverage(event);
  const matrix = buildMatrix(event.dishes, event.participants);
  return NextResponse.json({
    event,
    coverage,
    matrix: Object.fromEntries(
      [...matrix].map(([participantId, row]) => [participantId, Object.fromEntries(row)]),
    ),
  });
}
