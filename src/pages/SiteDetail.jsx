import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  HardHat,
  MapPin,
  Calendar,
  DollarSign,
  ArrowLeft,
  Briefcase,
  UserCheck,
  TrendingUp,
  Plus,
  Eye,
  FileText
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/Badge';
import { formatCurrency, formatNumber } from '../lib/calculations';

export default function SiteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { sites, employees, designations } = useData();
  const { hasPermission } = useAuth();
  const { addToast } = useToast();

  const site = sites.find(s => s.id === id);

  const desMap = useMemo(() => Object.fromEntries(designations.map(d => [d.id, d.name])), [designations]);

  if (!site) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Construction Site Not Found</h2>
        <Link to="/sites" className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white font-bold rounded-lg text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Project Sites
        </Link>
      </div>
    );
  }

  // Active personnel stationed at this site
  const sitePersonnel = employees.filter(e => e.currentSiteId === site.id && e.status === 'Active');

  // Breakdown by Trade / Designation
  const craftBreakdown = {};
  sitePersonnel.forEach(emp => {
    const craft = desMap[emp.designationId] || 'Other Craft';
    if (!craftBreakdown[craft]) {
      craftBreakdown[craft] = { count: 0, workers: [] };
    }
    craftBreakdown[craft].count += 1;
    craftBreakdown[craft].workers.push(emp);
  });

  // Calculate Total Estimated Monthly Labor Cost for this project (Requirement #20)
  const totalMonthlyLaborCost = sitePersonnel.reduce((sum, e) => {
    const monthlyRate = e.salaryType === 'Monthly' ? e.basicRate : e.salaryType === 'Daily' ? e.basicRate * 26 : e.basicRate * 26 * 8;
    return sum + monthlyRate;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link to="/sites" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to All Project Sites
        </Link>
        <StatusBadge status={site.status} size="lg" />
      </div>

      {/* Site Hero Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-500 text-white">
                {site.code}
              </span>
              <span className="text-xs text-slate-500 font-medium">Project: {site.projectName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {site.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <MapPin className="w-4 h-4 text-brand-500" />
              <span>{site.location}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">Client: <strong>{site.client}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasPermission('employees:write') && (
              <button
                onClick={() => navigate('/employees')}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-sm"
              >
                <Plus className="w-4 h-4" /> Deploy Personnel Here
              </button>
            )}
          </div>
        </div>

        {/* Highlight Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 font-medium block">Stationed Workforce</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Users className="w-4 h-4 text-brand-500" />
              <span className="text-lg font-extrabold text-slate-900 font-display">{sitePersonnel.length} Workers</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 font-medium block">Total Monthly Labor Cost</span>
            <p className="text-lg font-extrabold text-brand-600 font-mono mt-1">{formatCurrency(totalMonthlyLaborCost)}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 font-medium block">Project Manager</span>
            <p className="text-sm font-bold text-slate-900 mt-1 truncate">{site.projectManager || 'N/A'}</p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 font-medium block">Site Supervisor / Foreman</span>
            <p className="text-sm font-bold text-slate-900 mt-1 truncate">{site.siteSupervisor || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Labor Allocation by Craft / Designation (Requirement #20) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Craft Summary Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">Craft & Trade Distribution</h2>
            <p className="text-xs text-slate-500">Breakdown of trade skills stationed at {site.code}</p>
          </div>

          <div className="space-y-2">
            {Object.entries(craftBreakdown).length > 0 ? (
              Object.entries(craftBreakdown).map(([craft, data]) => (
                <div key={craft} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-brand-500" />
                    <span className="text-xs font-bold text-slate-800">{craft}</span>
                  </div>
                  <span className="text-xs font-mono font-extrabold px-2.5 py-0.5 bg-white rounded-lg border border-slate-200 text-slate-900">
                    {data.count} {data.count === 1 ? 'worker' : 'workers'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No personnel currently stationed at this site.</p>
            )}
          </div>
        </div>

        {/* Stationed Personnel Roster */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">Active Site Workforce Roster</h2>
              <p className="text-xs text-slate-500">{sitePersonnel.length} active construction personnel</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                  <th className="py-2.5 px-3">Worker & ID</th>
                  <th className="py-2.5 px-3">Designation</th>
                  <th className="py-2.5 px-3">Supervisor / Crew</th>
                  <th className="py-2.5 px-3">Rate</th>
                  <th className="py-2.5 px-3 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sitePersonnel.length > 0 ? (
                  sitePersonnel.map(emp => (
                    <tr
                      key={emp.id}
                      onClick={() => navigate(`/employees/${emp.id}`)}
                      className="hover:bg-slate-50 cursor-pointer group"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img src={emp.photoUrl} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200" />
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-brand-600">
                              {emp.firstName} {emp.lastName}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">{emp.employeeNo}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {desMap[emp.designationId] || 'Unassigned'}
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        <div>{emp.supervisor || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400">{emp.crewName}</div>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {formatCurrency(emp.basicRate)} <span className="font-sans text-[10px] text-slate-500 font-normal">/{emp.salaryType.toLowerCase()}</span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className="p-1 text-slate-400 hover:text-brand-600 inline-block">
                          <Eye className="w-4 h-4" />
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No active workers assigned to this site.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
