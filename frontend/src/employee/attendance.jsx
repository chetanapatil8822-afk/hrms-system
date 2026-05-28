import { useState, useEffect } from 'react';
import EmployeeSidebar from '@/components/EmployeeSidebar'; // Fixed shortcut path alias

export default function AttendancePage() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [punchLogs, setPunchLogs] = useState([]);
  const [calendarDays, setCalendarDays] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // 1. Fetch initial attendance record and status when page loads
  useEffect(() => {
    const fetchAttendanceData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        window.location.href = '/'; // Redirect if user manually bypasses login
        return;
      }

      try {
        const res = await fetch('/api/attendance/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok) {
          setIsCheckedIn(data.isCheckedIn);
          setPunchLogs(data.todaysLogs || []);
          setCalendarDays(data.monthlyLedger || []);
        }
      } catch (err) {
        console.error("Error connecting to database:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, []);

  // 2. Interactive Server Check-In / Check-Out Logic 
  const handlePunchToggle = async () => {
    const token = localStorage.getItem('authToken');
    const endpoint = isCheckedIn ? 'checkout' : 'checkin';

    try {
      const res = await fetch(`/api/attendance/${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Action failed');

      setIsCheckedIn(!isCheckedIn);
      setPunchLogs(data.updatedLogs);
      setCalendarDays(data.updatedLedger);
    } catch (err) {
      alert(err.message);
    }
  };

  // 3. Filter runtime database fields
  const filteredDays = calendarDays.filter(day => 
    historyFilter === 'all' ? true : day.status === historyFilter
  );

  // Calculate dynamic analytics from live data
  const summary = calendarDays.reduce((acc, curr) => {
    if (curr.status === 'Present') { acc.present += 1; acc.presentHours += curr.hours; }
    if (curr.status === 'Late') { acc.late += 1; acc.lateHours += curr.hours; }
    if (curr.status === 'Leave') { acc.leave += 1; }
    return acc;
  }, { present: 0, presentHours: 0, late: 0, lateHours: 0, leave: 0 });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-gray-400 uppercase font-black tracking-widest text-xs animate-pulse">Syncing shifts ledger...</div>;
  }

  return (
    /* MAIN CONTAINER: Pure White Background */
    <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans">
      
      {/* Locked Sidebar Pane */}
      <div className="md:sticky md:top-0 md:h-screen z-20 flex-shrink-0 border-r border-gray-100">
        <EmployeeSidebar activeModule="attendance" />
      </div>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Attendance Logging</h1>
            <p className="text-sm text-gray-500 mt-1">Track shifts, compute monthly hours, and submit clock times</p>
          </div>
          
          <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-2xl border border-gray-200 shadow-sm h-fit">
            <span className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-700">
              {isCheckedIn ? "Status: Checked In" : "Status: Off Duty"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Action Console */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Shift Console */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm text-center space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shift Console</h3>
              
              <div className="py-4">
                <span className="text-3xl font-mono font-black text-gray-900 block">
                  {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase block mt-1 tracking-tight">Shift: 09:00 AM - 05:00 PM</span>
              </div>

              <button
                onClick={handlePunchToggle}
                className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all transform active:scale-[0.98] shadow-md ${
                  isCheckedIn
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-100'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                }`}
              >
                {isCheckedIn ? "🛑 Punch Check-Out" : "🚀 Punch Check-In"}
              </button>
            </div>

            {/* Realtime Activity Feed */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Activity Feed</h3>
              
              {punchLogs.length === 0 ? (
                <p className="text-[10px] font-bold text-gray-400 uppercase text-center py-4">No punch logs recorded.</p>
              ) : (
                <div className="relative border-l-2 border-gray-100 ml-2 pl-4 space-y-4 font-bold">
                  {punchLogs.map((log, index) => (
                    <div key={index} className="relative text-[11px] uppercase tracking-tight">
                      <span className={`absolute -left-[23px] top-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        log.type === 'Check-In' ? 'bg-indigo-600' : 'bg-rose-600'
                      }`} />
                      <div className="flex justify-between items-center">
                        <span className="text-gray-800">{log.type}</span>
                        <span className="font-mono text-gray-400 font-black">{log.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Calendar & Summary */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Attendance Calendar Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Attendance Calendar</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Current Month Ledger</p>
                </div>
                
                <div className="flex flex-wrap gap-1 bg-gray-50 p-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-gray-100">
                  {['all', 'Present', 'Late', 'Leave'].map(filter => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setHistoryFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        historyFilter === filter
                          ? 'bg-white text-indigo-600 shadow-sm scale-105 font-black border border-gray-100'
                          : 'text-gray-400 hover:text-gray-800'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar Grid Layout */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {filteredDays.map((day) => (
                  <div
                    key={day.date}
                    className={`p-3 rounded-xl border flex flex-col justify-between items-center gap-1.5 text-center transition-all ${
                      day.status === 'Present' 
                        ? 'bg-emerald-50/40 border-emerald-100 text-emerald-800' 
                        : day.status === 'Late'
                        ? 'bg-amber-50/40 border-amber-100 text-amber-800'
                        : day.status === 'Leave'
                        ? 'bg-rose-50/40 border-rose-100 text-rose-700'
                        : 'bg-gray-50 border-gray-100 text-gray-400'
                    }`}
                  >
                    <span className="text-[9px] uppercase font-black tracking-widest opacity-60">{day.day}</span>
                    <span className="text-lg font-mono font-black leading-none">{day.date}</span>
                    <span className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md bg-white border border-inherit shadow-sm">
                      {day.status === 'Weekend' ? 'OFF' : day.hours > 0 ? `${day.hours}h` : 'LV'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Analytics Breakdown Summary Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Shift Breakdown Summary</h3>
              
              <div className="space-y-5 text-[10px] font-black uppercase tracking-widest">
                <div>
                  <div className="flex justify-between text-gray-400 mb-2">
                    <span>Present Shifts</span>
                    <span className="text-emerald-600 font-mono">{summary.present} Days ({summary.presentHours}h)</span>
                  </div>
                  <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(summary.present / 30) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-gray-400 mb-2">
                    <span>Late Arrivals</span>
                    <span className="text-amber-600 font-mono">{summary.late} Days ({summary.lateHours}h)</span>
                  </div>
                  <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(summary.late / 30) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-gray-400 mb-2">
                    <span>Approved Leave</span>
                    <span className="text-rose-600 font-mono">{summary.leave} Days</span>
                  </div>
                  <div className="w-full bg-gray-50 h-3 rounded-full overflow-hidden border border-gray-100">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(summary.leave / 30) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}