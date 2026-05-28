import { useState, useEffect } from 'react';
import EmployeeSidebar from '@/components/EmployeeSidebar'; // Fixed shortcut path alias

// Constants for payroll calculations
const BASE_SALARY = 75000;
const EXPECTED_HOURS_PER_DAY = 8;
const TOTAL_WORKING_DAYS_MONTH = 22;
const EXPECTED_TOTAL_HOURS = TOTAL_WORKING_DAYS_MONTH * EXPECTED_HOURS_PER_DAY;

// Mock historical logs
const MOCK_EXTRA_WORKING_HISTORY = [
  { id: 1, date: "May 12, 2026", hoursLogged: 2.5, description: "Critical production hotfix deployment", status: "Approved" },
  { id: 2, date: "May 08, 2026", hoursLogged: 1.5, description: "Sync alignment with backend team (Gautam & Chetana)", status: "Approved" },
  { id: 3, date: "May 05, 2026", hoursLogged: 3.0, description: "Designing landing gateway view layouts", status: "Approved" },
];

// Mock daily work metrics
const MOCK_WEEKLY_HOURS_DATA = [
  { day: "Mon", hours: 8.0, status: "Present" },
  { day: "Tue", hours: 9.5, status: "Overtime" },
  { day: "Wed", hours: 8.0, status: "Present" },
  { day: "Thu", hours: 4.0, status: "Half Day" },
  { day: "Fri", hours: 8.5, status: "Overtime" },
  { day: "Mon", hours: 0.0, status: "Absent" },
  { day: "Tue", hours: 10.0, status: "Overtime" },
];

export default function EmployeeDashboard() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);

  // Lazy state evaluation to fetch time instantly on first render pass
  const [currentTime, setCurrentTime] = useState(() => 
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const [attendanceSummary, setAttendanceSummary] = useState({
    presentDays: 18,
    absentDays: 1,
    lateDays: 2,
    totalHoursWorked: 154.5,
  });

  // Safe interval ticker for system clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckInToggle = () => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (!isCheckedIn) {
      setIsCheckedIn(true);
      setCheckInTime(timestamp);
      setCheckOutTime(null);
    } else {
      setIsCheckedIn(false);
      setCheckOutTime(timestamp);
      setAttendanceSummary(prev => ({
        ...prev,
        totalHoursWorked: prev.totalHoursWorked + 8.0,
        presentDays: prev.presentDays + 1
      }));
    }
  };

  // Financial calculations
  const hourlyRate = BASE_SALARY / EXPECTED_TOTAL_HOURS;
  const overtimeMultiplierRate = hourlyRate * 1.5; 
  const calculatedSalaryAmount = attendanceSummary.totalHoursWorked * hourlyRate;
  
  const totalOvertimeHours = MOCK_EXTRA_WORKING_HISTORY
    .filter(item => item.status === "Approved")
    .reduce((sum, item) => sum + item.hoursLogged, 0);

  const overtimeEarnings = totalOvertimeHours * overtimeMultiplierRate;
  const finalPaycheckEstimate = calculatedSalaryAmount + overtimeEarnings;

  return (
    /* MAIN CONTAINER: Pure White Background */
    <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans">
      
      {/* LOCKED VIEWPORT SIDEBAR */}
      <div className="md:sticky md:top-0 md:h-screen z-20 flex-shrink-0 border-r border-gray-100">
        <EmployeeSidebar activeModule="dashboard" />
      </div>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome back, Yash! 👋</h1>
            <p className="text-sm text-gray-500 mt-1">Frontend Developer • Engineering Division</p>
          </div>
          
          <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-200">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-black font-mono text-gray-800">{currentTime || "00:00:00"}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live System Clock</span>
            </div>
            <button
              onClick={handleCheckInToggle}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all transform active:scale-95 shadow-md ${
                isCheckedIn
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-100'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
              }`}
            >
              {isCheckedIn ? "🛑 Check-Out" : "🚀 Check-In Now"}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Today's Status</span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-sm font-black text-gray-800">{isCheckedIn ? "Active" : "Offline"}</span>
            </div>
            <span className="block text-[10px] text-gray-500 font-bold mt-1.5 uppercase">
              {checkInTime ? `In: ${checkInTime}` : checkOutTime ? `Out: ${checkOutTime}` : "No punch log"}
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Attendance Ratio</span>
            <span className="text-xl font-black text-gray-900">
              {((attendanceSummary.presentDays / TOTAL_WORKING_DAYS_MONTH) * 100).toFixed(1)}%
            </span>
            <span className="block text-[10px] text-gray-500 font-bold mt-1">
              {attendanceSummary.presentDays}D Present / {attendanceSummary.lateDays}D Late
            </span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Hours Progression</span>
            <span className="text-xl font-black text-gray-900">
              {attendanceSummary.totalHoursWorked.toFixed(1)} <span className="text-xs font-bold text-gray-400">/ {EXPECTED_TOTAL_HOURS}</span>
            </span>
            <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-300" 
                style={{ width: `${(attendanceSummary.totalHoursWorked / EXPECTED_TOTAL_HOURS) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Payroll Status</span>
            <span className="block w-max items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
              ✓ Verified Cycle
            </span>
            <span className="block text-[10px] text-gray-500 font-bold mt-2 uppercase">Cycle Ends: EOM</span>
          </div>
        </div>

        {/* Middle Section: Chart & Financials */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Attendance Chart Tracker */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Attendance Tracker</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Daily Hours: Last 7 Periods</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase">
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600" /> Work</div>
                  <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Absence</div>
                </div>
              </div>

              <div className="h-48 flex items-end justify-between px-2 pt-4 border-b border-gray-100">
                {MOCK_WEEKLY_HOURS_DATA.map((item, idx) => {
                  const percentageHeight = (item.hours / 12) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 group relative">
                      <div className="w-8 sm:w-10 rounded-t-lg transition-all duration-300 relative overflow-hidden" style={{ height: `${percentageHeight}%` }}>
                        {item.hours === 0 ? (
                          <div className="absolute inset-0 bg-rose-50 border-t-2 border-rose-500" style={{ height: '100%' }} />
                        ) : (
                          <div className={`absolute inset-0 border-t-2 ${
                            item.status === 'Overtime' ? 'bg-indigo-800 border-indigo-500' : 'bg-indigo-600 border-indigo-400'
                          }`} />
                        )}
                      </div>
                      <span className="text-[10px] font-black text-gray-400 mt-2 block uppercase">{item.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] font-black text-gray-400 pt-4 uppercase">
              <span>Rate: 8.0H/Day</span>
              <span className="text-indigo-600 font-black tracking-widest">Cumulative: {attendanceSummary.totalHoursWorked}H</span>
            </div>
          </div>

          {/* Financial Ledger Card */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Financial Ledger</h3>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Base Salary</span>
                  <span className="text-lg font-mono font-black text-gray-900">${BASE_SALARY.toLocaleString()}</span>
                </div>
                <div className="space-y-2 text-[11px] font-bold uppercase">
                  <div className="flex justify-between border-b border-gray-100 pb-2 text-gray-400">
                    <span>Base Work Pay</span>
                    <span className="text-gray-800 font-mono">${calculatedSalaryAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2 text-gray-400">
                    <span>OT Bonus ({totalOvertimeHours}H)</span>
                    <span className="text-emerald-600 font-mono">+${overtimeEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-indigo-600 border border-indigo-700 p-4 rounded-2xl text-white mt-4 shadow-lg shadow-indigo-50">
              <span className="block text-[10px] uppercase font-black tracking-widest opacity-80 mb-1">Net Pay Estimate</span>
              <span className="text-2xl font-mono font-black block">${finalPaycheckEstimate.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Overtime Ledger Table Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Overtime Ledger</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Verified extra working hours history</p>
            </div>
            <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-4 py-2 rounded-full border border-teal-200 uppercase tracking-widest w-max">
              Total OT: ${overtimeEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] uppercase">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-black tracking-widest bg-gray-50">
                  <th className="p-4">Date</th>
                  <th className="p-4">Hours</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-right">Payoff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-bold text-gray-700">
                {MOCK_EXTRA_WORKING_HISTORY.map((log) => {
                  const segmentEarnings = log.hoursLogged * overtimeMultiplierRate;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 whitespace-nowrap">{log.date}</td>
                      <td className="p-4 font-mono text-gray-900 font-black">{log.hoursLogged}H</td>
                      <td className="p-4 max-w-xs truncate text-gray-400 normal-case">{log.description}</td>
                      <td className="p-4 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase shadow-sm">
                          +${segmentEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}