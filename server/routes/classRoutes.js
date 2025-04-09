const express = require('express');
const { tokenMiddleware } = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const { getUpcomingClasses } = require('../handlers/upcomingClassesHandler');
const { getTodayClasses } = require('../handlers/todayClassesHandler');
const { handleError } = require('../utils/errorHandler');

const router = express.Router();

router.get("/upcoming-classes", tokenMiddleware, cacheMiddleware, async (req, res) => {
  try {
    const upcomingClasses = await getUpcomingClasses(req.headers["x-csrf-token"]);
    res.json(upcomingClasses);
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/today-classes", tokenMiddleware, cacheMiddleware, async (req, res) => {
  try {
    const todayClasses = await getTodayClasses(req.headers["x-csrf-token"]);
    res.json(todayClasses);
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;