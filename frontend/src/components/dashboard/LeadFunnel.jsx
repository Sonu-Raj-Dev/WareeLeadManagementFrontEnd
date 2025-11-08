import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const LeadFunnel = ({ stats }) => {
  const data = {
    labels: ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'],
    datasets: [
      {
        label: 'Number of Leads',
        data: [
          stats?.new_leads || 0,
          stats?.contacted_leads || 0,
          stats?.qualified_leads || 0,
          stats?.leads_by_status?.proposal || 0,
          stats?.won_leads || 0,
          stats?.lost_leads || 0,
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(234, 179, 8)',
          'rgb(168, 85, 247)',
          'rgb(249, 115, 22)',
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Lead Funnel by Status',
        color: '#6b7280',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700" data-testid="lead-funnel-chart">
      <div style={{ height: '300px' }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default LeadFunnel;
