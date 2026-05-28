const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');

// Path: GET http://localhost:5000/api/vacancies
router.get('/', verifyToken, async (req, res) => {
    try {
        let quotaTarget = 10;
        let sizeRange = '1-10';
        const requestorRole = req.user.role ? req.user.role.toLowerCase() : 'employee';

        // 1. Identify and recover the corresponding Admin context schema reference
        let adminId = req.user.id;
        if (requestorRole !== 'admin') {
            const empDoc = await Employee.findById(req.user.id);
            if (empDoc && empDoc.createdBy) {
                adminId = empDoc.createdBy;
            }
        }

        const adminDoc = await Admin.findById(adminId);
        if (adminDoc) {
            quotaTarget = adminDoc.employeeQuotaTarget || 10;
            sizeRange = adminDoc.companySizeRange || '1-10'; // Sourced directly from mongoose model
        }

        // 2. Define upper-bound dynamic caps depending on the registered size range
        // 🔄 UPDATED: Injected the enterprise '500+' mapping node with a highly scale-resilient boundary cap
        const sizeCapsMapping = {
            '1-10': 10,
            '11-50': 50,
            '51-200': 200,
            '201-500': 500,
            '500+': 999999
        };

        const maxCapacityCeiling = sizeCapsMapping[sizeRange] || 10;

        // Dynamic Cap Boundary Guard: Prevents employee target definitions from exceeding structural limits
        const absoluteActiveQuota = Math.min(quotaTarget, maxCapacityCeiling);

        // 3. Fetch current employee headcounts from your MongoDB collection
        const employeesList = await Employee.find({});

        // Loose pattern validation rules across raw field data entries
        const devFilled = employeesList.filter(emp => {
            const dept = (emp.department || '').toLowerCase();
            return dept.includes('eng') || dept.includes('dev') || dept.includes('tech');
        }).length;

        const hrFilled = employeesList.filter(emp => {
            const dept = (emp.department || '').toLowerCase();
            return dept.includes('hr') || dept.includes('resource') || (emp.role || '').toLowerCase() === 'hr';
        }).length;

        const designFilled = employeesList.filter(emp => {
            const dept = (emp.department || '').toLowerCase();
            return dept.includes('design') || dept.includes('ui') || dept.includes('ux');
        }).length;

        const otherFilled = Math.max(0, employeesList.length - (devFilled + hrFilled + designFilled));

        // 4. Compute proportional splits dynamically against absolute active quotas
        // Distribution ratios: 50% Engineering, 25% HR, 25% Design
        const devTarget = Math.max(devFilled, Math.ceil(absoluteActiveQuota * 0.5));
        const hrTarget = Math.max(hrFilled, Math.ceil(absoluteActiveQuota * 0.25));
        const designTarget = Math.max(designFilled, Math.ceil(absoluteActiveQuota * 0.25));

        const dynamicVacancies = [
            { id: 'v1', department: 'Engineering / Dev', filled: devFilled, target: devTarget, color: 'bg-indigo-600', priority: devTarget - devFilled > 2 ? 'High' : 'Normal' },
            { id: 'v2', department: 'Human Resources', filled: hrFilled, target: hrTarget, color: 'bg-purple-600', priority: hrTarget - hrFilled > 1 ? 'Medium' : 'Normal' },
            { id: 'v3', department: 'UI/UX Design', filled: designFilled, target: designTarget, color: 'bg-pink-600', priority: 'Low' }
        ];

        // Track floating miscellaneous employees smoothly without breaking team constraints
        if (otherFilled > 0) {
            dynamicVacancies.push({
                id: 'v4',
                department: 'General Support / Others',
                filled: otherFilled,
                target: otherFilled,
                color: 'bg-gray-400',
                priority: 'Low'
            });
        }

        res.status(200).json(dynamicVacancies);
    } catch (err) {
        console.error("Vacancy schema range calculation exception:", err);
        res.status(500).json({ message: "Internal server error parsing dynamic vacancy quotas." });
    }
});

module.exports = router;