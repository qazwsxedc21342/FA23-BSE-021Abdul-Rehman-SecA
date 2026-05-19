# 🔧 Troubleshooting Guide

## Issue 1: Election Creator Showing Voter Dashboard

### Symptoms
- User registered as "Election Creator"
- After login, shows "Voter" role in sidebar
- Cannot access `/creator` routes

### Root Causes
1. **Not Approved Yet**: Creator requests need admin approval first
2. **Database Role Not Updated**: Role is still 'voter' in database
3. **Cache Issue**: Browser cache showing old role

### Solutions

#### Step 1: Check Database
Run this in Supabase SQL Editor:
```sql
SELECT id, name, email, role, verified 
FROM users 
WHERE email = 'your_email@example.com';
```

#### Step 2: Check Creator Request Status
```sql
SELECT cr.*, u.email 
FROM creator_requests cr
JOIN users u ON u.id = cr.user_id
WHERE u.email = 'your_email@example.com';
```

#### Step 3: Manual Approval (If Admin Not Available)
```sql
-- Get user ID first
SELECT id FROM users WHERE email = 'your_email@example.com';

-- Approve request (replace USER_ID)
UPDATE creator_requests 
SET status = 'approved', updated_at = NOW() 
WHERE user_id = 'USER_ID';

-- Update user role
UPDATE users 
SET role = 'election_creator', verified = true 
WHERE id = 'USER_ID';
```

#### Step 4: Clear Browser Cache
1. Logout from application
2. Clear browser cache (Ctrl+Shift+Delete)
3. Clear localStorage: Open DevTools (F12) → Console → Run:
   ```javascript
   localStorage.clear()
   ```
4. Refresh page (Ctrl+F5)
5. Login again

---

## Issue 2: "Election Not Active" Error When Voting

### Symptoms
- Election shows "Active" status in UI
- When trying to vote, shows "This election is not currently active"
- Cannot cast vote

### Root Causes
1. **Database status is not 'active'**: Status might be 'published' instead
2. **Missing start/end dates**: Election dates not set properly
3. **Date mismatch**: Current time not between start_at and end_at

### Solutions

#### Step 1: Check Election Status
```sql
SELECT 
  id, 
  title, 
  status, 
  start_at, 
  end_at,
  NOW() as current_time
FROM elections 
WHERE id = 'ELECTION_ID';
```

#### Step 2: Fix Election Status
```sql
-- Option A: Set status to active
UPDATE elections 
SET status = 'active'
WHERE id = 'ELECTION_ID';

-- Option B: Fix dates (if status is 'published')
UPDATE elections 
SET 
  start_at = NOW(),
  end_at = NOW() + INTERVAL '7 days',
  status = 'active'
WHERE id = 'ELECTION_ID';
```

#### Step 3: Use Creator Dashboard
1. Login as election creator
2. Go to "My Elections"
3. Click "Manage Candidates" on your election
4. Click "Start Election" button
5. This will properly set status to 'active'

---

## Issue 3: Cannot Register for Election

### Symptoms
- "Register" button not working
- Error: "Registration deadline has passed"
- Error: "Maximum voters reached"

### Solutions

#### Check Registration Deadline
```sql
SELECT 
  id, 
  title, 
  deadline,
  max_voters,
  NOW() as current_time
FROM elections 
WHERE id = 'ELECTION_ID';
```

#### Fix Deadline
```sql
-- Extend deadline by 7 days
UPDATE elections 
SET deadline = NOW() + INTERVAL '7 days'
WHERE id = 'ELECTION_ID';
```

#### Check Voter Count
```sql
SELECT 
  e.title,
  e.max_voters,
  COUNT(vr.id) as registered_voters
FROM elections e
LEFT JOIN polls p ON p.election_id = e.id
LEFT JOIN voter_registrations vr ON vr.poll_id = p.id
WHERE e.id = 'ELECTION_ID'
GROUP BY e.id, e.title, e.max_voters;
```

#### Increase Max Voters
```sql
UPDATE elections 
SET max_voters = 1000
WHERE id = 'ELECTION_ID';
```

---

## Issue 4: Secret ID Not Working

### Symptoms
- Error: "Invalid Secret ID"
- Cannot cast vote even with correct Secret ID

### Solutions

#### Check Secret ID Exists
```sql
SELECT 
  si.masked_secret,
  si.hashed_secret,
  u.email,
  p.title as poll_title
FROM secret_ids si
JOIN users u ON u.id = si.user_id
JOIN polls p ON p.id = si.poll_id
WHERE u.email = 'your_email@example.com';
```

#### Regenerate Secret IDs
```sql
-- Delete old secret IDs
DELETE FROM secret_ids 
WHERE user_id = (SELECT id FROM users WHERE email = 'your_email@example.com');

-- Then register again from UI to generate new ones
```

---

## Issue 5: Admin Cannot Approve Creators

### Symptoms
- No "Approvals" menu in admin dashboard
- Cannot see pending creator requests

### Solutions

#### Create Admin User
```sql
-- Make yourself admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'your_email@example.com';
```

#### Check Pending Requests
```sql
SELECT 
  cr.id,
  u.name,
  u.email,
  cr.status,
  cr.purpose,
  cr.created_at
FROM creator_requests cr
JOIN users u ON u.id = cr.user_id
WHERE cr.status = 'pending'
ORDER BY cr.created_at DESC;
```

---

## Issue 6: Blank Dashboard / Infinite Loading

### Symptoms
- Dashboard shows skeleton loaders forever
- No data loads

### Solutions

#### Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors (red text)
4. Common errors:
   - "RLS policy violation" → Check Supabase RLS policies
   - "Network error" → Check `.env` file has correct Supabase URL
   - "Timeout" → Supabase might be slow or down

#### Verify Supabase Connection
```javascript
// Run in browser console
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
```

#### Check RLS Policies
Run `supabase/schema.sql` again to ensure all policies are created.

---

## Issue 7: "Already Voted" Error

### Symptoms
- Cannot vote again
- Shows "You have already voted"

### Solutions

#### Check Vote Status
```sql
SELECT 
  vr.status,
  u.email,
  p.title as poll_title,
  e.title as election_title
FROM voter_registrations vr
JOIN users u ON u.id = vr.user_id
JOIN polls p ON p.id = vr.poll_id
JOIN elections e ON e.id = p.election_id
WHERE u.email = 'your_email@example.com';
```

#### Reset Vote Status (Testing Only!)
```sql
-- WARNING: Only use for testing!
UPDATE voter_registrations 
SET status = 'registered'
WHERE user_id = (SELECT id FROM users WHERE email = 'your_email@example.com');
```

---

## Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| Creator showing as Voter | Run approval SQL or use admin dashboard |
| Election not active | Set `status='active'` in database |
| Cannot register | Extend deadline or increase max_voters |
| Secret ID invalid | Check database or regenerate |
| No admin access | Update user role to 'admin' |
| Blank dashboard | Check console errors and Supabase connection |
| Already voted | Reset registration status (testing only) |

---

## Getting Help

1. **Check Browser Console** (F12 → Console tab)
2. **Check Supabase Logs** (Supabase Dashboard → Logs)
3. **Run Debug SQL** (Use `debug_roles.sql`)
4. **Clear Cache** (Logout → Clear cache → Login)

---

## Useful SQL Queries

### See Everything
```sql
-- All users
SELECT * FROM users ORDER BY created_at DESC;

-- All elections
SELECT * FROM elections ORDER BY created_at DESC;

-- All creator requests
SELECT * FROM creator_requests ORDER BY created_at DESC;

-- All registrations
SELECT * FROM voter_registrations ORDER BY created_at DESC;

-- All votes
SELECT * FROM votes ORDER BY created_at DESC;
```

### Reset Everything (Testing Only!)
```sql
-- WARNING: This deletes all data!
TRUNCATE votes, voter_registrations, secret_ids, candidates, polls, elections, creator_requests CASCADE;
```

---

**Need more help? Check the browser console for specific error messages!**
