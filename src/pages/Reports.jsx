import React, { useState, useMemo } from 'react';
import {
  FileBarChart2,
  Download,
  Users,
  Building2,
  Banknote,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../components/common/Toast';
import { StatusBadge, CategoryBadge } from '../components/common/Badge';
import { formatCurrency, formatNumber } from '../lib/calculations';
import { exportEmployeesToExcel, exportPayrollToExcel } from '../lib/exportExcel';
import * as XLSX from 'xlsx';

export default function Reports() {
  const { employees, sites, designations, payrollPeriods, payrollRecords, documentCategories } = useData();
  const { addToast } = useToast();

  const [activeReportTab, setActiveReportTab] = useState('labor_cost');
  const [selectedSite, setSelectedSite] = useState('ALL');

  const desMap = useMemo(() => Object.fromEntries(designations.map(d => [d.id, d.name])), [designations]);
  const siteMap = useMemo(() => Object.fromEntries(sites.map(s => [s.id, s.name])), [sites]);

  // 1. Labor Cost by Site Data
  const siteLaborData = sites.map(site => {
    const siteWorkers = employees.filter(e => e.currentSiteId === site.id && e.status === 'Active');
    const monthlyLabor = siteWorkers.reduce((sum, e) => {
      return sum + (e.salaryType === 'Monthly' ? e.basicRate : e.salaryType === 'Daily' ? e.basicRate * 26 : e.basicRate * 26 * 8);
    }, 0);

    const trades = {};
    siteWorkers.forEach(w => {
      const trade = desMap[w.designationId] || 'Other';
      trades[trade] = (trades[trade] || 0) + 1;
    });

    return {
      siteId: site.id,
      code: site.code,
      name: site.name,
      client: site.client,
      location: site.location,
      budget: site.budget,
      workerCount: siteWorkers.length,
      monthlyLabor,
      trades
    };
  });

  // 2. Statutory Contributions Summary
  const latestPeriod = payrollPeriods[0] || {};
  const currentRecords = payrollRecords.filter(r => r.periodId === latestPeriod.id);

  const statutoryTotals = currentRecords.reduce((acc, r) => ({
    sssEE: acc.sssEE + (r.sssDeduction || 0),
    sssER: acc.sssER + (r.sssEmployer || 0),
    phEE: acc.phEE + (r.philhealthDeduction || 0),
    phER: acc.phER + (r.philhealthEmployer || 0),
    hdmfEE: acc.hdmfEE + (r.pagibigDeduction || 0),
    hdmfER: acc.hdmfER + (r.pagibigEmployer || 0),
    tax: acc.tax + (r.taxDeduction || 0),
    gross: acc.gross + (r.grossPay || 0),
    net: acc.net + (r.netPay || 0),
  }), { sssEE: 0, sssER: 0, phEE: 0, phER: 0, hdmfEE: 0, hdmfER: 0, tax: 0, gross: 0, net: 0 });

  // 3. Document Compliance Audit
  const today = new Date();
  const complianceRecords = [];

  employees.forEach(emp => {
    (emp.documents || []).forEach(doc => {
      let status = 'Valid';
      let days = null;
      if (doc.expiryDate) {
        const diff = Math.ceil((new Date(doc.expiryDate) - today) / (1000 * 60 * 60 * 24));
        if (diff < 0) {
          status = 'Expired';
          days = Math.abs(diff);
        } else if (diff <= 30) {
          status = 'Expiring Soon';
          days = diff;
        }
      }
      complianceRecords.push({
        employeeId: emp.id,
        employeeNo: emp.employeeNo,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        siteName: siteMap[emp.currentSiteId] || 'Unassigned',
        docName: doc.name,
        fileName: doc.fileName,
        expiryDate: doc.expiryDate || 'No Expiration',
        status,
        days
      });
    });
  });

  const exportComplianceToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(complianceRecords);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Document_Compliance');
    XLSX.writeFile(wb, `CTRL_Document_Compliance_${new Date().toISOString().slice(0, 10)}.xlsx`);
    addToast('Exported Document Compliance Report to Excel', 'success');
  };

  const exportStatutoryToExcel = () => {
    const rows = currentRecords.map(r => ({
      'Employee ID': r.employeeNo,
      'Name': r.employeeName,
      'Gross Pay': r.grossPay,
      'SSS (EE)': r.sssDeduction,
      'SSS (ER)': r.sssEmployer,
      'PhilHealth (EE)': r.philhealthDeduction,
      'PhilHealth (ER)': r.philhealthEmployer,
      'Pag-IBIG (EE)': r.pagibigDeduction,
      'Pag-IBIG (ER)': r.pagibigEmployer,
      'Withholding Tax': r.taxDeduction,
      'Net Pay': r.netPay
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Statutory_Summary');
    XLSX.writeFile(wb, `CTRL_Statutory_Contributions_${new Date().toISOString().slice(0, 10)}.xlsx`);
    addToast('Exported Statutory Summary to Excel', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight">
            Compliance & Workforce Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Generate statutory remittance summaries, construction labor costing per project, and HSE document expiry audits.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print Report</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveReportTab('labor_cost')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
            activeReportTab === 'labor_cost' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4 text-brand-400" />
          <span>Project Labor Costs</span>
        </button>

        <button
          onClick={() => setActiveReportTab('statutory')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
            activeReportTab === 'statutory' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Banknote className="w-4 h-4 text-emerald-400" />
          <span>Government Statutory Remittances</span>
        </button>

        <button
          onClick={() => setActiveReportTab('compliance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
            activeReportTab === 'compliance' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Document & License Expiry Radar</span>
        </button>
      </div>

      {/* Report 1: Project Labor Cost (Requirement #20) */}
      {activeReportTab === 'labor_cost' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 font-display">Construction Labor Cost per Project Site</h2>
            <button
              onClick={() => {
                const ws = XLSX.utils.json_to_sheet(siteLaborData.map(s => ({
                  'Site Code': s.code,
                  'Site Name': s.name,
                  'Client': s.client,
                  'Workers Stationed': s.workerCount,
                  'Est Monthly Labor Cost': s.monthlyLabor,
                  'Project Budget': s.budget
                })));
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Project_Labor_Costs');
                XLSX.writeFile(wb, `CTRL_Project_Labor_Costs_${new Date().toISOString().slice(0, 10)}.xlsx`);
                addToast('Exported Project Labor Costs to Excel', 'success');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export XLSX</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {siteLaborData.map(site => (
              <div key={site.siteId} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {site.code}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 font-display mt-1">{site.name}</h3>
                    <p className="text-xs text-slate-500">{site.location}</p>
                  </div>
                  <span className="text-xs font-bold font-mono px-2 py-1 bg-slate-900 text-white rounded-lg">
                    {site.workerCount} workers
                  </span>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Est. Monthly Labor Cost:</span>
                    <strong className="text-brand-600 font-mono text-sm">{formatCurrency(site.monthlyLabor)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Total Project Budget:</span>
                    <strong className="text-slate-800 font-mono">{formatCurrency(site.budget)}</strong>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1 text-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Trades Stationed</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(site.trades).map(([craft, cnt]) => (
                      <span key={craft} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                        {craft} ({cnt})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report 2: Statutory Remittances */}
      {activeReportTab === 'statutory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 font-display">
              Government Statutory Remittance Summary ({latestPeriod.periodName || 'Current Cycle'})
            </h2>
            <button
              onClick={exportStatutoryToExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Remittance Register</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">SSS Remittance Total</span>
              <p className="text-xl font-extrabold text-blue-950 font-mono mt-1">{formatCurrency(statutoryTotals.sssEE + statutoryTotals.sssER)}</p>
              <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                <div>EE Share: <strong className="font-mono text-slate-800">{formatCurrency(statutoryTotals.sssEE)}</strong></div>
                <div>ER Share: <strong className="font-mono text-slate-800">{formatCurrency(statutoryTotals.sssER)}</strong></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">PhilHealth Remittance</span>
              <p className="text-xl font-extrabold text-emerald-950 font-mono mt-1">{formatCurrency(statutoryTotals.phEE + statutoryTotals.phER)}</p>
              <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                <div>EE Share (50%): <strong className="font-mono text-slate-800">{formatCurrency(statutoryTotals.phEE)}</strong></div>
                <div>ER Share (50%): <strong className="font-mono text-slate-800">{formatCurrency(statutoryTotals.phER)}</strong></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Pag-IBIG HDMF Remittance</span>
              <p className="text-xl font-extrabold text-amber-950 font-mono mt-1">{formatCurrency(statutoryTotals.hdmfEE + statutoryTotals.hdmfER)}</p>
              <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                <div>EE Share: <strong className="font-mono text-slate-800">{formatCurrency(statutoryTotals.hdmfEE)}</strong></div>
                <div>ER Share: <strong className="font-mono text-slate-800">{formatCurrency(statutoryTotals.hdmfER)}</strong></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">BIR Withholding Tax</span>
              <p className="text-xl font-extrabold text-purple-950 font-mono mt-1">{formatCurrency(statutoryTotals.tax)}</p>
              <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                <div>TRAIN Law Schedule</div>
                <div>Total Taxable: <strong className="font-mono text-slate-800">{formatCurrency(statutoryTotals.gross - (statutoryTotals.sssEE + statutoryTotals.phEE + statutoryTotals.hdmfEE))}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report 3: Document Compliance Audit */}
      {activeReportTab === 'compliance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 font-display">
              Worker Safety Cards & Document Expiration Radar
            </h2>
            <button
              onClick={exportComplianceToExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export Compliance Audit (.xlsx)</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                    <th className="py-3 px-4">Worker ID & Name</th>
                    <th className="py-3 px-4">Current Site</th>
                    <th className="py-3 px-4">Certificate / Document</th>
                    <th className="py-3 px-4">Expiration Date</th>
                    <th className="py-3 px-4">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {complianceRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{r.employeeName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{r.employeeNo}</div>
                      </td>
                      <td className="py-3 px-4">{r.siteName}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{r.docName}</td>
                      <td className="py-3 px-4 font-mono">{r.expiryDate}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={r.status} size="xs" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
