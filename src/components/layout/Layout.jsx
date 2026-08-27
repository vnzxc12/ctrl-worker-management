import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Sidebar */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Content Area (Offset by sidebar width on desktop) */}
      <div className="flex-1 flex flex-col lg:pl-64 transition-all duration-300">
        {/* Top Header */}
        <Header setIsMobileOpen={setIsMobileOpen} />

        {/* Page Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          <Outlet />
        </main>

        {/* Official Footer with Product Credit */}
        <footer className="py-4 px-6 bg-white border-t border-slate-200/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 font-display">CTRL Construction HR Management</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400">Enterprise Workforce & Payroll v2.6</span>
          </div>
          <div className="text-slate-500 font-medium">
            A product by <span className="font-bold text-brand-600">VCS Technologies</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
