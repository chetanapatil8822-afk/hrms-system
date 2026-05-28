const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "HRMS_SUPER_SECRET_KEY@_123";

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Access Denied: Missing Authentication Bearer Token" });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified; // Attaches the decoded payload ({ id, role }) to req.user
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired session token key" });
    }
};

// ⚠️ CRITICAL: Export ONLY the function itself. 
// Do not include router.get, router.post, app.get, or any router variables in this file.
module.exports = verifyToken;