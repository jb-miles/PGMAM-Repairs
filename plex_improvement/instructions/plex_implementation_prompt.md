# Plex Media Server Fix Implementation - Instruction Set

## PART 1: MISSION AND SCOPE

### Primary Mission
Safely implement fixes identified in the diagnostic report, one at a time, with comprehensive backup, validation, and rollback capabilities. Each fix must be tested in isolation before proceeding to the next.

### Core Principles

1. **Safety First**: Always backup before making changes
2. **Incremental Progress**: One fix at a time, never batch unless explicitly safe
3. **Reversibility**: Every change must be reversible
4. **Validation**: Verify each fix before moving to next
5. **Documentation**: Record every change made

### Success Criteria

- [ ] All high-priority fixes from diagnostic report attempted
- [ ] Each fix backed up before implementation
- [ ] Each fix validated after implementation
- [ ] All changes documented with before/after states
- [ ] Plex server operational after all changes
- [ ] Rollback capability maintained throughout

---

## PART 2: PREREQUISITES AND SETUP

### Required Inputs

1. **Diagnostic Report** (`plex_diagnostic_report.md`)
   - Contains prioritized fixes with implementation details
   - Each fix includes Expected Result section
   - Solutions validated against code

2. **PGMA Codebase Access**
   - Path: `/Users/jbmiles/Library/Application Support/Plex Media Server/Plug-ins/`
   - Read/write access to agent bundle directories
   - Ability to create backup copies

3. **Plex Server Control** (see Plex Management section)
   - Ability to restart Plex Media Server
   - Access to Plex API (preferred method)
   - Or: Instructions for user to restart manually

### Environment Verification

Before starting, verify:

```bash
# Check Plex installation
ls -la "/Users/jbmiles/Library/Application Support/Plex Media Server/Plug-ins/"

# Check PGMA agents present
ls -la "/Users/jbmiles/Library/Application Support/Plex Media Server/Plug-ins/" | grep -E "(AEBN|GEVI|HFGPM|AdultFilmDatabase)"

# Check write permissions
touch "/Users/jbmiles/Library/Application Support/Plex Media Server/Plug-ins/test.txt" && rm "/Users/jbmiles/Library/Application Support/Plex Media Server/Plug-ins/test.txt"

# Check backup directory
mkdir -p "/Users/jbmiles/Library/Application Support/Plex Media Server/Plug-ins/_BACKUPS"
```

---

## PART 3: PLEX SERVER MANAGEMENT

### Option 1: Using Plex API (PREFERRED)

Plex has an API that can be used to restart the server without sudo:

```python
import requests

# Plex server details
PLEX_URL = "http://127.0.0.1:32400"
PLEX_TOKEN = "[Get from Plex settings or X-Plex-Token]"

def restart_plex_server():
    """Restart Plex Media Server using API"""
    try:
        # Get server status
        response = requests.get(
            f"{PLEX_URL}/",
            headers={"X-Plex-Token": PLEX_TOKEN}
        )
        print(f"Plex server status: {response.status_code}")
        
        # Request restart (may require elevated token)
        # Note: Direct restart via API may not be available
        # Alternative: Tell user to restart
        
        print("⚠️  Please restart Plex Media Server manually:")
        print("   Mac: Plex icon in menu bar → Quit, then reopen Plex")
        print("   Or: Open Plex Web → Settings → Troubleshooting → Restart")
        
        input("Press Enter after Plex has restarted...")
        
        # Verify server is back up
        response = requests.get(
            f"{PLEX_URL}/",
            headers={"X-Plex-Token": PLEX_TOKEN}
        )
        
        if response.status_code == 200:
            print("✓ Plex server is running")
            return True
        else:
            print("✗ Plex server may not be running")
            return False
            
    except Exception as e:
        print(f"Error checking Plex: {e}")
        return False

def wait_for_plex_ready():
    """Wait for Plex to be fully ready"""
    import time
    max_wait = 60  # seconds
    
    for i in range(max_wait):
        try:
            response = requests.get(f"{PLEX_URL}/")
            if response.status_code == 200:
                print("✓ Plex is ready")
                return True
        except:
            pass
        time.sleep(1)
    
    print("✗ Timeout waiting for Plex")
    return False
```

### Option 2: Manual User Restart

If API restart not available, provide clear instructions:

```
═══════════════════════════════════════════════════════
MANUAL PLEX RESTART REQUIRED
═══════════════════════════════════════════════════════

Please restart Plex Media Server now:

METHOD 1: From Plex Web Interface
  1. Open http://localhost:32400/web
  2. Go to Settings → Manage → Troubleshooting
  3. Click "Restart" button
  4. Wait for server to come back online

METHOD 2: From macOS Menu Bar
  1. Click Plex icon in menu bar
  2. Select "Quit Plex Media Server"
  3. Wait 10 seconds
  4. Reopen Plex application

METHOD 3: Terminal (if comfortable)
  1. Run: launchctl unload ~/Library/LaunchAgents/com.plexapp.plexmediaserver.plist
  2. Wait 5 seconds
  3. Run: launchctl load ~/Library/LaunchAgents/com.plexapp.plexmediaserver.plist

Press Enter when Plex has restarted and is ready...
═══════════════════════════════════════════════════════
```

### Option 3: Launchctl (No sudo required)

```bash
#!/bin/bash
# Restart Plex using launchctl (user-level, no sudo needed)

echo "Stopping Plex Media Server..."
launchctl unload ~/Library/LaunchAgents/com.plexapp.plexmediaserver.plist 2>/dev/null

echo "Waiting 5 seconds..."
sleep 5

echo "Starting Plex Media Server..."
launchctl load ~/Library/LaunchAgents/com.plexapp.plexmediaserver.plist

echo "Waiting for Plex to be ready..."
sleep 10

# Check if running
if pgrep -x "Plex Media Server" > /dev/null; then
    echo "✓ Plex Media Server is running"
else
    echo "✗ Plex Media Server may not be running"
    echo "Please start it manually"
fi
```

---

## PART 4: IMPLEMENTATION WORKFLOW

### Pre-Implementation Checklist

For EACH fix from the diagnostic report:

```
FIX: [Fix name from diagnostic report]
PRIORITY: [High/Medium/Low]
COMPLEXITY: [Hours estimate]
EXPECTED IMPROVEMENT: [Percentage or description]

□ 1. PRE-IMPLEMENTATION PREPARATION
    □ Read complete fix description from diagnostic report
    □ Understand expected behavior change
    □ Identify all files to be modified
    □ Verify files exist and are accessible
    □ Note current state (error counts, behavior)
    
□ 2. BACKUP CREATION
    □ Create timestamped backup directory
    □ Copy all affected files to backup
    □ Verify backup integrity
    □ Document backup location
    
□ 3. EXPECTED BEHAVIOR STATEMENT
    □ Write clear "Before Implementation" state
    □ Write clear "After Implementation" expected state
    □ Define success criteria
    □ Define failure criteria
    
□ 4. IMPLEMENTATION
    □ Make code changes as specified
    □ Verify syntax (Python 2.7 compatible)
    □ Double-check all modifications
    □ Document what was changed
    
□ 5. PLEX RESTART
    □ Stop Plex Media Server
    □ Wait for clean shutdown
    □ Start Plex Media Server
    □ Wait for full initialization
    □ Verify plugins loaded
    
□ 6. IMMEDIATE VALIDATION
    □ Check Plex logs for errors
    □ Verify plugin loaded successfully
    □ Run basic functionality test
    □ Compare against expected behavior
    
□ 7. DECISION POINT
    □ Success: Document and proceed to testing phase
    □ Failure: Rollback and document failure
    □ Partial: Decide whether to keep or rollback
```

### Implementation Script Structure

```python
#!/usr/bin/env python
"""
Plex Fix Implementation Script
Safely implements fixes from diagnostic report
"""

import os
import shutil
import datetime
import json
from pathlib import Path

class FixImplementation:
    def __init__(self, diagnostic_report_path):
        self.diagnostic_report = self.load_diagnostic_report(diagnostic_report_path)
        self.plex_plugins_dir = Path("/Users/jbmiles/Library/Application Support/Plex Media Server/Plug-ins")
        self.backup_dir = self.plex_plugins_dir / "_BACKUPS"
        self.implementation_log = []
        
    def load_diagnostic_report(self, path):
        """Load and parse diagnostic report"""
        # Parse report to extract fixes
        pass
        
    def create_backup(self, files_to_backup, fix_name):
        """Create timestamped backup of files"""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = self.backup_dir / f"{fix_name}_{timestamp}"
        backup_path.mkdir(parents=True, exist_ok=True)
        
        for file_path in files_to_backup:
            # Preserve directory structure
            relative_path = file_path.relative_to(self.plex_plugins_dir)
            dest = backup_path / relative_path
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(file_path, dest)
            
        return backup_path
        
    def state_expected_behavior(self, fix):
        """Print expected behavior before and after"""
        print("\n" + "="*80)
        print(f"IMPLEMENTING FIX: {fix['name']}")
        print("="*80)
        
        print("\nBEFORE IMPLEMENTATION:")
        print("-" * 80)
        for line in fix['current_behavior']:
            print(f"  {line}")
            
        print("\nAFTER IMPLEMENTATION (EXPECTED):")
        print("-" * 80)
        for line in fix['expected_behavior']:
            print(f"  {line}")
            
        print("\nSUCCESS CRITERIA:")
        print("-" * 80)
        for criterion in fix['success_criteria']:
            print(f"  ✓ {criterion}")
            
        print("\nFAILURE INDICATORS:")
        print("-" * 80)
        for indicator in fix['failure_indicators']:
            print(f"  ✗ {indicator}")
            
        print("\n" + "="*80)
        
        # Confirm before proceeding
        response = input("\nProceed with implementation? (yes/no/skip): ")
        return response.lower()
        
    def implement_fix(self, fix):
        """Implement a single fix"""
        # 1. State expected behavior
        decision = self.state_expected_behavior(fix)
        
        if decision == 'skip':
            print("⊗ Skipped by user")
            return 'skipped'
        elif decision != 'yes':
            print("⊗ Cancelled by user")
            return 'cancelled'
            
        # 2. Create backup
        print("\n📦 Creating backup...")
        backup_path = self.create_backup(fix['files_to_modify'], fix['name'])
        print(f"✓ Backup created: {backup_path}")
        
        # 3. Implement changes
        print("\n🔧 Implementing changes...")
        try:
            for change in fix['changes']:
                self.apply_change(change)
            print("✓ Changes applied successfully")
        except Exception as e:
            print(f"✗ Error applying changes: {e}")
            self.rollback(backup_path, fix['files_to_modify'])
            return 'failed'
            
        # 4. Restart Plex
        print("\n🔄 Restarting Plex Media Server...")
        if not self.restart_plex():
            print("⚠️  Plex restart issue - manual restart may be required")
            
        # 5. Log implementation
        self.log_implementation(fix, backup_path)
        
        return 'implemented'
        
    def apply_change(self, change):
        """Apply a specific code change"""
        file_path = Path(change['file'])
        
        if change['type'] == 'str_replace':
            # Read file
            with open(file_path, 'r') as f:
                content = f.read()
                
            # Replace string
            old_str = change['old']
            new_str = change['new']
            
            if old_str not in content:
                raise ValueError(f"String to replace not found in {file_path}")
                
            if content.count(old_str) > 1:
                raise ValueError(f"String to replace appears multiple times in {file_path}")
                
            content = content.replace(old_str, new_str)
            
            # Write file
            with open(file_path, 'w') as f:
                f.write(content)
                
        elif change['type'] == 'line_insert':
            # Insert line at specific position
            pass
            
        elif change['type'] == 'file_create':
            # Create new file
            pass
            
    def rollback(self, backup_path, files):
        """Rollback changes from backup"""
        print(f"\n⏪ Rolling back from backup: {backup_path}")
        
        for file_path in files:
            relative_path = file_path.relative_to(self.plex_plugins_dir)
            backup_file = backup_path / relative_path
            
            if backup_file.exists():
                shutil.copy2(backup_file, file_path)
                print(f"  ✓ Restored: {file_path.name}")
                
        print("✓ Rollback complete")
        
    def restart_plex(self):
        """Restart Plex Media Server"""
        # Try API method first, fall back to manual
        # See Plex Server Management section above
        pass
        
    def log_implementation(self, fix, backup_path):
        """Log implementation details"""
        log_entry = {
            'timestamp': datetime.datetime.now().isoformat(),
            'fix_name': fix['name'],
            'priority': fix['priority'],
            'backup_path': str(backup_path),
            'files_modified': [str(f) for f in fix['files_to_modify']],
            'expected_improvement': fix['expected_improvement']
        }
        self.implementation_log.append(log_entry)
        
        # Write to file
        log_file = self.backup_dir / 'implementation_log.json'
        with open(log_file, 'w') as f:
            json.dump(self.implementation_log, f, indent=2)

def main():
    # Load diagnostic report
    impl = FixImplementation('plex_diagnostic_report.md')
    
    # Get prioritized fixes
    fixes = impl.diagnostic_report['fixes']
    
    # Implement each fix
    for fix in fixes:
        if fix['priority'] == 'HIGH':
            result = impl.implement_fix(fix)
            
            if result == 'implemented':
                print(f"\n✓ Fix '{fix['name']}' implemented successfully")
                print("  → Proceeding to testing phase...")
                break  # Implement one at a time
            elif result == 'failed':
                print(f"\n✗ Fix '{fix['name']}' failed - rolled back")
                continue
            elif result == 'skipped':
                print(f"\n⊗ Fix '{fix['name']}' skipped")
                continue

if __name__ == "__main__":
    main()
```

---

## PART 5: EXPECTED BEHAVIOR DOCUMENTATION

### Template for Each Fix

Before implementing EACH fix, output this:

```
═══════════════════════════════════════════════════════════════════════════════
IMPLEMENTATION PLAN: [Fix Name]
═══════════════════════════════════════════════════════════════════════════════

PRIORITY: [High/Medium/Low]
ESTIMATED TIME: [Hours]
AFFECTED AGENTS: [List]
RISK LEVEL: [Low/Medium/High]

───────────────────────────────────────────────────────────────────────────────
CURRENT STATE (BEFORE IMPLEMENTATION)
───────────────────────────────────────────────────────────────────────────────

ERROR PATTERN:
  • [Description of current error]
  • Frequency: [Count/percentage]
  • Impact: [User-visible effect]

CURRENT BEHAVIOR:
  1. [What happens now - step by step]
  2. [Current result]
  3. [Current error state]

CURRENT CODE:
  File: [path]
  Lines: [line numbers]
  
  [Code snippet showing current state]

CURRENT METRICS:
  • IAFD 403 errors: 367/367 (100% failure)
  • Title match failures: 1,548
  • Success rate: 2.8%

───────────────────────────────────────────────────────────────────────────────
EXPECTED STATE (AFTER IMPLEMENTATION)
───────────────────────────────────────────────────────────────────────────────

EXPECTED BEHAVIOR:
  1. [What should happen - step by step]
  2. [Expected result]
  3. [Expected success state]

NEW CODE:
  File: [path]
  Lines: [line numbers]
  
  [Code snippet showing changes]

EXPECTED METRICS (Within 24-48 hours):
  • IAFD 403 errors: ~250/367 (68% - improvement of 32%)
  • Successful IAFD requests: 20-30%
  • Title match improvements: +15-20%
  • Success rate: 20-30%

───────────────────────────────────────────────────────────────────────────────
SUCCESS CRITERIA
───────────────────────────────────────────────────────────────────────────────

IMMEDIATE SUCCESS INDICATORS (Check within 1 hour):
  ✓ No errors in Plex logs after restart
  ✓ Plugin loads successfully
  ✓ No Python syntax errors
  ✓ Agent shows up in Plex settings

SHORT-TERM SUCCESS INDICATORS (Check within 24 hours):
  ✓ Error count reduced by at least 20%
  ✓ New behavior visible in logs
  ✓ Metadata extraction succeeds for some films
  ✓ No new error types introduced

FAILURE INDICATORS:
  ✗ Plex crashes or fails to start
  ✗ Plugin fails to load
  ✗ Error count unchanged or increased
  ✗ New critical errors appear
  ✗ Metadata extraction stops working entirely

───────────────────────────────────────────────────────────────────────────────
ROLLBACK PLAN
───────────────────────────────────────────────────────────────────────────────

IF SUCCESS CRITERIA NOT MET:
  1. Stop Plex Media Server
  2. Restore files from backup: [backup path]
  3. Restart Plex Media Server
  4. Verify original functionality restored
  5. Document failure in implementation log
  6. Return to diagnostic phase for alternative solution

BACKUP LOCATION: [Will be created at implementation time]

───────────────────────────────────────────────────────────────────────────────
IMPLEMENTATION CHANGES
───────────────────────────────────────────────────────────────────────────────

FILES TO MODIFY:
  1. [Agent].bundle/Contents/Code/utils.py
  2. [Additional files if any]

CHANGES TO MAKE:
  Change 1: Add browser-like headers
    • Location: utils.py line 373
    • Type: Code insertion
    • Description: Add headers dictionary before requests.get()
    
  Change 2: Implement session management
    • Location: utils.py line 375
    • Type: Code replacement
    • Description: Replace requests.get() with session.get()
    
  [Additional changes...]

───────────────────────────────────────────────────────────────────────────────
PROCEED WITH IMPLEMENTATION?
───────────────────────────────────────────────────────────────────────────────

Options:
  [yes]  - Implement this fix now
  [no]   - Cancel and exit
  [skip] - Skip this fix and go to next
  [info] - Show more details about this fix

Your choice: _
═══════════════════════════════════════════════════════════════════════════════
```

---

## PART 6: SPECIFIC FIX IMPLEMENTATIONS

### Fix Type 1: Enhanced Headers for IAFD

```python
def implement_iafd_headers_fix(agent_name):
    """
    Implement enhanced headers for IAFD requests
    This is the most common fix for HTTP 403 errors
    """
    
    # File to modify
    utils_file = f"/Users/jbmiles/Library/Application Support/Plex Media Server/Plug-ins/{agent_name}.bundle/Contents/Code/utils.py"
    
    # Expected behavior statement
    print(f"""
IMPLEMENTING: Enhanced Headers for {agent_name}

CURRENT BEHAVIOR:
  • requests.get(url) with default Python headers
  • IAFD returns 403 Forbidden
  • No metadata enrichment occurs

EXPECTED BEHAVIOR:
  • requests.Session() with browser-like headers
  • IAFD returns 200 OK for 20-30% of requests
  • Successful metadata enrichment for some films

CHANGES:
  1. Add headers dictionary with browser User-Agent
  2. Replace requests.get() with session.get()
  3. Add 2-second delay between requests
    """)
    
    # Backup
    backup_file = utils_file + f".backup_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
    shutil.copy2(utils_file, backup_file)
    print(f"✓ Backup created: {backup_file}")
    
    # Read file
    with open(utils_file, 'r') as f:
        content = f.read()
    
    # Make changes
    old_code = """def getFilmOnIAFD(AGENTDICT, FILMDICT):
    ''' check IAFD web site for better quality thumbnails per movie'''
    """
    
    new_code = """def getFilmOnIAFD(AGENTDICT, FILMDICT):
    ''' check IAFD web site for better quality thumbnails per movie'''
    
    # Enhanced headers to avoid bot detection
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
    }
    
    # Use session for cookie persistence
    if not hasattr(getFilmOnIAFD, 'session'):
        import requests
        getFilmOnIAFD.session = requests.Session()
    """
    
    # Apply change
    if old_code in content:
        content = content.replace(old_code, new_code)
        print("✓ Added enhanced headers")
    else:
        print("✗ Could not find code to replace - skipping")
        return False
    
    # Replace requests.get() calls
    old_request = "response = requests.get(url)"
    new_request = """import time
        time.sleep(2)  # Rate limiting
        response = getFilmOnIAFD.session.get(url, headers=headers, timeout=30)"""
    
    if old_request in content:
        content = content.replace(old_request, new_request)
        print("✓ Updated request method")
    
    # Write file
    with open(utils_file, 'w') as f:
        f.write(content)
    
    print(f"✓ Changes written to {agent_name}.bundle/Contents/Code/utils.py")
    return True
```

### Fix Type 2: Update XPath Selectors

```python
def implement_xpath_fix(agent_name, old_selector, new_selector, line_hint):
    """
    Update broken XPath selectors based on website changes
    """
    
    print(f"""
IMPLEMENTING: XPath Selector Update for {agent_name}

CURRENT BEHAVIOR:
  • XPath: {old_selector}
  • Returns: None (element not found)
  • Result: Title Match Failure

EXPECTED BEHAVIOR:
  • XPath: {new_selector}
  • Returns: Matching element
  • Result: Successful title extraction

VERIFICATION:
  • Based on live website inspection
  • Tested selector in browser DevTools
  • Confirmed element exists with new selector
    """)
    
    # Implementation...
    pass
```

---

## PART 7: POST-IMPLEMENTATION VALIDATION

### Immediate Checks (Within 5 minutes)

```python
def validate_implementation_immediate(agent_name):
    """
    Run immediate validation checks after implementation
    """
    
    checks = {
        'plex_running': False,
        'plugin_loaded': False,
        'no_syntax_errors': False,
        'no_import_errors': False
    }
    
    print("\n🔍 Running immediate validation checks...")
    
    # 1. Check Plex is running
    try:
        response = requests.get("http://127.0.0.1:32400/")
        if response.status_code == 200:
            checks['plex_running'] = True
            print("  ✓ Plex Media Server is running")
        else:
            print("  ✗ Plex Media Server not responding")
    except:
        print("  ✗ Cannot connect to Plex Media Server")
    
    # 2. Check plugin loaded
    log_file = "/Users/jbmiles/Library/Logs/Plex Media Server/PMS Plugin Logs/com.plexapp.agents.{agent_name}.log"
    
    try:
        with open(log_file, 'r') as f:
            recent_logs = f.readlines()[-100:]  # Last 100 lines
            
        # Look for load success
        for line in recent_logs:
            if "loaded" in line.lower() and agent_name in line:
                checks['plugin_loaded'] = True
                print(f"  ✓ {agent_name} plugin loaded")
                break
                
        # Look for syntax errors
        syntax_errors = [line for line in recent_logs if "SyntaxError" in line or "IndentationError" in line]
        if not syntax_errors:
            checks['no_syntax_errors'] = True
            print("  ✓ No syntax errors detected")
        else:
            print("  ✗ Syntax errors found:")
            for error in syntax_errors[:3]:
                print(f"     {error.strip()}")
                
        # Look for import errors
        import_errors = [line for line in recent_logs if "ImportError" in line or "ModuleNotFoundError" in line]
        if not import_errors:
            checks['no_import_errors'] = True
            print("  ✓ No import errors detected")
        else:
            print("  ✗ Import errors found:")
            for error in import_errors[:3]:
                print(f"     {error.strip()}")
                
    except Exception as e:
        print(f"  ⚠️  Could not read log file: {e}")
    
    # Summary
    passed = sum(checks.values())
    total = len(checks)
    
    print(f"\n📊 Immediate validation: {passed}/{total} checks passed")
    
    if passed == total:
        print("✓ Implementation appears successful - ready for testing phase")
        return True
    elif passed >= total - 1:
        print("⚠️  Minor issues detected - review before testing")
        return 'warning'
    else:
        print("✗ Critical issues detected - rollback recommended")
        return False
```

---

## PART 8: IMPLEMENTATION LOG AND DOCUMENTATION

### Implementation Report Template

After each fix, generate:

```markdown
# Implementation Report: [Fix Name]

**Date**: [ISO timestamp]
**Agent(s)**: [List]
**Priority**: [High/Medium/Low]
**Status**: [Implemented/Failed/Rolled Back]

## Pre-Implementation State

**Error Count**: [Number]
**Success Rate**: [Percentage]
**Current Behavior**: [Description]

## Implementation Details

**Files Modified**:
- [File path 1]
- [File path 2]

**Backup Location**: [Path]

**Changes Made**:
1. [Change description]
   - File: [path]
   - Lines: [numbers]
   - Type: [insertion/replacement/deletion]

2. [Change description]
   ...

## Expected Results

**Immediate** (1 hour):
- [Expected change 1]
- [Expected change 2]

**Short-term** (24 hours):
- [Expected metric change]
- [Expected behavior change]

## Validation Results

**Immediate Checks**:
- ✓/✗ Plex running
- ✓/✗ Plugin loaded
- ✓/✗ No syntax errors
- ✓/✗ No import errors

**Issues Encountered**: [None / List]

## Next Steps

- [ ] Wait 1-2 hours for initial data
- [ ] Run testing phase validation
- [ ] Re-aggregate logs to check improvements
- [ ] Decide: Keep / Rollback / Modify

## Rollback Information

**If rollback needed**:
```bash
# Stop Plex
# Restore from backup
cp -r [backup path]/* [original path]/
# Restart Plex
```

**Rollback tested**: Yes/No
```

---

## PART 9: ERROR HANDLING AND ROLLBACK

### Automated Rollback Function

```python
class RollbackManager:
    def __init__(self):
        self.rollback_stack = []
        
    def add_checkpoint(self, name, files, backup_path):
        """Add a rollback checkpoint"""
        self.rollback_stack.append({
            'name': name,
            'files': files,
            'backup': backup_path,
            'timestamp': datetime.datetime.now()
        })
        
    def rollback_last(self):
        """Rollback the most recent change"""
        if not self.rollback_stack:
            print("No changes to rollback")
            return False
            
        checkpoint = self.rollback_stack.pop()
        
        print(f"\n⏪ Rolling back: {checkpoint['name']}")
        print(f"   From backup: {checkpoint['backup']}")
        
        for file_path in checkpoint['files']:
            # Restore from backup
            backup_file = Path(checkpoint['backup']) / file_path.name
            if backup_file.exists():
                shutil.copy2(backup_file, file_path)
                print(f"   ✓ Restored: {file_path.name}")
            else:
                print(f"   ✗ Backup not found: {file_path.name}")
                
        return True
        
    def rollback_all(self):
        """Rollback all changes"""
        while self.rollback_stack:
            self.rollback_last()
```

### Error Recovery

```python
def handle_implementation_error(error, fix_name, rollback_manager):
    """
    Handle errors during implementation
    """
    
    print(f"\n❌ ERROR during implementation of {fix_name}:")
    print(f"   {type(error).__name__}: {error}")
    
    print("\n🔍 Diagnosing error...")
    
    # Check error type
    if isinstance(error, SyntaxError):
        print("   → Python syntax error in modified code")
        print("   → Recommendation: Review code changes for syntax issues")
        
    elif isinstance(error, IOError):
        print("   → File access error")
        print("   → Recommendation: Check file permissions and paths")
        
    elif "module" in str(error).lower():
        print("   → Module import error")
        print("   → Recommendation: Check Python 2.7 compatibility")
        
    else:
        print("   → Unknown error type")
        
    # Ask user what to do
    print("\n📋 Options:")
    print("  1. Rollback this change")
    print("  2. Continue (keep broken change)")
    print("  3. Exit implementation")
    
    choice = input("Your choice (1/2/3): ")
    
    if choice == '1':
        rollback_manager.rollback_last()
        return 'rollback'
    elif choice == '2':
        return 'continue'
    else:
        return 'exit'
```

---

## PART 10: OUTPUT REQUIREMENTS

### Required Deliverables

1. **Implementation Script** (`implement_fixes.py`)
   - Reads diagnostic report
   - Implements fixes one at a time
   - Creates backups automatically
   - Logs all changes
   - Handles Plex restart
   - Validates immediately after each change

2. **Implementation Log** (`implementation_log.json`)
   ```json
   {
     "session_start": "2026-02-01T10:00:00",
     "session_end": "2026-02-01T11:30:00",
     "fixes_attempted": 3,
     "fixes_successful": 2,
     "fixes_failed": 1,
     "implementations": [
       {
         "fix_name": "Enhanced Headers for IAFD",
         "timestamp": "2026-02-01T10:15:00",
         "status": "implemented",
         "agents": ["AEBN", "GEVI", "HFGPM"],
         "backup_path": "/path/to/backup",
         "validation_result": "passed",
         "files_modified": ["utils.py"]
       }
     ]
   }
   ```

3. **Implementation Reports** (One per fix)
   - Markdown format
   - Includes before/after state
   - Documents changes made
   - Records validation results
   - Provides rollback instructions

4. **Backup Archive**
   - Timestamped directory structure
   - All modified files backed up
   - Organized by fix name
   - Easily restorable

---

## PART 11: SAFETY GUARANTEES

### Mandatory Safety Checks

Before ANY file modification:

```python
def safety_check(file_path, new_content):
    """
    Perform safety checks before writing file
    """
    
    checks = {
        'valid_python': False,
        'python27_compatible': False,
        'no_sudo_commands': False,
        'backup_exists': False
    }
    
    # Check 1: Valid Python syntax
    try:
        import py_compile
        import tempfile
        
        # Write to temp file and compile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(new_content)
            temp_path = f.name
            
        py_compile.compile(temp_path, doraise=True)
        checks['valid_python'] = True
        os.unlink(temp_path)
        
    except SyntaxError as e:
        print(f"  ✗ Syntax error: {e}")
        return False
        
    # Check 2: No Python 3 only syntax
    python3_patterns = [
        r'f"',  # f-strings
        r'f\'',
        r': \w+ =',  # Type hints
        r'async def',
        r'await ',
    ]
    
    for pattern in python3_patterns:
        if re.search(pattern, new_content):
            print(f"  ✗ Python 3 syntax detected: {pattern}")
            checks['python27_compatible'] = False
            return False
            
    checks['python27_compatible'] = True
    
    # Check 3: No sudo or dangerous commands
    dangerous_patterns = ['sudo', 'rm -rf', 'dd if=']
    for pattern in dangerous_patterns:
        if pattern in new_content:
            print(f"  ✗ Dangerous command detected: {pattern}")
            return False
            
    checks['no_sudo_commands'] = True
    
    # Check 4: Backup exists
    backup_file = file_path + '.backup_' + datetime.datetime.now().strftime('%Y%m%d')
    if os.path.exists(backup_file):
        checks['backup_exists'] = True
    else:
        print(f"  ⚠️  No backup found - creating one first")
        shutil.copy2(file_path, backup_file)
        checks['backup_exists'] = True
        
    # All checks must pass
    if all(checks.values()):
        print("  ✓ All safety checks passed")
        return True
    else:
        print(f"  ✗ Safety checks failed: {checks}")
        return False
```

---

## CONCLUSION

This implementation phase is designed to:

1. **Safely apply fixes** from the diagnostic report
2. **One at a time** with full validation between changes
3. **With comprehensive backups** ensuring reversibility
4. **Clear expected behavior** stated before each change
5. **Immediate validation** after each implementation
6. **Detailed logging** of all changes made

The output is a documented, reversible set of changes ready for the testing phase, where actual improvement will be measured through log re-aggregation and metric comparison.

**Next Phase**: Testing and Validation (separate instruction set)
