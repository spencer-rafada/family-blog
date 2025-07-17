drop policy "album_invites_select" on "public"."album_invites";

alter table "public"."album_invites" add column "is_shareable" boolean not null default false;

alter table "public"."album_invites" add column "max_uses" integer;

alter table "public"."album_invites" add column "uses_count" integer not null default 0;

CREATE INDEX album_invites_token_idx ON public.album_invites USING btree (token);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.increment_invite_uses_count(invite_token text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE album_invites 
  SET uses_count = uses_count + 1
  WHERE token = invite_token 
    AND is_shareable = true
    AND (max_uses IS NULL OR uses_count < max_uses);
END;
$function$
;

create policy "album_invites_select"
on "public"."album_invites"
as permissive
for select
to public
using (((album_id IN ( SELECT albums.id
   FROM albums
  WHERE (albums.created_by = auth.uid()))) OR (auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.email = album_invites.email))) OR (is_shareable = true)));



