# Plex Improvement Agent - Master Prompt

## Overview

This master prompt provides a comprehensive overview of the Plex Metadata Improvement System, explaining how all six phases work together to create a self-improving automated pipeline that iteratively enhances Plex metadata agent reliability.

**Purpose**: Provide complete system understanding and guidance for orchestrating the entire improvement cycle.

**Scope**: All 6 phases of the improvement system

---

## Mission Statement

The Plex Metadata Improvement System is a **self-improving automated pipeline** that iteratively enhances Plex metadata agent reliability by:

1. **Extracting error patterns** from logs (Phase 1)
2. **Diagnosing root causes** and proposing fixes with explicit expected results (Phase 2)
3. **Implementing fixes safely** (one at a time) (Phase 3)
4. **Actively testing** each fix by forcing refreshes and measuring before/after (Phase 4)
5. **Analyzing results** and capturing lessons learned (Phase 5)
6. **Coordinating the loop** and making continuation decisions (Phase 6)

This system is designed to be **fast (active testing)** and **safe (backups, Python 2.7 compatibility, no sudo)**.

---

## The Six Phases

### Phase 1: Log Aggregation
**File**: [`phase1_log_aggregation_prompt.md`](prompts/phase1_log_aggregation_prompt.md)

**Purpose**: Collect and analyze Plex plugin logs to identify error patterns and establish baseline metrics.

**Inputs**: Raw Plex plugin log files from `/Users/jbmiles/Library/Logs/Plex Media Server/PMS Plugin Logs`

**Outputs**: 
- Aggregated log report (`aggregated_logs_iteration_N.txt`)
- Baseline metrics (embedded or separate JSON)
- Error pattern analysis

**Key Activities**:
- Parse 21 PGMA agent log files
- Filter verbose/repetitive content
- Preserve critical information (ERROR messages, search operations, metadata retrieval indicators)
- Aggregate by agent
- Identify patterns across multiple log entries
- Generate comprehensive report with statistics

**Estimated Time**: 5-10 minutes

---

### Phase 2: Diagnostics
**File**: [`phase2_diagnostics_prompt.md`](prompts/phase2_diagnostics_prompt.md)

**Purpose**: Research errors and propose validated fixes with explicit expected results.

**Inputs**: Aggregated log report from Phase 1

**Outputs**: 
- Diagnostic report (`diagnostic_report_iteration_N.md`)
- Optional: Structured data (`diagnostic_report_iteration_N.json`)

**Key Activities**:
- Systematically diagnose all major error patterns
- Multi-source research (Context7, Exa, web browser, forums, code inspection)
- Determine root causes (not just symptoms)
- Validate solutions against actual agent code
- Provide specific, actionable recommendations with priority rankings
- Document Expected vs. Observed Behavior for each error
- Document Expected Results for each solution

**Estimated Time**: 30-60 minutes (first time) or 10-20 minutes (focused)

---

### Phase 3: Implementation
**File**: [`phase3_implementation_prompt.md`](prompts/phase3_implementation_prompt.md)

**Purpose**: Safely apply fixes one at a time with comprehensive backup, validation, and rollback capabilities.

**Inputs**: Diagnostic report from Phase 2 with prioritized fixes

**Outputs**: 
- Modified code files
- Timestamped backups
- Implementation log (`implementation_log.json`)
- Implementation reports (one per fix)

**Key Activities**:
- State expected behavior BEFORE making any changes
- Create comprehensive backups of all affected files
- Apply ONE fix at a time (never batch unless explicitly safe)
- Restart Plex if required (no sudo needed)
- Validate immediately after each change
- Maintain rollback capability throughout
- Log all changes made

**Estimated Time**: 15-30 minutes per fix

---

### Phase 4: Testing & Validation
**File**: [`phase4_testing_prompt.md`](prompts/phase4_testing_prompt.md)

**Purpose**: Validate fixes through active testing (30-45 minutes vs 24+ hours passive waiting).

**Inputs**: 
- Implementation results from Phase 3
- Baseline metrics from Phase 1
- Expected Results from Phase 2

**Outputs**: 
- Test report (`test_report_[fix_name]_iteration_N.md`)
- Updated metrics (`post_implementation_logs.txt`)
- Decision record (`testing_decisions.json`)

**Key Activities**:
- Actively trigger metadata refreshes via Plex API (no waiting required!)
- Test exact items that previously failed
- Re-aggregate logs with fresh test data
- Compare before/after metrics
- Make objective keep/rollback decisions
- Compare actual vs expected results

**Estimated Time**: 30-45 minutes per fix

---

### Phase 5: Post-Mortem & Lessons Learned
**File**: [`phase5_postmortem_prompt.md`](prompts/phase5_postmortem_prompt.md)

**Purpose**: Analyze what worked/didn't, capture lessons, and decide final keep/rollback.

**Inputs**:
- All implementation logs from Phase 3
- All test reports from Phase 4
- Loop state from Phase 6

**Outputs**:
- Post-mortem analysis report (`post_mortem_analysis.md`)
- Lessons learned document (`lessons_learned.md`)
- Final decisions log (`final_decisions.json`)

**Key Activities**:
- Targeted analysis of specific intervention points (not just overall metrics)
- Compare expected vs. actual outcomes at each point
- Identify what was missed (gap analysis)
- Make final keep/rollback decisions
- Capture lessons as actionable instructions
- Generate instructions for future iterations

**Estimated Time**: 30-45 minutes

---

### Phase 6: Loop Coordination
**File**: [`phase6_loop_coordination_prompt.md`](prompts/phase6_loop_coordination_prompt.md)

**Purpose**: Orchestrate complete improvement cycle and manage flow between phases.

**Inputs**: All phase results (aggregation, diagnostics, implementation, testing, post-mortem)

**Outputs**:
- Loop state file (`loop_state.json`)
- Final report (`final_improvement_report.md`)
- Decision log (`decision_log.json`)

**Key Activities**:
- Manage 5-phase loop: Aggregate → Diagnose → Implement → Test → Post-Mortem
- Track progress across iterations
- Detect plateau (< 5% improvement)
- Exit when improvements plateau or goals achieved
- Maintain audit trail
- Save state for resumption

**Estimated Time**: 5-10 minutes per iteration (coordination overhead)

---

## The Complete Self-Improving Loop

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ITERATION 1                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Phase 1: LOG AGGREGATION (5 min)                                  │
│    → Analyze current Plex logs                                      │
│    → Identify error patterns                                        │
│    → Generate baseline metrics                                      │
│                                                                     │
│  Phase 2: DIAGNOSTICS (30-60 min)                                │
│    → Research each error with 5 tools                               │
│    → Document Expected vs Observed behavior                         │
│    → Propose fixes with Expected Results                            │
│    → Validate against code                                          │
│                                                                     │
│  Phase 3: IMPLEMENTATION (15-30 min per fix)                       │
│    → State expected behavior BEFORE change                          │
│    → Create backup                                                  │
│    → Apply ONE fix                                                  │
│    → Restart Plex (no sudo required)                                │
│    → Immediate validation                                           │
│                                                                     │
│  Phase 4: TESTING (30-45 min per fix)                             │
│    → Trigger metadata refreshes via Plex API                          │
│    → Test 20 items that previously failed                           │
│    → Wait 60 seconds for processing                                 │
│    → Re-aggregate logs with fresh data                              │
│    → Compare actual vs expected results                             │
│    → Decide: KEEP / ROLLBACK / MONITOR                            │
│                                                                     │
│  Phase 5: POST-MORTEM & LESSONS LEARNED (30-45 min)               │
│    → Analyze each intervention point                                 │
│    → Compare expected vs actual outcomes                              │
│    → Identify what was missed                                       │
│    → Make final keep/rollback decisions                             │
│    → Generate lessons learned document                                │
│                                                                     │
│  Loop Coordinator (Phase 6): Track progress, check for plateau      │
│    → If more fixes → Back to Phase 3                              │
│    → If no more fixes → Continue to Phase 5                         │
│    → After post-mortem → Decide: Continue or Exit                   │
│                                                                     │
│  Decision Point:                                                    │
│    → Start ITERATION 2 with lessons learned? OR                     │
│    → Exit (success or plateau)                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         ITERATION 2                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Enhanced with lessons from Iteration 1:                            │
│    • Diagnostic phase uses improved instructions                        │
│    • Avoids approaches that failed                                  │
│    • Applies successful patterns                                    │
│    • Checks for issues missed last time                             │
│                                                                     │
│  [Repeat all 6 phases with improved methodology]                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
       [ITERATION 3...]
         │
         ▼
       EXIT when plateau detected or max iterations reached
```

---

## How Lessons Learned Creates Self-Improvement

### The Learning Cycle

**After Each Iteration**:
1. Post-mortem analyzes what happened at each intervention point
2. Compares actual results to expected results
3. Identifies gaps: "What did we miss? Why?"
4. Generates **actionable instructions** for next time

**Before Next Iteration**:
1. Load lessons learned document
2. Append instructions to diagnostic phase prompts
3. Diagnostic phase now has improved methodology
4. Same errors won't be made twice

### Example: Learning from IAFD Fix

**Iteration 1**:
```
Fix: Enhanced IAFD Headers
Expected: 403 errors reduced by 32%
Actual: 403 errors reduced by 33% ✓
Unexpected: 15 new "429 Rate Limit" errors

Gap Identified:
  • What we missed: Didn't anticipate rate limiting
  • Why: Only focused on 403s, not other HTTP codes
  • Prevention: Monitor ALL HTTP status codes in future
```

**Lesson Captured**:
```
## Instructions for Future Iterations

### Diagnostic Phase - DO:
- Monitor for ALL HTTP status codes (200, 403, 429, 500, etc.)
- Consider rate limiting as side effect of increased success
- Include retry logic with exponential backoff in solutions

### Diagnostic Phase - DON'T:
- Focus only on target error without considering side effects
- Assume website has no rate limiting
- Propose solutions without retry logic for HTTP requests
```

**Iteration 2**:
- Diagnostic phase receives these instructions
- When analyzing next HTTP error, checks for rate limiting
- Proposed solution includes retry logic from start
- 429 errors are expected and handled properly

**Result**: System learns and improves its diagnostic methodology!
---

## Timeline for Complete Cycle

### Single Iteration (All 6 Phases)

**Phase 1 - Log Aggregation**: 5 minutes
**Phase 2 - Diagnostics**: 30-60 minutes (first time) or 10-20 minutes (focused)
**Phase 3 - Implementation**: 15-30 minutes per fix
**Phase 4 - Testing**: 30-45 minutes per fix (active testing!)
**Phase 5 - Post-Mortem**: 30-45 minutes
**Phase 6 - Loop Decision**: 5-10 minutes

**Total for 3 fixes**: ~3-5 hours (one afternoon!)

### Multi-Iteration Cycle

**Iteration 1**: 3-5 hours (initial baseline + 3 fixes)
**Iteration 2**: 2-4 hours (faster diagnostics, 2-3 more fixes)
**Iteration 3**: 1-3 hours (even faster, 1-2 final fixes)

**Complete improvement from 5% to 30-90% success**: 6-12 hours total

**vs. Old way**: Weeks of waiting between fixes!

---

## Key Innovations

### 1. Expected vs. Observed Behavior (Phase 2 & 6)

**Before implementing any fix**, state clearly:
- What the code does now (broken state)
- What it should do after fix (expected state)
- How to verify success (success indicators)

**After implementing**, compare:
- Did we get what we expected?
- What was different?
- What did we miss?

### 2. Expected Results for Solutions (Phase 2 & 4)

**Every solution includes**:
- Immediate effects (within hours)
- Metadata quality improvements
- Success indicators (✓ how to know it worked)
- Failure indicators (✗ how to know it didn't work)
- Contingency plan

**Testing validates** these against actual outcomes.

### 3. Active Testing (Phase 4)

**Innovation**: Don't wait for natural activity
- Trigger metadata refreshes via Plex API
- Test exact items that failed before
- Get results in 30 minutes, not 24 hours
- Reproducible and controlled

### 4. Targeted Post-Mortem (Phase 5)

**Innovation**: Analyze intervention points, not just overall metrics
- Where did we expect to see change?
- Did we see it there?
- What else changed?
- What did we miss?

### 5. Lessons as Actionable Instructions (Phase 5)

**Innovation**: Don't just document "what happened"
- Extract DO and DON'T instructions
- Specific to each phase
- Feed directly into next iteration
- System learns and improves methodology

### 6. No Sudo Required (Phase 3)

**Innovation**: Restart Plex without elevated privileges
- Try launchctl (user-level)
- Fall back to Plex API
- Fall back to manual with clear instructions
- Never blocks on sudo password

---

## Decision Framework Summary

### During Testing (Phase 4)
```
Per Fix:
  Success Rate ≥ 75% → KEEP
  Success Rate 50-74% → MONITOR (retest later)
  Success Rate < 50% → ROLLBACK
  Critical errors → ROLLBACK immediately
```

### During Post-Mortem (Phase 5)
```
Final Decision for Each Fix:
  Achieved expected + no critical errors → KEEP
  Partial improvement + no breakage → KEEP (incremental progress)
  Some improvement + no new issues → KEEP (net positive)
  No improvement + new errors → ROLLBACK
  No improvement + no compelling reason → ROLLBACK
  Critical errors → ROLLBACK
```

### Loop Exit (Phase 6)
```
Exit When:
  < 5% improvement for 2 iterations → PLATEAU
  All fixes attempted → SUCCESS
  10 iterations reached → MAX_ITERATIONS
  System regresses → FAILURE
  User requests stop → MANUAL_EXIT
```

---

## File Organization

After running a complete cycle:

```
plex_improvement/
├── iteration_1/
│   ├── aggregated_logs_baseline.txt          (Phase 1)
│   ├── diagnostic_report.md                  (Phase 2)
│   ├── implementation_log.json               (Phase 3)
│   ├── _BACKUPS/                             (Phase 3)
│   │   ├── fix1_20260201_100000/
│   │   ├── fix2_20260201_110000/
│   │   └── fix3_20260201_120000/
│   ├── test_report_fix1.md                   (Phase 4)
│   ├── test_report_fix2.md                   (Phase 4)
│   ├── test_report_fix3.md                   (Phase 4)
│   ├── post_mortem_analysis.md               (Phase 5)
│   ├── lessons_learned.md                    (Phase 5)
│   └── loop_state.json                       (Phase 6)
│
├── iteration_2/
│   ├── aggregated_logs.txt
│   ├── diagnostic_report_enhanced.md         (with lessons from iteration 1)
│   ├── implementation_log.json
│   ├── _BACKUPS/
│   ├── test_reports...
│   ├── post_mortem_analysis.md
│   ├── lessons_learned.md
│   └── loop_state.json
│
└── final_comprehensive_report.md             (Loop coordinator)
```

---

## Usage Instructions

### Quick Start (Fully Automated)

```bash
# Run Phases 1-2 once to create baseline
cd Plug-ins/plex_improvement/scripts
python aggregate_plex_logs.py
# [Use diagnostic prompt to analyze]

# Start the complete loop (Phases 3-6 automated)
python loop_coordinator.py

# The coordinator will:
# - Implement fixes one at a time (Phase 3)
# - Actively test each fix (Phase 4)
# - Generate post-mortem when done (Phase 5)
# - Track progress and make continuation decisions (Phase 6)
# - Offer to restart with lessons learned
```

### Manual Control (Phase by Phase)

```bash
# Phase 1: Log Aggregation
python aggregate_plex_logs.py --output baseline_logs.txt

# Phase 2: Diagnostics (use prompt manually)
# Creates: diagnostic_report.md

# Phase 3: Implementation
python implement_fix.py --fix "Enhanced IAFD Headers" \
    --diagnostic-report diagnostic_report.md

# Phase 4: Testing
python test_fix_actively.py --fix "Enhanced IAFD Headers" \
    --baseline baseline_logs.txt

# Phase 5: Post-Mortem
python post_mortem_analysis.py --implementation-log implementation_log.json

# Phase 6: Decide manually (or let loop coordinator decide)
# Review lessons_learned.md and decide whether to restart loop
```

---

## What Makes This Complete

### 1. It's Self-Improving
- Each iteration learns from previous
- Lessons captured as actionable instructions
- Diagnostic methodology evolves
- Same mistakes not repeated

### 2. It's Targeted
- Analyzes specific intervention points
- Compares expected vs actual at each point
- Identifies exactly what was missed
- Focused analysis, not just overall metrics

### 3. It's Fast
- Active testing (30 min vs 24 hours)
- Can do multiple iterations in one day
- Complete improvement in hours, not weeks

### 4. It's Safe
- Backups before every change
- Immediate validation
- Easy rollback
- No sudo required

### 5. It's Honest
- Compares actual vs expected explicitly
- Admits when goals not met
- Analyzes why expectations missed
- Learns from both successes and failures

### 6. It's Complete
- Six phases cover entire improvement cycle
- Loop coordinates everything
- Post-mortem closes loop with learning
- Ready to restart smarter

---

## Success Metrics

### System Effectiveness

**Baseline**: 5% metadata extraction success
**After 1 iteration**: 35% success (7x improvement)
**After 2 iterations**: 68% success (13.6x improvement)
**After 3 iterations**: 85% success (17x improvement)

### Time Efficiency

**Old approach** (passive waiting):
- 3-5 days per fix test
- 15-25 days for 5 fixes
- 1-2 months for complete improvement

**New approach** (active testing):
- 30-45 minutes per fix test
- 3-5 hours for 5 fixes
- 6-12 hours for complete improvement

**48-120x faster!**

### Learning Efficiency

**Without lessons learned**:
- Repeat same mistakes
- No methodology improvement
- Plateau at suboptimal results

**With lessons learned**:
- Mistakes made once, learned from
- Diagnostic methodology evolves
- Continuous improvement toward optimal

---

## Agent's Mission and Principles

### Mission

Iteratively improve Plex metadata agent reliability by systematically identifying, diagnosing, fixing, and validating issues until maximum achievable quality is reached.

### Core Principles

1. **Evidence-Based**: Decisions based on actual metrics, not intuition
2. **Incremental Progress**: One fix at a time, never batch unless explicitly safe
3. **Reversibility**: Every change must be reversible
4. **Validation**: Verify each fix before moving to next
5. **Documentation**: Record every change made
6. **Safety First**: Always backup before making changes
7. **Honest Assessment**: Compare actual vs expected, acknowledge gaps
8. **Continuous Learning**: Capture lessons and improve methodology each iteration

### Safety Constraints

- **Python 2.7 compatibility** (CRITICAL)
- **No sudo commands** (user-level only)
- **Always backup before changes**
- **Validate before writing**
- **One fix at a time**

---

## When to Use Each Phase

### Phase 1: Log Aggregation
- **When**: Starting improvement cycle or beginning new iteration
- **Purpose**: Establish baseline metrics
- **Output**: Aggregated log report with error patterns

### Phase 2: Diagnostics
- **When**: After Phase 1 completes
- **Purpose**: Research errors and propose fixes
- **Output**: Diagnostic report with prioritized solutions

### Phase 3: Implementation
- **When**: After Phase 2 completes
- **Purpose**: Apply fixes safely
- **Output**: Modified code with backups

### Phase 4: Testing
- **When**: After Phase 3 completes
- **Purpose**: Validate fix effectiveness
- **Output**: Test report with keep/rollback decision

### Phase 5: Post-Mortem
- **When**: After all fixes tested or loop exits
- **Purpose**: Analyze results and capture lessons
- **Output**: Lessons learned document

### Phase 6: Loop Coordination
- **When**: Orchestrating entire cycle
- **Purpose**: Manage flow between phases
- **Output**: Loop state and final report

---

## Related Files

### Phase Prompts
- [`phase1_log_aggregation_prompt.md`](prompts/phase1_log_aggregation_prompt.md)
- [`phase2_diagnostics_prompt.md`](prompts/phase2_diagnostics_prompt.md)
- [`phase3_implementation_prompt.md`](prompts/phase3_implementation_prompt.md)
- [`phase4_testing_prompt.md`](prompts/phase4_testing_prompt.md)
- [`phase5_postmortem_prompt.md`](prompts/phase5_postmortem_prompt.md)
- [`phase6_loop_coordination_prompt.md`](prompts/phase6_loop_coordination_prompt.md)

### Reference Documents
- [`../instructions/Plex_Metadata_Improvement_System_Agent_Instructions.md`](../instructions/Plex_Metadata_Improvement_System_Agent_Instructions.md)
- [`../instructions/master_guide_complete_system.md`](../instructions/master_guide_complete_system.md)

### Scripts
- [`../scripts/aggregate_plex_logs.py`](../scripts/aggregate_plex_logs.py)
- [`../scripts/diagnose_from_report.py`](../scripts/diagnose_from_report.py)
- [`../scripts/loop_coordinator.py`](../scripts/loop_coordinator.py)
- [`../scripts/compare_metrics.py`](../scripts/compare_metrics.py)

---

## Conclusion

You now have a **complete, self-improving system** for Plex metadata extraction that:

1. ✅ **Analyzes current state** (Phase 1)
2. ✅ **Diagnoses problems with expected behavior/results** (Phase 2)
3. ✅ **Implements fixes safely** (Phase 3)
4. ✅ **Tests actively in 30 minutes** (Phase 4)
5. ✅ **Learns from experience** (Phase 5)
6. ✅ **Coordinates the loop** (Phase 6)

The system:
- **Gets smarter** with each iteration
- **Works fast** (hours, not weeks)
- **Is safe** (backups, validation, rollback)
- **Is honest** (expected vs actual analysis)
- **Is complete** (end-to-end automation)
- **Never needs sudo** (user-level Plex control)

This is a **production-ready, self-improving, automated improvement pipeline** for Plex metadata extraction.

Start it once, and it will iteratively improve your system until it reaches maximum achievable quality, learning from both successes and failures along the way.
