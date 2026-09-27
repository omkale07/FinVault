import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  SendHorizontal,
  Bell,
  Activity,
  User,
  Shield,
  X,
  Landmark,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const userNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/wallets', label: 'Wallets', icon: Wallet },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/transfer', label: 'Transfer', icon: SendHorizontal },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/audit-log', label: 'Activity', icon: Activity },
  { to: '/profile', label: 'Profile', icon: User },
];

const adminNavItems = [
  { to: '/admin', label: 'Admin Dashboard', icon: Shield, exact: true },
  { to: '/admin/users', label: 'Users', icon: User },
  { to: '/admin/wallets', label: 'Wallets', icon: Wallet },
  { to: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: Activity },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-300 lg:static lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Logo / Brand */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
            <Landmark className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            FinVault
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Menu
        </div>
        <ul className="space-y-0.5">
          {userNavItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                  )
                }
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Admin section */}
        {isAdmin && (
          <>
            <div className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Admin
            </div>
            <ul className="space-y-0.5">
              {adminNavItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.exact}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                      )
                    }
                  >
                    <item.icon className="h-4.5 w-4.5 shrink-0" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* User info footer */}
      <div className="border-t border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {user?.name || 'User'}
            </p>
            <p className="truncate text-xs text-slate-500">
              {user?.email || ''}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
