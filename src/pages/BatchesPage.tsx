import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import BatchesTab from '../components/BatchesTab';
import { useAuth } from '../contexts/AuthContext';

/**
 * BatchesPage
 * Standalone page for managing batches, accessible under Training menu.
 * HEAD_COACH gets full CRUD, ASSISTANT_COACH gets read-only view.
 */
const BatchesPage: React.FC = () => {
  const { role } = useAuth();
  const isReadOnly = role !== 'HEAD_COACH';

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">
          <BatchesTab readOnly={isReadOnly} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BatchesPage;
