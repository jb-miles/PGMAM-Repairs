#!/usr/bin/env node

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
let chromium = null;

const DEFAULTS = {
  input: 'performers.txt',
  output: 'results.csv',
  log: 'iafd-lookup.log',
  concurrency: 1,
  delay: 2000,
  resume: false,
  headless: false,
  timeout: 30000,
  photos: false,
  pgmaPath: '',
  photoKind: 'poster', // poster|face|both
  photoOverwrite: false,
};

const MAX_CONCURRENCY = 3;
const PROGRESS_EVERY = 100;
const CHALLENGE_WAIT_MS = 10000;
const MAX_CHALLENGE_RETRIES = 3;
const NAV_RETRIES = 2;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function parseArgs(argv) {
  const options = { ...DEFAULTS };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--input') {
      options.input = argv[++i];
    } else if (arg === '--output') {
      options.output = argv[++i];
    } else if (arg === '--log') {
      options.log = argv[++i];
    } else if (arg === '--concurrency') {
      options.concurrency = Number(argv[++i]);
    } else if (arg === '--delay') {
      options.delay = Number(argv[++i]);
    } else if (arg === '--resume') {
      options.resume = true;
    } else if (arg === '--headless') {
      options.headless = true;
    } else if (arg === '--timeout') {
      options.timeout = Number(argv[++i]);
    } else if (arg === '--photos') {
      options.photos = true;
    } else if (arg === '--pgma') {
      options.pgmaPath = argv[++i];
    } else if (arg === '--photo-kind') {
      options.photoKind = String(argv[++i] || '').toLowerCase();
    } else if (arg === '--photo-overwrite') {
      options.photoOverwrite = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!['poster', 'face', 'both'].includes(options.photoKind)) {
    throw new Error('--photo-kind must be one of: poster, face, both');
  }

  if (!options.input) throw new Error('--input is required');
  if (!options.output) throw new Error('--output is required');
  if (!options.log) throw new Error('--log is required');

  if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
    throw new Error('--concurrency must be an integer >= 1');
  }
  if (options.concurrency > MAX_CONCURRENCY) {
    options.concurrency = MAX_CONCURRENCY;
  }
  if (!Number.isFinite(options.delay) || options.delay < 0) {
    throw new Error('--delay must be a number >= 0');
  }
  if (!Number.isFinite(options.timeout) || options.timeout < 1000) {
    throw new Error('--timeout must be a number >= 1000');
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
  node iafd-lookup.js --input performers.txt --output results.csv --log iafd-lookup.log
    [--concurrency 1] [--delay 2000] [--resume] [--headless] [--timeout 30000]
    [--photos] [--pgma /path/to/_PGMA] [--photo-kind poster|face|both] [--photo-overwrite]

Options:
  --input        Input file path (one performer per line)
  --output       Output CSV path
  --log          Log file path
  --concurrency  Number of parallel browser tabs (default: 1, max: 3)
  --delay        Base delay between requests in ms (default: 2000)
  --resume       Skip names already in output CSV
  --headless     Run browser in headless mode (default: headed)
  --timeout      Page load timeout in ms (default: 30000)
  --photos       After matching, visit the performer page and download the headshot into PGMA folders
  --pgma         Path to Plex PGMA folder (defaults to ../Application Support/Plex Media Server/Plug-ins/_PGMA if it exists)
  --photo-kind   Which PGMA folder(s) to write: poster, face, or both (default: poster)
  --photo-overwrite  Overwrite existing photo files (default: skip if exists)
  --help, -h     Show this help
`);
}

function csvEscape(value) {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (/[,"\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(row) {
  return [
    csvEscape(row.performer),
    csvEscape(row.status),
    csvEscape(row.iafd_url),
    csvEscape(row.matched_name),
    csvEscape(row.searched_at),
  ].join(',');
}

function normalizeName(value) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitterDelay(baseMs) {
  const jitter = Math.floor(Math.random() * 1001) - 500;
  return Math.max(0, baseMs + jitter);
}

function isChallengeText(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return (
    lower.includes('checking your browser') ||
    lower.includes('just a moment') ||
    lower.includes('cloudflare') ||
    lower.includes('verify you are human')
  );
}

function absoluteIafdUrl(href) {
  if (!href) return '';
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  if (href.startsWith('/')) return `https://www.iafd.com${href}`;
  return `https://www.iafd.com/${href.replace(/^\/+/, '')}`;
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+/g, '-')
    .replace(/^\-+|\-+$/g, '');
}

function parseIafdKeyFromUrl(url) {
  // Prefer legacy perfid URL pattern used by PGMA:
  // https://www.iafd.com/person.rme/perfid=zakspears/gender=m/zak-spears.htm -> zakspears#zak-spears
  const perfidMatch = String(url || '').match(
    /\/person\.rme\/perfid=([^\/]+)\/gender=[^\/]+\/([^\/]+)\.htm/i
  );
  if (perfidMatch) {
    const perfid = perfidMatch[1];
    const slug = perfidMatch[2];
    return `${perfid}#${slug}`;
  }

  // Newer id= UUID style.
  const idMatch = String(url || '').match(/[?&]id=([0-9a-fA-F\-]{16,})/);
  if (idMatch) return `iafdid#${idMatch[1].toLowerCase()}`;

  return '';
}

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

function extensionFromContentType(contentType) {
  const ct = String(contentType || '').toLowerCase();
  if (ct.includes('image/jpeg') || ct.includes('image/jpg')) return '.jpg';
  if (ct.includes('image/png')) return '.png';
  if (ct.includes('image/webp')) return '.webp';
  if (ct.includes('image/gif')) return '.gif';
  return '.jpg';
}

async function openWithChallengeRetries(page, url, timeoutMs, logger, label) {
  for (let attempt = 1; attempt <= MAX_CHALLENGE_RETRIES; attempt += 1) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await waitForUsablePage(page, timeoutMs);

    const title = await page.title().catch(() => '');
    const bodyText = await page.evaluate(() => document.body?.innerText || '').catch(() => '');
    const combined = `${title}\n${bodyText}`;
    if (!isChallengeText(combined)) return;

    logger.line(
      'WARN',
      `${label} — bot challenge on performer page (attempt ${attempt}/${MAX_CHALLENGE_RETRIES}), waiting ${CHALLENGE_WAIT_MS}ms`
    );
    if (attempt === MAX_CHALLENGE_RETRIES) {
      throw new Error('bot challenge persisted on performer page');
    }
    await sleep(CHALLENGE_WAIT_MS);
  }
}

async function extractBestHeadshot(page) {
  return page.evaluate(() => {
    function score(img) {
      const src = img.getAttribute('src') || '';
      const alt = (img.getAttribute('alt') || '').trim();
      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      const area = w * h;

      const bad = /logo|banner|sprite|pixel|spacer|ads?|doubleclick|googlead|captcha/i.test(src);
      if (!src || bad) return { ok: false, area: 0, src: '', alt: '', w: 0, h: 0 };
      if (w && h && (w < 90 || h < 90)) return { ok: false, area: 0, src: '', alt: '', w: 0, h: 0 };

      let boost = 1;
      if (alt && alt.length >= 2) boost += 0.15;
      return { ok: true, area: area * boost, src, alt, w, h };
    }

    const imgs = Array.from(document.images || []);
    let best = null;
    for (const img of imgs) {
      const s = score(img);
      if (!s.ok) continue;
      if (!best || s.area > best.area) best = s;
    }

    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
    return best
      ? { src: best.src, alt: best.alt, w: best.w, h: best.h, canonical }
      : { src: '', alt: '', w: 0, h: 0, canonical };
  });
}

async function downloadPerformerPhoto({
  page,
  context,
  iafdUrl,
  matchedName,
  pgmaPath,
  photoKind,
  overwrite,
  timeoutMs,
  logger,
  label,
}) {
  if (!pgmaPath) return { saved: false, reason: 'no_pgma_path' };

  const posterDir = path.join(pgmaPath, 'Cast', 'Poster');
  const faceDir = path.join(pgmaPath, 'Cast', 'Face');
  await ensureDir(posterDir);
  await ensureDir(faceDir);

  await openWithChallengeRetries(page, iafdUrl, timeoutMs, logger, label);
  const info = await extractBestHeadshot(page);
  if (!info.src) return { saved: false, reason: 'no_image_found' };

  const canonicalKey = parseIafdKeyFromUrl(info.canonical);
  const urlKey = parseIafdKeyFromUrl(iafdUrl);
  const key = canonicalKey || urlKey || `name#${slugify(matchedName || label)}`;

  const imgUrl = absoluteIafdUrl(info.src);

  const response = await context.request.get(imgUrl, { timeout: timeoutMs });
  if (!response.ok()) {
    throw new Error(`image download failed: HTTP ${response.status()} for ${imgUrl}`);
  }

  const headers = response.headers();
  const ext = extensionFromContentType(headers['content-type']);
  const bytes = await response.body();

  const targets = [];
  if (photoKind === 'poster' || photoKind === 'both') targets.push(path.join(posterDir, `${key}${ext}`));
  if (photoKind === 'face' || photoKind === 'both') targets.push(path.join(faceDir, `${key}${ext}`));

  let wroteAny = false;
  for (const target of targets) {
    if (!overwrite && fs.existsSync(target)) {
      logger.line('INFO', `${label} — photo exists, skipping: ${target}`);
      continue;
    }
    const tmp = `${target}.tmp`;
    await fsp.writeFile(tmp, bytes);
    await fsp.rename(tmp, target);
    wroteAny = true;
    logger.line('PHOTO', `${label} -> ${target}`);
  }

  return { saved: wroteAny, key, imgUrl };
}

class Logger {
  constructor(logPath) {
    this.logPath = logPath;
    this.stream = null;
  }

  async init() {
    await fsp.mkdir(path.dirname(this.logPath), { recursive: true });
    this.stream = fs.createWriteStream(this.logPath, { flags: 'a' });
  }

  line(level, message) {
    const ts = new Date().toISOString();
    const out = `[${ts}] [${level}] ${message}`;
    console.log(out);
    this.stream.write(`${out}\n`);
  }

  close() {
    if (this.stream) this.stream.end();
  }
}

class CsvWriter {
  constructor(outputPath) {
    this.outputPath = outputPath;
    this.stream = null;
  }

  async initHeaderIfNeeded() {
    await fsp.mkdir(path.dirname(this.outputPath), { recursive: true });
    const exists = fs.existsSync(this.outputPath);
    this.stream = fs.createWriteStream(this.outputPath, { flags: 'a' });

    if (!exists) {
      this.stream.write('performer,status,iafd_url,matched_name,searched_at\n');
    }
  }

  writeRow(row) {
    this.stream.write(`${toCsvRow(row)}\n`);
  }

  close() {
    if (this.stream) this.stream.end();
  }
}

async function readPerformers(inputPath) {
  const raw = await fsp.readFile(inputPath, 'utf8');
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

async function readCompletedPerformers(outputPath) {
  const set = new Set();
  if (!fs.existsSync(outputPath)) return set;

  const raw = await fsp.readFile(outputPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return set;

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    const first = parseFirstCsvField(line);
    if (first) set.add(first);
  }

  return set;
}

function parseFirstCsvField(line) {
  if (!line) return '';
  if (!line.startsWith('"')) {
    const idx = line.indexOf(',');
    return idx === -1 ? line : line.slice(0, idx);
  }

  let out = '';
  for (let i = 1; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (line[i + 1] === '"') {
        out += '"';
        i += 1;
      } else {
        break;
      }
    } else {
      out += ch;
    }
  }
  return out;
}

async function launchBrowser(headless) {
  if (!chromium) {
    ({ chromium } = require('playwright'));
  }

  return chromium.launch({
    headless,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });
}

async function createContext(browser) {
  return browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
  });
}

async function extractPersonLinks(page) {
  return page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/person.rme/"]'));
    const seen = new Set();
    const out = [];

    for (const link of links) {
      const href = link.getAttribute('href') || '';
      const text = (link.textContent || '').trim();
      const key = `${href}|${text}`;
      if (!href || seen.has(key)) continue;
      seen.add(key);
      out.push({ href, text });
    }

    return out;
  });
}

function chooseResult(name, personLinks) {
  const normalizedInput = normalizeName(name);
  const normalized = personLinks.map((item) => ({
    ...item,
    normalizedText: normalizeName(item.text || ''),
    url: absoluteIafdUrl(item.href),
  }));

  const exact = normalized.find((item) => item.normalizedText === normalizedInput);
  if (exact) {
    return {
      status: 'found',
      iafd_url: exact.url,
      matched_name: exact.text || '',
      reason: 'exact_match',
    };
  }

  if (normalized.length === 1) {
    return {
      status: 'found',
      iafd_url: normalized[0].url,
      matched_name: normalized[0].text || '',
      reason: 'single_result',
    };
  }

  if (normalized.length > 1) {
    return {
      status: 'multiple_matches',
      iafd_url: normalized[0].url,
      matched_name: normalized[0].text || '',
      reason: 'multiple_results',
      allMatches: normalized,
    };
  }

  return {
    status: 'not_found',
    iafd_url: '',
    matched_name: '',
    reason: 'no_person_links',
  };
}

async function waitForUsablePage(page, timeoutMs) {
  await page.waitForSelector('body', { timeout: timeoutMs });
}

async function runLookup(page, name, timeoutMs, logger) {
  const searchUrl = `https://www.iafd.com/ramesearch.asp?searchtype=comprehensive&searchstring=${encodeURIComponent(
    name
  )}`;

  let currentTimeout = timeoutMs;

  for (let navAttempt = 1; navAttempt <= NAV_RETRIES; navAttempt += 1) {
    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: currentTimeout });
      await waitForUsablePage(page, currentTimeout);

      for (let challengeAttempt = 1; challengeAttempt <= MAX_CHALLENGE_RETRIES; challengeAttempt += 1) {
        const title = await page.title().catch(() => '');
        const bodyText = await page.evaluate(() => document.body?.innerText || '').catch(() => '');
        const combined = `${title}\n${bodyText}`;

        if (!isChallengeText(combined)) {
          const links = await extractPersonLinks(page);
          const picked = chooseResult(name, links);
          return {
            ...picked,
            finalUrl: page.url(),
            title,
            searchUrl,
            links,
          };
        }

        logger.line(
          'WARN',
          `${name} — bot challenge detected (attempt ${challengeAttempt}/${MAX_CHALLENGE_RETRIES}), waiting ${CHALLENGE_WAIT_MS}ms`
        );

        if (challengeAttempt === MAX_CHALLENGE_RETRIES) {
          throw new Error('bot challenge persisted after retries');
        }

        await sleep(CHALLENGE_WAIT_MS);
        await page.reload({ waitUntil: 'domcontentloaded', timeout: currentTimeout });
        await waitForUsablePage(page, currentTimeout);
      }
    } catch (err) {
      const isTimeout = (err && err.name === 'TimeoutError') || /timeout/i.test(String(err && err.message));

      if (isTimeout && navAttempt < NAV_RETRIES) {
        currentTimeout *= 2;
        logger.line(
          'WARN',
          `${name} — timeout after ${Math.floor(currentTimeout / 2)}ms (attempt ${navAttempt}/${NAV_RETRIES}), retrying with ${currentTimeout}ms`
        );
        continue;
      }

      throw err;
    }
  }

  throw new Error('lookup exhausted retries');
}

class Worker {
  constructor(id, options, logger, csvWriter) {
    this.id = id;
    this.options = options;
    this.logger = logger;
    this.csvWriter = csvWriter;
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async init() {
    await this.relaunch();
  }

  async relaunch() {
    await this.close();
    this.browser = await launchBrowser(this.options.headless);
    this.context = await createContext(this.browser);
    this.page = await this.context.newPage();
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });
    this.page.setDefaultTimeout(this.options.timeout);
    this.page.setDefaultNavigationTimeout(this.options.timeout);
    this.logger.line('INFO', `Worker ${this.id} browser launched`);
  }

  async close() {
    if (this.page) {
      await this.page.close().catch(() => {});
      this.page = null;
    }
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }

  async processName(name) {
    const searchedAt = new Date().toISOString();
    this.logger.line('INFO', `Searching: ${name}`);

    const delayMs = jitterDelay(this.options.delay);

    try {
      const lookup = await runLookup(this.page, name, this.options.timeout, this.logger);
      const row = {
        performer: name,
        status: lookup.status,
        iafd_url: lookup.iafd_url,
        matched_name: lookup.matched_name,
        searched_at: searchedAt,
      };

      this.csvWriter.writeRow(row);

      if (lookup.status === 'found') {
        this.logger.line('FOUND', `${name} -> ${lookup.iafd_url}`);
      } else if (lookup.status === 'multiple_matches') {
        this.logger.line(
          'MULTI',
          `${name} — ${lookup.allMatches.length} matches, picked: ${lookup.iafd_url}`
        );
        const preview = lookup.allMatches
          .slice(0, 10)
          .map((x) => `${x.text} => ${x.url}`)
          .join(' | ');
        this.logger.line('INFO', `${name} matches preview: ${preview}`);
      } else if (lookup.status === 'not_found') {
        this.logger.line('NOT_FOUND', `${name} — no results`);
      }

      if (
        this.options.photos &&
        (lookup.status === 'found' || lookup.status === 'multiple_matches') &&
        lookup.iafd_url
      ) {
        try {
          const pgmaDefault = path.resolve(
            __dirname,
            '../Application Support/Plex Media Server/Plug-ins/_PGMA'
          );
          const pgmaPath = this.options.pgmaPath
            ? path.resolve(process.cwd(), this.options.pgmaPath)
            : fs.existsSync(pgmaDefault)
              ? pgmaDefault
              : '';

          const label = lookup.matched_name || name;
          const result = await downloadPerformerPhoto({
            page: this.page,
            context: this.context,
            iafdUrl: lookup.iafd_url,
            matchedName: lookup.matched_name,
            pgmaPath,
            photoKind: this.options.photoKind,
            overwrite: this.options.photoOverwrite,
            timeoutMs: this.options.timeout,
            logger: this.logger,
            label,
          });

          if (!result.saved) {
            this.logger.line('INFO', `${label} — photo not saved (${result.reason})`);
          }
        } catch (photoErr) {
          this.logger.line(
            'ERROR',
            `${name} — photo download failed: ${String(
              photoErr && photoErr.message ? photoErr.message : photoErr
            )}`
          );
        }
      }

      await sleep(delayMs);
      return row;
    } catch (err) {
      const detail = `${err && err.message ? err.message : String(err)}`;
      const title = await this.page.title().catch(() => 'unknown');
      const url = this.page.url ? this.page.url() : 'unknown';

      this.logger.line('ERROR', `${name} — ${detail}; title="${title}"; url="${url}"`);

      if (/(Target page, context or browser has been closed|Browser has been closed|crash|closed)/i.test(detail)) {
        this.logger.line('WARN', `Worker ${this.id} browser issue detected, relaunching`);
        await this.relaunch().catch((relaunchErr) => {
          this.logger.line('ERROR', `Worker ${this.id} relaunch failed: ${String(relaunchErr)}`);
        });
      }

      const row = {
        performer: name,
        status: 'error',
        iafd_url: '',
        matched_name: '',
        searched_at: searchedAt,
      };

      this.csvWriter.writeRow(row);
      await sleep(delayMs);
      return row;
    }
  }
}

async function runPool(items, workerCount, handler) {
  let index = 0;

  async function loop(workerId) {
    while (true) {
      const current = index;
      index += 1;
      if (current >= items.length) return;
      await handler(items[current], workerId, current);
    }
  }

  const workers = [];
  for (let i = 0; i < workerCount; i += 1) {
    workers.push(loop(i));
  }
  await Promise.all(workers);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const inputPath = path.resolve(process.cwd(), options.input);
  const outputPath = path.resolve(process.cwd(), options.output);
  const logPath = path.resolve(process.cwd(), options.log);

  const logger = new Logger(logPath);
  await logger.init();

  const csvWriter = new CsvWriter(outputPath);
  await csvWriter.initHeaderIfNeeded();

  const stats = {
    searched: 0,
    found: 0,
    not_found: 0,
    multiple_matches: 0,
    error: 0,
  };

  const startedAt = new Date();
  logger.line('INFO', `Script start at ${startedAt.toISOString()}`);
  logger.line(
    'INFO',
    `Options: input=${inputPath} output=${outputPath} log=${logPath} concurrency=${options.concurrency} delay=${options.delay} resume=${options.resume} headless=${options.headless} timeout=${options.timeout} photos=${options.photos} photoKind=${options.photoKind} pgma=${options.pgmaPath || '(auto)'} overwrite=${options.photoOverwrite}`
  );

  let performers = await readPerformers(inputPath);

  if (options.resume) {
    const completed = await readCompletedPerformers(outputPath);
    const before = performers.length;
    performers = performers.filter((name) => !completed.has(name));
    const skipped = before - performers.length;
    logger.line('INFO', `Resume mode enabled: skipped ${skipped} already-searched performers`);
  }

  logger.line('INFO', `Loaded ${performers.length} performers to search`);

  if (performers.length === 0) {
    logger.line('INFO', 'No work to do. Exiting.');
    csvWriter.close();
    logger.close();
    return;
  }

  const workerInstances = [];
  for (let i = 0; i < options.concurrency; i += 1) {
    const worker = new Worker(i + 1, options, logger, csvWriter);
    await worker.init();
    workerInstances.push(worker);
  }

  try {
    await runPool(performers, workerInstances.length, async (name, workerIndex, idx) => {
      const worker = workerInstances[workerIndex];
      const row = await worker.processName(name);
      stats.searched += 1;
      if (row.status === 'found') stats.found += 1;
      else if (row.status === 'not_found') stats.not_found += 1;
      else if (row.status === 'multiple_matches') stats.multiple_matches += 1;
      else stats.error += 1;

      if (stats.searched % PROGRESS_EVERY === 0 || stats.searched === performers.length) {
        const pct = ((stats.searched / performers.length) * 100).toFixed(1);
        logger.line(
          'PROGRESS',
          `${stats.searched}/${performers.length} (${pct}%) — ${stats.found} found, ${stats.not_found} not found, ${stats.error} errors, ${stats.multiple_matches} multiple`
        );
      }

      if ((idx + 1) % 1000 === 0) {
        logger.line('INFO', `Checkpoint reached at index ${idx + 1}`);
      }
    });
  } finally {
    await Promise.all(workerInstances.map((w) => w.close()));
    csvWriter.close();

    const endedAt = new Date();
    const elapsedSec = ((endedAt.getTime() - startedAt.getTime()) / 1000).toFixed(1);

    logger.line('INFO', `Script stop at ${endedAt.toISOString()} (elapsed ${elapsedSec}s)`);
    logger.line(
      'INFO',
      `Totals: searched=${stats.searched} found=${stats.found} not_found=${stats.not_found} multiple_matches=${stats.multiple_matches} errors=${stats.error}`
    );

    logger.close();
  }
}

main().catch((err) => {
  const message = err && err.stack ? err.stack : String(err);
  console.error(message);
  process.exitCode = 1;
});
