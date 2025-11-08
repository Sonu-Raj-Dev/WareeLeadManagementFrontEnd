import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const SourceChart = ({ stats }) => {
  const sourceData = stats?.leads_by_source || {};
  const labels = Object.keys(sourceData);
  const values = Object.values(sourceData);

  const data = {
    labels: labels.length > 0 ? labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)) : ['No Data'],
    datasets: [
      {
        label: 'Leads by Source',
        data: values.length > 0 ? values : [1],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(244, 63, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderColor: [
          'rgb(99, 102, 241)',
          'rgb(34, 197, 94)',
          'rgb(251, 146, 60)',
          'rgb(244, 63, 94)',
          'rgb(168, 85, 247)',
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
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Leads by Source',
        color: '#6b7280',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700" data-testid="source-chart">
      <div style={{ height: '300px' }}>
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
};

export default SourceChart;
