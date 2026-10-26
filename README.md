# Melden Billing

A sample invoicing frontend for the Melden API.

## Run locally

You need Node.js/npm and a running PostgreSQL server. Run the backend and frontend in separate terminals.

### 1. Set up the backend

From the repository root, install the backend dependencies:

```sh
cd melden-backend
npm install
```

Create a `.env` file in `melden-backend` and set the connection string for your local PostgreSQL database:

```env
DATABASE_URL=postgresql://postgres:undertaker@localhost:5432/melden_db?schema=public
PORT=5001
```

Create the `melden_db` database and ensure the PostgreSQL user/password in `DATABASE_URL` can access it. Then, still in `melden-backend`, generate the Prisma client, apply migrations, and start the API:

```sh
npm run prisma:generate
npm run migrate:deploy
npm run dev
```

The API runs at <http://localhost:5001>. On startup, the backend seeds sample customers and invoices.

### 2. Start the frontend

In a second terminal, from the repository root:

```sh
cd melden-frontend
npm install
npm run dev
```

Open the local URL printed by Vite (by default, <http://localhost:5173>). The frontend calls `http://localhost:5001/api/v1` by default. To use another API URL, set `VITE_API_BASE_URL` before starting Vite; it should include `/api/v1`, for example:

```sh
VITE_API_BASE_URL=http://localhost:5001/api/v1 npm run dev
```

In PowerShell, set it for the current terminal with:

```powershell
$env:VITE_API_BASE_URL = "http://localhost:5001/api/v1"
npm run dev
```

## Included workflows

- Browse and search customers, filter by active status, and add a customer with form validation.
- Browse invoices and filter by status or customer. Text search checks the latest 100 invoices returned by the API; the current invoice-list endpoint does not expose a search parameter.
- Create invoices with a customer, dates, editable line items, tax rates, and live subtotal/tax/total calculations.
- Save an invoice as a draft or create it and issue it through the API.
- Open an invoice for its customer, line items, dates, totals, payment summary, and status.
