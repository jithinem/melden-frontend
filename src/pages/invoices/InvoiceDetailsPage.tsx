import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Check, FileText } from 'lucide-react';
import api from '../../api/client';
import { getApiErrorMessage } from '../../api/getApiErrorMessage';
import { ApiEnvelope, Invoice, customerName, formatCurrency, formatDate } from '../../types/invoicing';

export function InvoiceDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigationState = location.state as { saved?: string; issueError?: string } | null;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState(navigationState?.issueError || '');
  const [notice, setNotice] = useState(navigationState?.saved || '');

  const loadInvoice = useCallback(async () => {
    setLoading(true);
    setError(navigationState?.issueError || '');
    try {
      const response = await api.get<ApiEnvelope<Invoice>>(`/invoices/${id}`);
      setInvoice(response.data.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not load this invoice.'));
    } finally {
      setLoading(false);
    }
  }, [id, navigationState?.issueError]);

  useEffect(() => { void loadInvoice(); }, [loadInvoice]);

  async function issueInvoice() {
    if (!invoice || invoice.status !== 'DRAFT') return;
    setIssuing(true);
    setError('');
    setNotice('');
    try {
      const response = await api.post<ApiEnvelope<Invoice>>(`/invoices/${invoice.id}/issue`);
      setInvoice(response.data.data);
      setNotice('Invoice issued successfully.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not issue this invoice.'));
    } finally {
      setIssuing(false);
    }
  }

  if (loading) return <section className="page"><div className="panel loading-panel">Loading invoice details…</div></section>;
  if (!invoice) return <section className="page"><Link className="back-link" to="/invoices"><ArrowLeft size={16} /> Back to invoices</Link><div className="alert alert-error">{error || 'Invoice not found.'}</div></section>;

  return (
    <section className="page">
      <Link className="back-link" to="/invoices"><ArrowLeft size={16} /> Back to invoices</Link>
      {notice && <div className="alert alert-success" role="status"><Check size={17} /> {notice}</div>}
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <div className="page-heading details-heading">
        <div>
          <div className="eyebrow">INVOICE / {invoice.invoice_number}</div>
          <h1>{invoice.invoice_number}</h1>
          <p className="page-description">Invoice date: {formatDate(invoice.invoice_date)}</p>
        </div>
        <div className="heading-actions">
          <span className={`status-pill status-${invoice.status.toLowerCase()}`}>{invoice.status.toLowerCase()}</span>
          {invoice.status === 'DRAFT' && <button className="button button-primary" onClick={() => void issueInvoice()} disabled={issuing}>{issuing ? 'Issuing…' : 'Issue invoice'}</button>}
        </div>
      </div>

      <div className="details-grid">
        <div className="details-main">
          <section className="panel invoice-paper">
            <div className="invoice-paper-header">
              <div className="invoice-paper-brand"><span className="brand-mark"><FileText size={18} /></span><span>Melden<span className="brand-light">.billing</span></span></div>
              <div className="paper-invoice-id"><span>INVOICE</span><strong>{invoice.invoice_number}</strong></div>
            </div>
            <div className="invoice-addresses">
              <div><span className="detail-label">BILL TO</span><strong>{customerName(invoice.customer)}</strong><span>{invoice.customer.email}</span>{invoice.customer.gst_number && <span>GSTIN: {invoice.customer.gst_number}</span>}</div>
              <div className="invoice-dates"><div><span className="detail-label">ISSUE DATE</span><strong>{formatDate(invoice.invoice_date)}</strong></div><div><span className="detail-label">DUE DATE</span><strong>{formatDate(invoice.due_date)}</strong></div></div>
            </div>
            <div className="table-wrap">
              <table className="data-table line-detail-table">
                <thead><tr><th>Description</th><th className="amount-column">Qty</th><th className="amount-column">Unit price</th><th className="amount-column">Tax</th><th className="amount-column">Line total</th></tr></thead>
                <tbody>{invoice.line_items?.map((line, index) => <tr key={line.id ?? index}><td className="table-primary">{line.description}</td><td className="amount-column">{Number(line.quantity)}</td><td className="amount-column">{formatCurrency(line.unit_price)}</td><td className="amount-column">{Number(line.tax_rate)}%</td><td className="amount-column table-primary">{formatCurrency(line.line_total ?? Number(line.quantity) * Number(line.unit_price))}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="invoice-total-box">
              <div><span>Subtotal</span><strong>{formatCurrency(invoice.sub_total)}</strong></div>
              <div><span>Tax</span><strong>{formatCurrency(invoice.tax_amount)}</strong></div>
              <div className="grand-total"><span>Total</span><strong>{formatCurrency(invoice.total)}</strong></div>
            </div>
          </section>
        </div>
        <aside className="details-side">
          <section className="panel detail-card"><span className="detail-label">PAYMENT SUMMARY</span><div className="payment-total">{formatCurrency(invoice.total)}</div><div className="detail-pair"><span>Paid</span><strong>{formatCurrency(invoice.amount_paid ?? 0)}</strong></div><div className="detail-pair"><span>Balance due</span><strong>{formatCurrency(invoice.balance_due ?? invoice.total)}</strong></div><div className="detail-pair"><span>Status</span><span className={`status-pill status-${invoice.status.toLowerCase()}`}>{invoice.status.toLowerCase()}</span></div></section>
          <section className="panel detail-card"><span className="detail-label">CUSTOMER</span><div className="detail-customer"><span className="avatar-initials">{invoice.customer.first_name[0]}{invoice.customer.last_name[0]}</span><div><strong>{customerName(invoice.customer)}</strong><span>{invoice.customer.email}</span></div></div></section>
          <Link className="button button-secondary button-wide" to="/invoices">Return to invoice list</Link>
        </aside>
      </div>
    </section>
  );
}
