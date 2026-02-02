# Plex Scraper Log Analysis Summary
**Analysis Date:** January 30, 2026
**Time Period:** Past 24 hours
**Files Analyzed:** 75 log files

---

## Executive Summary

The log analysis reveals **significant metadata retrieval issues** across most scraper agents. While the scrapers are successfully finding potential title matches, they are experiencing a **very high failure rate** when attempting to extract metadata from those titles.

### Key Statistics

- **Search Operations:** 99
- **Titles Found:** 112 events (scrapers successfully located potential matches)
- **Title Match Failures:** 1,548 (metadata extraction failures)
- **Model Read Errors:** 30 (cannot read/write metadata bundles)
- **URL Fetch Errors:** 367 (cannot retrieve data from source websites)

---

## What Happens When Files Are Successfully Matched

### ✅ SUCCESS SCENARIO (Rare - ~2-5% success rate)

1. **Search Initiated:** Agent receives file to match
   ```
   Searching for matches for {'id': '47312', 'guid': '...', 'force': True}
   ```

2. **Titles Found:** Search returns potential matches
   ```
   Titles Found: 5 Processing Results Page: 1
   ```

3. **Configuration Verified:** Agent settings validated
   ```
   ✅ matchiafdduration    Default = false    Set As = false    ✅
   ✅ matchsiteduration    Default = false    Set As = false    ✅
   ```

4. **Metadata Retrieved:** Agent successfully extracts:
   - Title information
   - Director names
   - Cast information
   - Release date
   - Studio/Network
   - Synopsis
   - Images/artwork

5. **Bundle Created:** Metadata written to Plex bundle successfully

---

## What Happens When Metadata Retrieval Fails

### ❌ FAILURE SCENARIO A: Title Match Failure (Most Common - 94%+)

This is **by far the most common failure mode**.

1. **Search Initiated:** ✓ Success
2. **Titles Found:** ✓ Success (e.g., "Titles Found: 5")
3. **Metadata Extraction Fails:**
   ```
   ERROR - SEARCH:: Error getting Site Title: < Title Match Failure! >
   ```

**What This Means:**
- The scraper **found** potential matches on the website
- But it **failed to extract** the actual metadata from those matches
- This typically indicates:
  - HTML structure changes on source websites
  - Incorrect CSS selectors or XPath queries in scraper code
  - Website anti-scraping measures
  - Encoding/parsing issues

**Affected Agents (worst offenders):**
- AdultFilmDatabase: 2.8% success rate (274 failures vs 8 successes)
- AEBN: Similar pattern (hundreds of failures)
- GayEmpire: 139 failures
- GEVI: 210 failures

---

### ❌ FAILURE SCENARIO B: URL Fetch Errors (367 occurrences)

**Example:**
```
ERROR - Error opening URL 'https://www.cduniverse.com/sresult.asp?...'
```

**What This Means:**
- Network connectivity issues
- Website is down or blocking requests
- Rate limiting / anti-bot measures
- Timeout issues

**Most Affected Agents:**
- CDUniverse: Multiple URL fetch failures
- Various agents trying to reach specific databases

---

### ❌ FAILURE SCENARIO C: Model Read Errors (30 occurrences)

**Example:**
```
ERROR - Cannot read model from /var/lib/plexmediaserver/.../bundle/Contents/com.plexapp.agents.GayAdult
```

**What This Means:**
- Cannot read or write to the metadata bundle
- Corrupted bundle files
- File permission issues
- Disk space issues (less likely)

**Affected Agents:**
- GayAdult: 8 errors
- GayEmpire: Several errors
- Others intermittently

---

### ⚠️ FAILURE SCENARIO D: Processing Errors

**Example:**
```
ERROR - ❌ File: utils.py, Line: 1326, Function: getSiteInfo -> getSiteInfoAEBN
```

**What This Means:**
- Code-level errors in the scraper logic
- Missing or malformed data from website
- Unexpected HTML structure
- Missing fields that scraper expects

---

## Agent-Specific Patterns

### High Activity Agents (Past 24 Hours)

| Agent | Searches | Success Rate | Main Issue |
|-------|----------|--------------|------------|
| **AdultFilmDatabase** | 8 | ~2.8% | Title Match Failures (274) |
| **GEVI** | High | Very Low | Processing errors (210+) |
| **GayEmpire** | High | Low | Title Match Failures (139) |
| **GayWorld** | High | Low | Match & cast/director errors (65+) |
| **HFGPM** | High | Low | Processing errors (57+) |
| **CDUniverse** | Medium | Very Low | URL fetch errors |

---

## Key Differences: Success vs. Failure

### When Metadata IS Successfully Retrieved:

✅ **Clean log pattern:**
```
1. Search initiated
2. Titles found (count > 0)
3. Configuration verified (✅ checkmarks)
4. NO "Title Match Failure" errors
5. Metadata fields populated
6. Bundle written successfully
```

### When Metadata IS NOT Retrieved:

❌ **Broken log pattern:**
```
1. Search initiated
2. Titles found (count > 0)  <-- This succeeds!
3. Error getting Site Title: < Title Match Failure! >  <-- This fails!
4. Multiple repeated failures
5. No metadata extracted
6. File remains unmatched
```

### When Metadata is PARTIALLY Retrieved:

⚠️ **Incomplete log pattern:**
```
1. Search initiated
2. Some fields extracted (title, date)
3. Errors on specific fields:
   - ❌ Error matching directors
   - ❌ Error matching cast
   - ⚠️ getFilmOnIAFD -> getURLElement failure
4. Partial metadata written
5. Some fields missing in Plex
```

---

## Root Causes Analysis

### Primary Issue: Website Scraping Failures

The scrapers are **consistently failing to extract data** even when they find results. This suggests:

1. **Website Structure Changes**
   - Source websites have changed their HTML/CSS structure
   - Scraper code hasn't been updated to match
   - Need to update CSS selectors, XPath queries

2. **Anti-Scraping Measures**
   - Websites implementing bot detection
   - Rate limiting being triggered
   - User-agent blocking

3. **Code Issues**
   - Regex patterns not matching current website format
   - Error handling not catching edge cases
   - Timeout issues

### Secondary Issues:

- **Metadata Bundle Corruption:** Some agents can't read/write bundles
- **Network Issues:** URL fetch failures suggest connectivity or blocking
- **Missing Cross-References:** IAFD lookups failing (for cast/director enrichment)

---

## Recommendations

1. **Update Scraper Code:** Review and update HTML parsing logic for each failing agent
2. **Improve Error Handling:** Better logging to show *what* field extraction failed
3. **Add Retry Logic:** For network failures and timeouts
4. **Bundle Repair:** Fix or reset corrupted metadata bundles
5. **Rate Limiting:** Add delays between requests to avoid anti-bot measures
6. **Fallback Sources:** When primary source fails, try alternative databases

---

## Files Generated

1. **aggregated_logs_24h.txt** - Original aggregated log (simpler version)
2. **aggregated_logs_enhanced.txt** - Enhanced analysis with detailed patterns (48KB)
3. **SUMMARY_README.md** - This summary document

---

## Technical Details

The analysis removed:
- Verbose debug lines (>500 characters)
- Stack traces and Python tracebacks
- HTML dumps
- JSON objects
- Repetitive patterns

The analysis focused on:
- Search operations
- Title match events
- Success/failure indicators
- Error patterns
- Sample logs for each scenario

This allows for easier identification of the core issue: **metadata extraction failing after successful search results**.
