import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const DistrictChart = ({ stats }) => {
  const districtData = stats?.leads_by_district || {};
  const labels = Object.keys(districtData);
  const values = Object.values(districtData);

  const data = {
    labels: labels.length > 0 ? labels : ['No Data'],
    datasets: [
      {
        label: 'Leads by District',
        data: values.length > 0 ? values : [1],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(234, 179, 8, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(249, 115, 22)',
          'rgb(168, 85, 247)',
          'rgb(236, 72, 153)',
          'rgb(234, 179, 8)',
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
        text: 'Leads by District',
        color: '#6b7280',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700" data-testid="district-chart">
      <div style={{ height: '300px' }}>
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};

export default DistrictChart;
