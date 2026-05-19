-- VoteSecure policy and workflow repair script
-- Run this in Supabase SQL Editor for an existing project.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Auth profile sync and safe role helpers
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
    WHERE NOT EXISTS (
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

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop old policies so this script is safe to rerun
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage requests" ON public.creator_requests;
DROP POLICY IF EXISTS "Creators can manage their own elections" ON public.elections;
DROP POLICY IF EXISTS "Admins can view all elections" ON public.elections;
DROP POLICY IF EXISTS "Admins can manage all elections" ON public.elections;
DROP POLICY IF EXISTS "Creators can manage their own polls" ON public.polls;
DROP POLICY IF EXISTS "Admins can manage all polls" ON public.polls;
DROP POLICY IF EXISTS "Creators can manage candidates" ON public.candidates;
DROP POLICY IF EXISTS "Admins can manage all candidates" ON public.candidates;
DROP POLICY IF EXISTS "Users can update their own registrations" ON public.voter_registrations;
DROP POLICY IF EXISTS "Creators can manage registrations for their polls" ON public.voter_registrations;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON public.voter_registrations;
DROP POLICY IF EXISTS "Users can create their own secret IDs" ON public.secret_ids;
DROP POLICY IF EXISTS "Creators can manage secret IDs for their polls" ON public.secret_ids;
DROP POLICY IF EXISTS "Admins can manage all secret IDs" ON public.secret_ids;
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;

-- 3. Recreate policies used by the current frontend
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can update all users" ON public.users FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage requests" ON public.creator_requests FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Creators can manage their own elections" ON public.elections FOR ALL USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Admins can view all elections" ON public.elections FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage all elections" ON public.elections FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Creators can manage their own polls" ON public.polls FOR ALL USING (
  EXISTS (SELECT 1 FROM public.elections e WHERE e.id = election_id AND e.creator_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.elections e WHERE e.id = election_id AND e.creator_id = auth.uid())
);
CREATE POLICY "Admins can manage all polls" ON public.polls FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Creators can manage candidates" ON public.candidates FOR ALL USING (
  EXISTS (SELECT 1 FROM public.polls p JOIN public.elections e ON p.election_id = e.id WHERE p.id = poll_id AND e.creator_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.polls p JOIN public.elections e ON p.election_id = e.id WHERE p.id = poll_id AND e.creator_id = auth.uid())
);
CREATE POLICY "Admins can manage all candidates" ON public.candidates FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Users can update their own registrations" ON public.voter_registrations FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Creators can manage registrations for their polls" ON public.voter_registrations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.polls p JOIN public.elections e ON p.election_id = e.id WHERE p.id = poll_id AND e.creator_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.polls p JOIN public.elections e ON p.election_id = e.id WHERE p.id = poll_id AND e.creator_id = auth.uid())
);
CREATE POLICY "Admins can manage all registrations" ON public.voter_registrations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Users can create their own secret IDs" ON public.secret_ids FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Creators can manage secret IDs for their polls" ON public.secret_ids FOR ALL USING (
  EXISTS (SELECT 1 FROM public.polls p JOIN public.elections e ON p.election_id = e.id WHERE p.id = poll_id AND e.creator_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.polls p JOIN public.elections e ON p.election_id = e.id WHERE p.id = poll_id AND e.creator_id = auth.uid())
);
CREATE POLICY "Admins can manage all secret IDs" ON public.secret_ids FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Authenticated users can create audit logs" ON public.audit_logs FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (actor_id = auth.uid() OR public.is_admin())
);

CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT WITH CHECK (public.is_admin());

-- 4. Atomic vote casting RPC
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

    IF NOT EXISTS (SELECT 1 FROM public.polls WHERE id = v_poll_id AND election_id = p_election_id) THEN
      RAISE EXCEPTION 'Invalid ballot selected.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.candidates WHERE id = v_candidate_id AND poll_id = v_poll_id) THEN
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

-- 5. Candidate photo bucket used by Manage Candidates
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

CREATE POLICY "Authenticated users can update candidate photos" ON storage.objects FOR UPDATE USING (
  bucket_id = 'candidate-photos' AND auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'candidate-photos' AND auth.role() = 'authenticated'
);
