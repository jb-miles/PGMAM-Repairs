# Phase 1: Log Aggregation - Implementation Prompt

## Overview

This prompt guides you through creating a Python script that consolidates and analyzes Plex Media Server plugin logs by removing duplicates, grouping related entries, and filtering noise.

**Purpose**: Collect and consolidate Plex plugin logs, removing verbose/repetitive content while preserving critical information for analysis.

**Inputs**: Raw Plex plugin log files from `/Users/jbmiles/Library/Logs/Plex Media Server/PMS Plugin Logs`

**Outputs**:
- Consolidated log report (`aggregated_logs_iteration_N.txt`)
- Deduplicated and grouped log entries
- All ERROR messages preserved

---

## Mission Statement

Establish a systematic approach to analyze and improve Plex Media Server plugin performance by:

1. **Understanding log patterns** - identify recurring issues and system behavior through comprehensive log analysis
2. **Creating actionable insights** - transform raw log data into meaningful diagnostic information
3. **Building a foundation for improvement** - establish baseline metrics and patterns for future optimization
4. **Developing analysis tools** - create a Python script as one component of a broader diagnostic toolkit
5. **Enabling targeted troubleshooting** - focus on critical errors and performance bottlenecks
6. **Setting up repeatable processes** - create workflows that can be applied across multiple iterations and phases

---

## Prerequisites

### Required Knowledge
- Python 2.7 compatible syntax (no f-strings, no type hints)
- Regular expressions for pattern matching
- File I/O operations
- Basic statistics calculation

### Required Files/Paths
- Log directory: `/Users/jbmiles/Library/Logs/Plex Media Server/PMS Plugin Logs`
- Output directory: `Plug-ins/plex_improvement/reports/`

### Python 2.7 Compatibility Notes
- Use `.format()` or `%` formatting instead of f-strings
- No type hints
- Use `print()` as function (Python 2.7 compatible)
- Avoid Python 3-only libraries

---

## Step-by-Step Implementation Guide

### Step 1: Set Up Project Structure

Create the following structure:

```
Plug-ins/plex_improvement/
├── scripts/
│   └── aggregate_plex_logs.py    # You will create this
├── reports/
│   └── (output files will go here)
└── prompts/
    └── phase1_log_aggregation_prompt.md
```

### Step 2: Create the Log Aggregator Class

```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Plex Media Server Plugin Log Aggregator
Analyzes PGMA plugin logs and generates diagnostic reports
"""

import os
import re
import sys
from datetime import datetime
from collections import defaultdict
from pathlib import Path

# Configuration
LOG_DIR = "/Users/jbmiles/Library/Logs/Plex Media Server/PMS Plugin Logs"
OUTPUT_DIR = "Plug-ins/plex_improvement/reports"
DEFAULT_TIMEFRAME_HOURS = 24

class LogAggregator:
    def __init__(self, log_dir, timeframe_hours=DEFAULT_TIMEFRAME_HOURS):
        self.log_dir = Path(log_dir)
        self.timeframe_hours = timeframe_hours
        self.agents = {}
        self.consolidated_entries = defaultdict(list)

        # Create output directory if needed
        self.output_dir = Path(OUTPUT_DIR)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def parse_log_file(self, filepath):
        """Parse a single agent log file"""
        # Extract agent name from filename
        agent_name = filepath.stem.replace('com.plexapp.agents.', '')

        # Store all entries for this agent
        agent_entries = []

        # Read and parse log lines
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            for line in f:
                # Check if line should be excluded
                if self.should_exclude_line(line):
                    continue

                # Consolidate the line
                consolidated = self.consolidate_entry(line.rstrip())
                if consolidated:
                    agent_entries.append(consolidated)

        return {
            'name': agent_name,
            'entries': agent_entries
        }

    def should_exclude_line(self, line):
        """Determine if a line should be excluded from analysis"""
        # Exclude lines >200 characters with repetitive content
        if len(line) > 200:
            # Check for repetitive JSON/dictionary dumps
            if line.count('{') > 3 or line.count('[') > 3:
                return True

        # Exclude full stack traces (keep first/last line only)
        if 'Traceback (most recent call last):' in line:
            return True
        if '  File "' in line and 'line ' in line:
            return True

        return False

    def consolidate_entry(self, line):
        """Consolidate entry by extracting key pattern"""
        # Extract timestamp and core message (removing variable data)
        # This creates a pattern key to group similar messages

        # Extract timestamp
        timestamp_match = re.search(r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})', line)
        timestamp = timestamp_match.group(1) if timestamp_match else ''

        # Extract log level
        level_match = re.search(r'(DEBUG|INFO|WARNING|ERROR|CRITICAL)', line)
        level = level_match.group(1) if level_match else 'INFO'

        return {
            'timestamp': timestamp,
            'level': level,
            'full_line': line,
            'pattern_key': self.extract_pattern_key(line)
        }
```

### Step 3: Add Pattern Extraction for Consolidation

Add method to identify and consolidate duplicate/similar entries:

```python
    def extract_pattern_key(self, line):
        """Extract pattern key to identify similar messages for consolidation"""
        # Remove timestamps and variable data
        # Replace numbers and quoted strings with placeholders
        pattern = line
        pattern = re.sub(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}', '[TIMESTAMP]', pattern)
        pattern = re.sub(r'\([a-f0-9]+\)', '[THREAD]', pattern)
        pattern = re.sub(r"'[^']*'", "'[STR]'", pattern)
        pattern = re.sub(r'"[^"]*"', '"[STR]"', pattern)
        pattern = re.sub(r':\s*\d+', ': [NUM]', pattern)

        return pattern
```

This creates a pattern key that groups identical message types together, allowing consolidation of duplicate entries.

### Step 4: Generate the Report with Consolidation

```python
    def generate_report(self, output_filename):
        """Generate the final consolidation report"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        report = []

        # Executive Summary
        report.append("=" * 100)
        report.append("PLEX SCRAPER LOG CONSOLIDATION REPORT")
        report.append("Generated: {}".format(timestamp))
        report.append("=" * 100)
        report.append("")

        # Agent-by-Agent Consolidation
        for agent_name, data in sorted(self.agents.items()):
            report.append("=" * 100)
            report.append("AGENT: {}".format(agent_name.upper()))
            report.append("=" * 100)
            report.append("")

            # Group entries by pattern key
            pattern_groups = defaultdict(list)
            for entry in data['entries']:
                pattern_groups[entry['pattern_key']].append(entry)

            # Report consolidated entries
            total_entries = len(data['entries'])
            unique_patterns = len(pattern_groups)

            report.append("Total log entries: {}".format(total_entries))
            report.append("Unique message patterns: {}".format(unique_patterns))
            report.append("")

            # Show consolidated patterns with count
            report.append("CONSOLIDATED PATTERNS:")
            for pattern_key, entries in sorted(pattern_groups.items(), key=lambda x: len(x[1]), reverse=True):
                count = len(entries)
                # Show example
                example = entries[0]['full_line']
                if count > 1:
                    report.append("  [{} occurrences] {}".format(count, example[:120]))
                else:
                    report.append("  {}".format(example))

            report.append("")

        # Write report
        output_path = self.output_dir / output_filename
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report))

        print("Report generated: {}".format(output_path))
        return output_path
```

### Step 5: Main Execution Function

```python
def main():
    """Main execution function"""
    import argparse

    parser = argparse.ArgumentParser(description='Consolidate Plex plugin logs')
    parser.add_argument('--log-dir', default=LOG_DIR, help='Path to PMS Plugin Logs directory')
    parser.add_argument('--output', default='aggregated_logs.txt', help='Output report filename')
    parser.add_argument('--agent', help='Analyze specific agent only')

    args = parser.parse_args()

    # Create aggregator
    aggregator = LogAggregator(args.log_dir)

    # Process logs
    log_files = list(Path(args.log_dir).glob('com.plexapp.agents.*.log'))

    if args.agent:
        log_files = [f for f in log_files if args.agent.lower() in f.name.lower()]

    print("Processing {} log files...".format(len(log_files)))

    for log_file in log_files:
        print("  Parsing: {}".format(log_file.name))
        agent_data = aggregator.parse_log_file(log_file)
        aggregator.agents[agent_data['name']] = agent_data

    # Generate report
    output_file = aggregator.generate_report(args.output)

    print("\nConsolidation complete!")
    print("Output: {}".format(output_file))

if __name__ == "__main__":
    main()
```

---

## Expected Output Format

Your script should generate a report with this structure:

```
====================================================================================================
PLEX SCRAPER LOG CONSOLIDATION REPORT
Generated: 2026-02-01 21:00:00
====================================================================================================

====================================================================================================
AGENT: AEBN
====================================================================================================

Total log entries: 4,616
Unique message patterns: 127

CONSOLIDATED PATTERNS:
  [42 occurrences] 2026-01-30 14:39:06,711 (7ae1b6527b38) :  INFO (agentkit:961) - AEBN  - Searching for matches for
  [38 occurrences] 2026-01-30 14:39:06,724 (7ae1b6527b38) :  INFO (sandbox:19) - AEBN  - UTILS :: 1. match_duration
  [193 occurrences] 2026-01-30 14:39:17,728 (7ae1b6527b38) :  ERROR (utils:5487) - AEBN - SEARCH::    Error getting S
  [12 occurrences] 2026-01-30 14:40:11,123 (8bf2c7638c49) :  ERROR (connection:204) - AEBN - Failed to fetch URL:
  [6 occurrences] 2026-01-30 14:41:22,445 (9cf3d8749d50) :  WARNING (timeout:891) - AEBN - Request timeout after
  ...

====================================================================================================
AGENT: IMDB
====================================================================================================

Total log entries: 5,234
Unique message patterns: 156

CONSOLIDATED PATTERNS:
  ...
```

---

## Validation Checklist

Before considering your implementation complete, verify:

- [ ] Report is generated in the correct location
- [ ] All agent log files are processed
- [ ] Per-agent sections show total entries and unique patterns
- [ ] Duplicate/similar messages are grouped with occurrence counts
- [ ] Verbose/repetitive lines are filtered out
- [ ] All ERROR messages are preserved
- [ ] Consolidated patterns show representative example lines
- [ ] Python 2.7 compatible (no f-strings, no type hints)
- [ ] Handles missing log files gracefully
- [ ] Handles malformed log lines without crashing

---

## Common Pitfalls to Avoid

1. **Python 3 Syntax**: Do NOT use f-strings or type hints
2. **Memory Issues**: Process large log files in streaming fashion, not all at once
3. **Encoding Errors**: Handle UTF-8 encoding errors gracefully with `errors='ignore'`
4. **Missing Files**: Check if log files exist before processing
5. **Empty Results**: Handle case where no errors are found
6. **Pattern Key Collisions**: Ensure pattern key extraction is specific enough to group only truly similar messages
7. **Incorrect Paths**: Use absolute paths or verify relative paths are correct

---

## Success Criteria

Your implementation is successful when:

1. ✅ Script processes all available agent log files
2. ✅ Report aggregates logs organized by agent
3. ✅ Duplicate/similar messages are consolidated with occurrence counts
4. ✅ Verbose/repetitive content is filtered out
5. ✅ All ERROR messages are preserved in the report
6. ✅ Each agent section shows total entries and unique pattern counts
7. ✅ Consolidated patterns are sorted by frequency (most common first)
8. ✅ Output is saved to the correct location
9. ✅ Script is Python 2.7 compatible
10. ✅ Script handles edge cases (missing files, empty logs, encoding issues)

---

## LLM Analysis and Validation

After generating the consolidation report:

1. **Apply LLM analysis** to the consolidated report to identify:
   - Emerging themes and patterns across all agents
   - Root cause relationships between different error types
   - Priority classification of issues based on frequency and impact
   - Recommendations for immediate vs. long-term fixes

2. **Validate report accuracy** by:
   - Cross-referencing LLM-identified themes with actual log content
   - Ensuring the script's prioritization aligns with real system behavior
   - Checking that critical issues are properly surfaced and categorized
   - Verifying that the analysis captures the true nature of system problems

3. **Prepare for Phase 2** by:
   - Documenting key findings from LLM analysis
   - Creating a prioritized list of issues to investigate
   - Establishing baseline metrics for measuring improvement
   - Identifying which patterns warrant deeper diagnostic investigation

---

## Integration with Other Phases

This phase feeds into:

- **Phase 2 (Diagnostics)**: The aggregated log report is the primary input for error diagnosis
- **Phase 4 (Testing)**: Re-running this script generates post-fix metrics for comparison
- **Phase 6 (Loop Coordination)**: Metrics are tracked across iterations

---

## Next Steps

After completing this phase:

1. Review the generated consolidation report
2. Identify the top recurring log patterns by occurrence count
3. Proceed to **Phase 2: Diagnostics** for deeper error analysis
4. Use the consolidation report as input for targeted diagnostics

---

## Related Files

- **Phase 2 Prompt**: [`phase2_diagnostics_prompt.md`](../prompts/phase2_diagnostics_prompt.md)
