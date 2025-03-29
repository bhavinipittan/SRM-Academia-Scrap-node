const express = require('express');
const { tokenMiddleware } = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');
const { getAllData } = require('../handlers/combinedHandler');
const { handleError } = require('../utils/errorHandler');

const router = express.Router();

router.get("/all", tokenMiddleware, cacheMiddleware, async (req, res) => {
  try {
    const allData = await getAllData(req.headers["x-csrf-token"]);
    res.json(allData);
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;