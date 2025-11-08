import React from 'react';

const LoadingSpinner = ({ size = 'md', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  const spinner = (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-4 border-indigo-200 dark:border-gray-600 border-t-indigo-600 dark:border-t-indigo-500 rounded-full animate-spin`}
        data-testid="loading-spinner"
      ></div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
