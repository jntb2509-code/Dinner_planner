import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { MealEvent } from '@/core/types';

/**
 * שכבת אחסון מופשטת.
 *
 * בפיתוח מקומי הכל נשמר בקובץ JSON — אפס הגדרות, פותחים ורצים.
 * בענן, אם מוגדר DATABASE_URL (Vercel מזריק אותו אוטומטית כשמחברים
 * מסד נתונים), עוברים ל-Postgres. שאר המערכת לא יודעת מי מהם פעיל.
 */
export interface Store {
  create(event: MealEvent): Promise<MealEvent>;
  get(id: string): Promise<MealEvent | null>;
  /**
   * עדכון אטומי. חובה שיהיה אטומי: בני משפחה ממלאים את הטופס בו-זמנית
   * מהוואטסאפ, וקריאה-שינוי-כתיבה רגילה הייתה מאבדת תשובות.
   */
  update(id: string, mutate: (event: MealEvent) => MealEvent): Promise<MealEvent | null>;
}

// ---------------------------------------------------------------- קובץ מקומי

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'events.json');

class FileStore implements Store {
  /** תור סדרתי — מבטיח שעדכונים לא ידרסו זה את זה בתוך אותו תהליך. */
  private queue: Promise<unknown> = Promise.resolve();

  private serialize<T>(work: () => Promise<T>): Promise<T> {
    const next = this.queue.then(work, work);
    this.queue = next.catch(() => undefined);
    return next;
  }

  private async readAll(): Promise<Record<string, MealEvent>> {
    try {
      return JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
    } catch {
      return {};
    }
  }

  private async writeAll(all: Record<string, MealEvent>): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DATA_FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(all, null, 2), 'utf8');
    await fs.rename(tmp, DATA_FILE);
  }

  create(event: MealEvent): Promise<MealEvent> {
    return this.serialize(async () => {
      const all = await this.readAll();
      all[event.id] = event;
      await this.writeAll(all);
      return event;
    });
  }

  async get(id: string): Promise<MealEvent | null> {
    const all = await this.readAll();
    return all[id] ?? null;
  }

  update(id: string, mutate: (event: MealEvent) => MealEvent): Promise<MealEvent | null> {
    return this.serialize(async () => {
      const all = await this.readAll();
      const existing = all[id];
      if (!existing) return null;
      const updated = mutate(existing);
      all[id] = updated;
      await this.writeAll(all);
      return updated;
    });
  }
}

// ------------------------------------------------------------------ Postgres

class PostgresStore implements Store {
  private ready: Promise<import('postgres').Sql> | null = null;

  private connect(): Promise<import('postgres').Sql> {
    this.ready ??= (async () => {
      const { default: postgres } = await import('postgres');
      const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
      await sql`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      return sql;
    })();
    return this.ready;
  }

  async create(event: MealEvent): Promise<MealEvent> {
    const sql = await this.connect();
    await sql`INSERT INTO events (id, data) VALUES (${event.id}, ${sql.json(event as never)})`;
    return event;
  }

  async get(id: string): Promise<MealEvent | null> {
    const sql = await this.connect();
    const rows = await sql<{ data: MealEvent }[]>`SELECT data FROM events WHERE id = ${id}`;
    return rows[0]?.data ?? null;
  }

  async update(id: string, mutate: (event: MealEvent) => MealEvent): Promise<MealEvent | null> {
    const sql = await this.connect();
    return sql.begin(async (tx) => {
      // FOR UPDATE נועל את השורה עד סוף הטרנזקציה, כך ששתי הגשות
      // בו-זמנית של אותו אירוע מסתדרות בתור במקום לדרוס זו את זו.
      const rows = await tx<{ data: MealEvent }[]>`
        SELECT data FROM events WHERE id = ${id} FOR UPDATE
      `;
      if (!rows[0]) return null;
      const updated = mutate(rows[0].data);
      await tx`UPDATE events SET data = ${tx.json(updated as never)} WHERE id = ${id}`;
      return updated;
    }) as Promise<MealEvent | null>;
  }
}

let cached: Store | null = null;

export function getStore(): Store {
  cached ??= process.env.DATABASE_URL ? new PostgresStore() : new FileStore();
  return cached;
}
