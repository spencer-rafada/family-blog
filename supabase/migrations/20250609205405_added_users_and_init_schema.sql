create table "public"."comments" (
    "id" uuid not null default uuid_generate_v4(),
    "post_id" uuid not null,
    "author_id" uuid not null,
    "content" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."comments" enable row level security;

create table "public"."invites" (
    "id" uuid not null default uuid_generate_v4(),
    "email" text not null,
    "invited_by" uuid not null,
    "token" text not null,
    "expires_at" timestamp with time zone not null,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
);


alter table "public"."invites" enable row level security;

create table "public"."post_images" (
    "id" uuid not null default uuid_generate_v4(),
    "post_id" uuid not null,
    "image_url" text not null,
    "caption" text,
    "display_order" integer default 0,
    "created_at" timestamp with time zone default now()
);


alter table "public"."post_images" enable row level security;

create table "public"."posts" (
    "id" uuid not null default uuid_generate_v4(),
    "author_id" uuid not null,
    "title" text,
    "content" text,
    "milestone_type" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."posts" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "full_name" text,
    "avatar_url" text,
    "role" text default 'member'::text,
    "is_invited" boolean default false,
    "invited_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."profiles" enable row level security;

CREATE UNIQUE INDEX comments_pkey ON public.comments USING btree (id);

CREATE INDEX idx_comments_author_id ON public.comments USING btree (author_id);

CREATE INDEX idx_comments_post_id ON public.comments USING btree (post_id);

CREATE INDEX idx_post_images_post_id ON public.post_images USING btree (post_id);

CREATE INDEX idx_posts_author_id ON public.posts USING btree (author_id);

CREATE INDEX idx_posts_created_at ON public.posts USING btree (created_at DESC);

CREATE UNIQUE INDEX invites_email_key ON public.invites USING btree (email);

CREATE UNIQUE INDEX invites_pkey ON public.invites USING btree (id);

CREATE UNIQUE INDEX invites_token_key ON public.invites USING btree (token);

CREATE UNIQUE INDEX post_images_pkey ON public.post_images USING btree (id);

CREATE UNIQUE INDEX posts_pkey ON public.posts USING btree (id);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

alter table "public"."comments" add constraint "comments_pkey" PRIMARY KEY using index "comments_pkey";

alter table "public"."invites" add constraint "invites_pkey" PRIMARY KEY using index "invites_pkey";

alter table "public"."post_images" add constraint "post_images_pkey" PRIMARY KEY using index "post_images_pkey";

alter table "public"."posts" add constraint "posts_pkey" PRIMARY KEY using index "posts_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."comments" add constraint "comments_author_id_fkey" FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."comments" validate constraint "comments_author_id_fkey";

alter table "public"."comments" add constraint "comments_post_id_fkey" FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE not valid;

alter table "public"."comments" validate constraint "comments_post_id_fkey";

alter table "public"."invites" add constraint "invites_email_key" UNIQUE using index "invites_email_key";

alter table "public"."invites" add constraint "invites_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."invites" validate constraint "invites_invited_by_fkey";

alter table "public"."invites" add constraint "invites_token_key" UNIQUE using index "invites_token_key";

alter table "public"."post_images" add constraint "post_images_post_id_fkey" FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE not valid;

alter table "public"."post_images" validate constraint "post_images_post_id_fkey";

alter table "public"."posts" add constraint "posts_author_id_fkey" FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."posts" validate constraint "posts_author_id_fkey";

alter table "public"."posts" add constraint "posts_milestone_type_check" CHECK ((milestone_type = ANY (ARRAY['first_steps'::text, 'first_words'::text, 'birthday'::text, 'holiday'::text, 'general'::text]))) not valid;

alter table "public"."posts" validate constraint "posts_milestone_type_check";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES profiles(id) not valid;

alter table "public"."profiles" validate constraint "profiles_invited_by_fkey";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."comments" to "anon";

grant insert on table "public"."comments" to "anon";

grant references on table "public"."comments" to "anon";

grant select on table "public"."comments" to "anon";

grant trigger on table "public"."comments" to "anon";

grant truncate on table "public"."comments" to "anon";

grant update on table "public"."comments" to "anon";

grant delete on table "public"."comments" to "authenticated";

grant insert on table "public"."comments" to "authenticated";

grant references on table "public"."comments" to "authenticated";

grant select on table "public"."comments" to "authenticated";

grant trigger on table "public"."comments" to "authenticated";

grant truncate on table "public"."comments" to "authenticated";

grant update on table "public"."comments" to "authenticated";

grant delete on table "public"."comments" to "service_role";

grant insert on table "public"."comments" to "service_role";

grant references on table "public"."comments" to "service_role";

grant select on table "public"."comments" to "service_role";

grant trigger on table "public"."comments" to "service_role";

grant truncate on table "public"."comments" to "service_role";

grant update on table "public"."comments" to "service_role";

grant delete on table "public"."invites" to "anon";

grant insert on table "public"."invites" to "anon";

grant references on table "public"."invites" to "anon";

grant select on table "public"."invites" to "anon";

grant trigger on table "public"."invites" to "anon";

grant truncate on table "public"."invites" to "anon";

grant update on table "public"."invites" to "anon";

grant delete on table "public"."invites" to "authenticated";

grant insert on table "public"."invites" to "authenticated";

grant references on table "public"."invites" to "authenticated";

grant select on table "public"."invites" to "authenticated";

grant trigger on table "public"."invites" to "authenticated";

grant truncate on table "public"."invites" to "authenticated";

grant update on table "public"."invites" to "authenticated";

grant delete on table "public"."invites" to "service_role";

grant insert on table "public"."invites" to "service_role";

grant references on table "public"."invites" to "service_role";

grant select on table "public"."invites" to "service_role";

grant trigger on table "public"."invites" to "service_role";

grant truncate on table "public"."invites" to "service_role";

grant update on table "public"."invites" to "service_role";

grant delete on table "public"."post_images" to "anon";

grant insert on table "public"."post_images" to "anon";

grant references on table "public"."post_images" to "anon";

grant select on table "public"."post_images" to "anon";

grant trigger on table "public"."post_images" to "anon";

grant truncate on table "public"."post_images" to "anon";

grant update on table "public"."post_images" to "anon";

grant delete on table "public"."post_images" to "authenticated";

grant insert on table "public"."post_images" to "authenticated";

grant references on table "public"."post_images" to "authenticated";

grant select on table "public"."post_images" to "authenticated";

grant trigger on table "public"."post_images" to "authenticated";

grant truncate on table "public"."post_images" to "authenticated";

grant update on table "public"."post_images" to "authenticated";

grant delete on table "public"."post_images" to "service_role";

grant insert on table "public"."post_images" to "service_role";

grant references on table "public"."post_images" to "service_role";

grant select on table "public"."post_images" to "service_role";

grant trigger on table "public"."post_images" to "service_role";

grant truncate on table "public"."post_images" to "service_role";

grant update on table "public"."post_images" to "service_role";

grant delete on table "public"."posts" to "anon";

grant insert on table "public"."posts" to "anon";

grant references on table "public"."posts" to "anon";

grant select on table "public"."posts" to "anon";

grant trigger on table "public"."posts" to "anon";

grant truncate on table "public"."posts" to "anon";

grant update on table "public"."posts" to "anon";

grant delete on table "public"."posts" to "authenticated";

grant insert on table "public"."posts" to "authenticated";

grant references on table "public"."posts" to "authenticated";

grant select on table "public"."posts" to "authenticated";

grant trigger on table "public"."posts" to "authenticated";

grant truncate on table "public"."posts" to "authenticated";

grant update on table "public"."posts" to "authenticated";

grant delete on table "public"."posts" to "service_role";

grant insert on table "public"."posts" to "service_role";

grant references on table "public"."posts" to "service_role";

grant select on table "public"."posts" to "service_role";

grant trigger on table "public"."posts" to "service_role";

grant truncate on table "public"."posts" to "service_role";

grant update on table "public"."posts" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

create policy "Anyone can view comments"
on "public"."comments"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Authenticated users can create comments"
on "public"."comments"
as permissive
for insert
to public
with check ((auth.uid() = author_id));


create policy "Authors can delete own comments"
on "public"."comments"
as permissive
for delete
to public
using ((auth.uid() = author_id));


create policy "Authors can update own comments"
on "public"."comments"
as permissive
for update
to public
using ((auth.uid() = author_id));


create policy "Admins can manage invites"
on "public"."invites"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


create policy "Anyone can view post images"
on "public"."post_images"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Post authors can manage images"
on "public"."post_images"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM posts
  WHERE ((posts.id = post_images.post_id) AND (posts.author_id = auth.uid())))));


create policy "Anyone can view posts"
on "public"."posts"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


create policy "Authors can create posts"
on "public"."posts"
as permissive
for insert
to public
with check ((auth.uid() = author_id));


create policy "Authors can delete own posts"
on "public"."posts"
as permissive
for delete
to public
using ((auth.uid() = author_id));


create policy "Authors can update own posts"
on "public"."posts"
as permissive
for update
to public
using ((auth.uid() = author_id));


create policy "Users can update own profile"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "Users can view all profiles"
on "public"."profiles"
as permissive
for select
to public
using ((auth.role() = 'authenticated'::text));


CREATE TRIGGER handle_updated_at_comments BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_posts BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


