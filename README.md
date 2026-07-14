# AI Marketing OS

AI-powered marketing operating system. Next.js (App Router) + Supabase (Postgres, Auth, Storage) + Vercel.

## Stack
- **Frontend/API**: Next.js 16, TypeScript, Tailwind CSS
- **Backend**: Supabase (Postgres with RLS, Auth incl. Google OAuth, Storage)
- **Hosting**: Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project values
npm run dev
```

## Environment variables

See `.env.example`. You need:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, get from Supabase Dashboard → Settings → API — never expose client-side)

## Database

Schema and RLS policies live in `supabase/migrations/` (SQL). Apply with:
```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## Google Sign-In

Enable in Supabase Dashboard → Authentication → Providers → Google, using
credentials from Google Cloud Console. Redirect URI to register there:
`https://<your-project-ref>.supabase.co/auth/v1/callback`

## Project structure

- `src/app` — routes (App Router)
- `src/features` — feature modules (auth, org, brand-kit, ...)
- `src/lib/supabase` — Supabase client setup (browser/server/admin)
- `supabase/migrations` — SQL schema + RLS policies
