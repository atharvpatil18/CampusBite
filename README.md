# CampusBite live demo

CampusBite is an SRM canteen ordering assistant. Students order food in plain English, while the Gemini agent checks the menu, wallet balance, stock, and pickup slots before placing an order.

## Demo materials

- [LIVE_BUILD_PROMPTS.md](./LIVE_BUILD_PROMPTS.md) — step-by-step prompts for building the application
- [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) — the live presentation flow

## Run the demo

1. Install dependencies with `npm install`.
2. Configure `.env.local` using the repository's `.env.example`.
3. Run `seed/00_starter_example.sql`, then `seed/campusbite.sql` in Supabase.
4. Start the app with `npm run dev`.
5. Open `http://localhost:3000` and sign in with the configured passcode.

The database seed can be run again to reset the demo menu, wallets, pickup slots, and orders.
