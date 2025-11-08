import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leadService } from '../services/leadService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiArrowLeft, FiEdit } from 'react-icons/fi';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLead();
  }, [id]);

  const loadLead = async () => {
    try {
      const data = await leadService.getLeadById(id);
      setLead(data);
    } catch (err) {
      alert('Failed to load lead');
      navigate('/leads');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!lead) {
    return null;
  }

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-purple-100 text-purple-800',
      proposal: 'bg-orange-100 text-orange-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6" data-testid="lead-detail-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/leads')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            data-testid="back-button"
          >
            <FiArrowLeft className="text-xl text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{lead.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">{lead.company || 'No company'}</p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/leads/${id}/edit`)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          data-testid="edit-lead-button"
        >
          <FiEdit />
          <span>Edit Lead</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Contact Information
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-gray-900 dark:text-white">{lead.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-gray-900 dark:text-white">{lead.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Company</p>
              <p className="text-gray-900 dark:text-white">{lead.company || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Lead Details
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(lead.status)}`}>
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Source</p>
              <p className="text-gray-900 dark:text-white capitalize">{lead.source}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Budget</p>
              <p className="text-gray-900 dark:text-white">
                {lead.budget ? `$${lead.budget.toLocaleString()}` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Notes</h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {lead.notes || 'No notes available'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
