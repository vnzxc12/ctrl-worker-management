import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  HardHat,
  Clock,
  Banknote,
  FileBarChart2,
  Settings,
  Shield,
  LogOut,
  Sparkles,
  Smartphone
} from 'lucide-react';
import Logo from '../../assets/Logo';
import { useAuth } from '../../context/AuthContext';
import { usePWA } from '../../context/PWAContext';

export default function Sidebar({ isMobileOpen, setIsMobileOpen }) {
  const { currentUser, logout } = useAuth();
  const { promptInstall, isInstalled } = usePWA();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Sites & Projects', path: '/sites', icon: Building2 },
    { name: 'Designations', path: '/designations', icon: HardHat },
    { name: 'Attendance & Logs', path: '/attendance', icon: Clock },
    { name: 'Payroll & Payslips', path: '/payroll', icon: Banknote },
    { name: 'Reports & Analytics', path: '/reports', icon: FileBarChart2 },
    { name: 'System Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 sm:w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-18 px-5 border-b border-slate-800/80 bg-slate-950/40">
          <NavLink to="/" className="flex items-center gap-2" onClick={() => setIsMobileOpen(false)}>
            <Logo variant="full" size="default" light={true} />
          </NavLink>

          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Close navigation"
          >
            <span className="text-xl font-bold leading-none">✕</span>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Workforce Management
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-md shadow-brand-900/40 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Install from Browser Button in Sidebar */}
        {!isInstalled && (
          <div className="px-3 pb-2">
            <button
              type="button"
              onClick={promptInstall}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 shadow-md shadow-brand-900/40 transition-all hover:scale-[1.02]"
            >
              <Smartphone className="w-4 h-4" />
              <span>Install Web App</span>
            </button>
          </div>
        )}

        {/* Demo Account Badge & Logout Section */}
        <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-400" />
              Demo Session
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              HR Admin
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <img
              src={currentUser.avatar}
              alt={currentUser.fullName}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-brand-500/40"
            />
            <div className="truncate flex-1 min-w-0">
              <p className="font-bold text-white text-xs truncate">{currentUser.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out to Login</span>
          </button>
        </div>
      </aside>
    </>
  );
}
