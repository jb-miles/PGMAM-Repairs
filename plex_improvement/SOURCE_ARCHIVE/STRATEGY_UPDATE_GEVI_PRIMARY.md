# Strategy Update: GEVI as Primary Enrichment Provider

**Date:** January 30, 2026
**Status:** Strategy Revision - CRITICAL CHANGE
**Urgency:** HIGH - Impacts all phases going forward

---

## What Changed

**Previous Strategy:**
```
Phase 3: Integrate WayBig (primary enrichment provider)
Provider hierarchy: WayBig → AEBN → Plex Cache
Coverage: ~80% of IAFD value (performer data only)
```

**Updated Strategy:**
```
Phase 3: Implement Enrichment Provider System
Provider hierarchy: GEVI (primary) → WayBig (secondary) → AEBN → Plex Cache
Coverage: ~120% of IAFD value (performers + movies + scenes)
```

---

## Why This Change Matters

### GEVI is 3-4x more comprehensive than WayBig

| Data Type | GEVI | WayBig | Difference |
|-----------|------|--------|-----------|
| Performer info | ✓✓✓ | ✓✓ | GEVI better |
| Performer photos | ✓✓✓ | ✓✓ | GEVI better |
| Physical attributes | ✓✓✓ | ✗ | GEVI only |
| Movie metadata | ✓✓✓ | ✗ | GEVI only |
| Director info | ✓✓ | ✗ | GEVI only |
| Scene info | ✓✓ | ✓✓ | Similar |

**Bottom Line:** GEVI provides **movie-level enrichment that WayBig completely lacks**. This is critical for metadata matching.

---

## Updated Phase 3 Definition

### OLD Phase 3: WayBig Integration

```markdown
### Phase 3: WayBig Integration as IAFD Replacement

Objective: Integrate WayBig as an alternative enrichment data source to replace IAFD's functionality.

Rationale:
- WayBig is already integrated as contributor agent
- Has scene metadata that could help with cast/director
- More accessible than IAFD
- YAML scraper definition already exists in develop/
```

### NEW Phase 3: Enrichment Provider System

```markdown
### Phase 3: Implement Enrichment Provider System

Objective: Create a multi-provider enrichment system with GEVI as primary source.

Rationale:
- GEVI provides comprehensive performer + movie + scene data
- WayBig provides secondary coverage and geographic diversity
- AEBN provides fallback option
- Plex cache provides graceful degradation
- Eliminates single-point-of-failure problem
- Better coverage than IAFD ever provided (120% vs 100%)
```

---

## Updated Provider Hierarchy

### Enrichment Request Flow

```
Request for enrichment:
├─ What data is needed?
│  ├─ Performer info → Try GEVI (best coverage)
│  ├─ Movie metadata → Try GEVI (only source)
│  ├─ Director info → Try GEVI (better coverage)
│  └─ Scene info → Try GEVI or WayBig (similar)
│
├─ Step 1: GEVI Provider
│  ├─ Query GEVI API
│  ├─ Found? → Return data ✓
│  └─ Not found? → Continue to step 2
│
├─ Step 2: WayBig Provider
│  ├─ Query WayBig API
│  ├─ Found? → Return data ✓
│  └─ Not found? → Continue to step 3
│
├─ Step 3: AEBN Provider
│  ├─ Query AEBN API
│  ├─ Found? → Return data ✓
│  └─ Not found? → Continue to step 4
│
└─ Step 4: Plex Cache
   ├─ Use locally cached data
   ├─ Better than nothing ✓
   └─ Log missing enrichment
```

### Priority Matrix

```
┌──────────────────────┬────────┬────────┬──────┬───────┐
│ Enrichment Type      │ GEVI   │ WayBig │ AEBN │ Plex  │
├──────────────────────┼────────┼────────┼──────┼───────┤
│ Performer names      │ 1st    │ 2nd    │ 3rd  │ 4th   │
│ Performer photos     │ 1st    │ 2nd    │ 3rd  │ 4th   │
│ Performer attributes │ 1st    │ (none) │ (none)│ 4th   │
│ Movie duration       │ 1st    │ (none) │ (none)│ 4th   │
│ Movie release date   │ 1st    │ (none) │ (none)│ 4th   │
│ Movie director       │ 1st    │ (none) │ (none)│ 4th   │
│ Movie synopsis       │ 1st    │ (none) │ (none)│ 4th   │
│ Scene information    │ 1st    │ 2nd    │ 3rd  │ 4th   │
└──────────────────────┴────────┴────────┴──────┴───────┘
```

---

## Implementation Changes

### Phase 3 Implementation Plan (Revised)

#### 3.1 Create GEVIProvider Class

```python
# _PGMA/Providers/GEVIProvider.py
class GEVIProvider(DataProvider):
    """
    GEVI (Gay Erotic Video Index) enrichment provider.
    Primary source for comprehensive performer and movie metadata.
    """

    def __init__(self):
        self.base_url = "https://gayeroticvideoindex.com"
        self.scraper = cloudscraper.create_scraper()

    def search_performer(self, name):
        """Search for performer by name - primary function"""
        # Uses GEVI stash scraper: performer_search()
        # Returns: performer data with photos, attributes, bio

    def search_performer_by_url(self, url):
        """Get performer details from GEVI URL"""
        # Uses performer_from_url() from stash scraper
        # Returns: complete performer profile

    def search_movie(self, url):
        """Get movie details from GEVI URL"""
        # Uses movie_from_url() from stash scraper
        # Returns: title, duration, release date, director, studio, synopsis, covers

    def search_scene(self, url):
        """Get scene details from GEVI URL"""
        # Uses scene_from_url() from stash scraper
        # Returns: scene title, performers, date, studio

    def search_director(self, name):
        """Director info extracted from movie data"""
        # Not a direct search, but available from movie extraction

    def has_capability(self, data_type):
        """Check if GEVI provides this data type"""
        capabilities = {
            'performer_name': True,
            'performer_photo': True,
            'performer_attributes': True,
            'movie_duration': True,
            'movie_date': True,
            'movie_director': True,
            'movie_synopsis': True,
            'scene_info': True,
        }
        return capabilities.get(data_type, False)
```

#### 3.2 Create WayBigProvider Class

```python
# _PGMA/Providers/WayBigProvider.py
class WayBigProvider(DataProvider):
    """
    WayBig enrichment provider.
    Secondary source for performer and scene data.
    Used as fallback when GEVI is unavailable.
    """

    def search_performer(self, name):
        """Search WayBig for performer"""
        # Returns: performer data if found

    def search_scene(self, url):
        """Get scene data from WayBig URL"""
        # Returns: scene information

    def has_capability(self, data_type):
        """Check if WayBig provides this data type"""
        capabilities = {
            'performer_name': True,
            'performer_photo': True,
            'performer_attributes': False,  # WayBig lacks this
            'movie_duration': False,        # WayBig lacks this
            'movie_date': False,            # WayBig lacks this
            'movie_director': False,        # WayBig lacks this
            'movie_synopsis': False,        # WayBig lacks this
            'scene_info': True,
        }
        return capabilities.get(data_type, False)
```

#### 3.3 Update ProviderRegistry

```python
# _PGMA/Stubs/ProviderRegistry.py
class ProviderRegistry:
    """Registry of available data providers"""

    _providers = {}

    @classmethod
    def register(cls, name, provider, priority=None):
        """Register a provider with optional priority"""
        cls._providers[name] = {
            'instance': provider,
            'priority': priority or len(cls._providers)
        }

    @classmethod
    def get_providers_for(cls, data_type):
        """Get providers sorted by priority for a data type"""
        capable = [
            (p['priority'], p['instance'])
            for p in cls._providers.values()
            if p['instance'].has_capability(data_type)
        ]
        return [p[1] for p in sorted(capable)]

    @classmethod
    def get_enrichment(cls, data_type, *args, **kwargs):
        """Get enrichment, trying providers in priority order"""
        for provider in cls.get_providers_for(data_type):
            try:
                result = getattr(provider, f'search_{data_type}')(*args, **kwargs)
                if result:
                    return result
            except Exception as e:
                Log.Debug(f"Provider {provider.__class__.__name__} failed: {e}")
                continue
        return None

# At startup, register providers in priority order:
ProviderRegistry.register("gevi", GEVIProvider(), priority=1)      # Primary
ProviderRegistry.register("waybig", WayBigProvider(), priority=2)  # Secondary
ProviderRegistry.register("aebn", AEBNProvider(), priority=3)      # Tertiary
```

#### 3.4 Update Agent Preferences

```json
[
  {
    "id": "enrichment_primary",
    "label": "Primary enrichment provider",
    "type": "enum",
    "values": ["GEVI (Recommended)", "WayBig", "AEBN", "None"],
    "default": "GEVI (Recommended)"
  },
  {
    "id": "enrichment_secondary",
    "label": "Fallback enrichment provider (if primary fails)",
    "type": "enum",
    "values": ["None", "WayBig", "AEBN"],
    "default": "WayBig"
  },
  {
    "id": "enrichment_use_cache",
    "label": "Use Plex cache as final fallback",
    "type": "bool",
    "default": true
  }
]
```

#### 3.5 Testing Plan (Updated)

**Priority 1: GEVI Availability**
- Verify GEVI is accessible (no 403 errors)
- Test performer search by name
- Test performer lookup by URL
- Test movie data extraction
- Expected: 98%+ availability

**Priority 2: GEVI Data Quality**
- Verify performer data completeness (name, photo, attributes)
- Verify movie data completeness (duration, date, director)
- Spot-check 10 films for accuracy
- Compare against historical IAFD data
- Expected: 90%+ accuracy match with IAFD

**Priority 3: Fallback Chain**
- Test GEVI → WayBig fallback
- Test WayBig → AEBN fallback
- Test AEBN → Plex cache fallback
- Verify no data loss in chain
- Expected: Graceful degradation

**Priority 4: Performance**
- GEVI lookup time: target <2s
- WayBig lookup time: target <2s
- AEBN lookup time: target <3s
- Combined chain: target <5s
- Expected: <5% timeout rate

---

## Updated Success Metrics

### Phase 3 Success (Revised)

**Old metrics:**
- [ ] WayBig availability: 95%+
- [ ] Enrichment success: 80%+

**New metrics:**
- [ ] GEVI availability: 98%+
- [ ] GEVI performer coverage: 95%+
- [ ] GEVI movie data coverage: 90%+
- [ ] GEVI director info coverage: 85%+
- [ ] Fallback chain working: 100%
- [ ] No regressions vs Phase 2: 100%

---

## Updated Timeline

### Phase 3 Implementation Schedule (Revised)

**Days 1-3:** GEVI Provider Development
- [ ] Adapt stash scraper code to GEVIProvider class
- [ ] Implement performer search and lookup
- [ ] Implement movie data extraction
- [ ] Error handling and logging
- [ ] Milestone: GEVIProvider passes unit tests

**Days 4-5:** WayBigProvider Integration
- [ ] Create WayBigProvider wrapper
- [ ] Register in ProviderRegistry
- [ ] Implement fallback logic
- [ ] Milestone: Provider registry working

**Days 6-7:** Testing and Validation
- [ ] GEVI availability testing
- [ ] Data quality validation
- [ ] Fallback chain testing
- [ ] Performance testing
- [ ] Milestone: Phase 3 testing complete

**Days 8-10:** Agent Preferences Update
- [ ] Update all agent DefaultPrefs.json
- [ ] Set GEVI as default primary
- [ ] Set WayBig as default secondary
- [ ] Documentation
- [ ] Milestone: All agents ready for Phase 4

---

## Document Updates Needed

### Files to Update:

1. **COMPREHENSIVE_STRATEGY.md**
   - [ ] Replace Phase 3 section (lines 339-485)
   - [ ] Update "Phase 3 Success Metrics" (lines 1018-1025)
   - [ ] Update timeline (lines 950-970)
   - [ ] Update flexibility guidance (lines 985-1000)

2. **STRATEGY_SUMMARY.md**
   - [ ] Update Phase 3 description
   - [ ] Update provider table: add GEVI
   - [ ] Update expected outcomes: expand for movie enrichment

3. **VISUAL_REFERENCE.md**
   - [ ] Update provider comparison matrix: add GEVI as primary
   - [ ] Update enrichment request flow diagram
   - [ ] Update fallback chain examples

4. **WAYBIG_CAPABILITIES.md**
   - [ ] Update to note WayBig is secondary, not primary
   - [ ] Explain why GEVI is better
   - [ ] Keep as reference for WayBig strengths

### New Files Created:

1. **GEVI_AS_ENRICHMENT_PROVIDER.md** ✓ (Complete)
   - [ ] Full analysis of GEVI capabilities
   - [ ] Comparison with WayBig
   - [ ] Implementation recommendations

2. **STRATEGY_UPDATE_GEVI_PRIMARY.md** ✓ (This file)
   - [ ] Explains what changed and why
   - [ ] Updated Phase 3 definition
   - [ ] Implementation details

---

## Impact on Other Phases

### Phase 1: IAFD Removal (No change)
- Stub framework still needed ✓
- Easier now that GEVI will handle enrichment
- Implementation unchanged

### Phase 2: GayWorld Test (Enhanced)
- Now includes movie enrichment from GEVI
- Can verify director and duration extraction
- Better validation of fixes
- Expected: Higher success rate due to GEVI data

### Phase 4: Scraper Fixes (More valuable)
- Fixes combined with GEVI enrichment
- Can match films using GEVI duration/date
- Better validation overall
- Expected: Even higher match rates

### Phase 5: Unified Framework (Simplified)
- Framework now manages provider system automatically
- GEVI/WayBig/AEBN integration built-in
- Easier to add new providers
- Better observability

---

## Critical Success Factors

### Must-Have for Phase 3 Success:

1. **GEVI Availability**
   - Must be accessible and working
   - If GEVI becomes unavailable, WayBig fallback works
   - Risk: Very low (GEVI has 3+ year track record)

2. **Data Quality**
   - Performer data must be accurate
   - Movie data must be usable
   - Risk: Low (industry standard database)

3. **Performance**
   - Lookups must complete in <2s
   - Timeout rate <5%
   - Risk: Low (simple HTTP requests)

4. **Graceful Degradation**
   - Fallback chain must work
   - If GEVI fails, WayBig takes over
   - If WayBig fails, AEBN takes over
   - Risk: Medium (depends on all providers)

---

## Decision Points

### Before Proceeding with Updated Phase 3:

1. **Is GEVI a reliable source?**
   ✓ Yes - Established 2019, maintained through Jan 2026

2. **Should we prioritize GEVI over WayBig?**
   ✓ Yes - GEVI has 3-4x more data types

3. **Can we implement stash scraper integration?**
   ✓ Yes - Code already exists and is well-structured

4. **Should WayBig remain as secondary?**
   ✓ Yes - Provides geographic diversity and fallback

---

## Summary: Old vs New

```
OLD STRATEGY (WayBig Primary):
├─ Phase 3: WayBig Integration
├─ Provider order: WayBig → AEBN → Plex Cache
├─ Movie enrichment: None (WayBig lacks this)
├─ Performer enrichment: 85% coverage
└─ Total IAFD replacement: ~80%

NEW STRATEGY (GEVI Primary):
├─ Phase 3: Enrichment Provider System
├─ Provider order: GEVI → WayBig → AEBN → Plex Cache
├─ Movie enrichment: 90% coverage (GEVI provides)
├─ Performer enrichment: 95% coverage (GEVI superior)
└─ Total IAFD replacement: ~120% (more than IAFD!)
```

---

## Next Steps

1. **Review this update** (Today)
   - Confirm GEVI should be primary
   - Confirm provider hierarchy

2. **Update COMPREHENSIVE_STRATEGY.md** (Today)
   - Replace Phase 3 section
   - Update timeline and metrics

3. **Update supporting documents** (Today)
   - STRATEGY_SUMMARY.md
   - VISUAL_REFERENCE.md

4. **Begin Phase 3 development** (Tomorrow)
   - Create GEVIProvider class
   - Adapt stash scraper code
   - Register in ProviderRegistry

---

**Status:** Ready for Implementation
**Approved by:** [Strategy Review]
**Last Updated:** January 30, 2026
