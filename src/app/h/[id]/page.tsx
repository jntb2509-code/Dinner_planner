'use client';

import { use, useEffect, useMemo, useState } from 'react';
import TagPicker from '@/components/TagPicker';
import { DIETS, expandDown } from '@/core/taxonomy';

interface HouseholdView {
  id: string;
  name: string;
  members: { id: string; name: string }[];
}

/** מפתח ב-localStorage: מי אני בקבוצה הזו, כדי לאפשר עריכה חוזרת. */
const idKey = (householdId: string) => `dp:person:${householdId}`;
/** ההעדפות האחרונות שמילא — ממלאות מראש הצטרפות לקבוצה נוספת. */
const PROFILE_KEY = 'dp:profile';

interface Profile {
  name: string;
  diets: string[];
  blocked: string[];
  disliked: string[];
  loved: string[];
  notes: string;
}

const EMPTY: Profile = { name: '', diets: [], blocked: [], disliked: [], loved: [], notes: '' };

export default function JoinHouseholdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [household, setHousehold] = useState<HouseholdView | null>(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState<Profile>(EMPTY);
  const [personId, setPersonId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    fetch(`/api/households/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'הקבוצה לא נמצאה');
        setHousehold(data);
      })
      .catch((err: Error) => setLoadError(err.message));
  }, [id]);

  useEffect(() => {
    try {
      setPersonId(localStorage.getItem(idKey(id)));
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored) {
        setForm({ ...EMPTY, ...(JSON.parse(stored) as Partial<Profile>) });
        setRestored(true);
      }
    } catch {
      // localStorage חסום (גלישה פרטית וכו') — הטופס פשוט מתחיל ריק.
    }
  }, [id]);

  const blockedClosure = useMemo(() => expandDown(form.blocked), [form.blocked]);
  const dislikedClosure = useMemo(() => expandDown(form.disliked), [form.disliked]);

  function patch(next: Partial<Profile>) {
    setForm((prev) => ({ ...prev, ...next }));
    setSaved(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/households/${id}/people`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, personId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'שגיאה בשמירה');
      if (data.personId) {
        setPersonId(data.personId);
        try {
          localStorage.setItem(idKey(id), data.personId);
          localStorage.setItem(PROFILE_KEY, JSON.stringify(form));
        } catch {
          // אין localStorage — נשמר בשרת בכל מקרה, רק בלי עריכה חוזרת נוחה.
        }
      }
      setSaved(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה');
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <main>
        <div className="alert bad">{loadError}</div>
        <p className="muted">בדוק שהלינק הועתק במלואו.</p>
      </main>
    );
  }
  if (!household) return <main><p className="muted">טוען…</p></main>;

  return (
    <main>
      <h1>{household.name}</h1>

      {saved && (
        <div className="alert good">
          <strong>נשמר, תודה!</strong>
          מכאן והלאה אתה מסודר — לא תצטרך למלא את זה שוב לפני כל ארוחה. אם משהו ישתנה,
          חזור ללינק הזה מאותו מכשיר ועדכן.
        </div>
      )}

      {restored && !personId && !saved && (
        <div className="alert warn">
          מילאנו מראש לפי מה שמילאת בקבוצה אחרת. עבור על זה ותקן אם משהו השתנה.
        </div>
      )}

      <p className="muted">
        מלא מה אתה <strong>לא יכול</strong> לאכול, מה אתה לא אוהב, ומה אתה אוהב במיוחד.
        לוקח דקה, <strong>ועושים את זה פעם אחת</strong> — לא לפני כל ארוחה.
      </p>

      <form onSubmit={submit}>
        <div className="card">
          <label htmlFor="name">איך קוראים לך?</label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="שם פרטי מספיק"
            required
          />
        </div>

        <div className="card">
          <h3>אורח חיים או הגבלה קבועה</h3>
          <p className="muted">אפשר לסמן כמה. זה חוסך סימון של עשרות מרכיבים בנפרד.</p>
          <div className="tags">
            {DIETS.map((diet) => {
              const on = form.diets.includes(diet.id);
              return (
                <button
                  key={diet.id}
                  type="button"
                  className="tag block"
                  aria-pressed={on}
                  title={diet.note}
                  onClick={() =>
                    patch({
                      diets: on ? form.diets.filter((d) => d !== diet.id) : [...form.diets, diet.id],
                    })
                  }
                >
                  {diet.he}
                </button>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3>❌ אסור לי לאכול</h3>
          <p className="muted">
            אלרגיה, רגישות, או סירוב מוחלט. מנה שמכילה את זה לא תיחשב זמינה עבורך בכלל.
          </p>
          <TagPicker
            variant="block"
            selected={form.blocked}
            onChange={(blocked) =>
              patch({
                blocked,
                disliked: form.disliked.filter((t) => !expandDown(blocked).has(t)),
                loved: form.loved.filter((t) => !expandDown(blocked).has(t)),
              })
            }
          />
        </div>

        {/* שתי הסקציות הרכות מקופלות: החלק ההכרחי הוא "אסור לי", והצגת
            שלוש רשימות מרכיבים זהות פתוחות הופכת את הטופס לארוך מדי
            ואנשים נוטשים באמצע. */}
        <details className="card">
          <summary>
            <strong>😕 פשוט לא אוהב</strong>
            {form.disliked.length > 0 && (
              <span className="pill" style={{ marginInlineStart: 8 }}>{form.disliked.length}</span>
            )}
          </summary>
          <p className="muted">אפשר לשים בשולחן, רק שלא תהיה זו המנה היחידה שלך.</p>
          <TagPicker
            variant="dislike"
            selected={form.disliked}
            onChange={(disliked) =>
              patch({ disliked, loved: form.loved.filter((t) => !expandDown(disliked).has(t)) })
            }
            disabled={blockedClosure}
          />
        </details>

        <details className="card">
          <summary>
            <strong>😍 אוהב במיוחד</strong>
            {form.loved.length > 0 && (
              <span className="pill" style={{ marginInlineStart: 8 }}>{form.loved.length}</span>
            )}
          </summary>
          <p className="muted">לא חובה, אבל עוזר לבחור בין שתי אפשרויות שקולות.</p>
          <TagPicker
            variant="love"
            selected={form.loved}
            onChange={(loved) => patch({ loved })}
            disabled={new Set([...blockedClosure, ...dislikedClosure])}
          />
        </details>

        <div className="card">
          <label htmlFor="notes">משהו נוסף שכדאי שהמבשל יידע?</label>
          <p className="muted">
            טקסט חופשי. זה מוצג למבשל כפי שהוא, אבל לא נכנס לחישוב — מה שחשוב באמת, סמן למעלה.
          </p>
          <textarea
            id="notes"
            value={form.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            placeholder="למשל: משתדל להימנע ממטוגן, אבל זה לא קריטי"
          />
        </div>

        {error && <div className="alert bad">{error}</div>}

        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'שומר…' : personId ? 'עדכן את ההעדפות שלי' : 'הצטרף לקבוצה'}
        </button>
      </form>

      {household.members.length > 0 && (
        <>
          <h2>כבר בקבוצה ({household.members.length})</h2>
          <p className="muted">{household.members.map((p) => p.name).join(' · ')}</p>
        </>
      )}
    </main>
  );
}
