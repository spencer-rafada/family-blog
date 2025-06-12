-- Force refresh of the user creation function to ensure album creation works
-- This migration ensures the function is updated after all album tables exist

-- Drop and recreate the trigger to force function refresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with detailed debugging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  new_album_id uuid;
  albums_exists boolean;
  album_members_exists boolean;
BEGIN
  -- Create profile first (this must succeed)
  RAISE WARNING 'Creating profile for user %', NEW.id;
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RAISE WARNING 'Profile created successfully for user %', NEW.id;
  
  -- Check if albums table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'albums'
  ) INTO albums_exists;
  
  RAISE WARNING 'Albums table exists: % for user %', albums_exists, NEW.id;
  
  -- Check if album_members table exists  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'album_members'
  ) INTO album_members_exists;
  
  RAISE WARNING 'Album_members table exists: % for user %', album_members_exists, NEW.id;
  
  -- Only try to create default album if both tables exist
  IF albums_exists AND album_members_exists THEN
    BEGIN
      RAISE WARNING 'Attempting to create default album for user %', NEW.id;
      
      INSERT INTO public.albums (name, description, created_by, is_default)
      VALUES ('Family', 'Default family album', NEW.id, true)
      RETURNING id INTO new_album_id;
      
      RAISE WARNING 'Album created with ID % for user %', new_album_id, NEW.id;
      
      INSERT INTO public.album_members (album_id, user_id, role)
      VALUES (new_album_id, NEW.id, 'admin');
      
      RAISE WARNING 'Album member created successfully for user %', NEW.id;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the detailed error
        RAISE WARNING 'Failed to create default album for user %: SQLSTATE=%, SQLERRM=%', NEW.id, SQLSTATE, SQLERRM;
    END;
  ELSE
    RAISE WARNING 'Skipping album creation - albums_exists: %, album_members_exists: % for user %', albums_exists, album_members_exists, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();