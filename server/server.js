const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const etag = require("etag");
const { getAttendance } = require("./handlers/attendanceHandler");
const { handleError } = require("./utils/errorHandler");
const { getMarks } = require("./handlers/marksHandler");
const { getCalendar } = require("./handlers/calendarHandler");
const { getTodayDayOrder } = require("./handlers/dayOrderHandler");
const { getCourses } = require("./handlers/courseHandler");
const { getUser } = require("./handlers/userHandler");
const { getTimetable } = require("./handlers/timetableHandler");
const { login, logout } = require("./handlers/loginHandler");

if (process.env.DEV_MODE === "true") {
  dotenv.config();
}

const app = express();
const port = process.env.PORT || 9000;

app.use(bodyParser.json());
app.use(compression());
app.set("etag", true);

const cache = new Map();
const cacheMiddleware = (req, res, next) => {
  if (req.method !== "GET") return next();

  const key = req.path + "_" + req.headers["x-csrf-token"];
  const cachedBody = cache.get(key);

  if (cachedBody) {
    return res.json(cachedBody);
  }

  const originalJson = res.json;
  res.json = function (body) {
    cache.set(key, body);

    setTimeout(() => cache.delete(key), 2 * 60 * 1000);
    return originalJson.call(this, body);
  };

  next();
};

const urls = process.env.URL;
let allowedOrigins = "http://localhost:3000";
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  keyGenerator: (req) => {
    const token = req.headers["x-csrf-token"];
    if (token) {
      return encodeToken(token);
    }
    return req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "🔨 SHUT UP! Rate limit exceeded. Please try again later.",
    });
  },
});
app.use(limiter);

function encodeToken(str) {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `${hash}${(hash >> 1).toString(16)}${(hash >> 2).toString(32)}`;
}

// Routes
app.get("/hello", (req, res) => {
  res.json({ message: "Hello, World!" });
});

//login
app.post("/login", async (req, res) => {
  try {
    const { account: username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Missing account or password",
      });
    }

    const loginResult = await login(username, password);
    res.json(loginResult);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: error.message || "Internal server error",
    });
  }
});

// Add logout route
app.delete("/logout", tokenMiddleware, async (req, res) => {
  try {
    const token = req.headers["x-csrf-token"];
    const logoutResult = await logout(token);
    res.json(logoutResult);
  } catch (error) {
    handleError(res, error);
  }
});

//courses route
app.get("/courses", tokenMiddleware, cacheMiddleware, async (req, res) => {
  try {
    const courses = await getCourses(req.headers["x-csrf-token"]);
    res.json(courses);
  } catch (error) {
    handleError(res, error);
  }
});

// Calendar route
app.get("/calendar", tokenMiddleware, cacheMiddleware, async (req, res) => {
  try {
    const calendar = await getCalendar(req.headers["x-csrf-token"]);
    res.json(calendar);
  } catch (error) {
    handleError(res, error);
  }
});

// Day Order route
app.get("/dayorder", tokenMiddleware, cacheMiddleware, async (req, res) => {
  try {
    const dayOrder = await getTodayDayOrder(req.headers["x-csrf-token"]);
    res.json(dayOrder);
  } catch (error) {
    handleError(res, error);
  }
});

// Marks route
app.get("/marks", tokenMiddleware, cacheMiddleware, async (req, res) => {
  try {
    const marks = await getMarks(req.headers["x-csrf-token"]);
    res.json(marks);
  } catch (error) {
    handleError(res, error);
  }
});

// Attendance route
app.get("/attendance", tokenMiddleware, cacheMiddleware, async (req, res) => {
  try {
    const attendance = await getAttendance(req.headers["x-csrf-token"]);
    res.json(attendance);
  } catch (error) {
    handleError(res, error);
  }
});

// Timetable route
app.get("/timetable", tokenMiddleware, cacheMiddleware, async (req, res) => {
  try {
    const timetable = await getTimetable(req.headers["x-csrf-token"]);
    res.json(timetable);
  } catch (error) {
    handleError(res, error);
  }
});

// User route
app.get("/user", tokenMiddleware, cacheMiddleware, async (req, res) => {
  try {
    const user = await getUser(req.headers["x-csrf-token"]);
    res.json(user);
  } catch (error) {
    handleError(res, error);
  }
});

function tokenMiddleware(req, res, next) {
  const token = req.headers["x-csrf-token"];
  if (!token) {
    return res.status(400).json({
      error: "Missing X-CSRF-Token header",
    });
  }
  next();
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
