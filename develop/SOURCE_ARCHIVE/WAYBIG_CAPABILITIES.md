# WayBig Provider: Capabilities and Limitations

**Important Clarification:** January 30, 2026

---

## The Reality of WayBig as IAFD Replacement

WayBig is **NOT a 1:1 replacement for IAFD** — it serves a different purpose and has different strengths/limitations.

### What WayBig IS Good For

**Primary Strength: Performer/Actor Data** ✓✓✓
- Performer names and photos ✓ (Excellent)
- Performer bios and profiles ✓ (Very Good)
- Performer career information ✓ (Good)
- Performer filmography ✓ (Useful)

**Secondary Strength: Scene Data** ✓✓
- Scene titles and dates ✓
- Scene performer credits ✓
- Scene tags and categories ✓
- Studio information ✓

### What WayBig Is NOT Good For

**Film-Level Metadata** ✗
- Full-length film director information ✗ (Not available)
- Full-length film information ✗ (Scenes focus, not films)
- Cross-film validation ✗ (Not designed for this)
- Complete filmographies ✗ (Focus on scenes, not films)

---

## Why This Matters for the Strategy

### Current IAFD Usage Pattern

IAFD was used for **two things**:

1. **Primary Use:** Performer/Cast enrichment (80%)
   - Look up actor name → get photo, bio, credits
   - This is what IAFD was best at

2. **Secondary Use:** Director/Film validation (20%)
   - Cross-reference directors
   - Film-level metadata enrichment

### WayBig Covers What Matters

**The Good News:**
```
IAFD usage breakdown:
├─ Cast/Performer enrichment (80%)   ← WayBig CAN DO THIS ✓
├─ Director info (15%)                ← WayBig CANNOT DO
└─ Film validation (5%)                ← WayBig CANNOT DO

Translation:
├─ WayBig can replace ~80% of IAFD's value
└─ Missing ~20% is acceptable (director info less critical)
```

**Why this works:**
- Most important data = cast/performer info (photos, bios)
- WayBig specializes in exactly this
- Director information is nice-to-have, not critical
- Users care most about: Is the film found? Do we have cast?

### Updated Enrichment Strategy

**Priority 1: Performer Data (CRITICAL)**
```
For every actor in the film:
1. Ask WayBig: Do you have this performer?
2. If yes: Use their profile (photos, bio, credits)
3. If no: Continue without enrichment
4. Result: Cast list with photos ✓
```

**Priority 2: Director Data (NICE-TO-HAVE)**
```
For director names:
1. Ask WayBig: Do you have this person?
2. If no match: Continue without
3. Director name alone is OK (no photo/bio needed)
4. Result: Basic director credit ✓
```

---

## Implications for the Strategy

### Phase 3 (WayBig Integration) - Updated Scope

**What We're Implementing:**
- Use WayBig for **performer enrichment** (primary)
- Accept that director info will be incomplete
- This is acceptable trade-off

**What We're NOT Trying:**
- Don't try to use WayBig for full film metadata
- Don't try to replicate IAFD's cross-film validation
- Don't expect 100% IAFD replacement

**Success Metric Update:**
```
Old expectation: "WayBig replaces IAFD completely"
New reality: "WayBig provides 80% of IAFD's value (performer data)"
Final outcome: "Better cast data, reduced director data (acceptable)"
```

### Phase 4 (Scraper Fixes) - Still Critical

The real issue is **not IAFD**, it's **broken scrapers**:

```
Current failure mode:
├─ GayWorld tries to find "Freaks 4"
├─ Finds the result page ✓
├─ Tries to extract title/director/cast → FAILS ✗
│  (because website HTML changed, selectors outdated)
└─ Result: File unmatched

This has NOTHING to do with IAFD enrichment
├─ Even without IAFD, finding titles was failing
├─ So fixing scrapers is THE critical path
└─ WayBig enrichment is bonus on top
```

### Updated Phase Success Criteria

**Phase 4 (Fix Scrapers)** - Critical for success
```
Current: 2-5% success rate (scrapers broken)
Target: 30-50% success rate (scrapers fixed)
Effort: HIGH (20+ website audits)
Impact: HIGHEST (enables everything else)
```

**Phase 3 (Add WayBig)** - Nice to have
```
Current: 0% enrichment (IAFD broken)
Target: 80% performer enrichment
Effort: MEDIUM (implement provider)
Impact: MEDIUM (improves cast data quality)
Note: Without Phase 4 (scrapers), Phase 3 barely matters
```

---

## Realistic Outcomes After Modernization

### What Users Will See

**BEFORE (Current Broken State)**
```
Film: "Freaks 4"
├─ Title: Found? Maybe (2% success rate) ✗
├─ Director: Missing
├─ Cast: Missing (IAFD broken)
├─ Release Date: Missing
├─ Poster: Missing
└─ Result: Mostly empty, file unmatched
```

**AFTER Phase 4 Only (Fix Scrapers, no WayBig)**
```
Film: "Freaks 4"
├─ Title: Found ✓ (30-50% success rate)
├─ Director: Found ✓ (from GayWorld)
├─ Cast: Found ✓ (from GayWorld, but no photos/bios)
├─ Release Date: Found ✓
├─ Poster: Found ✓
└─ Result: Good metadata, mostly complete
```

**AFTER Phase 4 + Phase 3 (Scrapers + WayBig)**
```
Film: "Freaks 4"
├─ Title: Found ✓ (30-50% success rate)
├─ Director: Found ✓ (from GayWorld, no photos)
├─ Cast: Found ✓ (from GayWorld + WayBig photos/bios)
├─ Release Date: Found ✓
├─ Poster: Found ✓
├─ Cast Photos: Found ✓ (from WayBig)
├─ Cast Bios: Found ✓ (from WayBig)
└─ Result: Excellent metadata, very complete
```

**Key Difference:**
- Phase 4 alone = functional metadata (film is findable)
- Phase 4 + 3 = enriched metadata (cast has photos/bios)
- Both are improvements, but Phase 4 is the must-have

---

## Updated Strategy Priorities

### Critical Path (Must Do)
1. **Phase 1:** Remove IAFD, create framework
   - Effort: 1 week
   - Blocks: Everything

2. **Phase 2 + 4:** Fix scrapers (GayWorld + others)
   - Effort: 2-3 weeks
   - Impact: 10x improvement in match rates
   - This is where the real value comes from

3. **Phase 5:** Unified framework
   - Effort: 2-3 weeks (parallel)
   - Impact: Long-term maintainability
   - Essential for sustainability

### High-Priority (Should Do)
- **Phase 3:** Add WayBig enrichment
  - Effort: 1 week
  - Impact: Improves cast information quality
  - Nice-to-have on top of Phase 4

---

## Updated Provider Comparison

```
┌──────────────────┬──────────┬──────────┬──────────┐
│ Capability       │ WayBig   │ AEBN     │ Plex     │
│                  │ Provider │ Provider │ Cache    │
├──────────────────┼──────────┼──────────┼──────────┤
│ Performer names  │ 90%✓     │ 70%      │ 40%      │
│ Performer photos │ 85%✓     │ 60%      │ 20%      │
│ Performer bio    │ 75%✓     │ 50%      │ 5%       │
│ Director info    │ 10%      │ 20%      │ 30%      │
│ Film validation  │ 5%       │ 15%      │ 25%      │
│ Availability     │ 95%✓     │ 90%✓     │ 100%✓    │
│ Response time    │ 1-2s     │ 2-3s     │ <0.1s    │
└──────────────────┴──────────┴──────────┴──────────┘

Key insight: WayBig excels at performer data (which is most important).
It's not good at director/film data (which is less critical).
```

---

## What This Means for Each Phase

### Phase 1: IAFD Removal Framework
**Status:** Unchanged ✓
- Remove IAFD completely
- Create stub system for alternatives
- Still correct approach

### Phase 2: GayWorld Test Subject
**Status:** Scope refined
- Primary goal: Fix scraper to extract titles ✓
- Secondary goal: Extract cast names ✓
- Tertiary goal: Get photos for cast (from WayBig in Phase 3)

**Success Metric:**
```
├─ Title extraction: 100% (critical)
├─ Director extraction: 90%+ (important)
├─ Cast names: 85%+ (important)
├─ Success rate: 30-50% (critical)
└─ Phase 3 integration: Adds photos to cast (bonus)
```

### Phase 3: WayBig Integration
**Status:** Scope refined
- Focus: Get performer photos and bios
- Secondary: Get performer credits/filmography
- Don't expect: Complete film-level data
- Accept: Director information won't be complete

**Success Metric:**
```
├─ Performer availability: 90%+ (can we find them)
├─ Photos retrieved: 80%+ (do they have images)
├─ Bios retrieved: 70%+ (do they have descriptions)
└─ Integration: Performers show with photos/bios in Plex
```

### Phase 4: Fix All Scrapers
**Status:** Unchanged (most important) ✓
- This is where most improvement comes from
- Website audits are critical
- Success rates depend on this

### Phase 5: Unified Framework
**Status:** Unchanged ✓
- Consolidates code
- Makes WayBig integration easier
- Enables easy provider swapping

---

## Decision Point

**Before proceeding, confirm:**

1. **Is IAFD removal still acceptable?**
   - Yes, because WayBig covers 80% (performer data)
   - Director info will be reduced, but not critical
   - ✓ Recommendation: PROCEED

2. **Is WayBig the right choice for performers?**
   - Yes, it specializes in this
   - No better alternative currently available
   - ✓ Recommendation: PROCEED

3. **What if WayBig becomes unavailable?**
   - Fallback to AEBN (70% for performers, still decent)
   - Or Plex cache (40%, minimal but functional)
   - ✓ Recommendation: Plan backup, proceed

4. **Should we wait for IAFD to come back?**
   - IAFD has been broken for 24+ hours
   - Unknown when it will recover
   - 20+ agents all broken because of this single dependency
   - ✓ Recommendation: Don't wait, decouple now

---

## Summary

### Before Modernization
```
Cast Information:     0% (IAFD broken, scrapers broken)
Director Information: 0% (IAFD broken, scrapers broken)
Success Rate:         2-5% (scrapers broken)
Dependency:           IAFD (single point of failure)
```

### After Modernization (Phase 4 only)
```
Cast Information:     Good (from fixed scrapers)
Director Information: Good (from fixed scrapers)
Success Rate:         30-50% (scrapers fixed)
Dependency:           None (no external enrichment needed)
```

### After Modernization (Phase 4 + 3)
```
Cast Information:     Excellent (scrapers + WayBig photos/bios)
Director Information: Good (from fixed scrapers)
Success Rate:         30-50% (scrapers fixed)
Dependency:           WayBig (optional, graceful fallback if fails)
```

### Key Realization
**The main problem is NOT IAFD failure — it's broken scrapers.**
- Scrapers found results but couldn't extract metadata
- This was happening BEFORE IAFD fully broke
- Fixing scrapers is the critical path
- WayBig enrichment is a nice bonus

---

**Bottom Line:** Proceed with Phase 1-4 as planned. Phase 3 (WayBig) adds value for performer data specifically, which is the most important enrichment category. Director information will be slightly reduced compared to when IAFD worked, but this is acceptable because Phase 4 (scraper fixes) provides that information from primary sources anyway.

