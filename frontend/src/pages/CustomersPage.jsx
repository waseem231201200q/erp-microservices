import { useEffect, useState } from "react";
import { fetchCustomers, createCustomer } from "../api";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name || !formData.email || !formData.phone) {
      setError("Name, email and phone are required");
      return;
    }

    try {
      await createCustomer(formData);
      setSuccess("Customer created successfully!");
      setFormData({ name: "", email: "", phone: "", address: "" });
      loadCustomers(); // Refresh the list
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create customer",
      );
    }
  };

  return (
    <div>
      <h2>Customers</h2>

      <section className="form-card">
        <h3>Add New Customer</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Name *
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Email *
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Phone *
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </label>
          <label>
            Address
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
            />
          </label>
          <button type="submit">Add Customer</button>
        </form>
        {success && <p className="success">{success}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      <section>
        <h3>Customer List</h3>
        {loading && <p>Loading customers...</p>}
        {!loading && !error && (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer._id || customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone || "-"}</td>
                  <td>
                    {typeof customer.address === "object"
                      ? `${customer.address.street || ""} ${customer.address.city || ""} ${customer.address.country || ""}`.trim() ||
                        "-"
                      : customer.address || "-"}
                  </td>
                  <td>
                    {new Date(
                      customer.createdAt || customer.created_at,
                    ).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
