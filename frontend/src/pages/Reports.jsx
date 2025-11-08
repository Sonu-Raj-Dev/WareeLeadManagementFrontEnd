import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { dashboardService } from '../services/dashboardService';
import StatsCards from '../components/dashboard/StatsCards';
import LeadFunnel from '../components/dashboard/LeadFunnel';
import DistrictChart from '../components/dashboard/DistrictChart';
import SourceChart from '../components/dashboard/SourceChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiDownload } from 'react-icons/fi';

const Reports = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    if (!stats) return;

    const reportData = [
      ['Lead Management System - Report'],
      ['Generated on: ' + new Date().toLocaleString()],
      [''],
      ['Overall Statistics'],
      ['Total Leads', stats.total_leads],
      ['New Leads', stats.new_leads],
      ['Contacted Leads', stats.contacted_leads],
      ['Qualified Leads', stats.qualified_leads],
      ['Won Leads', stats.won_leads],
      ['Lost Leads', stats.lost_leads],
      ['Conversion Rate', stats.conversion_rate + '%'],
      ['Total Revenue', '$' + stats.total_revenue.toLocaleString()],
      [''],
      ['Leads by Status'],
      ...Object.entries(stats.leads_by_status).map(([status, count]) => [status, count]),
      [''],
      ['Leads by District'],
      ...Object.entries(stats.leads_by_district).map(([district, count]) => [district, count]),
      [''],
      ['Leads by Source'],
      ...Object.entries(stats.leads_by_source).map(([source, count]) => [source, count]),
    ];

    const csvContent = reportData.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lead_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">You don't have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive lead analytics and reports</p>
        </div>

        <button
          onClick={generateReport}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          data-testid="download-report-button"
        >
          <FiDownload />
          <span>Download Report (CSV)</span>
        </button>
      </div>

      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadFunnel stats={stats} />
        <DistrictChart stats={stats} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SourceChart stats={stats} />

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Key Insights
          </h3>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Deal Size</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                $
                {stats?.total_revenue && stats?.won_leads
                  ? (stats.total_revenue / stats.won_leads).toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })
                  : 0}
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pipeline Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${(stats?.total_revenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Leads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(stats?.new_leads || 0) +
                  (stats?.contacted_leads || 0) +
                  (stats?.qualified_leads || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
