import { NextResponse } from 'next/server';
import { canAccessEvent, loadEvent } from '@/lib/loadEvent';
import { errorResponse } from '@/lib/apiError';
import { suggestDishes } from '@/core/suggest';
import { DISH_LIBRARY } from '@/core/library';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** הצעות להשלמת התפריט. פעולת קריאה בלבד — לא משנה את הארוחה. */
export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const url = new URL(request.url);
  try {
    const loaded = await loadEvent(id);
    if (!loaded) return NextResponse.json({ error: 'הארוחה לא נמצאה' }, { status: 404 });
    if (!canAccessEvent(loaded, url.searchParams.get('token'))) {
      return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 });
    }

    const suggestions = suggestDishes(loaded.resolved, DISH_LIBRARY, {
      maxSuggestions: 6,
      includeCrowdPleasers: url.searchParams.get('extras') === '1',
    });
    return NextResponse.json({ suggestions });
  } catch (error) {
    return errorResponse(error, 'שגיאה בחישוב ההצעות');
  }
}
