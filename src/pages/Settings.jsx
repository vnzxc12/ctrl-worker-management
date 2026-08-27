import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  Users,
  Shield,
  FileText,
  Database,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  History,
  Key,
  ExternalLink
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { saveSupabaseConfig, isSupabaseConfigured } from '../lib/supabaseClient';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function Settings() {
  const { companyProfile, govtRules, auditLogs, updateCompanyProfile, updateGovtRules, resetToDemoData } = useData();
  const { currentUser, availableUsers, switchUser, hasPermission } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('company');
  const [profileForm, setProfileForm] = useState(companyProfile);
  const [rulesForm, setRulesForm] = useState(govtRules);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Supabase Settings State
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem('ctrl_supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem('ctrl_supabase_anon_key') || '');
  const isConnected = isSupabaseConfigured();

  // Audit Search State
  const [auditSearch, setAuditSearch] = useState('');

  const handleSaveCompany = (e) => {
    e.preventDefault();
    updateCompanyProfile(profileForm);
    addToast('Saved company settings and credentials successfully', 'success');
  };

  const handleSaveGovtRules = (e) => {
    e.preventDefault();
    updateGovtRules(rulesForm);
    addToast('Updated statutory contribution rate structures', 'success');
  };

  const handleSaveSupabase = (e) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseKey) {
      addToast('Please enter both Supabase Project URL and Anon Public Key', 'error');
      return;
    }
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    addToast('Supabase connection credentials updated!', 'success');
  };

  const filteredAuditLogs = auditLogs.filter(log => {
    return auditSearch.trim() === '' ||
      `${log.action} ${log.userName} ${log.userRole} ${log.entityType} ${log.entityId || ''}`.toLowerCase().includes(auditSearch.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight">
            System & Architecture Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Configure company credentials, statutory government tax tables, user permissions matrix, and Supabase integration.
          </p>
        </div>

        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset Sample Seed Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'company' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4 text-brand-400" />
          <span>Company Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('statutory')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'statutory' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Government Contribution Tables</span>
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'rbac' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4 text-purple-400" />
          <span>User Management & RBAC</span>
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'supabase' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Supabase PostgreSQL & Storage</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'audit' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4 text-amber-400" />
          <span>System Audit Log ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display mb-1">
              Company Identity & Credentials
            </h3>
            <p className="text-xs text-slate-500 mb-4">Official corporate identifiers printed on payslips and compliance certificates.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={profileForm.companyName}
                  onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={profileForm.tagline}
                  onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PCAB Contractor License</label>
                <input
                  type="text"
                  value={profileForm.pcatbLicense}
                  onChange={(e) => setProfileForm({ ...profileForm, pcatbLicense: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate TIN</label>
                <input
                  type="text"
                  value={profileForm.tin}
                  onChange={(e) => setProfileForm({ ...profileForm, tin: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Head Office Address</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Hotline</label>
                <input
                  type="text"
                  value={profileForm.contactPhone}
                  onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Attribution Credit</label>
                <input
                  type="text"
                  value={profileForm.productCredit}
                  onChange={(e) => setProfileForm({ ...profileForm, productCredit: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-brand-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Company Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Government Contribution Tables (Requirement #29) */}
      {activeTab === 'statutory' && (
        <form onSubmit={handleSaveGovtRules} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display mb-1">
              Configurable Statutory Contribution Architecture
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Government contribution rules are decoupled from employee records, enabling seamless updates when DOLE/SSS/PhilHealth revise statutory rates.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* SSS Card */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                <h4 className="text-xs font-bold text-blue-900 uppercase">SSS Contribution Rules</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Employee Share Rate</label>
                  <input
                    type="number"
                    step="0.001"
                    value={rulesForm.sss.employeeRate}
                    onChange={(e) => setRulesForm({ ...rulesForm, sss: { ...rulesForm.sss, employeeRate: Number(e.target.value) } })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Current: 4.5%</span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Employer Share Rate</label>
                  <input
                    type="number"
                    step="0.001"
                    value={rulesForm.sss.employerRate}
                    onChange={(e) => setRulesForm({ ...rulesForm, sss: { ...rulesForm.sss, employerRate: Number(e.target.value) } })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Current: 9.5%</span>
                </div>
              </div>

              {/* PhilHealth Card */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <h4 className="text-xs font-bold text-emerald-900 uppercase">PhilHealth Rules</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Premium Rate (Total)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={rulesForm.philhealth.rate}
                    onChange={(e) => setRulesForm({ ...rulesForm, philhealth: { ...rulesForm.philhealth, rate: Number(e.target.value) } })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">5.0% premium split 50/50</span>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Salary Floor (₱)</label>
                  <input
                    type="number"
                    value={rulesForm.philhealth.minSalary}
                    onChange={(e) => setRulesForm({ ...rulesForm, philhealth: { ...rulesForm.philhealth, minSalary: Number(e.target.value) } })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Pag-IBIG Card */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-3">
                <h4 className="text-xs font-bold text-amber-900 uppercase">Pag-IBIG HDMF Rules</h4>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Monthly Mandatory Fixed (₱)</label>
                  <input
                    type="number"
                    value={rulesForm.pagibig.employeeFixedAmount}
                    onChange={(e) => setRulesForm({ ...rulesForm, pagibig: { ...rulesForm.pagibig, employeeFixedAmount: Number(e.target.value) } })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Standard statutory ₱200/mo</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Statutory Rates</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: User Management & RBAC Matrix (Requirement #3 & #25) */}
      {activeTab === 'rbac' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display mb-1">
              Active HR Administrator Account
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Demo account configured with full HR Operations, Payroll Management, and Construction Site Administration privileges.
            </p>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img src={currentUser.avatar} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-500/30" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{currentUser.fullName}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{currentUser.email} • <strong className="text-brand-600">{currentUser.title}</strong></p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Active Demo Session</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Supabase Connection Settings (Requirement #2 & #25) */}
      {activeTab === 'supabase' && (
        <form onSubmit={handleSaveSupabase} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
                Supabase Backend & Storage Connection
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {isConnected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                {isConnected ? 'Connected to Cloud Supabase' : 'Offline / Local Persistence Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Connect your production Supabase PostgreSQL instance and Supabase Storage bucket for worker 201 documents.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Supabase Project URL</label>
                <input
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Supabase Anon Public Key</label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save & Connect Supabase</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 5: Audit Log Explorer (Requirement #26) */}
      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
                Immutable HR & System Audit Trail
              </h3>
              <p className="text-xs text-slate-500">Records of worker creations, salary changes, document uploads, and payroll approvals.</p>
            </div>

            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search audit actions, users..."
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-full sm:w-64"
            />
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor / User</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity Target</th>
                  <th className="py-2.5 px-3">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAuditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleString('en-PH')}
                    </td>
                    <td className="py-2.5 px-3">
                      <strong className="text-slate-900">{log.userName}</strong>
                      <div className="text-[10px] text-slate-400">{log.userRole}</div>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-brand-600">{log.action}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700">
                        {log.entityType}: {log.entityId}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500 font-mono">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
          resetToDemoData();
          addToast('Database reset to clean sample dataset!', 'info');
        }}
        title="Reset to Sample Demo Dataset"
        message="This will reset all employees, site allocations, document records, and time logs back to the default 22 sample construction workers. Are you sure?"
      />
    </div>
  );
}
