// src/pages/admin/AdminConversationDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  IoArrowBackOutline,
  IoTrashOutline,
  IoChatbubbleEllipsesOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
} from 'react-icons/io5';
import { adminService } from '../../services/adminService';
import { SENTIMENT_TONES } from '../../components/admin/Badge';
import Badge from '../../components/admin/Badge';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Button from '../../components/ui/Button';

const formatTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatDuration = (seconds) => {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}m ${s}s` : `${s}s`;
};

const StatPill = ({ label, value }) => (
  <div className="rounded-xl border border-border-default bg-surface-card p-4">
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">{label}</p>
    <p className="mt-1.5 text-lg font-bold text-fg">{value}</p>
  </div>
);

const KeywordChip = ({ children }) => (
  <span className="rounded-full border border-border-default bg-surface-muted px-2.5 py-1 text-xs text-fg-muted">
    {children}
  </span>
);

export default function AdminConversationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [conv, setConv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminService.getConversation(id);
        if (res.success) setConv(res.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load conversation');
        navigate('/admin/analytics');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminService.deleteConversation(id);
      toast.success('Conversation deleted');
      navigate('/admin/analytics');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded bg-surface-muted" />
        <div className="h-56 animate-pulse rounded-2xl border border-border-default bg-surface-card" />
      </div>
    );
  }

  if (!conv) return null;

  const { user, messages = [] } = conv;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/admin/analytics')}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted transition hover:text-brand"
          >
            <IoArrowBackOutline size={16} /> Back to analytics
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-fg">
              {user?.name || 'Guest conversation'}
            </h1>
            <Badge tone={SENTIMENT_TONES[conv.sentiment] || 'slate'}>{conv.sentiment || 'Neutral'}</Badge>
            <Badge tone={conv.status === 'active' ? 'sky' : 'slate'}>{conv.status}</Badge>
            <Badge tone="violet">{conv.type || 'general'}</Badge>
          </div>
          <p className="mt-1.5 text-sm text-fg-muted">
            {user?.email || 'No account'} · Started {formatTime(conv.startedAt)}
          </p>
        </div>
        <Button variant="danger" icon={<IoTrashOutline size={16} />} onClick={() => setConfirmOpen(true)}>
          Delete conversation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatPill label="Duration" value={formatDuration(conv.durationSeconds)} />
        <StatPill label="Messages" value={conv.totalMessages} />
        <StatPill label="User msgs" value={conv.userMessages} />
        <StatPill label="AI msgs" value={conv.aiMessages} />
        <StatPill label="Satisfaction" value={conv.satisfactionScore ? `${conv.satisfactionScore}/5` : '—'} />
        <StatPill label="Avg AI reply" value={conv.avgAiResponseMs ? `${Math.round(conv.avgAiResponseMs / 1000)}s` : '—'} />
      </div>

      {/* AI summary */}
      {conv.summary && (
        <div className="rounded-2xl border border-border-default bg-gradient-to-br from-emerald-500/5 to-transparent p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand">AI summary</p>
          <p className="mt-2 text-sm leading-relaxed text-fg">{conv.summary}</p>
        </div>
      )}

      {/* Keywords / symptoms / medicines / diseases */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ChipGroup title="Keywords" items={conv.keywords} icon={<IoChatbubbleEllipsesOutline size={15} />} />
        <ChipGroup title="Symptoms" items={conv.mentionedSymptoms} icon={<IoAlertCircleOutline size={15} />} />
        <ChipGroup title="Medicines" items={conv.mentionedMedicines} icon={<IoCheckmarkCircleOutline size={15} />} />
        <ChipGroup title="Diseases" items={conv.mentionedDiseases} icon={<IoCheckmarkCircleOutline size={15} />} />
      </div>

      {/* Transcript */}
      <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card">
        <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
          <h2 className="text-base font-bold text-fg">Transcript</h2>
          <span className="text-xs text-fg-muted">{messages.length} messages</span>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-fg-muted">This conversation has no messages.</p>
          )}
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg._id || i} className={`flex gap-3 ${isUser ? '' : 'flex-row-reverse'}`}>
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isUser ? 'bg-brand/15 text-brand' : 'bg-violet-500/15 text-violet-300'
                  }`}
                >
                  {isUser ? <IoPersonOutline size={15} /> : <IoChatbubbleEllipsesOutline size={15} />}
                </div>
                <div className={`max-w-[75%] ${isUser ? '' : 'text-right'}`}>
                  <div
                    className={`inline-block rounded-2xl border px-4 py-2.5 text-left text-sm leading-relaxed ${
                      isUser
                        ? 'border-brand/25 bg-brand/10 text-fg'
                        : 'border-border-default bg-surface-muted text-fg'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className="mt-1 text-[10px] text-fg-subtle">
                    {isUser ? user?.name || 'User' : 'Health AI'} · {formatTime(msg.timestamp)}
                    {msg.responseTimeMs ? ` · reply ${Math.round(msg.responseTimeMs / 1000)}s` : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this conversation?"
        message="The full transcript and its analytics will be permanently removed."
        confirmText="Delete conversation"
      />
    </div>
  );
}

const ChipGroup = ({ title, items, icon }) => (
  <div className="rounded-2xl border border-border-default bg-surface-card p-4">
    <div className="flex items-center gap-2 text-sm font-semibold text-fg">
      <span className="text-brand">{icon}</span> {title}
    </div>
    <div className="mt-3 flex flex-wrap gap-1.5">
      {!items?.length && <span className="text-xs text-fg-subtle">None detected</span>}
      {items?.map((item, i) => (
        <KeywordChip key={i}>{item}</KeywordChip>
      ))}
    </div>
  </div>
);