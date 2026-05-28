// backend/models/Integration.js
const mongoose = require('mongoose');

const IntegrationSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        unique: true
    },
    apiKey: { type: String, required: true, unique: true },
    webhookUrl: { type: String, default: '' },
    webhookSecret: { type: String, required: true },
    
    // 👇 BADLAV YAHAN HAI: Category 2 ke fields add kiye
    slackWebhookUrl: { type: String, default: '' },
    teamsWebhookUrl: { type: String, default: '' },
    whatsappApiToken: { type: String, default: '' },
    whatsappPhoneNumberId: { type: String, default: '' },

    isActive: { type: Boolean, default: true },
    usageMetrics: {
        totalRequests: { type: Number, default: 0 },
        webhookDeliveries: { type: Number, default: 0 },
        lastUsedAt: { type: Date }
    }
}, { timestamps: true });

module.exports = mongoose.model('Integration', IntegrationSchema);