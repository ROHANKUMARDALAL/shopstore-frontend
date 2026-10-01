# ShopStore counter

Browser screens for a fertiliser wholesale and retail stock counter. Staff sign up, add products, book stock in (we bought), and book stock out (we sold). The stock rules live in the ShopStore API, a separate Node.js project. This repo is only the counter UI.

## Run locally

Node.js 20 or newer. Start the ShopStore API on port `43121` first.

```bash
npm install
npm run dev
```

The dev server listens on `0.0.0.0:43123`. Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

`NEXT_PUBLIC_API_URL` defaults to `http://127.0.0.1:43121`. Copy `.env.example` to `.env.local` if the API is somewhere else (Render later, or any host). The API must allow this origin in `CORS_ORIGIN`.

## Counter flow

1. **Sign up / Sign in** — create a counter account, or use the API demo login `counter@shopstore.local` / `shopstore123` when the API seeded it.
2. **Products** — save a bag with pack size, CP, SP, opening qty. Status shows in stock / low / out of stock.
3. **Buy / Stock in** — supplier bill raises quantity and sets the latest CP.
4. **Sell / Stock out** — shop bill lowers quantity, shows margin, refuses oversell.
5. **Purchases / Sales** — registers of posted vouchers.

## Deploy later

- Frontend → Vercel (set `NEXT_PUBLIC_API_URL` to the public API URL).
- Backend → Render or AWS (set `MONGODB_URI`, `CORS_ORIGIN` to the Vercel URL, `JWT_SECRET`, `REQUIRE_AUTH=true`).

There is no GST and no full ledger — stock only.
