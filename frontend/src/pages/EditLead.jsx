import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { leadService } from '../services/leadService';
import { updateLeadInList } from '../store/slices/leadSlice';
import LeadForm from '../components/leads/LeadForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiArrowLeft } from 'react-icons/fi';

const EditLead = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
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

  const handleSubmit = async (leadData) => {
    try {
      const updatedLead = await leadService.updateLead(id, leadData);
      dispatch(updateLeadInList(updatedLead));
      alert('Lead updated successfully!');
      navigate(`/leads/${id}`);
    } catch (err) {
      alert('Failed to update lead');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-6" data-testid="edit-lead-page">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(`/leads/${id}`)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <FiArrowLeft className="text-xl text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Lead</h1>
          <p className="text-gray-600 dark:text-gray-400">Update lead information</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <LeadForm lead={lead} onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default EditLead;
