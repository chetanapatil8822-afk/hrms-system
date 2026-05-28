import { useState } from 'react';
import HRSidebar from '../components/HRSidebar'; // Clean shortcut reference to your shared sidebar

// Mock real-time check-in ledger
const MOCK_ATTENDANCE_REGISTRY = [
    { empId: "EMP-2026-089", name: "Yash", role: "Frontend Developer", department: "Engineering", checkIn: "09:02 AM", checkOut: "--:--", status: "Present", hours: 7.5 },
    { empId: "EMP-2026-090", name: "Gautam", role: "Backend Engineer", department: "Engineering", checkIn: "09:15 AM", checkOut: "--:--", status: "Late", hours: 7.2 },
    { empId: "EMP-2026-091", name: "Chetana", role: "UI/UX Designer", department: "Design", checkIn: "08:55 AM", checkOut: "05:00 PM", status: "Present", hours: 8.0 },
    { empId: "EMP-2026-092", name: "Ananya", role: "HR Specialist", department: "Human Resources", checkIn: "--:--", checkOut: "--:--", status: "Leave", hours: 0.0 },
];

export default function HRAttendance() {
    const [registry, setRegistry] = useState(MOCK_ATTENDANCE_REGISTRY);
    const [filter, setFilter] = useState('all'); // 'all', 'Present', 'Late', 'Leave'

    const filteredRegistry = registry.filter(emp =>
        filter === 'all' ? true : emp.status === filter
    );

    return (
        /* MAIN CONTAINER: Pure White Background */
        <div className="min-h-screen flex bg-white font-sans">

            {/* REUSABLE TELEMETRY HR SIDEBAR */}
            <HRSidebar activeModule="attendance" />

            {/* MAIN DATA CONTENT WORKSPACE */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8">

                {/* Module Title Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Staff Attendance Registry</h1>
                        <p className="text-sm text-gray-500 mt-1">Audit real-time shifts, punch timings, metrics, and workforce check-in status flags</p>
                    </div>

                    <div className="text-right bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl font-mono text-xs font-black text-gray-800">
                        {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>

                {/* Real-time Status Filter Tabs */}
                <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 w-max">
                    {['all', 'Present', 'Late', 'Leave'].map(category => (
                        <button
                            key={category}
                            type="button"
                            onClick={() => setFilter(category)}
                            className={`px-4 py-2 rounded-lg transition-all ${filter === category
                                    ? 'bg-white text-indigo-600 shadow-sm font-black border border-gray-200/60'
                                    : 'text-gray-400 hover:text-gray-800'
                                }`}
                        >
                            {category === 'all' ? 'All Active' : category}
                        </button>
                    ))}
                </div>

                {/* Master Active Shift Log Table */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[11px] uppercase tracking-tight">
                            <thead>
                                <tr className="border-b border-gray-200 text-gray-400 font-black tracking-widest bg-gray-50">
                                    <th className="p-4">Employee</th>
                                    <th className="p-4">Assigned Department</th>
                                    <th className="p-4">Punch In</th>
                                    <th className="p-4">Punch Out</th>
                                    <th className="p-4">Hours Today</th>
                                    <th className="p-4 text-right">Status Flag</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
                                {filteredRegistry.map((emp) => (
                                    <tr key={emp.empId} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <span className="block font-black text-gray-900 text-sm normal-case">{emp.name}</span>
                                            <span className="block font-mono text-[10px] text-gray-400 mt-0.5">{emp.empId} • {emp.role}</span>
                                        </td>
                                        <td className="p-4 text-gray-500 normal-case">{emp.department}</td>
                                        <td className="p-4 font-mono font-black text-gray-800">{emp.checkIn}</td>
                                        <td className="p-4 font-mono text-gray-400">{emp.checkOut}</td>
                                        <td className="p-4 font-mono font-black text-gray-900">{emp.hours > 0 ? `${emp.hours} hrs` : '--'}</td>
                                        <td className="p-4 text-right">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest ${emp.status === 'Present'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : emp.status === 'Late'
                                                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                        : 'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>
        </div>
    );
}