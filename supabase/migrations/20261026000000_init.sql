-- Core tables for accounts, coins, items, houses, friends, chat and moderation.
-- Players never write coins directly: they change only through the functions below.

create extension if not exists citext;

-- Profiles -------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username citext not null unique check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  birthdate date not null check (birthdate <= current_date - interval '13 years'),
  coins integer not null default 100 check (coins >= 0),
  avatar jsonb not null default '{}'::jsonb,
  role text not null default 'player' check (role in ('player', 'moderator', 'admin')),
  is_banned boolean not null default false,
  muted_until timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Birthdate and moderation fields stay private: players can read only these columns.
revoke all on public.profiles from anon, authenticated;
grant select (id, username, coins, avatar, role, created_at) on public.profiles to authenticated;
grant update (avatar) on public.profiles to authenticated;

create policy "profiles are visible to players" on public.profiles
  for select to authenticated using (true);
create policy "players edit their own avatar" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Creates the profile when someone signs up. A bad username or an age under 13
-- fails the checks above, which rejects the sign-up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, birthdate)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    (new.raw_user_meta_data ->> 'birthdate')::date
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_staff()
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator', 'admin')
  );
$$;

create function public.is_muted()
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (is_banned or muted_until > now())
  );
$$;

-- Items and inventory ----------------------------------------------------------

create table public.items (
  id serial primary key,
  slug text not null unique,
  name text not null,
  category text not null check (category in ('clothing', 'furniture')),
  price integer not null check (price >= 0),
  image_url text,
  active boolean not null default true
);

alter table public.items enable row level security;
create policy "active items are visible" on public.items
  for select to authenticated using (active);

create table public.inventory (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id integer not null references public.items (id),
  acquired_at timestamptz not null default now()
);

create index on public.inventory (user_id);
alter table public.inventory enable row level security;
create policy "players see their own inventory" on public.inventory
  for select to authenticated using (user_id = auth.uid());

-- Houses -------------------------------------------------------------------------

create table public.house_placements (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  inventory_id bigint not null unique references public.inventory (id) on delete cascade,
  item_id integer not null references public.items (id),
  x real not null check (x between 0 and 1),
  y real not null check (y between 0 and 1),
  rotation smallint not null default 0 check (rotation in (0, 90, 180, 270))
);

create index on public.house_placements (user_id);
alter table public.house_placements enable row level security;

-- Moving an item can't swap in a different one.
revoke update on public.house_placements from anon, authenticated;
grant update (x, y, rotation) on public.house_placements to authenticated;

create policy "houses are visible to players" on public.house_placements
  for select to authenticated using (true);
create policy "players place items they own" on public.house_placements
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.inventory i
      where i.id = inventory_id and i.user_id = auth.uid() and i.item_id = house_placements.item_id
    )
  );
create policy "players move their own items" on public.house_placements
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "players remove their own items" on public.house_placements
  for delete to authenticated using (user_id = auth.uid());

-- Friends --------------------------------------------------------------------------

create table public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

alter table public.friendships enable row level security;

-- Accepting a request can only change its status, not who it's from.
revoke update on public.friendships from anon, authenticated;
grant update (status) on public.friendships to authenticated;

create policy "players see their friendships" on public.friendships
  for select to authenticated using (auth.uid() in (user_id, friend_id));
create policy "players send friend requests" on public.friendships
  for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "players accept requests sent to them" on public.friendships
  for update to authenticated using (friend_id = auth.uid()) with check (friend_id = auth.uid());
create policy "either friend can unfriend" on public.friendships
  for delete to authenticated using (auth.uid() in (user_id, friend_id));

create function public.are_friends(a uuid, b uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((user_id = a and friend_id = b) or (user_id = b and friend_id = a))
  );
$$;

-- Chat: preset phrases only at launch, so nothing harmful can be typed --------------

create table public.chat_phrases (
  id serial primary key,
  category text not null,
  text text not null
);

alter table public.chat_phrases enable row level security;
create policy "phrases are visible" on public.chat_phrases
  for select to authenticated using (true);

create table public.messages (
  id bigserial primary key,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  phrase_id integer not null references public.chat_phrases (id),
  created_at timestamptz not null default now()
);

create index on public.messages (recipient_id, created_at desc);
alter table public.messages enable row level security;

create policy "players see their own messages" on public.messages
  for select to authenticated using (auth.uid() in (sender_id, recipient_id));
create policy "players message friends" on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and public.are_friends(sender_id, recipient_id)
    and not public.is_muted()
  );

-- Minigames and coins ------------------------------------------------------------

create table public.game_scores (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  game text not null check (game in ('catch', 'match3')),
  score integer not null check (score >= 0),
  coins_awarded integer not null,
  created_at timestamptz not null default now()
);

create index on public.game_scores (game, created_at desc);
alter table public.game_scores enable row level security;
create policy "scores are visible" on public.game_scores
  for select to authenticated using (true);

-- Records a finished game and pays coins: score / 10, at most 50 per game
-- and 500 per day across all games.
create function public.submit_score(p_game text, p_score integer)
returns integer
language plpgsql
security definer set search_path = ''
as $$
declare
  earned_today integer;
  payout integer;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  select coalesce(sum(coins_awarded), 0) into earned_today
  from public.game_scores
  where user_id = auth.uid() and created_at >= date_trunc('day', now());

  payout := greatest(0, least(p_score / 10, 50, 500 - earned_today));

  insert into public.game_scores (user_id, game, score, coins_awarded)
  values (auth.uid(), p_game, p_score, payout);

  update public.profiles set coins = coins + payout where id = auth.uid();
  return payout;
end;
$$;

-- Buys an item if the player can afford it. Returns the new inventory row id.
create function public.buy_item(p_item_id integer)
returns bigint
language plpgsql
security definer set search_path = ''
as $$
declare
  item_price integer;
  new_id bigint;
begin
  select price into item_price from public.items where id = p_item_id and active;
  if item_price is null then
    raise exception 'item not for sale';
  end if;

  update public.profiles set coins = coins - item_price
  where id = auth.uid() and coins >= item_price;
  if not found then
    raise exception 'not enough coins';
  end if;

  insert into public.inventory (user_id, item_id) values (auth.uid(), p_item_id)
  returning id into new_id;
  return new_id;
end;
$$;

create view public.weekly_leaderboard
with (security_invoker = true) as
select s.game, p.username, max(s.score) as best_score
from public.game_scores s
join public.profiles p on p.id = s.user_id
where s.created_at >= date_trunc('week', now())
group by s.game, p.username;

-- Reports and moderation ---------------------------------------------------------------

create table public.reports (
  id bigserial primary key,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_user_id uuid not null references public.profiles (id) on delete cascade,
  target_kind text not null check (target_kind in ('player', 'house', 'message')),
  target_id text,
  reason text not null check (char_length(reason) between 1 and 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolved_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "players file reports" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid() and status = 'open');
create policy "reporters and staff see reports" on public.reports
  for select to authenticated using (reporter_id = auth.uid() or public.is_staff());
create policy "staff resolve reports" on public.reports
  for update to authenticated using (public.is_staff()) with check (public.is_staff());
