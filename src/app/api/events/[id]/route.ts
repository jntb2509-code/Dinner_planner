import { NextResponse } from 'next/server';
import { loadEvent } from '@/lib/loadEvent';
import { tokenMatches } from '@/lib/validate';
import { errorResponse } from '@/lib/apiError';
import { cookView } from '@/lib/cookView';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** תצוגת הטבח. דורשת טוקן — האירוע חושף העדפות של כל המוזמנים. */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const loaded = await loadEvent(id);
    if (!loaded) return NextResponse.json({ error: 'הארוחה לא נמצאה' }, { status: 404 });

    const token = new URL(request.url).searchParams.get('token');
    if (!tokenMatches(loaded.stored.cookToken, token)) {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
    }

    return NextResponse.json({
      ...cookView(loaded.resolved),
      household: { id: loaded.household.id, name: loaded.household.name },
      // כל אנשי הקבוצה, כדי שהטבח יוכל להוסיף מוזמן ששכח.
      roster: loaded.household.people.map((p) => ({ id: p.id, name: p.name })),
      attendeeIds: loaded.stored.attendeeIds,
    });
  } catch (error) {
    return errorResponse(error, 'שגיאה בטעינת הארוחה');
  }
}
