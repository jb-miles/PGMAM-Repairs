# macOS Workflow Harness

Runs the full workflow on macOS:

1. Export unique actor names from a Plex **Movies** library (Plex API)
2. Look up each actor on IAFD (Playwright; headed Chromium by default)
3. Download performer headshots into PGMA `_PGMA` folders:
   - `_PGMA/Cast/Poster`
   - `_PGMA/Cast/Face`

## Prereqs

- Node.js v20+
- npm on PATH
- Plex Media Server reachable (default `http://localhost:32400`)

## Run

From the `IAFD-Workflow` folder:

```bash
node macos/harness.js
```

The harness will prompt you for:

- Plex base URL
- Plex token (`X-Plex-Token`)
- Which **Movies** library section id to export from
- Plex support directory (auto-detected as `~/Library/Application Support/Plex Media Server` when possible)
- `_PGMA` directory (auto-detected as `<PlexSupport>/Plug-ins/_PGMA` when possible)
- Photo kind: `poster|face|both` (default `both`)
- Overwrite existing image files: `y/n` (default `n`)

## Outputs

- `common/plex-export/actors.csv`
- `common/plex-export/plex-actors-state.json`
- `common/iafd-lookup/plex-actors.txt`
- `common/iafd-lookup/iafd-from-plex.csv`
- `common/iafd-lookup/iafd-from-plex.log`

