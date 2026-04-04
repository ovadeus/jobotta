// ─── Core Entity Types ─────────────────────────────────────────

export interface MasterResume {
  id: string;
  userId?: string;
  name: string;
  isMaster: boolean;
  blocks: ResumeBlock[];
  createdAt: string;
  updatedAt: string;
  syncId?: string;
  syncVersion?: number;
  deletedAt?: string;
}

export type BlockType =
  | 'personal_info'
  | 'summary'
  | 'work_experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'projects'
  | 'awards'
  | 'volunteer'
  | 'references'
  | 'custom';

export const BLOCK_TYPES: BlockType[] = [
  'personal_info', 'summary', 'work_experience', 'education',
  'skills', 'certifications', 'projects', 'awards', 'volunteer', 'references', 'custom',
];

export interface ResumeBlock {
  id: string;
  resumeId: string;
  blockType: BlockType;
  title: string;
  content: Record<string, unknown>;
  isIncluded: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobTarget {
  id: string;
  userId?: string;
  masterResumeId: string;
  jobTitle: string;
  company: string;
  jobDescriptionText?: string;
  jobDescriptionUrl?: string;
  deadline?: string;
  notes?: string;
  tailoredResumeContent?: ResumeBlock[];
  coverLetterText?: string;
  atsScore?: number;
  preferred?: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  syncId?: string;
  syncVersion?: number;
  deletedAt?: string;
}

export type ApplicationStage =
  | 'saved'
  | 'applied'
  | 'phone_screen'
  | 'interview'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'archived';

export const APPLICATION_STAGES: ApplicationStage[] = [
  'saved', 'applied', 'phone_screen', 'interview', 'offer', 'accepted', 'rejected', 'archived',
];

export interface Application {
  id: string;
  userId?: string;
  jobTargetId?: string;
  company: string;
  role: string;
  stage: ApplicationStage;
  appliedDate?: string;
  source?: string;
  priority?: boolean;
  milestones: Milestone[];
  contacts: Contact[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncId?: string;
  syncVersion?: number;
  deletedAt?: string;
}

export interface Milestone {
  id: string;
  applicationId: string;
  title: string;
  notes?: string;
  occurredAt: string;
}

export interface Contact {
  id: string;
  applicationId: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  notes?: string;
}

export interface UserPreferences {
  // Personal Information (profile)
  profileFullName?: string;
  profileEmail?: string;
  profilePhone?: string;
  profileLocation?: string;
  profileLinkedin?: string;
  profileWebsite?: string;
  coverLetterSignature?: string;

  defaultResumeId?: string;
  coverLetterStyle: 'short' | 'medium' | 'comprehensive';
  atsStrategy: 'keyword_match' | 'balanced' | 'narrative';
  salaryExpectation?: string;
  workAuthorization?: string;
  willingToRelocate?: boolean;
  eeoResponses?: Record<string, string>;
  aiProvider?: 'gemini' | 'openai' | 'anthropic';
  geminiApiKey?: string;
  geminiModel?: string;
  openaiApiKey?: string;
  openaiModel?: string;
  anthropicApiKey?: string;
  anthropicModel?: string;
  rapidApiKey?: string;
  syncApiUrl?: string;
  defaultBrowser?: 'safari' | 'chrome';
  autoFillMode?: 'conservative' | 'balanced' | 'aggressive';
  confirmBeforeSubmit?: boolean;
  syncFrequency?: 'realtime' | 'hourly' | 'manual';
  theme?: 'light' | 'dark';
}

// ─── IPC Channel Types ─────────────────────────────────────────

export interface IpcChannels {
  // Resumes
  'resume:list': () => MasterResume[];
  'resume:get': (id: string) => MasterResume | null;
  'resume:create': (data: Omit<MasterResume, 'id' | 'createdAt' | 'updatedAt' | 'blocks'>) => MasterResume;
  'resume:update': (id: string, data: Partial<MasterResume>) => MasterResume;
  'resume:delete': (id: string) => void;

  // Resume Blocks
  'block:create': (resumeId: string, data: Omit<ResumeBlock, 'id' | 'createdAt' | 'updatedAt'>) => ResumeBlock;
  'block:update': (id: string, data: Partial<ResumeBlock>) => ResumeBlock;
  'block:delete': (id: string) => void;
  'block:reorder': (resumeId: string, orderedIds: string[]) => void;

  // Job Targets
  'job-target:list': () => JobTarget[];
  'job-target:get': (id: string) => JobTarget | null;
  'job-target:create': (data: Omit<JobTarget, 'id' | 'createdAt' | 'updatedAt'>) => JobTarget;
  'job-target:update': (id: string, data: Partial<JobTarget>) => JobTarget;
  'job-target:delete': (id: string) => void;

  // Applications
  'application:list': () => Application[];
  'application:get': (id: string) => Application | null;
  'application:create': (data: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'milestones' | 'contacts'>) => Application;
  'application:update': (id: string, data: Partial<Application>) => Application;
  'application:delete': (id: string) => void;

  // Settings
  'settings:get': () => UserPreferences;
  'settings:update': (data: Partial<UserPreferences>) => UserPreferences;

  // AI
  'ai:tailor-resume': (resumeBlocks: ResumeBlock[], jobDescription: string, strategy: string) => ResumeBlock[];
  'ai:generate-cover-letter': (resumeBlocks: ResumeBlock[], jobDescription: string, style: string, extras?: { hiringManager?: string; notes?: string }) => string;
  'ai:answer-question': (question: string, context: { resumeBlocks: ResumeBlock[]; jobDescription: string; preferences: Partial<UserPreferences> }) => string;
  'ai:interview-prep': (resumeBlocks: ResumeBlock[], jobDescription: string) => InterviewPrepResult;
  'ai:salary-research': (role: string, location: string, experience: string) => string;
}

export interface InterviewPrepResult {
  behavioral: string[];
  technical: string[];
  situational: string[];
  questionsToAsk: string[];
  tips: string;
}

// ─── Form Field Types (Browser Automation) ─────────────────────

export interface FormField {
  tag: string;
  type: string;
  name: string;
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  value: string;
  ariaLabel: string;
  accept?: string;
}

export interface FieldMapping {
  field: FormField;
  mappedValue: string;
  source: string;
  confirmed: boolean;
}

// ─── Sync Types ────────────────────────────────────────────────

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface SyncOperation {
  id: string;
  entity: string;
  entityId: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload?: string;
  timestamp: string;
}
