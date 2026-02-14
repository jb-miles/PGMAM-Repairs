#!/usr/bin/env node
/*
  macOS Harness: Plex -> Unique Actors -> IAFD URLs -> IAFD Photos -> PGMA folders

  This is a copy of the Windows harness with macOS path auto-detection.
*/

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const readline = require('readline');

// In the packaged Plug-ins layout, OS harnesses live under ./windows|./macos|./linux
// and shared code lives under ../common.
const ROOT = path.resolve(__dirname, '..', 'common');
const PLEX_EXPORT_DIR = path.join(ROOT, 'plex-export');
const IAFD_LOOKUP_DIR = path.join(ROOT, 'iafd-lookup');

function nowIso() {
  return new Date().toISOString();
}

function log(msg) {
  process.stdout.write(`[${nowIso()}] ${msg}\n`);
}

async function fetchJson(url, { timeoutMs = 30000, headers = {} } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'GET', headers, signal: controller.signal });
    const text = await res.text();
    if (!res.ok) {
      const snippet = text.slice(0, 200).replace(/\s+/g, ' ');
      throw new Error(`HTTP ${res.status} ${res.statusText}; body: ${snippet}`);
    }
    return JSON.parse(text);
  } finally {
    clearTimeout(t);
  }
}

async function pathExists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

function parseNodeMajor() {
  const m = String(process.version || '').match(/^v(\d+)/);
  return m ? Number(m[1]) : 0;
}

function question(rl, prompt, { defaultValue = '', secret = false } = {}) {
  const fullPrompt = defaultValue ? `${prompt} [${defaultValue}]: ` : `${prompt}: `;

  if (!secret) {
    return new Promise((resolve) => rl.question(fullPrompt, (ans) => resolve(ans || defaultValue)));
  }

  return new Promise((resolve) => {
    const stdin = process.stdin;
    let secretValue = '';
    const onData = (char) => {
      char = char + '';
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.pause();
          stdin.setRawMode(false);
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(secretValue || defaultValue);
          break;
        case '\u0003':
          process.exit(130);
          break;
        default:
          secretValue += char;
          process.stdout.write('*');
          break;
      }
    };

    process.stdout.write(fullPrompt);
    stdin.resume();
    stdin.setRawMode(true);
    stdin.on('data', onData);
  });
}

function runCmd(cmd, args, { cwd, redact = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      env: process.env,
    });

    let out = '';
    let err = '';
    child.stdout.on('data', (d) => {
      out += d.toString('utf8');
      process.stdout.write(d);
    });
    child.stderr.on('data', (d) => {
      err += d.toString('utf8');
      process.stderr.write(d);
    });

    child.on('error', (e) => reject(e));
    child.on('close', (code) => {
      if (code === 0) return resolve({ code, out, err });
      const shown = redact ? '[redacted args]' : `${cmd} ${args.join(' ')}`;
      const e = new Error(`Command failed (${code}): ${shown}`);
      e.code = code;
      e.out = out;
      e.err = err;
      reject(e);
    });
  });
}

function defaultPlexBaseUrl() {
  return 'http://localhost:32400';
}

async function resolvePlexSupportPath(rl) {
  const candidate = path.join(os.homedir(), 'Library', 'Application Support', 'Plex Media Server');
  if (await pathExists(candidate)) {
    log(`Detected Plex support directory: ${candidate}`);
    return candidate;
  }

  log('Could not auto-detect Plex support directory.');
  while (true) {
    const ans = await question(rl, 'Enter Plex Media Server support directory', { defaultValue: candidate });
    const p = ans.trim();
    if (!p) continue;
    if (await pathExists(p)) return p;
    log(`Path not found: ${p}`);
  }
}

async function resolvePgmaPath(rl, plexSupportPath) {
  const expected = plexSupportPath ? path.join(plexSupportPath, 'Plug-ins', '_PGMA') : '';
  if (expected && (await pathExists(expected))) {
    log(`Found _PGMA at: ${expected}`);
    return expected;
  }

  if (expected) log(`_PGMA not found at expected path: ${expected}`);

  while (true) {
    const ans = await question(rl, 'Enter full path to your _PGMA folder (contains Cast/Poster)', {
      defaultValue: expected || '',
    });
    const p = ans.trim();
    if (!p) continue;
    if (await pathExists(p)) {
      log(`Using _PGMA: ${p}`);
      return p;
    }
    log(`Path not found: ${p}`);
  }
}

async function ensurePgmaCastDirs(pgmaPath) {
  const poster = path.join(pgmaPath, 'Cast', 'Poster');
  const face = path.join(pgmaPath, 'Cast', 'Face');
  await ensureDir(poster);
  await ensureDir(face);
  return { poster, face };
}

async function maybeInstallPlaywright() {
  const nodeModules = path.join(IAFD_LOOKUP_DIR, 'node_modules', 'playwright');
  if (await pathExists(nodeModules)) {
    log('Playwright dependency already installed.');
    return;
  }

  log('Installing Playwright (npm install) ...');
  await runCmd('npm', ['install'], { cwd: IAFD_LOOKUP_DIR });
}

async function maybeInstallChromium() {
  log('Ensuring Playwright Chromium is installed (npx playwright install chromium) ...');
  await runCmd('npx', ['playwright', 'install', 'chromium'], { cwd: IAFD_LOOKUP_DIR });
}

async function chooseMovieSectionId(rl, plexBaseUrl, plexToken) {
  log('Fetching Plex library sections ...');
  const url = `${plexBaseUrl.replace(/\/$/, '')}/library/sections?X-Plex-Token=${encodeURIComponent(plexToken)}`;
  const data = await fetchJson(url, { timeoutMs: 30000, headers: { Accept: 'application/json' } });
  const dirs = (data && data.MediaContainer && data.MediaContainer.Directory) || [];
  const movieSections = dirs
    .filter((d) => String(d.type || '').toLowerCase() === 'movie')
    .map((d) => ({ key: Number(d.key), title: String(d.title || ''), type: String(d.type || '') }))
    .filter((d) => Number.isFinite(d.key));

  if (movieSections.length === 0) {
    const available = dirs.map((d) => `${d.title || ''} (id=${d.key}, type=${d.type})`).join(', ');
    throw new Error(`No movie library sections found. Available sections: ${available}`);
  }

  log('Movie libraries found:');
  for (const s of movieSections) log(`  - id=${s.key} title="${s.title}"`);

  const def = String(movieSections[0].key);
  while (true) {
    const ans = await question(rl, 'Which Movies library id should be used?', { defaultValue: def });
    const chosen = Number(String(ans || '').trim());
    if (!Number.isFinite(chosen)) {
      log('Please enter a numeric library id.');
      continue;
    }
    if (movieSections.some((s) => s.key === chosen)) return chosen;
    log(`Library id ${chosen} is not one of the movie sections listed above.`);
  }
}

async function runPlexExportActors({ plexBaseUrl, plexToken, sectionId }) {
  const outCsv = path.join(PLEX_EXPORT_DIR, 'actors.csv');
  const state = path.join(PLEX_EXPORT_DIR, 'plex-actors-state.json');

  log('Exporting unique actors from Plex Movies library ...');
  await runCmd(
    'node',
    [
      'plex-export-actors.js',
      '--base',
      plexBaseUrl,
      '--token',
      plexToken,
      '--section-id',
      String(sectionId),
      '--output',
      outCsv,
      '--state',
      state,
    ],
    { cwd: PLEX_EXPORT_DIR, redact: true }
  );

  log(`Actors CSV: ${outCsv}`);
  return outCsv;
}

async function actorsCsvToList(actorsCsvPath) {
  const listPath = path.join(IAFD_LOOKUP_DIR, 'plex-actors.txt');
  const raw = await fsp.readFile(actorsCsvPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const names = [];

  for (let i = 1; i < lines.length; i += 1) {
    let s = lines[i];
    if (!s) continue;
    if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1).replace(/""/g, '"');
    s = s.trim();
    if (s) names.push(s);
  }

  await fsp.writeFile(listPath, `${names.join(os.EOL)}${os.EOL}`);
  log(`IAFD input list written: ${listPath} (${names.length} names)`);
  return listPath;
}

function parseYesNo(value, defaultValue) {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return defaultValue;
  if (['y', 'yes', 'true', '1'].includes(v)) return true;
  if (['n', 'no', 'false', '0'].includes(v)) return false;
  return defaultValue;
}

async function runIafdLookup({ inputListPath, pgmaPath, photoKind, photoOverwrite }) {
  const outCsv = path.join(IAFD_LOOKUP_DIR, 'iafd-from-plex.csv');
  const outLog = path.join(IAFD_LOOKUP_DIR, 'iafd-from-plex.log');

  log('Running IAFD lookup + photo download into _PGMA ...');
  const args = [
    'iafd-lookup.js',
    '--input',
    inputListPath,
    '--output',
    outCsv,
    '--log',
    outLog,
    '--resume',
    '--concurrency',
    '1',
    '--delay',
    '2000',
    '--timeout',
    '30000',
    '--photos',
    '--photo-kind',
    photoKind,
    '--pgma',
    pgmaPath,
  ];
  if (photoOverwrite) args.push('--photo-overwrite');

  await runCmd('node', args, { cwd: IAFD_LOOKUP_DIR });
  log(`IAFD results CSV: ${outCsv}`);
  log(`IAFD log: ${outLog}`);
  return { outCsv, outLog };
}

async function main() {
  const major = parseNodeMajor();
  if (major < 20) throw new Error(`Node.js v20+ required. You are running ${process.version}`);

  if (!(await pathExists(PLEX_EXPORT_DIR)) || !(await pathExists(IAFD_LOOKUP_DIR))) {
    throw new Error(`Expected folders not found. Need:\n- ${PLEX_EXPORT_DIR}\n- ${IAFD_LOOKUP_DIR}`);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    log('Plex -> IAFD workflow harness starting (macOS).');

    const plexBaseUrl = (await question(rl, 'Plex base URL', { defaultValue: defaultPlexBaseUrl() })).trim();
    const plexToken = (await question(rl, 'Plex token (X-Plex-Token)', { defaultValue: '', secret: true })).trim();
    if (!plexToken) throw new Error('Token is required.');

    const sectionId = await chooseMovieSectionId(rl, plexBaseUrl, plexToken);
    log(`Using Movies library section id: ${sectionId}`);

    const plexSupportPath = await resolvePlexSupportPath(rl);
    log(`Plex support directory: ${plexSupportPath}`);

    const pgmaPath = await resolvePgmaPath(rl, plexSupportPath);
    const dirs = await ensurePgmaCastDirs(pgmaPath);
    log(`PGMA poster dir: ${dirs.poster}`);
    log(`PGMA face dir: ${dirs.face}`);

    const photoKind = (await question(rl, 'Download which photos? (poster|face|both)', { defaultValue: 'both' }))
      .trim()
      .toLowerCase();
    if (!['poster', 'face', 'both'].includes(photoKind)) throw new Error('Invalid choice for photo kind.');

    const overwriteAns = await question(rl, 'Overwrite existing image files? (y/n)', { defaultValue: 'n' });
    const photoOverwrite = parseYesNo(overwriteAns, false);
    log(`Photo settings: kind=${photoKind} overwrite=${photoOverwrite}`);

    await maybeInstallPlaywright();
    await maybeInstallChromium();

    const actorsCsv = await runPlexExportActors({ plexBaseUrl, plexToken, sectionId });
    const inputList = await actorsCsvToList(actorsCsv);

    await runIafdLookup({ inputListPath: inputList, pgmaPath, photoKind, photoOverwrite });
    log('Workflow complete.');
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  process.stderr.write(`${err && err.stack ? err.stack : String(err)}\n`);
  process.exitCode = 1;
});
