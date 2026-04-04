import { getDb } from '../db';
import type { UserPreferences } from '../../../shared/types';

const DEFAULT_PREFERENCES: UserPreferences = {
  coverLetterStyle: 'medium',
  atsStrategy: 'balanced',
  defaultBrowser: 'chrome',
  autoFillMode: 'balanced',
  confirmBeforeSubmit: true,
  syncFrequency: 'manual',
};

export function getSettings(): UserPreferences {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as any[];
  const stored: Record<string, string> = {};
  for (const row of rows) {
    stored[row.key] = row.value;
  }

  return {
    ...DEFAULT_PREFERENCES,
    ...Object.fromEntries(
      Object.entries(stored).map(([k, v]) => {
        try { return [k, JSON.parse(v)]; }
        catch { return [k, v]; }
      })
    ),
  } as UserPreferences;
}

export function updateSettings(data: Partial<UserPreferences>): UserPreferences {
  const db = getDb();
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const tx = db.transaction(() => {
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        stmt.run(key, typeof value === 'string' ? value : JSON.stringify(value));
      }
    }
  });
  tx();
  return getSettings();
}
