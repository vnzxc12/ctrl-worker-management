import React, { useState } from 'react';
import {
  HardHat,
  Plus,
  Search,
  Edit2,
  Users,
  CheckCircle2,
  XCircle,
  Tag,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { StatusBadge, CategoryBadge } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import { formatCurrency } from '../lib/calculations';

export default function Designations() {
  const { designations, employees, addDesignation, updateDesignation } = useData();
  const { hasPermission } = useAuth();
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDes, setEditingDes] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Civil & Structural',
    defaultRate: 850,
    rateType: 'Daily',
    status: 'Active',
    description: ''
  });

  const categories = [
    'Civil & Structural',
    'Finishing & Carpentry',
    'Structural Welding',
    'Equipment & Machinery',
    'Electrical & MEP',
    'Mechanical & Plumbing',
    'Site Supervision',
    'Safety & Quality',
    'General Construction',
    'Engineering & Management',
    'Office & HR'
  ];

  const filteredDesignations = designations.filter(des => {
    const matchSearch = search.trim() === '' ||
      `${des.name} ${des.category} ${des.description || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || des.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.name) {
      addToast('Please enter designation name', 'error');
      return;
    }

    if (editingDes) {
      updateDesignation(editingDes.id, formData);
      addToast(`Updated designation ${formData.name}`, 'success');
      setEditingDes(null);
    } else {
      const created = addDesignation(formData);
      addToast(`Created designation ${created.name}`, 'success');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight">
            Designations & Craft Positions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Define dynamic construction job titles, skills classifications, benchmark salary rates, and trade categories.
          </p>
        </div>

        {hasPermission('designations:manage') && (
          <button
            onClick={() => {
              setEditingDes(null);
              setFormData({
                name: '',
                category: 'Civil & Structural',
                defaultRate: 850,
                rateType: 'Daily',
                status: 'Active',
                description: ''
              });
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 rounded-xl shadow-md shadow-brand-900/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Craft Designation</span>
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
            placeholder="Search craft title, category..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value="ALL">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Designations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDesignations.map((des) => {
          const workerCount = employees.filter(e => e.designationId === des.id && e.status === 'Active').length;

          return (
            <div
              key={des.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-card hover:border-slate-300 transition-all p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <CategoryBadge text={des.category} />
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={des.status} size="xs" />
                    {hasPermission('designations:manage') && (
                      <button
                        onClick={() => {
                          setEditingDes(des);
                          setFormData(des);
                          setIsModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                        title="Edit Designation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    {des.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {des.description || 'Standard construction role.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-5 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Benchmark Rate</span>
                  <p className="font-extrabold text-slate-900 font-mono mt-0.5">
                    {formatCurrency(des.defaultRate)} <span className="font-sans font-normal text-[10px] text-slate-500">/{des.rateType}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 font-medium block">Active Personnel</span>
                  <div className="flex items-center justify-end gap-1 font-bold text-brand-600 mt-0.5">
                    <Users className="w-3 h-3" />
                    <span>{workerCount} workers</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Designation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDes ? `Edit Designation: ${editingDes.name}` : 'Create Custom Construction Designation'}
        maxWidth="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-sm"
            >
              {editingDes ? 'Save Changes' : 'Create Designation'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Designation Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Master Welder (NC-II)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Discipline / Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Default Benchmark Rate (₱) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.defaultRate}
                onChange={(e) => setFormData({ ...formData, defaultRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rate Type</label>
              <select
                value={formData.rateType}
                onChange={(e) => setFormData({ ...formData, rateType: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
              >
                <option value="Daily">Daily</option>
                <option value="Hourly">Hourly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Trade Description / Skills Scope</label>
            <textarea
              rows={2}
              placeholder="Core trade responsibilities and certification requirements..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
