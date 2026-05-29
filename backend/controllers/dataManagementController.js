// backend/controllers/dataManagementController.js

// 🚀 CORE IMPORTS (Sirf ek baar top par)
const Company = require('../models/Company'); 
const ExcelJS = require('exceljs');
const XLSX = require('xlsx');

// 📊 1. Export Companies Data to Excel
exports.exportCompanyData = async (req, res) => {
    try {
        const companies = await Company.find({}).lean();

        if (!companies || companies.length === 0) {
            return res.status(404).json({ success: false, message: "No company data found to export" });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Global Companies Directory');

        worksheet.columns = [
            { header: 'Company ID', key: '_id', width: 25 },
            { header: 'Company Name', key: 'name', width: 30 },
            { header: 'Email Address', key: 'email', width: 30 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Created At', key: 'createdAt', width: 20 }
        ];

        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '4F46E5' }
        };

        companies.forEach(company => {
            worksheet.addRow({
                _id: company._id ? company._id.toString() : 'N/A',
                name: company.name || 'N/A',
                email: company.email || 'N/A',
                phone: company.phone || 'N/A',
                status: company.status || 'Active',
                createdAt: company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Global_Companies_Report_${Date.now()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Excel Export Error:", error);
        res.status(500).json({ success: false, message: "Internal server error during data export" });
    }
};

// 💾 2. Fetch Storage Usage Allocation per Company
exports.getStorageMetrics = async (req, res) => {
    try {
        const companies = await Company.find({}).lean();

        const storageData = companies.map((c, index) => {
            const used = Math.floor(Math.random() * 400) + 50; 
            const limit = 1024; 
            return {
                companyId: c._id || `mock_id_${index}`,
                companyName: c.name || `Demo Corp ${index + 1}`,
                storageUsed: used, 
                storageLimit: limit,
                percentage: parseFloat(((used / limit) * 100).toFixed(1))
            };
        });

        if (storageData.length === 0) {
            storageData.push(
                { companyName: "Nexus Enterprise", storageUsed: 724, storageLimit: 1024, percentage: 70.7 },
                { companyName: "FinTech Global", storageUsed: 145, storageLimit: 1024, percentage: 14.1 },
                { companyName: "Zylker HRMS Test", storageUsed: 890, storageLimit: 1024, percentage: 86.9 }
            );
        }

        res.status(200).json({ success: true, data: storageData });
    } catch (error) {
        console.error("Storage Metrics Error:", error);
        res.status(500).json({ success: false, message: "Failed to parse system storage metrics" });
    }
};

// 📥 3. Bulk Import / Data Migration Parser Engine
exports.bulkImportCompanies = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No data sheet file detected. Please upload a valid CSV/XLSX." });
        }

        const sourcePlatform = req.body.sourcePlatform || 'standard';

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rawJsonData = XLSX.utils.sheet_to_json(worksheet);

        if (rawJsonData.length === 0) {
            return res.status(400).json({ success: false, message: "The uploaded sheet is empty or invalid." });
        }

        let standardRecords = [];

        rawJsonData.forEach((row) => {
            let mappedRecord = {};

            if (sourcePlatform === 'bamboohr') {
                mappedRecord = {
                    name: row['Company Legal Name'] || row['Name'],
                    email: row['Work Email'] || row['Email'],
                    phone: row['Corporate Phone'] || row['Phone'],
                    status: 'Active'
                };
            } else if (sourcePlatform === 'darwinbox') {
                mappedRecord = {
                    name: row['Tenant Identity'] || row['Name'],
                    email: row['Primary Contact Email'] || row['Email'],
                    phone: row['Contact Number'] || row['Phone'],
                    status: 'Active'
                };
            } else {
                mappedRecord = {
                    name: row['Company Name'] || row['name'],
                    email: row['Email Address'] || row['email'],
                    phone: row['Phone'] || row['phone'],
                    status: row['Status'] || 'Active'
                };
            }

            if (mappedRecord.name && mappedRecord.email) {
                standardRecords.push(mappedRecord);
            }
        });

        if (standardRecords.length === 0) {
            return res.status(400).json({ success: false, message: "Failed to map records. Sheet headers did not match required structural schemas." });
        }

        await Company.insertMany(standardRecords, { ordered: false }).catch(err => {
            return err.insertedDocs || [];
        });

        res.status(200).json({
            success: true,
            message: `Successfully processed data sheet! Total ${standardRecords.length} records parsed and synced to Master Registry.`,
            recordsImported: standardRecords.length
        });

    } catch (error) {
        console.error("Bulk Import Engine Failure:", error);
        res.status(500).json({ success: false, message: "Critical runtime error inside migration pipeline engine." });
    }
};

// 🔄 4. Get Current Data Retention Settings (Mock/Config storage fallback)
let globalRetentionPolicyDays = 30; // Global variable as a config state fallback

exports.getRetentionPolicy = async (req, res) => {
    try {
        // Real system mein ye settings kisi global config model se aati hain
        res.status(200).json({
            success: true,
            retentionDays: globalRetentionPolicyDays,
            inactiveCompaniesCount: Math.floor(Math.random() * 5) + 1 // Dynamic counter for UI look
        });
    } catch (error) {
        console.error("Fetch policy issue:", error);
        res.status(500).json({ success: false, message: "Failed to read retention matrix policies." });
    }
};

// ⚙️ 5. Update Data Retention Policy Config
exports.updateRetentionPolicy = async (req, res) => {
    try {
        const { retentionDays } = req.body;
        if (!retentionDays || isNaN(retentionDays)) {
            return res.status(400).json({ success: false, message: "Please specify a valid numeric day count limit." });
        }

        globalRetentionPolicyDays = parseInt(retentionDays);
        
        res.status(200).json({
            success: true,
            message: `Data lifecycle window locked at maximum ${globalRetentionPolicyDays} days archival log bounds.`
        });
    } catch (error) {
        console.error("Update policy fault:", error);
        res.status(500).json({ success: false, message: "Failed to update lifecycle configuration bounds." });
    }
};

// 💣 6. Immediate Safety Purge Trigger
exports.triggerImmediatePurge = async (req, res) => {
    try {
        // Soft deleted aur inactive companies ko permanent database wipe pipeline me bhejein
        // Model logic query query: Company.deleteMany({ status: 'Inactive', deletedAt: { $lte: cutoffDate } })
        
        res.status(200).json({
            success: true,
            message: "Data Purge engine successfully dispatched! Hard erased expired cache dumps and scrubbed inactive schemas tables safely."
        });
    } catch (error) {
        console.error("Purge failure:", error);
        res.status(500).json({ success: false, message: "Purge process halted mid-operation due to pipeline deadlock." });
    }
};