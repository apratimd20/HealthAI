// src/pages/admin/AdminUsers.jsx
import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  IoSearchOutline,
  IoPersonAddOutline,
  IoBanOutline,
  IoCheckmarkCircleOutline,
  IoTrashOutline,
  IoPencilOutline,
  IoMailOutline,
} from 'react-icons/io5';
import { adminService } from '../../services/adminService';
import PageHeader from '../../components/admin/PageHeader';
import Badge from '../../components/admin/Badge';
import Modal from '../../components/admin/Modal';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Pagination from '../../components/admin/Pagination';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const emptyForm = { name: '', email: '', password: '', role: 'user' };

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function AdminUsers() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState(null);
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
        limit: 15,
        sortBy,
        sortOrder,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(role && { role }),
        ...(status && { status }),
      };
      const res = await adminService.getUsers(params);
      if (res.success) {
        setItems(res.data.items);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, sortBy, sortOrder, debouncedSearch, role, status]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await adminService.updateUser(editingId, payload);
        toast.success('User updated');
      } else {
        await adminService.createUser(form);
        toast.success('User created');
      }
      setModalOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingId(user._id);
    setForm({ name: user.name, email: user.email, password: '', role: user.role || 'user' });
    setModalOpen(true);
  };

  const toggleStatus = async (user) => {
    const next = user.status === 'suspended' ? 'active' : 'suspended';
    setBusyId(user._id);
    try {
      await adminService.setUserStatus(user._id, next);
      toast.success(next === 'active' ? 'User activated' : 'User suspended');
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Status change failed');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = (user) => {
    setConfirm({ id: user._id, name: `${user.name} (${user.email})` });
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await adminService.deleteUser(confirm.id);
      toast.success('User deleted');
      setConfirm(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    } finally {
      setSaving(false);
    }
  };

  const selectClass =
    'h-10 rounded-lg border border-border-default bg-surface-card px-3 text-sm text-fg outline-none transition focus:border-brand focus:ring-1 focus:ring-brand';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="People"
        title="User Management"
        description="Create, edit, suspend, or remove users and control platform access."
        actions={
          <Button icon={<IoPersonAddOutline size={17} />} onClick={openCreate}>
            Add user
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
            placeholder="Search by name or email..."
            className="h-11 w-full rounded-xl border border-border-default bg-surface-card pl-10 pr-4 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={role} onChange={(e) => { setRole(e.target.value); }} className={selectClass}>
            <option value="">All roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <select value={status} onChange={(e) => { setStatus(e.target.value); }} className={selectClass}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={selectClass}>
            <option value="createdAt">Newest</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="lastActiveAt">Last active</option>
          </select>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={selectClass}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-muted text-fg-muted">
              <tr>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Activity</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-border-default">
                    <td colSpan="6" className="px-5 py-4"><div className="h-6 animate-pulse rounded bg-surface-muted" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-14 text-center text-fg-muted">No users found</td>
                </tr>
              ) : (
                items.map((user) => (
                  <tr key={user._id} className="border-t border-border-default transition hover:bg-surface-muted/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand">
                            {user.name?.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-fg">{user.name}</p>
                          <p className="flex items-center gap-1 text-xs text-fg-muted">
                            <IoMailOutline size={11} /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={user.role === 'admin' ? 'violet' : 'slate'}>{user.role || 'user'}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={user.status === 'suspended' ? 'red' : 'emerald'}>
                        {user.status || 'active'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-3 text-xs text-fg-muted">
                        <span>{user.totalChats ?? 0} chats</span>
                        <span>{user.totalPosts ?? 0} posts</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-fg-muted">{formatDate(user.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <IconButton title="Edit" onClick={() => openEdit(user)}>
                          <IoPencilOutline size={16} />
                        </IconButton>
                        <IconButton
                          title={user.status === 'suspended' ? 'Activate' : 'Suspend'}
                          onClick={() => toggleStatus(user)}
                          disabled={busyId === user._id}
                          className={user.status === 'suspended' ? 'text-emerald-300' : 'text-amber-300'}
                        >
                          {user.status === 'suspended' ? <IoCheckmarkCircleOutline size={16} /> : <IoBanOutline size={16} />}
                        </IconButton>
                        <IconButton title="Delete" onClick={() => confirmDelete(user)} className="text-red-400">
                          <IoTrashOutline size={16} />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination {...pagination} onPageChange={(page) => setPagination((p) => ({ ...p, page }))} />
      </div>

      {/* Create / edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit user' : 'Add user'}
        subtitle="Management"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" form="user-form" loading={saving}>
              {editingId ? 'Save changes' : 'Create user'}
            </Button>
          </div>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input
            label={editingId ? 'New password (leave blank to keep)' : 'Password'}
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editingId}
            minLength={6}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-fg-muted">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className={selectClass}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={saving}
        title="Delete this user?"
        message={`This permanently removes ${confirm?.name}. This action cannot be undone.`}
        confirmText="Delete user"
      />
    </div>
  );
}

const IconButton = ({ children, title, onClick, disabled, className = 'text-fg-muted' }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    disabled={disabled}
    className={`flex h-9 w-9 items-center justify-center rounded-lg border border-border-default bg-transparent transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
  >
    {children}
  </button>
);