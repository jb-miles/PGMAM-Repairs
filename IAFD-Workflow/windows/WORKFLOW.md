# Windows Workflow Harness

This repo includes an interactive harness to run the full workflow on Windows:

1. Export unique actor names from a Plex **Movies** library (Plex API)
2. Look up each actor on IAFD (Playwright, headed Chromium for bot protection)
3. Download performer headshots and save them into PGMA `_PGMA` Cast folders

## Prereqs

- Node.js v20+
- npm available on PATH
- Plex Media Server running locally or reachable over LAN

## Run

From the `IAFD-Workflow` folder:

```bat
node windows\\harness.js
```

The harness will prompt you for:

- Plex base URL (default `http://localhost:32400`)
- Plex token (`X-Plex-Token`)
- Which **Movies** library section to export from (if you have multiple)
- Plex support directory location (auto-detected on Windows when possible)
- `_PGMA` folder location (auto-detected from support dir when possible)
- Which photo folder(s) to write (`poster`, `face`, or `both` (default))
- Whether to overwrite existing image files (default: no)

## Outputs

- Plex actor export: `common/plex-export/actors.csv`
- IAFD lookup results: `common/iafd-lookup/iafd-from-plex.csv`
- IAFD lookup log: `common/iafd-lookup/iafd-from-plex.log`
- Downloaded performer images:
  - `_PGMA/Cast/Poster/*` and/or `_PGMA/Cast/Face/*` depending on your prompt choice

## Resume / Re-runs

- Plex export uses `plex-export/plex-actors-state.json`
- IAFD lookup uses `--resume` on `iafd-lookup/iafd-from-plex.csv`

Re-running `node windows\\harness.js` will generally pick up where it left off.

## Photo Behavior

- `both` is recommended: it writes the same downloaded headshot into both:
  - `_PGMA\\Cast\\Poster`
  - `_PGMA\\Cast\\Face`
- If you choose not to overwrite, existing files are skipped.
