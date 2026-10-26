export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  gst_number: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LineItem {
  id?: number;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  tax_rate: number | string;
  line_total?: number | string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer: Pick<Customer, 'id' | 'first_name' | 'last_name' | 'email'> & { gst_number?: string | null };
  invoice_date: string;
  due_date: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID';
  sub_total: number | string;
  tax_amount: number | string;
  total: number | string;
  amount_paid?: number | string;
  balance_due?: number | string;
  line_items?: LineItem[];
  created_at?: string;
}

export interface ApiList<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const customerName = (customer: Pick<Customer, 'first_name' | 'last_name'>) =>
  `${customer.first_name} ${customer.last_name}`;

export const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value) || 0);

export const formatDate = (value: string) => {
  const dateOnly = value.slice(0, 10);
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${dateOnly}T00:00:00`));
};
