# ⚡ Quick Start Guide

Yeh guide aapko 5 minutes mein pura system setup karke running state mein le aayegi.

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- Git (optional)

---

## 🚀 Step 1: Supabase Setup (2 minutes)

1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Name: `election-system`
   - Database Password: (save this!)
   - Region: Choose closest to you
   - Wait for project to initialize (~2 min)

2. **Run Database Schema**
   - Open your project
   - Go to **SQL Editor** (left sidebar)
   - Click "New Query"
   - Copy entire content from `supabase/schema.sql`
   - Paste and click "Run"
   - ✅ You should see "Success. No rows returned"

3. **Disable Email Confirmation (for testing)**
   - Go to **Authentication** → **Providers**
   - Click on **Email**
   - Scroll down to "Confirm email"
   - Toggle OFF
   - Click "Save"

4. **Get API Keys**
   - Go to **Project Settings** (gear icon)
   - Click **API**
   - Copy:
     - `Project URL`
     - `anon public` key

---

## 💻 Step 2: Frontend Setup (1 minute)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Open `.env` file (already exists)
   - Replace with your values:
   ```env
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   - Open browser: `http://localhost:5173`

---

## 👤 Step 3: Create Admin User (1 minute)

1. **Register First User**
   - Click "Create Account"
   - Fill form:
     - Name: Admin User
     - Email: admin@test.com
     - Phone: +1234567890
     - Password: Admin@123
     - Role: **Voter** (we'll change this)
   - Click "Create Account"
   - You'll see success message

2. **Promote to Admin**
   - Go back to Supabase Dashboard
   - Click **Table Editor** (left sidebar)
   - Select `users` table
   - Find your user (admin@test.com)
   - Click on the row
   - Change `role` from `voter` to `admin`
   - Click "Save"

3. **Login as Admin**
   - Go back to app
   - Login with: admin@test.com / Admin@123
   - You'll be redirected to Admin Dashboard 🎉

---

## 🧪 Step 4: Test Complete Workflow (5 minutes)

### A. Create Election Creator

1. **Register Creator Account**
   - Logout (top right)
   - Register new user:
     - Name: John Creator
     - Email: creator@test.com
     - Password: Creator@123
     - Role: **Election Creator**
   - Login with creator@test.com

2. **Approve Creator (as Admin)**
   - Logout
   - Login as admin@test.com
   - Go to **Admin Dashboard** → **Approvals**
   - You'll see John Creator's request
   - Click ✅ Approve
   - Logout

### B. Create Election

3. **Create Election (as Creator)**
   - Login as creator@test.com
   - Click "Create Election"
   - Fill form:
     - Title: "Test Student Election"
     - Description: "Testing the system"
     - Category: Student Council
     - Start: (today, 1 hour from now)
     - End: (tomorrow)
     - Max Voters: 100
   - Click "Publish Election"

4. **Add Candidates**
   - Click on your election
   - Click "Manage Candidates"
   - Add 2-3 candidates:
     - Candidate 1: Alice Johnson, President
     - Candidate 2: Bob Smith, President
     - Candidate 3: Charlie Brown, President
   - Click "Add Candidate" for each

### C. Register as Voter

5. **Register Voter Account**
   - Logout
   - Register new user:
     - Name: Voter One
     - Email: voter@test.com
     - Password: Voter@123
     - Role: **Voter**
   - Login with voter@test.com

6. **Register for Election**
   - Go to "Elections" (top menu)
   - Click on "Test Student Election"
   - Click "Register to Vote"
   - ✅ Success! You're registered

### D. Lock & Start Election

7. **Lock Voter List (as Creator)**
   - Logout
   - Login as creator@test.com
   - Go to "My Elections" → "Manage Candidates"
   - Click "Lock Voter List"
   - Confirm
   - ✅ Secret IDs generated!

8. **Start Election**
   - Click "Start Election" (green button)
   - Confirm
   - ✅ Election is now ACTIVE

### E. Cast Vote

9. **Vote (as Voter)**
   - Logout
   - Login as voter@test.com
   - Go to **Voter Dashboard**
   - You'll see your Secret ID: `****-XX-YYYY`
   - Copy the full ID (hover to see)
   - Click "Vote Now" on your election
   - Select a candidate
   - Click "Review & Proceed"
   - Enter your Secret ID
   - Click "Cast Anonymous Vote"
   - ✅ Vote submitted!

### F. View Results

10. **Check Live Results**
    - Go to "Elections" → Your election
    - Click "View Live Results"
    - You'll see:
      - Vote count
      - Percentage
      - Charts
      - Current leader
    - Results update every 10 seconds!

---

## 🎉 Success!

Aapne successfully:
- ✅ Admin account banaya
- ✅ Creator ko approve kiya
- ✅ Election create kiya
- ✅ Candidates add kiye
- ✅ Voter register kiya
- ✅ Secret ID generate kiya
- ✅ Vote cast kiya
- ✅ Live results dekhe

---

## 🔧 Common Issues

### Issue: "Failed to load elections"
**Solution:** Check `.env` file has correct Supabase URL and key

### Issue: "Email already registered"
**Solution:** Use different email or delete user from Supabase dashboard

### Issue: "Cannot read properties of null"
**Solution:** Make sure database schema is properly executed

### Issue: "Secret ID not found"
**Solution:** Make sure you clicked "Lock Voter List" before starting election

---

## 📚 Next Steps

- Read `docs/WORKFLOW.md` for detailed process flow
- Check `README.md` for deployment instructions
- Explore `docs/DATABASE_DEPLOYMENT.md` for schema details

---

## 🆘 Need Help?

1. Check browser console for errors (F12)
2. Check Supabase logs (Dashboard → Logs)
3. Verify all tables exist (Table Editor)
4. Make sure RLS policies are enabled

---

**Happy Testing! 🗳️**
