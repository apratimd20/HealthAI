import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.token = token;
  return config;
});

const emptyForm = { name: '', email: '', password: '', role: 'user' };

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, admins: 0, activeUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communityDraft, setCommunityDraft] = useState({ content: '', caption: '', foodName: '', isPublic: true });
  const [editingPostId, setEditingPostId] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentEditing, setCommentEditing] = useState({});

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (usersRes.data.success) setUsers(usersRes.data.data);
    } catch (error) {
      console.error('Admin fetch error:', error);
      toast.error(error.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunityPosts = async () => {
    try {
      setCommunityLoading(true);
      const response = await api.get('/admin/community/posts');
      if (response.data.success) setCommunityPosts(response.data.data || []);
    } catch (error) {
      console.error('Community fetch error:', error);
      toast.error(error.response?.data?.message || 'Failed to load community posts');
    } finally {
      setCommunityLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchCommunityPosts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        const response = await api.put(`/admin/users/${editingId}`, payload);
        if (response.data.success) {
          toast.success('User updated successfully');
        }
      } else {
        const response = await api.post('/admin/users', form);
        if (response.data.success) {
          toast.success('User created successfully');
        }
      }

      setForm(emptyForm);
      setEditingId(null);
      setShowUserModal(false);
      await fetchAdminData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingId(user._id);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role || 'user',
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;

    try {
      const response = await api.delete(`/admin/users/${id}`);
      if (response.data.success) {
        toast.success('User deleted');
        await fetchAdminData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowUserModal(false);
  };

  const handleCommunitySave = async (e) => {
    e.preventDefault();
    if (!communityDraft.content && !communityDraft.caption) {
      toast.error('Post content is required');
      return;
    }

    try {
      if (editingPostId) {
        const response = await api.put(`/admin/community/posts/${editingPostId}`, communityDraft);
        if (response.data.success) toast.success('Post updated successfully');
      } else {
        const response = await api.post('/admin/community/posts', communityDraft);
        if (response.data.success) toast.success('Post created successfully');
      }

      setCommunityDraft({ content: '', caption: '', foodName: '', isPublic: true });
      setEditingPostId(null);
      await fetchCommunityPosts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save post');
    }
  };

  const handleEditPost = (post) => {
    setEditingPostId(post._id);
    setCommunityDraft({
      content: post.content || '',
      caption: post.caption || '',
      foodName: post.foodName || '',
      isPublic: post.isPublic !== false,
    });
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this community post?')) return;
    try {
      const response = await api.delete(`/admin/community/posts/${postId}`);
      if (response.data.success) {
        toast.success('Post deleted');
        await fetchCommunityPosts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleAddComment = async (postId) => {
    const text = (commentDrafts[postId] || '').trim();
    if (!text) {
      toast.error('Comment text is required');
      return;
    }

    try {
      const response = await api.post(`/admin/community/posts/${postId}/comments`, { text });
      if (response.data.success) {
        toast.success('Comment added');
        setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
        await fetchCommunityPosts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleEditComment = async (postId, commentId) => {
    const text = (commentEditing[commentId] || '').trim();
    if (!text) {
      toast.error('Comment text is required');
      return;
    }

    try {
      const response = await api.put(`/admin/community/posts/${postId}/comments/${commentId}`, { text });
      if (response.data.success) {
        toast.success('Comment updated');
        setCommentEditing((prev) => ({ ...prev, [commentId]: '' }));
        await fetchCommunityPosts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const response = await api.delete(`/admin/community/posts/${postId}/comments/${commentId}`);
      if (response.data.success) {
        toast.success('Comment deleted');
        await fetchCommunityPosts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const totalCards = useMemo(
    () => [
      { label: 'Total users', value: stats.totalUsers, accent: 'text-emerald-300' },
      { label: 'Admins', value: stats.admins, accent: 'text-violet-300' },
      { label: 'New this month', value: stats.activeUsers, accent: 'text-cyan-300' },
    ],
    [stats]
  );

  const getRoleClass = (role) =>
    role === 'admin'
      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
      : 'bg-slate-500/15 text-slate-200 border border-slate-500/30';

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-3xl border border-border-default bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 p-6 shadow-[0_20px_60px_rgba(16,185,129,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-400">Admin workspace</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">Admin dashboard</h1>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button variant="secondary" onClick={() => { setEditingId(null); setForm(emptyForm); setShowUserModal(true); }} className="w-full sm:w-auto">
                + Add user
              </Button>
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className="inline-flex w-full items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/15 sm:w-auto"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {totalCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-border-default bg-surface-card p-5 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
              <p className="text-sm font-medium text-fg-muted">{card.label}</p>
              <div className="mt-4 flex items-end justify-between gap-3">
                <h2 className={`text-3xl font-bold ${card.accent}`}>{card.value}</h2>
                <div className="rounded-full border border-border-default bg-surface-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-subtle">
                  Live
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-border-default bg-surface-card shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">Members</p>
              <h3 className="mt-2 text-xl font-bold text-white">All users</h3>
            </div>
            <span className="rounded-full border border-border-default bg-surface-muted px-2.5 py-1 text-xs font-medium text-fg-muted">
              {users.length} total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-muted text-fg-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-10 text-center text-fg-muted">Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-10 text-center text-fg-muted">No users found</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="border-t border-border-default transition hover:bg-surface-muted/40">
                      <td className="px-5 py-4 font-medium text-white">{user.name}</td>
                      <td className="px-5 py-4 text-fg-muted">{user.email}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getRoleClass(user.role)}`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-fg-muted">{formatDate(user.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" className="rounded-md border border-border-default px-2.5 py-1.5 text-xs font-medium text-fg-muted hover:bg-surface-muted hover:text-white" onClick={() => handleEditUser(user)}>Edit</button>
                          <button type="button" className="rounded-md border border-red-500/30 bg-red-500/5 px-2.5 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10" onClick={() => handleDeleteUser(user._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-border-default bg-surface-card p-5 shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">Community</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Post and comment management</h3>
            </div>
            <Button variant="secondary" onClick={() => { setEditingPostId(null); setCommunityDraft({ content: '', caption: '', foodName: '', isPublic: true }); }} className="w-full md:w-auto">+ Add post</Button>
          </div>

          <form onSubmit={handleCommunitySave} className="mb-6 rounded-xl border border-border-default bg-surface-muted p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Caption" value={communityDraft.caption} onChange={(e) => setCommunityDraft((prev) => ({ ...prev, caption: e.target.value }))} />
              <Input label="Food name" value={communityDraft.foodName} onChange={(e) => setCommunityDraft((prev) => ({ ...prev, foodName: e.target.value }))} />
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-fg-muted">Content</label>
              <textarea
                value={communityDraft.content}
                onChange={(e) => setCommunityDraft((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Write a community post..."
                className="min-h-[110px] w-full rounded-md border border-border-default bg-surface-base px-3 py-2.5 text-sm text-white placeholder:text-fg-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-fg-muted">
                <input type="checkbox" checked={communityDraft.isPublic} onChange={(e) => setCommunityDraft((prev) => ({ ...prev, isPublic: e.target.checked }))} className="h-4 w-4 rounded border-border-default bg-surface-base" />
                Public post
              </label>

              <Button type="submit" className="min-w-[140px]">
                {editingPostId ? 'Update post' : 'Create post'}
              </Button>
            </div>
          </form>

          {communityLoading ? (
            <div className="py-10 text-center text-fg-muted">Loading community posts...</div>
          ) : communityPosts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-default py-10 text-center text-fg-muted">No community posts found</div>
          ) : (
            <div className="space-y-5">
              {communityPosts.map((post) => (
                <div key={post._id} className="rounded-xl border border-border-default bg-surface-muted p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-fg-subtle">
                        <span>{post.user?.name || 'Unknown user'}</span>
                        <span>•</span>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                      <h4 className="mt-2 text-lg font-semibold text-white">{post.caption || post.foodName || 'Community post'}</h4>
                      <p className="mt-2 text-sm text-fg-muted">{post.content}</p>
                    </div>

                    <div className="flex gap-2">
                      <button type="button" className="rounded-md border border-border-default px-2.5 py-1.5 text-xs font-medium text-fg-muted hover:bg-surface-base" onClick={() => handleEditPost(post)}>Edit</button>
                      <button type="button" className="rounded-md border border-red-500/30 bg-red-500/5 px-2.5 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10" onClick={() => handleDeletePost(post._id)}>Delete</button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-fg-muted">
                    <span className="rounded-full border border-border-default px-2 py-1">{post.isPublic ? 'Public' : 'Private'}</span>
                    <span className="rounded-full border border-border-default px-2 py-1">{post.commentsCount || post.comments?.length || 0} comments</span>
                  </div>

                  <div className="mt-5 space-y-3 border-t border-border-default pt-4">
                    {(post.comments || []).map((comment) => (
                      <div key={comment._id} className="rounded-lg border border-border-default bg-surface-base p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">{comment.user?.name || 'User'}</p>
                            {commentEditing[comment._id] !== undefined ? (
                              <input
                                value={commentEditing[comment._id]}
                                onChange={(e) => setCommentEditing((prev) => ({ ...prev, [comment._id]: e.target.value }))}
                                className="mt-2 w-full rounded-md border border-border-default bg-surface-muted px-2 py-1.5 text-sm text-white"
                              />
                            ) : (
                              <p className="mt-1 text-sm text-fg-muted">{comment.text}</p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {commentEditing[comment._id] !== undefined ? (
                              <button type="button" className="text-xs text-emerald-300" onClick={() => handleEditComment(post._id, comment._id)}>Save</button>
                            ) : (
                              <button type="button" className="text-xs text-fg-muted" onClick={() => setCommentEditing((prev) => ({ ...prev, [comment._id]: comment.text }))}>Edit</button>
                            )}
                            <button type="button" className="text-xs text-red-300" onClick={() => handleDeleteComment(post._id, comment._id)}>Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <input
                      value={commentDrafts[post._id] || ''}
                      onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post._id]: e.target.value }))}
                      placeholder="Write a comment..."
                      className="flex-1 rounded-md border border-border-default bg-surface-base px-3 py-2 text-sm text-white placeholder:text-fg-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    <button type="button" className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-400" onClick={() => handleAddComment(post._id)}>Add</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-default bg-surface-card p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-fg-subtle">Confirm sign out</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Are you sure you want to logout?</h3>
            </div>

            <p className="text-sm text-fg-muted">You will be signed out of the admin dashboard and redirected to the login page.</p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-border-default px-3 py-2 text-sm text-fg-muted hover:bg-surface-muted"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/15"
                onClick={() => {
                  logout();
                  setShowLogoutModal(false);
                  navigate('/login');
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-default bg-surface-card p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{editingId ? 'Edit user' : 'Add user'}</h3>
              <button type="button" className="text-sm text-fg-muted hover:text-white" onClick={resetForm}>Close</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label={editingId ? 'New password (optional)' : 'Password'} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-fg-muted">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-md border border-border-default bg-surface-base px-3 py-2.5 text-sm text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="rounded-md border border-border-default px-3 py-2 text-sm text-fg-muted hover:bg-surface-muted" onClick={resetForm}>Cancel</button>
                <Button type="submit" loading={saving} className="min-w-[120px]">{editingId ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
