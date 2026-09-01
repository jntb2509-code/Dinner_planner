'use client';

import { Suspense, use, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ShareBox from '@/components/ShareBox';
import Tabs from '@/components/Tabs';
import { shareBaseUrl } from '@/lib/baseUrl';
import { rememberOwned } from '@/lib/deviceMemory';
import { DIET_BY_ID, tagName } from '@/core/taxonomy';
import type { Household } from '@/lib/model';

interface EventSummary {
  id: string;
  title: string;
  date?: string;
  createdAt: string;
  cookToken: string;
  dishCount: number;
  attendees: string[];
}

type TabId = 'meals' | 'people' | 'invite';

export default function ManagePageWrapper({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main><p className="muted">טוען…</p></main>}>
      <ManagePage params={params} />
    </Suspense>
  );
}

function ManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const token = useSearchParams().get('t') ?? '';

  const [household, setHousehold] = useState<Household | null>(null);
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [tab, setTab] = useState<TabId>('meals');
  const [error, setError] = useState('');
  const [busyPerson, setBusyPerson] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [hRes, eRes] = await Promise.all([
        fetch(`/api/households/${id}?token=${encodeURIComponent(token)}`),
        fetch(`/api/households/${id}/events?token=${encodeURIComponent(token)}`),
      ]);
      const hBody = await hRes.json();
      if (!hRes.ok) throw new Error(hBody.error ?? 'שגיאה');
      if (!hBody.household) throw new Error('הלינק אינו תקין — חסר או שגוי הקוד שלך.');
      setHousehold(hBody.household);
      // הגעת לכאן עם טוקן תקין, אז שווה לזכור — כדי שלא תצטרך את הלינק שוב.
      rememberOwned({ id, name: hBody.household.name, ownerToken: token });

      const eBody = await eRes.json();
      if (eRes.ok) setEvents(eBody.events ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינה');
    }
  }, [id, token]);

  useEffect(() => { void load(); }, [load]);

  async function removePerson(personId: string, name: string) {
    if (!confirm(`להסיר את ${name} מהקבוצה? ההעדפות שמילא/ה יימחקו.`)) return;
    setBusyPerson(personId);
    try {
      const res = await fetch(
        `/api/households/${id}/people/${personId}?token=${encodeURIComponent(token)}`,
        { method: 'DELETE' },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'שגיאה בהסרה');
      setHousehold(body.household);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהסרה');
    } finally {
      setBusyPerson(null);
    }
  }

  async function deleteEvent(eventId: string, title: string) {
    if (!confirm(`למחוק את "${title}"? התפריט שתכננת יימחק.`)) return;
    try {
      const res = await fetch(`/api/events/${eventId}?token=${encodeURIComponent(token)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'שגיאה');
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה במחיקה');
    }
  }

  if (error && !household) {
    return (
      <main>
        <div className="alert bad">{error}</div>
        <p className="muted">ודא שהעתקת את הלינק שלך במלואו, כולל החלק שאחרי ‎?t=‎.</p>
        <p><a href="/">← לוח הבקרה</a></p>
      </main>
    );
  }
  if (!household) return <main><p className="muted">טוען…</p></main>;

  const origin = shareBaseUrl();
  const joinLink = `${origin}/h/${household.id}`;

  return (
    <main>
      <header className="app-bar">
        <h1 className="no-margin">{household.name}</h1>
        <a className="brand" href="/">
          <img src="/logo-mark.svg" alt="" width={40} height={40} />
        </a>
        <a href="/">← כל הקבוצות</a>
      </header>
      <p className="muted">{household.people.length} אנשים · {events.length} ארוחות</p>

      {error && <div className="alert bad">{error}</div>}

      <Tabs<TabId>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'meals', label: 'ארוחות', badge: events.length },
          { id: 'people', label: 'אנשים', badge: household.people.length },
          { id: 'invite', label: 'הזמנה' },
        ]}
      />

      {tab === 'meals' && (
        <MealsTab
          household={household}
          events={events}
          token={token}
          onDelete={deleteEvent}
        />
      )}

      {tab === 'people' && (
        <>
          {household.people.length === 0 ? (
            <div className="empty">
              עוד אף אחד לא הצטרף.<br />
              עבור ללשונית ״הזמנה״ ושלח את הלינק למשפחה.
            </div>
          ) : (
            <ul className="list">
              {household.people.map((p) => (
                <li key={p.id}>
                  <div className="row between">
                    <strong>{p.name}</strong>
                    <button
                      type="button"
                      className="ghost small"
                      disabled={busyPerson === p.id}
                      onClick={() => void removePerson(p.id, p.name)}
                    >
                      {busyPerson === p.id ? 'מסיר…' : 'הסר'}
                    </button>
                  </div>
                  {p.diets.length > 0 && (
                    <div className="muted">
                      {p.diets.map((d) => DIET_BY_ID.get(d)?.he ?? d).join(' · ')}
                    </div>
                  )}
                  {p.blocked.length > 0 && (
                    <div className="blocked-list">
                      ❌ {p.blocked.map(tagName).join(', ')}
                    </div>
                  )}
                  {p.disliked.length > 0 && (
                    <div className="muted">😕 {p.disliked.map(tagName).join(', ')}</div>
                  )}
                  {p.loved.length > 0 && <div className="muted">😍 {p.loved.map(tagName).join(', ')}</div>}
                  {p.notes && <div className="note-line">💬 {p.notes}</div>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === 'invite' && (
        <>
          <div className="card">
            <h3>הלינק למשפחה</h3>
            <p className="muted">
              שלח אותו פעם אחת בקבוצת הוואטסאפ. כל אחד ממלא את ההעדפות שלו פעם אחת, ולא
              לפני כל ארוחה מחדש.
            </p>
            <ShareBox url={joinLink} />
            <WhatsAppBox link={joinLink} />
          </div>

          <div className="card">
            <h3>הלינק הפרטי שלך</h3>
            <div className="alert warn mb-3">
              <strong>אל תשתף אותו.</strong>
              הוא חושף את האלרגיות והמידע הרפואי של כל מי שבקבוצה.
            </div>
            <p className="muted">
              המכשיר הזה כבר זוכר אותך, אז בדרך כלל לא תצטרך אותו. שמור אותו בצד למקרה
              שתעבור מכשיר או תנקה את הדפדפן.
            </p>
            <ShareBox url={`${origin}/h/${household.id}/manage?t=${token}`} />
          </div>
        </>
      )}
    </main>
  );
}

/** טקסט מוכן להדבקה בוואטסאפ — חוסך מהמארגן לנסח את זה בעצמו. */
function WhatsAppBox({ link }: { link: string }) {
  const message =
    'היי 🍽️ הכנתי משהו קטן שיעזור לנו לתכנן ארוחות משפחתיות.\n\n' +
    'כל אחד ממלא פעם אחת מה הוא לא יכול לאכול, מה הוא פחות אוהב ומה הוא אוהב במיוחד. ' +
    'לוקח דקה.\n\n' +
    'חשוב: אם יש אלרגיה או משהו רפואי — סמנו את זה דווקא בחלק "אסור לי לאכול". ' +
    'זה החלק הקריטי.\n\n' +
    `${link}\n\n` +
    'זה פעם אחת בלבד — לא צריך למלא שוב לפני כל ארוחה.';

  return (
    <p className="mt-3">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <button type="button" className="primary">שלח בוואטסאפ עם הסבר מוכן →</button>
      </a>
    </p>
  );
}

/** לשונית הארוחות: רשימת מה שכבר נפתח, ופתיחת ארוחה חדשה. */
function MealsTab({
  household,
  events,
  token,
  onDelete,
}: {
  household: Household;
  events: EventSummary[];
  token: string;
  onDelete: (id: string, title: string) => void;
}) {
  // מאתחל אחד של useState רץ פעם אחת בלבד, לפני שהארוחות נטענו — ולכן
  // הטופס נפתח גם כשכבר יש ארוחות. נגזר מהנתונים, עם דריסה מפורשת.
  const [openOverride, setOpenOverride] = useState<boolean | null>(null);
  const open = openOverride ?? events.length === 0;
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [minDishes, setMinDishes] = useState(2);
  const [minMains, setMinMains] = useState(1);
  const [attending, setAttending] = useState<Set<string>>(
    () => new Set(household.people.map((p) => p.id)),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(
        `/api/households/${household.id}/events?token=${encodeURIComponent(token)}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title,
            date: date || undefined,
            attendeeIds: [...attending],
            minDishesPerPerson: minDishes,
            minMainsPerPerson: minMains,
          }),
        },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'שגיאה');
      // נכנסים ישר לתכנון. הטוקן של הקבוצה מספיק לגישה, אז אין לינק חדש לשמור.
      window.location.href = `/e/${body.id}/cook?t=${encodeURIComponent(token)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת הארוחה');
      setBusy(false);
    }
  }

  return (
    <>
      {events.length > 0 && (
        <>
          {events.map((e) => (
            <div className="nav-card" key={e.id}>
              <div className="row between">
                <a
                  href={`/e/${e.id}/cook?t=${encodeURIComponent(token)}`}
                  className="plain-link grow"
                >
                  <strong>{e.title}</strong>
                  <span className="muted">
                    {e.date ? `${new Date(e.date).toLocaleDateString('he-IL')} · ` : ''}
                    {e.attendees.length} מגיעים ·{' '}
                    {e.dishCount === 0 ? 'עוד לא תוכנן תפריט' : `${e.dishCount} מנות`}
                  </span>
                </a>
                <button
                  type="button"
                  className="ghost small"
                  onClick={() => onDelete(e.id, e.title)}
                >
                  מחק
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {!open && (
        <button type="button" className="primary" onClick={() => setOpenOverride(true)}>
          + ארוחה חדשה
        </button>
      )}

      {open && household.people.length === 0 && (
        <div className="empty">
          עוד אף אחד לא הצטרף לקבוצה.<br />
          עבור ללשונית ״הזמנה״ ושלח את הלינק, ואז אפשר יהיה לפתוח ארוחה.
        </div>
      )}

      {open && household.people.length > 0 && (
        <form onSubmit={create} className="card mt-3">
          <div className="mb-4">
            <label htmlFor="title">שם הארוחה</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(ev) => setTitle(ev.target.value)}
              placeholder="למשל: ליל הסדר אצל סבתא"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="date">תאריך (לא חובה)</label>
            <input id="date" type="date" value={date} onChange={(ev) => setDate(ev.target.value)} />
          </div>

          <label>מי מגיע?</label>
          <p className="muted">
            הכל מסומן כברירת מחדל. הורד את מי שלא בא — {attending.size} מתוך{' '}
            {household.people.length} מסומנים.
          </p>
          <div className="tags mb-4">
            {household.people.map((p) => (
              <button
                key={p.id}
                type="button"
                className="tag love"
                aria-pressed={attending.has(p.id)}
                onClick={() =>
                  setAttending((prev) => {
                    const next = new Set(prev);
                    if (next.has(p.id)) next.delete(p.id);
                    else next.add(p.id);
                    return next;
                  })
                }
              >
                {p.name}
              </button>
            ))}
          </div>

          <details>
            <summary className="disclosure">
              מה נחשב &quot;יש לו מה לאכול&quot;? (ברירת המחדל מתאימה לרוב הארוחות)
            </summary>
            <div className="grid2">
              <div>
                <label htmlFor="minDishes">מנות אפשריות לכל אחד, לפחות</label>
                <input
                  id="minDishes"
                  type="number"
                  min={1}
                  max={10}
                  value={minDishes}
                  onChange={(ev) => setMinDishes(Number(ev.target.value))}
                  className="num-field"
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
                  onChange={(ev) => setMinMains(Number(ev.target.value))}
                  className="num-field"
                />
              </div>
            </div>
          </details>

          {error && <div className="alert bad mt-3">{error}</div>}

          <div className="row mt-4">
            <button type="submit" className="primary" disabled={busy || attending.size === 0}>
              {busy ? 'פותח…' : 'פתח ארוחה'}
            </button>
            {events.length > 0 && (
              <button type="button" className="ghost" onClick={() => setOpenOverride(false)}>
                ביטול
              </button>
            )}
            {attending.size === 0 && <span className="muted">סמן לפחות אדם אחד</span>}
          </div>
        </form>
      )}
    </>
  );
}
