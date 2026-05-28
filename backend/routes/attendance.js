const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// GET: http://localhost:5000/api/attendance/hr-profile
router.get('/hr-profile', verifyToken, async (req, res) => {
    try {
        const metrics = {
            baseSalary: 5450,
            totalShiftDays: 22,
            daysPresent: 20,
            unapprovedAbsences: 2
        };
        res.status(200).json(metrics);
    } catch (err) {
        res.status(500).json({ message: "Internal server error parsing clock-in logs." });
    }
});

module.exports = router;