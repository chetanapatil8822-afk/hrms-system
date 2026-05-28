const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
    // 🛑 Global System Controls
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { 
        type: String, 
        default: 'System is currently undergoing scheduled maintenance. Please check back soon.' 
    },
    
    // 🧩 Module Toggles (Global)
    modules: {
        attendance: { type: Boolean, default: true },
        leave: { type: Boolean, default: true },
        payroll: { type: Boolean, default: true },
        performance: { type: Boolean, default: false },
        recruitment: { type: Boolean, default: false }
    }
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', systemSettingSchema);