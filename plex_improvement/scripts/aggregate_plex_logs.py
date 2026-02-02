#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Plex Media Server Plugin Log Aggregator
Consolidates plugin logs by agent, deduplicates patterns, and preserves errors.
"""
from __future__ import print_function

import argparse
import io
import os
import re
from collections import defaultdict
from datetime import datetime, timedelta

# Configuration
LOG_DIR = "/Users/jbmiles/Library/Logs/Plex Media Server/PMS Plugin Logs"
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "reports"))
DEFAULT_TIMEFRAME_HOURS = 24


class LogAggregator(object):
    def __init__(self, log_dir, timeframe_hours=DEFAULT_TIMEFRAME_HOURS):
        self.log_dir = log_dir
        self.timeframe_hours = timeframe_hours
        self.agents = {}

        if not os.path.exists(OUTPUT_DIR):
            os.makedirs(OUTPUT_DIR)

    def parse_log_file(self, filepath):
        agent_name = os.path.splitext(os.path.basename(filepath))[0]
        agent_name = agent_name.replace("com.plexapp.agents.", "")

        agent_entries = []
        cutoff = None
        if self.timeframe_hours is not None:
            cutoff = datetime.now() - timedelta(hours=self.timeframe_hours)

        with io.open(filepath, "r", encoding="utf-8", errors="ignore") as handle:
            for line in handle:
                if not line:
                    continue

                line = line.rstrip("\n")

                if self.should_exclude_line(line):
                    continue

                if cutoff is not None and not self.is_error_line(line):
                    ts = self.extract_timestamp(line)
                    if ts is not None and ts < cutoff:
                        continue

                consolidated = self.consolidate_entry(line)
                if consolidated:
                    agent_entries.append(consolidated)

        return {"name": agent_name, "entries": agent_entries}

    def is_error_line(self, line):
        return "ERROR" in line or "CRITICAL" in line

    def should_exclude_line(self, line):
        if self.is_error_line(line):
            return False

        if len(line) > 200:
            if line.count("{") > 3 or line.count("[") > 3:
                return True

        if "Traceback (most recent call last):" in line:
            return True

        if "  File \"" in line and "line " in line:
            return True

        return False

    def extract_timestamp(self, line):
        match = re.search(r"^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})(,\d{3})?", line)
        if not match:
            return None

        try:
            return datetime.strptime(match.group(1), "%Y-%m-%d %H:%M:%S")
        except Exception:
            return None

    def consolidate_entry(self, line):
        timestamp = ""
        ts_match = re.search(r"^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})", line)
        if ts_match:
            timestamp = ts_match.group(1)

        level = "INFO"
        level_match = re.search(r"(DEBUG|INFO|WARNING|ERROR|CRITICAL)", line)
        if level_match:
            level = level_match.group(1)

        return {
            "timestamp": timestamp,
            "level": level,
            "full_line": line,
            "pattern_key": self.extract_pattern_key(line),
        }

    def extract_pattern_key(self, line):
        pattern = line
        pattern = re.sub(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}", "[TIMESTAMP]", pattern)
        pattern = re.sub(r"\([a-f0-9]+\)", "[THREAD]", pattern)
        pattern = re.sub(r"'[^']*'", "'[STR]'", pattern)
        pattern = re.sub(r'"[^"]*"', '"[STR]"', pattern)
        pattern = re.sub(r":\s*\d+", ": [NUM]", pattern)
        pattern = re.sub(r"\b\d+\b", "[NUM]", pattern)
        return pattern

    def generate_report(self, output_filename):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        report = []

        report.append("=" * 100)
        report.append("PLEX SCRAPER LOG CONSOLIDATION REPORT")
        report.append("Generated: {0}".format(timestamp))
        report.append("Time window (hours): {0}".format(self.timeframe_hours))
        report.append("=" * 100)
        report.append("")

        if not self.agents:
            report.append("No agent logs were processed. Check log directory and filters.")

        for agent_name, data in sorted(self.agents.items()):
            report.append("=" * 100)
            report.append("AGENT: {0}".format(agent_name.upper()))
            report.append("=" * 100)
            report.append("")

            pattern_groups = defaultdict(list)
            for entry in data.get("entries", []):
                pattern_groups[entry["pattern_key"]].append(entry)

            total_entries = len(data.get("entries", []))
            unique_patterns = len(pattern_groups)

            report.append("Total log entries: {0}".format(total_entries))
            report.append("Unique message patterns: {0}".format(unique_patterns))
            report.append("")

            report.append("CONSOLIDATED PATTERNS:")
            for pattern_key, entries in sorted(pattern_groups.items(), key=lambda item: len(item[1]), reverse=True):
                count = len(entries)
                example = entries[0]["full_line"]
                example = example[:120]
                if count > 1:
                    report.append("  [{0} occurrences] {1}".format(count, example))
                else:
                    report.append("  {0}".format(example))

            report.append("")

        output_path = os.path.join(OUTPUT_DIR, output_filename)
        with io.open(output_path, "w", encoding="utf-8") as handle:
            handle.write("\n".join(report))

        print("Report generated: {0}".format(output_path))
        return output_path


def main():
    parser = argparse.ArgumentParser(description="Consolidate Plex plugin logs")
    parser.add_argument("--log-dir", default=LOG_DIR, help="Path to PMS Plugin Logs directory")
    parser.add_argument("--output", default="aggregated_logs_iteration_1.txt", help="Output report filename")
    parser.add_argument("--agent", help="Analyze specific agent only")
    parser.add_argument("--hours", type=int, default=DEFAULT_TIMEFRAME_HOURS, help="Time window in hours")

    args = parser.parse_args()

    if not os.path.isdir(args.log_dir):
        print("Log directory not found: {0}".format(args.log_dir))
        return 1

    aggregator = LogAggregator(args.log_dir, timeframe_hours=args.hours)

    log_files = []
    for name in os.listdir(args.log_dir):
        if not name.startswith("com.plexapp.agents."):
            continue
        if not name.endswith(".log"):
            continue
        log_files.append(os.path.join(args.log_dir, name))

    if args.agent:
        filtered = []
        needle = args.agent.lower()
        for path in log_files:
            if needle in os.path.basename(path).lower():
                filtered.append(path)
        log_files = filtered

    print("Processing {0} log files...".format(len(log_files)))

    for log_file in log_files:
        print("  Parsing: {0}".format(os.path.basename(log_file)))
        agent_data = aggregator.parse_log_file(log_file)
        aggregator.agents[agent_data["name"]] = agent_data

    aggregator.generate_report(args.output)

    print("\nConsolidation complete!")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
