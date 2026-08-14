# Velora Footwear — Official Gateway Ready

## What is implemented

### bKash
The backend uses the bKash Tokenized Checkout flow:
1. Create order on Velora backend.
2. Backend requests bKash token.
3. Backend creates a payment.
4. Customer is redirected to the bKash hosted checkout.
5. bKash calls the callback.
6. Backend executes/verifies the payment and marks the order paid/pending/failed.

bKash credentials are NEVER placed in frontend JavaScript.

### Nagad
The frontend/backend has a dedicated Nagad payment endpoint, but the final production integration requires the merchant-specific Nagad Merchant ID and RSA keys/integration parameters supplied during Nagad onboarding. The server intentionally refuses to fake a signature.

## Required credentials

You must obtain official merchant/API credentials from bKash and Nagad.

bKash:
- BKASH_APP_KEY
- BKASH_APP_SECRET
- BKASH_USERNAME
- BKASH_PASSWORD
- Production base URL after approval

Nagad:
- NAGAD_MERCHANT_ID
- merchant number
- merchant-approved private/public RSA keys
- production API parameters

The phone number 01674102916 is kept as the shop contact/merchant number; a phone number alone is NOT sufficient to activate an official API gateway.

## Run locally

1. Install Node.js 20+.
2. Open the `server` folder.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Put your real credentials in `.env`.
6. Set `PUBLIC_BASE_URL` to your public HTTPS domain.
7. Run `npm start`.

For a real callback, localhost is not enough; the callback URL must be publicly reachable over HTTPS.

## Production checklist

- Use HTTPS.
- Store secrets in environment variables/secret manager.
- Use a real database instead of the demo in-memory order store.
- Add idempotency and server-side price/inventory validation.
- Configure delivery charges.
- Add admin order management.
- Complete bKash/Nagad merchant approval and sandbox testing before live mode.

Official references:
- bKash Business: https://www.bkash.com/en/business
- Nagad: https://www.nagad.com.bd/en/
