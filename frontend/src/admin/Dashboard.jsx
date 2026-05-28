import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminDashboard() {
    const navigate = useNavigate();

    // Core Metrics State
    const [metrics, setMetrics] = useState({
        totalStaff: 0,
        hrCount: 0,
        developerCount: 0,
        designCount: 0,
        otherCount: 0,
        activeShifts: 0
    });

    // Hiring Target State
    const [vacancies, setVacancies] = useState([
        { department: "Engineering / Dev", filled: 0, target: 15, color: "bg-indigo-600" },
        { department: "Human Resources", filled: 0, target: 4, color: "bg-purple-600" },
        { department: "UI/UX Design", filled: 0, target: 5, color: "bg-pink-600" }
    ]);

    const [systemLogs, setSystemLogs] = useState([]);
    const [isHrPowerOn, setIsHrPowerOn] = useState(true);
    const [pendingNotifications, setPendingNotifications] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // 📋 GET: FETCH METRICS, CONFIGS, AND LEAVE NOTIFICATIONS ON MOUNT
    const fetchAdminDashboardMetrics = async () => {
        const token = localStorage.getItem('authToken');
        try {
            const employeesRes = await fetch('/api/employees', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const employeesData = await employeesRes.json();

            const configRes = await fetch('/api/employees/profile', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const configData = await configRes.json();

            const leavesRes = await fetch('/api/leaves/pending-reviews', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const leavesData = await leavesRes.json();

            if (employeesRes.ok && configRes.ok) {
                const total = employeesData.length;

                const hrs = employeesData.filter(emp => emp.role === 'hr' || emp.department?.toLowerCase().includes('hr') || emp.department?.toLowerCase().includes('resource')).length;
                const devs = employeesData.filter(emp => emp.department?.toLowerCase().includes('engineer') || emp.department?.toLowerCase().includes('dev')).length;
                const designers = employeesData.filter(emp => emp.department?.toLowerCase().includes('design') || emp.department?.toLowerCase().includes('ux') || emp.department?.toLowerCase().includes('ui')).length;
                const others = total - (hrs + devs + designers);

                setMetrics({
                    totalStaff: total,
                    hrCount: hrs,
                    developerCount: devs,
                    designCount: designers,
                    otherCount: others > 0 ? others : 0,
                    activeShifts: Math.ceil(total * 0.85)
                });

                setVacancies([
                    { department: "Engineering / Dev", filled: devs, target: 15, color: "bg-indigo-600" },
                    { department: "Human Resources", filled: hrs, target: 4, color: "bg-purple-600" },
                    { department: "UI/UX Design", filled: designers, target: 5, color: "bg-pink-600" }
                ]);

                const logs = employeesData.slice(-3).reverse().map((emp, idx) => ({
                    id: idx,
                    text: `Account baseline generated successfully for ${emp.name} (${emp.role.toUpperCase()})`,
                    time: emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : 'Live Sync'
                }));
                setSystemLogs(logs);

                if (configData.isHrLeavePowerEnabled !== undefined) {
                    setIsHrPowerOn(configData.isHrLeavePowerEnabled);
                }

                if (leavesRes.ok && leavesData && leavesData.length > 0) {
                    setPendingNotifications(leavesData.length);
                }
            }
        } catch (err) {
            console.error("Dashboard synchronization error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminDashboardMetrics();
    }, []);

    const handleToggleHrLeavePower = async (checkedState) => {
        const token = localStorage.getItem('authToken');
        try {
            const res = await fetch('/api/leaves/toggle-hr-power', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ enablePower: checkedState })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to alter toggle switch context parameter.");

            setIsHrPowerOn(checkedState);
            toast.success(`🎉 ${data.message}`);
        } catch (err) {
            toast.error(`❌ Authorization Mutation Error: ${err.message}`);
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-sans">
            <ToastContainer position="top-right" autoClose={4000} theme="light" />

            {/* Custom vibration animation frames */}
            <style>{`
                @keyframes vibrate {
                    0% { transform: rotate(0deg); }
                    10% { transform: rotate(15deg); }
                    20% { transform: rotate(-15deg); }
                    30% { transform: rotate(10deg); }
                    40% { transform: rotate(-10deg); }
                    50% { transform: rotate(5deg); }
                    60% { transform: rotate(-5deg); }
                    70% { transform: rotate(0deg); }
                    100% { transform: rotate(0deg); }
                }
                .animate-vibrate {
                    animation: vibrate 0.6s cubic-bezier(.36,.07,.19,.97) infinite;
                }
            `}</style>

            <AdminSidebar activeModule="dashboard" />

            <main className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Branch Analytics</h1>
                        <p className="text-sm text-gray-500 mt-1">Audit active data collections, staff distributions, and system runtime history</p>
                    </div>

                    <div className="flex items-center gap-5">
                        {/* Global Switch Controller Element */}
                        <div className="flex items-center bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl shadow-sm select-none">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isHrPowerOn}
                                    onChange={(e) => handleToggleHrLeavePower(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                <span className="ml-2.5 text-[9px] font-black uppercase tracking-widest text-gray-700">
                                    {isHrPowerOn ? "HR Leave Power: ON" : "HR Leave Power: OFF"}
                                </span>
                            </label>
                        </div>

                        {/* 🔄 CHANGED: Pure raw interactive icon structure instead of a grey input button layout */}
                        <div
                            onClick={() => navigate('/admin/leaves')}
                            className="relative cursor-pointer p-1 rounded-lg transition-transform active:scale-95 select-none focus:outline-none"
                            title={`${pendingNotifications} Pending Leave Requests Review Required`}
                        >
                            {/* Modern Vector SVG Bell Layout */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className={`w-7 h-7 transition-colors duration-300 ${pendingNotifications > 0 ? 'animate-vibrate text-amber-500' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                            </svg>

                            {/* Floating Counter Badge */}
                            {pendingNotifications > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white tracking-tighter shadow-sm animate-bounce">
                                    {pendingNotifications}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">
                        Compiling organizational system matrix...
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Top Scorecards Row */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Total Base Hires', value: metrics.totalStaff, context: 'Active Database Entries' },
                                { label: 'HR Allocations', value: metrics.hrCount, context: 'Management Administrators' },
                                { label: 'Engineering Tier', value: metrics.developerCount, context: 'Dev / Tech Personnel' },
                                { label: 'Expected On Duty', value: metrics.activeShifts, context: 'Standard Active Ratio' }
                            ].map((card, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{card.label}</span>
                                    <span className="text-3xl font-black text-gray-900 block">{card.value}</span>
                                    <span className="block text-[10px] text-gray-400 font-bold mt-1 uppercase">{card.context}</span>
                                </div>
                            ))}
                        </div>

                        {/* Chart Breakdowns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
                                <div>
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Department Distribution Chart</h3>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase mt-0.5">Real-time counts parsed from personnel records</p>
                                </div>

                                <div className="space-y-4 pt-2">
                                    {[
                                        { name: 'Engineering / Tech', count: metrics.developerCount, color: 'bg-indigo-800' },
                                        { name: 'Human Resources', count: metrics.hrCount, color: 'bg-purple-600' },
                                        { name: 'UI/UX & Design', count: metrics.designCount, color: 'bg-pink-600' },
                                        { name: 'General Support / Others', count: metrics.otherCount, color: 'bg-gray-400' }
                                    ].map((dept, idx) => {
                                        const percentage = metrics.totalStaff > 0 ? (dept.count / metrics.totalStaff) * 100 : 0;
                                        return (
                                            <div key={idx} className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold text-gray-700 uppercase tracking-tight">
                                                    <span>{dept.name}</span>
                                                    <span className="font-mono text-gray-900 font-black">{dept.count} Staff ({Math.round(percentage)}%)</span>
                                                </div>
                                                <div className="w-full h-3 bg-gray-50 border border-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${dept.color} transition-all duration-500 rounded-full`}
                                                        style={{ width: `${percentage || 2}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
                                <div>
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Hiring Quotas & Vacancies</h3>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase mt-0.5">Track remaining headcounts against corporate metrics</p>
                                </div>

                                <div className="space-y-4 pt-2">
                                    {vacancies.map((v, idx) => {
                                        const openPositions = v.target - v.filled;
                                        const vacancyRemaining = openPositions > 0 ? openPositions : 0;
                                        const progressPercentage = (v.filled / v.target) * 100;

                                        return (
                                            <div key={idx} className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold text-gray-700 uppercase tracking-tight">
                                                    <span>{v.department}</span>
                                                    <span className="font-mono font-black text-indigo-800">
                                                        {vacancyRemaining === 0 ? "✨ CAP FILLED" : `${vacancyRemaining} Vacant Slots Open`}
                                                    </span>
                                                </div>
                                                <div className="w-full h-3 bg-gray-50 border border-gray-100 rounded-full overflow-hidden flex">
                                                    <div
                                                        className={`h-full ${v.color} transition-all duration-500`}
                                                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-[9px] font-mono font-black text-gray-400 uppercase">
                                                    <span>Current: {v.filled} Active</span>
                                                    <span>Target Cap: {v.target} Seats</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Recent Onboarding Operations Logs */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Recent Onboarding Operations</h3>
                                {systemLogs.length === 0 ? (
                                    <p className="text-xs text-gray-400 py-4 font-bold uppercase">No deployment entries found inside database records.</p>
                                ) : (
                                    <div className="divide-y divide-gray-100 text-xs font-bold text-gray-600">
                                        {systemLogs.map((log) => (
                                            <div key={log.id} className="py-3.5 flex justify-between items-center gap-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[9px] font-black uppercase">SYSTEM_OK</span>
                                                    <span className="text-gray-700 normal-case">{log.text}</span>
                                                </div>
                                                <span className="font-mono text-gray-400 text-[10px] flex-shrink-0">{log.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </main>
        </div>
    );
}