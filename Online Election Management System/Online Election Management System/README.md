# 🗳️ VoteSecure: Online Election Management System

VoteSecure is a complete, production-ready Secure Online Election Management System built with React, Vite, Tailwind CSS v4, and Supabase. It offers a transparent, secure, and modern platform for conducting digital elections with full auditability, role-based access control, and cryptographic security measures.

## ⚡ Quick Fix (If You Have Issues)

If you're facing role or voting issues, run this in Supabase SQL Editor:

```sql
-- See COPY_PASTE_THIS.sql for the complete fix
UPDATE users SET role = 'election_creator', verified = true WHERE name ILIKE '%abdul%';
UPDATE elections SET status = 'active', deadline = NOW() - INTERVAL '1 hour', start_at = NOW(), end_at = NOW() + INTERVAL '7 days' WHERE title ILIKE '%student%';
```

Then clear browser cache: `localStorage.clear()` in console (F12).

---

## 🚀 Features by Module

### 🔐 Authentication & Authorization
- Full JWT authentication via Supabase
- Role-based access control (Admin, Creator, Voter)
- Email verification support
- Password reset functionality
- Secure session management

### 👨‍💼 Admin Dashboard
1. **Creator Approval System**
   - Review creator registration requests
   - Approve/Reject with one click
   - Automatic role assignment on approval
   - Request history tracking

2. **User Management**
   - View all registered users
   - Filter by role
   - User activity monitoring

3. **Election Oversight**
   - View all elections across platform
   - Monitor election status
   - Access detailed analytics

4. **Audit Logs**
   - Immutable action history
   - Track all sensitive operations
   - Compliance & transparency

### 🗳️ Election Creator Dashboard
1. **Election Creation**
   - Custom timelines (start/end dates)
   - Registration deadlines
   - Voter capacity limits
   - Category classification
   - Draft & publish workflow

2. **Candidate Management**
   - Add/remove candidates
   - Upload photos & manifestos
   - Multiple polls per election
   - Candidate profiles

3. **Voter List Control**
   - Lock voter list before election
   - Automatic Secret ID generation
   - Prevent late registrations
   - Capacity management

4. **Election Controls**
   - Start election manually
   - Stop election manually
   - Real-time monitoring
   - Status transitions

5. **Results & Analytics**
   - Live vote counting
   - Turnout statistics
   - Winner declaration
   - Detailed breakdowns

### 🗳️ Voter Dashboard
1. **Election Discovery**
   - Browse active elections
   - Filter by category
   - View election details
   - Registration status

2. **Registration**
   - One-click registration
   - Deadline validation
   - Capacity checking
   - Confirmation notifications

3. **Secret Voter ID**
   - Unique cryptographic ID
   - Masked display (****-XX-YY)
   - Secure storage
   - Anonymous voting key

4. **Voting Interface**
   - Review all candidates
   - Select choices
   - Secret ID verification
   - Anonymous vote casting
   - Confirmation screen

5. **Results Tracking**
   - View live results
   - Track voting history
   - See election outcomes

### 🌐 Public Features
1. **Landing Page**
   - Beautiful election catalog
   - Category filters
   - Status indicators
   - Search functionality

2. **Election Details**
   - Full election information
   - Candidate profiles
   - Timeline visualization
   - Registration button

3. **Live Results**
   - Real-time vote counts
   - Visual charts (Bar & Pie)
   - Percentage breakdowns
   - Current leader badge
   - Auto-refresh every 10 seconds

### 🔒 Security Features
1. **Anonymous Voting**
   - Secret ID system
   - No user_id in votes table
   - Identity separation
   - Cryptographic hashing

2. **Double-Vote Prevention**
   - Status tracking
   - Secret ID validation
   - Database constraints
   - Real-time checks

3. **Row Level Security (RLS)**
   - PostgreSQL policies
   - Zero-trust architecture
   - Role-based data access
   - Automatic enforcement

4. **Audit Trail**
   - Immutable logs
   - Action tracking
   - Timestamp records
   - Compliance ready

## 💻 Technology Stack

- **Frontend:** React 18, Vite, React Router v6
- **Styling:** Tailwind CSS v4, Framer Motion, Lucide React
- **Data Fetching:** Supabase JS Client
- **Charts:** Recharts
- **Backend/Database:** Supabase (PostgreSQL, Auth, RLS)

## 🛠️ Setup Instructions

### 1. Supabase Backend Setup
1. Create a new project on [Supabase](https://supabase.com).
2. Navigate to the **SQL Editor** in your Supabase dashboard.
3. Copy the entire contents of `supabase/schema.sql` and run it. This will create all tables, configure foreign keys, and set up the Row Level Security (RLS) policies.
4. Go to Project Settings -> API and copy your `Project URL` and `anon public key`.
5. **Important:** Go to Authentication -> Email Templates and disable email confirmation for testing (or configure SMTP for production).

### 2. Frontend Local Setup
1. Clone the repository.
2. Run `npm install` to install all dependencies.
3. Create a `.env` file in the root directory based on `.env.example`:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run `npm run dev` to start the local development server.
5. Open `http://localhost:5173` in your browser.

### 3. Create Admin User (First Time Setup)
1. Register a new user through the UI.
2. Go to Supabase Dashboard -> Table Editor -> `users` table.
3. Find your user and change the `role` column to `admin`.
4. Refresh the app and you'll have admin access.

### 4. Create Your First Election

**Option A: Via SQL (Quick)**
```sql
-- Run this in Supabase SQL Editor
INSERT INTO public.elections (id, creator_id, title, description, category, start_at, end_at, status, max_voters)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1),
  'Student Council Election 2025',
  'Annual election for student council',
  'Student Council',
  NOW(),
  NOW() + INTERVAL '7 days',
  'published',
  500
);

INSERT INTO public.polls (id, election_id, title)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM public.elections ORDER BY created_at DESC LIMIT 1),
  'Presidential Ballot'
);

INSERT INTO public.candidates (poll_id, name, designation)
VALUES
  ((SELECT id FROM public.polls ORDER BY created_at DESC LIMIT 1), 'Alice Johnson', 'Engineering'),
  ((SELECT id FROM public.polls ORDER BY created_at DESC LIMIT 1), 'Bob Smith', 'Arts'),
  ((SELECT id FROM public.polls ORDER BY created_at DESC LIMIT 1), 'Charlie Brown', 'Business');
```

**Option B: Via UI**
1. Login as admin
2. Go to Admin Dashboard → Elections → Create Election
3. Fill form and publish
4. Add candidates via "Manage Candidates"

### 5. Complete Workflow Test
1. **As Admin:** Approve creator requests from the Admin Dashboard.
2. **As Creator:** Create an election, add candidates, lock voter list, and start the election.
3. **As Voter:** Register for the election, receive Secret ID, and cast your vote.
4. **View Results:** Check live results on the results page (updates every 10 seconds).

## 🌐 Deployment (Vercel)

1. Push your code to a public GitHub repository.
2. Go to [Vercel](https://vercel.com) and click "Add New Project".
3. Import your GitHub repository.
4. In the Environment Variables section, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**. Vercel will automatically detect the Vite React configuration and build the app.

## 📚 Documentation

- **QUICKSTART.md** - 5-minute setup guide
- **TROUBLESHOOTING.md** - Common issues and solutions
- **COPY_PASTE_THIS.sql** - Quick database fix (run in Supabase SQL Editor)
- **docs/WORKFLOW.md** - Complete user workflow
- **IMPLEMENTATION_SUMMARY.md** - Technical implementation details
- **docs/WORKFLOW.md** - Complete system workflow
- **docs/DATABASE_DEPLOYMENT.md** - Database schema details
- **IMPLEMENTATION_SUMMARY.md** - Technical implementation details

## 🔄 Complete Workflow

```
Admin → Approve Creator → Creator Creates Election → Add Candidates 
→ Lock Voter List → Generate Secret IDs → Start Election 
→ Voters Cast Votes → Live Results → Stop Election → Winner Declared
```

For detailed step-by-step workflow, see **docs/WORKFLOW.md**.

## 🎨 UI/UX Design

The application utilizes a premium "glassmorphism" design aesthetic:
- **Color Palette:** Deep Blue (`#1e3a8a`) primary, Teal (`#0d9488`) accent, with custom subtle gradients.
- **Typography:** `Inter` for standard text and `Poppins` for dynamic headers.
- **Animations:** Smooth page transitions, animated countdown timers, flip clocks, and pulse effects.
- **Mobile First:** The application is fully responsive via a collapsible sidebar and hamburger navigation.

## 🧪 Testing

### Quick Test (5 minutes)
Follow the **QUICKSTART.md** guide for a complete walkthrough.

### Manual Testing Checklist
1. ✅ Register as Election Creator
2. ✅ Admin approves creator
3. ✅ Creator creates election
4. ✅ Creator adds candidates
5. ✅ Voter registers for election
6. ✅ Creator locks voter list
7. ✅ Secret IDs generated
8. ✅ Creator starts election
9. ✅ Voter casts vote
10. ✅ Results update live
11. ✅ Creator stops election
12. ✅ Results locked

### Test Accounts
After setup, create these test accounts:
- **Admin:** admin@test.com / Admin@123
- **Creator:** creator@test.com / Creator@123
- **Voter:** voter@test.com / Voter@123

To test the role-based system locally without requiring an email confirmation first (if you disabled email confirmations in Supabase):
1. Register a new user and select the **Admin** or **Election Creator** role.
2. In Supabase, you can manually toggle the `verified` flag or promote a user to `super_admin` in the `users` table.

## 🐛 Troubleshooting

### Issue: No elections showing on Elections page
**Cause:** Database is empty, no elections created yet  
**Solution:** 
- Run the SQL script in Setup step 4 (Option A)
- Or create election via UI (Option A)
- Refresh browser after creating

### Issue: Loading screen stuck
**Cause:** Supabase connection issue or timeout  
**Solution:**
- Check `.env` file has correct credentials
- Verify Supabase project is active
- Check browser console for errors
- Hard refresh: Ctrl + Shift + R

### Issue: Logout not working
**Cause:** Already fixed in latest version  
**Solution:** 
- Clear browser cache
- Hard refresh page
- Check if using latest code

### Issue: Blank dashboard with skeleton loaders
**Cause:** Data loading issue (already fixed)  
**Solution:**
- Check browser console for errors
- Verify user is logged in
- Check database has data
- Refresh page

### Issue: "Profile not found" error
**Cause:** User exists in auth but not in users table  
**Solution:**
- System auto-creates profile now
- If still failing, manually insert in users table
- Or re-register

### Common Commands

**Check Database:**
```sql
-- Count elections
SELECT COUNT(*) FROM public.elections;

-- List elections
SELECT id, title, status FROM public.elections;

-- Check users
SELECT id, name, email, role FROM public.users;
```

**Clear Browser Data:**
- Press F12 → Application → Clear Storage
- Or Ctrl + Shift + Delete
