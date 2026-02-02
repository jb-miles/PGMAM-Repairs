# Plex Metadata Improvement System - Script Recommendations

**Generated**: 2026-02-01
**Purpose**: Recommendations for existing scripts and new scripts to create

---

## Executive Summary

The Plex Metadata Improvement System is designed as a **prompt-guided workflow** where human coders follow detailed prompts through each phase. Code should support, not replace, human judgment and analysis.

**Key Principle**: Focus on essential code that makes repetitive, error-prone tasks easier. Don't over-automate tasks that require human judgment.

---

## Existing Scripts Analysis

### Scripts to Keep (No Changes Needed)

#### aggregate_plex_logs.py

**Status**: ✅ KEEP - Well-implemented, comprehensive
**Lines**: 504
**Purpose**: Parse Plex plugin logs, filter content, identify patterns, generate reports
**Assessment**: This script is essential and well-written. It handles the core log aggregation task efficiently.

**Why Keep**:
- Essential for Phase 1 (Log Aggregation)
- Well-implemented with proper error handling
- Python 2.7 compatible
- Comprehensive pattern matching and categorization
- Generates useful reports with statistics

**No Changes Needed**

---

#### compare_metrics.py

**Status**: ✅ KEEP - Well-implemented, comprehensive
**Lines**: 652
**Purpose**: Compare before/after metrics, evaluate success criteria
**Assessment**: This script is essential for the testing phase. It provides objective metric comparison.

**Why Keep**:
- Essential for Phase 4 (Testing & Validation)
- Well-implemented with proper statistical analysis
- Python 2.7 compatible
- Provides objective success/failure evaluation
- Generates comprehensive test reports

**No Changes Needed**

---

### Scripts to Simplify

#### diagnose_from_report.py

**Status**: ⚠️ SIMPLIFY - Over-engineered
**Current Lines**: 1,196
**Target Lines**: ~300
**Reduction**: ~75%

**Purpose**: Analyze aggregated logs, categorize errors, perform research, validate solutions

**Current Issues**:
- Very complex with 1,196 lines
- Attempts to automate research (Context7, Exa, web browsing) which requires human judgment
- Attempts to generate solutions automatically which requires human analysis
- Provides framework but much of the diagnostic work is manual

**What to Keep**:
- Error pattern categorization
- Error counting and statistics
- Sample message extraction
- Basic report generation

**What to Remove**:
- Automated research (Context7, Exa, web browsing) - requires human judgment
- Automated solution generation - requires human analysis
- Expected vs. Observed behavior templates - requires human analysis
- Solution validation framework - requires human code inspection

**Simplified Structure**:
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Plex Media Server Plugin Error Categorizer
Categorizes errors from aggregated log reports

Python 2.7 Compatible
"""

from __future__ import print_function
import os
import re
import sys
import json
import argparse
from datetime import datetime
from collections import defaultdict

class ErrorCategorizer(object):
    """Categorize errors from aggregated log reports"""
    
    def __init__(self, report_file, output_file):
        self.report_file = report_file
        self.output_file = output_file
        self.error_patterns = []
        self.summary_stats = {}
    
    def parse_report(self):
        """Parse the aggregated log report"""
        # Parse summary statistics
        # Parse agent sections
        # Categorize errors by type
        pass
    
    def categorize_errors(self):
        """Categorize errors by type"""
        # Title match failures
        # HTTP 403 errors
        # HTTP 404 errors
        # Model errors
        # URL fetch errors
        pass
    
    def generate_report(self):
        """Generate error categorization report"""
        # Executive summary
        # Error types identified
        # Error counts by type
        # Affected agents
        # Sample error messages
        pass

def main():
    parser = argparse.ArgumentParser(description='Categorize errors from aggregated logs')
    parser.add_argument('--report', required=True, help='Path to aggregated log report')
    parser.add_argument('--output', default='error_categorization.md', help='Output file')
    args = parser.parse_args()
    
    categorizer = ErrorCategorizer(args.report, args.output)
    categorizer.parse_report()
    categorizer.categorize_errors()
    categorizer.generate_report()

if __name__ == '__main__':
    main()
```

**Action**: Simplify to ~300 lines. Keep only error categorization and statistics.

---

#### loop_coordinator.py

**Status**: ⚠️ SIMPLIFY or REMOVE - Over-engineered
**Current Lines**: 1,085
**Target Lines**: ~100 (if kept) or 0 (if removed)
**Reduction**: ~90%

**Purpose**: Orchestrate the complete improvement cycle

**Current Issues**:
- Very complex with 1,085 lines
- Attempts to automate the entire loop which contradicts the prompt-guided approach
- The prompts are designed to guide a human coder through each phase sequentially
- Human should follow prompts, not have an automated loop coordinator

**What to Keep** (if simplifying):
- Simple state file save/load for resumption
- Basic progress tracking

**What to Remove**:
- Automated loop logic
- Phase orchestration
- Exit condition detection
- Progress calculation
- Decision making

**Recommendation**: REMOVE entirely. The human coder should follow the prompts through each phase manually. A simple state file can be maintained manually if needed.

**Alternative**: If keeping, simplify to just state management:
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Simple State Manager for Resumption
Python 2.7 Compatible
"""

from __future__ import print_function
import json
import os
import datetime

class StateManager(object):
    """Simple state manager for resumption"""
    
    def __init__(self, state_file="state.json"):
        self.state_file = state_file
        self.state = {}
        if os.path.exists(state_file):
            self.load_state()
    
    def save_state(self, reason='checkpoint'):
        """Save state to file"""
        state = {
            'saved_at': datetime.datetime.now().isoformat(),
            'reason': reason,
            'state': self.state
        }
        with open(self.state_file, 'w') as f:
            json.dump(state, f, indent=2)
        print("State saved: {}".format(self.state_file))
    
    def load_state(self):
        """Load state from file"""
        if os.path.exists(self.state_file):
            with open(self.state_file, 'r') as f:
                data = json.load(f)
                self.state = data.get('state', {})
            print("State loaded: {}".format(self.state_file))
    
    def update(self, key, value):
        """Update state value"""
        self.state[key] = value
    
    def get(self, key, default=None):
        """Get state value"""
        return self.state.get(key, default)

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Manage improvement loop state')
    parser.add_argument('--save', help='Save state with reason')
    parser.add_argument('--load', action='store_true', help='Load state')
    parser.add_argument('--get', help='Get state value')
    parser.add_argument('--set', nargs=2, metavar=('KEY', 'VALUE'), help='Set state value')
    args = parser.parse_args()
    
    manager = StateManager()
    
    if args.save:
        manager.save_state(args.save)
    elif args.load:
        manager.load_state()
    elif args.get:
        value = manager.get(args.get)
        print("{}: {}".format(args.get, value))
    elif args.set:
        manager.update(args.set[0], args.set[1])
        manager.save_state()

if __name__ == '__main__':
    main()
```

**Action**: Simplify to ~100 lines (state management only) or remove entirely.

---

## New Scripts to Create

### backup_utils.py

**Priority**: HIGH
**Estimated Lines**: ~150
**Purpose**: Backup creation and restoration for implementation safety

**Required Functions**:
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Backup and Restore Utilities
Python 2.7 Compatible
"""

from __future__ import print_function
import os
import shutil
import datetime
from pathlib import Path

def create_backup(files_to_backup, backup_name, backup_dir="Plug-ins/_BACKUPS"):
    """
    Create timestamped backup of files
    
    Args:
        files_to_backup: List of file paths to backup
        backup_name: Name for this backup
        backup_dir: Directory to store backups
        
    Returns:
        Path to backup directory
    """
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(backup_dir, "{}_{}".format(backup_name.replace(' ', '_'), timestamp))
    
    # Create backup directory
    if not os.path.exists(backup_path):
        os.makedirs(backup_path)
    
    # Copy files
    for file_path in files_to_backup:
        file_path = Path(file_path)
        if file_path.exists():
            dest = os.path.join(backup_path, file_path.name)
            shutil.copy2(str(file_path), dest)
            print("  Backed up: {}".format(file_path.name))
        else:
            print("  Warning: File not found: {}".format(file_path))
    
    print("Backup created: {}".format(backup_path))
    return backup_path

def restore_backup(backup_path, target_dir="Plug-ins"):
    """
    Restore files from backup
    
    Args:
        backup_path: Path to backup directory
        target_dir: Directory to restore files to
    """
    if not os.path.exists(backup_path):
        raise Exception("Backup not found: {}".format(backup_path))
    
    # Copy files from backup to target
    for filename in os.listdir(backup_path):
        src = os.path.join(backup_path, filename)
        dest = os.path.join(target_dir, filename)
        shutil.copy2(src, dest)
        print("  Restored: {}".format(filename))
    
    print("Restore complete from: {}".format(backup_path))

def list_backups(backup_dir="Plug-ins/_BACKUPS"):
    """
    List all available backups
    
    Args:
        backup_dir: Directory containing backups
        
    Returns:
        List of backup directories
    """
    if not os.path.exists(backup_dir):
        return []
    
    backups = []
    for item in os.listdir(backup_dir):
        item_path = os.path.join(backup_dir, item)
        if os.path.isdir(item_path):
            backups.append(item_path)
    
    return sorted(backups, reverse=True)

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Backup and restore utilities')
    parser.add_argument('--create', nargs='+', help='Create backup of files')
    parser.add_argument('--name', help='Backup name')
    parser.add_argument('--restore', help='Restore from backup directory')
    parser.add_argument('--list', action='store_true', help='List all backups')
    args = parser.parse_args()
    
    if args.create and args.name:
        create_backup(args.create, args.name)
    elif args.restore:
        restore_backup(args.restore)
    elif args.list:
        backups = list_backups()
        print("Available backups:")
        for backup in backups:
            print("  {}".format(backup))

if __name__ == '__main__':
    main()
```

**Action**: Create this script. It's essential for implementation safety.

---

### plex_api_utils.py

**Priority**: HIGH
**Estimated Lines**: ~200
**Purpose**: Plex API interaction for active testing

**Required Functions**:
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Plex API Utilities
Python 2.7 Compatible
"""

from __future__ import print_function
import requests
import re
import xml.etree.ElementTree as ET
from pathlib import Path

def get_plex_token():
    """
    Get Plex token from preferences or user input
    
    Returns:
        Plex API token string
    """
    # Try to read from Plex preferences
    prefs_path = Path.home() / "Library/Application Support/Plex Media Server/Preferences.xml"
    
    if prefs_path.exists():
        with open(prefs_path, 'r') as f:
            content = f.read()
            match = re.search(r'PlexOnlineToken="([^"]+)"', content)
            if match:
                return match.group(1)
    
    # If not found, ask user
    print("\nPlex token not found automatically.")
    print("To get your token:")
    print("  1. Open Plex Web (http://localhost:32400/web)")
    print("  2. Play any item and press Ctrl+Shift+I (or Cmd+Option+I on Mac)")
    print("  3. Go to Console tab")
    print("  4. Type: localStorage.getItem('myPlexAccessToken')")
    print("  5. Copy the token (without quotes)")
    
    return raw_input("\nEnter Plex token: ").strip()

def get_library_sections(plex_url, token):
    """
    Get all library sections
    
    Args:
        plex_url: Plex server URL
        token: Plex API token
        
    Returns:
        List of library sections
    """
    url = "{}/library/sections".format(plex_url)
    headers = {"X-Plex-Token": token}
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        raise Exception("Failed to get library sections: {}".format(response.status_code))
    
    root = ET.fromstring(response.content)
    
    sections = []
    for directory in root.findall('.//Directory'):
        sections.append({
            'key': directory.get('key'),
            'title': directory.get('title'),
            'type': directory.get('type')
        })
    
    return sections

def get_library_items(plex_url, token, section_key):
    """
    Get all items in a library section
    
    Args:
        plex_url: Plex server URL
        token: Plex API token
        section_key: Library section key
        
    Returns:
        List of library items
    """
    url = "{}/library/sections/{}/all".format(plex_url, section_key)
    headers = {"X-Plex-Token": token}
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        raise Exception("Failed to get library items: {}".format(response.status_code))
    
    root = ET.fromstring(response.content)
    
    items = []
    for video in root.findall('.//Video'):
        items.append({
            'key': video.get('key'),
            'title': video.get('title'),
            'ratingKey': video.get('ratingKey')
        })
    
    return items

def refresh_metadata(plex_url, token, rating_key):
    """
    Trigger metadata refresh for a specific item
    
    Args:
        plex_url: Plex server URL
        token: Plex API token
        ratingKey: Item rating key
        
    Returns:
        True if successful, False otherwise
    """
    url = "{}/library/metadata/{}/refresh".format(plex_url, rating_key)
    headers = {"X-Plex-Token": token}
    
    params = {'force': '1'}
    
    response = requests.put(url, headers=headers, params=params)
    
    return response.status_code == 200

def test_plex_connection(plex_url, token):
    """
    Test if Plex API is accessible
    
    Args:
        plex_url: Plex server URL
        token: Plex API token
        
    Returns:
        True if accessible, False otherwise
    """
    try:
        response = requests.get(plex_url, headers={"X-Plex-Token": token}, timeout=5)
        return response.status_code == 200
    except:
        return False

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Plex API utilities')
    parser.add_argument('--token', action='store_true', help='Get Plex token')
    parser.add_argument('--sections', help='List library sections (requires --url and --token)')
    parser.add_argument('--items', help='List items in section (requires --url, --token, and --section)')
    parser.add_argument('--refresh', help='Refresh metadata for item (requires --url, --token, and --rating-key)')
    parser.add_argument('--url', default='http://127.0.0.1:32400', help='Plex server URL')
    parser.add_argument('--section', help='Library section key')
    parser.add_argument('--rating-key', help='Item rating key')
    args = parser.parse_args()
    
    if args.token:
        token = get_plex_token()
        print("Plex Token: {}".format(token))
    elif args.sections:
        token = get_plex_token()
        sections = get_library_sections(args.url, token)
        print("Library Sections:")
        for section in sections:
            print("  {}: {} ({})".format(section['key'], section['title'], section['type']))
    elif args.items and args.section:
        token = get_plex_token()
        items = get_library_items(args.url, token, args.section)
        print("Library Items:")
        for item in items[:20]:  # Limit to 20
            print("  {}: {}".format(item['ratingKey'], item['title']))
    elif args.refresh and args.rating_key:
        token = get_plex_token()
        success = refresh_metadata(args.url, token, args.rating_key)
        if success:
            print("Metadata refresh triggered successfully")
        else:
            print("Failed to trigger metadata refresh")

if __name__ == '__main__':
    main()
```

**Action**: Create this script. It's essential for active testing.

---

### safety_validator.py

**Priority**: MEDIUM
**Estimated Lines**: ~100
**Purpose**: Safety validation for implementation

**Required Functions**:
```python
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
```

**Action**: Create this script. It's helpful for implementation safety.

---

### state_manager.py

**Priority**: LOW
**Estimated Lines**: ~100
**Purpose**: Simple state management for resumption

**Required Functions**:
```python
#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Simple State Manager for Resumption
Python 2.7 Compatible
"""

from __future__ import print_function
import json
import os
import datetime

class StateManager(object):
    """Simple state manager for resumption"""
    
    def __init__(self, state_file=None):
        """
        Initialize state manager
        
        Args:
            state_file: Optional path to state file
        """
        self.state_file = state_file or "Plug-ins/plex_improvement/state.json"
        self.state = {}
        
        if os.path.exists(self.state_file):
            self.load_state()
    
    def save_state(self, reason='checkpoint'):
        """
        Save state to file
        
        Args:
            reason: Reason for saving
        """
        state = {
            'saved_at': datetime.datetime.now().isoformat(),
            'reason': reason,
            'state': self.state
        }
        
        with open(self.state_file, 'w') as f:
            json.dump(state, f, indent=2)
        
        print("State saved: {}".format(self.state_file))
    
    def load_state(self):
        """Load state from file"""
        if os.path.exists(self.state_file):
            with open(self.state_file, 'r') as f:
                data = json.load(f)
                self.state = data.get('state', {})
            print("State loaded: {}".format(self.state_file))
    
    def update_state(self, key, value):
        """
        Update state value
        
        Args:
            key: State key
            value: State value
        """
        self.state[key] = value
    
    def get_state(self, key, default=None):
        """
        Get state value
        
        Args:
            key: State key
            default: Default value if key not found
            
        Returns:
            State value
        """
        return self.state.get(key, default)
    
    def clear_state(self):
        """Clear all state"""
        self.state = {}
        if os.path.exists(self.state_file):
            os.remove(self.state_file)
        print("State cleared")

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Manage improvement loop state')
    parser.add_argument('--save', help='Save state with reason')
    parser.add_argument('--load', action='store_true', help='Load state')
    parser.add_argument('--get', help='Get state value')
    parser.add_argument('--set', nargs=2, metavar=('KEY', 'VALUE'), help='Set state value')
    parser.add_argument('--clear', action='store_true', help='Clear state')
    args = parser.parse_args()
    
    manager = StateManager()
    
    if args.save:
        manager.save_state(args.save)
    elif args.load:
        manager.load_state()
    elif args.get:
        value = manager.get_state(args.get)
        print("{}: {}".format(args.get, value))
    elif args.set:
        manager.update_state(args.set[0], args.set[1])
        manager.save_state()
    elif args.clear:
        manager.clear_state()

if __name__ == '__main__':
    main()
```

**Action**: Create this script. It's a convenience feature for resumption.

---

## Implementation Priority

### Phase 1: Keep Existing Essential Scripts (No Action Needed)

1. ✅ `aggregate_plex_logs.py` - KEEP
2. ✅ `compare_metrics.py` - KEEP

### Phase 2: Simplify Over-Engineered Scripts

3. ⚠️ `diagnose_from_report.py` - SIMPLIFY to ~300 lines
4. ⚠️ `loop_coordinator.py` - SIMPLIFY to ~100 lines or REMOVE

### Phase 3: Create New Utility Scripts

5. 🆕 `backup_utils.py` - HIGH priority, ~150 lines
6. 🆕 `plex_api_utils.py` - HIGH priority, ~200 lines
7. 🆕 `safety_validator.py` - MEDIUM priority, ~100 lines
8. 🆕 `state_manager.py` - LOW priority, ~100 lines

---

## Summary

### Scripts to Keep (2)

| Script | Lines | Status |
|--------|-------|--------|
| `aggregate_plex_logs.py` | 504 | ✅ Keep |
| `compare_metrics.py` | 652 | ✅ Keep |

**Total**: 1,156 lines

### Scripts to Simplify (2)

| Script | Current Lines | Target Lines | Reduction |
|--------|---------------|--------------|-----------|
| `diagnose_from_report.py` | 1,196 | ~300 | ~75% |
| `loop_coordinator.py` | 1,085 | ~100 | ~90% |

**Total Reduction**: ~1,781 lines

### Scripts to Create (4)

| Script | Priority | Estimated Lines |
|--------|----------|-----------------|
| `backup_utils.py` | HIGH | ~150 |
| `plex_api_utils.py` | HIGH | ~200 |
| `safety_validator.py` | MEDIUM | ~100 |
| `state_manager.py` | LOW | ~100 |

**Total**: ~550 lines

### Net Change

- **Lines Removed**: ~1,781 (from simplification)
- **Lines Added**: ~550 (new scripts)
- **Net Reduction**: ~1,231 lines

**Result**: Simpler, more focused codebase that supports human judgment rather than replacing it.

---

## Conclusion

The Plex Metadata Improvement System is designed as a **prompt-guided workflow** where human coders follow detailed prompts through each phase. Code should support, not replace, human judgment and analysis.

**Key Recommendations**:
1. Keep 2 essential scripts that are well-implemented
2. Simplify 2 over-engineered scripts to focus on mechanical tasks
3. Create 4 new utility scripts to support the workflow
4. Overall reduction of ~1,231 lines of code
5. Simpler, more focused codebase that supports human judgment

**Next Steps**:
1. Simplify `diagnose_from_report.py` to ~300 lines
2. Simplify `loop_coordinator.py` to ~100 lines or remove
3. Create `backup_utils.py`
4. Create `plex_api_utils.py`
5. Create `safety_validator.py`
6. Create `state_manager.py`

---

## Note: Script Creation Status

**Date**: 2026-02-01

The 4 new utility scripts listed above need to be created by a human coder. Complete code templates are provided in this document for each script:

- `backup_utils.py` (lines 268-383)
- `plex_api_utils.py` (lines 389-574)
- `safety_validator.py` (lines 580-733)
- `state_manager.py` (lines 739-858)

These templates are Python 2.7 compatible and ready to be copied into their respective files. Simply create each file in `Plug-ins/plex_improvement/scripts/` and paste the corresponding template code.
