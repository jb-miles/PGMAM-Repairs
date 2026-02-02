# Phase 2: Diagnostics - Implementation Prompt

## Overview

This prompt guides you through analyzing the aggregated log report to diagnose root causes of metadata extraction failures, researching solutions using available tools, validating recommendations against actual code, and producing an actionable diagnostic report with prioritized fixes.

**Purpose**: Research errors and propose validated fixes with explicit expected results.

**Inputs**: Aggregated log report from Phase 1

**Outputs**: 
- Diagnostic report (`diagnostic_report_iteration_N.md`)
- Optional: Structured data (`diagnostic_report_iteration_N.json`)

**Estimated Time**: 30-60 minutes (first time) or 10-20 minutes (focused)

---

## Mission Statement

Analyze the aggregated Plex log report to:

1. **Systematically diagnose** all major error patterns
2. **Multi-source research** each error type using available tools
3. **Determine root causes** (not just symptoms)
4. **Validate solutions** against actual agent code
5. **Provide specific, actionable recommendations** with priority rankings

---

## Prerequisites

### Required Knowledge
- Web scraping techniques and anti-bot protection
- Python 2.7 compatibility requirements
- HTML/XPath/CSS selector debugging
- HTTP status codes and error handling
- Plex metadata agent architecture

### Required Inputs
- Aggregated log report from Phase 1
- Access to PGMA agent codebase for validation
- Internet access for research (Context7, Exa, web browsing)

### Research Tools Available
1. **Context7** - Library documentation lookup
2. **Exa Search** - Semantic web search
3. **Web Browser** - Live site inspection
4. **Forums/Community** - Plex forums, Reddit, GitHub
5. **Code Inspection** - Direct agent code review

---

## Step-by-Step Implementation Guide

### Step 1: Analyze Error Patterns from Aggregated Log

For each error type identified in the aggregated log:

```python
# Example error pattern analysis structure
ERROR_TYPE = "IAFD HTTP 403 Forbidden"
INSTANCES = 367
AFFECTED_AGENTS = ["All 21 agents utilizing IAFD enrichment"]
AFFECTED_FUNCTIONS = ["getFilmOnIAFD()", "matchCast()", "matchDirectors()"]
CODE_LOCATIONS = ["utils.py lines 373-6020"]

SYMPTOM_ANALYSIS = {
    'error_message': "HTTP Error 403 Forbidden",
    'urls_failing': "https://www.iafd.com/ramesearch.asp?searchtype=comprehensive&searchstring=*",
    'failure_rate': "100% (367/367 attempts)",
    'first_observed': "Late 2023 (from forum reports)"
}
```

### Step 2: Document Expected vs. Observed Behavior

**CRITICAL REQUIREMENT**: Every error analysis MUST include Expected vs. Observed Behavior

```markdown
## EXPECTED VS. OBSERVED BEHAVIOR

### EXPECTED BEHAVIOR (What the code was designed to do):
1. Agent calls getFilmOnIAFD() with film title
2. HTTP request to IAFD search endpoint returns 200 OK
3. HTML response contains search results
4. XPath selectors extract film metadata (studio, duration, cast)
5. FILMDICT is populated with IAFD enrichment data
6. Function returns successfully with FoundOnIAFD = 'Yes'
7. Subsequent matchCast() and matchDirectors() calls succeed
8. Final metadata includes IAFD-sourced information

### OBSERVED BEHAVIOR (What actually happens):
1. Agent calls getFilmOnIAFD() with film title ✓
2. HTTP request to IAFD returns 403 Forbidden ✗
3. No HTML response received (exception raised) ✗
4. XPath selectors never execute (request failed) ✗
5. FILMDICT not populated with IAFD data ✗
6. Function fails, FoundOnIAFD remains unset or 'No' ✗
7. matchCast() and matchDirectors() calls also fail with 403 ✗
8. Final metadata missing all IAFD-sourced information ✗

### IMPACT:
• No cast enrichment (missing performer photos, bios, aliases)
• No director enrichment (missing director information)
• No film metadata validation (IAFD acts as secondary source)
• Reduced metadata quality and completeness
• User experience degraded (incomplete cast information)

### DIVERGENCE POINT: Step 2 - HTTP request failure
REASON: IAFD.com implemented anti-bot protection
```

### Step 3: Multi-Tool Research Process

For EACH diagnosed error type, perform ALL applicable research:

#### Research Step 1: Context7 Library Documentation

**Questions to Answer**:
- Is the library being used correctly?
- Are there deprecated methods?
- Are there better alternatives?
- What are common pitfalls?

**Example Queries**:
```
"lxml xpath selectors best practices"
"lxml etree parsing HTML with namespaces"
"requests handling 403 Forbidden errors"
"Plex metadata agent framework"
```

**Document Findings**:
```markdown
### Research Method 1 - Context7 (Python requests library):
Finding: Default User-Agent header identifies as Python
Source: requests library documentation
Evidence: "Python-urllib/2.7" user agent easily flagged by anti-bot systems
```

#### Research Step 2: Live Website Inspection

**For URL-related errors**:

1. **Manual Navigation Test**:
   - Can you access the URL in a browser?
   - What does the actual page look like?
   - Is there anti-bot protection visible?

2. **Structure Comparison**:
```markdown
AGENT EXPECTS (from code):
<div class="movie-title">Title Here</div>

ACTUAL WEBSITE (from inspection):
<h1 data-testid="title-element">Title Here</h1>

DIAGNOSIS: Selector mismatch - website redesigned
```

3. **Network Analysis**:
```markdown
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
"adult website metadata scraping 2024"
```

3. **Community Knowledge**:
```
"PGMA Plex agent not working"
"gay metadata agent 403 error"
site:forums.plex.tv adult metadata
```

**Document Findings**:
```markdown
### Research Method 3 - Exa Search:
Query: "IAFD.com blocking Python scraping 403"
Top Results:
  1. [URL] - Similar issue, solution: Enhanced headers
  2. [URL] - IAFD anti-bot discussion, dated: 2023-11
Key Findings:
  • IAFD implemented Cloudflare in Q4 2023
  • Community reports 100% block rate for simple requests
  • Successful workarounds: Enhanced headers, Selenium, API if available
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
```markdown
### Research Method 4 - Forum Search:
Platform: Plex Forums
Relevant Threads:
  1. [URL] - User reports same issue, dated: 2024-01-15
     Solution attempted: Enhanced headers
     Result: Partial success (30% improvement)
```

### Step 4: Synthesize Root Cause

**Combine all research into root cause determination**:

```markdown
## ROOT CAUSE DETERMINATION

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

### EVIDENCE:
- All IAFD URLs return 403 (100% failure rate)
- Browser access works (manual testing confirms)
- Error started appearing in late 2023 (forum reports)
- Code at utils.py line 373 uses basic requests.get()
- Context7 confirms Python User-Agent is easily detected
- Exa search confirms Cloudflare implementation
- Forum reports confirm 100% block rate for simple requests
```

### Step 5: Formulate Solutions with Expected Results

**CRITICAL REQUIREMENT**: Every solution MUST include Expected Result of Implementation

```markdown
## RECOMMENDED SOLUTIONS

### SOLUTION 1-A: Enhanced Headers (Quick Fix)

**Priority**: HIGH
**Complexity**: LOW (2-3 hours)
**Expected Improvement**: 0% → 20-30% success rate
**Risk**: LOW

#### EXPECTED RESULT OF IMPLEMENTATION:

**IMMEDIATE EFFECTS (Within 24 hours):**
• IAFD HTTP 403 errors reduced from 367/367 (100%) to ~250/367 (68%)
• Successful IAFD requests increase from 0% to 20-30%
• getFilmOnIAFD() returns data for some films instead of always failing
• matchCast() succeeds for ~20-30% of unmatched performers
• matchDirectors() succeeds for ~20-30% of unmatched directors

**METADATA QUALITY IMPROVEMENTS:**
• Cast photos appear for ~20-30% more performers
• Performer bios and aliases populated for enriched cast
• Film duration validated against IAFD for matched films
• Studio information cross-referenced with IAFD

**SYSTEM BEHAVIOR CHANGES:**
• Log errors decrease from 367 to ~250 failures per analysis period
• Processing time increases by 2-3 seconds per film (rate limiting)
• Session cookies maintained across requests (lower overhead)
• More realistic traffic pattern (less bot-like)

**LIMITATIONS:**
• Still ~70% failure rate (Cloudflare may block some requests)
• Success rate may degrade over time if IAFD tightens protection
• No guarantee against future blocking
• May not work if IP gets flagged

**SUCCESS INDICATORS:**
✓ 403 errors in logs reduced by at least 20%
✓ FoundOnIAFD = 'Yes' appears in FILMDICT for some films
✓ Cast photos begin appearing in Plex for matched performers
✓ No increase in other error types

**FAILURE INDICATORS:**
✗ 403 error rate unchanged or increased
✗ New errors appear (429 rate limiting, connection timeouts)
✗ All requests still failing after 48 hours

**IF THIS SOLUTION DOESN'T MEET EXPECTATIONS:**
→ Proceed to Solution 1-B (CloudScraper) for more aggressive approach
→ Or proceed to Solution 1-C (GEVI alternative) for strategic pivot

#### Implementation:
1. Add browser-realistic User-Agent header
2. Include Accept, Accept-Language, Accept-Encoding headers
3. Implement requests.Session() for cookie persistence
4. Add 2-3 second delay between requests

**Code Changes:**
File: [Agent].bundle/Contents/Code/utils.py
Lines: 373-380, 5569-5600, 5724-5800

**BEFORE:**
```python
response = requests.get(url)
```

**AFTER:**
```python
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
}

session = requests.Session()
time.sleep(2)  # Rate limiting
response = session.get(url, headers=headers, timeout=30)
```

**Testing Plan:**
1. Test single IAFD search with new headers
2. Monitor response codes (expect 200 instead of 403)
3. Verify HTML parsing still works
4. Test with 5-10 different searches
5. Monitor for rate limiting (429 errors)

**Validation Against Code:**
✓ Compatible with Python 2.7 (requests.Session() supported)
✓ No dependency changes required
✓ Backward compatible (fallback to requests.get() if Session fails)
✓ Affects correct code locations (validated against error messages)
```

### Step 6: Validate Against Actual Code

**Before finalizing recommendations, validate**:

```markdown
## CODE VALIDATION

### Error Message Alignment:
✓ Error message matches code location
✓ Error frequency matches diagnosis
✓ All instances of error accounted for

### Expected vs. Observed Behavior:
✓ Expected behavior clearly described (step-by-step)
✓ Observed behavior clearly described (step-by-step)
✓ Steps mirror each other for easy comparison
✓ Divergence point clearly identified
✓ Impact quantified and described
✓ Based on code analysis, not assumptions

### Code Location Verification:
✓ Exact file path confirmed: utils.py
✓ Exact line numbers confirmed: 373-380
✓ Function/method name confirmed: getFilmOnIAFD()
✓ Code snippet extracted and reviewed

### Root Cause Validation:
✓ Proposed cause explains all symptoms
✓ Cause is consistent with code behavior
✓ No alternative explanations overlooked
✓ Evidence supports conclusion

### Solution Correctness:
✓ Solution targets identified root cause
✓ Solution is technically sound
✓ Solution addresses all error instances
✓ No obvious flaws in approach

### Compatibility Check:
✓ Python 2.7 compatible (CRITICAL)
✓ Compatible with existing dependencies
✓ No conflicts with Plex framework
✓ No breaking changes to API/interface

### Dependency Analysis:
✓ New dependencies identified: None
✓ New dependencies available for Python 2.7: N/A
✓ Installation method documented: N/A
✓ Fallback if dependency unavailable: N/A

### Impact Assessment:
✓ Functions affected: getFilmOnIAFD(), matchCast(), matchDirectors()
✓ Data structures affected: FILMDICT, AGENTDICT
✓ Agents affected: All 21 agents (shared utils.py)
✓ Risk level assessed: LOW

### Side Effect Analysis:
✓ No unintended consequences identified
✓ Backward compatibility maintained
✓ Existing functionality preserved
✓ Error handling adequate

### Testing Feasibility:
✓ Test approach defined
✓ Test data available
✓ Success criteria clear
✓ Rollback plan documented

### Research Quality:
✓ Multiple sources consulted (minimum 3)
✓ All sources cited with URLs
✓ Recent information (<2 years when possible)
✓ Information cross-validated

### Implementation Clarity:
✓ Steps are specific and actionable
✓ Code examples provided
✓ File locations specified
✓ Prerequisites documented

### Confidence Assessment:
✓ Confidence level assigned: HIGH (85%)
✓ Rationale for confidence documented
✓ Uncertainties acknowledged
✓ Alternative approaches noted if confidence low
```

---

## Diagnostic Report Structure

Your final report should follow this structure:

```markdown
# PLEX MEDIA SERVER PLUGIN DIAGNOSTIC REPORT

**Generated**: [timestamp]
**Analysis Period**: [log timeframe]
**Codebase Version**: PGMA (21 agents)

---

## EXECUTIVE SUMMARY

**PRIMARY FINDINGS:**
• [Total error count] errors analyzed across [N] agents
• [N] distinct error patterns identified
• [N] root causes determined
• [N] actionable solutions proposed
• Estimated improvement: [X]% → [Y]% success rate

**CRITICAL ISSUES (Require Immediate Attention):**
1. [Issue name] - Affecting [N] agents - [Impact description]
2. [Issue name] - Affecting [N] agents - [Impact description]

**RECOMMENDED PRIORITY:**
Phase 1: [High-priority fixes] - Est. 2-5 hours - Impact: [X]% improvement
Phase 2: [Medium-priority fixes] - Est. 5-10 hours - Impact: [Y]% improvement
Phase 3: [Long-term solutions] - Est. 20-40 hours - Impact: [Z]% improvement

---

## DETAILED DIAGNOSTICS BY ERROR TYPE

### ERROR TYPE 1: IAFD HTTP 403 FORBIDDEN (367 instances, 100% of IAFD requests)

**AFFECTED AGENTS**: All 21 agents utilizing IAFD enrichment
**AFFECTED FUNCTIONS**: getFilmOnIAFD(), matchCast(), matchDirectors()
**CODE LOCATIONS**: utils.py lines 373-6020

**SYMPTOM ANALYSIS:**
Error Message: "HTTP Error 403 Forbidden"
URLs Failing: https://www.iafd.com/ramesearch.asp?searchtype=comprehensive&searchstring=*
Failure Rate: 100% (367/367 attempts)
First Observed: Late 2023

**EXPECTED VS. OBSERVED BEHAVIOR:**

[Include detailed Expected vs Observed analysis as shown in Step 2]

**ROOT CAUSE INVESTIGATION:**

[Include multi-tool research findings as shown in Step 3]

**ROOT CAUSE DETERMINATION:**

[Include synthesized root cause as shown in Step 4]

**CODE VALIDATION:**

[Include validation checklist as shown in Step 6]

**RECOMMENDED SOLUTIONS:**

[Include prioritized solutions with Expected Results as shown in Step 5]

---

## CROSS-CUTTING RECOMMENDATIONS

**INFRASTRUCTURE IMPROVEMENTS:**
1. [Recommendation with rationale]
2. [Recommendation with rationale]

**MONITORING ENHANCEMENTS:**
1. [Recommendation for better diagnostics]
2. [Recommendation for error tracking]

**PREVENTIVE MEASURES:**
1. [How to avoid similar issues in future]
2. [Code quality improvements]

---

## IMPLEMENTATION ROADMAP

**PHASE 1: Quick Wins (Week 1) - Estimated 5-8 hours**
┌──────────────────────────────────────────────────────────────┐
│ Task 1.1: Implement Enhanced Headers for IAFD         │
│   • Modify utils.py getFilmOnIAFD() function          │
│   • Add browser-like headers                             │
│   • Implement session management                           │
│   • Deploy to all 21 agents                            │
│   Expected Impact: 20-30% success rate improvement      │
│   Testing: 2 hours                                     │
│   Implementation: 3 hours                              │
└──────────────────────────────────────────────────────────────┘

**PHASE 2: Medium-Term Fixes (Week 2-3) - Estimated 15-20 hours**
[Additional fixes]

**PHASE 3: Strategic Solutions (Month 2) - Estimated 30-40 hours**
[Long-term architectural improvements]

---

## RESEARCH CITATIONS

**Context7 Documentation Consulted:**
1. [Library name] - [Specific documentation page] - [Finding]
2. [...]

**Exa Search Results:**
1. [URL] - [Title] - [Key finding]
2. [...]

**Website Inspections Performed:**
1. IAFD.com - [Date/time] - [Findings]
2. AEBN.com - [Date/time] - [Findings]
3. [...]

**Forum Research:**
1. [Platform] - [Thread URL] - [Finding]
2. [...]

---

## VALIDATION SUMMARY

**Solutions Validated Against:**
✓ Actual agent code (all 21 agents' utils.py inspected)
✓ Error message locations cross-referenced
✓ Python 2.7 compatibility verified
✓ Dependency conflicts checked
✓ Side effects analyzed
✓ Rollback plans documented

**Confidence Levels:**
• IAFD 403 Fix (Solution 1-A): HIGH (85%) - Based on successful similar implementations
• Title Match Fix (AEBN): MEDIUM (60%) - Requires testing against live site
• Alternative Source (GEVI): HIGH (90%) - Existing infrastructure, known to work

---

## APPENDICES

**APPENDIX A: Code Snippets**
[Actual code sections referenced in diagnostics]

**APPENDIX B: Website Inspection Screenshots**
[Visual evidence of website structure changes]

**APPENDIX C: Error Message Catalog**
[Complete list of unique error messages with frequency]

**APPENDIX D: Testing Checklists**
[Detailed test plans for each solution]

---

## END OF DIAGNOSTIC REPORT
```

---

## Validation Checklist

Before considering your diagnostic report complete, verify:

- [ ] Every major error pattern has a diagnosed root cause
- [ ] Each diagnosis is supported by evidence (code inspection, web analysis, documentation)
- [ ] Recommendations are validated against actual agent code
- [ ] Solutions are prioritized by impact and implementation difficulty
- [ ] Report includes verification steps for each fix
- [ ] All research sources are cited
- [ ] **Every error includes Expected vs. Observed behavior analysis**
- [ ] **Every solution includes Expected Result of Implementation**
- [ ] Python 2.7 compatibility confirmed for all solutions
- [ ] Rollback plans documented for each solution
- [ ] Success/failure indicators clearly defined

---

## Common Pitfalls to Avoid

1. **Incomplete Research**: Using only one research method
2. **Invalid Solutions**: Python 3-only syntax/libraries
3. **Untested Assumptions**: Assuming code behavior without inspection
4. **Solutions That Don't Address Root Cause**: Treating symptoms, not causes
5. **No Consideration of Side Effects**: Not analyzing potential impacts
6. **Poor Documentation**: Vague recommendations without code examples
7. **Missing Expected Results**: Not defining what success looks like
8. **No Validation**: Not checking solutions against actual code

---

## Integration with Other Phases

This phase feeds into:

- **Phase 3 (Implementation)**: Diagnostic report provides prioritized fixes with implementation details
- **Phase 4 (Testing)**: Expected Results from diagnostic report become success criteria
- **Phase 5 (Post-Mortem)**: Expected vs Actual comparison uses diagnostic expectations

---

## Success Criteria

Your diagnostic report is successful when:

1. ✅ All major error patterns from log analyzed
2. ✅ Each error includes Expected vs. Observed behavior
3. ✅ Root causes determined with supporting evidence
4. ✅ Solutions validated against actual code
5. ✅ Every solution includes Expected Results with success/failure indicators
6. ✅ Solutions are prioritized by impact and difficulty
7. ✅ Implementation steps are specific and actionable
8. ✅ Code examples provided for each solution
9. ✅ Python 2.7 compatibility confirmed
10. ✅ Rollback plans documented

---

## Next Steps

After completing this phase:

1. Review prioritized solutions in diagnostic report
2. Select highest-priority fix to implement
3. Proceed to **Phase 3: Implementation** to apply the fix
4. Use Expected Results as success criteria for testing phase

---

## Related Files

- **Master Prompt**: [`plex_improvement_agent_master_prompt.md`](../prompts/plex_improvement_agent_master_prompt.md)
- **Phase 1 Prompt**: [`phase1_log_aggregation_prompt.md`](../prompts/phase1_log_aggregation_prompt.md)
- **Phase 3 Prompt**: [`phase3_implementation_prompt.md`](../prompts/phase3_implementation_prompt.md)
- **Existing Script**: [`../scripts/diagnose_from_report.py`](../scripts/diagnose_from_report.py) (reference implementation)
