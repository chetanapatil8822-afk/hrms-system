// backend/routes/dataManagementRoutes.js
const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataManagementController');
const multer = require('multer');

// Multer memory storage set karein taaki seedhe buffer parse ho sake
const upload = multer({ storage: multer.memoryStorage() });

// Routes setup
router.get('/export-companies', dataController.exportCompanyData);
router.get('/storage-usage', dataController.getStorageMetrics);

// 👇 NEW BULK IMPORT ENDPOINT
router.post('/bulk-import', upload.single('datasheet'), dataController.bulkImportCompanies);
// Retention and Purging routes setup
router.get('/retention-policy', dataController.getRetentionPolicy);
router.post('/retention-policy/update', dataController.updateRetentionPolicy);
router.post('/purge-now', dataController.triggerImmediatePurge);

module.exports = router;