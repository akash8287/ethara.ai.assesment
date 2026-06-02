import { useState } from 'react';
import { api } from '../api/client';
import Modal from '../components/Modal';
import { useApp } from '../context/AppContext';

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(value)
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

export default function OrdersPage() {
  const {
    orders,
    products,
    customers,
    fetchOrders,
    fetchProducts,
    fetchDashboard,
    showMessage,
    handleError,
  } = useApp();

  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState([{ product_id: '', quantity: '1' }]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);

  const addLine = () => setLines([...lines, { product_id: '', quantity: '1' }]);

  const updateLine = (index, field, value) => {
    const next = [...lines];
    next[index] = { ...next[index], [field]: value };
    setLines(next);
  };

  const removeLine = (index) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const validateOrder = () => {
    const errs = {};
    if (!customerId) errs.customer = 'Select a customer';
    const lineErrors = [];
    const seen = new Set();
    lines.forEach((line, i) => {
      const le = {};
      if (!line.product_id) le.product = 'Select a product';
      const qty = parseInt(line.quantity, 10);
      if (!line.quantity || Number.isNaN(qty) || qty < 1) le.quantity = 'Min quantity is 1';
      if (line.product_id) {
        if (seen.has(line.product_id)) le.product = 'Duplicate product in order';
        seen.add(line.product_id);
        const product = products.find((p) => p.id === Number(line.product_id));
        if (product && qty > product.quantity_in_stock) {
          le.quantity = `Only ${product.quantity_in_stock} in stock`;
        }
      }
      lineErrors[i] = le;
    });
    if (lineErrors.some((le) => Object.keys(le).length)) errs.lines = lineErrors;
    return errs;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const validation = validateOrder();
    setErrors(validation);
    const hasLineErrors = validation.lines?.some((le) => Object.keys(le).length > 0);
    if (validation.customer || hasLineErrors) return;

    setSubmitting(true);
    try {
      await api.createOrder({
        customer_id: parseInt(customerId, 10),
        items: lines.map((l) => ({
          product_id: parseInt(l.product_id, 10),
          quantity: parseInt(l.quantity, 10),
        })),
      });
      showMessage('success', 'Order created');
      setCustomerId('');
      setLines([{ product_id: '', quantity: '1' }]);
      setErrors({});
      await Promise.all([fetchOrders(), fetchProducts(), fetchDashboard()]);
    } catch (err) {
      handleError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel/delete this order? Stock will be restored.')) return;
    try {
      await api.deleteOrder(id);
      showMessage('success', 'Order deleted');
      await Promise.all([fetchOrders(), fetchProducts(), fetchDashboard()]);
    } catch (err) {
      handleError(err);
    }
  };

  const viewDetails = async (id) => {
    try {
      const order = await api.getOrder(id);
      setDetailOrder(order);
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <>
      <header className="page-header">
        <h1>Orders</h1>
        <p>Create and track customer orders</p>
      </header>

      <div className="card">
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Create Order</h2>
        <form onSubmit={handleCreate}>
          <div className="form-group" style={{ maxWidth: 320, marginBottom: '1rem' }}>
            <label htmlFor="customer">Customer</label>
            <select
              id="customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className={errors.customer ? 'error' : ''}
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.email})
                </option>
              ))}
            </select>
            {errors.customer && <span className="field-error">{errors.customer}</span>}
          </div>

          <p style={{ margin: '0 0 0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Order items
          </p>
          {lines.map((line, index) => (
            <div key={index} className="order-line">
              <div className="form-group">
                <label>Product</label>
                <select
                  value={line.product_id}
                  onChange={(e) => updateLine(index, 'product_id', e.target.value)}
                  className={errors.lines?.[index]?.product ? 'error' : ''}
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatPrice(p.price)} (stock: {p.quantity_in_stock})
                    </option>
                  ))}
                </select>
                {errors.lines?.[index]?.product && (
                  <span className="field-error">{errors.lines[index].product}</span>
                )}
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                  className={errors.lines?.[index]?.quantity ? 'error' : ''}
                />
                {errors.lines?.[index]?.quantity && (
                  <span className="field-error">{errors.lines[index].quantity}</span>
                )}
              </div>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeLine(index)}
                disabled={lines.length === 1}
              >
                Remove
              </button>
            </div>
          ))}

          <div className="btn-group" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={addLine}>
              Add line item
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              Create Order
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Order List</h2>
        {orders.length === 0 ? (
          <p className="empty-state">No orders yet</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.customer_name}</td>
                    <td>{formatPrice(o.total_amount)}</td>
                    <td>{formatDate(o.created_at)}</td>
                    <td>
                      <div className="btn-group">
                        <button type="button" className="btn btn-secondary" onClick={() => viewDetails(o.id)}>
                          Details
                        </button>
                        <button type="button" className="btn btn-danger" onClick={() => handleDelete(o.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailOrder && (
        <Modal title={`Order #${detailOrder.id}`} onClose={() => setDetailOrder(null)}>
          <p>
            <strong>Customer:</strong> {detailOrder.customer_name} ({detailOrder.customer_email})
          </p>
          <p>
            <strong>Total:</strong> {formatPrice(detailOrder.total_amount)}
          </p>
          <p>
            <strong>Placed:</strong> {formatDate(detailOrder.created_at)}
          </p>
          <div className="table-wrap" style={{ marginTop: '1rem' }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {detailOrder.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name}</td>
                    <td>{item.product_sku}</td>
                    <td>{item.quantity}</td>
                    <td>{formatPrice(item.unit_price)}</td>
                    <td>{formatPrice(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setDetailOrder(null)}>
            Close
          </button>
        </Modal>
      )}
    </>
  );
}
