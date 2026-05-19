-- Run this in Supabase SQL editor for existing databases.
-- It adds automatic notifications for election creators when a voter registers.

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
