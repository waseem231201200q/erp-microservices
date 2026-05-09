import { useEffect, useState } from "react";
import {
  fetchOrders,
  fetchProducts,
  fetchCustomers,
  createOrder,
  updateOrderStatus,
} from "../api";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Helper function to enrich order data with customer and product names
  const enrichOrder = (order, customersData, productsData) => {
    const customer = customersData.find(
      (c) => c._id === order.customerId || c.id === order.customerId,
    );
    const enriched = { ...order };
    enriched.customerName = customer?.name || "Unknown";

    // Enrich products with names
    if (order.products && Array.isArray(order.products)) {
      enriched.productName = order.products
        .map((p) => {
          const prod = productsData.find(
            (pr) => pr._id === p.productId || pr.id === p.productId,
          );
          return prod?.name || "Unknown";
        })
        .join(", ");
      enriched.quantity = order.products.reduce(
        (sum, p) => sum + p.quantity,
        0,
      );
    }

    return enriched;
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchOrders(), fetchProducts(), fetchCustomers()])
      .then(([ordersData, productsData, customersData]) => {
        const enrichedOrders = ordersData.map((order) =>
          enrichOrder(order, customersData, productsData),
        );
        setOrders(enrichedOrders);
        setProducts(productsData);
        setCustomers(customersData);
      })
      .catch((err) => setError(err.message || "Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedCustomer || !selectedProduct || quantity < 1) {
      setError("Select a customer, a product and a quantity of at least 1.");
      return;
    }

    try {
      const order = {
        customerId: selectedCustomer,
        productId: selectedProduct,
        quantity: Number(quantity),
      };
      const created = await createOrder(order);
      // Enrich the new order before adding to list
      const enrichedOrder = enrichOrder(created, customers, products);
      setOrders((current) => [...current, enrichedOrder]);
      setSuccess("Order created successfully.");
      setSelectedCustomer("");
      setSelectedProduct("");
      setQuantity(1);
    } catch (err) {
      setError(err.message || "Failed to create order");
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    setError(null);
    setSuccess(null);
    setUpdatingId(orderId);

    try {
      const updatedOrder = await updateOrderStatus(orderId, status);
      const enrichedOrder = enrichOrder(updatedOrder, customers, products);
      setOrders((current) =>
        current.map((order) =>
          (order._id || order.id) === orderId ? enrichedOrder : order,
        ),
      );
      setSuccess(`Order status updated to "${status}".`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update order status",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const canCancelOrder = (status) =>
    status !== "cancelled" && status !== "delivered";

  const canMarkDelivered = (status) =>
    status !== "delivered" && status !== "cancelled";

  return (
    <div>
      <h2>Orders</h2>
      <section className="form-card">
        <h3>New Order</h3>
        <form onSubmit={handleSubmit}>
          <label>
            Customer
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option
                  key={customer._id || customer.id}
                  value={customer._id || customer.id}
                >
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Product
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option
                  key={product._id || product.id}
                  value={product._id || product.id}
                >
                  {product.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
          <button type="submit">Create Order</button>
        </form>
        {success && <p className="success">{success}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      {loading && <p>Loading orders...</p>}
      {!loading && error && !success && <p className="error">{error}</p>}

      {!loading && !error && (
        <section className="data-panel">
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id || order.id}>
                <td>{order._id || order.id}</td>
                <td>{order.customerName}</td>
                <td>{order.productName}</td>
                <td>{order.quantity}</td>
                <td>
                  <span className={`status-pill status-${order.status || "pending"}`}>
                    {order.status || "pending"}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="btn-inline"
                      onClick={() =>
                        handleStatusUpdate(order._id || order.id, "shipped")
                      }
                      disabled={updatingId === (order._id || order.id)}
                    >
                      Ship
                    </button>
                    <button
                      type="button"
                      className="btn-inline"
                      onClick={() =>
                        handleStatusUpdate(order._id || order.id, "delivered")
                      }
                      disabled={
                        updatingId === (order._id || order.id) ||
                        !canMarkDelivered(order.status)
                      }
                    >
                      Deliver
                    </button>
                    <button
                      type="button"
                      className="btn-danger btn-inline"
                      onClick={() =>
                        handleStatusUpdate(order._id || order.id, "cancelled")
                      }
                      disabled={
                        updatingId === (order._id || order.id) ||
                        !canCancelOrder(order.status)
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
        </section>
      )}
    </div>
  );
}
