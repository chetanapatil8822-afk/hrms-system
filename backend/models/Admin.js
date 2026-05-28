const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  adminId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  companyStartDate: {
    type: Date,
    required: true
  },
  branchLocation: {
    type: String,
    required: true,
    trim: true
  },
  employeeQuotaTarget: {
    type: Number,
    default: 0
  },
  hasPaidTier: {
    type: Boolean,
    default: false
  },
  selectedPlanName: {
    type: String,
    default: 'None',
    trim: true
  },
  planPrice: {
    type: String,
    default: '0',
    trim: true
  },
  gstId: {
    type: String,
    default: '',
    trim: true,
    uppercase: true
  },

  // 🔄 UPDATED: Enum includes '500+' option for enterprise-scale matching
  companySizeRange: {
    type: String,
    default: '1-10',
    trim: true,
    enum: {
      values: ['1-10', '11-50', '51-200', '201-500', '500+'],
      message: 'Configuration Error: {VALUE} is not a valid company scale parameter.'
    }
  },

  // Global Switch Token. Admin can flip this via frontend configurations to disable HR actions
  isHrLeavePowerEnabled: {
    type: Boolean,
    default: true
  },

  // Tracks custom system configurations pools
  customDepartments: [
    { type: String, trim: true }
  ],
  customRoles: [
    { type: String, trim: true, lowercase: true }
  ],

  Employee: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Employee" }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);