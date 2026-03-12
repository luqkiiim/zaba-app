# Zaba App

Zaba is a Next.js app for managing badminton students, sessions, attendance, and payments. The UI is deployed as a standard Vercel app, while shared data now lives in Supabase so it stays in sync across devices.

## Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- Supabase JavaScript client

## Local development

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and add your Supabase values:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

3. In Supabase SQL Editor, run `supabase_schema.sql`.

4. Start the app:

```bash
npm run dev
```

## Supabase setup

1. Create a new Supabase project.
2. Open `Project Settings` -> `API`.
3. Copy the project URL into `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy the anon/public key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Open SQL Editor and run `supabase_schema.sql`.

The SQL file creates:

- `students`
- `sessions`
- `attendance`
- `payments`
- `apply_payment(...)` RPC for payment inserts plus quota top-ups
- `sync_session_attendance(...)` RPC for attendance syncing plus quota adjustments

## Vercel deployment checklist

1. Import the GitHub repo into Vercel.
2. Keep the framework preset as `Next.js`.
3. Add these environment variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.
5. Open the deployed app and confirm you can:
   - add a student
   - create a session
   - mark attendance
   - log a payment

## Current deployment notes

- `npm run lint` passes.
- `npm run build` passes.
- The app fetches data on the client from Supabase, so the shell can still deploy even if env vars are missing, but the app needs the env vars plus SQL setup to become functional.

## Security note

The included Supabase policies are intentionally open so a single coach can use the app without building auth first. That is acceptable for a personal MVP, but it is not appropriate for a public multi-user product. If you plan to share this beyond yourself, add Supabase Auth and replace the open policies with user-scoped ones.
