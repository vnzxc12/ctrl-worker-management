import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Building2,
  HardHat,
  ArrowUpDown,
  MoreVertical,
  ExternalLink,
  Edit2,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Eye
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { StatusBadge, CategoryBadge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency } from '../lib/calculations';
import { exportEmployeesToExcel } from '../lib/exportExcel';

export default function Employees() {
  const { employees, sites, designations, addEmployee, updateEmployee, changeEmployeeStatus } = useData();
  const { hasPermission } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [siteFilter, setSiteFilter] = useState('ALL');
  const [designationFilter, setDesignationFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [salaryTypeFilter, setSalaryTypeFilter] = useState('ALL');
  const [sortField, setSortField] = useState('employeeNo');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(searchParams.get('action') === 'new');
  const [statusChangeTarget, setStatusChangeTarget] = useState(null);

  // New Employee Form State
  const [formData, setFormData] = useState({
    employeeNo: `CTRL-2026-${String(employees.length + 1).padStart(4, '0')}`,
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    gender: 'Male',
    dob: '1990-01-01',
    civilStatus: 'Single',
    nationality: 'Filipino',
    contactNo: '+63 9',
    email: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    emergencyRelation: 'Spouse',
    hireDate: new Date().toISOString().slice(0, 10),
    status: 'Active',
    employmentType: 'Project-Based',
    department: 'Civil & Structural Division',
    designationId: designations[0]?.id || '',
    currentSiteId: sites[0]?.id || '',
    supervisor: 'Foreman Pedro Santos',
    crewName: 'General Crew Alpha',
    salaryType: 'Daily',
    basicRate: 850,
    sssNo: '',
    philhealthNo: '',
    pagibigNo: '',
    tinNo: ''
  });

  // Maps for fast lookups
  const siteMap = useMemo(() => Object.fromEntries(sites.map(s => [s.id, s.name])), [sites]);
  const designationMap = useMemo(() => Object.fromEntries(designations.map(d => [d.id, d.name])), [designations]);

  // Filtered and Sorted employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch =
        search.trim() === '' ||
        `${emp.firstName} ${emp.lastName} ${emp.employeeNo} ${emp.contactNo || ''} ${emp.email || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchSite = siteFilter === 'ALL' || (siteFilter === 'UNASSIGNED' ? !emp.currentSiteId : emp.currentSiteId === siteFilter);
      const matchDes = designationFilter === 'ALL' || emp.designationId === designationFilter;
      const matchStatus = statusFilter === 'ALL' || emp.status === statusFilter;
      const matchSalary = salaryTypeFilter === 'ALL' || emp.salaryType === salaryTypeFilter;

      return matchSearch && matchSite && matchDes && matchStatus && matchSalary;
    }).sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'basicRate') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
        return sortAsc ? valA - valB : valB - valA;
      }

      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return 0;
    });
  }, [employees, search, siteFilter, designationFilter, statusFilter, salaryTypeFilter, sortField, sortAsc]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage) || 1;
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleCreateEmployee = (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.employeeNo) {
      addToast('Please fill in required fields (Name and Employee ID)', 'error');
      return;
    }

    // Check duplicate employee ID
    if (employees.some(emp => emp.employeeNo.toLowerCase() === formData.employeeNo.toLowerCase())) {
      addToast(`Employee ID ${formData.employeeNo} is already in use!`, 'error');
      return;
    }

    const created = addEmployee(formData);
    addToast(`Successfully created profile for ${created.firstName} ${created.lastName} (${created.employeeNo})`, 'success');
    setIsAddModalOpen(false);
    navigate(`/employees/${created.id}`);
  };

  const handleExport = () => {
    exportEmployeesToExcel(filteredEmployees, designations, sites);
    addToast(`Exported ${filteredEmployees.length} employee records to Excel!`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight">
            Construction Workforce Roster
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage construction workers, craft designations, deployment sites, compensation rates, and 201 records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all"
            title="Export filtered records to Excel"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {hasPermission('employees:write') && (
            <button
              onClick={() => {
                setFormData({
                  ...formData,
                  employeeNo: `CTRL-2026-${String(employees.length + 1).padStart(4, '0')}`,
                });
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 rounded-xl shadow-md shadow-brand-900/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by worker name, ID, phone..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          {/* Site Filter */}
          <div>
            <select
              value={siteFilter}
              onChange={(e) => {
                setSiteFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="ALL">All Project Sites</option>
              <option value="UNASSIGNED">Unassigned Pool</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Designation Filter */}
          <div>
            <select
              value={designationFilter}
              onChange={(e) => {
                setDesignationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="ALL">All Designations / Trades</option>
              {designations.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Suspended">Suspended</option>
              <option value="Resigned">Resigned</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>
        </div>

        {/* Active Filter Counter & Quick Reset */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{filteredEmployees.length}</strong> of {employees.length} workers
          </span>
          {(search || siteFilter !== 'ALL' || designationFilter !== 'ALL' || statusFilter !== 'ALL' || salaryTypeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setSiteFilter('ALL');
                setDesignationFilter('ALL');
                setStatusFilter('ALL');
                setSalaryTypeFilter('ALL');
              }}
              className="text-brand-600 hover:text-brand-700 font-semibold underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Employees Roster Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Mobile View: Card List (md:hidden) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {paginatedEmployees.length > 0 ? (
            paginatedEmployees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => navigate(`/employees/${emp.id}`)}
                className="p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.photoUrl}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100 flex-shrink-0"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150';
                      }}
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 font-display text-sm">
                        {emp.firstName} {emp.lastName} {emp.suffix || ''}
                      </h3>
                      <div className="text-[11px] font-mono text-slate-500">{emp.employeeNo}</div>
                      <div className="text-xs font-semibold text-brand-600 mt-0.5">
                        {designationMap[emp.designationId] || 'Unassigned Trade'}
                      </div>
                    </div>
                  </div>

                  <StatusBadge status={emp.status} size="xs" />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Stationed Site</span>
                    <div className="flex items-center gap-1 text-slate-700 font-medium truncate mt-0.5">
                      <Building2 className="w-3 h-3 text-brand-500 flex-shrink-0" />
                      <span className="truncate">{siteMap[emp.currentSiteId] || 'Unassigned (Pool)'}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-medium block">Pay Rate</span>
                    <span className="font-bold text-slate-900 font-mono text-xs">
                      {formatCurrency(emp.basicRate)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans ml-1">/{emp.salaryType.toLowerCase()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>{emp.contactNo || 'No phone'}</span>
                  <span className="text-brand-600 font-semibold flex items-center gap-0.5">
                    View 201 Profile →
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8">
              <EmptyState
                title="No construction workers found"
                description="Try adjusting your search or active filters."
                actionText="Reset Filters"
                onAction={() => {
                  setSearch('');
                  setSiteFilter('ALL');
                  setDesignationFilter('ALL');
                  setStatusFilter('ALL');
                }}
              />
            </div>
          )}
        </div>

        {/* Desktop View: Multi-Column Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('employeeNo')}>
                  <div className="flex items-center gap-1.5">
                    <span>ID & Worker</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('designationId')}>
                  <div className="flex items-center gap-1.5">
                    <span>Trade / Designation</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Assigned Site</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('basicRate')}>
                  <div className="flex items-center gap-1.5">
                    <span>Rate / Pay Type</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/employees/${emp.id}`)}
                  >
                    {/* Worker Info & Photo */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.photoUrl}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 flex-shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150';
                          }}
                        />
                        <div>
                          <div className="font-bold text-slate-900 font-display group-hover:text-brand-600 transition-colors">
                            {emp.firstName} {emp.lastName} {emp.suffix || ''}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">{emp.employeeNo}</div>
                        </div>
                      </div>
                    </td>

                    {/* Trade / Designation */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{designationMap[emp.designationId] || 'Unassigned'}</div>
                      <div className="text-[11px] text-slate-500">{emp.department}</div>
                    </td>

                    {/* Assigned Construction Site */}
                    <td className="py-3.5 px-4">
                      {emp.currentSiteId ? (
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <Building2 className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                          <span className="font-medium truncate max-w-[180px]">
                            {siteMap[emp.currentSiteId] || 'Assigned'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned (Pool)</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={emp.status} size="xs" />
                    </td>

                    {/* Basic Rate & Salary Type */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-bold text-slate-900">{formatCurrency(emp.basicRate)}</span>
                      <span className="text-[11px] text-slate-500 font-sans ml-1">/{emp.salaryType.toLowerCase()}</span>
                    </td>

                    {/* Contact Number */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div>{emp.contactNo || '—'}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{emp.email || ''}</div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate(`/employees/${emp.id}`)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="View 201 File Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8">
                    <EmptyState
                      title="No construction workers match your criteria"
                      description="Try searching with a different name, trade designation, or clearing your active filters."
                      actionText="Clear Filters"
                      onAction={() => {
                        setSearch('');
                        setSiteFilter('ALL');
                        setDesignationFilter('ALL');
                        setStatusFilter('ALL');
                      }}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/50 text-xs text-slate-600">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-100 font-medium"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg font-bold text-xs ${currentPage === page ? 'bg-brand-500 text-white' : 'bg-white border border-slate-200 hover:bg-slate-100'}`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-100 font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add New Employee Modal Wizard */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Onboard New Construction Worker"
        maxWidth="max-w-3xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateEmployee}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-md shadow-brand-900/20 transition-all"
            >
              Create Employee Profile
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateEmployee} className="space-y-6">
          {/* Section 1: Basic Identity */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider border-b pb-1">
              1. Identity & Profile Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee ID *</label>
                <input
                  type="text"
                  required
                  value={formData.employeeNo}
                  onChange={(e) => setFormData({ ...formData, employeeNo: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Juan"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dela Cruz"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Middle Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramos"
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Civil Status</label>
                <select
                  value={formData.civilStatus}
                  onChange={(e) => setFormData({ ...formData, civilStatus: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+63 917 000 0000"
                  value={formData.contactNo}
                  onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Photo URL</label>
                <input
                  type="text"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Trade & Deployment */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider border-b pb-1">
              2. Designation, Site & Compensation
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Designation / Position *</label>
                <select
                  value={formData.designationId}
                  onChange={(e) => {
                    const des = designations.find(d => d.id === e.target.value);
                    setFormData({
                      ...formData,
                      designationId: e.target.value,
                      basicRate: des ? des.defaultRate : formData.basicRate,
                      salaryType: des ? des.rateType : formData.salaryType
                    });
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  {designations.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Construction Site</label>
                <select
                  value={formData.currentSiteId}
                  onChange={(e) => setFormData({ ...formData, currentSiteId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="">Unassigned (Head Office Pool)</option>
                  {sites.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Salary Type</label>
                <select
                  value={formData.salaryType}
                  onChange={(e) => setFormData({ ...formData, salaryType: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Daily">Daily Rate</option>
                  <option value="Hourly">Hourly Rate</option>
                  <option value="Monthly">Monthly Salary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Basic Rate (₱) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.basicRate}
                  onChange={(e) => setFormData({ ...formData, basicRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Type</label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Project-Based">Project-Based</option>
                  <option value="Regular">Regular</option>
                  <option value="Probationary">Probationary</option>
                  <option value="Casual">Casual / Daily</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Government Numbers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider border-b pb-1">
              3. Statutory Government Identifiers
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">SSS No.</label>
                <input
                  type="text"
                  placeholder="00-0000000-0"
                  value={formData.sssNo}
                  onChange={(e) => setFormData({ ...formData, sssNo: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">PhilHealth No.</label>
                <input
                  type="text"
                  placeholder="00-000000000-0"
                  value={formData.philhealthNo}
                  onChange={(e) => setFormData({ ...formData, philhealthNo: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pag-IBIG MID</label>
                <input
                  type="text"
                  placeholder="0000-0000-0000"
                  value={formData.pagibigNo}
                  onChange={(e) => setFormData({ ...formData, pagibigNo: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">TIN</label>
                <input
                  type="text"
                  placeholder="000-000-000-000"
                  value={formData.tinNo}
                  onChange={(e) => setFormData({ ...formData, tinNo: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
