import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  Banknote,
  Menu
} from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const mobileNavItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Workers', path: '/employees', icon: Users },
    { name: 'Sites', path: '/sites', icon: Building2 },
    { name: 'Time', path: '/attendance', icon: Clock },
    { name: 'Payroll', path: '/payroll', icon: Banknote },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-brand-500 selection:text-white">
      {/* Sidebar */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Content Area (Offset by sidebar width on desktop) */}
      <div className="flex-1 flex flex-col lg:pl-64 transition-all duration-300 min-w-0">
        {/* Top Header */}
        <Header setIsMobileOpen={setIsMobileOpen} />

        {/* Page Main Content with padding bottom on mobile for the bottom bar */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 lg:pb-8 animate-fadeIn">
          <Outlet />
        </main>

        {/* Official Footer with Product Credit */}
        <footer className="py-4 px-4 sm:px-6 bg-white border-t border-slate-200/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto mb-14 lg:mb-0">
          <div className="flex items-center gap-2 text-center sm:text-left flex-wrap justify-center">
            <span className="font-bold text-slate-700 font-display">CTRL Construction HR Management</span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-slate-400">Enterprise Workforce & Payroll v2.6</span>
          </div>
          <div className="text-slate-500 font-medium text-center sm:text-right">
            A product by <span className="font-bold text-brand-600">VCS Technologies</span>
          </div>
        </footer>
      </div>

      {/* Mobile Bottom Navigation Bar (High Polish 1-Thumb Touch Dock) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 lg:hidden px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-brand-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] tracking-tight">{item.name}</span>
              </NavLink>
            );
          })}

          {/* More / Menu Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
          >
            <Menu className="w-5 h-5 mb-0.5 stroke-2" />
            <span className="text-[10px] tracking-tight">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
