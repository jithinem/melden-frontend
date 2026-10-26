import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Search, UserPlus, Users } from 'lucide-react';
import api from '../../api/client';
import { getApiErrorMessage } from '../../api/getApiErrorMessage';
import { ApiEnvelope, ApiList, Customer, customerName } from '../../types/invoicing';

interface CustomerForm {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  gst_number: string;
}

const initialForm: CustomerForm = { first_name: '', last_name: '', email: '', phone_number: '', gst_number: '' };

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CustomerForm, string>>>({});
  const [saving, setSaving] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (active) params.is_active = active;
      const response = await api.get<ApiEnvelope<ApiList<Customer>>>('/customers', { params });
      setCustomers(response.data.data.items);
      setPages(response.data.data.pages || 1);
      setTotal(response.data.data.total);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not load customers. Check that the API is running.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, active]);

  useEffect(() => { void loadCustomers(); }, [loadCustomers]);

  function validateForm() {
    const errors: Partial<Record<keyof CustomerForm, string>> = {};
    if (!form.first_name.trim()) errors.first_name = 'First name is required';
    if (!form.last_name.trim()) errors.last_name = 'Last name is required';
    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address';
    if (form.phone_number && !/^[+\d\s().-]{7,20}$/.test(form.phone_number.trim())) errors.phone_number = 'Enter a valid phone number';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    setError('');
    try {
      await api.post('/customers', {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.trim() || null,
        gst_number: form.gst_number.trim() || null,
        is_active: true,
      });
      setModalOpen(false);
      setForm(initialForm);
      setFieldErrors({});
      setPage(1);
      await loadCustomers();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not create customer.'));
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: keyof CustomerForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow"><Users size={15} /> DIRECTORY</div>
          <h1>Customers</h1>
          <p className="page-description">Manage the people and businesses you bill.</p>
        </div>
        <button className="button button-primary" onClick={() => { setError(''); setModalOpen(true); }}>
          <UserPlus size={17} /> Add customer
        </button>
      </div>

      {error && !modalOpen && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="panel">
        <div className="toolbar">
          <label className="search-field">
            <Search size={18} />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name, email or GST number" aria-label="Search customers" />
          </label>
          <label className="filter-field">
            <span>Status</span>
            <select value={active} onChange={(event) => { setActive(event.target.value); setPage(1); }}>
              <option value="">All customers</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <span className="result-count">{total} customers</span>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Customer</th><th>Email</th><th>Phone</th><th>GST number</th><th>Status</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="table-message">Loading customers…</td></tr> :
                customers.length === 0 ? <tr><td colSpan={5} className="table-message">No customers match your search.</td></tr> :
                  customers.map((customer) => (
                    <tr key={customer.id}>
                      <td><div className="customer-cell"><span className="avatar-initials">{customer.first_name[0]}{customer.last_name[0]}</span><span className="table-primary">{customerName(customer)}</span></div></td>
                      <td>{customer.email}</td>
                      <td>{customer.phone_number || <span className="subtle">—</span>}</td>
                      <td>{customer.gst_number || <span className="subtle">—</span>}</td>
                      <td><span className={`status-pill ${customer.is_active ? 'status-active' : 'status-inactive'}`}>{customer.is_active ? 'Active' : 'Inactive'}</span></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Page {page} of {pages}</span>
          <div className="pagination-actions">
            <button className="button button-secondary button-small" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</button>
            <button className="button button-secondary button-small" disabled={page >= pages || loading} onClick={() => setPage((current) => current + 1)}>Next</button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="customer-modal-title">
            <div className="modal-heading">
              <div><div className="eyebrow">NEW RECORD</div><h2 id="customer-modal-title">Add customer</h2><p>Enter the customer details below.</p></div>
              <button className="icon-button" aria-label="Close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <label className="form-field">First name <span className="required">*</span><input autoFocus value={form.first_name} onChange={(event) => updateField('first_name', event.target.value)} aria-invalid={Boolean(fieldErrors.first_name)} />{fieldErrors.first_name && <span className="field-error">{fieldErrors.first_name}</span>}</label>
                <label className="form-field">Last name <span className="required">*</span><input value={form.last_name} onChange={(event) => updateField('last_name', event.target.value)} aria-invalid={Boolean(fieldErrors.last_name)} />{fieldErrors.last_name && <span className="field-error">{fieldErrors.last_name}</span>}</label>
                <label className="form-field form-field-full">Email address <span className="required">*</span><input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} aria-invalid={Boolean(fieldErrors.email)} />{fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}</label>
                <label className="form-field">Phone number<input type="tel" value={form.phone_number} onChange={(event) => updateField('phone_number', event.target.value)} aria-invalid={Boolean(fieldErrors.phone_number)} />{fieldErrors.phone_number && <span className="field-error">{fieldErrors.phone_number}</span>}</label>
                <label className="form-field">GST number<input value={form.gst_number} onChange={(event) => updateField('gst_number', event.target.value)} /></label>
              </div>
              {error && <div className="alert alert-error modal-error" role="alert">{error}</div>}
              <div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Create customer'}</button></div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
