import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dashboardService } from '../services/dashboardService';
import { setStats, setLoading, setError } from '../store/slices/dashboardSlice';
import StatsCards from '../components/dashboard/StatsCards';
import LeadFunnel from '../components/dashboard/LeadFunnel';
import DistrictChart from '../components/dashboard/DistrictChart';
import SourceChart from '../components/dashboard/SourceChart';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector((state) => state.dashboard);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    dispatch(setLoading(true));
    try {
      const data = await dashboardService.getStats();
      dispatch(setStats(data));
    } catch (err) {
      dispatch(setError(err.message));
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Overview of your lead management</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadFunnel stats={stats} />
        <DistrictChart stats={stats} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SourceChart stats={stats} />

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700" data-testid="recent-activities">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activities
          </h3>
          <div className="space-y-3">
            {stats?.recent_activities && stats.recent_activities.length > 0 ? (
              stats.recent_activities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {activity.lead_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      Status: {activity.status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center">No recent activities</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
