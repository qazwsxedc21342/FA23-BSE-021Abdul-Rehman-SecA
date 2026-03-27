# AdFlow Pro 🚀
**Sponsored Listing Marketplace with Moderation, Scheduling, Payment Verification, Analytics, and External Media Normalization**

---

## Tech Stack
| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 14 (Pages Router)           |
| Backend     | Node.js + Express (ES Modules)      |
| Database    | Supabase (Postgres)                 |
| Auth        | JWT (jsonwebtoken + bcryptjs)       |
| Validation  | Joi                                 |
| Cron Jobs   | node-cron                           |
| Deployment  | Vercel (frontend) + Supabase        |
| UI Library  | Tailwind CSS + Recharts             |

---

## Project Structure
```
adflowpro/
├── database/
│   └── schema.sql              ← Full Postgres schema + seed data
├── server/
│   └── src/
│       ├── index.js            ← Express server entry point
│       ├── db/supabase.js      ← Supabase client singleton
│       ├── middlewares/auth.js ← JWT + RBAC middleware
│       ├── validators/schemas.js ← Joi validation schemas
│       ├── controllers/authController.js
│       ├── services/
│       │   ├── mediaService.js    ← URL normalization (YouTube, image, CDN)
│       │   ├── auditService.js    ← audit_logs + ad_status_history
│       │   ├── rankService.js     ← Rank score formula engine
│       │   └── notificationService.js
│       ├── routes/
│       │   ├── auth.js, ads.js, packages.js
│       │   ├── categories.js, cities.js
│       │   ├── client.js          ← Client dashboard APIs
│       │   ├── moderator.js       ← Moderation queue APIs
│       │   ├── admin.js           ← Admin APIs (payment, publish, users)
│       │   ├── analytics.js       ← KPI + charts data
│       │   ├── questions.js, health.js, cron.js
│       └── cron/
│           ├── jobs.js            ← Publish, expire, reminders, heartbeat
│           └── scheduler.js       ← node-cron schedule definitions
└── client/
    └── src/
        ├── pages/
        │   ├── index.js           ← Home
        │   ├── explore.js         ← Browse + search + filter
        │   ├── ads/[slug].js      ← Ad detail
        │   ├── packages.js        ← Package comparison
        │   ├── login.js, register.js
        │   ├── client/dashboard.js ← Create ad, submit payment, track status
        │   ├── moderator/index.js  ← Review queue
        │   ├── admin/index.js      ← Payment verify, publish, users, audit
        │   └── analytics.js        ← Charts, KPIs, system health
        ├── components/
        │   ├── Navbar.js
        │   └── UI.js              ← AdCard, StatusBadge, StatCard, Spinner...
        ├── features/auth/AuthContext.js ← Global auth state
        └── utils/api.js           ← Axios client + all API functions
```

---

## Setup Instructions

### 1. Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open **SQL Editor** and paste the entire contents of `database/schema.sql`
3. Run it — this creates all 13 tables, indexes, triggers, and seed data
4. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### 2. Backend (Server)

```bash
cd server
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

Your `.env` should look like:
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_KEY=eyJhbG...
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
CRON_SECRET=your-cron-secret-token
```

### 3. Frontend (Client)

```bash
cd client
# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
npm install
npm run dev
```

Visit `http://localhost:3000`

---

## Demo Accounts

Seed these users directly in your Supabase `users` table using SQL, or register via the app and manually change the `role` column:

| Role       | Email              | Password  |
|------------|--------------------|-----------|
| Client     | client@demo.com    | demo123   |
| Moderator  | mod@demo.com       | demo123   |
| Admin      | admin@demo.com     | demo123   |
| Super Admin| super@demo.com     | demo123   |

```sql
-- Run in Supabase SQL Editor after registering accounts:
UPDATE users SET role = 'moderator'  WHERE email = 'mod@demo.com';
UPDATE users SET role = 'admin'      WHERE email = 'admin@demo.com';
UPDATE users SET role = 'superadmin' WHERE email = 'super@demo.com';
```

---

## Ad Lifecycle

```
Draft → Submitted → Under Review → Payment Pending → Payment Submitted
     → Payment Verified → Scheduled → Published → Expired
```

Each transition is logged in:
- `ad_status_history` table (full timeline)
- `audit_logs` table (actor, action, old/new values)
- `notifications` table (in-app alerts for the client)

---

## Rank Score Formula

```js
rankScore = (is_featured ? 50 : 0)
          + (package.weight * 10)       // Basic=10, Standard=20, Premium=30
          + freshnessPoints              // Up to 20, decays over 7 days
          + admin_boost                  // Manual admin adjustment
          + (seller.is_verified ? 5 : 0)
```

---

## Media Normalization

The platform stores **URLs only** — no file uploads. The `mediaService.js` handles:

| URL Type      | Detection                  | Action                              |
|---------------|----------------------------|-------------------------------------|
| YouTube       | Regex on `youtube.com` / `youtu.be` | Extract video ID → generate thumbnail |
| Image URL     | `.jpg`, `.png`, `.webp` etc. | Validate protocol + domain          |
| Cloudinary    | `cloudinary.com` hostname  | Treat as valid image                |
| Other         | Fallback                   | Attempt validation, store as-is     |

Invalid/broken media shows a placeholder in the UI.

---

## REST API Reference

### Public
| Method | Endpoint                  | Description               |
|--------|---------------------------|---------------------------|
| POST   | `/api/auth/register`      | Register new client        |
| POST   | `/api/auth/login`         | Login, receive JWT         |
| GET    | `/api/auth/me`            | Get current user           |
| GET    | `/api/ads`                | Browse active ads (search, filter, sort, paginate) |
| GET    | `/api/ads/:slug`          | Single ad detail           |
| GET    | `/api/packages`           | All active packages        |
| GET    | `/api/categories`         | All active categories      |
| GET    | `/api/cities`             | All active cities          |
| GET    | `/api/questions/random`   | Random learning question   |
| GET    | `/api/health/db`          | DB heartbeat check         |

### Client (JWT required, role: client)
| Method | Endpoint                        | Description                    |
|--------|---------------------------------|--------------------------------|
| GET    | `/api/client/dashboard`         | Summary + ads + notifications  |
| POST   | `/api/client/ads`               | Create ad draft                |
| PATCH  | `/api/client/ads/:id`           | Edit draft                     |
| POST   | `/api/client/ads/:id/submit`    | Submit draft for review        |
| POST   | `/api/client/payments`          | Submit payment proof           |
| GET    | `/api/client/notifications`     | Get + mark notifications read  |

### Moderator (JWT required, role: moderator/admin)
| Method | Endpoint                          | Description                  |
|--------|-----------------------------------|------------------------------|
| GET    | `/api/moderator/review-queue`     | Get submitted ads queue      |
| PATCH  | `/api/moderator/ads/:id/review`   | approve / reject / flag      |

### Admin (JWT required, role: admin/superadmin)
| Method | Endpoint                          | Description                    |
|--------|-----------------------------------|--------------------------------|
| GET    | `/api/admin/payment-queue`        | Pending payments               |
| PATCH  | `/api/admin/payments/:id/verify`  | verify / reject payment        |
| PATCH  | `/api/admin/ads/:id/publish`      | publish / schedule / reject    |
| PATCH  | `/api/admin/ads/:id/feature`      | Toggle featured status         |
| PATCH  | `/api/admin/ads/:id/boost`        | Set admin boost score          |
| GET    | `/api/admin/users`                | All users                      |
| PATCH  | `/api/admin/users/:id/status`     | active / suspended / banned    |
| GET    | `/api/admin/audit-logs`           | Recent audit events            |
| GET    | `/api/analytics/summary`          | KPIs, revenue, moderation stats|

### Cron (x-cron-secret header required)
| Method | Endpoint                        | Description                     |
|--------|---------------------------------|---------------------------------|
| POST   | `/api/cron/publish-scheduled`   | Publish due scheduled ads       |
| POST   | `/api/cron/expire-ads`          | Expire outdated ads             |
| POST   | `/api/cron/expiry-reminders`    | Send 48-hour expiry reminders   |
| POST   | `/api/cron/heartbeat`           | Log DB heartbeat                |

---

## Vercel Deployment

### Backend (as serverless or separate Node server)

1. Push `server/` to a repo
2. Create a new Vercel project, set root to `server/`
3. Add all `.env` values as Environment Variables in Vercel dashboard
4. Add `vercel.json`:
```json
{
  "version": 2,
  "builds": [{ "src": "src/index.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/index.js" }]
}
```

### Frontend

1. Push `client/` to a repo
2. Create a new Vercel project, set root to `client/`
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.vercel.app/api
   ```
4. Deploy

### Cron Jobs on Vercel

Add to `client/vercel.json` or use Vercel Cron (Pro plan):
```json
{
  "crons": [
    { "path": "/api/cron/publish-scheduled", "schedule": "0 * * * *"  },
    { "path": "/api/cron/expire-ads",        "schedule": "0 0 * * *"  },
    { "path": "/api/cron/expiry-reminders",  "schedule": "0 9 * * *"  },
    { "path": "/api/cron/heartbeat",         "schedule": "*/5 * * * *" }
  ]
}
```

Or use Supabase Edge Functions / pg_cron for the scheduler.

---

## Database Tables

| Table               | Purpose                              |
|---------------------|--------------------------------------|
| `users`             | Account + role identity              |
| `seller_profiles`   | Public seller metadata               |
| `packages`          | Basic / Standard / Premium           |
| `categories`        | Listing classification               |
| `cities`            | Location taxonomy                    |
| `ads`               | Main listing record + workflow state |
| `ad_media`          | Normalized external media URLs       |
| `payments`          | Payment proof records                |
| `notifications`     | In-app alerts                        |
| `audit_logs`        | Full traceability                    |
| `ad_status_history` | Per-ad status timeline               |
| `learning_questions`| Keep-alive widget content            |
| `system_health_logs`| Cron + DB monitoring                 |

---

## Grading Checklist

| Criterion             | Implemented                                              |
|-----------------------|----------------------------------------------------------|
| Architecture Design   | ✅ Clean separation: routes/controllers/services/middlewares |
| Database Design       | ✅ 13 normalized tables, indexes, FK constraints, triggers |
| Authentication & RBAC | ✅ JWT + bcrypt, 4 roles, `authorize()` middleware        |
| Workflow Logic        | ✅ Full 9-stage lifecycle, business rules enforced        |
| API Quality           | ✅ 25+ REST endpoints, Joi validation, error handling     |
| Frontend UX           | ✅ Next.js, 10+ pages, responsive, role-protected         |
| Analytics & Automation| ✅ Recharts dashboard, 4 cron jobs, health checks         |
| Code Quality          | ✅ ES Modules, service layer, constants, clear naming     |
| Deployment            | ✅ Vercel + Supabase config documented                    |
| Presentation / Viva   | ✅ See Viva Q&A below                                     |

---

## Viva Q&A Preparation

**Q: Why Supabase Postgres instead of local file storage?**
A: Supabase provides a managed Postgres instance with built-in auth, real-time subscriptions, and an auto-generated REST API. It eliminates server storage management, scales automatically, and the service-role client gives us full control server-side while RLS can protect client-facing queries.

**Q: How does the ad lifecycle protect business logic?**
A: Each state transition is guarded by server-side checks. For example, a payment cannot be submitted unless the ad is in `payment_pending` status. Admins cannot publish without a verified payment. Every transition is logged in `ad_status_history` and `audit_logs`, making the workflow tamper-evident and auditable.

**Q: How is RBAC implemented?**
A: The `authenticate` middleware verifies the JWT and loads the user from the database. The `authorize(...roles)` middleware factory checks `req.user.role` against the allowed roles for that route. Client routes are wrapped with `authorize('client')`, moderator routes with `authorize('moderator','admin','superadmin')`, and so on.

**Q: How are external media URLs validated and normalized?**
A: `mediaService.js` detects the source type using regex (YouTube) or URL parsing (image extension, cloudinary hostname). YouTube URLs have the video ID extracted and a thumbnail URL generated automatically. Image URLs are validated for HTTPS protocol. All results are stored in `ad_media` with `source_type`, `original_url`, `thumbnail_url`, and `validation_status`.

**Q: What happens when an ad reaches its expiry date?**
A: The `expireOutdatedAds` cron job runs daily, queries all `published` ads where `expire_at < NOW()`, sets their status to `expired`, logs the change in `ad_status_history`, and sends a renewal notification to the client. Expired ads are excluded from all public queries by the `status = 'published'` filter.

**Q: How is payment verification modeled?**
A: The `payments` table stores `ad_id`, `amount`, `method`, `transaction_ref` (unique-constrained to prevent duplicates), `sender_name`, `screenshot_url`, and `status`. When admin verifies, `payments.status` → `verified`, `payments.verified_by` and `verified_at` are set, and the associated ad moves to `payment_verified`. All this is wrapped in sequential awaits to maintain consistency.

**Q: How does the ranking formula work?**
A: `rankScore = (featured ? 50 : 0) + (weight * 10) + freshnessPoints + adminBoost + verifiedPoints`. Featured ads jump 50 points. Premium package (weight=3) adds 30 vs Basic (weight=1) adding 10. Freshness gives up to 20 points decaying linearly over 7 days. Admins can manually boost. Verified sellers get 5 extra points.

**Q: What tables support traceability?**
A: `audit_logs` records every significant action (actor, action type, target, old/new values, IP). `ad_status_history` records every status change per ad (previous status, new status, changed_by, note, timestamp). Together they provide a complete audit trail for debugging, compliance, and dispute resolution.

**Q: How would you prevent duplicate ads or fake payments?**
A: The `payments` table has a `UNIQUE` constraint on `transaction_ref`. The API checks for this before inserting. For duplicate ads, you could add a phone-number uniqueness check in `seller_profiles` or implement content similarity scoring using Postgres `pg_trgm` extension for fuzzy matching on titles.

**Q: How would you scale for thousands of listings?**
A: The `rank_score` column is pre-computed and indexed, so public listing queries are fast. Adding Postgres full-text search index on `title` and `description` would handle search at scale. Supabase's connection pooling (via PgBouncer) handles concurrent connections. For further scale: Redis caching for hot listings, CDN for media thumbnails, and database read replicas.
