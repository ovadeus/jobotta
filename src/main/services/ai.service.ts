import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getSettings } from '../database/repositories/settings.repo';
import type { ResumeBlock, UserPreferences, InterviewPrepResult } from '../../shared/types';

// ─── Provider Abstraction ──────────────────────────────────────

export async function callAI(prompt: string): Promise<string> {
  const settings = getSettings();
  const provider = settings.aiProvider || 'gemini';

  try {
    switch (provider) {
      case 'gemini': return await callGemini(prompt, settings);
      case 'openai': return await callOpenAI(prompt, settings);
      case 'anthropic': return await callAnthropic(prompt, settings);
      default: throw new Error(`Unknown AI provider: ${provider}`);
    }
  } catch (err: any) {
    throw new Error(formatAIError(err, provider));
  }
}

function formatAIError(err: any, provider: string): string {
  const msg = err?.message || String(err);
  // Try to extract nested error message from SDK error objects
  const nestedMsg = err?.error?.error?.message || err?.error?.message || err?.response?.data?.error?.message || '';
  const fullMsg = nestedMsg || msg;

  // Rate limit / quota errors
  if (fullMsg.includes('429') || fullMsg.includes('RESOURCE_EXHAUSTED') || fullMsg.includes('quota') || fullMsg.includes('rate_limit')) {
    return `${provider} API rate limit or quota exceeded. Try again in a minute, switch to a different model in Settings, or use a different AI provider.`;
  }
  // Invalid model
  if (fullMsg.includes('model') && (fullMsg.includes('not found') || fullMsg.includes('invalid') || fullMsg.includes('does not exist') || fullMsg.includes('404'))) {
    return `Invalid model selected for ${provider}. Go to Settings → AI Configuration and pick a different model.`;
  }
  // Auth errors
  if (fullMsg.includes('401') || fullMsg.includes('403') || fullMsg.includes('invalid_api_key') || fullMsg.includes('authentication') || fullMsg.includes('Incorrect API key')) {
    return `${provider} API key is invalid or expired. Check your key in Settings.`;
  }
  // Billing
  if (fullMsg.includes('billing') || fullMsg.includes('insufficient_quota') || fullMsg.includes('credit balance')) {
    return `${provider} account billing issue. Check your account at the provider's dashboard.`;
  }
  // Network
  if (fullMsg.includes('ENOTFOUND') || fullMsg.includes('ECONNREFUSED') || fullMsg.includes('fetch failed')) {
    return `Cannot reach ${provider} API. Check your internet connection.`;
  }
  // Context length
  if (fullMsg.includes('context_length') || fullMsg.includes('too long') || fullMsg.includes('maximum')) {
    return `Content too long for ${provider}. Try shortening the job description or resume.`;
  }

  // Fallback — prefer the nested message, strip JSON noise
  const clean = (nestedMsg || msg).replace(/\{[\s\S]*\}/g, '').replace(/\[[\s\S]*\]/g, '').trim();
  return clean.length > 300 ? clean.slice(0, 300) + '...' : clean || `${provider} API error. Check Settings.`;
}

async function callGemini(prompt: string, settings: UserPreferences): Promise<string> {
  const apiKey = settings.geminiApiKey;
  if (!apiKey) throw new Error('Gemini API key not configured. Add it in Settings.');
  const client = new GoogleGenAI({ apiKey });
  const model = settings.geminiModel || 'gemini-2.5-flash';
  const response = await client.models.generateContent({ model, contents: prompt });
  return response.text || '';
}

async function callOpenAI(prompt: string, settings: UserPreferences): Promise<string> {
  const apiKey = settings.openaiApiKey;
  if (!apiKey) throw new Error('OpenAI API key not configured. Add it in Settings.');
  const client = new OpenAI({ apiKey });
  const model = settings.openaiModel || 'gpt-4o';
  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
  });
  return response.choices[0]?.message?.content || '';
}

async function callAnthropic(prompt: string, settings: UserPreferences): Promise<string> {
  const apiKey = settings.anthropicApiKey;
  if (!apiKey) throw new Error('Anthropic API key not configured. Add it in Settings.');
  const client = new Anthropic({ apiKey });
  const model = settings.anthropicModel || 'claude-sonnet-4-5';
  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}

// ─── Helpers ───────────────────────────────────────────────────

function blocksToText(blocks: ResumeBlock[]): string {
  return blocks
    .filter(b => b.isIncluded)
    .map(b => {
      const label = b.title || b.blockType.replace(/_/g, ' ');
      const content = Object.entries(b.content)
        .map(([k, v]) => `  ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join('\n');
      return `[${label}]\n${content || '  (empty)'}`;
    })
    .join('\n\n');
}

// ─── Resume Tailoring ──────────────────────────────────────────

export async function tailorResume(
  resumeBlocks: ResumeBlock[],
  jobDescription: string,
  strategy: string
): Promise<ResumeBlock[]> {
  const strategyInstructions: Record<string, string> = {
    keyword_match: 'Prioritize matching keywords and phrases from the job description. Optimize for ATS scanning.',
    balanced: 'Balance keyword matching with natural, compelling language. Optimize for both ATS and human readers.',
    narrative: 'Focus on telling a compelling story that aligns with the role. Use keywords naturally but prioritize readability.',
  };

  const prompt = `You are an expert resume tailoring assistant. Analyze the job description and optimize the resume blocks for this specific role.

Strategy: ${strategyInstructions[strategy] || strategyInstructions.balanced}

JOB DESCRIPTION:
${jobDescription}

CURRENT RESUME BLOCKS (JSON):
${JSON.stringify(resumeBlocks.filter(b => b.isIncluded), null, 2)}

INSTRUCTIONS:
1. Modify the "content" field of each block to better match the job description
2. Reorder bullet points to put the most relevant ones first
3. Add relevant keywords naturally
4. Do NOT invent experience or skills the candidate doesn't have
5. Keep the same block structure and IDs
6. Return ONLY the modified blocks as a JSON array

Return valid JSON array of resume blocks with the same structure.`;

  const text = await callAI(prompt);
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('AI did not return valid JSON');
  return JSON.parse(jsonMatch[0]);
}

// ─── Cover Letter Generation ───────────────────────────────────

export async function generateCoverLetter(
  resumeBlocks: ResumeBlock[],
  jobDescription: string,
  style: string,
  extras?: { hiringManager?: string; notes?: string }
): Promise<string> {
  const settings = getSettings();
  const signature = settings.coverLetterSignature || '';
  const candidateName = settings.profileFullName || '';

  const wordTargets: Record<string, string> = {
    short: '~150 words. Brief, punchy, gets straight to the point.',
    medium: '~300 words. Professional and thorough, covers key qualifications.',
    comprehensive: '~500 words. Detailed, tells a compelling story with specific examples.',
  };

  const signatureInstruction = signature
    ? `- End the cover letter with this EXACT signature block (do not modify it):\n${signature}`
    : candidateName
    ? `- Sign off with the candidate's name: ${candidateName}`
    : '- Include a professional closing with the candidate\'s name';

  const prompt = `Write a cover letter for a job application.

STYLE: ${wordTargets[style] || wordTargets.medium}

${extras?.hiringManager ? `ADDRESS TO: ${extras.hiringManager}` : 'Do not address to a specific person.'}
${extras?.notes ? `SPECIAL NOTES: ${extras.notes}` : ''}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${blocksToText(resumeBlocks)}

INSTRUCTIONS:
- Write in first person
- Be specific about how the candidate's experience matches the role
- Show enthusiasm without being over-the-top
- Do NOT invent experience or qualifications
- Do NOT include a subject line
- Include a professional greeting
${signatureInstruction}
- Return ONLY the cover letter text, no markdown formatting`;

  let result = await callAI(prompt);

  // Post-process: replace any placeholder names with the actual candidate name
  if (candidateName) {
    result = result
      .replace(/\[Candidate Name\]/gi, candidateName)
      .replace(/\[Your Name\]/gi, candidateName)
      .replace(/\[Full Name\]/gi, candidateName)
      .replace(/\[Name\]/gi, candidateName);
  }

  return result;
}

// ─── Application Q&A ──────────────────────────────────────────

export async function answerQuestion(
  question: string,
  context: {
    resumeBlocks: ResumeBlock[];
    jobDescription: string;
    preferences: Partial<UserPreferences>;
  }
): Promise<string> {
  const prompt = `You are helping a job applicant answer a supplementary application question.

QUESTION: "${question}"

JOB DESCRIPTION:
${context.jobDescription}

CANDIDATE'S RESUME:
${blocksToText(context.resumeBlocks)}

CANDIDATE PREFERENCES:
${context.preferences.salaryExpectation ? `- Salary expectation: ${context.preferences.salaryExpectation}` : ''}
${context.preferences.workAuthorization ? `- Work authorization: ${context.preferences.workAuthorization}` : ''}
${context.preferences.willingToRelocate !== undefined ? `- Willing to relocate: ${context.preferences.willingToRelocate ? 'Yes' : 'No'}` : ''}

INSTRUCTIONS:
- Answer concisely and professionally
- Use specific examples from the resume when relevant
- For salary questions, use the candidate's stated preference or give a diplomatic response
- For "why this company" questions, reference specific aspects of the job description
- Return ONLY the answer text`;

  return callAI(prompt);
}

// ─── Interview Prep ────────────────────────────────────────────

export async function generateInterviewPrep(
  resumeBlocks: ResumeBlock[],
  jobDescription: string
): Promise<InterviewPrepResult> {
  const prompt = `Generate interview preparation materials for this candidate and role.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${blocksToText(resumeBlocks)}

Return a JSON object with this exact structure:
{
  "behavioral": ["question 1", "question 2", ...],
  "technical": ["question 1", "question 2", ...],
  "situational": ["question 1", "question 2", ...],
  "questionsToAsk": ["question 1", "question 2", ...],
  "tips": "Brief preparation tips specific to this role and candidate"
}

Include 5 questions in each category. Return ONLY valid JSON.`;

  const text = await callAI(prompt);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI did not return valid JSON');
  return JSON.parse(jsonMatch[0]);
}

// ─── Salary Research ───────────────────────────────────────────

export async function researchSalary(
  role: string,
  location: string,
  experience: string
): Promise<string> {
  const prompt = `Provide a salary estimate for this role:

Role: ${role}
Location: ${location}
Experience Level: ${experience}

Include:
- Estimated salary range (low, median, high)
- Key factors that affect compensation for this role
- Brief market context

Be concise. Return plain text, no markdown.`;

  return callAI(prompt);
}
