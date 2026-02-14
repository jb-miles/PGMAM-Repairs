# Linux Workflow Harness

Runs the full workflow on Linux:

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
node linux/harness.js
```

## Plex Support Directory Auto-Detect

The harness tries these in order and will prompt if none exist:

- `$PLEX_MEDIA_SERVER_APPLICATION_SUPPORT_DIR` (if set)
- `~/.config/Plex Media Server`
- `~/.local/share/Plex Media Server`
- `/var/lib/plexmediaserver/Library/Application Support/Plex Media Server`
- `/var/snap/plexmediaserver/common/Library/Application Support/Plex Media Server`

## Outputs

- `common/plex-export/actors.csv`
- `common/plex-export/plex-actors-state.json`
- `common/iafd-lookup/plex-actors.txt`
- `common/iafd-lookup/iafd-from-plex.csv`
- `common/iafd-lookup/iafd-from-plex.log`

