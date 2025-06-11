-- Create likes table
create table "public"."post_likes" (
    "id" uuid not null default uuid_generate_v4(),
    "post_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone default now()
);

-- Set up RLS
alter table "public"."post_likes" enable row level security;

-- Add primary key
alter table "public"."post_likes" add constraint "post_likes_pkey" primary key ("id");

-- Add foreign key constraints
alter table "public"."post_likes" add constraint "post_likes_post_id_fkey" foreign key ("post_id") references "public"."posts" ("id") on delete cascade;
alter table "public"."post_likes" add constraint "post_likes_user_id_fkey" foreign key ("user_id") references "public"."profiles" ("id") on delete cascade;

-- Add unique constraint to prevent duplicate likes
alter table "public"."post_likes" add constraint "post_likes_post_user_unique" unique ("post_id", "user_id");

-- Add index for better performance
create index "post_likes_post_id_idx" on "public"."post_likes" ("post_id");
create index "post_likes_user_id_idx" on "public"."post_likes" ("user_id");

-- RLS Policies
create policy "Anyone can view likes"
  on "public"."post_likes"
  for select
  using (true);

create policy "Authenticated users can create likes"
  on "public"."post_likes"
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own likes"
  on "public"."post_likes"
  for delete
  using (auth.uid() = user_id);