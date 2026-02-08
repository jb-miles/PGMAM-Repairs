# Changelog Since `a6ca7a6`

Base reference: last commit on current branch (`a6ca7a6`)  
Scope: current working tree (tracked modifications + newly added untracked artifacts)

## Summary
- 23 tracked files modified.
- 6 untracked files added.
- Net tracked diff: 848 insertions, 366 deletions.
- Includes earlier live-log aggregation + patch pass from 2026-02-06 21:36 that was previously omitted in this changelog draft.

## Earlier Session Work (Now Included)

### Live log aggregation run (2026-02-06 21:36)
- Aggregator executed against live Plex log directory.
- Output report generated:
  - `repairs/progress/consolidated_plex_logs_20260206_213635.txt`
- Run plan/status recorded:
  - `repairs/progress/202602062136-live-log-patch-plan.md`
- Project workflow state updated:
  - `state.md`

### Initial patch set from that run
Applied first to all bundle `utils.py` files and `_PGMA/Scripts/utils.py`, then later reworked during unification:
- Fixed GayHotMovies collections parser to avoid crash on missing `Series:` and parse collection tokens correctly.
- Hardened AEBN-style synopsis extraction to avoid brittle direct `[0]` indexing.
- Hardened release-date extraction to avoid brittle direct `[0]` indexing.
- Added guard in `updateMetadata` so missing release dates do not fail `originally_available_at` assignment.

### Current status of those fixes
- `_PGMA/Scripts/utils.py` still contains that hardening patch set.
- Bundle `utils.py` files are now unified and include those protections as part of a larger merged variant file.

## Changed

### Unified `utils.py` across all bundle code directories
- Modified: all 21 bundle files at `*.bundle/Contents/Code/utils.py`.
- Result: all bundle `utils.py` files are now identical.
- Functional merges included in unified file:
  - GEVI date-range parsing correction in `getSiteInfoGEVI`.
  - Title substring fallback path in `matchTitle`.
  - More robust library metadata acquisition in `setupAgentVariables`:
    - session JSON request first,
    - XML fallback,
    - error-message fallback retained.

### Source script hardening in `_PGMA`
- Modified: `_PGMA/Scripts/utils.py`.
- Changes include:
  - safer synopsis extraction via `//text()` aggregation,
  - safer release-date extraction without direct `[0]` assumptions,
  - safer collections parsing in `getSiteInfoGayHotMovies`,
  - guard around originally-available-date assignment when release date is missing.

### Workflow state update
- Modified: `state.md`.
- Updates include:
  - phase moved to `implementation`,
  - last live log scan path updated to `repairs/progress/consolidated_plex_logs_20260206_213635.txt`,
  - decision/action/next-step metadata refreshed,
  - checklist item added for live log aggregation and shared parser hardening.

## Added (Untracked)
- `consolidated_plex_logs_20260206_073809.txt`
- `repairs/progress/consolidated_plex_logs_20260206_213635.txt`
- `repairs/progress/202602062136-live-log-patch-plan.md`
- `repairs/progress/202602062145-utils-variant-catalog-plan.md`
- `repairs/progress/20260208030553-utils-variant-catalog.md`
- `repairs/progress/202602080315-unified-utils-merge-plan.md`

## Notes
- This changelog is relative to repository commit `a6ca7a6` and reflects the current uncommitted workspace state.
