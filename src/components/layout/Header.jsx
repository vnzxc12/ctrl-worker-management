import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  Building2,
  AlertTriangle,
  Plus,
  CheckCircle2,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

export default function Header({ setIsMobileOpen }) {
  const { employees, sites, designations } = useData();
  const { currentUser, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter global search results
  const matchingEmployees = searchQuery.trim() === '' ? [] : employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.employeeNo} ${e.contactNo || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const matchingSites = searchQuery.trim() === '' ? [] : sites.filter(s =>
    `${s.name} ${s.code} ${s.location}`.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 3);

  // Calculate Document Expiry Alerts
  const today = new Date();
  const expiryAlerts = [];

  employees.forEach(emp => {
    (emp.documents || []).forEach(doc => {
      if (doc.expiryDate) {
        const exp = new Date(doc.expiryDate);
        const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          expiryAlerts.push({
            id: doc.id,
            employeeId: emp.id,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            docName: doc.name,
            status: 'Expired',
            days: Math.abs(diffDays),
            critical: true
          });
        } else if (diffDays <= 30) {
          expiryAlerts.push({
            id: doc.id,
            employeeId: emp.id,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            docName: doc.name,
            status: 'Expiring Soon',
            days: diffDays,
            critical: false
          });
        }
      }
    });
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      {/* Left side: Hamburger & Page Title / Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-slate-500 rounded-lg hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
          <span className="font-semibold text-slate-800 font-display">CTRL Construction Corp.</span>
          <span>/</span>
          <span className="capitalize font-medium text-brand-600">
            {location.pathname === '/' ? 'Workforce Dashboard' : location.pathname.replace('/', '').replace('-', ' ')}
          </span>
        </div>
      </div>

      {/* Middle & Right side */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
        {/* Global Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-[150px] xs:max-w-[180px] sm:max-w-xs lg:max-w-md">
          <div className="relative">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search workers, sites..."
              className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 text-xs sm:text-sm bg-slate-100/90 border border-slate-200/80 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Search Dropdown Results */}
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 sm:w-80 lg:w-96 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fadeIn">
              <div className="p-2 max-h-80 overflow-y-auto space-y-2">
                {matchingEmployees.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">Construction Workers</div>
                    {matchingEmployees.map(emp => (
                      <div
                        key={emp.id}
                        onClick={() => {
                          navigate(`/employees/${emp.id}`);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-brand-50 cursor-pointer transition-colors"
                      >
                        <img src={emp.photoUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                        <div className="truncate flex-1">
                          <div className="text-xs font-bold text-slate-800">{emp.firstName} {emp.lastName}</div>
                          <div className="text-[11px] text-slate-500">{emp.employeeNo}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {matchingSites.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">Construction Sites</div>
                    {matchingSites.map(site => (
                      <div
                        key={site.id}
                        onClick={() => {
                          navigate(`/sites/${site.id}`);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <Building2 className="w-4 h-4 text-brand-500 flex-shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-800">{site.name}</div>
                          <div className="text-[10px] text-slate-500">{site.code} - {site.location}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {matchingEmployees.length === 0 && matchingSites.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover (Document Expiry & Compliance) */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="Compliance & Expiration Alerts"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {expiryAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2 sm:h-2.5 sm:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-rose-600"></span>
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold font-display uppercase tracking-wider">Compliance Alerts ({expiryAlerts.length})</span>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-1">
                {expiryAlerts.length > 0 ? (
                  expiryAlerts.map(alert => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        navigate(`/employees/${alert.employeeId}`);
                        setIsNotificationsOpen(false);
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[11px] font-bold ${alert.critical ? 'text-red-600' : 'text-amber-600'}`}>
                          {alert.critical ? `⚠️ EXPIRED ${alert.days} days ago` : `⚠️ Expires in ${alert.days} days`}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-0.5">{alert.docName}</p>
                      <p className="text-[11px] text-slate-500">{alert.employeeName}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    All worker certificates and documents are up to date!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Hire Button */}
        {hasPermission('employees:write') && (
          <Link
            to="/employees?action=new"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Hire</span>
          </Link>
        )}

        {/* User Profile & Logout Dropdown */}
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.fullName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-500/20"
            />
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">{currentUser.fullName}</p>
              <p className="text-[10px] text-slate-400 leading-tight font-medium">HR Admin</p>
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 p-2 space-y-1">
              <div className="p-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{currentUser.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                  HR Admin Demo Session
                </span>
              </div>

              <Link
                to="/settings"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <span>System Settings</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
