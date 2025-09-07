-- Fix the function search path issue
CREATE OR REPLACE FUNCTION public.decrement_trial_clips(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.trials 
  SET 
    free_clips_remaining = GREATEST(0, free_clips_remaining - 1),
    updated_at = now()
  WHERE trials.user_id = decrement_trial_clips.user_id;
END;
$$;