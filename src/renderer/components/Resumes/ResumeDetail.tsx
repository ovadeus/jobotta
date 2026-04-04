import React, { useState, useRef, useCallback } from 'react';
import { Crown, GitBranch, PuzzlePiece } from '@phosphor-icons/react';
import ResumeBlockEditor from './ResumeBlockEditor';
import ResumePreview from './ResumePreview';
import ConfirmDialog from '../Layout/ConfirmDialog';
import type { MasterResume, BlockType, ResumeBlock, BLOCK_TYPES } from '../../../shared/types';

interface Props {
  resume: MasterResume;
  onUpdate: () => void;
}

const BLOCK_TYPE_OPTIONS: { value: BlockType; label: string }[] = [
  { value: 'personal_info', label: 'Personal Info' },
  { value: 'summary', label: 'Summary' },
  { value: 'work_experience', label: 'Work Experience' },
  { value: 'education', label: 'Education' },
  { value: 'skills', label: 'Skills' },
  { value: 'certifications', label: 'Certifications' },
  { value: 'projects', label: 'Projects' },
  { value: 'awards', label: 'Awards' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'references', label: 'References' },
  { value: 'custom', label: 'Custom' },
];

export default function ResumeDetail({ resume, onUpdate }: Props) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(resume.name);
  const [showPreview, setShowPreview] = useState(false);
  const [addingBlock, setAddingBlock] = useState(false);
  const [newBlockType, setNewBlockType] = useState<BlockType>('custom');
  const [newBlockTitle, setNewBlockTitle] = useState('');

  // Drag-and-drop state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDragIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === index) return;
    setDragOverIdx(index);
  };

  const handleDrop = async (index: number) => {
    if (dragIdx === null || dragIdx === index) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }

    // Reorder the block IDs
    const ids = resume.blocks.map(b => b.id);
    const [movedId] = ids.splice(dragIdx, 1);
    ids.splice(index, 0, movedId);

    setDragIdx(null);
    setDragOverIdx(null);

    // Auto-save the new order
    await window.jobotta.reorderBlocks(resume.id, ids);
    onUpdate();
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleNameSave = async () => {
    if (name.trim() && name !== resume.name) {
      await window.jobotta.updateResume(resume.id, { name: name.trim() });
      onUpdate();
    }
    setEditingName(false);
  };

  const handleAddBlock = async () => {
    await window.jobotta.createBlock(resume.id, {
      blockType: newBlockType,
      title: newBlockTitle || BLOCK_TYPE_OPTIONS.find(b => b.value === newBlockType)?.label || 'New Block',
      content: {},
      isIncluded: true,
    });
    setAddingBlock(false);
    setNewBlockType('custom');
    setNewBlockTitle('');
    onUpdate();
  };

  const [deleteBlock, setDeleteBlock] = useState<ResumeBlock | null>(null);

  const handleDeleteBlock = async (blockId: string) => {
    await window.jobotta.deleteBlock(blockId);
    setDeleteBlock(null);
    onUpdate();
  };

  const handleToggleBlock = async (blockId: string, isIncluded: boolean) => {
    await window.jobotta.updateBlock(blockId, { isIncluded });
    onUpdate();
  };

  return (
    <div>
      {/* Resume header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <span style={{ display: 'flex', alignItems: 'center', color: resume.isMaster ? 'var(--accent-orange)' : 'var(--text-muted)' }}>{resume.isMaster ? <Crown size={24} weight="fill" /> : <GitBranch size={24} />}</span>
        {editingName ? (
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={e => e.key === 'Enter' && handleNameSave()}
            autoFocus
            style={{ fontSize: 18, fontWeight: 600 }}
          />
        ) : (
          <h2
            style={{ fontSize: 18, fontWeight: 600, cursor: 'pointer' }}
            onClick={() => setEditingName(true)}
            title="Click to rename"
          >
            {resume.name}
          </h2>
        )}
        <button className="btn btn-sm" onClick={() => setShowPreview(true)} style={{ marginLeft: 'auto' }}>
          Preview
        </button>
        <span className={`badge ${resume.isMaster ? 'badge-indigo' : 'badge-green'}`}>
          {resume.isMaster ? 'Master' : 'Tailored'}
        </span>
      </div>

      {/* Blocks */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600 }}>Resume Blocks</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setAddingBlock(true)}>+ Add Block</button>
      </div>

      <div className="block-list">
        {resume.blocks.map((block, index) => (
          <div
            key={block.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={() => handleDrop(index)}
            onDragEnd={handleDragEnd}
            style={{
              position: 'relative',
              opacity: dragIdx === index ? 0.4 : 1,
              transition: 'opacity 0.15s, transform 0.15s',
              transform: dragOverIdx === index ? 'scale(1.01)' : undefined,
            }}
          >
            {/* Drop indicator line */}
            {dragOverIdx === index && dragIdx !== null && dragIdx !== index && (
              <div style={{
                position: 'absolute',
                top: dragIdx > index ? -2 : undefined,
                bottom: dragIdx < index ? -2 : undefined,
                left: 0, right: 0, height: 3,
                background: 'var(--accent-orange)',
                borderRadius: 2,
                zIndex: 5,
              }} />
            )}

            <div style={{ display: 'flex', gap: 0 }}>
              {/* Grip handle */}
              <div
                style={{
                  width: 24,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  paddingTop: 14,
                  cursor: 'grab',
                  flexShrink: 0,
                  color: 'var(--text-muted)',
                  fontSize: 14,
                  userSelect: 'none',
                }}
                title="Drag to reorder"
              >
                ⠿
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <ResumeBlockEditor
                  block={block}
                  onUpdate={onUpdate}
                  onDelete={() => setDeleteBlock(block)}
                  onToggle={(included) => handleToggleBlock(block.id, included)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {resume.blocks.length === 0 && !addingBlock && (
        <div className="empty-state">
          <PuzzlePiece size={40} />
          <p>No blocks yet</p>
          <p style={{ fontSize: 11 }}>Add blocks like Personal Info, Work Experience, Skills, etc.</p>
        </div>
      )}

      {/* Add block modal */}
      {addingBlock && (
        <div className="modal-overlay" onClick={() => setAddingBlock(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Block</h3>
              <button className="btn btn-sm" onClick={() => setAddingBlock(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Block Type</label>
              <select
                className="form-select"
                value={newBlockType}
                onChange={e => setNewBlockType(e.target.value as BlockType)}
              >
                {BLOCK_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Title (optional)</label>
              <input
                className="form-input"
                value={newBlockTitle}
                onChange={e => setNewBlockTitle(e.target.value)}
                placeholder="Leave blank to use type name"
              />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setAddingBlock(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddBlock}>Add Block</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)} style={{ alignItems: 'flex-start', paddingTop: 40, paddingBottom: 40 }}>
          <div style={{ width: '100%', maxWidth: 780, maxHeight: 'calc(100vh - 80px)', overflow: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'flex-end', gap: 6, padding: '0 8px 8px' }}>
              <button
                className="btn btn-sm"
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    const content = document.querySelector('[data-resume-preview]')?.innerHTML || '';
                    printWindow.document.write(`<html><head><title>${resume.name}</title><style>body{font-family:Georgia,'Times New Roman',serif;padding:40px 48px;font-size:12px;line-height:1.55;color:#1a1a1a;}h1{font-family:'Helvetica Neue',Arial,sans-serif;}@media print{body{padding:20px 24px;}}</style></head><body>${content}</body></html>`);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }}
                style={{ background: 'rgba(0,0,0,0.7)', color: 'white', borderColor: 'transparent', backdropFilter: 'blur(8px)' }}
              >
                Print
              </button>
              <button
                className="btn btn-sm"
                onClick={() => {
                  const content = document.querySelector('[data-resume-preview]')?.innerHTML || '';
                  const html = `<html><head><meta charset="utf-8"><style>body{font-family:Georgia,'Times New Roman',serif;padding:40px 48px;font-size:12px;line-height:1.55;color:#1a1a1a;}h1{font-family:'Helvetica Neue',Arial,sans-serif;}</style></head><body>${content}</body></html>`;
                  const blob = new Blob([html], { type: 'application/msword' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${resume.name}.doc`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                style={{ background: 'rgba(0,0,0,0.7)', color: 'white', borderColor: 'transparent', backdropFilter: 'blur(8px)' }}
              >
                Download DOC
              </button>
              <button
                className="btn btn-sm"
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    const content = document.querySelector('[data-resume-preview]')?.innerHTML || '';
                    printWindow.document.write(`<html><head><title>${resume.name}</title><style>body{font-family:Georgia,'Times New Roman',serif;padding:40px 48px;font-size:12px;line-height:1.55;color:#1a1a1a;}h1{font-family:'Helvetica Neue',Arial,sans-serif;}</style></head><body>${content}</body></html>`);
                    printWindow.document.close();
                    // Use print dialog with "Save as PDF" option
                    setTimeout(() => printWindow.print(), 300);
                  }
                }}
                style={{ background: 'rgba(0,0,0,0.7)', color: 'white', borderColor: 'transparent', backdropFilter: 'blur(8px)' }}
              >
                Download PDF
              </button>
              <button
                className="btn btn-sm"
                onClick={() => setShowPreview(false)}
                style={{ background: 'rgba(0,0,0,0.7)', color: 'white', borderColor: 'transparent', backdropFilter: 'blur(8px)' }}
              >
                Close
              </button>
            </div>
            <ResumePreview resume={resume} />
          </div>
        </div>
      )}

      {/* Block delete confirmation */}
      {deleteBlock && (
        <ConfirmDialog
          title="Delete Block"
          message={`Are you sure you want to delete the "${deleteBlock.title || deleteBlock.blockType.replace(/_/g, ' ')}" block? Any content in this block will be lost.`}
          onConfirm={() => handleDeleteBlock(deleteBlock.id)}
          onCancel={() => setDeleteBlock(null)}
        />
      )}
    </div>
  );
}
