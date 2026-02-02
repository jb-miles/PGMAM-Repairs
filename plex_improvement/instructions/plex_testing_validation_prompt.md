# Plex Media Server Fix Testing & Validation - Instruction Set

## PART 1: MISSION AND SCOPE

### Primary Mission
Validate that implemented fixes achieve their expected results by re-running log aggregation, comparing metrics, and making objective go/no-go decisions about each fix.

### Core Principles

1. **Evidence-Based**: Decisions based on actual metrics, not intuition
2. **Comparative Analysis**: Always compare before/after states
3. **Objective Criteria**: Use success/failure indicators from diagnostic report
4. **Statistical Significance**: Account for variance and sample size
5. **Honest Assessment**: If it didn't work, acknowledge and pivot

### Success Criteria

- [ ] Logs re-aggregated after sufficient test period
- [ ] Before/after metrics

 clearly compared
- [ ] Each fix objectively assessed against success criteria
- [ ] Decisions made: Keep / Rollback / Modify
- [ ] Results documented for loop coordinator
- [ ] Recommendations provided for next iteration

---

## PART 2: ACTIVE TESTING METHODOLOGY

### Active Testing via Plex API (No Waiting Required!)

Instead of passively waiting hours for natural metadata activity, we **actively trigger** metadata refreshes on items that were previously failing. This provides:
- **Immediate feedback** (minutes, not hours)
- **Targeted testing** (test exact items that had errors)
- **Controlled validation** (reproducible results)
- **Faster iteration** (multiple tests in one day)

### Testing Timeline

**Immediate Validation** (5 minutes after implementation):
- Verify Plex server restarted successfully
- Confirm plugin loaded without errors
- Check for syntax/import errors in logs

**Active Test Execution** (10-30 minutes):
- Identify films that had errors from baseline logs
- Trigger metadata refresh via Plex API for those films
- Monitor logs during refresh
- Check if refreshes succeed (previously failed)

**Results Aggregation** (5-10 minutes):
- Re-run log aggregation on fresh logs
- Compare before/after metrics
- Make keep/rollback decision

**Total Test Time**: ~30-45 minutes (vs 24+ hours passive waiting)

---

## PART 3: TEST EXECUTION WORKFLOW

### Phase 1: Pre-Test Preparation

```
□ 1. VERIFY FIX IS ACTIVE
    □ Implementation completed successfully
    □ Plex Media Server restarted
    □ Plugin loaded without errors
    □ No immediate syntax/import errors
    
□ 2. GATHER BASELINE METRICS
    □ Locate pre-implementation log aggregation report
    □ Extract key metrics (error counts, success rates)
    □ Note specific failure patterns
    □ Document expected improvements from diagnostic report
    
□ 3. PREPARE FOR ACTIVE TESTING
    □ Identify library section containing items to test
    □ Get Plex API token (auto-detected or manual)
    □ Verify Plex API accessible (http://127.0.0.1:32400)
    □ Determine number of items to test (default: 20)
```

### Phase 2: Active Metadata Refresh Testing

```python
#!/usr/bin/env python
"""
Active Plex metadata refresh testing
Triggers refreshes on previously failing items to test fixes
"""

import requests
import re
import time
from pathlib import Path

class PlexMetadataRefreshTester:
    def __init__(self, plex_url="http://127.0.0.1:32400", token=None):
        self.plex_url = plex_url
        self.token = token or self.get_plex_token()
        self.headers = {"X-Plex-Token": self.token}
        
    def get_plex_token(self):
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
        
    def get_library_sections(self):
        """Get all library sections"""
        url = f"{self.plex_url}/library/sections"
        response = requests.get(url, headers=self.headers)
        
        if response.status_code != 200:
            raise Exception(f"Failed to get library sections: {response.status_code}")
            
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
        
    def get_items_from_baseline(self, baseline_log_path, agent_name=None):
        """
        Extract film IDs that had errors from baseline aggregation log
        """
        
        print(f"\n🔍 Extracting failed items from baseline logs...")
        
        failed_items = []
        
        with open(baseline_log_path, 'r') as f:
            content = f.read()
            
        # Look for search operations in logs
        # Format: "Searching for matches for {'id': '47312', 'guid': '...', ...}"
        pattern = r"Searching for matches for \{'id': '(\d+)'"
        
        for match in re.finditer(pattern, content):
            item_id = match.group(1)
            if item_id not in failed_items:
                failed_items.append(item_id)
                
        print(f"   Found {len(failed_items)} items that were processed")
        
        # Could also look for specific error patterns to find only failed items
        # But safer to refresh all items that were attempted
        
        return failed_items
        
    def get_all_library_items(self, section_key):
        """Get all items in a library section"""
        url = f"{self.plex_url}/library/sections/{section_key}/all"
        response = requests.get(url, headers=self.headers)
        
        if response.status_code != 200:
            raise Exception(f"Failed to get library items: {response.status_code}")
            
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
        
    def refresh_metadata(self, rating_key):
        """
        Trigger metadata refresh for a specific item
        """
        url = f"{self.plex_url}/library/metadata/{rating_key}/refresh"
        
        # Force refresh with agent (not just local)
        params = {
            'force': '1'  # Force re-scrape from agents
        }
        
        response = requests.put(url, headers=self.headers, params=params)
        
        return response.status_code == 200
        
    def test_fix_actively(self, baseline_log_path, library_section_key, max_items=20):
        """
        Active testing: refresh metadata on items that previously had errors
        """
        
        print("\n" + "="*80)
        print("ACTIVE METADATA REFRESH TESTING")
        print("="*80)
        
        # Get library items
        print(f"\n📚 Getting items from library section {library_section_key}...")
        all_items = self.get_all_library_items(library_section_key)
        print(f"   Total items in library: {len(all_items)}")
        
        # Limit to reasonable number for testing
        items_to_test = all_items[:max_items]
        print(f"   Testing with first {len(items_to_test)} items")
        
        print(f"\n🔄 Triggering metadata refreshes...")
        
        successful_refreshes = 0
        failed_refreshes = 0
        
        for i, item in enumerate(items_to_test, 1):
            print(f"   [{i}/{len(items_to_test)}] Refreshing: {item['title']}")
            
            if self.refresh_metadata(item['ratingKey']):
                successful_refreshes += 1
                print(f"       ✓ Refresh triggered")
            else:
                failed_refreshes += 1
                print(f"       ✗ Refresh failed")
                
            # Small delay to avoid overwhelming Plex
            time.sleep(2)
            
        print(f"\n📊 Refresh Summary:")
        print(f"   Successful: {successful_refreshes}/{len(items_to_test)}")
        print(f"   Failed: {failed_refreshes}/{len(items_to_test)}")
        
        print(f"\n⏳ Waiting 60 seconds for metadata processing...")
        time.sleep(60)
        
        print(f"\n✓ Active testing complete - logs should now contain fresh data")
        
        return {
            'items_tested': len(items_to_test),
            'successful_refreshes': successful_refreshes,
            'failed_refreshes': failed_refreshes
        }

# Usage example
def run_active_test(baseline_log_path):
    """
    Run active metadata refresh test
    """
    
    tester = PlexMetadataRefreshTester()
    
    # Get library sections
    print("\n📚 Available Library Sections:")
    sections = tester.get_library_sections()
    
    for i, section in enumerate(sections, 1):
        print(f"   {i}. {section['title']} ({section['type']}) - Key: {section['key']}")
        
    # Find adult/gay movie library (usually the one being tested)
    # Or ask user to select
    adult_sections = [s for s in sections if 'gay' in s['title'].lower() or 'adult' in s['title'].lower()]
    
    if adult_sections:
        section_to_test = adult_sections[0]
        print(f"\n🎯 Auto-selected: {section_to_test['title']}")
    else:
        choice = int(input("\nSelect library section to test (number): ")) - 1
        section_to_test = sections[choice]
        
    # Run active test
    results = tester.test_fix_actively(
        baseline_log_path=baseline_log_path,
        library_section_key=section_to_test['key'],
        max_items=20  # Test with 20 items - fast but sufficient
    )
    
    return results

if __name__ == "__main__":
    run_active_test('aggregated_logs_baseline.txt')
```

### Phase 3: Re-Aggregate Logs with Fresh Test Data

After triggering metadata refreshes, the plugin logs now contain fresh attempts to scrape metadata. Re-aggregate these logs to see if the fix worked:

```bash
# Re-run log aggregation on logs from the last hour
# This captures just the metadata refreshes we triggered
python aggregate_plex_logs.py \
    --output post_fix_logs.txt \
    --timeframe 1  # Last 1 hour contains our active test

# This generates a new report with fresh metrics showing:
# - Did the refreshes succeed where they previously failed?
# - Are error counts lower?
# - Are success rates higher?
```

**What to Look For**:
- Error counts should be lower than baseline
- Success indicators (like "FoundOnIAFD") should appear
- Metadata fields should be populated
- No new error types introduced

### Phase 4: Metric Comparison

```python
#!/usr/bin/env python
"""
Compare before/after metrics to assess fix effectiveness
"""

import json
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
        
        # Extract per-agent stats
        # [Parsing logic for each agent section]
        
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
        print("="*80)
        print("BEFORE/AFTER COMPARISON REPORT")
        print("="*80)
        
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
            print(f"\n{result['metric']}:")
            print(f"  Before: {result['baseline']}")
            print(f"  After:  {result['current']}")
            print(f"  Change: {result['change']:+d} ({result['percent_change']:+.1f}%)")
            
            if result['improved']:
                print(f"  Status: ✓ IMPROVED")
            elif result['change'] == 0:
                print(f"  Status: → UNCHANGED")
            else:
                print(f"  Status: ✗ WORSENED")
                
        return results

# Usage
comparison = MetricComparison(
    'aggregated_logs_baseline.txt',
    'aggregated_logs_post_implementation.txt'
)

results = comparison.generate_comparison_report()
```

### Phase 4: Success Criteria Evaluation

```python
class SuccessEvaluator:
    def __init__(self, expected_results, actual_results):
        self.expected = expected_results
        self.actual = actual_results
        
    def evaluate_fix(self, fix_name):
        """
        Evaluate if fix met its success criteria
        """
        
        print(f"\n{'='*80}")
        print(f"SUCCESS EVALUATION: {fix_name}")
        print(f"{'='*80}")
        
        # Get expected results from diagnostic report
        expected = self.expected[fix_name]
        
        print("\n📋 EXPECTED RESULTS (From Diagnostic Report):")
        print("-" * 80)
        
        for item in expected['immediate_effects']:
            print(f"  • {item}")
            
        print("\n📊 ACTUAL RESULTS (From Metric Comparison):")
        print("-" * 80)
        
        # Check each success indicator
        success_count = 0
        total_indicators = len(expected['success_indicators'])
        
        print("\n✓ SUCCESS INDICATORS:")
        for indicator in expected['success_indicators']:
            met = self.check_indicator(indicator, self.actual)
            if met:
                print(f"  ✓ {indicator}")
                success_count += 1
            else:
                print(f"  ✗ {indicator}")
                
        print("\n✗ FAILURE INDICATORS:")
        failure_detected = False
        for indicator in expected['failure_indicators']:
            detected = self.check_indicator(indicator, self.actual)
            if detected:
                print(f"  ✗ {indicator}")
                failure_detected = True
            else:
                print(f"  ○ {indicator} (not detected)")
                
        # Overall assessment
        success_rate = (success_count / total_indicators) * 100 if total_indicators > 0 else 0
        
        print(f"\n📈 SUCCESS RATE: {success_count}/{total_indicators} ({success_rate:.0f}%)")
        
        # Decision
        if failure_detected:
            decision = "ROLLBACK"
            reason = "Critical failure indicators detected"
        elif success_rate >= 75:
            decision = "KEEP"
            reason = "Met ≥75% of success criteria"
        elif success_rate >= 50:
            decision = "MONITOR"
            reason = "Partial success - need more time or tweaking"
        else:
            decision = "ROLLBACK"
            reason = "Failed to meet minimum success criteria (<50%)"
            
        print(f"\n🎯 DECISION: {decision}")
        print(f"   Reason: {reason}")
        
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
        """
        Check if an indicator condition is met
        Parse indicator text and compare against actual metrics
        """
        
        # Example indicator: "403 errors in logs reduced by at least 20%"
        # Need to parse this and check against actual data
        
        if "403 errors" in indicator_text.lower() and "reduced" in indicator_text.lower():
            # Check 403 error reduction
            baseline_403 = self.get_metric('url_errors', 'baseline')
            current_403 = self.get_metric('url_errors', 'current')
            
            if baseline_403 > 0:
                reduction_pct = ((baseline_403 - current_403) / baseline_403) * 100
                
                # Extract expected reduction from indicator text
                match = re.search(r'(\d+)%', indicator_text)
                expected_reduction = int(match.group(1)) if match else 20
                
                return reduction_pct >= expected_reduction
                
        # Add more indicator parsers as needed
        # This is a simplified example
        
        return False
```

---

## PART 4: DECISION FRAMEWORK

### Decision Matrix

```
SUCCESS RATE    FAILURES     DECISION      ACTION
─────────────────────────────────────────────────────────
≥ 75%           None         KEEP          Document success, proceed to next fix
50-74%          None         MONITOR       Wait 24h more, re-evaluate
50-74%          Minor        MODIFY        Tweak parameters, re-test
< 50%           None         ROLLBACK      Restore backup, try alternative
Any             Critical     ROLLBACK      Immediate rollback, fix is broken
─────────────────────────────────────────────────────────
```

### Decision Implementation

```python
def make_decision(evaluation_result, implementation_log):
    """
    Make and execute decision based on evaluation
    """
    
    decision = evaluation_result['decision']
    fix_name = evaluation_result['fix_name']
    
    print(f"\n{'='*80}")
    print(f"EXECUTING DECISION: {decision} for {fix_name}")
    print(f"{'='*80}")
    
    if decision == "KEEP":
        print("\n✓ Fix is successful and will be kept")
        print("  Actions:")
        print("    1. Document success in implementation log")
        print("    2. Mark fix as completed")
        print("    3. Proceed to next fix in queue")
        
        # Update implementation log
        update_implementation_log(implementation_log, fix_name, 'success', evaluation_result)
        
        return 'proceed_to_next'
        
    elif decision == "MONITOR":
        print("\n⏱  Fix shows partial success - needs more time")
        print("  Actions:")
        print("    1. Wait additional 24 hours")
        print("    2. Re-run testing phase")
        print("    3. Re-evaluate with more data")
        
        # Schedule re-test
        return 'wait_and_retest'
        
    elif decision == "MODIFY":
        print("\n🔧 Fix needs adjustment")
        print("  Actions:")
        print("    1. Review actual vs expected results")
        print("    2. Identify parameter tweaks needed")
        print("    3. Return to diagnostic phase for refinement")
        
        return 'refine_and_retry'
        
    elif decision == "ROLLBACK":
        print("\n⏪ Fix did not meet criteria - rolling back")
        print("  Actions:")
        print("    1. Stop Plex Media Server")
        print("    2. Restore files from backup")
        print("    3. Restart Plex Media Server")
        print("    4. Verify original state restored")
        print("    5. Document failure and try alternative solution")
        
        # Execute rollback
        backup_path = get_backup_path(implementation_log, fix_name)
        rollback_fix(backup_path, fix_name)
        
        # Update log
        update_implementation_log(implementation_log, fix_name, 'rolled_back', evaluation_result)
        
        return 'try_alternative'
```

---

## PART 5: SPECIFIC TEST SCENARIOS

### Test Scenario 1: IAFD Enhanced Headers

```python
def test_iafd_headers_fix():
    """
    Specific test for IAFD enhanced headers fix
    """
    
    print("\n" + "="*80)
    print("TEST: IAFD Enhanced Headers Fix")
    print("="*80)
    
    # Expected results from diagnostic report
    expected = {
        'name': 'Enhanced Headers for IAFD',
        'success_indicators': [
            '403 errors reduced by at least 20%',
            'FoundOnIAFD = "Yes" appears in FILMDICT for some films',
            'Cast photos begin appearing in Plex',
            'No increase in other error types'
        ],
        'failure_indicators': [
            '403 error rate unchanged or increased',
            'New errors appear (429 rate limiting)',
            'All requests still failing after 48 hours'
        ],
        'expected_metrics': {
            'url_errors_before': 367,
            'url_errors_after_target': 250,  # ~32% reduction
            'success_rate_before': 0,
            'success_rate_after_target': 25  # 20-30%
        }
    }
    
    # Run comparison
    comparison = MetricComparison(
        'baseline_logs.txt',
        'post_iafd_fix_logs.txt'
    )
    
    results = comparison.generate_comparison_report()
    
    # Specific checks
    print("\n🔍 IAFD-Specific Checks:")
    
    # Check 1: 403 error reduction
    url_errors = [r for r in results if r['metric'] == 'url_errors'][0]
    
    target_reduction = expected['expected_metrics']['url_errors_before'] - expected['expected_metrics']['url_errors_after_target']
    actual_reduction = url_errors['baseline'] - url_errors['current']
    reduction_pct = (actual_reduction / url_errors['baseline'] * 100) if url_errors['baseline'] > 0 else 0
    
    print(f"\n  403 Error Reduction:")
    print(f"    Expected: -{target_reduction} ({(target_reduction/367*100):.0f}%)")
    print(f"    Actual:   {url_errors['change']:+d} ({reduction_pct:+.0f}%)")
    
    if reduction_pct >= 20:
        print(f"    ✓ Met target (≥20% reduction)")
    else:
        print(f"    ✗ Did not meet target")
        
    # Check 2: Look for FoundOnIAFD in logs
    print(f"\n  IAFD Success Indicators in Logs:")
    
    with open('post_iafd_fix_logs.txt', 'r') as f:
        log_content = f.read()
        
    found_on_iafd_count = log_content.count('FoundOnIAFD')
    iafd_yes_count = log_content.count('FoundOnIAFD = \'Yes\'') + log_content.count('FoundOnIAFD = "Yes"')
    
    print(f"    FoundOnIAFD mentions: {found_on_iafd_count}")
    print(f"    FoundOnIAFD = 'Yes': {iafd_yes_count}")
    
    if iafd_yes_count > 0:
        print(f"    ✓ IAFD enrichment occurring")
    else:
        print(f"    ✗ No IAFD enrichment detected")
        
    # Check 3: Look for new error types (429 rate limiting)
    rate_limit_errors = log_content.count('429') + log_content.count('Too Many Requests')
    
    print(f"\n  Rate Limiting Check:")
    print(f"    429 errors: {rate_limit_errors}")
    
    if rate_limit_errors == 0:
        print(f"    ✓ No rate limiting detected")
    elif rate_limit_errors < 10:
        print(f"    ⚠️  Minor rate limiting (acceptable)")
    else:
        print(f"    ✗ Significant rate limiting (problem)")
        
    # Overall assessment
    success_criteria_met = 0
    total_criteria = 3
    
    if reduction_pct >= 20:
        success_criteria_met += 1
    if iafd_yes_count > 0:
        success_criteria_met += 1
    if rate_limit_errors < 10:
        success_criteria_met += 1
        
    success_rate = (success_criteria_met / total_criteria) * 100
    
    print(f"\n📊 Overall: {success_criteria_met}/{total_criteria} criteria met ({success_rate:.0f}%)")
    
    return success_rate, success_criteria_met >= 2
```

### Test Scenario 2: XPath Selector Update

```python
def test_xpath_selector_fix(agent_name):
    """
    Test XPath selector update effectiveness
    """
    
    print(f"\n{'='*80}")
    print(f"TEST: XPath Selector Update for {agent_name}")
    print(f"{'='*80}")
    
    # Expected: Title Match Failures should decrease
    
    comparison = MetricComparison(
        f'baseline_logs.txt',
        f'post_xpath_fix_logs.txt'
    )
    
    results = comparison.generate_comparison_report()
    
    # Get agent-specific metrics
    print(f"\n🔍 {agent_name}-Specific Checks:")
    
    # Parse agent section from reports
    baseline_agent_failures = extract_agent_metric(
        'baseline_logs.txt',
        agent_name,
        'Title match failures'
    )
    
    current_agent_failures = extract_agent_metric(
        'post_xpath_fix_logs.txt',
        agent_name,
        'Title match failures'
    )
    
    print(f"\n  Title Match Failures for {agent_name}:")
    print(f"    Before: {baseline_agent_failures}")
    print(f"    After:  {current_agent_failures}")
    print(f"    Change: {current_agent_failures - baseline_agent_failures:+d}")
    
    if baseline_agent_failures > 0:
        improvement_pct = ((baseline_agent_failures - current_agent_failures) / baseline_agent_failures) * 100
        print(f"    Improvement: {improvement_pct:+.1f}%")
        
        if improvement_pct >= 50:
            print(f"    ✓ Significant improvement")
            return 'success'
        elif improvement_pct >= 20:
            print(f"    ⚠️  Moderate improvement")
            return 'partial'
        else:
            print(f"    ✗ Minimal improvement")
            return 'failed'
    else:
        print(f"    ⚠️  No baseline failures to compare")
        return 'insufficient_data'
```

---

## PART 6: TEST REPORT GENERATION

### Test Report Template

```markdown
# Fix Testing Report: [Fix Name]

**Test Date**: [ISO timestamp]
**Test Duration**: [Hours since implementation]
**Agent(s)**: [List]
**Status**: [Success / Partial / Failed]

## Executive Summary

[One paragraph summary of test results]

**Decision**: [KEEP / MONITOR / MODIFY / ROLLBACK]

## Test Configuration

**Baseline Report**: [Path]
**Post-Implementation Report**: [Path]
**Time Period Analyzed**: [Hours]
**Log Lines Processed**: [Count]

## Expected Results (From Diagnostic Report)

### Immediate Effects
- [Expected change 1]
- [Expected change 2]

### Success Indicators
- ✓/✗ [Indicator 1]
- ✓/✗ [Indicator 2]

### Failure Indicators
- ○/✗ [Indicator 1]
- ○/✗ [Indicator 2]

## Actual Results

### Metric Comparison

| Metric | Baseline | Current | Change | % Change | Status |
|--------|----------|---------|--------|----------|--------|
| Total Searches | 99 | 105 | +6 | +6.1% | → |
| Title Failures | 1548 | 1320 | -228 | -14.7% | ✓ |
| URL Errors | 367 | 245 | -122 | -33.2% | ✓ |
| Model Errors | 30 | 28 | -2 | -6.7% | → |

### Agent-Specific Results

**[Agent Name]**:
- Success rate: 7.2% → 22.4% (+15.2%)
- Title match failures: 193 → 145 (-48)
- Metadata extractions: 15 → 45 (+30)

## Success Criteria Evaluation

**Success Indicators Met**: 3/4 (75%)
**Failure Indicators Detected**: 0/3 (0%)

### Detailed Evaluation

1. ✓ URL errors reduced by 33% (target: ≥20%)
2. ✓ Title match failures reduced by 15% (target: ≥10%)
3. ✗ Cast photos not yet appearing (may need more time)
4. ✓ No new error types introduced

## Log Analysis Highlights

### Positive Changes
- [Observation 1 from logs]
- [Observation 2 from logs]

### Concerns
- [Issue 1 if any]
- [Issue 2 if any]

## Decision and Rationale

**Decision**: KEEP

**Rationale**:
Fix met 75% of success criteria with no failure indicators. The 33% reduction in URL errors exceeds the 20% target, and title match improvements are trending positively. Cast photo appearance may require additional time or is a secondary effect.

**Recommended Actions**:
1. Keep fix active
2. Monitor for 48 more hours to assess cast photo population
3. Proceed to next high-priority fix

## Next Steps

- [ ] Document fix as successfully implemented
- [ ] Update implementation log with test results
- [ ] Proceed to next fix: [Fix name]
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

## PART 7: INTEGRATION WITH LOOP

### Testing Phase Output

The testing phase produces these outputs for the loop coordinator:

```json
{
  "test_session": {
    "start_time": "2026-02-01T12:00:00",
    "end_time": "2026-02-01T13:30:00",
    "fixes_tested": 1
  },
  "results": [
    {
      "fix_name": "Enhanced Headers for IAFD",
      "decision": "KEEP",
      "success_rate": 75,
      "improvement_achieved": true,
      "recommendation": "proceed_to_next",
      "metrics": {
        "baseline_url_errors": 367,
        "current_url_errors": 245,
        "improvement_pct": 33.2
      }
    }
  ],
  "loop_recommendation": {
    "action": "continue",  # continue / pause / exit
    "reason": "Fix successful, more improvements possible",
    "next_fix": "Update AEBN XPath Selectors"
  }
}
```

---

## PART 8: DELIVERABLES

### Required Outputs

1. **Test Report** (`test_report_[fix_name].md`)
   - Complete evaluation of fix
   - Before/after comparison
   - Decision and rationale
   - Next steps

2. **Updated Metrics** (`post_implementation_logs.txt`)
   - Fresh log aggregation
   - Current system state
   - Ready for comparison

3. **Decision Record** (`testing_decisions.json`)
   - Structured data about each test
   - Feeds into loop coordinator
   - Audit trail of all decisions

4. **Recommendation** (for loop coordinator)
   - Continue with next fix
   - Pause for monitoring
   - Exit loop (success or failure)

---

## CONCLUSION

The testing phase provides objective, data-driven assessment of whether fixes achieve their intended improvements. By comparing actual results against expected results from the diagnostic report, clear decisions can be made about keeping, modifying, or rolling back changes.

This feeds directly into the loop coordinator which decides whether to:
1. Implement the next fix
2. Re-aggregate logs and re-diagnose
3. Exit the improvement loop

**Next Phase**: Loop Coordination (orchestrates the complete cycle)
