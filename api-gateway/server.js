import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan("tiny"));

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

app.use(
  "/api/customers",
  createProxyMiddleware({
    target: "http://customer-service:3001",
    ...proxyOptions,
  }),
);

app.use(
  "/api/products",
  createProxyMiddleware({
    target: "http://product-service:3002",
    ...proxyOptions,
  }),
);

app.use(
  "/api/orders",
  createProxyMiddleware({
    target: "http://order-service:3003",
    ...proxyOptions,
  }),
);

app.use(
  "/api/invoices",
  createProxyMiddleware({
    target: "http://invoice-service:3004",
    ...proxyOptions,
  }),
);

app.listen(PORT, () => {
  console.log(`API Gateway démarré sur http://localhost:${PORT}`);
});
