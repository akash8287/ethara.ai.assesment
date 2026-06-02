import { useApp } from '../context/AppContext';

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(value)
  );
}

export default function DashboardPage() {
  const { dashboard, loading } = useApp();

  if (loading && !dashboard) {
    return <p className="empty-state">Loading dashboard...</p>;
  }

  const summary = dashboard || {
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    low_stock_products: [],
  };

  return (
    <>
      <header className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your inventory and orders</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total Products</div>
          <div className="value">{summary.total_products}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Customers</div>
          <div className="value">{summary.total_customers}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total Orders</div>
          <div className="value">{summary.total_orders}</div>
        </div>
        <div className="stat-card">
          <div className="label">Low Stock Items</div>
          <div className="value">{summary.low_stock_products?.length ?? 0}</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Low Stock Products (≤ 10 units)</h2>
        {summary.low_stock_products?.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {summary.low_stock_products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.sku}</td>
                    <td>{formatPrice(p.price)}</td>
                    <td>
                      <span className="badge badge-warning">{p.quantity_in_stock}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No low stock products</p>
        )}
      </div>
    </>
  );
}
