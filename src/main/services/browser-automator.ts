import { exec } from 'child_process';
import { promisify } from 'util';
import type { FormField } from '../../shared/types';

const execAsync = promisify(exec);

export type BrowserType = 'safari' | 'chrome';

// ─── AppleScript Execution ─────────────────────────────────────

async function runAppleScript(script: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
    return stdout.trim();
  } catch (err: any) {
    throw new Error(`AppleScript error: ${err.message}`);
  }
}

// ─── Get Current URL ───────────────────────────────────────────

export async function getCurrentURL(browser: BrowserType): Promise<string> {
  const script = browser === 'safari'
    ? 'tell application "Safari" to return URL of current tab of front window'
    : 'tell application "Google Chrome" to return URL of active tab of front window';
  return runAppleScript(script);
}

// ─── Execute JavaScript in Browser ─────────────────────────────

export async function executeJavaScript(browser: BrowserType, js: string): Promise<string> {
  // Escape the JS for embedding in AppleScript
  const escaped = js
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');

  const script = browser === 'safari'
    ? `tell application "Safari" to do JavaScript "${escaped}" in current tab of front window`
    : `tell application "Google Chrome" to execute active tab of front window javascript "${escaped}"`;

  return runAppleScript(script);
}

// ─── Detect Form Fields ───────────────────────────────────────

export async function detectFormFields(browser: BrowserType): Promise<FormField[]> {
  const js = `(function() {
    var fields = [];
    document.querySelectorAll('input, select, textarea').forEach(function(el) {
      if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return;
      fields.push({
        tag: el.tagName.toLowerCase(),
        type: el.type || '',
        name: el.name || '',
        id: el.id || '',
        label: (el.labels && el.labels[0] ? el.labels[0].textContent : '').trim(),
        placeholder: el.placeholder || '',
        required: el.required,
        value: el.value || '',
        ariaLabel: el.getAttribute('aria-label') || ''
      });
    });
    document.querySelectorAll('input[type="file"]').forEach(function(el) {
      fields.push({
        tag: 'input', type: 'file',
        name: el.name || '', id: el.id || '',
        label: (el.labels && el.labels[0] ? el.labels[0].textContent : '').trim(),
        placeholder: '', required: el.required,
        value: '', ariaLabel: el.getAttribute('aria-label') || '',
        accept: el.accept || ''
      });
    });
    return JSON.stringify(fields);
  })()`;

  const result = await executeJavaScript(browser, js);
  try {
    return JSON.parse(result);
  } catch {
    return [];
  }
}

// ─── Fill a Single Field ──────────────────────────────────────

export async function fillField(browser: BrowserType, selector: string, value: string): Promise<boolean> {
  const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');

  const js = `(function() {
    var el = document.getElementById('${selector}') || document.querySelector('[name="${selector}"]');
    if (!el) return 'not_found';
    var nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    );
    if (nativeSetter && nativeSetter.set) {
      nativeSetter.set.call(el, '${escaped}');
    } else {
      el.value = '${escaped}';
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    return 'filled';
  })()`;

  const result = await executeJavaScript(browser, js);
  return result === 'filled';
}

// ─── Fill Multiple Fields ─────────────────────────────────────

export async function fillFields(
  browser: BrowserType,
  mappings: { selector: string; value: string }[]
): Promise<{ selector: string; success: boolean }[]> {
  const results: { selector: string; success: boolean }[] = [];
  for (const mapping of mappings) {
    const success = await fillField(browser, mapping.selector, mapping.value);
    results.push({ selector: mapping.selector, success });
  }
  return results;
}

// ─── Get Page Title ───────────────────────────────────────────

export async function getPageTitle(browser: BrowserType): Promise<string> {
  return executeJavaScript(browser, 'document.title');
}

// ─── Platform Detection (cross-platform stubs) ────────────────
// On Windows: would use PowerShell/UI Automation
// On Linux: would use xdotool + browser extensions
// Currently only macOS AppleScript is implemented

export function isAutomationSupported(): boolean {
  return process.platform === 'darwin';
}
