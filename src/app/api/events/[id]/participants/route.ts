import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { shortId } from '@/lib/ids';
import { ValidationError, parseParticipant } from '@/lib/validate';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/**
 * הגשת העדפות. אם נשלח participantId קיים — עדכון; אחרת משתתף חדש.
 * המזהה נשמר אצל המשתתף ב-localStorage, כך שהוא יכול לחזור ולתקן
 * בלי הרשמה ובלי לדרוס מישהו אחר.
 */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const existingId = typeof body.participantId === 'string' ? body.participantId : null;

    const updated = await getStore().update(id, (event) => {
      const index = existingId ? event.participants.findIndex((p) => p.id === existingId) : -1;
      const participantId = index >= 0 ? existingId! : shortId(10);
      const participant = parseParticipant(body, participantId);
      const participants = [...event.participants];
      if (index >= 0) participants[index] = participant;
      else participants.push(participant);
      return { ...event, participants };
    });

    if (!updated) return NextResponse.json({ error: 'האירוע לא נמצא' }, { status: 404 });

    // מחזירים את המזהה שנוצר בפועל, כדי שהדפדפן ישמור אותו להמשך.
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 60) : '';
    const saved =
      updated.participants.find((p) => p.id === existingId) ??
      [...updated.participants].reverse().find((p) => p.name === name);
    return NextResponse.json({ participantId: saved?.id ?? null });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('save participant failed', error);
    return NextResponse.json({ error: 'שגיאה בשמירת ההעדפות' }, { status: 500 });
  }
}
