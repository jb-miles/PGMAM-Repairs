# Plex Plugin Log Aggregation — Prompt

All of the logs we are working on are part of the PGMA Plex scraper; it has not been updated in a couple years, and a lot is broken.

## Goal
Produce a clear, consolidated report that removes noise and preserves the diagnostic signal from Plex plugin logs. The output should help a developer quickly understand what is failing, where, and how often, without being overwhelmed by repetitive or verbose log content.

## Inputs
- Log directory:
  - `/Users/jbmiles/Library/Logs/Plex Media Server/PMS Plugin Logs`
- Log files are per-agent (each plugin has its own log file).
- Log line format (typical):
  - `TIMESTAMP (THREAD_ID) : LEVEL (module:line) - MESSAGE`
- If any scripts are created during this work, save them to `Plug-ins/plex_improvement/scripts`.
- Any generated reports should be saved to `Plug-ins/plex_improvement/reports`.

## What to Keep
Preserve information that explains failures, patterns, and overall health. At minimum, keep and highlight:
- ERROR lines (with enough surrounding context to be understandable)
- WARNING lines (not emphasized as strongly as ERROR)
- Search operation messages and counts
- Title match successes and failures
- Model read/write errors
- URL fetch failures (include full URLs)
- Any signals that indicate success or configuration validation

## What to Remove or Compress
Reduce noise aggressively while keeping meaning:
- Verbose configuration dumps
- Repetitive long lines (e.g., oversized JSON/dict dumps)
- Stack traces (keep first and last line; collapse middle)
- Repeated “validation lists” or checkmark-heavy sections (sample only)
- HTTP headers or request/response bodies unless they explain a failure

## Patterns to Recognize
Examples of patterns the report should detect and count:
- Search operations
- Titles found events
- Title match failures
- Model read/write errors
- URL fetch errors (403/404/timeouts)
- Other error types
- Success indicators

## Organization of the Report
Structure the output so a developer can scan it quickly:
1. **Executive Summary**
   - Total search operations
   - Titles found
   - Title match failures
   - Model read/write errors
   - URL fetch errors
   - Timeframe covered
2. **Agent-by-Agent Breakdown**
   - Per-agent stats and error patterns
   - Sample search operations (small sample)
   - Sample success indicators (small sample)
   - Sample failure patterns (small sample)
   - Failed URLs (up to a reasonable cap)
3. **Key Findings / Common Failure Scenarios**
   - Identify typical success and failure flows
   - Distinguish systemic issues from isolated errors

## Output Expectations
- Human-readable, cleanly formatted, and easy to scan.
- Consolidated patterns rather than raw dumps.
- Sampling for high-volume sections.
- Preserve timestamps and thread IDs when showing samples.

## Constraints
- Assume logs can be large and noisy.
- Logs may be written while being read.
- Encoding may include UTF-8 characters.
- Avoid including any personally identifiable information.

## Clarifications
If you need additional details (timeframe, specific agents, output format), ask for them before proceeding.
