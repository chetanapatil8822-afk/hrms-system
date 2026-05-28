const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const verifyToken = require('../middleware/auth');

router.get('/', verifyToken, async (req, res) => {
    try {
        const list = await Department.find({});
        res.status(200).json(list);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', verifyToken, async (req, res) => {
    try {
        const target = req.body.name?.trim();
        if (!target) return res.status(400).json({ message: 'Missing Department Name parameter' });

        const added = await Department.findOneAndUpdate(
            { name: target },
            { name: target },
            { upsert: true, returnDocument: 'after' }
        );
        res.status(201).json(added);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/', verifyToken, async (req, res) => {
    try {
        const { name } = req.body;
        await Department.deleteOne({ name });
        res.status(200).json({ message: "Department removed successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;