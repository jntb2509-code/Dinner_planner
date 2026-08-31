import { NextResponse } from 'next/server';
import { cookToken, shortId } from '@/lib/ids';
import { getStore } from '@/lib/store';
import { ValidationError, parseAttendeeIds, tokenMatches } from '@/lib/validate';
import { errorResponse } from '@/lib/apiError';
import type { StoredEvent } from '@/lib/model';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/**
 * פתיחת ארוחה בתוך קבוצה. זה הלב של M2: הארוחה לא אוספת העדפות, היא
 * רק בוחרת מי מהאנשים הקיימים מגיע — ולכן דוח הכיסוי מוכן מיד.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const token = new URL(request.url).searchParams.get('token');
    const household = await getStore().households.get(id);
    if (!household) return NextResponse.json({ error: 'הקבוצה לא נמצאה' }, { status: 404 });
    if (!tokenMatches(household.ownerToken, token)) {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 80) : '';
    if (!title) throw new ValidationError('צריך שם לארוחה');

    const known = new Set(household.people.map((p) => p.id));
    const attendeeIds = parseAttendeeIds(body, known);

    const event: StoredEvent = {
      id: shortId(8),
      householdId: household.id,
      cookToken: cookToken(),
      title,
      date: typeof body.date === 'string' && body.date ? body.date.slice(0, 10) : undefined,
      attendeeIds,
      dishes: [],
      minDishesPerPerson: clampInt(body.minDishesPerPerson, 1, 10, 2),
      minMainsPerPerson: clampInt(body.minMainsPerPerson, 0, 5, 1),
      createdAt: new Date().toISOString(),
    };

    await getStore().events.create(event.id, event);
    return NextResponse.json({ id: event.id, cookToken: event.cookToken });
  } catch (error) {
    return errorResponse(error, 'שגיאה ביצירת הארוחה');
  }
}
