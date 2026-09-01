'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import TagPicker from '@/components/TagPicker';
import Tabs from '@/components/Tabs';
import { DIETS, DIET_BY_ID, expandDown, tagName } from '@/core/taxonomy';
import {
  lastProfile,
  membershipIn,
  rememberMembership,
  rememberProfile,
} from '@/lib/deviceMemory';

interface HouseholdView {
  id: string;
  name: string;
  members: { id: string; name: string }[];
}

interface MyEvent {
  id: string;
  title: string;
  date?: string;
  plannedDishes: number;
  canEat: string[];
  cannotEat: string[];
}

type TabId = 'me' | 'meals';

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
  const [tab, setTab] = useState<TabId>('me');
  const [editing, setEditing] = useState(false);
  const [myEvents, setMyEvents] = useState<MyEvent[] | null>(null);

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
    const known = membershipIn(id);
    setPersonId(known?.personId ?? null);
    // מי שכבר רשום לא אמור לראות טופס ריק — הוא רואה את מה שמילא.
    setEditing(!known);
    const stored = lastProfile<Partial<Profile>>();
    if (stored && !known) {
      setForm({ ...EMPTY, ...stored });
      setRestored(true);
    }
  }, [id]);

  /** הרשומה שלי מהשרת — מקור האמת, גם אם מילאתי ממכשיר אחר. */
  const loadMine = useCallback(async () => {
    if (!personId) return;
    try {
      const res = await fetch(`/api/households/${id}/mine`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ personId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'שגיאה');
      setMyEvents(body.events);
      setForm({
        name: body.me.name,
        diets: body.me.diets,
        blocked: body.me.blocked,
        disliked: body.me.disliked,
        loved: body.me.loved,
        notes: body.me.notes ?? '',
      });
    } catch {
      // אם הרשומה נעלמה (הוסרה מהקבוצה) — נחזור למצב הצטרפות.
      setPersonId(null);
      setEditing(true);
    }
  }, [id, personId]);

  useEffect(() => { void loadMine(); }, [loadMine]);

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
        rememberMembership({
          householdId: id,
          name: household?.name ?? '',
          personId: data.personId,
        });
        rememberProfile(form);
      }
      setEditing(false);
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

  const registered = personId !== null;

  return (
    <main>
      <header className="app-bar">
        <h1 className="no-margin">{household.name}</h1>
        <a className="brand" href="/">
          <img src="/logo-mark.svg" alt="" width={40} height={40} />
        </a>
        <a href="/">← הקבוצות שלי</a>
      </header>

      {registered && (
        <Tabs<TabId>
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'me', label: 'ההעדפות שלי' },
            { id: 'meals', label: 'הארוחות שלי', badge: myEvents?.length ?? 0 },
          ]}
        />
      )}

      {registered && tab === 'meals' && (
        <MyMeals events={myEvents} name={form.name} />
      )}

      {saved && tab === 'me' && (
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

      {tab === 'me' && !editing && registered && (
        <>
          <div className="card">
            <div className="row between">
              <div>
                <strong className="person-name">{form.name}</strong>
                <div className="muted">אתה רשום בקבוצה ✓</div>
              </div>
              <button type="button" onClick={() => setEditing(true)}>ערוך</button>
            </div>
          </div>
          <MyPreferences form={form} />
          <p className="fine">
            ההעדפות שלך תקפות לכל ארוחה בקבוצה. אם משהו משתנה — לחץ ״ערוך״.
          </p>
        </>
      )}

      {tab === 'me' && editing && (
      <>
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
              <span className="pill">{form.disliked.length}</span>
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
              <span className="pill">{form.loved.length}</span>
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

        <div className="row">
          <button type="submit" className="primary" disabled={busy}>
            {busy ? 'שומר…' : registered ? 'שמור שינויים' : 'הצטרף לקבוצה'}
          </button>
          {registered && (
            <button type="button" className="ghost" onClick={() => { setEditing(false); void loadMine(); }}>
              ביטול
            </button>
          )}
        </div>
      </form>
      </>
      )}

      {tab === 'me' && !registered && household.members.length > 0 && (
        <>
          <h2>כבר בקבוצה ({household.members.length})</h2>
          <p className="muted">{household.members.map((p) => p.name).join(' · ')}</p>
        </>
      )}
    </main>
  );
}

/** סיכום ההעדפות שלי, לקריאה. */
function MyPreferences({ form }: { form: Profile }) {
  const rows: [string, string][] = [];
  if (form.diets.length) {
    rows.push(['אורח חיים', form.diets.map((d) => DIET_BY_ID.get(d)?.he ?? d).join(' · ')]);
  }
  if (form.blocked.length) rows.push(['❌ אסור לי', form.blocked.map(tagName).join(', ')]);
  if (form.disliked.length) rows.push(['😕 לא אוהב', form.disliked.map(tagName).join(', ')]);
  if (form.loved.length) rows.push(['😍 אוהב', form.loved.map(tagName).join(', ')]);
  if (form.notes) rows.push(['💬 הערה', form.notes]);

  if (rows.length === 0) {
    return (
      <div className="empty">
        לא סימנת שום הגבלה — כלומר אתה אוכל הכל.<br />
        אם זה לא מדויק, לחץ ״ערוך״.
      </div>
    );
  }

  return (
    <ul className="list card">
      {rows.map(([label, value]) => (
        <li key={label}>
          <div className="fine">{label}</div>
          <div>{value}</div>
        </li>
      ))}
    </ul>
  );
}

/** הארוחות שאני מוזמן אליהן, ומה אני יכול לקחת מהן. */
function MyMeals({ events, name }: { events: MyEvent[] | null; name: string }) {
  if (events === null) return <p className="muted">טוען…</p>;
  if (events.length === 0) {
    return (
      <div className="empty">
        אין ארוחות שאתה מוזמן אליהן כרגע.<br />
        כשתיפתח ארוחה, היא תופיע כאן.
      </div>
    );
  }

  return (
    <>
      {events.map((e) => (
        <div className="card" key={e.id}>
          <h3>{e.title}</h3>
          {e.date && (
            <div className="muted">{new Date(e.date).toLocaleDateString('he-IL')}</div>
          )}

          {e.plannedDishes === 0 ? (
            <p className="muted mt-2">התפריט עוד לא תוכנן.</p>
          ) : e.canEat.length === 0 ? (
            <div className="alert bad mt-3">
              <strong>אין כאן משהו שמתאים לך.</strong>
              שווה לומר מילה למי שמבשל.
            </div>
          ) : (
            <>
              <div className="alert good mt-3">
                <strong>{e.canEat.length} מנות מתאימות לך</strong>
                {e.canEat.join(' · ')}
              </div>
              {e.cannotEat.length > 0 && (
                <p className="fine">
                  לא בשבילך: {e.cannotEat.join(' · ')}
                </p>
              )}
            </>
          )}
        </div>
      ))}
      <p className="fine">
        מוצג לפי ההעדפות שמילא/ה {name}.
      </p>
    </>
  );
}
