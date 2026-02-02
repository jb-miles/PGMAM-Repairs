# 🚨 CRITICAL ERROR - Agents Broken After Update
**Diagnosis Date:** January 31, 2026 - 02:45 AM
**Status:** Multiple agents failing to start

---

## THE PROBLEM

**SYNTAX ERROR in utils.py - Line 101**

```
SyntaxError: Line 101: "_add_pgma_stubs_to_path" is an invalid variable name because it starts with "_"
```

---

## WHY THIS IS HAPPENING

Plex uses **RestrictedPython** as a security sandbox for plugins. RestrictedPython has strict naming rules:

❌ **FORBIDDEN:** Variable names starting with underscore `_`
✅ **ALLOWED:** Variable names without leading underscore

Your recent update included a variable named `_add_pgma_stubs_to_path` on line 101 of utils.py, which violates this rule.

---

## AFFECTED AGENTS (BROKEN - Won't Start)

1. ❌ **CDUniverse** - SyntaxError on line 101
2. ❌ **GEVI** - SyntaxError on line 101
3. ❌ **GayMovie** - SyntaxError on line 101
4. ❌ **GayWorld** - SyntaxError on line 101

**These agents cannot even load** - they crash immediately on startup when trying to import utils.py

---

## WORKING AGENTS (Unaffected)

These agents either don't use the broken utils.py or haven't been updated yet:

1. ✅ **GayAdult** - Started successfully
2. ✅ **GayAdultScenes** - Started successfully
3. ✅ **GayFetishandBDSM** - Started successfully
4. ✅ **GayHotMovies** - Started successfully
5. ✅ **GayRado** - Started successfully
6. ✅ **HFGPM** - Started successfully
7. ✅ **SimplyAdult** - Started successfully

---

## THE FIX

You need to rename the variable on **line 101** of utils.py:

### Change FROM:
```python
_add_pgma_stubs_to_path = ...
```

### Change TO:
```python
add_pgma_stubs_to_path = ...
```

**Simply remove the leading underscore.**

---

## DETAILED ERROR TRACE

**Full error from GEVI.log:**

```
2026-01-31 02:45:26,363 (7bfcde2ba808) :  CRITICAL (core:615) - Exception starting plug-in

File "/var/lib/plexmediaserver/.../Plug-ins/GEVI.bundle/Contents/Code/__init__.py", line 56
    import utils

File ".../Framework/.../sandbox.py", line 44, in load_module
    module = RestrictedModule(name, path, sandbox)

File ".../loader.py", line 52, in compile
    return RestrictedPython.compile_restricted(source, name, 'exec', elevated=elevated)

File ".../RCompile.py", line 68, in compile
    tree = self._get_tree()

SyntaxError: Line 101: "_add_pgma_stubs_to_path" is an invalid variable name because it starts with "_"
```

The error occurs when:
1. Agent tries to start
2. `__init__.py` tries to import `utils`
3. RestrictedPython compiler checks the code
4. Finds illegal variable name starting with `_`
5. Raises SyntaxError and agent crashes

---

## WHERE TO FIND THE FILE

The broken file is likely in a shared location used by multiple agents:

Common locations:
- `/var/lib/plexmediaserver/Library/Application Support/Plex Media Server/Plug-ins/[Agent].bundle/Contents/Code/utils.py`

Or if you have a shared utils module, it might be in:
- A common library folder
- Copied across multiple agent bundles

---

## RESTRICTEDPYTHON NAMING RULES

For future reference, here are the naming restrictions:

### ❌ FORBIDDEN:
- `_variable` - starts with single underscore
- `__variable` - starts with double underscore
- `__variable__` - double underscore on both sides (reserved for Python magic methods)

### ✅ ALLOWED:
- `variable` - no underscore prefix
- `my_variable` - underscores in the middle are fine
- `CONSTANT_NAME` - uppercase with underscores is fine

### WHY?
RestrictedPython blocks underscore-prefixed names to prevent access to private/internal Python methods and attributes, which could be used to break out of the sandbox.

---

## VERIFICATION STEPS

After fixing the variable name:

1. **Restart Plex Media Server**
   ```bash
   sudo systemctl restart plexmediaserver
   # or
   sudo service plexmediaserver restart
   ```

2. **Check logs for successful startup**
   Look for:
   ```
   INFO (core:611) - Started plug-in
   ```

3. **Should NOT see:**
   ```
   CRITICAL (core:615) - Exception starting plug-in
   SyntaxError: ...
   ```

---

## ADDITIONAL FINDINGS

While these 4 agents are completely broken, the other agents you updated may still have the old code. You may need to:

1. Check if `utils.py` is shared across multiple agents
2. Update ALL instances if it's copied to each agent bundle
3. Check for any OTHER variable names starting with `_` that might cause similar issues

---

## TIMELINE

- **Unknown time:** Code updated with `_add_pgma_stubs_to_path` variable
- **Jan 31, 02:27 - 02:45:** Multiple agents attempted to start
- **Jan 31, 02:45:** All affected agents crashed with SyntaxError
- **Current status:** 4 agents broken, 7 agents working

---

## RECOMMENDATION

**IMMEDIATE ACTION REQUIRED:**

1. Locate utils.py in your agent code
2. Find line 101
3. Change `_add_pgma_stubs_to_path` to `add_pgma_stubs_to_path`
4. Search for any other variables starting with `_` and rename them
5. Restart Plex Media Server
6. Verify all agents start successfully

This is a simple one-character fix (remove the underscore), but it's completely blocking these agents from working.
