# Unified Utils Merge Plan (2026-02-08 03:15)

## Objective
Merge all meaningful changes from the 5 existing `utils.py` variants into one unified file, then sync that file across all bundle code directories.

## Phase Plan

### Phase 1 - Merge design
- What: Combine unique variant behaviors into one implementation.
- Why: Preserve all intentional fixes while eliminating drift.
- Correct output: A canonical `utils.py` containing all variant-specific functional improvements.

### Phase 2 - Implementation in canonical file
- What: Patch one canonical `utils.py` with merged logic.
- Why: Create a single source of truth before replication.
- Correct output: Canonical file updated with title fallback, GEVI date fix, and robust metadata fetch logic.

### Phase 3 - Replication and consistency
- What: Copy canonical file to all `*.bundle/Contents/Code/utils.py`.
- Why: Enforce project requirement that code-directory `utils.py` files are identical.
- Correct output: One hash across all bundle `utils.py` files.

### Phase 4 - Verification
- What: Run static checks (hash check + targeted grep + syntax sanity).
- Why: Confirm merged behavior is present and no propagation errors occurred.
- Correct output: Verified uniformity plus expected merged code markers.

## Status Tracker
- [x] Phase 1 started
- [x] Phase 2 started
- [x] Phase 3 started
- [x] Phase 4 started

## Outputs
- Canonical merged file: `AVEntertainments.bundle/Contents/Code/utils.py`
- Synced targets: all `*.bundle/Contents/Code/utils.py` (21 files)
- Uniformity verification: `unique_hashes = 1`
- Unified hash: `25743861e61bc92fefcc2d6f6d94db698db63d9acaa37404b60ef3f1743ee56b`

## Merged Variant Behaviors Included
- Variant 2: title substring fallback in `matchTitle()` (`Passed (Substring)` path).
- Variant 3: session-based JSON metadata fetch in `setupAgentVariables()`.
- Variant 4: XML metadata fallback path in `setupAgentVariables()`.
- Variant 5: corrected GEVI date-range normalization logic in `getSiteInfoGEVI()`.
