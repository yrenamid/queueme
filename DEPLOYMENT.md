# Single-service deployment on Railway

This app deploys as ONE service: the backend (Express) serves the built frontend (Vite Vue) from `client-side/dist` and exposes APIs at `/api/*`.

## 0) Prereqs
- GitHub repo: https://github.com/yrenamid/queueme
- No secrets committed. Use env vars in Railway (see `.env.example`).

## 1) Create Railway project and link repo
- Go to Railway → New Project → Deploy from GitHub → pick `yrenamid/queueme`.
- Service Root Directory: repo root (leave as default).

## 2) Add MySQL plugin
- Project → Add Plugin → MySQL.
- Copy credentials (MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE).

## 3) Set Variables (Service → Variables)
- Database mapping (from plugin):
  - DB_HOST = MYSQLHOST
  - DB_PORT = MYSQLPORT
  - DB_USER = MYSQLUSER
  - DB_PASSWORD = MYSQLPASSWORD
  - DB_NAME = MYSQLDATABASE
- Required app vars:
  - NODE_ENV = production
  - JWT_SECRET = <generate a long random string>
  - PUBLIC_BASE_URL = https://<your-app>.railway.app (or your custom domain later)
- Frontend/API:
  - VITE_API_BASE = /api (default; leave as is for single-service)
- Runtime (avoid Node engine mismatches):
  - NIXPACKS_NODE_VERSION = 18  (or 20)
- Optional integrations (enable when you use them):
  - SENDGRID_API_KEY, EMAIL_FROM
  - PHILSMS_API_KEY, PHILSMS_SENDER_ID
  - PAYMONGO_PUBLIC_KEY, PAYMONGO_SECRET

See `backend/.env.example` for the complete list and descriptions.

## 4) Build & Run Commands (Service → Deploy → Commands)
- Install:
  - `npm ci --prefix backend && npm ci --prefix client-side`
- Build (frontend only):
  - `npm run build --prefix client-side`
- Start (backend serves built frontend):
  - `node backend/server.js`

Railway sets `PORT` automatically; the server already uses `process.env.PORT`.

## 5) Initialize database schema
- Open the MySQL plugin → Data/Console.
- Run the contents of:
  - `backend/database/schema.sql`
  - then each file in `backend/database/migrations/` in chronological order.

## 6) Deploy and verify
- Trigger a deploy (push to main or click Deploy).
- Logs should show: built client, DB connected, and `QueueMe backend listening on port ...`.
- Verify:
  - SPA: `https://<your-app>.railway.app/`
  - API health: `https://<your-app>.railway.app/api/health`
  - Customer route: `https://<your-app>.railway.app/customer/<slug>`

## 7) Custom domain (optional)
- Service → Settings → Domains → Add domain, follow DNS steps.
- Update `PUBLIC_BASE_URL` env var to your domain; regenerate QR if needed.

## 8) Troubleshooting
- 404 on client routes (refresh): The backend serves `index.html` for non-/api paths; it’s already set.
- CORS: Single-service uses `/api`, so no cross-origin. If you split services later, set `VITE_API_BASE` to your API origin and update backend CORS.
- Node version: set `NIXPACKS_NODE_VERSION` to 18 or 20.
- "Repository not found" in deploy: ensure Railway is linked to `yrenamid/queueme` and the service points to `main` branch.

---

This guide keeps your code unchanged and deploys both apps as one service.
