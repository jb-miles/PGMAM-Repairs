#!/usr/bin/env node
/*
  Plex Actors Export (Movies)

  Uses Plex Media Server API to enumerate Movies, fetch cast (Role tags),
  and export a deduped actor list with counts.

  Node: v20+
  Deps: none (uses global fetch)
*/

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const DEFAULTS = {
  base: 'http://localhost:32400',
  output: 'actors.csv',
  state: 'plex-actors-state.json',
  pageSize: 200,
  concurrency: 4,
  resume: true,
  withCounts: false,
  sectionId: null,
  sectionName: null,
  timeout: 30000,
};

function parseArgs(argv) {
  const opts = { ...DEFAULTS, token: null };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--base') opts.base = argv[++i];
    else if (arg === '--token') opts.token = argv[++i];
    else if (arg === '--output') opts.output = argv[++i];
    else if (arg === '--state') opts.state = argv[++i];
    else if (arg === '--page-size') opts.pageSize = Number(argv[++i]);
    else if (arg === '--concurrency') opts.concurrency = Number(argv[++i]);
    else if (arg === '--no-resume') opts.resume = false;
    else if (arg === '--with-counts') opts.withCounts = true;
    else if (arg === '--section-id') opts.sectionId = Number(argv[++i]);
    else if (arg === '--section-name') opts.sectionName = argv[++i];
    else if (arg === '--timeout') opts.timeout = Number(argv[++i]);
    else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!opts.token) {
    throw new Error(
      'Missing --token. Get it from Plex Web (Settings -> Account -> show token) or from the web app URL/network requests.'
    );
  }

  if (!Number.isInteger(opts.pageSize) || opts.pageSize < 1 || opts.pageSize > 500) {
    throw new Error('--page-size must be an integer between 1 and 500');
  }
  if (!Number.isInteger(opts.concurrency) || opts.concurrency < 1 || opts.concurrency > 16) {
    throw new Error('--concurrency must be an integer between 1 and 16');
  }
  if (!Number.isFinite(opts.timeout) || opts.timeout < 1000) {
    throw new Error('--timeout must be >= 1000');
  }

  opts.base = opts.base.replace(/\/$/, '');

  return opts;
}

function printHelp() {
  console.log(`Usage:
  node plex-export-actors.js --token PLEX_TOKEN [options]

Options:
  --base http://localhost:32400      Plex base URL (default: ${DEFAULTS.base})
  --token PLEX_TOKEN                Required. Plex auth token.
  --output actors.csv               Output CSV path (default: ${DEFAULTS.output})
  --state plex-actors-state.json    Resume state file (default: ${DEFAULTS.state})
  --page-size 200                   Section paging size (default: ${DEFAULTS.pageSize})
  --concurrency 4                   Concurrent metadata fetches (default: ${DEFAULTS.concurrency})
  --no-resume                       Ignore existing state and start fresh
  --with-counts                     Output actor counts as a second CSV column
  --section-id 1                    Movies library section id (optional)
  --section-name "Movies"            Movies library section name/title (optional)
  --timeout 30000                   Request timeout in ms (default: ${DEFAULTS.timeout})
  --help, -h                        Show help

Output CSV columns:
  actor${DEFAULTS.withCounts ? ',count' : ''}
`);
}

function csvEscape(value) {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (/[,"\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function nowIso() {
  return new Date().toISOString();
}

async function fetchJson(url, { timeoutMs, headers }) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      const snippet = text.slice(0, 300).replace(/\s+/g, ' ');
      throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}; body: ${snippet}`);
    }

    try {
      return JSON.parse(text);
    } catch {
      const snippet = text.slice(0, 300).replace(/\s+/g, ' ');
      throw new Error(
        `Non-JSON response from Plex. Ensure 'Accept: application/json' works for your server. Body: ${snippet}`
      );
    }
  } finally {
    clearTimeout(t);
  }
}

async function loadState(statePath) {
  if (!fs.existsSync(statePath)) {
    return { processed: {}, actorCounts: {}, updatedAt: null };
  }

  const raw = await fsp.readFile(statePath, 'utf8');
  const parsed = JSON.parse(raw);
  return {
    processed: parsed.processed || {},
    actorCounts: parsed.actorCounts || {},
    updatedAt: parsed.updatedAt || null,
  };
}

async function saveStateAtomic(statePath, state) {
  const dir = path.dirname(statePath);
  await fsp.mkdir(dir, { recursive: true });

  const tmp = `${statePath}.tmp`;
  const payload = JSON.stringify({
    processed: state.processed,
    actorCounts: state.actorCounts,
    updatedAt: nowIso(),
  });

  await fsp.writeFile(tmp, payload);
  await fsp.rename(tmp, statePath);
}

function pickMoviesSection(sections, sectionId, sectionName) {
  const list = (sections && sections.MediaContainer && sections.MediaContainer.Directory) || [];

  if (sectionId) {
    const found = list.find((d) => Number(d.key) === Number(sectionId));
    if (!found) throw new Error(`No library section found with id=${sectionId}`);
    return found;
  }

  if (sectionName) {
    const found = list.find((d) => (d.title || '').toLowerCase() === sectionName.toLowerCase());
    if (!found) throw new Error(`No library section found with title=${sectionName}`);
    return found;
  }

  // Default: first section of type movie
  const movie = list.find((d) => String(d.type).toLowerCase() === 'movie');
  if (!movie) {
    const titles = list.map((d) => `${d.title}(${d.type})`).join(', ');
    throw new Error(`No movie section found. Available sections: ${titles}`);
  }
  return movie;
}

async function listAllMovies({ base, token, sectionKey, pageSize, timeoutMs }) {
  const headers = { Accept: 'application/json' };
  const movies = [];
  let start = 0;
  let total = null;

  while (true) {
    const url =
      `${base}/library/sections/${encodeURIComponent(sectionKey)}/all` +
      `?type=1&X-Plex-Container-Start=${start}&X-Plex-Container-Size=${pageSize}` +
      `&X-Plex-Token=${encodeURIComponent(token)}`;

    const data = await fetchJson(url, { timeoutMs, headers });
    const container = data.MediaContainer || {};
    const batch = container.Metadata || [];

    if (total === null) total = Number(container.totalSize || batch.length || 0);

    for (const item of batch) {
      if (!item || !item.ratingKey) continue;
      movies.push({ ratingKey: String(item.ratingKey), title: String(item.title || '') });
    }

    start += batch.length;
    if (batch.length === 0) break;
    if (start >= total) break;
  }

  return movies;
}

async function fetchMovieCast({ base, token, ratingKey, timeoutMs }) {
  const headers = { Accept: 'application/json' };
  const url = `${base}/library/metadata/${encodeURIComponent(ratingKey)}?X-Plex-Token=${encodeURIComponent(token)}`;
  const data = await fetchJson(url, { timeoutMs, headers });
  const md = data.MediaContainer && data.MediaContainer.Metadata && data.MediaContainer.Metadata[0];
  const roles = (md && md.Role) || [];

  const out = [];
  for (const r of roles) {
    const tag = r && r.tag ? String(r.tag).trim() : '';
    if (tag) out.push(tag);
  }
  return out;
}

async function runPool(items, concurrency, workerFn) {
  let idx = 0;

  async function worker(workerId) {
    while (true) {
      const i = idx;
      idx += 1;
      if (i >= items.length) return;
      await workerFn(items[i], i, workerId);
    }
  }

  const all = [];
  for (let i = 0; i < concurrency; i += 1) all.push(worker(i));
  await Promise.all(all);
}

async function writeActorsCsv(outputPath, actorCounts, withCounts) {
  const rows = Object.entries(actorCounts).map(([actor, count]) => ({ actor, count }));
  rows.sort((a, b) => {
    if (withCounts && b.count !== a.count) return b.count - a.count;
    return a.actor.localeCompare(b.actor);
  });

  const dir = path.dirname(outputPath);
  await fsp.mkdir(dir, { recursive: true });

  const tmp = `${outputPath}.tmp`;
  const lines = [withCounts ? 'actor,count' : 'actor'];
  for (const r of rows) {
    if (withCounts) lines.push(`${csvEscape(r.actor)},${csvEscape(r.count)}`);
    else lines.push(`${csvEscape(r.actor)}`);
  }
  await fsp.writeFile(tmp, `${lines.join('\n')}\n`);
  await fsp.rename(tmp, outputPath);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  const outputPath = path.resolve(process.cwd(), opts.output);
  const statePath = path.resolve(process.cwd(), opts.state);

  const state = opts.resume ? await loadState(statePath) : { processed: {}, actorCounts: {}, updatedAt: null };

  console.log(`[${nowIso()}] Base: ${opts.base}`);
  console.log(`[${nowIso()}] Output: ${outputPath}`);
  console.log(`[${nowIso()}] State: ${statePath} (resume=${opts.resume})`);

  const sectionsUrl = `${opts.base}/library/sections?X-Plex-Token=${encodeURIComponent(opts.token)}`;
  const sections = await fetchJson(sectionsUrl, { timeoutMs: opts.timeout, headers: { Accept: 'application/json' } });
  const section = pickMoviesSection(sections, opts.sectionId, opts.sectionName);

  console.log(`[${nowIso()}] Using section: ${section.title} (id=${section.key}, type=${section.type})`);

  const movies = await listAllMovies({
    base: opts.base,
    token: opts.token,
    sectionKey: section.key,
    pageSize: opts.pageSize,
    timeoutMs: opts.timeout,
  });

  console.log(`[${nowIso()}] Movies found: ${movies.length}`);

  let processedNow = 0;
  let skipped = 0;
  let errors = 0;
  const startedAt = Date.now();

  const saveEvery = 50;

  await runPool(movies, opts.concurrency, async (movie, i) => {
    if (state.processed[movie.ratingKey]) {
      skipped += 1;
      return;
    }

    try {
      const cast = await fetchMovieCast({
        base: opts.base,
        token: opts.token,
        ratingKey: movie.ratingKey,
        timeoutMs: opts.timeout,
      });

      for (const actor of cast) {
        state.actorCounts[actor] = (state.actorCounts[actor] || 0) + 1;
      }

      state.processed[movie.ratingKey] = true;
      processedNow += 1;

      const done = Object.keys(state.processed).length;
      if ((processedNow % 10 === 0) || done === movies.length) {
        const pct = ((done / movies.length) * 100).toFixed(1);
        console.log(
          `[${nowIso()}] Progress: ${done}/${movies.length} (${pct}%) processedNow=${processedNow} skipped=${skipped} errors=${errors}`
        );
      }

      if (processedNow % saveEvery === 0) {
        await saveStateAtomic(statePath, state);
      }
    } catch (e) {
      errors += 1;
      state.processed[movie.ratingKey] = true; // don't get stuck on a bad item
      console.log(`[${nowIso()}] ERROR ratingKey=${movie.ratingKey} title="${movie.title}": ${String(e.message || e)}`);
    }

    // Cheap pacing so we don't hammer PMS too hard.
    if ((i + 1) % 5 === 0) {
      await new Promise((r) => setTimeout(r, 25));
    }
  });

  await saveStateAtomic(statePath, state);
  await writeActorsCsv(outputPath, state.actorCounts, opts.withCounts);

  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`[${nowIso()}] Done in ${elapsedSec}s. Actors: ${Object.keys(state.actorCounts).length}`);
  console.log(`[${nowIso()}] Wrote: ${outputPath}`);
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exitCode = 1;
});
