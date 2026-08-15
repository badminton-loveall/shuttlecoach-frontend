import React from 'react';
import './ConfirmDialog.css';

/**
 * ConfirmDialog
 * A reusable styled confirmation modal that replaces native window.confirm().
 * Separated header bar, body message, and footer actions.
 */

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const confirmBtnClass =
    variant === 'danger'
      ? 'btn btn-danger'
      : 'btn btn-primary';

  return (
    <div className="confirm-dialog__overlay" onClick={onCancel}>
      <div className="confirm-dialog__content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog__header">
          <h2 className="confirm-dialog__title">{title}</h2>
        </div>

        <div className="confirm-dialog__body">
          <p className="confirm-dialog__message">{message}</p>
        </div>

        <div className="confirm-dialog__actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={confirmBtnClass} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
