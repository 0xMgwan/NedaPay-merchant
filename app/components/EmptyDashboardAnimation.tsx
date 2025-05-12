import React from 'react';

const EmptyDashboardAnimation: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 animate-fade-in">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="56" stroke="#3B82F6" strokeWidth="8" fill="#EFF6FF" />
        <rect x="35" y="50" width="50" height="30" rx="8" fill="#60A5FA" />
        <rect x="50" y="60" width="20" height="10" rx="3" fill="#DBEAFE" />
        <circle cx="60" cy="65" r="3" fill="#3B82F6" />
      </svg>
      <h3 className="mt-6 text-lg font-semibold text-gray-700 dark:text-gray-200">No Data Yet</h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs mt-2">
        You haven&apos;t received any transactions yet.<br />
        Share your payment link or start accepting payments to see analytics and growth here!
      </p>
    </div>
  );
};

export default EmptyDashboardAnimation;
