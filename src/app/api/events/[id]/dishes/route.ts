import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { ValidationError, parseDishes, tokenMatches } from '@/lib/validate';
import { cookView } from '@/lib/cookView';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** עדכון התפריט. פעולה של הטבח בלבד — דורשת טוקן. */
export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const token = new URL(request.url).searchParams.get('token');
    const body = await request.json();
    const dishes = parseDishes(body);

    let authorized = true;
    const updated = await getStore().update(id, (event) => {
      if (!tokenMatches(event.cookToken, token)) {
        authorized = false;
        return event;
      }
      return { ...event, dishes };
    });

    if (!updated) return NextResponse.json({ error: 'האירוע לא נמצא' }, { status: 404 });
    if (!authorized) return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });

    return NextResponse.json(cookView(updated));
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('save dishes failed', error);
    return NextResponse.json({ error: 'שגיאה בשמירת התפריט' }, { status: 500 });
  }
}
