set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.mark_invite_as_used(invite_token text, user_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Update the invite to mark it as used
  UPDATE album_invites 
  SET used_at = NOW()
  WHERE token = invite_token 
    AND email = user_email
    AND used_at IS NULL 
    AND expires_at > NOW();
    
  -- Check if the update actually affected any rows
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invite or invite already used/expired';
  END IF;
END;
$function$
;


