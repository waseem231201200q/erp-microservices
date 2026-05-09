import { useEffect, useState } from "react";
import { fetchInvoices, updateInvoiceStatus } from "../api";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchInvoices()
      .then(setInvoices)
      .catch((err) => setError(err.message || "Failed to load invoices"))
      .finally(() => setLoading(false));
  }, []);

  const changeStatus = async (invoiceId, status) => {
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateInvoiceStatus(invoiceId, {
        status,
        paymentMethod: status === "paid" ? "bank-transfer" : undefined,
        paymentReference:
          status === "paid" ? `PAY-${Date.now().toString().slice(-6)}` : undefined,
      });
      setInvoices((current) =>
        current.map((invoice) =>
          (invoice._id || invoice.id) === (updated._id || updated.id)
            ? updated
            : invoice,
        ),
      );
      setSuccess(`Invoice marked as ${status}.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update invoice");
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    if (statusFilter === "all") return true;
    return (invoice.status || "pending") === statusFilter;
  });

  return (
    <div>
      <h2>Invoices</h2>
      <section className="section-header">
        <h3>Invoice List</h3>
        <select
          className="compact-input"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </section>
      {loading && <p>Loading invoices...</p>}
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Order ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
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
                <td>
                  <span className={`status-pill status-${invoice.status || "pending"}`}>
                    {invoice.status || "pending"}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn-inline"
                      disabled={invoice.status === "paid"}
                      onClick={() => changeStatus(invoice._id || invoice.id, "paid")}
                    >
                      Mark Paid
                    </button>
                    <button
                      type="button"
                      className="btn-danger btn-inline"
                      disabled={invoice.status === "cancelled"}
                      onClick={() =>
                        changeStatus(invoice._id || invoice.id, "cancelled")
                      }
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
