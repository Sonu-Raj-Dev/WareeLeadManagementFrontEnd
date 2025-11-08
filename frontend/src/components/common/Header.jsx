import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiUser } from 'react-icons/fi';
import { logout } from '../../store/slices/authSlice';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="app-title">
            Lead Management System
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />

          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg" data-testid="user-info">
            <FiUser className="text-gray-600 dark:text-gray-300" />
            <div className="text-sm">
              <p className="font-medium text-gray-900 dark:text-white">{user?.full_name}</p>
              <p className="text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            data-testid="logout-button"
          >
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
