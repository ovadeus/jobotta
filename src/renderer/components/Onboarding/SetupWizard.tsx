import React, { useState } from 'react';
import { Rocket, User, Sparkle, MagnifyingGlass, CheckCircle } from '@phosphor-icons/react';

interface Props {
  onComplete: () => void;
}

type Step = 'welcome' | 'personal' | 'ai' | 'jsearch' | 'done';

const STEPS: Step[] = ['welcome', 'personal', 'ai', 'jsearch', 'done'];

export default function SetupWizard({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('welcome');
  const [saving, setSaving] = useState(false);

  // Personal info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');

  // AI
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'anthropic'>('gemini');
  const [aiKey, setAiKey] = useState('');

  // JSearch
  const [rapidApiKey, setRapidApiKey] = useState('');

  const currentIdx = STEPS.indexOf(step);
  const canGoBack = currentIdx > 0 && step !== 'done';

  const goNext = () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < STEPS.length) setStep(STEPS[nextIdx]);
  };

  const goBack = () => {
    const prevIdx = currentIdx - 1;
    if (prevIdx >= 0) setStep(STEPS[prevIdx]);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Save personal info
      await window.jobotta.updateSettings({
        profileFullName: fullName || undefined,
        profileEmail: email || undefined,
        profilePhone: phone || undefined,
        profileLocation: location || undefined,
        profileLinkedin: linkedin || undefined,
        profileWebsite: website || undefined,
      });

      // Save AI config
      if (aiKey) {
        const keyField = aiProvider === 'gemini' ? 'geminiApiKey' : aiProvider === 'openai' ? 'openaiApiKey' : 'anthropicApiKey';
        await window.jobotta.updateSettings({
          aiProvider,
          [keyField]: aiKey,
        });
      }

      // Save JSearch key
      if (rapidApiKey) {
        await window.jobotta.updateSettings({ rapidApiKey });
      }

      // Mark onboarding complete
      await window.jobotta.updateSettings({ onboardingComplete: 'true' } as any);

      // Create sample resume
      await createSampleResume();

      onComplete();
    } catch (err) {
      console.error('Setup error:', err);
      onComplete(); // Continue anyway
    } finally {
      setSaving(false);
    }
  };

  const createSampleResume = async () => {
    const resume = await window.jobotta.createResume({ name: 'Sample Resume (Delete Me)', isMaster: true });

    // Update personal info block with user's info
    const full = await window.jobotta.getResume(resume.id);
    if (full?.blocks) {
      const personalBlock = full.blocks.find((b: any) => b.blockType === 'personal_info');
      if (personalBlock) {
        await window.jobotta.updateBlock(personalBlock.id, {
          content: {
            full_name: fullName || 'Alex Morgan',
            email: email || 'alex.morgan@email.com',
            phone: phone || '(555) 987-6543',
            location: location || 'Austin, TX',
            linkedin: linkedin || 'linkedin.com/in/alexmorgan',
            website: website || 'alexmorgan.dev',
          },
        });
      }

      const summaryBlock = full.blocks.find((b: any) => b.blockType === 'summary');
      if (summaryBlock) {
        await window.jobotta.updateBlock(summaryBlock.id, {
          content: {
            text: 'Experienced professional with a strong background in project management and team leadership. Skilled at driving cross-functional initiatives and delivering results in fast-paced environments. This is a sample resume — edit or delete it to get started with your own.',
          },
        });
      }

      const skillsBlock = full.blocks.find((b: any) => b.blockType === 'skills');
      if (skillsBlock) {
        await window.jobotta.updateBlock(skillsBlock.id, {
          content: {
            categories: [
              { name: 'Leadership', skills: 'Team Management, Strategic Planning, Stakeholder Communication' },
              { name: 'Technical', skills: 'Project Management, Data Analysis, Agile/Scrum' },
              { name: 'Tools', skills: 'Jira, Confluence, Slack, Google Workspace, Microsoft Office' },
            ],
          },
        });
      }
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{ width: 560, maxHeight: '80vh', overflow: 'auto' }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{
              width: i === currentIdx ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i <= currentIdx ? 'var(--accent-orange)' : 'var(--border-color)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* ─── Step: Welcome ──────────────────────────── */}
        {step === 'welcome' && (
          <div style={{ textAlign: 'center' }}>
            <Rocket size={56} weight="duotone" style={{ color: 'var(--accent-orange)', marginBottom: 16 }} />
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: -0.5 }}>
              Welcome to Jobotta
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 24px' }}>
              Your intelligent job application assistant. Let's get you set up in a couple of minutes.
            </p>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 20, textAlign: 'left', marginBottom: 24 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>What you'll need:</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'An AI API key', desc: 'Gemini (free), OpenAI, or Anthropic — for resume tailoring & cover letters', required: true },
                  { label: 'A RapidAPI key', desc: 'Free — for searching jobs from LinkedIn, Indeed, Glassdoor, etc.', required: false },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                    <span style={{ color: item.required ? 'var(--accent-orange)' : 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}>
                      {item.required ? '●' : '○'}
                    </span>
                    <div>
                      <span style={{ fontWeight: 600 }}>{item.label}</span>
                      {!item.required && <span style={{ color: 'var(--text-muted)' }}> (optional)</span>}
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" style={{ padding: '10px 32px', fontSize: 14 }} onClick={goNext}>
              Get Started
            </button>
            <div style={{ marginTop: 12 }}>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => { window.jobotta.updateSettings({ onboardingComplete: 'true' } as any); onComplete(); }}>
                Skip setup — I'll configure later
              </button>
            </div>
          </div>
        )}

        {/* ─── Step: Personal Info ────────────────────── */}
        {step === 'personal' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <User size={40} weight="duotone" style={{ color: 'var(--accent-orange)', marginBottom: 8 }} />
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Your Information</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>This pre-fills the Personal Info block on every new resume you create.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="San Francisco, CA" />
              </div>
              <div className="form-group">
                <label className="form-label">LinkedIn</label>
                <input className="form-input" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="linkedin.com/in/johndoe" />
              </div>
              <div className="form-group">
                <label className="form-label">Website</label>
                <input className="form-input" value={website} onChange={e => setWebsite(e.target.value)} placeholder="johndoe.dev" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button className="btn" onClick={goBack}>Back</button>
              <button className="btn btn-primary" onClick={goNext}>Continue</button>
            </div>
          </div>
        )}

        {/* ─── Step: AI Provider ──────────────────────── */}
        {step === 'ai' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Sparkle size={40} weight="duotone" style={{ color: 'var(--accent-orange)', marginBottom: 8 }} />
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>AI Provider</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Powers resume tailoring, cover letters, and Q&A. Pick one — you can add more later.</p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {([
                { key: 'gemini' as const, label: 'Google Gemini', desc: 'Free tier available', placeholder: 'AIza...' },
                { key: 'openai' as const, label: 'OpenAI', desc: 'GPT-4o', placeholder: 'sk-...' },
                { key: 'anthropic' as const, label: 'Anthropic', desc: 'Claude', placeholder: 'sk-ant-...' },
              ]).map(p => (
                <button
                  key={p.key}
                  className="btn"
                  style={{
                    flex: 1, padding: '12px 8px', textAlign: 'center',
                    flexDirection: 'column', display: 'flex', alignItems: 'center', gap: 2,
                    background: aiProvider === p.key ? 'var(--accent-orange-light)' : undefined,
                    borderColor: aiProvider === p.key ? 'var(--accent-orange)' : undefined,
                    color: aiProvider === p.key ? 'var(--accent-orange)' : undefined,
                  }}
                  onClick={() => setAiProvider(p.key)}
                >
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{p.label}</span>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>{p.desc}</span>
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">API Key</label>
              <input
                className="form-input"
                type="password"
                value={aiKey}
                onChange={e => setAiKey(e.target.value)}
                placeholder={aiProvider === 'gemini' ? 'AIza...' : aiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {aiProvider === 'gemini' && 'Get a free key at ai.google.dev'}
                {aiProvider === 'openai' && 'Get your key at platform.openai.com/api-keys'}
                {aiProvider === 'anthropic' && 'Get your key at console.anthropic.com/settings/keys'}
              </span>
            </div>

            {!aiKey && (
              <div style={{ background: 'rgba(232,114,12,0.08)', border: '1px solid var(--accent-orange)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 12, color: 'var(--accent-orange)', marginTop: 8 }}>
                An AI key is required for resume tailoring and cover letter generation. You can still use the app without one, but AI features won't work.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button className="btn" onClick={goBack}>Back</button>
              <button className="btn btn-primary" onClick={goNext}>{aiKey ? 'Continue' : 'Skip for Now'}</button>
            </div>
          </div>
        )}

        {/* ─── Step: JSearch ──────────────────────────── */}
        {step === 'jsearch' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <MagnifyingGlass size={40} weight="duotone" style={{ color: 'var(--accent-orange)', marginBottom: 8 }} />
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Job Search API</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Search LinkedIn, Indeed, Glassdoor, and more from within the app. Optional but recommended.</p>
            </div>

            <div className="form-group">
              <label className="form-label">RapidAPI Key (for JSearch)</label>
              <input className="form-input" type="password" value={rapidApiKey} onChange={e => setRapidApiKey(e.target.value)} placeholder="Enter your RapidAPI key..." />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Free at <strong>rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch</strong> — 200 searches/month, no credit card needed. Subscribe to the Basic (free) plan and copy the X-RapidAPI-Key.
              </span>
            </div>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: 12, fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
              <strong>Without this key:</strong> You can still add jobs manually or paste URLs. The in-app job search just won't be available.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button className="btn" onClick={goBack}>Back</button>
              <button className="btn btn-primary" onClick={goNext}>{rapidApiKey ? 'Continue' : 'Skip for Now'}</button>
            </div>
          </div>
        )}

        {/* ─── Step: Done ──────────────────────────────── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={56} weight="duotone" style={{ color: 'var(--accent-green)', marginBottom: 16 }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>You're All Set!</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto 24px' }}>
              We've created a sample resume to get you started. Edit it, delete it, or create a new one from scratch.
            </p>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 16, textAlign: 'left', marginBottom: 24, fontSize: 13 }}>
              <h4 style={{ fontWeight: 600, marginBottom: 10, color: 'var(--text-secondary)' }}>Quick tips:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div><strong>Resumes</strong> — Build your master resume, then tailor copies for each job</div>
                <div><strong>Job Targets</strong> — Search or paste a job URL, generate tailored resumes & cover letters</div>
                <div><strong>Job Board</strong> — Track your applications from Saved → Applied → Interview → Offer</div>
                <div><strong>Settings</strong> — Change AI providers, add keys, or update your profile anytime</div>
              </div>
            </div>

            <button className="btn btn-primary" style={{ padding: '10px 32px', fontSize: 14 }} onClick={handleFinish} disabled={saving}>
              {saving ? 'Setting up...' : 'Launch Jobotta'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
