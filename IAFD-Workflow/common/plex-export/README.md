# Plex Export Actors (Movies)

Exports a deduped actor list (with counts) from your local Plex Movies library using the Plex API.

## Run

```bash
node plex-export-actors.js --token PLEX_TOKEN
```

Common options:

```bash
node plex-export-actors.js \
  --base http://localhost:32400 \
  --token PLEX_TOKEN \
  --output actors.csv \
  --state plex-actors-state.json \
  --concurrency 4
```

If you have multiple movie libraries:

```bash
node plex-export-actors.js --token PLEX_TOKEN --section-name "Movies"
# or
node plex-export-actors.js --token PLEX_TOKEN --section-id 1
```

## Output

`actors.csv` columns (default):

- `actor`

To include counts (number of movies they appear in):

```bash
node plex-export-actors.js --token PLEX_TOKEN --with-counts
```

## Resume

By default, the script resumes from `plex-actors-state.json` and will skip already processed movie items.
Disable with `--no-resume`.
