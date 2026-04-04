import React, { useState, useEffect } from 'react';
import { Key } from '@phosphor-icons/react';
import type { UserPreferences, MasterResume, JobTarget } from '../../../shared/types';

const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI (ChatGPT)',
  anthropic: 'Anthropic (Claude)',
};

export default function AIAssistant() {
  const [settings, setSettings] = useState<UserPreferences | null>(null);
  const [resumes, setResumes] = useState<MasterResume[]>([]);
  const [targets, setTargets] = useState<JobTarget[]>([]);
  const [activeTab, setActiveTab] = useState<'qa' | 'salary' | 'interview'>('qa');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Q&A state
  const [question, setQuestion] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');

  // Salary state
  const [salaryRole, setSalaryRole] = useState('');
  const [salaryLocation, setSalaryLocation] = useState('');
  const [salaryExperience, setSalaryExperience] = useState('');

  // Interview state
  const [interviewResult, setInterviewResult] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      window.jobotta.getSettings(),
      window.jobotta.listResumes(),
      window.jobotta.listJobTargets(),
    ]).then(([s, r, t]) => {
      setSettings(s);
      setResumes(r);
      setTargets(t);
    });
  }, []);

  const provider = settings?.aiProvider || 'gemini';
  const hasKey = (() => {
    switch (provider) {
      case 'gemini': return !!settings?.geminiApiKey;
      case 'openai': return !!settings?.openaiApiKey;
      case 'anthropic': return !!settings?.anthropicApiKey;
    }
    return false;
  })();

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    const resume = resumes.find(r => r.id === selectedResumeId);
    const target = targets.find(t => t.id === selectedTargetId);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const answer = await window.jobotta.answerQuestion(question, {
        resumeBlocks: resume?.blocks || [],
        jobDescription: target?.jobDescriptionText || '',
        preferences: settings || {},
      });
      setResult(answer);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleSalaryResearch = async () => {
    if (!salaryRole.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const answer = await window.jobotta.researchSalary(salaryRole, salaryLocation || 'Remote', salaryExperience || 'Mid-level');
      setResult(answer);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleInterviewPrep = async () => {
    const resume = resumes.find(r => r.id === selectedResumeId);
    const target = targets.find(t => t.id === selectedTargetId);
    if (!resume || !target?.jobDescriptionText) {
      setError('Select a resume and job target with a description.');
      return;
    }
    setLoading(true);
    setError(null);
    setInterviewResult(null);
    try {
      const prep = await window.jobotta.generateInterviewPrep(resume.blocks, target.jobDescriptionText);
      setInterviewResult(prep);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (!settings) return null;

  if (!hasKey) {
    return (
      <div className="empty-state" style={{ paddingTop: 60 }}>
        <Key size={48} />
        <h3 style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>AI Provider Not Configured</h3>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '8px auto' }}>
          Go to Settings and add an API key for your preferred provider ({PROVIDER_LABELS[provider] || provider}).
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <span className="badge badge-purple">Gemini</span>
          <span className="badge badge-green">OpenAI</span>
          <span className="badge badge-blue">Anthropic</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Provider status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <span className="badge badge-green">Connected</span>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Using {PROVIDER_LABELS[provider]}
        </span>
      </div>

      {/* Context selectors */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label className="form-label">Resume</label>
          <select className="form-select" value={selectedResumeId} onChange={e => setSelectedResumeId(e.target.value)}>
            <option value="">Select resume...</option>
            {resumes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label className="form-label">Job Target</label>
          <select className="form-select" value={selectedTargetId} onChange={e => setSelectedTargetId(e.target.value)}>
            <option value="">Select target...</option>
            {targets.map(t => <option key={t.id} value={t.id}>{t.jobTitle} — {t.company}</option>)}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
        {([
          { key: 'qa' as const, label: 'Q&A' },
          { key: 'salary' as const, label: 'Salary Research' },
          { key: 'interview' as const, label: 'Interview Prep' },
        ]).map(tab => (
          <button
            key={tab.key}
            className="btn btn-sm"
            style={{
              background: activeTab === tab.key ? '#1d1d1f' : 'transparent',
              borderColor: activeTab === tab.key ? '#1d1d1f' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
            }}
            onClick={() => { setActiveTab(tab.key); setResult(null); setError(null); setInterviewResult(null); }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Q&A Tab */}
      {activeTab === 'qa' && (
        <div>
          <div className="form-group">
            <label className="form-label">Ask a question (e.g. "Why do you want to work here?")</label>
            <textarea
              className="form-textarea"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={3}
              placeholder="Type an application question..."
            />
          </div>
          <button className="btn btn-primary" onClick={handleAskQuestion} disabled={loading || !question.trim()}>
            {loading ? 'Thinking...' : 'Get Answer'}
          </button>
        </div>
      )}

      {/* Salary Tab */}
      {activeTab === 'salary' && (
        <div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Role</label>
              <input className="form-input" value={salaryRole} onChange={e => setSalaryRole(e.target.value)} placeholder="e.g. Senior Software Engineer" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Location</label>
              <input className="form-input" value={salaryLocation} onChange={e => setSalaryLocation(e.target.value)} placeholder="e.g. San Francisco, CA" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Experience</label>
              <input className="form-input" value={salaryExperience} onChange={e => setSalaryExperience(e.target.value)} placeholder="e.g. 5 years" />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSalaryResearch} disabled={loading || !salaryRole.trim()}>
            {loading ? 'Researching...' : 'Research Salary'}
          </button>
        </div>
      )}

      {/* Interview Tab */}
      {activeTab === 'interview' && (
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Select a resume and job target above, then generate interview questions and tips.
          </p>
          <button className="btn btn-primary" onClick={handleInterviewPrep} disabled={loading || !selectedResumeId || !selectedTargetId}>
            {loading ? 'Generating...' : 'Generate Interview Prep'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ marginTop: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-red)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 12, color: 'var(--accent-red)' }}>
          {error}
        </div>
      )}

      {/* Text Result */}
      {result && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>AI RESPONSE</span>
            <button className="btn btn-sm" onClick={() => navigator.clipboard.writeText(result)}>Copy</button>
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>
            {result}
          </pre>
        </div>
      )}

      {/* Interview Prep Result */}
      {interviewResult && (
        <div style={{ marginTop: 16 }}>
          {[
            { key: 'behavioral', label: 'Behavioral Questions', color: 'var(--accent-blue)' },
            { key: 'technical', label: 'Technical Questions', color: 'var(--accent-purple)' },
            { key: 'situational', label: 'Situational Questions', color: 'var(--accent-orange)' },
            { key: 'questionsToAsk', label: 'Questions to Ask Them', color: 'var(--accent-green)' },
          ].map(section => (
            <div key={section.key} className="card" style={{ marginBottom: 12 }}>
              <div className="card-header">
                <span style={{ fontSize: 12, fontWeight: 600, color: section.color }}>{section.label}</span>
              </div>
              <ol style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                {(interviewResult[section.key] || []).map((q: string, i: number) => (
                  <li key={i}>{q}</li>
                ))}
              </ol>
            </div>
          ))}
          {interviewResult.tips && (
            <div className="card">
              <div className="card-header">
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-yellow)' }}>TIPS</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{interviewResult.tips}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
