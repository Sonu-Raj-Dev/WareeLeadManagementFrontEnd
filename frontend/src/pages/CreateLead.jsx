import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { leadService } from '../services/leadService';
import { addLead } from '../store/slices/leadSlice';
import LeadForm from '../components/leads/LeadForm';
import { FiArrowLeft } from 'react-icons/fi';

const CreateLead = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (leadData) => {
    try {
      const newLead = await leadService.createLead(leadData);
      dispatch(addLead(newLead));
      alert('Lead created successfully!');
      navigate('/leads');
    } catch (err) {
      alert('Failed to create lead');
    }
  };

  return (
    <div className="space-y-6" data-testid="create-lead-page">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/leads')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <FiArrowLeft className="text-xl text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Lead</h1>
          <p className="text-gray-600 dark:text-gray-400">Add a new lead to your system</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <LeadForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default CreateLead;
