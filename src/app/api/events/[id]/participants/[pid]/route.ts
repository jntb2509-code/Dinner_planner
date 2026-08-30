import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { tokenMatches } from '@/lib/validate';
import { cookView } from '@/lib/cookView';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; pid: string }> };

/**
 * הסרת משתתף. פעולה של הטבח בלבד.
 *
 * נדרש כדי לנקות כפילויות: זהות המשתתף נשמרת ב-localStorage של המכשיר,
 * אז מי שממלא מהטלפון ואחר כך מהטאבלט נספר פעמיים ומעוות את דוח הכיסוי.
 */
export async function DELETE(request: Request, { params }: Params) {
  const { id, pid } = await params;
  const token = new URL(request.url).searchParams.get('token');

  let authorized = true;
  let found = true;
  const updated = await getStore().update(id, (event) => {
    if (!tokenMatches(event.cookToken, token)) {
      authorized = false;
      return event;
    }
    const participants = event.participants.filter((p) => p.id !== pid);
    if (participants.length === event.participants.length) {
      found = false;
      return event;
    }
    return { ...event, participants };
  });

  if (!updated) return NextResponse.json({ error: 'האירוע לא נמצא' }, { status: 404 });
  if (!authorized) return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
  if (!found) return NextResponse.json({ error: 'המשתתף לא נמצא' }, { status: 404 });

  return NextResponse.json(cookView(updated));
}
