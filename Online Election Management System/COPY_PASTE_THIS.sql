-- ============================================
-- COPY-PASTE THIS ENTIRE BLOCK
-- Supabase SQL Editor mein paste karo aur Run karo
-- ============================================

-- Fix 1: Abdul ko Election Creator banao
UPDATE users 
SET role = 'election_creator', verified = true 
WHERE name ILIKE '%abdul%';

-- Fix 2: Election dates set karo (Aaj register, Aaj vote)
UPDATE elections 
SET 
  status = 'active',
  deadline = NOW() - INTERVAL '1 hour',    -- Registration 1 hour pehle band ho gayi
  start_at = NOW(),                         -- Voting abhi shuru hui
  end_at = NOW() + INTERVAL '7 days'       -- 7 din baad band hogi
WHERE title ILIKE '%student%';

-- Verify karo sab sahi hai
SELECT '=== USERS ===' as info;
SELECT name, email, role FROM users;

SELECT '=== ELECTIONS ===' as info;
SELECT 
  title,
  status,
  deadline,
  start_at,
  end_at
FROM elections;

-- ============================================
-- Expected Output:
-- UPDATE 1 (user updated)
-- UPDATE 1 (election updated)
-- Abdul with role = 'election_creator'
-- Election with status = 'active'
-- ============================================
