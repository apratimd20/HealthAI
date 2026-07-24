import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from './Button';
import Card from './Card';
import { healthService } from '../../services/healthService';
import toast from 'react-hot-toast';
import { IoAlertCircleOutline, IoCloseOutline } from 'react-icons/io5';

export default function CancelGoalModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCancel = async () => {
    setLoading(true);
    try {
      const response = await healthService.cancelGoal();
      if (response.success) {
        toast.success('Your current active goal has been deactivated.');
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to cancel the goal.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Error occurred while canceling the goal.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal backdrop"
      />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
      >
        <Card className="glass-panel relative text-center" glow>
          <button
            type="button"
            className="absolute right-4 top-4 text-fg-muted hover:text-fg"
            onClick={onClose}
            aria-label="Close modal"
          >
            <IoCloseOutline size={24} />
          </button>

          <IoAlertCircleOutline className="mx-auto mb-4 text-5xl text-danger" />
          <h2 className="text-xl font-bold text-fg">Deactivate current goal?</h2>
          <p className="mt-3 text-sm leading-relaxed text-fg-muted">
            This hides your daily meal plan, calorie targets, and schedules until you set a new goal.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Keep Active
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              loading={loading}
              className="border-danger text-danger hover:border-danger hover:text-danger"
            >
              Confirm Cancel
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
