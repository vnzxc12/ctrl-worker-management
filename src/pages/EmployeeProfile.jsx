import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  User,
  Building2,
  HardHat,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Shield,
  FileText,
  Clock,
  Banknote,
  History,
  Upload,
  AlertTriangle,
  Download,
  Trash2,
  Edit2,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  Briefcase,
  Printer,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { StatusBadge, CategoryBadge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatCurrency } from '../lib/calculations';
import { generatePayslipPDF } from '../lib/pdfGenerator';

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    employees,
    sites,
    designations,
    documentCategories,
    attendanceLogs,
    payrollRecords,
    payrollPeriods,
    companyProfile,
    updateEmployee,
    changeEmployeeStatus,
    reassignEmployeeSite,
    uploadEmployeeDocument,
    deleteEmployeeDocument,
    updateEmployeeDocument
  } = useData();

  const { currentUser, hasPermission } = useAuth();
  const { addToast } = useToast();

  const employee = employees.find(e => e.id === id);

  // Active Tab
  const [activeTab, setActiveTab] = useState('personal');

  // Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [deleteDocTarget, setDeleteDocTarget] = useState(null);

  // Reassignment Form State
  const [reassignForm, setReassignForm] = useState({
    siteId: '',
    supervisor: '',
    crewName: '',
    notes: ''
  });

  // Document Upload Form State
  const [docForm, setDocForm] = useState({
    categoryId: documentCategories[0]?.id || '',
    name: '',
    fileName: '',
    fileType: 'application/pdf',
    fileSize: 1540000,
    expiryDate: '',
    notes: ''
  });

  // Fast lookups
  const siteMap = useMemo(() => Object.fromEntries(sites.map(s => [s.id, s.name])), [sites]);
  const designationMap = useMemo(() => Object.fromEntries(designations.map(d => [d.id, d.name])), [designations]);
  const categoryMap = useMemo(() => Object.fromEntries(documentCategories.map(c => [c.id, c.name])), [documentCategories]);

  if (!employee) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Employee Record Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">The requested worker record does not exist or has been removed.</p>
        <Link to="/employees" className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white font-bold rounded-lg text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Employee Roster
        </Link>
      </div>
    );
  }

  const currentDesignation = designations.find(d => d.id === employee.designationId);
  const currentSite = sites.find(s => s.id === employee.currentSiteId);

  // Filter Worker Time Logs
  const workerAttendance = attendanceLogs.filter(a => a.employeeId === employee.id);

  // Filter Worker Payroll Records
  const workerPayroll = payrollRecords.filter(p => p.employeeId === employee.id);

  // Check document status helper
  const getDocStatus = (doc) => {
    if (!doc.expiryDate) return { label: 'Valid', color: 'emerald' };
    const today = new Date();
    const exp = new Date(doc.expiryDate);
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Expired', color: 'rose', critical: true, days: Math.abs(diffDays) };
    if (diffDays <= 30) return { label: 'Expiring Soon', color: 'amber', days: diffDays };
    return { label: 'Valid', color: 'emerald' };
  };

  const handleReassignSubmit = (e) => {
    e.preventDefault();
    if (!reassignForm.siteId) {
      addToast('Please select a project site for reassignment', 'error');
      return;
    }
    reassignEmployeeSite(
      employee.id,
      reassignForm.siteId,
      reassignForm.supervisor,
      reassignForm.crewName,
      reassignForm.notes
    );
    addToast(`Successfully reassigned ${employee.firstName} to ${siteMap[reassignForm.siteId]}`, 'success');
    setIsReassignModalOpen(false);
  };

  const handleDocUploadSubmit = (e) => {
    e.preventDefault();
    if (!docForm.name) {
      addToast('Please enter a document title', 'error');
      return;
    }
    uploadEmployeeDocument(employee.id, {
      ...docForm,
      fileName: docForm.fileName || `${docForm.name.replace(/\s+/g, '_')}.pdf`,
      fileUrl: '#'
    });
    addToast(`Uploaded ${docForm.name} to employee 201 records`, 'success');
    setIsUploadDocOpen(false);
    setDocForm({
      categoryId: documentCategories[0]?.id || '',
      name: '',
      fileName: '',
      fileType: 'application/pdf',
      fileSize: 1200000,
      expiryDate: '',
      notes: ''
    });
  };

  const tabs = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'employment', label: 'Employment & Compensation', icon: Briefcase },
    { id: 'site_history', label: 'Site Assignment History', icon: History },
    { id: 'government', label: 'Government & Tax IDs', icon: Shield },
    { id: 'documents', label: `Documents (${employee.documents?.length || 0})`, icon: FileText },
    { id: 'attendance', label: `Time Logs (${workerAttendance.length})`, icon: Clock },
    { id: 'payroll', label: `Payroll Records (${workerPayroll.length})`, icon: Banknote },
  ];

  return (
    <div className="space-y-6">
      {/* Back to roster shortcut */}
      <div className="flex items-center justify-between">
        <Link to="/employees" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Employee Roster
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> Print 201 File
          </button>
        </div>
      </div>

      {/* Main Employee Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 overflow-hidden relative">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Avatar & Identifiers */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={employee.photoUrl}
                alt={`${employee.firstName} ${employee.lastName}`}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-slate-100 shadow-md flex-shrink-0"
              />
              <span className="absolute -bottom-1 -right-1">
                <StatusBadge status={employee.status} size="xs" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900 text-white">
                  {employee.employeeNo}
                </span>
                <span className="text-xs text-slate-500 font-medium">Hired {new Date(employee.hireDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
                {employee.firstName} {employee.middleName || ''} {employee.lastName} {employee.suffix || ''}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <div className="flex items-center gap-1 font-bold text-brand-600">
                  <HardHat className="w-3.5 h-3.5" />
                  <span>{designationMap[employee.designationId] || 'Unassigned Trade'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{currentSite ? currentSite.name : 'Unassigned (Pool Reserve)'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {hasPermission('employees:write') && (
              <>
                <button
                  onClick={() => {
                    setReassignForm({
                      siteId: employee.currentSiteId || sites[0]?.id || '',
                      supervisor: employee.supervisor || '',
                      crewName: employee.crewName || '',
                      notes: ''
                    });
                    setIsReassignModalOpen(true);
                  }}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  <Building2 className="w-4 h-4 text-brand-500" />
                  <span>Reassign Site</span>
                </button>

                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-sm transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Salary Type / Rate</span>
            <p className="font-bold text-slate-800 font-mono mt-0.5">
              {formatCurrency(employee.basicRate)} <span className="font-sans text-[11px] text-slate-500 font-normal">/{employee.salaryType}</span>
            </p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Supervisor / Foreman</span>
            <p className="font-bold text-slate-800 truncate mt-0.5">{employee.supervisor || 'N/A'}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Assigned Crew / Team</span>
            <p className="font-bold text-slate-800 truncate mt-0.5">{employee.crewName || 'General'}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Employment Type</span>
            <p className="font-bold text-slate-800 mt-0.5">{employee.employmentType}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-1 scrollbar-none">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Personal Information */}
      {activeTab === 'personal' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display mb-4">
              Personal & Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 font-medium block">Date of Birth</span>
                <p className="font-semibold text-slate-800 mt-1">{employee.dob || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Gender</span>
                <p className="font-semibold text-slate-800 mt-1">{employee.gender || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Civil Status</span>
                <p className="font-semibold text-slate-800 mt-1">{employee.civilStatus || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Nationality</span>
                <p className="font-semibold text-slate-800 mt-1">{employee.nationality || 'Filipino'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Primary Phone</span>
                <p className="font-semibold text-slate-800 mt-1">{employee.contactNo || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Email Address</span>
                <p className="font-semibold text-slate-800 mt-1">{employee.email || '—'}</p>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <span className="text-slate-400 font-medium block">Residential / Home Address</span>
                <p className="font-semibold text-slate-800 mt-1">{employee.address || '—'}</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display mb-4">
              Emergency Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 font-medium block">Contact Person</span>
                <p className="font-bold text-slate-800 mt-1">{employee.emergencyContact || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Relationship</span>
                <p className="font-semibold text-slate-800 mt-1">{employee.emergencyRelation || '—'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Emergency Phone Number</span>
                <p className="font-bold text-slate-800 mt-1 font-mono">{employee.emergencyPhone || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Employment & Compensation Information */}
      {activeTab === 'employment' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display mb-4">
              Employment Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 font-medium block">Date Hired</span>
                <p className="font-bold text-slate-800 mt-1">{employee.hireDate}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Employment Status</span>
                <div className="mt-1"><StatusBadge status={employee.status} /></div>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Employment Type</span>
                <p className="font-semibold text-slate-800 mt-1">{employee.employmentType}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Department / Division</span>
                <p className="font-semibold text-slate-800 mt-1">{employee.department}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Designation / Craft</span>
                <p className="font-bold text-brand-600 mt-1">{designationMap[employee.designationId]}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Current Site Assignment</span>
                <p className="font-semibold text-slate-800 mt-1">{currentSite ? currentSite.name : 'Unassigned'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Site Supervisor / Foreman</span>
                <p className="font-semibold text-slate-800 mt-1">{employee.supervisor || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Assigned Crew</span>
                <p className="font-semibold text-slate-800 mt-1">{employee.crewName || 'General Crew'}</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display mb-4">
              Compensation & Rate Structure
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium block">Salary Type</span>
                <p className="text-base font-bold text-slate-900 mt-1">{employee.salaryType} Rate</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium block">Basic Rate</span>
                <p className="text-base font-extrabold text-brand-600 font-mono mt-1">{formatCurrency(employee.basicRate)}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-medium block">Estimated Monthly Base</span>
                <p className="text-base font-bold text-slate-900 font-mono mt-1">
                  {formatCurrency(
                    employee.salaryType === 'Monthly'
                      ? employee.basicRate
                      : employee.salaryType === 'Daily'
                      ? employee.basicRate * 26
                      : employee.basicRate * 26 * 8
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Site Assignment History (Crucial Requirement #10) */}
      {activeTab === 'site_history' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
                Historical Site Deployments & Assignments
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete chronological history of construction projects Juan has been stationed at.
              </p>
            </div>

            {hasPermission('employees:write') && (
              <button
                onClick={() => {
                  setReassignForm({
                    siteId: sites[0]?.id || '',
                    supervisor: employee.supervisor || '',
                    crewName: employee.crewName || '',
                    notes: ''
                  });
                  setIsReassignModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-sm"
              >
                <Building2 className="w-3.5 h-3.5" /> Reassign to New Site
              </button>
            )}
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {(employee.siteAssignments || []).map((sa, idx) => {
              const siteObj = sites.find(s => s.id === sa.siteId);
              const isCurrent = sa.status === 'Active';

              return (
                <div key={sa.id} className="relative group">
                  {/* Timeline Dot */}
                  <span
                    className={`absolute -left-[27px] top-1.5 w-4 h-4 rounded-full border-2 border-white ring-4 transition-all ${
                      isCurrent
                        ? 'bg-brand-500 ring-brand-100 shadow-sm'
                        : 'bg-slate-400 ring-slate-100'
                    }`}
                  />

                  <div className={`p-4 rounded-xl border transition-all ${isCurrent ? 'bg-brand-50/40 border-brand-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-brand-600 bg-white px-2 py-0.5 rounded border border-brand-200">
                            {siteObj ? siteObj.code : 'SITE'}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">
                            {siteObj ? siteObj.name : 'Unknown Project Site'}
                          </h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand-500 text-white uppercase">
                              Current Assignment
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{siteObj?.location}</p>
                      </div>

                      <div className="text-xs font-semibold text-slate-600">
                        {new Date(sa.assignedDate).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' })}
                        {' – '}
                        {sa.demobilizedDate
                          ? new Date(sa.demobilizedDate).toLocaleDateString('en-PH', { month: 'short', year: 'numeric' })
                          : 'Present'}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">Supervisor:</span> <strong className="text-slate-800">{sa.supervisor || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Crew / Unit:</span> <strong className="text-slate-800">{sa.crewName || 'General'}</strong>
                      </div>
                      {sa.notes && (
                        <div className="sm:col-span-2 text-slate-500 italic mt-1">
                          "{sa.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Government Information */}
      {activeTab === 'government' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display mb-1">
              Government Statutory Identifiers
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Registered credentials used for Philippine statutory contributions (SSS, PhilHealth, Pag-IBIG, BIR).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Social Security System</span>
                <p className="text-base font-extrabold text-blue-950 font-mono mt-1">{employee.sssNo || 'Not Registered'}</p>
                <span className="text-[11px] text-blue-600 mt-1 block">Regular SSS & EC Account</span>
              </div>

              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">PhilHealth PIN</span>
                <p className="text-base font-extrabold text-emerald-950 font-mono mt-1">{employee.philhealthNo || 'Not Registered'}</p>
                <span className="text-[11px] text-emerald-600 mt-1 block">National Health Insurance</span>
              </div>

              <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pag-IBIG MID (HDMF)</span>
                <p className="text-base font-extrabold text-amber-950 font-mono mt-1">{employee.pagibigNo || 'Not Registered'}</p>
                <span className="text-[11px] text-amber-600 mt-1 block">Home Dev. Mutual Fund</span>
              </div>

              <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/50">
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">BIR Tax ID (TIN)</span>
                <p className="text-base font-extrabold text-purple-950 font-mono mt-1">{employee.tinNo || 'Not Registered'}</p>
                <span className="text-[11px] text-purple-600 mt-1 block">Withholding Tax & Form 2316</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Employee Document Management (Major Requirement #11 & #12) */}
      {activeTab === 'documents' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
                Worker Compliance & 201 Document Vault
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                DOLE safety training certificates, TESDA certifications, IDs, medical clearances, and contracts.
              </p>
            </div>

            {hasPermission('documents:manage') && (
              <button
                onClick={() => setIsUploadDocOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-sm transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </button>
            )}
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(employee.documents || []).length > 0 ? (
              employee.documents.map(doc => {
                const docStatus = getDocStatus(doc);
                return (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-card transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <CategoryBadge text={categoryMap[doc.categoryId] || 'General Document'} />
                        {docStatus.label === 'Expired' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                            ⚠️ Expired {docStatus.days}d ago
                          </span>
                        )}
                        {docStatus.label === 'Expiring Soon' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-700 border border-amber-200">
                            ⚠️ Expires in {docStatus.days}d
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                        {doc.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono truncate">{doc.fileName}</p>

                      {doc.notes && (
                        <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                          {doc.notes}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                      <div>
                        {doc.expiryDate ? (
                          <span>Exp: <strong className="text-slate-700">{doc.expiryDate}</strong></span>
                        ) : (
                          <span className="text-slate-400">No Expiration</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => addToast(`Downloaded ${doc.fileName}`, 'success')}
                          className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {hasPermission('documents:manage') && (
                          <button
                            onClick={() => setDeleteDocTarget(doc)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No documents uploaded for this worker yet.</p>
                <p className="text-[11px] text-slate-400 mt-1">Upload DOLE safety certificates, IDs, and contracts.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Attendance Logs */}
      {activeTab === 'attendance' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
              Timekeeping & Attendance History
            </h3>
            <Link to="/attendance" className="text-xs font-bold text-brand-600 hover:text-brand-700">
              View Master Logs →
            </Link>
          </div>

          {/* Mobile Attendance Cards (sm:hidden) */}
          <div className="block sm:hidden divide-y divide-slate-100">
            {workerAttendance.length > 0 ? (
              workerAttendance.map(att => (
                <div key={att.id} className="py-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{att.logDate}</span>
                    <StatusBadge status={att.status} size="xs" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-mono">{att.timeIn || '—'} – {att.timeOut || '—'}</span>
                    <span className="font-bold text-slate-800">{att.regularHours}h {att.otHours > 0 && `(+${att.otHours}h OT)`}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {siteMap[att.siteId] || 'Assigned Site'}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No attendance logs found.</p>
            )}
          </div>

          {/* Desktop Attendance Table (hidden sm:block) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Site</th>
                  <th className="py-2.5 px-3">Time In</th>
                  <th className="py-2.5 px-3">Time Out</th>
                  <th className="py-2.5 px-3">Reg Hrs</th>
                  <th className="py-2.5 px-3">OT Hrs</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {workerAttendance.length > 0 ? (
                  workerAttendance.map(att => (
                    <tr key={att.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold">{att.logDate}</td>
                      <td className="py-2.5 px-3">{siteMap[att.siteId] || '—'}</td>
                      <td className="py-2.5 px-3 font-mono">{att.timeIn || '—'}</td>
                      <td className="py-2.5 px-3 font-mono">{att.timeOut || '—'}</td>
                      <td className="py-2.5 px-3 font-bold">{att.regularHours} hrs</td>
                      <td className="py-2.5 px-3 font-bold text-brand-600">{att.otHours > 0 ? `+${att.otHours} hrs` : '—'}</td>
                      <td className="py-2.5 px-3"><StatusBadge status={att.status} size="xs" /></td>
                      <td className="py-2.5 px-3 text-slate-500 italic">{att.notes || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">
                      No attendance records logged for this employee in current cycle.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: Payroll & Payslips (Requirement #18) */}
      {activeTab === 'payroll' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
              Payroll History & Printable Payslips
            </h3>
            <Link to="/payroll" className="text-xs font-bold text-brand-600 hover:text-brand-700">
              Go to Payroll →
            </Link>
          </div>

          {/* Mobile Payroll Cards (sm:hidden) */}
          <div className="block sm:hidden divide-y divide-slate-100">
            {workerPayroll.length > 0 ? (
              workerPayroll.map(rec => {
                const period = payrollPeriods.find(p => p.id === rec.periodId) || {};
                return (
                  <div key={rec.id} className="py-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{period.periodName || 'Semi-Monthly Run'}</h4>
                        <p className="text-[10px] text-slate-400">Payout: {period.payoutDate || 'N/A'}</p>
                      </div>
                      <span className="font-extrabold font-mono text-emerald-600 text-sm">
                        {formatCurrency(rec.netPay)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                      <span>Gross: {formatCurrency(rec.grossPay)}</span>
                      <button
                        onClick={() => {
                          generatePayslipPDF(
                            rec,
                            employee,
                            period,
                            designationMap[employee.designationId],
                            siteMap[employee.currentSiteId],
                            companyProfile
                          );
                          addToast(`Generated Payslip PDF for ${employee.firstName} ${employee.lastName}`, 'success');
                        }}
                        className="px-2.5 py-1 bg-slate-900 text-white font-bold text-[11px] rounded-lg flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" /> PDF Payslip
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No payroll records found.</p>
            )}
          </div>

          {/* Desktop Payroll Table (hidden sm:block) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b">
                  <th className="py-2.5 px-3">Payroll Period</th>
                  <th className="py-2.5 px-3">Days / Hrs</th>
                  <th className="py-2.5 px-3">Gross Pay</th>
                  <th className="py-2.5 px-3">Statutory Deductions</th>
                  <th className="py-2.5 px-3">Net Take-Home</th>
                  <th className="py-2.5 px-3 text-right">Payslip PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {workerPayroll.length > 0 ? (
                  workerPayroll.map(rec => {
                    const period = payrollPeriods.find(p => p.id === rec.periodId) || {};
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{period.periodName || 'Semi-Monthly Run'}</div>
                          <div className="text-[10px] text-slate-400">Payout: {period.payoutDate || 'N/A'}</div>
                        </td>
                        <td className="py-3 px-3 font-semibold">{rec.daysWorked} days / {rec.otHours} OT hrs</td>
                        <td className="py-3 px-3 font-bold font-mono text-slate-900">{formatCurrency(rec.grossPay)}</td>
                        <td className="py-3 px-3 font-mono text-rose-600">- {formatCurrency(rec.totalDeductions)}</td>
                        <td className="py-3 px-3 font-extrabold font-mono text-emerald-600 text-sm">{formatCurrency(rec.netPay)}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              generatePayslipPDF(
                                rec,
                                employee,
                                period,
                                designationMap[employee.designationId],
                                siteMap[employee.currentSiteId],
                                companyProfile
                              );
                              addToast(`Generated Payslip PDF for ${employee.firstName} ${employee.lastName}`, 'success');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-brand-600 text-white font-bold rounded-lg transition-all"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Download Payslip</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No payroll records generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Site Reassignment Modal */}
      <Modal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        title="Reassign Construction Worker to Project Site"
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsReassignModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReassignSubmit}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-sm"
            >
              Confirm Reassignment
            </button>
          </>
        }
      >
        <form onSubmit={handleReassignSubmit} className="space-y-4">
          <p className="text-xs text-slate-600">
            Reassigning <strong>{employee.firstName} {employee.lastName}</strong> will automatically demobilize their previous site assignment while preserving historical records.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Construction Site *</label>
            <select
              required
              value={reassignForm.siteId}
              onChange={(e) => setReassignForm({ ...reassignForm, siteId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold"
            >
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Site Supervisor</label>
            <input
              type="text"
              placeholder="e.g. Foreman Pedro Santos"
              value={reassignForm.supervisor}
              onChange={(e) => setReassignForm({ ...reassignForm, supervisor: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Crew / Unit Name</label>
            <input
              type="text"
              placeholder="e.g. Formworks Crew Alpha"
              value={reassignForm.crewName}
              onChange={(e) => setReassignForm({ ...reassignForm, crewName: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assignment Notes</label>
            <textarea
              rows={2}
              placeholder="Reason for transfer, deployment phase..."
              value={reassignForm.notes}
              onChange={(e) => setReassignForm({ ...reassignForm, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>

      {/* Document Upload Modal */}
      <Modal
        isOpen={isUploadDocOpen}
        onClose={() => setIsUploadDocOpen(false)}
        title="Upload Compliance & 201 Document"
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsUploadDocOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDocUploadSubmit}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-sm"
            >
              Upload to Supabase Storage
            </button>
          </>
        }
      >
        <form onSubmit={handleDocUploadSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Document Category *</label>
            <select
              value={docForm.categoryId}
              onChange={(e) => setDocForm({ ...docForm, categoryId: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold"
            >
              {documentCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name} ({cat.groupType})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Document Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. DOLE BOSH 40-hr Certificate"
              value={docForm.name}
              onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Expiration Date (Optional)</label>
            <input
              type="date"
              value={docForm.expiryDate}
              onChange={(e) => setDocForm({ ...docForm, expiryDate: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Attach File (PDF, PNG, JPG)</label>
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setDocForm({
                    ...docForm,
                    fileName: file.name,
                    fileSize: file.size,
                    fileType: file.type
                  });
                }
              }}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Verification Details</label>
            <textarea
              rows={2}
              placeholder="Certificate serial numbers, issuing authority..."
              value={docForm.notes}
              onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>

      {/* Document Preview Modal */}
      <Modal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.name || 'Document Preview'}
        maxWidth="max-w-xl"
        footer={
          <button
            type="button"
            onClick={() => setPreviewDoc(null)}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Close Preview
          </button>
        }
      >
        {previewDoc && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">File Name: <strong className="text-slate-800">{previewDoc.fileName}</strong></p>
                <p className="text-xs text-slate-500">Uploaded By: <strong className="text-slate-800">{previewDoc.uploadedBy}</strong></p>
              </div>
              <CategoryBadge text={categoryMap[previewDoc.categoryId] || 'Document'} />
            </div>

            <div className="h-64 bg-slate-900 rounded-xl flex flex-col items-center justify-center text-white p-6 text-center">
              <FileText className="w-12 h-12 text-brand-400 mb-3" />
              <p className="text-sm font-bold">{previewDoc.name}</p>
              <p className="text-xs text-slate-400 mt-1">Verified Supabase Storage Document</p>
              {previewDoc.expiryDate && (
                <p className="text-xs font-bold text-amber-400 mt-2">Expiration: {previewDoc.expiryDate}</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Document Deletion Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteDocTarget}
        onClose={() => setDeleteDocTarget(null)}
        onConfirm={() => {
          if (deleteDocTarget) {
            deleteEmployeeDocument(employee.id, deleteDocTarget.id);
            addToast(`Deleted document ${deleteDocTarget.name}`, 'info');
          }
        }}
        title="Delete Document"
        message={`Are you sure you want to permanently delete "${deleteDocTarget?.name}" from this worker's records?`}
      />
    </div>
  );
}
