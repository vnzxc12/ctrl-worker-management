import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Banknote,
  Download,
  Upload,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Search,
  Building2,
  HardHat,
  Printer,
  Edit2,
  FileSpreadsheet,
  AlertCircle,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatCurrency, formatNumber, computeEmployeePayroll } from '../lib/calculations';
import { exportPayrollToExcel, parseExcelFile } from '../lib/exportExcel';
import { generatePayslipPDF } from '../lib/pdfGenerator';

export default function PayrollPeriodDetail() {
  const { periodId } = useParams();
  const navigate = useNavigate();
  const {
    payrollPeriods,
    payrollRecords,
    employees,
    sites,
    designations,
    companyProfile,
    govtRules,
    updatePayrollRecord,
    approvePayrollPeriod,
    markPayrollPaid,
    importBatchPayroll
  } = useData();

  const { currentUser, hasPermission } = useAuth();
  const { addToast } = useToast();

  const period = payrollPeriods.find(p => p.id === periodId);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [siteFilter, setSiteFilter] = useState('ALL');

  // Edit Single Record State
  const [editingRecord, setEditingRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Excel Payroll Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [validationSummary, setValidationSummary] = useState(null);

  // Maps
  const empMap = useMemo(() => Object.fromEntries(employees.map(e => [e.id, e])), [employees]);
  const empNoMap = useMemo(() => Object.fromEntries(employees.map(e => [e.employeeNo.toLowerCase(), e])), [employees]);
  const siteMap = useMemo(() => Object.fromEntries(sites.map(s => [s.id, s.name])), [sites]);
  const desMap = useMemo(() => Object.fromEntries(designations.map(d => [d.id, d.name])), [designations]);

  if (!period) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Payroll Period Not Found</h2>
        <Link to="/payroll" className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white font-bold rounded-lg text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Payroll Periods
        </Link>
      </div>
    );
  }

  // Filter records belonging to this period
  const currentRecords = payrollRecords.filter(r => r.periodId === period.id);

  const filteredRecords = currentRecords.filter(rec => {
    const emp = empMap[rec.employeeId];
    const name = emp ? `${emp.firstName} ${emp.lastName} ${emp.employeeNo}` : rec.employeeName || '';
    const matchSearch = search.trim() === '' || name.toLowerCase().includes(search.toLowerCase());
    const matchSite = siteFilter === 'ALL' || rec.siteId === siteFilter;
    return matchSearch && matchSite;
  });

  // Calculate Labor Cost per Project for this Period (Requirement #20)
  const projectLaborCosts = {};
  currentRecords.forEach(rec => {
    const siteObj = sites.find(s => s.id === rec.siteId);
    const siteName = siteObj ? siteObj.name : 'Unassigned / HQ';
    if (!projectLaborCosts[siteName]) {
      projectLaborCosts[siteName] = {
        totalGross: 0,
        workerCount: 0,
        crafts: {}
      };
    }
    projectLaborCosts[siteName].totalGross += rec.grossPay;
    projectLaborCosts[siteName].workerCount += 1;

    const craftName = desMap[rec.designationId] || 'General';
    projectLaborCosts[siteName].crafts[craftName] = (projectLaborCosts[siteName].crafts[craftName] || 0) + 1;
  });

  // Handle Editing Record
  const handleEditRecordSubmit = (e) => {
    e.preventDefault();
    if (!editingRecord) return;

    const emp = empMap[editingRecord.employeeId];
    const recomputed = computeEmployeePayroll(emp, period.periodType, {
      ...editFormData,
      govRules: govtRules
    });

    updatePayrollRecord(editingRecord.id, {
      ...editingRecord,
      ...recomputed
    });

    addToast(`Updated compensation record for ${editingRecord.employeeName}`, 'success');
    setEditingRecord(null);
  };

  // Handle Excel File Upload (Requirement #16)
  const handlePayrollExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { jsonData } = await parseExcelFile(file);
      let validCount = 0;
      let errorCount = 0;

      const parsedRows = jsonData.map((row, index) => {
        const empNo = String(row['Employee ID'] || row['employee_id'] || '').trim();
        const daysWorked = Number(row['Days Worked'] || 12);
        const otHours = Number(row['OT Hours'] || 0);
        const siteAllowance = Number(row['Site Allowance'] || 0);
        const hazardAllowance = Number(row['Hazard Allowance'] || 0);
        const bonuses = Number(row['Bonuses'] || 0);
        const cashAdvance = Number(row['Cash Advance'] || 0);
        const loanDeduction = Number(row['Loans Deduction'] || 0);

        const emp = empNoMap[empNo.toLowerCase()];
        const errors = [];

        if (!emp) {
          errors.push(`Employee ID "${empNo}" not found`);
        }

        const isValid = errors.length === 0;
        if (isValid) validCount++;
        else errorCount++;

        let computed = null;
        if (emp) {
          computed = computeEmployeePayroll(emp, period.periodType, {
            daysWorked,
            otHours,
            siteAllowance,
            hazardAllowance,
            otherBonuses: bonuses,
            cashAdvance,
            loanDeduction,
            govRules: govtRules
          });
        }

        return {
          rowNumber: index + 2,
          employeeNo: empNo,
          employee: emp,
          computed,
          isValid,
          errors
        };
      });

      setImportRows(parsedRows);
      setValidationSummary({
        total: parsedRows.length,
        valid: validCount,
        invalid: errorCount
      });
      setIsImportModalOpen(true);
    } catch (err) {
      console.error(err);
      addToast('Failed to parse Payroll Excel file', 'error');
    }
  };

  const handleConfirmPayrollImport = () => {
    const validRows = importRows.filter(r => r.isValid && r.computed);
    if (validRows.length === 0) {
      addToast('No valid records to import', 'error');
      return;
    }

    const newRecords = validRows.map(r => ({
      ...r.computed,
      periodId: period.id,
      id: `rec-${period.id}-${r.employee.id}`
    }));

    importBatchPayroll(period.id, newRecords);
    addToast(`Successfully imported ${validRows.length} payroll records into ${period.periodName}!`, 'success');
    setIsImportModalOpen(false);
    setImportRows([]);
  };

  const isApprovedOrPaid = period.status === 'Approved' || period.status === 'Paid';

  return (
    <div className="space-y-6">
      {/* Header & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link to="/payroll" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600">
            <ArrowLeft className="w-4 h-4" /> Back to Payroll Cycles
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
              {period.periodName}
            </h1>
            <StatusBadge status={period.status} size="sm" />
          </div>
          <p className="text-xs text-slate-500">
            Period: {period.startDate} to {period.endDate} • Payout Date: <strong className="text-slate-800">{period.payoutDate}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => exportPayrollToExcel(period, currentRecords, designations, sites)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Register (.xlsx)</span>
          </button>

          {!isApprovedOrPaid && hasPermission('payroll:write') && (
            <>
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl shadow-sm cursor-pointer">
                <Upload className="w-4 h-4 text-brand-600" />
                <span>Import Excel Batch</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handlePayrollExcelUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => {
                  approvePayrollPeriod(period.id);
                  addToast(`Payroll Period "${period.periodName}" has been APPROVED and locked against modifications!`, 'success');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Approve Payroll</span>
              </button>
            </>
          )}

          {period.status === 'Approved' && hasPermission('payroll:write') && (
            <button
              onClick={() => {
                markPayrollPaid(period.id);
                addToast(`Disbursed & marked as PAID for ${period.periodName}!`, 'success');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md transition-all"
            >
              <Banknote className="w-4 h-4" />
              <span>Mark as Disbursed (Paid)</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Gross Wages</span>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">{formatCurrency(period.totalGross)}</div>
          <span className="text-xs text-slate-500 mt-1 block">{currentRecords.length} worker payslips</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Deductions (Govt & Loans)</span>
          <div className="text-2xl font-extrabold text-rose-600 font-mono mt-1">- {formatCurrency(period.totalDeductions)}</div>
          <span className="text-xs text-slate-500 mt-1 block">SSS, PhilHealth, Pag-IBIG & Tax</span>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-850 text-white p-5 rounded-2xl border border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Net Take-Home Disbursed</span>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">{formatCurrency(period.totalNet)}</div>
          <span className="text-xs text-slate-300 mt-1 block">
            {period.approvedBy ? `Approved by ${period.approvedBy}` : 'Pending final approval'}
          </span>
        </div>
      </div>

      {/* Construction Labor Cost Per Project Summary (Requirement #20) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">Construction Labor Cost Allocation by Project</h2>
            <p className="text-xs text-slate-500">Total payroll cost allocated per construction project for this cycle</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(projectLaborCosts).map(([siteName, data]) => (
            <div key={siteName} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <h4 className="text-xs font-bold text-slate-900 truncate">{siteName}</h4>
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 bg-white rounded border border-slate-200">
                  {data.workerCount} workers
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Project Labor Cost</span>
                <p className="text-base font-extrabold text-brand-600 font-mono">{formatCurrency(data.totalGross)}</p>
              </div>

              <div className="flex flex-wrap gap-1 text-[10px] text-slate-600 pt-2 border-t border-slate-200/60">
                {Object.entries(data.crafts).map(([craft, cnt]) => (
                  <span key={craft} className="px-1.5 py-0.5 rounded bg-white border border-slate-200">
                    {craft}: {cnt}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search worker by name, ID..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <select
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value="ALL">All Project Sites</option>
          {sites.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Payroll Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">Worker & ID</th>
                <th className="py-3 px-3">Site & Craft</th>
                <th className="py-3 px-3">Rate & Days</th>
                <th className="py-3 px-3">Basic Pay</th>
                <th className="py-3 px-3">OT / Allowances</th>
                <th className="py-3 px-3">Gross Pay</th>
                <th className="py-3 px-3">Govt Deductions</th>
                <th className="py-3 px-3">Net Take-Home</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.map(rec => {
                const emp = empMap[rec.employeeId] || { firstName: rec.employeeName, lastName: '', employeeNo: rec.employeeNo };
                const statutoryTotal = rec.sssDeduction + rec.philhealthDeduction + rec.pagibigDeduction + rec.taxDeduction;

                return (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{rec.employeeName || `${emp.firstName} ${emp.lastName}`}</div>
                      <div className="text-[10px] font-mono text-slate-400">{rec.employeeNo || emp.employeeNo}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{siteMap[rec.siteId] || 'Assigned'}</div>
                      <div className="text-[10px] text-slate-500">{desMap[rec.designationId] || 'Craft'}</div>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <div>{formatCurrency(rec.basicRate)} <span className="font-sans text-[10px] text-slate-400">/{rec.salaryType?.toLowerCase()}</span></div>
                      <div className="text-[10px] text-slate-500 font-sans">{rec.daysWorked} days {rec.otHours > 0 && `(+${rec.otHours}h OT)`}</div>
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-slate-800">{formatCurrency(rec.basicPay)}</td>

                    <td className="py-3 px-3 font-mono text-slate-600">
                      <div>OT: {formatCurrency(rec.otPay)}</div>
                      <div className="text-[10px] text-slate-400">Allow: {formatCurrency(rec.totalAllowances)}</div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{formatCurrency(rec.grossPay)}</td>

                    <td className="py-3 px-3 font-mono text-rose-600">
                      <div>- {formatCurrency(statutoryTotal)}</div>
                      <div className="text-[10px] text-slate-400">SSS/PH/HDMF/Tax</div>
                    </td>

                    <td className="py-3 px-3 font-mono font-extrabold text-emerald-600 text-sm">{formatCurrency(rec.netPay)}</td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isApprovedOrPaid && hasPermission('payroll:write') && (
                          <button
                            onClick={() => {
                              setEditingRecord(rec);
                              setEditFormData({
                                daysWorked: rec.daysWorked,
                                otHours: rec.otHours,
                                siteAllowance: rec.siteAllowance,
                                hazardAllowance: rec.hazardAllowance,
                                otherBonuses: rec.otherBonuses,
                                cashAdvance: rec.cashAdvance,
                                loanDeduction: rec.loanDeduction,
                                otherDeductions: rec.otherDeductions
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded"
                            title="Edit Adjustments"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            generatePayslipPDF(
                              rec,
                              emp,
                              period,
                              desMap[rec.designationId],
                              siteMap[rec.siteId],
                              companyProfile
                            );
                            addToast(`Downloaded PDF Payslip for ${rec.employeeName}`, 'success');
                          }}
                          className="p-1.5 text-slate-600 hover:text-white hover:bg-slate-900 rounded"
                          title="Generate PDF Payslip"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Record Modal */}
      <Modal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        title={`Adjust Compensation: ${editingRecord?.employeeName}`}
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditingRecord(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEditRecordSubmit}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-sm"
            >
              Recompute & Save
            </button>
          </>
        }
      >
        {editingRecord && (
          <form onSubmit={handleEditRecordSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Days Worked</label>
                <input
                  type="number"
                  step="0.5"
                  value={editFormData.daysWorked}
                  onChange={(e) => setEditFormData({ ...editFormData, daysWorked: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">OT Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={editFormData.otHours}
                  onChange={(e) => setEditFormData({ ...editFormData, otHours: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Site Allowance (₱)</label>
                <input
                  type="number"
                  value={editFormData.siteAllowance}
                  onChange={(e) => setEditFormData({ ...editFormData, siteAllowance: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hazard Pay (₱)</label>
                <input
                  type="number"
                  value={editFormData.hazardAllowance}
                  onChange={(e) => setEditFormData({ ...editFormData, hazardAllowance: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cash Advance (₱)</label>
                <input
                  type="number"
                  value={editFormData.cashAdvance}
                  onChange={(e) => setEditFormData({ ...editFormData, cashAdvance: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Deduction (₱)</label>
                <input
                  type="number"
                  value={editFormData.loanDeduction}
                  onChange={(e) => setEditFormData({ ...editFormData, loanDeduction: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-rose-600"
                />
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* Excel Payroll Import Preview Modal (Requirement #16) */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Batch Excel Payroll Import & Preview Validation"
        maxWidth="max-w-4xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmPayrollImport}
              disabled={validationSummary?.valid === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-sm disabled:opacity-50"
            >
              Commit & Update Payroll Period
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {validationSummary && (
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Parsed Employees</span>
                <p className="text-base font-bold text-slate-900">{validationSummary.total}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Valid Matches</span>
                <p className="text-base font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {validationSummary.valid}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Errors Highlighted</span>
                <p className="text-base font-bold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {validationSummary.invalid}
                </p>
              </div>
            </div>
          )}

          <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold sticky top-0 border-b">
                  <th className="py-2 px-3">Row</th>
                  <th className="py-2 px-3">Employee ID</th>
                  <th className="py-2 px-3">Matched Name</th>
                  <th className="py-2 px-3">Gross Computed</th>
                  <th className="py-2 px-3">Net Take-Home</th>
                  <th className="py-2 px-3">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importRows.map((r, i) => (
                  <tr key={i} className={r.isValid ? 'bg-emerald-50/20' : 'bg-rose-50/50'}>
                    <td className="py-2 px-3 font-mono text-slate-400">#{r.rowNumber}</td>
                    <td className="py-2 px-3 font-bold font-mono text-slate-800">{r.employeeNo}</td>
                    <td className="py-2 px-3">{r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : <span className="text-rose-600 font-bold">Unrecognized ID</span>}</td>
                    <td className="py-2 px-3 font-mono">{r.computed ? formatCurrency(r.computed.grossPay) : '—'}</td>
                    <td className="py-2 px-3 font-mono font-bold text-emerald-600">{r.computed ? formatCurrency(r.computed.netPay) : '—'}</td>
                    <td className="py-2 px-3">
                      {r.isValid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" /> {r.errors[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}
