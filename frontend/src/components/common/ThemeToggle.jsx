import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../store/slices/themeSlice';
import { FiSun, FiMoon } from 'react-icons/fi';

const ThemeToggle = () => {
  const dispatch = useDispatch();
  const { mode } = useSelector((state) => state.theme);

  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      aria-label="Toggle theme"
      data-testid="theme-toggle-button"
    >
      {mode === 'light' ? (
        <FiMoon className="text-gray-700 dark:text-gray-300 text-xl" />
      ) : (
        <FiSun className="text-gray-700 dark:text-gray-300 text-xl" />
      )}
    </button>
  );
};

export default ThemeToggle;
