// src/pages/admin/AdminAnalytics.jsx
import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  IoSearchOutline,
  IoChatbubbleEllipsesOutline,
  IoChevronForwardOutline,
  IoTimeOutline,
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoCloseOutline,
} from 'react-icons/io5';
import { adminService } from '../../services/adminService';
import { SENTIMENT_TONES } from '../../components/admin/Badge';
import Badge from '../../components/admin/Badge';
import Modal from '../../components/admin/Modal';
import Pagination from '../../components/admin/Pagination';
import PageHeader from '../../components/admin/PageHeader';

const SENTIMENTS = ['Happy', 'Satisfied', 'Neutral', 'Confused', 'Angry', 'Frustrated', 'Emergency'];

const formatDate = (value) => {
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
  <div className="rounded-xl border border-border-default bg-surface-muted p-3">
    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-subtle">{label}</p>
    <p className="mt-1 text-base font-bold text-fg">{value}</p>
  </div>
);

const KeywordChip = ({ children }) => (
  <span className="rounded-full border border-border-default bg-surface-muted px-2.5 py-1 text-xs text-fg-muted">
    {children}
  </span>
);

const ChipGroup = ({ title, items, icon }) => (
  <div className="rounded-xl border border-border-default bg-surface-muted p-3">
    <div className="flex items-center gap-2 text-sm font-semibold text-fg">
      <span className="text-brand">{icon}</span> {title}
    </div>
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {!items?.length && <span className="text-xs text-fg-subtle">None detected</span>}
      {items?.map((item, i) => (
        <KeywordChip key={i}>{item}</KeywordChip>
      ))}
    </div>
  </div>
);

export default function AdminAnalytics() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [type, setType] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [status, setStatus] = useState('');

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: 15,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(type && { type }),
        ...(sentiment && { sentiment }),
        ...(status && { status }),
      };
      const res = await adminService.getConversations(params);
      if (res.success) {
        setItems(res.data.items);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, debouncedSearch, type, sentiment, status]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (id) => {
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await adminService.getConversation(id);
      if (res.success) setDetail(res.data);
      else toast.error(res.message || 'Failed to load conversation');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load conversation');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
  };

  const selectClass =
    'h-11 rounded-xl border border-border-default bg-surface-card px-3 text-sm text-fg capitalize outline-none focus:border-brand focus:ring-1 focus:ring-brand';

  const conv = detail;
  const messages = conv?.messages || [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI Doctor"
        title="Chat Analytics"
        description="Review conversation transcripts, sentiment, topics, and satisfaction across all AI Doctor chats."
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <IoSearchOutline className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle" size={16} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            placeholder="Search by user, topic, or keywords..."
            className="h-11 w-full rounded-xl border border-border-default bg-surface-card pl-10 pr-4 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
          <option value="">All types</option>
          <option value="doctor">Doctor</option>
          <option value="general">General</option>
        </select>
        <select value={sentiment} onChange={(e) => setSentiment(e.target.value)} className={selectClass}>
          <option value="">All sentiment</option>
          {SENTIMENTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="ended">Ended</option>
        </select>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card">
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-fg-muted">No conversations found</div>
        ) : (
          <ul className="divide-y divide-border-default">
            {items.map((conv) => (
              <li key={conv._id}>
                <button
                  type="button"
                  onClick={() => openDetail(conv._id)}
                  className="group flex w-full flex-col gap-3 px-5 py-4 text-left transition hover:bg-surface-muted/40 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {conv.user?.profileImage ? (
                      <img src={conv.user.profileImage} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand">
                        {conv.user?.name
                          ? conv.user.name.slice(0, 2).toUpperCase()
                          : <IoChatbubbleEllipsesOutline className="scale-125" />}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-fg">{conv.user?.name || 'Guest user'}</span>
                        <Badge tone={SENTIMENT_TONES[conv.sentiment] || 'slate'}>{conv.sentiment || 'Neutral'}</Badge>
                        <Badge tone={conv.status === 'active' ? 'sky' : 'slate'}>{conv.status}</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-fg-muted">
                        {conv.summary || conv.topic || `${conv.totalMessages} messages`}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-fg-subtle">
                        {conv.topic ? `Topic: ${conv.topic}` : ''} · {conv.totalMessages} msgs
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-fg-muted sm:shrink-0">
                    <span className="inline-flex items-center gap-1">
                      <IoTimeOutline size={14} /> {formatDuration(conv.durationSeconds)}
                    </span>
                    <span>{formatDate(conv.startedAt)}</span>
                    <IoChevronForwardOutline className="text-fg-subtle transition group-hover:translate-x-0.5 group-hover:text-brand" size={16} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Pagination {...pagination} onPageChange={(page) => setPagination((p) => ({ ...p, page }))} />
      </div>

      {/* Conversation detail modal */}
      <Modal
        open={!!selectedId}
        onClose={closeDetail}
        title="Conversation transcript"
        subtitle="Chat Analytics"
        size="xl"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : conv ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-fg">{conv.user?.name || 'Guest user'}</h3>
              <Badge tone={SENTIMENT_TONES[conv.sentiment] || 'slate'}>{conv.sentiment || 'Neutral'}</Badge>
              <Badge tone={conv.status === 'active' ? 'sky' : 'slate'}>{conv.status}</Badge>
              <Badge tone="violet">{conv.type || 'general'}</Badge>
              <button
                type="button"
                onClick={closeDetail}
                className="ml-auto rounded-md p-1.5 text-fg-muted transition hover:bg-surface-muted hover:text-fg"
                aria-label="Close conversation"
              >
                <IoCloseOutline size={18} />
              </button>
            </div>
            <p className="text-sm text-fg-muted">
              {conv.user?.email || 'No account'} · Started {formatDate(conv.startedAt)}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              <StatPill label="Duration" value={formatDuration(conv.durationSeconds)} />
              <StatPill label="Msgs" value={conv.totalMessages} />
              <StatPill label="User" value={conv.userMessages} />
              <StatPill label="AI" value={conv.aiMessages} />
              <StatPill label="Satisfaction" value={conv.satisfactionScore ? `${conv.satisfactionScore}/5` : '—'} />
              <StatPill label="Avg AI reply" value={conv.avgAiResponseMs ? `${Math.round(conv.avgAiResponseMs / 1000)}s` : '—'} />
            </div>

            {conv.summary && (
              <div className="rounded-xl border border-border-default bg-emerald-500/5 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">AI summary</p>
                <p className="mt-1.5 text-sm leading-relaxed text-fg">{conv.summary}</p>
              </div>
            )}

            {/* Keywords */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ChipGroup title="Keywords" items={conv.keywords} icon={<IoChatbubbleEllipsesOutline size={15} />} />
              <ChipGroup title="Symptoms" items={conv.mentionedSymptoms} icon={<IoAlertCircleOutline size={15} />} />
              <ChipGroup title="Medicines" items={conv.mentionedMedicines} icon={<IoCheckmarkCircleOutline size={15} />} />
              <ChipGroup title="Diseases" items={conv.mentionedDiseases} icon={<IoCheckmarkCircleOutline size={15} />} />
            </div>

            {/* Transcript */}
            <div className="rounded-xl border border-border-default bg-surface-muted">
              <div className="flex items-center justify-between border-b border-border-default px-4 py-3">
                <h4 className="text-sm font-bold text-fg">Transcript</h4>
                <span className="text-xs text-fg-muted">{messages.length} messages</span>
              </div>
              <div className="max-h-[45vh] space-y-4 overflow-y-auto p-4">
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
                              : 'border-border-default bg-surface-card text-fg'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <p className="mt-1 text-[10px] text-fg-subtle">
                          {isUser ? conv.user?.name || 'User' : 'Health AI'} · {formatDate(msg.timestamp)}
                          {msg.responseTimeMs ? ` · reply ${Math.round(msg.responseTimeMs / 1000)}s` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}