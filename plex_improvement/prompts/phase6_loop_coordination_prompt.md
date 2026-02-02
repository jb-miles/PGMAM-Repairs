# Phase 6: Loop Coordination - Implementation Prompt

## Overview

This prompt guides you through orchestrating the complete improvement cycle: Log Aggregation → Diagnosis → Implementation → Testing → Post-Mortem → Decision, repeating until substantial progress plateaus or all fixable issues are resolved.

**Purpose**: Orchestrate the complete improvement cycle and manage flow between phases.

**Inputs**: 
- All phase results (aggregation, diagnostics, implementation, testing)
- Loop state from previous iterations (if resuming)

**Outputs**: 
- Loop state file (`loop_state.json`)
- Final report (`final_improvement_report.md`)
- Decision log (`decision_log.json`)

**Estimated Time**: 5-10 minutes per iteration (coordination overhead)

---

## Mission Statement

Orchestrate the complete improvement cycle by:

1. **Managing flow** between all 6 phases (1→2→3→4→5→6)
2. **Tracking progress** across iterations
3. **Detecting plateau** when improvements stall
4. **Making decisions** about continuing or exiting
5. **Maintaining audit trail** of all actions
6. **Saving state** for resumption capability

---

## Prerequisites

### Required Knowledge
- Python 2.7 compatible syntax
- JSON state management
- Process orchestration and subprocess management
- Decision logic and exit condition evaluation

### Required Inputs
- All phase scripts available and executable
- Access to Plex logs and codebase
- Ability to run subprocess commands

### Exit Conditions

The loop exits when ANY of these conditions is met:

1. **Success**: All identified issues fixed to best ability
2. **Plateau**: No substantial progress after 2-3 iterations
3. **Diminishing Returns**: Improvements < 5% per iteration
4. **Time Limit**: Maximum iterations reached (default: 10)
5. **Critical Failure**: System becomes worse than baseline
6. **Manual Exit**: User requests stop

---

## Step-by-Step Implementation Guide

### Step 1: Initialize Loop State

```python
import json
import datetime
from pathlib import Path

class LoopCoordinator:
    def __init__(self, max_iterations=10):
        self.state = {
            'iteration': 0,
            'max_iterations': max_iterations,
            'baseline_metrics': None,
            'current_metrics': None,
            'iteration_history': [],
            'fixes_attempted': [],
            'fixes_successful': [],
            'fixes_failed': [],
            'exit_condition': None,
            'session_start': datetime.datetime.now().isoformat()
        }
        
        # Create output directory
        self.output_dir = Path("Plug-ins/plex_improvement/reports")
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def record_iteration(self, phase, results):
        """Record results from each phase"""
        iteration_record = {
            'iteration': self.state['iteration'],
            'phase': phase,
            'timestamp': datetime.datetime.now().isoformat(),
            'results': results,
            'metrics_snapshot': self.state['current_metrics']
        }
        
        self.state['iteration_history'].append(iteration_record)
        self.save_state()
    
    def save_state(self):
        """Save loop state to file"""
        state_file = self.output_dir / "loop_state.json"
        with open(state_file, 'w') as f:
            json.dump(self.state, f, indent=2, default=str)
```

### Step 2: Calculate Progress

```python
    def calculate_progress(self):
        """Calculate overall progress across iterations"""
        if len(self.state['iteration_history']) < 2:
            return None
        
        first_iter = self.state['iteration_history'][0]
        latest_iter = self.state['iteration_history'][-1]
        
        # Compare metrics
        baseline = first_iter['metrics_snapshot']
        current = latest_iter['metrics_snapshot']
        
        progress = {
            'total_error_reduction': self.calculate_error_reduction(baseline, current),
            'success_rate_improvement': self.calculate_success_improvement(baseline, current),
            'iterations': len(self.state['iteration_history']),
            'fixes_successful': len(self.state['fixes_successful']),
            'fixes_failed': len(self.state['fixes_failed'])
        }
        
        return progress
    
    def calculate_error_reduction(self, baseline, current):
        """Calculate total error reduction"""
        baseline_errors = baseline.get('title_failures', 0) + baseline.get('url_errors', 0)
        current_errors = current.get('title_failures', 0) + current.get('url_errors', 0)
        
        if baseline_errors == 0:
            return 0
        
        reduction = baseline_errors - current_errors
        reduction_pct = (reduction / baseline_errors) * 100
        
        return {
            'absolute': reduction,
            'percentage': reduction_pct
        }
    
    def calculate_success_improvement(self, baseline, current):
        """Calculate success rate improvement"""
        baseline_searches = baseline.get('total_search_ops', 1)
        current_searches = current.get('total_search_ops', 1)
        
        baseline_found = baseline.get('titles_found', 0)
        current_found = current.get('titles_found', 0)
        
        baseline_rate = (baseline_found / baseline_searches * 100) if baseline_searches > 0 else 0
        current_rate = (current_found / current_searches * 100) if current_searches > 0 else 0
        
        improvement = current_rate - baseline_rate
        
        return {
            'baseline_rate': baseline_rate,
            'current_rate': current_rate,
            'improvement': improvement
        }
```

### Step 3: Detect Exit Conditions

```python
    def should_exit(self):
        """Determine if loop should exit"""
        progress = self.calculate_progress()
        
        if not progress:
            return False, None
        
        # Condition 1: Max iterations
        if self.state['iteration'] >= self.state['max_iterations']:
            self.state['exit_condition'] = 'max_iterations_reached'
            return True, "Maximum iterations reached"
        
        # Condition 2: No more fixes to try
        if not self.has_more_fixes():
            self.state['exit_condition'] = 'all_fixes_attempted'
            return True, "All identified fixes have been attempted"
        
        # Condition 3: Plateau detection
        if self.detect_plateau(progress):
            self.state['exit_condition'] = 'plateau_detected'
            return True, "Progress has plateaued - no significant improvement in last 2 iterations"
        
        # Condition 4: Substantial progress achieved
        if self.achieved_target_improvement(progress):
            self.state['exit_condition'] = 'success'
            return True, "Target improvement achieved"
        
        # Condition 5: System degradation
        if self.detect_regression(progress):
            self.state['exit_condition'] = 'regression_detected'
            return True, "System performance has regressed - stopping"
        
        return False, None
    
    def detect_plateau(self, progress):
        """Detect if progress has plateaued"""
        if len(self.state['iteration_history']) < 3:
            return False
        
        # Check last 2 iterations
        recent_iterations = self.state['iteration_history'][-2:]
        
        improvements = []
        for iter_record in recent_iterations:
            if 'improvement_pct' in iter_record.get('results', {}):
                improvements.append(iter_record['results']['improvement_pct'])
        
        # Plateau if both iterations show < 5% improvement
        if len(improvements) >= 2:
            return all(imp < 5 for imp in improvements)
        
        return False
    
    def achieved_target_improvement(self, progress):
        """Check if target improvement achieved"""
        # Target: 30-90% success rate (from 5% baseline)
        current_success_rate = progress.get('success_rate_improvement', {}).get('current_rate', 0)
        
        # Success if we reach 30% or higher
        return current_success_rate >= 30
    
    def detect_regression(self, progress):
        """Detect if system has regressed"""
        if len(self.state['iteration_history']) < 2:
            return False
        
        first_iter = self.state['iteration_history'][0]
        latest_iter = self.state['iteration_history'][-1]
        
        first_errors = first_iter['metrics_snapshot'].get('title_failures', 0)
        latest_errors = latest_iter['metrics_snapshot'].get('title_failures', 0)
        
        # Regression if errors increased by > 10%
        if first_errors > 0:
            increase_pct = ((latest_errors - first_errors) / first_errors) * 100
            return increase_pct > 10
        
        return False
    
    def has_more_fixes(self):
        """Check if there are more fixes to attempt"""
        # This would be populated from diagnostic phase
        # For now, assume we have fixes if iteration < max
        return self.state['iteration'] < self.state['max_iterations']
```

### Step 4: Execute Phase 1 - Log Aggregation

```python
import subprocess

def execute_log_aggregation(coordinator, iteration):
    """Execute log aggregation phase"""
    
    print("\n" + "=" * 80)
    print("ITERATION {}: PHASE 1 - LOG AGGREGATION".format(iteration))
    print("=" * 80)
    
    print("\nCollecting and aggregating Plex plugin logs...")
    
    # Run log aggregation script
    output_file = "aggregated_logs_iteration_{}.txt".format(iteration)
    
    result = subprocess.run([
        'python',
        'Plug-ins/plex_improvement/scripts/aggregate_plex_logs.py',
        '--output', "Plug-ins/plex_improvement/reports/{}".format(output_file),
        '--timeframe', '24'
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print("Log aggregation failed: {}".format(result.stderr))
        return None
    
    print("Log aggregation complete: {}".format(output_file))
    
    # Parse metrics from report
    metrics = parse_aggregation_report("Plug-ins/plex_improvement/reports/{}".format(output_file))
    
    print("\nCurrent System Metrics:")
    print("  Total Search Operations: {}".format(metrics['total_search_ops']))
    print("  Title Match Failures: {}".format(metrics['title_failures']))
    print("  URL Fetch Errors: {}".format(metrics['url_errors']))
    print("  Model Read Errors: {}".format(metrics['model_errors']))
    
    if iteration == 1:
        print("\nThis is baseline - saving for comparison...")
    else:
        # Compare to baseline
        baseline = coordinator.state['baseline_metrics']
        improvement = calculate_improvement(baseline, metrics)
        print("\nImprovement vs Baseline:")
        print("  Error Reduction: {}%".format(improvement['error_reduction']))
        print("  Success Rate: {}%".format(improvement['success_rate']))
    
    return {
        'status': 'success',
        'output_file': output_file,
        'metrics': metrics
    }

def parse_aggregation_report(report_path):
    """Parse metrics from aggregation report"""
    import re
    
    metrics = {
        'total_search_ops': 0,
        'titles_found': 0,
        'title_failures': 0,
        'model_errors': 0,
        'url_errors': 0
    }
    
    with open(report_path, 'r') as f:
        content = f.read()
        
        metrics['total_search_ops'] = extract_number(content, r'Total Search Operations:\s+(\d+)')
        metrics['titles_found'] = extract_number(content, r'Titles Found Events:\s+(\d+)')
        metrics['title_failures'] = extract_number(content, r'Title Match Failures:\s+(\d+)')
        metrics['model_errors'] = extract_number(content, r'Model Read Errors:\s+(\d+)')
        metrics['url_errors'] = extract_number(content, r'URL Fetch Errors:\s+(\d+)')
    
    return metrics

def extract_number(text, pattern):
    """Extract number from text using regex"""
    match = re.search(pattern, text)
    return int(match.group(1)) if match else 0

def calculate_improvement(baseline, current):
    """Calculate improvement metrics"""
    improvement = {
        'error_reduction': 0,
        'success_rate': 0
    }
    
    # Error reduction
    baseline_errors = baseline.get('title_failures', 0) + baseline.get('url_errors', 0)
    current_errors = current.get('title_failures', 0) + current.get('url_errors', 0)
    
    if baseline_errors > 0:
        improvement['error_reduction'] = ((baseline_errors - current_errors) / baseline_errors) * 100
    
    # Success rate
    baseline_rate = (baseline.get('titles_found', 0) / baseline.get('total_search_ops', 1) * 100)
    current_rate = (current.get('titles_found', 0) / current.get('total_search_ops', 1) * 100)
    improvement['success_rate'] = current_rate - baseline_rate
    
    return improvement
```

### Step 5: Execute Phase 2 - Diagnostics

```python
def execute_diagnostics(aggregation_results, coordinator, iteration):
    """Execute diagnostic phase"""
    
    print("\n" + "=" * 80)
    print("ITERATION {}: PHASE 2 - DIAGNOSTICS".format(iteration))
    print("=" * 80)
    
    # Check if we need full diagnostics or just updates
    if iteration == 1:
        print("\nRunning full diagnostic analysis...")
        mode = 'full'
    else:
        print("\nRunning focused diagnostic on remaining issues...")
        mode = 'focused'
    
    # Run diagnostic script
    result = subprocess.run([
        'python',
        'Plug-ins/plex_improvement/scripts/diagnose_from_report.py',
        '--input', "Plug-ins/plex_improvement/reports/{}".format(aggregation_results['output_file']),
        '--mode', mode,
        '--output', "Plug-ins/plex_improvement/reports/diagnostic_report_iteration_{}.md".format(iteration)
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print("Diagnostics failed: {}".format(result.stderr))
        return None
    
    print("Diagnostic analysis complete")
    
    # Parse diagnostic report
    diagnostic_report = parse_diagnostic_report("Plug-ins/plex_improvement/reports/diagnostic_report_iteration_{}.md".format(iteration))
    
    print("\nDiagnostic Summary:")
    print("  Error types identified: {}".format(len(diagnostic_report.get('error_types', []))))
    print("  Fixes proposed: {}".format(len(diagnostic_report.get('fixes', []))))
    print("  High-priority fixes: {}".format(len([f for f in diagnostic_report.get('fixes', []) if f.get('priority') == 'HIGH'])))
    
    # Show top fixes
    print("\nTop Priority Fixes:")
    for i, fix in enumerate(diagnostic_report.get('fixes', [])[:3], 1):
        print("  {}. {} ({})".format(i, fix['name'], fix.get('expected_improvement', 'N/A')))
    
    return {
        'status': 'success',
        'report_file': "diagnostic_report_iteration_{}.md".format(iteration),
        'fixes': diagnostic_report.get('fixes', []),
        'error_types': diagnostic_report.get('error_types', [])
    }

def parse_diagnostic_report(report_path):
    """Parse diagnostic report"""
    # Simplified parsing - in production, would parse markdown
    return {
        'error_types': ['IAFD 403', 'Title Match Failures'],
        'fixes': [
            {
                'name': 'Enhanced Headers for IAFD',
                'priority': 'HIGH',
                'expected_improvement': '20-30% success rate'
            }
        ]
    }
```

### Step 6: Execute Phase 3 - Implementation

```python
def execute_implementation(diagnostic_results, coordinator, iteration):
    """Execute implementation phase - ONE FIX AT A TIME"""
    
    print("\n" + "=" * 80)
    print("ITERATION {}: PHASE 3 - IMPLEMENTATION".format(iteration))
    print("=" * 80)
    
    # Get next fix to implement
    fixes = diagnostic_results.get('fixes', [])
    
    # Filter to only high-priority, unattempted fixes
    pending_fixes = [f for f in fixes if f.get('priority') == 'HIGH' and f['name'] not in coordinator.state['fixes_attempted']]
    
    if not pending_fixes:
        print("No high-priority fixes remaining")
        return {
            'status': 'no_fixes',
            'message': 'All high-priority fixes have been attempted'
        }
    
    # Take first pending fix
    fix_to_implement = pending_fixes[0]
    
    print("\nImplementing: {}".format(fix_to_implement['name']))
    print("   Priority: {}".format(fix_to_implement.get('priority', 'N/A')))
    print("   Expected Improvement: {}".format(fix_to_implement.get('expected_improvement', 'N/A')))
    
    # Run implementation script
    result = subprocess.run([
        'python',
        'Plug-ins/plex_improvement/scripts/implement_fix.py',
        '--fix', fix_to_implement['name'],
        '--diagnostic-report', diagnostic_results['report_file']
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print("Implementation failed: {}".format(result.stderr))
        coordinator.state['fixes_failed'].append(fix_to_implement['name'])
        return {
            'status': 'failed',
            'fix_name': fix_to_implement['name'],
            'error': result.stderr
        }
    
    print("Implementation complete")
    
    coordinator.state['fixes_attempted'].append(fix_to_implement['name'])
    
    return {
        'status': 'success',
        'fix_name': fix_to_implement['name'],
        'fix_details': fix_to_implement
    }
```

### Step 7: Execute Phase 4 - Testing

```python
def execute_testing(implementation_results, coordinator, iteration):
    """Execute testing phase with active metadata refresh"""
    
    print("\n" + "=" * 80)
    print("ITERATION {}: PHASE 4 - TESTING & VALIDATION".format(iteration))
    print("=" * 80)
    
    fix_name = implementation_results.get('fix_name', 'Unknown')
    
    print("\nTesting fix: {}".format(fix_name))
    
    # Active testing - no waiting required!
    print("\nRunning active metadata refresh test...")
    
    # Run active testing script
    result = subprocess.run([
        'python',
        'Plug-ins/plex_improvement/scripts/test_fix_actively.py',
        '--baseline', "Plug-ins/plex_improvement/reports/aggregated_logs_iteration_{}.txt".format(iteration),
        '--max-items', '20'
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print("Active testing failed: {}".format(result.stderr))
        return None
    
    print("Active test complete - 20 items refreshed")
    
    # Re-aggregate logs with fresh test data
    print("\nRe-aggregating logs with fresh test data...")
    
    result = subprocess.run([
        'python',
        'Plug-ins/plex_improvement/scripts/aggregate_plex_logs.py',
        '--output', "Plug-ins/plex_improvement/reports/post_fix_logs_iteration_{}.txt".format(iteration),
        '--timeframe', '1'  # Last hour - contains our active test
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print("Log aggregation failed: {}".format(result.stderr))
        return None
    
    print("Logs aggregated")
    
    # Compare metrics
    print("\nComparing before/after metrics...")
    
    result = subprocess.run([
        'python',
        'Plug-ins/plex_improvement/scripts/compare_metrics.py',
        '--baseline', "Plug-ins/plex_improvement/reports/aggregated_logs_iteration_{}.txt".format(iteration),
        '--current', "Plug-ins/plex_improvement/reports/post_fix_logs_iteration_{}.txt".format(iteration),
        '--fix-name', fix_name,
        '--output', "Plug-ins/plex_improvement/reports/test_report_{}_iteration_{}.md".format(fix_name.replace(' ', '_'), iteration)
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print("Metric comparison failed: {}".format(result.stderr))
        return None
    
    print("Metrics compared")
    
    # Parse test results
    test_results = parse_test_report("Plug-ins/plex_improvement/reports/test_report_{}_iteration_{}.md".format(fix_name.replace(' ', '_'), iteration))
    
    print("\nTest Results:")
    print("  Success Rate: {}%".format(test_results.get('success_rate', 0)))
    print("  Success Indicators Met: {}/{}".format(test_results.get('success_count', 0), test_results.get('total_indicators', 0)))
    print("  Decision: {}".format(test_results.get('decision', 'UNKNOWN')))
    
    # Update coordinator state
    if test_results.get('decision') == 'KEEP':
        coordinator.state['fixes_successful'].append(fix_name)
    elif test_results.get('decision') == 'ROLLBACK':
        coordinator.state['fixes_failed'].append(fix_name)
    
    return {
        'status': 'success',
        'test_results': test_results,
        'decision': test_results.get('decision', 'UNKNOWN'),
        'test_time_minutes': 30  # Active testing is fast!
    }

def parse_test_report(report_path):
    """Parse test report"""
    # Simplified parsing
    return {
        'success_rate': 75,
        'success_count': 3,
        'total_indicators': 4,
        'decision': 'KEEP'
    }
```

### Step 8: Make Loop Decision

```python
def make_loop_decision(test_results, coordinator):
    """Decide what to do after testing phase"""
    
    print("\n" + "=" * 80)
    print("DECISION POINT")
    print("=" * 80)
    
    decision = test_results.get('decision', 'UNKNOWN')
    
    if decision == 'KEEP':
        print("\nFix was successful and is being kept")
        
        # Check if more fixes to try
        if coordinator.has_more_fixes():
            print("\nMore fixes available")
            print("   DECISION: Implement next fix")
            return 'next_fix'
        else:
            print("\nNo more fixes to implement")
            print("   DECISION: Re-diagnose to find new issues")
            return 're_diagnose'
    
    elif decision == 'ROLLBACK':
        print("\nFix failed and has been rolled back")
        
        # Try alternative solution?
        if test_results.get('alternative_solution'):
            print("\nAlternative solution available")
            print("   DECISION: Try alternative approach")
            return 'try_alternative'
        else:
            print("\nNo alternative solution")
            print("   DECISION: Move to next fix")
            return 'next_fix'
    
    elif decision == 'MONITOR':
        print("\nFix shows partial success - needs more time")
        print("   DECISION: Wait and re-test")
        return 'wait_and_retest'
    
    else:
        print("\nUnknown decision - manual review required")
        return 'manual_review'
```

### Step 9: Main Loop Orchestration

```python
def main():
    """Main execution function"""
    
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                  PLEX METADATA IMPROVEMENT LOOP                             ║
║                                                                              ║
║  This coordinator will iteratively improve your Plex metadata system by:    ║
║    1. Analyzing logs to identify errors                                     ║
║    2. Diagnosing root causes and proposing fixes                            ║
║    3. Implementing fixes one at a time                                      ║
║    4. Testing each fix for effectiveness                                    ║
║    5. Repeating until no more improvements can be made                      ║
║                                                                              ║
║  Exit conditions:                                                            ║
║    • All fixable issues resolved                                            ║
║    • Progress plateaus (< 5% improvement per iteration)                     ║
║    • Maximum iterations reached (10)                                        ║
║    • User requests stop                                                     ║
╚══════════════════════════════════════════════════════════════════════════════════╝
    """)
    
    input("\nPress Enter to begin improvement loop...")
    
    coordinator = LoopCoordinator(max_iterations=10)
    
    while True:
        coordinator.state['iteration'] += 1
        iteration = coordinator.state['iteration']
        
        print("\n\n")
        print("╔" + "═" * 78 + "╗")
        print("║ ITERATION {:<70}║".format(iteration))
        print("╚" + "═" * 78 + "╝")
        
        # PHASE 1: Log Aggregation
        aggregation_results = execute_log_aggregation(coordinator, iteration)
        if not aggregation_results:
            print("Log aggregation failed - exiting loop")
            break
        
        coordinator.state['current_metrics'] = aggregation_results['metrics']
        
        if iteration == 1:
            coordinator.state['baseline_metrics'] = aggregation_results['metrics']
        
        coordinator.record_iteration('aggregation', aggregation_results)
        
        # PHASE 2: Diagnostics
        diagnostic_results = execute_diagnostics(aggregation_results, coordinator, iteration)
        if not diagnostic_results:
            print("Diagnostics failed - exiting loop")
            break
        
        coordinator.record_iteration('diagnostics', diagnostic_results)
        
        # PHASE 3: Implementation
        implementation_results = execute_implementation(diagnostic_results, coordinator, iteration)
        
        if implementation_results.get('status') == 'no_fixes':
            print("\nAll available fixes have been attempted")
            should_exit, reason = coordinator.should_exit()
            if should_exit:
                print("\nExiting loop: {}".format(reason))
                break
            else:
                print("\nRe-diagnosing to find new issues...")
                continue
        
        elif implementation_results.get('status') == 'failed':
            print("\nImplementation failed for: {}".format(implementation_results.get('fix_name', 'Unknown')))
            print("   Moving to next fix...")
            continue
        
        coordinator.record_iteration('implementation', implementation_results)
        
        # PHASE 4: Testing
        testing_results = execute_testing(implementation_results, coordinator, iteration)
        
        if testing_results.get('status') == 'waiting':
            print("\nLoop paused - waiting for test data")
            coordinator.save_state()
            break
        
        coordinator.record_iteration('testing', testing_results)
        
        # DECISION POINT
        next_action = make_loop_decision(testing_results, coordinator)
        
        if next_action == 'next_fix':
            print("\nProceeding to next fix in same iteration...")
            continue
        
        elif next_action == 're_diagnose':
            print("\nRe-diagnosing in next iteration...")
            # Loop will naturally go to next iteration
        
        elif next_action == 'wait_and_retest':
            print("\nWaiting 24 hours for re-test...")
            coordinator.save_state()
            break
        
        # Check exit conditions
        should_exit, reason = coordinator.should_exit()
        
        if should_exit:
            print("\n\nEXITING LOOP: {}".format(reason))
            break
        
        # Show progress
        progress = coordinator.calculate_progress()
        print("\n\nOVERALL PROGRESS:")
        print("  Iterations: {}".format(progress.get('iterations', 0)))
        print("  Fixes Successful: {}".format(progress.get('fixes_successful', 0)))
        print("  Fixes Failed: {}".format(progress.get('fixes_failed', 0)))
        print("  Total Error Reduction: {}%".format(progress.get('total_error_reduction', {}).get('percentage', 0)))
        print("  Success Rate Improvement: {}%".format(progress.get('success_rate_improvement', {}).get('improvement', 0)))
        
        input("\nPress Enter to continue to next iteration (or Ctrl+C to stop)...")
    
    # Loop complete - generate final report
    generate_final_report(coordinator)
    
    print("\n\n")
    print("╔" + "═" * 78 + "╗")
    print("║ IMPROVEMENT LOOP COMPLETE" + " " * 52 + "║")
    print("╚" + "═" * 78 + "╝")
    
    print("\nFinal Report: Plug-ins/plex_improvement/reports/final_improvement_report.md")
    print("Loop State: Plug-ins/plex_improvement/reports/loop_state.json")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nLoop interrupted by user")
        print("  State has been saved - you can resume later")
    except Exception as e:
        print("\n\nUnexpected error: {}".format(e))
        print("  State has been saved")
        raise
```

### Step 10: Generate Final Report

```python
def generate_final_report(coordinator):
    """Generate comprehensive final report"""
    
    progress = coordinator.calculate_progress()
    
    report = """
# Plex Metadata Improvement - Final Report

**Generated**: {}
**Total Iterations**: {}
**Exit Condition**: {}

## Executive Summary

This improvement loop ran for {} iterations, attempting 
{} fixes with {} 
successful implementations.

**Overall Improvement**:
- Total Error Reduction: {}%
- Success Rate Improvement: {}%

## Baseline vs Final Metrics

| Metric | Baseline | Final | Change | % Change |
|--------|----------|-------|--------|----------|
| Total Searches | {} | {} | ... | ... |
| Title Failures | {} | {} | ... | ... |
| URL Errors | {} | {} | ... | ... |

## Iteration History

{}

## Fixes Applied

### Successful Fixes ({})

{}

### Failed Fixes ({})

{}

## Recommendations for Future Improvements

{}

## Conclusion

The improvement loop has completed with {}% overall improvement in metadata extraction success rate. 
{} fixes were successfully implemented and retained, while {} fixes were rolled back due to 
failure to meet success criteria.

The system has evolved from a 5% baseline success rate to a {}% final success rate, 
representing a {}x improvement in metadata quality.

""".format(
        datetime.datetime.now().isoformat(),
        coordinator.state['iteration'],
        coordinator.state['exit_condition'],
        coordinator.state['iteration'],
        len(coordinator.state['fixes_attempted']),
        len(coordinator.state['fixes_successful']),
        progress.get('total_error_reduction', {}).get('percentage', 0),
        progress.get('success_rate_improvement', {}).get('improvement', 0),
        coordinator.state['baseline_metrics'].get('total_search_ops', 0) if coordinator.state['baseline_metrics'] else 0,
        coordinator.state['current_metrics'].get('total_search_ops', 0) if coordinator.state['current_metrics'] else 0,
        coordinator.state['baseline_metrics'].get('title_failures', 0) if coordinator.state['baseline_metrics'] else 0,
        coordinator.state['current_metrics'].get('title_failures', 0) if coordinator.state['current_metrics'] else 0,
        coordinator.state['baseline_metrics'].get('url_errors', 0) if coordinator.state['baseline_metrics'] else 0,
        coordinator.state['current_metrics'].get('url_errors', 0) if coordinator.state['current_metrics'] else 0,
        generate_iteration_summary(coordinator),
        len(coordinator.state['fixes_successful']),
        generate_fix_list(coordinator.state['fixes_successful'], coordinator),
        len(coordinator.state['fixes_failed']),
        generate_fix_list(coordinator.state['fixes_failed'], coordinator),
        generate_recommendations(coordinator),
        len(coordinator.state['fixes_successful']),
        progress.get('success_rate_improvement', {}).get('current_rate', 0) if progress.get('success_rate_improvement') else 0,
        len(coordinator.state['fixes_successful']),
        len(coordinator.state['fixes_failed'])
    )
    
    # Write report
    report_file = coordinator.output_dir / "final_improvement_report.md"
    with open(report_file, 'w') as f:
        f.write(report)
    
    print("Final report generated: {}".format(report_file))
    
    # Also save state as JSON
    state_file = coordinator.output_dir / "loop_state.json"
    with open(state_file, 'w') as f:
        json.dump(coordinator.state, f, indent=2, default=str)

def generate_iteration_summary(coordinator):
    """Generate iteration history summary"""
    summary = ""
    for i, iter_record in enumerate(coordinator.state['iteration_history'], 1):
        summary += "\n### Iteration {}\n".format(i)
        summary += "- Phase: {}\n".format(iter_record['phase'])
        summary += "- Timestamp: {}\n".format(iter_record['timestamp'])
        summary += "- Status: {}\n".format(iter_record['results'].get('status', 'unknown'))
    return summary

def generate_fix_list(fixes, coordinator):
    """Generate formatted fix list"""
    if not fixes:
        return "None"
    
    fix_list = ""
    for i, fix_name in enumerate(fixes, 1):
        fix_list += "{}. {}\n".format(i, fix_name)
    return fix_list

def generate_recommendations(coordinator):
    """Generate recommendations based on results"""
    return """
Based on the improvement cycle, the following recommendations are made:

1. Continue monitoring for 48 hours to assess long-term stability
2. Consider implementing remaining medium-priority fixes if issues persist
3. Schedule regular log aggregation to catch new error patterns
4. Document successful patterns for future reference
5. Review failed fixes for alternative approaches
"""
```

---

## Validation Checklist

Before considering loop coordination complete, verify:

- [ ] All phases execute in correct order
- [ ] Results from one phase feed into next
- [ ] Progress is tracked and plateau is detected
- [ ] The loop exits gracefully when conditions met
- [ ] State can be saved and resumed
- [ ] Final report is generated
- [ ] All decisions are logged
- [ ] Audit trail is maintained
- [ ] Python 2.7 compatible

---

## Common Pitfalls to Avoid

1. **Skipping Phases**: Always execute all phases in order
2. **Not Tracking State**: Maintain complete iteration history
3. **Ignoring Exit Conditions**: Check all exit conditions each iteration
4. **No Resumption**: Always save state for recovery
5. **Infinite Loops**: Ensure exit conditions will eventually trigger
6. **Lost Decisions**: Log all decisions for audit trail
7. **No Progress Tracking**: Calculate and display progress each iteration

---

## Integration with Other Phases

This phase orchestrates:

- **Phase 1 (Log Aggregation)**: Runs aggregation script
- **Phase 2 (Diagnostics)**: Runs diagnostic script
- **Phase 3 (Implementation)**: Runs implementation script
- **Phase 4 (Testing)**: Runs testing script
- **Phase 5 (Post-Mortem)**: Triggers post-mortem after loop exits

---

## Success Criteria

Your loop coordination is successful when:

1. ✅ All phases execute in correct order
2. ✅ Results flow between phases correctly
3. ✅ Progress is tracked across iterations
4. ✅ Exit conditions are properly detected
5. ✅ Loop exits gracefully
6. ✅ Final report is generated
7. ✅ State is saved for resumption
8. ✅ All decisions are logged
9. ✅ Audit trail is maintained
10. ✅ Python 2.7 compatible

---

## Next Steps

After completing this phase:

1. Review final improvement report
2. Assess if additional iterations are needed
3. Proceed to **Phase 5: Post-Mortem** for detailed analysis
4. Or restart loop with lessons learned if continuing

---

## Related Files

- **Master Prompt**: [`plex_improvement_agent_master_prompt.md`](../prompts/plex_improvement_agent_master_prompt.md)
- **Phase 1 Prompt**: [`phase1_log_aggregation_prompt.md`](../prompts/phase1_log_aggregation_prompt.md)
- **Phase 2 Prompt**: [`phase2_diagnostics_prompt.md`](../prompts/phase2_diagnostics_prompt.md)
- **Phase 3 Prompt**: [`phase3_implementation_prompt.md`](../prompts/phase3_implementation_prompt.md)
- **Phase 4 Prompt**: [`phase4_testing_prompt.md`](../prompts/phase4_testing_prompt.md)
- **Phase 5 Prompt**: [`phase5_postmortem_prompt.md`](../prompts/phase5_postmortem_prompt.md)
- **Existing Script**: [`../scripts/loop_coordinator.py`](../scripts/loop_coordinator.py) (reference implementation)
