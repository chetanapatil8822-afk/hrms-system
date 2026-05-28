const express = require('express');
const router = express.Router();
const CustomRole = require('../models/CustomRole');
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
    try {
        const list = await CustomRole.find({});
        res.status(200).json(list);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', verifyToken, async (req, res) => {
    try {
        const target = req.body.title?.trim().toLowerCase();
        if (!target) return res.status(400).json({ message: 'Missing Role Title parameter' });

        const added = await CustomRole.findOneAndUpdate(
            { title: target },
            { title: target },
            { upsert: true, returnDocument: 'after' }
        );
        res.status(201).json(added);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/', verifyToken, async (req, res) => {
    try {
        const { title } = req.body;
        if (title === 'employee' || title === 'hr') {
            return res.status(400).json({ message: "Core system roles cannot be deleted" });
        }
        await CustomRole.deleteOne({ title: title.toLowerCase() });
        res.status(200).json({ message: "Role removed successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;