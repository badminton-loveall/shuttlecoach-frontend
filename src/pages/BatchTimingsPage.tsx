import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import TemplatesTab from '../components/TemplatesTab';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages.css';

/**
 * BatchTimingsPage
 * Standalone CRUD page for batch time templates (day/time session slots).
 * Previously only reachable as a tab inside Settings — promoted to a top-level
 * page now that template selection happens per-student rather than via the
 * batch creation wizard.
 */
const BatchTimingsPage: React.FC = () => {
  const { role } = useAuth();
  const isReadOnly = role !== 'HEAD_COACH';

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Batch timings</h1>
              <p className="page-header-subtitle">Manage reusable day/time session templates</p>
            </div>
          </div>

          <TemplatesTab readOnly={isReadOnly} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BatchTimingsPage;
