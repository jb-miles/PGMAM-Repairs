# Utils Variant Catalog Plan (2026-02-06 21:45)

## Objective
Catalog the exact differences across all `*.bundle/Contents/Code/utils.py` variants and explain what each difference likely does.

## Phase Plan

### Phase 1 - Variant inventory
- What: Group all bundle `utils.py` files by hash.
- Why: Confirms the true number of variants and which bundles belong to each.
- Correct output: A complete bundle-to-variant mapping.

### Phase 2 - Structural diff extraction
- What: Diff representative files for each variant against a common baseline variant.
- Why: Isolates real code differences without re-reading 21 full files manually.
- Correct output: Hunk-level list of changed functions/blocks per variant.

### Phase 3 - Behavioral interpretation
- What: Explain each difference in terms of runtime behavior and likely intent.
- Why: Determines whether differences are intentional specialization or drift.
- Correct output: Clear explanation with confidence level and risk notes.

### Phase 4 - Consolidated catalog report
- What: Produce a concise catalog file with mappings, diffs, and recommendations.
- Why: Gives a reusable artifact for future normalization work.
- Correct output: A markdown report suitable for deciding merge/sync strategy.

## Status Tracker
- [x] Phase 1 started
- [x] Phase 2 started
- [x] Phase 3 started
- [x] Phase 4 started

## Outputs
- Variant catalog report: `repairs/progress/20260208030553-utils-variant-catalog.md`
- Variant inventory confirms 5 distinct `utils.py` hashes across 21 bundles.
- Function-level diff analysis completed for all non-baseline variants.
