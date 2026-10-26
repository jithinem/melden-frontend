import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import api from '../../api/client';
import { getApiErrorMessage } from '../../api/getApiErrorMessage';
import { ApiEnvelope, ApiList, Customer, Invoice, customerName, formatCurrency } from '../../types/invoicing';

interface DraftLine {
  key: number;
  description: string;
  quantity: string;
  unit_price: string;
  tax_rate: string;
}

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const hasTooManyDecimals = (value: string, places: number) => (value.split('.')[1]?.length ?? 0) > places;
const newLine = (key: number): DraftLine => ({ key, description: '', quantity: '1', unit_price: '', tax_rate: '18' });

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([newLine(1)]);
  const [nextKey, setNextKey] = useState(2);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    api.get<ApiEnvelope<ApiList<Customer>>>('/customers', { params: { page: 1, limit: 100, is_active: true } })
      .then((response) => setCustomers(response.data.data.items))
      .catch((requestError: unknown) => setError(getApiErrorMessage(requestError, 'Could not load customers. Check that the API is running.')))
      .finally(() => setLoadingCustomers(false));
  }, []);

  const totals = useMemo(() => lines.reduce((result, line) => {
    const lineSubtotal = (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
    const lineTax = lineSubtotal * (Number(line.tax_rate) || 0) / 100;
    return { subtotal: result.subtotal + lineSubtotal, tax: result.tax + lineTax };
  }, { subtotal: 0, tax: 0 }), [lines]);

  function updateLine(key: number, field: keyof Omit<DraftLine, 'key'>, value: string) {
    setLines((current) => current.map((line) => line.key === key ? { ...line, [field]: value } : line));
  }

  function addLine() {
    setLines((current) => [...current, newLine(nextKey)]);
    setNextKey((current) => current + 1);
  }

  const customer = customers.find((item) => String(item.id) === customerId);
  const lineErrors = lines.map((line) =>
    !line.description.trim()
    || Number(line.quantity) <= 0
    || hasTooManyDecimals(line.quantity, 3)
    || Number(line.unit_price) < 0
    || line.unit_price === ''
    || hasTooManyDecimals(line.unit_price, 2)
    || Number(line.tax_rate) < 0
    || Number(line.tax_rate) > 100
    || hasTooManyDecimals(line.tax_rate, 2),
  );
  const formInvalid = !customerId || !invoiceDate || !dueDate || dueDate < invoiceDate || lines.length === 0 || lineErrors.some(Boolean);

  async function handleSubmit(event: { preventDefault: () => void }, issue: boolean) {
    event.preventDefault();
    setAttempted(true);
    setError('');
    if (formInvalid) return;
    setSaving(true);
    let createdInvoiceId: number | null = null;
    try {
      const response = await api.post<ApiEnvelope<Invoice>>('/invoices', {
        customer_id: Number(customerId),
        invoice_date: invoiceDate,
        due_date: dueDate,
        line_items: lines.map(({ description, quantity, unit_price, tax_rate }) => ({
          description: description.trim(),
          quantity: Number(quantity),
          unit_price: Number(unit_price),
          tax_rate: Number(tax_rate) || 0,
        })),
      });
      let created = response.data.data;
      createdInvoiceId = created.id;
      if (issue) {
        const issued = await api.post<ApiEnvelope<Invoice>>(`/invoices/${created.id}/issue`);
        created = issued.data.data;
      }
      navigate(`/invoices/${created.id}`, { state: { saved: issue ? 'Invoice issued successfully.' : 'Draft saved successfully.' } });
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, issue ? 'Could not create and issue invoice.' : 'Could not save draft invoice.');
      if (issue && createdInvoiceId !== null) {
        navigate(`/invoices/${createdInvoiceId}`, { state: { issueError: message } });
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page">
      <Link className="back-link" to="/invoices"><ArrowLeft size={16} /> Back to invoices</Link>
      <div className="page-heading create-heading">
        <div><div className="eyebrow">BILLING / NEW INVOICE</div><h1>Create invoice</h1><p className="page-description">Add a customer and the items you’re billing for.</p></div>
      </div>
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <form onSubmit={(event) => void handleSubmit(event, false)}>
        <div className="create-layout">
          <div className="create-main">
            <section className="panel form-panel">
              <div className="section-heading"><div><h2>Invoice details</h2><p>Choose who this invoice is for and set its dates.</p></div><span className="step-index">01</span></div>
              <div className="form-grid">
                <label className="form-field form-field-full">Customer <span className="required">*</span>
                  <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} aria-invalid={attempted && !customerId}>
                    <option value="">{loadingCustomers ? 'Loading customers…' : 'Select a customer'}</option>
                    {customers.map((item) => <option key={item.id} value={item.id}>{customerName(item)} · {item.email}</option>)}
                  </select>
                  {attempted && !customerId && <span className="field-error">Choose a customer.</span>}
                  {!loadingCustomers && customers.length === 0 && <span className="field-hint">There are no active customers. <Link to="/customers">Add a customer</Link> first.</span>}
                </label>
                {customer && <div className="selected-customer form-field-full"><span className="avatar-initials">{customer.first_name[0]}{customer.last_name[0]}</span><span><strong>{customerName(customer)}</strong><small>{customer.email}{customer.gst_number ? ` · GST ${customer.gst_number}` : ''}</small></span></div>}
                <label className="form-field">Invoice date <span className="required">*</span><input type="date" value={invoiceDate} onChange={(event) => setInvoiceDate(event.target.value)} required />{attempted && !invoiceDate && <span className="field-error">Invoice date is required.</span>}</label>
                <label className="form-field">Due date <span className="required">*</span><input type="date" min={invoiceDate} value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />{attempted && !dueDate && <span className="field-error">Due date is required.</span>}{attempted && dueDate && dueDate < invoiceDate && <span className="field-error">Due date cannot be before the invoice date.</span>}</label>
              </div>
            </section>

            <section className="panel form-panel">
              <div className="section-heading"><div><h2>Line items</h2><p>Describe each service or product on this invoice.</p></div><span className="step-index">02</span></div>
              <div className="line-items">
                {lines.map((line, index) => {
                  const invalidLine = lineErrors[index];
                  return (
                    <div className="line-item" key={line.key}>
                      <div className="line-item-top"><span className="line-number">ITEM {String(index + 1).padStart(2, '0')}</span><button type="button" className="remove-line" onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))} disabled={lines.length === 1} aria-label="Remove line item"><Trash2 size={15} /> Remove</button></div>
                      <label className="form-field">Description <span className="required">*</span><input value={line.description} onChange={(event) => updateLine(line.key, 'description', event.target.value)} placeholder="e.g. Product design services" aria-invalid={attempted && !line.description.trim()} />{attempted && !line.description.trim() && <span className="field-error">Description is required.</span>}</label>
                      <div className="line-fields">
                        <label className="form-field">Quantity <input type="number" min="0.001" step="0.001" value={line.quantity} onChange={(event) => updateLine(line.key, 'quantity', event.target.value)} aria-invalid={attempted && (Number(line.quantity) <= 0 || hasTooManyDecimals(line.quantity, 3))} /></label>
                        <label className="form-field">Unit price <input type="number" min="0" step="0.01" value={line.unit_price} onChange={(event) => updateLine(line.key, 'unit_price', event.target.value)} placeholder="0.00" aria-invalid={attempted && (line.unit_price === '' || Number(line.unit_price) < 0 || hasTooManyDecimals(line.unit_price, 2))} /></label>
                        <label className="form-field">Tax rate (%) <input type="number" min="0" max="100" step="0.01" value={line.tax_rate} onChange={(event) => updateLine(line.key, 'tax_rate', event.target.value)} aria-invalid={attempted && (Number(line.tax_rate) < 0 || Number(line.tax_rate) > 100 || hasTooManyDecimals(line.tax_rate, 2))} /></label>
                        <div className="line-total"><span>Line total</span><strong>{formatCurrency((Number(line.quantity) || 0) * (Number(line.unit_price) || 0))}</strong></div>
                      </div>
                      {attempted && invalidLine && <span className="field-error line-error">Use a description, positive quantity (up to 3 decimals), non-negative price (up to 2 decimals), and tax rate from 0 to 100 (up to 2 decimals).</span>}
                    </div>
                  );
                })}
              </div>
              <button type="button" className="button button-add-line" onClick={addLine}><Plus size={16} /> Add line item</button>
            </section>
          </div>

          <aside className="panel totals-panel">
            <div className="section-heading"><div><h2>Summary</h2><p>Invoice totals</p></div><span className="step-index">03</span></div>
            <div className="totals-list">
              <div><span>Subtotal</span><strong>{formatCurrency(totals.subtotal)}</strong></div>
              <div><span>Tax</span><strong>{formatCurrency(totals.tax)}</strong></div>
              <div className="grand-total"><span>Total due</span><strong>{formatCurrency(totals.subtotal + totals.tax)}</strong></div>
            </div>
            <div className="totals-note">Tax is calculated for each line item based on its tax rate.</div>
            <button type="submit" className="button button-secondary button-wide" disabled={saving}>{saving ? 'Saving…' : 'Save as draft'}</button>
            <button type="button" className="button button-primary button-wide" disabled={saving} onClick={() => void handleSubmit({ preventDefault: () => undefined }, true)}>{saving ? 'Processing…' : 'Save & issue invoice'}</button>
            <p className="issue-hint">Issued invoices are ready to send to your customer.</p>
          </aside>
        </div>
      </form>
    </section>
  );
}
