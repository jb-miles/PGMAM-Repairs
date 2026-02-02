# Plex Implementation & Testing System - Complete Guide

## Overview

You now have a complete, automated improvement system for your Plex metadata agents consisting of **THREE interconnected instruction sets** that work in a continuous loop.

## The Three Instruction Sets

### 1. Implementation Prompt (`plex_implementation_prompt.md`)

**Purpose**: Safely apply fixes from the diagnostic report

**Key Features**:
- Implements ONE fix at a time
- Creates automatic backups before changes
- States expected behavior before every change
- Handles Plex server restart (via API, launchctl, or manual)
- Performs immediate validation after each fix
- Maintains rollback capability

**Input**: Diagnostic report with prioritized fixes
**Output**: Implementation log, modified agent files, validation results

**Critical Safety Features**:
- Python 2.7 compatibility checks
- Syntax validation before file writes
- No sudo commands (user-level only)
- Comprehensive backup system
- Immediate error detection

### 2. Testing & Validation Prompt (`plex_testing_validation_prompt.md`)

**Purpose**: Objectively validate that fixes achieve expected results

**Key Features**:
- **ACTIVE TESTING**: Triggers metadata refreshes via Plex API (no waiting!)
- Identifies items that previously had errors
- Forces Plex to re-scrape metadata for those items via API
- Re-aggregates logs with fresh test data (30 min vs 24 hours)
- Compares before/after metrics
- Evaluates against success criteria from diagnostic report
- Makes objective keep/rollback/modify decisions
- Generates detailed test reports

**Innovation**: Instead of waiting 24+ hours for natural activity, we actively trigger metadata refreshes via Plex API and get results in ~30 minutes.

**Input**: Implementation results, baseline metrics
**Output**: Test report, decision (KEEP/ROLLBACK/MONITOR/MODIFY), recommendations

**Decision Framework**:
```
Success Rate ≥ 75% + No failures    → KEEP (proceed to next)
Success Rate 50-74% + No failures   → MONITOR (wait and retest)
Success Rate < 50% or failures      → ROLLBACK (try alternative)
```

### 3. Loop Coordinator Prompt (`plex_loop_coordinator_prompt.md`)

**Purpose**: Orchestrate the complete improvement cycle

**Key Features**:
- Manages the four-phase loop: Aggregate → Diagnose → Implement → Test
- Tracks progress across iterations
- Detects when improvements plateau
- Decides when to exit the loop
- Maintains complete audit trail

**Exit Conditions**:
1. All fixes attempted successfully
2. Progress plateaus (< 5% improvement for 2 iterations)
3. Maximum iterations reached (default: 10)
4. System regresses below baseline
5. User requests stop

## The Complete Workflow

```
START
  ↓
┌─────────────────────────────────────────────┐
│ ITERATION 1                                 │
├─────────────────────────────────────────────┤
│                                             │
│ Phase 1: LOG AGGREGATION (from Phase 1)    │
│   → Run aggregate_plex_logs.py              │
│   → Generate baseline_metrics.txt           │
│   → Identify error patterns                 │
│                                             │
│ Phase 2: DIAGNOSTICS (from Phase 2)        │
│   → Research errors with 5 tools            │
│   → Determine root causes                   │
│   → Propose prioritized fixes               │
│   → Generate diagnostic_report.md           │
│                                             │
│ Phase 3: IMPLEMENTATION (NEW)              │
│   → Select highest-priority fix             │
│   → State expected behavior                 │
│   → Create backup                           │
│   → Apply fix                               │
│   → Restart Plex                            │
│   → Immediate validation                    │
│                                             │
│ Phase 4: TESTING (NEW - Active!)              │
│   → Trigger metadata refreshes via Plex API    │
│   → Test 20 items that previously failed       │
│   → Wait 60 seconds for processing             │
│   → Re-aggregate logs (fresh test data)        │
│   → Compare before/after metrics            │
│   → Evaluate success criteria               │
│   → Decide: KEEP/ROLLBACK/MONITOR           │
│                                             │
│ DECISION POINT:                             │
│   If KEEP → Next fix (same iteration)       │
│   If ROLLBACK → Try alternative             │
│   If plateau detected → EXIT LOOP           │
│   Otherwise → ITERATION 2                   │
└─────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────┐
│ ITERATION 2                                 │
│   (Repeat with updated metrics)             │
└─────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────┐
│ ITERATION N                                 │
│   (Until exit condition met)                │
└─────────────────────────────────────────────┘
  ↓
END → Final Report
```

## How the Prompts Work Together

### Phase 3: Implementation

**From**: Loop coordinator hands diagnostic report to implementation script
**Process**:
1. Read diagnostic report
2. Select highest-priority unattempted fix
3. Display Expected vs Observed behavior
4. Ask user to confirm
5. Create timestamped backup
6. Apply code changes
7. Restart Plex (API/launchctl/manual)
8. Run immediate validation
9. Return results to loop coordinator

**Expected Behavior Display** (Critical Feature):
```
═══════════════════════════════════════════════
IMPLEMENTING: Enhanced Headers for IAFD
═══════════════════════════════════════════════

BEFORE IMPLEMENTATION:
  • requests.get(url) with Python default headers
  • IAFD returns 403 Forbidden (100% failure)
  • No metadata enrichment occurs

AFTER IMPLEMENTATION (EXPECTED):
  • requests.Session() with browser headers
  • IAFD returns 200 OK for 20-30% of requests
  • Successful metadata enrichment begins

SUCCESS CRITERIA:
  ✓ 403 errors reduced by ≥20%
  ✓ FoundOnIAFD appears in logs
  ✓ No new error types introduced

Proceed? (yes/no/skip): _
═══════════════════════════════════════════════
```

### Phase 4: Testing

**From**: Loop coordinator hands implementation results to testing script
**Process**:
1. Verify Plex restarted and plugin loaded successfully
2. Trigger active metadata refresh via Plex API on 20 test items
3. Wait 60 seconds for Plex to process refreshes
4. Re-run log aggregation on fresh logs (last hour)
5. Parse new metrics showing results of test refreshes
6. Compare to baseline metrics
7. Evaluate against success criteria from diagnostic report
8. Calculate success rate (% of criteria met)
9. Check for failure indicators (new errors, regressions)
10. Make decision: KEEP/ROLLBACK/MONITOR/MODIFY
11. Return decision to loop coordinator

**Active Testing Advantage**:
- No passive waiting - we **trigger** the test ourselves
- Tests the exact scenario that was failing before
- Immediate feedback (30 minutes vs 24 hours)
- Reproducible and controlled
- Can test multiple times if needed

**Expected Result Validation** (Critical Feature):
```
EXPECTED RESULT (from diagnostic report):
  • IAFD errors: 367 → 250 (32% reduction)
  • Success rate: 0% → 20-30%

ACTUAL RESULT (from metrics):
  • IAFD errors: 367 → 245 (33.2% reduction) ✓
  • Success rate: 0% → 24.5% ✓

DECISION: KEEP (met 100% of criteria)
```

### Loop Coordination

**Process**:
1. Track iteration number
2. Execute Phase 1 (aggregation)
3. Execute Phase 2 (diagnostics)
4. Execute Phase 3 (implementation) - one fix
5. Execute Phase 4 (testing)
6. Evaluate overall progress
7. Check exit conditions
8. If not exiting, goto step 2 (may skip diagnostics if more fixes pending)
9. Generate final report

**Progress Tracking**:
```
ITERATION 3 COMPLETE

Overall Progress:
  Fixes Attempted: 3
  Fixes Successful: 2
  Fixes Failed: 1
  
  Total Error Reduction: 42%
  Success Rate: 7.2% → 28.4% (+21.2%)
  
Last 2 Iterations Improvement: 15%, 8%
Status: Slowing progress, may plateau soon

Continue? (Enter/Ctrl+C): _
```

## Plex Server Restart Handling

One of the key challenges is restarting Plex without sudo. The implementation prompt includes **three methods**:

### Method 1: Launchctl (Preferred - No sudo)
```bash
launchctl unload ~/Library/LaunchAgents/com.plexapp.plexmediaserver.plist
sleep 5
launchctl load ~/Library/LaunchAgents/com.plexapp.plexmediaserver.plist
```

### Method 2: Plex API (May not support restart)
```python
# Check if restart endpoint available
# If not, fall back to manual
```

### Method 3: Manual (Always works)
```
Please restart Plex:
  1. Quit from menu bar icon
  2. Wait 10 seconds
  3. Reopen Plex
  
Press Enter when ready...
```

The implementation script tries methods in order and handles each gracefully.

## Key Differences from Original Phases

### What's New in Implementation

**Compared to original diagnostics**:
- Actually modifies code (diagnostics only recommends)
- Creates backups automatically
- Handles Plex restart
- States expected behavior BEFORE changes
- Validates immediately AFTER changes
- Works with actual files, not just analysis

**Safety guarantees**:
- Never writes without backup
- Validates Python syntax before writing
- Checks Python 2.7 compatibility
- Verifies no sudo commands in code
- Maintains rollback stack

### What's New in Testing

**Compared to diagnostics**:
- Uses ACTUAL metrics from re-aggregated logs
- Makes objective keep/rollback decisions
- Compares to baseline automatically
- Feeds results back to loop
- Triggers next action (next fix, re-diagnose, or exit)

**Objectivity guarantees**:
- Success criteria from diagnostic report (not subjective)
- Numeric thresholds (>75%, >50%, <50%)
- Failure indicators explicitly checked
- Decision matrix is deterministic

### What's New in Loop

**Never existed before**:
- Orchestrates all phases in sequence
- Tracks progress across iterations
- Detects plateau (< 5% improvement)
- Saves state for resumption
- Generates final comprehensive report
- Decides when to stop

## Expected Timeline

### For a Typical Improvement Session

**Iteration 1** (Initial): ~1-2 hours total
- Log aggregation: 5 minutes
- Diagnostics: 30-60 minutes (full analysis)
- Implementation: 15-30 minutes (one fix)
- Active testing: 30-45 minutes (trigger refreshes + re-aggregate)
- Decision: 10 minutes

**Iteration 2-5** (Refinement): ~45 minutes - 1.5 hours each
- Log aggregation: 5 minutes
- Diagnostics: 10-20 minutes (focused)
- Implementation: 15-30 minutes
- Active testing: 30-45 minutes
- Decision: 5-10 minutes

**Total for complete improvement cycle**: 3-8 hours (all in one session possible!)

**Key Improvement**: No more waiting 24-48 hours between fixes! Active testing via Plex API means you can test immediately after implementing each fix.

## Files Generated

### During Each Iteration

```
iteration_1/
├── aggregated_logs_iteration_1.txt          (Phase 1)
├── diagnostic_report_iteration_1.md         (Phase 2)
├── implementation_log.json                  (Phase 3)
├── implementation_report_fix_name.md        (Phase 3)
├── _BACKUPS/
│   ├── fix_name_20260201_120000/            (Phase 3)
│   │   └── [backed up files]
├── test_report_fix_name_iteration_1.md      (Phase 4)
└── testing_decisions.json                   (Phase 4)
```

### At Loop Completion

```
final_improvement_report.md                  (Loop coordinator)
loop_state.json                              (Loop coordinator)
decision_log.json                            (Loop coordinator)
```

## Critical Success Factors

### 1. Expected Behavior Documentation (Implementation)

EVERY fix must show:
- What happens now (current broken state)
- What should happen (expected fixed state)
- How to tell if it worked (success criteria)
- How to tell if it failed (failure indicators)

This prevents implementing fixes blind.

### 2. Expected Result Validation (Testing)

EVERY test must check:
- Actual metrics vs expected metrics
- Success indicators from diagnostic report
- Failure indicators from diagnostic report
- Objective pass/fail threshold (>75% = keep)

This prevents subjective "it feels better" decisions.

### 3. Plateau Detection (Loop)

The loop MUST exit when:
- 2 consecutive iterations < 5% improvement
- Or max iterations reached (10)
- Or all fixes attempted
- Or system regresses

This prevents infinite loops chasing diminishing returns.

## Usage Instructions

### Quick Start

1. **Phase 1-2**: Run existing prompts to get diagnostic report
```bash
python aggregate_plex_logs.py → aggregated_logs.txt
[Use diagnostic prompt to analyze] → diagnostic_report.md
```

2. **Phase 3-4-Loop**: Start loop coordinator
```bash
python loop_coordinator.py
```

The coordinator will:
- Read diagnostic report
- Implement first fix (with your confirmation)
- Wait for test period
- Evaluate results
- Repeat until done

### Advanced: Manual Phase Execution

If you prefer manual control:

```bash
# Phase 3: Implement one fix
python implement_fix.py --fix "Enhanced IAFD Headers" --diagnostic-report diagnostic_report.md

# Wait 2-4 hours

# Phase 4: Test the fix
python test_fix.py --fix "Enhanced IAFD Headers" --baseline aggregated_logs_baseline.txt

# Phase 1 again: Re-aggregate
python aggregate_plex_logs.py --output post_fix_logs.txt

# Decide manually whether to continue
```

### Resuming After Pause

If loop pauses (waiting for data):

```bash
# When ready (after wait period)
python loop_coordinator.py --resume loop_state_paused.json
```

## What Makes This System Complete

### It's Automated
- Runs phases in correct sequence
- Tracks state across iterations
- Makes objective decisions
- Exits automatically when done

### It's Safe
- Backups before every change
- Syntax validation
- Python 2.7 compatibility checks
- Easy rollback
- No sudo required

### It's Transparent
- States expectations before acting
- Shows actual results
- Compares objectively
- Documents everything
- Audit trail of all decisions

### It's Self-Limiting
- Detects plateau
- Respects maximum iterations
- Exits on regression
- Saves state for resumption

## Recommended Workflow

### Option A: Fully Automated (Recommended)

1. Run Phases 1-2 once manually to get baseline
2. Start loop coordinator
3. Let it run (with periodic check-ins for test wait periods)
4. Review final report

**Timeline**: 2-3 days (mostly waiting for test data)

### Option B: Semi-Automated

1. Run Phase 1 (aggregation)
2. Run Phase 2 (diagnostics)
3. Run Phase 3 (implementation) for ONE fix
4. Wait 24 hours
5. Run Phase 4 (testing)
6. Based on results, goto step 3 (next fix) or step 1 (re-aggregate)

**Timeline**: 1-2 weeks (more manual control)

### Option C: One-Fix-At-A-Time

Use individual scripts:
1. aggregate_plex_logs.py
2. diagnose (via prompt)
3. implement_fix.py --fix "specific fix"
4. Wait
5. test_fix.py --fix "specific fix"
6. Manually decide next action

**Timeline**: Variable, requires most manual effort

## Summary

You now have a **complete, self-contained improvement system** that:

1. ✅ Implements fixes safely (Phase 3)
2. ✅ Tests fixes objectively (Phase 4)  
3. ✅ Loops until improvement plateaus (Loop)
4. ✅ Handles Plex restarts (no sudo needed)
5. ✅ States expected behavior before every change
6. ✅ Validates expected results after every change
7. ✅ Exits automatically when done
8. ✅ Documents everything comprehensively

All three prompts work together to create a professional, production-quality automated improvement pipeline for your Plex metadata system.
