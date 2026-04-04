import React from 'react';
import { Star } from '@phosphor-icons/react';
import type { Application } from '../../../shared/types';

interface Props {
  application: Application;
  onClick: () => void;
  onDelete: () => void;
}

export default function ApplicationCard({ application, onClick, onDelete }: Props) {
  return (
    <div
      className="kanban-card"
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('application-id', application.id);
        (e.target as HTMLElement).classList.add('dragging');
      }}
      onDragEnd={e => {
        (e.target as HTMLElement).classList.remove('dragging');
      }}
      onClick={onClick}
      style={application.priority ? {
        background: 'rgba(34, 197, 94, 0.08)',
        borderColor: 'rgba(34, 197, 94, 0.3)',
      } : undefined}
    >
      <div className="kanban-card-title" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {application.priority && <Star size={12} weight="fill" style={{ color: 'var(--accent-green)' }} />}
        {application.role}
      </div>
      <div className="kanban-card-company">{application.company}</div>
      <div className="kanban-card-meta">
        {application.appliedDate && (
          <span>Applied {new Date(application.appliedDate).toLocaleDateString()}</span>
        )}
        {application.source && <span>via {application.source}</span>}
        <span style={{ marginLeft: 'auto', cursor: 'pointer', color: 'var(--accent-red)' }} onClick={e => { e.stopPropagation(); onDelete(); }}>
          ×
        </span>
      </div>
    </div>
  );
}
