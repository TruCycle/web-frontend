# TruCycle Frontend

Vite + React + strict TypeScript scaffold following feature-first boundaries from `AGENTS.md`.

## Quick Start

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Project Structure

```txt
src/
  app/
    routes/
    shell/
  features/
    home/
    messaging/
    notifications/
  shared/
    hooks/
    lib/
      api/
      config/
      websocket/
    styles/
    types/
    ui/
    utils/
```

## Environment

Copy `.env.example` to `.env` and adjust values:

Only place public browser-safe values in `VITE_*` variables. Never put API secrets or private signing keys in frontend env files.

```bash
VITE_API_BASE_URL=/api
VITE_WS_URL=
```
