# ShopStore counter

Browser screens for a fertiliser wholesale and retail stock counter. Staff book stock in (we bought) and stock out (we sold). The stock rules live in the ShopStore API, a separate Node.js project. This repo is only the counter UI.

## Run locally

Node.js 20 or newer.

```bash
npm install
npm run dev
```

The dev server listens on `0.0.0.0:43123`.

`NEXT_PUBLIC_API_URL` defaults to `http://127.0.0.1:43121`. Copy `.env.example` to `.env.local` if the API is somewhere else. The API must allow this origin in `CORS_ORIGIN`.

## Screens

- Dashboard — stock value at cost and at selling price, today's purchases, today's sales, gross margin, low stock
- Products — CP, SP, quantity, margin
- Stock in (we bought)
- Stock out (we sold)
- Purchase register
- Sales register

There is no login, no GST, and no ledger.
