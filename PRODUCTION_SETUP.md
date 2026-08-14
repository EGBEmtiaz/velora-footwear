# Velora Footwear — Production-ready build

This package now contains:
- PostgreSQL database schema for products, orders and order_items
- Server-side price/stock validation
- Persistent order database via Supabase
- Admin authentication with httpOnly cookie
- Admin dashboard at `/admin`
- Order status management
- Product stock/active management
- Paid revenue statistics
- bKash hosted checkout backend + callback/verification
- Nagad adapter that fails closed until official merchant-specific credentials/keys are installed

## 1) Create Supabase project
Create a Supabase project and run `server/sql/schema.sql` in SQL Editor. Supabase provides full Postgres and RLS for database security.

## 2) Configure environment
Copy `server/.env.example` to `server/.env`.
Set:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- ADMIN_EMAIL
- ADMIN_PASSWORD
- JWT_SECRET
- bKash credentials
- Nagad credentials/keys
- PUBLIC_BASE_URL

For ADMIN_PASSWORD, a plain password is accepted by this scaffold, but a bcrypt hash is recommended before production.

## 3) Install and run
cd server
npm install
npm start

Open:
- Storefront: /
- Admin: /admin

## 4) Live gateway
bKash needs the approved live merchant/API credentials and live base URL.
Nagad needs the merchant-specific production credentials and RSA integration package/keys. A phone number alone cannot activate an official gateway.

## 5) Production hardening still recommended
- Use a real domain + HTTPS.
- Use a proper secret manager.
- Add rate limiting and CSRF protection where appropriate.
- Add email/SMS order notifications.
- Use atomic stock reservation/decrement in a database transaction or RPC.
- Add image storage and product upload.
- Add backups/monitoring.
- Do full sandbox testing before switching to live credentials.

## Hosting
This Node backend can be hosted on a Node-compatible server/container. If using Vercel or another platform, put secrets in environment variables, not source code.
