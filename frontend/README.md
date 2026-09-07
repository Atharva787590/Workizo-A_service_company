# UNNATI — Frontend (React + Vite)

The customer / captain / admin web app for UNNATI (SIH 2026).

## Run

```bash
npm install
npm run dev        # http://localhost:5174
```

The dev server proxies `/api`, `/media`, `/admin`, `/static` and `/ws` to the Django backend on
`http://127.0.0.1:8000` (see `vite.config.js`), so the browser only ever talks to one origin.

## Backend origin override

By default all API/media/WebSocket calls are **same-origin** (relative paths, handled by the proxy).
To point at a separately-hosted backend set an env var when running/building:

```bash
VITE_API_ORIGIN=http://localhost:8000 npm run dev
```

## Build

```bash
npm run build   # outputs to dist/
```
