import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_SECRET = process.env.AUTH_SECRET || "dev-secret-key";

const users = [
  {
    username: "admin",
    password: "admin123",
    role: "admin",
  },
  {
    username: "sales",
    password: "sales123",
    role: "sales",
  },
  {
    username: "inventory",
    password: "inventory123",
    role: "inventory",
  },
  {
    username: "accounting",
    password: "accounting123",
    role: "accounting",
  },
];

app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());

function createToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expectedSignature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(body)
    .digest("base64url");
  if (signature !== expectedSignature) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (payload.exp && Date.now() > payload.exp) return null;
  return payload;
}

function requireAuth(req, res, next) {
  if (req.path === "/health" || req.path === "/api/auth/login") {
    return next();
  }
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.user = payload;
  return next();
}

function requireRoles(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}

const proxyOptions = {
  changeOrigin: true,
  secure: false,
  timeout: 30000,
  proxyTimeout: 30000,
  onError(err, req, res) {
    console.error("[Gateway Error]", err.message);
    res.status(502).json({ message: "Bad gateway", error: err.message });
  },
  onProxyReq(proxyReq, req, res) {
    // Ensure JSON bodies are re-streamed after express.json() parsing.
    fixRequestBody(proxyReq, req, res);
    console.log(
      `[Gateway Proxy] ${req.method} ${req.originalUrl} -> ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`,
    );
  },
  onProxyRes(proxyRes, req, res) {
    console.log(
      `[Gateway ProxyRes] ${req.method} ${req.originalUrl} ${proxyRes.statusCode}`,
    );
  },
};

app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    service: "api-gateway",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = users.find(
    (item) => item.username === username && item.password === password,
  );
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = createToken({
    sub: user.username,
    role: user.role,
    exp: Date.now() + 24 * 60 * 60 * 1000,
  });
  return res.json({
    token,
    user: { username: user.username, role: user.role },
  });
});

app.use(requireAuth);

app.use(
  "/api/customers",
  requireRoles(["admin", "sales"]),
  createProxyMiddleware({
    target: "http://customer-service:3001",
    ...proxyOptions,
  }),
);

app.use(
  "/api/products",
  requireRoles(["admin", "inventory", "sales"]),
  createProxyMiddleware({
    target: "http://product-service:3002",
    ...proxyOptions,
  }),
);

app.use(
  "/api/suppliers",
  requireRoles(["admin", "inventory", "sales"]),
  createProxyMiddleware({
    target: "http://product-service:3002",
    ...proxyOptions,
  }),
);

app.use(
  "/api/purchase-orders",
  requireRoles(["admin", "inventory", "sales"]),
  createProxyMiddleware({
    target: "http://product-service:3002",
    ...proxyOptions,
  }),
);

app.use(
  "/api/orders",
  requireRoles(["admin", "sales", "inventory"]),
  createProxyMiddleware({
    target: "http://order-service:3003",
    ...proxyOptions,
  }),
);

app.use(
  "/api/invoices",
  requireRoles(["admin", "accounting", "sales"]),
  createProxyMiddleware({
    target: "http://invoice-service:3004",
    ...proxyOptions,
  }),
);

app.get("/api/dashboard/metrics", requireRoles(["admin", "accounting", "sales"]), async (req, res) => {
  try {
    const [ordersRes, invoicesRes, productsRes] = await Promise.all([
      fetch("http://order-service:3003/api/orders"),
      fetch("http://invoice-service:3004/api/invoices"),
      fetch("http://product-service:3002/api/products/low-stock"),
    ]);
    const orders = await ordersRes.json();
    const invoices = await invoicesRes.json();
    const lowStockData = await productsRes.json();
    const invoicesList = Array.isArray(invoices) ? invoices : invoices.data || [];
    const ordersList = Array.isArray(orders) ? orders : orders.data || [];
    const lowStockList = Array.isArray(lowStockData?.data) ? lowStockData.data : [];
    const paidAmount = invoicesList
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
    const pendingAmount = invoicesList
      .filter((invoice) => invoice.status !== "paid")
      .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
    res.json({
      ordersCount: ordersList.length,
      invoicesCount: invoicesList.length,
      paidAmount,
      pendingAmount,
      lowStockCount: lowStockList.length,
      cancelledOrders: ordersList.filter((order) => order.status === "cancelled").length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`API Gateway démarré sur http://localhost:${PORT}`);
});
