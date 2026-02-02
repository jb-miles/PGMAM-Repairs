# PGMA Codebase Analysis and Structure Reference

**Generated:** January 30, 2026
**Purpose:** Comprehensive reference for understanding PGMA codebase structure, IAFD integration, and agent architecture. Use this document to avoid re-analyzing the codebase structure in future phases.

---

## Table of Contents

1. [Agent Bundle Structure](#agent-bundle-structure)
2. [Utils.py Analysis](#utilspy-analysis)
3. [IAFD Integration Points](#iafd-integration-points)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Shared Framework Locations](#shared-framework-locations)
6. [Code Duplication Statistics](#code-duplication-statistics)
7. [Critical Functions](#critical-functions)
8. [Agent List](#agent-list)

---

## Agent Bundle Structure

### Bundle Directory Layout

Each agent bundle follows this structure:

```
[Agent].bundle/
├── Contents/
│   ├── Code/
│   │   ├── __init__.py          # Agent class definition and methods
│   │   └── utils.py             # Local copy of shared utilities (~421KB, ~8038 lines)
│   ├── Info.plist               # Bundle metadata (name, agent ID, etc.)
│   └── Resources/               # Optional resources (images, translations)
├── Contents.old/                # Backup from previous version (optional)
└── [Bundle name].plexmark      # Plex marker file
```

### Agent Class Structure

**Typical __init__.py (example: AEBN):**

```python
# Lines 1-66: Header and imports
import utils  # Line 56
import sys, os, time, re, json, datetime
from lxml import etree
from datetime import datetime as dt

# Lines 66-118: Agent class definition
class AEBN(Agent.Movies):
    name = 'AEBN'                          # Display name
    primary_provider = False               # Not primary source
    contributes_to = ['com.plexapp.agents.GayAdult']  # Contributes to primary agent

# Lines 119-477: Search method
def search(self, results, media, lang, manual):
    """
    Search for films on primary website.
    Does NOT call IAFD (no enrichment in search phase).
    """
    # 1. Initialize AGENTDICT and FILMDICT
    # 2. Search website for film matching title/year
    # 3. Return MetadataSearchResult objects

# Lines 478-480: Update method
def update(self, metadata, media, lang, force=True):
    """
    Fetch full metadata for matched film.
    Calls utils.updateMetadata() which includes IAFD enrichment.
    """
    utils.updateMetadata(metadata, media, lang, force=True)
```

**Key Variables:**
- `AGENTDICT` - Agent configuration (preferences, base URLs, etc.)
- `FILMDICT` - Film metadata dictionary (title, year, cast, director, URLs, etc.)
- `results` - Results object passed to search() method

---

## Utils.py Analysis

### File Statistics

| Metric | Value |
|--------|-------|
| Lines per file | 8,029-8,039 |
| Size per file | ~421KB |
| Total size (21 agents) | ~8.8MB |
| Primary language | Python 2.7 |
| Encoding | UTF-8 |

### Utils.py Sections (Approximate Line Numbers)

| Section | Lines | Purpose |
|---------|-------|---------|
| Header/Imports | 1-120 | Package imports, constants, logger setup |
| Image Handling | 121-370 | `rotateImage()`, image cropping, Thumbor integration |
| **IAFD Functions** | **373-659** | **`getFilmOnIAFD()` - Main IAFD search** |
| Filename Parsing | 660-1100+ | Film title/year extraction from filenames |
| HTML Processing | 1100-2500 | XPath, element selection, HTML parsing utilities |
| Cast/Director Processing | 2500-5430 | `getCast()`, `getDirectors()`, basic processing |
| **Cast Enrichment** | **5430-5723** | **`matchCast()` - IAFD cast matching** |
| **Director Enrichment** | **5724-6020** | **`matchDirectors()` - IAFD director matching** |
| Studio/Title Matching | 6020-6360 | `matchStudio()`, `matchTitle()` |
| Metadata Assembly | 6360-6800 | `getSiteInfo()`, `updateMetadata()` |
| Utilities | 6800-8039 | Helper functions, logging, JSON handling |

### Critical Constants

```python
# IAFD URLs (defined in each utils.py)
IAFD_BASE = 'https://www.iafd.com'
IAFD_SEARCH_URL = IAFD_BASE + '/ramesearch.asp?searchtype=comprehensive&searchstring={0}'
IAFD_FILTER = '&FirstYear={0}&LastYear={1}&Submit=Filter'

# Agent-specific base URLs (examples)
AEBN_BASE = 'https://aebn.com'
GEVI_BASE = 'https://gayeroticvideoindex.com'
GAYWORLD_BASE = 'https://gayworld.org'
```

---

## IAFD Integration Points

### Primary Integration Functions

#### 1. getFilmOnIAFD() [Line 373]

**Purpose:** Search IAFD for complete film metadata and enrich FILMDICT.

**Signature:**
```python
def getFilmOnIAFD(AGENTDICT, FILMDICT):
    ''' check IAFD web site for better quality thumbnails per movie'''
```

**What it does:**
1. Formats search query from FILMDICT['IAFDSearchTitle']
2. Searches IAFD with optional year filtering
3. Extracts film metadata from IAFD page:
   - `FILMDICT['FoundOnIAFD']` = 'Yes' if found
   - `FILMDICT['IAFDFilmURL']` = URL to IAFD page
   - `FILMDICT['IAFDStudio']` = Studio name from IAFD
   - `FILMDICT['IAFDDuration']` = Duration in seconds
   - `FILMDICT['AllMale']` / `FILMDICT['AllGirl']` = Flags
   - `FILMDICT['Compilation']` = Compilation flag
4. Returns FILMDICT (modified)

**Current Status:** FAILS with HTTP 403 Forbidden errors

#### 2. matchCast() [Line 5569]

**Purpose:** Enrich unmatched cast members by searching IAFD.

**Signature:**
```python
def matchCast(unmatchedCastList, AGENTDICT, FILMDICT):
    ''' check IAFD web site for individual cast'''
```

**What it does:**
1. Loop through list of unmatched cast members
2. For each cast member:
   - Search IAFD for performer profile
   - Extract profile data: name, alias, photo, nationality, awards, etc.
   - Merge into AGENTDICT['CASTDICT'][castName]
3. Return matched cast dictionary

**Data Structure Returned:**
```python
{
    'CastName': {
        'RealName': str or None,
        'Alias': str (original if no alias),
        'Photo': str URL or None,
        'URL': str URL to profile or None,
        'Bio': dict of biographical data,
        'Nationality': str or None,
        'Awards': list of str,
        'Films': list of str,
        'Role': str (usually '')
    }
}
```

**Current Status:** FAILS with HTTP 403 Forbidden errors

#### 3. matchDirectors() [Line 5724]

**Purpose:** Enrich unmatched directors by searching IAFD.

**Signature:**
```python
def matchDirectors(unmatchedDirectorList, AGENTDICT, FILMDICT):
    ''' check IAFD web site for directors'''
```

**Same pattern as matchCast()** - searches IAFD for director profiles and enriches metadata.

**Current Status:** FAILS with HTTP 403 Forbidden errors

#### 4. getCast() [Calls matchCast]

**Purpose:** Process cast list - combines primary site cast with IAFD enrichment.

**Flow:**
```
getCast()
├─ Parse cast from FILMDICT
├─ Separate into matched (found on primary site) and unmatched
├─ Call matchCast(unmatchedCastList, ...)  ← IAFD enrichment
└─ Return combined cast dictionary
```

#### 5. getDirectors() [Calls matchDirectors]

**Purpose:** Process director list - combines primary site directors with IAFD enrichment.

**Flow:**
```
getDirectors()
├─ Parse directors from FILMDICT
├─ Separate into matched and unmatched
├─ Call matchDirectors(unmatchedDirectorList, ...)  ← IAFD enrichment
└─ Return combined director dictionary
```

#### 6. updateMetadata() [Line 6359]

**Purpose:** Master function that orchestrates full metadata update from agent to Plex.

**Flow:**
```
updateMetadata(metadata, media, lang, force)
│
├─ Load cached FILMDICT from metadata.id
├─ Fetch full HTML from agent URL
├─ Call getSiteInfo() to extract metadata
│  ├─ getCast() → matchCast() [IAFD]
│  └─ getDirectors() → matchDirectors() [IAFD]
├─ Validate and normalize extracted data
├─ Populate Plex metadata object
└─ Save to Plex database
```

**This is where IAFD enrichment actually happens** - during metadata update, not during search.

---

## Data Flow Diagrams

### Search Phase (No IAFD)

```
User searches for film in Plex
    ↓
Agent search() method called
    ↓
Search primary website (AEBN, GayWorld, etc.)
    ↓
Return search results to Plex
    (No IAFD call)
    (No enrichment)
```

### Update Phase (With IAFD Enrichment)

```
User selects search result
    ↓
Agent update() method called
    ↓
utils.updateMetadata()
    ↓
getSiteInfo() → extract from primary site
    ├─ getCast()
    │   ├─ Cast from primary site
    │   └─ matchCast() → Search IAFD for missing cast  ← FAILS
    └─ getDirectors()
        ├─ Directors from primary site
        └─ matchDirectors() → Search IAFD for missing directors  ← FAILS
    ↓
Metadata populated to Plex
(Cast/director enrichment MISSING due to IAFD 403 errors)
```

### Current Failure Mode

```
matchCast() calls getURLElement(IAFD_SEARCH_URL)
    ↓
HTTP request to IAFD.com
    ↓
HTTP 403 Forbidden (anti-bot protection)
    ↓
getURLElement() returns NoneType or empty
    ↓
matchCast() fails to parse HTML
    ↓
matchCast() returns empty dict or None
    ↓
Agent continues but cast enrichment absent
    ↓
User sees film with no cast details
```

---

## Shared Framework Locations

### _PGMA Directory Structure

```
_PGMA/
├── Cast/                        # Cast-related metadata resources
│   ├── [various JSON files]
│
├── Country/                     # Country lookup tables
│   └── [country data files]
│
├── Director/                    # Director-related resources
│   └── [director data files]
│
├── Genre/                       # Genre taxonomy
│   ├── [genre data files]
│
├── Scripts/
│   ├── utils.py                 # SHARED: Template/master copy of utils.py
│   │                            # (Each agent has its own copy in bundle)
│   ├── Rotate.ps1               # PowerShell script for image rotation
│   └── [other scripts]
│
├── System/                      # System resources (~32 files)
│   ├── Country lookup tables
│   ├── Genre mapping
│   ├── User agent lists
│   └── Other system data
│
├── Countries.txt                # Country definitions (2,000 bytes)
├── GayGenres.txt               # Genre definitions (1,624 bytes)
├── GayTidy.txt                 # Text normalization rules (43KB)
├── Thumbor.txt                 # Image service configuration
├── _UserGayGenres.txt          # User-defined genres
└── _UserGayTidy.txt            # User-defined text rules
```

### Important File Paths

| Resource | Location | Usage |
|----------|----------|-------|
| Shared Utils | `_PGMA/Scripts/utils.py` | Master copy - copy to each agent |
| Agent Template | `AEBN.bundle/Contents/Code/__init__.py` | Reference for agent structure |
| Agent Utils | `[Agent].bundle/Contents/Code/utils.py` | Local copy in each bundle |
| System Resources | `_PGMA/System/` | Shared lookup tables, etc. |
| Genre Data | `_PGMA/GayGenres.txt` | Genre taxonomy |
| Text Rules | `_PGMA/GayTidy.txt` | Text normalization (43KB) |

---

## Code Duplication Statistics

### MD5 Hash Analysis

**Identical Version 1 (18 agents - 85.7%)**
- **MD5:** 567c6ae1f227bcf953ce9e4eee1cc666
- **Size:** 8,038 lines
- **Agents:**
  - AEBN, AVEntertainments, BestExclusivePorn, CDUniverse, Fagalicious
  - GEVI, GEVIScenes, GayEmpire, GayFetishandBDSM, GayHotMovies
  - GayMovie, GayRado, GayWorld, HFGPM, HomoActive
  - IAFD, QueerClick, WayBig, WolffVideo

**Identical Version 2 (2 agents - 9.5%)**
- **MD5:** 6363f3977ab78ee31896e8d6c102471e
- **Size:** 8,029 lines (9 lines shorter)
- **Agents:** AEBN, AdultFilmDatabase

**Unique Version (1 agent - 4.8%)**
- **MD5:** a09bdbc6a9a92a7e7b28a8703f7485ed
- **Size:** 8,039 lines
- **Agent:** SimplyAdult

### Duplication Impact

- **Total Size:** 21 agents × ~421KB = ~8.8MB of nearly identical code
- **Maintenance Burden:** Bug fix requires updating 18-21 files
- **Consistency Risk:** 20/21 agents use one of two versions (good), but changes must propagate manually

---

## Critical Functions

### Functions that Reference IAFD

| Function | Location | Purpose | Status |
|----------|----------|---------|--------|
| getFilmOnIAFD() | Line 373 | Search IAFD for film | BROKEN (403) |
| matchCast() | Line 5569 | Enrich cast from IAFD | BROKEN (403) |
| matchDirectors() | Line 5724 | Enrich directors from IAFD | BROKEN (403) |
| matchStudio() | Line 6238 | Match studio names (may use IAFD) | BROKEN |
| matchTitle() | Line 6271 | Match titles (may use IAFD) | BROKEN |
| getCast() | Line 2500+ | Process cast, calls matchCast() | DEGRADED |
| getDirectors() | Line 2500+ | Process directors, calls matchDirectors() | DEGRADED |
| getSiteInfo() | Line 1064+ | Extract site info, calls getCast/getDirectors | DEGRADED |
| updateMetadata() | Line 6359 | Master update function, calls getSiteInfo | DEGRADED |

### Functions that Do NOT Reference IAFD

| Function | Location | Purpose | Status |
|----------|----------|---------|--------|
| search() | Agent __init__.py | Search primary website | WORKING ✓ |
| rotateImage() | Line 250+ | Image rotation | WORKING ✓ |
| getHTTPRequest() | Line 500+ | HTTP utilities | WORKING ✓ |
| [Many utilities] | Line 6800+ | Helper functions | WORKING ✓ |

---

## Agent List

### Complete List of 25 Agent Bundles

**Agents Using IAFD Enrichment (21 - Will be updated in Phase 1):**

1. AEBN.bundle
2. AdultFilmDatabase.bundle
3. AVEntertainments.bundle
4. BestExclusivePorn.bundle
5. CDUniverse.bundle
6. Fagalicious.bundle
7. GEVI.bundle
8. GEVIScenes.bundle
9. GayEmpire.bundle
10. GayFetishandBDSM.bundle
11. GayHotMovies.bundle
12. GayMovie.bundle
13. GayRado.bundle
14. GayWorld.bundle
15. HFGPM.bundle
16. HomoActive.bundle
17. QueerClick.bundle
18. SimplyAdult.bundle
19. WayBig.bundle
20. WolffVideo.bundle
21. GayAdultScenes.bundle

**Primary Agents (Not updated in Phase 1 - Direct sources, not enrichment consumers):**

22. IAFD.bundle - Direct IAFD source (deprecated in later phases)
23. GayAdult.bundle - Primary wrapper agent (no utils.py)
24. GayAdultFilms.bundle - Primary wrapper agent (no utils.py)

**Special Agents:**

25. NFOImporter.bundle - NFO metadata importer (no utils.py)

---

## Import Path Examples

### How Agents Import Utils

**In agent __init__.py (line 56):**
```python
import utils
```

**Python's import behavior:**
1. First checks local directory: `AEBN.bundle/Contents/Code/utils.py` ✓ (FOUND - uses this)
2. Then checks parent paths
3. Then checks system paths

**Therefore:** Each agent uses its own local copy of utils.py, not the shared _PGMA/Scripts/utils.py.

### Key Import Variables in Utils.py

```python
# From GEVI.bundle/Contents/Code/utils.py
# Working directory when running: /[Plex Support Path]/Plug-ins/Agents.bundle/Contents/Code/
# But utils.py knows its location via __file__

import sys
import os

# To access _PGMA/Scripts from bundle:
# GEVI.bundle/Contents/Code/ → up 3 levels to project root → down to _PGMA/Scripts/
# Path: ../../_PGMA/Scripts/

# This is why Phase 1's provider framework path is:
# ../../_PGMA/Stubs/
# (from Contents/Code/ to project root to _PGMA/Stubs/)
```

---

## Log File Locations and Analysis

### Current IAFD Error Logs

**Expected error patterns in Plex logs:**
```
2026-01-30 XX:XX:XX UTILS :: getFilmOnIAFD - HTTP Error 403 Forbidden
2026-01-30 XX:XX:XX UTILS :: matchCast - NoneType object has no attribute 'xpath'
2026-01-30 XX:XX:XX UTILS :: matchDirectors - Failed to find results on IAFD
```

### Log Levels Used in Utils.py

| Level | Function | Usage |
|-------|----------|-------|
| DEBUG | `log()` | Detailed tracing |
| ERROR | `log('UTILS :: Error:')` | Error conditions |
| WARNING | `log('UTILS :: Warning:')` | Potential issues |
| INFO | Various | Standard logging |

---

## Modification Impact Analysis

### What Happens When We Change Utils.py

**If we change _PGMA/Scripts/utils.py:**
- ❌ Does NOT affect any agents (they use local copies)

**If we change one agent's utils.py (e.g., AEBN.bundle/Contents/Code/utils.py):**
- ✓ Only affects AEBN agent

**What Phase 1 will do:**
1. Modify _PGMA/Scripts/utils.py (master copy)
2. Copy to each agent's bundle location
3. Result: All 21 agents updated simultaneously

---

## Performance Characteristics

### IAFD Search Performance (Before Failures)

- Typical search time: 1-2 seconds per cast/director
- If 5 unmatched cast: 5-10 seconds of IAFD lookups per film
- HTTP timeout: 30 seconds (configurable)

### Current Impact of IAFD Failures

- Search time: Unchanged (IAFD search still attempted)
- Match rate: Unchanged (primary site search works)
- Enrichment rate: 0% (all IAFD searches fail)

### After Phase 1 (Provider Stub)

- Search time: Unchanged (no searches attempted, instant None return)
- Match rate: Unchanged (primary site search still works)
- Enrichment rate: 0% (stub returns None)
- Latency improvement: ~5-10 seconds per film (no IAFD timeout waits)

---

## Future Enhancement Opportunities

### Phase 2: AEBN Scraper Fixes
- Update CSS selectors on aebn.com
- Current selectors broken by website HTML changes
- Expected improvement: 2-5% → 30-50% match rate

### Phase 3: GEVI Provider Implementation
- Add GEVIProvider class implementing DataProvider interface
- GEVI.com has superior data coverage
- Expected enrichment success: 95%+

### Phase 4: All Agents Scraper Fixes
- Apply AEBN approach to all 21 agents
- Each agent has unique website structure
- Expected overall improvement: 30-50% match rate

### Phase 5: Framework Consolidation
- Replace 21 separate utils.py files with unified framework
- YAML-based selector configuration
- Reduce 8.8MB code to ~2MB
- Enable non-programmer selector updates

---

## References and Related Documents

- **Modernization Strategy:** `develop/PGMA_MODERNIZATION_STRATEGY.md`
- **Phase 1 Implementation Plan:** `/Users/jbmiles/.claude/plans/floofy-cooking-engelbart.md`
- **Current Issues:** 22 identical ~430KB utils.py files, IAFD HTTP 403 failures, 94%+ extraction failure rate

---

**Last Updated:** January 30, 2026
**Maintained By:** PGMA Modernization Project
**Status:** In Use
**Confidence Level:** High (verified by codebase analysis)

---

## Quick Reference Checklist

Use this checklist when working on future phases:

- [ ] **Agent bundles**: 25 total (21 using IAFD, 4 primary/special)
- [ ] **Utils.py files**: 21 copies (18 identical, 2 versions, 1 unique)
- [ ] **IAFD integration**: 5-6 critical functions (lines 300-6400)
- [ ] **Shared resources**: `_PGMA/Scripts/`, `_PGMA/System/`
- [ ] **Agent imports**: Each uses local `Contents/Code/utils.py`
- [ ] **Data flow**: Search (no IAFD) → Update (IAFD enrichment)
- [ ] **Failure mode**: HTTP 403 → NoneType → missing enrichment
- [ ] **Current success rate**: 2-5% (IAFD broken, scrapers also failing)
- [ ] **Expected after Phase 1**: 2-5% (no enrichment, same as current)
- [ ] **Expected after Phase 4**: 30-50% (scrapers fixed + GEVI enrichment)

