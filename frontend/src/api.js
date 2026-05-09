import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

export async function createCustomer(customer) {
  const response = await api.post("/customers", customer);
  return response.data.data || response.data;
}

export async function createProduct(product) {
  const response = await api.post("/products", product);
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
