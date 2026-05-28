import { useState, useEffect } from 'react';
import HRSidebar from '../components/HRSidebar';
// ✅ IMPORT TOASTIFY HOOKS FOR MODERN NOTIFICATIONS
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function HRLeaveApplicationPage() {
    // 🔄 FIXED INITIAL STATE STRUCTURING MATRIX SAFE FOR OBJECT PROPERTIES LOOKUPS
    const [balances, setBalances] = useState({
        casual: { used: 0, max: 10 },
        medical: { used: 0, max: 12 },
        earned: { used: 0, max: 15 },
        paid: { used: 0, max: 12 }
    });
    const [leaveHistory, setLeaveHistory] = useState([]);
    const [userRole, setUserRole] = useState('hr');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form input states
    const [leaveType, setLeaveType] = useState('Casual Leave');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    // 📋 GET: SYNC BALANCES AND HISTORY CONTEXT FROM CLUSTER ON MOUNT
    const fetchLeaveManagementData = async () => {
        const token = localStorage.getItem('authToken');
        try {
            // 🕵️‍♂️ Dynamic Role Extraction Strategy
            if (token) {
                try {
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));

                    const decoded = JSON.parse(jsonPayload);
                    if (decoded && decoded.role) {
                        setUserRole(decoded.role.toLowerCase());
                    }
                } catch (e) {
                    console.error("Token parsing failure:", e);
                }
            }

            const res = await fetch('/api/leaves/my-requests', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to load database collections.");

            setBalances(data.balances);
            setLeaveHistory(data.history);
        } catch (err) {
            toast.error(`❌ Sync Failure: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaveManagementData();
    }, []);

    // Calculate total days between chosen dates
    const calculateDays = (start, end) => {
        if (!start || !end) return 0;
        const sDate = new Date(start);
        const eDate = new Date(end);

        if (eDate < sDate) return 0; // Guard clause against date inversions

        const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays || 0;
    };

    const totalDaysRequested = calculateDays(startDate, endDate);

    // 🚀 POST: DISPATCH PAYLOAD DOWN TO REWRITE PIPELINE
    const handleSubmitLeave = async (e) => {
        e.preventDefault();
        if (totalDaysRequested <= 0) {
            toast.error("⚠️ Invalid Range selection: End Date cannot occur before Start Date.");
            return;
        }

        setIsSubmitting(true);
        const token = localStorage.getItem('authToken');

        const payload = {
            type: leaveType,
            startDate,
            endDate,
            days: totalDaysRequested,
            reason: reason.trim(),
            employeeRole: userRole
        };

        try {
            const res = await fetch('/api/leaves/apply', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Could not complete authorization registration.");

            toast.success("🎉 Leave application submitted successfully for Admin review!");

            setStartDate('');
            setEndDate('');
            setReason('');

            fetchLeaveManagementData();
        } catch (err) {
            toast.error(`❌ Application Rejected: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white font-sans text-xs font-black uppercase tracking-widest text-zinc-400 animate-pulse">
                Parsing database infrastructure context values...
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-white font-sans">
            <ToastContainer position="top-right" autoClose={4000} theme="light" />

            {/* INTEGRATED SHARED SIDEBAR ENGINE */}
            <HRSidebar activeModule="leave" />

            <main className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8">

                {/* Module Header */}
                <div className="border-b border-gray-100 pb-6">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">My Leave Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Apply for personal time off and track your administrative balances</p>
                </div>

                {/* 🔄 CHANGED: Renders Dynamic Used vs Max Allocations */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Casual Balance', used: balances.casual?.used || 0, max: balances.casual?.max || 10 },
                        { label: 'Medical Balance', used: balances.medical?.used || 0, max: balances.medical?.max || 12 },
                        { label: 'Earned Balance', used: balances.earned?.used || 0, max: balances.earned?.max || 15 },
                        { label: 'Paid Balance', used: balances.paid?.used || 0, max: balances.paid?.max || 12 },
                    ].map((item, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-gray-900">{item.used}</span>
                                <span className="text-xs font-bold text-gray-400">/ {item.max}</span>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider ml-auto">Days Used</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Leave Application Form */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4 h-fit">
                        <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3">
                            New Leave Request
                        </h3>

                        <form onSubmit={handleSubmitLeave} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Leave Category</label>
                                <select
                                    value={leaveType}
                                    onChange={(e) => setLeaveType(e.target.value)}
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-3 text-sm rounded-xl border border-gray-300 bg-gray-50 font-bold text-gray-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                >
                                    <option value="Casual Leave">Casual Leave</option>
                                    <option value="Medical Leave">Medical Leave</option>
                                    <option value="Earned Leave">Earned Leave</option>
                                    <option value="Paid Leave">Paid Leave</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        required
                                        disabled={isSubmitting}
                                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-300 font-bold bg-gray-50 focus:bg-white text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        required
                                        disabled={isSubmitting}
                                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-300 font-bold bg-gray-50 focus:bg-white text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            {totalDaysRequested > 0 && (
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase text-center border border-indigo-100">
                                    Duration: {totalDaysRequested} {totalDaysRequested === 1 ? 'Day' : 'Days'}
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Reason for Leave</label>
                                <textarea
                                    rows={4}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Provide context..."
                                    required
                                    disabled={isSubmitting}
                                    className="w-full px-3 py-3 text-sm rounded-xl border border-gray-300 bg-gray-50 focus:bg-white font-bold text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
                            >
                                {isSubmitting ? "Processing..." : "Submit Application"}
                            </button>
                        </form>
                    </div>

                    {/* HR Personal Leave History Table */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between">
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3">
                                My Leave History
                            </h3>

                            <div className="overflow-x-auto">
                                {leaveHistory.length === 0 ? (
                                    <div className="text-center py-10 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                                        No historic personal leave records found on this account ledger.
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-[11px] uppercase tracking-tight">
                                        <thead>
                                            <tr className="border-b border-gray-200 text-gray-400 font-black tracking-widest bg-gray-50">
                                                <th className="p-3">Leave Type</th>
                                                <th className="p-3">Timeline</th>
                                                <th className="p-3">Days</th>
                                                <th className="p-3 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
                                            {leaveHistory.map((log) => (
                                                <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="p-3 font-black text-gray-900">{log.type}</td>
                                                    <td className="p-3 text-gray-400 font-mono text-[10px]">{log.startDate} - {log.endDate}</td>
                                                    <td className="p-3 font-mono font-black">{log.days}D</td>
                                                    <td className="p-3 text-right">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest shadow-sm ${log.status === 'Approved'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                            : log.status === 'Rejected'
                                                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                                : 'bg-amber-50 text-amber-700 border-amber-100'
                                                            }`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest text-center pt-6 border-t border-gray-100 mt-4">
                            HR personnel requests are routed directly to Admin for approval
                        </div>
                    </div>

                </div>

            </main>
        </div>
    );
}