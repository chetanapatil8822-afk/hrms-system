import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginGateway from './login';
import AdminSignup from './admin/AdminSignup';
import UpgradePlan from './UpgradePlan';

// Employee View Components
import EmployeeDashboard from './employee/dashboard';
import EmployeeProfile from './employee/profile';
import AttendancePage from './employee/attendance';
import LeavePage from './employee/leave';


import HRDashboard from './hr/dashboard';
import HRProfile from './hr/profile';
import HRLeavePage from './hr/leave';
import HRAttendance from './hr/attendance';
import HrCreateUser from './hr/CreateUser';

// Admin View Components
import AdminDashboard from './admin/Dashboard';
import AdminCreateUser from './admin/CreateUser';
import AdminSalaryManagement from './admin/SalaryManagement';
import AdminLeaveAcceptance from './admin/LeaveAcceptance';
import AdminAttendanceManagement from './admin/AttendanceManagement';
import AdminProfile from './admin/Profile';

// Super Admin View Components
import SuperAdminDashboard from './superadmin/SuperAdminDashboard';

function RoleGuard({ children, allowedRoles }) {
  const token = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole'); 
  
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 2. If role is not explicitly authorized for this route group, redirect to their home space
  if (!allowedRoles.includes(userRole)) {
    if (userRole === 'employee') return <Navigate to="/employee/dashboard" replace />;
    if (userRole === 'hr') return <Navigate to="/hr/dashboard" replace />;
    if (userRole === 'admin') return <Navigate to="/admin/Dashboard" replace />;
    if (userRole === 'superadmin') return <Navigate to="/superadmin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  // 3. Authorization cleared -> Render target component views safely
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Entry Gateway */}
        <Route path="/" element={<LoginGateway />} />
        <Route path="/admin/signup" element={<AdminSignup />} />
        <Route path="/admin/upgrade" element={<UpgradePlan />} />

        {/* =========================================================
            🔒 SECURE EMPLOYEE WORKSPACE (Only users with 'employee' role status)
           ========================================================= */}
        <Route path="/employee/dashboard" element={
          <RoleGuard allowedRoles={['employee']}>
            <EmployeeDashboard />
          </RoleGuard>
        } />
        <Route path="/employee/profile" element={
          <RoleGuard allowedRoles={['employee']}>
            <EmployeeProfile />
          </RoleGuard>
        } />
        <Route path="/employee/attendance" element={
          <RoleGuard allowedRoles={['employee']}>
            <AttendancePage />
          </RoleGuard>
        } />
        <Route path="/employee/leave" element={
          <RoleGuard allowedRoles={['employee']}>
            <LeavePage />
          </RoleGuard>
        } />

        {/* =========================================================
            🔒 SECURE HR WORKSPACE (Only users with 'hr' role status)
           ========================================================= */}
        <Route path="/hr/dashboard" element={
          <RoleGuard allowedRoles={['hr']}>
            <HRDashboard />
          </RoleGuard>
        } />
        <Route path="/hr/profile" element={
          <RoleGuard allowedRoles={['hr']}>
            <HRProfile />
          </RoleGuard>
        } />
        <Route path="/hr/leave" element={
          <RoleGuard allowedRoles={['hr']}>
            <HRLeavePage />
          </RoleGuard>
        } />
        <Route path="/hr/attendance" element={
          <RoleGuard allowedRoles={['hr']}>
            <HRAttendance />
          </RoleGuard>
        } />
        <Route path="/hr/create-user" element={
          <RoleGuard allowedRoles={['hr']}>
            <HrCreateUser />
          </RoleGuard>
        } />

        {/* =========================================================
            🔒 SECURE ADMIN WORKSPACE (Only users with 'admin' token context)
           ========================================================= */}
        <Route path="/admin/Profile" element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminProfile />
          </RoleGuard>
        } />
        <Route path="/admin/Dashboard" element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminDashboard />
          </RoleGuard>
        } />
        <Route path="/admin/CreateUser" element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminCreateUser />
          </RoleGuard>
        } />
        <Route path="/admin/SalaryManagement" element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminSalaryManagement />
          </RoleGuard>
        } />
        <Route path="/admin/LeaveAcceptance" element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminLeaveAcceptance />
          </RoleGuard>
        } />
        <Route path="/admin/AttendanceManagement" element={
          <RoleGuard allowedRoles={['admin']}>
            <AdminAttendanceManagement />
          </RoleGuard>
        } />

        {/* =========================================================
            🔒 SECURE SUPER ADMIN WORKSPACE (God Mode)
           ========================================================= */}
        <Route path="/superadmin/dashboard" element={
          <RoleGuard allowedRoles={['superadmin']}>
            <SuperAdminDashboard />
          </RoleGuard>
        } />

        {/* Fallback Catch-All Safety Net Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}