import { NextResponse } from 'next/server';
import { cookToken, shortId } from '@/lib/ids';
import { getStore } from '@/lib/store';
import { ValidationError } from '@/lib/validate';
import { errorResponse } from '@/lib/apiError';
import type { Household } from '@/lib/model';

export const dynamic = 'force-dynamic';

/** יצירת משק בית — הקבוצה הקבועה שממנה נבנות כל הארוחות. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
    if (!name) throw new ValidationError('צריך שם לקבוצה');

    const household: Household = {
      id: shortId(8),
      ownerToken: cookToken(),
      name,
      people: [],
      createdAt: new Date().toISOString(),
    };

    await getStore().households.create(household.id, household);
    return NextResponse.json({ id: household.id, ownerToken: household.ownerToken });
  } catch (error) {
    return errorResponse(error, 'שגיאה ביצירת הקבוצה');
  }
}
