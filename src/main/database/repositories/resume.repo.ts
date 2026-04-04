import { v4 as uuid } from 'uuid';
import { getDb } from '../db';
import { getSettings } from './settings.repo';
import type { MasterResume, ResumeBlock } from '../../../shared/types';

export function listResumes(): MasterResume[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM resumes WHERE deleted_at IS NULL ORDER BY is_master DESC, updated_at DESC
  `).all() as any[];

  return rows.map(row => {
    const blocks = db.prepare(`
      SELECT * FROM resume_blocks WHERE resume_id = ? ORDER BY sort_order ASC
    `).all(row.id) as any[];

    return mapResume(row, blocks);
  });
}

export function getResume(id: string): MasterResume | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM resumes WHERE id = ? AND deleted_at IS NULL').get(id) as any;
  if (!row) return null;

  const blocks = db.prepare(`
    SELECT * FROM resume_blocks WHERE resume_id = ? ORDER BY sort_order ASC
  `).all(id) as any[];

  return mapResume(row, blocks);
}

const DEFAULT_BLOCKS: { blockType: string; title: string; content: Record<string, unknown> }[] = [
  {
    blockType: 'personal_info',
    title: 'Personal Info',
    content: { full_name: '', email: '', phone: '', location: '', linkedin: '', website: '' },
  },
  {
    blockType: 'summary',
    title: 'Professional Summary',
    content: { text: '' },
  },
  {
    blockType: 'work_experience',
    title: 'Work Experience',
    content: { entries: [] },
  },
  {
    blockType: 'education',
    title: 'Education',
    content: { entries: [] },
  },
  {
    blockType: 'skills',
    title: 'Skills',
    content: { categories: [] },
  },
  {
    blockType: 'projects',
    title: 'Projects',
    content: { entries: [] },
  },
  {
    blockType: 'certifications',
    title: 'Certifications',
    content: { entries: [] },
  },
];

export function createResume(data: { name: string; isMaster?: boolean }): MasterResume {
  const db = getDb();
  const id = uuid();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO resumes (id, name, is_master, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, data.name, data.isMaster !== false ? 1 : 0, now, now);

  // Pre-populate with common blocks, using profile data for personal_info
  const settings = getSettings();
  const blocks = DEFAULT_BLOCKS.map(block => {
    if (block.blockType === 'personal_info') {
      return {
        ...block,
        content: {
          full_name: settings.profileFullName || '',
          email: settings.profileEmail || '',
          phone: settings.profilePhone || '',
          location: settings.profileLocation || '',
          linkedin: settings.profileLinkedin || '',
          website: settings.profileWebsite || '',
        },
      };
    }
    return block;
  });

  const blockStmt = db.prepare(`
    INSERT INTO resume_blocks (id, resume_id, block_type, title, content, is_included, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
  `);
  const tx = db.transaction(() => {
    blocks.forEach((block, index) => {
      blockStmt.run(uuid(), id, block.blockType, block.title, JSON.stringify(block.content), index, now, now);
    });
  });
  tx();

  return getResume(id)!;
}

export function updateResume(id: string, data: Partial<MasterResume>): MasterResume {
  const db = getDb();
  const now = new Date().toISOString();
  const sets: string[] = ['updated_at = ?'];
  const values: any[] = [now];

  if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name); }
  if (data.isMaster !== undefined) { sets.push('is_master = ?'); values.push(data.isMaster ? 1 : 0); }

  values.push(id);
  db.prepare(`UPDATE resumes SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return getResume(id)!;
}

export function deleteResume(id: string): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE resumes SET deleted_at = ? WHERE id = ?').run(now, id);
}

// ─── Block Operations ──────────────────────────────────────────

export function createBlock(resumeId: string, data: Partial<ResumeBlock>): ResumeBlock {
  const db = getDb();
  const id = uuid();
  const now = new Date().toISOString();

  const maxOrder = db.prepare(
    'SELECT MAX(sort_order) as max_order FROM resume_blocks WHERE resume_id = ?'
  ).get(resumeId) as any;
  const sortOrder = data.sortOrder ?? ((maxOrder?.max_order ?? -1) + 1);

  db.prepare(`
    INSERT INTO resume_blocks (id, resume_id, block_type, title, content, is_included, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, resumeId,
    data.blockType || 'custom',
    data.title || '',
    JSON.stringify(data.content || {}),
    data.isIncluded !== false ? 1 : 0,
    sortOrder, now, now
  );

  return mapBlock(db.prepare('SELECT * FROM resume_blocks WHERE id = ?').get(id) as any);
}

export function updateBlock(id: string, data: Partial<ResumeBlock>): ResumeBlock {
  const db = getDb();
  const now = new Date().toISOString();
  const sets: string[] = ['updated_at = ?'];
  const values: any[] = [now];

  if (data.blockType !== undefined) { sets.push('block_type = ?'); values.push(data.blockType); }
  if (data.title !== undefined) { sets.push('title = ?'); values.push(data.title); }
  if (data.content !== undefined) { sets.push('content = ?'); values.push(JSON.stringify(data.content)); }
  if (data.isIncluded !== undefined) { sets.push('is_included = ?'); values.push(data.isIncluded ? 1 : 0); }
  if (data.sortOrder !== undefined) { sets.push('sort_order = ?'); values.push(data.sortOrder); }

  values.push(id);
  db.prepare(`UPDATE resume_blocks SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return mapBlock(db.prepare('SELECT * FROM resume_blocks WHERE id = ?').get(id) as any);
}

export function deleteBlock(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM resume_blocks WHERE id = ?').run(id);
}

export function reorderBlocks(resumeId: string, orderedIds: string[]): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE resume_blocks SET sort_order = ? WHERE id = ? AND resume_id = ?');
  const tx = db.transaction(() => {
    orderedIds.forEach((blockId, index) => {
      stmt.run(index, blockId, resumeId);
    });
  });
  tx();
}

// ─── Mappers ───────────────────────────────────────────────────

function mapResume(row: any, blockRows: any[]): MasterResume {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    isMaster: row.is_master === 1,
    blocks: blockRows.map(mapBlock),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncId: row.sync_id,
    syncVersion: row.sync_version,
    deletedAt: row.deleted_at,
  };
}

function mapBlock(row: any): ResumeBlock {
  return {
    id: row.id,
    resumeId: row.resume_id,
    blockType: row.block_type,
    title: row.title,
    content: JSON.parse(row.content || '{}'),
    isIncluded: row.is_included === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
