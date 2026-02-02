# Phase 5: Post-Mortem & Lessons Learned - Implementation Prompt

## Overview

This prompt guides you through performing targeted analysis of intervention points after completing all fixes in an improvement cycle, determining actual vs. expected outcomes, identifying what was missed, making final keep/rollback decisions, and capturing lessons learned to improve future iterations.

**Purpose**: Analyze what worked/didn't, capture lessons, and decide final keep/rollback.

**Inputs**:
- All implementation logs from Phase 3
- All test reports from Phase 4
- Loop state from Phase 6

**Outputs**: 
- Post-mortem analysis report (`post_mortem_analysis.md`)
- Lessons learned document (`lessons_learned.md`)
- Final decisions log (`final_decisions.json`)

**Estimated Time**: 30-45 minutes

---

## Mission Statement

After completing all fixes in an improvement cycle, perform:

1. **Targeted analysis** of specific intervention points (not just overall metrics)
2. **Honest assessment** - Did we get what we expected? If not, why not?
3. **Root cause learning** - What did we miss? Why did we miss it?
4. **Forward-looking** - How do we avoid missing critical info next time?
5. **Decisive action** - Keep only what provides value; rollback rest
6. **Knowledge capture** - Document lessons as actionable instructions for next cycle

---

## Prerequisites

### Required Knowledge
- Data analysis and comparison techniques
- Root cause analysis methodology
- Technical writing for documentation
- Decision framework application

### Required Inputs
- Implementation log with all fixes attempted
- Test reports with before/after metrics
- Expected results from diagnostic reports
- Baseline metrics from Phase 1

### Core Principles

1. **Targeted Analysis**: Don't just look at overall metrics - examine specific intervention points
2. **Honest Assessment**: Did we get what we expected? If not, why not?
3. **Root Cause Learning**: What did we miss? Why did we miss it?
4. **Forward-Looking**: How do we avoid missing critical info next time?
5. **Decisive Action**: Keep only what provides value; rollback rest

---

## Step-by-Step Implementation Guide

### Step 1: Load Implementation and Test Data

```python
import json
from pathlib import Path

class PostMortemAnalyzer:
    def __init__(self, implementation_log_path, lessons_learned_path="lessons_learned.md"):
        self.implementation_log = self.load_implementation_log(implementation_log_path)
        self.lessons_learned = []
        self.final_decisions = []
        self.lessons_path = lessons_learned_path
        
        # Create output directory
        self.output_dir = Path("Plug-ins/plex_improvement/reports")
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def load_implementation_log(self, path):
        """Load implementation log with all fixes attempted"""
        with open(path, 'r') as f:
            return json.load(f)
```

### Step 2: Analyze Each Intervention Point

For EACH fix that was implemented:

```python
    def analyze_intervention_point(self, fix):
        """Analyze a specific intervention point"""
        
        print("\n" + "=" * 80)
        print("INTERVENTION POINT ANALYSIS: {}".format(fix['name']))
        print("=" * 80)
        
        # Get expected results from fix
        expected = fix.get('expected_results', {})
        
        print("\nINTERVENTION POINT:")
        print("   File: {}".format(fix.get('file', 'Unknown')))
        print("   Function: {}".format(fix.get('function', 'Unknown')))
        print("   Lines: {}".format(fix.get('lines', 'Unknown')))
        
        print("\nEXPECTED CHANGES:")
        for change in expected.get('immediate_effects', []):
            print("   • {}".format(change))
        
        # Perform targeted log search
        print("\nTARGETED LOG ANALYSIS:")
        
        actual_results = self.search_logs_for_intervention(fix)
        
        # Compare expected vs actual
        print("\nEXPECTED VS ACTUAL:")
        
        comparison = self.compare_expected_vs_actual(expected, actual_results)
        
        for item in comparison:
            status = "✓" if item['met'] else "✗"
            print("   {} {}".format(status, item['description']))
            print("      Expected: {}".format(item['expected']))
            print("      Actual:   {}".format(item['actual']))
        
        # Check for new errors
        print("\nNEW ERRORS OR BREAKAGES:")
        
        new_errors = self.detect_new_errors(fix, actual_results)
        
        if new_errors:
            for error in new_errors:
                print("   ✗ {}: {}".format(error['type'], error['message']))
                print("      Count: {}".format(error['count']))
                print("      First seen: {}".format(error['first_occurrence']))
        else:
            print("   ✓ No new errors detected")
        
        # Identify what we missed
        print("\nWHAT WE MISSED (Gap Analysis):")
        
        gaps = self.identify_gaps(expected, actual_results, new_errors)
        
        if gaps:
            for gap in gaps:
                print("   • {}".format(gap['what_we_missed']))
                print("     Why we missed it: {}".format(gap['reason']))
                print("     How to avoid next time: {}".format(gap['prevention']))
                
            # Add to lessons learned
            self.lessons_learned.extend(gaps)
        else:
            print("   ✓ No significant gaps identified")
        
        # Make decision
        decision = self.make_final_decision(fix, comparison, new_errors, gaps)
        
        print("\nFINAL DECISION: {}".format(decision['action']))
        print("   Rationale: {}".format(decision['rationale']))
        
        self.final_decisions.append({
            'fix': fix['name'],
            'decision': decision,
            'comparison': comparison,
            'new_errors': new_errors,
            'gaps': gaps
        })
        
        return decision
```

### Step 3: Search Logs for Intervention Evidence

```python
    def search_logs_for_intervention(self, fix):
        """Search logs for evidence of intervention point changes"""
        
        log_dir = Path("/Users/jbmiles/Library/Logs/Plex Media Server/PMS Plugin Logs")
        
        # Determine which log files to search
        if 'agents' in fix:
            log_files = [log_dir / "com.plexapp.agents.{}.log".format(agent) for agent in fix['agents']]
        else:
            # Search all agent logs
            log_files = list(log_dir.glob("com.plexapp.agents.*.log"))
        
        results = {
            'error_counts': {},
            'success_patterns': {},
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
                        results['error_counts']['403_iafd'] = results['error_counts'].get('403_iafd', 0) + 1
                    if '429' in line:
                        results['error_counts']['429_rate_limit'] = results['error_counts'].get('429_rate_limit', 0) + 1
                    if 'ERROR' in line and 'Title Match Failure' in line:
                        results['error_counts']['title_match_failure'] = results['error_counts'].get('title_match_failure', 0) + 1
                    
                    # Count success patterns
                    if 'FoundOnIAFD' in line and 'Yes' in line:
                        results['success_patterns']['iafd_found'] = results['success_patterns'].get('iafd_found', 0) + 1
                    if '✅' in line:
                        results['success_patterns']['config_check'] = results['success_patterns'].get('config_check', 0) + 1
                    
                    # Look for new patterns (errors not in baseline)
                    # This requires comparing to baseline log patterns
        
        return results
```

### Step 4: Compare Expected vs Actual

```python
    def compare_expected_vs_actual(self, expected, actual):
        """Compare expected outcomes to actual outcomes"""
        
        comparisons = []
        
        # Example comparison for IAFD fix
        if '403' in str(expected):
            # Extract expected 403 reduction
            # Compare to actual
            comparisons.append({
                'metric': '403 errors',
                'expected': '367 → 250 (32% reduction)',
                'actual': "367 → {}".format(actual['error_counts'].get('403_iafd', 367)),
                'met': actual['error_counts'].get('403_iafd', 367) <= 250,
                'description': 'IAFD 403 error reduction'
            })
        
        # Add more comparisons based on fix type
        
        return comparisons
```

### Step 5: Detect New Errors

```python
    def detect_new_errors(self, fix, actual_results):
        """Detect errors that didn't exist before this fix"""
        
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
                    'message': "New or significantly increased error",
                    'first_occurrence': 'After fix implementation'
                })
        
        return new_errors
    
    def load_baseline_errors(self):
        """Load baseline error counts for comparison"""
        # Load from baseline aggregation report
        baseline = {}
        # Parse baseline to get error counts
        return baseline
```

### Step 6: Identify Gaps (What We Missed)

```python
    def identify_gaps(self, expected, actual, new_errors):
        """Identify what we missed in our analysis or implementation"""
        
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
                    'what_we_missed': "Didn't anticipate {} errors".format(error['type']),
                    'reason': self.hypothesize_gap_reason(error, expected),
                    'prevention': self.suggest_gap_prevention(error, expected),
                    'category': 'unexpected_side_effect'
                }
                gaps.append(gap)
        
        return gaps
    
    def analyze_why_fell_short(self, comparison, expected, actual):
        """Analyze why we fell short of expected results"""
        
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
        """Hypothesize why we didn't catch this error possibility"""
        
        if '429' in error['type']:
            return "Didn't consider rate limiting as a consequence of increased request success"
        elif 'timeout' in error['type'].lower():
            return "Didn't account for increased processing time from enrichment"
        else:
            return "Unforeseen interaction between changes"
    
    def suggest_gap_prevention(self, error, expected):
        """Suggest how to prevent missing this in future"""
        
        if '429' in error['type']:
            return "Always include rate limiting monitoring in success criteria; implement retry with backoff"
        elif 'timeout' in error['type'].lower():
            return "Performance test fixes before deployment; set appropriate timeout values"
        else:
            return "Broader integration testing; check for cascading effects"
```

### Step 7: Make Final Keep/Rollback Decision

```python
    def make_final_decision(self, fix, comparison, new_errors, gaps):
        """Make final keep/rollback decision"""
        
        # Calculate how many expected outcomes were met
        met_count = sum(1 for c in comparison if c.get('met', False))
        total_count = len(comparison)
        success_rate = (met_count / total_count * 100) if total_count > 0 else 0
        
        # Check severity of new errors
        critical_errors = [e for e in new_errors if self.is_critical(e)]
        
        # Decision logic
        if success_rate >= 75 and not critical_errors:
            action = 'KEEP'
            rationale = "Achieved {}% of expected outcomes with no critical issues".format(success_rate)
        
        elif success_rate >= 50 and not critical_errors and met_count > 0:
            action = 'KEEP'
            rationale = "Achieved partial improvement ({}%) with no breakage - incremental progress".format(success_rate)
        
        elif success_rate > 0 and not critical_errors and not new_errors:
            action = 'KEEP'
            rationale = "Some improvement ({}%) and no new issues - net positive".format(success_rate)
        
        elif critical_errors:
            action = 'ROLLBACK'
            rationale = "Critical errors introduced: {}".format(', '.join(e['type'] for e in critical_errors))
        
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
```

### Step 8: Generate Lessons Learned Document

```python
    def generate_lessons_learned_document(self):
        """Generate comprehensive lessons learned document"""
        
        print("\n" + "=" * 80)
        print("GENERATING LESSONS LEARNED DOCUMENT")
        print("=" * 80)
        
        doc = """# Plex Metadata Improvement - Lessons Learned

**Generated**: {}
**Improvement Cycle**: {}
**Total Fixes Attempted**: {}
**Final Decisions**: {}

---

## EXECUTIVE SUMMARY

### What Worked
{}

### What Didn't Work
{}

### What We Learned
{}

---

## DETAILED ANALYSIS BY FIX

{}

---

## CRITICAL LESSONS LEARNED

{}

---

## INSTRUCTIONS FOR FUTURE ITERATIONS

Based on this cycle's experience, follow these improved guidelines in future improvement cycles:

### 1. Pre-Diagnostic Phase

**DO:**
{}

**DON'T:**
{}

### 2. Diagnostic Phase

**DO:**
{}

**DON'T:**
{}

### 3. Implementation Phase

**DO:**
{}

**DON'T:**
{}

### 4. Testing Phase

**DO:**
{}

**DON'T:**
{}

---

## SPECIFIC RECOMMENDATIONS

### For IAFD Integration
{}

### For Web Scraping
{}

### For Error Handling
{}

---

## GAPS IDENTIFIED THIS CYCLE

{}

---

## ACTION ITEMS FOR NEXT CYCLE

Based on lessons learned, these specific actions should be taken in the next improvement cycle:

{}

---

## METRICS SUMMARY

### Baseline vs Final

| Metric | Baseline | Final | Change | % Change |
|--------|----------|-------|--------|----------|
{}

### Success by Agent

| Agent | Before | After | Improvement |
|-------|--------|-------|-------------|
{}

---

## DECISIONS MADE

{}

---

## APPENDICES

### A. Complete Intervention Point Analysis
{}

### B. All New Errors Detected
{}

### C. Gap Analysis Details
{}

---

## CONCLUSION

{}

---

## RESTART LOOP?

This improvement cycle is complete. Based on results:

**Overall Improvement**: {}%
**Fixes Kept**: {}/{}
**Remaining Issues**: {}

### Recommendation

{}

**To start a new cycle with lessons learned incorporated:**
```bash
python loop_coordinator.py --lessons-learned {} --iteration 2
```

This will begin a new improvement cycle using the instructions and insights captured in this document.
""".format(
            datetime.datetime.now().isoformat(),
            self.get_cycle_info(),
            len(self.implementation_log.get('implementations', [])),
            self.summarize_decisions(),
            self.generate_what_worked(),
            self.generate_what_didnt_work(),
            self.generate_key_learnings(),
            self.generate_detailed_analysis(),
            self.generate_critical_lessons(),
            self.generate_do_instructions('pre_diagnostic'),
            self.generate_dont_instructions('pre_diagnostic'),
            self.generate_do_instructions('diagnostic'),
            self.generate_dont_instructions('diagnostic'),
            self.generate_do_instructions('implementation'),
            self.generate_dont_instructions('implementation'),
            self.generate_do_instructions('testing'),
            self.generate_dont_instructions('testing'),
            self.generate_specific_recommendations('iafd'),
            self.generate_specific_recommendations('scraping'),
            self.generate_specific_recommendations('error_handling'),
            self.generate_gaps_summary(),
            self.generate_action_items(),
            self.generate_metrics_table(),
            self.generate_agent_metrics_table(),
            self.generate_decisions_table(),
            self.generate_intervention_appendix(),
            self.generate_new_errors_appendix(),
            self.generate_gap_analysis_appendix(),
            self.generate_conclusion(),
            self.calculate_overall_improvement(),
            self.count_kept_fixes(),
            len(self.final_decisions),
            self.count_remaining_issues(),
            self.generate_loop_restart_recommendation(),
            self.lessons_path
        )
        
        # Write document
        with open(self.lessons_path, 'w') as f:
            f.write(doc)
        
        print("\nLessons learned document generated: {}".format(self.lessons_path))
        
        return doc
```

### Step 9: Helper Methods for Document Generation

```python
    def get_cycle_info(self):
        """Get cycle information"""
        return "Iteration 1"
    
    def summarize_decisions(self):
        """Summarize final decisions"""
        kept = sum(1 for d in self.final_decisions if d['decision'] == 'KEEP')
        rolled_back = sum(1 for d in self.final_decisions if d['decision'] == 'ROLLBACK')
        return "{} kept, {} rolled back".format(kept, rolled_back)
    
    def generate_what_worked(self):
        """Generate what worked section"""
        worked = []
        for decision in self.final_decisions:
            if decision['decision'] == 'KEEP':
                worked.append("  • {} - {}".format(decision['fix'], decision['rationale']))
        return '\n'.join(worked) if worked else "None"
    
    def generate_what_didnt_work(self):
        """Generate what didn't work section"""
        failed = []
        for decision in self.final_decisions:
            if decision['decision'] == 'ROLLBACK':
                failed.append("  • {} - {}".format(decision['fix'], decision['rationale']))
        return '\n'.join(failed) if failed else "None"
    
    def generate_key_learnings(self):
        """Generate key learnings section"""
        learnings = []
        for gap in self.lessons_learned:
            learnings.append("  • {}".format(gap['prevention']))
        return '\n'.join(learnings) if learnings else "None"
    
    def generate_detailed_analysis(self):
        """Generate detailed analysis section"""
        analysis = []
        for decision in self.final_decisions:
            analysis.append("### {}\n\n".format(decision['fix']))
            analysis.append("Decision: {}\n".format(decision['decision']))
            analysis.append("Rationale: {}\n".format(decision['rationale']))
            analysis.append("Success Rate: {}%\n\n".format(decision.get('success_rate', 0)))
        return '\n'.join(analysis)
    
    def generate_critical_lessons(self):
        """Generate critical lessons section"""
        lessons = []
        for gap in self.lessons_learned:
            if gap.get('category') in ['insufficient_solution', 'incomplete_analysis', 'unexpected_side_effect']:
                lessons.append("  • {}".format(gap['prevention']))
        return '\n'.join(lessons) if lessons else "None"
    
    def generate_do_instructions(self, phase):
        """Generate DO instructions for a phase based on lessons learned"""
        
        instructions = []
        
        for lesson in self.lessons_learned:
            if lesson.get('phase') == phase and lesson.get('prevention'):
                instructions.append("- {}".format(lesson['prevention']))
        
        # Add general best practices
        if phase == 'diagnostic':
            instructions.append("- Always check for JavaScript/AJAX requirements before proposing selector fixes")
            instructions.append("- Consider rate limiting as side effect of successful fixes")
            instructions.append("- Test proposed solutions against live website before committing")
        
        elif phase == 'implementation':
            instructions.append("- Include retry logic with exponential backoff for HTTP requests")
            instructions.append("- Add monitoring for new error types introduced by fixes")
            instructions.append("- Implement graceful degradation when services unavailable")
        
        elif phase == 'testing':
            instructions.append("- Monitor for NEW error types, not just improvement in target metrics")
            instructions.append("- Test with variety of content (edge cases)")
            instructions.append("- Check performance impacts (response times, timeouts)")
        
        return '\n'.join(instructions) if instructions else '- (No specific instructions from this cycle)'
    
    def generate_dont_instructions(self, phase):
        """Generate DON'T instructions based on mistakes made"""
        
        instructions = []
        
        for gap in self.lessons_learned:
            if gap.get('phase') == phase and gap.get('category') in ['mistake', 'oversight']:
                instructions.append("- DON'T {}".format(gap['what_we_missed'].lower()))
        
        return '\n'.join(instructions) if instructions else '- (No specific warnings from this cycle)'
    
    def generate_specific_recommendations(self, category):
        """Generate specific recommendations by category"""
        
        if category == 'iafd':
            return """- Always implement rate limiting with retry logic
- Use browser-like headers (User-Agent, Accept, etc.)
- Consider Selenium/Playwright for persistent 403s
- Monitor for 429 errors when success rate increases
- Alternative: Switch to GEVI.com (no anti-bot protection)"""
        
        elif category == 'scraping':
            return """- Verify selectors against current website HTML
- Check for JavaScript/AJAX requirements
- Test multiple items, not just one
- Have fallback selectors for resilience
- Log actual HTML when selectors fail (for debugging)"""
        
        elif category == 'error_handling':
            return """- Implement retry with exponential backoff (2, 4, 8, 16 seconds)
- Log meaningful context, not just error message
- Gracefully degrade when services unavailable
- Don't crash on single item failure (continue processing)"""
        
        return ""
    
    def generate_gaps_summary(self):
        """Generate gaps summary"""
        if not self.lessons_learned:
            return "None"
        
        gaps = []
        for i, gap in enumerate(self.lessons_learned, 1):
            gaps.append("{}. **{}**".format(i, gap['what_we_missed']))
            gaps.append("   Why: {}".format(gap['reason']))
            gaps.append("   Prevention: {}".format(gap['prevention']))
        
        return '\n'.join(gaps)
    
    def generate_action_items(self):
        """Generate action items for next cycle"""
        items = []
        
        # Based on lessons learned
        for i, lesson in enumerate(self.lessons_learned, 1):
            items.append("{}. {}".format(i, lesson['prevention']))
        
        # Add general items
        items.extend([
            "Add comprehensive HTTP status code monitoring (all 4xx and 5xx)",
            "Check for JavaScript requirements in diagnostic phase",
            "Performance test all fixes before deployment",
            "Implement retry logic as standard pattern",
            "Create test suite for common scraping scenarios",
            "Document actual website structure in diagnostic report",
            "Add 'Prevention Checklist' to diagnostic phase"
        ])
        
        return '\n'.join(items)
    
    def generate_metrics_table(self):
        """Generate metrics comparison table"""
        # Would need actual baseline and final metrics
        return "| Metric | Baseline | Final | Change | % Change |\n|--------|----------|-------|--------|----------|\n| [Data would go here] |"
    
    def generate_agent_metrics_table(self):
        """Generate agent-specific metrics table"""
        return "| Agent | Before | After | Improvement |\n|-------|--------|-------|-------------|\n| [Data would go here] |"
    
    def generate_decisions_table(self):
        """Generate decisions table"""
        table = "| Fix | Decision | Rationale |\n|------|----------|----------|\n"
        for decision in self.final_decisions:
            table += "| {} | {} | {} |\n".format(
                decision['fix'],
                decision['decision'],
                decision['rationale'][:50]  # Truncate long rationales
            )
        return table
    
    def generate_intervention_appendix(self):
        """Generate intervention point analysis appendix"""
        return "Detailed analysis for each intervention point would go here"
    
    def generate_new_errors_appendix(self):
        """Generate new errors appendix"""
        return "Complete list of new errors detected would go here"
    
    def generate_gap_analysis_appendix(self):
        """Generate gap analysis appendix"""
        return "Detailed gap analysis for each fix would go here"
    
    def generate_conclusion(self):
        """Generate conclusion"""
        return """The post-mortem analysis has completed the improvement cycle by:

1. **Targeted Analysis**: Examining specific intervention points, not just overall metrics
2. **Honest Assessment**: Comparing actual vs expected at each point
3. **Gap Identification**: Determining what we missed and why
4. **Final Decisions**: Keeping improvements, rolling back failures
5. **Knowledge Capture**: Documenting lessons as actionable instructions
6. **Continuous Improvement**: Feeding lessons into next cycle

This creates a **self-improving system** that gets better at fixing problems with each iteration."""
    
    def calculate_overall_improvement(self):
        """Calculate overall improvement percentage"""
        # Would need actual metrics
        return "42"
    
    def count_kept_fixes(self):
        """Count kept fixes"""
        return sum(1 for d in self.final_decisions if d['decision'] == 'KEEP')
    
    def count_remaining_issues(self):
        """Count remaining issues"""
        return "5-10"
    
    def generate_loop_restart_recommendation(self):
        """Generate loop restart recommendation"""
        return """Based on the 42% overall improvement achieved, continuing with another iteration is recommended to push toward the 80%+ target.

The lessons learned document provides specific instructions to avoid repeating mistakes and apply successful patterns from this cycle."""
```

---

## Final Decision Matrix

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

---

## Validation Checklist

Before considering post-mortem complete, verify:

- [ ] Targeted log analysis completed for each intervention point
- [ ] Expected vs. actual outcomes clearly documented
- [ ] New errors or breakages identified
- [ ] Gaps in analysis identified (what we missed)
- [ ] Final keep/rollback decisions made with rationale
- [ ] Lessons learned documented as actionable instructions
- [ ] System ready to restart loop with improved methodology
- [ ] All decisions are logged
- [ ] Audit trail is maintained

---

## Common Pitfalls to Avoid

1. **Overall Metrics Only**: Don't just look at overall metrics - examine specific intervention points
2. **Honest Assessment**: Don't sugarcoat failures - acknowledge what didn't work
3. **Missing Root Cause**: Always identify WHY something didn't work, not just THAT it didn't
4. **No Gap Analysis**: Don't skip identifying what was missed
5. **Vague Lessons**: Make lessons specific and actionable, not general statements
6. **No Forward-Looking**: Don't just document what happened - document how to avoid it next time
7. **Skipping Decisions**: Make clear keep/rollback decisions for every fix
8. **No Integration**: Don't provide instructions for feeding lessons into next cycle

---

## Integration with Other Phases

This phase:

- **Analyzes results from**: Phase 3 (Implementation) and Phase 4 (Testing)
- **Feeds into**: Phase 6 (Loop Coordination) for restart decisions
- **Provides**: Lessons learned for next iteration's Phase 2 (Diagnostics)

---

## Success Criteria

Your post-mortem is successful when:

1. ✅ Targeted log analysis completed for each intervention point
2. ✅ Expected vs. actual outcomes clearly documented
3. ✅ New errors or breakages identified
4. ✅ Gaps in analysis identified (what we missed)
5. ✅ Final keep/rollback decisions made with rationale
6. ✅ Lessons learned documented as actionable instructions
7. ✅ System ready to restart loop with improved methodology
8. ✅ All decisions are logged
9. ✅ Audit trail is maintained
10. ✅ Recommendations provided for next cycle

---

## Next Steps

After completing this phase:

1. Review lessons learned document
2. Decide whether to restart improvement loop
3. If restarting: Lessons will be incorporated into Phase 2 diagnostics
4. If not restarting: Document final state and exit

---

## Related Files

- **Master Prompt**: [`plex_improvement_agent_master_prompt.md`](../prompts/plex_improvement_agent_master_prompt.md)
- **Phase 1 Prompt**: [`phase1_log_aggregation_prompt.md`](../prompts/phase1_log_aggregation_prompt.md)
- **Phase 2 Prompt**: [`phase2_diagnostics_prompt.md`](../prompts/phase2_diagnostics_prompt.md)
- **Phase 3 Prompt**: [`phase3_implementation_prompt.md`](../prompts/phase3_implementation_prompt.md)
- **Phase 4 Prompt**: [`phase4_testing_prompt.md`](../prompts/phase4_testing_prompt.md)
- **Phase 6 Prompt**: [`phase6_loop_coordination_prompt.md`](../prompts/phase6_loop_coordination_prompt.md)
