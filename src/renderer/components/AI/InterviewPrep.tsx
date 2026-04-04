import React from 'react';
import { MicrophoneStage } from '@phosphor-icons/react';

export default function InterviewPrep() {
  return (
    <div className="empty-state" style={{ height: '100%' }}>
      <MicrophoneStage size={40} />
      <h3 style={{ fontSize: 16, fontWeight: 600 }}>Interview Prep</h3>
      <p>Select a job target to generate interview preparation materials.</p>
    </div>
  );
}
