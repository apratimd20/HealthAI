// src/pages/admin/AdminCommunity.jsx
import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  IoSearchOutline,
  IoAddOutline,
  IoChatbubbleEllipsesOutline,
  IoHeartOutline,
  IoEyeOffOutline,
  IoEyeOutline,
  IoTrashOutline,
  IoPencilOutline,
} from 'react-icons/io5';
import { adminService } from '../../services/adminService';
import { POST_STATUS_TONES } from '../../components/admin/Badge';
import Badge from '../../components/admin/Badge';
import Modal from '../../components/admin/Modal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Pagination from '../../components/admin/Pagination';
import PageHeader from '../../components/admin/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const emptyDraft = () => ({
  content: '',
  caption: '',
  foodName: '',
  title: '',
  authorName: 'Health AI',
  isPublic: true,
});

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function AdminCommunity() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async (opts = {}) => {
    setLoading(true);
    try {
      const params = {
        page: opts.page ?? pagination.page,
        limit: 10,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(status && { status }),
      };
      const res = await adminService.getPosts(params);
      if (res.success) {
        setItems(res.data.items);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, debouncedSearch, status]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setModalOpen(true);
  };

  const openEdit = (post) => {
    setEditingId(post._id);
    setDraft({
      content: post.content || '',
      caption: post.caption || '',
      foodName: post.foodName || '',
      title: post.title || '',
      authorName: post.authorName || 'Health AI',
      isPublic: post.isPublic !== false,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!draft.content && !draft.caption && !draft.title) {
      toast.error('Post content is required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await adminService.updatePost(editingId, draft);
        toast.success('Post updated');
      } else {
        await adminService.createPost(draft);
        toast.success('Post created');
      }
      setModalOpen(false);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save post failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (post) => {
    const next = post.status === 'hidden' ? 'active' : 'hidden';
    setBusyId(post._id);
    try {
      await adminService.setPostStatus(post._id, next);
      toast.success(next === 'active' ? 'Post published' : 'Post hidden');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = (post) => {
    setConfirm({ id: post._id, title: post.title || post.caption || post.foodName || `Post ${post._id}` });
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await adminService.deletePost(confirm.id);
      toast.success('Post deleted');
      setConfirm(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    } finally {
      setSaving(false);
    }
  };

  const actionBtn =
    'flex h-9 w-9 items-center justify-center rounded-lg border border-border-default text-fg-muted transition hover:bg-surface-muted hover:text-fg disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Engagement"
        title="Community Management"
        description="Publish admin announcements, moderate posts, and control what the community sees."
        actions={
          <Button icon={<IoAddOutline size={17} />} onClick={openCreate}>
            New post
          </Button>
        }
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
            placeholder="Search posts by title, content, or author..."
            className="h-11 w-full rounded-xl border border-border-default bg-surface-card pl-10 pr-4 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 rounded-xl border border-border-default bg-surface-card px-3 text-sm text-fg capitalize outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-border-default bg-surface-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-default py-20 text-center text-fg-muted">
          No community posts found
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((post) => (
            <div key={post._id} className="rounded-2xl border border-border-default bg-surface-card p-5 transition hover:border-brand/25">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={POST_STATUS_TONES[post.status] || 'slate'}>{post.status}</Badge>
                    {post.createdBy === 'admin' && <Badge tone="violet">Admin post</Badge>}
                    {!post.isPublic && <Badge tone="amber">Private</Badge>}
                  </div>
                  <h3 className="mt-2 truncate text-base font-bold text-fg">
                    {post.title || post.caption || post.foodName || 'Untitled post'}
                  </h3>
                  <p className="mt-1 text-sm text-fg-muted">{post.authorName} · {formatDate(post.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" title="Edit" aria-label="Edit" onClick={() => openEdit(post)} className={actionBtn}>
                    <IoPencilOutline size={16} />
                  </button>
                  <button
                    type="button"
                    title={post.status === 'hidden' ? 'Publish' : 'Hide'}
                    aria-label={post.status === 'hidden' ? 'Publish' : 'Hide'}
                    onClick={() => toggleVisibility(post)}
                    disabled={busyId === post._id}
                    className={actionBtn}
                  >
                    {post.status === 'hidden' ? <IoEyeOutline size={16} /> : <IoEyeOffOutline size={16} />}
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    aria-label="Delete"
                    onClick={() => confirmDelete(post)}
                    className={`${actionBtn} text-red-400`}
                  >
                    <IoTrashOutline size={16} />
                  </button>
                </div>
              </div>

              {post.content && <p className="mt-3 text-sm text-fg-muted">{post.content}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-fg-muted">
                <span className="inline-flex items-center gap-1"><IoChatbubbleEllipsesOutline size={14} /> {post.commentsCount || 0} comments</span>
                <span className="inline-flex items-center gap-1"><IoHeartOutline size={14} /> {post.likesCount || 0} likes</span>
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => (prev === post._id ? null : post._id))}
                  className="ml-auto inline-flex items-center gap-1 font-medium text-brand hover:underline"
                >
                  {expanded === post._id ? 'Hide comments' : `View ${post.comments?.length || 0} comments`}
                </button>
              </div>

              {expanded === post._id && (
                <div className="mt-4 space-y-2 border-t border-border-default pt-4">
                  {post.comments?.length === 0 && <p className="text-sm text-fg-muted">No comments yet</p>}
                  {post.comments?.map((c) => (
                    <div key={c._id} className="rounded-xl border border-border-default bg-surface-muted px-3 py-2.5">
                      <p className="text-xs font-semibold text-fg">{c.user?.name || c.authorName || 'User'}</p>
                      <p className="mt-0.5 text-sm text-fg-muted">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Pagination {...pagination} onPageChange={(page) => setPagination((p) => ({ ...p, page }))} />

      {/* Create / edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit post' : 'New community post'}
        subtitle="Community"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="post-form" loading={saving}>
              {editingId ? 'Save changes' : 'Publish post'}
            </Button>
          </div>
        }
      >
        <form id="post-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Author name" value={draft.authorName} onChange={(e) => setDraft({ ...draft, authorName: e.target.value })} />
            <Input label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Caption" value={draft.caption} onChange={(e) => setDraft({ ...draft, caption: e.target.value })} />
            <Input label="Food name" value={draft.foodName} onChange={(e) => setDraft({ ...draft, foodName: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-fg-muted">Content</label>
            <textarea
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              placeholder="Write the post body..."
              className="min-h-[120px] w-full rounded-xl border border-border-default bg-surface-card px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-fg-muted">
            <input
              type="checkbox"
              checked={draft.isPublic}
              onChange={(e) => setDraft({ ...draft, isPublic: e.target.checked })}
              className="h-4 w-4 rounded border-border-default bg-surface-card"
            />
            Public post (visible to all users)
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={saving}
        title="Delete this post?"
        message={`This permanently removes "${confirm?.title}". This action cannot be undone.`}
        confirmText="Delete post"
      />
    </div>
  );
}