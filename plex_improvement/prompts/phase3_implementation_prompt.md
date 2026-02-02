# Phase 3: Implementation - Implementation Prompt

## Overview

This prompt guides you through safely implementing fixes identified in the diagnostic report, one at a time, with comprehensive backup, validation, and rollback capabilities.

**Purpose**: Safely apply fixes one at a time with full validation before proceeding.

**Inputs**: Diagnostic report from Phase 2 with prioritized fixes

**Outputs**: 
- Modified code files
- Timestamped backups
- Implementation log (`implementation_log.json`)
- Implementation reports (one per fix)

**Estimated Time**: 15-30 minutes per fix

---

## Mission Statement

Implement fixes from the diagnostic report by:

1. **Stating expected behavior** BEFORE making any changes
2. **Creating comprehensive backups** of all affected files
3. **Applying ONE fix at a time** (never batch unless explicitly safe)
4. **Restarting Plex** if required (no sudo needed)
5. **Validating immediately** after each change
6. **Maintaining rollback capability** throughout

---

## Prerequisites

### Required Knowledge
- Python 2.7 compatible syntax (no f-strings, no type hints)
- File I/O and backup operations
- Plex server management (restart without sudo)
- Basic error handling and validation

### Required Inputs
- Diagnostic report with prioritized fixes
- Access to PGMA agent codebase
- Ability to restart Plex Media Server

### Safety Constraints
- **Python 2.7 compatibility** (CRITICAL)
- **No sudo commands** (user-level only)
- **Always backup before changes**
- **Validate before writing**
- **One fix at a time**

---

## Step-by-Step Implementation Guide

### Step 1: Pre-Implementation Preparation

For EACH fix from the diagnostic report:

```python
# Pre-implementation checklist
FIX = {
    'name': 'Enhanced Headers for IAFD',
    'priority': 'HIGH',
    'complexity': '2-3 hours',
    'expected_improvement': '20-30% success rate'
}

PREPARATION_CHECKLIST = [
    'Read complete fix description from diagnostic report',
    'Understand expected behavior change',
    'Identify all files to be modified',
    'Verify files exist and are accessible',
    'Note current state (error counts, behavior)'
]
```

### Step 2: State Expected Behavior

**CRITICAL**: Before implementing ANY fix, output this:

```markdown
══════════════════════════════════════════════════════════════════════════════
IMPLEMENTATION PLAN: Enhanced Headers for IAFD
════════════════════════════════════════════════════════════════════════════════

PRIORITY: HIGH
ESTIMATED TIME: 2-3 hours
AFFECTED AGENTS: All 21 agents
RISK LEVEL: LOW

──────────────────────────────────────────────────────────────────────────────────────
CURRENT STATE (BEFORE IMPLEMENTATION)
──────────────────────────────────────────────────────────────────────────────────────

ERROR PATTERN:
  • IAFD HTTP 403 Forbidden errors
  • Frequency: 367/367 (100% failure)
  • Impact: No cast enrichment, missing performer photos, bios, aliases

CURRENT BEHAVIOR:
  1. Agent calls getFilmOnIAFD() with film title
  2. HTTP request to IAFD returns 403 Forbidden
  3. No HTML response received (exception raised)
  4. XPath selectors never execute (request failed)
  5. FILMDICT not populated with IAFD data
  6. Function fails, FoundOnIAFD remains unset or 'No'
  7. matchCast() and matchDirectors() calls also fail with 403
  8. Final metadata missing all IAFD-sourced information

CURRENT CODE:
  File: utils.py
  Lines: 373-380
  
  def getFilmOnIAFD(AGENTDICT, FILMDICT):
      ''' check IAFD web site for better quality thumbnails per movie'''
      searchTitle = FILMDICT['IAFDSearchTitle']
      url = IAFD_SEARCH_URL.format(searchTitle)
      response = requests.get(url)  # <-- PROBLEM: No headers, no session
      # ... rest of function

CURRENT METRICS:
  • IAFD 403 errors: 367/367 (100% failure)
  • Title match failures: 1,548
  • Success rate: 2.8%

──────────────────────────────────────────────────────────────────────────────────────
EXPECTED STATE (AFTER IMPLEMENTATION)
──────────────────────────────────────────────────────────────────────────────────────

EXPECTED BEHAVIOR:
  1. Agent calls getFilmOnIAFD() with film title
  2. HTTP request to IAFD returns 200 OK (for 20-30% of requests)
  3. HTML response contains search results
  4. XPath selectors extract film metadata
  5. FILMDICT populated with IAFD enrichment data
  6. Function returns successfully with FoundOnIAFD = 'Yes'
  7. matchCast() and matchDirectors() calls succeed
  8. Final metadata includes IAFD-sourced information

NEW CODE:
  File: utils.py
  Lines: 373-380
  
  def getFilmOnIAFD(AGENTDICT, FILMDICT):
      ''' check IAFD web site for better quality thumbnails per movie'''
      
      # Enhanced headers to avoid bot detection
      headers = {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36...',
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
      
      time.sleep(2)  # Rate limiting
      response = getFilmOnIAFD.session.get(url, headers=headers, timeout=30)
      # ... rest of function

EXPECTED METRICS (Within 24-48 hours):
  • IAFD 403 errors: ~250/367 (68% - improvement of 32%)
  • Successful IAFD requests: 20-30%
  • Title match improvements: +15-20%
  • Success rate: 20-30%

──────────────────────────────────────────────────────────────────────────────────────
SUCCESS CRITERIA
──────────────────────────────────────────────────────────────────────────────────────

IMMEDIATE SUCCESS INDICATORS (Check within 1 hour):
  ✓ No errors in Plex logs after restart
  ✓ Plugin loaded successfully
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

──────────────────────────────────────────────────────────────────────────────────────
ROLLBACK PLAN
──────────────────────────────────────────────────────────────────────────────────────

IF SUCCESS CRITERIA NOT MET:
  1. Stop Plex Media Server
  2. Restore files from backup: [backup path]
  3. Restart Plex Media Server
  4. Verify original functionality restored
  5. Document failure in implementation log
  6. Return to diagnostic phase for alternative solution

BACKUP LOCATION: Will be created at implementation time

──────────────────────────────────────────────────────────────────────────────────────
IMPLEMENTATION CHANGES
──────────────────────────────────────────────────────────────────────────────────────

FILES TO MODIFY:
  1. [Agent].bundle/Contents/Code/utils.py (for all 21 agents)

CHANGES TO MAKE:
  Change 1: Add browser-like headers
    • Location: utils.py line 373
    • Type: Code insertion
    • Description: Add headers dictionary before requests.get()
    
  Change 2: Implement session management
    • Location: utils.py line 375
    • Type: Code replacement
    • Description: Replace requests.get() with session.get()
    
  Change 3: Add rate limiting
    • Location: utils.py line 376
    • Type: Code insertion
    • Description: Add time.sleep(2) before request

──────────────────────────────────────────────────────────────────────────────────────
PROCEED WITH IMPLEMENTATION?
──────────────────────────────────────────────────────────────────────────────────────

Options:
  [yes]  - Implement this fix now
  [no]   - Cancel and exit
  [skip] - Skip this fix and go to next
  [info] - Show more details about this fix

Your choice: _
══════════════════════════════════════════════════════════════════════════════
```

### Step 3: Create Timestamped Backup

```python
import shutil
import datetime
from pathlib import Path

def create_backup(files_to_backup, fix_name):
    """Create timestamped backup of files"""
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = Path("Plug-ins/_BACKUPS") / "{}_{}".format(fix_name.replace(' ', '_'), timestamp)
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    for file_path in files_to_backup:
        file_path = Path(file_path)
        # Preserve directory structure
        relative_path = file_path.relative_to("Plug-ins")
        dest = backup_dir / relative_path
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file_path, dest)
        print("  Backed up: {}".format(file_path.name))
    
    print("Backup created: {}".format(backup_dir))
    return backup_dir
```

### Step 4: Apply Code Changes

```python
def apply_change(file_path, old_string, new_string):
    """Apply a specific code change"""
    
    # Read file
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Validate old_string exists
    if old_string not in content:
        raise ValueError("String to replace not found in {}".format(file_path))
    
    if content.count(old_string) > 1:
        raise ValueError("String to replace appears multiple times in {}".format(file_path))
    
    # Replace string
    content = content.replace(old_string, new_string)
    
    # Write file
    with open(file_path, 'w') as f:
        f.write(content)
    
    print("  Applied change to: {}".format(file_path.name))
```

### Step 5: Safety Validation Before Writing

```python
def safety_check(file_path, new_content):
    """Perform safety checks before writing file"""
    
    checks = {
        'valid_python': False,
        'python27_compatible': False,
        'no_sudo_commands': False
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
        print("  ✗ Syntax error: {}".format(e))
        return False
    
    # Check 2: No Python 3 only syntax
    python3_patterns = [
        r'f"',  # f-strings
        r'f\'',
        r': \w+ =',  # Type hints
        r'async def',
        r'await ',
    ]
    
    import re
    for pattern in python3_patterns:
        if re.search(pattern, new_content):
            print("  ✗ Python 3 syntax detected: {}".format(pattern))
            checks['python27_compatible'] = False
            return False
    
    checks['python27_compatible'] = True
    
    # Check 3: No sudo or dangerous commands
    dangerous_patterns = ['sudo', 'rm -rf', 'dd if=']
    for pattern in dangerous_patterns:
        if pattern in new_content:
            print("  ✗ Dangerous command detected: {}".format(pattern))
            return False
    
    checks['no_sudo_commands'] = True
    
    # All checks must pass
    if all(checks.values()):
        print("  ✓ All safety checks passed")
        return True
    else:
        print("  ✗ Safety checks failed: {}".format(checks))
        return False
```

### Step 6: Restart Plex Media Server

**Option 1: Using launchctl (No sudo required)**

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

**Option 2: Manual User Restart**

```markdown
══════════════════════════════════════════════════════════════════════════════
MANUAL PLEX RESTART REQUIRED
════════════════════════════════════════════════════════════════════════════════

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

Press Enter when Plex has restarted and is ready...
════════════════════════════════════════════════════════════════════════════
```

### Step 7: Immediate Validation

```python
def validate_implementation_immediate(agent_name):
    """Run immediate validation checks after implementation"""
    
    checks = {
        'plex_running': False,
        'plugin_loaded': False,
        'no_syntax_errors': False,
        'no_import_errors': False
    }
    
    print("\nRunning immediate validation checks...")
    
    # 1. Check Plex is running
    try:
        import requests
        response = requests.get("http://127.0.0.1:32400/", timeout=5)
        if response.status_code == 200:
            checks['plex_running'] = True
            print("  ✓ Plex Media Server is running")
        else:
            print("  ✗ Plex Media Server not responding")
    except:
        print("  ✗ Cannot connect to Plex Media Server")
    
    # 2. Check plugin loaded
    log_file = "/Users/jbmiles/Library/Logs/Plex Media Server/PMS Plugin Logs/com.plexapp.agents.{}.log".format(agent_name)
    
    try:
        with open(log_file, 'r') as f:
            recent_logs = f.readlines()[-100:]  # Last 100 lines
        
        # Look for load success
        for line in recent_logs:
            if "loaded" in line.lower() and agent_name in line:
                checks['plugin_loaded'] = True
                print("  ✓ {} plugin loaded".format(agent_name))
                break
        
        # Look for syntax errors
        syntax_errors = [line for line in recent_logs if "SyntaxError" in line or "IndentationError" in line]
        if not syntax_errors:
            checks['no_syntax_errors'] = True
            print("  ✓ No syntax errors detected")
        else:
            print("  ✗ Syntax errors found:")
            for error in syntax_errors[:3]:
                print("     {}".format(error.strip()))
        
        # Look for import errors
        import_errors = [line for line in recent_logs if "ImportError" in line or "ModuleNotFoundError" in line]
        if not import_errors:
            checks['no_import_errors'] = True
            print("  ✓ No import errors detected")
        else:
            print("  ✗ Import errors found:")
            for error in import_errors[:3]:
                print("     {}".format(error.strip()))
                
    except Exception as e:
        print("  Could not read log file: {}".format(e))
    
    # Summary
    passed = sum(checks.values())
    total = len(checks)
    
    print("\nImmediate validation: {}/{} checks passed".format(passed, total))
    
    if passed == total:
        print("✓ Implementation appears successful - ready for testing phase")
        return True
    elif passed >= total - 1:
        print("⚠ Minor issues detected - review before testing")
        return 'warning'
    else:
        print("✗ Critical issues detected - rollback recommended")
        return False
```

### Step 8: Log Implementation Details

```python
import json

def log_implementation(fix_name, backup_path, files_modified, expected_improvement):
    """Log implementation details"""
    
    log_entry = {
        'timestamp': datetime.datetime.now().isoformat(),
        'fix_name': fix_name,
        'backup_path': str(backup_path),
        'files_modified': [str(f) for f in files_modified],
        'expected_improvement': expected_improvement,
        'status': 'implemented'
    }
    
    # Load existing log or create new
    log_file = Path("Plug-ins/plex_improvement/reports/implementation_log.json")
    
    if log_file.exists():
        with open(log_file, 'r') as f:
            log = json.load(f)
    else:
        log = {
            'session_start': datetime.datetime.now().isoformat(),
            'implementations': []
        }
    
    log['implementations'].append(log_entry)
    
    # Write log
    with open(log_file, 'w') as f:
        json.dump(log, f, indent=2)
    
    print("Implementation logged: {}".format(log_file))
```

---

## Implementation Report Template

After each fix, generate:

```markdown
# Implementation Report: Enhanced Headers for IAFD

**Date**: 2026-02-01T21:00:00
**Agent(s)**: All 21 agents
**Priority**: HIGH
**Status**: Implemented

## Pre-Implementation State

**Error Count**: 367 IAFD 403 errors
**Success Rate**: 0% for IAFD enrichment
**Current Behavior**: All IAFD requests blocked with 403 Forbidden

## Implementation Details

**Files Modified**:
- Plug-ins/AEBN.bundle/Contents/Code/utils.py
- Plug-ins/AdultFilmDatabase.bundle/Contents/Code/utils.py
- [... all 21 agents]

**Backup Location**: Plug-ins/_BACKUPS/Enhanced_Headers_for_IAFD_20260201_210000/

**Changes Made**:
1. Added browser-like headers
   - File: utils.py
   - Lines: 373-380
   - Type: Code insertion
   - Description: Added headers dictionary with User-Agent, Accept, etc.
   
2. Implemented session management
   - File: utils.py
   - Lines: 375
   - Type: Code replacement
   - Description: Replaced requests.get() with session.get()
   
3. Added rate limiting
   - File: utils.py
   - Lines: 376
   - Type: Code insertion
   - Description: Added time.sleep(2) before requests

## Expected Results

**Immediate** (1 hour):
- No errors in Plex logs after restart
- Plugin loaded successfully
- No Python syntax errors

**Short-term** (24 hours):
- IAFD 403 errors reduced by at least 20%
- Successful IAFD requests increase to 20-30%
- Cast photos begin appearing in Plex

## Validation Results

**Immediate Checks**:
- ✓ Plex running
- ✓ Plugin loaded
- ✓ No syntax errors
- ✓ No import errors

**Issues Encountered**: None

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
cp -r Plug-ins/_BACKUPS/Enhanced_Headers_for_IAFD_20260201_210000/* Plug-ins/
# Restart Plex
```

**Rollback tested**: No (not needed)
```

---

## Rollback Function

```python
def rollback_fix(backup_path, files_to_restore):
    """Rollback changes from backup"""
    
    print("\nRolling back from backup: {}".format(backup_path))
    
    for file_path in files_to_restore:
        file_path = Path(file_path)
        relative_path = file_path.relative_to("Plug-ins")
        backup_file = Path(backup_path) / relative_path
        
        if backup_file.exists():
            shutil.copy2(backup_file, file_path)
            print("  ✓ Restored: {}".format(file_path.name))
        else:
            print("  ✗ Backup not found: {}".format(file_path.name))
    
    print("Rollback complete")
    
    # Restart Plex
    print("\nPlease restart Plex Media Server to apply rollback")
```

---

## Validation Checklist

Before considering implementation complete, verify:

- [ ] Expected behavior stated BEFORE changes
- [ ] Backup created and verified
- [ ] Code changes applied correctly
- [ ] Safety checks passed (Python 2.7, no sudo)
- [ ] Plex restarted successfully
- [ ] Immediate validation passed
- [ ] Implementation logged
- [ ] Rollback capability maintained
- [ ] No syntax errors in logs
- [ ] No import errors in logs

---

## Common Pitfalls to Avoid

1. **No Backup**: Always backup before making changes
2. **Batch Changes**: Implement one fix at a time
3. **Python 3 Syntax**: No f-strings, no type hints
4. **Skipping Validation**: Always validate before writing
5. **No Rollback Plan**: Always maintain rollback capability
6. **Sudo Commands**: Never use sudo - use user-level methods
7. **Multiple Files Changed**: Track all modified files for rollback
8. **No Documentation**: Log every change made

---

## Integration with Other Phases

This phase feeds into:

- **Phase 4 (Testing)**: Implementation provides fix to test
- **Phase 5 (Post-Mortem)**: Implementation log provides change history
- **Phase 6 (Loop Coordination)**: Implementation results feed into loop decisions

---

## Success Criteria

Your implementation is successful when:

1. ✅ Expected behavior stated before changes
2. ✅ Comprehensive backup created
3. ✅ Code changes applied correctly
4. ✅ Safety checks passed (Python 2.7, no sudo)
5. ✅ Plex restarted successfully
6. ✅ Immediate validation passed
7. ✅ Implementation logged
8. ✅ Rollback capability maintained
9. ✅ No syntax or import errors
10. ✅ Ready for testing phase

---

## Next Steps

After completing this phase:

1. Review implementation results
2. Proceed to **Phase 4: Testing** to validate the fix
3. Use Expected Results as success criteria
4. Be prepared to rollback if testing fails

---

## Related Files

- **Master Prompt**: [`plex_improvement_agent_master_prompt.md`](../prompts/plex_improvement_agent_master_prompt.md)
- **Phase 2 Prompt**: [`phase2_diagnostics_prompt.md`](../prompts/phase2_diagnostics_prompt.md)
- **Phase 4 Prompt**: [`phase4_testing_prompt.md`](../prompts/phase4_testing_prompt.md)
- **Existing Script**: Reference implementation in existing codebase
