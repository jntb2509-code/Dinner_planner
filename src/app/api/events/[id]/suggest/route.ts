import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { tokenMatches } from '@/lib/validate';
import { suggestDishes } from '@/core/suggest';
import { DISH_LIBRARY } from '@/core/library';
import { errorResponse } from '@/lib/apiError';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** הצעות להשלמת התפריט. פעולת קריאה בלבד — לא משנה את האירוע. */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const url = new URL(request.url);
  try {
    const event = await getStore().get(id);
    if (!event) return NextResponse.json({ error: 'האירוע לא נמצא' }, { status: 404 });
    if (!tokenMatches(event.cookToken, url.searchParams.get('token'))) {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
    }

    const suggestions = suggestDishes(event, DISH_LIBRARY, {
      maxSuggestions: 6,
      includeCrowdPleasers: url.searchParams.get('extras') === '1',
    });
    return NextResponse.json({ suggestions });
  } catch (error) {
    return errorResponse(error, 'שגיאה בחישוב ההצעות');
  }
}
