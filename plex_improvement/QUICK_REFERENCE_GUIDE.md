# PGMA Modernization - Quick Reference Guide

**One-page summary for team alignment | Updated: January 30, 2026**

---

## The Problem in 30 Seconds

```
CRISIS:  IAFD broken (403 errors)        + Scrapers failing (94% failure rate)
IMPACT:  2-5% match rate                 + 9.46MB code duplication
RESULT:  Metadata is incomplete          + System is unmaintainable
```

---

## The Solution: 5 Phases in 4-5 Weeks

| Phase | What | Duration | Target |
|-------|------|----------|--------|
| **1** | Remove IAFD → Create framework | Week 1 | Foundation ready |
| **2** | Fix GayWorld scrapers | Week 1-2 | 30-50% success |
| **3** | Add GEVI + WayBig enrichment | Week 2 | 95%+ enrichment |
| **4** | Fix all 22 agents | Week 2-4 | **30-50% overall** |
| **5** | Unify framework (parallel) | Week 1-4 | 9.46MB → 2MB |

---

## Critical Numbers

| Metric | Before | After | Why |
|--------|--------|-------|-----|
| **Match Rate** | 2-5% | 30-50% | Fixed scrapers (Phase 4) |
| **Cast Data** | 0% | 95% | GEVI enrichment (Phase 3) |
| **Director Data** | 0% | 85% | GEVI extraction |
| **Movie Data** | 0% | 90% | GEVI only (unique) |
| **Code Size** | 9.46MB | 2MB | Framework consolidation |
| **IAFD Dependency** | Yes (broken) | No | Replaced with GEVI |
| **Single Point of Failure** | IAFD | None | Multi-provider fallback |

---

## The 3 Critical Decisions

### 1️⃣ GEVI is Primary (Not WayBig)

| Data | GEVI | WayBig |
|------|------|--------|
| Performer names | 95% | 85% |
| Performer photos | 90% | 80% |
| **Physical attributes** | **95%** | **0%** |
| **Movie duration** | **90%** | **0%** |
| **Movie director** | **85%** | **0%** |
| **Movie date** | **90%** | **0%** |
| Scene info | 90% | 85% |

**Decision:** GEVI gives 3-4x more data + unique movie-level enrichment

### 2️⃣ AEBN is Phase 2 Canary Test

**Why AEBN (not GayWorld)?**
- Median complexity (296 lines) = representative of typical agents
- Advanced features (multi-page, age-gate, studio matching) = proves framework robustness
- Recent activity (Jan 30, 2026 update) = shows real-world usage
- Success validates approach for all 22 agents

**Timeline:**
- Phase 1: Migrate to framework
- Phase 2: Fix scrapers (2-5% → 30-50%)
- Phase 3: Add enrichment
- Phase 4: Apply same pattern to 21 other agents

### 3️⃣ Multi-Provider Fallback (No Single Point of Failure)

**Old:** IAFD → broke → everything broke
**New:** GEVI → WayBig → AEBN → Plex Cache

**Result:** If any provider fails, system degrades gracefully

---

## Provider Hierarchy (Most Important)

```
Request for enrichment
        ↓
1. Try GEVI (98% availability)
   ├─ 95% performer data
   ├─ 90% physical attributes
   ├─ 90% movie metadata ← Unique to GEVI
   └─ Success? → Return data ✓
        ↓
2. If GEVI fails, try WayBig (95% availability)
   ├─ 85% performer data
   ├─ 85% scene info
   └─ Success? → Return data ✓
        ↓
3. If WayBig fails, try AEBN (90% availability)
   └─ General performer backup → Return data ✓
        ↓
4. If all fail, use Plex Cache
   └─ Last resort local fallback
```

---

## Phase Details at a Glance

### Phase 1: Framework + GayWorld Canary
**Creates:**
- DataProvider abstract class
- IAFDStub (replace broken IAFD)
- ProviderRegistry (manage providers)
- GayWorld migration (canary test)

**Success:** All 22 agents on framework, no IAFD calls

### Phase 2: Fix GayWorld Scrapers
**Process:**
1. Audit gay-world.org current HTML
2. Update CSS selectors
3. Add error handling
4. Test on 20 real films

**Success:** GayWorld 30-50% (vs 2-5%)

### Phase 3: Enrichment System
**Deploys:**
- GEVIProvider (performer + movie + director data)
- WayBigProvider (scene data, fallback)
- Fallback chain logic

**Success:** 95%+ enrichment success

### Phase 4: Fix All 22 Agents
**Pattern:** (repeat Phase 2 for each agent)
1. Website audit
2. CSS selector updates
3. Error handling
4. Testing

**Success:** All agents 30-50%

### Phase 5: Unified Framework
**Consolidates:**
- 22 × 430KB utils.py → 1 framework + YAML configs
- Single extraction logic used by all agents
- Selector updates in YAML (no code changes)

**Success:** 9.46MB → 2MB, maintainable code

---

## What Improves Match Rates?

### ✓ IMPROVES MATCH RATES (Quantitative)
- **Phase 4:** Fix all 22 agents → 2-5% → 30-50%

### ✓ IMPROVES METADATA QUALITY (Qualitative)
- **Phase 3:** GEVI enrichment → cast photos, movie data

### ✓ ENABLES SUSTAINABILITY (Prevention)
- **Phase 5:** Framework → easy selector updates

---

## Success Checklist

### Phase 1: Framework
- [ ] All 22 agents on framework
- [ ] No IAFD calls
- [ ] Provider logging working
- [ ] Framework tested with AEBN

### Phase 2: AEBN
- [ ] 30-50% success rate
- [ ] Title extraction: 100%
- [ ] Director extraction: 90%+
- [ ] Cast extraction: 85%+

### Phase 3: Enrichment
- [ ] GEVI available (98%+)
- [ ] Enrichment success: 95%+
- [ ] Fallback chain: 100% working

### Phase 4: All Agents
- [ ] 22/22 agents at 30-50%
- [ ] No regressions
- [ ] Error logging clear

### Phase 5: Framework
- [ ] 22/22 agents migrated
- [ ] Code: 9.46MB → 2MB
- [ ] YAML configs working

---

## Key Metrics During Implementation

Monitor these weekly:

| Metric | Week 1 | Week 2 | Week 3 | Week 4 |
|--------|--------|--------|--------|--------|
| **Framework agents** | 1 | 22 | 22 | 22 |
| **Scrapers fixed** | 1 | 1 | 6 | 22 |
| **Overall success rate** | 2% | 4% | 15% | 30-50% |
| **Enrichment success** | — | — | 95%+ | 95%+ |
| **Code size (MB)** | 9.46 | 9.46 | 9.46 | 2.0 |

---

## Fallback Chain Example

```
Scenario: GayWorld tries to enrich "Austin Shadow"

Step 1: Try GEVI
├─ Query: "Austin Shadow"
├─ Result: ✓ Found performer profile
└─ Return: photo, bio, attributes, credits

[If GEVI failed, would try...]
Step 2: Try WayBig
├─ Query: "Austin Shadow"
├─ Result: ✓ Found performer
└─ Return: photo, limited bio

[If WayBig failed, would try...]
Step 3: Try AEBN
├─ Query: "Austin Shadow"
├─ Result: Maybe found, lower quality
└─ Return: partial data

[If all failed...]
Step 4: Use Plex Cache
├─ Query: Local cached data
└─ Return: Whatever Plex found earlier

Result: Graceful degradation
├─ Best case: GEVI data (rich enrichment)
├─ Good case: WayBig data (decent enrichment)
├─ Acceptable case: AEBN or cached data
└─ Worst case: None (still have basic metadata)
```

---

## Configuration Update Pattern

### OLD Way (Code Changes)
```
1. Find failing CSS selector in agent code
2. Update Python file
3. Rebuild bundle
4. Redeploy to Plex
5. Hope nothing else breaks in 22 places
6. Risk: 1 mistake affects all agents
```

### NEW Way (Framework + YAML)
```
1. Find failing CSS selector in gayworld.yml
2. Update selector text (YAML, not code)
3. Done (no code, no rebuild, no recompile)
4. All agents use updated selector immediately
5. Easy rollback: revert YAML file
6. Safe: only affects that one agent's config
```

**Result:** Updates are faster, safer, easier

---

## Risk Management

| Risk | Likelihood | Fix |
|------|-----------|-----|
| GEVI unavailable | Low | WayBig + AEBN fallback handles it |
| Website too complex | Medium | YAML manual override option |
| Framework bugs | Low | Extensive testing before Phase 2 |
| Timeline slip | Medium | Parallel work, prioritize Phase 4 |

---

## Implementation Order (Strict Dependencies)

```
Phase 1 ← (Everything depends on this)
    ├─→ Phase 2 (Test scraper fixes)
    │       └─→ Phase 4 (Scale to all agents)
    ├─→ Phase 3 (Enrichment system)
    │       └─→ Phase 4 (Use as fallback)
    └─→ Phase 5 (Framework consolidation)
            (Can run parallel with 2-4)

Critical Path: 1 → (2 + 3) → 4
Parallel Path: 5 (alongside 1-4)
```

---

## What NOT to Do

❌ **Don't skip Phase 4** - That's where match rate improvement happens
❌ **Don't do all agents in Phase 1** - Test GayWorld first
❌ **Don't keep IAFD** - It's broken and blocking progress
❌ **Don't use WayBig as primary** - GEVI is 3-4x better
❌ **Don't forget error handling** - Robustness prevents future failures

---

## Document Map

**Need quick understanding?** (30 min)
→ This file + PGMA_MODERNIZATION_STRATEGY.md overview

**Need to implement?** (2 hours)
→ PGMA_MODERNIZATION_STRATEGY.md (full plan)
→ TECHNICAL_IMPLEMENTATION_DETAILS.md (code patterns)

**Need to understand decisions?** (1 hour)
→ GEVI_AS_ENRICHMENT_PROVIDER.md (why GEVI primary)
→ STRATEGY_UPDATE_GEVI_PRIMARY.md (what changed)
→ PHASE_4_AND_5_CLARIFICATION.md (why both matter)

---

## One-Line Summaries

**Phase 1:** Remove IAFD dependency, enable alternatives
**Phase 2:** Fix broken scrapers using GayWorld as test
**Phase 3:** Add GEVI+WayBig enrichment system
**Phase 4:** Apply same fixes to all 22 agents
**Phase 5:** Consolidate code for maintainability

**Result:** 2-5% → 30-50% success rate, no IAFD dependency, cleaner code

---

## Quick Decision Tree

**Q: Should we do Phase 5 (consolidate code)?**
→ YES - prevents future regressions, enables easy updates

**Q: What if GEVI becomes unavailable?**
→ WayBig fallback works, can implement AEBN too

**Q: Can we skip Phase 4 (fix scrapers)?**
→ NO - that's where the 10x improvement happens

**Q: How long total?**
→ 4-5 weeks for all 5 phases

**Q: What about director info?**
→ GEVI provides 85%, better than IAFD's 0%

---

## Key Contacts & Resources

**Full Strategy:** PGMA_MODERNIZATION_STRATEGY.md
**Code Patterns:** TECHNICAL_IMPLEMENTATION_DETAILS.md
**GEVI Details:** GEVI_AS_ENRICHMENT_PROVIDER.md
**Provider Info:** STRATEGY_UPDATE_GEVI_PRIMARY.md

---

**Status:** Ready for Implementation
**Next Action:** Begin Phase 1 (framework creation)
**Print & Keep Nearby During Implementation**
