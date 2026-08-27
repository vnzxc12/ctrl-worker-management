import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Banknote,
  Plus,
  Calendar,
  DollarSign,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  Lock,
  ArrowRight,
  Printer
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { formatCurrency, formatNumber } from '../lib/calculations';
import { downloadPayrollTemplate } from '../lib/exportExcel';

export default function Payroll() {
  const { payrollPeriods, createPayrollPeriod } = useData();
  const { hasPermission } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    periodName: 'September 1 – September 15, 2026 (Semi-Monthly)',
    periodType: 'Semi-Monthly',
    startDate: '2026-09-01',
    endDate: '2026-09-15',
    payoutDate: '2026-09-20'
  });

  const handleCreatePeriod = (e) => {
    e.preventDefault();
    if (!formData.periodName || !formData.startDate || !formData.endDate) {
      addToast('Please enter period name and dates', 'error');
      return;
    }

    const created = createPayrollPeriod(formData);
    addToast(`Generated payroll run: ${created.periodName} (${created.recordsCount} worker payslips computed)`, 'success');
    setIsCreateModalOpen(false);
    navigate(`/payroll/${created.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight">
            Payroll Management & Payslips
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Automated semi-monthly wage computations, SSS / PhilHealth / Pag-IBIG statutory deductions, BIR tax schedules, and project labor costing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => downloadPayrollTemplate()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm"
            title="Download Excel Import Template"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Payroll Template</span>
          </button>

          {hasPermission('payroll:write') && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 rounded-xl shadow-md shadow-brand-900/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Payroll Period</span>
            </button>
          )}
        </div>
      </div>

      {/* Payroll Periods List */}
      <div className="space-y-4">
        {payrollPeriods.map((period) => (
          <div
            key={period.id}
            onClick={() => navigate(`/payroll/${period.id}`)}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-card-hover hover:border-brand-200 transition-all p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 group"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-brand-50 text-brand-600 flex-shrink-0">
                  <Banknote className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display group-hover:text-brand-600 transition-colors">
                    {period.periodName}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                    <span>Type: <strong>{period.periodType}</strong></span>
                    <span>•</span>
                    <span>Payout: <strong>{period.payoutDate}</strong></span>
                    <span>•</span>
                    <span>Workers: <strong>{period.recordsCount || 0}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Highlights */}
            <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Total Gross</span>
                <p className="font-bold text-slate-800 font-mono">{formatCurrency(period.totalGross)}</p>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Deductions</span>
                <p className="font-bold text-rose-600 font-mono">- {formatCurrency(period.totalDeductions)}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[11px] font-medium">Net Disbursed</span>
                <p className="text-base font-extrabold text-emerald-600 font-mono">{formatCurrency(period.totalNet)}</p>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge status={period.status} size="sm" />
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create New Payroll Period Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Generate New Construction Payroll Run"
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreatePeriod}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-sm"
            >
              Generate & Calculate Period
            </button>
          </>
        }
      >
        <form onSubmit={handleCreatePeriod} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payroll Period Name *</label>
            <input
              type="text"
              required
              value={formData.periodName}
              onChange={(e) => setFormData({ ...formData, periodName: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payroll Cycle Type</label>
            <select
              value={formData.periodType}
              onChange={(e) => setFormData({ ...formData, periodType: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold"
            >
              <option value="Semi-Monthly">Semi-Monthly (1st-15th / 16th-End)</option>
              <option value="Monthly">Monthly</option>
              <option value="Weekly">Weekly (Construction Daily Wages)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payout Date *</label>
            <input
              type="date"
              required
              value={formData.payoutDate}
              onChange={(e) => setFormData({ ...formData, payoutDate: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            ℹ️ The engine will automatically compute wages, overtime, allowances, SSS, PhilHealth, Pag-IBIG, and tax schedules for all active workers based on current trade designations and attendance.
          </div>
        </form>
      </Modal>
    </div>
  );
}
