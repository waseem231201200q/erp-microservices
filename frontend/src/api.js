import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("erp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function login(username, password) {
  const response = await api.post("/auth/login", { username, password });
  return response.data;
}

export async function fetchCustomers() {
  const response = await api.get("/customers");
  return response.data.data || response.data;
}

export async function fetchProducts() {
  const response = await api.get("/products");
  return response.data.data || response.data;
}

export async function fetchOrders() {
  const response = await api.get("/orders");
  return response.data.data || response.data;
}

export async function fetchInvoices() {
  const response = await api.get("/invoices");
  return response.data.data || response.data;
}

export async function updateInvoiceStatus(invoiceId, payload) {
  const response = await api.patch(`/invoices/${invoiceId}/status`, payload);
  return response.data.invoice || response.data.data || response.data;
}

export async function fetchDashboardMetrics() {
  const response = await api.get("/dashboard/metrics");
  return response.data.data || response.data;
}

export async function createCustomer(customer) {
  const response = await api.post("/customers", customer);
  return response.data.data || response.data;
}

export async function deleteCustomer(customerId) {
  const response = await api.delete(`/customers/${customerId}`);
  return response.data.data || response.data;
}

export async function createProduct(product) {
  const response = await api.post("/products", product);
  return response.data.data || response.data;
}

export async function deleteProduct(productId) {
  const response = await api.delete(`/products/${productId}`);
  return response.data.data || response.data;
}

export async function createOrder(order) {
  // Transform single product format to array format expected by backend
  const payload = {
    customerId: order.customerId,
    products: [
      {
        productId: order.productId,
        quantity: order.quantity,
      },
    ],
  };
  const response = await api.post("/orders", payload);
  return response.data.order || response.data.data || response.data;
}

export async function updateOrderStatus(orderId, status) {
  const response = await api.patch(`/orders/${orderId}/status`, { status });
  return response.data.order || response.data.data || response.data;
}

export async function fetchSuppliers() {
  const response = await api.get("/suppliers");
  return response.data.data || response.data;
}

export async function createSupplier(payload) {
  const response = await api.post("/suppliers", payload);
  return response.data.data || response.data;
}

export async function fetchPurchaseOrders() {
  const response = await api.get("/purchase-orders");
  return response.data.data || response.data;
}

export async function createPurchaseOrder(payload) {
  const response = await api.post("/purchase-orders", payload);
  return response.data.data || response.data;
}

export async function receivePurchaseOrder(id) {
  const response = await api.patch(`/purchase-orders/${id}/receive`);
  return response.data.data || response.data;
}
