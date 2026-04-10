import client from "prom-client";

// Create a Registry
const register = new client.Registry();

// Add default Node.js metrics (CPU, memory, event loop)
client.collectDefaultMetrics({ register });

// 🔹 HTTP request counter
export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
});

// 🔹 Request duration histogram
export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
});

// 🔹 Active connections gauge
export const activeConnections = new client.Gauge({
  name: "active_connections",
  help: "Number of active connections",
});

// Register all metrics
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);
register.registerMetric(activeConnections);

export default register;