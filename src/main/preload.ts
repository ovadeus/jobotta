import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // Resumes
  listResumes: () => ipcRenderer.invoke('resume:list'),
  getResume: (id: string) => ipcRenderer.invoke('resume:get', id),
  createResume: (data: any) => ipcRenderer.invoke('resume:create', data),
  updateResume: (id: string, data: any) => ipcRenderer.invoke('resume:update', id, data),
  deleteResume: (id: string) => ipcRenderer.invoke('resume:delete', id),

  // Resume Blocks
  createBlock: (resumeId: string, data: any) => ipcRenderer.invoke('block:create', resumeId, data),
  updateBlock: (id: string, data: any) => ipcRenderer.invoke('block:update', id, data),
  deleteBlock: (id: string) => ipcRenderer.invoke('block:delete', id),
  reorderBlocks: (resumeId: string, orderedIds: string[]) => ipcRenderer.invoke('block:reorder', resumeId, orderedIds),

  // Job Targets
  listJobTargets: () => ipcRenderer.invoke('job-target:list'),
  getJobTarget: (id: string) => ipcRenderer.invoke('job-target:get', id),
  createJobTarget: (data: any) => ipcRenderer.invoke('job-target:create', data),
  updateJobTarget: (id: string, data: any) => ipcRenderer.invoke('job-target:update', id, data),
  deleteJobTarget: (id: string) => ipcRenderer.invoke('job-target:delete', id),

  // Applications
  listApplications: () => ipcRenderer.invoke('application:list'),
  getApplication: (id: string) => ipcRenderer.invoke('application:get', id),
  createApplication: (data: any) => ipcRenderer.invoke('application:create', data),
  updateApplication: (id: string, data: any) => ipcRenderer.invoke('application:update', id, data),
  deleteApplication: (id: string) => ipcRenderer.invoke('application:delete', id),

  // Milestones & Contacts
  addMilestone: (applicationId: string, data: any) => ipcRenderer.invoke('milestone:add', applicationId, data),
  deleteMilestone: (id: string) => ipcRenderer.invoke('milestone:delete', id),
  addContact: (applicationId: string, data: any) => ipcRenderer.invoke('contact:add', applicationId, data),
  deleteContact: (id: string) => ipcRenderer.invoke('contact:delete', id),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (data: any) => ipcRenderer.invoke('settings:update', data),

  // AI (multi-provider)
  tailorResume: (blocks: any[], jobDesc: string, strategy: string) =>
    ipcRenderer.invoke('ai:tailor-resume', blocks, jobDesc, strategy),
  generateCoverLetter: (blocks: any[], jobDesc: string, style: string, extras?: any) =>
    ipcRenderer.invoke('ai:generate-cover-letter', blocks, jobDesc, style, extras),
  answerQuestion: (question: string, context: any) =>
    ipcRenderer.invoke('ai:answer-question', question, context),
  generateInterviewPrep: (blocks: any[], jobDesc: string) =>
    ipcRenderer.invoke('ai:interview-prep', blocks, jobDesc),
  researchSalary: (role: string, location: string, experience: string) =>
    ipcRenderer.invoke('ai:salary-research', role, location, experience),

  // Browser Automation
  getBrowserUrl: (browser: string) => ipcRenderer.invoke('browser:get-url', browser),
  detectFormFields: (browser: string) => ipcRenderer.invoke('browser:detect-fields', browser),
  fillFormFields: (browser: string, mappings: any[]) => ipcRenderer.invoke('browser:fill-fields', browser, mappings),
  getBrowserTitle: (browser: string) => ipcRenderer.invoke('browser:get-title', browser),
  isAutomationSupported: () => ipcRenderer.invoke('browser:is-supported'),
  detectATS: (url: string) => ipcRenderer.invoke('ats:detect', url),

  // Job Scraper & Search
  scrapeJobUrl: (url: string) => ipcRenderer.invoke('scrape:job-url', url),
  searchJobs: (params: any) => ipcRenderer.invoke('jobs:search', params),
  getSearchUsage: () => ipcRenderer.invoke('jobs:usage'),

  // Sync
  getSyncStatus: () => ipcRenderer.invoke('sync:status'),
  triggerSync: () => ipcRenderer.invoke('sync:full'),
};

contextBridge.exposeInMainWorld('jobotta', api);

export type JobottaAPI = typeof api;
