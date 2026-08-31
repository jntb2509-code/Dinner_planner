import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { canAccessEvent, loadEvent } from '@/lib/loadEvent';
import { parseDishes } from '@/lib/validate';
import { errorResponse } from '@/lib/apiError';
import { cookView } from '@/lib/cookView';
import { resolveEvent } from '@/lib/model';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** עדכון התפריט. פעולה של הטבח בלבד. */
export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const token = new URL(request.url).searchParams.get('token');
    const loaded = await loadEvent(id);
    if (!loaded) return NextResponse.json({ error: 'הארוחה לא נמצאה' }, { status: 404 });
    if (!canAccessEvent(loaded, token)) {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
    }

    const dishes = parseDishes(await request.json());
    const updated = await getStore().events.update(id, (event) => ({ ...event, dishes }));
    if (!updated) return NextResponse.json({ error: 'הארוחה לא נמצאה' }, { status: 404 });

    return NextResponse.json({
      ...cookView(resolveEvent(loaded.household, updated)),
      household: { id: loaded.household.id, name: loaded.household.name },
      roster: loaded.household.people.map((p) => ({ id: p.id, name: p.name })),
      attendeeIds: updated.attendeeIds,
    });
  } catch (error) {
    return errorResponse(error, 'שגיאה בשמירת התפריט');
  }
}
