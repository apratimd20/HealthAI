// src/pages/admin/AdminReports.jsx
import React from 'react';
import PageHeader from '../../components/admin/PageHeader';
import ChartCard from '../../components/admin/ChartCard';
import Button from '../../components/ui/Button';
import { IoDownloadOutline } from 'react-icons/io5';

const UPCOMING = [
  { title: 'Weekly community digest', desc: 'Top posts, engagement spikes, and moderator actions from the last 7 days.' },
  { title: 'AI Doctor quality report', desc: 'Sentiment mix, resolution rates, and common failure topics for doctor chats.' },
  { title: 'Growth report', desc: 'Signup sources, retention cohorts, and monthly active user trends.' },
];

export default function AdminReports() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        description="Scheduled, downloadable summaries generated from your analytics data."
        actions={
          <Button variant="secondary" icon={<IoDownloadOutline size={17} />}>
            Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {UPCOMING.map((report, i) => (
          <ChartCard key={i} title={report.title} subtitle={report.desc}>
            <div className="flex items-center justify-between rounded-xl border border-dashed border-border-default bg-surface-muted px-4 py-6">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-fg-subtle">Coming soon</span>
            </div>
          </ChartCard>
        ))}
      </div>
    </div>
  );
}