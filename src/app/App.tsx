import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { CustomersPage } from '../pages/customers/CustomersPage';
import { CreateInvoicePage } from '../pages/invoices/CreateInvoicePage';
import { InvoiceDetailsPage } from '../pages/invoices/InvoiceDetailsPage';
import { InvoicesPage } from '../pages/invoices/InvoicesPage';

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/invoices" replace />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoices/new" element={<CreateInvoicePage />} />
        <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="*" element={<Navigate to="/invoices" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
