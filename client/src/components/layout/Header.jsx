import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Menu, Bell, LogOut, User, ChevronDown } from 'lucide-react';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/wallets': 'Wallets',
  '/transactions': 'Transactions',
  '/transfer': 'Transfer',
  '/notifications': 'Notifications',
  '/audit-log': 'Activity Log',
  '/profile': 'Profile & Security',
  '/admin': 'Admin Dashboard',
  '/admin/users': 'Manage Users',
  '/admin/wallets': 'Manage Wallets',
  '/admin/transactions': 'Manage Transactions',
  '/admin/audit-logs': 'Audit Logs',
};

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Determine page title from path
  const getPageTitle = () => {
    // Check exact match first
    if (pageTitles[location.pathname]) return pageTitles[location.pathname];
    // Check dynamic routes
    if (location.pathname.startsWith('/wallets/') && location.pathname.includes('/transact'))
      return 'Deposit / Withdraw';
    if (location.pathname.startsWith('/wallets/')) return 'Wallet Detail';
    if (location.pathname.startsWith('/transactions/')) return 'Transaction Detail';
    return 'FinVault';
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 sm:px-6">
      {/* Left: menu + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-white">{getPageTitle()}</h1>
      </div>

      {/* Right: notifications + profile */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span className="hidden sm:inline">{user?.name || 'User'}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-48 rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl">
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/profile');
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <User className="h-4 w-4" />
                Profile
              </button>
              <div className="my-1 border-t border-slate-700/50" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
