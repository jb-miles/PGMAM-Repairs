#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Plex Metrics Comparison Script
Compares before/after metrics to assess fix effectiveness.
Parses aggregation reports, calculates changes, and generates comparison reports.

Python 2.7 Compatible
"""

from __future__ import print_function
import argparse
import re
import os
import sys
import json
import datetime


class MetricComparison(object):
    """
    Class for comparing metrics between baseline and current reports.
    """
    
    def __init__(self, baseline_report, current_report):
        """
        Initialize the metric comparison.
        
        Args:
            baseline_report: Path to baseline aggregation report
            current_report: Path to current aggregation report
        """
        self.baseline = self.parse_report(baseline_report)
        self.current = self.parse_report(current_report)
        self.baseline_path = baseline_report
        self.current_path = current_report
    
    def parse_report(self, report_path):
        """
        Extract metrics from an aggregation report.
        
        Args:
            report_path: Path to the aggregation report file
            
        Returns:
            Dictionary containing extracted metrics
        """
        metrics = {
            'total_search_ops': 0,
            'titles_found': 0,
            'title_failures': 0,
            'model_errors': 0,
            'url_errors': 0,
            'agent_stats': {}
        }
        
        if not os.path.exists(report_path):
            print("WARNING: Report file not found: {0}".format(report_path))
            return metrics
        
        with open(report_path, 'r') as f:
            content = f.read()
        
        # Extract executive summary metrics
        metrics['total_search_ops'] = self.extract_number(content, r'Total Search Operations:\s+(\d+)')
        metrics['titles_found'] = self.extract_number(content, r'Titles Found Events:\s+(\d+)')
        metrics['title_failures'] = self.extract_number(content, r'Title Match Failures:\s+(\d+)')
        metrics['model_errors'] = self.extract_number(content, r'Model Read Errors:\s+(\d+)')
        metrics['url_errors'] = self.extract_number(content, r'URL Fetch Errors:\s+(\d+)')
        
        # Extract per-agent stats if available
        metrics['agent_stats'] = self.extract_agent_stats(content)
        
        return metrics
    
    def extract_number(self, text, pattern):
        """
        Extract a number from text using regex.
        
        Args:
            text: Text to search
            pattern: Regex pattern with capture group
            
        Returns:
            Extracted number as integer, or 0 if not found
        """
        match = re.search(pattern, text)
        return int(match.group(1)) if match else 0
    
    def extract_agent_stats(self, content):
        """
        Extract per-agent statistics from the report.
        
        Args:
            content: Full report content
            
        Returns:
            Dictionary mapping agent names to their stats
        """
        agent_stats = {}
        
        # Look for agent sections (format: "## Agent: AgentName")
        agent_pattern = r'##\s*Agent:\s*(.+?)\s*\n+(.*?)(?=##\s*Agent:|\Z)'
        
        for match in re.finditer(agent_pattern, content, re.DOTALL):
            agent_name = match.group(1).strip()
            agent_content = match.group(2)
            
            stats = {
                'searches': self.extract_number(agent_content, r'Searches:\s+(\d+)'),
                'found': self.extract_number(agent_content, r'Found:\s+(\d+)'),
                'failures': self.extract_number(agent_content, r'Failures:\s+(\d+)'),
                'url_errors': self.extract_number(agent_content, r'URL Errors:\s+(\d+)'),
                'model_errors': self.extract_number(agent_content, r'Model Errors:\s+(\d+)')
            }
            
            agent_stats[agent_name] = stats
        
        return agent_stats
    
    def compare_metric(self, metric_name):
        """
        Compare a specific metric between baseline and current.
        
        Args:
            metric_name: Name of the metric to compare
            
        Returns:
            Dictionary containing comparison results
        """
        baseline_val = self.baseline.get(metric_name, 0)
        current_val = self.current.get(metric_name, 0)
        
        change = current_val - baseline_val
        
        if baseline_val == 0:
            percent_change = 100 if current_val > 0 else 0
        else:
            percent_change = ((change) / float(baseline_val)) * 100
        
        # For error metrics, lower is better
        improved = current_val < baseline_val
        
        return {
            'metric': metric_name,
            'baseline': baseline_val,
            'current': current_val,
            'change': change,
            'percent_change': round(percent_change, 2),
            'improved': improved
        }
    
    def generate_comparison_report(self):
        """
        Generate full comparison report.
        
        Returns:
            List of comparison result dictionaries
        """
        print("=" * 80)
        print("BEFORE/AFTER COMPARISON REPORT")
        print("=" * 80)
        
        metrics_to_compare = [
            'total_search_ops',
            'titles_found',
            'title_failures',
            'model_errors',
            'url_errors'
        ]
        
        results = []
        
        for metric in metrics_to_compare:
            result = self.compare_metric(metric)
            results.append(result)
            
            # Print comparison
            print("\n{0}:".format(result['metric']))
            print("  Before: {0}".format(result['baseline']))
            print("  After:  {0}".format(result['current']))
            print("  Change: {0:+d} ({1:+.1f}%)".format(result['change'], result['percent_change']))
            
            if result['improved']:
                print("  Status: IMPROVED")
            elif result['change'] == 0:
                print("  Status: UNCHANGED")
            else:
                print("  Status: WORSENED")
        
        return results
    
    def calculate_overall_improvement(self):
        """
        Calculate overall improvement metrics.
        
        Returns:
            Dictionary containing overall improvement statistics
        """
        baseline_errors = (
            self.baseline.get('title_failures', 0) +
            self.baseline.get('url_errors', 0) +
            self.baseline.get('model_errors', 0)
        )
        
        current_errors = (
            self.current.get('title_failures', 0) +
            self.current.get('url_errors', 0) +
            self.current.get('model_errors', 0)
        )
        
        baseline_searches = self.baseline.get('total_search_ops', 1)
        current_searches = self.current.get('total_search_ops', 1)
        
        # Calculate error reduction
        if baseline_errors > 0:
            error_reduction = ((baseline_errors - current_errors) / float(baseline_errors)) * 100
        else:
            error_reduction = 0
        
        # Calculate success rates
        baseline_success = ((baseline_searches - baseline_errors) / float(baseline_searches)) * 100 if baseline_searches > 0 else 0
        current_success = ((current_searches - current_errors) / float(current_searches)) * 100 if current_searches > 0 else 0
        
        success_improvement = current_success - baseline_success
        
        return {
            'baseline_errors': baseline_errors,
            'current_errors': current_errors,
            'error_reduction': round(error_reduction, 2),
            'baseline_success_rate': round(baseline_success, 2),
            'current_success_rate': round(current_success, 2),
            'success_rate_improvement': round(success_improvement, 2)
        }


class SuccessEvaluator(object):
    """
    Class for evaluating whether fixes meet success criteria.
    """
    
    def __init__(self, comparison_results, overall_improvement):
        """
        Initialize the success evaluator.
        
        Args:
            comparison_results: List of metric comparison results
            overall_improvement: Dictionary of overall improvement metrics
        """
        self.comparison_results = comparison_results
        self.overall_improvement = overall_improvement
    
    def evaluate_fix(self, fix_name, expected_results=None):
        """
        Evaluate if a fix met its success criteria.
        
        Args:
            fix_name: Name of the fix being evaluated
            expected_results: Optional dictionary of expected results from diagnostic report
            
        Returns:
            Dictionary containing evaluation results
        """
        print("\n" + "=" * 80)
        print("SUCCESS EVALUATION: {0}".format(fix_name))
        print("=" * 80)
        
        # Define success indicators
        success_indicators = [
            {
                'name': 'Error reduction >= 10%',
                'check': self.check_error_reduction,
                'threshold': 10
            },
            {
                'name': 'No new error types introduced',
                'check': self.check_no_new_errors
            },
            {
                'name': 'URL errors reduced (if applicable)',
                'check': self.check_url_errors_reduced
            },
            {
                'name': 'Title failures reduced (if applicable)',
                'check': self.check_title_failures_reduced
            }
        ]
        
        # Define failure indicators
        failure_indicators = [
            {
                'name': 'Error rate increased significantly (>10%)',
                'check': self.check_error_increase
            },
            {
                'name': 'New critical errors introduced',
                'check': self.check_new_critical_errors
            }
        ]
        
        # Evaluate success indicators
        print("\nSUCCESS INDICATORS:")
        success_count = 0
        total_indicators = len(success_indicators)
        
        for indicator in success_indicators:
            met = indicator['check'](indicator.get('threshold', 0))
            if met:
                print("  {0} {1}".format('✓', indicator['name']))
                success_count += 1
            else:
                print("  {0} {1}".format('✗', indicator['name']))
        
        # Evaluate failure indicators
        print("\nFAILURE INDICATORS:")
        failure_detected = False
        
        for indicator in failure_indicators:
            detected = indicator['check']()
            if detected:
                print("  {0} {1}".format('✗', indicator['name']))
                failure_detected = True
            else:
                print("  {0} {1}".format('○', indicator['name'] + ' (not detected)'))
        
        # Overall assessment
        success_rate = (success_count / float(total_indicators)) * 100 if total_indicators > 0 else 0
        
        print("\nSUCCESS RATE: {0}/{1} ({2:.0f}%)".format(
            success_count, total_indicators, success_rate
        ))
        
        # Decision
        if failure_detected:
            decision = "ROLLBACK"
            reason = "Critical failure indicators detected"
        elif success_rate >= 75:
            decision = "KEEP"
            reason = "Met >=75% of success criteria"
        elif success_rate >= 50:
            decision = "MONITOR"
            reason = "Partial success - need more time or tweaking"
        else:
            decision = "ROLLBACK"
            reason = "Failed to meet minimum success criteria (<50%)"
        
        print("\nDECISION: {0}".format(decision))
        print("   Reason: {0}".format(reason))
        
        return {
            'fix_name': fix_name,
            'success_rate': round(success_rate, 2),
            'success_count': success_count,
            'total_indicators': total_indicators,
            'failure_detected': failure_detected,
            'decision': decision,
            'reason': reason
        }
    
    def check_error_reduction(self, threshold):
        """
        Check if error reduction meets threshold.
        
        Args:
            threshold: Minimum required error reduction percentage
            
        Returns:
            True if threshold met, False otherwise
        """
        return self.overall_improvement.get('error_reduction', 0) >= threshold
    
    def check_no_new_errors(self):
        """
        Check if no new error types were introduced.
        
        Returns:
            True if no new errors, False otherwise
        """
        # Check if any metric that was 0 in baseline is now > 0
        for metric in ['model_errors']:
            baseline_val = self.baseline_value(metric)
            current_val = self.current_value(metric)
            if baseline_val == 0 and current_val > 0:
                return False
        return True
    
    def check_url_errors_reduced(self):
        """
        Check if URL errors were reduced.
        
        Returns:
            True if reduced or unchanged, False if increased
        """
        baseline_val = self.baseline_value('url_errors')
        current_val = self.current_value('url_errors')
        return current_val <= baseline_val
    
    def check_title_failures_reduced(self):
        """
        Check if title failures were reduced.
        
        Returns:
            True if reduced or unchanged, False if increased
        """
        baseline_val = self.baseline_value('title_failures')
        current_val = self.current_value('title_failures')
        return current_val <= baseline_val
    
    def check_error_increase(self):
        """
        Check if error rate increased significantly.
        
        Returns:
            True if increased >10%, False otherwise
        """
        error_reduction = self.overall_improvement.get('error_reduction', 0)
        return error_reduction < -10
    
    def check_new_critical_errors(self):
        """
        Check if new critical errors were introduced.
        
        Returns:
            True if new critical errors detected, False otherwise
        """
        # Check for significant increase in any error type
        for metric in ['url_errors', 'model_errors', 'title_failures']:
            baseline_val = self.baseline_value(metric)
            current_val = self.current_value(metric)
            if baseline_val > 0 and current_val > baseline_val * 2:
                return True
        return False
    
    def baseline_value(self, metric_name):
        """
        Get baseline value for a metric.
        
        Args:
            metric_name: Name of the metric
            
        Returns:
            Baseline value
        """
        for result in self.comparison_results:
            if result['metric'] == metric_name:
                return result['baseline']
        return 0
    
    def current_value(self, metric_name):
        """
        Get current value for a metric.
        
        Args:
            metric_name: Name of the metric
            
        Returns:
            Current value
        """
        for result in self.comparison_results:
            if result['metric'] == metric_name:
                return result['current']
        return 0


def generate_markdown_report(baseline_path, current_path, fix_name, comparison_results, 
                           overall_improvement, evaluation_result, output_path):
    """
    Generate a markdown test report.
    
    Args:
        baseline_path: Path to baseline report
        current_path: Path to current report
        fix_name: Name of the fix being tested
        comparison_results: List of metric comparison results
        overall_improvement: Dictionary of overall improvement metrics
        evaluation_result: Dictionary containing evaluation results
        output_path: Path where to save the report
    """
    report_lines = []
    
    report_lines.append("# Fix Testing Report: {0}\n\n".format(fix_name))
    report_lines.append("**Test Date**: {0}\n".format(datetime.datetime.now().isoformat()))
    report_lines.append("**Status**: {0}\n\n".format(evaluation_result.get('decision', 'UNKNOWN')))
    
    # Executive Summary
    report_lines.append("## Executive Summary\n\n")
    report_lines.append("This test evaluated the effectiveness of the fix: {0}\n\n".format(fix_name))
    report_lines.append("**Decision**: {0}\n\n".format(evaluation_result.get('decision', 'UNKNOWN')))
    report_lines.append("**Reason**: {0}\n\n".format(evaluation_result.get('reason', 'Unknown')))
    
    # Test Configuration
    report_lines.append("## Test Configuration\n\n")
    report_lines.append("**Baseline Report**: {0}\n".format(baseline_path))
    report_lines.append("**Post-Implementation Report**: {0}\n\n".format(current_path))
    
    # Metric Comparison
    report_lines.append("## Metric Comparison\n\n")
    report_lines.append("| Metric | Baseline | Current | Change | % Change | Status |\n")
    report_lines.append("|--------|----------|---------|--------|----------|--------|\n")
    
    for result in comparison_results:
        status = '✓' if result['improved'] else ('→' if result['change'] == 0 else '✗')
        report_lines.append("| {0} | {1} | {2} | {3:+d} | {4:+.1f}% | {5} |\n".format(
            result['metric'],
            result['baseline'],
            result['current'],
            result['change'],
            result['percent_change'],
            status
        ))
    
    # Overall Improvement
    report_lines.append("\n## Overall Improvement\n\n")
    report_lines.append("- **Error Reduction**: {0}%\n".format(overall_improvement.get('error_reduction', 0)))
    report_lines.append("- **Baseline Success Rate**: {0}%\n".format(overall_improvement.get('baseline_success_rate', 0)))
    report_lines.append("- **Current Success Rate**: {0}%\n".format(overall_improvement.get('current_success_rate', 0)))
    report_lines.append("- **Success Rate Improvement**: {0}%\n\n".format(overall_improvement.get('success_rate_improvement', 0)))
    
    # Success Criteria Evaluation
    report_lines.append("## Success Criteria Evaluation\n\n")
    report_lines.append("**Success Indicators Met**: {0}/{1} ({2:.0f}%)\n\n".format(
        evaluation_result.get('success_count', 0),
        evaluation_result.get('total_indicators', 0),
        evaluation_result.get('success_rate', 0)
    ))
    
    # Decision and Rationale
    report_lines.append("## Decision and Rationale\n\n")
    report_lines.append("**Decision**: {0}\n\n".format(evaluation_result.get('decision', 'UNKNOWN')))
    report_lines.append("**Rationale**:\n{0}\n\n".format(evaluation_result.get('reason', 'Unknown')))
    
    # Write report
    with open(output_path, 'w') as f:
        f.write(''.join(report_lines))
    
    print("\nTest report generated: {0}".format(output_path))


def main():
    """
    Main entry point for metrics comparison script.
    """
    parser = argparse.ArgumentParser(
        description='Compare Plex metadata metrics before and after a fix'
    )
    parser.add_argument(
        '--baseline',
        required=True,
        help='Path to baseline aggregation report'
    )
    parser.add_argument(
        '--current',
        required=True,
        help='Path to current (post-fix) aggregation report'
    )
    parser.add_argument(
        '--fix-name',
        default='Unknown Fix',
        help='Name of the fix being tested'
    )
    parser.add_argument(
        '--output',
        help='Path to output test report (default: test_report_<fix_name>.md)'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output results as JSON instead of generating report'
    )
    
    args = parser.parse_args()
    
    # Validate input files
    if not os.path.exists(args.baseline):
        print("ERROR: Baseline report not found: {0}".format(args.baseline))
        sys.exit(1)
    
    if not os.path.exists(args.current):
        print("ERROR: Current report not found: {0}".format(args.current))
        sys.exit(1)
    
    # Perform comparison
    print("\n" + "=" * 80)
    print("METRICS COMPARISON")
    print("=" * 80)
    print("\nBaseline: {0}".format(args.baseline))
    print("Current:  {0}".format(args.current))
    print("Fix:      {0}".format(args.fix_name))
    
    comparison = MetricComparison(args.baseline, args.current)
    comparison_results = comparison.generate_comparison_report()
    
    # Calculate overall improvement
    overall_improvement = comparison.calculate_overall_improvement()
    
    print("\n" + "=" * 80)
    print("OVERALL IMPROVEMENT")
    print("=" * 80)
    print("\nBaseline Errors: {0}".format(overall_improvement['baseline_errors']))
    print("Current Errors:  {0}".format(overall_improvement['current_errors']))
    print("Error Reduction: {0}%".format(overall_improvement['error_reduction']))
    print("\nBaseline Success Rate: {0}%".format(overall_improvement['baseline_success_rate']))
    print("Current Success Rate:  {0}%".format(overall_improvement['current_success_rate']))
    print("Success Rate Improvement: {0}%".format(overall_improvement['success_rate_improvement']))
    
    # Evaluate success
    evaluator = SuccessEvaluator(comparison_results, overall_improvement)
    evaluation_result = evaluator.evaluate_fix(args.fix_name)
    
    # Generate output
    if args.json:
        # Output as JSON
        output = {
            'fix_name': args.fix_name,
            'baseline_report': args.baseline,
            'current_report': args.current,
            'comparison_results': comparison_results,
            'overall_improvement': overall_improvement,
            'evaluation': evaluation_result,
            'timestamp': datetime.datetime.now().isoformat()
        }
        print("\n" + json.dumps(output, indent=2))
    else:
        # Generate markdown report
        if args.output:
            output_path = args.output
        else:
            # Generate default output path
            safe_fix_name = args.fix_name.replace(' ', '_').replace('/', '_')
            output_path = 'test_report_{0}.md'.format(safe_fix_name)
        
        generate_markdown_report(
            args.baseline,
            args.current,
            args.fix_name,
            comparison_results,
            overall_improvement,
            evaluation_result,
            output_path
        )
    
    # Return exit code based on decision
    if evaluation_result.get('decision') == 'ROLLBACK':
        sys.exit(1)
    elif evaluation_result.get('decision') == 'MONITOR':
        sys.exit(2)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()