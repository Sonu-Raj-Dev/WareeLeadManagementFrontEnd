import React, { useEffect, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { districtService } from '../services/districtService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useSelector } from 'react-redux';

const Districts = () => {
  const { user } = useSelector((state) => state.auth);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    state: '',
    region: '',
  });

  useEffect(() => {
    loadDistricts();
  }, []);

  const loadDistricts = async () => {
    setLoading(true);
    try {
      const data = await districtService.getDistricts();
      setDistricts(data);
    } catch (err) {
      console.error('Error loading districts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await districtService.createDistrict(formData);
      alert('District created successfully!');
      setShowForm(false);
      setFormData({ name: '', code: '', state: '', region: '' });
      loadDistricts();
    } catch (err) {
      alert('Failed to create district');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this district?')) {
      try {
        await districtService.deleteDistrict(id);
        setDistricts(districts.filter((d) => d.id !== id));
      } catch (err) {
        alert('Failed to delete district');
      }
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'manager' &&user?.role !== 'Superadmin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="districts-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Districts</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage geographic districts</p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            data-testid="create-district-button"
          >
            <FiPlus />
            <span>New District</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Create District
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  data-testid="district-name-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  data-testid="district-code-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  data-testid="district-state-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Region
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  data-testid="district-region-input"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  data-testid="district-form-cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  data-testid="district-form-submit-button"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Region
                  </th>
                  {user?.role === 'admin' && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {districts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No districts found
                    </td>
                  </tr>
                ) : (
                  districts.map((district) => (
                    <tr key={district.id} className="hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`district-row-${district.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {district.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {district.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {district.state || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {district.region || 'N/A'}
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDelete(district.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400"
                            data-testid={`district-delete-button-${district.id}`}
                          >
                            <FiTrash2 className="text-lg" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Districts;
