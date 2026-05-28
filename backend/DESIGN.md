# Backend Design

## Architecture

The backend is a modular Express API with Prisma as the data access layer. It uses one MySQL schema for core ERP records and keeps each visible frontend module behind a stable `/api/...` route group.

## Module Boundaries

- `auth`: login, MFA verification, current user profile
- `dashboard`: KPI rollups and control tower alerts
- `masters`: item, vendor, customer, BOM
- `procurement`: PR, RFQ, PO, GRN, vendor invoice, AP payment, supplier scorecard
- `inventory`: stock batches, stock movements, transfers, cycle counts
- `quality`: IQC, FQC, NCR
- `production`: production orders, work orders, OEE logs
- `sales`: sales orders, dispatches, AR invoices, AR payments
- `finance`: chart of accounts, journals, bank reconciliation, budgets, tax reports
- `hr`: employees, attendance, leave, payroll, recruitment
- `ai`: deterministic assistant endpoint that can later be connected to an LLM
- `reports`: read-optimized report endpoints by domain

## Workflow Coverage

- PO approval updates the document and creates an approval + notification.
- GRN records material receipt against a PO.
- IQC result can automatically create an NCR on failure.
- Journal posting stamps poster and posted date.
- Dashboard/control tower APIs aggregate live backend data.

## Security Design

- All `/api/*` ERP routes require a bearer token.
- Login issues an MFA challenge.
- MFA verification returns a JWT.
- Role middleware exists for module-level authorization, ready to apply per route.
- Audit logs are written by generic CRUD mutations.

## Next Implementation Layer

After the static `index.html` starts calling these APIs, the next backend layer should add:

- row-level authorization by role and department
- document number series by company and fiscal year
- approval matrices by amount and module
- inventory valuation method locks
- accounting period close and reversal journals
- file upload storage for invoices, QC reports, and attachments
