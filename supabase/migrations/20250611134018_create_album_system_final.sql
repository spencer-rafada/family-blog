-- Create album system with working RLS policies (start simple, add privacy later)

-- Create albums table
CREATE TABLE "public"."albums" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "name" text NOT NULL,
    "description" text,
    "created_by" uuid NOT NULL,
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "public"."albums" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."albums" ADD CONSTRAINT "albums_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."albums" ADD CONSTRAINT "albums_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles" ("id") ON DELETE CASCADE;

-- Create album_members table
CREATE TABLE "public"."album_members" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "album_id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "role" text NOT NULL CHECK (role IN ('admin', 'contributor', 'viewer')),
    "joined_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "public"."album_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."album_members" ADD CONSTRAINT "album_members_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."album_members" ADD CONSTRAINT "album_members_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."albums" ("id") ON DELETE CASCADE;
ALTER TABLE "public"."album_members" ADD CONSTRAINT "album_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles" ("id") ON DELETE CASCADE;
ALTER TABLE "public"."album_members" ADD CONSTRAINT "album_members_album_user_unique" UNIQUE ("album_id", "user_id");

-- Create album_invites table
CREATE TABLE "public"."album_invites" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "album_id" uuid NOT NULL,
    "email" text NOT NULL,
    "invited_by" uuid NOT NULL,
    "role" text NOT NULL CHECK (role IN ('admin', 'contributor', 'viewer')),
    "token" text NOT NULL UNIQUE,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "public"."album_invites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."album_invites" ADD CONSTRAINT "album_invites_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."album_invites" ADD CONSTRAINT "album_invites_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."albums" ("id") ON DELETE CASCADE;
ALTER TABLE "public"."album_invites" ADD CONSTRAINT "album_invites_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles" ("id") ON DELETE CASCADE;

-- Add album_id to posts table
ALTER TABLE "public"."posts" ADD COLUMN "album_id" uuid;
ALTER TABLE "public"."posts" ADD CONSTRAINT "posts_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."albums" ("id") ON DELETE CASCADE;

-- Add indexes
CREATE INDEX "albums_created_by_idx" ON "public"."albums" ("created_by");
CREATE INDEX "album_members_album_id_idx" ON "public"."album_members" ("album_id");
CREATE INDEX "album_members_user_id_idx" ON "public"."album_members" ("user_id");
CREATE INDEX "album_invites_album_id_idx" ON "public"."album_invites" ("album_id");
CREATE INDEX "posts_album_id_idx" ON "public"."posts" ("album_id");

-- Grant permissions
GRANT ALL ON "public"."albums" TO "anon", "authenticated", "service_role";
GRANT ALL ON "public"."album_members" TO "anon", "authenticated", "service_role";
GRANT ALL ON "public"."album_invites" TO "anon", "authenticated", "service_role";

-- Security Definer Functions to break RLS circular dependencies

-- Function to check if user has access to an album (bypasses RLS)
CREATE OR REPLACE FUNCTION check_album_access(p_album_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user created the album OR is a member
  RETURN EXISTS (
    SELECT 1 FROM albums 
    WHERE id = p_album_id AND created_by = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM album_members 
    WHERE album_members.album_id = p_album_id AND album_members.user_id = p_user_id
  );
END;
$$;

-- Function to check if user owns an album (bypasses RLS)
CREATE OR REPLACE FUNCTION check_album_owner(p_album_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM albums 
    WHERE id = p_album_id AND created_by = p_user_id
  );
END;
$$;

-- RLS POLICIES using Security Definer Functions

-- Albums: Users see albums they have access to
CREATE POLICY "albums_select" ON "public"."albums"
FOR SELECT USING (check_album_access(id, auth.uid()));

CREATE POLICY "albums_insert" ON "public"."albums"
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "albums_update" ON "public"."albums"
FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "albums_delete" ON "public"."albums"  
FOR DELETE USING (auth.uid() = created_by);

-- Album members: Show own memberships + memberships in albums you own
CREATE POLICY "album_members_select" ON "public"."album_members"  
FOR SELECT USING (
  user_id = auth.uid() OR 
  check_album_owner(album_id, auth.uid())
);

CREATE POLICY "album_members_insert" ON "public"."album_members"
FOR INSERT WITH CHECK (check_album_owner(album_id, auth.uid()));

CREATE POLICY "album_members_update" ON "public"."album_members"
FOR UPDATE USING (check_album_owner(album_id, auth.uid()));

CREATE POLICY "album_members_delete" ON "public"."album_members"
FOR DELETE USING (
  user_id = auth.uid() OR 
  check_album_owner(album_id, auth.uid())
);

-- Album invites: Show invites for albums you created + public token access
CREATE POLICY "album_invites_access" ON "public"."album_invites"
FOR ALL USING (
  album_invites.album_id IN (SELECT id FROM albums WHERE created_by = auth.uid()) OR
  token IS NOT NULL
);

-- Posts: Allow posts without albums + posts in albums you have access to
DROP POLICY IF EXISTS "Anyone can view posts" ON "public"."posts";
DROP POLICY IF EXISTS "Authors can create posts" ON "public"."posts";

CREATE POLICY "posts_read_access" ON "public"."posts"
FOR SELECT USING (
  auth.role() = 'authenticated' AND (
    posts.album_id IS NULL OR 
    check_album_access(posts.album_id, auth.uid())
  )
);

CREATE POLICY "posts_write_access" ON "public"."posts"
FOR INSERT WITH CHECK (
  auth.uid() = author_id AND (
    posts.album_id IS NULL OR 
    check_album_access(posts.album_id, auth.uid())
  )
);

