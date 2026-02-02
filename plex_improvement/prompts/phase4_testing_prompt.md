# Phase 4: Testing & Validation - Implementation Prompt

## Overview

This prompt guides you through validating implemented fixes by actively triggering metadata refreshes via Plex API, re-aggregating logs, comparing before/after metrics, and making objective keep/rollback decisions.

**Purpose**: Validate fixes through active testing (30-45 minutes vs 24+ hours passive waiting).

**Inputs**: 
- Implementation results from Phase 3
- Baseline metrics from Phase 1
- Expected Results from Phase 2

**Outputs**: 
- Test report (`test_report_[fix_name]_iteration_N.md`)
- Updated metrics (`post_implementation_logs.txt`)
- Decision record (`testing_decisions.json`)

**Estimated Time**: 30-45 minutes per fix

---

## Mission Statement

Validate that implemented fixes achieve their expected results by:

1. **Actively triggering** metadata refreshes (no waiting required!)
2. **Testing exact items** that previously failed
3. **Re-aggregating logs** with fresh test data
4. **Comparing before/after** metrics objectively
5. **Making data-driven** keep/rollback decisions

---

## Prerequisites

### Required Knowledge
- Plex API usage for metadata refresh
- HTTP requests and XML parsing
- Metric comparison and statistical analysis
- Decision framework application

### Required Inputs
- Implementation completed successfully
- Plex Media Server running
- Plex API token (auto-detected or manual)
- Baseline log aggregation report

### Active Testing Advantage

**Instead of passively waiting hours for natural metadata activity, we ACTIVELY TRIGGER metadata refreshes:**

- **Immediate feedback** (minutes, not hours)
- **Targeted testing** (test exact items that had errors)
- **Controlled validation** (reproducible results)
- **Faster iteration** (multiple tests in one day)

---

## Step-by-Step Implementation Guide

### Step 1: Pre-Test Preparation

```python
# Pre-test checklist
PREPARATION_CHECKLIST = [
    'Verify fix is active (implementation completed)',
    'Plex Media Server restarted',
    'Plugin loaded without errors',
    'No immediate syntax/import errors',
    'Gather baseline metrics from Phase 1',
    'Note expected improvements from diagnostic report',
    'Get Plex API token',
    'Verify Plex API accessible (http://127.0.0.1:32400)',
    'Determine number of items to test (default: 20)'
]
```

### Step 2: Get Plex API Token

```python
import requests
import re
from pathlib import Path

def get_plex_token():
    """Get Plex token from preferences or user input"""
    
    # Try to read from Plex preferences
    prefs_path = Path.home() / "Library/Application Support/Plex Media Server/Preferences.xml"
    
    if prefs_path.exists():
        with open(prefs_path, 'r') as f:
            content = f.read()
            match = re.search(r'PlexOnlineToken="([^"]+)"', content)
            if match:
                return match.group(1)
    
    # If not found, ask user
    print("\nPlex token not found automatically.")
    print("To get your token:")
    print("  1. Open Plex Web (http://localhost:32400/web)")
    print("  2. Play any item and press Ctrl+Shift+I (or Cmd+Option+I on Mac)")
    print("  3. Go to Console tab")
    print("  4. Type: localStorage.getItem('myPlexAccessToken')")
    print("  5. Copy the token (without quotes)")
    
    return input("\nEnter Plex token: ").strip()
```

### Step 3: Get Library Sections

```python
def get_library_sections(plex_url, token):
    """Get all library sections"""
    
    url = "{}/library/sections".format(plex_url)
    headers = {"X-Plex-Token": token}
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        raise Exception("Failed to get library sections: {}".format(response.status_code))
    
    # Parse XML response
    import xml.etree.ElementTree as ET
    root = ET.fromstring(response.content)
    
    sections = []
    for directory in root.findall('.//Directory'):
        sections.append({
            'key': directory.get('key'),
            'title': directory.get('title'),
            'type': directory.get('type')
        })
    
    return sections
```

### Step 4: Get Library Items

```python
def get_all_library_items(plex_url, token, section_key):
    """Get all items in a library section"""
    
    url = "{}/library/sections/{}/all".format(plex_url, section_key)
    headers = {"X-Plex-Token": token}
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        raise Exception("Failed to get library items: {}".format(response.status_code))
    
    import xml.etree.ElementTree as ET
    root = ET.fromstring(response.content)
    
    items = []
    for video in root.findall('.//Video'):
        items.append({
            'key': video.get('key'),
            'title': video.get('title'),
            'ratingKey': video.get('ratingKey')
        })
    
    return items
```

### Step 5: Trigger Metadata Refresh

```python
def refresh_metadata(plex_url, token, rating_key):
    """Trigger metadata refresh for a specific item"""
    
    url = "{}/library/metadata/{}/refresh".format(plex_url, rating_key)
    headers = {"X-Plex-Token": token}
    
    # Force refresh with agent (not just local)
    params = {
        'force': '1'  # Force re-scrape from agents
    }
    
    response = requests.put(url, headers=headers, params=params)
    
    return response.status_code == 200
```

### Step 6: Run Active Test

```python
import time

def test_fix_actively(plex_url, token, library_section_key, max_items=20):
    """Active testing: refresh metadata on items that previously had errors"""
    
    print("\n" + "=" * 80)
    print("ACTIVE METADATA REFRESH TESTING")
    print("=" * 80)
    
    # Get library items
    print("\nGetting items from library section {}...".format(library_section_key))
    all_items = get_all_library_items(plex_url, token, library_section_key)
    print("   Total items in library: {}".format(len(all_items)))
    
    # Limit to reasonable number for testing
    items_to_test = all_items[:max_items]
    print("   Testing with first {} items".format(len(items_to_test)))
    
    print("\nTriggering metadata refreshes...")
    
    successful_refreshes = 0
    failed_refreshes = 0
    
    for i, item in enumerate(items_to_test, 1):
        print("   [{}/{}] Refreshing: {}".format(i, len(items_to_test), item['title']))
        
        if refresh_metadata(plex_url, token, item['ratingKey']):
            successful_refreshes += 1
            print("       ✓ Refresh triggered")
        else:
            failed_refreshes += 1
            print("       ✗ Refresh failed")
        
        # Small delay to avoid overwhelming Plex
        time.sleep(2)
    
    print("\nRefresh Summary:")
    print("   Successful: {}/{}".format(successful_refreshes, len(items_to_test)))
    print("   Failed: {}/{}".format(failed_refreshes, len(items_to_test)))
    
    print("\nWaiting 60 seconds for metadata processing...")
    time.sleep(60)
    
    print("\n✓ Active testing complete - logs should now contain fresh data")
    
    return {
        'items_tested': len(items_to_test),
        'successful_refreshes': successful_refreshes,
        'failed_refreshes': failed_refreshes
    }
```

### Step 7: Re-Aggregate Logs with Fresh Test Data

```bash
# Re-run log aggregation on logs from the last hour
# This captures just the metadata refreshes we triggered
python aggregate_plex_logs.py \
    --output post_fix_logs.txt \
    --timeframe 1  # Last 1 hour contains our active test
```

**What to Look For**:
- Error counts should be lower than baseline
- Success indicators (like "FoundOnIAFD") should appear
- Metadata fields should be populated
- No new error types introduced

### Step 8: Compare Metrics

```python
import re

class MetricComparison:
    def __init__(self, baseline_report, current_report):
        self.baseline = self.parse_report(baseline_report)
        self.current = self.parse_report(current_report)
    
    def parse_report(self, report_path):
        """Extract metrics from aggregation report"""
        metrics = {
            'total_search_ops': 0,
            'titles_found': 0,
            'title_failures': 0,
            'model_errors': 0,
            'url_errors': 0,
            'agent_stats': {}
        }
        
        with open(report_path, 'r') as f:
            content = f.read()
        
        # Extract executive summary metrics
        metrics['total_search_ops'] = self.extract_number(content, r'Total Search Operations:\s+(\d+)')
        metrics['titles_found'] = self.extract_number(content, r'Titles Found Events:\s+(\d+)')
        metrics['title_failures'] = self.extract_number(content, r'Title Match Failures:\s+(\d+)')
        metrics['model_errors'] = self.extract_number(content, r'Model Read Errors:\s+(\d+)')
        metrics['url_errors'] = self.extract_number(content, r'URL Fetch Errors:\s+(\d+)')
        
        return metrics
    
    def extract_number(self, text, pattern):
        """Extract number from text using regex"""
        match = re.search(pattern, text)
        return int(match.group(1)) if match else 0
    
    def compare_metric(self, metric_name):
        """Compare a specific metric between baseline and current"""
        baseline_val = self.baseline[metric_name]
        current_val = self.current[metric_name]
        
        if baseline_val == 0:
            percent_change = 100 if current_val > 0 else 0
        else:
            percent_change = ((current_val - baseline_val) / baseline_val) * 100
        
        return {
            'metric': metric_name,
            'baseline': baseline_val,
            'current': current_val,
            'change': current_val - baseline_val,
            'percent_change': percent_change,
            'improved': current_val < baseline_val  # For error metrics, lower is better
        }
    
    def generate_comparison_report(self):
        """Generate full comparison report"""
        print("=" * 80)
        print("BEFORE/AFTER COMPARISON REPORT")
        print("=" * 80)
        
        metrics_to_compare = [
            'total_search_ops',
            'titles_found',
            'title_failures',
            'model_errors',
            'url_errors'
        ]
        
        results = []
        
        for metric in metrics_to_compare:
            result = self.compare_metric(metric)
            results.append(result)
            
            # Print comparison
            print("\n{}:".format(result['metric']))
            print("  Before: {}".format(result['baseline']))
            print("  After:  {}".format(result['current']))
            print("  Change: {:+d} ({:+.1f}%)".format(result['change'], result['percent_change']))
            
            if result['improved']:
                print("  Status: ✓ IMPROVED")
            elif result['change'] == 0:
                print("  Status: → UNCHANGED")
            else:
                print("  Status: ✗ WORSENED")
        
        return results
```

### Step 9: Evaluate Against Expected Results

```python
class SuccessEvaluator:
    def __init__(self, expected_results, actual_results):
        self.expected = expected_results
        self.actual = actual_results
    
    def evaluate_fix(self, fix_name):
        """Evaluate if fix met its success criteria"""
        
        print("\n" + "=" * 80)
        print("SUCCESS EVALUATION: {}".format(fix_name))
        print("=" * 80)
        
        # Get expected results from diagnostic report
        expected = self.expected[fix_name]
        
        print("\nEXPECTED RESULTS (From Diagnostic Report):")
        print("-" * 80)
        
        for item in expected['immediate_effects']:
            print("  • {}".format(item))
        
        print("\nACTUAL RESULTS (From Metric Comparison):")
        print("-" * 80)
        
        # Check each success indicator
        success_count = 0
        total_indicators = len(expected['success_indicators'])
        
        print("\n✓ SUCCESS INDICATORS:")
        for indicator in expected['success_indicators']:
            met = self.check_indicator(indicator, self.actual)
            if met:
                print("  ✓ {}".format(indicator))
                success_count += 1
            else:
                print("  ✗ {}".format(indicator))
        
        print("\n✗ FAILURE INDICATORS:")
        failure_detected = False
        for indicator in expected['failure_indicators']:
            detected = self.check_indicator(indicator, self.actual)
            if detected:
                print("  ✗ {}".format(indicator))
                failure_detected = True
            else:
                print("  ○ {} (not detected)".format(indicator))
        
        # Overall assessment
        success_rate = (success_count / total_indicators) * 100 if total_indicators > 0 else 0
        
        print("\nSUCCESS RATE: {}/{} ({:.0f}%)".format(success_count, total_indicators, success_rate))
        
        # Decision
        if failure_detected:
            decision = "ROLLBACK"
            reason = "Critical failure indicators detected"
        elif success_rate >= 75:
            decision = "KEEP"
            reason = "Met >=75% of success criteria"
        elif success_rate >= 50:
            decision = "MONITOR"
            reason = "Partial success - need more time or tweaking"
        else:
            decision = "ROLLBACK"
            reason = "Failed to meet minimum success criteria (<50%)"
        
        print("\nDECISION: {}".format(decision))
        print("   Reason: {}".format(reason))
        
        return {
            'fix_name': fix_name,
            'success_rate': success_rate,
            'success_count': success_count,
            'total_indicators': total_indicators,
            'failure_detected': failure_detected,
            'decision': decision,
            'reason': reason
        }
    
    def check_indicator(self, indicator_text, actual_metrics):
        """Check if an indicator condition is met"""
        
        # Example indicator: "403 errors in logs reduced by at least 20%"
        if "403 errors" in indicator_text.lower() and "reduced" in indicator_text.lower():
            baseline_403 = actual_metrics['url_errors']['baseline']
            current_403 = actual_metrics['url_errors']['current']
            
            if baseline_403 > 0:
                reduction_pct = ((baseline_403 - current_403) / baseline_403) * 100
                
                # Extract expected reduction from indicator text
                match = re.search(r'(\d+)%', indicator_text)
                expected_reduction = int(match.group(1)) if match else 20
                
                return reduction_pct >= expected_reduction
        
        return False
```

### Step 10: Make Decision

```python
def make_decision(evaluation_result):
    """Make and execute decision based on evaluation"""
    
    decision = evaluation_result['decision']
    fix_name = evaluation_result['fix_name']
    
    print("\n" + "=" * 80)
    print("EXECUTING DECISION: {} for {}".format(decision, fix_name))
    print("=" * 80)
    
    if decision == "KEEP":
        print("\n✓ Fix is successful and will be kept")
        print("  Actions:")
        print("    1. Document success in implementation log")
        print("    2. Mark fix as completed")
        print("    3. Proceed to next fix in queue")
        return 'proceed_to_next'
    
    elif decision == "MONITOR":
        print("\n⏱ Fix shows partial success - needs more time")
        print("  Actions:")
        print("    1. Wait additional 24 hours")
        print("    2. Re-run testing phase")
        print("    3. Re-evaluate with more data")
        return 'wait_and_retest'
    
    elif decision == "ROLLBACK":
        print("\n⏪ Fix did not meet criteria - rolling back")
        print("  Actions:")
        print("    1. Stop Plex Media Server")
        print("    2. Restore files from backup")
        print("    3. Restart Plex Media Server")
        print("    4. Verify original state restored")
        print("    5. Document failure and try alternative solution")
        return 'try_alternative'
```

---

## Decision Framework

```
SUCCESS RATE    FAILURES     DECISION      ACTION
────────────────────────────────────────────────────────
≥ 75%           None         KEEP          Document success, proceed to next fix
50-74%          None         MONITOR       Wait 24h more, re-evaluate
50-74%          Minor        MODIFY        Tweak parameters, re-test
< 50%           None         ROLLBACK      Restore backup, try alternative
Any             Critical     ROLLBACK      Immediate rollback, fix is broken
────────────────────────────────────────────────────────
```

---

## Test Report Template

```markdown
# Fix Testing Report: Enhanced Headers for IAFD

**Test Date**: 2026-02-01T21:30:00
**Test Duration**: 45 minutes since implementation
**Agent(s)**: All 21 agents
**Status**: Success

## Executive Summary

The Enhanced Headers fix for IAFD achieved a 33.2% reduction in HTTP 403 errors, exceeding the 20% target. Successful IAFD requests increased from 0% to 24.5%, within the expected 20-30% range. Minor rate limiting (429 errors) appeared but is manageable.

**Decision**: KEEP

## Test Configuration

**Baseline Report**: reports/aggregated_logs_baseline.txt
**Post-Implementation Report**: reports/post_fix_logs.txt
**Time Period Analyzed**: 1 hour (active test)
**Log Lines Processed**: 1,247

## Expected Results (From Diagnostic Report)

### Immediate Effects
- IAFD HTTP 403 errors reduced from 367/367 (100%) to ~250/367 (68%)
- Successful IAFD requests increase from 0% to 20-30%
- getFilmOnIAFD() returns data for some films

### Success Indicators
- ✓ 403 errors in logs reduced by at least 20%
- ✓ FoundOnIAFD = 'Yes' appears in FILMDICT for some films
- ✓ Cast photos begin appearing in Plex
- ✓ No increase in other error types

### Failure Indicators
- ○ 403 error rate unchanged or increased (not detected)
- ○ New errors appear (429 rate limiting - minor, acceptable)
- ○ All requests still failing after 48 hours (not detected)

## Actual Results

### Metric Comparison

| Metric | Baseline | Current | Change | % Change | Status |
|--------|----------|---------|--------|----------|--------|
| Total Searches | 99 | 105 | +6 | +6.1% | → |
| Title Failures | 1548 | 1320 | -228 | -14.7% | ✓ |
| URL Errors | 367 | 245 | -122 | -33.2% | ✓ |
| Model Errors | 30 | 28 | -2 | -6.7% | → |

### Agent-Specific Results

**AEBN**:
- Success rate: 7.2% → 22.4% (+15.2%)
- Title match failures: 193 → 145 (-48)
- Metadata extractions: 15 → 45 (+30)

## Success Criteria Evaluation

**Success Indicators Met**: 3/4 (75%)
**Failure Indicators Detected**: 0/3 (0%)

### Detailed Evaluation

1. ✓ URL errors reduced by 33.2% (target: ≥20%)
2. ✓ Title match failures reduced by 14.7% (target: ≥10%)
3. ✗ Cast photos not yet appearing (may need more time)
4. ✓ No new critical error types introduced

## Log Analysis Highlights

### Positive Changes
- IAFD requests now succeed for ~25% of searches
- FoundOnIAFD = 'Yes' appears in logs for successful requests
- Overall error rate decreased significantly

### Concerns
- 15 new "429 Too Many Requests" errors (rate limiting)
- Minor, expected side effect of increased success rate
- Acceptable level, no action needed

## Decision and Rationale

**Decision**: KEEP

**Rationale**:
Fix met 75% of success criteria with no critical failure indicators. The 33.2% reduction in URL errors exceeds the 20% target, and title match improvements are trending positively. Cast photo appearance may require additional time or is a secondary effect. Rate limiting (429 errors) is minor and expected.

**Recommended Actions**:
1. Keep fix active
2. Monitor for 48 more hours to assess cast photo population
3. Proceed to next high-priority fix

## Next Steps

- [ ] Document fix as successfully implemented
- [ ] Update implementation log with test results
- [ ] Proceed to next fix: Update AEBN XPath Selectors
- [ ] OR: Return to loop coordinator for next iteration

## Appendices

### A. Full Metric Comparison
[Detailed data]

### B. Log Excerpts
[Relevant log snippets showing improvement]

### C. Rollback Instructions (if needed)
```bash
# Instructions to rollback this fix
```
```

---

## Validation Checklist

Before considering testing complete, verify:

- [ ] Active test executed (20 items refreshed)
- [ ] Logs re-aggregated with fresh test data
- [ ] Before/after metrics compared
- [ ] Success indicators evaluated
- [ ] Failure indicators checked
- [ ] Decision made (KEEP/MONITOR/ROLLBACK)
- [ ] Test report generated
- [ ] Results documented for loop coordinator
- [ ] Recommendations provided for next iteration

---

## Common Pitfalls to Avoid

1. **Passive Waiting**: Don't wait 24+ hours - use active testing
2. **Insufficient Test Data**: Test at least 20 items for statistical significance
3. **Ignoring New Errors**: Monitor for ALL error types, not just target metric
4. **Subjective Decisions**: Use objective criteria from diagnostic report
5. **Skipping Comparison**: Always compare before/after metrics
6. **No Documentation**: Document test results for post-mortem analysis

---

## Integration with Other Phases

This phase feeds into:

- **Phase 5 (Post-Mortem)**: Test data provides actual vs expected comparison
- **Phase 6 (Loop Coordination)**: Test results feed into loop decisions
- **Phase 3 (Implementation)**: Rollback decisions trigger implementation rollback

---

## Success Criteria

Your testing is successful when:

1. ✅ Active test executed (20+ items refreshed)
2. ✅ Logs re-aggregated with fresh data
3. ✅ Before/after metrics compared
4. ✅ Success indicators evaluated against expected results
5. ✅ Failure indicators checked
6. ✅ Objective decision made (KEEP/MONITOR/ROLLBACK)
7. ✅ Test report generated
8. ✅ Results documented for loop coordinator
9. ✅ Recommendations provided
10. ✅ Ready for next phase or rollback

---

## Next Steps

After completing this phase:

1. Review test results and decision
2. If KEEP: Proceed to next fix or return to loop coordinator
3. If ROLLBACK: Trigger rollback in Phase 3
4. If MONITOR: Wait and re-test later
5. Proceed to **Phase 5: Post-Mortem** for detailed analysis

---

## Related Files

- **Master Prompt**: [`plex_improvement_agent_master_prompt.md`](../prompts/plex_improvement_agent_master_prompt.md)
- **Phase 3 Prompt**: [`phase3_implementation_prompt.md`](../prompts/phase3_implementation_prompt.md)
- **Phase 5 Prompt**: [`phase5_postmortem_prompt.md`](../prompts/phase5_postmortem_prompt.md)
- **Existing Script**: [`../scripts/compare_metrics.py`](../scripts/compare_metrics.py) (reference implementation)
