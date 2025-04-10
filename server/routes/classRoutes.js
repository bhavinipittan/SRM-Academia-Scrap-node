const express = require("express");
const { tokenMiddleware } = require("../middleware/authMiddleware");
const { cacheMiddleware } = require("../middleware/cacheMiddleware");
const { getUpcomingClasses } = require("../handlers/upcomingClassesHandler");
const {
  getTodayClasses,
  getTomorrowClasses,
  getDayAfterTomorrowClasses,
} = require("../handlers/todayClassesHandler");
const { handleError } = require("../utils/errorHandler");

const router = express.Router();

router.get(
  "/upcoming-classes",
  tokenMiddleware,
  cacheMiddleware,
  async (req, res) => {
    try {
      const upcomingClasses = await getUpcomingClasses(
        req.headers["x-csrf-token"]
      );
      res.json(upcomingClasses);
    } catch (error) {
      handleError(res, error);
    }
  }
);

router.get(
  "/today-classes",
  tokenMiddleware,
  cacheMiddleware,
  async (req, res) => {
    try {
      const todayClasses = await getTodayClasses(req.headers["x-csrf-token"]);
      res.json(todayClasses);
    } catch (error) {
      handleError(res, error);
    }
  }
);

router.get(
  "/tomorrow-classes",
  tokenMiddleware,
  cacheMiddleware,
  async (req, res) => {
    try {
      const tomorrowClasses = await getTomorrowClasses(
        req.headers["x-csrf-token"]
      );
      res.json(tomorrowClasses);
    } catch (error) {
      handleError(res, error);
    }
  }
);

router.get(
  "/day-after-tomorrow-classes",
  tokenMiddleware,
  cacheMiddleware,
  async (req, res) => {
    try {
      const dayAfterClasses = await getDayAfterTomorrowClasses(
        req.headers["x-csrf-token"]
      );
      res.json(dayAfterClasses);
    } catch (error) {
      handleError(res, error);
    }
  }
);

module.exports = router;
