# PGMA Modernization Strategy: Official Master Plan

**Version:** 2.0 (Final)
**Date:** January 30, 2026
**Status:** Ready for Implementation
**Priority:** CRITICAL - Addresses fundamental system failures

---

## Executive Summary

The PGMA (Plex Gay Metadata Agent) system faces two interconnected critical failures that must be addressed through a coordinated 5-phase modernization program:

### The Crisis
1. **IAFD Complete Failure** - 367 failed requests in 24 hours, 403 blocking, rendering enrichment system non-functional
2. **Scraper Metadata Extraction Crisis** - 94%+ failure rate despite successful search operations; websites have structural changes that break hardcoded CSS selectors
3. **Architectural Fragility** - 22 identical ~430KB utils.py files with no shared framework, making maintenance nearly impossible

### The Vision
Transform PGMA from a fragile, 2-5% success rate system into a sustainable, 30-50% success rate platform through:
- Decoupling from broken IAFD dependency
- Replacing with multi-provider enrichment system (GEVI primary, WayBig secondary)
- Systematic scraper remediation across all 22 agents
- Consolidation into unified, configuration-driven framework

### Timeline & Scope
- **Duration:** 4-5 weeks
- **Phases:** 5 integrated workstreams
- **Expected Outcome:** 10x improvement in metadata match rates + sustainable codebase

---

## Part I: Problem Analysis

### Problem 1: IAFD Dependency Failure

**Current State:**
- IAFD.com returns HTTP 403 Forbidden errors
- NoneType parsing failures (no HTML returned)
- 367 failed enrichment requests in past 24 hours
- All 20+ agents affected simultaneously

**Impact:**
- Cast information incomplete or missing (0% enrichment)
- Director information incomplete or missing
- No cross-database validation
- Reduced metadata quality (40-50% less complete)
- **Critical:** IAFD is enrichment layer only, not primary source

**Root Cause:**
- Anti-bot measures / rate limiting on iafd.com
- Possible Cloudflare/DDoS protection
- User-agent blocking
- Server-side changes

**Evidence:**
- Log analysis shows 367 failed URL requests
- Pattern: agents successfully find results, fail to enrich with IAFD
- Affects: GayWorld (9+ errors), GayEmpire, GayRado, HFGPM, GayHotMovies, others
- Configuration shows matchiafdduration set to false (secondary use)

### Problem 2: Metadata Extraction Failure Rate

**Statistics:**
- Search operations: 99 (past 24 hours)
- Titles found: 112 events
- Successful extractions: ~5-10 (2-5% success rate)
- Title match failures: 1,548 (94%+ failure rate)

**Failure Pattern:**
```
1. Scraper initiates search → ✓ Success
2. Finds potential matches on website → ✓ Success
3. Attempts metadata extraction from match → ✗ FAILS
4. Result: File remains unmatched
```

**Key Insight:** Scrapers can find websites but cannot extract data from them.

**Root Causes:**

1. **Primary: Website Structure Changes** (Most likely)
   - Source websites (gayworld.org, aebn.com, etc.) updated HTML/CSS
   - Scraper code uses hardcoded CSS selectors that no longer match
   - Example: Old selector `//div[@class="film-title"]` no longer exists
   - Need to update selectors for current site structure

2. **Secondary: Anti-Scraping Measures**
   - Websites implementing bot detection
   - Rate limiting triggered by multiple requests
   - User-agent blocking
   - Cloudflare/DDoS protection

3. **Tertiary: Code Rot**
   - Regex patterns not matching current format
   - Missing error handling for edge cases
   - Timeout issues (no retry logic)
   - Incomplete HTML parsing

**Worst Performers:**
- AdultFilmDatabase: 2.8% success rate (274 failures vs 8 successes)
- GEVI: 210+ processing errors
- GayEmpire: 139 failures
- GayWorld: 65+ failures
- AEBN: Similar pattern (hundreds of failures)

### Problem 3: Code Maintainability Crisis

**Scale of Duplication:**
- 22 agent bundles, each containing ~430KB `utils.py`
- Total: 9.46MB of nearly identical code
- Changes must be applied to 22 separate locations
- No shared error handling, logging, or extraction framework

**Maintenance Burden:**
- Bug fix in utils.py requires updates to 22 files
- Website HTML changes require updates to 22 agents
- Testing must be done 22 ways
- Deployment requires 22 bundle updates
- High risk of inconsistency between implementations

---

## Part II: Strategic Solution

### Phase 1: IAFD Removal and Provider Framework

**Objective:** Decouple from broken IAFD dependency while establishing clear integration points for alternative data sources.

**Duration:** Week 1

**Key Principle:** IAFD is enrichment layer (not primary source) - agents can still function without it.

#### Implementation

**1.1 Create DataProvider Abstract Framework**

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

    @abstractmethod
    def search_performer(self, name):
        """Return performer profile or None"""
        pass

    def has_capability(self, capability_type):
        """Check if this provider can handle this data type"""
        return False
```

**1.2 Create IAFDStub Implementation**

```python
# _PGMA/Stubs/IAFDStub.py
class IAFDStub(DataProvider):
    """Graceful replacement for broken IAFD functionality"""

    def search_cast(self, name, year=None):
        Log.Debug(f"IAFDStub.search_cast({name}, {year}) - IAFD unavailable")
        return None

    def search_director(self, name, year=None):
        Log.Debug(f"IAFDStub.search_director({name}, {year}) - IAFD unavailable")
        return None

    def search_film(self, title, year=None):
        Log.Debug(f"IAFDStub.search_film({title}, {year}) - IAFD unavailable")
        return None

    def search_performer(self, name):
        Log.Debug(f"IAFDStub.search_performer({name}) - IAFD unavailable")
        return None
```

**1.3 Create Provider Registry**

```python
# _PGMA/Stubs/ProviderRegistry.py
class ProviderRegistry:
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
        """Get providers capable of handling data_type, sorted by priority"""
        capable = [
            (p['priority'], p['instance'])
            for p in cls._providers.values()
            if p['instance'].has_capability(data_type)
        ]
        return [p[1] for p in sorted(capable)]

    @classmethod
    def get_enrichment(cls, data_type, *args, **kwargs):
        """Try enrichment providers in priority order"""
        for provider in cls.get_providers_for(data_type):
            try:
                result = getattr(provider, f'search_{data_type}')(*args, **kwargs)
                if result:
                    return result
            except Exception as e:
                Log.Debug(f"Provider {provider.__class__.__name__} failed: {e}")
                continue
        return None
```

**1.4 Update All Agents**

Replace direct IAFD calls:
```python
# Before:
cast_data = getFilmOnIAFD(cast_name)

# After:
provider = ProviderRegistry.get_provider("enrichment")
cast_data = provider.search_cast(cast_name)
```

**Success Criteria:**
- All 22 agents run without import errors
- No direct IAFD calls in agent code
- Provider registry logs all enrichment attempts
- Agents gracefully handle None returns from providers
- Framework ready for Phase 2 AEBN migration

---

### Phase 2: AEBN Test Subject Implementation

**Objective:** Use AEBN as canary test to validate scraper fix approach before scaling to all 22 agents.

**Duration:** Week 1-2

**Rationale:** AEBN is median complexity (296 lines vs 226-480 for other agents), representative of 5-6 similar agents, has advanced features (multi-page, age-gate, studio matching) that prove framework robustness. Recent activity (Jan 30, 2026 age-gate fix) shows active maintenance and real-world usage patterns. Success with AEBN validates approach for all 22 agents.

#### Implementation

**2.1 Website Structure Analysis**

Conduct detailed audit of aebn.com:

1. **Current HTML Structure:**
   - Visit site, perform test searches
   - Inspect HTML using DevTools
   - Document CSS classes and XPath patterns
   - Take screenshots of current layout

2. **Identify Failing Selectors:**
   - Compare code selectors to actual page structure
   - Document what changed
   - Identify fallback selectors where possible

3. **Priority Fields:**
   - Title (critical)
   - Director (important)
   - Cast/Actors (important)
   - Release date (important)
   - Studio (nice-to-have)
   - Poster image (nice-to-have)
   - Synopsis (nice-to-have)

**Deliverable:** HTML structure analysis document with before/after selectors.

**2.2 Update Scraper Code**

For each identified selector change:

```python
# Example: Fixing title extraction
# OLD (broken - no longer matches)
title = result.xpath('//div[@class="film-title"]/text()')[0]

# NEW (fixed - matches current HTML)
title = result.xpath('//h2[@class="movie-name"]/span/text()')[0]

# SAFE (with error handling)
title_elem = result.xpath('//h2[@class="movie-name"]/span/text()')
if title_elem:
    title = title_elem[0].strip()
else:
    # Try fallback selector
    title_elem = result.xpath('//div[@class="title"]/text()')
    title = title_elem[0].strip() if title_elem else None
```

**General Improvements:**
- Add try/except around all extraction
- Add detailed logging for failures
- Implement fallback selectors
- Validate extracted data format
- Handle missing/optional fields gracefully

**2.3 Add Robustness Features**

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

**Rate Limiting (prevent 403 errors):**
```python
import time
import random
# Add delays between requests
time.sleep(random.uniform(1, 3))  # 1-3 second random delay
```

**User-Agent Spoofing:**
```python
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}
response = requests.get(url, headers=headers)
```

**2.4 Testing and Validation**

**Unit Tests:**
```python
class TestAEBNScraper:
    def test_search_returns_results(self):
        results = aebn.search("Freaks 4", 2020)
        assert len(results) > 0

    def test_extract_title(self):
        result = get_sample_html()
        title = gayworld.extract_title(result)
        assert title == "Freaks 4"

    def test_extract_director(self):
        result = get_sample_html()
        director = gayworld.extract_director(result)
        assert director is not None

    def test_extract_cast(self):
        result = get_sample_html()
        cast = gayworld.extract_cast(result)
        assert len(cast) > 0
```

**Integration Testing:**
- Test on 20-30 known films from aebn.com
- Verify success rate 30-50% or better
- Check each metadata field extracts correctly
- Test edge cases (missing director, no poster, etc.)

**Success Metrics:**
- Title extraction: 100%
- Director extraction: 90%+
- Cast extraction: 85%+
- Release date extraction: 95%+
- Overall success rate: 30-50% (vs current 2-5%)

**Deliverables:**
- AEBN migrated to framework (minimal __init__.py)
- New aebn.yml with corrected CSS selectors and XPath
- Test results document (20-30 films tested)
- Before/after comparison metrics

---

### Phase 3: Enrichment Provider System

**Objective:** Implement multi-provider enrichment architecture with GEVI as primary, WayBig as secondary fallback.

**Duration:** Week 2

**Critical Decision:** GEVI is primary, not WayBig, due to 3-4x better data coverage.

#### Why GEVI Over WayBig?

| Feature | GEVI | WayBig | Difference |
|---------|------|--------|-----------|
| Performer names | 95% | 85% | GEVI better |
| Performer photos | 90% | 80% | GEVI better |
| Physical attributes | 95% | 0% | **GEVI only** |
| Movie duration | 90% | 0% | **GEVI only** |
| Movie release date | 90% | 0% | **GEVI only** |
| Movie director | 85% | 0% | **GEVI only** |
| Scene information | 90% | 85% | Similar |

**Total Coverage:** GEVI ~92% vs WayBig ~54% (relative to IAFD's use cases)

#### Implementation

**3.1 Create GEVIProvider Class**

Adapted from stash scraper in `develop/GEVI/GEVI.py`:

```python
# _PGMA/Providers/GEVIProvider.py
class GEVIProvider(DataProvider):
    """GEVI enrichment provider - primary source for comprehensive data"""

    def __init__(self):
        self.base_url = "https://gayeroticvideoindex.com"
        self.scraper = cloudscraper.create_scraper()

    def search_performer(self, name):
        """Search for performer by name"""
        results = self._performer_search(name)
        if results:
            return self._performer_from_url(results[0]['url'])
        return None

    def search_performer_by_url(self, url):
        """Get performer details from GEVI URL"""
        return self._performer_from_url(url)

    def search_movie(self, url):
        """Get movie details from GEVI URL"""
        return self._movie_from_url(url)

    def search_scene(self, url):
        """Get scene details from GEVI URL"""
        return self._scene_from_url(url)

    def search_director(self, name):
        """Director info extracted from movie data"""
        # Not a direct search, available from movie extraction
        return None

    def has_capability(self, data_type):
        """Check if GEVI provides this data type"""
        return data_type in [
            'performer_name', 'performer_photo', 'performer_attributes',
            'movie_duration', 'movie_date', 'movie_director', 'movie_synopsis',
            'scene_info'
        ]

    # Helper methods adapted from stash scraper...
```

**GEVI Performer Data Output:**
```python
{
    "name": "performer name",
    "urls": ["https://gevi.com/performer/..."],
    "image": "https://gevi.com/Stars/...",
    "hair_color": "Blonde",
    "eye_color": "Blue",
    "height": "180",  # cm
    "penis_length": "18",  # cm
    "weight": "75",  # kg
    "circumcised": "Cut",
    "tattoos": "Tribal chest piece",
    "ethnicity": "Caucasian",
    "country": "US",
    "birthdate": "1985-01-01",
    "aliases": "John Doe, JD, The John",
    "details": "Bio/Notes from GEVI"
}
```

**GEVI Movie Data Output:**
```python
{
    "name": "Film Title",
    "url": "https://gevi.com/video/...",
    "front_image": "https://gevi.com/Covers/...",
    "back_image": "https://gevi.com/Covers/...",
    "synopsis": "Full film description",
    "duration": "120:00",  # MM:SS format
    "date": "2023-01-01",  # Release year
    "director": "Director Name, Another Director",
    "studio": {
        "name": "Studio Name",
        "url": "https://gevi.com/company/...",
        "parent": {
            "name": "Distributor",
            "url": "https://gevi.com/company/..."
        }
    }
}
```

**3.2 Create WayBigProvider Class**

```python
# _PGMA/Providers/WayBigProvider.py
class WayBigProvider(DataProvider):
    """WayBig enrichment provider - secondary source and fallback"""

    def __init__(self):
        self.base_url = "https://www.waybig.com/blog"
        self.agent = WayBig()  # Use existing WayBig agent

    def search_performer(self, name):
        """Search WayBig for performer"""
        # Implementation using existing WayBig scraper
        pass

    def search_scene(self, url):
        """Get scene data from WayBig URL"""
        pass

    def has_capability(self, data_type):
        """WayBig provides limited data types"""
        return data_type in [
            'performer_name', 'performer_photo', 'scene_info'
        ]
```

**3.3 Update ProviderRegistry Initialization**

At agent startup:
```python
# Initialize provider hierarchy
ProviderRegistry.register("gevi", GEVIProvider(), priority=1)      # Primary
ProviderRegistry.register("waybig", WayBigProvider(), priority=2)  # Secondary
ProviderRegistry.register("aebn", AEBNProvider(), priority=3)      # Tertiary
```

**3.4 Update Agent Preferences**

All 22 agents get updated DefaultPrefs.json:
```json
{
  "id": "enrichment_primary",
  "label": "Primary enrichment provider",
  "type": "enum",
  "values": ["GEVI (Recommended)", "WayBig", "AEBN", "None"],
  "default": "GEVI (Recommended)"
},
{
  "id": "enrichment_secondary",
  "label": "Fallback enrichment provider",
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
```

**3.5 Implement Fallback Chain**

For any enrichment request:
```python
def enrich_cast(cast_name):
    """Try enrichment providers in priority order"""
    providers = [
        ProviderRegistry.get_provider("gevi"),
        ProviderRegistry.get_provider("waybig"),
        ProviderRegistry.get_provider("aebn"),
    ]

    for provider in providers:
        try:
            result = provider.search_performer(cast_name)
            if result:
                Log.Debug(f"Enrichment found via {provider.__class__.__name__}")
                return result
        except Exception as e:
            Log.Debug(f"Provider {provider.__class__.__name__} failed: {e}")
            continue

    Log.Debug(f"No enrichment available for {cast_name}")
    return None  # Graceful degradation
```

**Success Metrics:**
- GEVI availability: 98%+
- Performer lookup success: 95%+
- Movie data extraction: 90%+
- Director info extraction: 85%+
- Fallback chain: 100% operational
- Performance: <2s per lookup

**Deliverables:**
- GEVIProvider implementation
- WayBigProvider implementation
- ProviderRegistry updates
- Agent preference updates (22 files)
- Testing report

---

### Phase 4: Systematic Scraper Remediation

**Objective:** Fix metadata extraction for all 22 agents by updating outdated CSS selectors and adding robustness.

**Duration:** Week 2-4

**This is THE critical phase for match rate improvement (2-5% → 30-50%)**

#### Process for Each Agent

**4.1 Website Audit (1-2 hours)**

For each agent:
1. Visit provider website
2. Perform test search
3. Inspect current HTML structure using DevTools
4. Document CSS selectors/XPath for:
   - Title
   - Director
   - Cast/Actors
   - Release date
   - Studio
   - Poster image
   - Synopsis/Description

5. Compare to current agent code
6. Identify all selectors that need updating

**Audit Deliverable:** Spreadsheet with:
- Current selector (broken)
- Needed selector (working)
- HTML structure changes
- Priority (critical vs nice-to-have)
- Estimated effort

**4.2 Code Updates (1-2 hours per agent)**

For each identified selector:

```python
# BEFORE: Broken selector
title = result.xpath('//div[@class="film-title"]/text()')[0]

# AFTER: Working selector (from audit)
title = result.xpath('//h2[@class="movie-name"]/span/text()')[0]

# SAFEST: With error handling
try:
    title_elem = result.xpath('//h2[@class="movie-name"]/span/text()')
    if title_elem:
        title = title_elem[0].strip()
    else:
        # Try fallback
        title_elem = result.xpath('//div[@class="title"]/text()')
        title = title_elem[0].strip() if title_elem else None
except Exception as e:
    Log.Error(f"Failed to extract title: {e}")
    title = None
```

**General Improvements:**
- Wrap all extraction in try/except
- Add detailed logging for failures
- Implement multiple fallback selectors
- Validate extracted data
- Handle missing/optional fields
- Add timeout handling
- Implement rate limiting

**4.3 Testing (1-2 hours per agent)**

For each agent:
1. Test on 5-10 known films from that source
2. Verify each field extracts correctly
3. Test edge cases (missing synopsis, no poster)
4. Run against live website (verify no 403 errors)
5. Measure success rate (target 30-50%+)

**Test Template:**
```python
def test_agent_extraction(agent_name, test_films):
    successes = 0
    for title, year in test_films:
        results = agent.search(title, year)
        if results and validate_extraction(results[0]):
            successes += 1

    success_rate = (successes / len(test_films)) * 100
    return success_rate  # Target: 30-50%+
```

**4.4 Phased Rollout**

**Critical Agents (Week 1):**
- AEBN (Phase 2 canary test, median complexity)
- GEVI (210+ errors, primary enrichment source)
- GayEmpire (139 failures)
- HFGPM (high failure rate)
- HFGPM (57+ errors)

**High-Priority Agents (Week 2):**
- GayRado
- GayHotMovies
- HomoActive
- Fagalicious
- QueerClick
- + 3 more

**Medium-Priority Agents (Week 3):**
- BestExclusivePorn
- WayBig
- GEVI Scenes
- + others

**Low-Priority Agents (Week 3-4):**
- Remaining 10+ agents with lower activity

**Expected Outcome:** Each agent moves from 2-5% to 30-50% success rate.

**Success Metrics:**
- All 22 agents at 30-50% success rate
- Clear improvement over Phase 2
- No regressions in other functionality
- Error logging clear and actionable

---

### Phase 5: Unified Plugin Framework

**Objective:** Consolidate 22 disparate agents into single, maintainable framework with configuration-driven selectors.

**Duration:** Week 1-4 (parallel with Phase 4)

**Rationale:** Eliminate 9.46MB code duplication, enable selector updates without recompilation, sustainable long-term.

#### Architecture

**5.1 New Directory Structure**

```
_PGMA/Framework/
├── AgentBase.py           # Base class all agents inherit
├── MetadataExtractor.py   # Shared extraction logic
├── HttpClient.py          # Shared HTTP handling
├── ErrorHandler.py        # Shared error handling
├── Logger.py              # Shared logging
└── Config.py              # Configuration management

_PGMA/Providers/
├── BaseProvider.py        # Abstract provider class
├── GEVIProvider.py        # GEVI enrichment
├── WayBigProvider.py      # WayBig enrichment
├── AEBNProvider.py        # AEBN enrichment
└── ProviderRegistry.py    # Provider management

_PGMA/Instructions/
├── extraction_rules.yml   # CSS selectors, XPath queries
├── field_mappings.yml     # Website fields → metadata fields
├── validation_rules.yml   # Data validation rules
└── fallback_chains.yml    # Provider fallback order

[Each agent bundle now minimal]
AEBN.bundle/Contents/Code/
├── __init__.py            # ~20 lines - just class definition
└── (no utils.py needed)

PGMA/Scripts/
└── utils.py               # ~200KB shared framework code
                           # (replaces 22 × 430KB)
```

**5.2 AgentBase Class**

```python
# _PGMA/Framework/AgentBase.py
class AgentBase(Agent.Movies):
    """Base class for all PGMA agents"""

    def __init__(self, config_file):
        super().__init__()
        self.config = self.load_config(config_file)
        self.extractor = MetadataExtractor(self.config)
        self.http_client = HttpClient()
        self.provider = ProviderRegistry.get_primary_provider()
        self.logger = Logger(self.__class__.__name__)

    def search(self, results, media, lang, manual):
        """Standard search implementation"""
        query = self.build_search_query(media)
        html_results = self.http_client.search(
            self.config['base_url'],
            query,
            headers=self.config.get('headers')
        )

        for result in html_results:
            score = self.score_result(result, media)
            metadata = self.extractor.extract(result, 'search')
            metadata = self.enrich(metadata)

            results.Append(
                MetadataSearchResult(
                    id=metadata.get('id'),
                    name=metadata.get('title'),
                    score=score
                )
            )

    def update(self, metadata, media, lang, force):
        """Standard update implementation"""
        full_metadata = self.http_client.fetch(metadata.id)
        extracted = self.extractor.extract(full_metadata, 'update')
        enriched = self.enrich(extracted)
        normalized = self.validator.validate(enriched)
        self.populate_metadata(metadata, normalized)

    def enrich(self, metadata):
        """Enrich metadata using provider system"""
        if metadata.get('cast'):
            for actor in metadata['cast']:
                enrichment = ProviderRegistry.get_enrichment(
                    'performer',
                    actor['name']
                )
                if enrichment:
                    actor.update(enrichment)

        if metadata.get('director'):
            enrichment = ProviderRegistry.get_enrichment(
                'director',
                metadata['director']
            )
            if enrichment:
                metadata['director'] = enrichment

        return metadata
```

**5.3 MetadataExtractor Class**

```python
# _PGMA/Framework/MetadataExtractor.py
class MetadataExtractor:
    """Extract metadata using configured rules"""

    def __init__(self, config):
        self.config = config
        self.rules = config.get('extraction_rules', {})

    def extract(self, html_element, context='search'):
        """Extract metadata using configured rules"""
        metadata = {}

        rule_set = self.rules.get(context, {})

        for field, rule in rule_set.items():
            try:
                value = self.extract_field(html_element, rule)
                metadata[field] = value
            except Exception as e:
                Log.Debug(f"Failed to extract {field}: {e}")
                metadata[field] = None

        return metadata

    def extract_field(self, element, rule):
        """Extract single field using configured rule"""
        selectors = rule.get('selectors', [])

        for selector in selectors:
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
            except Exception:
                continue  # Try next selector

        return None

    def process(self, value, processor):
        """Apply data processing"""
        if processor == 'split_by_comma':
            return [v.strip() for v in value.split(',')]
        elif processor == 'normalize_url':
            return self.normalize_url(value)
        elif processor == 'parse_date':
            return self.parse_date(value)
        else:
            return value

    def validate(self, value, validator):
        """Validate extracted data"""
        # Could implement regex validation, length checks, etc.
        return value is not None
```

**5.4 YAML Configuration Schema**

```yaml
# _PGMA/Instructions/agents/aebn.yml
provider_name: "AEBN"
base_url: "https://aebn.com/search"

extraction_rules:
  search:
    title:
      selectors:
        - "//h2[@class='movie-title']/text()"
        - "//div[@class='film-name']/a/text()"
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

    synopsis:
      selectors:
        - "//div[@class='synopsis']/text()"
        - "//div[@class='description']/text()"

  update:
    # Can have different extraction rules for update vs search
    title:
      selectors:
        - "//h1[@class='film-title']/text()"
    director:
      selectors:
        - "//a[@class='director-link']/text()"
    # ... more fields ...

enrichment_providers:
  - name: "gevi"
    priority: 1
    capabilities: ["performer", "movie", "director"]

  - name: "waybig"
    priority: 2
    capabilities: ["performer", "scene"]

preferences:
  - id: "match_iafd_duration"
    type: "bool"
    default: false
    label: "Match against film duration"

  - id: "enrichment_provider"
    type: "enum"
    default: "gevi"
    values: ["gevi", "waybig", "aebn", "none"]
    label: "Primary enrichment provider"
```

**5.5 Migration Path**

**Week 1: Framework Development**
- Create AgentBase, MetadataExtractor, HttpClient, ProviderRegistry
- Migrate all 22 agents to use new framework (all agents functional)
- Ensure behavior identical to current implementation
- Prepare AEBN for Phase 2 as canary test

**Week 2: Template Extraction**
- Extract YAML configs for all 22 agents
- Document each site's structure
- Create validation tests

**Week 3: Agent Migration**
- Convert remaining 21 agents to framework
- Update all bundle Info.plist files
- Run comprehensive tests

**Week 4: Cleanup**
- Remove old code
- Consolidate utils.py into framework
- Update documentation

---

## Part III: Expected Outcomes

### Success Metrics by Phase

| Phase | Metric | Target | Impact |
|-------|--------|--------|--------|
| 1 | Agents running on framework | 22/22 | Foundation for phases 2-5 |
| 2 | AEBN success rate | 30-50% | Proves approach works |
| 3 | GEVI enrichment success | 95%+ | Replaces IAFD with superior system |
| 4 | All agents success rate | 30-50% | **10x match rate improvement** |
| 5 | Code duplication eliminated | 9.46MB → 2MB | Sustainable codebase |

### Metadata Quality Improvement

**Before Modernization:**
```
Success rate:           2-5% (94%+ failures)
Cast information:       0% (IAFD broken)
Director information:   0% (IAFD broken)
Movie enrichment:       None
Single point of failure: IAFD (broken)
Code maintainability:   Poor (9.46MB duplication)
```

**After Modernization:**
```
Success rate:           30-50% (10x improvement)
Cast information:       95% enriched (GEVI primary)
Director information:   85% enriched (GEVI primary)
Movie enrichment:       90% available (GEVI duration/date/synopsis)
Single point of failure: None (GEVI → WayBig → AEBN → Plex)
Code maintainability:   Excellent (1 framework, YAML configs)
```

---

## Part IV: Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| GEVI becomes unavailable | Low | Medium | WayBig fallback works, implement AEBN backup |
| Website structures too complex | Medium | Medium | Manual override option in YAML config |
| Performance degradation | Low | Medium | Implement caching, run performance tests |
| Agent compatibility issues | Low | High | Extensive testing, Phase 1 validation first |
| Provider integration bugs | Medium | Medium | Test each provider separately before integration |
| Timeline slips | Medium | Medium | Prioritize, automate where possible, parallel work |
| Data loss from old metadata | Low | High | Backup all metadata before migration |
| Framework introduces bugs | Low | High | Extensive testing, keep legacy fallback option |
| User confusion (metadata changes) | Medium | Medium | Clear release notes about IAFD removal |

---

## Part V: Implementation Timeline

### Week 1: Foundation
```
Phase 1: IAFD removal framework
├─ Create DataProvider abstract class
├─ Create IAFDStub implementation
├─ Create ProviderRegistry system
├─ Migrate AEBN as canary test
└─ Milestone: Framework ready, AEBN functional

Phase 2a: AEBN analysis
├─ Analyze aebn.com HTML structure
├─ Identify failing CSS selectors
├─ Document age-gate handling
└─ Milestone: Analysis document complete

Phase 5a: Framework design
├─ Design AgentBase class
├─ Design MetadataExtractor
└─ Milestone: Architecture documented
```

### Week 2: Validation & Enrichment
```
Phase 1c: Complete agent migration
├─ Migrate remaining 21 agents to framework
└─ Milestone: All 22 agents on framework

Phase 2b: Fix AEBN scrapers
├─ Update CSS selectors
├─ Handle age-gate and multi-page
├─ Test on 20-30 real films
└─ Milestone: AEBN at 30-50% success

Phase 3: Enrichment provider system
├─ Create GEVIProvider class
├─ Create WayBigProvider class
├─ Implement fallback chain
└─ Milestone: Enrichment working, 95%+ success

Phase 4a: Critical agent audits (5)
├─ AEBN, GEVI, GayEmpire, HFGPM, + 1 more
└─ Milestone: Approach validated on 5 agents
```

### Week 3: Scale
```
Phase 4a/b: High-priority agents (5+8)
├─ Fix 13 more agents systematically
├─ Each: 2-5% → 30-50%
└─ Milestone: Overall system 25-35% success

Phase 5b: Framework development
├─ Implement AgentBase class
├─ Create MetadataExtractor
├─ Convert AEBN as reference implementation
└─ Milestone: Framework working with AEBN
```

### Week 4+: Completion
```
Phase 4c: Remaining agents (9)
├─ Fix final batch of agents
└─ Milestone: All 22 agents at target rate

Phase 5c: Agent migration (22)
├─ Convert all agents to framework
├─ Extract YAML configurations
├─ Complete testing
└─ Milestone: All agents on framework, code consolidated

Final state:
├─ 30-50% match rate (10x improvement)
├─ All agents on unified framework
├─ No code duplication
├─ GEVI + WayBig enrichment working
└─ Production ready
```

---

## Part VI: Key Architectural Decisions

### Decision 1: GEVI as Primary Enrichment Provider

**Why GEVI?**
- 95% performer coverage vs WayBig's 85%
- 90% movie-level data (WayBig has 0%)
- 95% physical attributes (unique to GEVI)
- 85% director information (WayBig has 0%)
- **3-4x more data types** than WayBig

**Why not WayBig?**
- Performer focus only (no movie data)
- Missing physical attributes
- No director information
- Less comprehensive overall

**Result:** GEVI + WayBig provides **120% of IAFD's value** (better than original!)

### Decision 2: Multi-Provider Fallback Chain

**Why not single provider?**
- IAFD single point of failure (current problem)
- Each provider has different coverage
- Geographic diversity and resilience

**Provider Hierarchy:**
1. GEVI (primary - 98% availability)
2. WayBig (secondary - 95% availability)
3. AEBN (tertiary - 90% availability)
4. Plex Cache (last resort - local fallback)

**Benefit:** If anything fails, system degrades gracefully (no complete failure).

### Decision 3: AEBN as Phase 2 Canary Test

**Why AEBN (not GayWorld)?**
- Median complexity (296 lines) = representative of typical agents
- Advanced features (multi-page, age-gate, studio matching) = proves framework robustness
- Recent activity (Jan 30, 2026) = shows real-world usage patterns
- Success validates approach for all 22 agents

**Why Phase 2 (not Phase 1)?**
- Phase 1 creates framework that all agents can use
- Phase 2 tests framework on AEBN as canary
- Phase 4 scales to all 21 other agents
- Risk reduced: framework tested before wide rollout

**Approach:**
1. Phase 1: Migrate all 22 agents to framework
2. Phase 2: Fix AEBN scrapers as primary test case
3. Phase 4: Apply same pattern to 21 other agents

### Decision 4: YAML-Based Configuration

**Why YAML configs instead of code?**
- **Non-developers can update selectors** (selector changes != code)
- **No recompilation needed** (update YAML, deploy immediately)
- **Easy rollback** (version control on configs)
- **Transparent** (what selectors do we use? See YAML)

**Example:**
```
OLD: Selector changes required Python code update + bundle recompilation
NEW: Selector changes require YAML update + immediate deployment
```

---

## Part VII: Success Criteria

### Phase 1 Success
- ✓ All 22 agents running without IAFD
- ✓ No import errors or crashes
- ✓ Provider registry properly logs enrichment calls
- ✓ Agents gracefully handle None returns
- ✓ Framework ready for Phase 2

### Phase 2 Success
- ✓ AEBN metadata extraction success rate: 30-50%
- ✓ Title extraction: 100%
- ✓ Director extraction: 90%+
- ✓ Cast extraction: 85%+
- ✓ Age-gate handling working (Cookie header preserved)
- ✓ Multi-page pagination functional
- ✓ Clear improvement over baseline (2-5% → 30-50%)

### Phase 3 Success
- ✓ GEVI available and accessible (98%+)
- ✓ GEVI enrichment working for 95%+ of lookups
- ✓ Movie data extraction working
- ✓ Fallback chain functional
- ✓ Performance: <2s per lookup

### Phase 4 Success
- ✓ Critical agents (5) at 30-50% success
- ✓ High-priority agents (8) at 30-50% success
- ✓ Medium-priority agents (9) at 25-45% success
- ✓ Error logging clear and actionable
- ✓ No regressions in other functionality
- ✓ **Overall system: 30-50% success rate (10x improvement)**

### Phase 5 Success
- ✓ All agents running on framework
- ✓ Code duplication eliminated (9.46MB → 2MB)
- ✓ YAML configs validated and tested
- ✓ Easy to add new providers
- ✓ Easy to update selectors without code
- ✓ All existing functionality preserved
- ✓ Improved observability and monitoring

---

## Part VIII: Flexibility and Adjustments

The plan flexibly adapts based on discoveries:

### If Phase 1-2 Reveal...

**Complex website structures:**
- Add more selective fallbacks in YAML
- Implement custom processors for difficult sites
- Consider prioritizing Phase 5 (framework) earlier

**Better alternative providers:**
- Evaluate and add to provider registry
- Update Phase 3 priorities if needed
- Document new providers for future use

**Performance bottlenecks:**
- Implement caching layer
- Optimize HTTP client
- Add rate limiting where needed

### If Resources Become Available...

**Run phases in parallel:**
- Framework development (Phase 5) can run alongside audits (Phase 4)
- Website audits are I/O-bound (good for parallel work)
- Code migration can be automated

**Accelerate high-impact phases:**
- Phase 4 (scraper fixes) has highest impact
- Allocate more resources there
- Defer lower-priority agents to later

### If Timeline Constraints Emerge...

**Ship incremental improvements:**
- Complete Phase 1-2, deploy to production
- Users see AEBN improvement immediately (30-50% success)
- Phase 3-4-5 continue in parallel
- No need to wait for "all or nothing" completion

---

## Conclusion

This comprehensive modernization program addresses the PGMA system's critical failures through a coordinated 5-phase approach:

1. **Foundation (Phase 1):** Decouple from broken IAFD, establish provider framework
2. **Validation (Phase 2):** Fix AEBN as proof of concept (representative agent)
3. **Enrichment (Phase 3):** Deploy superior GEVI+WayBig provider system
4. **Scale (Phase 4):** Apply fixes to all 22 agents, achieve 10x improvement
5. **Sustainability (Phase 5):** Consolidate into maintainable framework

**Expected Result:**
- 10x improvement in metadata match rates (2-5% → 30-50%)
- Elimination of IAFD single point of failure
- Superior enrichment coverage than IAFD ever provided
- Sustainable, maintainable codebase for long-term success

---

**Status:** Ready for Implementation
**Version:** 2.0 (Final)
**Last Updated:** January 30, 2026
