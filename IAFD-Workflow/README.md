# IAFD Workflow (Plex -> Actors -> IAFD -> Photos -> PGMA)

This is a self-contained workflow runner intended to live under Plex `Plug-ins`.

## What It Does

1. Export unique actor names from a Plex **Movies** library (Plex API)
2. Look up each actor on IAFD (Playwright; headed Chromium by default)
3. Download performer headshots and save them into PGMA:
   - `_PGMA/Cast/Poster`
   - `_PGMA/Cast/Face`

## Layout

- `common/`
  - `plex-export/` Plex API actor exporter
  - `iafd-lookup/` Playwright IAFD lookup + photo downloader
- `windows/` Windows harness + runbook
- `macos/` macOS harness + runbook
- `linux/` Linux harness + runbook

## Run

Windows:

```bat
node windows\harness.js
```

macOS:

```bash
node macos/harness.js
```

Linux:

```bash
node linux/harness.js
```

Each harness will prompt for:

- Plex base URL (default `http://localhost:32400`)
- Plex token (`X-Plex-Token`) (input is masked)
- Which **Movies** library section id to export from
- Plex support directory (auto-detected when possible)
- `_PGMA` directory (auto-detected when possible)
- Photo kind: `poster|face|both` (default `both`)
- Overwrite existing image files: `y/n` (default `n`)

## Outputs

- `common/plex-export/actors.csv`
- `common/plex-export/plex-actors-state.json`
- `common/iafd-lookup/plex-actors.txt`
- `common/iafd-lookup/iafd-from-plex.csv`
- `common/iafd-lookup/iafd-from-plex.log`

Images are written into the selected `_PGMA` folder.
