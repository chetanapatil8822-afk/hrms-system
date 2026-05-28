// backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportcontroller'); // Controller ko import kiya

// Purana dummy wala router.get() hata kar ab seedhe controller ke function ko call karenge
router.get('/platform-metrics', reportController.getPlatformReport);

module.exports = router;