import { useState, useEffect, useCallback } from 'react';
import HRSidebar from '../components/HRSidebar';

export default function HRDashboard() {
    const [employees, setEmployees] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [vacancies, setVacancies] = useState([]);
    const [hrAttendance, setHrAttendance] = useState(null);
    const [isHrPowerEnabled, setIsHrPowerEnabled] = useState(true);

    const [viewTab, setViewTab] = useState('overview'); // 'overview', 'employees', 'leaves', 'attendance'
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('authToken');
    const API_BASE_URL = '/api';

    // Fallback Mock Datasets to ensure zero UI disruption during backend 404s
    const fallbackAttendance = {
        baseSalary: 5450,
        totalShiftDays: 22,
        daysPresent: 20,
        unapprovedAbsences: 2,
        performanceStars: 4.8,
        accruedIncentives: 350,
        shiftLogsMatrix: [
            { day: 1, status: 'present' }, { day: 2, status: 'present' }, { day: 3, status: 'present' }, { day: 4, status: 'late' }, { day: 5, status: 'present' },
            { day: 6, status: 'absent' }, { day: 7, status: 'present' }, { day: 8, status: 'present' }, { day: 9, status: 'present' }, { day: 10, status: 'present' },
            { day: 11, status: 'present' }, { day: 12, status: 'present' }, { day: 13, status: 'late' }, { day: 14, status: 'present' }, { day: 15, status: 'present' },
            { day: 16, status: 'absent' }, { day: 17, status: 'present' }, { day: 18, status: 'present' }, { day: 19, status: 'present' }, { day: 20, status: 'present' },
            { day: 21, status: 'present' }, { day: 22, status: 'present' }
        ]
    };

    // 1. ASYNCHRONOUS DATA FETCH CHANNELS
    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        setError('');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        try {
            if (viewTab === 'overview' || viewTab === 'attendance' || viewTab === 'leaves') {
                const [empRes, vacanciesRes, attRes, leaveRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/employees`, { method: 'GET', headers }),
                    fetch(`${API_BASE_URL}/vacancies`, { method: 'GET', headers }),
                    fetch(`${API_BASE_URL}/attendance/hr-profile`, { method: 'GET', headers }),
                    fetch(`${API_BASE_URL}/leaves/pending`, { method: 'GET', headers })
                ]);

                if (!empRes.ok || !vacanciesRes.ok || !attRes.ok || !leaveRes.ok) {
                    throw new Error('Database server sync failure: One or more data tables are unresponsive.');
                }

                const [empData, vacData, attData, leaveData] = await Promise.all([
                    empRes.json(), vacanciesRes.json(), attRes.json(), leaveRes.json()
                ]);

                setEmployees(empData || []);
                setVacancies(vacData || []);
                setHrAttendance(attData || fallbackAttendance);
                setLeaveRequests(leaveData.leaves || []);
                setIsHrPowerEnabled(leaveData.isHrLeavePowerEnabled !== false);
            }

            else if (viewTab === 'employees') {
                const res = await fetch(`${API_BASE_URL}/employees`, { method: 'GET', headers });
                if (!res.ok) throw new Error('Could not synchronize database employee records ledger.');
                const data = await res.json();
                setEmployees(data || []);
            }
        } catch (err) {
            console.error("Database Core Connectivity Fault Exception:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [viewTab, token]);

    useEffect(() => {
        if (token) {
            fetchDashboardData();
        } else {
            setError('Authentication secure session token missing.');
        }
    }, [fetchDashboardData, token]);

    // MATRIX AGGREGATIONS
    const hrsCount = employees.filter(emp => emp.role === 'hr' || emp.department?.toLowerCase().includes('hr') || emp.department?.toLowerCase().includes('resource')).length;
    const devsCount = employees.filter(emp => emp.department?.toLowerCase().includes('engineer') || emp.department?.toLowerCase().includes('dev')).length;
    const designCount = employees.filter(emp => emp.department?.toLowerCase().includes('design') || emp.department?.toLowerCase().includes('ux') || emp.department?.toLowerCase().includes('ui')).length;
    const otherCount = Math.max(0, employees.length - (hrsCount + devsCount + designCount));

    const totalOpenVacancies = vacancies.reduce((acc, v) => acc + (v.target - v.filled > 0 ? v.target - v.filled : 0), 0);

    const calculateDynamicSalary = () => {
        const activeAtt = hrAttendance || fallbackAttendance;
        const { baseSalary, totalShiftDays, daysPresent, accruedIncentives } = activeAtt;
        if (!totalShiftDays || totalShiftDays === 0) return { netSalary: 0, lopDeduction: 0, finalPayout: 0 };

        const perDayRate = baseSalary / totalShiftDays;
        const netSalary = Math.round(daysPresent * perDayRate);
        const lopDeduction = Math.round((totalShiftDays - daysPresent) * perDayRate);
        const finalPayout = netSalary + (accruedIncentives || 0);

        return { netSalary, lopDeduction, finalPayout };
    };

    const { netSalary, lopDeduction, finalPayout } = calculateDynamicSalary();

    const handleLeaveAction = async (id, action) => {
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/leaves/${id}/action`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            if (!res.ok) throw new Error(`Failed to modify leave state workflow.`);
            alert(`Leave tracking block modified successfully.`);
            fetchDashboardData();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#f8fafc] font-sans">
            <HRSidebar activeModule={viewTab === 'employees' ? 'ledger' : 'dashboard'} />

            {/* Injects the vibration keyframe rules safely for the alert icon wrapper */}
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

            <main className="flex-1 p-6 md:p-10 overflow-y-auto space-y-8">

                {/* HEADER CONTROL LAYER */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">HR Management Deck</h1>
                        <p className="text-sm text-gray-500 mt-1">Audit organizational headcounts, vacancy limits, and track verified personal payout metrics</p>
                    </div>

                    <div className="flex items-center space-x-6 self-end sm:self-auto">
                        {/* Tab Switcher Elements */}
                        <div className="flex bg-white p-1 rounded-xl border border-[#e2e8f0] shadow-sm text-xs font-semibold">
                            <button onClick={() => setViewTab('overview')} className={`px-4 py-2 rounded-lg transition-all ${viewTab === 'overview' ? 'bg-[#161e2e] text-white shadow-sm' : 'text-[#64748b] hover:text-[#1e293b]'}`}>Overview</button>
                            <button onClick={() => setViewTab('employees')} className={`px-4 py-2 rounded-lg transition-all ${viewTab === 'employees' ? 'bg-[#161e2e] text-white shadow-sm' : 'text-[#64748b] hover:text-[#1e293b]'}`}>Employees</button>
                            <button onClick={() => setViewTab('attendance')} className={`px-4 py-2 rounded-lg transition-all ${viewTab === 'attendance' ? 'bg-[#161e2e] text-white shadow-sm' : 'text-[#64748b] hover:text-[#1e293b]'}`}>My Attendance & Salary</button>
                            <button onClick={() => setViewTab('leaves')} className={`px-4 py-2 rounded-lg transition-all ${viewTab === 'leaves' ? 'bg-[#161e2e] text-white shadow-sm' : 'text-[#64748b] hover:text-[#1e293b]'}`}>Leaves ({leaveRequests.length})</button>
                        </div>

                        {/* 🔔 ADDED: MASTER VECTOR BELL LAYOUT CONTROL */}
                        <div
                            onClick={() => setViewTab('leaves')}
                            className="relative cursor-pointer p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 shadow-sm transition-transform active:scale-95 select-none focus:outline-none"
                            title={`${leaveRequests.length} Pending Employee Leaves Require Attention`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className={`w-6 h-6 transition-colors duration-300 ${leaveRequests.length > 0 ? 'animate-vibrate text-amber-500' : 'text-gray-400'}`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                            </svg>

                            {leaveRequests.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white tracking-tighter shadow-sm animate-bounce">
                                    {leaveRequests.length}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 text-xs font-bold bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl uppercase tracking-wider">
                        ⚠️ Data Matrix Alert: {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="p-12 text-center text-xs font-semibold text-[#94a3b8] uppercase tracking-widest animate-pulse">
                        Synchronizing dynamic cloud connection grids...
                    </div>
                ) : (
                    <>
                        {/* VIEW A: OVERVIEW CORE METRICS SUMMARY */}
                        {viewTab === 'overview' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Roster Staff Size', value: employees.length, context: 'Active System Nodes' },
                                        { label: 'Global Vacancies', value: totalOpenVacancies, context: 'Open Hiring Slots' },
                                        { label: 'Prorated Net Salary', value: `$${finalPayout.toLocaleString()}`, context: 'Calculated Payout' },
                                        { label: 'Leaves Pending Approval', value: leaveRequests.length, context: 'Action Queue Length' }
                                    ].map((card, idx) => (
                                        <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                                            <div>
                                                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{card.label}</span>
                                                <span className="text-2xl font-black text-gray-900 block tracking-tight">{card.value}</span>
                                            </div>
                                            <span className="block text-[9px] text-gray-400 font-bold mt-2 uppercase">{card.context}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Department Demographics Chart */}
                                    <div className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm space-y-6">
                                        <div>
                                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Department Distribution</h3>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase mt-0.5">Real-time counts parsed from personnel records</p>
                                        </div>
                                        <div className="space-y-4">
                                            {[
                                                { name: 'Engineering & Technology', count: devsCount, color: 'bg-indigo-600' },
                                                { name: 'Human Resource Management', count: hrsCount, color: 'bg-purple-600' },
                                                { name: 'Creative Design & UI/UX', count: designCount, color: 'bg-pink-600' },
                                                { name: 'General Operations / Others', count: otherCount, color: 'bg-gray-400' }
                                            ].map((dept, idx) => {
                                                const pct = employees.length > 0 ? (dept.count / employees.length) * 100 : 0;
                                                return (
                                                    <div key={idx} className="space-y-1.5">
                                                        <div className="flex justify-between text-xs font-bold text-gray-700 uppercase tracking-tight">
                                                            <span>{dept.name}</span>
                                                            <span className="font-mono text-gray-900 font-black">{dept.count} Staff ({Math.round(pct)}%)</span>
                                                        </div>
                                                        <div className="w-full h-3 bg-gray-50 border border-gray-100 rounded-full overflow-hidden">
                                                            <div className={`h-full ${dept.color} transition-all duration-500 rounded-full`} style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Hiring Metrics */}
                                    <div className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm space-y-6">
                                        <div>
                                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Hiring Quotas & Vacancies</h3>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase mt-0.5">Track remaining headcounts against corporate metrics</p>
                                        </div>
                                        <div className="space-y-4">
                                            {vacancies.length === 0 ? (
                                                <p className="text-xs text-gray-400 py-4 font-bold uppercase">No active pipeline configurations tracking.</p>
                                            ) : (
                                                vacancies.map((v, idx) => {
                                                    const rem = v.target - v.filled > 0 ? v.target - v.filled : 0;
                                                    const pct = v.target > 0 ? (v.filled / v.target) * 100 : 0;
                                                    return (
                                                        <div key={idx} className="space-y-1.5">
                                                            <div className="flex justify-between text-xs font-bold text-gray-700 uppercase tracking-tight">
                                                                <span>{v.department}</span>
                                                                <span className="font-mono font-black text-indigo-600">{rem === 0 ? "✨ CAP FILLED" : `${rem} Open Slots`}</span>
                                                            </div>
                                                            <div className="w-full h-3 bg-gray-50 border border-gray-100 rounded-full overflow-hidden flex">
                                                                <div className={`h-full ${v.color || 'bg-indigo-600'} transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                                            </div>
                                                            <div className="flex justify-between text-[9px] font-mono font-black text-gray-400 uppercase">
                                                                <span>Current: {v.filled} Active</span>
                                                                <span>Target Cap: {v.target} Seats</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* VIEW B: COMPLIANCE ROSTER LEDGER */}
                        {viewTab === 'employees' && (
                            <div className="bg-white rounded-[24px] border border-[#e2e8f0] shadow-sm overflow-hidden">
                                <table className="w-full text-left text-xs tracking-tight">
                                    <thead>
                                        <tr className="border-b border-[#e2e8f0] text-[#64748b] font-semibold bg-slate-50"><th className="p-4">Staff ID</th><th className="p-4">Name</th><th className="p-4">System Role</th><th className="p-4">Department Division</th><th className="p-4">Email Contact</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f1f5f9] font-medium text-[#1e293b]">
                                        {employees.map(emp => (
                                            <tr key={emp.empId || emp._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 font-mono">{emp.empId}</td>
                                                <td className="p-4 font-bold text-gray-900">{emp.name}</td>
                                                <td className="p-4"><span className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">{emp.role}</span></td>
                                                <td className="p-4 text-[#64748b]">{emp.department}</td>
                                                <td className="p-4 text-[#94a3b8] lowercase font-normal">{emp.email}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* VIEW C: SECURE APPLICATION REQUEST AUTHORIZATIONS */}
                        {viewTab === 'leaves' && (
                            <div className="space-y-6">
                                {!isHrPowerEnabled && (
                                    <div className="p-4 bg-rose-50 border border border-rose-200 text-rose-700 text-xs font-bold rounded-xl uppercase tracking-wide shadow-sm">
                                        🚫 Overruled: Leave status modifications are frozen by the root admin.
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {leaveRequests.map(req => (
                                        <div key={req.id || req._id} className="bg-white p-6 rounded-[24px] border border-[#e2e8f0] shadow-sm flex flex-col justify-between space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="text-base font-bold text-[#1e293b] tracking-tight">{req.name}</h4>
                                                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100 rounded-md">{req.type}</span>
                                                    </div>
                                                    <span className="font-mono text-xs font-bold text-[#94a3b8]">{req.days} Days Requested</span>
                                                </div>
                                                <div className="p-3.5 bg-slate-50 rounded-xl border border-[#e2e8f0] text-xs font-normal text-[#64748b]"><div className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider mb-1">Reason Statement</div>"{req.reason}"</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <button type="button" disabled={!isHrPowerEnabled} onClick={() => handleLeaveAction(req.id || req._id, 'Reject')} className="py-2.5 rounded-xl text-xs font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all">Decline</button>
                                                <button type="button" disabled={!isHrPowerEnabled} onClick={() => handleLeaveAction(req.id || req._id, 'Approve')} className="py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-100">Approve Leave</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 👤 VIEW D: PERSONAL TELEMETRY ATTENDANCE & PAYROLL PORTAL */}
                        {viewTab === 'attendance' && (
                            <div className="space-y-6">

                                {/* 🎯 SINGLE CARD LAYOUT LAYER: ONLY RATING REMAINS AS REQUESTED */}
                                <div className="max-w-xs">
                                    <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
                                        <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Performance Evaluations</span>
                                        <span className="text-2xl font-black text-amber-500 mt-1 block">★ {hrAttendance?.performanceStars || fallbackAttendance.performanceStars} / 5.0</span>
                                        <span className="text-[9px] text-emerald-600 font-bold block uppercase mt-0.5">+${hrAttendance?.accruedIncentives || fallbackAttendance.accruedIncentives} Star Bonuses</span>
                                    </div>
                                </div>

                                {/* GRAPHICAL TIMELINE GRID AND PAYSLIP BREAKDOWN */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                                    {/* COMPACT PAYSLIP BLOCK */}
                                    <div className="lg:col-span-7 bg-white border border-gray-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between space-y-6">
                                        <div>
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Attendance-Linked Salary Itemization</h3>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase mt-0.5">Automated payroll slips mapped out of live clock-in timestamps</p>
                                        </div>

                                        <div className="divide-y divide-gray-100 font-medium text-xs text-gray-700">
                                            <div className="py-3.5 flex justify-between"><span>Contractual Base Package</span><span className="font-mono text-gray-900 font-bold">${hrAttendance?.baseSalary.toLocaleString() || fallbackAttendance.baseSalary.toLocaleString()}.00</span></div>
                                            <div className="py-3.5 flex justify-between"><span>Prorated Active Payout ({hrAttendance?.daysPresent || fallbackAttendance.daysPresent} Days Present)</span><span className="font-mono text-gray-900 font-bold">${netSalary.toLocaleString()}.00</span></div>
                                            <div className="py-3 flex justify-between items-center bg-rose-50/40 px-3 -mx-3 rounded-xl"><span className="text-rose-700 font-bold">Unapproved LOP Deductions ({hrAttendance ? hrAttendance.totalShiftDays - hrAttendance.daysPresent : fallbackAttendance.totalShiftDays - fallbackAttendance.daysPresent} Absences)</span><span className="font-mono text-rose-600 font-black">-${lopDeduction.toLocaleString()}.00</span></div>
                                            <div className="py-3 flex justify-between items-center bg-emerald-50/40 px-3 -mx-3 rounded-xl"><span className="text-emerald-700 font-bold">Productivity Rating Incentives</span><span className="font-mono text-emerald-600 font-black">+${hrAttendance?.accruedIncentives || fallbackAttendance.accruedIncentives}.00</span></div>
                                            <div className="py-4 flex justify-between items-baseline border-t border-gray-200 text-sm"><span className="text-gray-900 font-black uppercase">Net Disbursed Estimate</span><span className="font-mono text-2xl font-black text-indigo-600">${finalPayout.toLocaleString()}.00</span></div>
                                        </div>
                                    </div>

                                    {/* WEEKLY SHIFT MATRIX TRACKER */}
                                    <div className="lg:col-span-5 bg-white border border-gray-200 p-6 rounded-3xl shadow-sm space-y-4">
                                        <div>
                                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Active Shift Matrix</h3>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase mt-0.5">Visual representation of the monthly duty timeline log</p>
                                        </div>

                                        <div className="grid grid-cols-5 gap-2.5 pt-2 select-none">
                                            {(hrAttendance?.shiftLogsMatrix || fallbackAttendance.shiftLogsMatrix).map((log) => (
                                                <div
                                                    key={log.day}
                                                    className={`aspect-square rounded-xl border flex flex-col items-center justify-center transition-all ${log.status === 'present' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                                            log.status === 'late' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                                                'bg-rose-50 border-rose-200 text-rose-700'
                                                        }`}
                                                    title={`Day ${log.day}: ${log.status.toUpperCase()}`}
                                                >
                                                    <span className="text-[10px] font-mono font-black block">{log.day}</span>
                                                    <span className="text-[8px] uppercase block tracking-tighter font-extrabold scale-90 -mt-0.5">
                                                        {log.status === 'present' ? 'OK' : log.status === 'late' ? 'LATE' : 'LOP'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Grid Legend Keys */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-[10px] font-bold uppercase tracking-tight text-gray-400">
                                            <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 block" /><span>Present</span></div>
                                            <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-amber-500 block" /><span>Late</span></div>
                                            <div className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-rose-500 block" /><span>Loss Pay</span></div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}