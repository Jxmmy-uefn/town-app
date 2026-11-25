-- The Daily Loop (gumball machine, chores, Snack Shack), Monthly Party gifts and
-- the Snack Shack job. Coins still only change through these functions.
-- Days here follow the server clock (UTC), so a player far from UTC may see a
-- new day start a few hours before or after their own midnight.

-- The Snack Shack job is a new minigame. -----------------------------------------------

alter table public.game_scores drop constraint game_scores_game_check;
alter table public.game_scores
  add constraint game_scores_game_check check (game in ('catch', 'match3', 'snack-job'));

-- Daily bonuses ----------------------------------------------------------------------------

create table public.daily_claims (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('chore', 'chores-bonus', 'gumball')),
  coins integer not null check (coins >= 0),
  created_at timestamptz not null default now()
);

create index on public.daily_claims (user_id, created_at desc);
alter table public.daily_claims enable row level security;
create policy "players see their own claims" on public.daily_claims
  for select to authenticated using (user_id = auth.uid());

create function public.claims_today(p_kind text)
returns integer
language sql
stable
security definer set search_path = ''
as $$
  select count(*)::integer from public.daily_claims
  where user_id = auth.uid() and kind = p_kind and created_at >= date_trunc('day', now());
$$;

-- Pays for a finished chore (10 coins, 3 a day) or for finishing all three
-- (20 coins, once a day). Keep amounts in sync with src/lib/daily-logic.ts.
create function public.claim_daily_bonus(p_kind text)
returns integer
language plpgsql
security definer set search_path = ''
as $$
declare
  amount integer;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;

  if p_kind = 'chore' then
    if public.claims_today('chore') >= 3 then
      raise exception 'You already finished today''s chores. New ones come tomorrow.';
    end if;
    amount := 10;
  elsif p_kind = 'chores-bonus' then
    if public.claims_today('chores-bonus') >= 1 then
      raise exception 'You already got today''s bonus.';
    end if;
    if public.claims_today('chore') < 3 then
      raise exception 'Finish all three chores first.';
    end if;
    amount := 20;
  else
    raise exception 'unknown bonus';
  end if;

  insert into public.daily_claims (user_id, kind, coins) values (auth.uid(), p_kind, amount);
  update public.profiles set coins = coins + amount where id = auth.uid();
  return amount;
end;
$$;

-- One free gumball a day. The odds match GUMBALL_ODDS in src/lib/daily-logic.ts:
-- 45% 10 coins, 25% 20 coins, 5% 40 coins, 25% a sticker (20 coins instead when
-- the player already owns every gumball sticker).
create function public.spin_gumball(p_can_win_sticker boolean)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  roll double precision := random() * 100;
  prize_coins integer;
  prize_sticker boolean := false;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if public.claims_today('gumball') >= 1 then
    raise exception 'You already had today''s turn. Come back tomorrow!';
  end if;

  if roll < 45 then
    prize_coins := 10;
  elsif roll < 70 then
    prize_coins := 20;
  elsif roll < 75 then
    prize_coins := 40;
  elsif p_can_win_sticker then
    prize_coins := 0;
    prize_sticker := true;
  else
    prize_coins := 20;
  end if;

  insert into public.daily_claims (user_id, kind, coins) values (auth.uid(), 'gumball', prize_coins);
  update public.profiles set coins = coins + prize_coins where id = auth.uid();
  return jsonb_build_object('coins', prize_coins, 'sticker', prize_sticker);
end;
$$;

-- Snack Shack. Prices match SNACKS in src/lib/daily-logic.ts. Returns the price paid.
create function public.buy_snack(p_slug text)
returns integer
language plpgsql
security definer set search_path = ''
as $$
declare
  snack_price integer;
begin
  snack_price := case p_slug
    when 'fruit-pouch' then 8
    when 'gummy-worms' then 10
    when 'cheesy-puffs' then 12
    when 'blue-slushie' then 15
    when 'toaster-tart' then 20
    when 'pizza-bagel' then 25
  end;
  if snack_price is null then
    raise exception 'That snack is not on the menu.';
  end if;

  update public.profiles set coins = coins - snack_price
  where id = auth.uid() and coins >= snack_price;
  if not found then
    raise exception 'Not enough coins.';
  end if;
  return snack_price;
end;
$$;

-- Monthly Party gifts ------------------------------------------------------------------------

alter table public.items add column party boolean not null default false;

insert into public.items (slug, name, category, price, party) values
  ('glow-necklace', 'Glow Shades', 'clothing', 0, true),
  ('heart-beanbag', 'Heart Beanbag', 'furniture', 0, true),
  ('bubble-machine', 'Bubble Machine', 'furniture', 0, true),
  ('mini-disco-ball', 'Mini Disco Ball', 'furniture', 0, true),
  ('flower-lamp', 'Flower Lamp', 'furniture', 0, true),
  ('pool-ring', 'Inflatable Pool Ring', 'furniture', 0, true),
  ('neon-sign', 'Neon Arcade Sign', 'furniture', 0, true),
  ('skate-ramp', 'Mini Skate Ramp', 'furniture', 0, true),
  ('pumpkin-lantern', 'Pumpkin Lantern', 'furniture', 0, true),
  ('glow-ghost', 'Friendly Glow Ghost', 'furniture', 0, true),
  ('aurora-lamp', 'Aurora Lamp', 'furniture', 0, true),
  ('y2k-party-hat', 'Y2K Party Hat', 'clothing', 0, true);

-- When each gift can be picked up. Matches PARTIES in src/lib/party-logic.ts.
create table public.party_gifts (
  item_id integer primary key references public.items (id),
  month integer not null check (month between 1 and 12),
  start_day integer not null check (start_day between 1 and 31),
  end_day integer not null check (end_day between start_day and 31)
);

alter table public.party_gifts enable row level security;
create policy "party dates are visible" on public.party_gifts
  for select to authenticated using (true);

insert into public.party_gifts (item_id, month, start_day, end_day)
select i.id, g.month, g.start_day, g.end_day
from (values
  ('glow-necklace', 1, 1, 7),
  ('heart-beanbag', 2, 10, 16),
  ('bubble-machine', 3, 15, 22),
  ('mini-disco-ball', 4, 10, 17),
  ('flower-lamp', 5, 15, 22),
  ('pool-ring', 6, 20, 27),
  ('neon-sign', 7, 10, 17),
  ('skate-ramp', 8, 15, 22),
  ('pumpkin-lantern', 9, 15, 22),
  ('glow-ghost', 10, 24, 31),
  ('aurora-lamp', 11, 20, 30),
  ('y2k-party-hat', 12, 26, 31)
) as g (slug, month, start_day, end_day)
join public.items i on i.slug = g.slug;

-- Monthly Shop collections ----------------------------------------------------------------

-- Each collection is sold for one month, then the next one takes over. With 4
-- collections, November 2026 is collection 0 and each comes back every 4 months.
-- Matches COLLECTIONS and currentCollection in src/constants/items.ts.
alter table public.items add column collection integer check (collection between 0 and 3);

insert into public.items (slug, name, category, price, collection) values
  ('inflatable-chair', 'Inflatable Chair', 'furniture', 120, 0),
  ('lava-lamp', 'Lava Lamp', 'furniture', 90, 0),
  ('bubble-tv', 'Bubble TV', 'furniture', 200, 0),
  ('frosted-tips', 'Frosted Tips', 'clothing', 80, 0),
  ('puffer-vest', 'Puffer Vest', 'clothing', 90, 1),
  ('chunky-sneakers', 'Chunky Sneakers', 'clothing', 100, 1),
  ('butterfly-clips', 'Butterfly Clips', 'clothing', 40, 1),
  ('bead-curtain', 'Bead Curtain', 'furniture', 110, 1),
  ('trucker-hat', 'Trucker Hat', 'clothing', 50, 2),
  ('graphic-tee', 'Graphic Tee', 'clothing', 60, 2),
  ('skate-shoes', 'Skate Shoes', 'clothing', 90, 2),
  ('halfpipe-poster', 'Halfpipe Poster', 'furniture', 70, 2),
  ('vinyl-beanbag', 'Vinyl Beanbag', 'furniture', 100, 3),
  ('fiber-optic-lamp', 'Fiber-Optic Lamp', 'furniture', 150, 3),
  ('fuzzy-slippers', 'Fuzzy Slippers', 'clothing', 50, 3),
  ('pajama-tee', 'Pajama Tee', 'clothing', 50, 3);

create function public.current_collection()
returns integer
language sql
stable
set search_path = ''
as $$
  select ((((extract(year from now())::integer - 2026) * 12
    + extract(month from now())::integer - 11) % 4) + 4) % 4;
$$;

-- Party gifts are free and never sold, and collection items sell only in their
-- month, so the shop must refuse anything else.
create or replace function public.buy_item(p_item_id integer)
returns bigint
language plpgsql
security definer set search_path = ''
as $$
declare
  item_price integer;
  new_id bigint;
begin
  select price into item_price from public.items
  where id = p_item_id and active and not party
    and (collection is null or collection = public.current_collection());
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

-- Gives the current party's gift, once per player. Returns the new inventory row id.
create function public.claim_party_gift(p_item_id integer)
returns bigint
language plpgsql
security definer set search_path = ''
as $$
declare
  new_id bigint;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if not exists (
    select 1 from public.party_gifts
    where item_id = p_item_id
      and month = extract(month from now())
      and extract(day from now()) between start_day and end_day
  ) then
    raise exception 'That party is over.';
  end if;
  if exists (select 1 from public.inventory where user_id = auth.uid() and item_id = p_item_id) then
    raise exception 'You already picked up this gift.';
  end if;

  insert into public.inventory (user_id, item_id) values (auth.uid(), p_item_id)
  returning id into new_id;
  return new_id;
end;
$$;
