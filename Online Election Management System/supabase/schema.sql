-- ==========================================
-- VoteSecure Supabase Database Schema
-- ==========================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing tables to avoid "relation already exists" errors
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.secret_ids CASCADE;
DROP TABLE IF EXISTS public.voter_registrations CASCADE;
DROP TABLE IF EXISTS public.candidates CASCADE;
DROP TABLE IF EXISTS public.polls CASCADE;
DROP TABLE IF EXISTS public.elections CASCADE;
DROP TABLE IF EXISTS public.creator_requests CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Users Table (Extends Supabase Auth)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'voter' CHECK (role IN ('super_admin', 'admin', 'election_creator', 'voter')),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keep public.users in sync with Supabase Auth signups.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, email, phone, role, verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    'voter',
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(public.users.name, EXCLUDED.name),
    phone = COALESCE(public.users.phone, EXCLUDED.phone);

  IF NEW.raw_user_meta_data->>'requested_role' = 'election_creator' THEN
    INSERT INTO public.creator_requests (user_id, purpose, organization, status)
    SELECT NEW.id, 'Election management and organization', 'Pending verification', 'pending'
    WHERE EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'creator_requests'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.creator_requests WHERE user_id = NEW.id AND status = 'pending'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check admin status securely without infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can update all users" ON public.users FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);


-- 2. Creator Requests
CREATE TABLE public.creator_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  organization TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.creator_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own requests" ON public.creator_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create requests" ON public.creator_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage requests" ON public.creator_requests FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());


-- 3. Elections
CREATE TABLE public.elections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Other',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  deadline TIMESTAMPTZ,
  max_voters INTEGER,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT end_after_start CHECK (end_at > start_at),
  CONSTRAINT deadline_before_start CHECK (deadline IS NULL OR deadline < start_at)
);
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published elections" ON public.elections FOR SELECT USING (status != 'draft');
CREATE POLICY "Creators can view their own elections" ON public.elections FOR SELECT USING (creator_id = auth.uid());
CREATE POLICY "Creators can manage their own elections" ON public.elections FOR ALL USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Admins can view all elections" ON public.elections FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage all elections" ON public.elections FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());


-- 4. Polls (Multiple polls per election)
CREATE TABLE public.polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID REFERENCES public.elections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view polls for published elections" ON public.polls FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.elections e WHERE e.id = election_id AND e.status != 'draft')
);
CREATE POLICY "Creators can manage their own polls" ON public.polls FOR ALL USING (
  EXISTS (SELECT 1 FROM public.elections e WHERE e.id = election_id AND e.creator_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.elections e WHERE e.id = election_id AND e.creator_id = auth.uid())
);
CREATE POLICY "Admins can manage all polls" ON public.polls FOR ALL USING (
  public.is_admin()
) WITH CHECK (
  public.is_admin()
);


-- 5. Candidates
CREATE TABLE public.candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT,
  designation TEXT,
  manifesto TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view candidates" ON public.candidates FOR SELECT USING (true);
CREATE POLICY "Creators can manage candidates" ON public.candidates FOR ALL USING (
  EXISTS (SELECT 1 FROM public.polls p JOIN public.elections e ON p.election_id = e.id WHERE p.id = poll_id AND e.creator_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.polls p JOIN public.elections e ON p.election_id = e.id WHERE p.id = poll_id AND e.creator_id = auth.uid())
);
CREATE POLICY "Admins can manage all candidates" ON public.candidates FOR ALL USING (
  public.is_admin()
) WITH CHECK (
  public.is_admin()
);


-- 6. Voter Registrations
CREATE TABLE public.voter_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'waitlisted', 'voted', 'rejected')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);
ALTER TABLE public.voter_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own registrations" ON public.voter_registrations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can register themselves" ON public.voter_registrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own registrations" ON public.voter_registrations FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Creators can view registrations for their polls" ON public.voter_registrations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.polls p JOIN public.elections e ON p.election_id = e.id WHERE p.id = poll_id AND e.creator_id = auth.uid())
);
CREATE POLICY "Creators can manage registrations for their polls" ON public.voter_registrations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.polls p JOIN public.elections e ON p.election_id = e.id WHERE p.id = poll_id AND e.creator_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.polls p JOIN public.elections e ON p.election_id = e.id WHERE p.id = poll_id AND e.creator_id = auth.uid())
);
CREATE POLICY "Admins can manage all registrations" ON public.voter_registrations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());


-- 7. Secret IDs (Emailed to user, hashed here)
CREATE TABLE public.secret_ids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  hashed_secret TEXT NOT NULL,
  masked_secret TEXT NOT NULL, -- To show the user e.g. ****0001
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);
ALTER TABLE public.secret_ids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own secret ID metadata" ON public.secret_ids FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own secret IDs" ON public.secret_ids FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Creators can manage secret IDs for their polls" ON public.secret_ids FOR ALL USING (
  EXISTS (SELECT 1 FROM public.polls p JOIN public.elections e ON p.election_id = e.id WHERE p.id = poll_id AND e.creator_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.polls p JOIN public.elections e ON p.election_id = e.id WHERE p.id = poll_id AND e.creator_id = auth.uid())
);
CREATE POLICY "Admins can manage all secret IDs" ON public.secret_ids FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());


-- 8. Votes (Anonymous, no user_id)
CREATE TABLE public.votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  voted_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view aggregate votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert votes securely" ON public.votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- Logic to prevent double voting must be enforced in the Edge Function that inserts the vote and updates voter_registrations.status to 'voted'

-- Create a view for vote counting (makes results queries faster)
CREATE OR REPLACE VIEW public.vote_counts AS
SELECT 
  candidate_id,
  COUNT(*) as vote_count
FROM public.votes
GROUP BY candidate_id;

-- Atomic vote casting RPC used by the frontend.
CREATE OR REPLACE FUNCTION public.cast_vote(
  p_election_id UUID,
  p_secret_code TEXT,
  p_choices JSONB
)
RETURNS void AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_secret_poll_id UUID;
  v_choice JSONB;
  v_poll_id UUID;
  v_candidate_id UUID;
  v_registration_status TEXT;
  v_choice_count INTEGER;
  v_distinct_poll_count INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF p_choices IS NULL OR jsonb_typeof(p_choices) <> 'array' OR jsonb_array_length(p_choices) = 0 THEN
    RAISE EXCEPTION 'At least one ballot selection is required.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.elections
    WHERE id = p_election_id
      AND status IN ('published', 'active')
      AND NOW() >= start_at
      AND NOW() <= end_at
  ) THEN
    RAISE EXCEPTION 'This election is not currently active.';
  END IF;

  SELECT s.poll_id INTO v_secret_poll_id
  FROM public.secret_ids s
  JOIN public.polls p ON p.id = s.poll_id
  WHERE s.user_id = v_user_id
    AND p.election_id = p_election_id
    AND UPPER(s.hashed_secret) = UPPER(TRIM(p_secret_code))
  LIMIT 1;

  IF v_secret_poll_id IS NULL THEN
    RAISE EXCEPTION 'Invalid Secret Voter ID.';
  END IF;

  SELECT COUNT(*), COUNT(DISTINCT choice_item->>'poll_id')
  INTO v_choice_count, v_distinct_poll_count
  FROM jsonb_array_elements(p_choices) AS choice_item;

  IF v_choice_count <> v_distinct_poll_count THEN
    RAISE EXCEPTION 'Only one candidate can be selected per ballot.';
  END IF;

  FOR v_choice IN SELECT * FROM jsonb_array_elements(p_choices)
  LOOP
    v_poll_id := (v_choice->>'poll_id')::UUID;
    v_candidate_id := (v_choice->>'candidate_id')::UUID;

    IF NOT EXISTS (
      SELECT 1 FROM public.polls
      WHERE id = v_poll_id AND election_id = p_election_id
    ) THEN
      RAISE EXCEPTION 'Invalid ballot selected.';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.candidates
      WHERE id = v_candidate_id AND poll_id = v_poll_id
    ) THEN
      RAISE EXCEPTION 'Invalid candidate selected.';
    END IF;

    SELECT status INTO v_registration_status
    FROM public.voter_registrations
    WHERE poll_id = v_poll_id AND user_id = v_user_id
    FOR UPDATE;

    IF v_registration_status IS NULL THEN
      RAISE EXCEPTION 'You are not registered for every ballot in this election.';
    END IF;

    IF v_registration_status = 'voted' THEN
      RAISE EXCEPTION 'You have already voted in this election.';
    END IF;

    IF v_registration_status <> 'registered' THEN
      RAISE EXCEPTION 'Your voter registration is not eligible for voting.';
    END IF;
  END LOOP;

  INSERT INTO public.votes (poll_id, candidate_id)
  SELECT
    (choice_item->>'poll_id')::UUID,
    (choice_item->>'candidate_id')::UUID
  FROM jsonb_array_elements(p_choices) AS choice_item;

  UPDATE public.voter_registrations
  SET status = 'voted'
  WHERE user_id = v_user_id
    AND poll_id IN (
      SELECT (choice_item->>'poll_id')::UUID
      FROM jsonb_array_elements(p_choices) AS choice_item
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.cast_vote(UUID, TEXT, JSONB) TO authenticated;



-- 9. Audit Logs
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  target_id UUID,
  details_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs FOR SELECT USING (
  public.is_admin()
);
CREATE POLICY "Authenticated users can create audit logs" ON public.audit_logs FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (actor_id = auth.uid() OR public.is_admin())
);
-- Logs usually inserted via triggers or edge functions with elevated privileges

-- 10. Notifications
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT WITH CHECK (public.is_admin());

-- Notify election creator whenever a voter registers for an election.
CREATE OR REPLACE FUNCTION public.notify_creator_on_registration()
RETURNS trigger AS $$
DECLARE
  v_election_id UUID;
  v_creator_id UUID;
  v_election_title TEXT;
  v_voter_name TEXT;
  v_registration_count INTEGER;
BEGIN
  SELECT p.election_id INTO v_election_id
  FROM public.polls p
  WHERE p.id = NEW.poll_id;

  IF v_election_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- One notification per voter per election (not one per ballot).
  SELECT COUNT(*)
  INTO v_registration_count
  FROM public.voter_registrations vr
  JOIN public.polls p ON p.id = vr.poll_id
  WHERE vr.user_id = NEW.user_id
    AND p.election_id = v_election_id;

  IF v_registration_count > 1 THEN
    RETURN NEW;
  END IF;

  SELECT e.creator_id, e.title
  INTO v_creator_id, v_election_title
  FROM public.elections e
  WHERE e.id = v_election_id;

  IF v_creator_id IS NULL OR v_creator_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(u.name, u.email, 'A voter')
  INTO v_voter_name
  FROM public.users u
  WHERE u.id = NEW.user_id;

  INSERT INTO public.notifications (user_id, type, message, status)
  VALUES (
    v_creator_id,
    'voter_registration',
    format('%s registered for "%s".', COALESCE(v_voter_name, 'A voter'), COALESCE(v_election_title, 'your election')),
    'unread'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_creator_on_registration ON public.voter_registrations;
CREATE TRIGGER trg_notify_creator_on_registration
  AFTER INSERT ON public.voter_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_creator_on_registration();

-- Candidate photo storage bucket and policies.
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-photos', 'candidate-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view candidate photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload candidate photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update candidate photos" ON storage.objects;

CREATE POLICY "Anyone can view candidate photos" ON storage.objects FOR SELECT USING (
  bucket_id = 'candidate-photos'
);

CREATE POLICY "Authenticated users can upload candidate photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'candidate-photos' AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update candidate photos" ON storage.objects FOR UPDATE
USING (
  bucket_id = 'candidate-photos' AND auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'candidate-photos' AND auth.role() = 'authenticated'
);
