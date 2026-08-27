import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Calendar,
  Users,
  HardHat,
  Banknote,
  ArrowRight,
  Edit2,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { StatusBadge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { formatCurrency, formatNumber } from '../lib/calculations';

export default function Sites() {
  const { sites, employees, designations, addSite, updateSite } = useData();
  const { hasPermission } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);

  const [formData, setFormData] = useState({
    code: `SITE-PRJ-${String(sites.length + 1).padStart(2, '0')}`,
    name: '',
    projectName: '',
    client: '',
    location: '',
    projectManager: 'Engr. Carlos Mendoza',
    siteSupervisor: 'Foreman Pedro Santos',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    budget: 150000000,
    status: 'Active',
    description: ''
  });

  const filteredSites = sites.filter(site => {
    const matchSearch = search.trim() === '' ||
      `${site.name} ${site.code} ${site.client} ${site.location} ${site.projectManager}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || site.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSaveSite = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast('Please enter site name and code', 'error');
      return;
    }

    if (editingSite) {
      updateSite(editingSite.id, formData);
      addToast(`Updated ${formData.name}`, 'success');
      setEditingSite(null);
    } else {
      const created = addSite(formData);
      addToast(`Created construction site ${created.name}`, 'success');
    }
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight">
            Construction Sites & Projects
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitor active civil, infrastructure, and commercial sites, labor allocations, and site supervisors.
          </p>
        </div>

        {hasPermission('sites:manage') && (
          <button
            onClick={() => {
              setEditingSite(null);
              setFormData({
                code: `SITE-PRJ-${String(sites.length + 1).padStart(2, '0')}`,
                name: '',
                projectName: '',
                client: '',
                location: '',
                projectManager: 'Engr. Carlos Mendoza',
                siteSupervisor: 'Foreman Pedro Santos',
                startDate: new Date().toISOString().slice(0, 10),
                endDate: '',
                budget: 200000000,
                status: 'Active',
                description: ''
              });
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 rounded-xl shadow-md shadow-brand-900/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Construction Site</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sites, client, location..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
          >
            <option value="ALL">All Project Statuses</option>
            <option value="Active">Active Projects</option>
            <option value="Planned">Planned Projects</option>
            <option value="Completed">Completed</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSites.map((site) => {
          const assignedWorkers = employees.filter(e => e.currentSiteId === site.id && e.status === 'Active');
          const totalLaborCost = assignedWorkers.reduce((sum, e) => {
            const monthlyEst = e.salaryType === 'Monthly' ? e.basicRate : e.salaryType === 'Daily' ? e.basicRate * 26 : e.basicRate * 26 * 8;
            return sum + monthlyEst;
          }, 0);

          return (
            <div
              key={site.id}
              onClick={() => navigate(`/sites/${site.id}`)}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-card-hover hover:border-brand-200 transition-all p-6 cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                        {site.code}
                      </span>
                      <StatusBadge status={site.status} size="xs" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 font-display group-hover:text-brand-600 transition-colors">
                      {site.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">{site.projectName}</p>
                  </div>

                  {hasPermission('sites:manage') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSite(site);
                        setFormData(site);
                        setIsAddModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                      title="Edit Site Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                    <span className="truncate">{site.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Client:</span>
                    <strong className="text-slate-800 truncate">{site.client}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">PM / Lead:</span>
                    <span className="text-slate-800">{site.projectManager}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-400 font-medium">Supervisor:</span>
                    <span className="text-slate-800">{site.siteSupervisor}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {site.description || 'No description provided.'}
                </p>
              </div>

              {/* Site Stats Strip */}
              <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Stationed Personnel</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Users className="w-3.5 h-3.5 text-brand-500" />
                    <span className="font-extrabold text-slate-900 font-display">{assignedWorkers.length} Workers</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-medium block">Est. Labor / Mo</span>
                  <p className="font-bold text-slate-900 font-mono mt-0.5">{formatCurrency(totalLaborCost)}</p>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 font-medium block">Project Budget</span>
                  <p className="font-extrabold text-slate-900 font-mono mt-0.5">{formatCurrency(site.budget)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Site Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingSite ? `Edit Construction Site (${editingSite.code})` : 'Create New Construction Site'}
        maxWidth="max-w-2xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveSite}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-sm"
            >
              {editingSite ? 'Save Changes' : 'Create Site'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveSite} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Site Code / ID *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Site / Structure Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. CTRL Tower One"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name</label>
              <input
                type="text"
                placeholder="e.g. Commercial High-Rise Phase 1"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Client Name</label>
              <input
                type="text"
                placeholder="e.g. Ayala Land / Megaworld"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Site Location & Address</label>
            <input
              type="text"
              placeholder="e.g. 5th Ave cor 28th St, BGC, Taguig"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Manager</label>
              <input
                type="text"
                value={formData.projectManager}
                onChange={(e) => setFormData({ ...formData, projectManager: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Site Supervisor / General Foreman</label>
              <input
                type="text"
                value={formData.siteSupervisor}
                onChange={(e) => setFormData({ ...formData, siteSupervisor: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date (Est.)</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
              >
                <option value="Active">Active</option>
                <option value="Planned">Planned</option>
                <option value="Completed">Completed</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Description & Scope</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Scope of works, structural highlights..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
