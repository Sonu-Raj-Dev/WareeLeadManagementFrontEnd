import React from 'react';
import { FiUsers, FiUserPlus, FiUserCheck, FiTrendingUp, FiDollarSign, FiX } from 'react-icons/fi';

const StatsCards = ({ stats }) => {
  const cards = [
    {
      title: 'Total Leads',
      value: stats?.total_leads || 0,
      icon: FiUsers,
      color: 'bg-blue-500',
      testId: 'stat-total-leads',
    },
    {
      title: 'New Leads',
      value: stats?.new_leads || 0,
      icon: FiUserPlus,
      color: 'bg-green-500',
      testId: 'stat-new-leads',
    },
    {
      title: 'Qualified Leads',
      value: stats?.qualified_leads || 0,
      icon: FiUserCheck,
      color: 'bg-purple-500',
      testId: 'stat-qualified-leads',
    },
    {
      title: 'Won Leads',
      value: stats?.won_leads || 0,
      icon: FiTrendingUp,
      color: 'bg-emerald-500',
      testId: 'stat-won-leads',
    },
    {
      title: 'Conversion Rate',
      value: `${stats?.conversion_rate || 0}%`,
      icon: FiTrendingUp,
      color: 'bg-indigo-500',
      testId: 'stat-conversion-rate',
    },
    {
      title: 'Total Revenue',
      value: `$${(stats?.total_revenue || 0).toLocaleString()}`,
      icon: FiDollarSign,
      color: 'bg-yellow-500',
      testId: 'stat-total-revenue',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="dashboard-stats-cards">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
          data-testid={card.testId}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            </div>
            <div className={`${card.color} p-3 rounded-lg`}>
              <card.icon className="text-2xl text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
