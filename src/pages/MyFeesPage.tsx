import React from 'react';
import DashboardLayout from '../components/DashboardLayout';

/**
 * MyFeesPage
 * Displays student's own fee records
 */

export const MyFeesPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="mb-12">
          <h1 className="text-[36px] font-bold text-slate-900 dark:text-slate-50 leading-tight mb-2">My Fees</h1>
          <p className="text-slate-600 dark:text-slate-400">My fees page - content coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyFeesPage;
