-- Create RPC function for album creation that bypasses RLS issues
CREATE OR REPLACE FUNCTION create_album_with_member(
  album_name text,
  album_description text DEFAULT NULL,
  album_privacy_level text DEFAULT 'private',
  creator_id uuid DEFAULT auth.uid()
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_album_id uuid;
  album_record record;
BEGIN
  -- Verify user is authenticated
  IF creator_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Insert album
  INSERT INTO public.albums (name, description, created_by, privacy_level, is_default)
  VALUES (album_name, album_description, creator_id, album_privacy_level, false)
  RETURNING id INTO new_album_id;

  -- Add creator as admin member
  INSERT INTO public.album_members (album_id, user_id, role)
  VALUES (new_album_id, creator_id, 'admin');

  -- Return the album with creator info
  SELECT 
    a.*,
    json_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'avatar_url', p.avatar_url
    ) as creator,
    1 as member_count,
    0 as post_count
  INTO album_record
  FROM public.albums a
  JOIN public.profiles p ON p.id = a.created_by
  WHERE a.id = new_album_id;

  RETURN row_to_json(album_record);
END;
$$;