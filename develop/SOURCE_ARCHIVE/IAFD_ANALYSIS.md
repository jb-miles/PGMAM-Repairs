# IAFD (Internet Adult Film Database) Analysis
**Analysis Date:** January 30, 2026
**Time Period:** Past 24 hours

---

## Quick Answer: Does IAFD Work At All?

**❌ NO - IAFD lookups are mostly FAILING in the past 24 hours**

---

## What is IAFD's Role?

IAFD is used in **two different ways**:

### 1. **Primary Agent** (Standalone)
The IAFD agent can work as a primary metadata source, but:
- **Last Activity:** January 26, 2026 (not active in past 24 hours)
- **Status:** Dormant - no recent search operations

### 2. **Contributor Agent** (More Common)
Other agents call IAFD to **enrich** their metadata with:
- Cast/Actor information
- Director information
- Film cross-references
- Additional metadata validation

This is where most IAFD activity happens, and where **most failures** occur.

---

## IAFD Failure Evidence from Past 24 Hours

### Failed IAFD URL Requests (367 total URL errors found)

Multiple agents attempted to fetch data from iafd.com and **failed**. Examples:

**Cast Searches:**
```
https://www.iafd.com/ramesearch.asp?searchtype=comprehensive&searchstring=Austin+Shadow
https://www.iafd.com/ramesearch.asp?searchtype=comprehensive&searchstring=Troy+Sparks
https://www.iafd.com/ramesearch.asp?searchtype=comprehensive&searchstring=Jason+Domino
https://www.iafd.com/ramesearch.asp?searchtype=comprehensive&searchstring=Justin+Morgan
https://www.iafd.com/ramesearch.asp?searchtype=comprehensive&searchstring=Billy+Blanco
https://www.iafd.com/ramesearch.asp?searchtype=comprehensive&searchstring=Madison+Mack
```

**Director Searches:**
```
https://www.iafd.com/ramesearch.asp?searchtype=comprehensive&searchstring=Paul+Morris
https://www.iafd.com/ramesearch.asp?searchtype=comprehensive&searchstring=Jay+King
```

**Film Searches:**
```
https://www.iafd.com/ramesearch.asp?searchtype=comprehensive&searchstring=Freaks+4
https://www.iafd.com/ramesearch.asp?searchtype=comprehensive&searchstring=Viral+Loads
```

---

## Error Patterns Found

### Error Type 1: Film Search Failures
```
ERROR - GayWorld - UTILS :: ❌ Error:: IAFD Film Search Failure,
'NoneType' object has no attribute 'xpath'
```

**What this means:**
- Agent successfully contacted iafd.com
- But received no usable HTML content back
- Unable to parse the response
- Likely causes: 403 errors, rate limiting, blocked requests

### Error Type 2: Cast Search Failures
```
ERROR - GayWorld - UTILS :: Error:: Cannot Process IAFD Cast Search Results,
AJ Alexander: 'NoneType' object has no attribute 'xpath'
ERROR - Cannot Process IAFD Cast Search Results, Dmitry Osten: 'NoneType' object has no attribute 'xpath'
ERROR - Cannot Process IAFD Cast Search Results, Johannes Lars: 'NoneType' object has no attribute 'xpath'
```

**What this means:**
- Cast lookups failing individually
- Each actor search returns nothing parseable
- 'NoneType' means the HTML parser got nothing back

### Error Type 3: Director Search Failures
```
ERROR - GayWorld - UTILS :: Error:: Cannot Process IAFD Director Search Results,
admin: 'NoneType' object has no attribute 'xpath'
```

### Error Type 4: HTTP 403 Errors
```
ERROR - GayWorld - UTILS :: Summary with Legend ⪢ IAFD Film ❔ ⪢ IAFD Cast ✅ Yes / ❌ No ⪢ IAFD Error 403 ❔Film, Cast
```

**403 = Forbidden**
- IAFD.com is **actively blocking** the scraper requests
- Anti-bot measures / rate limiting in effect

---

## Which Agents Use IAFD?

Based on the logs, these agents attempt IAFD lookups:

### Actively Attempting IAFD Enrichment:
1. **GayWorld** - Heavy IAFD usage, many failures
2. **GayEmpire** - Attempts IAFD lookups
3. **GayRado** - Uses IAFD for cast/director
4. **HFGPM** - Attempts IAFD enrichment
5. **GayHotMovies** - References IAFD
6. **GayMovie** - Has IAFD integration
7. **GayEmpire** - Calls IAFD

### Configuration Found:
All these agents have IAFD-related settings:
```
✅ matchiafdduration    Default = false    Set As = false    ✅
```

This preference controls whether to match film duration against IAFD data.

---

## What Happens When IAFD Works vs. Fails

### ✅ SUCCESSFUL IAFD Lookup (Rare/None found in 24h)

**Would look like:**
1. Agent finds basic metadata from primary source (GayWorld, AEBN, etc.)
2. Calls IAFD to enrich cast information
3. IAFD returns HTML with actor profiles
4. Agent parses actor names, photos, bios
5. Metadata enhanced with IAFD data

### ❌ FAILED IAFD Lookup (Current State)

**Actual pattern:**
1. Agent finds basic metadata from primary source ✓
2. Calls IAFD to enrich cast information ✓
3. **IAFD returns 403 Forbidden OR empty response** ✗
4. **'NoneType' error - nothing to parse** ✗
5. **Cast/Director metadata incomplete** ✗
6. Film metadata saved WITHOUT IAFD enrichment

---

## Impact Assessment

### Metadata That's Missing Due to IAFD Failures:

**Cast Information:**
- Actor names may be incomplete or missing
- No actor photos from IAFD
- No actor bios
- No filmography cross-references

**Director Information:**
- Director names may be incomplete
- No director photos
- No director filmographies

**Film Cross-References:**
- Missing alternate titles
- Missing IAFD film IDs
- No cross-database verification

### Metadata That Still Works:

The primary agents (GayWorld, AEBN, etc.) can still get:
- Basic title information
- Release dates
- Studios
- Synopsis (from their own sources)
- Images (from their own sources)
- Basic cast lists (from their own sources, but less complete)

**So IAFD failures cause REDUCED metadata quality, not complete failure.**

---

## Root Causes

### Primary Issue: IAFD.com Blocking Requests

**Evidence:**
- HTTP 403 Forbidden errors
- 'NoneType' parsing errors (no HTML returned)
- 367 failed URL requests across all agents

**Why this is happening:**
1. **Anti-bot measures:** IAFD.com detects automated scrapers
2. **Rate limiting:** Too many requests from same IP
3. **User-Agent blocking:** IAFD may block the Plex user-agent
4. **Cloudflare/DDoS protection:** Modern anti-scraping tech

### Secondary Issues:

1. **Outdated scraping code:** HTML structure may have changed
2. **No retry logic:** Agents give up after first failure
3. **No fallback:** No alternative data sources when IAFD fails

---

## Configuration Settings

Looking at the logs, IAFD integration is configured but set to minimal:

```
matchiafdduration = false  (Don't validate film duration against IAFD)
```

This suggests IAFD is being used for **enrichment only**, not primary validation.

---

## Recommendations

### Immediate Actions:

1. **Test IAFD Connectivity Manually**
   - Try accessing iafd.com URLs from your server
   - Check if IP is rate-limited/blocked

2. **Update User-Agent**
   - IAFD may be blocking the current user-agent string
   - Update to mimic a real browser

3. **Add Delays Between Requests**
   - Implement rate limiting in scraper code
   - Wait 2-5 seconds between IAFD lookups

4. **Implement Retry Logic**
   - Don't fail on first 403 error
   - Retry with exponential backoff

### Long-term Solutions:

1. **Alternative Data Sources**
   - Find alternative databases for cast/director info
   - Don't rely solely on IAFD

2. **Caching**
   - Cache IAFD results to reduce requests
   - Build local database of actors/directors

3. **Proxy Rotation**
   - Use rotating proxies to avoid rate limits
   - Distribute requests across multiple IPs

---

## Summary

### Does IAFD Work?
**NO** - IAFD lookups are failing across all agents due to:
- 403 Forbidden errors (being blocked)
- Failed URL requests (367 failures)
- 'NoneType' parsing errors (no HTML returned)

### Does This Break Everything?
**NO** - Primary metadata still works, but:
- Cast information is incomplete
- Director information is missing/incomplete
- No cross-database verification
- Overall metadata quality is reduced

### Which Agents Are Affected?
**ALL** gay adult content agents that try to use IAFD for enrichment:
- GayWorld (worst affected - 9+ errors)
- GayEmpire
- GayRado
- HFGPM
- GayHotMovies
- Others

### Can This Be Fixed?
**YES** - But requires:
- Server-level changes (user-agent, delays, retries)
- Or alternative data sources
- Or accepting reduced metadata quality

---

## Technical Details

**IAFD Search Pattern:**
```
https://www.iafd.com/ramesearch.asp?searchtype=comprehensive&searchstring=[NAME]&FirstYear=[YEAR]&LastYear=[YEAR]&Submit=Filter
```

**Common Error:**
```python
'NoneType' object has no attribute 'xpath'
```
This means: `html_element = None` when it should contain parsed HTML.

**Expected vs. Actual:**
- **Expected:** HTML document with search results
- **Actual:** HTTP 403 or empty response → `None` → crash when trying to parse
