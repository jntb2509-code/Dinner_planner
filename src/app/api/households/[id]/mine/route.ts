import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { errorResponse } from '@/lib/apiError';
import { resolveEvent } from '@/lib/model';
import { evaluateDish, resolveConstraints } from '@/core/matching';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/**
 * מה שבן משפחה רואה על עצמו: ההעדפות שלו והארוחות שהוא מוזמן אליהן.
 *
 * מזהה האדם משמש כאן כמפתח גישה לרשומה שלו בלבד. במכוון לא מוחזר שום
 * דבר על משתתפים אחרים — לא שמות, לא העדפות, ובוודאי לא אלרגיות.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const personId = typeof body.personId === 'string' ? body.personId : '';

    const store = getStore();
    const household = await store.households.get(id);
    if (!household) return NextResponse.json({ error: 'הקבוצה לא נמצאה' }, { status: 404 });

    const me = household.people.find((p) => p.id === personId);
    if (!me) return NextResponse.json({ error: 'לא נמצאת בקבוצה' }, { status: 404 });

    const constraints = resolveConstraints(me);
    const events = await store.events.listByHousehold(id);

    const mine = events
      .filter((e) => e.attendeeIds.includes(personId))
      .map((stored) => {
        const resolved = resolveEvent(household, stored);
        const canEat: string[] = [];
        const cannotEat: string[] = [];
        for (const dish of resolved.dishes) {
          const verdict = evaluateDish(dish, constraints);
          if (verdict.status === 'blocked' || verdict.status === 'uncertain') cannotEat.push(dish.name);
          else canEat.push(dish.name);
        }
        return {
          id: stored.id,
          title: stored.title,
          date: stored.date,
          plannedDishes: resolved.dishes.length,
          canEat,
          cannotEat,
        };
      });

    return NextResponse.json({ household: { id: household.id, name: household.name }, me, events: mine });
  } catch (error) {
    return errorResponse(error, 'שגיאה בטעינת הארוחות שלך');
  }
}
