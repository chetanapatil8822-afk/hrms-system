const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    companyName: { 
        type: String, 
        required: true 
    },
    adminEmail: { 
        type: String, 
        required: true 
    },
    issueType: {
        type: String,
        enum: ['Billing', 'Technical', 'Account', 'Other'],
        default: 'Technical'
    },
    description: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['Open', 'In Progress', 'Resolved'], 
        default: 'Open' 
    }
}, { timestamps: true }); 

module.exports = mongoose.model('Ticket', ticketSchema);