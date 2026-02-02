# Plex Media Server Plugin Diagnostics & Debugging - Instruction Set

## PART 1: MISSION AND OBJECTIVES

### Primary Mission
Analyze the aggregated Plex log report to diagnose root causes of metadata extraction failures, research solutions using available tools, validate recommendations against actual code, and produce an actionable diagnostic report with prioritized fixes.

### Core Objectives

1. **Systematic Diagnosis**: Identify and categorize all error patterns from the aggregated log
2. **Multi-Source Research**: Use all available tools to investigate each error type
3. **Root Cause Analysis**: Determine why each error is occurring (not just what is happening)
4. **Solution Validation**: Verify proposed fixes are technically sound and compatible with codebase
5. **Actionable Recommendations**: Provide specific, implementable solutions with priority rankings

### Success Criteria

- [ ] Every major error pattern has a diagnosed root cause
- [ ] Each diagnosis is supported by evidence (code inspection, web analysis, documentation)
- [ ] Recommendations are validated against actual agent code
- [ ] Solutions are prioritized by impact and implementation difficulty
- [ ] Report includes verification steps for each fix
- [ ] All research sources are cited
- [ ] **Every error includes Expected vs. Observed Behavior analysis**
- [ ] **Every solution includes Expected Result of Implementation**

### Critical Requirements (MUST INCLUDE)

**For Every Error Diagnosis**:
```
✓ Expected Behavior - What the code was designed to do
✓ Observed Behavior - What actually happens (step-by-step comparison)
✓ Impact - Quantified effect on system and users
✓ Divergence Point - Where execution diverges from expected
```

**For Every Solution**:
```
✓ Expected Result - Specific, measurable outcomes
✓ Success Indicators - How to know it worked
✓ Failure Indicators - How to know it didn't work
✓ Contingency Plan - What to do if it fails
```

---

## PART 2: AVAILABLE RESEARCH TOOLS AND RESOURCES

### Tool 1: Context7 - Library Documentation Lookup

**Purpose**: Access up-to-date documentation for Python libraries and frameworks used in the codebase.

**Key Libraries to Research**:
- `lxml` - XML/HTML parsing (heavily used for scraping)
- `requests` / `urllib` - HTTP requests
- `re` - Regular expressions (pattern matching)
- `datetime` - Date/time handling
- `json` - JSON parsing
- Plex Framework APIs

**When to Use**:
- Investigating library-specific errors
- Understanding correct usage of parsing functions
- Checking for deprecated methods
- Finding alternative approaches to broken functionality

**Example Queries**:
```
"lxml xpath selectors best practices"
"lxml etree parsing HTML with namespaces"
"requests handling 403 Forbidden errors"
"Plex metadata agent framework"
```

### Tool 2: Exa Search - Semantic Web Search

**Purpose**: Find relevant discussions, blog posts, technical articles, and solutions across the internet.

**Use Cases**:
- Finding similar scraping issues and their solutions
- Discovering anti-bot bypass techniques
- Locating website structure documentation
- Finding community discussions about specific errors

**Search Strategies**:
```
"IAFD.com blocking automated requests solution"
"Plex agent HTTP 403 workaround"
"web scraping cloudflare protection bypass"
"Python lxml HTML parsing empty results"
"adult website metadata scraping 2024"
```

**Focus Areas**:
- Stack Overflow discussions
- GitHub issues in similar projects
- Technical blogs about web scraping
- Plex community forums

### Tool 3: Web Browser Integration - Live Site Inspection

**Purpose**: Directly inspect current website structure to compare against agent expectations.

**Critical Websites to Inspect**:
1. **IAFD.com** (iafd.com) - Currently returning 403 errors
2. **AEBN.com** (aebn.com) - Low success rate (7.2%)
3. **AdultFilmDatabase.com** - Low success rate (2.8%)
4. **GEVI.com** (gayeroticvideoindex.com) - Used by GEVI agent
5. **Other agent source websites** as identified in logs

**What to Check**:
- Current HTML structure (compare to agent's XPath/CSS selectors)
- Anti-bot protection mechanisms (Cloudflare, reCAPTCHA, etc.)
- Required headers (User-Agent, cookies, referrer)
- JavaScript rendering requirements
- API endpoints (if any)
- Rate limiting behavior
- Redirect chains
- SSL/TLS requirements

**Browser Inspection Workflow**:
1. Navigate to target URL
2. Open Developer Tools (F12)
3. Inspect Network tab for:
   - Request headers sent
   - Response headers received
   - Status codes
   - Redirect chains
   - Cookie requirements
4. Inspect Elements tab for:
   - HTML structure
   - Class names and IDs used in selectors
   - Dynamic content loading (AJAX)
5. Check Console for JavaScript errors
6. Test search functionality manually
7. Document findings with screenshots if needed

### Tool 4: Forum and Community Research

**Target Forums**:
- **Plex Forums** (forums.plex.tv) - Official Plex support
- **Reddit** (r/PleX, r/DataHoarder) - Community discussions
- **GitHub Issues** - Similar agent projects
- **Stack Overflow** - Technical programming questions

**Search Patterns**:
```
site:forums.plex.tv "agent" "403 forbidden"
site:reddit.com/r/PleX "metadata agent" "not working"
site:github.com "plex agent" "scraping failed"
"plex adult metadata" forum
```

### Tool 5: Additional Research Resources

**Python Package Documentation**:
- PyPI package pages for version information
- ReadTheDocs for comprehensive library documentation
- Official library GitHub repositories

**Web Scraping Resources**:
- ScrapingBee blog (scraping best practices)
- ScrapeHero blog (anti-bot techniques)
- Web Scraping Sandbox for testing

**Plex Development**:
- Plex Plugin Development Documentation
- Plex Agent Development Guide (if available)
- Legacy Plex framework documentation

**HTTP/Network Debugging**:
- Postman/Insomnia for API testing
- curl command generation for request replication
- HTTP status code references

---

## PART 3: DIAGNOSTIC METHODOLOGY

### Phase 1: Error Pattern Analysis (FROM AGGREGATED LOG)

**Input**: The aggregated log report from previous step

**Process**:

1. **Categorize All Errors by Type**:
   ```
   A. Title Match Failures (1,548 instances)
      - Agent: AEBN (193), AdultFilmDatabase (274), HFGPM (...)
      - Pattern: "Error getting Site Title: < Title Match Failure! >"
      
   B. URL Fetch Errors (367 instances)
      - HTTP 403 Forbidden (IAFD.com)
      - HTTP 404 Not Found
      - Connection timeouts
      
   C. Model Read Errors (30 instances)
      - Cannot read metadata bundle
      - File corruption or permission issues
      
   D. Other Processing Errors
      - [Categorize remaining errors]
   ```

2. **Identify Patterns Within Categories**:
   - Which agents have highest failure rates?
   - Which URLs consistently fail?
   - Are errors correlated with specific search patterns?
   - Time-based patterns (all failures at once = server issue)

3. **Extract Specific Examples for Investigation**:
   - Select 3-5 representative examples from each error category
   - Include full context (timestamp, thread, preceding operations)
   - Note any variations in error messages

### Phase 2: Agent Code Inspection

**For Each Major Error Pattern**:

1. **Locate Relevant Code Section**:
   ```
   Title Match Failure → utils.py line 5487 (from error message)
   HTTP 403 → getFilmOnIAFD() function (line 373)
   Model errors → Plex framework metadata handling
   ```

2. **Extract and Analyze Code**:
   ```python
   # Example: AEBN.bundle/Contents/Code/utils.py line 5487
   # What is the code doing when it throws this error?
   # What are the inputs and expected outputs?
   # What assumptions does it make about HTML structure?
   ```

3. **Document Current Behavior**:
   - What selector/XPath is being used?
   - What data is it trying to extract?
   - What format does it expect?
   - What error handling exists?

### Phase 3: Multi-Tool Research Process

**For EACH diagnosed error type, perform ALL applicable research**:

#### Research Step 1: Context7 Library Documentation

**Questions to Answer**:
- Is the library being used correctly?
- Are there deprecated methods?
- Are there better alternatives?
- What are common pitfalls?

**Example**:
```
For lxml XPath failures:
1. Search Context7: "lxml xpath empty results troubleshooting"
2. Check: XPath syntax correctness
3. Verify: Namespace handling
4. Review: Element selection best practices
```

#### Research Step 2: Live Website Inspection

**For URL Fetch Errors**:

1. **Manual Navigation Test**:
   - Can you access the URL in a browser?
   - What does the actual page look like?
   - Is there anti-bot protection visible?

2. **Structure Comparison**:
   ```
   AGENT EXPECTS (from code):
   <div class="movie-title">Title Here</div>
   
   ACTUAL WEBSITE (from inspection):
   <h1 data-testid="title-element">Title Here</h1>
   
   DIAGNOSIS: Selector mismatch - website redesigned
   ```

3. **Network Analysis**:
   ```
   Required Headers (from browser inspection):
   - User-Agent: Modern browser string
   - Accept: text/html,application/xhtml+xml...
   - Cookie: session_id=xxx (if required)
   
   Agent Currently Sends:
   - User-Agent: Python-urllib/2.7 (PROBLEM!)
   ```

4. **Anti-Bot Detection**:
   - Cloudflare challenge page?
   - JavaScript requirement?
   - Rate limiting (429 errors)?
   - IP blocking?
   - Cookie/session requirements?

#### Research Step 3: Exa Semantic Search

**Query Strategy**:

1. **Specific Error Message Search**:
   ```
   "HTTP 403 Forbidden IAFD.com scraping"
   "lxml xpath returns None empty list"
   "Plex agent metadata extraction failed"
   ```

2. **Solution-Oriented Search**:
   ```
   "bypass Cloudflare Python requests"
   "scraping website after redesign fix"
   "Plex agent update selectors"
   "adult website scraping best practices 2024"
   ```

3. **Community Knowledge**:
   ```
   "PGMA Plex agent not working"
   "gay metadata agent 403 error"
   site:forums.plex.tv adult metadata
   ```

#### Research Step 4: Forum and Community Search

**Platforms to Check**:

1. **Plex Forums**:
   - Search for similar agent failures
   - Check for official Plex framework changes
   - Look for deprecation notices

2. **Reddit**:
   - r/PleX for user reports
   - r/DataHoarder for metadata solutions
   - r/webscraping for technical approaches

3. **GitHub**:
   - Search for similar Plex agent projects
   - Check for open/closed issues matching errors
   - Review commit histories for fixes

**Documentation Pattern**:
```
FINDING: Stack Overflow post from 2023
URL: [link]
RELEVANCE: Similar 403 error with requests library
SOLUTION: Added User-Agent header, implemented retry logic
APPLICABILITY: High - same library, same error
```

### Phase 4: Root Cause Determination

**CRITICAL REQUIREMENT**: Every error analysis MUST include Expected vs. Observed Behavior

**How to Document Expected vs. Observed Behavior**:

```
EXPECTED BEHAVIOR (Step-by-step normal operation):
  What the code was designed to do, based on:
  • Code comments and function documentation
  • Variable names and logic flow
  • Assumptions in the implementation
  • Dependencies on external systems
  
  Format as numbered steps showing the happy path:
  1. [First action/step]
  2. [Expected result]
  3. [Next action based on result]
  4. [Final successful outcome]

OBSERVED BEHAVIOR (Step-by-step actual operation):
  What actually happens in practice, based on:
  • Error messages in logs
  • Stack traces and exception data
  • Code execution flow analysis
  • System state when error occurs
  
  Format as numbered steps mirroring expected behavior:
  1. [First action/step] ✓ or ✗
  2. [Actual result vs. expected]
  3. [Where execution diverged]
  4. [Final failure outcome]

IMPACT:
  • Quantify the effect (percentage, count, scope)
  • Describe user-visible consequences
  • Note downstream system effects
  • Assess severity
```

**Example - Well-Documented Behavior Analysis**:

```
ERROR: Title Match Failure in AEBN Agent

EXPECTED BEHAVIOR:
  1. Agent searches AEBN.com for film title "Example Film 2024"
  2. HTTP request returns 200 OK with search results HTML
  3. XPath selector '//div[@class="movie-title"]' finds title element
  4. Text extraction yields "Example Film 2024"
  5. Title comparison matches (100% similarity)
  6. Metadata extraction proceeds with film ID
  7. Full film details populated in FILMDICT
  8. Search result added to Plex with 100 score

OBSERVED BEHAVIOR:
  1. Agent searches AEBN.com for film title "Example Film 2024" ✓
  2. HTTP request returns 200 OK with HTML response ✓
  3. XPath selector '//div[@class="movie-title"]' returns None ✗
  4. Text extraction fails (NoneType error) ✗
  5. Title comparison never executes ✗
  6. Metadata extraction aborted ✗
  7. FILMDICT remains unpopulated ✗
  8. Error logged: "Error getting Site Title: < Title Match Failure! >" ✗

IMPACT:
  • 193 title match failures for AEBN (7.2% success rate)
  • Users get no AEBN metadata for 93% of searches
  • Films remain unmatched despite existing in AEBN database
  • Metadata quality severely degraded
  • Manual matching required for affected films

DIVERGENCE POINT: Step 3 - XPath selector failure
REASON: Website HTML structure changed, class name different
```

**For Each Error, Synthesize Research Into Root Cause**:

```
ERROR TYPE: IAFD.com HTTP 403 Forbidden (367 instances)

EXPECTED VS. OBSERVED BEHAVIOR:

EXPECTED BEHAVIOR (What the code assumes will happen):
1. HTTP request to IAFD returns 200 OK
2. Response contains HTML with search results
3. XPath selectors find and extract metadata
4. FILMDICT populated with enrichment data
5. Function returns successfully

OBSERVED BEHAVIOR (What actually happens):
1. HTTP request to IAFD returns 403 Forbidden ✗
2. No response body received (exception raised) ✗
3. XPath selectors never execute ✗
4. FILMDICT not populated ✗
5. Function fails with exception ✗

IMPACT:
• 100% failure rate for IAFD enrichment
• Missing cast photos, bios, aliases
• No secondary metadata validation
• Degraded user experience

RESEARCH FINDINGS:
1. Context7: requests library can send bot-like headers
2. Browser Inspection: IAFD uses Cloudflare anti-bot protection
3. Exa Search: Similar projects report IAFD blocks Python requests
4. Forum: User confirmed IAFD blocks automated access since 2023

ROOT CAUSE: IAFD.com implemented Cloudflare protection that detects 
and blocks automated requests. Current implementation:
- Uses Python default User-Agent (easily detected)
- No cookie/session handling
- No request delay/throttling
- No Cloudflare challenge bypass

EVIDENCE:
- All IAFD URLs return 403 (100% failure rate)
- Browser access works (manual testing confirms)
- Error started appearing in late 2023 (forum reports)
- Code at utils.py line 373 uses basic requests.get()
```

### Phase 5: Solution Formulation

**CRITICAL REQUIREMENT**: Every solution MUST include Expected Result of Implementation

**How to Document Expected Results**:

```
EXPECTED RESULT OF IMPLEMENTATION:

IMMEDIATE EFFECTS (Within 24-48 hours):
  • Specific, measurable changes to error rates
  • Changes to log patterns
  • System behavior modifications
  • Processing time impacts
  
METADATA QUALITY IMPROVEMENTS:
  • What metadata fields will be populated
  • Quality/completeness improvements
  • User-visible enhancements
  
SYSTEM BEHAVIOR CHANGES:
  • Performance impacts (positive or negative)
  • Resource utilization changes
  • New patterns or behaviors
  
LIMITATIONS:
  • What this solution does NOT fix
  • Remaining issues
  • Potential new problems
  • Dependencies or prerequisites
  
SUCCESS INDICATORS (How to know it worked):
  ✓ Measurable metrics showing improvement
  ✓ Log patterns that indicate success
  ✓ User-visible confirmations
  
FAILURE INDICATORS (How to know it didn't work):
  ✗ Metrics that show no improvement
  ✗ New error patterns
  ✗ Degraded performance
  
IF THIS SOLUTION DOESN'T MEET EXPECTATIONS:
  → Next steps or alternative approaches
  → Escalation path
  → Rollback criteria
```

**Example - Well-Documented Expected Result**:

```
SOLUTION: Update AEBN XPath selectors to match current website structure

EXPECTED RESULT OF IMPLEMENTATION:

IMMEDIATE EFFECTS (Within 24 hours):
  • Title Match Failures for AEBN reduced from 193 to ~30 (84% reduction)
  • AEBN success rate increases from 7.2% to 60-70%
  • Log shows "Title Found" instead of "Title Match Failure"
  • Successful metadata extraction for 60-70% of AEBN searches
  
METADATA QUALITY IMPROVEMENTS:
  • Film titles correctly matched and populated
  • Cast information extracted for matched films
  • Director information populated
  • Release dates and durations captured
  • Cover art and posters downloaded
  • Studio information recorded
  
SYSTEM BEHAVIOR CHANGES:
  • No significant performance impact (same number of requests)
  • More metadata writes to Plex database (successful matches)
  • User library updates more frequently with new metadata
  • Search results include AEBN matches
  
LIMITATIONS:
  • Does NOT fix IAFD enrichment (separate issue)
  • Does NOT address other agents (AEBN only)
  • May break again if AEBN redesigns website
  • Success depends on AEBN data quality
  
SUCCESS INDICATORS:
  ✓ "Title Match Failure" errors reduced by >80%
  ✓ FILMDICT['Title'] populated in successful searches
  ✓ Plex shows AEBN metadata for newly matched films
  ✓ User reports improved match rates
  ✓ Log shows successful XPath selections
  
FAILURE INDICATORS:
  ✗ Error rate unchanged or worse
  ✗ New errors appear (different XPath failures)
  ✗ Success rate <30% after 48 hours
  ✗ Metadata extraction works but data is incorrect
  
IF THIS SOLUTION DOESN'T MEET EXPECTATIONS:
  → Review actual HTML structure again (may have changed during implementation)
  → Check if AEBN has added anti-bot protection
  → Consider alternative selectors (CSS instead of XPath)
  → Test with different film titles to isolate issues
  → Proceed to implementing JavaScript rendering if required
```

**Develop Specific, Actionable Solutions**:

```
SOLUTION 1: Implement Browser-Like Requests (Short-term)
PRIORITY: HIGH
COMPLEXITY: LOW
IMPACT: Medium (may improve success to 20-30%)

Implementation:
1. Update User-Agent header to modern browser string
2. Add common browser headers (Accept, Accept-Language, etc.)
3. Implement cookie session management
4. Add 2-3 second delay between requests

Code Changes Required:
- utils.py line 373: getFilmOnIAFD()
- Add headers dictionary with browser headers
- Use requests.Session() for cookie persistence
- Add time.sleep(2) between requests

Testing:
- Test IAFD search with new headers
- Verify 403 errors reduced
- Confirm metadata extraction works if access granted

SOLUTION 2: Implement Selenium/Playwright (Long-term)
PRIORITY: MEDIUM
COMPLEXITY: HIGH
IMPACT: High (should achieve 70-90% success)

[Detailed implementation plan...]

SOLUTION 3: Switch to Alternative Data Source (Alternative)
PRIORITY: LOW
COMPLEXITY: MEDIUM
IMPACT: High (95%+ success if source is reliable)

Recommendation: Use GEVI.com as alternative to IAFD
Reasoning: 
- GEVI has superior coverage (from CODEBASE_ANALYSIS)
- Already have GEVI agent infrastructure
- No Cloudflare protection detected

[Implementation details...]
```

### Phase 6: Solution Validation

**CRITICAL**: Before finalizing recommendations, validate against actual code:

1. **Code Compatibility Check**:
   ```
   PROPOSED: Add requests.Session() 
   
   CODE REVIEW:
   - File: utils.py line 373-659
   - Current: Uses requests.get() directly
   - Python Version: 2.7 (IMPORTANT!)
   - Dependencies: Check if requests.Session() available in Python 2.7
   
   VALIDATION: ✓ requests.Session() supported in Python 2.7
   RISK: None - backward compatible
   ```

2. **Error Message Cross-Reference**:
   ```
   ERROR: "Error getting Site Title: < Title Match Failure! >"
   CODE LOCATION: utils.py line 5487
   
   CODE INSPECTION:
   [actual code that generates this error]
   
   PROPOSED FIX TARGETS CORRECT LOCATION: ✓ Yes / ✗ No
   PROPOSED FIX ADDRESSES ROOT CAUSE: ✓ Yes / ✗ No
   ```

3. **Dependency Check**:
   ```
   PROPOSED: Use cloudscraper library
   CURRENT DEPENDENCIES: lxml, requests, urllib, re, json
   
   COMPATIBILITY:
   - Python 2.7 compatible? [Research needed]
   - Conflicts with existing libs? [Check]
   - Installation requirements? [Document]
   
   VALIDATION: [Result]
   ```

4. **Side Effect Analysis**:
   ```
   PROPOSED CHANGE: Modify getFilmOnIAFD() function
   
   IMPACT ANALYSIS:
   - Functions that call this: matchCast(), matchDirectors(), getSiteInfo()
   - Data structures affected: FILMDICT, AGENTDICT
   - Other agents affected: All 21 agents (shared utils.py)
   
   RISK ASSESSMENT: [Low/Medium/High]
   MITIGATION: [Required testing, fallback plan]
   ```

5. **Testing Feasibility**:
   ```
   Can this solution be tested before full deployment?
   - Unit test possible? Yes/No
   - Test endpoint available? Yes/No
   - Rollback strategy: [Describe]
   ```

---

## PART 4: DIAGNOSTIC REPORT STRUCTURE

### Report Format: Comprehensive Diagnostic Analysis

```
====================================================================================================
PLEX MEDIA SERVER PLUGIN DIAGNOSTIC REPORT
Generated: [timestamp]
Analysis Period: [log timeframe]
Codebase Version: PGMA (21 agents)
====================================================================================================

EXECUTIVE SUMMARY
----------------------------------------------------------------------------------------------------

PRIMARY FINDINGS:
  • [Total error count] errors analyzed across [N] agents
  • [N] distinct error patterns identified
  • [N] root causes determined
  • [N] actionable solutions proposed
  • Estimated improvement: [X]% → [Y]% success rate

CRITICAL ISSUES (Require Immediate Attention):
  1. [Issue name] - Affecting [N] agents - [Impact description]
  2. [Issue name] - Affecting [N] agents - [Impact description]

RECOMMENDED PRIORITY:
  Phase 1: [High-priority fixes] - Est. 2-5 hours - Impact: [X]% improvement
  Phase 2: [Medium-priority fixes] - Est. 5-10 hours - Impact: [Y]% improvement
  Phase 3: [Long-term solutions] - Est. 20-40 hours - Impact: [Z]% improvement

====================================================================================================
DETAILED DIAGNOSTICS BY ERROR TYPE
====================================================================================================

----------------------------------------------------------------------------------------------------
ERROR TYPE 1: IAFD HTTP 403 FORBIDDEN (367 instances, 100% of IAFD requests)
----------------------------------------------------------------------------------------------------

AFFECTED AGENTS: All 21 agents utilizing IAFD enrichment
AFFECTED FUNCTIONS: getFilmOnIAFD(), matchCast(), matchDirectors()
CODE LOCATIONS: utils.py lines 373-6020

SYMPTOM ANALYSIS:
  Error Message: "HTTP Error 403 Forbidden"
  URLs Failing: https://www.iafd.com/ramesearch.asp?searchtype=comprehensive&searchstring=*
  Failure Rate: 100% (367/367 attempts)
  First Observed: [Date from logs or research]

EXPECTED VS. OBSERVED BEHAVIOR:

  EXPECTED BEHAVIOR:
    1. Agent calls getFilmOnIAFD() with film title
    2. HTTP request to IAFD search endpoint returns 200 OK
    3. HTML response contains search results
    4. XPath selectors extract film metadata (studio, duration, cast)
    5. FILMDICT is populated with IAFD enrichment data
    6. Function returns successfully with FoundOnIAFD = 'Yes'
    7. Subsequent matchCast() and matchDirectors() calls succeed
    8. Final metadata includes IAFD-sourced information
    
  OBSERVED BEHAVIOR:
    1. Agent calls getFilmOnIAFD() with film title ✓
    2. HTTP request to IAFD returns 403 Forbidden ✗
    3. No HTML response received (error raised) ✗
    4. XPath selectors never execute (request failed) ✗
    5. FILMDICT not populated with IAFD data ✗
    6. Function fails, FoundOnIAFD remains unset or 'No' ✗
    7. matchCast() and matchDirectors() calls also fail with 403 ✗
    8. Final metadata missing all IAFD-sourced information ✗
    
  IMPACT:
    • No cast enrichment (missing performer photos, bios, aliases)
    • No director enrichment (missing director information)
    • No film metadata validation (IAFD acts as secondary source)
    • Reduced metadata quality and completeness
    • User experience degraded (incomplete cast information)

ROOT CAUSE INVESTIGATION:

  Research Method 1 - Context7 (Python requests library):
    Finding: Default User-Agent header identifies as Python
    Source: requests library documentation
    Evidence: "Python-urllib/2.7" user agent easily flagged by anti-bot systems
    
  Research Method 2 - Live Website Inspection:
    URL Tested: https://www.iafd.com/
    Result: ✓ Accessible in browser, ✗ Returns 403 for Python requests
    Protection Detected: Cloudflare challenge page
    Headers Required: [List of headers from inspection]
    Cookies Required: [Session cookies identified]
    JavaScript Required: Yes/No
    Screenshots: [If taken]
    
  Research Method 3 - Exa Search:
    Query: "IAFD.com blocking Python scraping 403"
    Top Results:
      1. [URL] - Similar issue, solution: [summary]
      2. [URL] - IAFD anti-bot discussion, dated: [date]
    Key Findings:
      • IAFD implemented Cloudflare in Q4 2023
      • Community reports 100% block rate for simple requests
      • Successful workarounds: [list approaches]
      
  Research Method 4 - Forum Search:
    Platform: Plex Forums
    Relevant Threads:
      1. [URL] - User reports same issue, dated: [date]
         Solution attempted: [describe]
         Result: [success/failure]
    
    Platform: Reddit r/PleX
    Relevant Posts:
      1. [URL] - PGMA agent failures discussion
         Community consensus: [summary]

ROOT CAUSE DETERMINATION:
  IAFD.com implemented Cloudflare anti-bot protection in late 2023 that detects and 
  blocks automated requests based on:
    1. User-Agent header (Python default is flagged)
    2. Missing browser fingerprinting headers
    3. Absence of JavaScript execution
    4. Request pattern analysis (rate/timing)
    
  Current code (utils.py line 373) uses basic requests.get() with no anti-bot measures:
    ```python
    # Line 373-380 (approximate)
    def getFilmOnIAFD(AGENTDICT, FILMDICT):
        searchTitle = FILMDICT['IAFDSearchTitle']
        url = IAFD_SEARCH_URL.format(searchTitle)
        response = requests.get(url)  # <-- PROBLEM: No headers, no session
        # ... rest of function
    ```

CODE VALIDATION:
  ✓ Error message matches code location
  ✓ All IAFD requests use same flawed approach
  ✓ No anti-bot measures present in current implementation
  ✓ Python 2.7 compatible solutions exist

RECOMMENDED SOLUTIONS (Prioritized):

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ SOLUTION 1-A: Enhanced Headers (Quick Fix)                                  │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │ Priority: HIGH                                                              │
  │ Complexity: LOW (2-3 hours)                                                 │
  │ Expected Improvement: 0% → 20-30% success rate                              │
  │ Risk: LOW                                                                   │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │ EXPECTED RESULT OF IMPLEMENTATION:                                          │
  │                                                                             │
  │   IMMEDIATE EFFECTS (Within 24 hours):                                      │
  │   • IAFD HTTP 403 errors reduced from 367/367 (100%) to ~250/367 (68%)     │
  │   • Successful IAFD requests increase from 0% to 20-30%                     │
  │   • getFilmOnIAFD() returns data for some films instead of always failing  │
  │   • matchCast() succeeds for ~20-30% of unmatched performers                │
  │   • matchDirectors() succeeds for ~20-30% of unmatched directors            │
  │                                                                             │
  │   METADATA QUALITY IMPROVEMENTS:                                            │
  │   • Cast photos appear for ~20-30% more performers                          │
  │   • Performer bios and aliases populated for enriched cast                  │
  │   • Film duration validated against IAFD for matched films                  │
  │   • Studio information cross-referenced with IAFD                           │
  │                                                                             │
  │   SYSTEM BEHAVIOR CHANGES:                                                  │
  │   • Log errors decrease from 367 to ~250 failures per analysis period       │
  │   • Processing time increases by 2-3 seconds per film (rate limiting)       │
  │   • Session cookies maintained across requests (lower overhead)             │
  │   • More realistic traffic pattern (less bot-like)                          │
  │                                                                             │
  │   LIMITATIONS:                                                              │
  │   • Still ~70% failure rate (Cloudflare may block some requests)            │
  │   • Success rate may degrade over time if IAFD tightens protection          │
  │   • No guarantee against future blocking                                    │
  │   • May not work if IP gets flagged                                         │
  │                                                                             │
  │   SUCCESS INDICATORS:                                                       │
  │   ✓ 403 errors in logs reduced by at least 20%                              │
  │   ✓ FoundOnIAFD = 'Yes' appears in FILMDICT for some films                  │
  │   ✓ Cast photos begin appearing in Plex for matched performers              │
  │   ✓ No increase in other error types                                        │
  │                                                                             │
  │   FAILURE INDICATORS:                                                       │
  │   ✗ 403 error rate unchanged or increased                                   │
  │   ✗ New error types appear (429 rate limiting, connection timeouts)         │
  │   ✗ All requests still failing after 48 hours                               │
  │                                                                             │
  │   IF THIS SOLUTION DOESN'T MEET EXPECTATIONS:                               │
  │   → Proceed to Solution 1-B (CloudScraper) for more aggressive approach     │
  │   → Or proceed to Solution 1-C (GEVI alternative) for strategic pivot       │
  │                                                                             │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │ Implementation:                                                             │
  │   1. Add browser-realistic User-Agent header                                │
  │   2. Include Accept, Accept-Language, Accept-Encoding headers               │
  │   3. Implement requests.Session() for cookie persistence                    │
  │   4. Add 2-3 second delay between requests                                  │
  │                                                                             │
  │ Code Changes:                                                               │
  │   File: [Agent].bundle/Contents/Code/utils.py                               │
  │   Lines: 373-380, 5569-5600, 5724-5800                                      │
  │                                                                             │
  │   BEFORE:                                                                   │
  │   ```python                                                                 │
  │   response = requests.get(url)                                              │
  │   ```                                                                       │
  │                                                                             │
  │   AFTER:                                                                    │
  │   ```python                                                                 │
  │   headers = {                                                               │
  │       'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',  │
  │       'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',   │
  │       'Accept-Language': 'en-US,en;q=0.9',                                  │
  │       'Accept-Encoding': 'gzip, deflate, br',                               │
  │       'DNT': '1',                                                           │
  │       'Connection': 'keep-alive',                                           │
  │       'Upgrade-Insecure-Requests': '1'                                      │
  │   }                                                                         │
  │   session = requests.Session()                                              │
  │   time.sleep(2)  # Rate limiting                                            │
  │   response = session.get(url, headers=headers, timeout=30)                  │
  │   ```                                                                       │
  │                                                                             │
  │ Testing Plan:                                                               │
  │   1. Test single IAFD search with new headers                               │
  │   2. Monitor response codes (expect 200 instead of 403)                     │
  │   3. Verify HTML parsing still works                                        │
  │   4. Test with 5-10 different searches                                      │
  │   5. Monitor for rate limiting (429 errors)                                 │
  │                                                                             │
  │ Validation Against Code:                                                    │
  │   ✓ Compatible with Python 2.7 (requests.Session() supported)              │
  │   ✓ No dependency changes required                                          │
  │   ✓ Backward compatible (fallback to requests.get() if Session fails)      │
  │   ✓ Affects correct code locations (validated against error messages)      │
  │                                                                             │
  │ Rollback Plan:                                                              │
  │   Keep backup of utils.py before changes. If success rate doesn't improve  │
  │   after 24 hours, revert to original and proceed to Solution 1-B.          │
  └─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ SOLUTION 1-B: CloudScraper Library (Moderate Fix)                           │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │ Priority: MEDIUM (if Solution 1-A fails)                                    │
  │ Complexity: MEDIUM (4-6 hours)                                              │
  │ Expected Improvement: 0% → 50-70% success rate                              │
  │ Risk: MEDIUM (new dependency)                                               │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │ Implementation:                                                             │
  │   [Detailed implementation plan]                                            │
  │   [Code examples]                                                           │
  │   [Testing approach]                                                        │
  │   [Validation results]                                                      │
  └─────────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ SOLUTION 1-C: Alternative Data Source - GEVI.com (Strategic Fix)            │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │ Priority: HIGH (parallel track to 1-A/1-B)                                  │
  │ Complexity: LOW-MEDIUM (3-5 hours)                                          │
  │ Expected Improvement: 0% → 90-95% success rate                              │
  │ Risk: LOW (reuses existing GEVI agent infrastructure)                       │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │ Rationale:                                                                  │
  │   From CODEBASE_ANALYSIS.md:                                                │
  │   - GEVI.com has superior data coverage                                     │
  │   - Already have working GEVI agent                                         │
  │   - No Cloudflare protection detected (browser inspection confirms)         │
  │   - Expected enrichment success: 95%+                                       │
  │                                                                             │
  │ Implementation:                                                             │
  │   [Detailed plan to switch from IAFD to GEVI for enrichment]                │
  └─────────────────────────────────────────────────────────────────────────────┘

----------------------------------------------------------------------------------------------------
ERROR TYPE 2: TITLE MATCH FAILURES (1,548 instances)
----------------------------------------------------------------------------------------------------

[Similar detailed analysis structure for this error type]

AFFECTED AGENTS: AEBN (193 failures, 7.2% success), AdultFilmDatabase (274 failures, 2.8% success)

SYMPTOM ANALYSIS:
  [Error details]

EXPECTED VS. OBSERVED BEHAVIOR:

  EXPECTED BEHAVIOR:
    [Step-by-step normal operation from code design]
    
  OBSERVED BEHAVIOR:
    [Step-by-step actual operation from logs]
    
  IMPACT:
    [Quantified effect and user consequences]

ROOT CAUSE INVESTIGATION:
  [Multi-tool research results]

ROOT CAUSE DETERMINATION:
  [Synthesized conclusion]

RECOMMENDED SOLUTIONS:
  [Prioritized fixes with validation - each including Expected Result section]

----------------------------------------------------------------------------------------------------
ERROR TYPE 3: MODEL READ ERRORS (30 instances)
----------------------------------------------------------------------------------------------------

[Detailed analysis]

====================================================================================================
CROSS-CUTTING RECOMMENDATIONS
====================================================================================================

INFRASTRUCTURE IMPROVEMENTS:
  1. [Recommendation with rationale]
  2. [Recommendation with rationale]

MONITORING ENHANCEMENTS:
  1. [Recommendation for better diagnostics]
  2. [Recommendation for error tracking]

PREVENTIVE MEASURES:
  1. [How to avoid similar issues in future]
  2. [Code quality improvements]

====================================================================================================
IMPLEMENTATION ROADMAP
====================================================================================================

PHASE 1: Quick Wins (Week 1) - Estimated 5-8 hours
  ┌──────────────────────────────────────────────────────────────┐
  │ Task 1.1: Implement Enhanced Headers for IAFD                │
  │   • Modify utils.py getFilmOnIAFD() function                 │
  │   • Add browser-like headers                                 │
  │   • Implement session management                             │
  │   • Deploy to all 21 agents                                  │
  │   Expected Impact: 20-30% success rate improvement           │
  │   Testing: 2 hours                                           │
  │   Implementation: 3 hours                                    │
  └──────────────────────────────────────────────────────────────┘
  
  ┌──────────────────────────────────────────────────────────────┐
  │ Task 1.2: Fix Critical Selector Issues in AEBN Agent         │
  │   • Update CSS selectors based on website inspection         │
  │   • Test title extraction                                    │
  │   Expected Impact: 7% → 25% success rate for AEBN            │
  └──────────────────────────────────────────────────────────────┘

PHASE 2: Medium-Term Fixes (Week 2-3) - Estimated 15-20 hours
  [Additional fixes]

PHASE 3: Strategic Solutions (Month 2) - Estimated 30-40 hours
  [Long-term architectural improvements]

====================================================================================================
RESEARCH CITATIONS
====================================================================================================

Context7 Documentation Consulted:
  1. [Library name] - [Specific documentation page] - [Finding]
  2. [...]

Exa Search Results:
  1. [URL] - [Title] - [Key finding]
  2. [...]

Website Inspections Performed:
  1. IAFD.com - [Date/time] - [Findings]
  2. AEBN.com - [Date/time] - [Findings]
  3. [...]

Forum Research:
  1. [Platform] - [Thread URL] - [Finding]
  2. [...]

====================================================================================================
VALIDATION SUMMARY
====================================================================================================

Solutions Validated Against:
  ✓ Actual agent code (all 21 agents' utils.py inspected)
  ✓ Error message locations cross-referenced
  ✓ Python 2.7 compatibility verified
  ✓ Dependency conflicts checked
  ✓ Side effects analyzed
  ✓ Rollback plans documented

Confidence Levels:
  • IAFD 403 Fix (Solution 1-A): HIGH (85%) - Based on successful similar implementations
  • Title Match Fix (AEBN): MEDIUM (60%) - Requires testing against live site
  • Alternative Source (GEVI): HIGH (90%) - Existing infrastructure, known to work

====================================================================================================
APPENDICES
====================================================================================================

APPENDIX A: Code Snippets
  [Actual code sections referenced in diagnostics]

APPENDIX B: Website Inspection Screenshots
  [Visual evidence of website structure changes]

APPENDIX C: Error Message Catalog
  [Complete list of unique error messages with frequency]

APPENDIX D: Testing Checklists
  [Detailed test plans for each solution]

====================================================================================================
END OF DIAGNOSTIC REPORT
====================================================================================================
```

---

## PART 5: RESEARCH EXECUTION WORKFLOW

### Systematic Investigation Process

For diagnostic thoroughness, follow this workflow for EACH major error pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│ ERROR PATTERN: [Description]                                    │
│ INSTANCES: [Count]                                              │
│ AGENTS AFFECTED: [List]                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  STEP 1: Extract Representative Samples│
         │  • 3-5 examples with full context      │
         │  • Note variations in error messages   │
         │  • Identify affected code locations    │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  STEP 2: Code Inspection               │
         │  • Locate function generating error    │
         │  • Review code logic and assumptions   │
         │  • Identify dependencies               │
         │  • Note error handling approach        │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  STEP 3: Context7 Library Research     │
         │  • Search for relevant libraries       │
         │  • Check documentation for correct use │
         │  • Look for known issues               │
         │  • Find best practices                 │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  STEP 4: Live Website Inspection       │
         │  (If URL-related error)                │
         │  • Navigate to target URL              │
         │  • Inspect HTML structure              │
         │  • Analyze network requests            │
         │  • Check for anti-bot protection       │
         │  • Document current state              │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  STEP 5: Exa Semantic Search           │
         │  • Search for error message            │
         │  • Look for similar issues             │
         │  • Find community solutions            │
         │  • Research best practices             │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  STEP 6: Forum and Community Research  │
         │  • Check Plex forums                   │
         │  • Search Reddit discussions           │
         │  • Review GitHub issues                │
         │  • Look for official announcements     │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  STEP 7: Synthesize Findings           │
         │  • Combine all research results        │
         │  • Identify root cause                 │
         │  • Assess confidence level             │
         │  • Document evidence trail             │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  STEP 8: Formulate Solutions           │
         │  • Brainstorm possible fixes           │
         │  • Prioritize by impact/effort         │
         │  • Draft implementation plans          │
         │  • Identify testing requirements       │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  STEP 9: Validate Against Code         │
         │  • Verify solution targets right spot  │
         │  • Check Python 2.7 compatibility      │
         │  • Assess dependency impacts           │
         │  • Analyze potential side effects      │
         │  • Confirm error message alignment     │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  STEP 10: Document in Report           │
         │  • Write detailed diagnostic section   │
         │  • Include all research citations      │
         │  • Provide code snippets               │
         │  • Add implementation guidance         │
         │  • Include testing checklist           │
         └────────────────────────────────────────┘
                              │
                              ▼
         ┌────────────────────────────────────────┐
         │  STEP 11: Double-Check Validation      │
         │  • Re-review proposed solution         │
         │  • Confirm all validations passed      │
         │  • Verify citations are complete       │
         │  • Check for logical consistency       │
         └────────────────────────────────────────┘
                              │
                              ▼
                     [Next Error Pattern]
```

---

## PART 6: VALIDATION CHECKLIST

Before finalizing ANY recommendation, complete this validation:

### Code Validation Checklist

```
For Recommendation: [Solution Description]

□ 1. ERROR MESSAGE ALIGNMENT
    □ Error message from logs matches code location
    □ Error frequency matches diagnosis
    □ All instances of error accounted for

□ 2. EXPECTED VS. OBSERVED BEHAVIOR DOCUMENTED
    □ Expected behavior clearly described (step-by-step)
    □ Observed behavior clearly described (step-by-step)
    □ Steps mirror each other for easy comparison
    □ Divergence point clearly identified
    □ Impact quantified and described
    □ Based on code analysis, not assumptions

□ 3. CODE LOCATION VERIFICATION
    □ Exact file path confirmed: [path]
    □ Exact line numbers confirmed: [lines]
    □ Function/method name confirmed: [name]
    □ Code snippet extracted and reviewed

□ 3. ROOT CAUSE VALIDATION
    □ Proposed cause explains all symptoms
    □ Cause is consistent with code behavior
    □ No alternative explanations overlooked
    □ Evidence supports conclusion

□ 4. SOLUTION CORRECTNESS
    □ Solution targets identified root cause
    □ Solution is technically sound
    □ Solution addresses all error instances
    □ No obvious flaws in approach

□ 5. COMPATIBILITY CHECK
    □ Python 2.7 compatible (CRITICAL)
    □ Compatible with existing dependencies
    □ No conflicts with Plex framework
    □ No breaking changes to API/interface

□ 6. DEPENDENCY ANALYSIS
    □ New dependencies identified: [list or "none"]
    □ New dependencies available for Python 2.7
    □ Installation method documented
    □ Fallback if dependency unavailable

□ 7. COMPATIBILITY CHECK
    □ Python 2.7 compatible (CRITICAL)
    □ Compatible with existing dependencies
    □ No conflicts with Plex framework
    □ No breaking changes to API/interface

□ 8. DEPENDENCY ANALYSIS
    □ New dependencies identified: [list or "none"]
    □ New dependencies available for Python 2.7
    □ Installation method documented
    □ Fallback if dependency unavailable

□ 9. IMPACT ASSESSMENT
    □ Functions affected: [list]
    □ Data structures affected: [list]
    □ Agents affected: [count]
    □ Risk level assessed: [Low/Medium/High]

□ 10. SIDE EFFECT ANALYSIS
    □ No unintended consequences identified
    □ Backward compatibility maintained
    □ Existing functionality preserved
    □ Error handling adequate

□ 11. TESTING FEASIBILITY
    □ Test approach defined
    □ Test data available
    □ Success criteria clear
    □ Rollback plan documented

□ 12. RESEARCH QUALITY
     □ Multiple sources consulted (minimum 3)
     □ All sources cited with URLs
     □ Recent information (prefer <2 years old)
     □ Information cross-validated

□ 13. IMPLEMENTATION CLARITY
     □ Steps are specific and actionable
     □ Code examples provided
     □ File locations specified
     □ Prerequisites documented

□ 14. CONFIDENCE ASSESSMENT
     □ Confidence level assigned: [Low/Medium/High]
     □ Rationale for confidence documented
     □ Uncertainties acknowledged
     □ Alternative approaches noted if confidence low

OVERALL VALIDATION: □ PASS / □ FAIL / □ NEEDS REVIEW

If FAIL or NEEDS REVIEW:
  Issues Identified: [list]
  Additional Research Required: [describe]
  Reviewer Notes: [comments]
```

### Research Quality Checklist

```
For Error Pattern: [Description]

□ 1. CONTEXT7 RESEARCH
    □ Relevant libraries identified
    □ Documentation consulted
    □ Findings documented with citations
    □ Best practices noted

□ 2. WEBSITE INSPECTION
    □ Target URLs accessed successfully
    □ HTML structure documented
    □ Network analysis completed
    □ Anti-bot measures identified
    □ Screenshots captured (if applicable)
    □ Comparison to code expectations done

□ 3. EXA SEARCH
    □ Multiple search queries used (minimum 3)
    □ Top results reviewed (minimum 5 per query)
    □ Relevant findings extracted
    □ URLs cited
    □ Information cross-validated

□ 4. FORUM RESEARCH
    □ Plex forums searched
    □ Reddit searched
    □ GitHub issues searched
    □ Relevant threads identified
    □ Key findings extracted
    □ URLs cited

□ 5. ADDITIONAL RESOURCES
    □ Official documentation consulted
    □ Technical blogs reviewed
    □ Stack Overflow searched
    □ Other sources: [list]

□ 6. EVIDENCE QUALITY
    □ Primary sources preferred over secondary
    □ Information is recent and relevant
    □ Multiple sources confirm findings
    □ Contradictions resolved or noted

RESEARCH COMPLETENESS: □ COMPREHENSIVE / □ ADEQUATE / □ INSUFFICIENT

If INSUFFICIENT:
  Gaps Identified: [list]
  Additional Research Needed: [describe]
```

---

## PART 7: SPECIAL CONSIDERATIONS

### Python 2.7 Compatibility

**CRITICAL**: All solutions MUST be Python 2.7 compatible.

**Common Pitfalls to Avoid**:
- f-strings (Python 3.6+) → Use .format() or % formatting
- Type hints (Python 3.5+) → Omit type annotations
- async/await (Python 3.5+) → Use callbacks or threading
- Some newer libraries → Verify Python 2.7 support

**Validation Process**:
1. Check official library documentation for Python 2.7 support
2. Verify on PyPI that package supports Python 2.7
3. Consider testing in Python 2.7 environment if uncertain
4. Document any version-specific requirements

### Anti-Bot Protection Research

**Common Protection Mechanisms to Identify**:

1. **Cloudflare**:
   - JavaScript challenge page
   - Turnstile CAPTCHA
   - Bot management rules
   - Solutions: cloudscraper, Selenium, API if available

2. **Imperva/Incapsula**:
   - Cookie challenges
   - Fingerprinting
   - Solutions: Session management, proper headers

3. **PerimeterX**:
   - Browser fingerprinting
   - Behavioral analysis
   - Solutions: Selenium/Playwright

4. **Custom Protection**:
   - Rate limiting (429 errors)
   - IP blocking
   - User-Agent filtering
   - Solutions: Delays, proxies, header spoofing

**Detection Methods**:
- Check response HTML for challenge pages
- Look for specific JavaScript libraries
- Monitor network tab for protection-related requests
- Test with curl vs browser to compare responses

### Multi-Agent Deployment Strategy

**When Solution Affects All 21 Agents**:

1. **Test First on Single Agent**:
   - Choose agent with highest error rate (e.g., AdultFilmDatabase at 2.8%)
   - Deploy fix to single agent only
   - Monitor for 24-48 hours
   - Validate improvement

2. **Gradual Rollout**:
   - If successful, deploy to 3-5 agents
   - Monitor for unexpected issues
   - If stable, deploy to remaining agents

3. **Rollback Preparation**:
   - Backup all utils.py files before changes
   - Document original state
   - Have rollback script ready
   - Keep monitoring in place

### Website Structure Documentation

**When Inspecting Websites, Document**:

```
WEBSITE: [URL]
INSPECTION DATE: [Date/Time]
ACCESSED FROM: [Browser/Tool]

CURRENT STRUCTURE:
  Title Element:
    - Selector: [CSS selector or XPath]
    - Example: [HTML snippet]
    
  Search Results:
    - Container: [selector]
    - Individual items: [selector]
    - Data attributes: [list]
    
  Anti-Bot Protection:
    - Type: [Cloudflare/other]
    - Challenge: [Yes/No]
    - JavaScript Required: [Yes/No]

AGENT EXPECTATIONS (from code):
  - Expected selector: [from agent code]
  - Expected format: [from agent code]
  
MISMATCH ANALYSIS:
  - What changed: [description]
  - When it likely changed: [estimate]
  - Impact: [severity]

RECOMMENDED FIX:
  - Update selector to: [new selector]
  - Additional changes: [list]

SCREENSHOTS: [If taken, reference location]
```

---

## PART 8: OUTPUT REQUIREMENTS AND DELIVERABLES

### Primary Deliverable: Diagnostic Report

**File**: `plex_diagnostic_report.md` (or `.txt`)

**Requirements**:
- Comprehensive coverage of all major error patterns
- Clear root cause analysis for each issue
- Specific, actionable recommendations
- Complete research citations
- Validation confirmation for all solutions
- Implementation roadmap with estimates

**Quality Standards**:
- Professional technical writing
- Logical organization and flow
- Evidence-based conclusions
- No speculation without clearly marking it as such
- All claims supported by research or code inspection

### Secondary Deliverables

**1. Code Snippets File**: `diagnostic_code_snippets.md`
- Relevant code sections extracted during analysis
- Current vs. proposed implementations
- Organized by agent and function

**2. Research Bibliography**: `research_sources.md`
- Organized list of all sources consulted
- Categorized by type (documentation, forums, articles)
- Includes access dates and relevance notes

**3. Website Inspection Notes**: `website_analysis.md`
- Detailed findings from each website inspected
- Includes screenshots if captured
- Structure comparisons (expected vs. actual)

**4. Testing Checklist**: `implementation_testing_checklist.md`
- Detailed test plans for each recommended solution
- Success criteria
- Monitoring requirements

### Report Length Expectations

- **Executive Summary**: 1-2 pages
- **Per-Error Diagnosis**: 2-4 pages each (varies by complexity)
- **Implementation Roadmap**: 1-2 pages
- **Appendices**: As needed
- **Total**: 20-50 pages depending on number of issues

Prioritize depth and thoroughness over brevity. Technical stakeholders need complete information for decision-making.

---

## PART 9: SUCCESS CRITERIA AND QUALITY CHECKS

### Diagnostic Quality Metrics

**Before submitting the report, verify**:

✅ **Completeness**:
- [ ] All major error patterns from log analyzed
- [ ] All affected agents identified
- [ ] All research tools utilized
- [ ] All solutions validated
- [ ] Expected vs. Observed behavior documented for each error
- [ ] Expected results documented for each solution

✅ **Research Depth**:
- [ ] Minimum 3 sources per error type
- [ ] Multiple research methods used (Context7, Exa, browser, forums)
- [ ] Primary sources preferred
- [ ] Recent information (<2 years when possible)

✅ **Technical Accuracy**:
- [ ] Code locations verified
- [ ] Python 2.7 compatibility confirmed
- [ ] Solutions technically sound
- [ ] No logical contradictions

✅ **Actionability**:
- [ ] Solutions are specific, not vague
- [ ] Implementation steps clear
- [ ] Code examples provided
- [ ] Testing approach defined

✅ **Validation**:
- [ ] All solutions pass validation checklist
- [ ] Error messages align with code
- [ ] Side effects assessed
- [ ] Rollback plans documented

✅ **Citation Quality**:
- [ ] All sources cited with URLs
- [ ] Access dates included
- [ ] Relevance explained
- [ ] No broken links

✅ **Professional Standards**:
- [ ] Clear, technical writing
- [ ] Organized structure
- [ ] No typos or grammatical errors
- [ ] Consistent formatting

### Red Flags (Issues to Avoid)

❌ **Incomplete Research**:
- Using only one research method
- Not consulting actual code
- Skipping website inspection for URL errors
- No forum/community research

❌ **Invalid Solutions**:
- Python 3-only syntax/libraries
- Untested assumptions about code behavior
- Solutions that don't address root cause
- No consideration of side effects

❌ **Poor Documentation**:
- Vague recommendations ("improve error handling")
- No code examples
- Missing citations
- Unclear implementation steps
- Missing Expected vs. Observed behavior analysis
- Missing Expected Result for solutions
- No success/failure indicators defined

❌ **Validation Failures**:
- Solutions don't target error source
- Compatibility issues overlooked
- No testing plan
- Unrealistic confidence levels

### Final Review Questions

Before finalizing the report, answer:

1. **Would a developer be able to implement these fixes with just this report?**
   - If no: Add more detail

2. **Are all claims supported by evidence?**
   - If no: Add citations or remove unsupported claims

3. **Have all major errors been addressed?**
   - If no: Continue analysis

4. **Are solutions validated against actual code?**
   - If no: Perform code validation

5. **Is there a clear implementation priority?**
   - If no: Add prioritization with rationale

6. **Can stakeholders make informed decisions from this report?**
   - If no: Clarify recommendations and trade-offs

7. **Does each error include Expected vs. Observed behavior?**
   - If no: Add behavior analysis showing what should happen vs. what actually happens

8. **Does each solution include Expected Results?**
   - If no: Add specific, measurable outcomes, success indicators, and failure indicators

9. **Are success and failure criteria clearly defined?**
   - If no: Add measurable indicators for determining if solution worked

---

## CONCLUSION

This diagnostic process is designed to be:
- **Systematic**: Follows clear methodology
- **Thorough**: Uses all available research tools
- **Evidence-Based**: Every conclusion supported by research
- **Validated**: All solutions checked against actual code
- **Actionable**: Provides specific implementation guidance

The resulting diagnostic report should enable informed decision-making and successful implementation of fixes to improve the Plex metadata extraction system from its current 2-5% success rate to an estimated 30-90% depending on which solutions are implemented.

**Remember**: The goal is not just to identify problems, but to provide validated, implementable solutions that will materially improve system performance.
