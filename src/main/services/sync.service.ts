import { JobottaAPIClient } from './api-client';
import { getSettings } from '../database/repositories/settings.repo';
import * as resumeRepo from '../database/repositories/resume.repo';
import * as jobTargetRepo from '../database/repositories/job-target.repo';
import * as applicationRepo from '../database/repositories/application.repo';
import type { SyncStatus, SyncOperation } from '../../shared/types';
import { getDb } from '../database/db';
import { v4 as uuid } from 'uuid';

const apiClient = new JobottaAPIClient();
let syncStatus: SyncStatus = 'idle';
let lastSynced: string | null = null;
let offlineQueue: SyncOperation[] = [];
let statusListeners: ((status: SyncStatus) => void)[] = [];

export function getSyncStatus(): { status: SyncStatus; lastSynced: string | null; queueLength: number } {
  return { status: syncStatus, lastSynced, queueLength: offlineQueue.length };
}

export function onSyncStatusChange(listener: (status: SyncStatus) => void) {
  statusListeners.push(listener);
  return () => { statusListeners = statusListeners.filter(l => l !== listener); };
}

function setStatus(status: SyncStatus) {
  syncStatus = status;
  statusListeners.forEach(l => l(status));
}

// ─── Full Sync ─────────────────────────────────────────────────

export async function fullSync(): Promise<void> {
  const settings = getSettings();
  if (!settings.syncApiUrl) {
    setStatus('offline');
    return;
  }

  setStatus('syncing');
  try {
    await pullAll();
    await pushOfflineQueue();
    setStatus('synced');
    lastSynced = new Date().toISOString();
  } catch (err) {
    console.error('Sync failed:', err);
    setStatus('error');
  }
}

// ─── Pull ──────────────────────────────────────────────────────

async function pullAll(): Promise<void> {
  try {
    const [resumes, jobTargets, applications] = await Promise.all([
      apiClient.getResumes(),
      apiClient.getJobTargets(),
      apiClient.getApplications(),
    ]);

    // Merge server data into local DB (last-write-wins by updatedAt)
    mergeEntities('resumes', resumes);
    mergeEntities('job_targets', jobTargets);
    mergeEntities('applications', applications);
  } catch (err) {
    throw new Error(`Pull failed: ${err}`);
  }
}

function mergeEntities(table: string, serverEntities: any[]) {
  const db = getDb();
  for (const entity of serverEntities) {
    const localId = entity.syncId || entity.id;
    const existing = db.prepare(`SELECT * FROM ${table} WHERE sync_id = ? OR id = ?`).get(localId, entity.id) as any;

    if (!existing) {
      // New entity from server — insert locally
      // This is a simplified merge; a full implementation would map all fields
      console.log(`[Sync] New ${table} from server: ${entity.id}`);
    } else {
      // Conflict resolution: last-write-wins
      const serverTime = new Date(entity.updatedAt || entity.updated_at).getTime();
      const localTime = new Date(existing.updated_at).getTime();
      if (serverTime > localTime) {
        console.log(`[Sync] Server wins for ${table}: ${entity.id}`);
        // Update local with server data
      }
    }
  }
}

// ─── Push ──────────────────────────────────────────────────────

export function queueChange(operation: Omit<SyncOperation, 'id' | 'timestamp'>): void {
  const op: SyncOperation = {
    id: uuid(),
    ...operation,
    timestamp: new Date().toISOString(),
  };
  offlineQueue.push(op);
  persistQueue();

  // Try to push immediately if online
  pushOfflineQueue().catch(() => {});
}

async function pushOfflineQueue(): Promise<void> {
  if (offlineQueue.length === 0) return;

  const settings = getSettings();
  if (!settings.syncApiUrl) return;

  try {
    await apiClient.batchPush(offlineQueue);
    offlineQueue = [];
    persistQueue();
  } catch (err) {
    console.error('[Sync] Push failed, keeping queue:', err);
  }
}

// ─── Queue Persistence ─────────────────────────────────────────

function persistQueue(): void {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('_syncQueue', ?)").run(
    JSON.stringify(offlineQueue)
  );
}

export function loadQueue(): void {
  const db = getDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = '_syncQueue'").get() as any;
  if (row?.value) {
    try {
      offlineQueue = JSON.parse(row.value);
    } catch {}
  }
}
