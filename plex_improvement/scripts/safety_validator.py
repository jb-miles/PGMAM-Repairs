#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Safety Validation Utilities for Implementation
Python 2.7 Compatible
"""

from __future__ import print_function
import re
import tempfile
import os

def validate_python_syntax(code):
    """
    Check if code has valid Python syntax
    
    Args:
        code: Python code string
        
    Returns:
        (is_valid, error_message)
    """
    try:
        import py_compile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(code)
            temp_path = f.name
        
        py_compile.compile(temp_path, doraise=True)
        os.unlink(temp_path)
        return True, None
    except SyntaxError as e:
        return False, str(e)

def check_python27_compatibility(code):
    """
    Check if code is Python 2.7 compatible
    
    Args:
        code: Python code string
        
    Returns:
        (is_compatible, issues)
    """
    python3_patterns = [
        (r'f"', 'f-strings'),
        (r"f'", 'f-strings'),
        (r': \w+ =', 'type hints'),
        (r'async def', 'async/await'),
        (r'await ', 'async/await'),
    ]
    
    issues = []
    for pattern, description in python3_patterns:
        if re.search(pattern, code):
            issues.append(description)
    
    return len(issues) == 0, issues

def check_no_sudo_commands(code):
    """
    Check if code contains sudo or dangerous commands
    
    Args:
        code: Python code string
        
    Returns:
        (is_safe, issues)
    """
    dangerous_patterns = ['sudo', 'rm -rf', 'dd if=']
    issues = []
    
    for pattern in dangerous_patterns:
        if pattern in code:
            issues.append("Contains: {}".format(pattern))
    
    return len(issues) == 0, issues

def safety_check(file_path, new_content):
    """
    Perform all safety checks before writing file
    
    Args:
        file_path: Path to file
        new_content: New file content
        
    Returns:
        (all_passed, results)
    """
    results = {
        'valid_python': False,
        'python27_compatible': False,
        'no_sudo_commands': False
    }
    
    # Check 1: Valid Python syntax
    is_valid, error = validate_python_syntax(new_content)
    results['valid_python'] = is_valid
    if not is_valid:
        results['syntax_error'] = error
    
    # Check 2: Python 2.7 compatibility
    is_compatible, issues = check_python27_compatibility(new_content)
    results['python27_compatible'] = is_compatible
    if not is_compatible:
        results['compatibility_issues'] = issues
    
    # Check 3: No sudo or dangerous commands
    is_safe, issues = check_no_sudo_commands(new_content)
    results['no_sudo_commands'] = is_safe
    if not is_safe:
        results['dangerous_commands'] = issues
    
    all_passed = all(results.values())
    
    return all_passed, results

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Safety validation utilities')
    parser.add_argument('--file', help='File to validate')
    args = parser.parse_args()
    
    if args.file:
        with open(args.file, 'r') as f:
            content = f.read()
        
        all_passed, results = safety_check(args.file, content)
        
        print("Safety Check Results:")
        print("  Valid Python: {}".format("PASS" if results['valid_python'] else "FAIL"))
        print("  Python 2.7 Compatible: {}".format("PASS" if results['python27_compatible'] else "FAIL"))
        print("  No Dangerous Commands: {}".format("PASS" if results['no_sudo_commands'] else "FAIL"))
        
        if not all_passed:
            print("\nIssues:")
            if not results['valid_python']:
                print("  - Syntax Error: {}".format(results.get('syntax_error', 'Unknown')))
            if not results['python27_compatible']:
                print("  - Compatibility Issues: {}".format(', '.join(results.get('compatibility_issues', []))))
            if not results['no_sudo_commands']:
                print("  - Dangerous Commands: {}".format(', '.join(results.get('dangerous_commands', []))))

if __name__ == '__main__':
    main()
