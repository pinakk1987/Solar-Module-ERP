# Solar-Module-ERP

SolarOS ERP is a solar module manufacturing ERP prototype with:

- Frontend SPA: `index.html` (fully wired to backend API)
- Backend API: `backend/`
- Local development database: `backend/prisma/solaros-local.db`

## Prerequisites

Install these before running the software:

- Node.js 22 or newer
- npm, included with Node.js
- PowerShell on Windows
- A modern browser such as Chrome, Edge, or Firefox

Optional:

- MySQL Server, XAMPP, WAMP, or Laragon if you want to use MySQL
- Podman or Docker if you want to run MySQL in a container

For the easiest local run, you do not need MySQL, Podman, or Docker. Use SQLite mode.

## First-Time Local Setup

Open PowerShell:

```powershell
cd D:\Projects\Solar-Module-ERP\backend
Copy-Item .env.sqlite.example .env -Force
npm install
npm run prisma:generate:sqlite
npm run sqlite:create
npm run seed
npx tsx src/db/seed-bulk.ts
npm run build
```

The local database file will be created at:

```text
D:\Projects\Solar-Module-ERP\backend\prisma\solaros-local.db
```

## Run The Backend

In PowerShell:

```powershell
cd D:\Projects\Solar-Module-ERP\backend
node dist/server.js
```

Backend URL:

```text
http://localhost:4000/api/health
```

## Run The Frontend

Open a second PowerShell window:

```powershell
cd D:\Projects\Solar-Module-ERP
node scripts/serve-frontend.mjs
```

Website URL:

```text
http://localhost:5500
```

## Login

```text
Email: admin@solaros.in
Password: password123
MFA: 123456
```

## Stop The App

Press `Ctrl + C` in both terminal windows.

If the servers were started in the background, stop Node:

```powershell
taskkill /F /IM node.exe
```

## Prisma EPERM Fix On Windows

If this error appears:

```text
EPERM: operation not permitted, rename query_engine-windows.dll.node.tmp...
```

Stop running Node processes, then retry:

```powershell
taskkill /F /IM node.exe
cd D:\Projects\Solar-Module-ERP\backend
Remove-Item .\node_modules\.prisma\client\query_engine-windows.dll.node.tmp* -Force -ErrorAction SilentlyContinue
npm run prisma:generate:sqlite
```

## MySQL Mode

SQLite mode is easiest for development. For MySQL setup and the full backend API route list, see:

```text
backend\README.md
```
