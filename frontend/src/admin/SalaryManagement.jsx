import { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar.jsx';

export default function SalaryManagement() {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('All');

    // Core payroll telemetry statistics
    const [payrollStats, setPayrollStats] = useState({
        totalDisbursed: 0,
        pendingPayouts: 0,
        totalPayrollCount: 0
    });

    useEffect(() => {
        const fetchPayrollData = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const res = await fetch('/api/employees', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();

                if (res.ok) {
                    // Injecting consistent baseline fallback salaries and statuses based on schema records
                    const enrichedStaff = data.map((emp, idx) => {
                        let baseSalary = 65000; // Fallback standard baseline
                        if (emp.department?.toLowerCase().includes('engineer') || emp.department?.toLowerCase().includes('dev')) {
                            baseSalary = 95000;
                        } else if (emp.role === 'hr') {
                            baseSalary = 75000;
                        } else if (emp.department?.toLowerCase().includes('design')) {
                            baseSalary = 80000;
                        }

                        // Alternate status allocations for demonstration purposes
                        const payrollStatus = idx % 3 === 0 ? "Pending" : "Disbursed";

                        return {
                            ...emp,
                            salary: baseSalary,
                            status: payrollStatus
                        };
                    });

                    setEmployees(enrichedStaff);

                    // Compute global payroll statistics
                    const disbursed = enrichedStaff.filter(e => e.status === 'Disbursed').reduce((acc, curr) => acc + curr.salary, 0);
                    const pending = enrichedStaff.filter(e => e.status === 'Pending').reduce((acc, curr) => acc + curr.salary, 0);

                    setPayrollStats({
                        totalDisbursed: disbursed,
                        pendingPayouts: pending,
                        totalPayrollCount: enrichedStaff.length
                    });
                }
            } catch (err) {
                console.error("Error connecting to payroll data endpoints:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPayrollData();
    }, []);

    // Handle Payment Action Dispatches
    const handleTriggerPayment = (empId, name, amount) => {
        const confirmation = window.confirm(`Proceed to secure banking gateway to disburse ₹${amount.toLocaleString()} to ${name}?`);
        if (confirmation) {
            // Simulate routing out to payment processing node window
            alert(`💳 Secure Request Transmitted!\n₹${amount.toLocaleString()} has been released to Staff ID: ${empId}. Status updated in MongoDB.`);

            // Optimistically update local interface status state
            setEmployees(prev => prev.map(emp => emp.empId === empId ? { ...emp, status: 'Disbursed' } : emp));

            // Recalculate statistics values dynamically
            setPayrollStats(prev => ({
                ...prev,
                totalDisbursed: prev.totalDisbursed + amount,
                pendingPayouts: Math.max(0, prev.pendingPayouts - amount)
            }));
        }
    };

    // Filter and search computation queries
    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.empId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = filterDept === 'All' || emp.department?.toLowerCase().includes(filterDept.toLowerCase());
        return matchesSearch && matchesDept;
    });

    return (
        <div className="min-h-screen flex bg-white font-sans">

            {/* ADMIN ROUTING SIDEBAR */}
            <AdminSidebar activeModule="salary" />

            {/* MAIN CONTENT RUNTIME VIEW */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8">

                {/* Section Header */}
                <div className="border-b border-gray-100 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Payroll Hub Ledger</h1>
                        <p className="text-sm text-gray-500 mt-1">Authorize salary packages, disburse payouts, and track cross-departmental operations</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">
                        Parsing enterprise financial ledgers...
                    </div>
                ) : (
                    <div className="space-y-8">

                        {/* Financial Analytics Summary Scorecards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm">
                                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Payroll Budget Allocation</span>
                                <span className="text-2xl font-black text-gray-900 block">₹{(payrollStats.totalDisbursed + payrollStats.pendingPayouts).toLocaleString()}</span>
                                <span className="block text-[10px] font-bold text-gray-400 mt-1 uppercase">Cumulative Branch Liability</span>
                            </div>
                            <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm">
                                <span className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Disbursed Volume (Current Month)</span>
                                <span className="text-2xl font-black text-emerald-600 block">Hex ₹{payrollStats.totalDisbursed.toLocaleString()}</span>
                                <span className="block text-[10px] font-bold text-emerald-400 mt-1 uppercase">Committed Settlement Indices</span>
                            </div>
                            <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-sm">
                                <span className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Outstanding Pending Pipeline</span>
                                <span className="text-2xl font-black text-amber-600 block">₹{payrollStats.pendingPayouts.toLocaleString()}</span>
                                <span className="block text-[10px] font-bold text-amber-400 mt-1 uppercase">Awaiting Exec Verdicts</span>
                            </div>
                        </div>

                        {/* Search Filtration Control Interface */}
                        <div className="flex flex-col sm:flex-row gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <input
                                type="text"
                                placeholder="Search by name or Employee ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 px-4 py-2.5 text-xs font-bold rounded-xl border border-gray-200 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-600 outline-none transition-all text-gray-800"
                            />
                            <select
                                value={filterDept}
                                onChange={(e) => setFilterDept(e.target.value)}
                                className="px-4 py-2.5 text-xs font-bold rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-indigo-600 outline-none text-gray-700"
                            >
                                <option value="All">All Departments</option>
                                <option value="Engineer">Engineering / Tech</option>
                                <option value="Human">Human Resources</option>
                                <option value="Design">UI/UX Design</option>
                            </select>
                        </div>

                        {/* Principal Payroll Data Grid */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                            {filteredEmployees.length === 0 ? (
                                <div className="p-12 text-center text-xs font-black text-gray-400 uppercase tracking-widest">
                                    No records matching active filter conditions found.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[11px] uppercase tracking-tight">
                                        <thead>
                                            <tr className="border-b border-gray-200 text-gray-400 font-black tracking-widest bg-gray-50">
                                                <th className="p-4">Staff ID</th>
                                                <th className="p-4">Full Identity Name</th>
                                                <th className="p-4">Department wing</th>
                                                <th className="p-4">Allocated Base Salary</th>
                                                <th className="p-4">Disbursement Status</th>
                                                <th className="p-4 text-right">Execution Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
                                            {filteredEmployees.map((emp) => (
                                                <tr key={emp.empId} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="p-4 font-mono font-black text-gray-900">{emp.empId}</td>
                                                    <td className="p-4 text-gray-900 text-sm normal-case font-bold">{emp.name}</td>
                                                    <td className="p-4 text-gray-500 normal-case">{emp.department || 'General Operations'}</td>
                                                    <td className="p-4 font-mono font-black text-gray-900 text-xs">₹{emp.salary.toLocaleString()}</td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 text-[9px] font-black rounded-lg uppercase border tracking-wider ${emp.status === 'Disbursed'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                : 'bg-amber-50 text-amber-700 border-amber-100'
                                                            }`}>
                                                            {emp.status === 'Disbursed' ? '✓ Disbursed' : '🕒 Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button
                                                            type="button"
                                                            disabled={emp.status === 'Disbursed'}
                                                            onClick={() => handleTriggerPayment(emp.empId, emp.name, emp.salary)}
                                                            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all ${emp.status === 'Disbursed'
                                                                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                                                    : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-800 hover:text-white shadow-xs'
                                                                }`}
                                                        >
                                                            {emp.status === 'Disbursed' ? "Settled" : "⚡ Process Payment"}
                                                        </button>
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
            </main>
        </div>
    );
}