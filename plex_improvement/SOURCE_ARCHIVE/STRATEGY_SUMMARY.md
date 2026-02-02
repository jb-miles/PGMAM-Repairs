# PGMA Modernization Strategy - Executive Summary

**Status:** Ready for Implementation
**Prepared:** January 30, 2026

---

## The Problem (TL;DR)

The PGMA system has **two critical problems**:

1. **IAFD is Dead** ❌
   - 367 failed requests in 24 hours
   - HTTP 403 blocking, NoneType errors
   - All 20+ agents are affected
   - Impact: Cast/Director information is missing/incomplete

2. **Scraper Match Rates are Abysmal** 📉
   - 94%+ failure rate on metadata extraction
   - Scrapers find results but can't parse them
   - Reason: Website HTML/structure has changed
   - Impact: ~2-5% success rate (need 30-50%+)

---

## The Solution (TL;DR)

### 5 Phases, 4-5 weeks

**Phase 1: Remove IAFD (Week 1)**
- Create adapter/stub framework for data providers
- Allow agents to work without IAFD
- Clear insertion points for replacement providers

**Phase 2: Fix GayWorld (Week 1-2)**
- Use GayWorld as test case
- Update outdated CSS selectors/XPath queries
- Validate approach before scaling to other agents

**Phase 3: Implement Enrichment Provider System (Week 2)**
- **Primary provider: GEVI** (comprehensive performer + movie data)
- Secondary provider: WayBig (scene data, fallback)
- Tertiary provider: AEBN (additional fallback)
- Covers ~120% of IAFD's former functionality (more than original!)

**Phase 4: Fix All Scrapers (Week 2-4)**
- Audit 22 agent websites systematically
- Update CSS selectors/parsing code
- Target: Get success rates to 30-50%

**Phase 5: Unify Framework (Week 1-4, parallel)**
- Consolidate 22 identical ~430KB utils.py files
- Configuration-driven extraction (YAML selectors)
- One framework, pluggable providers
- Easy to maintain, update, and extend

---

## Why This Works

### Phase 1: IAFD Removal
- IAFD is enrichment layer, not primary source
- Agents can still find basic metadata without it
- Just need to gracefully handle None responses
- Enables dropping in replacements

### Phase 2: GayWorld Test
- GayWorld heavily uses IAFD (78 references) → good test
- High activity in logs → easy to measure improvement
- If we fix GayWorld, approach works for others

### Phase 3: WayBig Integration
- WayBig already runs, no 403 errors
- Has performer/cast data we can use
- Won't replace IAFD 100%, but covers major gaps
- Tested deployment pattern

### Phase 4: Scraper Fixes
- Root cause: outdated CSS selectors
- Pattern occurs in ALL agents → systemic problem
- Website audits will identify exact changes needed
- Then just code updates + testing

### Phase 5: Unify Framework
- Eliminates code duplication (9.46MB → 2MB)
- YAML configs instead of hardcoded selectors
- One framework to maintain, not 22
- Non-developers can update selectors

---

## Expected Outcomes

### Before Modernization
```
Success rate:        ~2-5%
Cast info:           Incomplete/Missing
Director info:       Incomplete/Missing
IAFD enrichment:     0% (broken)
Code duplication:    9.46MB (22 copies)
Maintenance effort:  High (22 agents)
Update difficulty:   Very hard
```

### After Modernization
```
Success rate:        30-50% (10x improvement)
Cast info:           Excellent (GEVI primary, WayBig fallback)
Director info:       Good (GEVI extracts from movies)
Movie enrichment:    New feature (GEVI provides duration, date, synopsis)
IAFD enrichment:     Replaced by GEVI (120% of original value!)
Code duplication:    ~2MB (framework only)
Maintenance effort:  Low (1 framework)
Update difficulty:   Easy (YAML configs)
```

---

## Key Metrics to Track

| Phase | Metric | Target | Current |
|-------|--------|--------|---------|
| 1 | Agents running | 22/22 | - |
| 1 | Provider registry working | Yes | - |
| 2 | GayWorld success rate | 30-50% | ~2-5% |
| 2 | Title extraction | 100% | - |
| 3 | GEVI availability | 98%+ | - |
| 3 | GEVI performer coverage | 95%+ | - |
| 3 | GEVI movie enrichment | 90%+ | 0% |
| 3 | Enrichment success (GEVI+WayBig) | 95%+ | 0% |
| 4 | All agents success rate | 30-50% | ~2-5% |
| 5 | Framework migration | 22/22 agents | - |
| 5 | Code size | ~2MB | 9.46MB |

---

## Flexibility & Adjustments

**The plan adjusts based on:**

✅ **Discoveries in Phase 1-2** might reveal:
- If website changes are more complex → prioritize Phase 5
- If WayBig has more limitations → find backup providers
- If specific agents have unique issues → handle separately

✅ **Impact prioritization**:
- Focus on high-activity agents first (GayWorld, AEBN, GEVI)
- Long-tail agents can be done later
- Business impact drives priority

✅ **Resource availability**:
- Phase 5 (framework) can run parallel to Phase 4 (audits)
- Website audits are I/O-bound → good for parallel work
- Code migration can be automated

✅ **Timeline constraints**:
- Quick wins: Phase 2 (GayWorld) could be done in 1 week
- Long payoff: Phase 5 (framework) takes longer but pays off forever
- Can ship incremental improvements between phases

---

## Risks & Mitigation

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| WayBig unavailable | Low | Have backup: implement AEBN provider instead |
| Website structure too complex | Medium | Add manual override in YAML config |
| Director data permanently lost | Medium | Accept this, document it, notify users |
| Framework introduces bugs | Low | Extensive testing, keep legacy fallback |
| Timeline slippage | Medium | Prioritize, automate where possible |

---

## Immediate Next Steps (This Week)

1. **Confirm This Approach** ✓
   - Read this summary
   - Read full `COMPREHENSIVE_STRATEGY.md`
   - Agree on priorities and adjustments

2. **Decision Points** - Confirm:
   - Is IAFD removal acceptable?
   - Is WayBig the right replacement?
   - Timeline constraints?
   - Resource allocation?

3. **Setup** (2-3 hours):
   - Create development branch
   - Set up testing environment
   - Document baseline metrics

4. **Phase 1 Kickoff** (Days 2-3):
   - Create stub framework structure
   - Begin agent migration to stubs
   - Start Phase 2 analysis of GayWorld

---

## Document Structure

- **This file** (you are here): 5-minute overview
- **COMPREHENSIVE_STRATEGY.md**: Full 200+ section plan with code examples
- **IAFD_ANALYSIS.md**: Technical details on IAFD failures
- **SUMMARY_README.md**: Log analysis showing match rate problem

---

## Questions for Clarification

Before starting Phase 1, confirm:

1. **Scope**: Apply to all 22 agents, or start with subset?
2. **Speed vs. Quality**: Quick wins first, or comprehensive approach?
3. **WayBig Confidence**: Is this our best bet, or explore others?
4. **Timeline**: Any hard deadlines or constraints?
5. **Rollout Strategy**: Big bang migration or gradual rollout?

---

## Why This Matters

**Current State:**
- ~2% of metadata requests succeed
- Users get incomplete metadata (missing cast, directors)
- System depends on broken external service (IAFD)
- Code is difficult to maintain and update

**After Modernization:**
- ~40% success rate (10x better)
- More complete metadata (with alternatives)
- System independent of external failures
- Code is maintainable and extensible

**This unlocks:**
- Better user experience (more complete data)
- Easier to add new providers
- Lower operational burden
- Sustainable long-term maintenance

---

**Next Action:** Review and confirm approach, then proceed with Phase 1.
