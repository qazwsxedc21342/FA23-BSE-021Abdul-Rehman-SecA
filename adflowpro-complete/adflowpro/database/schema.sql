-- ============================================================
--  AdFlow Pro  –  Complete Supabase Postgres Schema
-- ============================================================

-- Enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(200) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'client'
                  CHECK (role IN ('client','moderator','admin','superadmin')),
  status        VARCHAR(20)  NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','suspended','banned')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. SELLER PROFILES
-- ─────────────────────────────────────────────
CREATE TABLE seller_profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name  VARCHAR(120),
  business_name VARCHAR(200),
  phone         VARCHAR(30),
  city          VARCHAR(80),
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─────────────────────────────────────────────
-- 3. PACKAGES
-- ─────────────────────────────────────────────
CREATE TABLE packages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(50)  NOT NULL UNIQUE,
  duration_days INT          NOT NULL,
  weight        INT          NOT NULL DEFAULT 1,
  is_featured   BOOLEAN      NOT NULL DEFAULT FALSE,
  price         NUMERIC(10,2) NOT NULL,
  description   TEXT,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. CATEGORIES
-- ─────────────────────────────────────────────
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(80) NOT NULL UNIQUE,
  slug       VARCHAR(80) NOT NULL UNIQUE,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. CITIES
-- ─────────────────────────────────────────────
CREATE TABLE cities (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       VARCHAR(80) NOT NULL UNIQUE,
  slug       VARCHAR(80) NOT NULL UNIQUE,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 6. ADS
-- ─────────────────────────────────────────────
CREATE TABLE ads (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id   UUID REFERENCES packages(id),
  category_id  UUID REFERENCES categories(id),
  city_id      UUID REFERENCES cities(id),
  title        VARCHAR(200) NOT NULL,
  slug         VARCHAR(220) NOT NULL UNIQUE,
  description  TEXT,
  price        VARCHAR(80),
  status       VARCHAR(30) NOT NULL DEFAULT 'draft'
                 CHECK (status IN (
                   'draft','submitted','under_review',
                   'payment_pending','payment_submitted',
                   'payment_verified','scheduled',
                   'published','expired','archived','rejected'
                 )),
  rank_score   INT NOT NULL DEFAULT 0,
  admin_boost  INT NOT NULL DEFAULT 0,
  is_featured  BOOLEAN NOT NULL DEFAULT FALSE,
  publish_at   TIMESTAMPTZ,
  expire_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 7. AD MEDIA
-- ─────────────────────────────────────────────
CREATE TABLE ad_media (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id            UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  source_type      VARCHAR(20) NOT NULL CHECK (source_type IN ('image','youtube','cloudinary','other')),
  original_url     TEXT NOT NULL,
  thumbnail_url    TEXT,
  validation_status VARCHAR(20) NOT NULL DEFAULT 'pending'
                     CHECK (validation_status IN ('pending','valid','invalid')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 8. PAYMENTS
-- ─────────────────────────────────────────────
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id           UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  amount          NUMERIC(10,2) NOT NULL,
  method          VARCHAR(40) NOT NULL,
  transaction_ref VARCHAR(120) NOT NULL,
  sender_name     VARCHAR(120),
  screenshot_url  TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','verified','rejected')),
  verified_by     UUID REFERENCES users(id),
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(transaction_ref)
);

-- ─────────────────────────────────────────────
-- 9. NOTIFICATIONS
-- ─────────────────────────────────────────────
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(20) NOT NULL DEFAULT 'info'
               CHECK (type IN ('info','warning','success','danger')),
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  link       VARCHAR(300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 10. AUDIT LOGS
-- ─────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES users(id),
  action_type VARCHAR(80) NOT NULL,
  target_type VARCHAR(40),
  target_id   UUID,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 11. AD STATUS HISTORY
-- ─────────────────────────────────────────────
CREATE TABLE ad_status_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id           UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  previous_status VARCHAR(30),
  new_status      VARCHAR(30) NOT NULL,
  changed_by      UUID REFERENCES users(id),
  note            TEXT,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 12. LEARNING QUESTIONS
-- ─────────────────────────────────────────────
CREATE TABLE learning_questions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  topic      VARCHAR(80),
  difficulty VARCHAR(20) DEFAULT 'medium'
               CHECK (difficulty IN ('easy','medium','hard')),
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 13. SYSTEM HEALTH LOGS
-- ─────────────────────────────────────────────
CREATE TABLE system_health_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source       VARCHAR(60) NOT NULL,
  response_ms  INT,
  status       VARCHAR(20) NOT NULL CHECK (status IN ('ok','error','timeout')),
  message      TEXT,
  checked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────
CREATE INDEX idx_ads_status       ON ads(status);
CREATE INDEX idx_ads_user         ON ads(user_id);
CREATE INDEX idx_ads_rank         ON ads(rank_score DESC);
CREATE INDEX idx_ads_expire       ON ads(expire_at);
CREATE INDEX idx_ads_publish      ON ads(publish_at);
CREATE INDEX idx_ads_category     ON ads(category_id);
CREATE INDEX idx_ads_city         ON ads(city_id);
CREATE INDEX idx_payments_ref     ON payments(transaction_ref);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_audit_actor      ON audit_logs(actor_id);
CREATE INDEX idx_audit_target     ON audit_logs(target_type, target_id);
CREATE INDEX idx_status_history   ON ad_status_history(ad_id);

-- ─────────────────────────────────────────────
-- FUNCTION: auto update updated_at
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_ads_updated_at
  BEFORE UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────────

-- Packages
INSERT INTO packages (name, duration_days, weight, is_featured, price, description) VALUES
  ('Basic',    7,  1, FALSE, 999,  'Quick 7-day listing, standard visibility'),
  ('Standard', 15, 2, FALSE, 2499, '15-day listing with category priority'),
  ('Premium',  30, 3, TRUE,  4999, '30-day listing, homepage featured, auto-refresh');

-- Categories
INSERT INTO categories (name, slug) VALUES
  ('Electronics',  'electronics'),
  ('Real Estate',  'real-estate'),
  ('Vehicles',     'vehicles'),
  ('Services',     'services'),
  ('Fashion',      'fashion'),
  ('Jobs',         'jobs'),
  ('Furniture',    'furniture'),
  ('Sports',       'sports');

-- Cities
INSERT INTO cities (name, slug) VALUES
  ('Karachi',    'karachi'),
  ('Lahore',     'lahore'),
  ('Islamabad',  'islamabad'),
  ('Rawalpindi', 'rawalpindi'),
  ('Multan',     'multan'),
  ('Faisalabad', 'faisalabad'),
  ('Peshawar',   'peshawar'),
  ('Quetta',     'quetta');

-- Learning Questions
INSERT INTO learning_questions (question, answer, topic, difficulty) VALUES
  ('What does RBAC stand for?', 'Role-Based Access Control — a method of restricting system access based on user roles.', 'Security', 'easy'),
  ('What is a JWT?', 'JSON Web Token — a compact, URL-safe token used for stateless authentication between client and server.', 'Authentication', 'easy'),
  ('What is database normalization?', 'The process of organizing a database to reduce redundancy and improve data integrity by dividing tables and defining relationships.', 'Database', 'medium'),
  ('What is the purpose of an audit log?', 'To maintain a traceable record of all significant actions in a system for debugging, compliance, and accountability.', 'Architecture', 'medium'),
  ('What is a cron job?', 'A time-based job scheduler in Unix-like systems used to run scripts or commands at fixed intervals.', 'Automation', 'easy'),
  ('What does REST stand for?', 'Representational State Transfer — an architectural style for distributed hypermedia systems using HTTP.', 'API', 'easy'),
  ('What is Supabase?', 'An open-source Firebase alternative built on Postgres, offering real-time subscriptions, auth, and a REST/GraphQL API.', 'Database', 'medium'),
  ('What is the difference between authentication and authorization?', 'Authentication verifies who you are; authorization determines what you are allowed to do.', 'Security', 'medium');
