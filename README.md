# EasyService Web (Next.js) — Phase 0 + Phase 1 (Auth)

## Setup

1. Create a fresh Next.js app (this environment can't reach npm registry setup interactively,
   so do this on your machine):
   ```
   npx create-next-app@latest easyservice-web --typescript --app --no-tailwind --src-dir=false
   cd easyservice-web
   ```
   (Answer "No" to Tailwind for now if you want to match these plain-CSS files exactly —
   or say "Yes" and we'll restyle in a later phase, your call.)

2. Copy the folders from this package into your new project, overwriting matching paths:
   - `app/login/page.tsx`
   - `app/dashboard/page.tsx`
   - `app/layout.tsx`
   - `app/page.tsx`
   - `lib/api.ts`

3. Copy `.env.local.example` to `.env.local` and adjust if your Laravel API runs elsewhere:
   ```
   cp .env.local.example .env.local
   ```

4. Run it:
   ```
   npm run dev
   ```

## Test it end-to-end

1. Make sure the Laravel API (`easyservice-api`) is running on `http://localhost:8000`
   with a test user created (see its README).
2. Visit `http://localhost:3000` → redirects to `/login`.
3. Log in with the test user (e.g. `admin` / `password`).
4. You should land on `/dashboard` showing your name, role, and location — confirming
   the full Next.js → Laravel → MySQL round trip works.

## What's included in this phase

- `lib/api.ts` — typed fetch client, stores the Sanctum token in `localStorage`,
  attaches `Authorization: Bearer` automatically.
- `/login` — login form calling `POST /api/login`.
- `/dashboard` — protected page calling `GET /api/me`, redirects to `/login` if not authenticated.

## Next phase

Phase 2: currency & rate management pages (list/create/edit currencies and currency groups),
consuming the CurrencyController endpoints from the API side.
