const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import centralized database module models
const Employee = require('../models/Employee');
const Admin = require('../models/Admin');

// Import your global verification middleware
const verifyToken = require('../middleware/auth');

// ==========================================
// 📂 MULTER BINARY FILE STORAGE ARCHITECTURE
// ==========================================
// Guarantee target static allocation directory exists on disk layout
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Enforce file identity tracking structure: timestamp-field-original
        cb(null, `${Date.now()}-${file.fieldname}-${file.originalname}`);
    }
});

// Structural validator filtering layout parameters
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type format extension. Only PDF document uploads are permitted.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Strict 5 Megabyte constraint threshold
});

// Declare specific named keys matching React form data states
const onboardingUploads = upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'aadhaarCard', maxCount: 1 }
]);

// ==========================================
// 📋 1. GET: Fetch All Employee Records
// ==========================================
// Base Path: GET http://localhost:5000/api/employees
router.get('/', verifyToken, async (req, res) => {
    try {
        // Enforce safety visibility: Only Admins and HR can see the full roster list
        const requestorRole = req.user && req.user.role ? req.user.role.toLowerCase() : 'employee';
        if (requestorRole !== 'admin' && requestorRole !== 'hr') {
            return res.status(403).json({ message: "Access Denied: Insufficient authorization permissions." });
        }

        const records = await Employee.find({}, '-password');
        res.json(records);
    } catch (err) {
        console.error("Database fetch error:", err);
        res.status(500).json({ message: "Error parsing database records" });
    }
});

// ==========================================
// 👑 2. GET: Team Leaders Options Pool
// ==========================================
// Base Path: GET http://localhost:5000/api/employees/team-leaders
router.get('/team-leaders', verifyToken, async (req, res) => {
    try {
        const leaders = await Employee.find({}, '_id name empId role');
        res.status(200).json(leaders);
    } catch (err) {
        console.error("Team leader mapping sync failure:", err);
        res.status(500).json({ message: err.message });
    }
});

// ==========================================
// 🚀 3. POST: Collision-Free Sequential Onboarding
// ==========================================
// Base Path: POST http://localhost:5000/api/employees/create-employee
// 🔄 UPDATED: Injected onboardingUploads parser right before controller parsing pipeline
router.post('/create-employee', verifyToken, onboardingUploads, async (req, res) => {
    const {
        name, gender, age, email, password, role,
        department, phone, address, previousCompany,
        previousRole, yearsOfExperience, assignedLeader
    } = req.body;

    try {
        // 🛡️ SECURITY STEP 1: Safeguard token payload recovery
        if (!req.user) {
            return res.status(401).json({ message: "Access Denied: User context token payload is missing." });
        }

        // Standardize strings to lowercase to prevent evaluation bypass tricks
        const requestorRole = req.user.role ? req.user.role.toLowerCase() : 'employee';
        const targetRole = role ? role.toLowerCase() : 'employee';

        // 🛡️ SECURITY STEP 2: Restrict HR from escalating roles to Admin or higher
        if (requestorRole === 'hr' && targetRole !== 'employee' && targetRole !== 'hr') {
            return res.status(403).json({ message: "HR users are strictly restricted to creating 'employee' or 'hr' profiles only." });
        }

        // Prevent standard employees from hitting this endpoint if they try to bypass frontend guards
        if (requestorRole !== 'admin' && requestorRole !== 'hr') {
            return res.status(403).json({ message: "Access Denied: Unauthorized account role permissions." });
        }

        let existingEmployee = await Employee.findOne({ email: email.trim().toLowerCase() });
        if (existingEmployee) {
            return res.status(400).json({ message: "A worker with this email already exists" });
        }

        // Generate custom sequential Employee IDs
        const currentYear = new Date().getFullYear();
        const yearPrefix = `EMP-${currentYear}-`;

        const employeesThisYear = await Employee.find(
            { empId: new RegExp(`^${yearPrefix}`) },
            { empId: 1 }
        );

        let nextSequenceNum = 1;
        if (employeesThisYear && employeesThisYear.length > 0) {
            const parsedSequenceNumbers = employeesThisYear.map(emp => {
                const parts = emp.empId.split('-');
                const sequenceTokenAsInt = parseInt(parts[2], 10);
                return isNaN(sequenceTokenAsInt) ? 0 : sequenceTokenAsInt;
            });
            nextSequenceNum = Math.max(...parsedSequenceNumbers) + 1;
        }

        const paddedSequence = String(nextSequenceNum).padStart(4, '0');
        const finalEmpId = `${yearPrefix}${paddedSequence}`;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password.trim(), salt);

        // Extract individual path keys from multi-file req.files object matrix safely
        const resumePath = req.files && req.files['resume'] ? req.files['resume'][0].filename : "";
        const panPath = req.files && req.files['panCard'] ? req.files['panCard'][0].filename : "";
        const aadhaarPath = req.files && req.files['aadhaarCard'] ? req.files['aadhaarCard'][0].filename : "";

        // Build core document structure safely
        const newWorkerData = {
            empId: finalEmpId,
            name,
            gender,
            age: Number(age) || 0,
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            role: targetRole,
            department,
            phone,
            address,
            previousCompany: previousCompany || 'None',
            previousRole: previousRole || 'None',
            yearsOfExperience: yearsOfExperience || '0 Years',
            assignedLeader: assignedLeader || null,
            createdBy: req.user.id,
            // 📂 Map dynamic upload paths to schema parameters
            resume: resumePath,
            panCard: panPath,
            aadhaarCard: aadhaarPath
        };

        // 🔗 CONDITIONALLY ASSIGN RELATIONAL RELATIONSHIP
        if (requestorRole === 'admin') {
            newWorkerData.Admin = req.user.id;
        }

        const newWorker = new Employee(newWorkerData);
        await newWorker.save();

        // 💾 CONDITIONALLY UPDATE ADMIN LEDGER INDEX
        if (requestorRole === 'admin') {
            await Admin.findByIdAndUpdate(
                req.user.id,
                { $push: { Employee: newWorker._id } }
            );
        }

        res.status(201).json({
            message: `${targetRole.toUpperCase()} account onboarded successfully with ID: ${finalEmpId}`,
            empId: finalEmpId
        });
    } catch (err) {
        console.error("Error inside onboarding process controller:", err);
        res.status(500).json({ message: "Server error creating personnel file" });
    }
});

// ==========================================
// 👤 4. GET: FETCH PROFILE FOR SELF-LOGGED USER
// ==========================================
// Base Path: GET http://localhost:5000/api/employees/profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const userRole = req.user && req.user.role ? req.user.role.toLowerCase() : 'employee';
        let userRecord = null;

        // Dynamic lookup depending on whether the user is an Admin or an Employee/HR
        if (userRole === 'admin') {
            userRecord = await Admin.findById(req.user.id).select('-password');
        } else {
            // This safely pulls both standard employees AND HR personnel profiles
            userRecord = await Employee.findById(req.user.id).select('-password');
        }

        if (!userRecord) {
            return res.status(404).json({ message: "User document identity record not found." });
        }
        res.status(200).json(userRecord);
    } catch (err) {
        console.error("Profile dynamic recovery drop:", err);
        res.status(500).json({ message: "Internal runtime error locating worker ledger profiles." });
    }
});

// ==========================================
// 👤 5. PUT: UPDATE PROFILE BY WORKER ACTION
// ==========================================
// Base Path: PUT http://localhost:5000/api/employees/profile
router.put('/profile', verifyToken, async (req, res) => {
    const {
        phone, address, department, previousCompany, previousRole, yearsOfExperience
    } = req.body;

    try {
        const userRole = req.user && req.user.role ? req.user.role.toLowerCase() : 'employee';
        let updatedUser = null;

        const updatePayload = {
            phone: phone ? phone.trim() : "",
            address: address ? address.trim() : "",
            department: department ? department.trim() : "",
            previousCompany: previousCompany ? previousCompany.trim() : "None",
            previousRole: previousRole ? previousRole.trim() : "None",
            yearsOfExperience: yearsOfExperience ? yearsOfExperience.trim() : "0 Years"
        };

        if (userRole === 'admin') {
            updatedUser = await Admin.findByIdAndUpdate(
                req.user.id,
                { $set: updatePayload },
                { returnDocument: 'after', runValidators: true }
            ).select('-password');
        } else {
            // Employees and HR personnel can update their profile specs safely.
            // We strip out the explicit "role" from req.body to prevent users from editing their own database privileges!
            updatedUser = await Employee.findByIdAndUpdate(
                req.user.id,
                { $set: updatePayload },
                { returnDocument: 'after', runValidators: true }
            ).select('-password');
        }

        if (!updatedUser) {
            return res.status(404).json({ message: "Personnel workspace record is missing." });
        }

        res.status(200).json(updatedUser);
    } catch (err) {
        console.error("User self-mutation write transaction failure:", err);
        res.status(500).json({ message: "Internal server fault committing changes down to database layer." });
    }
});

module.exports = router;