'use client';

import { useState } from 'react';
import ShareBox from '@/components/ShareBox';
import { shareBaseUrl } from '@/lib/baseUrl';

export default function CreateHouseholdPage() {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ id: string; ownerToken: string } | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/households', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'שגיאה');
      setCreated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת הקבוצה');
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    const origin = shareBaseUrl();
    const joinLink = `${origin}/h/${created.id}`;
    const manageLink = `${origin}/h/${created.id}/manage?t=${created.ownerToken}`;
    return (
      <main>
        <h1>הקבוצה נוצרה 🎉</h1>
        <div className="alert good">
          <strong>שמור את שני הלינקים האלה עכשיו.</strong>
          אין הרשמה ואין סיסמה — הלינקים הם הדרך היחידה לחזור לקבוצה הזו.
        </div>

        <div className="card">
          <h3>1. הלינק למשפחה</h3>
          <p className="muted">
            שלח אותו פעם אחת בקבוצת הוואטסאפ. כל אחד ממלא את ההעדפות שלו — <strong>פעם
            אחת בחיים</strong>, לא בכל ארוחה מחדש.
          </p>
          <ShareBox url={joinLink} />
        </div>

        <div className="card">
          <h3>2. הלינק שלך</h3>
          <p className="muted">
            כאן אתה פותח ארוחות ורואה את כל ההעדפות. <strong>אל תשתף אותו</strong> — הוא
            מכיל מידע אישי של כולם.
          </p>
          <ShareBox url={manageLink} />
          <p style={{ marginTop: 12 }}>
            <a href={manageLink}>
              <button type="button" className="primary">פתח את הקבוצה →</button>
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
        כל אחד ממלא פעם אחת מה הוא אוכל ומה לא. מכאן והלאה, כשאתה פותח ארוחה אתה רק מסמן
        מי מגיע — ומיד רואה מה אפשר לבשל ומי עלול להישאר בלי כלום.
      </p>

      <form onSubmit={create} className="card">
        <label htmlFor="name">איך נקרא לקבוצה?</label>
        <p className="muted">
          זו הקבוצה הקבועה שממנה ייבנו כל הארוחות. אפשר לפתוח כמה קבוצות נפרדות — למשל
          אחת למשפחה ואחת למחותנים.
        </p>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="למשל: משפחת כהן"
          required
        />

        {error && <div className="alert bad" style={{ marginTop: 14 }}>{error}</div>}

        <button type="submit" className="primary" disabled={busy} style={{ marginTop: 18 }}>
          {busy ? 'יוצר…' : 'צור קבוצה'}
        </button>
      </form>
    </main>
  );
}
