// src/components/admin/ConfirmDialog.jsx
import React from 'react';
import { IoWarningOutline } from 'react-icons/io5';
import Modal from './Modal';
import Button from '../ui/Button';

const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = true, loading = false }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirm action"
      subtitle="Please review"
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <IoWarningOutline size={22} />
        </div>
        <div>
          <h4 className="text-base font-bold text-fg">{title}</h4>
          <p className="mt-1 text-sm text-fg-muted">{message}</p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;