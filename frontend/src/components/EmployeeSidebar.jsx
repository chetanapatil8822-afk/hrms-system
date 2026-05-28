import { useNavigate, useLocation } from 'react-router-dom'; // Using React Router Dom hooks

export default function EmployeeSidebar({ activeModule, setActiveModule }) {
  const navigate = useNavigate(); // Standard React Router redirect hook
  const location = useLocation(); // Hook to get current active browser URL path

  // Navigation tracking items
  const navItems = [
    {
      id: 'profile',
      label: 'Profile',
      icon: '🪪',
      path: '/employee/profile'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      path: '/employee/dashboard'
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: '📋',
      path: '/employee/attendance'
    },
    {
      id: 'leave',
      label: 'Apply for Leave',
      icon: '📅',
      path: '/employee/leave'
    },
  ];

  const handleNavigation = (id, path) => {
    if (setActiveModule) {
      setActiveModule(id);
    } else {
      navigate(path); // Standard React Router SPA navigation shift
    }
  };

  const handleLogout = () => {
    localStorage.clear(); // Clear local credentials contexts automatically on exit
    navigate('/');
  };

  return (
    /* FIXED: Added h-screen, sticky, and top-0 to keep the layout from shifting or sliding vertically */
    <aside className="w-full md:w-64 h-screen sticky top-0 bg-white dark:bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800/60 flex flex-col justify-between p-4 md:p-6 transition-colors duration-200 flex-shrink-0 z-30">
      
      {/* Top Section: Corporate Brand & App Label */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-800 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-indigo-100 dark:shadow-none">
            HR
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">Employee Portal</h2>
            <span className="text-[10px] font-bold text-gray-400 font-mono mt-1 block tracking-tighter">v3.0.0-FLASH</span>
          </div>
        </div>

        {/* Navigation Core List Blocks */}
        <nav className="space-y-1">
          <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-3">
            Employee Core
          </span>
          {navItems.map((item) => {
            // Check if selected using React Router location pathname property
            const isSelected = activeModule === item.id || location.pathname === item.path;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigation(item.id, item.path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-150 ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 shadow-sm'
                    : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/40 hover:text-gray-900 dark:hover:text-zinc-200 border border-transparent'
                }`}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span className="tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Profile Shortcut / Quick Logout */}
      <div className="pt-4 border-t  border-gray-100 dark:border-zinc-800/80 mt-4 md:mt-0">
        <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-gray-200 dark:border-zinc-800/40 shadow-sm"onClick={handleLogout} style={{ cursor: 'pointer' }} type="button" title="Click to Logout">
          <div className="flex items-center gap-2.5 " >
            <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs font-black font-mono shadow-md shadow-indigo-100 dark:shadow-none">
              Y
            </div>
            <div className="text-left">
              <span className="block text-xs font-black text-gray-900 dark:text-zinc-200 leading-none">Yash</span>
              <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-tighter">Employee</span>
            </div>
          </div>
          <button 
            type="button"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all text-sm hover:shadow-sm"
            title="Secure Logout"
          >
            🚪
          </button>
        </div>
      </div>

    </aside>
  );
}