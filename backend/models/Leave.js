const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    // ➕ ADDED: Explicit applicant role logging to enforce validation hierarchy barriers
    employeeRole: {
        type: String,
        required: true,
        enum: ['employee', 'hr'],
        lowercase: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['Casual Leave', 'Medical Leave', 'Earned Leave', 'Paid Leave']
    },
    startDate: {
        type: String, // Storing as YYYY-MM-DD string matching type="date" inputs
        required: true
    },
    endDate: {
        type: String,
        required: true
    },
    days: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.models.Leave || mongoose.model('Leave', LeaveSchema);