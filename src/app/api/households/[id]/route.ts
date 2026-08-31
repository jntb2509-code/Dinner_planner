import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { tokenMatches } from '@/lib/validate';
import { errorResponse } from '@/lib/apiError';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/**
 * שתי תצוגות מאותו משק בית:
 * - בלי טוקן: תצוגת בן משפחה. רק השם ומי כבר רשום. ההעדפות של האחרים,
 *   כולל מידע רפואי, לא נשלחות.
 * - עם טוקן הבעלים: הכל, כולל ההעדפות המלאות.
 */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const household = await getStore().households.get(id);
    if (!household) return NextResponse.json({ error: 'הקבוצה לא נמצאה' }, { status: 404 });

    const token = new URL(request.url).searchParams.get('token');
    if (!tokenMatches(household.ownerToken, token)) {
      return NextResponse.json({
        id: household.id,
        name: household.name,
        members: household.people.map((p) => ({ id: p.id, name: p.name })),
      });
    }

    return NextResponse.json({ household });
  } catch (error) {
    return errorResponse(error, 'שגיאה בטעינת הקבוצה');
  }
}
