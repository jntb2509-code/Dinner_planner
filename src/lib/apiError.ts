import { NextResponse } from 'next/server';
import { StorageNotConfiguredError } from './store';
import { ValidationError } from './validate';
import { LegacyEventError } from './loadEvent';

/**
 * תרגום אחיד של שגיאות לתשובת HTTP. ריכוז במקום אחד כדי ששגיאה שהמשתמש
 * יכול לתקן בעצמו לא תיבלע בטעות כ-500 כללי באחת מנקודות הקצה.
 */
export function errorResponse(error: unknown, fallback: string): NextResponse {
  if (error instanceof StorageNotConfiguredError) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  if (error instanceof LegacyEventError) {
    return NextResponse.json({ error: error.message }, { status: 410 });
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
