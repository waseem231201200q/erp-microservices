import { useEffect, useState } from "react";
import {
  fetchOrders,
  fetchProducts,
  fetchCustomers,
  createOrder,
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
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id || order.id}>
                <td>{order._id || order.id}</td>
                <td>{order.customerName}</td>
                <td>{order.productName}</td>
                <td>{order.quantity}</td>
                <td>{order.status || "created"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
