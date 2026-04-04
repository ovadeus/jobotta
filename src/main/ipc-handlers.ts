import { ipcMain } from 'electron';
import * as resumeRepo from './database/repositories/resume.repo';
import * as jobTargetRepo from './database/repositories/job-target.repo';
import * as applicationRepo from './database/repositories/application.repo';
import * as settingsRepo from './database/repositories/settings.repo';
import * as aiService from './services/ai.service';
import * as browserAutomator from './services/browser-automator';
import * as atsDetector from './services/ats-detector';
import { scrapeJobUrl } from './services/job-scraper';
import { searchJobs, getSearchUsage } from './services/job-search';
import * as syncService from './services/sync.service';

export function registerIpcHandlers() {
  // ─── Resumes ─────────────────────────────────────────────
  ipcMain.handle('resume:list', () => resumeRepo.listResumes());
  ipcMain.handle('resume:get', (_, id: string) => resumeRepo.getResume(id));
  ipcMain.handle('resume:create', (_, data) => resumeRepo.createResume(data));
  ipcMain.handle('resume:update', (_, id: string, data) => resumeRepo.updateResume(id, data));
  ipcMain.handle('resume:delete', (_, id: string) => resumeRepo.deleteResume(id));

  // ─── Resume Blocks ──────────────────────────────────────
  ipcMain.handle('block:create', (_, resumeId: string, data) => resumeRepo.createBlock(resumeId, data));
  ipcMain.handle('block:update', (_, id: string, data) => resumeRepo.updateBlock(id, data));
  ipcMain.handle('block:delete', (_, id: string) => resumeRepo.deleteBlock(id));
  ipcMain.handle('block:reorder', (_, resumeId: string, orderedIds: string[]) => resumeRepo.reorderBlocks(resumeId, orderedIds));

  // ─── Job Targets ────────────────────────────────────────
  ipcMain.handle('job-target:list', () => jobTargetRepo.listJobTargets());
  ipcMain.handle('job-target:get', (_, id: string) => jobTargetRepo.getJobTarget(id));
  ipcMain.handle('job-target:create', (_, data) => jobTargetRepo.createJobTarget(data));
  ipcMain.handle('job-target:update', (_, id: string, data) => jobTargetRepo.updateJobTarget(id, data));
  ipcMain.handle('job-target:delete', (_, id: string) => jobTargetRepo.deleteJobTarget(id));

  // ─── Applications ───────────────────────────────────────
  ipcMain.handle('application:list', () => applicationRepo.listApplications());
  ipcMain.handle('application:get', (_, id: string) => applicationRepo.getApplication(id));
  ipcMain.handle('application:create', (_, data) => applicationRepo.createApplication(data));
  ipcMain.handle('application:update', (_, id: string, data) => applicationRepo.updateApplication(id, data));
  ipcMain.handle('application:delete', (_, id: string) => applicationRepo.deleteApplication(id));

  // ─── Milestones & Contacts ──────────────────────────────
  ipcMain.handle('milestone:add', (_, applicationId: string, data) => applicationRepo.addMilestone(applicationId, data));
  ipcMain.handle('milestone:delete', (_, id: string) => applicationRepo.deleteMilestone(id));
  ipcMain.handle('contact:add', (_, applicationId: string, data) => applicationRepo.addContact(applicationId, data));
  ipcMain.handle('contact:delete', (_, id: string) => applicationRepo.deleteContact(id));

  // ─── Settings ───────────────────────────────────────────
  ipcMain.handle('settings:get', () => settingsRepo.getSettings());
  ipcMain.handle('settings:update', (_, data) => settingsRepo.updateSettings(data));

  // ─── AI (Gemini) ────────────────────────────────────────
  ipcMain.handle('ai:tailor-resume', (_, blocks, jobDesc, strategy) =>
    aiService.tailorResume(blocks, jobDesc, strategy));
  ipcMain.handle('ai:generate-cover-letter', (_, blocks, jobDesc, style, extras) =>
    aiService.generateCoverLetter(blocks, jobDesc, style, extras));
  ipcMain.handle('ai:answer-question', (_, question, context) =>
    aiService.answerQuestion(question, context));
  ipcMain.handle('ai:interview-prep', (_, blocks, jobDesc) =>
    aiService.generateInterviewPrep(blocks, jobDesc));
  ipcMain.handle('ai:salary-research', (_, role, location, experience) =>
    aiService.researchSalary(role, location, experience));

  // ─── Browser Automation ─────────────────────────────────
  ipcMain.handle('browser:get-url', (_, browser) =>
    browserAutomator.getCurrentURL(browser));
  ipcMain.handle('browser:detect-fields', (_, browser) =>
    browserAutomator.detectFormFields(browser));
  ipcMain.handle('browser:fill-fields', (_, browser, mappings) =>
    browserAutomator.fillFields(browser, mappings));
  ipcMain.handle('browser:get-title', (_, browser) =>
    browserAutomator.getPageTitle(browser));
  ipcMain.handle('browser:is-supported', () =>
    browserAutomator.isAutomationSupported());
  ipcMain.handle('ats:detect', (_, url) =>
    ({ platform: atsDetector.detectATS(url), name: atsDetector.getATSDisplayName(atsDetector.detectATS(url)) }));

  // ─── Job Scraper ────────────────────────────────────────
  ipcMain.handle('scrape:job-url', (_, url: string) => scrapeJobUrl(url));

  // ─── Job Search (JSearch API) ──────────────────────────
  ipcMain.handle('jobs:search', (_, params) => searchJobs(params));
  ipcMain.handle('jobs:usage', () => getSearchUsage());

  // ─── Sync ───────────────────────────────────────────────
  ipcMain.handle('sync:status', () => syncService.getSyncStatus());
  ipcMain.handle('sync:full', () => syncService.fullSync());
}
