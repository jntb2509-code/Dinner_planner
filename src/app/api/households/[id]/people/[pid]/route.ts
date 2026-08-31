import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { tokenMatches } from '@/lib/validate';
import { errorResponse } from '@/lib/apiError';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; pid: string }> };

/** הסרת אדם מהקבוצה. פעולה של בעל הקבוצה בלבד. */
export async function DELETE(request: Request, { params }: Params) {
  const { id, pid } = await params;
  const token = new URL(request.url).searchParams.get('token');

  try {
    let authorized = true;
    let found = true;
    const updated = await getStore().households.update(id, (household) => {
      if (!tokenMatches(household.ownerToken, token)) {
        authorized = false;
        return household;
      }
      const people = household.people.filter((p) => p.id !== pid);
      if (people.length === household.people.length) {
        found = false;
        return household;
      }
      return { ...household, people };
    });

    if (!updated) return NextResponse.json({ error: 'הקבוצה לא נמצאה' }, { status: 404 });
    if (!authorized) return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
    if (!found) return NextResponse.json({ error: 'האדם לא נמצא' }, { status: 404 });

    return NextResponse.json({ household: updated });
  } catch (error) {
    return errorResponse(error, 'שגיאה בהסרת האדם');
  }
}
