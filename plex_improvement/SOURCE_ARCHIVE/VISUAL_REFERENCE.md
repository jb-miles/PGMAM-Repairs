# PGMA Modernization - Visual Reference Guide

---

## Current Architecture (Broken)

```
┌─────────────────────────────────────────────────────────┐
│                  Plex Media Server                      │
│                   Media File                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Local Media Agent      │
        │ (Plex system)          │
        └────────┬───────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌──────────────┐    ┌──────────────────┐
│ GayAdult     │    │ GayAdultFilms    │
│ Primary      │    │ Primary          │
└──────┬───────┘    └────────┬─────────┘
       │                     │
       ▼                     ▼
   ┌─────────────────────────────────┐
   │ 22 Contributor Agents:          │
   │ • GayWorld  • AEBN  • WayBig    │
   │ • GEVI      • GayEmpire        │
   │ • + 17 more                    │
   └─────────┬───────────────────────┘
             │
             ▼
        ┌─────────────────┐
        │ IAFD            │ ❌ BROKEN
        │ (Enrichment)    │ • 403 errors
        │                 │ • 367 failures
        └─────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Metadata to Plex │
    │ (incomplete)     │
    └──────────────────┘
```

### Problems Visible in Diagram

1. **Single enrichment source** (IAFD) - if it breaks, no enrichment
2. **No fallback providers** - no alternatives
3. **No way to add new providers** - deeply coupled
4. **22 separate implementations** - hard to fix

---

## Target Architecture (After Modernization)

```
┌─────────────────────────────────────────────────────────┐
│                  Plex Media Server                      │
│                   Media File                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ Local Media Agent      │
        │ (Plex system)          │
        └────────┬───────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌──────────────┐    ┌──────────────────┐
│ GayAdult     │    │ GayAdultFilms    │
│ Primary      │    │ Primary          │
└──────┬───────┘    └────────┬─────────┘
       │                     │
       ▼                     ▼
   ┌─────────────────────────────────┐
   │ Agent Framework (unified)       │
   │ • All agents inherit from base  │
   │ • Shared extraction logic       │
   │ • Shared error handling         │
   │ • Single utils.py (~2MB)        │
   └─────────┬───────────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ Provider Registry          │
    ├────────────────────────────┤
    │ ✓ WayBig (primary)         │
    │ ✓ Alternative (AEBN)       │
    │ ✓ Fallback (static Plex)   │
    └────────────────────────────┘
             │
    ┌────────┴────────┬─────────┐
    ▼                 ▼         ▼
┌─────────┐    ┌──────────┐   ┌─────┐
│ WayBig  │    │ Alt      │   │Plex │
│Provider │    │Provider  │   │Cache│
│✓ Cast   │    │(Optional)│   │     │
│✓ Studio │    │          │   │     │
└─────────┘    └──────────┘   └─────┘
    │
    ▼
┌──────────────────────────┐
│ Metadata to Plex         │
│ • More complete          │
│ • Better fallbacks       │
│ • Easy to add providers  │
└──────────────────────────┘
```

### Improvements Visible in Diagram

1. **Multiple providers** with fallback chain
2. **Unified framework** - one implementation per function
3. **Pluggable architecture** - easy to add new providers
4. **Clear registry** - shows what providers are available
5. **Single code path** - all agents use same logic

---

## Phase Implementation Flow

```
WEEK 1
├─ Phase 1: IAFD Removal Framework
│  ├─ Create DataProvider interface ✓
│  ├─ Create IAFDStub ✓
│  ├─ Create ProviderRegistry ✓
│  └─ Migrate 22 agents to use stubs
│
├─ Phase 2a: GayWorld Website Analysis
│  ├─ Inspect gay-world.org HTML ✓
│  ├─ Document needed changes
│  └─ List failing CSS selectors
│
└─ Phase 5a: Framework Design (parallel)
   ├─ Design AgentBase class
   ├─ Design MetadataExtractor
   └─ Design YAML configuration schema

WEEK 2
├─ Phase 2b: GayWorld Code Updates
│  ├─ Fix CSS selectors/XPath queries
│  ├─ Add error handling
│  ├─ Test on live data
│  └─ Success rate: 30-50% target
│
├─ Phase 3: WayBig Integration
│  ├─ Create WayBigProvider class
│  ├─ Register in ProviderRegistry
│  ├─ Test availability/quality
│  └─ Integration testing
│
└─ Phase 5b: Framework Template Extraction
   ├─ Convert GayWorld to framework
   ├─ Extract YAML config
   └─ Validate functionality identical

WEEK 3-4
├─ Phase 4a: High-Priority Agents (5)
│  ├─ Website audits (AEBN, GEVI, etc)
│  ├─ Code updates
│  └─ Testing & rollout
│
├─ Phase 4b: Mid-Priority Agents (8)
│  └─ Repeat for next batch
│
└─ Phase 5c: Agent Framework Migration
   ├─ Convert all 22 agents
   ├─ Full testing
   └─ Gradual rollout
```

---

## Configuration Changes Decision Tree

```
┌─────────────────────────────────────┐
│ Agent Starts Up                     │
└────────────┬────────────────────────┘
             │
             ▼
    ┌────────────────────┐
    │ Load Preferences   │
    └────────┬───────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │ Which Enrichment Provider?       │
    │ • None (default - safe)          │
    │ • WayBig (recommended)           │
    │ • Alternative (if configured)    │
    │ • Custom (user override)         │
    └────────┬───────────────────────┘
             │
    ┌────────┴────────┬────────────┐
    ▼                 ▼            ▼
┌─────────┐    ┌────────────┐  ┌────────┐
│ WayBig  │    │Alternative │  │Custom  │
│Provider │    │Provider    │  │Config  │
└────┬────┘    └──────┬─────┘  └───┬────┘
     │                │            │
     ▼                ▼            ▼
┌──────────────────────────────────────┐
│ Extract Metadata                     │
│ 1. Search source website             │
│ 2. Parse results (CSS selectors)     │
│ 3. Extract fields                    │
│ 4. Enrich from provider              │
│ 5. Validate & normalize              │
│ 6. Return to Plex                    │
└──────────────────────────────────────┘
```

---

## Success Rate Improvement Timeline

```
Current State (Broken)
├─ IAFD: 0% (403 errors)
├─ GayWorld: ~2.8%
├─ AEBN: ~3%
├─ GEVI: <2%
└─ Average: ~2-5%

After Phase 1-2 (IAFD removed, GayWorld fixed)
├─ IAFD: N/A (removed)
├─ GayWorld: 30-50% ✓ (10x improvement)
├─ Others: ~2-5% (unchanged)
└─ Average: ~5-10%

After Phase 3-4 (All agents updated)
├─ GayWorld: 30-50%
├─ AEBN: 30-50%
├─ GEVI: 30-50%
├─ All others: 25-45%
└─ Average: 30-50% ✓ (6-15x improvement)

After Phase 5 (Framework + optimization)
├─ All agents: 35-55%
├─ Better monitoring → faster fixes
├─ Config-driven updates → no code changes
└─ Target: 40%+ sustainable
```

---

## Code Consolidation View

```
BEFORE (Scattered)
├─ GayAdult.bundle/Contents/Code/utils.py (430KB)
├─ GayWorld.bundle/Contents/Code/utils.py (430KB)
├─ AEBN.bundle/Contents/Code/utils.py (430KB)
├─ WayBig.bundle/Contents/Code/utils.py (430KB)
├─ ... (22 copies total)
└─ Total: 9.46MB (massive duplication)

Each utils.py contains identical code:
├─ Extract title (same in all)
├─ Extract cast (same in all)
├─ Extract director (same in all)
├─ Error handling (same in all)
├─ HTTP requests (same in all)
└─ Lots of "what if" code

AFTER (Unified Framework)
├─ _PGMA/Framework/
│  ├─ AgentBase.py (base class)
│  ├─ MetadataExtractor.py (shared extraction)
│  ├─ HttpClient.py (shared HTTP)
│  ├─ ErrorHandler.py (shared errors)
│  └─ Logger.py (shared logging)
├─ _PGMA/Instructions/
│  ├─ gayworld.yml (site config)
│  ├─ aebn.yml (site config)
│  ├─ waybig.yml (site config)
│  └─ ... (22 YAML files)
├─ GayAdult.bundle/Contents/Code/
│  └─ __init__.py (100 lines - just agent class)
└─ Total: ~2MB (1/5 the size)

Benefits:
✓ Shared code = easier to maintain
✓ YAML configs = easy to update without code
✓ One implementation = one place to fix bugs
✓ Better testing = tests apply to all agents
```

---

## Fallback Chain Example

```
GayWorld tries to enrich cast information:

1. Try WayBig Provider
   ├─ Query: "Austin Shadow"
   ├─ Result: ✓ Found performer profile
   └─ Return: performer photo, bio, credits

2. If WayBig fails, try Alternative Provider
   ├─ Query: "Austin Shadow"
   ├─ Result: ✗ Not found
   └─ Continue to next...

3. If Alternative fails, use cached data
   ├─ Query: Check local Plex metadata cache
   ├─ Result: ✓ Found from previous scan
   └─ Return: last known good data

4. If everything fails, return None
   ├─ Metadata still valid without enrichment
   ├─ Agent logs: "Enrichment unavailable for Austin Shadow"
   └─ File still gets basic metadata (title, date, etc.)

Result: Graceful degradation
├─ Best case: Full metadata with enrichment
├─ Good case: Basic metadata + partial enrichment
├─ Acceptable case: Basic metadata only
└─ Bad case: (almost never happens)
```

---

## Provider Comparison Matrix

```
┌──────────────────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ Feature              │ IAFD     │ GEVI     │ WayBig   │ AEBN     │ Plex     │
│                      │ (broken) │(PRIMARY) │(fallback)│(fallback)│ Cache    │
├──────────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ Availability         │ 0%❌     │ 98%✓✓✓   │ 95%✓     │ 90%✓     │ 100%✓    │
│ Performer names      │ 0%       │ 95%✓✓✓   │ 85%✓     │ 75%      │ 60%      │
│ Performer photos     │ 0%       │ 90%✓✓✓   │ 80%✓     │ 70%      │ 50%      │
│ Physical attributes  │ 0%       │ 95%✓✓✓   │ 0%✗      │ 0%✗      │ 10%      │
│ Director info        │ 0%       │ 85%✓✓    │ 0%✗      │ 15%      │ 30%      │
│ Movie metadata       │ 0%       │ 90%✓✓✓   │ 0%✗      │ 0%✗      │ 40%      │
│ Response time        │ N/A      │ 1-2s     │ 1-2s     │ 2-3s     │ <0.1s    │
│ Setup effort         │ 0h       │ 3h       │ 2h       │ 3h       │ 0h       │
│ Maintenance          │ N/A      │ Low      │ Low      │ Medium   │ None     │
└──────────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

Best strategy: GEVI → WayBig → AEBN → Plex Cache
(Try in order, use first successful result - GEVI has most comprehensive data)
```

---

## Rollout Strategy Options

```
OPTION A: Big Bang (Fast, Higher Risk)
├─ Week 1: Complete all phases
├─ Week 2: Deploy all agents at once
├─ Pro: Get to stable state quickly
└─ Con: If bug found, all agents affected

OPTION B: Canary (Safer, Slower)
├─ Week 1-2: Complete Phases 1-3, test heavily
├─ Week 3: Roll out GayWorld only (canary)
├─ Week 4: Monitor, then roll out rest
├─ Pro: Find problems early, limited blast radius
└─ Con: Longer overall timeline

OPTION C: Gradual by Agent Type (Balanced)
├─ Week 1-2: Phases 1-3, all agents
├─ Week 3: Deploy high-priority agents (5)
├─ Week 4: Deploy mid-priority agents (8)
├─ Week 5: Deploy low-priority agents (9)
├─ Pro: Problems limited to current batch
└─ Con: Extended deployment window

RECOMMENDATION: Option B (Canary)
└─ Low risk, can accelerate if successful
```

---

## Dependency Map

```
Phase 1 (IAFD Removal)
└─ No dependencies
   ├─ Can start immediately
   └─ Unblocks Phases 2-3

Phase 2 (GayWorld Fix)
├─ Depends on: Phase 1 (needs framework)
└─ Enables: Phase 5 (reference implementation)

Phase 3 (WayBig Integration)
├─ Depends on: Phase 1 (needs framework)
└─ Enables: Phase 4 (as fallback provider)

Phase 4 (Scraper Fixes)
├─ Depends on: Phase 1 (needs framework)
├─ Depends on: Phase 3 (optional, but recommended)
└─ Enables: Production readiness

Phase 5 (Unified Framework)
├─ Depends on: Phase 1 (needs stubs)
├─ Can run parallel to: Phases 2-4
└─ Critical for: Long-term maintainability

CRITICAL PATH: Phase 1 → (Phase 2 + Phase 3) → Phase 4
PARALLEL PATH: Phase 5 (can run alongside)
```

---

## Quick Decision Matrix

```
Q: Should we do Phase 5 (Unify Framework)?
├─ If: High maintenance burden → YES (do it)
├─ If: Limited resources → DEFER (but plan it)
└─ If: Want long-term sustainability → YES (essential)

Q: What if WayBig becomes unavailable?
├─ Have backup: Implement AEBN provider too
├─ Fallback chain ensures graceful degradation
└─ Director info will suffer but agents still work

Q: Can we skip website audits (Phase 4)?
├─ No - that's the core fix for 94%+ failures
├─ Audits identify exactly what CSS selectors changed
└─ Without this, success rates won't improve

Q: Timeline: Can we finish in 2 weeks?
├─ Maybe Phase 1-3 in 2 weeks (partial)
├─ Phase 4 requires 20+ website audits (needs time)
├─ Phase 5 is long-term investment
└─ Recommend 4-5 weeks minimum

Q: Do we need to remove IAFD completely?
├─ Could keep it as "optional" provider
├─ But: It's broken, slowing down searches
├─ Better: Remove, add back if/when fixed
└─ Recommendation: Remove (Phase 1)
```

---

## Key Dates & Milestones

```
Week 1 (Jan 30 - Feb 5)
├─ ✓ Strategy documented (done)
├─ Start: Phase 1 (IAFD framework)
├─ Start: Phase 2a (GayWorld analysis)
└─ Milestone: Framework structure complete

Week 2 (Feb 6 - Feb 12)
├─ Complete: Phase 1 (all agents migrated)
├─ Complete: Phase 2 (GayWorld tested)
├─ Complete: Phase 3 (WayBig integrated)
├─ Start: Phase 4a (audit critical agents)
└─ Milestone: GayWorld 30-50% success rate

Week 3 (Feb 13 - Feb 19)
├─ Continue: Phase 4a/4b (agent updates)
├─ Continue: Phase 5b (config extraction)
├─ Testing: All Phase 1-3 changes
└─ Milestone: 5+ agents updated to new pattern

Week 4+ (Feb 20+)
├─ Complete: Phase 4c (remaining agents)
├─ Complete: Phase 5c/5d (framework migration)
├─ Production rollout (staged)
└─ Milestone: All agents on unified framework
```

---

## Contact/Questions

For detailed information, see:
- **STRATEGY_SUMMARY.md** - This level of detail
- **COMPREHENSIVE_STRATEGY.md** - Full 200+ section plan
- **IAFD_ANALYSIS.md** - Why IAFD failed
- **SUMMARY_README.md** - Why match rates are low

---

**Status:** Ready for Review and Implementation
**Last Updated:** January 30, 2026
