import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'jobotta.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    runMigrations(db);
  }
  return db;
}

function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      is_master INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_id TEXT,
      sync_version INTEGER DEFAULT 0,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS resume_blocks (
      id TEXT PRIMARY KEY,
      resume_id TEXT NOT NULL,
      block_type TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '{}',
      is_included INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS job_targets (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      master_resume_id TEXT,
      job_title TEXT NOT NULL,
      company TEXT NOT NULL,
      job_description_text TEXT,
      job_description_url TEXT,
      deadline TEXT,
      notes TEXT,
      tailored_resume_content TEXT,
      cover_letter_text TEXT,
      ats_score INTEGER,
      preferred INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_id TEXT,
      sync_version INTEGER DEFAULT 0,
      deleted_at TEXT,
      FOREIGN KEY (master_resume_id) REFERENCES resumes(id)
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      job_target_id TEXT,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      stage TEXT NOT NULL DEFAULT 'saved',
      priority INTEGER NOT NULL DEFAULT 0,
      applied_date TEXT,
      source TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      sync_id TEXT,
      sync_version INTEGER DEFAULT 0,
      deleted_at TEXT,
      FOREIGN KEY (job_target_id) REFERENCES job_targets(id)
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      title TEXT NOT NULL,
      notes TEXT,
      occurred_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT,
      email TEXT,
      phone TEXT,
      linkedin TEXT,
      notes TEXT,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // ─── Migrations for existing databases ───────────────────
  // Make master_resume_id nullable (was NOT NULL in v1)
  try {
    const colInfo = db.prepare("PRAGMA table_info(job_targets)").all() as any[];
    const col = colInfo.find((c: any) => c.name === 'master_resume_id');
    if (col && col.notnull === 1) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS job_targets_new (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          master_resume_id TEXT,
          job_title TEXT NOT NULL,
          company TEXT NOT NULL,
          job_description_text TEXT,
          job_description_url TEXT,
          deadline TEXT,
          notes TEXT,
          tailored_resume_content TEXT,
          cover_letter_text TEXT,
          ats_score INTEGER,
          status TEXT NOT NULL DEFAULT 'draft',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          sync_id TEXT,
          sync_version INTEGER DEFAULT 0,
          deleted_at TEXT,
          FOREIGN KEY (master_resume_id) REFERENCES resumes(id)
        );
        INSERT INTO job_targets_new SELECT * FROM job_targets;
        DROP TABLE job_targets;
        ALTER TABLE job_targets_new RENAME TO job_targets;
      `);
    }
  } catch {}

  // Add preferred column to job_targets if missing
  try {
    const cols = db.prepare("PRAGMA table_info(job_targets)").all() as any[];
    if (!cols.find((c: any) => c.name === 'preferred')) {
      db.exec("ALTER TABLE job_targets ADD COLUMN preferred INTEGER NOT NULL DEFAULT 0");
    }
  } catch {}

  // Add priority column to applications if missing
  try {
    const cols = db.prepare("PRAGMA table_info(applications)").all() as any[];
    if (!cols.find((c: any) => c.name === 'priority')) {
      db.exec("ALTER TABLE applications ADD COLUMN priority INTEGER NOT NULL DEFAULT 0");
    }
  } catch {}
}

export function closeDb() {
  if (db) {
    db.close();
  }
}
