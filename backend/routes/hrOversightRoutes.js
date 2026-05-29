// backend/routes/hrOversightRoutes.js
const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hrOversightController');

router.get('/global-summary', hrController.getGlobalHROversight);
// Charts API setup
router.get('/monthly-trends', hrController.getMonthlyHRTrends);

module.exports = router;