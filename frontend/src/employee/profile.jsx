import { useState, useEffect } from 'react';
import EmployeeSidebar from '@/components/EmployeeSidebar';
// ✅ IMPORT TOASTIFY HOOKS NATIVELY
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function EmployeeProfile() {
  const [employee, setEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Core Form Fields State
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [previousCompany, setPreviousCompany] = useState("");
  const [previousRole, setPreviousRole] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");

  // Verification & UI Staging States
  const [isPhoneVerified, setIsPhoneVerified] = useState(true);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Auto Country-Code Formatter Engine
  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length <= 10) return digits;
    return digits.slice(0, 10);
  };

  // 📋 GET: FETCH PROFILE DATA NATIVELY FROM DB ON MOUNT
  const fetchEmployeeProfileData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('authToken');

    try {
      const res = await fetch('/api/employees/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to parse system data ledger.");

      // Bind data straight into our functional view nodes
      setEmployee(data);
      setPhone(data.phone || "");
      setAddress(data.address || "");
      setRole(data.role || "");
      setDepartment(data.department || "");
      setPreviousCompany(data.previousCompany || "");
      setPreviousRole(data.previousRole || "");
      setYearsOfExperience(data.yearsOfExperience || "");

      setIsPhoneVerified(true);
    } catch (err) {
      toast.error(`❌ Sync Failure: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeProfileData();
  }, []);

  const handlePhoneChange = (e) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setPhone(formattedValue);
    setIsPhoneVerified(formattedValue === employee?.phone);
  };

  const handleTriggerVerification = () => {
    setIsVerifyingPhone(true);
    toast.info("📨 Verification code dispatched to your mobile terminal! (Use '1234' for testing)");
  };

  const handleVerifyOtp = () => {
    if (otpCode === "1234") {
      toast.success("🎯 Mobile signature challenge verified successfully!");
      setIsPhoneVerified(true);
      setIsVerifyingPhone(false);
      setOtpCode("");
    } else {
      toast.error("⚠️ Invalid verification code. Security challenge failed.");
    }
  };

  // 🚀 PUT: COMMIT METADATA UPDATES CLEARLY INTO MONGO DATA FIELDS
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!isPhoneVerified) {
      toast.warning("🔒 Verification Lock Active: Complete mobile authentication before committing changes.");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('authToken');

    const updatedPayload = {
      phone,
      address,
      role,
      department,
      previousCompany,
      previousRole,
      yearsOfExperience
    };

    try {
      const res = await fetch('/api/employees/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedPayload)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Could not write updates.");

      toast.success("🎉 Profile records successfully updated in the database cluster!");
      setIsEditing(false);
      fetchEmployeeProfileData(); // Reload document context cleanly
    } catch (err) {
      toast.error(`❌ Update Error: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsVerifyingPhone(false);
    setOtpCode("");
    if (employee) {
      setPhone(employee.phone || "");
      setAddress(employee.address || "");
      setRole(employee.role || "");
      setDepartment(employee.department || "");
      setPreviousCompany(employee.previousCompany || "");
      setPreviousRole(employee.previousRole || "");
      setYearsOfExperience(employee.yearsOfExperience || "");
      setIsPhoneVerified(true);
    }
  };

  // 🌐 Helper to open uploaded file locations natively in a fresh window shell
  const handleViewDocument = (filename) => {
    if (!filename) {
      toast.error("⚠️ Document resource unavailable or missing for this worker profile.");
      return;
    }
    window.open(`/uploads/${filename}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-sans text-xs font-black uppercase tracking-widest text-zinc-400 animate-pulse">
        Syncing with Mongoose Employee Database Cluster Nodes...
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-sans text-xs font-black uppercase tracking-widest text-rose-500">
        ⚠️ Profile could not be resolved. Please log in again.
      </div>
    );
  }

  // 📦 Build structural arrays dynamically directly from current document values
  const documentLedger = [
    {
      filename: employee.resume,
      displayTitle: employee.resume ? employee.resume.split('-').slice(2).join('-') : "Not Uploaded",
      label: "Professional CV / Resume Document Asset",
      colorClass: "bg-rose-50 text-rose-600 border-rose-100"
    },
    {
      filename: employee.panCard,
      displayTitle: employee.panCard ? employee.panCard.split('-').slice(2).join('-') : "Not Uploaded",
      label: "PAN Card Compliance Identity File",
      colorClass: "bg-blue-50 text-blue-600 border-blue-100"
    },
    {
      filename: employee.aadhaarCard,
      displayTitle: employee.aadhaarCard ? employee.aadhaarCard.split('-').slice(2).join('-') : "Not Uploaded",
      label: "Identity Verification Registry Data (Aadhaar)",
      colorClass: "bg-emerald-50 text-emerald-600 border-emerald-100"
    }
  ];

  return (
    <div className="min-h-screen flex bg-white font-sans">
      <ToastContainer position="top-right" autoClose={4000} theme="light" />

      <div className="sticky top-0 h-screen z-20 flex-shrink-0 border-r border-gray-100">
        <EmployeeSidebar activeModule="profile" />
      </div>

      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Avatar Summary Display Node Card */}
            <div className="md:col-span-1 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col items-center text-center h-fit">
              <div className="relative group w-32 h-32 rounded-full bg-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-indigo-100 overflow-hidden mb-5 uppercase select-none">
                <span>{employee.name ? employee.name.charAt(0) : "?"}</span>
              </div>
              <h2 className="text-xl font-black text-gray-900 leading-tight">{employee.name}</h2>
              <p className="text-[10px] font-black text-indigo-600 mt-1.5 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-md mb-2 capitalize">{employee.role}</p>

              <div className="w-full border-t border-gray-100 my-4" />
              <div className="w-full text-left space-y-4">
                <div>
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Employee ID</span>
                  <span className="text-xs font-mono font-black text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 block w-fit">{employee.empId}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Joining Date</span>
                  <span className="text-xs font-bold text-gray-800">
                    {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Corporate Email</span>
                  <span className="text-xs font-bold text-gray-800 break-all">{employee.email}</span>
                </div>
              </div>
            </div>

            {/* Profile Content Inputs Workspace */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Profile Details</h3>
                  <button
                    onClick={isEditing ? handleCancelEdit : () => setIsEditing(true)}
                    className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all border ${isEditing ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'}`}
                  >
                    {isEditing ? "Cancel" : "Edit Profile"}
                  </button>
                </div>

                {!isEditing ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Current Role Designation', value: employee.role },
                        { label: 'Assigned Department', value: employee.department },
                        { label: 'Primary Contact Number', value: employee.phone ? `+91 ${employee.phone.slice(0, 5)} ${employee.phone.slice(5, 10)}` : "—" },
                        { label: 'Residential Address Location', value: employee.address || "—" },
                      ].map((item, idx) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</span>
                          <span className="text-sm font-black text-gray-900 capitalize">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Past Experience Summary Card */}
                    <div className="bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100">
                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Past Experience Summary</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="block text-[9px] text-indigo-400 font-black uppercase mb-0.5">Corporate Company</span>
                          <span className="font-bold text-gray-800">{employee.previousCompany || "—"}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-indigo-400 font-black uppercase mb-0.5">Role Designation</span>
                          <span className="font-bold text-gray-800">{employee.previousRole || "—"}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-indigo-400 font-black uppercase mb-0.5">Track Tenure</span>
                          <span className="font-bold text-gray-800">{employee.yearsOfExperience || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-5" autoComplete="off">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Role</label>
                        <input type="text" value={role} onChange={(e) => setRole(e.target.value)} disabled={isVerifyingPhone} className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-gray-800 disabled:opacity-60" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Department</label>
                        <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={isVerifyingPhone} className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-gray-800 disabled:opacity-60" />
                      </div>

                      {/* PHONE RE-VERIFICATION BLOCK NODE */}
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Phone</label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            maxLength={10}
                            placeholder="10-digit mobile number"
                            value={phone}
                            onChange={handlePhoneChange}
                            disabled={isVerifyingPhone}
                            className="w-full pl-4 pr-20 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-gray-800 disabled:opacity-60"
                          />
                          <div className="absolute right-3 flex items-center">
                            {isPhoneVerified ? (
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600" title="Verified">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                </svg>
                              </div>
                            ) : (
                              !isVerifyingPhone && phone.length === 10 && (
                                <button
                                  type="button"
                                  onClick={handleTriggerVerification}
                                  className="text-[9px] font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-md transition-all shadow-sm"
                                >
                                  Verify
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Address</label>
                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} disabled={isVerifyingPhone} className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-gray-800 disabled:opacity-60" />
                      </div>

                      {/* EXPERIENCE SPECIFICS */}
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Previous Company</label>
                        <input type="text" value={previousCompany} onChange={(e) => setPreviousCompany(e.target.value)} disabled={isVerifyingPhone} className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-gray-800 disabled:opacity-60" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Previous Role Designation</label>
                        <input type="text" value={previousRole} onChange={(e) => setPreviousRole(e.target.value)} disabled={isVerifyingPhone} className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-gray-800 disabled:opacity-60" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Years of Experience</label>
                        <input type="text" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} disabled={isVerifyingPhone} className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold text-gray-800 disabled:opacity-60" />
                      </div>
                    </div>

                    {/* Inline OTP Field Drawer */}
                    {isVerifyingPhone && (
                      <div className="mt-4 p-5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3 animate-fadeIn">
                        <div className="flex flex-col">
                          <label className="block text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">Enter 4-Digit Verification Code</label>
                          <div className="flex gap-3">
                            <input type="text" maxLength="4" placeholder="••••" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} className="w-32 px-4 py-3 text-center text-sm tracking-widest rounded-xl border border-amber-200 bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all font-mono font-black" />
                            <button type="button" onClick={handleVerifyOtp} className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-widest px-6 rounded-xl transition-all shadow-md">Verify Code</button>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!isPhoneVerified}
                      className={`w-full font-black text-[10px] uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg ${isPhoneVerified ? 'bg-gray-900 text-white hover:bg-black shadow-gray-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'}`}
                    >
                      Update Profile Info
                    </button>
                  </form>
                )}
              </div>

              {/* Secure Attached Documents Layout Block (Dynamic Preview Architecture) */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-5">Attached Documents Ledger</h3>
                <div className="space-y-3">
                  {documentLedger.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-4 max-w-[70%]">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-[10px] border shrink-0 ${doc.colorClass}`}>PDF</div>
                        <div className="truncate">
                          <span className="block text-sm font-bold text-gray-800 tracking-tight truncate" title={doc.displayTitle}>
                            {doc.displayTitle}
                          </span>
                          <span className="block text-[9px] font-black text-gray-400 uppercase">{doc.label}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!doc.filename}
                        onClick={() => handleViewDocument(doc.filename)}
                        className={`text-[10px] font-black border px-5 py-2.5 rounded-lg transition-all uppercase tracking-widest ${doc.filename ? 'bg-white text-gray-900 border-gray-200 hover:border-gray-900 cursor-pointer' : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'}`}
                      >
                        {doc.filename ? "View" : "Missing"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}