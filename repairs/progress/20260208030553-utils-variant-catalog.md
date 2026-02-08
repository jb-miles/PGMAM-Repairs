# Utils Variant Catalog (2026-02-08 03:05:53)

## Scope
Compared all bundle code-directory files matching `*.bundle/Contents/Code/utils.py`.

Total files: 21  
Distinct variants (by SHA-256): 5

## Variant Map

### Variant 1 (baseline)
- Hash: `284e437ce04c64ae8cf459de802d91bd19ea0b07c25ba146b32f7002751061c4`
- Bundles:
  - `AVEntertainments.bundle`
  - `BestExclusivePorn.bundle`
  - `CDUniverse.bundle`
  - `Fagalicious.bundle`
  - `GEVIScenes.bundle`
  - `GayEmpire.bundle`
  - `GayWorld.bundle`
  - `HFGPM.bundle`
  - `HomoActive.bundle`
  - `IAFD.bundle`
  - `QueerClick.bundle`
  - `WayBig.bundle`
  - `WolffVideo.bundle`

### Variant 2
- Hash: `b62ecec9665a744b243ab976def4e982c7ca7d61aa38068e3da0eda5480d70c7`
- Bundles:
  - `AEBN.bundle`
  - `GayFetishandBDSM.bundle`
  - `GayHotMovies.bundle`
  - `GayMovie.bundle`
  - `GayRado.bundle`

### Variant 3
- Hash: `2b079f807620c4859dc26369808cf61165f8ec9647542e3e57e5f1eac9a9d185`
- Bundle:
  - `SimplyAdult.bundle`

### Variant 4
- Hash: `6f7d39c7cdf28cfe5d252a1705236ff161fc6da42036001e59f5f1e9ac8fc027`
- Bundle:
  - `AdultFilmDatabase.bundle`

### Variant 5
- Hash: `dc6c4efceccfe65faf08ea97e8ca7c478b09d191b1e988312a9f30b341bcbb5e`
- Bundle:
  - `GEVI.bundle`

## Difference Catalog

Reference baseline used for comparison: `AVEntertainments.bundle/Contents/Code/utils.py`.

### Variant 2 vs Variant 1
Files inspected:
- `AVEntertainments.bundle/Contents/Code/utils.py:6571`
- `AEBN.bundle/Contents/Code/utils.py:6571`

Difference:
- `matchTitle()` in Variant 2 adds substring fallback logic before episode matching:
  - `AEBN.bundle/Contents/Code/utils.py:6589`
  - `AEBN.bundle/Contents/Code/utils.py:6596`

Behavioral impact:
- If strict normalized-title comparison fails, Variant 2 can still pass when `NormaliseTitle` or `NormaliseShortTitle` appears as a substring in normalized site title.
- This increases recall (fewer false negatives) for title matching on these 5 bundles.

Likely intent:
- Targeted fix for title mismatch edge-cases in these specific agents.

Confidence: High.

---

### Variant 3 (SimplyAdult) vs Variant 1
Files inspected:
- `SimplyAdult.bundle/Contents/Code/utils.py:7823`
- `AVEntertainments.bundle/Contents/Code/utils.py:7823`

Differences:
1. Comment/version note differs at top-of-file metadata comment.
2. `setupAgentVariables()` switches library metadata lookup from `JSON.ObjectFromURL(...)` to session request + `.json()`:
   - `SimplyAdult.bundle/Contents/Code/utils.py:7824`
   - `SimplyAdult.bundle/Contents/Code/utils.py:7826`

Behavioral impact:
- Reuses `requests.Session()` (`pgmaSSN`) for metadata fetch path.
- May improve consistency with token/session behavior and avoid framework JSON helper edge cases.
- Fallback parsing of exception string remains present.

Likely intent:
- Harden local Plex metadata retrieval using existing authenticated session flow.

Confidence: Medium-High.

---

### Variant 4 (AdultFilmDatabase) vs Variant 1
Files inspected:
- `AdultFilmDatabase.bundle/Contents/Code/utils.py:7823`
- `AVEntertainments.bundle/Contents/Code/utils.py:7823`

Differences:
1. Comment/version note differs at top-of-file metadata comment.
2. `setupAgentVariables()` changes metadata parse strategy from JSON to XML parsing:
   - `AdultFilmDatabase.bundle/Contents/Code/utils.py:7825`
   - `AdultFilmDatabase.bundle/Contents/Code/utils.py:7828`
3. Exception-message fallback parsing block is removed for this path:
   - block absent where baseline has fallback parsing around `AVEntertainments...:7836`.

Behavioral impact:
- Reads `librarySectionID` and `librarySectionTitle` from XML attributes instead of JSON.
- Reduces dependency on JSON endpoint shape but introduces string-split parsing of XML text.
- Loses fallback extraction from error message.

Likely intent:
- Work around JSON endpoint/response mismatch for this bundle by taking XML path.

Confidence: Medium.

---

### Variant 5 (GEVI) vs Variant 1
Files inspected:
- `GEVI.bundle/Contents/Code/utils.py:3806`
- `AVEntertainments.bundle/Contents/Code/utils.py:3806`

Differences (all in `getSiteInfoGEVI()` date-range normalization logic):
- `GEVI.bundle/Contents/Code/utils.py:3807`
- `GEVI.bundle/Contents/Code/utils.py:3809`
- `GEVI.bundle/Contents/Code/utils.py:3811`

Behavioral impact:
- Variant 1 uses incorrect variables/indexing in date-range branches (`item[...]` on string and `item.split('-')` repeatedly), which can produce wrong years.
- GEVI variant uses correct `items[0]`/`items[1]` handling after `split('-')`.
- GEVI variant is functionally safer and more correct for ranges like `1995-7`, `1995-97`, `1995-1997`.

Likely intent:
- Explicit bug fix for GEVI production-year parsing.

Confidence: High.

## Summary
- The 5 variants are real and mostly small in scope.
- Variant 2 and Variant 5 contain clear functional fixes that should not be discarded.
- Variant 3 and Variant 4 are alternative implementations of Plex library metadata retrieval in `setupAgentVariables()`.
- No evidence that differences are random drift; they look like targeted fixes/workarounds.

## Recommended Next Step
Before any global unification, build a merged superset variant that includes:
- Variant 2 title substring fallback.
- Variant 5 GEVI date-range parsing correction.
- A single robust `setupAgentVariables()` strategy chosen after testing JSON-session vs XML parse behavior against current Plex runtime.
