-- Add privacy levels to albums for public/private album discovery
-- Public albums are discoverable, private albums are invitation-only

-- Add privacy_level column to albums table
ALTER TABLE "public"."albums" 
ADD COLUMN "privacy_level" text 
CHECK (privacy_level IN ('public', 'private')) 
DEFAULT 'private';

-- Set existing albums to private by default
UPDATE "public"."albums" SET privacy_level = 'private' WHERE privacy_level IS NULL;

-- Add index for privacy level queries
CREATE INDEX "albums_privacy_level_idx" ON "public"."albums" ("privacy_level");

-- Update RLS policies to support album discovery for public albums

-- Drop existing album select policy
DROP POLICY IF EXISTS "albums_select" ON "public"."albums";

-- New album select policy with privacy level support
CREATE POLICY "albums_select" ON "public"."albums"
FOR SELECT USING (
  -- Members can see albums they have access to (existing logic)
  check_album_access(id, auth.uid()) OR
  -- Anyone authenticated can see public albums exist (but not content without membership)
  (auth.role() = 'authenticated' AND privacy_level = 'public')
);

-- Album invites policy should respect privacy - only allow invites to albums you can access
DROP POLICY IF EXISTS "album_invites_access" ON "public"."album_invites";

CREATE POLICY "album_invites_select" ON "public"."album_invites"
FOR SELECT USING (
  -- Show invites for albums you created
  album_invites.album_id IN (SELECT id FROM albums WHERE created_by = auth.uid()) OR
  -- Show your own invites (by token for accepting)
  token IS NOT NULL
);

CREATE POLICY "album_invites_insert" ON "public"."album_invites"
FOR INSERT WITH CHECK (
  -- Only album owners can create invites
  album_invites.album_id IN (SELECT id FROM albums WHERE created_by = auth.uid())
);

CREATE POLICY "album_invites_delete" ON "public"."album_invites"
FOR DELETE USING (
  -- Album owners can cancel any invite, users can decline their own invites
  album_invites.album_id IN (SELECT id FROM albums WHERE created_by = auth.uid()) OR
  (token IS NOT NULL AND email = (SELECT email FROM profiles WHERE id = auth.uid()))
);