# 🗳️ Complete Election System Workflow

## Overview
Yeh document complete election system ka step-by-step workflow explain karta hai - Admin se lekar Voter tak.

---

## 👤 1. SUPER ADMIN — Platform Owner

### Initial Setup
```
Platform Launch
    ↓
Admin user pre-configured (manually set role='admin' in database)
    ↓
Admin logs in → Admin Dashboard
    ↓
Full platform control
```

### Admin Responsibilities
- ✅ Approve/Reject Election Creator requests
- 👥 Manage all users
- 🗳️ View all elections
- 📊 Access audit logs
- 🔔 Send notifications

---

## 🧑‍💼 2. ELECTION CREATOR — Complete Journey

### STEP 1: Signup & Approval Request
```
Creator visits /register
    ↓
Fills signup form (name, email, phone, password)
    ↓
Selects role: "Election Creator"
    ↓
Email verification (if enabled)
    ↓
System automatically creates approval request
    ↓
Status: ⏳ PENDING
```

### STEP 2: Admin Review
```
Admin Dashboard → Approvals tab
    ↓
Admin sees creator request with details
    ↓
Admin clicks: ✅ Approve OR ❌ Reject
    ↓
If APPROVED:
  - User role updated to 'election_creator'
  - Email notification sent (optional)
    ↓
If REJECTED:
  - Request marked as rejected
  - Rejection reason stored
```

### STEP 3: Create Election
```
Approved creator logs in → Creator Dashboard
    ↓
Clicks "Create Election"
    ↓
Fills election form:
  • Title, Description, Category
  • Start Date/Time, End Date/Time
  • Registration Deadline (optional)
  • Max Voters (optional)
    ↓
Saves as DRAFT or Publishes immediately
    ↓
Election appears on Public Landing Page (if published)
```

### STEP 4: Add Candidates
```
Creator Dashboard → My Elections → Manage Candidates
    ↓
System auto-creates "Main Poll" for election
    ↓
Add candidates:
  • Name
  • Designation/Role
  • Manifesto (bio)
  • Photo (optional)
    ↓
Can add multiple candidates per poll
```

### STEP 5: Lock Voter List & Generate Secret IDs
```
When ready to finalize voter list:
    ↓
Creator clicks "Lock Voter List"
    ↓
System:
  1. Sets registration deadline to NOW
  2. Prevents new registrations
  3. Generates Secret IDs for all registered voters
     Format: POLL-XXXX-YYYY
     Masked: ****-XX-YYYY
    ↓
Secret IDs stored in database (hashed)
Voters can see masked version in their dashboard
```

### STEP 6: Start Election
```
Creator clicks "Start Election"
    ↓
Confirmation dialog appears
    ↓
Election status → ACTIVE
    ↓
Countdown timer starts on public page
    ↓
Voters can now cast votes
```

### STEP 7: Monitor & Stop
```
During voting:
  - Creator can view live results
  - Monitor voter turnout
  - Check registration stats
    ↓
When voting period ends (or manually):
    ↓
Creator clicks "Stop Election"
    ↓
Election status → COMPLETED
    ↓
Results permanently locked
Winner declared
```

---

## 🗳️ 3. VOTER — Complete Journey

### STEP 1: Register & Join
```
Voter visits Landing Page (/)
    ↓
Browses available elections
    ↓
Finds interesting election → Clicks "View Details"
    ↓
Election Details Page shows:
  - Description
  - Timeline
  - Candidates
  - Registration status
    ↓
If not logged in:
  - Redirected to /login or /register
    ↓
After login:
  - Clicks "Register to Vote"
    ↓
System checks:
  ✓ Registration deadline not passed?
  ✓ Max voters not reached?
    ↓
If valid:
  - Registration successful
  - Status: REGISTERED
```

### STEP 2: Receive Secret ID
```
When creator locks voter list:
    ↓
System generates unique Secret ID for voter
Format: POLL-A7B2-K9M4
    ↓
Secret ID visible in Voter Dashboard
Displayed as: ****-B2-K9M4 (masked)
    ↓
⚠️ IMPORTANT: Voter must save this ID
Used for anonymous voting
```

### STEP 3: Cast Vote
```
Election starts → Status: ACTIVE
    ↓
Voter Dashboard shows "Vote Now" button
    ↓
Clicks button → Voting Page
    ↓
STEP 3A: Select Candidates
  - Reviews all candidates
  - Selects one candidate per ballot
  - Clicks "Review & Proceed"
    ↓
STEP 3B: Enter Secret ID
  - Secure verification screen
  - Enters Secret Voter ID
  - System validates:
    ✓ ID exists in database?
    ✓ Belongs to this election?
    ✓ Not already voted?
    ↓
STEP 3C: Submit Vote
  - Confirmation dialog
  - Clicks "Cast Anonymous Vote"
    ↓
System:
  1. Records vote (NO user_id stored)
  2. Updates registration status → VOTED
  3. Vote button permanently disabled
    ↓
Success screen: "Vote Cast Successfully ✓"
```

### STEP 4: View Results
```
During or after voting:
    ↓
Voter visits Results Page
    ↓
Live results displayed:
  • Bar charts
  • Percentage breakdown
  • Current leader
  • Total turnout
    ↓
Updates every 10 seconds (real-time polling)
    ↓
After election ends:
  - Final results locked
  - Winner declared 🏆
```

---

## 📊 4. LIVE RESULTS — Public Access

### Real-Time Updates
```
Anyone can view results (no login required)
    ↓
Results Page: /elections/:id/results
    ↓
Shows:
  • Vote count per candidate
  • Percentage distribution
  • Visual charts (Bar + Pie)
  • Current leader badge
  • Total votes cast
  • Turnout percentage
    ↓
Auto-refreshes every 10 seconds
    ↓
When election ends:
  - Results permanently locked
  - Winner highlighted
  - Audit trail preserved
```

---

## 🔄 COMPLETE FLOW DIAGRAM

```
┌─────────────────────────────────────────────┐
│                                             │
│  1. ADMIN                                   │
│     Platform setup → Approve creators       │
│            │                                │
│            ▼                                │
│  2. CREATOR                                 │
│     Signup → Approval → Create Election     │
│     Add Candidates → Publish                │
│            │                                │
│            ▼                                │
│  3. PUBLIC LANDING PAGE                     │
│     Elections visible → Voters browse       │
│            │                                │
│            ▼                                │
│  4. VOTER REGISTRATION                      │
│     Voters join elections                   │
│            │                                │
│            ▼                                │
│  5. LOCK VOTER LIST                         │
│     Creator locks list                      │
│     Secret IDs generated & emailed          │
│            │                                │
│            ▼                                │
│  6. START ELECTION                          │
│     Creator clicks "Start"                  │
│     Countdown timer begins ⏱️               │
│            │                                │
│            ▼                                │
│  7. VOTING PHASE                            │
│     Voters enter Secret ID → Cast vote      │
│     Anonymous recording                     │
│            │                                │
│            ▼                                │
│  8. LIVE RESULTS                            │
│     Real-time updates visible to all        │
│            │                                │
│            ▼                                │
│  9. ELECTION END                            │
│     Auto-close or manual stop               │
│     Winner declared 🏆                      │
│     Results locked forever                  │
│     Audit logs preserved                    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔐 Security Features

### At Every Step:

1. **Signup/Login**
   - Email verification
   - Password strength validation
   - JWT session management

2. **Voter Registration**
   - Duplicate check (one registration per poll)
   - Max voter capacity enforcement
   - Deadline validation

3. **Secret ID System**
   - Cryptographically generated
   - Hashed in database
   - Masked display (****-XX-YY)
   - Separates identity from vote

4. **Vote Casting**
   - Secret ID validation required
   - One-time voting enforced
   - Anonymous storage (no user_id)
   - Double-vote prevention

5. **Results**
   - Tamper-proof after completion
   - Audit logs for all actions
   - Row Level Security (RLS) policies

---

## 📝 Key Database Tables

| Table | Purpose |
|-------|---------|
| `users` | All user accounts with roles |
| `creator_requests` | Approval workflow for creators |
| `elections` | Election metadata & timeline |
| `polls` | Ballots within elections |
| `candidates` | Candidates per poll |
| `voter_registrations` | Who registered for which poll |
| `secret_ids` | Cryptographic voter IDs |
| `votes` | Anonymous vote records |
| `audit_logs` | Immutable action history |
| `notifications` | User notifications |

---

## 🎯 Success Criteria

✅ Admin can approve creators  
✅ Creator can create & manage elections  
✅ Voters can register before deadline  
✅ Secret IDs generated automatically  
✅ Voting is anonymous & secure  
✅ Results update in real-time  
✅ Winner declared automatically  
✅ Full audit trail maintained  

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📞 Support

For issues or questions, check:
- README.md for setup instructions
- DATABASE_DEPLOYMENT.md for database schema
- This WORKFLOW.md for process flow

---

**Happy Voting! 🗳️**
