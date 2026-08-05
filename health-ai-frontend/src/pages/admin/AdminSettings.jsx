// src/pages/admin/AdminSettings.jsx
import React from 'react';
import { IoSettingsOutline } from 'react-icons/io5';
import PageHeader from '../../components/admin/PageHeader';
import Button from '../../components/ui/Button';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Manage platform-wide preferences and system configuration."
      />

      <div className="rounded-2xl border border-dashed border-border-default py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-muted text-fg-subtle">
          <IoSettingsOutline size={30} />
        </div>
        <h3 className="mt-4 text-lg font-bold text-fg">Settings module in progress</h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-fg-muted">
          Theme preferences, notification defaults, AI model configuration, and platform banners will live here.
        </p>
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" disabled>Save preferences</Button>
        </div>
      </div>
    </div>
  );
}