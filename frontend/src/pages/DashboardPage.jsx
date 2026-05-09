import { useEffect, useState } from "react";
import { fetchDashboardMetrics } from "../api";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardMetrics().then(setMetrics).catch((err) => {
      setError(err.response?.data?.message || err.message || "Failed to load KPI");
    });
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!metrics) return <p>Loading dashboard...</p>;

  return (
    <div>
      <h2>Reporting Dashboard</h2>
      <section className="kpi-grid">
        <article className="kpi-card">
          <h3>Total Orders</h3>
          <p>{metrics.ordersCount}</p>
        </article>
        <article className="kpi-card">
          <h3>Cancelled Orders</h3>
          <p>{metrics.cancelledOrders}</p>
        </article>
        <article className="kpi-card">
          <h3>Total Invoices</h3>
          <p>{metrics.invoicesCount}</p>
        </article>
        <article className="kpi-card">
          <h3>Paid Amount</h3>
          <p>{Number(metrics.paidAmount || 0).toFixed(2)}</p>
        </article>
        <article className="kpi-card">
          <h3>Pending Amount</h3>
          <p>{Number(metrics.pendingAmount || 0).toFixed(2)}</p>
        </article>
        <article className="kpi-card">
          <h3>Low Stock Products</h3>
          <p>{metrics.lowStockCount}</p>
        </article>
      </section>
    </div>
  );
}
