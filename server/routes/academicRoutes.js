const express = require('express');
const { tokenMiddleware } = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const { getCourses } = require('../handlers/courseHandler');
const { getCalendar } = require('../handlers/calendarHandler');
const { getTodayDayOrder } = require('../handlers/dayOrderHandler');
const { getMarks } = require('../handlers/marksHandler');
const { getAttendance } = require('../handlers/attendanceHandler');
const { getTimetable } = require('../handlers/timetableHandler');
const { handleError } = require('../utils/errorHandler');

const router = express.Router();

router.get("/courses", tokenMiddleware, cacheMiddleware, async (req, res) => {
  try {
    const courses = await getCourses(req.headers["x-csrf-token"]);
    res.json(courses);
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/calendar", tokenMiddleware, cacheMiddleware, async (req, res) => {
  try {
    const calendar = await getCalendar(req.headers["x-csrf-token"]);
    res.json(calendar);
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/dayorder", tokenMiddleware, cacheMiddleware, async (req, res) => {
  try {
    const dayOrder = await getTodayDayOrder(req.headers["x-csrf-token"]);
    res.json(dayOrder);
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/marks", tokenMiddleware, cacheMiddleware, async (req, res) => {
  try {
    const marks = await getMarks(req.headers["x-csrf-token"]);
    res.json(marks);
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/attendance", tokenMiddleware, cacheMiddleware, async (req, res) => {
  try {
    const attendance = await getAttendance(req.headers["x-csrf-token"]);
    res.json(attendance);
  } catch (error) {
    handleError(res, error);
  }
});

router.get("/timetable", tokenMiddleware, cacheMiddleware, async (req, res) => {
  try {
    const timetable = await getTimetable(req.headers["x-csrf-token"]);
    res.json(timetable);
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;