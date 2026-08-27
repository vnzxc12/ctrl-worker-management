import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Building2,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import { parseExcelFile, downloadAttendanceTemplate } from '../lib/exportExcel';

export default function Attendance() {
  const { attendanceLogs, employees, sites, addAttendanceLog, importBatchAttendance } = useData();
  const { hasPermission } = useAuth();
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [siteFilter, setSiteFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Manual Log Entry State
  const [formData, setFormData] = useState({
    employeeId: employees[0]?.id || '',
    siteId: sites[0]?.id || '',
    logDate: new Date().toISOString().slice(0, 10),
    timeIn: '07:00',
    timeOut: '17:00',
    regularHours: 8,
    otHours: 2,
    nightDiffHours: 0,
    isRestDay: false,
    isHoliday: false,
    lateMinutes: 0,
    undertimeMinutes: 0,
    status: 'Present',
    notes: 'Standard site shift'
  });

  // Excel Import Preview & Validation State
  const [importRows, setImportRows] = useState([]);
  const [validationSummary, setValidationSummary] = useState(null);
  const [isParsing, setIsParsing] = useState(false);

  // Maps
  const empMap = useMemo(() => Object.fromEntries(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`])), [employees]);
  const empNoMap = useMemo(() => Object.fromEntries(employees.map(e => [e.employeeNo.toLowerCase(), e])), [employees]);
  const siteMap = useMemo(() => Object.fromEntries(sites.map(s => [s.id, s.name])), [sites]);

  // Filtered Logs
  const filteredLogs = attendanceLogs.filter(log => {
    const emp = employees.find(e => e.id === log.employeeId);
    const empName = emp ? `${emp.firstName} ${emp.lastName} ${emp.employeeNo}` : '';
    const matchSearch = search.trim() === '' || empName.toLowerCase().includes(search.toLowerCase());
    const matchSite = siteFilter === 'ALL' || log.siteId === siteFilter;
    const matchDate = !dateFilter || log.logDate === dateFilter;
    return matchSearch && matchSite && matchDate;
  });

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.logDate) {
      addToast('Please select worker and date', 'error');
      return;
    }

    addAttendanceLog(formData);
    addToast('Time log recorded successfully', 'success');
    setIsAddModalOpen(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const { jsonData } = await parseExcelFile(file);

      let validCount = 0;
      let errorCount = 0;

      const parsedRows = jsonData.map((row, index) => {
        const empNo = String(row['Employee ID'] || row['employee_id'] || '').trim();
        const date = String(row['Date (YYYY-MM-DD)'] || row['Date'] || row['date'] || '2026-08-27').trim();
        const regHrs = Number(row['Regular Hours'] || row['regular_hours'] || 8);
        const otHrs = Number(row['OT Hours'] || row['ot_hours'] || 0);
        const status = String(row['Status'] || row['status'] || 'Present').trim();
        const notes = String(row['Notes'] || row['notes'] || '').trim();

        const emp = empNoMap[empNo.toLowerCase()];
        const errors = [];

        if (!emp) {
          errors.push(`Invalid Employee ID: "${empNo}" does not exist in master roster`);
        }
        if (!date || date.length < 8) {
          errors.push('Missing or invalid date format (YYYY-MM-DD)');
        }
        if (isNaN(regHrs) || regHrs < 0 || regHrs > 24) {
          errors.push('Regular hours must be between 0 and 24');
        }

        const isValid = errors.length === 0;
        if (isValid) validCount++;
        else errorCount++;

        return {
          rowNumber: index + 2,
          employeeNo: empNo,
          employee: emp,
          date,
          regHrs,
          otHrs,
          status,
          notes,
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
      addToast('Failed to read Excel file. Please ensure it is a valid .xlsx or .csv', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = () => {
    const validRows = importRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      addToast('No valid rows to import. Please resolve the highlighted errors.', 'error');
      return;
    }

    const newLogs = validRows.map(r => ({
      employeeId: r.employee.id,
      siteId: r.employee.currentSiteId || sites[0]?.id,
      logDate: r.date,
      timeIn: '07:00',
      timeOut: '17:00',
      regularHours: r.regHrs,
      otHours: r.otHrs,
      nightDiffHours: 0,
      isRestDay: false,
      isHoliday: false,
      lateMinutes: 0,
      undertimeMinutes: 0,
      status: r.status,
      notes: r.notes || 'Imported via Excel Batch'
    }));

    importBatchAttendance(newLogs);
    addToast(`Successfully imported ${validRows.length} attendance records!`, 'success');
    setIsImportModalOpen(false);
    setImportRows([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight">
            Attendance & Time Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Daily site check-ins, overtime tracking, shift hours, and bulk Excel timesheet imports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => downloadAttendanceTemplate(employees)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all"
            title="Download Excel template for time imports"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Excel Template</span>
          </button>

          {hasPermission('attendance:manage') && (
            <>
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl shadow-sm cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-brand-600" />
                <span>Import Excel</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 rounded-xl shadow-md shadow-brand-900/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Log Time Record</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search worker name or ID..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div>
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
          >
            <option value="ALL">All Project Sites</option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Construction Worker</th>
                <th className="py-3.5 px-4">Project Site</th>
                <th className="py-3.5 px-4">Time In / Out</th>
                <th className="py-3.5 px-4">Reg Hours</th>
                <th className="py-3.5 px-4">Overtime</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Shift Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => {
                  const emp = employees.find(e => e.id === log.employeeId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{log.logDate}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{empMap[log.employeeId] || 'Unknown Worker'}</div>
                        <div className="text-[11px] font-mono text-slate-400">{emp?.employeeNo}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                          <span className="truncate max-w-[160px]">{siteMap[log.siteId] || 'Assigned Site'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {log.timeIn || '—'} – {log.timeOut || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{log.regularHours} hrs</td>
                      <td className="py-3.5 px-4 font-bold text-brand-600">
                        {log.otHours > 0 ? `+${log.otHours} hrs OT` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={log.status} size="xs" />
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 italic max-w-[180px] truncate">
                        {log.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12">
                    <EmptyState
                      title="No time logs match your criteria"
                      description="Record manual daily timesheets or import bulk attendance via Excel."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Time Log Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Daily Worker Time Log"
        maxWidth="max-w-lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleManualSubmit}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-sm"
            >
              Save Time Record
            </button>
          </>
        }
      >
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Employee *</label>
            <select
              required
              value={formData.employeeId}
              onChange={(e) => {
                const emp = employees.find(emp => emp.id === e.target.value);
                setFormData({
                  ...formData,
                  employeeId: e.target.value,
                  siteId: emp?.currentSiteId || formData.siteId
                });
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold"
            >
              {employees.filter(e => e.status === 'Active').map(e => (
                <option key={e.id} value={e.id}>{e.employeeNo} — {e.firstName} {e.lastName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.logDate}
                onChange={(e) => setFormData({ ...formData, logDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Site *</label>
              <select
                value={formData.siteId}
                onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Time In</label>
              <input
                type="time"
                value={formData.timeIn}
                onChange={(e) => setFormData({ ...formData, timeIn: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Time Out</label>
              <input
                type="time"
                value={formData.timeOut}
                onChange={(e) => setFormData({ ...formData, timeOut: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Regular Hours</label>
              <input
                type="number"
                min="0"
                max="24"
                value={formData.regularHours}
                onChange={(e) => setFormData({ ...formData, regularHours: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Overtime Hours</label>
              <input
                type="number"
                min="0"
                max="16"
                value={formData.otHours}
                onChange={(e) => setFormData({ ...formData, otHours: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Notes</label>
            <input
              type="text"
              placeholder="e.g. 5th floor slab concrete pour overtime"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>

      {/* Excel Attendance Import & Validation Preview Modal (Requirement #14 & #27) */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Excel Attendance Import & Record Validation"
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
              onClick={handleConfirmImport}
              disabled={validationSummary?.valid === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-sm disabled:opacity-50"
            >
              Confirm & Import ({validationSummary?.valid || 0} Valid Records)
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Validation Summary Bar */}
          {validationSummary && (
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-medium">Parsed Records</span>
                <p className="text-base font-bold text-slate-900">{validationSummary.total}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Valid Ready to Import</span>
                <p className="text-base font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> {validationSummary.valid}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Errors Detected</span>
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
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Reg / OT</th>
                  <th className="py-2 px-3">Validation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {importRows.map((r, i) => (
                  <tr key={i} className={r.isValid ? 'bg-emerald-50/20' : 'bg-rose-50/50'}>
                    <td className="py-2 px-3 font-mono text-slate-400">#{r.rowNumber}</td>
                    <td className="py-2 px-3 font-bold font-mono text-slate-800">{r.employeeNo}</td>
                    <td className="py-2 px-3">{r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : <span className="text-rose-600 font-bold">Not Found</span>}</td>
                    <td className="py-2 px-3">{r.date}</td>
                    <td className="py-2 px-3 font-mono">{r.regHrs} hrs / +{r.otHrs} OT</td>
                    <td className="py-2 px-3">
                      {r.isValid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]" title={r.errors.join('; ')}>
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
