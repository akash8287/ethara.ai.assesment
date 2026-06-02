import { useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';

const emptyForm = { full_name: '', email: '', phone: '' };

function validateForm(form) {
  const errors = {};
  if (!form.full_name.trim()) errors.full_name = 'Full name is required';
  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Valid email required';
  }
  if (!form.phone.trim()) errors.phone = 'Phone is required';
  return errors;
}

export default function CustomersPage() {
  const { customers, fetchCustomers, fetchDashboard, showMessage, handleError } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateForm(form);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setSubmitting(true);
    try {
      await api.createCustomer({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      showMessage('success', 'Customer created');
      setForm(emptyForm);
      await fetchCustomers();
      await fetchDashboard();
    } catch (err) {
      handleError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await api.deleteCustomer(id);
      showMessage('success', 'Customer deleted');
      await fetchCustomers();
      await fetchDashboard();
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <>
      <header className="page-header">
        <h1>Customers</h1>
        <p>Manage customer records</p>
      </header>

      <div className="card">
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Add Customer</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className={errors.full_name ? 'error' : ''}
              />
              {errors.full_name && <span className="field-error">{errors.full_name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            Add Customer
          </button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Customer List</h2>
        {customers.length === 0 ? (
          <p className="empty-state">No customers yet</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.full_name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td>
                      <button type="button" className="btn btn-danger" onClick={() => handleDelete(c.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
