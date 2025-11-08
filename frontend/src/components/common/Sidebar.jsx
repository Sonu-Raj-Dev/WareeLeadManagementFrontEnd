import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiUsers, FiUserPlus, FiMap, FiFileText } from 'react-icons/fi';
import { useSelector } from 'react-redux';

const Sidebar = () => {
  const { user } = useSelector((state) => state.auth);

  const navItems = [
    { path: '/', icon: FiHome, label: 'Dashboard', roles: ['admin', 'manager', 'sales'] },
    { path: '/leads', icon: FiUsers, label: 'Leads', roles: ['admin', 'manager', 'sales'] },
    { path: '/users', icon: FiUserPlus, label: 'Users', roles: ['admin', 'manager'] },
    { path: '/districts', icon: FiMap, label: 'Districts', roles: ['admin', 'manager'] },
    { path: '/reports', icon: FiFileText, label: 'Reports', roles: ['admin', 'manager'] },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen">
      <nav className="p-4 space-y-2">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <item.icon className="text-xl" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
