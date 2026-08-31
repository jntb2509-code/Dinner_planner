import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { shortId } from '@/lib/ids';
import { parsePerson } from '@/lib/validate';
import { errorResponse } from '@/lib/apiError';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/**
 * הצטרפות לקבוצה או עדכון ההעדפות שלי.
 *
 * זו הפעולה שבן משפחה עושה פעם אחת בחיים. המזהה שלו נשמר אצלו
 * ב-localStorage, כך שהוא יכול לחזור ולתקן בלי הרשמה ובלי לדרוס אחר.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const existingId = typeof body.personId === 'string' ? body.personId : null;

    let savedId: string | null = null;
    const updated = await getStore().households.update(id, (household) => {
      const index = existingId ? household.people.findIndex((p) => p.id === existingId) : -1;
      savedId = index >= 0 ? existingId! : shortId(10);
      const person = parsePerson(body, savedId);
      const people = [...household.people];
      if (index >= 0) people[index] = person;
      else people.push(person);
      return { ...household, people };
    });

    if (!updated) return NextResponse.json({ error: 'הקבוצה לא נמצאה' }, { status: 404 });
    return NextResponse.json({ personId: savedId });
  } catch (error) {
    return errorResponse(error, 'שגיאה בשמירת ההעדפות');
  }
}
