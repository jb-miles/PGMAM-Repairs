# Active Testing Innovation - Summary

## The Key Insight

Instead of **passively waiting 24+ hours** for natural Plex activity to generate test data, we **actively trigger** metadata refreshes via the Plex API immediately after implementing a fix.

## How It Works

### Old Approach (Passive)
```
1. Implement fix
2. Restart Plex
3. Wait 24-48 hours for users to naturally browse/play content
4. Plex eventually refreshes some metadata
5. Aggregate logs
6. Hope you have enough data to evaluate

Timeline: 24-48 hours per fix test
Problem: Slow, unpredictable, may not test the right items
```

### New Approach (Active)
```
1. Implement fix
2. Restart Plex
3. Use Plex API to trigger metadata refresh on 20 specific items
4. Items are ones that previously had errors (targeted testing)
5. Wait 60 seconds for Plex to process
6. Aggregate logs (fresh data from our test)
7. Compare results immediately

Timeline: 30-45 minutes per fix test
Advantage: Fast, controlled, tests exact failure cases
```

## The Plex API Workflow

### Step 1: Get Plex Token
```python
# Auto-detected from:
~/Library/Application Support/Plex Media Server/Preferences.xml

# Or via browser console:
localStorage.getItem('myPlexAccessToken')
```

### Step 2: List Library Sections
```python
GET http://127.0.0.1:32400/library/sections
Headers: X-Plex-Token: <token>

Response:
<MediaContainer>
  <Directory key="1" title="Movies" type="movie"/>
  <Directory key="2" title="Gay Films" type="movie"/>
  ...
</MediaContainer>
```

### Step 3: Get Items from Section
```python
GET http://127.0.0.1:32400/library/sections/2/all
Headers: X-Plex-Token: <token>

Response:
<MediaContainer>
  <Video ratingKey="12345" title="Example Film" .../>
  <Video ratingKey="12346" title="Another Film" .../>
  ...
</MediaContainer>
```

### Step 4: Trigger Metadata Refresh
```python
PUT http://127.0.0.1:32400/library/metadata/12345/refresh?force=1
Headers: X-Plex-Token: <token>

# force=1 means: re-scrape from agents, don't just use cached data
```

### Step 5: Monitor Logs
```bash
# Plex writes to plugin logs immediately as it processes
tail -f "/Users/jbmiles/Library/Logs/Plex Media Server/PMS Plugin Logs/com.plexapp.agents.AEBN.log"

# You'll see:
# - Search operations
# - HTTP requests (success or 403)
# - Metadata extraction attempts
# - Success or failure
```

### Step 6: Aggregate and Compare
```bash
# After 60 seconds, re-aggregate
python aggregate_plex_logs.py --timeframe 1 --output post_fix_logs.txt

# Compare to baseline
# Did the fix work? Errors reduced? Successes increased?
```

## Why This Is Better

### Speed
- **Before**: Wait 24-48 hours per test
- **After**: 30-45 minutes per test
- **Impact**: Can test 5-10 fixes in one day instead of one every 2 days

### Control
- **Before**: Hope users trigger the right content
- **After**: We choose exactly which items to test
- **Impact**: Test the exact scenarios that were failing

### Reproducibility
- **Before**: Can't easily repeat a test
- **After**: Can trigger same test multiple times
- **Impact**: Verify fixes work consistently

### Targeted
- **Before**: Random content, may not hit problem cases
- **After**: Test items that previously had errors
- **Impact**: Directly validate that specific failures are fixed

## Implementation in the Prompts

### Testing Prompt Updates

**Added**:
- `PlexMetadataRefreshTester` class
- `get_plex_token()` - Auto-detect or prompt
- `get_library_sections()` - List available libraries
- `get_all_library_items()` - Get items from section
- `refresh_metadata()` - Trigger refresh via API
- `test_fix_actively()` - Orchestrate active test

**Removed**:
- "Wait 2-24 hours for data" steps
- Passive waiting logic
- Insufficient data checks

### Loop Coordinator Updates

**Changed**:
```python
# OLD
wait_time = fix_details.get('test_wait_hours', 2)
input(f"Has it been {wait_time} hours?")

# NEW
subprocess.run(['python', 'test_fix_actively.py'])
# Returns immediately with results
```

**Impact**:
- No more pausing loop for hours
- Can run multiple iterations in one session
- Faster feedback cycle

## Benefits Summary

### Time Savings
- **Per fix**: 24 hours → 30 minutes (48x faster)
- **Per iteration**: 24-72 hours → 1-2 hours (12-36x faster)
- **Full cycle** (5 fixes): 5-10 days → 3-8 hours (10-40x faster)

### Quality
- Test exact failure cases (targeted)
- Reproducible results (controlled)
- Immediate feedback (fast iteration)

### User Experience
- Don't need to use Plex during testing
- Don't need to wait for "natural" activity
- Complete improvement cycle in one sitting

## Example Session

### Old Way
```
Day 1, 9am:  Implement Fix 1
Day 2, 9am:  Test Fix 1 (24 hour wait)
             → Success! 
             Implement Fix 2
Day 3, 9am:  Test Fix 2 (24 hour wait)
             → Partial success
             Implement Fix 3
Day 4, 9am:  Test Fix 3 (24 hour wait)
             → Failed, rollback
             Implement Fix 4
Day 5, 9am:  Test Fix 4 (24 hour wait)
             → Success!

Total: 5 days
```

### New Way
```
Day 1, 9:00am:  Implement Fix 1
Day 1, 9:30am:  Test Fix 1 (30 min active test)
                → Success!
Day 1, 10:00am: Implement Fix 2
Day 1, 10:30am: Test Fix 2 (30 min active test)
                → Partial success
Day 1, 11:00am: Implement Fix 3
Day 1, 11:30am: Test Fix 3 (30 min active test)
                → Failed, rollback
Day 1, 12:00pm: Implement Fix 4
Day 1, 12:30pm: Test Fix 4 (30 min active test)
                → Success!

Total: 3.5 hours (all in one morning!)
```

## Technical Notes

### Plex API Basics

**Base URL**: `http://127.0.0.1:32400`

**Authentication**: X-Plex-Token header

**Key Endpoints**:
- `/library/sections` - List libraries
- `/library/sections/{key}/all` - Get items
- `/library/metadata/{ratingKey}/refresh` - Refresh metadata

**Rate Limiting**: Built-in 2-second delay between refreshes to avoid overwhelming Plex

### Python 2.7 Compatibility

The active testing code uses:
- `requests` library (available in Python 2.7)
- `xml.etree.ElementTree` (built-in)
- Standard library modules

No Python 3+ features, fully compatible with existing codebase.

### Error Handling

```python
try:
    response = requests.put(refresh_url, headers=headers)
    if response.status_code == 200:
        # Success
    else:
        # Handle error
except Exception as e:
    # Handle network/API errors
```

## Conclusion

This active testing innovation transforms the improvement loop from a **multi-day waiting game** into a **same-day iterative process**. By leveraging the Plex API to actively trigger the exact tests we need, we:

1. **Eliminate waiting** (24 hours → 30 minutes)
2. **Target testing** (test exact failure cases)
3. **Enable rapid iteration** (multiple fixes per day)
4. **Maintain control** (reproducible, deterministic)

The result: A professional, efficient improvement system that can take a Plex metadata system from 5% to 30-90% success in hours instead of weeks.
