import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  HardHat,
  AlertTriangle,
  Banknote,
  Clock,
  ArrowRight,
  TrendingUp,
  UserPlus,
  FileSpreadsheet,
  FileCheck,
  Briefcase
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import StatCard from '../components/common/StatCard';
import { StatusBadge } from '../components/common/Badge';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatNumber } from '../lib/calculations';

export default function Dashboard() {
  const { employees, sites, designations, payrollPeriods, auditLogs } = useData();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  // Metrics Calculation
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const inactiveEmployees = totalEmployees - activeEmployees;
  const siteAssignedEmployees = employees.filter(e => e.status === 'Active' && e.currentSiteId).length;
  const unassignedEmployees = employees.filter(e => e.status === 'Active' && !e.currentSiteId).length;

  // Document Expiry Alerts
  const today = new Date();
  let expiredDocsCount = 0;
  let expiringSoonCount = 0;

  employees.forEach(emp => {
    (emp.documents || []).forEach(doc => {
      if (doc.expiryDate) {
        const diffDays = Math.ceil((new Date(doc.expiryDate) - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) expiredDocsCount++;
        else if (diffDays <= 30) expiringSoonCount++;
      }
    });
  });

  // Chart Data 1: Workforce by Construction Site
  const siteDistributionData = sites.map(site => {
    const workerCount = employees.filter(e => e.currentSiteId === site.id && e.status === 'Active').length;
    return {
      name: site.code,
      fullName: site.name,
      workers: workerCount,
    };
  });

  if (unassignedEmployees > 0) {
    siteDistributionData.push({
      name: 'Unassigned',
      fullName: 'Pool Reserve / Head Office',
      workers: unassignedEmployees
    });
  }

  // Chart Data 2: Workforce by Trade / Category
  const categoryCounts = {};
  employees.forEach(emp => {
    const des = designations.find(d => d.id === emp.designationId);
    const category = des ? des.category : 'General Construction';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  const categoryPieData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value
  }));

  const PIE_COLORS = ['#E63917', '#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#64748B'];

  // Latest Payroll Summary
  const currentPeriod = payrollPeriods[0] || {};

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-850 to-brand-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold">
              <HardHat className="w-3.5 h-3.5" />
              Construction Workforce Intelligence
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              CTRL Construction HR Operations
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Real-time site deployments, trade skills compliance, daily timekeeping, and payroll processing for {totalEmployees} construction personnel across {sites.length} active project sites.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {hasPermission('employees:write') && (
              <button
                onClick={() => navigate('/employees?action=new')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-brand-900/30 transition-all hover:scale-[1.02]"
              >
                <UserPlus className="w-4 h-4" />
                <span>Onboard Worker</span>
              </button>
            )}

            {hasPermission('payroll:write') && (
              <button
                onClick={() => navigate('/payroll')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold border border-slate-700 transition-all"
              >
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span>Process Payroll</span>
              </button>
            )}

            <button
              onClick={() => navigate('/attendance')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold border border-slate-700 transition-all"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Time Logs</span>
            </button>
          </div>
        </div>

        {/* Decorative Construction Pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Workforce"
          value={formatNumber(totalEmployees)}
          subtitle={`${activeEmployees} Active | ${inactiveEmployees} Inactive/Leave`}
          icon={Users}
          color="brand"
          onClick={() => navigate('/employees')}
        />

        <StatCard
          title="Site Deployments"
          value={formatNumber(siteAssignedEmployees)}
          subtitle={`${unassignedEmployees} unassigned pool`}
          icon={Building2}
          color="emerald"
          onClick={() => navigate('/sites')}
        />

        <StatCard
          title="Document Expirations"
          value={expiredDocsCount + expiringSoonCount}
          subtitle={`${expiredDocsCount} Expired | ${expiringSoonCount} in 30 days`}
          icon={AlertTriangle}
          color={expiredDocsCount > 0 ? 'rose' : 'amber'}
          onClick={() => navigate('/reports')}
        />

        <StatCard
          title="Latest Payroll"
          value={formatCurrency(currentPeriod.totalNet || 0)}
          subtitle={`Status: ${currentPeriod.status || 'Draft'} (${currentPeriod.recordsCount || 0} payslips)`}
          icon={Banknote}
          color="blue"
          onClick={() => navigate('/payroll')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workforce by Construction Site (Bar Chart) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">Workforce Deployment by Site</h2>
              <p className="text-xs text-slate-500">Live active personnel stationed across project locations</p>
            </div>
            <Link to="/sites" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              View Sites <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={siteDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value, name, props) => [`${value} Workers`, props.payload.fullName]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="workers" fill="#E63917" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trade / Discipline Breakdown (Pie Chart) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-slate-900 font-display">Workers by Trade Category</h2>
              <Link to="/designations" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                Trades
              </Link>
            </div>
            <p className="text-xs text-slate-500 mb-4">Distribution by structural, civil, MEP, and management</p>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} Personnel`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-100 text-xs">
            {categoryPieData.slice(0, 4).map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-slate-600 truncate">{cat.name} ({cat.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Additions / Audit Stream & Project Sites Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Construction Sites List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 font-display">Active Construction Projects</h2>
            <Link to="/sites" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Manage Sites →
            </Link>
          </div>

          <div className="space-y-3">
            {sites.map(site => {
              const assigned = employees.filter(e => e.currentSiteId === site.id && e.status === 'Active').length;
              return (
                <div
                  key={site.id}
                  onClick={() => navigate(`/sites/${site.id}`)}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-300 transition-all cursor-pointer flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        {site.code}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800">{site.name}</h4>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-sm">{site.location}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-extrabold text-slate-900 font-display">{assigned} Workers</div>
                    <StatusBadge status={site.status} size="xs" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit Stream / Recent Activities */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 font-display">Recent System & HR Audit Stream</h2>
            <Link to="/settings" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Audit Logs →
            </Link>
          </div>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {auditLogs.slice(0, 5).map(log => (
              <div key={log.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-brand-50 text-brand-600 flex-shrink-0 mt-0.5">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-800">{log.action}</p>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-0.5">
                    {log.userName} ({log.userRole})
                  </p>
                  {log.details && (
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {JSON.stringify(log.details).replace(/["{}]/g, ' ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
