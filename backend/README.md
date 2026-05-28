# SolarOS ERP Backend

This backend is designed around the modules already present in `index.html`.

## Stack

- Node.js + TypeScript
- Express API
- Prisma ORM
- MySQL database
- JWT authentication with MFA-ready login flow
- Zod request validation

## Setup

### Existing Local MySQL

Use this if MySQL is already installed through MySQL Server, XAMPP, WAMP, Laragon, or another local stack.

1. Create a database:

```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS solaros_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

2. Configure and run the backend:

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
npm run dev
```

Default `.env.example` assumes:

```text
DATABASE_URL="mysql://root:mysql@localhost:3306/solaros_erp"
```

If your MySQL root password is different, edit `.env` before running Prisma.

### No Docker or Podman: SQLite Dev Mode

This is the lightest option for slow internet. It creates a local database file at `backend/prisma/solaros-local.db`.

```powershell
cd backend
Copy-Item .env.sqlite.example .env
npm install
npm run prisma:generate:sqlite
npm run sqlite:create
npm run seed
npm run dev
```

Use this mode for development and frontend integration. Use MySQL before production.

### With Podman

On Windows, start your Podman machine first if needed:

```powershell
podman machine start
```

Then run MySQL with compose:

```powershell
cd backend
Copy-Item .env.example .env
podman compose up -d
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
npm run dev
```

If your Podman install does not include `podman compose`, use a direct container command:

```powershell
podman volume create solaros_erp_mysql_data
podman run -d --name solaros-erp-mysql `
  -e MYSQL_ROOT_PASSWORD=mysql `
  -e MYSQL_DATABASE=solaros_erp `
  -e MYSQL_USER=solaros `
  -e MYSQL_PASSWORD=solaros `
  -p 3306:3306 `
  -v solaros_erp_mysql_data:/var/lib/mysql `
  mysql:8.4
```

Then continue:

```powershell
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
npm run dev
```

### With Docker

```bash
cd backend
copy .env.example .env
docker compose up -d
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
npm run dev
```

The API will run on `http://localhost:4000`.

Seeded login:

```text
Email: admin@solaros.in
Password: password123
MFA code: 123456
```

## Main API Areas

```text
GET    /api/health
POST   /api/auth/login
POST   /api/auth/mfa/verify
GET    /api/auth/me

GET    /api/dashboard/summary
GET    /api/dashboard/control-tower

CRUD   /api/masters/items
CRUD   /api/masters/vendors
CRUD   /api/masters/customers
CRUD   /api/masters/boms

CRUD   /api/procurement/purchase-requisitions
CRUD   /api/procurement/rfqs
CRUD   /api/procurement/purchase-orders
POST   /api/procurement/purchase-orders/:id/approve
CRUD   /api/procurement/goods-receipts
CRUD   /api/procurement/vendor-invoices
CRUD   /api/procurement/ap-payments

CRUD   /api/inventory/stock-batches
CRUD   /api/inventory/movements
GET    /api/inventory/stock-overview

CRUD   /api/quality/iqc
POST   /api/quality/iqc/:id/result
CRUD   /api/quality/ncr

CRUD   /api/production/orders
CRUD   /api/production/work-orders
CRUD   /api/production/oee

CRUD   /api/sales/orders
CRUD   /api/sales/dispatches
CRUD   /api/sales/ar-invoices
CRUD   /api/sales/ar-payments

GET    /api/finance/dashboard
CRUD   /api/finance/accounts
CRUD   /api/finance/journal-entries
POST   /api/finance/journal-entries/:id/post

CRUD   /api/hr/employees
CRUD   /api/hr/attendance
CRUD   /api/hr/leave-requests
CRUD   /api/hr/payroll-runs
CRUD   /api/hr/jobs

GET    /api/reports/:domain
POST   /api/ai/chat
CRUD   /api/settings
```

## Frontend Integration Shape

The current `index.html` is static and uses hardcoded values. Replace the table/KPI literals gradually by calling these APIs after login:

1. Call `POST /api/auth/login`.
2. Call `POST /api/auth/mfa/verify` with code `123456`.
3. Store `accessToken`.
4. Send `Authorization: Bearer <accessToken>` on every `/api/*` call.
5. Start with dashboard, purchase orders, stock overview, IQC, sales orders, and employee directory because those already have clear screens.

## Production Notes

Before production, add HTTPS, real MFA delivery, database backups, row-level authorization, audit review screens, and accounting-period locks.
