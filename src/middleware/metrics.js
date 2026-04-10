import {
  httpRequestsTotal,
  httpRequestDuration,
  activeConnections,
} from "../lib/metrics.js";

export default function metricsMiddleware(req, res, next) {
  const start = Date.now();

  activeConnections.inc();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;

    const route = req.route?.path || req.originalUrl;

    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();

    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    activeConnections.dec();
  });

  next();
}