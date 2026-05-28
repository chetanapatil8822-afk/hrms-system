import { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar';
// ✅ IMPORT TOASTIFY HOOKS
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminCreateUser() {
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
    const [roles, setRoles] = useState(['employee', 'hr']);
    const [selectedRole, setSelectedRole] = useState('employee');
    const [newRoleTitle, setNewRoleTitle] = useState('');
    const [isCreatingCustomRole, setIsCreatingCustomRole] = useState(false);

    // Dynamic Department Management State Layers
    const [departments, setDepartments] = useState([
        'Engineering / Frontend Team',
        'Engineering / Backend Team',
        'Human Resources',
        'Design / UI-UX',
        'Quality Assurance'
    ]);
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [newDepartmentName, setNewDepartmentName] = useState('');
    const [isCreatingCustomDept, setIsCreatingCustomDept] = useState(false);

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

            // Fetch Roles
            try {
                const res = await fetch('/api/roles', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const combined = ['employee', 'hr', ...data.map(r => r.title || r)];
                    setRoles([...new Set(combined)]);
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

    // Removal Callbacks
    const handleDeleteDepartment = async (targetDept) => {
        if (!confirm(`Are you sure you want to remove "${targetDept}"?`)) return;
        try {
            const token = localStorage.getItem('authToken');
            await fetch('/api/departments', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: targetDept })
            });
            const updated = departments.filter(d => d !== targetDept);
            setDepartments(updated);
            if (selectedDepartment === targetDept) setSelectedDepartment(updated[0] || '');
            toast.info(`Department "${targetDept}" removed.`);
        } catch (err) { console.error(err); }
    };

    const handleDeleteRole = async (targetRole) => {
        if (targetRole === 'employee' || targetRole === 'hr') {
            toast.warning("Core system parameters cannot be deleted.");
            return;
        }
        if (!confirm(`Are you sure you want to remove the role "${targetRole}"?`)) return;
        try {
            const token = localStorage.getItem('authToken');
            await fetch('/api/roles', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: targetRole })
            });
            const updated = roles.filter(r => r !== targetRole);
            setRoles(updated);
            if (selectedRole === targetRole) setSelectedRole(updated[0] || 'employee');
            toast.info(`Role "${targetRole}" removed.`);
        } catch (err) { console.error(err); }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        let activeRoleStr = selectedRole;
        let activeDepartmentStr = selectedDepartment;
        const token = localStorage.getItem('authToken');

        if (isCreatingCustomRole) {
            if (!newRoleTitle.trim()) {
                toast.error('Please specify a valid custom role title.');
                setIsLoading(false);
                return;
            }
            activeRoleStr = newRoleTitle.trim().toLowerCase();
            try {
                await fetch('/api/roles', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: activeRoleStr })
                });
            } catch (err) { console.error(err); }
        }

        if (isCreatingCustomDept) {
            if (!newDepartmentName.trim()) {
                toast.error('Please specify a valid new department designation name.');
                setIsLoading(false);
                return;
            }
            activeDepartmentStr = newDepartmentName.trim();
            try {
                await fetch('/api/departments', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: activeDepartmentStr })
                });
            } catch (err) { console.error(err); }
        }

        // 🔄 MUTATION STRATEGY: Construct Multipart FormData rather than standard raw JSON objects
        const formData = new FormData();
        formData.append('name', name);
        formData.append('gender', gender);
        formData.append('age', Number(age));
        formData.append('email', email);
        formData.append('password', password);
        formData.append('role', activeRoleStr);
        formData.append('department', activeDepartmentStr);
        formData.append('phone', phone);
        formData.append('address', address);
        formData.append('previousCompany', previousCompany || 'None');
        formData.append('previousRole', previousRole || 'None');
        formData.append('yearsOfExperience', yearsOfExperience || '0 Years');
        formData.append('assignedLeader', selectedLeader || '');

        // Append explicit documents safely if pinned by field change actions
        if (resumeFile) formData.append('resume', resumeFile);
        if (panFile) formData.append('panCard', panFile);
        if (aadhaarFile) formData.append('aadhaarCard', aadhaarFile);

        try {
            const res = await fetch('/api/employees/create-employee', {
                method: 'POST',
                // ⚠️ CRITICAL: Remove 'Content-Type' header when passing FormData; the browser sets it automatically with the boundary token!
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
            setName(''); setAge(''); setEmail(''); setPassword(''); setPhone(''); setAddress(''); setPreviousCompany(''); setPreviousRole(''); setYearsOfExperience(''); setNewRoleTitle(''); setNewDepartmentName(''); setSelectedLeader('');
            setIsCreatingCustomRole(false); setIsCreatingCustomDept(false);

            // Reset files input elements context 
            setResumeFile(null); setPanFile(null); setAadhaarFile(null);
            document.querySelectorAll('input[type="file"]').forEach(input => input.value = '');

            if (isCreatingCustomDept && !departments.includes(activeDepartmentStr)) {
                setDepartments(prev => [...prev, activeDepartmentStr]);
                setSelectedDepartment(activeDepartmentStr);
            }
            if (isCreatingCustomRole && !roles.includes(activeRoleStr)) {
                setRoles(prev => [...prev, activeRoleStr]);
                setSelectedRole(activeRoleStr);
            }

            const updatedLeadersRes = await fetch('/api/employees/team-leaders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (updatedLeadersRes.ok) {
                const updatedLeadersData = await updatedLeadersRes.json();
                setTeamLeaders(updatedLeadersData);
            }

        } catch (err) {
            toast.error(`⚠️ ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-sans">
            <ToastContainer />
            <AdminSidebar activeModule="onboard" />

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
                                    <div className="flex justify-between items-center">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">System Access Role</label>
                                        <button type="button" onClick={() => setIsCreatingCustomRole(!isCreatingCustomRole)} className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                                            {isCreatingCustomRole ? "View Options" : "+ Add New Role"}
                                        </button>
                                    </div>

                                    {isCreatingCustomRole ? (
                                        <input type="text" required value={newRoleTitle} onChange={(e) => setNewRoleTitle(e.target.value)} placeholder="e.g. Team Lead" className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                    ) : (
                                        <div className="flex gap-2">
                                            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700 capitalize">
                                                {roles.map((r, i) => <option key={i} value={r}>{r}</option>)}
                                            </select>
                                            {selectedRole !== 'employee' && selectedRole !== 'hr' && (
                                                <button type="button" onClick={() => handleDeleteRole(selectedRole)} className="px-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 font-bold hover:bg-rose-100 transition-all" title="Remove Role">✕</button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="sm:col-span-2 bg-gray-50/30 border border-gray-100 rounded-2xl p-4">
                                    <div className="flex justify-between items-baseline mb-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Assign Reporting Team Leader</label>
                                        <span className="text-[9px] text-gray-400 lowercase font-medium italic">optional (defaults to null / unassigned)</span>
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
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Yash" required autoComplete="new-user-name" className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Age</label>
                                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="21" required autoComplete="off" className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
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
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yash.dev@company.com" required autoComplete="new-user-email" className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Secure Account Password</label>
                                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="new-password" className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                </div>

                                <div className="sm:col-span-2 bg-gray-50/50 border border-gray-100 rounded-2xl p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {isCreatingCustomDept ? "Deploy Brand New Department" : "Assigned Department Wing"}
                                        </label>
                                        <button type="button" onClick={() => setIsCreatingCustomDept(!isCreatingCustomDept)} className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                                            {isCreatingCustomDept ? "Choose Existing" : "+ Add New Department"}
                                        </button>
                                    </div>

                                    {isCreatingCustomDept ? (
                                        <input type="text" required value={newDepartmentName} onChange={(e) => setNewDepartmentName(e.target.value)} placeholder="e.g. Cyber Security Unit" autoComplete="off" className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                    ) : (
                                        <div className="flex gap-2">
                                            <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700">
                                                {departments.map((dept, idx) => <option key={idx} value={dept}>{dept}</option>)}
                                            </select>
                                            {departments.length > 0 && (
                                                <button type="button" onClick={() => handleDeleteDepartment(selectedDepartment)} className="px-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 font-bold hover:bg-rose-100 transition-all" title="Remove Department">✕</button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Active Mobile Number</label>
                                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 019-2834" autoComplete="tel" className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Residential Address Location</label>
                                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Tech Avenue, Silicon Valley, CA" autoComplete="street-address" className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                </div>
                            </div>
                        </div>

                        {/* Group 4: Background Info */}
                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-4">4. Professional Industry Background</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Previous Corporate Employer</label>
                                    <input type="text" value={previousCompany} onChange={(e) => setPreviousCompany(e.target.value)} placeholder="e.g. PixelCraft Studios" autoComplete="off" className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Previous Corporate Role</label>
                                    <input type="text" value={previousRole} onChange={(e) => setPreviousRole(e.target.value)} placeholder="e.g. UI Developer" autoComplete="off" className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cumulative Track Duration</label>
                                    <input type="text" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} placeholder="e.g. 2.5 Years" autoComplete="off" className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
                                </div>
                            </div>
                        </div>

                        {/* ➕ Group 5: Document Upload Vault Layout */}
                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-4">5. Employee Verification Documents (PDF Only)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                {/* Resume Picker */}
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

                                {/* PAN Card Picker */}
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

                                {/* Aadhaar Card Picker */}
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