import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiUpload, FiDownload, FiFilter } from 'react-icons/fi';
import { leadService } from '../services/leadService';
import { setLeads, setLoading, removeLead, updateLeadInList } from '../store/slices/leadSlice';
import LeadList from '../components/leads/LeadList';
import LeadUpload from '../components/leads/LeadUpload';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Leads = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { leads, loading } = useSelector((state) => state.leads);
  const auth = useSelector((state) => state.auth);
  const [showUpload, setShowUpload] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    source: '',
  });

  const initialLoadRef = useRef(false);

  useEffect(() => {
    loadLeads();
  }, [filters]);

  const loadLeads = async () => {
    dispatch(setLoading(true));
    const t0 = performance.now();
    try {
      const data = await leadService.getLeads(filters);
      const t1 = performance.now();
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.info('[Leads] Loaded', data.length, 'items in', Math.round(t1 - t0), 'ms');
        if (!initialLoadRef.current) {
          console.table(data.slice(0, 5));
          initialLoadRef.current = true;
        }
      }
      dispatch(setLeads(data));
    } catch (err) {
      const t1 = performance.now();
      console.error('[Leads] Load failed after', Math.round(t1 - t0), 'ms', err);
      dispatch(setLoading(false));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await leadService.deleteLead(id);
        dispatch(removeLead(id));
      } catch (err) {
        alert('Failed to delete lead');
      }
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const updatedLead = await leadService.updateLeadStatus(id, status);
      dispatch(updateLeadInList(updatedLead));
    } catch (err) {
      alert('Failed to update lead status');
    }
  };

  const handleUpload = async (file) => {
    try {
      const result = await leadService.uploadLeads(file);
      alert(result.message);
      setShowUpload(false);
      loadLeads();
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Upload failed');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await leadService.exportLeads(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export leads');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6" data-testid="leads-page">
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="p-2 mb-2 text-sm text-gray-700 dark:text-gray-200 bg-yellow-50 dark:bg-yellow-900/20 rounded">
          <div><strong>Debug:</strong></div>
          <div>isAuthenticated: {String(auth.isAuthenticated)}</div>
          <div>token present: {auth.token ? 'yes' : 'no'}</div>
          <div>user: {auth.user ? JSON.stringify(auth.user) : 'null'}</div>
        </div>
      )} */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Leads</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your leads</p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            data-testid="export-leads-button"
          >
            <FiDownload />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            data-testid="upload-leads-button"
          >
            <FiUpload />
            <span>Upload</span>
          </button>
          <button
            onClick={() => navigate('/leads/new')}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            data-testid="create-lead-button"
          >
            <FiPlus />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <FiFilter className="text-gray-500 dark:text-gray-400" />
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            data-testid="filter-status-select"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>

          <select
            name="source"
            value={filters.source}
            onChange={handleFilterChange}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            data-testid="filter-source-select"
          >
            <option value="">All Sources</option>
            <option value="manual">Manual</option>
            <option value="website">Website</option>
            <option value="referral">Referral</option>
            <option value="advertisement">Advertisement</option>
            <option value="upload">Upload</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner />
          </div>
        ) : (
          <LeadList leads={leads} onDelete={handleDelete} onStatusUpdate={handleStatusUpdate} />
        )}
      </div>

      {showUpload && (
        <LeadUpload onUpload={handleUpload} onClose={() => setShowUpload(false)} />
      )}
    </div>
  );
};

export default Leads;
