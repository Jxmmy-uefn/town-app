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

With no server set up, the app opens in **demo mode**: you can walk around the town map, but nothing is saved.

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
| `src/lib/` | Sign-in, the Supabase client and the age check. |
| `supabase/migrations/` | Database tables and the rules for who can read and change what. |
| `supabase/seed.sql` | Starter shop items and chat phrases. |

## Safety rules built into the database

- Players must be 13 or older. Sign-up is rejected otherwise, and birth dates are never shown to other players.
- Coins only change through playing games (at most 50 per game and 500 per day) or buying items. Players can't edit their coin count directly.
- Chat uses preset phrases only, and only between friends. Muted or banned players can't send messages.
- Anyone can file a report; only moderators and admins can see and resolve them.
