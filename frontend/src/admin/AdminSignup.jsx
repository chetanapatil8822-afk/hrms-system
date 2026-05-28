import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const inputBaseStyles = "w-full pl-10 pr-4 py-3 text-sm font-bold bg-gray-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all text-gray-800 border-gray-200";
const labelStyles = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5";

export default function AdminSignup() {
    const navigate = useNavigate();

    // STATE TRACKING FOR BASE REGISTRATION VALUES
    const [companyName, setCompanyName] = useState('');
    const [adminId, setAdminId] = useState(''); // Employee Target Quota
    const [name, setName] = useState(''); // Founder/CEO Name
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [companyStartDate, setCompanyStartDate] = useState('');
    const [branchLocation, setBranchLocation] = useState('');

    // COMPLIANCE DATA STATE FIELDS
    const [phone, setPhone] = useState('');
    const [panId, setPanId] = useState('');
    const [gstId, setGstId] = useState('');

    // STATE FOR SEQUENTIAL VERIFICATION STEP LOCKS
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [isPanVerified, setIsPanVerified] = useState(false);
    const [isGstVerified, setIsGstVerified] = useState(false);

    // OTP Modal Windows Management State Nodes
    const [otpModal, setOtpModal] = useState({ isOpen: false, targetField: '', valuePending: '', dummyOtp: '' });
    const [userOtpInput, setUserOtpInput] = useState('');

    // UI Utilities
    const [showPassword, setShowPassword] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false); // ➕ ADDED: Focus engine tracking state
    const [error, setError] = useState('');

    // DYNAMIC PASSWORD STRENGTH EVALUATOR
    const getPasswordStrength = () => {
        if (!password) return { text: '', color: 'text-gray-400' };
        if (password.length < 4) return { text: '⚠️ Weak Password', color: 'text-rose-600' };
        if (password.length < 8) return { text: '🕒 Medium Password', color: 'text-amber-600' };
        return { text: '✓ Strong Password', color: 'text-emerald-600' };
    };

    const strength = getPasswordStrength();

    // SIMULATED SECURE OTP GENERATOR GATE
    const handleTriggerOtpDispatch = (fieldType, rawValue) => {
        if (!rawValue.trim()) {
            setError(`Please specify a valid value before initializing ${fieldType.toUpperCase()} validation.`);
            return;
        }
        setError('');

        const simulatedToken = String(Math.floor(1000 + Math.random() * 9000));

        setOtpModal({
            isOpen: true,
            targetField: fieldType,
            valuePending: rawValue.trim().toUpperCase(),
            dummyOtp: simulatedToken
        });

        alert(`📨 [Security Gateway Dispatch]:\nSimulated OTP code sent for your ${fieldType.toUpperCase()} verification setup: ${simulatedToken}`);
    };

    // OTP COMMIT LAYER VERIFICATION METHOD
    const handleVerifyOtpSubmit = (e) => {
        e.preventDefault();
        if (userOtpInput !== otpModal.dummyOtp) {
            alert("❌ Invalid OTP token string entered. Verification dropped.");
            return;
        }

        if (otpModal.targetField === 'phone') {
            setIsPhoneVerified(true);
            setPhone(otpModal.valuePending);
        } else if (otpModal.targetField === 'pan') {
            setIsPanVerified(true);
            setPanId(otpModal.valuePending);
        } else if (otpModal.targetField === 'gst') {
            setIsGstVerified(true);
            setGstId(otpModal.valuePending);
        }

        setUserOtpInput('');
        setOtpModal({ isOpen: false, targetField: '', valuePending: '', dummyOtp: '' });
    };

    // SECURE PAYLOAD STAGING HANDLER
    const handleSignupSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!isPhoneVerified || !isPanVerified || !isGstVerified) {
            setError("Compliance check incomplete: You must verify your Phone, PAN, and GST metrics sequentially to unlock system registration.");
            return;
        }

        const assignedAdminId = `ADM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const pendingAdminPayload = {
            adminId: assignedAdminId,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: password,
            companyName: companyName.trim(),
            companyStartDate: companyStartDate,
            branchLocation: branchLocation.trim(),
            phone: phone.trim(),
            panId: panId.trim().toUpperCase(),
            gstId: gstId.trim().toUpperCase(),
            employeeQuotaTarget: Number(adminId) || 10,
            hasPaidTier: true,
            Employee: []
        };

        localStorage.setItem('pendingAdminData', JSON.stringify(pendingAdminPayload));
        navigate('/admin/upgrade');
    };

    // 🔄 DYNAMIC TYPE STRATEGY: Tells browser it's a standard text field on load, swaps to password during input focus
    const determinePasswordInputType = () => {
        if (showPassword) return "text";
        if (isPasswordFocused || password.length > 0) return "password";
        return "text";
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 md:p-8 font-sans relative">

            {/* OTP MODAL COMPONENT WINDOW */}
            {otpModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-100 shadow-2xl space-y-4">
                        <div className="text-center">
                            <span className="text-2xl">🔐</span>
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mt-1">Verify {otpModal.targetField}</h3>
                            <p className="text-xs font-semibold text-gray-400 mt-1">
                                Confirming payload parameters value: <span className="text-indigo-600 font-mono font-bold">{otpModal.valuePending}</span>
                            </p>
                        </div>
                        <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Enter 4-Digit Security OTP"
                                maxLength={4}
                                required
                                value={userOtpInput}
                                onChange={(e) => setUserOtpInput(e.target.value.replace(/\D/g, ''))}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center font-mono tracking-widest text-lg font-black bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setOtpModal({ isOpen: false, targetField: '', valuePending: '', dummyOtp: '' }); setUserOtpInput(''); }}
                                    className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold py-3 text-xs uppercase tracking-widest rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="w-1/2 bg-indigo-700 hover:bg-indigo-800 text-white font-black py-3 text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm shadow-indigo-100"
                                >
                                    Verify Code
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 p-6 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-800 to-purple-900" />

                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-800 text-xl font-black flex items-center justify-center mx-auto mb-3 shadow-sm border border-indigo-100">🏢</div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Admin SignUp</h1>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">Initialize corporate details before validating membership access</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 text-xs font-black uppercase tracking-wider border rounded-xl bg-rose-50 text-rose-700 border-rose-100 animate-fadeIn">⚠️ {error}</div>
                )}

                {/* 🔄 ADDED explicit form identifiers to neutralize standard password manager definitions */}
                <form onSubmit={handleSignupSubmit} className="space-y-6" autoComplete="new-password" name="admin_creation_gateway">

                    <span className="block text-[10px] font-black text-indigo-700 uppercase tracking-widest pb-1 border-b border-gray-100">1. Corporate Enterprise Specifics</span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className={labelStyles}>Company Name</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-3.5 text-gray-400 text-xs">🏢</span>
                                <input type="text" name="company_name_field" placeholder="Nexus Quantum Corp" value={companyName} onChange={e => setCompanyName(e.target.value)} required className={inputBaseStyles} />
                            </div>
                        </div>

                        <div>
                            <label className={labelStyles}>Incorporation Launch Date</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-3.5 text-gray-400 text-xs">📅</span>
                                <input type="date" name="incorporation_date_field" value={companyStartDate} onChange={e => setCompanyStartDate(e.target.value)} required className="w-full pl-10 pr-4 py-3 text-sm font-bold bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all text-gray-500" />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label className={labelStyles}>Headquarters Base Location</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-3.5 text-gray-400 text-xs">📍</span>
                                <input type="text" name="hq_location_field" placeholder="BKC Complex, Mumbai, India" value={branchLocation} onChange={e => setBranchLocation(e.target.value)} required className={inputBaseStyles} />
                            </div>
                        </div>
                    </div>

                    <span className="block text-[10px] font-black text-indigo-700 uppercase tracking-widest pt-2 pb-1 border-b border-gray-100">2. Verification Pipeline Tiers</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

                        {/* CONTACT NUMBER */}
                        <div>
                            <label className={labelStyles}>Contact Number</label>
                            <div className="relative flex flex-col gap-1.5">
                                <div className="relative w-full">
                                    <span className="absolute left-3.5 top-3.5 text-gray-400 text-xs">📞</span>
                                    <input
                                        type="tel"
                                        name="admin_contact_field"
                                        placeholder="10-digit number"
                                        disabled={isPhoneVerified}
                                        value={phone}
                                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                                        required
                                        className={isPhoneVerified ? "w-full pl-10 pr-4 py-3 text-sm font-bold bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl outline-none" : inputBaseStyles}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleTriggerOtpDispatch('phone', phone)}
                                    className={`w-full text-[9px] py-1.5 font-black uppercase tracking-wider rounded-lg transition-colors border ${isPhoneVerified ? 'bg-emerald-100 border-emerald-300 text-emerald-800 cursor-default' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'}`}
                                >
                                    {isPhoneVerified ? "✓ Verified Mobile" : "Send Mobile OTP"}
                                </button>
                            </div>
                        </div>

                        {/* PAN ID NUMBER */}
                        <div>
                            <label className={labelStyles}>PAN Card ID Number</label>
                            <div className="relative flex flex-col gap-1.5">
                                <div className="relative w-full">
                                    <span className="absolute left-3.5 top-3.5 text-gray-400 text-xs">💳</span>
                                    <input
                                        type="text"
                                        name="admin_pan_field"
                                        placeholder="ABCDE1234F"
                                        maxLength={10}
                                        disabled={isPanVerified}
                                        value={panId}
                                        onChange={e => setPanId(e.target.value.toUpperCase())}
                                        required
                                        className={isPanVerified ? "w-full pl-10 pr-4 py-3 text-sm font-bold bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl outline-none" : inputBaseStyles}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleTriggerOtpDispatch('pan', panId)}
                                    className={`w-full text-[9px] py-1.5 font-black uppercase tracking-wider rounded-lg transition-colors border ${isPanVerified ? 'bg-emerald-100 border-emerald-300 text-emerald-800 cursor-default' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'}`}
                                >
                                    {isPanVerified ? "✓ Verified PAN" : "Verify PAN Via OTP"}
                                </button>
                            </div>
                        </div>

                        {/* GST INVOICE ID */}
                        <div>
                            <label className={labelStyles}>GSTIN Corporate ID</label>
                            <div className="relative flex flex-col gap-1.5">
                                <div className="relative w-full">
                                    <span className="absolute left-3.5 top-3.5 text-gray-400 text-xs">🧾</span>
                                    <input
                                        type="text"
                                        name="admin_gst_field"
                                        placeholder="22AAAAA1111A1Z1"
                                        maxLength={15}
                                        disabled={isGstVerified}
                                        value={gstId}
                                        onChange={e => setGstId(e.target.value.toUpperCase())}
                                        required
                                        className={isGstVerified ? "w-full pl-10 pr-4 py-3 text-sm font-bold bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl outline-none" : inputBaseStyles}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleTriggerOtpDispatch('gst', gstId)}
                                    className={`w-full text-[9px] py-1.5 font-black uppercase tracking-wider rounded-lg transition-colors border ${isGstVerified ? 'bg-emerald-100 border-emerald-300 text-emerald-800 cursor-default' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'}`}
                                >
                                    {isGstVerified ? "✓ Verified GSTIN" : "Verify GSTIN Via OTP"}
                                </button>
                            </div>
                        </div>
                    </div>

                    <span className="block text-[10px] font-black text-indigo-700 uppercase tracking-widest pt-2 pb-1 border-b border-gray-100">3. System Identity & Access Security</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className={labelStyles}>Founder Name (CEO)</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-3.5 text-gray-400 text-xs">👤</span>
                                <input type="text" name="ceo_name_field" placeholder="Yash Patel" value={name} onChange={e => setName(e.target.value)} required className={inputBaseStyles} />
                            </div>
                        </div>

                        <div>
                            <label className={labelStyles}>Secure Core Webmail</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-3.5 text-gray-400 text-xs">✉️</span>
                                {/* 🔄 CHANGED: Modified text field type to dynamic custom label matching secure strategies */}
                                <input type="text" name="secure_corporate_email" placeholder="ceo@company.com" value={email} onChange={e => setEmail(e.target.value)} required className={inputBaseStyles} />
                            </div>
                        </div>

                        <div>
                            <label className={labelStyles}>Total Employee Count Limit</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-3.5 text-gray-400 text-xs">👥</span>
                                <input type="number" name="employee_count_field" placeholder="e.g. 50" value={adminId} onChange={e => setAdminId(e.target.value)} required className={inputBaseStyles} />
                            </div>
                        </div>

                        <div>
                            <label className={labelStyles}>Secure Account Access Password</label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-3.5 text-gray-400 text-xs">🔒</span>
                                {/* 🔄 CHANGED: Evaluates dynamically to block password manager autofill injections cleanly */}
                                <input
                                    type={determinePasswordInputType()}
                                    name="secure_system_credential"
                                    placeholder={isPasswordFocused ? "" : "••••••••••••"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onFocus={() => setIsPasswordFocused(true)}
                                    onBlur={() => setIsPasswordFocused(false)}
                                    autoComplete="new-password"
                                    required
                                    className="w-full pl-10 pr-12 py-3 text-sm font-bold bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600 transition-all text-gray-800"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-3 text-gray-400 text-sm hover:text-gray-600">
                                    {showPassword ? "🔒" : "👁️"}
                                </button>
                            </div>
                            {password && (
                                <div className={`mt-2 text-[10px] font-black uppercase tracking-wider ${strength.color}`}>{strength.text}</div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 pt-4">
                        <button
                            type="submit"
                            className="w-full font-black text-[10px] uppercase tracking-widest py-4 rounded-xl transition-all shadow-md bg-gray-900 text-white hover:bg-gray-800 shadow-gray-100"
                        >
                            Proceed to Premium Subscription Plan →
                        </button>
                        <button type="button" onClick={() => navigate('/')} className="w-full text-center text-[10px] font-black uppercase tracking-widest py-2 text-gray-400 hover:text-indigo-700 transition-colors">← Cancel and Return to Login</button>
                    </div>
                </form>
            </div>
        </div>
    );
}