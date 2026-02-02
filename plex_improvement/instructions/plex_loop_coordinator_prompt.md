# Plex Improvement Loop Coordinator - Instruction Set

## PART 1: MISSION AND SCOPE

### Primary Mission
Orchestrate the complete improvement cycle: Log Aggregation → Diagnosis → Implementation → Testing → Decision, repeating until substantial progress plateaus or all fixable issues are resolved.

### The Improvement Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                        START                                     │
│                          │                                       │
│                          ▼                                       │
│        ┌──────────────────────────────────┐                     │
│        │  PHASE 1: LOG AGGREGATION        │                     │
│        │  - Collect Plex plugin logs      │                     │
│        │  - Analyze error patterns        │                     │
│        │  - Generate metrics report       │                     │
│        └──────────────────────────────────┘                     │
│                          │                                       │
│                          ▼                                       │
│        ┌──────────────────────────────────┐                     │
│        │  PHASE 2: DIAGNOSTICS            │                     │
│        │  - Research each error type      │                     │
│        │  - Determine root causes         │                     │
│        │  - Propose prioritized solutions │                     │
│        └──────────────────────────────────┘                     │
│                          │                                       │
│                          ▼                                       │
│        ┌──────────────────────────────────┐                     │
│        │  PHASE 3: IMPLEMENTATION         │                     │
│        │  - Backup affected files         │                     │
│        │  - Apply ONE fix at a time       │                     │
│        │  - Restart Plex if needed        │                     │
│        └──────────────────────────────────┘                     │
│                          │                                       │
│                          ▼                                       │
│        ┌──────────────────────────────────┐                     │
│        │  PHASE 4: TESTING                │                     │
│        │  - Wait for sufficient data      │                     │
│        │  - Re-aggregate logs             │                     │
│        │  - Compare before/after metrics  │                     │
│        └──────────────────────────────────┘                     │
│                          │                                       │
│                          ▼                                       │
│        ┌──────────────────────────────────┐                     │
│        │  DECISION POINT                  │                     │
│        │  - Fix successful?               │                     │
│        │  - More fixes to try?            │                     │
│        │  - Making progress?              │                     │
│        └──────────────────────────────────┘                     │
│                 │                │                │              │
│                 ▼                ▼                ▼              │
│            NEXT FIX         RE-DIAGNOSE      EXIT LOOP          │
│          (to Phase 3)      (to Phase 2)      (success/plateau)  │
│                 │                │                               │
│                 └────────────────┘                               │
│                          │                                       │
│                          └───────────────────────────────────────┘
```

### Exit Conditions

The loop exits when ANY of these conditions is met:

1. **Success**: All identified issues fixed to best ability
2. **Plateau**: No substantial progress after 2-3 iterations
3. **Diminishing Returns**: Improvements < 5% per iteration
4. **Time Limit**: Maximum iterations reached (default: 10)
5. **Critical Failure**: System becomes worse than baseline
6. **Manual Exit**: User requests stop

---

## PART 2: LOOP STATE MANAGEMENT

### Loop State Tracking

```python
class LoopCoordinator:
    def __init__(self):
        self.state = {
            'iteration': 0,
            'max_iterations': 10,
            'baseline_metrics': None,
            'current_metrics': None,
            'iteration_history': [],
            'fixes_attempted': [],
            'fixes_successful': [],
            'fixes_failed': [],
            'exit_condition': None
        }
        
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
        
    def should_exit(self):
        """Determine if loop should exit"""
        progress = self.calculate_progress()
        
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
            if 'improvement_pct' in iter_record['results']:
                improvements.append(iter_record['results']['improvement_pct'])
                
        # Plateau if both iterations show < 5% improvement
        if len(improvements) >= 2:
            return all(imp < 5 for imp in improvements)
            
        return False
```

---

## PART 3: PHASE EXECUTION

### Phase 1: Log Aggregation

```python
def execute_log_aggregation(iteration):
    """
    Execute log aggregation phase
    """
    
    print("\n" + "="*80)
    print(f"ITERATION {iteration}: PHASE 1 - LOG AGGREGATION")
    print("="*80)
    
    print("\n📊 Collecting and aggregating Plex plugin logs...")
    
    # Run log aggregation script
    output_file = f"aggregated_logs_iteration_{iteration}.txt"
    
    result = subprocess.run([
        'python',
        'aggregate_plex_logs.py',
        '--output', output_file,
        '--timeframe', '24'
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"✗ Log aggregation failed: {result.stderr}")
        return None
        
    print(f"✓ Log aggregation complete: {output_file}")
    
    # Parse metrics from report
    metrics = parse_aggregation_report(output_file)
    
    print("\n📈 Current System Metrics:")
    print(f"  Total Search Operations: {metrics['total_search_ops']}")
    print(f"  Title Match Failures: {metrics['title_failures']}")
    print(f"  URL Fetch Errors: {metrics['url_errors']}")
    print(f"  Model Read Errors: {metrics['model_errors']}")
    
    if iteration == 1:
        print("\n📋 This is the baseline - saving for comparison...")
    else:
        # Compare to baseline
        baseline = load_baseline_metrics()
        improvement = calculate_improvement(baseline, metrics)
        print(f"\n📊 Improvement vs Baseline:")
        print(f"  Error Reduction: {improvement['error_reduction']}%")
        print(f"  Success Rate: {improvement['success_rate_improvement']}%")
        
    return {
        'status': 'success',
        'output_file': output_file,
        'metrics': metrics
    }
```

### Phase 2: Diagnostics

```python
def execute_diagnostics(aggregation_results, iteration):
    """
    Execute diagnostic phase
    """
    
    print("\n" + "="*80)
    print(f"ITERATION {iteration}: PHASE 2 - DIAGNOSTICS")
    print("="*80)
    
    # Check if we need full diagnostics or just updates
    if iteration == 1:
        print("\n🔍 Running full diagnostic analysis...")
        mode = 'full'
    else:
        print("\n🔍 Running focused diagnostic on remaining issues...")
        mode = 'focused'
        
    # Run diagnostic script
    result = subprocess.run([
        'python',
        'diagnose_issues.py',
        '--input', aggregation_results['output_file'],
        '--mode', mode,
        '--output', f'diagnostic_report_iteration_{iteration}.md'
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"✗ Diagnostics failed: {result.stderr}")
        return None
        
    print(f"✓ Diagnostic analysis complete")
    
    # Parse diagnostic report
    diagnostic_report = parse_diagnostic_report(f'diagnostic_report_iteration_{iteration}.md')
    
    print(f"\n📋 Diagnostic Summary:")
    print(f"  Error types identified: {len(diagnostic_report['error_types'])}")
    print(f"  Fixes proposed: {len(diagnostic_report['fixes'])}")
    print(f"  High-priority fixes: {len([f for f in diagnostic_report['fixes'] if f['priority'] == 'HIGH'])}")
    
    # Show top fixes
    print(f"\n🎯 Top Priority Fixes:")
    for i, fix in enumerate(diagnostic_report['fixes'][:3], 1):
        print(f"  {i}. {fix['name']} ({fix['expected_improvement']})")
        
    return {
        'status': 'success',
        'report_file': f'diagnostic_report_iteration_{iteration}.md',
        'fixes': diagnostic_report['fixes'],
        'error_types': diagnostic_report['error_types']
    }
```

### Phase 3: Implementation

```python
def execute_implementation(diagnostic_results, iteration):
    """
    Execute implementation phase - ONE FIX AT A TIME
    """
    
    print("\n" + "="*80)
    print(f"ITERATION {iteration}: PHASE 3 - IMPLEMENTATION")
    print("="*80)
    
    # Get next fix to implement
    fixes = diagnostic_results['fixes']
    
    # Filter to only high-priority, unattempted fixes
    pending_fixes = [f for f in fixes if f['priority'] == 'HIGH' and f['name'] not in coordinator.state['fixes_attempted']]
    
    if not pending_fixes:
        print("⊗ No high-priority fixes remaining")
        return {
            'status': 'no_fixes',
            'message': 'All high-priority fixes have been attempted'
        }
        
    # Take first pending fix
    fix_to_implement = pending_fixes[0]
    
    print(f"\n🔧 Implementing: {fix_to_implement['name']}")
    print(f"   Priority: {fix_to_implement['priority']}")
    print(f"   Expected Improvement: {fix_to_implement['expected_improvement']}")
    
    # Run implementation script
    result = subprocess.run([
        'python',
        'implement_fix.py',
        '--fix', fix_to_implement['name'],
        '--diagnostic-report', diagnostic_results['report_file']
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"✗ Implementation failed: {result.stderr}")
        coordinator.state['fixes_failed'].append(fix_to_implement['name'])
        return {
            'status': 'failed',
            'fix_name': fix_to_implement['name'],
            'error': result.stderr
        }
        
    print(f"✓ Implementation complete")
    
    coordinator.state['fixes_attempted'].append(fix_to_implement['name'])
    
    return {
        'status': 'success',
        'fix_name': fix_to_implement['name'],
        'fix_details': fix_to_implement
    }
```

### Phase 4: Testing

```python
def execute_testing(implementation_results, iteration):
    """
    Execute testing phase with active metadata refresh
    """
    
    print("\n" + "="*80)
    print(f"ITERATION {iteration}: PHASE 4 - TESTING & VALIDATION")
    print("="*80)
    
    fix_name = implementation_results['fix_name']
    
    print(f"\n🧪 Testing fix: {fix_name}")
    
    # Active testing - no waiting required!
    print(f"\n🔄 Running active metadata refresh test...")
    
    # Run active testing script
    result = subprocess.run([
        'python',
        'test_fix_actively.py',
        '--baseline', f'aggregated_logs_iteration_{iteration}.txt',
        '--max-items', '20'
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"✗ Active testing failed: {result.stderr}")
        return None
        
    print(f"✓ Active test complete - 20 items refreshed")
    
    # Re-aggregate logs with fresh test data
    print(f"\n📊 Re-aggregating logs with fresh test data...")
    
    result = subprocess.run([
        'python',
        'aggregate_plex_logs.py',
        '--output', f'post_fix_logs_iteration_{iteration}.txt',
        '--timeframe', '1'  # Last hour - contains our active test
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"✗ Log aggregation failed: {result.stderr}")
        return None
        
    print(f"✓ Logs aggregated")
    
    # Compare metrics
    print(f"\n📈 Comparing before/after metrics...")
    
    result = subprocess.run([
        'python',
        'compare_metrics.py',
        '--baseline', f'aggregated_logs_iteration_{iteration}.txt',
        '--current', f'post_fix_logs_iteration_{iteration}.txt',
        '--fix-name', fix_name,
        '--output', f'test_report_{fix_name}_iteration_{iteration}.md'
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"✗ Metric comparison failed: {result.stderr}")
        return None
        
    print(f"✓ Metrics compared")
    
    # Parse test results
    test_results = parse_test_report(f'test_report_{fix_name}_iteration_{iteration}.md')
    
    print(f"\n📊 Test Results:")
    print(f"  Success Rate: {test_results['success_rate']}%")
    print(f"  Success Indicators Met: {test_results['success_count']}/{test_results['total_indicators']}")
    print(f"  Decision: {test_results['decision']}")
    
    # Update coordinator state
    if test_results['decision'] == 'KEEP':
        coordinator.state['fixes_successful'].append(fix_name)
    elif test_results['decision'] == 'ROLLBACK':
        coordinator.state['fixes_failed'].append(fix_name)
        
    return {
        'status': 'success',
        'test_results': test_results,
        'decision': test_results['decision'],
        'test_time_minutes': 30  # Active testing is fast!
    }
```

---

## PART 4: DECISION LOGIC

### Post-Testing Decisions

```python
def make_loop_decision(test_results, coordinator):
    """
    Decide what to do after testing phase
    """
    
    print("\n" + "="*80)
    print("DECISION POINT")
    print("="*80)
    
    decision = test_results['decision']
    
    if decision == 'KEEP':
        print("\n✓ Fix was successful and is being kept")
        
        # Check if more fixes to try
        if coordinator.has_more_fixes():
            print("\n→ More fixes available")
            print("   DECISION: Implement next fix")
            return 'next_fix'
        else:
            print("\n✓ No more fixes to implement")
            print("   DECISION: Re-diagnose to find new issues")
            return 're_diagnose'
            
    elif decision == 'ROLLBACK':
        print("\n✗ Fix failed and has been rolled back")
        
        # Try alternative solution?
        if test_results.get('alternative_solution'):
            print("\n→ Alternative solution available")
            print("   DECISION: Try alternative approach")
            return 'try_alternative'
        else:
            print("\n→ No alternative solution")
            print("   DECISION: Move to next fix")
            return 'next_fix'
            
    elif decision == 'MONITOR':
        print("\n⏱  Fix shows partial success - needs more time")
        print("   DECISION: Wait and re-test")
        return 'wait_and_retest'
        
    elif decision == 'MODIFY':
        print("\n🔧 Fix needs adjustment")
        print("   DECISION: Return to diagnostic phase for refinement")
        return 're_diagnose'
```

---

## PART 5: MAIN LOOP ORCHESTRATION

### Complete Loop Implementation

```python
#!/usr/bin/env python
"""
Plex Improvement Loop Coordinator
Orchestrates the complete improvement cycle
"""

import subprocess
import datetime
import json
import time

def main():
    coordinator = LoopCoordinator()
    
    print("""
╔══════════════════════════════════════════════════════════════════════════════╗
║                   PLEX METADATA IMPROVEMENT LOOP                             ║
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
╚══════════════════════════════════════════════════════════════════════════════╝
    """)
    
    input("\nPress Enter to begin the improvement loop...")
    
    while True:
        coordinator.state['iteration'] += 1
        iteration = coordinator.state['iteration']
        
        print("\n\n")
        print("╔" + "═" * 78 + "╗")
        print(f"║ ITERATION {iteration:<70}║")
        print("╚" + "═" * 78 + "╝")
        
        # PHASE 1: Log Aggregation
        aggregation_results = execute_log_aggregation(iteration)
        if not aggregation_results:
            print("✗ Log aggregation failed - exiting loop")
            break
            
        coordinator.state['current_metrics'] = aggregation_results['metrics']
        
        if iteration == 1:
            coordinator.state['baseline_metrics'] = aggregation_results['metrics']
            
        coordinator.record_iteration('aggregation', aggregation_results)
        
        # PHASE 2: Diagnostics
        diagnostic_results = execute_diagnostics(aggregation_results, iteration)
        if not diagnostic_results:
            print("✗ Diagnostics failed - exiting loop")
            break
            
        coordinator.record_iteration('diagnostics', diagnostic_results)
        
        # PHASE 3: Implementation
        implementation_results = execute_implementation(diagnostic_results, iteration)
        
        if implementation_results['status'] == 'no_fixes':
            print("\n✓ All available fixes have been attempted")
            should_exit, reason = coordinator.should_exit()
            if should_exit:
                print(f"\n🎯 Exiting loop: {reason}")
                break
            else:
                print("\n→ Re-diagnosing to find new issues...")
                continue
                
        elif implementation_results['status'] == 'failed':
            print(f"\n✗ Implementation failed for: {implementation_results['fix_name']}")
            print("   Moving to next fix...")
            continue
            
        coordinator.record_iteration('implementation', implementation_results)
        
        # PHASE 4: Testing
        testing_results = execute_testing(implementation_results, iteration)
        
        if testing_results['status'] == 'waiting':
            print(f"\n⏸  Loop paused - waiting for test data")
            save_loop_state(coordinator, 'waiting_for_test_data')
            break
            
        coordinator.record_iteration('testing', testing_results)
        
        # DECISION POINT
        next_action = make_loop_decision(testing_results, coordinator)
        
        if next_action == 'next_fix':
            print("\n→ Proceeding to next fix in same iteration...")
            continue
            
        elif next_action == 're_diagnose':
            print("\n→ Re-diagnosing in next iteration...")
            # Loop will naturally go to next iteration
            
        elif next_action == 'wait_and_retest':
            print("\n⏸  Waiting 24 hours for re-test...")
            save_loop_state(coordinator, 'waiting_for_retest')
            break
            
        # Check exit conditions
        should_exit, reason = coordinator.should_exit()
        
        if should_exit:
            print(f"\n\n🎯 EXITING LOOP: {reason}")
            break
            
        # Show progress
        progress = coordinator.calculate_progress()
        print(f"\n\n📊 OVERALL PROGRESS:")
        print(f"  Iterations: {progress['iterations']}")
        print(f"  Fixes Successful: {progress['fixes_successful']}")
        print(f"  Fixes Failed: {progress['fixes_failed']}")
        print(f"  Total Error Reduction: {progress['total_error_reduction']}%")
        print(f"  Success Rate Improvement: {progress['success_rate_improvement']}%")
        
        input("\nPress Enter to continue to next iteration (or Ctrl+C to stop)...")
        
    # Loop complete - generate final report
    generate_final_report(coordinator)
    
    print("\n\n")
    print("╔" + "═" * 78 + "╗")
    print("║ IMPROVEMENT LOOP COMPLETE" + " " * 52 + "║")
    print("╚" + "═" * 78 + "╝")
    
    print(f"\nFinal Report: final_improvement_report.md")
    print(f"Loop State: loop_state.json")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⊗ Loop interrupted by user")
        print("  State has been saved - you can resume later")
    except Exception as e:
        print(f"\n\n✗ Unexpected error: {e}")
        print("  State has been saved")
        raise
```

---

## PART 6: PROGRESS TRACKING AND REPORTING

### Final Report Generation

```python
def generate_final_report(coordinator):
    """
    Generate comprehensive final report
    """
    
    progress = coordinator.calculate_progress()
    
    report = f"""
# Plex Metadata Improvement - Final Report

**Generated**: {datetime.datetime.now().isoformat()}
**Total Iterations**: {coordinator.state['iteration']}
**Exit Condition**: {coordinator.state['exit_condition']}

## Executive Summary

This improvement loop ran for {coordinator.state['iteration']} iterations, attempting 
{len(coordinator.state['fixes_attempted'])} fixes with {len(coordinator.state['fixes_successful'])} 
successful implementations.

**Overall Improvement**:
- Total Error Reduction: {progress['total_error_reduction']}%
- Success Rate Improvement: {progress['success_rate_improvement']}%

## Baseline vs Final Metrics

| Metric | Baseline | Final | Change | % Change |
|--------|----------|-------|--------|----------|
| Total Searches | {coordinator.state['baseline_metrics']['total_search_ops']} | {coordinator.state['current_metrics']['total_search_ops']} | ... | ... |
| Title Failures | {coordinator.state['baseline_metrics']['title_failures']} | {coordinator.state['current_metrics']['title_failures']} | ... | ... |
| URL Errors | {coordinator.state['baseline_metrics']['url_errors']} | {coordinator.state['current_metrics']['url_errors']} | ... | ... |

## Iteration History

{generate_iteration_summary(coordinator)}

## Fixes Applied

### Successful Fixes ({len(coordinator.state['fixes_successful'])})

{generate_fix_list(coordinator.state['fixes_successful'], coordinator)}

### Failed Fixes ({len(coordinator.state['fixes_failed'])})

{generate_fix_list(coordinator.state['fixes_failed'], coordinator)}

## Recommendations for Future Improvements

{generate_recommendations(coordinator)}

## Conclusion

{generate_conclusion(coordinator)}
"""

    with open('final_improvement_report.md', 'w') as f:
        f.write(report)
        
    # Also save state as JSON
    with open('loop_state.json', 'w') as f:
        json.dump(coordinator.state, f, indent=2, default=str)
```

---

## PART 7: DELIVERABLES

### Loop Coordinator Outputs

1. **Loop State File** (`loop_state.json`)
   - Complete state for resumption
   - All iteration history
   - Metrics snapshots

2. **Final Report** (`final_improvement_report.md`)
   - Executive summary
   - Baseline vs final comparison
   - All fixes attempted
   - Recommendations

3. **Iteration Reports** (per iteration)
   - Aggregation results
   - Diagnostic findings
   - Implementation logs
   - Test results

4. **Decision Log** (`decision_log.json`)
   - All decisions made
   - Rationales
   - Audit trail

---

## PART 8: RESUMPTION CAPABILITY

### Saving and Resuming Loop State

```python
def save_loop_state(coordinator, reason):
    """Save loop state for later resumption"""
    state = {
        'saved_at': datetime.datetime.now().isoformat(),
        'reason': reason,
        'coordinator_state': coordinator.state,
        'resume_instructions': get_resume_instructions(coordinator, reason)
    }
    
    with open('loop_state_paused.json', 'w') as f:
        json.dump(state, f, indent=2, default=str)
        
    print(f"\n💾 Loop state saved: loop_state_paused.json")
    print(f"   Reason: {reason}")
    print(f"\nTo resume:")
    print(f"  python loop_coordinator.py --resume loop_state_paused.json")

def resume_loop(state_file):
    """Resume loop from saved state"""
    with open(state_file, 'r') as f:
        saved_state = json.load(f)
        
    coordinator = LoopCoordinator()
    coordinator.state = saved_state['coordinator_state']
    
    print(f"\n📂 Resuming loop from: {state_file}")
    print(f"   Saved at: {saved_state['saved_at']}")
    print(f"   Reason: {saved_state['reason']}")
    print(f"\n{saved_state['resume_instructions']}")
    
    return coordinator
```

---

## CONCLUSION

The Loop Coordinator orchestrates the entire improvement cycle, managing the flow between phases, tracking progress, and making decisions about when to continue and when to exit.

It ensures that:
1. Each phase executes in the correct order
2. Results from one phase feed into the next
3. Progress is tracked and plateau is detected
4. The loop exits gracefully when improvements plateau or goals are achieved
5. State can be saved and resumed as needed

This creates a complete, automated improvement system that iteratively enhances Plex metadata extraction until maximum achievable quality is reached.
