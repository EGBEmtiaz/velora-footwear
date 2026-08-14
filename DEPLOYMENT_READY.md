# Velora deployment-ready

## Option A — Render (recommended for this current Node/Express package)

1. Create a Render Web Service from this repository/ZIP after pushing the project to a private Git repository.
2. Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Health Check: `/api/health`
6. Add the variables listed in `.env.production.example` under Render Environment.
7. Set `PUBLIC_BASE_URL` to the actual HTTPS Render/custom-domain URL.
8. Run the Supabase SQL in `server/sql/schema.sql`.
9. Redeploy.
10. Open `/admin` and log in with the admin credentials.

Render environment values marked `sync: false` in `render.yaml` are intentionally left for you to enter privately.

## Option B — Vercel

This package includes `vercel.json`.

1. Import the repository into Vercel.
2. Vercel should detect the root `package.json`.
3. Add all production environment variables from `.env.production.example`.
4. Deploy.
5. Set `PUBLIC_BASE_URL` to the production URL.
6. Ensure the bKash callback uses:
   `https://YOUR-DOMAIN/api/payments/bkash/callback`

Important: the current app uses an in-memory-free Supabase database, so orders persist. However, the Nagad adapter still requires the official merchant-specific production integration package/credentials; it intentionally does not fake a live signature.

## Secrets

Do NOT put any of these in frontend code or Git:
- SUPABASE_SERVICE_ROLE_KEY
- BKASH_APP_SECRET
- BKASH_PASSWORD
- JWT_SECRET
- Nagad private key

Use your host's secret/environment-variable UI.

## Live gateway

Only switch `BKASH_SANDBOX=false` and use the official live base URL/credentials after bKash merchant approval and successful sandbox testing. Do the same for Nagad when its official merchant integration is completed.
