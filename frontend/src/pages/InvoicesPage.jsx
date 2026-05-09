import { useEffect, useState } from "react";
import { fetchInvoices } from "../api";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchInvoices()
      .then(setInvoices)
      .catch((err) => setError(err.message || "Failed to load invoices"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2>Invoices</h2>
      {loading && <p>Loading invoices...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Order ID</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice._id || invoice.id}>
                <td>{invoice._id || invoice.id}</td>
                <td>
                  {invoice.orderId ||
                    invoice.order?.id ||
                    (typeof invoice.order === "string"
                      ? invoice.order
                      : "Unknown")}
                </td>
                <td>{invoice.totalAmount ?? invoice.amount}</td>
                <td>{invoice.status || "pending"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
