import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer,
    AreaChart, Area 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    
    // 🎛️ Tabs & Views
    const [activeTab, setActiveTab] = useState('analytics');
    const [viewMode, setViewMode] = useState('list'); 

    // Core States
    const [companies, setCompanies] = useState([]);
    const [billingStats, setBillingStats] = useState({ totalRevenue: 0, planCounts: {} });
    const [users, setUsers] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [settings, setSettings] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
const [loadingTeam, setLoadingTeam] = useState(false);

const [teamForm, setTeamForm] = useState({
    name: '',
    email: '',
    password: ''
});

const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    
    // Loading States
    const [loadingCompanies, setLoadingCompanies] = useState(true);
    const [loadingBilling, setLoadingBilling] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [isEditTeamMode, setIsEditTeamMode] = useState(false); 
    const [selectedTeamMemberId, setSelectedTeamMemberId] = useState(null); 
    const [isDeleteTeamModalOpen, setIsDeleteTeamModalOpen] = useState(false); 
    const [teamMemberToDelete, setTeamMemberToDelete] = useState(null);
    const [reportData, setReportData] = useState([]);
    const [selectedReportType, setSelectedReportType] = useState('growth');
    const [isReportLoading, setIsReportLoading] = useState(false);
    // Category 2 States
    const [slackUrl, setSlackUrl] = useState('');
    const [teamsUrl, setTeamsUrl] = useState('');
    const [waToken, setWaToken] = useState('');
    const [waPhoneId, setWaPhoneId] = useState('');

    // 🏢 Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [logoFile, setLogoFile] = useState(null); 
    const [selectedFile, setSelectedFile] = useState(null);
    const [sourcePlatform, setSourcePlatform] = useState('standard');
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState({ success: null, message: "" });
    const [retentionDays, setRetentionDays] = useState(30);
    const [purgeLoading, setPurgeLoading] = useState(false);
    const [policyMessage, setPolicyMessage] = useState("");
    const [hrOversightData, setHrOversightData] = useState([]);
    const [hrSummary, setHrSummary] = useState({ totalPlatformPayroll: 0, totalPlatformCandidates: 0, flaggedCompaniesCount: 0 });
    const [isHrLoading, setIsHrLoading] = useState(false);
    const [chartTrendsData, setChartTrendsData] = useState([]);

    const [formData, setFormData] = useState({
        companyName: '', adminEmail: '', phone: '', alternatePhone: '',
        companyType: 'Startup', industryType: 'IT', companySize: '1-10', website: '', establishedYear: '',
        gstNumber: '', panNumber: '', tanNumber: '', regNumber: '',
        address: '', city: '', state: '', country: 'India', pinCode: '',
        subscriptionPlan: 'Free Trial'
    });

    useEffect(() => {
        if (activeTab === 'companies' || activeTab === 'analytics') {
            fetchCompanies();
            fetchBillingStats();
        }
        else if (activeTab === 'billing') { fetchBillingStats(); fetchCompanies(); }
        else if (activeTab === 'users') fetchUsers();
        else if (activeTab === 'support') fetchTickets();
        else if (activeTab === 'settings') fetchSettings();
        else if (activeTab === 'team') fetchTeamMembers();
   
    }, [activeTab]);

    const [storageMetrics, setStorageMetrics] = useState([]);

useEffect(() => {
    if (activeTab === 'data-management') {
        fetch('http://localhost:5001/api/data-management/storage-usage')
            .then(res => res.json())
            .then(resData => {
                if(resData.success) setStorageMetrics(resData.data);
            })
            .catch(err => console.log("Storage load error:", err));
    }
}, [activeTab]);

useEffect(() => {
    if (activeTab === 'data-management') {
        // Fetch retention config
        fetch('http://localhost:5001/api/data-management/retention-policy')
            .then(res => res.json())
            .then(data => {
                if(data.success) setRetentionDays(data.retentionDays);
            })
            .catch(err => console.log("Retention fetch fault:", err));
    }
}, [activeTab]);

useEffect(() => {
    if (activeTab === 'hr-oversight') {
        setIsHrLoading(true);
        fetch('http://localhost:5001/api/hr-oversight/global-summary')
            .then(res => res.json())
            .then(resData => {
                // Sahi mapping bina resData.success dynamic conditional wrapping ke:
                if (resData && resData.data) {
                    setHrOversightData(resData.data);
                    setHrSummary(resData.summary);
                } else if (Array.isArray(resData)) {
                    // Fallback boundary array parse safety handler
                    setHrOversightData(resData);
                }
            })
            .catch(err => console.error("HR Oversight payload map error:", err))
            .finally(() => setIsHrLoading(false));
    }
}, [activeTab]);

const fallbackChartsData = [
    { month: 'Jan', totalSalaryDisbursed: 1850000, activeHires: 12 },
    { month: 'Feb', totalSalaryDisbursed: 2100000, activeHires: 18 },
    { month: 'Mar', totalSalaryDisbursed: 1950000, activeHires: 15 },
    { month: 'Apr', totalSalaryDisbursed: 2400000, activeHires: 24 },
    { month: 'May', totalSalaryDisbursed: 2850000, activeHires: 32 },
    { month: 'Jun', totalSalaryDisbursed: 3100000, activeHires: 28 }
];

useEffect(() => {
    if (activeTab === 'hr-oversight') {
        // Purana global-summary fetch chalne dein, uske sath ye bhi fetch call laga dein:
        fetch('http://localhost:5001/api/hr-oversight/monthly-trends')
            .then(res => res.json())
            .then(resData => {
                if (resData.success) setChartTrendsData(resData.trends);
            })
            .catch(err => console.error("Charts data loading error:", err));
    }
}, [activeTab]);

    // ==========================================
    // 📡 API FETCHERS
    // ==========================================
    const fetchCompanies = async () => {
        setLoadingCompanies(true);
        try { const res = await fetch('/api/superadmin/companies'); if (res.ok) setCompanies(await res.json()); } 
        catch (error) { console.error("Error fetching companies:", error); } finally { setLoadingCompanies(false); }
    };
    const fetchBillingStats = async () => {
        setLoadingBilling(true);
        try { const res = await fetch('/api/superadmin/billing-stats'); if (res.ok) setBillingStats(await res.json()); } 
        catch (error) { console.error("Error fetching billing:", error); } finally { setLoadingBilling(false); }
    };
    const fetchUsers = async () => {
        setLoadingUsers(true);
        try { const res = await fetch('/api/superadmin/users'); if (res.ok) setUsers(await res.json()); } 
        catch (error) { console.error("Error fetching users:", error); } finally { setLoadingUsers(false); }
    };
    const fetchTickets = async () => {
        setLoadingTickets(true);
        try { const res = await fetch('/api/superadmin/tickets'); if (res.ok) setTickets(await res.json()); } 
        catch (error) { console.error("Error fetching tickets:", error); } finally { setLoadingTickets(false); }
    };
    const fetchSettings = async () => {
        setLoadingSettings(true);
        try { const res = await fetch('/api/superadmin/settings'); if (res.ok) setSettings(await res.json()); } 
        catch (error) { console.error("Error fetching settings:", error); } finally { setLoadingSettings(false); }
    };
    const fetchTeamMembers = async () => {

    setLoadingTeam(true);

    try {

        const res = await fetch('/api/super-admin/team/all');

        const data = await res.json();

        if (res.ok) {
            setTeamMembers(data.data);
        }

    } catch (error) {

        console.error("Error fetching team members:", error);

    } finally {

        setLoadingTeam(false);
    }
};

// 📊 Report Data Fetch Karne Ke Liye
const fetchReportMetrics = async (type) => {
    setIsReportLoading(true);
    setSelectedReportType(type);
    try {
        const res = await fetch(`/api/reports/platform-metrics?type=${type}`);
        
        // अगर API 404 या 500 error देती है, तो पहले ही रोक दें
        if (!res.ok) {
            alert(`Backend Error: Route not found or server error (${res.status})`);
            setIsReportLoading(false);
            return;
        }

        const result = await res.json();
        
        // चेक करें कि success true है और data खाली (empty) नहीं है
        if (result.success && result.data && result.data.length > 0) {
            setReportData(result.data);
        } else {
            alert(result.message || "No data available for this report.");
            setReportData([]); // Data खाली कर दें
        }
    } catch (error) {
        console.error("Fetch error:", error);
        alert("Error connecting to server. Is the backend running?");
    } finally {
        setIsReportLoading(false);
    }
};

// 📥 Native CSV Downloader Engine (Time-Saving & Lightweight)
const downloadCSVReport = () => {
    if (!reportData || reportData.length === 0) {
        alert("No data available to export!");
        return;
    }

    
    const headers = Object.keys(reportData[0]).join(",");
    
    const rows = reportData.map(row => 
        Object.values(row).map(value => `"${value}"`).join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Platform_${selectedReportType}_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// 📥 1. PDF Report Downloader Engine (Using existing jsPDF + autoTable)
    const downloadPDFReport = () => {
        if (!reportData || reportData.length === 0) {
            alert("No data available to export PDF!");
            return;
        }

        const doc = new jsPDF();
        doc.setFontSize(18); 
        doc.setTextColor(30, 27, 75); // Dark Indigo
        doc.text(`Platform Metrics Report - ${selectedReportType.toUpperCase()}`, 14, 20);
        
        doc.setFontSize(10); 
        doc.setTextColor(100); 
        doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 28);

        // Extracting Dynamic Headers and Rows
        const headers = [Object.keys(reportData[0])];
        const rows = reportData.map(row => Object.values(row));

        autoTable(doc, {
            startY: 35,
            head: headers,
            body: rows,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }, // Indigo Head
            styles: { fontSize: 10, cellPadding: 3 }
        });

        doc.save(`Platform_${selectedReportType}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // 📥 2. Excel Report Downloader Engine (Native XML/XLS Data Injector)
    const downloadExcelReport = () => {
        if (!reportData || reportData.length === 0) {
            alert("No data available to export Excel!");
            return;
        }

        const headers = Object.keys(reportData[0]);
        
        // Creating XML components for clean Excel parsing
        let excelTemplate = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
        excelTemplate += `<head><meta charset="UTF-8"></head><body>`;
        excelTemplate += `<table border="1px"><tr style="background-color: #4f46e5; color: white; font-weight: bold;">`;
        
        // Append Headers
        headers.forEach(header => {
            excelTemplate += `<th>${header}</th>`;
        });
        excelTemplate += `</tr>`;

        // Append Rows
        reportData.forEach(row => {
            excelTemplate += `<tr>`;
            Object.values(row).forEach(val => {
                excelTemplate += `<td>${val}</td>`;
            });
            excelTemplate += `</tr>`;
        });

        excelTemplate += `</table></body></html>`;

        const dataType = 'application/vnd.ms-excel';
        const blob = new Blob([excelTemplate], { type: dataType });
        const dataUrl = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", dataUrl);
        link.setAttribute("download", `Platform_${selectedReportType}_Report_${new Date().toISOString().split('T')[0]}.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 🔌 API & Integration States
    const [integrationConfig, setIntegrationConfig] = useState(null);
    const [isIntegrationLoading, setIsIntegrationLoading] = useState(false);
    const [webhookInput, setWebhookInput] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    
    // NOTE: Kyunki ye Super Admin panel hai, aap yahan testing ke liye ek default ID bhej sakte ho 
    // ya fir companies list me se select ki hui company ki ID dynamic pass kar sakte ho.
    const selectedCompanyIdForDev = "SYSTEM_SUPERADMIN_GLOBAL_NODE"; 

    const fetchIntegrationSettings = async () => {
        setIsIntegrationLoading(true);
        try {
            const res = await fetch(`/api/integrations/config?companyId=${selectedCompanyIdForDev}`);
            const result = await res.json();
            if (result.success) {
                setIntegrationConfig(result.data);
                setWebhookInput(result.data.webhookUrl || '');
            }
        } catch (error) {
            alert("Error loading developer credentials");
        } finally {
            setIsIntegrationLoading(false);
        }
    };

    // Jab bhi integrations tab khule, data auto-load ho jaye
    useEffect(() => {
        if (activeTab === 'integrations') {
            fetchIntegrationSettings();
        }
    }, [activeTab]);

    const handleRegenerateKey = async () => {
        if (!window.confirm("⚠️ WARNING: Regenerating this API key will break live integrations instantly. Continue?")) return;
        try {
            const res = await fetch('/api/integrations/regenerate-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId: selectedCompanyIdForDev })
            });
            const result = await res.json();
            if (result.success) {
                setIntegrationConfig(result.data);
                alert("✅ API Credentials rotated safely.");
            }
        } catch (e) { alert("API rotation error"); }
    };

    const handleSaveWebhook = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/integrations/update-webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId: selectedCompanyIdForDev, webhookUrl: webhookInput })
            });
            const result = await res.json();
            if (result.success) {
                setIntegrationConfig(result.data);
                alert("🌐 Webhook routing endpoint deployed successfully.");
            }
        } catch (e) { alert("Webhook save failure"); }
    };

    // 📣 Category 2: Save Slack, Teams & WhatsApp Notification Nodes
    const handleSaveChannels = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/integrations/update-channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    companyId: selectedCompanyIdForDev, 
                    slackWebhookUrl: slackUrl, 
                    teamsWebhookUrl: teamsUrl, 
                    whatsappApiToken: waToken, 
                    whatsappPhoneNumberId: waPhoneId 
                })
            });
            const result = await res.json();
            if (result.success) {
                setIntegrationConfig(result.data);
                alert("📣 Notification dispatch matrix deployed safely.");
            }
        } catch (e) { alert("Channel update failed"); }
    };

    const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
        alert("Please select an Excel or CSV file first!");
        return;
    }

    setIsImporting(true);
    setImportStatus({ success: null, message: "" });

    // Multipart form data append karein backend requirement ke mutabik
    const formData = new FormData();
    formData.append('datasheet', selectedFile);
    formData.append('sourcePlatform', sourcePlatform);

    try {
        const response = await fetch('http://localhost:5001/api/data-management/bulk-import', {
            method: 'POST',
            body: formData, // Headers automatic set ho jayenge boundary ke sath
        });

        const data = await response.json();

        if (data.success) {
            setImportStatus({ success: true, message: data.message });
            setSelectedFile(null); // File clear kar dein
            
            // Refresh storage indicators if you want
            if (typeof fetchStorageMetrics === 'function') fetchStorageMetrics();
        } else {
            setImportStatus({ success: false, message: data.message || "Import failed." });
        }
    } catch (error) {
        console.error("Import client side fault:", error);
        setImportStatus({ success: false, message: "Server connection timed out or network error." });
    } finally {
        setIsImporting(false);
    }
};

const handleUpdatePolicy = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch('http://localhost:5001/api/data-management/retention-policy/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ retentionDays })
        });
        const data = await response.json();
        if(data.success) {
            setPolicyMessage(`✅ Policy Saved: Maximum log bounds set to ${retentionDays} days.`);
            setTimeout(() => setPolicyMessage(""), 4000);
        }
    } catch (err) { alert("Failed to deploy policy bounds matrix."); }
};

const handleImmediatePurge = async () => {
    if(!confirm("⚠️ WARNING: This will permanently scrub and wipe hard-deleted data from database blocks. Continue?")) return;
    setPurgeLoading(true);
    try {
        const response = await fetch('http://localhost:5001/api/data-management/purge-now', { method: 'POST' });
        const data = await response.json();
        if(data.success) alert(data.message);
    } catch (err) { alert("Purge script interrupted."); }
    finally { setPurgeLoading(false); }
};

    // ==========================================
    // ⚡ ACTION HANDLERS
    // ==========================================
    const handleAddTeamMember = async (e) => {
    e.preventDefault();
    
    const url = isEditTeamMode 
        ? `/api/super-admin/team/update/${selectedTeamMemberId}` 
        : '/api/super-admin/team/add';
    const method = isEditTeamMode ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teamForm)
        });

        const data = await res.json();

        if (res.ok) {
            alert(isEditTeamMode ? "✅ Team Member Updated" : "✅ Team Member Added");
            setIsTeamModalOpen(false);
            setIsEditTeamMode(false);
            setSelectedTeamMemberId(null);
            setTeamForm({ name: '', email: '', password: '' });
            fetchTeamMembers();
        } else {
            alert(data.message || "Operation failed");
        }
    } catch (error) {
        alert("Server Error");
    }
};

const openEditTeamModal = (member) => {
    setIsEditTeamMode(true);
    setSelectedTeamMemberId(member._id);
    setTeamForm({
        name: member.name || '',
        email: member.email || '',
        password: '' // Security ke liye edit par field khali rakhenge
    });
    setIsTeamModalOpen(true);
};

const triggerDeleteTeamConfirm = (member) => {
    setTeamMemberToDelete(member);
    setIsDeleteTeamModalOpen(true);
};

const handleDeleteTeamMember = async () => {
    if (!teamMemberToDelete) return;
    try {
        const res = await fetch(`/api/super-admin/team/delete/${teamMemberToDelete._id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            alert("🗑️ Team Member Deleted");
            setIsDeleteTeamModalOpen(false);
            setTeamMemberToDelete(null);
            fetchTeamMembers();
        } else {
            const data = await res.json();
            alert(data.message || "Delete failed");
        }
    } catch (error) {
        alert("Server Error");
    }
};
    
    
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(formData).forEach(key => { data.append(key, formData[key]); });
        if (logoFile) data.append('logo', logoFile);

        const url = isEditMode ? `/api/superadmin/companies/${selectedCompanyId}` : '/api/superadmin/companies';
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, { method, body: data });
            const responseData = await res.json();
            if (res.ok) {
                setIsModalOpen(false); setIsEditMode(false); setSelectedCompanyId(null); setLogoFile(null);
                setFormData({
                    companyName: '', adminEmail: '', phone: '', alternatePhone: '',
                    companyType: 'Startup', industryType: 'IT', companySize: '1-10', website: '', establishedYear: '',
                    gstNumber: '', panNumber: '', tanNumber: '', regNumber: '',
                    address: '', city: '', state: '', country: 'India', pinCode: '',
                    subscriptionPlan: 'Free Trial'
                });
                fetchCompanies();
                fetchBillingStats();
            } else alert(responseData.message || "Operation failed");
        } catch (error) { alert("Server processing error!"); }
    };

    const openEditModal = (comp) => {
        setIsEditMode(true); setSelectedCompanyId(comp._id);
        setFormData({
            companyName: comp.companyName || '', adminEmail: comp.adminEmail || '', phone: comp.phone || '', alternatePhone: comp.alternatePhone || '',
            companyType: comp.companyType || 'Startup', industryType: comp.industryType || 'IT', companySize: comp.companySize || '1-10', website: comp.website || '', establishedYear: comp.establishedYear || '',
            gstNumber: comp.gstNumber || '', panNumber: comp.panNumber || '', tanNumber: comp.tanNumber || '', regNumber: comp.regNumber || '',
            address: comp.address || '', city: comp.city || '', state: comp.state || '', country: comp.country || 'India', pinCode: comp.pinCode || '',
            subscriptionPlan: comp.subscriptionPlan || 'Free Trial'
        });
        setIsModalOpen(true);
    };

    const handleStatusChange = async (id, newStatus) => {
        if (newStatus === 'Blacklisted' && !window.confirm("WARNING: Blacklist this company?")) return;
        try { const res = await fetch(`/api/superadmin/companies/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
            if (res.ok) { fetchCompanies(); fetchBillingStats(); } } catch (error) { alert("Status update failed!"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("CRITICAL: This will permanently delete the company instance. Proceed?")) return;
        try { const res = await fetch(`/api/superadmin/companies/${id}`, { method: 'DELETE' });
            if (res.ok) { fetchCompanies(); fetchBillingStats(); } } catch (error) { alert("Delete failed!"); }
    };
    
    const handleImpersonate = async (id, companyName) => {
        if (!window.confirm(`⚠️ WARNING: Are you sure you want to securely log in as the HR Admin of ${companyName}?`)) return;
        try {
            const res = await fetch(`/api/superadmin/companies/${id}/impersonate`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userRole', data.role);
                alert(`✅ Access Granted!\nRedirecting to ${companyName} HR Dashboard...`);
                navigate('/admin/Profile');
            } else { alert(data.message || "Impersonation Failed!"); }
        } catch (error) { alert("Network Error during impersonation."); }
    };

    const handleGenerateInvoice = (comp) => {
        const doc = new jsPDF();
        doc.setFontSize(22); doc.setTextColor(79, 70, 229); doc.text("SaaS Enterprise Platform", 14, 20);
        doc.setFontSize(10); doc.setTextColor(100); doc.text("TAX INVOICE", 14, 30); doc.text(`Invoice Number: INV-${Math.floor(Math.random() * 900000) + 100000}`, 14, 36); doc.text(`Billing Date: ${new Date().toLocaleDateString()}`, 14, 42);
        doc.setFontSize(12); doc.setTextColor(0); doc.text("Billed To:", 14, 55);
        doc.setFontSize(10); doc.setTextColor(100); doc.text(`Company: ${comp.companyName}`, 14, 62); doc.text(`Email: ${comp.adminEmail}`, 14, 68); doc.text(`GSTIN: ${comp.gstNumber || 'Unregistered Entity'}`, 14, 74);
        
        let basePrice = 0;
        if(comp.subscriptionPlan === 'Starter') basePrice = 999;
        if(comp.subscriptionPlan === 'Business') basePrice = 2499;
        if(comp.subscriptionPlan === 'Enterprise') basePrice = 4999;
        
        const gstAmount = basePrice * 0.18; const totalAmount = basePrice + gstAmount;

        // 📊 NAYA SAFE AUTOTABLE CODE
        autoTable(doc, {
            startY: 85,
            head: [['Description', 'Billing Cycle', 'Amount (INR)']],
            body: [[`Software License - ${comp.subscriptionPlan} Tier`, 'Monthly', `Rs. ${basePrice.toFixed(2)}`], ['Platform IGST (18%)', '-', `Rs. ${gstAmount.toFixed(2)}`]],
            foot: [['Total Payable Amount', '', `Rs. ${totalAmount.toFixed(2)}`]],
            theme: 'grid', 
            headStyles: { fillColor: [30, 27, 75] }, 
            footStyles: { fillColor: [243, 244, 246], textColor: [0,0,0], fontStyle: 'bold' }
        });

        doc.setFontSize(9); doc.setTextColor(150); doc.text("This is a system-generated electronic invoice and requires no physical signature.", 14, doc.lastAutoTable.finalY + 20); doc.text("Thank you for choosing our Enterprise Platform.", 14, doc.lastAutoTable.finalY + 26);
        doc.save(`Invoice_${comp.companyName.replace(/\s+/g, '_')}_${new Date().getMonth()+1}Y26.pdf`);
    };

    const handleResolveTicket = async (id) => {
        try { const res = await fetch(`/api/superadmin/tickets/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Resolved' }) });
            if (res.ok) fetchTickets(); } catch (error) { alert("Ticket resolve failed!"); }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault(); setSavingSettings(true);
        try { const res = await fetch('/api/superadmin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
            if (res.ok) alert("⚙️ Core Platform Configurations Updated Globally!"); } catch (error) { alert("Settings save error!"); } finally { setSavingSettings(false); }
    };

    const handleLogout = () => { localStorage.clear(); navigate('/'); };

    const handleTestPayment = async () => {
        if (window.confirm("Simulate Razorpay Gateway Request? \n(Click OK to view Demo Success)")) {
            setTimeout(() => { alert(`✅ Payment Processed Successfully! \nTransaction ID: pay_test_${Math.floor(Math.random() * 100000000)}\n\n(Note: Connect real keys in backend for actual pop-up)`); }, 1000);
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'Pending Approval': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Suspended': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Blacklisted': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const pieColors = ['#94a3b8', '#3b82f6', '#8b5cf6', '#10b981']; 
    const safePlanCounts = billingStats?.planCounts || {};
    const safeCompanies = companies || [];
    const safeTotalRevenue = billingStats?.totalRevenue || 0;
    const paidCompanies = safeCompanies.filter(c => c.subscriptionPlan && c.subscriptionPlan !== 'Free Trial');
    const planData = Object.keys(safePlanCounts).map((key) => ({ name: key, value: safePlanCounts[key] })).filter(item => item.value > 0); 
    const statusCounts = safeCompanies.reduce((acc, comp) => { if(comp && comp.status) { acc[comp.status] = (acc[comp.status] || 0) + 1; } return acc; }, {});
    const statusData = Object.keys(statusCounts).map(key => ({ name: key, count: statusCounts[key] }));

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans relative">
            {/* 🔝 Navbar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm mb-6 border border-gray-100">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Super Admin Portal</h1>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">Enterprise Configuration Mode</p>
                </div>
                <button onClick={handleLogout} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-bold transition-all">Logout</button>
            </div>

            {/* 🗂️ Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-fit">
                <button onClick={() => setActiveTab('analytics')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-indigo-950 text-white shadow-md transform scale-105' : 'text-gray-500 hover:bg-gray-50'}`}>📊 Analytics</button>
                <button onClick={() => setActiveTab('companies')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'companies' ? 'bg-indigo-950 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>🏢 Registry</button>
                <button onClick={() => setActiveTab('billing')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'billing' ? 'bg-indigo-950 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>💳 Revenue</button>
                <button onClick={() => setActiveTab('users')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-950 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>👥 Global Users</button>
                <button onClick={() => setActiveTab('support')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'support' ? 'bg-indigo-950 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>🎟️ Helpdesk</button>
                <button onClick={() => setActiveTab('settings')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-indigo-950 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>⚙️ Core</button>
                <button
    onClick={() => setActiveTab('team')}
    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
        activeTab === 'team'
            ? 'bg-indigo-950 text-white shadow-md'
            : 'text-gray-500 hover:bg-gray-50'
    }`}
>
    👨‍💼 SA Team
</button>

         
                 <button 
        onClick={() => setActiveTab('reports')} 
        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'reports' 
                ? 'bg-indigo-950 text-white shadow-md' 
                : 'text-gray-500 hover:bg-gray-50'
        }`}
    >
        📑 Reports & Export
    </button>   

                  <button 
    onClick={() => setActiveTab('integrations')}
    className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${activeTab === 'integrations' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
>
    🔌 API & Integrations
</button>

                  <button
    onClick={() => setActiveTab('data-management')}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
        activeTab === 'data-management'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
    }`}
>
    💾 Data Management
</button>

                  <button
    onClick={() => setActiveTab('hr-oversight')}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
        activeTab === 'hr-oversight'
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
    }`}
>
    👁️ HR Module Oversight
</button>

            </div>

                
            {/* TAB 0: 📊 ANALYTICS DASHBOARD */}
            {activeTab === 'analytics' && (
                <div className="animate-fadeIn space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-6 rounded-2xl shadow-lg text-white">
                            <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Total Network MRR</p>
                            <h2 className="text-4xl font-black">₹{safeTotalRevenue.toLocaleString('en-IN')}</h2>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Active Nodes</p>
                            <h2 className="text-4xl font-black text-gray-900">{safeCompanies.filter(c => c?.status === 'Active').length}</h2>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Registrations</p>
                            <h2 className="text-4xl font-black text-gray-900">{safeCompanies.length}</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-black text-gray-900 mb-6">Subscription Distribution</h3>
                            {planData.length === 0 ? <div className="h-64 flex items-center justify-center text-gray-400 font-medium">Insufficient data</div> : (
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={planData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                                {planData.map((entry, index) => <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />)}
                                            </Pie>
                                            <ChartTooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-black text-gray-900 mb-6">Client Health Metrics</h3>
                            {statusData.length === 0 ? <div className="h-64 flex items-center justify-center text-gray-400 font-medium">Insufficient data</div> : (
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                            <ChartTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 1: COMPANIES */}
            {activeTab === 'companies' && (
                <div className="animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center flex-wrap gap-4">
                            <h2 className="text-lg font-black text-gray-900">Platform System Registry</h2>
                            <div className="flex gap-4">
                                <div className="bg-gray-100 p-1 rounded-xl flex gap-1">
                                    <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>List</button>
                                    <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Grid</button>
                                </div>
                                <button onClick={() => { setIsEditMode(false); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">+ New Client</button>
                            </div>
                        </div>

                        {loadingCompanies ? <div className="p-12 text-center text-gray-400 font-bold">Loading...</div> : safeCompanies.length === 0 ? <div className="p-12 text-center text-gray-400 font-bold">No companies found.</div> : viewMode === 'list' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead><tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold border-b border-gray-200"><th className="p-4">Entity</th><th className="p-4">Profile</th><th className="p-4">Govt IDs</th><th className="p-4">Status</th><th className="p-4 text-center">Actions</th></tr></thead>
                                    <tbody>
                                        {safeCompanies.map(comp => (
                                            <tr key={comp._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                                <td className="p-4 flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                                        {comp.logo ? <img src={comp.logo} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-xs text-gray-400 font-black">{comp.companyName?.substring(0,2)}</span>}
                                                    </div>
                                                    <div><p className="font-black text-gray-900">{comp.companyName}</p><p className="text-xs text-gray-500">{comp.adminEmail}</p></div>
                                                </td>
                                                <td className="p-4"><p className="text-sm font-semibold">{comp.companyType} • {comp.industryType}</p><p className="text-xs text-gray-400">{comp.companySize} employees</p></td>
                                                <td className="p-4"><p className="text-xs"><span className="font-bold">GST:</span> {comp.gstNumber || 'N/A'}</p><p className="text-xs"><span className="font-bold">PAN:</span> {comp.panNumber || 'N/A'}</p></td>
                                                <td className="p-4"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusBadge(comp.status)}`}>{comp.status}</span></td>
                                                <td className="p-4 flex flex-wrap gap-2 justify-center">
                                                    {comp.status === 'Active' && (
                                                        <button onClick={() => handleImpersonate(comp._id, comp.companyName)} className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1 rounded-lg text-xs font-black shadow-sm transition-all border border-purple-200 flex items-center gap-1">
                                                            👁️ Login As
                                                        </button>
                                                    )}
                                                    {comp.status === 'Pending Approval' && <button onClick={() => handleStatusChange(comp._id, 'Active')} className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-xs font-bold border border-emerald-200">Approve</button>}
                                                    {comp.status === 'Active' && <button onClick={() => handleStatusChange(comp._id, 'Suspended')} className="bg-orange-50 text-orange-700 px-2 py-1 rounded-lg text-xs font-bold">Suspend</button>}
                                                    {comp.status === 'Suspended' && <button onClick={() => handleStatusChange(comp._id, 'Active')} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold">Activate</button>}
                                                    {comp.status !== 'Blacklisted' && <button onClick={() => handleStatusChange(comp._id, 'Blacklisted')} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-xs font-bold">Blacklist</button>}
                                                    <button onClick={() => openEditModal(comp)} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold">Edit</button>
                                                    <button onClick={() => handleDelete(comp._id)} className="bg-red-50 text-red-600 px-2 py-1 rounded-lg text-xs font-bold">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                {safeCompanies.map(comp => (
                                    <div key={comp._id} className="bg-white rounded-2xl border shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                                        <div>
                                            <div className="mb-4 flex items-center justify-between">
                                                <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                                    {comp.logo ? <img src={comp.logo} className="w-full h-full object-cover" /> : <span className="text-sm text-gray-400 font-black">{comp.companyName?.substring(0,2)}</span>}
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusBadge(comp.status)}`}>{comp.status}</span>
                                            </div>
                                            <h3 className="font-black text-gray-900">{comp.companyName}</h3>
                                            <p className="text-xs text-gray-500 mb-3">{comp.adminEmail}</p>
                                            <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-600 space-y-1 mb-4">
                                                <p><span className="font-bold">Type:</span> {comp.companyType} ({comp.industryType})</p>
                                                <p><span className="font-bold">GST:</span> {comp.gstNumber || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 border-t pt-3 border-gray-100">
                                            {comp.status === 'Active' && (
                                                <button onClick={() => handleImpersonate(comp._id, comp.companyName)} className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 font-black px-3 py-2 rounded-lg text-xs transition-colors border border-purple-200 mb-1">
                                                    👁️ Login As HR Admin
                                                </button>
                                            )}
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => openEditModal(comp)} className="bg-gray-100 text-gray-800 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-gray-200 transition-colors">Edit</button>
                                                <button onClick={() => handleDelete(comp._id)} className="bg-red-50 text-red-600 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-red-100 transition-colors">Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: BILLING WITH PDF INVOICES */}
            {activeTab === 'billing' && (
                <div className="animate-fadeIn space-y-6">
                    <div className="bg-gradient-to-br from-indigo-950 to-black p-10 rounded-3xl shadow-xl text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="w-full md:w-auto relative z-10">
                            <div className="absolute top-0 left-0 opacity-10 text-9xl pointer-events-none -mt-8 -ml-4">₹</div>
                            <p className="text-sm font-bold text-indigo-200 uppercase tracking-widest mb-2">Total Platform MRR</p>
                            <h2 className="text-5xl md:text-7xl font-black tracking-tight">{loadingBilling ? "..." : `₹${safeTotalRevenue.toLocaleString('en-IN')}`}</h2>
                        </div>
                        <div className="relative z-10 bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/20 w-full md:w-auto">
                            <h3 className="text-xl font-black mb-1">Gateway Diagnostics</h3>
                            <p className="text-xs text-indigo-200 mb-5 max-w-xs">Simulate transaction to verify banking bridges.</p>
                            <button onClick={handleTestPayment} className="bg-white text-indigo-900 hover:bg-gray-100 font-black px-6 py-3.5 rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 w-full justify-center">
                                💳 Test Checkout Flow
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-black text-gray-900">Subscription Ledgers & Invoices</h2>
                            <p className="text-xs text-gray-500 mt-1">Generate automated tax invoices for active enterprise clients.</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold border-b border-gray-200">
                                        <th className="p-4">Billed Entity</th>
                                        <th className="p-4">Subscription Plan</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paidCompanies.length === 0 ? (
                                        <tr><td colSpan="4" className="p-8 text-center text-gray-400 font-medium">No active paid subscriptions found.</td></tr>
                                    ) : (
                                        paidCompanies.map((comp, idx) => (
                                            <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                                                <td className="p-4"><p className="font-black text-gray-900">{comp.companyName}</p><p className="text-xs text-gray-500">GST: {comp.gstNumber || 'N/A'}</p></td>
                                                <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-black">{comp.subscriptionPlan}</span></td>
                                                <td className="p-4"><span className="text-emerald-600 text-xs font-bold">● Cleared</span></td>
                                                <td className="p-4 text-right"><button onClick={() => handleGenerateInvoice(comp)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all">📄 Download PDF</button></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: GLOBAL USERS */}
            {activeTab === 'users' && (
                <div className="animate-fadeIn bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100"><h2 className="text-lg font-black text-gray-900">All System Users</h2></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead><tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold"><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Company</th><th className="p-4">Role</th><th className="p-4">Status</th></tr></thead>
                            <tbody>
                                {loadingUsers ? <tr><td colSpan="5" className="p-8 text-center text-gray-400">Loading...</td></tr> : (users || []).length === 0 ? <tr><td colSpan="5" className="p-8 text-center text-gray-400">No users found.</td></tr> : users.map((user, idx) => (
                                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="p-4 font-bold text-gray-900">{user?.name}</td>
                                        <td className="p-4 text-sm text-gray-500">{user?.email}</td>
                                        <td className="p-4 text-sm font-medium">{user?.company}</td>
                                        <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${user?.role === 'Admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'}`}>{user?.role}</span></td>
                                        <td className="p-4"><span className="text-emerald-600 text-xs font-bold">● {user?.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 4: SUPPORT HELPDESK */}
            {activeTab === 'support' && (
                <div className="animate-fadeIn bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100"><h2 className="text-lg font-black text-gray-900">Enterprise Helpdesk</h2></div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead><tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold"><th className="p-4">Company</th><th className="p-4">Issue Type</th><th className="p-4">Description</th><th className="p-4">Status</th><th className="p-4 text-center">Action</th></tr></thead>
                            <tbody>
                                {loadingTickets ? <tr><td colSpan="5" className="p-8 text-center text-gray-400">Loading tickets...</td></tr> : (tickets || []).length === 0 ? <tr><td colSpan="5" className="p-12 text-center text-gray-400 font-medium">No active tickets! 🎉</td></tr> : tickets.map((ticket) => (
                                    <tr key={ticket._id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="p-4"><p className="font-bold">{ticket?.companyName}</p><p className="text-xs text-gray-500">{ticket?.adminEmail}</p></td>
                                        <td className="p-4"><span className="px-2 py-1 rounded text-[10px] font-black uppercase border bg-blue-50 text-blue-700">{ticket?.issueType}</span></td>
                                        <td className="p-4 text-sm max-w-xs truncate">{ticket?.description}</td>
                                        <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${ticket?.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{ticket?.status}</span></td>
                                        <td className="p-4 text-center">
                                            {ticket?.status !== 'Resolved' ? <button onClick={() => handleResolveTicket(ticket._id)} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-xs font-bold">Resolve</button> : <span className="text-gray-400 text-xs font-bold">Done ✓</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 5: SYSTEM SETTINGS WITH LEGAL & COMPLIANCE ENGINE */}
            {activeTab === 'settings' && (
                <div className="animate-fadeIn max-w-4xl">
                    {settings && (
                        <form onSubmit={handleSaveSettings} className="space-y-6">
                            
                            {/* 1. Maintenance Mode */}
                            <div className="bg-white p-8 rounded-2xl border border-red-100 shadow-sm">
                                <div className="flex justify-between items-start mb-6">
                                    <div><h2 className="text-xl font-black text-gray-900">🛑 Emergency Maintenance</h2><p className="text-sm text-gray-500 mt-1">Locks all operations nodes instantly.</p></div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={settings.maintenanceMode} onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})} />
                                        <div className="w-14 h-7 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:bg-white after:rounded-full after:h-6 after:w-6 after:absolute after:top-[2px] after:left-[2px] peer-checked:bg-red-600 transition-all shadow-sm"></div>
                                    </label>
                                </div>
                                {settings.maintenanceMode && <textarea value={settings.maintenanceMessage} onChange={(e) => setSettings({...settings, maintenanceMessage: e.target.value})} className="w-full p-4 rounded-xl border border-red-200 text-sm outline-none focus:ring-2 focus:ring-red-100" rows="3" />}
                            </div>
                            
                            {/* 2. Feature Flags */}
                            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                                <h2 className="text-xl font-black text-gray-900 mb-6">🧩 Global Feature Flag Controllers</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {['attendance', 'leave', 'payroll', 'performance', 'recruitment'].map(module => (
                                        <div key={module} className="flex justify-between items-center p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                                            <span className="font-bold text-gray-700 capitalize">{module} Module</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={settings.modules?.[module] || false} onChange={(e) => setSettings({...settings, modules: {...settings.modules, [module]: e.target.checked}})} />
                                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:bg-white after:rounded-full after:h-5 after:w-5 after:absolute after:top-[2px] after:left-[2px] peer-checked:bg-indigo-600 transition-all shadow-sm"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 3. NEW: LEGAL & POLICY ENGINE */}
                            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                                <h2 className="text-xl font-black text-gray-900 mb-6">⚖️ Legal & Compliance Documents</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Platform Terms & Conditions</label>
                                        <textarea 
                                            value={settings.termsAndConditions || ''} 
                                            onChange={(e) => setSettings({...settings, termsAndConditions: e.target.value})} 
                                            className="w-full p-4 rounded-xl border border-gray-300 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[120px]" 
                                            placeholder="Enter global terms and conditions for all client tenants..." 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Global Privacy Policy</label>
                                        <textarea 
                                            value={settings.privacyPolicy || ''} 
                                            onChange={(e) => setSettings({...settings, privacyPolicy: e.target.value})} 
                                            className="w-full p-4 rounded-xl border border-gray-300 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[120px]" 
                                            placeholder="Enter SaaS privacy policy rules..." 
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={savingSettings} className="bg-indigo-950 hover:bg-indigo-900 transition-colors text-white font-black px-8 py-4 rounded-xl shadow-lg w-full">{savingSettings ? "Updating Environment..." : "Save Production Matrix"}</button>
                        </form>
                    )}
                </div>
            )}

            {/* TAB 6: SUPER ADMIN TEAM */}
{activeTab === 'team' && (
    <div className="animate-fadeIn bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-black text-gray-900">
                Super Admin Team Management
            </h2>

            <button 
                onClick={() => { 
                    setIsEditTeamMode(false); 
                    setTeamForm({ name: '', email: '', password: '' }); 
                    setIsTeamModalOpen(true); 
                }} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all"
            >
                + Add Team Node
            </button>
        </div>

        <div className="overflow-x-auto">

            <table className="w-full text-left border-collapse">

                <thead>
                    <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Status</th>
                    </tr>
                </thead>

                <tbody>

                    {loadingTeam ? (

                        <tr>
                            <td colSpan="3" className="p-8 text-center text-gray-400">
                                Loading...
                            </td>
                        </tr>

                    ) : teamMembers.length === 0 ? (

                        <tr>
                            <td colSpan="3" className="p-8 text-center text-gray-400">
                                No Team Members Found
                            </td>
                        </tr>

                    ) : (

                        teamMembers.map((member) => (
    <tr
        key={member._id}
        className="border-b border-gray-50 hover:bg-gray-50"
    >
        <td className="p-4 font-bold text-gray-900">
            {member.name}
        </td>

        <td className="p-4 text-sm text-gray-500">
            {member.email}
        </td>

        <td className="p-4">
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                Active
            </span>
        </td>

        {/* 📍 STEP 4: Yahan par naya column add kiya hai buttons ke liye */}
        <td className="p-4 flex gap-2">
            <button 
                onClick={() => openEditTeamModal(member)}
                className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            >
                Edit
            </button>
            <button 
                onClick={() => triggerDeleteTeamConfirm(member)}
                className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
            >
                Purge
            </button>
        </td>
    </tr>
))
                    )}

                </tbody>
            </table>
        </div>
    </div>
)}

{/* TAB: 📑 REPORTS & EXPORT */}
{activeTab === 'reports' && (
    <div className="animate-fadeIn space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-black text-gray-900 mb-2">Platform Master Reports Hub</h2>
            <p className="text-xs text-gray-400 mb-6">Select report pipelines, isolate intervals, and deploy clean data maps directly to Excel, PDF, or CSV schemas.</p>
            
            {/* 🎛️ Report Selection & Date Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Select Pipeline Matrix</label>
                    <select 
                        value={selectedReportType} 
                        onChange={(e) => { setSelectedReportType(e.target.value); setReportData([]); }}
                        className="w-full border border-gray-200 p-2.5 rounded-xl text-sm font-semibold bg-white focus:border-indigo-500"
                    >
                        <option value="growth">🏢 Company Growth Report</option>
                        <option value="revenue">💳 Revenue Stream Report</option>
                        <option value="user_activity">👥 User System Activity Report</option>
                        <option value="subscription">📜 Subscription Nodes Report</option>
                        <option value="support">🎟️ Helpdesk Escalation Report</option>
                        <option value="hr_usage">🛠️ HR Module Usage Report</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Start Execution Date</label>
                    <input 
                        type="date" 
                        id="startDate"
                        className="w-full border border-gray-200 p-2 rounded-xl text-sm font-semibold text-gray-700 focus:border-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">End Execution Date</label>
                    <input 
                        type="date" 
                        id="endDate"
                        className="w-full border border-gray-200 p-2 rounded-xl text-sm font-semibold text-gray-700 focus:border-indigo-500"
                    />
                </div>

                <button 
                    onClick={() => {
                        const sD = document.getElementById('startDate').value;
                        const eD = document.getElementById('endDate').value;
                        // Appending optional date range criteria directly into our fetch metrics loop
                        setIsReportLoading(true);
                        fetch(`/api/reports/platform-metrics?type=${selectedReportType}&startDate=${sD}&endDate=${eD}&t=${new Date().getTime()}`)
                            .then(res => res.json())
                            .then(result => {
                                if(result.success) setReportData(result.data);
                                else alert(result.message || "Failed execution query");
                            })
                            .catch(() => alert("Server Cluster Shard Error"))
                            .finally(() => setIsReportLoading(false));
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-[42px] px-4 rounded-xl text-xs shadow-md tracking-wider transition-all"
                >
                    ⚡ Execute Database Query
                </button>
            </div>

            {/* 📥 Dynamic Multi-Format Export Tray */}
            {reportData && reportData.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200/60 items-center">
                    <span className="text-xs font-black text-indigo-950 uppercase tracking-wider mr-2">Export Protocol:</span>
                    
                    <button 
                        onClick={downloadCSVReport}
                        className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                    >
                        📄 Export Raw CSV
                    </button>

                    <button 
                        onClick={downloadExcelReport}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                    >
                        📊 Export Live Excel (.XLS)
                    </button>

                    <button 
                        onClick={downloadPDFReport}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                    >
                        🛑 Export Corporate PDF Document
                    </button>
                </div>
            )}

            {/* Data Table Core Display Engine */}
            {isReportLoading ? (
                <div className="text-center py-12 text-gray-400 font-bold tracking-widest animate-pulse">PARSING LIVE PIPELINE SYSTEM DATABASE RECORDS...</div>
            ) : reportData && reportData.length > 0 ? (
                <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-xs">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white text-xs font-bold">
                                {Object.keys(reportData[0]).map((key) => (
                                    <th key={key} className="p-4 uppercase tracking-wider">{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((row, i) => (
                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/70 transition-all">
                                    {Object.values(row).map((val, j) => (
                                        <td key={j} className="p-4 text-xs font-bold text-gray-700">{String(val)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 text-gray-400 font-medium border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                    System analytical pipeline idling. Choose filters above and hit "Execute Database Query".
                </div>
            )}
        </div>
    </div>
)}

{/* TAB: 🔌 INTEGRATION & API MANAGEMENT */}
{activeTab === 'integrations' && (
    <div className="animate-fadeIn space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-black text-gray-900 mb-2">Global API & Gateway Integration Console</h2>
            <p className="text-xs text-gray-400 mb-6">Manage global machine-to-machine application interfaces, auth tokens, and audit structural webhook traffic triggers.</p>
            
            {isIntegrationLoading ? (
                <div className="text-center py-12 text-gray-400 font-bold tracking-widest animate-pulse">
                    PARSING DEVELOPER CORE LOGS...
                </div>
            ) : (
                /* Pure Content Structure ko humne is wrapper me band kiya hai */
                <div className="space-y-6">
                    
                    {/* 📊 Usage Monitoring Matrices */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-gray-200/50">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Web API Request Volume</span>
                            <h2 className="text-2xl font-black text-slate-800">{integrationConfig?.usageMetrics?.totalRequests || 0} <span className="text-xs font-semibold text-gray-400">Hits</span></h2>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-gray-200/50">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Webhook Dispatch Success Logs</span>
                            <h2 className="text-2xl font-black text-emerald-600">{integrationConfig?.usageMetrics?.webhookDeliveries || 0} <span className="text-xs font-semibold text-emerald-400">Sent</span></h2>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-gray-200/50">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Last Secure Transmission</span>
                            <h2 className="text-xs font-bold text-gray-600 mt-2">
                                {integrationConfig?.usageMetrics?.lastUsedAt ? new Date(integrationConfig.usageMetrics.lastUsedAt).toLocaleString() : 'No handshake logs recorded'}
                            </h2>
                        </div>
                    </div>

                    {/* 🔑 API Authorization Token Block */}
                    <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3">
                        <div>
                            <h3 className="text-sm font-black text-gray-900">System Secret Bearer Key</h3>
                            <p className="text-[11px] text-gray-400">Inject this encrypted token inside external application request headers to bypass security gateway checkpoints.</p>
                        </div>
                        <div className="flex gap-3 items-center">
                            <div className="flex-1 bg-gray-950 p-3 rounded-xl font-mono text-xs text-indigo-400 overflow-x-auto whitespace-nowrap select-all border border-gray-800">
                                {showApiKey ? integrationConfig?.apiKey : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                            </div>
                            <button 
                                onClick={() => setShowApiKey(!showApiKey)} 
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2.5 rounded-xl text-xs transition-all"
                            >
                                {showApiKey ? 'Hide' : 'Reveal'}
                            </button>
                            <button 
                                onClick={handleRegenerateKey}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-3 py-2.5 rounded-xl text-xs transition-all border border-rose-100"
                            >
                                Cycle Key
                            </button>
                        </div>
                    </div>

                    {/* 🌐 Webhook Outbound Configuration */}
                    <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-4">
                        <div>
                            <h3 className="text-sm font-black text-gray-900">Real-Time Event Stream Pipeline (Webhooks)</h3>
                            <p className="text-[11px] text-gray-400">Route critical platform events instantaneously into external webhook endpoints via secure downstream pipes.</p>
                        </div>
                        <form onSubmit={handleSaveWebhook} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Destination Webhook Gateway URL</label>
                                <input 
                                    type="url" 
                                    placeholder="https://yourserver.com/webhooks/listen"
                                    value={webhookInput}
                                    onChange={(e) => setWebhookInput(e.target.value)}
                                    className="w-full border border-gray-200 p-2.5 rounded-xl text-xs font-semibold font-mono focus:outline-none focus:border-indigo-500 transition-all"
                                    required
                                />
                            </div>
                            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase block tracking-wider">Signing Shared Secret Key</span>
                                <div className="font-mono text-xs text-gray-600 font-bold select-all">{integrationConfig?.webhookSecret}</div>
                                <p className="text-[9px] text-slate-400">Use this secret matrix hash signature pattern to validate secure headers and prevent replication spoofing attacks.</p>
                            </div>
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-sm transition-all">
                                Deploy Route Target
                            </button>
                        </form>
                    </div>

                    {/* 📣 Notification Channels Suite (Slack, Teams, WhatsApp) */}
                    {/* AB YEH BILKUL SAHI JAGAH HAI */}
                    <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-4">
                        <div>
                            <h3 className="text-sm font-black text-gray-900">Third-Party Chat & Notification Channels</h3>
                            <p className="text-[11px] text-gray-400">Bridge your workspace communication tools directly into our automated server event webhooks pipeline.</p>
                        </div>
                        
                        <form onSubmit={handleSaveChannels} className="space-y-4 divide-y divide-gray-100">
                            {/* Slack Block */}
                            <div className="pt-2">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Slack Incoming Webhook URL</label>
                                <input 
                                    type="url" 
                                    placeholder="https://hooks.slack.com/services/T000/B000/XXXXXX"
                                    value={slackUrl || ''}
                                    onChange={(e) => setSlackUrl(e.target.value)}
                                    className="w-full border border-gray-200 p-2.5 rounded-xl text-xs font-mono font-semibold focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            {/* Teams Block */}
                            <div className="pt-4">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Microsoft Teams Webhook URL</label>
                                <input 
                                    type="url" 
                                    placeholder="https://yourcompany.webhook.office.com/webhookb2/XXXXXX"
                                    value={teamsUrl || ''}
                                    onChange={(e) => setTeamsUrl(e.target.value)}
                                    className="w-full border border-gray-200 p-2.5 rounded-xl text-xs font-mono font-semibold focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            {/* WhatsApp Business API Block */}
                            <div className="pt-4 space-y-3">
                                <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">WhatsApp Business Cloud API Configuration (Meta Console)</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-bold text-gray-400 mb-1">Permanent Access Token (System User)</label>
                                        <input 
                                            type="password" 
                                            placeholder="EAABw..."
                                            value={waToken || ''}
                                            onChange={(e) => setWaToken(e.target.value)}
                                            className="w-full border border-gray-200 p-2.5 rounded-xl text-xs font-mono font-semibold focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-gray-400 mb-1">Phone Number ID</label>
                                        <input 
                                            type="text" 
                                            placeholder="109283746564738"
                                            value={waPhoneId || ''}
                                            onChange={(e) => setWaPhoneId(e.target.value)}
                                            className="w-full border border-gray-200 p-2.5 rounded-xl text-xs font-mono font-semibold focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Save Actions Button */}
                            <div className="pt-4 flex justify-end">
                                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-xl text-xs shadow-sm transition-all">
                                    💾 Save Notification Nodes
                                </button>
                            </div>
                        </form>
                    </div>

                </div> /* Wrapper ends */
            )}
        </div>
    </div>
)}

{/* TAB: 💾 DATA MANAGEMENT & AUDIT */}
{activeTab === 'data-management' && (
    <div className="animate-fadeIn space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-black text-gray-900 mb-2">Enterprise Ledger & Data Lifecycle Management</h2>
            <p className="text-xs text-gray-400 mb-6">Perform master data operations, trigger secure offsite exports, and maintain archival records compliance.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Export Card */}
                <div className="p-5 rounded-2xl border border-gray-200 bg-white flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg">📊</div>
                        <h3 className="text-sm font-black text-gray-900 pt-2">Global Master Data Export</h3>
                        <p className="text-[11px] text-gray-400">Download a compiled system ledger of all corporate clients, onboarding timestamps, operational states, and master records into a standard spreadsheet document format.</p>
                    </div>
                    
                    <div>
                        <a 
                            href="http://localhost:5001/api/data-management/export-companies" 
                            download
                            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-all text-center w-full md:w-auto"
                        >
                            📥 Download Excel Matrix Ledger
                        </a>
                    </div>
                </div>

                {/* Storage Monitoring Functional Card */}
<div className="p-5 rounded-2xl border border-gray-200 bg-white flex flex-col justify-between space-y-4">
    <div className="space-y-1">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-lg">💾</div>
        <h3 className="text-sm font-black text-gray-900 pt-2">Storage Pipeline Allocation</h3>
        <p className="text-[11px] text-gray-400 mb-4">Track structural disk spaces, document buckets utilization matrix, corporate attachments volume per active tenant.</p>
    </div>
    
    {/* Live Progress Metrics List */}
    <div className="space-y-4 max-h-[200px] overflow-y-auto pr-1">
        {storageMetrics.map((metric, idx) => (
            <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-gray-600">
                    <span>{metric.companyName}</span>
                    <span className="text-gray-400">{metric.storageUsed}MB / {metric.storageLimit}MB ({metric.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                            metric.percentage > 80 ? 'bg-rose-500' : metric.percentage > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${metric.percentage}%` }}
                    ></div>
                </div>
            </div>
        ))}
    </div>
</div>

{/* 📥 COMBO MODULE: BULK DATA IMPORT & CROSS-PLATFORM MIGRATION */}
<div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
    <div className="mb-6">
        <h3 className="text-lg font-black text-gray-900 mb-1">📥 Bulk Ingestion & Legacy Migration Gateway</h3>
        <p className="text-xs text-gray-400">Migrate master ledgers natively or translate schema payloads directly from secondary third-party HR providers.</p>
    </div>

    <form onSubmit={handleBulkImport} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Left Box: Engine Selection */}
            <div className="bg-slate-50 p-4 rounded-xl border border-gray-200/60 space-y-3">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Select Source Engine Mapping</label>
                <select 
                    value={sourcePlatform}
                    onChange={(e) => setSourcePlatform(e.target.value)}
                    className="w-full border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-indigo-500"
                >
                    <option value="standard">📦 HRMS Native Standard Schema (.xlsx/.csv)</option>
                    <option value="bamboohr">🌿 BambooHR Legacy Export Matrix</option>
                    <option value="darwinbox">🦊 Darwinbox Cloud Schema Payload</option>
                </select>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                    Selecting a cross-platform parser forces the engine to automatically match and reorganize data columns without disturbing records structures.
                </p>
            </div>

            {/* Right Box: Dropzone File Input */}
            <div className="md:col-span-2 border-2 border-dashed border-gray-200 hover:border-indigo-500 rounded-xl p-6 transition-all bg-white relative flex flex-col items-center justify-center text-center">
                <input 
                    type="file" 
                    accept=".csv, .xlsx, .xls"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <div className="space-y-2">
                    <div className="text-2xl">📁</div>
                    <div className="text-xs font-bold text-slate-700">
                        {selectedFile ? `Selected: ${selectedFile.name}` : "Drag and drop your spreadsheet matrix, or browse files"}
                    </div>
                    <p className="text-[10px] text-gray-400">Supports CSV, XLSX up to 15MB chunks configuration limits.</p>
                </div>
            </div>

        </div>

        {/* System Import Feedback Status Alerts */}
        {importStatus.message && (
            <div className={`p-3 rounded-xl text-xs font-bold border ${
                importStatus.success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
            }`}>
                {importStatus.success ? "✅ Success: " : "❌ Engine Fault: "} {importStatus.message}
            </div>
        )}

        {/* Execution Trigger button */}
        <div className="flex justify-end pt-2 border-t border-gray-50">
            <button 
                type="submit"
                disabled={isImporting}
                className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-sm transition-all ${
                    isImporting ? 'opacity-50 cursor-not-allowed animate-pulse' : ''
                }`}
            >
                {isImporting ? "Processing Data Streams..." : "🚀 Execute Ingestion Pipeline"}
            </button>
        </div>
    </form>
</div>

{/* 💣 MODULE: RETENTION ENGINE & DATA PURGE MATRIX */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
    
    {/* Left Part: Retention Policy Configuration (2 Columns Wide) */}
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
        <h3 className="text-sm font-black text-gray-900 mb-1">⚙️ Compliance & Data Retention Policies</h3>
        <p className="text-[11px] text-gray-400 mb-4">Set time-decay bounds for soft-deleted transactional entities and operational tenant cache blocks before final hard scrub overrides.</p>
        
        <form onSubmit={handleUpdatePolicy} className="flex gap-4 items-end">
            <div className="flex-1 space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Garbage Collection Age Threshold</label>
                <select 
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(e.target.value)}
                    className="w-full border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-indigo-500"
                >
                    <option value="15">📅 15 Days Dynamic Hold Cycle</option>
                    <option value="30">📅 30 Days Standard Archival Window</option>
                    <option value="90">📅 90 Days Enterprise Compliance Bounds</option>
                    <option value="365">📅 365 Days Extended Regulatory Storage</option>
                </select>
            </div>
            <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-[38px] px-5 rounded-xl text-xs transition-all shadow-sm whitespace-nowrap">
                Lock Retention Bound
                </button>
        </form>

        {policyMessage && (
            <div className="mt-3 text-[11px] text-indigo-600 font-bold tracking-wide animate-pulse">
                {policyMessage}
            </div>
        )}
    </div>

    {/* Right Part: Immediate Destruction Console (1 Column Wide) */}
    <div className="bg-rose-50/40 p-6 rounded-2xl border border-rose-100 flex flex-col justify-between">
        <div className="space-y-1">
            <span className="text-[9px] font-black tracking-widest text-rose-500 uppercase bg-rose-100/60 px-2 py-0.5 rounded-md inline-block mb-1">Destructive Action Node</span>
            <h3 className="text-sm font-black text-rose-950">Immediate Data Purge Vault</h3>
            <p className="text-[10px] text-rose-700/80 leading-relaxed">Bypass automated retention calendars to instantly hard-scrub detached system artifacts, dropped records nodes, and purge isolated asset directories immediately.</p>
        </div>

        <button 
            type="button"
            onClick={handleImmediatePurge}
            disabled={purgeLoading}
            className={`w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all text-center mt-4 uppercase tracking-wider ${
                purgeLoading ? 'opacity-40 animate-pulse cursor-wait' : ''
            }`}
        >
            {purgeLoading ? "Scrubbing Sectors..." : "⚠️ Force Core Database Purge"}
        </button>
    </div>

</div>



            </div>
        </div>
    </div>
)}

               

            {/* 📋 MEGA MODAL FOR ADD / EDIT */}
            {isModalOpen && (

                
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
                            <h3 className="text-xl font-black text-gray-900">{isEditMode ? 'Modify Enterprise Profile' : 'Provision New Client'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold bg-white p-2 rounded-full shadow-sm transition-colors">✕</button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <form id="enterpriseForm" onSubmit={handleFormSubmit} className="space-y-8">
                                <div>
                                    <h4 className="text-sm font-black text-indigo-600 uppercase mb-4 border-b pb-2">1. Account & Billing</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="block text-xs font-bold text-gray-700 uppercase mb-2">Company Name *</label><input type="text" required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" /></div>
                                        <div><label className="block text-xs font-bold text-gray-700 uppercase mb-2">Logo Upload</label><input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} className="w-full px-4 py-2 border border-gray-300 rounded-xl outline-none bg-white focus:border-indigo-500" /></div>
                                        <div><label className="block text-xs font-bold text-gray-700 uppercase mb-2">Admin Email *</label><input type="email" required disabled={isEditMode} value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none bg-gray-50 disabled:text-gray-400" /></div>
                                        <div><label className="block text-xs font-bold text-gray-700 uppercase mb-2">Phone</label><input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" /></div>
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Subscription Plan *</label>
                                            <select value={formData.subscriptionPlan} onChange={e => setFormData({...formData, subscriptionPlan: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                                                <option value="Free Trial">Free Trial (₹0 / 30 Days)</option>
                                                <option value="Starter">Starter (₹999 / month)</option>
                                                <option value="Business">Business (₹2499 / month)</option>
                                                <option value="Enterprise">Enterprise (₹4999 / month)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-indigo-600 uppercase mb-4 border-b pb-2">2. Company Profile</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Type</label>
                                            <select value={formData.companyType} onChange={e => setFormData({...formData, companyType: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none bg-white focus:border-indigo-500">
                                                <option value="Startup">Startup</option><option value="SME">SME</option><option value="Enterprise">Enterprise</option><option value="MNC">MNC</option>
                                            </select>
                                        </div>
                                        <div><label className="block text-xs font-bold text-gray-700 uppercase mb-2">Industry</label><input type="text" placeholder="e.g. IT, Healthcare" value={formData.industryType} onChange={e => setFormData({...formData, industryType: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-indigo-500" /></div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Size (Employees)</label>
                                            <select value={formData.companySize} onChange={e => setFormData({...formData, companySize: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none bg-white focus:border-indigo-500">
                                                <option value="1-10">1-10</option><option value="11-50">11-50</option><option value="51-200">51-200</option><option value="200+">200+</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-indigo-600 uppercase mb-4 border-b pb-2">3. Legal & KYC</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className="block text-xs font-bold text-gray-700 uppercase mb-2">GST Number</label><input type="text" placeholder="22AAAAA0000A1Z5" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-indigo-500" /></div>
                                        <div><label className="block text-xs font-bold text-gray-700 uppercase mb-2">PAN Number</label><input type="text" placeholder="ABCDE1234F" value={formData.panNumber} onChange={e => setFormData({...formData, panNumber: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-indigo-500" /></div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 mr-4 transition-colors">Cancel</button>
                            <button form="enterpriseForm" type="submit" className="bg-indigo-600 hover:bg-indigo-700 transition-colors text-white font-bold px-8 py-3 rounded-xl shadow-lg">{isEditMode ? 'Update Client' : 'Register Client'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: 👁️ GLOBAL HR MODULE OVERSIGHT */}
{activeTab === 'hr-oversight' && (
    <div className="animate-fadeIn space-y-6">
        
        {/* Top Header Summary Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Total Cross-Platform Payroll Volume</span>
                    <h2 className="text-xl font-black text-slate-800">₹{hrSummary.totalPlatformPayroll.toLocaleString('en-IN')} <span className="text-xs font-semibold text-gray-400">/mo</span></h2>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg">💰</div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Active Recruitment Pipeline</span>
                    <h2 className="text-xl font-black text-emerald-600">{hrSummary.totalPlatformCandidates} <span className="text-xs font-semibold text-emerald-400">Candidates</span></h2>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-lg">🚀</div>
            </div>

            <div className="bg-rose-50/60 p-5 rounded-2xl border border-rose-100 shadow-sm flex justify-between items-center">
                <div>
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block mb-1">Risk Action Alerts Pending</span>
                    <h2 className="text-xl font-black text-rose-700">{hrSummary.flaggedCompaniesCount} <span className="text-xs font-semibold text-rose-400">Tenants Flagged</span></h2>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 text-lg">⚠️</div>
            </div>
        </div>

        {/* 📊 LEVEL 2: ADVANCED TREND ANALYTICS CHARTS GRID */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    
    {/* Chart A: Salary Disbursement Volume Matrix */}
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="mb-4">
            <span className="text-[9px] font-black tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase">Financial Vector</span>
            <h3 className="text-sm font-black text-slate-800 mt-1">Platform-wide Salary Disbursement Trends</h3>
            <p className="text-[10px] text-gray-400">Track total aggregated cash flow volumes disbursed dynamically across all onboarding tenants.</p>
        </div>
        <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    {/* 💡 Tooltip ko ChartTooltip kiya */}
                    <ChartTooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Disbursed']} />
                    <Area type="monotone" dataKey="totalSalaryDisbursed" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorSalary)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>

    {/* Chart B: Monthly Onboarding & Hiring Velocity */}
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="mb-4">
            <span className="text-[9px] font-black tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">Talent Pool Inflow</span>
            <h3 className="text-sm font-black text-slate-800 mt-1">Monthly Recruitment & Hiring Velocity</h3>
            <p className="text-[10px] text-gray-400">Monitor active talent acquisition pipelines metrics and collective onboarding growth curves.</p>
        </div>
        <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    {/* 💡 Tooltip ko ChartTooltip kiya */}
                    <ChartTooltip formatter={(value) => [value, 'Active Hires']} />
                    <Bar dataKey="activeHires" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>

</div>

        {/* Main Oversight Data Grid Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="mb-6">
                <h2 className="text-lg font-black text-gray-900 mb-1">Global Tenants Multi-Module Audit Console</h2>
                <p className="text-xs text-gray-400">Real-time health analytics, processing states, leave tracking matrices, and feature usage vectors across corporate entities.</p>
            </div>

            {isHrLoading ? (
                <div className="text-center py-12 text-gray-400 font-bold tracking-widest animate-pulse">AGGREGATING CROSS-COMPANY TELEMETRY...</div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
                                <th className="p-3.5">Company Identity</th>
                                <th className="p-3.5">Attendance Health</th>
                                <th className="p-3.5">Leave Patterns</th>
                                <th className="p-3.5">Payroll System</th>
                                <th className="p-3.5">Performance (KPI)</th>
                                <th className="p-3.5">Recruitment Pipeline</th>
                                <th className="p-3.5">Training Logs</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                            {hrOversightData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-all">
                                    {/* Company Name */}
                                    <td className="p-3.5 font-bold text-slate-900">{row.companyName}</td>
                                    
                                    {/* Attendance Status */}
                                    <td className="p-3.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${row.attendance.flagLow ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`}></span>
                                            <span className="font-semibold">{row.attendance.rate}%</span>
                                        </div>
                                        {row.attendance.flagLow && <span className="text-[9px] font-bold text-rose-500 block">⚠️ Critical Low Rate</span>}
                                    </td>

                                    {/* Leave Analytics */}
                                    <td className="p-3.5">
                                        <div className="font-semibold text-slate-700">{row.leaves.commonType}</div>
                                        <div className="text-[9px] text-gray-400 font-mono">{row.leaves.abusePattern}</div>
                                    </td>

                                    {/* Payroll Operations */}
                                    <td className="p-3.5">
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider block w-max ${
                                            row.payroll.status === 'Processed' || row.payroll.status === 'Disbursed' 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                                        }`}>
                                            {row.payroll.status}
                                        </span>
                                        <span className="text-[10px] text-gray-500 block mt-1 font-mono">₹{row.payroll.volume.toLocaleString('en-IN')}</span>
                                    </td>

                                    {/* Performance Appraisals */}
                                    <td className="p-3.5">
                                        {row.performance.isUsing ? (
                                            <div className="space-y-0.5">
                                                <div className="font-semibold text-slate-700">{row.performance.appraisalCycle}</div>
                                                <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-indigo-600 h-full" style={{ width: `${row.performance.kpiCompletion}%` }}></div>
                                                </div>
                                                <span className="text-[9px] text-gray-400 font-bold block">{row.performance.kpiCompletion}% KPIs Complete</span>
                                            </div>
                                        ) : (
                                            <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 bg-slate-100 text-slate-400 rounded border border-slate-200 block w-max">
                                                🚫 Module Offline
                                            </span>
                                        )}
                                    </td>

                                    {/* Recruitment Statistics */}
                                    <td className="p-3.5">
                                        <div className="font-bold text-slate-800">{row.recruitment.activePostings} Open Openings</div>
                                        <div className="text-[10px] text-indigo-500 font-semibold">{row.recruitment.pipelineCandidates} Applied Candidates</div>
                                    </td>

                                    {/* Training Metrics */}
                                    <td className="p-3.5">
                                        <div className="font-semibold text-emerald-600">{row.training.completionRate}% Done</div>
                                        <div className="text-[9px] text-gray-400 max-w-[130px] truncate" title={row.training.popularModule}>
                                            {row.training.popularModule}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
)}

            

            {/* 👨‍💼 TEAM MEMBER MODAL */}
{isTeamModalOpen && (

    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">

        <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">

            <div className="p-6 border-b border-gray-100 flex justify-between items-center">

                <h3 className="text-xl font-black text-gray-900">
                    Add Team Member
                </h3>

                <button
                    onClick={() => setIsTeamModalOpen(false)}
                    className="text-gray-400 hover:text-red-500"
                >
                    ✕
                </button>
            </div>

            <form
                onSubmit={handleAddTeamMember}
                className="p-6 space-y-4"
            >

                <div>
                    <label className="block text-sm font-bold mb-2">
                        Name
                    </label>

                    <input
                        type="text"
                        required
                        value={teamForm.name}
                        onChange={(e) =>
                            setTeamForm({
                                ...teamForm,
                                name: e.target.value
                            })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2">
                        Email
                    </label>

                    <input
                        type="email"
                        required
                        value={teamForm.email}
                        onChange={(e) =>
                            setTeamForm({
                                ...teamForm,
                                email: e.target.value
                            })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-indigo-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
    {isEditTeamMode ? "Password (Leave Blank to Keep Current)" : "Password Key"}
</label>

                    <input
                        type="password"
                        required
                        value={teamForm.password}
                        onChange={(e) =>
                            setTeamForm({
                                ...teamForm,
                                password: e.target.value
                            })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none focus:border-indigo-500"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold"
                >
                    Add Member
                </button>

                {isDeleteTeamModalOpen && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto border border-red-100">⚠️</div>
            <div>
                <h3 className="text-lg font-black text-gray-900">Confirm Purge</h3>
                <p className="text-xs text-gray-500 font-semibold mt-1">
                    Are you sure you want to delete <span className="text-red-600 font-black">"{teamMemberToDelete?.name}"</span>?
                </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
                <button 
                    type="button"
                    onClick={() => { setIsDeleteTeamModalOpen(false); setTeamMemberToDelete(null); }}
                    className="w-full bg-gray-100 hover:bg-gray-200 py-2.5 rounded-xl text-xs font-bold text-gray-600"
                >
                    Cancel
                </button>
                <button 
                    type="button"
                    onClick={handleDeleteTeamMember}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-md"
                >
                    Confirm Erase
                </button>
            </div>
        </div>
    </div>
)}

            </form>
        </div>
    </div>
)}
        </div>
    );
}