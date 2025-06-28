drop policy "album_members_insert" on "public"."album_members";

create policy "album_members_insert"
on "public"."album_members"
as permissive
for insert
to public
with check (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM (album_invites
     JOIN profiles ON ((profiles.id = auth.uid())))
  WHERE ((album_invites.album_id = album_members.album_id) AND (album_invites.email = profiles.email) AND (album_invites.role = album_members.role) AND (album_invites.used_at IS NULL) AND (album_invites.expires_at > now()))))));



