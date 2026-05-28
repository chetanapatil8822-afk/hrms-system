console.log("✅ SuperAdmin Routes Loaded");
const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const Admin = require('../models/Admin');       
const Employee = require('../models/Employee'); 
const Ticket = require('../models/Ticket');
const SystemSetting = require('../models/SystemSetting');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Razorpay = require('razorpay');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "HRMS_SUPER_SECRET_KEY@_123";

// Razorpay Instance (Aap apne asli Test Keys Razorpay Dashboard se nikal kar yahan daal sakte ho baad mein)
const razorpayInstance = new Razorpay({
    key_id: 'rzp_test_YOUR_KEY_HERE', // Ise abhi dummy hi rehne do ya apna test key daalo
    key_secret: 'YOUR_SECRET_HERE',
});

// 📁 Uploads folder automatically banao agar nahi hai toh
const dir = './uploads';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

// 📸 Multer Storage Setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, 'logo-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ==========================================
// 🏢 1. GET: Saari Companies ki List fetch karna
// ==========================================
router.get('/companies', async (req, res) => {
    try {
        // Nayi companies sabse upar aayengi (-1)
        const companies = await Company.find().sort({ createdAt: -1 });
        res.status(200).json(companies);
    } catch (err) {
        res.status(500).json({ message: "Companies fetch karne mein error aaya", error: err.message });
    }
});

// ==========================================
// 🔒 2. PUT: Company ka Status Update karna (Active/Suspended)
// ==========================================
router.put('/companies/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const updatedCompany = await Company.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true } // Update hone ke baad naya data return karega
        );
        res.status(200).json({ message: "Company status updated successfully!", company: updatedCompany });
    } catch (err) {
        res.status(500).json({ message: "Status update fail ho gaya", error: err.message });
    }
});

// ==========================================
// 🗑️ 3. DELETE: Company ko System se Delete karna
// ==========================================
router.delete('/companies/:id', async (req, res) => {
    try {
        await Company.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Company permanently deleted!" });
    } catch (err) {
        res.status(500).json({ message: "Delete karne mein error aaya", error: err.message });
    }
});

// ==========================================
// ➕ 4. POST: Nayi Company Register karna (WITH PASSWORD GENERATION)
// ==========================================
router.post('/companies', upload.single('logo'), async (req, res) => {
    try {
        const { adminEmail } = req.body;
        
        // 1. Check karo ki is email se koi pehle se toh nahi hai
        const existingCompany = await Company.findOne({ adminEmail });
        if (existingCompany) {
            return res.status(400).json({ message: "Is email se company already registered hai!" });
        }

        // 🔐 2. Naya Password ko encrypt (hash) karo
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Admin@123', salt); // Default Password for new companies

        // 3. Data copy karo aur password attach karo
        const companyData = { 
            ...req.body,
            password: hashedPassword // Encrypted password ab database mein jayega
        };
        
        // 4. Logo attach karo agar hai
        if (req.file) {
            companyData.logo = `/uploads/${req.file.filename}`;
        }

        // 5. Save kar do
        const newCompany = new Company(companyData);
        await newCompany.save();
        
        res.status(201).json({ message: "Company registered successfully!", company: newCompany });
    } catch (err) {
        res.status(500).json({ message: "Company add karne mein error aaya", error: err.message });
    }
});

// ==========================================
// 💳 GET: Billing & Revenue Stats
// ==========================================
router.get('/billing-stats', async (req, res) => {
    try {
        const companies = await Company.find();
        
        let totalRevenue = 0;
        let planCounts = {
            'Free Trial': 0,
            'Starter': 0,
            'Business': 0,
            'Enterprise': 0
        };

        companies.forEach(comp => {
            // Sirf Active ya Pending companies ka hi bill count karna hai (Blacklisted/Suspended ka nahi)
            if (comp.status !== 'Blacklisted') {
                const plan = comp.subscriptionPlan || 'Free Trial';
                
                // Plan ka count badhao
                if (planCounts[plan] !== undefined) {
                    planCounts[plan] += 1;
                }

                // Asli prices ke hisaab se Revenue jodna
                if (plan === 'Starter') totalRevenue += 999;
                else if (plan === 'Business') totalRevenue += 2499;
                else if (plan === 'Enterprise') totalRevenue += 4999;
            }
        });

        res.status(200).json({ totalRevenue, planCounts });
    } catch (err) {
        res.status(500).json({ message: "Billing stats fetch failed", error: err.message });
    }
});
// ==========================================
// 👥 6. GET: Global User Management (All Users)
// ==========================================
router.get('/users', async (req, res) => {
    try {
        // 1. Saare Admins fetch karo
        const admins = await Admin.find({}, 'name email companyName hasPaidTier createdAt');
        
        // 2. Saare Employees/HRs fetch karo
        const employees = await Employee.find({}, 'name email role createdAt');

        // 3. Data format karo taaki frontend ko ek jaisa structure mile
        const formattedAdmins = admins.map(a => ({
            id: a._id,
            name: a.name,
            email: a.email,
            role: 'Admin',
            company: a.companyName || 'N/A',
            status: a.hasPaidTier ? 'Active' : 'Pending Payment',
            date: a.createdAt
        }));

        const formattedEmployees = employees.map(e => ({
            id: e._id,
            name: e.name,
            email: e.email,
            role: (e.role && e.role.toUpperCase()) || 'EMPLOYEE',
            company: 'Internal Staff', // Employee schema mein company mapping ke hisaab se
            status: 'Active',
            date: e.createdAt
        }));

        // 4. Dono arrays ko combine (jod) do
        const allUsers = [...formattedAdmins, ...formattedEmployees];

        // 5. Naye users sabse upar dikhane ke liye sort karo
        allUsers.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json(allUsers);
    } catch (err) {
        res.status(500).json({ message: "Global users fetch karne mein error aaya", error: err.message });
    }
});
// ==========================================
// 🎟️ 7. GET & PUT: Support Tickets Management
// ==========================================
// Saari tickets fetch karna
router.get('/tickets', async (req, res) => {
    try {
        const tickets = await Ticket.find().sort({ createdAt: -1 });
        res.status(200).json(tickets);
    } catch (err) {
        res.status(500).json({ message: "Tickets fetch karne mein error aaya", error: err.message });
    }
});

// Kisi ek ticket ka status change karna (Open -> Resolved)
router.put('/tickets/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const updatedTicket = await Ticket.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true }
        );
        res.status(200).json({ message: "Ticket status updated!", ticket: updatedTicket });
    } catch (err) {
        res.status(500).json({ message: "Ticket update fail ho gaya", error: err.message });
    }
});
// ==========================================
// ⚙️ 8. GET & PUT: Global System Settings
// ==========================================
// Settings fetch karna (Agar nahi hai toh default bana dega)
router.get('/settings', async (req, res) => {
    try {
        let settings = await SystemSetting.findOne();
        if (!settings) {
            settings = new SystemSetting();
            await settings.save();
        }
        res.status(200).json(settings);
    } catch (err) {
        res.status(500).json({ message: "Settings fetch failed", error: err.message });
    }
});
// ==========================================
// 📝 9. PUT: Edit Company Details & Logo Upload
// ==========================================
router.put('/companies/:id', upload.single('logo'), async (req, res) => {
    try {
        const updateData = { ...req.body };
        
        // Agar nayi image aayi hai, toh uska rasta (path) save karo
        if (req.file) {
            updateData.logo = `/uploads/${req.file.filename}`;
        }

        const updatedCompany = await Company.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true } // Update hone ke baad naya data return karega
        );

        if (!updatedCompany) return res.status(404).json({ message: "Company nahi mili!" });

        res.status(200).json({ message: "Company details updated successfully!", company: updatedCompany });
    } catch (err) {
        res.status(500).json({ message: "Update failed", error: err.message });
    }
});
// ==========================================
// 💳 10. POST: Razorpay Payment Gateway (Test)
// ==========================================
router.post('/create-payment', async (req, res) => {
    try {
        const { amount } = req.body; // Amount in INR

        const options = {
            amount: amount * 100, // Razorpay amount ko paise (paisa) mein leta hai, isliye * 100
            currency: "INR",
            receipt: `receipt_test_${Date.now()}`
        };

        const order = await razorpayInstance.orders.create(options);
        res.status(200).json({ success: true, order });
    } catch (err) {
        res.status(500).json({ message: "Razorpay order creation failed", error: err.message });
    }
});

// ==========================================
// 🕵️‍♂️ POST: Impersonate Company Admin (God Mode v2)
// ==========================================
// 🔗 Aapke team ke Admin model ko import kar rahe hain

router.post('/companies/:id/impersonate', async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        
        if (!company) {
            return res.status(404).json({ message: "Company database mein nahi mili!" });
        }

        if (company.status === 'Blacklisted') {
            return res.status(403).json({ message: "Cannot impersonate a Blacklisted company!" });
        }

        // 🔍 1. Check karo ki Team ke Admin Database mein iska HR exist karta hai ya nahi
        let hrAdmin = await Admin.findOne({ email: company.adminEmail });
        
        // 🛠️ 2. THE MASTERSTROKE: Agar HR exist nahi karta, toh auto-create kar do!
        if (!hrAdmin) {
            hrAdmin = new Admin({
                adminId: `HR-${Math.floor(Math.random() * 10000)}`,
                name: `${company.companyName} HR (System Auto)`,
                email: company.adminEmail,
                password: company.password, // SuperAdmin wala hash password use kar rahe hain
                companyName: company.companyName,
                phone: company.phone || "0000000000",
                panId: company.panNumber || "PENDING",
                gstId: company.gstNumber || "PENDING",
                hasPaidTier: true,
                selectedPlanName: company.subscriptionPlan || 'Free Trial',
                planPrice: '0'
            });
            await hrAdmin.save();
            console.log("📍 [God Mode]: Auto-provisioned missing HR Admin profile in Team Database.");
        }

        // 🪄 3. MAGIC: Ab Asli Admin ID se naya token generate karo
       const token = jwt.sign(
    { id: hrAdmin._id, role: 'admin', email: hrAdmin.email },
    process.env.JWT_SECRET || "HRMS_SUPER_SECRET_KEY@_123", // ⚠️ Fallback mismatch potential
    { expiresIn: '2h' } 
);

        res.status(200).json({ 
            message: `Successfully logged in as ${company.companyName} HR!`,
            token: token,
            role: 'admin'
        });

    } catch (err) {
        console.error("Impersonate Error:", err);
        res.status(500).json({ message: "Impersonation API crashed", error: err.message });
    }
});
// Settings update karna (Maintenance Mode & Modules)
router.put('/settings', async (req, res) => {
    try {
        let settings = await SystemSetting.findOne();
        if (!settings) {
            settings = new SystemSetting(req.body);
        } else {
            // Update existing values
            settings.maintenanceMode = req.body.maintenanceMode;
            settings.maintenanceMessage = req.body.maintenanceMessage;
            settings.modules = req.body.modules;
        }
        
        const updatedSettings = await settings.save();
        res.status(200).json({ message: "System settings updated successfully!", settings: updatedSettings });
    } catch (err) {
        res.status(500).json({ message: "Settings update failed", error: err.message });
    }
});
module.exports = router;