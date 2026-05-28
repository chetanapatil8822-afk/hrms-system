const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import centralized database module models
const Superadmin = require('../models/Superadmin');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');

// Import separated secure gatekeeper verification middleware
const verifyToken = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || "HRMS_SUPER_SECRET_KEY@_123";

// ==========================================
// 🚀 AUTOMATED SUPERADMIN SEED ENGINE
// ==========================================
(async () => {
  try {
    const rootExist = await Superadmin.findOne({ email: "ceo@company.com" });
    if (!rootExist) {
      const salt = await bcrypt.genSalt(10);
      const standardHashedPassword = await bcrypt.hash("supersecretpassword", salt);
      const defaultRoot = new Superadmin({
        name: "Global CEO Root",
        email: "ceo@company.com",
        password: standardHashedPassword
      });
      await defaultRoot.save();
      console.log("📍 [System Seed]: Superadmin credentials verified.");
    }
  } catch (err) {
    console.error("System Seeder failed:", err.message);
  }
})();

// ==========================================
// 🚀 SECURE ADMINISTRATIVE INITIAL SIGNUP
// ==========================================
// Path: POST http://localhost:5000/api/auth/register-admin
router.post('/register-admin', async (req, res) => {
  const {
    adminId, name, email, password, companyName,
    companyStartDate, branchLocation, phone, employeeQuotaTarget,
    selectedPlanName, planPrice,
    panId, gstId
  } = req.body;

  // Enforce strict parameter presence validation checks across compliance properties
  if (!email || !password || !companyName || !name || !phone || !panId || !gstId) {
    return res.status(400).json({ message: "Parameters missing: All corporate details and verified compliance fields (PAN/GST) are required." });
  }

  try {
    // 1. Enforce unique constraints across the Admin database collection
    const existingAdmin = await Admin.findOne({ email: email.trim().toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({ message: "An administrator account with this email already exists." });
    }

    // 2. Encrypt the raw administrative account password string securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password.trim(), salt);

    // 3. Build the Mongoose document using the verified data
    const newAdmin = new Admin({
      adminId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      companyName: companyName.trim(),
      companyStartDate: companyStartDate ? new Date(companyStartDate) : new Date(),
      branchLocation: branchLocation.trim(),
      phone: phone.trim(),
      panId: panId.trim().toUpperCase(),
      gstId: gstId.trim().toUpperCase(),
      employeeQuotaTarget: Number(employeeQuotaTarget) || 10,
      hasPaidTier: true,
      selectedPlanName: selectedPlanName || 'None',
      planPrice: planPrice || '0'
    });

    await newAdmin.save();

    res.status(201).json({
      message: "Administrative profile ledger instantiated successfully.",
      adminId: newAdmin.adminId
    });

  } catch (err) {
    console.error("Critical error in Admin registration:", err);
    res.status(500).json({ message: "Internal server error instantiating administrative database profile." });
  }
});

// ==========================================
// 🔐 SEPARATED LOGIN CONTROLLER FUNCTION
// ==========================================
/**
 * Processes authentication against a single specified collection boundary.
 * Returns user document and verified role string, or throws an error.
 */
async function authenticateUserByPortal(email, password, portalRole) {
  let user = null;
  let resolvedRole = portalRole;

  switch (portalRole) {
    case 'superadmin':
      user = await Superadmin.findOne({ email });
      break;

    case 'admin':
      user = await Admin.findOne({ email });
      if (user && !user.hasPaidTier) {
        const err = new Error("Account activation incomplete. Paid tier activation required.");
        err.statusCode = 402;
        throw err;
      }
      break;

    case 'employee':
      // Searches the employee collection exclusively—Admin accounts are completely unreachable here
      user = await Employee.findOne({ email });
      if (user) {
        // Dynamically shift 'employee' string token to 'hr' if database record states it
        resolvedRole = user.role ? user.role.toLowerCase() : "employee";
      }
      break;

    default:
      const err = new Error("Invalid system role parameter submitted.");
      err.statusCode = 400;
      throw err;
  }

  if (!user) {
    const err = new Error(`Access Denied: No account found matching this email under the ${portalRole.toUpperCase()} category.`);
    err.statusCode = 400;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error("Invalid credentials: Password verification mismatch.");
    err.statusCode = 400;
    throw err;
  }

  return { user, resolvedRole };
}

// ==========================================
// 🛣️ STRICT ROUTE HANDLER FOR PORTAL AUTH
// ==========================================
// Path: POST http://localhost:5000/api/auth/login
router.post('/login', async (req, res) => {
  const email = req.body.email ? req.body.email.trim().toLowerCase() : "";
  const password = req.body.password ? req.body.password.trim() : "";
  const role = req.body.role ? req.body.role.trim().toLowerCase() : "";

  if (!email || !password || !role) {
    return res.status(400).json({ message: "Parameters missing: email, password, and role are required." });
  }

  try {
    // Execute our separated validation controller engine block
    const { user, resolvedRole } = await authenticateUserByPortal(email, password, role);

    // Generate secure token tracking keys
    const token = jwt.sign(
      { id: user._id, role: resolvedRole },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      role: resolvedRole,
      name: user.name,
      email: user.email
    });

  } catch (err) {
    // Check if the error thrown by the controller has an explicit customized status code
    const status = err.statusCode || 500;
    const message = status === 500 ? "Server error during authentication processing loop." : err.message;

    if (status === 500) console.error("Server Login Exception Fault:", err);
    res.status(status).json({ message });
  }
});

// ==========================================
// 👤 PROFILE LAYER RECOVERY STORAGE CHANNELS
// ==========================================
// Path: GET http://localhost:5000/api/auth/admin-profile
router.get('/admin-profile', verifyToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    if (!admin) return res.status(404).json({ message: "Profile record not found." });
    res.status(200).json(admin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Path: PUT http://localhost:5000/api/auth/admin-profile
// ✅ FIXED: Now captures, validates, and updates panId and gstId fields in the DB
router.put('/admin-profile', verifyToken, async (req, res) => {
  const { name, companyName, branchLocation, phone, panId, gstId, companySizeRange } = req.body;
  try {
    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          name,
          companyName,
          branchLocation,
          phone,
          panId: panId ? panId.trim().toUpperCase() : "",
          gstId: gstId ? gstId.trim().toUpperCase() : "",
          companySizeRange
        }
      },
      { returnDocument: 'after', runValidators: true }
    ).select('-password');

    if (!updatedAdmin) return res.status(404).json({ message: "Admin workspace missing." });
    res.status(200).json(updatedAdmin);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;