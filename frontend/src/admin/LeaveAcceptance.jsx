import { useState, useEffect } from 'react';
import AdminSidebar from '../components/AdminSidebar.jsx';
// ✅ IMPORT TOASTIFY HOOKS FOR REAL-TIME NOTIFICATIONS
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function LeaveDeskReview() {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');

    // Aggregate metrics states for operational awareness tracking
    const [metrics, setMetrics] = useState({
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0
    });

    // 📋 GET: FETCH ALL REGULATED LEAVES FROM DATABASE CLUSTER
    const fetchLeaveRequests = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        try {
            // Hitting your custom pending reviews router channel endpoint
            const res = await fetch('/api/leaves/pending-reviews', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to parse backend leaf documents ledger.");

            // Standardize historical timeline fields for the UI mapping matrix
            const formattedData = data.map(req => ({
                id: req._id,
                name: req.employeeId?.name || "Unknown Worker",
                empId: req.employeeId?.empId || "—",
                department: req.employeeId?.department || "Unassigned",
                type: req.type,
                timeline: `${req.startDate} to ${req.endDate}`,
                days: req.days,
                reason: req.reason,
                status: req.status
            }));

            setLeaveRequests(formattedData);
            calculateMetrics(formattedData);
        } catch (err) {
            toast.error(`❌ Fetch Error: ${err.message}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaveRequests();
    }, []);

    const calculateMetrics = (data) => {
        setMetrics({
            pendingCount: data.filter(r => r.status === 'Pending').length,
            approvedCount: data.filter(r => r.status === 'Approved').length,
            rejectedCount: data.filter(r => r.status === 'Rejected').length,
        });
    };

    // 📝 PUT: MUTATE REQUEST VERDICTS AND FLUSH ASSIGNMENTS TO CLUSTER TABLES
    const handleLeaveAction = async (id, targetStatus) => {
        const actionText = targetStatus === 'Approved' ? 'APPROVE' : 'REJECT';
        const confirmation = window.confirm(`Are you sure you want to ${actionText} leave application reference ${id}?`);

        if (!confirmation) return;

        const token = localStorage.getItem('authToken');
        try {
            const res = await fetch(`/api/leaves/action/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: targetStatus })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Failed to commit state changes.");

            toast.success(`🎉 Profile Reference successfully updated to: ${targetStatus}`);

            // Local state mutation strategy keeps user experiences fluid without layout page blinks
            setLeaveRequests(prev => {
                const updated = prev.map(req => req.id === id ? { ...req, status: targetStatus } : req);
                calculateMetrics(updated);
                return updated;
            });

        } catch (err) {
            toast.error(`❌ Action Aborted: ${err.message}`);
        }
    };

    const filteredRequests = leaveRequests.filter(req => filterStatus === 'All' || req.status === filterStatus);

    return (
        <div className="min-h-screen flex bg-white font-sans">
            <ToastContainer position="top-right" autoClose={4000} theme="light" />

            {/* ADMIN ROUTING SIDEBAR */}
            <AdminSidebar activeModule="leaves" />

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8">

                {/* Module Description Header */}
                <div className="border-b border-gray-100 pb-6">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Leave Desk Review</h1>
                    <p className="text-sm text-gray-500 mt-1">Audit administrative time-off requests, cross-reference department capacities, and approve balances</p>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">
                        Retrieving operational leave logs from data cluster...
                    </div>
                ) : (
                    <div className="space-y-8">

                        {/* Analytical Leave Counter Widgets */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
                                <span className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Awaiting Attention</span>
                                <span className="text-3xl font-black text-amber-600 block">{metrics.pendingCount} Requests</span>
                                <span className="block text-[10px] text-gray-400 font-bold mt-1 uppercase">Awaiting Action Verdicts</span>
                            </div>
                            <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
                                <span className="block text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Approved Leaves</span>
                                <span className="text-3xl font-black text-emerald-600 block">{metrics.approvedCount} Settled</span>
                                <span className="block text-[10px] text-gray-400 font-bold mt-1 uppercase">Authorized Absence Clearances</span>
                            </div>
                            <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
                                <span className="block text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Rejected Applications</span>
                                <span className="text-3xl font-black text-rose-600 block">{metrics.rejectedCount} Voided</span>
                                <span className="block text-[10px] text-gray-400 font-bold mt-1 uppercase">Declined Workspace Absence Logs</span>
                            </div>
                        </div>

                        {/* Filter Status Panel */}
                        <div className="flex gap-2 p-1.5 bg-gray-50 rounded-xl border border-gray-100 w-fit">
                            {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${filterStatus === status
                                        ? 'bg-white text-indigo-800 border border-gray-200/60 shadow-xs'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        {/* Principal Leave Processing Matrix */}
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                            {filteredRequests.length === 0 ? (
                                <div className="p-12 text-center text-xs font-black text-gray-400 uppercase tracking-widest">
                                    No absence logs matched your current status filters.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[11px] uppercase tracking-tight">
                                        <thead>
                                            <tr className="border-b border-gray-200 text-gray-400 font-black tracking-widest bg-gray-50">
                                                <th className="p-4">Personnel Profile</th>
                                                <th className="p-4">Leave Class</th>
                                                <th className="p-4">Timeline Span</th>
                                                <th className="p-4">Duration</th>
                                                <th className="p-4">Context / Reason</th>
                                                <th className="p-4">Status Flag</th>
                                                <th className="p-4 text-right">Review Action Trigger</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
                                            {filteredRequests.map((req) => (
                                                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="p-4 space-y-0.5">
                                                        <span className="block font-black text-gray-900 normal-case text-xs">{req.name}</span>
                                                        <span className="block font-mono text-[10px] text-gray-400">{req.empId} ({req.department})</span>
                                                    </td>
                                                    <td className="p-4 font-black text-gray-800">{req.type}</td>
                                                    <td className="p-4 font-mono text-gray-400 text-[10px]">{req.timeline}</td>
                                                    <td className="p-4 font-mono font-black text-gray-900">{req.days} Days</td>
                                                    <td className="p-4 text-gray-500 normal-case font-medium max-w-xs truncate" title={req.reason}>
                                                        {req.reason}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 text-[9px] font-black border rounded-lg tracking-wider uppercase ${req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            req.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                                'bg-amber-50 text-amber-700 border-amber-100'
                                                            }`}>
                                                            {req.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {req.status === 'Pending' ? (
                                                            <div className="flex gap-2 justify-end">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleLeaveAction(req.id, 'Approved')}
                                                                    className="px-2.5 py-1.5 text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all rounded-lg uppercase tracking-wider shadow-xs"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleLeaveAction(req.id, 'Rejected')}
                                                                    className="px-2.5 py-1.5 text-[9px] font-black bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white transition-all rounded-lg uppercase tracking-wider shadow-xs"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] font-black font-mono text-gray-300 tracking-widest uppercase px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg">
                                                                Locked
                                                            </span>
                                                        )}
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