import { NextResponse } from 'next/server';
import { canAccessEvent, loadEvent } from '@/lib/loadEvent';
import { getStore } from '@/lib/store';
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
    if (!canAccessEvent(loaded, token)) {
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

/** מחיקת ארוחה. מותרת לבעל הקבוצה או למי שמחזיק בטוקן הארוחה. */
export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const loaded = await loadEvent(id);
    if (!loaded) return NextResponse.json({ error: 'הארוחה לא נמצאה' }, { status: 404 });
    if (!canAccessEvent(loaded, new URL(request.url).searchParams.get('token'))) {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
    }
    await getStore().events.remove(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, 'שגיאה במחיקת הארוחה');
  }
}
