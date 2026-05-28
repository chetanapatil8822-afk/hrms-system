const Integration = require('../models/Integration');
const axios = require('axios'); 
const crypto = require('crypto'); // API key generate karne ke liye standard library

// 🔍 1. Get Integration Data
exports.getIntegrationData = async (req, res) => {
    try {
        const { companyId } = req.query;
        let config = await Integration.findOne({ companyId });
        
        // Agar pehle se us company ka record na ho, toh default blank record bana dein
        if (!config) {
            config = await Integration.create({ 
                companyId, 
                apiKey: `sk_live_${crypto.randomBytes(16).toString('hex')}` 
            });
        }
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching integration config" });
    }
};

// 🔄 2. Regenerate API Key
exports.regenerateApiKey = async (req, res) => {
    try {
        const { companyId } = req.body;
        const newKey = `sk_live_${crypto.randomBytes(16).toString('hex')}`;
        
        const updated = await Integration.findOneAndUpdate(
            { companyId },
            { $set: { apiKey: newKey } },
            { new: true }
        );
        res.status(200).json({ success: true, message: "API Credentials rotated safely", data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error rotating API Key" });
    }
};

// 🌐 3. Update Webhook URL
exports.updateWebhookUrl = async (req, res) => {
    try {
        const { companyId, webhookUrl } = req.body;
        const updated = await Integration.findOneAndUpdate(
            { companyId },
            { $set: { webhookUrl } },
            { new: true }
        );
        res.status(200).json({ success: true, message: "Webhook URL updated", data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating webhook" });
    }
};

// 📣 4. Update Category 2 Channels (Slack, Teams, WhatsApp)
exports.updateNotificationChannels = async (req, res) => {
    try {
        const { companyId, slackWebhookUrl, teamsWebhookUrl, whatsappApiToken, whatsappPhoneNumberId } = req.body;

        const updated = await Integration.findOneAndUpdate(
            { companyId },
            { 
                $set: { 
                    slackWebhookUrl, 
                    teamsWebhookUrl, 
                    whatsappApiToken, 
                    whatsappPhoneNumberId 
                } 
            },
            { new: true }
        );

        res.status(200).json({ success: true, message: "Notification dispatch channels updated", data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating notification channels" });
    }
};

// 🚀 REUSABLE CORE GLOBAL UTILITY
exports.sendPlatformNotification = async (companyId, messageText, whatsappTemplateName = null, whatsappRecipient = null) => {
    try {
        const config = await Integration.findOne({ companyId });
        if (!config) return;

        // 1. Slack Alert Trigger
        if (config.slackWebhookUrl) {
            await axios.post(config.slackWebhookUrl, { text: `🚨 *Platform Update:* ${messageText}` }).catch(e => console.log("Slack dispatch failed"));
        }

        // 2. Microsoft Teams Alert Trigger
        if (config.teamsWebhookUrl) {
            await axios.post(config.teamsWebhookUrl, {
                "@type": "MessageCard",
                "@context": "http://schema.org/extensions",
                "themeColor": "4f46e5",
                "summary": "Platform Trigger Notification",
                "sections": [{ "activityTitle": "System Alert", "text": messageText }]
            }).catch(e => console.log("Teams dispatch failed"));
        }

        // 3. WhatsApp Business API
        if (config.whatsappApiToken && config.whatsappPhoneNumberId && whatsappTemplateName && whatsappRecipient) {
            await axios.post(`https://graph.facebook.com/v17.0/${config.whatsappPhoneNumberId}/messages`, {
                messaging_product: "whatsapp",
                to: whatsappRecipient,
                type: "template",
                template: {
                    name: whatsappTemplateName,
                    language: { code: "en_US" }
                }
            }, {
                headers: { 'Authorization': `Bearer ${config.whatsappApiToken}`, 'Content-Type': 'application/json' }
            }).catch(e => console.log("WhatsApp dispatch failed"));
        }

    } catch (err) {
        console.error("Global Notification Dispatcher Engine Fault:", err);
    }
};