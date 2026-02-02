# Plex Improvement Post-Mortem & Lessons Learned - Instruction Set

## PART 1: MISSION AND SCOPE

### Primary Mission
After completing all fixes in an improvement cycle, perform targeted analysis of intervention points to determine actual vs. expected outcomes, identify what was missed, make final keep/rollback decisions, and capture lessons learned to improve future iterations.

### Core Principles

1. **Targeted Analysis**: Don't just look at overall metrics - examine specific intervention points
2. **Honest Assessment**: Did we get what we expected? If not, why not?
3. **Root Cause Learning**: What did we miss? Why did we miss it?
4. **Forward-Looking**: How do we avoid missing critical info next time?
5. **Decisive Action**: Keep only what provides value; rollback the rest

### Success Criteria

- [ ] Targeted log analysis completed for each intervention point
- [ ] Expected vs. actual outcomes clearly documented
- [ ] New errors or breakages identified
- [ ] Gaps in analysis identified (what we missed)
- [ ] Final keep/rollback decisions made with rationale
- [ ] Lessons learned documented as actionable instructions
- [ ] System ready to restart loop with improved methodology

---

## PART 2: TARGETED LOG AGGREGATION

### Focus on Intervention Points

Instead of general log aggregation, we perform **targeted analysis** of specific points where we expected to see change.

### Intervention Point Analysis Template

For EACH fix that was implemented:

```
FIX: [Fix name]
INTERVENTION POINT: [Specific code location or function]
EXPECTED CHANGE: [What we expected to see different]
TARGET METRIC: [Specific metric to check]

TARGETED LOG SEARCH:
  → Look for: [Specific log patterns]
  → In files: [Specific agent logs]
  → Time period: [Since fix was implemented]
  
ANALYSIS QUESTIONS:
  1. Did we see the expected change? (Yes/No/Partial)
  2. What was the actual change observed?
  3. Were there unexpected side effects?
  4. Did we break anything new?
  5. If we fell short, what did we miss?
```

### Example: IAFD Enhanced Headers Fix

```
FIX: Enhanced Headers for IAFD
INTERVENTION POINT: utils.py line 373, getFilmOnIAFD() function
EXPECTED CHANGE: HTTP 403 errors reduced, successful IAFD requests increased

TARGET METRICS:
  • HTTP 403 errors from iafd.com
  • "FoundOnIAFD = 'Yes'" appearances
  • Successful cast/director enrichment

TARGETED LOG SEARCH:
  grep -E "(403|FoundOnIAFD|getFilmOnIAFD)" *.log | grep "IAFD"
  
ANALYSIS:
  Expected: 367 → 250 (32% reduction in 403s)
  Actual:   367 → 245 (33.2% reduction) ✓ BETTER THAN EXPECTED
  
  Expected: 0 → 20-30% success rate
  Actual:   0 → 24.5% success rate ✓ WITHIN RANGE
  
  Unexpected: 15 new "429 Too Many Requests" errors
  Analysis: Rate limiting kicking in (minor, acceptable)
  
  Nothing Broken: No new error types beyond expected rate limiting
  
WHAT WE MISSED:
  • Didn't anticipate rate limiting
  • Should have included retry logic with exponential backoff
  • Should have monitored 429 errors in success criteria
  
DECISION: KEEP
  Rationale: Achieved expected improvement, 429s are manageable
```

---

## PART 3: POST-MORTEM ANALYSIS SCRIPT

### Automated Intervention Point Analysis

```python
#!/usr/bin/env python
"""
Post-mortem targeted log analysis
Analyzes specific intervention points to determine actual vs expected outcomes
"""

import json
import re
from pathlib import Path
from collections import defaultdict

class PostMortemAnalyzer:
    def __init__(self, implementation_log_path, lessons_learned_path="lessons_learned.md"):
        self.implementation_log = self.load_implementation_log(implementation_log_path)
        self.lessons_learned = []
        self.final_decisions = []
        self.lessons_path = lessons_learned_path
        
    def load_implementation_log(self, path):
        """Load implementation log with all fixes attempted"""
        with open(path, 'r') as f:
            return json.load(f)
            
    def analyze_intervention_point(self, fix):
        """
        Analyze a specific intervention point
        """
        
        print(f"\n{'='*80}")
        print(f"INTERVENTION POINT ANALYSIS: {fix['name']}")
        print(f"{'='*80}")
        
        # Get expected results from fix
        expected = fix.get('expected_results', {})
        
        print(f"\n📍 INTERVENTION POINT:")
        print(f"   File: {fix['file']}")
        print(f"   Function: {fix['function']}")
        print(f"   Lines: {fix['lines']}")
        
        print(f"\n🎯 EXPECTED CHANGES:")
        for change in expected.get('immediate_effects', []):
            print(f"   • {change}")
            
        # Perform targeted log search
        print(f"\n🔍 TARGETED LOG ANALYSIS:")
        
        actual_results = self.search_logs_for_intervention(fix)
        
        # Compare expected vs actual
        print(f"\n📊 EXPECTED VS ACTUAL:")
        
        comparison = self.compare_expected_vs_actual(expected, actual_results)
        
        for item in comparison:
            status = "✓" if item['met'] else "✗"
            print(f"   {status} {item['description']}")
            print(f"      Expected: {item['expected']}")
            print(f"      Actual:   {item['actual']}")
            
        # Check for new errors
        print(f"\n⚠️  NEW ERRORS OR BREAKAGES:")
        
        new_errors = self.detect_new_errors(fix, actual_results)
        
        if new_errors:
            for error in new_errors:
                print(f"   ✗ {error['type']}: {error['message']}")
                print(f"      Count: {error['count']}")
                print(f"      First seen: {error['first_occurrence']}")
        else:
            print(f"   ✓ No new errors detected")
            
        # Identify what we missed
        print(f"\n🤔 WHAT WE MISSED (Gap Analysis):")
        
        gaps = self.identify_gaps(expected, actual_results, new_errors)
        
        if gaps:
            for gap in gaps:
                print(f"   • {gap['what_we_missed']}")
                print(f"     Why we missed it: {gap['reason']}")
                print(f"     How to avoid next time: {gap['prevention']}")
                
            # Add to lessons learned
            self.lessons_learned.extend(gaps)
        else:
            print(f"   ✓ No significant gaps identified")
            
        # Make decision
        decision = self.make_final_decision(fix, comparison, new_errors, gaps)
        
        print(f"\n🎯 FINAL DECISION: {decision['action']}")
        print(f"   Rationale: {decision['rationale']}")
        
        self.final_decisions.append({
            'fix': fix['name'],
            'decision': decision,
            'comparison': comparison,
            'new_errors': new_errors,
            'gaps': gaps
        })
        
        return decision
        
    def search_logs_for_intervention(self, fix):
        """
        Search logs for evidence of intervention point changes
        """
        
        log_dir = Path("/Users/jbmiles/Library/Logs/Plex Media Server/PMS Plugin Logs")
        
        # Determine which log files to search
        if 'agents' in fix:
            log_files = [log_dir / f"com.plexapp.agents.{agent}.log" for agent in fix['agents']]
        else:
            # Search all agent logs
            log_files = list(log_dir.glob("com.plexapp.agents.*.log"))
            
        results = {
            'error_counts': defaultdict(int),
            'success_patterns': defaultdict(int),
            'new_patterns': [],
            'sample_logs': []
        }
        
        # Search patterns based on fix type
        search_patterns = fix.get('search_patterns', [])
        
        for log_file in log_files:
            if not log_file.exists():
                continue
                
            with open(log_file, 'r') as f:
                for line in f:
                    # Count error patterns
                    if '403' in line and 'IAFD' in line:
                        results['error_counts']['403_iafd'] += 1
                    if '429' in line:
                        results['error_counts']['429_rate_limit'] += 1
                    if 'ERROR' in line and 'Title Match Failure' in line:
                        results['error_counts']['title_match_failure'] += 1
                        
                    # Count success patterns
                    if 'FoundOnIAFD' in line and 'Yes' in line:
                        results['success_patterns']['iafd_found'] += 1
                    if '✅' in line:
                        results['success_patterns']['config_check'] += 1
                        
                    # Look for new patterns (errors not in baseline)
                    # This requires comparing to baseline log patterns
                    
        return results
        
    def compare_expected_vs_actual(self, expected, actual):
        """
        Compare expected outcomes to actual outcomes
        """
        
        comparisons = []
        
        # Example comparison for IAFD fix
        if '403' in str(expected):
            # Extract expected 403 reduction
            # Compare to actual
            comparisons.append({
                'metric': '403 errors',
                'expected': '367 → 250 (32% reduction)',
                'actual': f"367 → {actual['error_counts'].get('403_iafd', 367)}",
                'met': actual['error_counts'].get('403_iafd', 367) <= 250,
                'description': 'IAFD 403 error reduction'
            })
            
        # Add more comparisons based on fix type
        
        return comparisons
        
    def detect_new_errors(self, fix, actual_results):
        """
        Detect errors that didn't exist before this fix
        """
        
        new_errors = []
        
        # Load baseline error patterns
        baseline_errors = self.load_baseline_errors()
        
        # Check for error types not in baseline
        for error_type, count in actual_results['error_counts'].items():
            if error_type not in baseline_errors or count > baseline_errors.get(error_type, 0) * 1.5:
                # New error type or significant increase
                new_errors.append({
                    'type': error_type,
                    'count': count,
                    'baseline_count': baseline_errors.get(error_type, 0),
                    'message': f"New or significantly increased error",
                    'first_occurrence': 'After fix implementation'
                })
                
        return new_errors
        
    def identify_gaps(self, expected, actual, new_errors):
        """
        Identify what we missed in our analysis or implementation
        """
        
        gaps = []
        
        # Check if we fell short of expectations
        for comparison in self.compare_expected_vs_actual(expected, actual):
            if not comparison['met']:
                # We fell short - why?
                gap = self.analyze_why_fell_short(comparison, expected, actual)
                if gap:
                    gaps.append(gap)
                    
        # Check if new errors appeared
        if new_errors:
            for error in new_errors:
                gap = {
                    'what_we_missed': f"Didn't anticipate {error['type']} errors",
                    'reason': self.hypothesize_gap_reason(error, expected),
                    'prevention': self.suggest_gap_prevention(error, expected),
                    'category': 'unexpected_side_effect'
                }
                gaps.append(gap)
                
        return gaps
        
    def analyze_why_fell_short(self, comparison, expected, actual):
        """
        Analyze why we fell short of expected results
        """
        
        # Different reasons based on what metric fell short
        if '403' in comparison['metric']:
            # IAFD still blocking too much
            return {
                'what_we_missed': 'IAFD anti-bot protection is more sophisticated than expected',
                'reason': 'Headers alone insufficient; may need JavaScript rendering',
                'prevention': 'In future: Test with browser automation (Selenium) from start',
                'category': 'insufficient_solution'
            }
            
        elif 'title' in comparison['metric'].lower():
            # Title matching still failing
            return {
                'what_we_missed': 'Website structure may have additional changes beyond selectors',
                'reason': 'Only updated XPath, but page may use dynamic loading',
                'prevention': 'In future: Check for AJAX/JavaScript requirements before implementing',
                'category': 'incomplete_analysis'
            }
            
        return None
        
    def hypothesize_gap_reason(self, error, expected):
        """
        Hypothesize why we didn't catch this error possibility
        """
        
        if '429' in error['type']:
            return "Didn't consider rate limiting as a consequence of increased request success"
        elif 'timeout' in error['type'].lower():
            return "Didn't account for increased processing time from enrichment"
        else:
            return "Unforeseen interaction between changes"
            
    def suggest_gap_prevention(self, error, expected):
        """
        Suggest how to prevent missing this in future
        """
        
        if '429' in error['type']:
            return "Always include rate limiting monitoring in success criteria; implement retry with backoff"
        elif 'timeout' in error['type'].lower():
            return "Performance test fixes before deployment; set appropriate timeout values"
        else:
            return "Broader integration testing; check for cascading effects"
            
    def make_final_decision(self, fix, comparison, new_errors, gaps):
        """
        Make final keep/rollback decision
        """
        
        # Calculate how many expected outcomes were met
        met_count = sum(1 for c in comparison if c.get('met', False))
        total_count = len(comparison)
        success_rate = (met_count / total_count * 100) if total_count > 0 else 0
        
        # Check severity of new errors
        critical_errors = [e for e in new_errors if self.is_critical(e)]
        
        # Decision logic
        if success_rate >= 75 and not critical_errors:
            action = 'KEEP'
            rationale = f"Achieved {success_rate:.0f}% of expected outcomes with no critical issues"
            
        elif success_rate >= 50 and not critical_errors and met_count > 0:
            action = 'KEEP'
            rationale = f"Achieved partial improvement ({success_rate:.0f}%) with no breakage - incremental progress"
            
        elif success_rate > 0 and not critical_errors and not new_errors:
            action = 'KEEP'
            rationale = f"Some improvement ({success_rate:.0f}%) and no new issues - net positive"
            
        elif critical_errors:
            action = 'ROLLBACK'
            rationale = f"Critical errors introduced: {', '.join(e['type'] for e in critical_errors)}"
            
        elif success_rate == 0 and new_errors:
            action = 'ROLLBACK'
            rationale = "No improvement and new errors introduced - net negative"
            
        elif success_rate == 0:
            action = 'ROLLBACK'
            rationale = "No improvement and no compelling reason to keep changes"
            
        else:
            action = 'REVIEW'
            rationale = "Ambiguous results - manual review recommended"
            
        return {
            'action': action,
            'rationale': rationale,
            'success_rate': success_rate,
            'met_count': met_count,
            'total_count': total_count,
            'critical_errors_count': len(critical_errors)
        }
        
    def is_critical(self, error):
        """Determine if an error is critical"""
        critical_patterns = [
            'cannot read',
            'cannot write',
            'segmentation fault',
            'crash',
            'fatal',
            'syntax error',
            'import error'
        ]
        
        return any(pattern in error['type'].lower() for pattern in critical_patterns)
        
    def load_baseline_errors(self):
        """Load baseline error counts for comparison"""
        # Load from baseline aggregation report
        baseline = {}
        # Parse baseline to get error counts
        return baseline
        
    def generate_lessons_learned_document(self):
        """
        Generate comprehensive lessons learned document
        """
        
        print("\n" + "="*80)
        print("GENERATING LESSONS LEARNED DOCUMENT")
        print("="*80)
        
        doc = f"""# Plex Metadata Improvement - Lessons Learned

**Generated**: {datetime.datetime.now().isoformat()}
**Improvement Cycle**: {self.get_cycle_info()}
**Total Fixes Attempted**: {len(self.implementation_log.get('implementations', []))}
**Final Decisions**: {self.summarize_decisions()}

---

## EXECUTIVE SUMMARY

### What Worked
{self.generate_what_worked()}

### What Didn't Work
{self.generate_what_didnt_work()}

### What We Learned
{self.generate_key_learnings()}

---

## DETAILED ANALYSIS BY FIX

{self.generate_detailed_analysis()}

---

## CRITICAL LESSONS LEARNED

{self.generate_critical_lessons()}

---

## INSTRUCTIONS FOR FUTURE ITERATIONS

Based on this cycle's experience, follow these improved guidelines in future improvement cycles:

### 1. Pre-Diagnostic Phase

**DO:**
{self.generate_do_instructions('pre_diagnostic')}

**DON'T:**
{self.generate_dont_instructions('pre_diagnostic')}

### 2. Diagnostic Phase

**DO:**
{self.generate_do_instructions('diagnostic')}

**DON'T:**
{self.generate_dont_instructions('diagnostic')}

### 3. Implementation Phase

**DO:**
{self.generate_do_instructions('implementation')}

**DON'T:**
{self.generate_dont_instructions('implementation')}

### 4. Testing Phase

**DO:**
{self.generate_do_instructions('testing')}

**DON'T:**
{self.generate_dont_instructions('testing')}

---

## SPECIFIC RECOMMENDATIONS

### For IAFD Integration
{self.generate_specific_recommendations('iafd')}

### For Web Scraping Fixes
{self.generate_specific_recommendations('scraping')}

### For Error Handling
{self.generate_specific_recommendations('error_handling')}

---

## METRICS SUMMARY

### Baseline vs Final

| Metric | Baseline | Final | Change | % Change |
|--------|----------|-------|--------|----------|
{self.generate_metrics_table()}

### Success by Agent

| Agent | Before | After | Improvement |
|-------|--------|-------|-------------|
{self.generate_agent_metrics_table()}

---

## DECISIONS MADE

{self.generate_decisions_table()}

---

## GAPS IDENTIFIED

{self.generate_gaps_summary()}

---

## ACTION ITEMS FOR NEXT CYCLE

Based on lessons learned, these specific actions should be taken in the next improvement cycle:

{self.generate_action_items()}

---

## APPENDICES

### A. Complete Intervention Point Analysis
{self.generate_intervention_appendix()}

### B. All New Errors Detected
{self.generate_new_errors_appendix()}

### C. Gap Analysis Details
{self.generate_gap_analysis_appendix()}

---

## CONCLUSION

{self.generate_conclusion()}

---

## RESTART LOOP?

This improvement cycle is complete. Based on the results:

**Overall Improvement**: {self.calculate_overall_improvement()}%
**Fixes Kept**: {self.count_kept_fixes()}/{len(self.final_decisions)}
**Remaining Issues**: {self.count_remaining_issues()}

### Recommendation

{self.generate_loop_restart_recommendation()}

**To start a new cycle with lessons learned incorporated:**
```bash
python loop_coordinator.py --lessons-learned {self.lessons_path} --iteration 2
```

This will begin a new improvement cycle using the instructions and insights captured in this document.
"""

        # Write document
        with open(self.lessons_path, 'w') as f:
            f.write(doc)
            
        print(f"\n✓ Lessons learned document generated: {self.lessons_path}")
        
        return doc
        
    def generate_do_instructions(self, phase):
        """Generate DO instructions for a phase based on lessons learned"""
        
        instructions = []
        
        for lesson in self.lessons_learned:
            if lesson.get('phase') == phase and lesson.get('prevention'):
                instructions.append(f"- {lesson['prevention']}")
                
        # Add general best practices
        if phase == 'diagnostic':
            instructions.append("- Always check for JavaScript/AJAX requirements before proposing selector fixes")
            instructions.append("- Consider rate limiting as a potential side effect of successful fixes")
            instructions.append("- Test proposed solutions against live website before committing")
            
        elif phase == 'implementation':
            instructions.append("- Include retry logic with exponential backoff for HTTP requests")
            instructions.append("- Add monitoring for new error types introduced by fixes")
            instructions.append("- Implement graceful degradation when services unavailable")
            
        elif phase == 'testing':
            instructions.append("- Monitor for new error types, not just improvement in target metrics")
            instructions.append("- Test with variety of content, not just items that failed before")
            instructions.append("- Check for performance impacts (timeouts, slow responses)")
            
        return '\n'.join(instructions) if instructions else '- (No specific instructions from this cycle)'
        
    def generate_dont_instructions(self, phase):
        """Generate DON'T instructions based on mistakes made"""
        
        instructions = []
        
        for gap in self.lessons_learned:
            if gap.get('phase') == phase and gap.get('category') in ['mistake', 'oversight']:
                instructions.append(f"- DON'T {gap['what_we_missed'].lower()}")
                
        return '\n'.join(instructions) if instructions else '- (No specific warnings from this cycle)'

# Usage
def run_post_mortem(implementation_log_path):
    """
    Run complete post-mortem analysis
    """
    
    analyzer = PostMortemAnalyzer(implementation_log_path)
    
    print("\n" + "="*80)
    print("POST-MORTEM ANALYSIS")
    print("="*80)
    
    # Analyze each fix
    for fix in analyzer.implementation_log.get('implementations', []):
        decision = analyzer.analyze_intervention_point(fix)
        
        if decision['action'] == 'ROLLBACK':
            print(f"\n⏪ Rolling back {fix['name']}...")
            # Execute rollback
            # [rollback code]
            
    # Generate lessons learned
    lessons_doc = analyzer.generate_lessons_learned_document()
    
    # Offer to restart loop
    print("\n" + "="*80)
    print("POST-MORTEM COMPLETE")
    print("="*80)
    
    print(f"\nLessons learned documented in: lessons_learned.md")
    print(f"\nWould you like to start a new improvement cycle?")
    print(f"  This will incorporate the lessons learned into the next iteration.")
    
    response = input("\nStart new cycle? (yes/no): ")
    
    if response.lower() == 'yes':
        print("\n🔄 Starting new improvement cycle with lessons learned...")
        # Start new loop with lessons learned
        import subprocess
        subprocess.run([
            'python',
            'loop_coordinator.py',
            '--lessons-learned', 'lessons_learned.md',
            '--iteration', '2'
        ])
    else:
        print("\n✓ Post-mortem complete. Review lessons_learned.md when ready to continue.")

if __name__ == "__main__":
    run_post_mortem('implementation_log.json')
```

---

## PART 4: FINAL DECISION MATRIX

### Decision Logic

```
┌─────────────────────────────────────────────────────────────────────┐
│ FINAL KEEP/ROLLBACK DECISION MATRIX                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ SUCCESS RATE    NEW ERRORS    CRITICAL    DECISION    RATIONALE    │
│ ────────────────────────────────────────────────────────────────── │
│ ≥ 75%           None          None        KEEP        Clear win    │
│ 50-74%          None          None        KEEP        Incremental  │
│ > 0%            None          None        KEEP        Net positive │
│ Any             Minor         None        KEEP        Acceptable   │
│ Any             Any           Yes         ROLLBACK    Broken       │
│ 0%              Any           None        ROLLBACK    No value     │
│ 0%              None          None        ROLLBACK    No reason    │
│ Ambiguous       Unclear       Maybe       REVIEW      Need human   │
└─────────────────────────────────────────────────────────────────────┘
```

### Examples

**Example 1: Clear Success**
```
Fix: Enhanced IAFD Headers
Success Rate: 75% (3/4 criteria met)
New Errors: 15× "429 Rate Limit" (minor, expected)
Critical Errors: None
Decision: KEEP
Rationale: Achieved expected improvement, rate limiting is manageable side effect
```

**Example 2: Partial Success**
```
Fix: Update AEBN XPath Selectors
Success Rate: 60% (3/5 criteria met)
New Errors: None
Critical Errors: None
Decision: KEEP
Rationale: Partial improvement, no breakage - incremental progress worthwhile
```

**Example 3: Clear Failure**
```
Fix: Implement CloudScraper
Success Rate: 0% (0/4 criteria met)
New Errors: 50× "ImportError: cloudscraper", 100× "TypeError"
Critical Errors: Yes (import failures breaking agent)
Decision: ROLLBACK
Rationale: Broke the agent entirely, no improvement
```

**Example 4: No Improvement**
```
Fix: Add request delays
Success Rate: 0% (0/3 criteria met)
New Errors: None
Critical Errors: None
Decision: ROLLBACK
Rationale: No improvement, no compelling reason to keep (just adds latency)
```

---

## PART 5: OUTPUT REQUIREMENTS

### Required Deliverables

1. **Post-Mortem Analysis Report** (`post_mortem_analysis.md`)
   - Intervention point analysis for each fix
   - Expected vs actual comparison
   - New errors identified
   - Gap analysis (what we missed)
   
2. **Lessons Learned Document** (`lessons_learned.md`)
   - What worked / what didn't
   - Critical lessons
   - Instructions for future iterations (DO/DON'T lists)
   - Specific recommendations by category
   - Action items for next cycle
   
3. **Final Decisions Log** (`final_decisions.json`)
   ```json
   {
     "cycle_complete": "2026-02-01T15:30:00",
     "decisions": [
       {
         "fix": "Enhanced IAFD Headers",
         "action": "KEEP",
         "rationale": "...",
         "success_rate": 75
       }
     ],
     "summary": {
       "kept": 3,
       "rolled_back": 2,
       "overall_improvement": 42
     }
   }
   ```

4. **Restart Instructions** (in lessons_learned.md)
   - How to start next cycle
   - What to do differently
   - Specific focus areas

---

## PART 6: LESSONS LEARNED STRUCTURE

### Template

```markdown
# Lessons Learned - [Date]

## INSTRUCTIONS FOR FUTURE ITERATIONS

### Pre-Diagnostic Phase

**DO:**
- Check for JavaScript rendering requirements before analyzing scrapers
- Use browser DevTools to verify current website structure
- Test selectors against live site, not just documentation

**DON'T:**
- Assume website structure hasn't changed since last analysis
- Trust old documentation without verification
- Skip checking for anti-bot protection

### Diagnostic Phase

**DO:**
- Consider rate limiting as side effect of successful fixes
- Check for cascading effects of changes
- Validate solutions against multiple test cases before proposing

**DON'T:**
- Propose fixes without testing against live websites first
- Overlook performance implications (timeouts, latency)
- Assume one solution fits all similar issues

### Implementation Phase

**DO:**
- Include retry logic with exponential backoff
- Add monitoring for new error types
- Implement graceful degradation
- Test changes in isolation before combining

**DON'T:**
- Batch multiple risky changes together
- Skip syntax validation
- Forget to update error handling for new code paths

### Testing Phase

**DO:**
- Monitor for NEW error types, not just target metric improvement
- Test with variety of content (edge cases)
- Check performance impacts (response times, timeouts)
- Compare actual vs expected at intervention points

**DON'T:**
- Focus only on overall metrics; check specific intervention points
- Ignore minor new errors (they may become major)
- Skip testing with content that worked before (regression check)

## SPECIFIC RECOMMENDATIONS

### IAFD Integration
- Always implement rate limiting with retry logic
- Use browser-like headers (User-Agent, Accept, etc.)
- Consider Selenium/Playwright for persistent 403s
- Monitor for 429 errors when success rate increases
- Alternative: Switch to GEVI.com (no anti-bot protection)

### Web Scraping
- Verify selectors against current website HTML
- Check for JavaScript/AJAX requirements
- Test multiple items, not just one
- Have fallback selectors for resilience
- Log actual HTML when selectors fail (for debugging)

### Error Handling
- Implement retry with exponential backoff (2, 4, 8, 16 seconds)
- Log meaningful context, not just error message
- Gracefully degrade when services unavailable
- Don't crash on single item failure (continue processing)

## GAPS IDENTIFIED THIS CYCLE

1. **Didn't anticipate rate limiting**
   - Why: Focused on 403s, didn't consider 429s
   - Impact: Minor (15 errors vs 367 fixed)
   - Prevention: Always monitor ALL HTTP status codes

2. **Missed JavaScript rendering requirement**
   - Why: Only checked static HTML
   - Impact: Major (XPath fix didn't work)
   - Prevention: Use browser DevTools, check Network tab for AJAX

3. **Didn't test performance impact**
   - Why: Only tested functionality, not speed
   - Impact: Medium (increased timeouts)
   - Prevention: Time operations, set appropriate timeout values

## ACTION ITEMS FOR NEXT CYCLE

1. Add comprehensive HTTP status code monitoring (all 4xx and 5xx)
2. Check for JavaScript requirements in diagnostic phase
3. Performance test all fixes before deployment
4. Implement retry logic as standard pattern
5. Create test suite for common scraping scenarios
6. Document actual website structure in diagnostic report
7. Add "Prevention Checklist" to diagnostic phase
```

---

## PART 7: INTEGRATION WITH LOOP RESTART

### Lessons Learned Integration

When restarting the loop with lessons learned:

```python
def start_loop_with_lessons(lessons_path):
    """
    Start improvement loop incorporating lessons learned
    """
    
    # Load lessons learned
    with open(lessons_path, 'r') as f:
        lessons = parse_lessons_learned(f.read())
        
    # Extract instructions
    instructions = {
        'pre_diagnostic': lessons['instructions']['pre_diagnostic'],
        'diagnostic': lessons['instructions']['diagnostic'],
        'implementation': lessons['instructions']['implementation'],
        'testing': lessons['instructions']['testing']
    }
    
    # Append to each phase's prompt
    for phase, phase_instructions in instructions.items():
        prompt_file = f"plex_{phase}_prompt.md"
        
        # Add lessons learned section
        append_to_prompt(prompt_file, f"""

---

## LESSONS LEARNED FROM PREVIOUS CYCLE

{phase_instructions}

These instructions are based on actual experience from the previous improvement cycle.
Follow them to avoid repeating mistakes and improve success rate.

---
""")
        
    # Start loop
    print("✓ Lessons learned incorporated into all phase prompts")
    print("🔄 Starting improvement loop...")
    
    # Run loop coordinator
    run_loop_coordinator(iteration=2)
```

---

## CONCLUSION

The Post-Mortem & Lessons Learned phase completes the improvement cycle by:

1. **Targeted Analysis**: Examining specific intervention points, not just overall metrics
2. **Honest Assessment**: Comparing actual vs expected at each point
3. **Gap Identification**: Determining what we missed and why
4. **Final Decisions**: Keeping improvements, rolling back failures
5. **Knowledge Capture**: Documenting lessons as actionable instructions
6. **Continuous Improvement**: Feeding lessons into next cycle

This creates a **self-improving system** that gets better at fixing problems with each iteration.
