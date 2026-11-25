# Town App

A cozy town game for phones, inspired by the classic Millsberry. Players make an avatar, earn coins in arcade minigames, buy clothes and furniture, and decorate a house their friends can visit. "Town App" is a working name until the real one is picked.

Built with [Expo](https://expo.dev) (React Native) for Android and iPhone, and [Supabase](https://supabase.com) for accounts and data.

## Try it on your phone

1. Install **Expo Go** from the Google Play Store.
2. Install [Node.js](https://nodejs.org) (the LTS version) on your computer.
3. In this folder, run:

   ```bash
   npm install
   npx expo start
   ```

4. Scan the QR code it shows with Expo Go. Your phone and computer need to be on the same Wi-Fi.

With no server set up, the app opens in **demo mode**. Everything works, and your coins, items and room are saved on your phone only.

## Connect a server (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project's **SQL Editor**, run `supabase/migrations/20261026000000_init.sql`, then `supabase/seed.sql`.
3. Copy `.env.example` to `.env.local` and fill in the URL and anon key from **Project Settings → API**.
4. Restart `npx expo start`. Sign-in and sign-up now work for real.

## What's where

| Path | What it is |
| --- | --- |
| `src/app/` | Screens. Each file is a screen; `index.tsx` is the town map. |
| `src/constants/places.ts` | The places on the town map and where they sit. |
| `src/games/` | Rules for the minigames, kept separate from the screens so they can be tested. |
| `src/constants/items.ts` | Shop items and their placeholder emoji art. |
| `src/lib/daily-logic.ts` | Rules for the Daily Loop: Gumball Machine prizes and odds, daily chores, the Food bar and Snack Shack menu. |
| `src/lib/sticker-logic.ts` | Sticker Book stickers and where the hidden sticker is each fortnight. |
| `src/lib/party-logic.ts` | The Monthly Party calendar and each party's free gift. |
| `src/lib/bulletin-logic.ts` | The Bubble Bulletin, the weekly newspaper at Town Hall. |
| `src/lib/town-life.tsx` | Daily Loop progress (Food bar, chores, today's gumball turn, stickers), saved on the phone. |
| `src/lib/game-store.tsx` | Coins, items, your room and your avatar, saved on the phone in demo mode or in Supabase. |
| `src/lib/` (other files) | Sign-in, the Supabase client, the age check and coin payouts. |
| `tests/` | Tests for the game rules. Run them with `npm test`. |
| `supabase/migrations/` | Database tables and the rules for who can read and change what. |
| `supabase/seed.sql` | Starter shop items and chat phrases. |

## Coming back every day

These were picked from a look at what kept players coming back to classic social games, with fair-play rules for a 13+ audience: nothing is lost when you skip a day, prizes and odds are shown openly, and nothing random is ever sold.

- **Today in Town** (the strip on the map): one free Gumball Machine turn a day, three small chores that pay 10 coins each plus a 20 coin bonus for all three, and your buddy's Food bar.
- **Snack Shack**: buy 2000s snacks to fill the Food bar, or work a 45-second shift in the *Order Up!* job for coins.
- **Sticker Book**: gumball stickers, plus one sticker hidden somewhere in town that moves every two weeks. Old spots come back around.
- **Monthly Parties**: once a month the map dresses up and everyone can pick up a free gift.
- **Town residents**: Blip, Gloria Glitter, Mayor Marbles, Skye and Chef Tater each hang out in one place, say something new every day, and ask for a snack. Bring it five times and they give you their own sticker.
- **Bloops**: adopt a free little jelly pet (preset names only). Playing with it on different days teaches it tricks, and it never gets sad when you're away.
- **Monthly Shop collections**: a themed set of 2000s clothes and furniture each month. Collections take turns, so each one comes back every few months.
- **The Bubble Bulletin**: a weekly newspaper at Town Hall with party news, shop news, a sticker clue, a joke and a tip.

If you set up Supabase before this was added, also run `supabase/migrations/20261125000000_daily_loop.sql` in the SQL Editor.

## Safety rules built into the database

- Players must be 13 or older. Sign-up is rejected otherwise, and birth dates are never shown to other players.
- Coins only change through playing games (at most 50 per game and 500 per day) or buying items. Players can't edit their coin count directly.
- Chat uses preset phrases only, and only between friends. Muted or banned players can't send messages.
- Anyone can file a report; only moderators and admins can see and resolve them.
