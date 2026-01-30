# PGMA Modernization Strategy - Quick Reference Card

**Print This or Pin for Easy Reference**

---

## The 5 Phases

```
┌──────────────┬─────────────────────────────────────────┬──────────┐
│ Phase        │ What                                    │ Duration │
├──────────────┼─────────────────────────────────────────┼──────────┤
│ 1 (REMOVE)   │ Remove IAFD → Create framework          │ Week 1   │
│              │ TEST SUBJECT: GayWorld                  │          │
├──────────────┼─────────────────────────────────────────┼──────────┤
│ 2 (FIX)      │ Fix GayWorld scrapers                   │ Week 1-2 │
│              │ Target: 30-50% success rate             │          │
├──────────────┼─────────────────────────────────────────┼──────────┤
│ 3 (ENRICH)   │ Implement enrichment providers          │ Week 2   │
│              │ PRIMARY: GEVI, SECONDARY: WayBig        │          │
├──────────────┼─────────────────────────────────────────┼──────────┤
│ 4 (SCALE)    │ Fix all 22 agents like GayWorld        │ Week 2-4 │
│              │ Target: 30-50% success rate across all  │          │
├──────────────┼─────────────────────────────────────────┼──────────┤
│ 5 (UNIFY)    │ Consolidate into single framework       │ Week 1-4 │
│              │ (Parallel with phases 2-4)              │          │
└──────────────┴─────────────────────────────────────────┴──────────┘
```

---

## Provider Hierarchy (Most Important)

```
When enriching:
1. Try GEVI (98% availability, best data)
   ├─ Performer names: 95%
   ├─ Performer photos: 90%
   ├─ Physical attributes: 95% ⭐ (ONLY GEVI HAS)
   ├─ Movie data: 90% ⭐ (ONLY GEVI HAS)
   └─ Director info: 85%

2. If GEVI fails, try WayBig (95% availability)
   ├─ Performer names: 85%
   ├─ Performer photos: 80%
   └─ Scene info: 85%

3. If WayBig fails, try AEBN (90% availability)
   └─ General performer data

4. If all fail, use Plex Cache (last resort)
   └─ Whatever Plex found locally
```

---

## Key Numbers

| Metric | Before | After | Why |
|--------|--------|-------|-----|
| Success Rate | 2-5% | 30-50% | Fixed scrapers |
| Cast Info | 0% | 95% | GEVI enrichment |
| Director Info | 0% | 85% | GEVI extracts from movies |
| Movie Data | 0% | 90% | GEVI provides it |
| Code Duplication | 9.46MB | 2MB | Unified framework |
| IAFD Dependency | 1 (broken) | 0 (GEVI replaces) | Eliminated |

---

## Three Critical Decisions

### 1️⃣ GEVI is Primary (Not WayBig)
```
WayBig:  Performer data only (85%)
GEVI:    Performer + movie + director (95%)

Decision: Use GEVI as primary source
Fallback: WayBig for diversity and scenes
Result:   3-4x more data than WayBig alone
```

### 2️⃣ GayWorld is Phase 1 Test
```
Why: Heavy IAFD user (78 references)
     High activity (easy to measure)
     Best canary for framework validation

Implementation:
├─ Phase 1: Migrate to framework
├─ Phase 2: Fix scrapers
└─ Phase 3: Add enrichment
```

### 3️⃣ Multi-Provider Strategy (No Single Point of Failure)
```
Old:     IAFD → Broke → Everything broke
New:     GEVI → Fails → WayBig → AEBN → Plex

Result: If anything fails, system degrades gracefully
```

---

## What Changed Since Initial Strategy

```
BEFORE (Initial Plan):
├─ Phase 3: Integrate WayBig (primary)
├─ Provider hierarchy: WayBig → AEBN → Plex
├─ Movie enrichment: None (WayBig lacks it)
└─ Coverage: ~80% of IAFD value

AFTER (Updated Plan):
├─ Phase 3: Implement enrichment provider system
├─ Provider hierarchy: GEVI → WayBig → AEBN → Plex
├─ Movie enrichment: 90% (GEVI provides duration, date, director, synopsis)
└─ Coverage: ~120% of IAFD value (better than original!)
```

---

## Phase 1: Remove & Framework

**What GayWorld Does During Phase 1:**
1. Migrates to DataProvider framework (first agent)
2. Validates framework works with real agent
3. Tests provider registry logging
4. Serves as reference for other 21 agents

**After Phase 1:**
- All 22 agents on framework ✓
- No direct IAFD calls ✓
- Provider logging working ✓
- Ready for Phase 2 (scraper fixes) ✓

---

## Phase 2: Fix GayWorld

**What We're Fixing:**
- Website structure changed (HTML/CSS updated)
- Old CSS selectors no longer match
- Extraction fails even though search works

**How We Fix It:**
1. Analyze gay-world.org current HTML
2. Update CSS selectors to match new layout
3. Add error handling for edge cases
4. Test on 20 real films
5. Measure: Title/director/cast extraction success

**After Phase 2:**
- GayWorld at 30-50% success (vs 2-5%) ✓
- Approach validated for other agents ✓
- Foundation for Phase 3 enrichment ✓

---

## Phase 3: Enrichment Providers

**GEVIProvider Features:**
```python
performer = {
    "name": "Name",
    "photo": "URL",
    "hair_color": "Blonde",        # ← GEVI only
    "eye_color": "Blue",           # ← GEVI only
    "height": "180cm",             # ← GEVI only
    "penis_length": "18cm",        # ← GEVI only
    "weight": "75kg",              # ← GEVI only
    "tattoos": "Description",      # ← GEVI only
    "ethnicity": "Caucasian",      # ← GEVI only
    "birthdate": "1985-01-01",     # ← GEVI only
    "aliases": "John, JD",         # ← GEVI has better aliases
    "bio": "Full biography",
}

movie = {
    "title": "Film Title",
    "duration": "120 minutes",     # ← GEVI only
    "date": "2023-01-01",          # ← GEVI only
    "director": "Name",            # ← GEVI only
    "synopsis": "Description",     # ← GEVI only
    "studio": "Studio Name",
    "covers": ["front", "back"],
}
```

**WayBigProvider Features:**
```python
performer = {
    "name": "Name",
    "photo": "URL",
    "bio": "Short bio",
}

scene = {
    "title": "Scene Title",
    "performers": [...],
    "studio": "Studio",
    "date": "2023-01-01",
}
# NOTE: No movie-level data
```

---

## Phase 4: Scale to All Agents

**Pattern (from GayWorld):**
1. Analyze website HTML
2. Update selectors
3. Add error handling
4. Test
5. Deploy

**Agents by Priority:**
- **Critical (Week 1):** GayWorld ✓, AEBN, GEVI, GayEmpire, HFGPM
- **High (Week 2):** GayRado, GayHotMovies, HomoActive, Fagalicious, QueerClick
- **Medium (Week 3):** BestExclusivePorn, WayBig, +5 others
- **Low (Week 3-4):** Remaining 10+

**Target:** All at 30-50% success rate

---

## Phase 5: Unified Framework

**Before (Messy):**
```
GayAdult.bundle/Code/utils.py        (430KB)
GayWorld.bundle/Code/utils.py        (430KB, identical)
AEBN.bundle/Code/utils.py            (430KB, identical)
... × 22 agents
─────────────────────────────────
Total: 9.46MB of duplicate code
```

**After (Clean):**
```
_PGMA/Framework/
├─ AgentBase.py                      (base class)
├─ MetadataExtractor.py              (extraction logic)
├─ HttpClient.py                     (HTTP handling)
└─ ProviderRegistry.py               (provider system)

_PGMA/Instructions/
├─ gayworld.yml                      (selectors)
├─ aebn.yml                          (selectors)
├─ gevi.yml                          (selectors)
└─ ... × 22 agents

GayWorld.bundle/Code/__init__.py     (20 lines, just class def)
──────────────────────────────
Total: ~2MB (cleaner, maintainable)
```

**Update a Selector:**
```
Before:
├─ Edit Python code
├─ Update 22 files
├─ Test 22 files
├─ Deploy 22 bundles
├─ Hope nothing breaks

After:
├─ Edit gayworld.yml
├─ Done (1 file)
├─ All agents automatically use it
├─ Easy rollback
└─ Simple and safe
```

---

## Success Metrics Checklist

### Phase 1: Framework
- [ ] DataProvider class created
- [ ] ProviderRegistry working
- [ ] GayWorld migrated (canary test)
- [ ] All 22 agents running on framework
- [ ] No import errors
- [ ] Provider logging working

### Phase 2: GayWorld Fixed
- [ ] CSS selectors updated
- [ ] Title extraction: 100%
- [ ] Director extraction: 90%+
- [ ] Cast extraction: 85%+
- [ ] Overall success: 30-50%

### Phase 3: Enrichment Working
- [ ] GEVIProvider implemented
- [ ] WayBigProvider implemented
- [ ] Fallback chain working
- [ ] Enrichment success: 95%+

### Phase 4: All Agents Fixed
- [ ] 5 critical agents: 30-50% each
- [ ] 8 high-priority agents: 30-50% each
- [ ] 9 medium-priority agents: 25-45% each
- [ ] Total agents at target rate: 22/22

### Phase 5: Framework Complete
- [ ] All agents on unified framework
- [ ] Code duplication eliminated
- [ ] YAML configs extracted
- [ ] All tests passing

---

## Document Map

```
START HERE:
├─ This file (QUICK_REFERENCE_CARD.md) ← You are here

QUICK UNDERSTANDING:
├─ STRATEGY_FINAL_SUMMARY.md (20 min)
├─ STRATEGY_SUMMARY.md (5 min)
└─ VISUAL_REFERENCE.md (diagrams)

DETAILED UNDERSTANDING:
├─ GEVI_AS_ENRICHMENT_PROVIDER.md (why GEVI)
├─ WAYBIG_CAPABILITIES.md (why WayBig secondary)
└─ STRATEGY_UPDATE_GEVI_PRIMARY.md (what changed)

FULL REFERENCE:
├─ COMPREHENSIVE_STRATEGY.md (everything)
└─ All other docs as reference
```

---

## One-Line Summaries

```
Phase 1: "Remove IAFD dependency, enable alternatives"
Phase 2: "Fix broken scrapers using GayWorld as test"
Phase 3: "Add GEVI+WayBig enrichment system"
Phase 4: "Apply same fixes to all 22 agents"
Phase 5: "Consolidate code for maintainability"

Result: 2-5% → 30-50% success rate, no IAFD dependency, cleaner code
```

---

## Critical Differences from Initial Plan

| Aspect | Initial | Updated | Why |
|--------|---------|---------|-----|
| Primary Provider | WayBig | GEVI | GEVI has 3-4x more data |
| Movie Enrichment | None | GEVI (90%) | GEVI provides duration/date/director |
| Phase 1 Test | All 22 agents | GayWorld first | Canary test before scaling |
| Provider Hierarchy | WayBig → AEBN | GEVI → WayBig → AEBN | Better coverage, no single point |
| Coverage | ~80% of IAFD | ~120% of IAFD | Better than the original! |

---

**Last Updated:** January 30, 2026
**Status:** Final, Ready for Implementation
**Print and Keep Nearby During Implementation**
