const mongoose = require('mongoose');

const CustomRoleSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true }
});

module.exports = mongoose.models.CustomRole || mongoose.model('CustomRole', CustomRoleSchema);