import { useNavigate, useLocation } from 'react-router-dom';

export default function AdminSidebar({ activeModule, setActiveModule }) {
    const navigate = useNavigate();
    const location = useLocation();

    // Full unified navigation matrix mapping all administrative nodes
    const navItems = [
        {
            id: 'profile',
            label: 'Profile',
            icon: '👤',
            path: '/admin/Profile'
        },
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: '📊',
            path: '/admin/Dashboard'
        },
        {
            id: 'onboard',
            label: 'Onboard Staff',
            icon: '👥',
            path: '/admin/CreateUser'
        },
        {
            id: 'salary',
            label: 'Payroll',
            icon: '💵',
            path: '/admin/SalaryManagement'
        },
        {
            id: 'attendance',
            label: 'Staff Attendance',
            icon: '📋',
            path: '/admin/AttendanceManagement'
        },
        {
            id: 'leaves',
            label: 'Review Leaves',
            icon: '📅',
            path: '/admin/LeaveAcceptance'
        },
        
    ];

    const handleNavigation = (id, path) => {
        if (setActiveModule) {
            setActiveModule(id);
        } else {
            navigate(path); 
        }
    };

    const handleLogout = () => {
        localStorage.clear(); 
        navigate('/');
    };

    return (
        <aside className="w-full md:w-64 h-screen sticky top-0 bg-white dark:bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800/60 flex flex-col justify-between p-4 md:p-6 transition-colors duration-200 flex-shrink-0 z-30 select-none">

            {/* Top Identity Hub */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-2 py-1">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-800 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-indigo-100 dark:shadow-none">
                        AM
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">Company name</h2>
                        <span className="text-[10px] font-bold text-gray-400 font-mono mt-1 block tracking-tighter">Since-3220</span>
                    </div>
                </div>

                {/* Dynamic Navigation Options Loop */}
                <nav className="space-y-1">
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-3">
                        Admin Access
                    </span>
                    {navItems.map((item) => {
                        // Evaluates active routing context using path matching structures
                        const isSelected = activeModule === item.id || location.pathname === item.path;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleNavigation(item.id, item.path)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-150 border ${isSelected
                                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30 shadow-sm'
                                        : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/40 hover:text-gray-900 dark:hover:text-zinc-200 border-transparent'
                                    }`}
                            >
                                <span className="text-lg leading-none">{item.icon}</span>
                                <span className="tracking-tight">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Profile Shortcut / Quick Logout Anchor */}
            <div className="pt-4 border-t border-gray-100 dark:border-zinc-800/80 mt-4 md:mt-0">
                <div
                    onClick={handleLogout}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800/40 shadow-sm hover:bg-gray-100 dark:hover:bg-zinc-900 transition-all group cursor-pointer"
                    title="Click to Logout"
                >
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs font-black font-mono shadow-md shadow-indigo-100 dark:shadow-none">
                            A
                        </div>
                        <div className="text-left">
                            <span className="block text-xs font-black text-gray-900 dark:text-zinc-200 leading-none">Root</span>
                            <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-tighter mt-0.5 block">CEO / Admin</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="p-1.5 rounded-lg text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 group-hover:bg-red-50 dark:group-hover:bg-red-950/30 transition-all text-sm hover:shadow-sm"
                        title="Secure Logout"
                    >
                        🚪
                    </button>
                </div>
            </div>

        </aside>
    );
}