'use client';

import { useEffect, useState } from 'react';
import {
  memberships,
  ownedHouseholds,
  rememberOwned,
  type Membership,
  type OwnedHousehold,
} from '@/lib/deviceMemory';

/**
 * לוח הבקרה האישי — הכתובת היחידה שצריך לזכור.
 *
 * המכשיר זוכר לאילו קבוצות יש לך גישה, כך שהלינקים הסודיים חוזרים
 * לתפקידם הנכון: גיבוי, ולא ממשק המשתמש.
 */
export default function HomePage() {
  const [owned, setOwned] = useState<OwnedHousehold[] | null>(null);
  const [member, setMember] = useState<Membership[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setOwned(ownedHouseholds());
    setMember(memberships());
  }, []);

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
      rememberOwned({ id: data.id, name, ownerToken: data.ownerToken });
      window.location.href = `/h/${data.id}/manage?t=${data.ownerToken}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת הקבוצה');
      setBusy(false);
    }
  }

  // עד שה-localStorage נקרא, אין לדעת מה להציג — עדיף כלום מהבהוב.
  if (owned === null) return <main><p className="muted">טוען…</p></main>;

  const hasAnything = owned.length > 0 || member.length > 0;

  return (
    <main>
      {/* הסימן המלא מוצג רק בעמוד הכניסה. בשאר המסכים הוא היה גוזל
          גובה מסך יקר בלי להוסיף מידע. */}
      <div className="hero">
        <img src="/logo-full.svg" alt="DinnerPlans" width={148} height={186} />
      </div>
      <h1 className="visually-hidden">מתכנן הארוחות המשפחתי</h1>

      {!hasAnything && (
        <p className="muted mb-5">
          כל אחד ממלא פעם אחת מה הוא אוכל ומה לא. מכאן והלאה, כשאתה פותח ארוחה אתה רק מסמן
          מי מגיע — ומיד רואה מה אפשר לבשל ומי עלול להישאר בלי כלום.
        </p>
      )}

      {owned.length > 0 && (
        <>
          <h2>הקבוצות שלי</h2>
          {owned.map((h) => (
            <a key={h.id} className="nav-card" href={`/h/${h.id}/manage?t=${h.ownerToken}`}>
              <strong>{h.name}</strong>
              <span className="muted">ניהול, ארוחות ואנשים ←</span>
            </a>
          ))}
        </>
      )}

      {member.length > 0 && (
        <>
          <h2>אני חבר/ה בקבוצות</h2>
          {member.map((m) => (
            <a key={m.householdId} className="nav-card" href={`/h/${m.householdId}`}>
              <strong>{m.name}</strong>
              <span className="muted">ההעדפות שלי והארוחות הקרובות ←</span>
            </a>
          ))}
        </>
      )}

      {hasAnything && !creating && (
        <button type="button" className="mt-3" onClick={() => setCreating(true)}>
          + קבוצה חדשה
        </button>
      )}

      {(!hasAnything || creating) && (
        <form onSubmit={create} className={hasAnything ? 'card mt-3' : 'card'}>
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
          {error && <div className="alert bad mt-4">{error}</div>}
          <div className="row mt-4">
            <button type="submit" className="primary" disabled={busy}>
              {busy ? 'יוצר…' : 'צור קבוצה'}
            </button>
            {creating && (
              <button type="button" className="ghost" onClick={() => setCreating(false)}>
                ביטול
              </button>
            )}
          </div>
        </form>
      )}

      {hasAnything && (
        <p className="muted mt-5 fine">
          הרשימה הזו נשמרת במכשיר הזה בלבד. אם תעבור מכשיר, תזדקק ללינק של הקבוצה —
          הוא נמצא בלשונית ״הזמנה״ בתוך כל קבוצה.
        </p>
      )}
    </main>
  );
}
