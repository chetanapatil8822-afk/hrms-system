const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');

// Saare routes safely mapped hain
router.get('/config', integrationController.getIntegrationData);
router.post('/regenerate-key', integrationController.regenerateApiKey);
router.post('/update-webhook', integrationController.updateWebhookUrl);
router.post('/update-channels', integrationController.updateNotificationChannels);

module.exports = router;