import { useState } from 'react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';

const emptyForm = { name: '', sku: '', price: '', quantity_in_stock: '0' };

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(value)
  );
}

function validateForm(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!form.sku.trim()) errors.sku = 'SKU is required';
  const price = parseFloat(form.price);
  if (form.price === '' || Number.isNaN(price) || price <= 0) errors.price = 'Valid price required';
  const qty = parseInt(form.quantity_in_stock, 10);
  if (form.quantity_in_stock === '' || Number.isNaN(qty) || qty < 0) {
    errors.quantity_in_stock = 'Stock must be 0 or greater';
  }
  return errors;
}

export default function ProductsPage() {
  const { products, fetchProducts, fetchDashboard, showMessage, handleError } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setForm(emptyForm);
    setErrors({});
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateForm(form);
    setErrors(validation);
    if (Object.keys(validation).length) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        price: parseFloat(form.price),
        quantity_in_stock: parseInt(form.quantity_in_stock, 10),
      };

      if (editing) {
        await api.updateProduct(editing.id, payload);
        showMessage('success', 'Product updated');
      } else {
        await api.createProduct(payload);
        showMessage('success', 'Product created');
      }
      resetForm();
      await fetchProducts();
      await fetchDashboard();
    } catch (err) {
      handleError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      quantity_in_stock: String(product.quantity_in_stock),
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.deleteProduct(id);
      showMessage('success', 'Product deleted');
      await fetchProducts();
      await fetchDashboard();
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <>
      <header className="page-header">
        <h1>Products</h1>
        <p>Manage catalog and inventory levels</p>
      </header>

      <div className="card">
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>
          {editing ? `Edit Product #${editing.id}` : 'Add Product'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Product Name</label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="sku">SKU / Code</label>
              <input
                id="sku"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className={errors.sku ? 'error' : ''}
              />
              {errors.sku && <span className="field-error">{errors.sku}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="price">Price</label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={errors.price ? 'error' : ''}
              />
              {errors.price && <span className="field-error">{errors.price}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="stock">Quantity in Stock</label>
              <input
                id="stock"
                type="number"
                min="0"
                value={form.quantity_in_stock}
                onChange={(e) => setForm({ ...form, quantity_in_stock: e.target.value })}
                className={errors.quantity_in_stock ? 'error' : ''}
              />
              {errors.quantity_in_stock && (
                <span className="field-error">{errors.quantity_in_stock}</span>
              )}
            </div>
          </div>
          <div className="btn-group">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {editing ? 'Update Product' : 'Add Product'}
            </button>
            {editing && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Product List</h2>
        {products.length === 0 ? (
          <p className="empty-state">No products yet</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.sku}</td>
                    <td>{formatPrice(p.price)}</td>
                    <td>
                      {p.quantity_in_stock <= 10 ? (
                        <span className="badge badge-warning">{p.quantity_in_stock}</span>
                      ) : (
                        <span className="badge badge-success">{p.quantity_in_stock}</span>
                      )}
                    </td>
                    <td>
                      <div className="btn-group">
                        <button type="button" className="btn btn-secondary" onClick={() => startEdit(p)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-danger" onClick={() => handleDelete(p.id)}>
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
    </>
  );
}
