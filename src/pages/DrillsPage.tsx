import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { DrillsTab } from '../components/DrillsTab';
import { useAuth } from '../contexts/AuthContext';

/**
 * DrillsPage
 * Standalone page for managing drills, accessible under Training menu.
 * HEAD_COACH gets full CRUD, ASSISTANT_COACH gets read-only view.
 */
const DrillsPage: React.FC = () => {
  const { role } = useAuth();
  const isReadOnly = role !== 'HEAD_COACH';

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">
          <DrillsTab readOnly={isReadOnly} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DrillsPage;
