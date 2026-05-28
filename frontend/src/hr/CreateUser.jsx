import { useState, useEffect } from 'react';
// ✅ FIXED CASE SENSITIVITY: Matched layout registry mapping perfectly
import HRSidebar from '../components/HRSidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function HrCreateUser() {
    // Core Form Fields State
    const [name, setName] = useState('');
    const [gender, setGender] = useState('Male');
    const [age, setAge] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [previousCompany, setPreviousCompany] = useState('');
    const [previousRole, setPreviousRole] = useState('');
    const [yearsOfExperience, setYearsOfExperience] = useState('');

    // 📂 Document Upload State Layers
    const [resumeFile, setResumeFile] = useState(null);
    const [panFile, setPanFile] = useState(null);
    const [aadhaarFile, setAadhaarFile] = useState(null);

    // Dynamic Role Management State Layers
    // 🔒 RESTRICTED: HR can only choose 'employee' or 'hr' options
    const [roles, setRoles] = useState(['employee', 'hr']);
    const [selectedRole, setSelectedRole] = useState('employee');

    // Dynamic Department Management State Layers
    const [departments, setDepartments] = useState([
        'Engineering / Frontend Team',
        'Engineering / Backend Team',
        'Human Resources',
        'Design / UI-UX',
        'Quality Assurance'
    ]);
    const [selectedDepartment, setSelectedDepartment] = useState('');

    // Dynamic Leader Assignment Handling State Layers
    const [teamLeaders, setTeamLeaders] = useState([]);
    const [selectedLeader, setSelectedLeader] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    // Initial Synchronization Pipeline Hooks
    useEffect(() => {
        const fetchSystemConfigPools = async () => {
            const token = localStorage.getItem('authToken');

            // Fetch Departments
            try {
                const res = await fetch('/api/departments', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) setDepartments(data.map(d => d.name || d));
                }
            } catch (err) { console.error(err); }

            // Fetch Team Leaders
            try {
                const res = await fetch('/api/employees/team-leaders', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setTeamLeaders(data);
                }
            } catch (err) { console.error(err); }
        };
        fetchSystemConfigPools();
    }, []);

    // Selection Matrix Defaults
    useEffect(() => {
        if (departments.length > 0 && !selectedDepartment) setSelectedDepartment(departments[0]);
        if (roles.length > 0 && !selectedRole) setSelectedRole(roles[0]);
    }, [departments, roles]);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const token = localStorage.getItem('authToken');

        // 🔄 MUTATION STRATEGY: Construct Multipart FormData payload for binary transmissions
        const formData = new FormData();
        formData.append('name', name);
        formData.append('gender', gender);
        formData.append('age', Number(age) || 0);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('role', selectedRole);
        formData.append('department', selectedDepartment);
        formData.append('phone', phone);
        formData.append('address', address);
        formData.append('previousCompany', previousCompany || 'None');
        formData.append('previousRole', previousRole || 'None');
        formData.append('yearsOfExperience', yearsOfExperience || '0 Years');
        formData.append('assignedLeader', selectedLeader || '');

        // Safely append custom validation files if allocated
        if (resumeFile) formData.append('resume', resumeFile);
        if (panFile) formData.append('panCard', panFile);
        if (aadhaarFile) formData.append('aadhaarCard', aadhaarFile);

        try {
            const res = await fetch('/api/employees/create-employee', {
                method: 'POST',
                // ⚠️ CRITICAL: Leave out 'Content-Type' so the boundary values are mapped natively
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Failed to onboard account');

            toast.success(`🎉 Profile created successfully! Assigned ID: ${data.empId}`, {
                position: "top-right",
                autoClose: 4000,
                theme: "light",
            });

            // Reset text states
            setName(''); setAge(''); setEmail(''); setPassword(''); setPhone(''); setAddress(''); setPreviousCompany(''); setPreviousRole(''); setYearsOfExperience(''); setSelectedLeader('');

            // Clear binary upload states safely
            setResumeFile(null); setPanFile(null); setAadhaarFile(null);
            document.querySelectorAll('input[type="file"]').forEach(input => input.value = '');

        } catch (err) {
            toast.error(`⚠️ ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-sans">
            <ToastContainer />
            <HRSidebar activeModule="onboard" />

            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-3xl mx-auto space-y-8">

                    <div className="border-b border-gray-100 pb-6">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Onboard New Personnel</h1>
                        <p className="text-sm text-gray-500 mt-1">Register user system accounts into the runtime index</p>
                    </div>

                    <form onSubmit={handleCreateUser} autoComplete="none" className="bg-white rounded-3xl border border-gray-200 p-6 space-y-8 shadow-sm">

                        {/* Group 1: Core Identity Parameters */}
                        <div>
                            <h3 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-4">1. System Identity Info</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Generated Employee ID</label>
                                    <input
                                        type="text"
                                        placeholder="— Auto-Generated on Commit —"
                                        disabled
                                        className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-100 font-mono text-gray-400 italic cursor-not-allowed select-none font-bold"
                                    />
                                </div>

                                <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 space-y-3">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">System Access Role</label>
                                    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700 capitalize">
                                        {roles.map((r, i) => <option key={i} value={r}>{r}</option>)}
                                    </select>
                                </div>

                                <div className="sm:col-span-2 bg-gray-50/30 border border-gray-100 rounded-2xl p-4">
                                    <div className="flex justify-between items-baseline mb-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Assign Reporting Team Leader</label>
                                        <span className="text-[9px] text-gray-400 lowercase font-medium italic">optional</span>
                                    </div>
                                    <select
                                        value={selectedLeader}
                                        onChange={(e) => setSelectedLeader(e.target.value)}
                                        className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-gray-700"
                                    >
                                        <option value="">— Unassigned (None) —</option>
                                        {teamLeaders.map((leader) => (
                                            <option key={leader._id} value={leader._id}>
                                                {leader.name} ({leader.empId}) — {leader.role.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Group 2: Personal Profile Variables */}
                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-4">2. Profile Personal Specifics</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Legal Name</label>
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Age</label>
                                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" required className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Gender Option</label>
                                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700">
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Group 3: Contact Details */}
                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-4">3. Contact & Department Info</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Corporate Email</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@company.com" required className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Secure Account Password</label>
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                </div>

                                <div className="sm:col-span-2 bg-gray-50/50 border border-gray-100 rounded-2xl p-4 space-y-3">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned Department Wing</label>
                                    <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700">
                                        {departments.map((dept, idx) => <option key={idx} value={dept}>{dept}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Active Mobile Number</label>
                                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone Number" className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Residential Address Location</label>
                                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                </div>
                            </div>
                        </div>

                        {/* Group 4: Background Info */}
                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-4">4. Professional Industry Background</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Previous Corporate Employer</label>
                                    <input type="text" value={previousCompany} onChange={(e) => setPreviousCompany(e.target.value)} placeholder="Previous Company" className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Previous Corporate Role</label>
                                    <input type="text" value={previousRole} onChange={(e) => setPreviousRole(e.target.value)} placeholder="Previous Role" className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cumulative Track Duration</label>
                                    <input type="text" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} placeholder="Years of Experience" className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                </div>
                            </div>
                        </div>

                        {/* ➕ Group 5: Document Upload Vault Layout */}
                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-4">5. Employee Verification Documents (PDF Only)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* Resume Selection Box */}
                                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-white transition-all group">
                                    <label className="cursor-pointer text-center w-full">
                                        <span className="block text-xl mb-1">📄</span>
                                        <span className="block text-[10px] font-black text-gray-500 uppercase tracking-wide group-hover:text-indigo-600">Upload Resume</span>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => setResumeFile(e.target.files[0])}
                                            className="hidden"
                                        />
                                    </label>
                                    {resumeFile && (
                                        <p className="mt-2 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-mono truncate max-w-full font-bold">
                                            ✓ {resumeFile.name}
                                        </p>
                                    )}
                                </div>

                                {/* PAN Card Selection Box */}
                                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-white transition-all group">
                                    <label className="cursor-pointer text-center w-full">
                                        <span className="block text-xl mb-1">💳</span>
                                        <span className="block text-[10px] font-black text-gray-500 uppercase tracking-wide group-hover:text-indigo-600">Upload PAN Card</span>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => setPanFile(e.target.files[0])}
                                            className="hidden"
                                        />
                                    </label>
                                    {panFile && (
                                        <p className="mt-2 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-mono truncate max-w-full font-bold">
                                            ✓ {panFile.name}
                                        </p>
                                    )}
                                </div>

                                {/* Aadhaar Card Selection Box */}
                                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-white transition-all group">
                                    <label className="cursor-pointer text-center w-full">
                                        <span className="block text-xl mb-1">🆔</span>
                                        <span className="block text-[10px] font-black text-gray-500 uppercase tracking-wide group-hover:text-indigo-600">Upload Aadhaar Card</span>
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => setAadhaarFile(e.target.files[0])}
                                            className="hidden"
                                        />
                                    </label>
                                    {aadhaarFile && (
                                        <p className="mt-2 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-mono truncate max-w-full font-bold">
                                            ✓ {aadhaarFile.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-xl hover:bg-black transition-all shadow-md shadow-gray-200 disabled:opacity-50">
                            {isLoading ? "Writing Profile Ledger..." : "Commit Profile to Database"}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}