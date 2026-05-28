const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const verifyToken = require('../middleware/auth');

// ==========================================
// 🎛️ 1. PATCH: ADMIN TOGGLE SWITCH FOR HR PRIVILEGES
// ==========================================
// Path: PATCH http://localhost:5000/api/leaves/toggle-hr-power
router.patch('/toggle-hr-power', verifyToken, async (req, res) => {
    const { enablePower } = req.body;
    const requestorRole = req.user.role ? req.user.role.toLowerCase() : 'employee';

    if (requestorRole !== 'admin') {
        return res.status(403).json({ message: "Access Denied: Only root workspace administrators can modify core permissions." });
    }

    try {
        const updatedAdmin = await Admin.findOneAndUpdate(
            {}, // Safely targets your global system configuration document
            { $set: { isHrLeavePowerEnabled: enablePower } },
            { new: true, upsert: true }
        );

        res.status(200).json({
            message: `HR Leave Management power turned ${enablePower ? 'ON' : 'OFF'} successfully.`,
            isHrLeavePowerEnabled: updatedAdmin.isHrLeavePowerEnabled
        });
    } catch (err) {
        console.error("Error patching global configuration switches:", err);
        res.status(500).json({ message: "Error changing system configurations control gates." });
    }
});

// ==========================================
// 📋 2. GET: COMPACT INTERFACE FOR HR DASHBOARD VIEW
// ==========================================
// Path: GET http://localhost:5000/api/leaves/pending
router.get('/pending', verifyToken, async (req, res) => {
    const requestorRole = req.user.role ? req.user.role.toLowerCase() : 'employee';
    try {
        let isHrLeavePowerEnabled = true;

        // Trace contextual parent boundaries to verify authorization states
        if (requestorRole === 'hr' || requestorRole === 'employee') {
            const hrUser = await Employee.findById(req.user.id);
            if (hrUser && hrUser.createdBy) {
                const adminWorkspace = await Admin.findById(hrUser.createdBy);
                if (adminWorkspace) {
                    isHrLeavePowerEnabled = adminWorkspace.isHrLeavePowerEnabled;
                }
            } else {
                // Fallback check if records are completely loose documents
                const globalConfig = await Admin.findOne();
                if (globalConfig) isHrLeavePowerEnabled = globalConfig.isHrLeavePowerEnabled;
            }
        }

        // Fetch unapproved, active documents from database collections
        const leavesData = await Leave.find({ status: 'Pending' })
            .populate('employeeId', 'name empId department')
            .lean();

        // Map layout elements to standard structural properties for direct client digestion
        const cleanLeaves = leavesData.map(leave => ({
            id: leave._id,
            name: leave.employeeId?.name || "Unknown Worker",
            type: leave.type,
            timeline: `${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()}`,
            days: leave.days,
            reason: leave.reason || "No statements provided.",
            employeeRole: leave.employeeRole
        }));

        // Filter away HR requests from the queue if the requester is an HR manager
        const filteredLeaves = requestorRole === 'hr'
            ? cleanLeaves.filter(l => l.employeeRole !== 'hr')
            : cleanLeaves;

        res.status(200).json({
            isHrLeavePowerEnabled,
            leaves: filteredLeaves
        });
    } catch (err) {
        console.error("Error compounding aggregate parameters:", err);
        res.status(500).json({ message: "Error compiling leave tracking state structures." });
    }
});

// ==========================================
// 📋 3. GET: FETCH ALL LEAVES (ADMIN BULK LISTINGS VIEW)
// ==========================================
// Path: GET http://localhost:5000/api/leaves/pending-reviews
router.get('/pending-reviews', verifyToken, async (req, res) => {
    try {
        const userRole = req.user.role.toLowerCase();

        if (userRole === 'admin') {
            // Admins see EVERYTHING: both standard employee leaves and HR leaves
            const allPending = await Leave.find({ status: 'Pending' }).populate('employeeId', 'name empId department');
            return res.status(200).json(allPending);
        }

        if (userRole === 'hr') {
            const adminConfig = await Admin.findOne();
            if (adminConfig && !adminConfig.isHrLeavePowerEnabled) {
                return res.status(403).json({ message: "Your leave review privileges are currently disabled by the Admin." });
            }

            // HR can *only* see leaves filed by standard employees
            const employeePending = await Leave.find({
                status: 'Pending',
                employeeRole: 'employee'
            }).populate('employeeId', 'name empId department');

            return res.status(200).json(employeePending);
        }

        return res.status(403).json({ message: "Unauthorized access path target." });
    } catch (err) {
        console.error("Error inside pending-reviews route handler:", err);
        res.status(500).json({ message: "Error reading pending authorizations tracker database index." });
    }
});

// ==========================================
// 📝 4. PATCH/PUT: EXECUTE HR/ADMIN STATUS MODIFICATION ACTIONS
// ==========================================
// Path: PATCH or PUT http://localhost:5000/api/leaves/:leaveId/action
// Supports handling both classic parameters and direct client execution endpoints securely
const processLeaveAction = async (req, res) => {
    const leaveId = req.params.leaveId || req.params.id;
    const status = req.body.status || req.body.action; // Supports both 'status' payload and front-end 'action' variants safely
    const requestorRole = req.user.role ? req.user.role.toLowerCase() : 'employee';

    if (!status) return res.status(400).json({ message: "Parameters missing: Action or status update configuration is required." });

    try {
        const targetLeave = await Leave.findById(leaveId);
        if (!targetLeave) return res.status(404).json({ message: "Leave document reference context not found." });

        if (requestorRole === 'hr') {
            // Fetch configuration properties tied to historical creator identities
            const hrUser = await Employee.findById(req.user.id);
            const adminConfig = hrUser && hrUser.createdBy
                ? await Admin.findById(hrUser.createdBy)
                : await Admin.findOne();

            if (adminConfig && !adminConfig.isHrLeavePowerEnabled) {
                return res.status(403).json({ message: "Action Blocked: Your management privileges are suspended by the Admin." });
            }

            if (targetLeave.employeeRole === 'hr') {
                return res.status(403).json({ message: "Action Blocked: HR can only process leave rosters for standard employees." });
            }
        } else if (requestorRole !== 'admin') {
            return res.status(403).json({ message: "Access Denied: Insufficient write authorization privileges." });
        }

        // Standardize naming parameters to balance structural variations ('Decline' -> 'Rejected', 'Approve' -> 'Approved')
        let unifiedStatus = status;
        if (status === 'Approve') unifiedStatus = 'Approved';
        if (status === 'Reject' || status === 'Decline') unifiedStatus = 'Rejected';

        targetLeave.status = unifiedStatus;
        await targetLeave.save();

        res.status(200).json({ message: `Leave application status successfully updated to ${unifiedStatus}.` });
    } catch (err) {
        console.error("Action execution database pipeline failure:", err);
        res.status(500).json({ message: "Failed to write authorization mutation to file data columns." });
    }
};

// Route mapping overlays ensuring back-compatibility across variable client interfaces
router.put('/action/:leaveId', verifyToken, processLeaveAction);
router.patch('/:leaveId/action', verifyToken, processLeaveAction);

// ==========================================
// 📋 5. GET: FETCH USER BALANCES & PERSONAL LEAVE HISTORY
// ==========================================
// Path: GET http://localhost:5000/api/leaves/my-requests
router.get('/my-requests', verifyToken, async (req, res) => {
    try {
        const history = await Leave.find({ employeeId: req.user.id }).sort({ createdAt: -1 });

        // Fallback mockup metrics balance allocation pool matrix
        const balances = { casual: 8, medical: 12, earned: 15, paid: 10 };

        res.status(200).json({ balances, history });
    } catch (err) {
        res.status(500).json({ message: "Server error syncing leave ledger records." });
    }
});

// ==========================================
// 🚀 6. POST: REGISTER A NEW LEAVE REQUEST
// ==========================================
// Path: POST http://localhost:5000/api/leaves/apply
router.post('/apply', verifyToken, async (req, res) => {
    const { type, startDate, endDate, days, reason, employeeRole } = req.body;
    try {
        const newRequest = new Leave({
            employeeId: req.user.id,
            employeeRole: employeeRole || req.user.role || 'employee',
            type,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            days: Number(days),
            reason
        });
        await newRequest.save();
        res.status(201).json(newRequest);
    } catch (err) {
        console.error("Error pushing fresh employee application:", err);
        res.status(500).json({ message: "Failed to dispatch leave request entry." });
    }
});

module.exports = router;