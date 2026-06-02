import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api } from '../api/client';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  const handleError = useCallback(
    (err, fallback = 'Something went wrong') => {
      showMessage('error', err?.message || fallback);
    },
    [showMessage]
  );

  const fetchDashboard = useCallback(async () => {
    const data = await api.getDashboard();
    setDashboard(data);
    return data;
  }, []);

  const fetchProducts = useCallback(async () => {
    const data = await api.getProducts();
    setProducts(data);
    return data;
  }, []);

  const fetchCustomers = useCallback(async () => {
    const data = await api.getCustomers();
    setCustomers(data);
    return data;
  }, []);

  const fetchOrders = useCallback(async () => {
    const data = await api.getOrders();
    setOrders(data);
    return data;
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchDashboard(), fetchProducts(), fetchCustomers(), fetchOrders()]);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchDashboard, fetchProducts, fetchCustomers, fetchOrders, handleError]);

  const value = useMemo(
    () => ({
      products,
      customers,
      orders,
      dashboard,
      loading,
      message,
      showMessage,
      handleError,
      fetchDashboard,
      fetchProducts,
      fetchCustomers,
      fetchOrders,
      refreshAll,
      setProducts,
      setCustomers,
      setOrders,
    }),
    [
      products,
      customers,
      orders,
      dashboard,
      loading,
      message,
      showMessage,
      handleError,
      fetchDashboard,
      fetchProducts,
      fetchCustomers,
      fetchOrders,
      refreshAll,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
