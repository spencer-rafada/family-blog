create type "public"."album_role" as enum ('admin', 'contributor', 'viewer');

drop policy "Admins can manage invites" on "public"."invites";

alter table "public"."album_invites" drop constraint "album_invites_role_check";

alter table "public"."album_members" drop constraint "album_members_role_check";

alter table "public"."profiles" drop constraint "profiles_role_check";

alter table "public"."album_invites" alter column "role" set data type album_role using "role"::album_role;

alter table "public"."album_members" alter column "role" set data type album_role using "role"::album_role;

alter table "public"."profiles" drop column "role";

create policy "invites_admin_only"
on "public"."invites"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM album_members
  WHERE ((album_members.user_id = auth.uid()) AND (album_members.role = 'admin'::album_role)))));



