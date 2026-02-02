# Plex Metadata Improvement System - Code Requirements

**Generated**: 2026-02-01
**Purpose**: Identify which tasks require code automation vs. manual human work

---

## Executive Summary

The Plex Metadata Improvement System is designed as a **prompt-guided workflow** where human coders follow detailed prompts through each phase. Code should support, not replace, human judgment and analysis.

**Key Principle**: Focus on essential code that makes repetitive, error-prone tasks easier. Don't over-automate tasks that require human judgment.

---

## Phase-by-Phase Analysis

### Phase 1: Log Aggregation

**Purpose**: Collect and analyze Plex plugin logs to identify error patterns and establish baseline metrics.

**Tasks**:
1. Read and parse log files from Plex plugin logs directory
2. Filter and consolidate logs by removing verbose/repetitive content
3. Preserve critical information (ERROR messages, search operations, metadata retrieval indicators)
4. Aggregate by agent (each plugin has its own log file)
5. Identify patterns across multiple log entries
6. Generate comprehensive report with statistics and examples

**Code Requirements**:

| Task | Code Need | Priority | Rationale |
|------|-----------|----------|-----------|
| Read/parse log files | **ESSENTIAL** | HIGH | Repetitive file I/O, pattern matching |
| Filter verbose content | **ESSENTIAL** | HIGH | Regex-based filtering, error-prone manually |
| Aggregate by agent | **ESSENTIAL** | HIGH | Data aggregation, statistics calculation |
| Identify patterns | **ESSENTIAL** | HIGH | Pattern matching, counting, categorization |
| Generate report | **ESSENTIAL** | HIGH | Formatting, statistics display |

**Existing Script**: `aggregate_plex_logs.py` (504 lines)
- **Status**: ✅ Well-implemented, comprehensive
- **Recommendation**: KEEP - This script is essential and well-written

**Manual Work**: None - All tasks are automated by the script

---

### Phase 2: Diagnostics

**Purpose**: Research errors and propose validated fixes with explicit expected results.

**Tasks**:
1. Analyze error patterns from aggregated log
2. Document Expected vs. Observed behavior for each error
3. Multi-source research (Context7, Exa, web browsing, forums)
4. Determine root causes (not just symptoms)
5. Validate solutions against actual agent code
6. Provide specific, actionable recommendations with priority rankings

**Code Requirements**:

| Task | Code Need | Priority | Rationale |
|------|-----------|----------|-----------|
| Analyze error patterns | HELPFUL | MEDIUM | Can categorize and count errors |
| Document Expected vs. Observed | **MANUAL** | N/A | Requires human analysis and judgment |
| Multi-source research | **MANUAL** | N/A | Requires human judgment, web browsing, Context7/Exa queries |
| Determine root causes | **MANUAL** | N/A | Requires human analysis and synthesis |
| Validate solutions against code | **MANUAL** | N/A | Requires human code inspection and validation |
| Provide recommendations | **MANUAL** | N/A | Requires human judgment and prioritization |

**Existing Script**: `diagnose_from_report.py` (1196 lines)
- **Status**: ⚠️ Over-engineered
- **Assessment**: This script provides a framework for diagnostics but the actual diagnostic work (research, root cause analysis, Expected vs. Observed behavior documentation) requires human judgment. The script is very complex and may be doing too much.

**Recommendation**: SIMPLIFY - Keep the error categorization and pattern analysis, but remove the automated research and solution generation. These should be done manually by the human coder following the prompt.

**Manual Work**: 
- Expected vs. Observed behavior analysis
- Multi-source research (Context7, Exa, web browsing)
- Root cause determination
- Solution validation against actual code
- Recommendation prioritization

---

### Phase 3: Implementation

**Purpose**: Safely apply fixes one at a time with comprehensive backup, validation, and rollback capabilities.

**Tasks**:
1. State expected behavior BEFORE making any changes
2. Create comprehensive backups of all affected files
3. Apply ONE fix at a time (never batch unless explicitly safe)
4. Restart Plex if required (no sudo needed)
5. Validate immediately after each change
6. Maintain rollback capability throughout

**Code Requirements**:

| Task | Code Need | Priority | Rationale |
|------|-----------|----------|-----------|
| State expected behavior | **MANUAL** | N/A | Requires human documentation |
| Create comprehensive backups | **ESSENTIAL** | HIGH | Repetitive, error-prone manually |
| Apply ONE fix at a time | **MANUAL** | N/A | Requires human judgment and code editing |
| Restart Plex | **MANUAL** | N/A | Simple manual operation |
| Validate immediately | **MANUAL** | N/A | Requires human verification |
| Maintain rollback capability | **ESSENTIAL** | HIGH | Critical for safety |

**Existing Scripts**: None specifically for implementation
- **Assessment**: Need utility scripts for backup/restore and safety validation

**Recommendation**: CREATE - Write simple utility scripts for:
1. Backup creation and restoration
2. Safety validation (Python 2.7 syntax check, no sudo commands)
3. Rollback functionality

**Manual Work**:
- Stating expected behavior
- Applying code changes
- Restarting Plex
- Validating results

---

### Phase 4: Testing & Validation

**Purpose**: Validate fixes through active testing (30-45 minutes vs 24+ hours passive waiting).

**Tasks**:
1. Get Plex API token (auto-detect or manual)
2. Get library sections
3. Get library items
4. Trigger metadata refresh for specific items
5. Re-aggregate logs with fresh test data
6. Compare before/after metrics
7. Evaluate against expected results
8. Make keep/rollback decision

**Code Requirements**:

| Task | Code Need | Priority | Rationale |
|------|-----------|----------|-----------|
| Get Plex API token | **ESSENTIAL** | HIGH | Auto-detection saves time |
| Get library sections | **ESSENTIAL** | HIGH | API interaction, error-prone manually |
| Get library items | **ESSENTIAL** | HIGH | API interaction, error-prone manually |
| Trigger metadata refresh | **ESSENTIAL** | HIGH | API interaction, enables active testing |
| Re-aggregate logs | **ESSENTIAL** | HIGH | Already handled by aggregate_plex_logs.py |
| Compare before/after metrics | **ESSENTIAL** | HIGH | Statistical comparison, error-prone manually |
| Evaluate against expected results | **MANUAL** | N/A | Requires human judgment |
| Make keep/rollback decision | **MANUAL** | N/A | Requires human judgment |

**Existing Scripts**:
- `compare_metrics.py` (652 lines) - ✅ Well-implemented, comprehensive
- `aggregate_plex_logs.py` (504 lines) - ✅ Well-implemented, comprehensive

**Recommendation**: 
- KEEP `compare_metrics.py` - Essential for metric comparison
- KEEP `aggregate_plex_logs.py` - Essential for log aggregation
- CREATE utility script for Plex API interaction (token detection, library access, metadata refresh)

**Manual Work**:
- Evaluating against expected results
- Making keep/rollback decisions

---

### Phase 5: Post-Mortem & Lessons Learned

**Purpose**: Analyze what worked/didn't, capture lessons, and decide final keep/rollback.

**Tasks**:
1. Targeted analysis of specific intervention points
2. Honest assessment - Did we get what we expected?
3. Root cause learning - What did we miss? Why?
4. Forward-looking - How to avoid missing critical info next time?
5. Decisive action - Keep only what provides value; rollback rest
6. Knowledge capture - Document lessons as actionable instructions

**Code Requirements**:

| Task | Code Need | Priority | Rationale |
|------|-----------|----------|-----------|
| Targeted analysis of intervention points | **MANUAL** | N/A | Requires human analysis |
| Honest assessment (expected vs actual) | **MANUAL** | N/A | Requires human judgment |
| Root cause learning | **MANUAL** | N/A | Requires human analysis |
| Forward-looking improvements | **MANUAL** | N/A | Requires human judgment |
| Decisive action (keep/rollback) | **MANUAL** | N/A | Requires human decision |
| Knowledge capture | **MANUAL** | N/A | Requires human documentation |

**Existing Scripts**: None specifically for post-mortem
- **Assessment**: This is primarily analytical work requiring human judgment

**Recommendation**: NO CODE NEEDED - All tasks are manual analysis and documentation

**Manual Work**: All tasks require human judgment and analysis

---

### Phase 6: Loop Coordination

**Purpose**: Orchestrate the complete improvement cycle and manage flow between phases.

**Tasks**:
1. Manage flow between all 6 phases (1→2→3→4→5→6)
2. Track progress across iterations
3. Detect plateau when improvements stall
4. Make decisions about continuing or exiting
5. Maintain audit trail of all actions
6. Save state for resumption capability

**Code Requirements**:

| Task | Code Need | Priority | Rationale |
|------|-----------|----------|-----------|
| Manage flow between phases | **MANUAL** | N/A | Human should follow prompts sequentially |
| Track progress across iterations | **MANUAL** | N/A | Human can track manually or use simple state file |
| Detect plateau | **MANUAL** | N/A | Human judgment based on results |
| Make decisions about continuing | **MANUAL** | N/A | Human decision based on results |
| Maintain audit trail | **MANUAL** | N/A | Human can document manually |
| Save state for resumption | **HELPFUL** | LOW | Simple JSON save/load for convenience |

**Existing Script**: `loop_coordinator.py` (1085 lines)
- **Status**: ⚠️ Over-engineered
- **Assessment**: This script is very complex and attempts to automate the entire loop. However, the prompts are designed to guide a human coder through each phase sequentially. The human should follow the prompts, not have an automated loop coordinator.

**Recommendation**: SIMPLIFY or REMOVE - The loop coordination should be manual. The human coder follows the prompts through each phase. A simple state file save/load utility would be helpful for resumption, but a full automated loop coordinator is over-engineering.

**Manual Work**: All tasks require human judgment and decision-making

---

## Summary of Code Needs

### Essential Scripts (Keep)

| Script | Purpose | Lines | Status |
|--------|---------|-------|--------|
| `aggregate_plex_logs.py` | Log aggregation and analysis | 504 | ✅ Well-implemented |
| `compare_metrics.py` | Metric comparison and evaluation | 652 | ✅ Well-implemented |

### Over-Engineered Scripts (Simplify)

| Script | Current Lines | Recommended Action | Rationale |
|--------|---------------|---------------------|-----------|
| `diagnose_from_report.py` | 1196 | Simplify to ~300 lines | Keep error categorization, remove automated research/solution generation |
| `loop_coordinator.py` | 1085 | Simplify to ~100 lines or remove | Keep only state file save/load, remove automated loop logic |

### New Scripts Needed

| Script | Purpose | Priority | Estimated Lines |
|--------|---------|----------|-----------------|
| `backup_utils.py` | Backup creation and restoration | HIGH | ~150 |
| `plex_api_utils.py` | Plex API token detection, library access, metadata refresh | HIGH | ~200 |
| `state_manager.py` | Simple JSON state file save/load | LOW | ~100 |
| `safety_validator.py` | Python 2.7 syntax check, no sudo validation | MEDIUM | ~100 |

---

## Code vs. Manual Work Breakdown

### Tasks Requiring Code Automation (Essential)

1. **Log file parsing and aggregation** - Repetitive, error-prone manually
2. **Pattern matching and categorization** - Regex-based, error-prone manually
3. **Statistical calculations** - Error-prone manually
4. **Report generation** - Formatting, error-prone manually
5. **Metric comparison** - Statistical analysis, error-prone manually
6. **Backup creation and restoration** - Critical for safety, error-prone manually
7. **Plex API interaction** - API calls, error-prone manually
8. **Active testing (metadata refresh)** - API calls, error-prone manually
9. **Safety validation** - Syntax checking, error-prone manually

### Tasks Requiring Human Judgment (Manual)

1. **Expected vs. Observed behavior analysis** - Requires understanding of system behavior
2. **Multi-source research** - Requires judgment, synthesis of information
3. **Root cause determination** - Requires analysis and synthesis
4. **Solution validation against code** - Requires code inspection and understanding
5. **Recommendation prioritization** - Requires judgment and experience
6. **Code changes implementation** - Requires understanding and care
7. **Validation of results** - Requires human verification
8. **Keep/rollback decisions** - Requires judgment based on results
9. **Post-mortem analysis** - Requires reflection and learning
10. **Loop coordination decisions** - Requires judgment based on progress

---

## Prioritization of Code Needs

### High Priority (Essential for Workflow)

1. ✅ **`aggregate_plex_logs.py`** - Already exists, well-implemented
2. ✅ **`compare_metrics.py`** - Already exists, well-implemented
3. 🆕 **`backup_utils.py`** - NEW: Critical for implementation safety
4. 🆕 **`plex_api_utils.py`** - NEW: Essential for active testing

### Medium Priority (Helpful but Not Critical)

5. 🆕 **`safety_validator.py`** - NEW: Helpful for implementation safety
6. ⚠️ **`diagnose_from_report.py`** - SIMPLIFY: Keep error categorization only

### Low Priority (Nice to Have)

7. 🆕 **`state_manager.py`** - NEW: Simple state save/load for convenience
8. ⚠️ **`loop_coordinator.py`** - SIMPLIFY: Keep only state save/load, remove loop logic

---

## Implementation Strategy

### Phase 1: Keep Existing Essential Scripts

- ✅ `aggregate_plex_logs.py` - No changes needed
- ✅ `compare_metrics.py` - No changes needed

### Phase 2: Simplify Over-Engineered Scripts

- ⚠️ `diagnose_from_report.py` - Simplify to keep only:
  - Error pattern categorization
  - Error counting and statistics
  - Sample message extraction
  - Remove: Automated research, solution generation, validation

- ⚠️ `loop_coordinator.py` - Simplify to keep only:
  - State file save/load
  - Simple progress tracking
  - Remove: Automated loop logic, phase orchestration

### Phase 3: Create New Utility Scripts

- 🆕 `backup_utils.py` - Backup creation and restoration
- 🆕 `plex_api_utils.py` - Plex API interaction
- 🆕 `safety_validator.py` - Safety validation
- 🆕 `state_manager.py` - Simple state management

---

## Conclusion

The Plex Metadata Improvement System is designed as a **prompt-guided workflow** where human coders follow detailed prompts through each phase. Code should support, not replace, human judgment and analysis.

**Key Findings**:
- 2 existing scripts are essential and well-implemented
- 2 existing scripts are over-engineered and should be simplified
- 4 new utility scripts are needed to support the workflow
- The majority of work (diagnostics, implementation, testing decisions, post-mortem) requires human judgment

**Next Steps**:
1. Create `SCRIPT_RECOMMENDATIONS.md` with detailed recommendations
2. Write the 4 new utility scripts
3. Simplify the 2 over-engineered scripts