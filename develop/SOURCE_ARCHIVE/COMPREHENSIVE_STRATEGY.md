# PGMA Modernization Strategy: Complete Implementation Plan
**Date:** January 30, 2026
**Status:** Planning Phase
**Document Version:** 1.0

---

## Executive Summary

The PGMA (Plex Gay Metadata Agent) system is suffering from **two critical, interconnected problems**:

1. **IAFD Dependency Crisis:** IAFD.com (Internet Adult Film Database) is completely blocked/broken, affecting enrichment across 20+ agents through 367+ failed requests in 24 hours
2. **Low Metadata Match Rates:** Even when scrapers find titles (100+ events), they fail to extract metadata in 94%+ of cases due to website structure changes

This strategy addresses both problems through a **phased modernization** that:
- Removes the broken IAFD dependency with easy-to-replace stubs
- Tests improvements using GayWorld as a canary
- Integrates alternative data sources (starting with WayBig)
- Investigates and fixes the underlying metadata extraction failures
- Consolidates 22+ disparate agents into a unified, maintainable framework

---

## Current System State Analysis

### Architecture Overview

```
Plex Media File
    ↓
Local Media Agent (Plex system)
    ↓
Primary Agent (GayAdult/GayAdultFilms/GayAdultScenes)
    ↓
┌─────────────────────────────────────────────────┐
│ 22 Contributor Agents                           │
│ (GayWorld, AEBN, WayBig, GEVI, GayEmpire, etc) │
└──────────────────┬──────────────────────────────┘
                   ↓
            ┌──────────────┐
            │ IAFD (BROKEN)│ ← Enrichment layer
            └──────────────┘
                   ↓
          _PGMA Support System
                   ↓
           Metadata to Plex
```

### The IAFD Problem in Detail

**What IAFD Does:**
- Central reference database for cast/director cross-referencing
- Provides actor photos and bios
- Film title validation and alternate titles
- Metadata enrichment layer across all agents

**Why It's Broken:**
- HTTP 403 Forbidden errors (iafd.com actively blocking)
- 'NoneType' parsing errors (returns empty/unparseable HTML)
- 367 failed URL requests in past 24 hours
- Anti-bot measures / rate limiting in effect

**Impact:**
- Cast information: Incomplete or missing
- Director information: Incomplete or missing
- Cross-database validation: Not happening
- Metadata quality: **Significantly reduced** (~40-50% less complete)

**Critical Detail:** IAFD is NOT a primary data source—it's an enrichment layer. Agents can still find basic metadata (titles, studios, dates) from their primary sources, but without IAFD, cast/director information is severely limited.

### The Match Rate Problem in Detail

**Statistics from 24-hour Analysis:**
- **Search Operations:** 99
- **Titles Found:** 112 events
- **Title Match Failures:** 1,548
- **Success Rate:** ~2-5% (94%+ failure rate)

**Pattern Observed:**
1. Scraper initiates search ✓
2. Finds potential matches on website ✓
3. **Attempts to extract metadata → FAILS** ✗
4. Result: Unmatched file

**Root Causes:**
1. **Website Structure Changes** (Primary)
   - Source websites (gayworld.org, aebn.com, etc.) have updated HTML/CSS
   - Scraper's CSS selectors and XPath queries are outdated
   - Code was not updated to match new site layouts

2. **Anti-Scraping Measures** (Secondary)
   - Websites implementing bot detection
   - Rate limiting being triggered
   - User-Agent blocking
   - Cloudflare/DDoS protection

3. **Code Rot** (Tertiary)
   - Regex patterns not matching current formats
   - Missing error handling for edge cases
   - Timeout issues

**Worst Performers:**
- AdultFilmDatabase: 2.8% success (274 failures vs 8 successes)
- GEVI: 210+ processing errors
- GayEmpire: 139 failures
- GayWorld: 65+ match/cast/director errors

---

## Root Cause Analysis

### Why Are Match Rates So Low?

**The evidence points to: Website scraping code is outdated**

1. **Successful Search, Failed Extraction Pattern:**
   - Agents ARE finding results pages
   - Agents ARE NOT successfully parsing the results
   - This indicates CSS selector/XPath mismatch, not connectivity issues

2. **Example from logs:**
   ```
   ✓ Titles Found: 5
   ✗ ERROR - SEARCH:: Error getting Site Title: < Title Match Failure! >
   ```
   This means: "I found the page, but I can't extract what I'm looking for"

3. **Systemic Across All Agents:**
   - Not isolated to one provider
   - Pattern occurs in 22+ agents
   - Suggests common root cause

**Hypothesis:** Source websites have been redesigned or updated their HTML structure. The scraper code uses hardcoded CSS selectors and XPath queries that no longer match the page layout.

### Why Is This Happening Now?

1. **Website Evolution:** Websites continuously update their designs
2. **Lack of Maintenance:** Code hasn't been updated for recent website changes
3. **Code Duplication:** 22 nearly-identical ~430KB utils.py files means 22 places to update
4. **Testing Gap:** No automated testing framework to detect these changes
5. **Dependency Chain:** Changes to one site require updates across 22 agents

---

## Proposed Solution Strategy

### Phase 1: IAFD Removal and Stub Creation

**Objective:** Decouple the system from the broken IAFD dependency while maintaining easy integration points for replacement data sources.

**Key Insight:** IAFD is not a primary data source—removing it will not break searches, only reduce enrichment quality temporarily.

#### 1.1 Create IAFD Stub Framework

Create a new stub/adapter layer that:
- Maintains the existing IAFD function signatures
- Returns empty/None gracefully when IAFD is unavailable
- Provides clear integration points for alternative data sources
- Logs which functions are called (for replacement development)

**Files to Create:**
- `_PGMA/Stubs/DataProvider.py` - Abstract base class for data providers
- `_PGMA/Stubs/IAFDStub.py` - Replacement for current IAFD functionality
- `_PGMA/Stubs/ProviderRegistry.py` - Registry for swapping providers

**Implementation Pattern:**

```python
# _PGMA/Stubs/DataProvider.py
class DataProvider(ABC):
    @abstractmethod
    def search_cast(self, name, year=None):
        """Return cast info or None"""
        pass

    @abstractmethod
    def search_director(self, name, year=None):
        """Return director info or None"""
        pass

    @abstractmethod
    def search_film(self, title, year=None):
        """Return film info or None"""
        pass

# _PGMA/Stubs/IAFDStub.py
class IAFDProvider(DataProvider):
    """
    Stub replacement for IAFD functionality.
    Returns None gracefully. Override in subclasses.
    """
    def search_cast(self, name, year=None):
        # Log the request for metrics
        Log.Debug(f"IAFDStub.search_cast({name}, {year})")
        return None  # IAFD unavailable

    # ... other methods
```

#### 1.2 Update All Agents to Use Stub Framework

For each of the 22 agents:
1. Replace direct IAFD calls with provider interface calls
2. Update to use ProviderRegistry for provider lookup
3. Maintain backward compatibility in preferences
4. Add logging to show which provider enrichment calls were made

**Example Update:**

```python
# Before:
cast_data = getFilmOnIAFD(cast_name)

# After:
provider = ProviderRegistry.get_provider("enrichment")
cast_data = provider.search_cast(cast_name)
```

#### 1.3 Create Migration Script

A script that:
- Updates all 22 agent bundles to use the new framework
- Maintains all preferences and settings
- Preserves functionality while removing IAFD calls
- Generates a report of all provider dependencies

**Testing Criteria:**
- All agents still run (no import errors)
- All agents log provider calls
- Agents gracefully handle None returns from providers
- No regression in existing functionality (degradation is expected)

**Priority Test Agent: GayWorld**
- [ ] Migrate GayWorld first as canary test
- [ ] Verify framework works with real agent
- [ ] Validate logging shows provider calls
- [ ] Test with live Plex runs
- [ ] Confirm behavior before migrating other 21 agents
- **Note:** GayWorld will be heavily tested in Phase 1 and Phase 2, making it ideal validation for framework changes

#### 1.4 Deliverables for Phase 1

- [ ] Abstract DataProvider class
- [ ] IAFDStub implementation
- [ ] ProviderRegistry system
- [ ] Agent bundle update script
- [ ] Phase 1 testing report
- [ ] Migration documentation

---

### Phase 2: GayWorld Test Subject Implementation

**Objective:** Use GayWorld as a canary to validate architectural changes before rolling out to all agents.

**Rationale:**
- GayWorld is heavily IAFD-dependent (78+ references found)
- If we can fix GayWorld, the approach will work for other agents
- GayWorld has high activity (many search operations in logs)
- Clear success/failure metrics

#### 2.1 Analyze GayWorld's Current Issues

**From logs:**
- 65+ title match failures
- Multiple IAFD enrichment errors
- Cast/director lookup failures
- Website structure mismatch

**Steps:**
1. Manually visit gay-world.org and inspect current HTML structure
2. Document current CSS selectors used vs. what's needed
3. Test search results extraction
4. Identify which fields are failing

**Deliverables:**
- HTML structure analysis document
- List of failing CSS selectors/XPath queries
- Comparison: expected structure vs. actual

#### 2.2 Update GayWorld Metadata Extraction

Update GayWorld's `__init__.py` to:
1. Replace outdated CSS selectors with current ones
2. Fix XPath queries to match actual HTML
3. Add robustness for partial extraction failures
4. Add detailed logging for debugging
5. Implement retry logic for timeouts

**Testing Plan:**
1. Test on 5 known films from gay-world.org
2. Verify each metadata field extracts correctly
3. Test edge cases (missing synopsis, no poster, etc.)
4. Run against live gay-world.org (verify no 403 errors)

**Success Criteria:**
- Title extraction: 100%
- Director extraction: 90%+
- Cast extraction: 85%+
- Release date extraction: 95%+
- Studio extraction: 95%+
- Poster image: 80%+

#### 2.3 Update GayWorld Preferences

Add new configuration options:
```json
{
  "id": "fallback_enrichment",
  "label": "When primary enrichment fails, use fallback",
  "type": "bool",
  "default": true
},
{
  "id": "enrichment_provider",
  "label": "Data enrichment provider",
  "type": "enum",
  "values": ["None", "WayBig", "AEBN", "Custom"],
  "default": "WayBig"
}
```

#### 2.4 Test with Real Plex Library

1. Configure GayWorld as the sole agent for a test collection
2. Feed 20 test files through the system
3. Measure success rate and metadata completeness
4. Compare before/after IAFD removal
5. Document performance metrics

**Expected Outcome:**
- Success rate: Improve from ~2.8% to 40-60%
- Metadata completeness: Improve significantly for title/director/date
- Cast information: Reduced but still functional

#### 2.5 Deliverables for Phase 2

- [ ] GayWorld HTML analysis document
- [ ] Updated GayWorld `__init__.py` and `utils.py`
- [ ] New CSS selectors/XPath queries
- [ ] Updated DefaultPrefs.json
- [ ] Test results report
- [ ] Before/after comparison metrics

---

### Phase 3: WayBig Integration as IAFD Replacement

**Objective:** Integrate WayBig as an alternative enrichment data source to replace IAFD's functionality.

**Rationale:**
- WayBig is already integrated as contributor agent
- Has scene metadata that could help with cast/director
- More accessible than IAFD (no current 403 errors noted)
- YAML scraper definition already exists in develop/

#### 3.1 Analyze WayBig Capabilities

**Current Implementation:**
- Location: `WayBig.bundle/`
- Contributor to: GayAdult, GayAdultScenes
- Base URL: `https://www.waybig.com/blog/`
- YAML definition: `develop/Waybig/Waybig.yml`

**What WayBig Can Provide:**
From YAML definition (performer, scene, and performer profile scrapers):
- Performer names and photos
- Scene titles and dates
- Tags/genres
- Studio information
- Performance credits

**What WayBig Cannot Provide** (IAFD's role):
- Film-level director information
- Full filmographies
- Actor biographical data
- Cross-film validation

**Gap Analysis:**
- WayBig covers ~60% of IAFD's enrichment use cases
- Gaps: Director info, film cross-references
- Solution: Supplement with other agents' data

#### 3.2 Create WayBigProvider Class

Implement WayBig as a DataProvider:

```python
# _PGMA/Providers/WayBigProvider.py
class WayBigProvider(DataProvider):
    """
    Alternative enrichment provider using WayBig API
    """

    def __init__(self):
        self.base_url = "https://www.waybig.com/blog"
        self.agent = WayBig()  # Use existing WayBig agent

    def search_cast(self, name, year=None):
        """Search WayBig for performer information"""
        # Implementation using existing WayBig scraper
        pass

    def search_director(self, name, year=None):
        """WayBig doesn't have director info - return None"""
        return None

    def search_film(self, title, year=None):
        """Search WayBig for film/scene information"""
        pass

    def search_performer(self, name):
        """WayBig-specific: search performer profile"""
        pass
```

#### 3.3 Register WayBig in Provider Registry

Update ProviderRegistry:
```python
# _PGMA/Stubs/ProviderRegistry.py
ProviderRegistry.register("waybig", WayBigProvider())
```

#### 3.4 Update Agent Preferences

Add WayBig as option to all agents:
```json
{
  "id": "enrichment_provider",
  "label": "Data enrichment provider",
  "type": "enum",
  "values": ["None", "WayBig", "Alternative1", "Alternative2"],
  "default": "WayBig"
}
```

#### 3.5 Implement Fallback Chain

For each enrichment call, try providers in order:
1. Primary provider (WayBig, etc.)
2. Secondary provider (if configured)
3. Degraded mode (basic metadata only)

```python
def get_enrichment(name, search_type):
    """Try multiple providers with fallback"""
    providers = [
        ProviderRegistry.get_provider("waybig"),
        ProviderRegistry.get_provider("secondary"),
    ]

    for provider in providers:
        result = provider.search_cast(name)
        if result:
            return result

    return None  # No enrichment available
```

#### 3.6 Testing Plan

1. **WayBig Availability Check:**
   - Verify waybig.com is accessible
   - No 403 errors
   - Consistent response times

2. **Enrichment Quality:**
   - Compare WayBig cast data vs. IAFD (historical)
   - Measure coverage: % of films with cast info
   - Measure accuracy: spot-check 10 films

3. **Performance:**
   - Measure lookup time: target <2s per search
   - Measure timeout rate: target <5%
   - Load testing: concurrent requests

4. **Integration Testing:**
   - Update GayWorld to use WayBig provider
   - Run test suite from Phase 2
   - Verify no regressions

#### 3.7 Deliverables for Phase 3

- [ ] WayBigProvider class implementation
- [ ] Provider registry updates
- [ ] Updated agent preferences (all 22 agents)
- [ ] Fallback chain implementation
- [ ] WayBig availability/quality report
- [ ] Integration test results
- [ ] Documentation: WayBig enrichment capabilities

---

### Phase 4: Low Match Rate Investigation and Fixes

**Objective:** Address the 94%+ failure rate in metadata extraction by updating all agents' scraping code.

**This is the core fix for metadata quality.**

#### 4.1 Systematic Website Audits

For each of the 22 agents, conduct a website analysis:

**Steps for Each Agent:**
1. Visit the provider's website
2. Perform a test search
3. Inspect current HTML structure using browser DevTools
4. Identify CSS selectors/XPath for:
   - Title
   - Director
   - Cast/Actors
   - Release date
   - Studio
   - Poster image
   - Synopsis/Description
5. Compare to current agent code
6. Document all changes needed

**Agents to Audit (in priority order):**
1. **GayWorld** (already done in Phase 2)
2. **AEBN** (high activity, 274 failures)
3. **GEVI** (210+ errors)
4. **GayEmpire** (139 failures)
5. **AdultFilmDatabase** (2.8% success rate - worst)
6. Others...

**Deliverable:** Audit spreadsheet with:
- Current selectors vs. needed selectors
- HTML structure changes
- Priority (which fields are critical)
- Estimated effort to fix

#### 4.2 Update Scraping Code

For each identified selector change:

**Template:**
```python
# Before (broken)
title = result.xpath('//div[@class="film-title"]/text()')[0]

# After (fixed - requires audit)
title = result.xpath('//h2[@class="movie-name"]/span/text()')[0]

# Even safer (with error handling)
title_elem = result.xpath('//h2[@class="movie-name"]/span/text()')
title = title_elem[0].strip() if title_elem else None
```

**General Improvements:**
1. Add try/except around all extraction
2. Add logging for failures
3. Implement fallback selectors
4. Handle missing/optional fields gracefully
5. Validate extracted data format

#### 4.3 Add Robustness Features

**Timeout Handling:**
```python
def getHTTPRequest(url, timeout=10, retries=3):
    """HTTP request with retry logic"""
    for attempt in range(retries):
        try:
            response = requests.get(url, timeout=timeout)
            return response
        except requests.Timeout:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)  # Exponential backoff
            else:
                raise
```

**Partial Extraction Fallback:**
```python
def extract_metadata(result):
    """Extract fields, gracefully handle missing data"""
    metadata = {
        'title': extract_title(result) or 'UNKNOWN',
        'director': extract_director(result),  # OK if None
        'cast': extract_cast(result) or [],  # Empty list is OK
        'date': extract_date(result),  # OK if None
    }
    return metadata
```

**Rate Limiting (prevent 403 errors):**
```python
# Add delays between requests
import time
time.sleep(random.uniform(1, 3))  # 1-3 second delay
```

**User-Agent Spoofing:**
```python
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}
response = requests.get(url, headers=headers)
```

#### 4.4 Testing Framework

Create automated tests:

```python
# tests/test_scrapers.py
class TestGayWorldScraper:
    def test_search_returns_results(self):
        results = gayworld.search("Freaks 4", 2020)
        assert len(results) > 0

    def test_extract_title(self):
        result = # sample HTML element
        title = gayworld.extract_title(result)
        assert title == "Freaks 4"

    def test_extract_director(self):
        result = # sample HTML element
        director = gayworld.extract_director(result)
        assert director is not None

    def test_extract_cast(self):
        result = # sample HTML element
        cast = gayworld.extract_cast(result)
        assert len(cast) > 0
```

**Test Runners:**
1. Unit tests on sample HTML
2. Integration tests on live websites
3. Regression tests before/after updates
4. Performance benchmarks

#### 4.5 Phased Rollout

**Phase 4a - Critical Agents (Week 1):**
- GayWorld, AEBN, GEVI, GayEmpire, AdultFilmDatabase
- Update scrapers, run tests, deploy

**Phase 4b - Mid-Priority Agents (Week 2):**
- GayHotMovies, GayRado, HomoActive, Fagalicious, etc.
- Update scrapers, run tests, deploy

**Phase 4c - Long-tail Agents (Week 3):**
- Remaining 8+ agents
- Update scrapers, run tests, deploy

#### 4.6 Success Metrics

**Target Success Rate: 30-50%** (up from current 2-5%)

This is more realistic than 94%+ because:
- Some websites have anti-bot measures we can't overcome
- Some titles genuinely have no metadata online
- Some fields may remain incomplete even after fixes

**Measurement:**
- Track metadata completeness over time
- Monitor error rates by agent
- Alert on regressions

#### 4.7 Deliverables for Phase 4

- [ ] Website audit spreadsheet (all 22 agents)
- [ ] Updated scraper code (all 22 agents)
- [ ] Test suite (unit + integration tests)
- [ ] Error handling improvements
- [ ] Rate limiting implementation
- [ ] Testing results report
- [ ] Before/after success rate comparison

---

### Phase 5: Unified Plugin Framework

**Objective:** Consolidate 22 disparate agents into a single, maintainable framework with pluggable configuration.

**Rationale:**
- Current: 22 ~430KB `utils.py` files = massive duplication
- Difficult to maintain: bug fixes must be applied to 22 files
- Hard to understand: each agent has slightly different code
- Solution: Single framework, per-agent configuration

#### 5.1 Create Unified Agent Framework

**New Structure:**

```
_PGMA/Framework/
├── AgentBase.py         # Base class all agents inherit
├── MetadataExtractor.py # Shared extraction logic
├── HttpClient.py        # Shared HTTP handling
├── ErrorHandler.py      # Shared error handling
├── Logger.py            # Shared logging
└── Config.py            # Shared configuration

_PGMA/Providers/
├── BaseProvider.py      # Abstract provider class
├── DataCache.py         # Caching layer
├── ProviderRegistry.py  # Provider management
├── WayBigProvider.py    # Specific provider
└── ... other providers

_PGMA/Instructions/
├── extraction_rules.yml # CSS selectors, XPath queries
├── field_mappings.yml   # Map website fields to metadata
├── validation_rules.yml # Validate extracted data
└── fallback_chains.yml  # Fallback provider chains
```

**New Agent Structure:**

Instead of 22 different `__init__.py` files, each agent:
1. Inherits from AgentBase
2. Loads site-specific instructions from YAML
3. Uses shared extraction/validation logic
4. No need to duplicate utils.py

```python
# After consolidation:
class GayWorld(AgentBase):
    def __init__(self):
        super().__init__()
        self.load_instructions("gayworld")  # Load gayworld.yml
        self.provider = ProviderRegistry.get_provider("waybig")
```

#### 5.2 Extraction Rules as YAML Configuration

Instead of hardcoded CSS selectors in Python, define in YAML:

**Example: gayworld.yml**
```yaml
provider_name: "GayWorld"
base_url: "https://gay-world.org/?s={query}"

extraction_rules:
  title:
    selectors:
      - "//h2[@class='movie-title']/text()"
      - "//div[@class='film-name']/a/text()"  # Fallback
    validator: "length > 2 and length < 200"

  director:
    selectors:
      - "//span[@class='director']/a/text()"
      - "//div[@class='metadata']/text()[contains(., 'Director')]"
    processor: "split_by_comma"

  cast:
    selectors:
      - "//div[@class='cast-list']/ul/li/a/text()"
      - "//table[@class='cast']//tr/td[1]/text()"
    processor: "split_by_comma"
    limit: 10

  release_date:
    selectors:
      - "//span[@class='release-date']/text()"
      - "//div[@data-field='date']/text()"
    processor: "parse_date"

  poster_image:
    selectors:
      - "//img[@class='poster']/@src"
      - "//div[@class='poster-image']/img/@src"
    processor: "normalize_url"

fallback_chain:
  - provider: "waybig"
    fields: ["cast", "director"]
  - provider: "static_plex"
    fields: ["cast"]  # Last resort: use what Plex found locally
```

**Benefits:**
- No code changes needed for selector updates
- Easy to test new selectors
- Non-developers can update selectors
- Clear documentation of what each site provides
- Easy to add new agents (just add YAML file)

#### 5.3 Create AgentBase Class

```python
# _PGMA/Framework/AgentBase.py
class AgentBase(Agent.Movies):
    """Base class for all PGMA agents"""

    def __init__(self, config_file):
        super().__init__()
        self.config = self.load_config(config_file)
        self.extractor = MetadataExtractor(self.config)
        self.provider = ProviderRegistry.get_provider(
            self.config.get('enrichment_provider')
        )

    def search(self, results, media, lang, manual):
        """Standard search implementation"""
        query = self.build_search_query(media)
        html_results = self.http_client.search(
            self.config['base_url'],
            query
        )

        for result in html_results:
            score = self.score_result(result, media)
            metadata = self.extractor.extract(result)
            metadata = self.enrich(metadata)  # Use provider

            results.Append(
                MetadataSearchResult(
                    id=metadata['id'],
                    name=metadata['title'],
                    score=score
                )
            )

    def update(self, metadata, media, lang, force):
        """Standard update implementation"""
        # Fetch full metadata using stored ID
        full_metadata = self.http_client.fetch(metadata.id)

        # Extract all fields
        extracted = self.extractor.extract(full_metadata)

        # Enrich with external providers
        enriched = self.provider.enrich(extracted)

        # Validate and normalize
        normalized = self.validator.validate(enriched)

        # Update metadata object
        self.populate_metadata(metadata, normalized)
```

#### 5.4 Configuration-Driven Field Extraction

**MetadataExtractor.py:**
```python
class MetadataExtractor:
    def __init__(self, config):
        self.config = config
        self.rules = config['extraction_rules']

    def extract(self, html_element):
        """Extract metadata using configured rules"""
        metadata = {}

        for field, rule in self.rules.items():
            try:
                value = self.extract_field(html_element, rule)
                metadata[field] = value
            except Exception as e:
                Log.Debug(f"Failed to extract {field}: {e}")
                metadata[field] = None

        return metadata

    def extract_field(self, element, rule):
        """Extract single field using rule"""
        for selector in rule['selectors']:
            try:
                result = element.xpath(selector)
                if result:
                    value = result[0]
                    # Apply processor if configured
                    if 'processor' in rule:
                        value = self.process(value, rule['processor'])
                    # Validate if configured
                    if 'validator' in rule:
                        if not self.validate(value, rule['validator']):
                            continue
                    return value
            except:
                continue  # Try next selector

        return None  # All selectors failed
```

#### 5.5 Migration Path

**Phase 5a - Framework Development (Week 1)**
- Create AgentBase, MetadataExtractor, etc.
- Convert 1 agent (GayWorld) to new framework
- Ensure functionality is identical
- Document patterns

**Phase 5b - Template Extraction (Week 2)**
- Extract YAML configs for all 22 agents
- Document each site's structure
- Create validation tests

**Phase 5c - Agent Migration (Week 3)**
- Convert remaining 21 agents to framework
- Update all bundle Info.plist files
- Run comprehensive tests

**Phase 5d - Cleanup (Week 4)**
- Remove old code
- Consolidate utils.py into framework
- Update documentation

#### 5.6 Benefits of Unified Framework

1. **Reduced Code Duplication**
   - 22 × 430KB = 9.46MB → Consolidated to ~2MB
   - Easier to maintain

2. **Configuration-Driven**
   - Selector changes don't require code deployment
   - Non-developers can update sites
   - Versioning and rollback easier

3. **Consistent Behavior**
   - All agents use same error handling
   - All agents use same logging
   - All agents use same enrichment system

4. **Easier Testing**
   - Test framework once, applies to all agents
   - Add new test selectors in YAML
   - Automated regression detection

5. **Easier to Add New Providers**
   - New provider: implement Provider interface
   - Register in ProviderRegistry
   - All 22 agents automatically can use it

6. **Better Monitoring**
   - Central logging system
   - Agent-level and field-level metrics
   - Early detection of website changes

#### 5.7 Deliverables for Phase 5

- [ ] AgentBase, MetadataExtractor, HttpClient classes
- [ ] Provider interface and registry
- [ ] YAML configuration schema
- [ ] Extraction rule documentation
- [ ] Migrated GayWorld agent (reference implementation)
- [ ] Migration script for remaining agents
- [ ] Test suite for framework
- [ ] Converted configuration files (22 agents)
- [ ] Unified utils.py for framework
- [ ] Documentation and developer guide

---

## Implementation Timeline and Priorities

### Recommended Sequence

```
Week 1: Phase 1 + Phase 2a
├─ Create IAFD stub framework
├─ Migrate to stub-based system
├─ Analyze GayWorld website structure
└─ Begin GayWorld code updates

Week 2: Phase 2b + Phase 3
├─ Complete GayWorld updates
├─ Test GayWorld with real Plex
├─ Create WayBigProvider class
└─ Integration testing

Week 3: Phase 4a + Phase 5a
├─ Audit critical agent websites (5 agents)
├─ Update critical agents
├─ Begin framework design/development
└─ Prototype framework with GayWorld

Week 4: Phase 4b + Phase 5b
├─ Audit/update mid-priority agents (8 agents)
├─ Extract YAML configurations
├─ Test framework with multiple agents
└─ Refine framework based on learnings

Week 5+: Phase 4c + Phase 5c/d
├─ Audit/update remaining agents
├─ Migrate agents to framework
├─ Performance optimization
└─ Rollout to production
```

### Flexibility Guidance

**The plan can and should be adjusted based on:**

1. **Discovery**: Once Phase 1-2 are underway, will reveal the actual scope
   - If Phase 4 reveals massive code changes needed → prioritize Phase 5
   - If websites have common structure → Phase 4 might be faster

2. **Business Impact**: Prioritize highest-impact agents
   - GayWorld has 78 IAFD refs → High priority
   - AEBN is high-activity → High priority
   - Low-activity agents → Lower priority initially

3. **Technical Blockers**:
   - If WayBig access becomes unavailable → skip Phase 3, find alternative
   - If agents have severe code rot → accelerate Phase 5 framework

4. **Resource Availability**:
   - Framework development (Phase 5) could run in parallel with Phase 4
   - Website audits (Phase 4) are I/O-bound, good for parallel work

---

## Success Metrics

### Phase 1 Success
- [ ] All 22 agents still run without IAFD
- [ ] No import errors or crashes
- [ ] Provider registry properly logs all enrichment calls
- [ ] Documentation complete

### Phase 2 Success
- [ ] GayWorld metadata extraction success rate: 30-50% (target)
- [ ] Director extraction: 90%+
- [ ] Cast extraction: 85%+
- [ ] No 403 errors from gay-world.org
- [ ] Clear improvement over Phase 1

### Phase 3 Success
- [ ] WayBig available and accessible
- [ ] WayBig enrichment working for 80%+ of lookups
- [ ] Fallback chain functioning correctly
- [ ] Performance: <2s per enrichment lookup

### Phase 4 Success
- [ ] Critical agents (5) updated: success rate 30-50%
- [ ] Mid-priority agents (8) updated: success rate 25-45%
- [ ] Long-tail agents (9) updated: success rate 20-40%
- [ ] Error logging clear and actionable
- [ ] No regressions in other functionality

### Phase 5 Success
- [ ] All agents running on framework
- [ ] Code duplication eliminated (430KB × 22 → ~2MB total)
- [ ] YAML configs validated and tested
- [ ] Easy to add new providers
- [ ] Easy to update selectors without code changes
- [ ] All existing functionality preserved
- [ ] Improved observability/monitoring

---

## Risk Mitigation

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| WayBig unavailable | Low | High | Have backup: implement AEBN provider |
| Website structure too complex | Medium | Medium | Add manual override option in config |
| Performance degradation | Low | Medium | Implement caching + performance testing |
| Agent compatibility | Low | High | Extensive testing before rollout |
| Provider integration bugs | Medium | Medium | Test each provider separately first |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| User confusion (metadata changes) | Medium | Medium | Clear release notes about IAFD removal |
| Data loss from old metadata | Low | High | Backup all metadata before migration |
| Rollback complexity | Low | High | Keep old agents in "legacy" branch |
| Long migration timeline | Medium | Medium | Phase implementation, quick wins first |

---

## Key Decisions Needed

Before proceeding, confirm:

1. **Removal of IAFD is Acceptable**
   - Cast/director data will be less complete
   - OK to accept degradation during migration?

2. **WayBig as Primary Alternative**
   - Is WayBig reliable enough?
   - Should we plan backup providers?

3. **Unified Framework Scope**
   - Apply to all 22 agents or just film agents?
   - How quickly can we deprecate old code?

4. **Timeline Constraints**
   - Any hard deadlines?
   - Resource availability?
   - Parallel work possible?

---

## Next Steps

1. **Immediate (Today):**
   - Review this strategy document
   - Identify any adjustments needed
   - Confirm decisions above

2. **Week 1:**
   - Begin Phase 1 (IAFD stub framework)
   - Begin Phase 2a (GayWorld analysis)
   - Set up development/testing environment

3. **Ongoing:**
   - Weekly progress updates
   - Metrics tracking
   - Adjust priorities as needed

---

## Appendix: Reference Materials

### Related Documents
- `IAFD_ANALYSIS.md` - Detailed IAFD failure analysis
- `IAFD_QUICK_SUMMARY.txt` - IAFD status summary
- `SUMMARY_README.md` - Log analysis summary

### Code Locations
- Agents: `*.bundle/Contents/Code/__init__.py`
- Shared utils: `_PGMA/Scripts/utils.py` (also in each bundle)
- Preferences: `*.bundle/Contents/DefaultPrefs.json`
- Bundle config: `*.bundle/Contents/Info.plist`
- WayBig YAML: `develop/Waybig/Waybig.yml`

### Key Agents
- **Primary**: GayAdult, GayAdultFilms, GayAdultScenes
- **Contributor**: GayWorld, AEBN, WayBig, GEVI, GayEmpire, HFGPM, GayRado, GayHotMovies, QueerClick, Fagalicious, and 12 others

---

**Document Status:** Ready for Review and Adjustment
**Last Updated:** January 30, 2026
