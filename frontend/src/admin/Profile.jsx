import { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar.jsx';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminProfile() {
    const [adminData, setAdminData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Local Form Input States
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [branchLocation, setBranchLocation] = useState('');
    const [phone, setPhone] = useState('');
    const [panId, setPanId] = useState(''); // ✅ Core State Added
    const [gstId, setGstId] = useState('');
    const [companySizeRange, setCompanySizeRange] = useState('');

    // Verification & Loading States
    const [isPhoneVerified, setIsPhoneVerified] = useState(true);
    const [isPanVerified, setIsPanVerified] = useState(true);   // ✅ Core State Added
    const [isGstVerified, setIsGstVerified] = useState(true);
    const [activeOtpDrawer, setActiveOtpDrawer] = useState(null); // 'phone', 'pan', 'gst'
    const [otpCode, setOtpCode] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const COMPANY_SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "501+"];

    // Cleans up phone formats gracefully
    const formatPhoneNumber = (value) => {
        const digits = value.replace(/\D/g, '');
        if (!digits) return '';
        if (digits.length <= 10) return digits;
        return digits.slice(0, 10);
    };

    // Main API data synchronization pipeline hook
    const fetchAdminProfileAndMetrics = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        try {
            const profileRes = await fetch('/api/auth/admin-profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const profile = await profileRes.json();

            if (!profileRes.ok) throw new Error(profile.message || "Failed to load admin profile.");

            const employeeRes = await fetch('/api/employees', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const employees = await employeeRes.json();

            if (employeeRes.ok) {
                const total = employees.length;
                const hrs = employees.filter(emp => emp.role === 'hr' || emp.department?.toLowerCase().includes('hr') || emp.department?.toLowerCase().includes('resource')).length;
                const devs = employees.filter(emp => emp.department?.toLowerCase().includes('engineer') || emp.department?.toLowerCase().includes('dev')).length;
                const designers = employees.filter(emp => emp.department?.toLowerCase().includes('design') || emp.department?.toLowerCase().includes('ux') || emp.department?.toLowerCase().includes('ui')).length;
                const safeOthers = Math.max(0, total - (hrs + devs + designers));

                const synchronizedDepts = [
                    { id: "eng", name: "Tech / Engineering", icon: "💻", count: devs },
                    { id: "hr", name: "Human Resources", icon: "👥", count: hrs },
                    { id: "design", name: "UI/UX & Design", icon: "🎨", count: designers },
                    { id: "marketing", name: "Marketing & Others", icon: "📢", count: safeOthers }
                ];

                const finalData = {
                    adminId: profile.adminId || "N/A",
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone || "",
                    panId: profile.panId || "", // ✅ Mapped from schema document values
                    gstId: profile.gstId || "",
                    title: "Chief Executive Officer (CEO)",
                    companyName: profile.companyName || "Workspace Company",
                    companyStartDate: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "N/A",
                    branchLocation: profile.branchLocation || "",
                    securityClearance: "Level 5 (Root Global Access)",
                    legalStructure: "Private Limited (LLC)",
                    boardSeats: "7 Seats Allocated",
                    marketCapTier: "Mid-Market Enterprise",
                    companySizeRange: profile.companySizeRange || "1-10",
                    managedEmployeesCount: total,
                    departments: synchronizedDepts
                };

                setAdminData(finalData);

                // Initialize form states
                setName(finalData.name);
                setCompanyName(finalData.companyName);
                setBranchLocation(finalData.branchLocation);
                setPhone(finalData.phone);
                setPanId(finalData.panId); // ✅ Form state link added
                setGstId(finalData.gstId);
                setCompanySizeRange(finalData.companySizeRange);
            }
        } catch (err) {
            toast.error(err.message || "Error reading admin records.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminProfileAndMetrics();
    }, []);

    // Form value modifications watchers enforcing re-verification flags on value mismatches
    const handlePhoneChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        setPhone(formatted);
        setIsPhoneVerified(formatted === adminData?.phone);
    };

    const handlePanChange = (e) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        setPanId(value);
        setIsPanVerified(value === adminData?.panId);
    };

    const handleGstChange = (e) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        setGstId(value);
        setIsGstVerified(value === adminData?.gstId);
    };

    const handleTriggerOtp = (type) => {
        setActiveOtpDrawer(type);
        setOtpCode("");
        toast.info(`Verification token dispatched! (Use '1234' for testing)`);
    };

    const handleVerifyOtp = () => {
        if (otpCode === "1234") {
            toast.success("Security challenge verified successfully.");
            if (activeOtpDrawer === 'phone') setIsPhoneVerified(true);
            if (activeOtpDrawer === 'pan') setIsPanVerified(true);   // ✅ PAN update lock pass
            if (activeOtpDrawer === 'gst') setIsGstVerified(true);
            setActiveOtpDrawer(null);
            setOtpCode("");
        } else {
            toast.error("Invalid OTP code. Please try again.");
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!isPhoneVerified || !isPanVerified || !isGstVerified) {
            toast.error("Please resolve unverified compliance locks before saving.");
            return;
        }

        const token = localStorage.getItem('authToken');
        setIsLoading(true);

        const updatedPayload = {
            name,
            companyName,
            branchLocation,
            phone,
            panId, // ✅ Injected parameters safely down transmission context
            gstId,
            companySizeRange
        };

        try {
            const res = await fetch('/api/auth/admin-profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedPayload)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to commit modifications.");

            toast.success("Administrative profile records committed successfully!");
            setIsEditing(false);
            fetchAdminProfileAndMetrics();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleEditMode = () => {
        setIsEditing(!isEditing);
        setActiveOtpDrawer(null);
        if (!isEditing && adminData) {
            setName(adminData.name);
            setCompanyName(adminData.companyName);
            setBranchLocation(adminData.branchLocation);
            setPhone(adminData.phone);
            setPanId(adminData.panId); // Restores verified database fallback strings
            setGstId(adminData.gstId);
            setCompanySizeRange(adminData.companySizeRange);

            // ✅ FIXED: Force resets compliance verified flags to true on initial view mount hot-swaps
            setIsPhoneVerified(true);
            setIsPanVerified(true);  // 👈 Link added to prevent artificial verification blocks on load
            setIsGstVerified(true);
        }
    };

    // Reusable green-checkmark vector path template element
    const renderCheckmarkIcon = () => (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 animate-fadeIn" title="Verified Metadata Field">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
        </div>
    );

    return (
        <div className="min-h-screen flex bg-white font-sans">
            <AdminSidebar activeModule="profile" />
            <ToastContainer position="top-right" autoClose={4000} theme="light" />

            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Workspace Header Title */}
                    <div className="border-b border-gray-100 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Profile</h1>
                            <p className="text-sm text-gray-500 mt-1">Audit administrative clearances, legal framework configurations, and organizational headcounts</p>
                        </div>
                        {!isLoading && adminData && (
                            <button
                                type="button"
                                onClick={toggleEditMode}
                                className={`text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all border ${isEditing ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'}`}
                            >
                                {isEditing ? "Cancel Changes" : "✏️ Edit Profile Data"}
                            </button>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="p-12 text-center text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">
                            Querying Mongoose Admin Cluster Metadata...
                        </div>
                    ) : adminData ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Left Column Summary Cards */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col items-center text-center">
                                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-800 to-purple-900 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-indigo-100 mb-4 tracking-tighter">
                                        CEO
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900 leading-tight">{adminData.name}</h2>
                                    <p className="text-[9px] font-black text-indigo-700 mt-1.5 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-md mb-2">
                                        {adminData.title}
                                    </p>
                                    <span className="text-xs font-bold text-gray-600 font-mono tracking-tight">
                                        {adminData.phone ? `+91 ${adminData.phone.slice(0, 5)} ${adminData.phone.slice(5, 10)}` : "No Phone Registered"}
                                    </span>

                                    <div className="w-full border-t border-gray-100 my-5" />
                                    <div className="w-full text-left space-y-4">
                                        <div>
                                            <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Mongoose Unique ID</span>
                                            <span className="text-xs font-mono font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-100 block break-all">{adminData.adminId}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Secure Root Email</span>
                                            <span className="text-xs font-bold text-gray-800 break-all">{adminData.email}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
                                    <div className="border-b border-gray-100 pb-2">
                                        <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Departments Registry</h3>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Operational Headcount Allocations</p>
                                    </div>
                                    <div className="space-y-2 text-xs font-bold">
                                        {adminData.departments.map((dept) => (
                                            <div key={dept.id} className="flex justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-xl items-center">
                                                <span className="text-gray-500 uppercase text-[10px] tracking-tight">{dept.icon} {dept.name}</span>
                                                <span className="font-mono font-black text-gray-900 text-[11px] bg-white px-2 py-1 rounded border border-gray-100">{dept.count} Hires</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Dynamic Form Block Elements */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6 pb-2 border-b border-gray-100">
                                        Configuration Specifications
                                    </h3>

                                    {!isEditing ? (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Registered Enterprise</span>
                                                    <span className="text-sm font-black text-gray-900">{adminData.companyName}</span>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Incorporation Timeline</span>
                                                    <span className="text-sm font-bold text-gray-800">{adminData.companyStartDate}</span>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Headquarters Location Hub</span>
                                                    <span className="text-sm font-bold text-gray-800">{adminData.branchLocation || "Not Configured"}</span>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Security Access Token Flag</span>
                                                    <span className="text-sm font-mono font-bold text-indigo-700">{adminData.securityClearance}</span>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">PAN Identity Core</span>
                                                    <span className="text-sm font-mono font-black text-gray-900 uppercase tracking-wider">{adminData.panId || "NOT FOUND"}</span>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Corporate GSTIN Identity</span>
                                                    <span className="text-sm font-mono font-black text-indigo-600 tracking-wider">{adminData.gstId || "NOT FOUND"}</span>
                                                </div>
                                            </div>

                                            <div className="bg-indigo-50/40 border border-indigo-100 p-5 rounded-2xl flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">Employee Capacity Threshold Scale</h4>
                                                    <p className="text-[10px] font-medium text-gray-400 mt-0.5">Declared operational volume bounds</p>
                                                </div>
                                                <div className="font-mono font-black text-sm text-indigo-700 bg-white border border-indigo-100 px-4 py-2 rounded-xl">
                                                    🏢 {adminData.companySizeRange} Employees
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleUpdateProfile} className="space-y-5" autoComplete="off">
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CEO Executive Full Name</label>
                                                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={!!activeOtpDrawer} className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-gray-800 disabled:opacity-60" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Enterprise Identity Name</label>
                                                        <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required disabled={!!activeOtpDrawer} className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-gray-800 disabled:opacity-60" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">HQ Node Location Address</label>
                                                        <input type="text" value={branchLocation} onChange={(e) => setBranchLocation(e.target.value)} required disabled={!!activeOtpDrawer} className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-gray-800 disabled:opacity-60" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Company Size Range</label>
                                                        <select value={companySizeRange} onChange={(e) => setCompanySizeRange(e.target.value)} disabled={!!activeOtpDrawer} className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-gray-800 disabled:opacity-60 cursor-pointer">
                                                            {COMPANY_SIZE_OPTIONS.map((opt) => (
                                                                <option key={opt} value={opt}>{opt} Employees</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* ✅ PHONE FIELD WITH RIGHT-SIDE ABSOLUTE INDICATORS */}
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Primary Contact Number</label>
                                                    <div className="relative flex items-center">
                                                        <input type="text" placeholder="10-digit number" value={phone} onChange={handlePhoneChange} required disabled={!!activeOtpDrawer} className="w-full pl-4 pr-24 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-gray-800 disabled:opacity-60" />
                                                        <div className="absolute right-3 flex items-center">
                                                            {isPhoneVerified ? renderCheckmarkIcon() : (
                                                                !activeOtpDrawer && phone.length === 10 && (
                                                                    <button type="button" onClick={() => handleTriggerOtp('phone')} className="text-[9px] font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-md transition-all shadow-sm animate-fadeIn">Verify</button>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* ✅ PAN ID FIELD WITH RIGHT-SIDE ABSOLUTE INDICATORS */}
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">PAN Card Alpha-Numeric ID</label>
                                                    <div className="relative flex items-center">
                                                        <input type="text" placeholder="10-character PAN string" maxLength={10} value={panId} onChange={handlePanChange} required disabled={!!activeOtpDrawer} className="w-full pl-4 pr-24 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-mono font-bold uppercase text-gray-800 disabled:opacity-60" />
                                                        <div className="absolute right-3 flex items-center">
                                                            {isPanVerified ? renderCheckmarkIcon() : (
                                                                !activeOtpDrawer && panId.length === 10 && (
                                                                    <button type="button" onClick={() => handleTriggerOtp('pan')} className="text-[9px] font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-md transition-all shadow-sm animate-fadeIn">Verify</button>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* ✅ GST ID FIELD WITH RIGHT-SIDE ABSOLUTE INDICATORS */}
                                                <div>
                                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Corporate GSTIN Registration</label>
                                                    <div className="relative flex items-center">
                                                        <input type="text" placeholder="15-character GSTIN string" maxLength={15} value={gstId} onChange={handleGstChange} required disabled={!!activeOtpDrawer} className="w-full pl-4 pr-24 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-mono font-bold uppercase text-gray-800 disabled:opacity-60" />
                                                        <div className="absolute right-3 flex items-center">
                                                            {isGstVerified ? renderCheckmarkIcon() : (
                                                                !activeOtpDrawer && gstId.length === 15 && (
                                                                    <button type="button" onClick={() => handleTriggerOtp('gst')} className="text-[9px] font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-md transition-all shadow-sm animate-fadeIn">Verify</button>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* OTP Verification Drawer Inline Component Panel */}
                                            {activeOtpDrawer && (
                                                <div className="mt-4 p-5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3 animate-fadeIn">
                                                    <div className="flex flex-col">
                                                        <label className="block text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">
                                                            Confirm Admin {activeOtpDrawer.toUpperCase()} Token Challenge Signature
                                                        </label>
                                                        <div className="flex gap-3">
                                                            <input type="text" maxLength="4" placeholder="••••" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} className="w-32 px-4 py-3 text-center text-sm tracking-widest rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all font-mono font-black" />
                                                            <button type="button" onClick={handleVerifyOtp} className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-widest px-6 rounded-xl transition-all shadow-md">
                                                                Verify Signature
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={!isPhoneVerified || !isPanVerified || !isGstVerified || !!activeOtpDrawer}
                                                className={`w-full font-black text-[10px] uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg ${isPhoneVerified && isPanVerified && isGstVerified && !activeOtpDrawer ? 'bg-gray-900 text-white hover:bg-black shadow-gray-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'}`}
                                            >
                                                Commit Global Configuration Document Changes
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="p-12 text-center text-xs font-black text-rose-500 uppercase tracking-widest">
                            ⚠️ System error parsing admin profile context layer.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}