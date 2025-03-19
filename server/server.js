const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const compression = require("compression");
const etag = require("etag");
const cluster = require("cluster");
const os = require("os");
const { limiter } = require("./middleware/rateLimiter");
const routes = require("./routes");

if (process.env.DEV_MODE === "true") {
  dotenv.config();
}

const numCPUs = os.cpus().length;

if (cluster.isPrimary || cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);
  console.log(`Starting ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    console.log("Starting a new worker");
    cluster.fork();
  });
} else {
  const app = express();
  const port = process.env.PORT || 9000;

  app.use(bodyParser.json());
  app.use(compression());
  app.set("etag", true);

  const urls = process.env.URL;
  let allowedOrigins = "http://localhost:5173";
  if (urls) {
    allowedOrigins += "," + urls;
  }

  app.use(
    cors({
      origin: allowedOrigins.split(","),
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Origin",
        "Content-Type",
        "Accept",
        "X-CSRF-Token",
        "Authorization",
      ],
      exposedHeaders: ["Content-Length"],
      credentials: true,
    })
  );

  app.use(limiter);

  app.use("/", routes);

  app.listen(port, "0.0.0.0", () => {
    console.log(`Worker ${process.pid} running on port ${port}`);
  });
}
