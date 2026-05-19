-- ================================================
-- CommitteeHub - Complete Database Schema
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  cnic TEXT,
  avatar_url TEXT,
  reputation_score INTEGER DEFAULT 100,
  completed_committees_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COMMITTEES
CREATE TABLE IF NOT EXISTS committees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  monthly_amount DECIMAL(12,2) NOT NULL,
  duration_months INTEGER NOT NULL DEFAULT 10,
  max_members INTEGER NOT NULL DEFAULT 10,
  current_members INTEGER DEFAULT 1,
  start_date DATE NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','active','completed','cancelled')),
  rules TEXT,
  payment_deadline INTEGER DEFAULT 5,
  iban TEXT,
  payment_method TEXT DEFAULT 'stripe',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COMMITTEE MEMBERS
CREATE TABLE IF NOT EXISTS committee_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  position INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','removed')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(committee_id, user_id)
);

-- 4. PAYOUT SCHEDULE
CREATE TABLE IF NOT EXISTS payout_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  month_number INTEGER NOT NULL,
  recipient_member_id UUID REFERENCES committee_members(id),
  payout_date DATE,
  payout_amount DECIMAL(12,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES committees(id),
  member_id UUID NOT NULL REFERENCES committee_members(id),
  month_number INTEGER NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','refunded')),
  stripe_payment_intent_id TEXT,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, month_number)
);

-- 6. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id),
  transaction_id TEXT,
  gateway TEXT DEFAULT 'stripe',
  gateway_response JSONB,
  bank_reference TEXT,
  receipt_url TEXT,
  amount DECIMAL(12,2),
  currency TEXT DEFAULT 'pkr',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'system' CHECK (type IN ('payment','committee','member','system')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. REPUTATION LOGS
CREATE TABLE IF NOT EXISTS reputation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. COMMITTEE PROGRESS
CREATE TABLE IF NOT EXISTS committee_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  committee_id UUID NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  current_month INTEGER DEFAULT 1,
  total_collected DECIMAL(12,2) DEFAULT 0,
  next_payout_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INDEXES
-- ================================================
CREATE INDEX IF NOT EXISTS idx_committees_status ON committees(status);
CREATE INDEX IF NOT EXISTS idx_committees_creator ON committees(creator_id);
CREATE INDEX IF NOT EXISTS idx_committee_members_committee ON committee_members(committee_id);
CREATE INDEX IF NOT EXISTS idx_committee_members_user ON committee_members(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_committee ON payments(committee_id);
CREATE INDEX IF NOT EXISTS idx_payments_member ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_schedule_committee ON payout_schedule(committee_id);

-- ================================================
-- FUNCTIONS & TRIGGERS
-- ================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update reputation score
CREATE OR REPLACE FUNCTION update_reputation(user_id UUID, delta INTEGER, reason TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles SET reputation_score = GREATEST(0, reputation_score + delta) WHERE id = user_id;
  INSERT INTO reputation_logs (user_id, delta, reason) VALUES (user_id, delta, reason);
END;
$$;

-- Update committee member count on approval
CREATE OR REPLACE FUNCTION update_member_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE committees SET current_members = current_members + 1 WHERE id = NEW.committee_id;
  ELSIF OLD.status = 'approved' AND NEW.status IN ('rejected','removed') THEN
    UPDATE committees SET current_members = GREATEST(1, current_members - 1) WHERE id = NEW.committee_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_member_status_change ON committee_members;
CREATE TRIGGER on_member_status_change
  AFTER UPDATE ON committee_members
  FOR EACH ROW EXECUTE FUNCTION update_member_count();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_progress ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Committees
CREATE POLICY "Committees viewable by all" ON committees FOR SELECT USING (true);
CREATE POLICY "Authenticated users create committees" ON committees FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creator can update committee" ON committees FOR UPDATE USING (auth.uid() = creator_id);

-- Committee Members
CREATE POLICY "Members viewable by all" ON committee_members FOR SELECT USING (true);
CREATE POLICY "Users can request to join" ON committee_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Creator or self can update membership" ON committee_members FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT creator_id FROM committees WHERE id = committee_id));

-- Payments
CREATE POLICY "Payments viewable by members" ON payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM committee_members WHERE committee_id = payments.committee_id AND user_id = auth.uid()));
CREATE POLICY "Members can create payments" ON payments FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM committee_members WHERE id = member_id));
CREATE POLICY "Members can update own payments" ON payments FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM committee_members WHERE id = member_id));

-- Transactions
CREATE POLICY "Transactions viewable by payment owner" ON transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM payments p JOIN committee_members cm ON cm.id = p.member_id WHERE p.id = payment_id AND cm.user_id = auth.uid()));
CREATE POLICY "Insert transactions" ON transactions FOR INSERT WITH CHECK (true);

-- Payout Schedule
CREATE POLICY "Payout schedule viewable by members" ON payout_schedule FOR SELECT
  USING (EXISTS (SELECT 1 FROM committee_members WHERE committee_id = payout_schedule.committee_id AND user_id = auth.uid()));
CREATE POLICY "Creator can manage payout schedule" ON payout_schedule FOR ALL
  USING (auth.uid() IN (SELECT creator_id FROM committees WHERE id = committee_id));

-- Notifications
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Reputation Logs
CREATE POLICY "Users see own reputation logs" ON reputation_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System inserts reputation logs" ON reputation_logs FOR INSERT WITH CHECK (true);

-- Committee Progress
CREATE POLICY "Members can view progress" ON committee_progress FOR SELECT
  USING (EXISTS (SELECT 1 FROM committee_members WHERE committee_id = committee_progress.committee_id AND user_id = auth.uid()));
CREATE POLICY "Creator manages progress" ON committee_progress FOR ALL
  USING (auth.uid() IN (SELECT creator_id FROM committees WHERE id = committee_id));

-- ================================================
-- REALTIME (enable for live updates)
-- ================================================
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE committee_members;
ALTER PUBLICATION supabase_realtime ADD TABLE committees;

-- ================================================
-- STORAGE BUCKET for avatars
-- ================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Avatar images publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ================================================
-- FIX: Create profiles for existing auth users
-- (Users who signed up before schema was created)
-- ================================================
INSERT INTO profiles (id, full_name, email, reputation_score, completed_committees_count)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'User'),
  email,
  100,
  0
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;
