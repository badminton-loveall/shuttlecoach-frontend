import React, { useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import TemplatesTab from '../components/TemplatesTab';
import type { TemplatesTabHandle } from '../components/TemplatesTab';
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
  const templatesTabRef = useRef<TemplatesTabHandle>(null);

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="section-stack">
          <div className="page-header">
            <div>
              <h1 className="page-header-title">Batch</h1>
              <p className="page-header-subtitle">Manage reusable day/time session slots</p>
            </div>
            {!isReadOnly && (
              <div className="page-header-actions">
                <button
                  onClick={() => templatesTabRef.current?.openCreateModal()}
                  className="btn-create-fee"
                  aria-label="Create Batch"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                  Create Batch
                </button>
              </div>
            )}
          </div>

          <TemplatesTab ref={templatesTabRef} readOnly={isReadOnly} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BatchTimingsPage;
