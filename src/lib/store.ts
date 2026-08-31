import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Household, StoredEvent } from './model';

/**
 * שכבת אחסון מופשטת.
 *
 * בפיתוח מקומי הכל נשמר בקובץ JSON — אפס הגדרות, פותחים ורצים.
 * בענן, אם מוגדר DATABASE_URL (Vercel מזריק אותו אוטומטית כשמחברים
 * מסד נתונים), עוברים ל-Postgres. שאר המערכת לא יודעת מי מהם פעיל.
 */

/**
 * אין לאן לכתוב. נזרק במקום להחזיר שגיאה כללית, כדי שהמשתמש יקבל הוראה
 * מה לעשות ולא 500 סתום.
 */
export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      'מסד הנתונים עדיין לא מחובר. בפרויקט ב-Vercel: Storage ← Create Database ← ' +
        'בחר Postgres ← Connect, ואז Redeploy.',
    );
  }
}

/** אוסף של ישויות מאותו סוג, לפי מזהה. */
export interface Collection<T> {
  create(id: string, value: T): Promise<T>;
  get(id: string): Promise<T | null>;
  /**
   * עדכון אטומי. חובה שיהיה אטומי: בני משפחה ממלאים את הטופס בו-זמנית
   * מהוואטסאפ, וקריאה-שינוי-כתיבה רגילה הייתה מאבדת תשובות.
   */
  update(id: string, mutate: (value: T) => T): Promise<T | null>;
}

export interface Store {
  households: Collection<Household>;
  events: Collection<StoredEvent>;
}

// ---------------------------------------------------------------- קובץ מקומי

const DATA_DIR = path.join(process.cwd(), 'data');

/** תור סדרתי אחד לכל התהליך — מונע משתי כתיבות לדרוס זו את זו. */
let fileQueue: Promise<unknown> = Promise.resolve();

function serialize<T>(work: () => Promise<T>): Promise<T> {
  const next = fileQueue.then(work, work);
  fileQueue = next.catch(() => undefined);
  return next;
}

class FileCollection<T> implements Collection<T> {
  constructor(private readonly file: string) {}

  private get path(): string {
    return path.join(DATA_DIR, this.file);
  }

  private async readAll(): Promise<Record<string, T>> {
    try {
      return JSON.parse(await fs.readFile(this.path, 'utf8'));
    } catch {
      return {};
    }
  }

  private async writeAll(all: Record<string, T>): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${this.path}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(all, null, 2), 'utf8');
    await fs.rename(tmp, this.path);
  }

  create(id: string, value: T): Promise<T> {
    return serialize(async () => {
      const all = await this.readAll();
      all[id] = value;
      await this.writeAll(all);
      return value;
    });
  }

  async get(id: string): Promise<T | null> {
    return (await this.readAll())[id] ?? null;
  }

  update(id: string, mutate: (value: T) => T): Promise<T | null> {
    return serialize(async () => {
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

type Sql = import('postgres').Sql;

let sqlReady: Promise<Sql> | null = null;

function connect(): Promise<Sql> {
  sqlReady ??= (async () => {
    const { default: postgres } = await import('postgres');
    const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
    await sql`
      CREATE TABLE IF NOT EXISTS households (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    return sql;
  })();
  return sqlReady;
}

class PostgresCollection<T> implements Collection<T> {
  constructor(private readonly table: 'households' | 'events') {}

  async create(id: string, value: T): Promise<T> {
    const sql = await connect();
    const rows = sql(this.table);
    await sql`INSERT INTO ${rows} (id, data) VALUES (${id}, ${sql.json(value as never)})`;
    return value;
  }

  async get(id: string): Promise<T | null> {
    const sql = await connect();
    const rows = sql(this.table);
    const found = await sql<{ data: T }[]>`SELECT data FROM ${rows} WHERE id = ${id}`;
    return found[0]?.data ?? null;
  }

  async update(id: string, mutate: (value: T) => T): Promise<T | null> {
    const sql = await connect();
    const table = this.table;
    return sql.begin(async (tx) => {
      const rows = tx(table);
      // FOR UPDATE נועל את השורה עד סוף הטרנזקציה, כך ששתי הגשות
      // בו-זמנית מסתדרות בתור במקום לדרוס זו את זו.
      const found = await tx<{ data: T }[]>`
        SELECT data FROM ${rows} WHERE id = ${id} FOR UPDATE
      `;
      if (!found[0]) return null;
      const updated = mutate(found[0].data);
      await tx`UPDATE ${rows} SET data = ${tx.json(updated as never)} WHERE id = ${id}`;
      return updated;
    }) as Promise<T | null>;
  }
}

// ------------------------------------------------------- אחסון לא מוגדר

class UnconfiguredCollection<T> implements Collection<T> {
  async create(): Promise<never> {
    throw new StorageNotConfiguredError();
  }
  async get(): Promise<never> {
    throw new StorageNotConfiguredError();
  }
  async update(): Promise<never> {
    throw new StorageNotConfiguredError();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private readonly _phantom?: T;
}

let cached: Store | null = null;

export function getStore(): Store {
  if (cached) return cached;

  if (process.env.DATABASE_URL) {
    cached = {
      households: new PostgresCollection<Household>('households'),
      events: new PostgresCollection<StoredEvent>('events'),
    };
  } else if (process.env.VERCEL) {
    // מערכת הקבצים של Vercel לקריאה בלבד, אז אחסון בקובץ ייכשל ב-EROFS
    // ויפיק 500 בלי שום רמז מה לתקן. עדיף להיכשל בהודעה מנחה.
    cached = {
      households: new UnconfiguredCollection<Household>(),
      events: new UnconfiguredCollection<StoredEvent>(),
    };
  } else {
    cached = {
      households: new FileCollection<Household>('households.json'),
      events: new FileCollection<StoredEvent>('events.json'),
    };
  }

  return cached;
}
