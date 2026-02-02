# Plex Metadata Improvement System — Agent Instructions (Prose Only)

## 0) Mission

Iteratively improve Plex metadata agent reliability by:

1. Extracting error patterns from logs
2. Diagnosing root causes and proposing fixes with explicit expected results
3. Implementing fixes safely (one at a time)
4. Actively testing each fix by forcing refreshes and measuring before/after
5. Repeating until improvement plateaus or goals are reached

This system is designed to be **fast (active testing)** and **safe (backups, Python 2.7 compatibility, no sudo)**.

---

## 1) File layout and “code vs prose” rule

### Prose documents (this doc + generated reports)
- Contain instructions, checklists, decisions, examples, and references to code files
- Do **not** include executable code blocks

### Code files (`.py`)
- Contain all executable logic
- Must be created if missing, with the exact filename referenced below

---

## 2) Required code files (create if missing)

### Orchestration
- `loop_coordinator.py` — runs the loop and maintains state
- `compare_metrics.py` — compares baseline vs post-fix aggregated logs and emits a test report

### Phase scripts
- `aggregate_plex_logs.py` — produces aggregated logs + baseline metrics
- `diagnose_from_report.py` — turns aggregated logs into `diagnostic_report.md` (and optionally structured data)
- `implement_fix.py` — applies **one** fix safely, writes implementation log, supports rollback
- `test_fix_actively.py` — forces Plex refreshes for ~20 previously failing items and collects results

### Optional but recommended
- `parse_test_report.py` — extracts decision + key numbers from the test report (used by coordinator)

---

## 3) Core workflow (canonical order)

The loop is always:

**Aggregate → Diagnose → Implement → Test → Decision → (repeat)**

Post-mortem is an **end-of-cycle** activity, not a per-fix loop step (but we *do* add a mini post-mortem checkpoint after each fix).

---

## 4) Phase 0 — Session setup (run once)

### Goals
- Establish a run directory for artifacts (reports/logs/state)
- Confirm you can read Plex logs and write output files
- Record environment assumptions (OS, Plex install style, where logs live)

### Outputs
- `run_manifest.md`
- `loop_state.json` initialized

---

## 5) Phase 1 — Log aggregation (baseline and post-fix)

### Run
Use `aggregate_plex_logs.py` to generate:
- `aggregated_logs_iteration_{N}.txt`
- baseline metrics (embedded or separate)

### Aggregation must include
- Top error patterns (grouped)
- Counts/frequencies
- Time window used
- Shortlist of high-value errors

---

## 6) Phase 2 — Diagnostics (root cause + expected results)

### Run
Use `diagnose_from_report.py` to produce:
- `diagnostic_report.md`
- Optional: `diagnostic_report.json`

### Diagnostic report requirements
For each error pattern:
1. Observed behavior
2. Expected behavior
3. Divergence point
4. Root cause hypothesis
5. Fix proposal + **Expected Results**
6. Active test plan

---

## 7) Phase 3 — Implementation (one fix only) + immediate “Why?” checkpoint

### Run
Use `implement_fix.py` with a single fix ID.

### Required behavior
- State expected behavior before changes
- Create backups
- Apply **one** fix
- Restart Plex if required
- Validate syntax/runtime
- Maintain rollback capability

### Safety constraints
- Python 2.7 compatibility
- No sudo
- Validate before writing

---

## 8) Phase 4 — Testing (Active) + full “Why?” analysis

### Decision thresholds
- ≥75% success → **KEEP**
- 50–74% → **MONITOR**
- <50% or regressions → **ROLLBACK**

---

## 9) Phase 5 — Loop coordination

`loop_coordinator.py` manages:
- Running tests
- Re-aggregation
- Metric comparison
- Next-action decisions

---

## 10) Phase 6 — End-of-cycle post-mortem

When exiting:
- Analyze intervention points
- Compare expected vs actual
- Identify misses
- Record lessons learned

Output:
- `lessons_learned.md`
