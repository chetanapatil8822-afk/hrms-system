import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const inputBaseStyles = "w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm";
const labelStyles = "block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2";

// ==========================================
// 1. EMPLOYEE & HR LOGIN COMPONENT (Shared Tab)
// ==========================================
function EmployeeLogin({ onLoginStart, onLoginSuccess, onLoginError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    onLoginStart();

    try {
      // 👇 CHANGE 1: Removed 
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'employee' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      onLoginSuccess(data.token, data.role);
    } catch (err) {
      onLoginError(err.message);
    }
  };

  return (
    <form className="space-y-5 animate-fadeIn" onSubmit={handleSubmit}>
      <div>
        <label className={labelStyles}>Work Email</label>
        <input
          type="email"
          placeholder="name@company.com"
          className={`${inputBaseStyles} focus:ring-indigo-700 focus:border-indigo-700`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className={labelStyles}>Password</label>
        <input
          type="password"
          placeholder="••••••••"
          className={`${inputBaseStyles} focus:ring-indigo-700 focus:border-indigo-700`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]" type='submit' >
        Login
      </button>
    </form>
  );
}

// ==========================================
// 2. ADMIN LOGIN COMPONENT
// ==========================================
function AdminLogin({ onLoginStart, onLoginSuccess, onLoginError }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    onLoginStart();

    try {
      // 👇 CHANGE 2: Removed 
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'admin' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      onLoginSuccess(data.token, 'admin');
    } catch (err) {
      onLoginError(err.message);
    }
  };

  return (
    <form className="space-y-5 animate-fadeIn" onSubmit={handleSubmit}>
      <div>
        <label className={labelStyles}>Admin Email</label>
        <input
          type="email"
          placeholder="admin@company.com"
          className={`${inputBaseStyles} focus:ring-indigo-700 focus:border-indigo-700`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className={labelStyles}>Password</label>
        <input
          type="password"
          placeholder="••••••••••••"
          className={`${inputBaseStyles} focus:ring-indigo-700 focus:border-indigo-700`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <button className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]" type="submit">
          Login
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/signup')}
          className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold py-3 rounded-xl transition-all text-xs uppercase tracking-wider border border-indigo-200 shadow-sm"
        >
          Create Admin Account (Sign Up) →
        </button>
      </div>
    </form>
  );
}

// ==========================================
// 3. SUPER ADMIN LOGIN COMPONENT
// ==========================================
function SuperAdminLogin({ onLoginStart, onLoginSuccess, onLoginError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    onLoginStart();

    try {
      // 👇 CHANGE 3: Removed 
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'superadmin' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      onLoginSuccess(data.token, 'superadmin');
    } catch (err) {
      onLoginError(err.message);
    }
  };

  return (
    <form className="space-y-5 animate-fadeIn" onSubmit={handleSubmit}>
      <div>
        <label className={labelStyles}>Email</label>
        <input
          type="email"
          placeholder="ceo@company.com"
          className={`${inputBaseStyles} focus:ring-indigo-700 focus:border-indigo-700`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className={labelStyles}>Password</label>
        <input
          type="password"
          placeholder="••••••••••••••••"
          className={`${inputBaseStyles} focus:ring-indigo-700 focus:border-indigo-700`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]" type="submit">
        Login
      </button>
    </form>
  );
}

// ==========================================
// MAIN GATEWAY PAGE
// ==========================================
export default function LoginGateway() {
  const [activeTab, setActiveTab] = useState('employee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const accents = {
    employee: 'from-blue-700 to-indigo-800',
    admin: 'from-blue-700 to-indigo-800',
    superadmin: 'from-blue-700 to-indigo-800'
  };

  const titles = {
    employee: 'Employee & HR Login',
    admin: 'Admin Login',
    superadmin: 'Super Admin Access'
  };

  const handleLoginStart = () => {
    setLoading(true);
    setError('');
  };

  const handleLoginSuccess = (token, role) => {
    setLoading(false);

    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', role);

    if (role === 'employee') {
      navigate('/employee/profile'); 
    } else if (role === 'hr') {
      navigate('/hr/profile');
    } else if (role === 'admin') {
      navigate('/admin/Profile');
    } else if (role === 'superadmin') {
      navigate('/superadmin/dashboard');
    } else {
      navigate('/');
    }
  };

  const handleLoginError = (errorMessage) => {
    setLoading(false);
    setError(errorMessage);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 transition-colors duration-500">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 p-8 relative overflow-hidden">

        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r transition-all duration-500 ${accents[activeTab]}`} />
        <img src="/logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-4" />
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {titles[activeTab]}
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Please enter your credentials below</p>
        </div>

        {/* Tab Switchers */}
        <div className="grid grid-cols-3 gap-1 p-1.5 bg-gray-100 rounded-2xl mb-6 border border-gray-200">
          {[
            { id: 'employee', label: 'Employee / HR' },
            { id: 'admin', label: 'Admin' },
            { id: 'superadmin', label: 'Super Admin' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setError('');
              }}
              className={`py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-md transform scale-105'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl animate-fadeIn">
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div className="text-center text-xs font-bold text-gray-400 my-2 animate-pulse">
            Authenticating credentials...
          </div>
        )}

        <div className={loading ? "opacity-50 pointer-events-none transition-opacity duration-200" : ""}>
          {activeTab === 'employee' && (
            <EmployeeLogin
              onLoginStart={handleLoginStart}
              onLoginSuccess={handleLoginSuccess}
              onLoginError={handleLoginError}
            />
          )}
          {activeTab === 'admin' && (
            <AdminLogin
              onLoginStart={handleLoginStart}
              onLoginSuccess={handleLoginSuccess}
              onLoginError={handleLoginError}
            />
          )}
          {activeTab === 'superadmin' && (
            <SuperAdminLogin
              onLoginStart={handleLoginStart}
              onLoginSuccess={handleLoginSuccess}
              onLoginError={handleLoginError}
            />
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Encryption Active • SSL Secured
          </p>
        </div>
      </div>
    </div>
  );
}