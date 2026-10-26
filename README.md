# Melden Billing

A small invoicing sample frontend for the Melden API.

## Run locally

1. Start the backend at `http://localhost:5001`.
2. From `melden-frontend`, install dependencies with `npm install`.
3. Run `npm run dev`.

The API base defaults to `http://localhost:5001/api/v1`. Set `VITE_API_BASE_URL` to override it (the value should include the API version prefix, for example `http://localhost:5001/api/v1`).

## Included workflows

- Browse and search customers, filter by active status, and add a customer with form validation.
- Browse invoices and filter by status or customer. Text search checks the latest 100 invoices returned by the API; the current invoice-list endpoint does not expose a search parameter.
- Create invoices with a customer, dates, editable line items, tax rates, and live subtotal/tax/total calculations.
- Save an invoice as a draft or create it and issue it through the API.
- Open an invoice for its customer, line items, dates, totals, payment summary, and status.
