import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus2, Search } from 'lucide-react';
import api from '../../api/client';
import { getApiErrorMessage } from '../../api/getApiErrorMessage';
import { ApiEnvelope, ApiList, Customer, Invoice, customerName, formatCurrency, formatDate } from '../../types/invoicing';

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [status, setStatus] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page: 1, limit: 100 };
      if (status) params.status = status;
      if (customerId) params.customer_id = customerId;
      const response = await api.get<ApiEnvelope<ApiList<Invoice>>>('/invoices', { params });
      setInvoices(response.data.data.items);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not load invoices. Check that the API is running.'));
    } finally {
      setLoading(false);
    }
  }, [status, customerId]);

  useEffect(() => { void loadInvoices(); }, [loadInvoices]);
  useEffect(() => {
    api.get<ApiEnvelope<ApiList<Customer>>>('/customers', { params: { page: 1, limit: 100 } })
      .then((response) => setCustomers(response.data.data.items))
      .catch((requestError: unknown) => setError((current) => current || getApiErrorMessage(requestError, 'Could not load customers for filtering.')));
  }, []);

  const visibleInvoices = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return invoices;
    return invoices.filter((invoice) =>
      [invoice.invoice_number, customerName(invoice.customer), invoice.customer.email, invoice.status]
        .some((value) => value.toLowerCase().includes(term)),
    );
  }, [invoices, search]);

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-icon"><FilePlus2 size={14} /></span> BILLING</div>
          <h1>Invoices</h1>
          <p className="page-description">Create, track and manage your customer invoices.</p>
        </div>
        <Link className="button button-primary" to="/invoices/new"><FilePlus2 size={17} /> Create invoice</Link>
      </div>

      <div className="summary-row">
        <div className="summary-card"><span className="summary-label">Invoices shown</span><strong>{visibleInvoices.length}</strong><span className="summary-note">Matching current filters</span></div>
        <div className="summary-card"><span className="summary-label">Drafts</span><strong>{invoices.filter((invoice) => invoice.status === 'DRAFT').length}</strong><span className="summary-note">Ready to be issued</span></div>
        <div className="summary-card"><span className="summary-label">Total value</span><strong>{formatCurrency(invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0))}</strong><span className="summary-note">Across loaded invoices</span></div>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="panel">
        <div className="toolbar">
          <label className="search-field">
            <Search size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoice or customer" aria-label="Search invoices" />
          </label>
          <label className="filter-field"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="ISSUED">Issued</option><option value="PAID">Paid</option></select></label>
          <label className="filter-field customer-filter"><span>Customer</span><select value={customerId} onChange={(event) => setCustomerId(event.target.value)}><option value="">All customers</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customerName(customer)}</option>)}</select></label>
          <span className="result-count">{visibleInvoices.length} results</span>
        </div>
        <div className="table-wrap">
          <table className="data-table invoice-table">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Issue date</th><th>Due date</th><th>Status</th><th className="amount-column">Total</th><th aria-label="Open invoice" /></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="table-message">Loading invoices…</td></tr> :
                visibleInvoices.length === 0 ? <tr><td colSpan={7} className="table-message">No invoices match your filters.</td></tr> :
                  visibleInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td><Link className="table-primary invoice-number" to={`/invoices/${invoice.id}`}>{invoice.invoice_number}</Link><span className="table-secondary">#{invoice.id}</span></td>
                      <td><span className="table-primary">{customerName(invoice.customer)}</span><span className="table-secondary">{invoice.customer.email}</span></td>
                      <td>{formatDate(invoice.invoice_date)}</td>
                      <td>{formatDate(invoice.due_date)}</td>
                      <td><span className={`status-pill status-${invoice.status.toLowerCase()}`}>{invoice.status.toLowerCase()}</span></td>
                      <td className="amount-column table-primary">{formatCurrency(invoice.total)}</td>
                      <td><Link className="row-link" to={`/invoices/${invoice.id}`} aria-label={`View ${invoice.invoice_number}`}>View <span aria-hidden="true">→</span></Link></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>Showing the latest {invoices.length} invoices from the API (up to 100).</span><button className="text-button" onClick={() => void loadInvoices()} disabled={loading}>Refresh</button></div>
      </div>
    </section>
  );
}
