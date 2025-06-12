-- Fix album insert RLS policy to allow authenticated users to create albums
-- The current policy creates a timing issue with auth.uid() = created_by

-- Drop the existing insert policy
DROP POLICY IF EXISTS "albums_insert" ON "public"."albums";

-- Create a more permissive insert policy that only checks authentication
CREATE POLICY "albums_insert" ON "public"."albums"
FOR INSERT WITH CHECK (
  -- Any authenticated user can create an album
  auth.role() = 'authenticated'
);