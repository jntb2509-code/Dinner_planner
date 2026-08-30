'use client';

import { useState } from 'react';
import { shareBaseUrl } from '@/lib/baseUrl';
import ShareBox from '@/components/ShareBox';

export default function CreateEventPage() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [minDishes, setMinDishes] = useState(2);
  const [minMains, setMinMains] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ id: string; cookToken: string } | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title,
          date: date || undefined,
          minDishesPerPerson: minDishes,
          minMainsPerPerson: minMains,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'שגיאה');
      setCreated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת האירוע');
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    const origin = shareBaseUrl();
    const guestLink = `${origin}/e/${created.id}`;
    const cookLink = `${origin}/e/${created.id}/cook?t=${created.cookToken}`;
    return (
      <main>
        <h1>הארוחה נוצרה 🎉</h1>
        <div className="alert good">
          <strong>שמור את שני הלינקים האלה עכשיו.</strong>
          אין הרשמה ואין סיסמה — הלינקים הם הדרך היחידה לחזור לארוחה הזו.
        </div>

        <div className="card">
          <h3>1. הלינק למשפחה</h3>
          <p className="muted">שלח אותו בקבוצת הוואטסאפ. כל אחד ממלא את ההעדפות שלו.</p>
          <ShareBox url={guestLink} />
        </div>

        <div className="card">
          <h3>2. הלינק שלך, הטבח</h3>
          <p className="muted">
            כאן אתה רואה את כל ההעדפות ומתכנן את התפריט. <strong>אל תשתף אותו</strong> — הוא
            מכיל מידע אישי של כולם.
          </p>
          <ShareBox url={cookLink} />
          <p style={{ marginTop: 12 }}>
            <a href={cookLink}>
              <button type="button" className="primary">פתח את לוח הבקרה →</button>
            </a>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <h1>מתכנן הארוחות המשפחתי</h1>
      <p className="muted" style={{ marginBottom: 22 }}>
        פותחים ארוחה, שולחים לינק למשפחה, וכל אחד ממלא מה הוא אוכל ומה לא. אתה מקבל תמונה אחת
        ברורה של מה אפשר לבשל — ומי עלול להישאר בלי כלום.
      </p>

      <form onSubmit={create} className="card">
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="title">שם הארוחה</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="למשל: ליל הסדר אצל סבתא"
            required
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label htmlFor="date">תאריך (לא חובה)</label>
          <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <h3 style={{ marginTop: 22 }}>מה נחשב "יש לו מה לאכול"?</h3>
        <p className="muted">
          זה הסף שהמערכת תתריע כשמישהו לא עומד בו. ברירת המחדל מתאימה לרוב הארוחות.
        </p>
        <div className="grid2">
          <div>
            <label htmlFor="minDishes">מנות אפשריות לכל אחד, לפחות</label>
            <input
              id="minDishes"
              type="number"
              min={1}
              max={10}
              value={minDishes}
              onChange={(e) => setMinDishes(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 12px', fontSize: 16 }}
            />
          </div>
          <div>
            <label htmlFor="minMains">מתוכן, מנות עיקריות לפחות</label>
            <input
              id="minMains"
              type="number"
              min={0}
              max={5}
              value={minMains}
              onChange={(e) => setMinMains(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 12px', fontSize: 16 }}
            />
          </div>
        </div>

        {error && <div className="alert bad" style={{ marginTop: 14 }}>{error}</div>}

        <button type="submit" className="primary" disabled={busy} style={{ marginTop: 18 }}>
          {busy ? 'יוצר…' : 'צור ארוחה'}
        </button>
      </form>
    </main>
  );
}
