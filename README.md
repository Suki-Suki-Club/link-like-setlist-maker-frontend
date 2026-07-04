# link-like-setlist-maker

ラブライブ！の未来イベント向けセットリスト予想を作成し、URL で共有する Next.js アプリです。

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run start
npm run preview
npm run deploy
```

開発中は `npm run dev` を実行し、`/home` を開きます。

## Environment

Set `BACKEND_API_BASE_URL` to the backend origin and `BACKEND_API_TOKEN` to the same shared secret configured on the backend. Do not expose the token through a `NEXT_PUBLIC_` variable.

Cloudflare Workers uses the same variables:

```bash
wrangler secret put BACKEND_API_TOKEN
wrangler secret put BACKEND_API_BASE_URL
```

`DEEZER_API_BASE_URL` is optional and defaults to `https://api.deezer.com`.

## Cloudflare Workers

This app deploys to Cloudflare Workers through OpenNext.

```bash
npm run preview
npm run deploy
```

`wrangler.jsonc` points Workers at `.open-next/worker.js` and serves static assets from `.open-next/assets`.
