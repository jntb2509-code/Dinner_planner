import { NextResponse } from 'next/server';
import { cookToken, shortId } from '@/lib/ids';
import { getStore } from '@/lib/store';
import { ValidationError } from '@/lib/validate';
import type { MealEvent } from '@/core/types';

export const dynamic = 'force-dynamic';

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 80) : '';
    if (!title) throw new ValidationError('צריך שם לארוחה');

    const event: MealEvent = {
      id: shortId(8),
      cookToken: cookToken(),
      title,
      date: typeof body.date === 'string' ? body.date.slice(0, 10) : undefined,
      participants: [],
      dishes: [],
      minDishesPerPerson: clampInt(body.minDishesPerPerson, 1, 10, 2),
      minMainsPerPerson: clampInt(body.minMainsPerPerson, 0, 5, 1),
      createdAt: new Date().toISOString(),
    };

    await getStore().create(event);
    return NextResponse.json({ id: event.id, cookToken: event.cookToken });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('create event failed', error);
    return NextResponse.json({ error: 'שגיאה ביצירת האירוע' }, { status: 500 });
  }
}
