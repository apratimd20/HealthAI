// routes/admin.route.js
import express from 'express';
import User from '../models/user.models.js';
import Post from '../models/post.models.js';
import Conversation from '../models/conversation.model.js';
import ActivityEvent from '../models/activityEvent.model.js';
import { authUser } from '../middleware/user.middleware.js';
import {
  getOverview,
  getChatActivity,
  getRegistrations,
  getCommunityActivity,
  getPeakHours,
  getSentimentDistribution,
  getTopicDistribution,
  getInsights,
  getConversations,
  getConversationById,
  deleteConversation,
} from '../controllers/analytics.controller.js';

const adminRouter = express.Router();

const requireAdmin = async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

adminRouter.use(authUser);
adminRouter.use(requireAdmin);

// ============================================================================
// Analytics
// ============================================================================
adminRouter.get('/analytics/overview', getOverview);
adminRouter.get('/analytics/activity', getChatActivity);
adminRouter.get('/analytics/registrations', getRegistrations);
adminRouter.get('/analytics/community', getCommunityActivity);
adminRouter.get('/analytics/peak-hours', getPeakHours);
adminRouter.get('/analytics/sentiments', getSentimentDistribution);
adminRouter.get('/analytics/topics', getTopicDistribution);
adminRouter.get('/analytics/insights', getInsights);
adminRouter.get('/conversations', getConversations);
adminRouter.get('/conversations/:id', getConversationById);
adminRouter.delete('/conversations/:id', deleteConversation);

// ============================================================================
// Stats (kept for compatibility)
// ============================================================================
adminRouter.get('/stats', async (req, res) => {
  try {
    const [totalUsers, admins, activeUsers, totalPosts, totalChats] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ status: 'active' }),
      Post.countDocuments({ status: { $ne: 'deleted' } }),
      Conversation.countDocuments(),
    ]);

    return res.json({
      success: true,
      data: { totalUsers, admins, activeUsers, totalPosts, totalChats },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// User management (server-side pagination, search, filter, sort)
// ============================================================================
adminRouter.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const query = {};
    const { search, role, status, sortBy, sortOrder } = req.query;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;

    const allowedSort = ['createdAt', 'name', 'email', 'role', 'status', 'lastActiveAt'];
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password')
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit),
    ]);

    const ids = users.map((u) => u._id);
    const [postCounts, chatCounts] = await Promise.all([
      Post.aggregate([
        { $match: { user: { $in: ids }, status: { $ne: 'deleted' } } },
        { $group: { _id: '$user', count: { $sum: 1 } } },
      ]),
      Conversation.aggregate([
        { $match: { user: { $in: ids } } },
        { $group: { _id: '$user', count: { $sum: 1 } } },
      ]),
    ]);

    const postMap = new Map(postCounts.map((p) => [String(p._id), p.count]));
    const chatMap = new Map(chatCounts.map((c) => [String(c._id), c.count]));

    const items = users.map((u) => ({
      ...u.toObject(),
      totalPosts: postMap.get(String(u._id)) || 0,
      totalChats: chatMap.get(String(u._id)) || 0,
    }));

    return res.json({
      success: true,
      data: {
        items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.post('/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role === 'admin' ? 'admin' : 'user',
    });

    const safeUser = await User.findById(newUser._id).select('-password');
    return res.status(201).json({ success: true, data: safeUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.put('/users/:id', async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (password && password.length >= 6) user.password = password;
    if (role === 'admin' || role === 'user') user.role = role;
    if (status === 'active' || status === 'suspended') user.status = status;

    await user.save();
    const safeUser = await User.findById(user._id).select('-password');
    return res.json({ success: true, data: safeUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Suspend / activate a user account.
adminRouter.patch('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin' && String(user._id) === String(req.user._id) && status === 'suspended') {
      return res.status(400).json({ success: false, message: 'You cannot suspend your own admin account' });
    }

    user.status = status;
    user.suspendedAt = status === 'suspended' ? new Date() : null;
    await user.save();

    const safeUser = await User.findById(user._id).select('-password');
    return res.json({
      success: true,
      message: status === 'suspended' ? 'User suspended successfully' : 'User activated successfully',
      data: safeUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.delete('/users/:id', async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (targetUser.role === 'admin' && String(targetUser._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    }

    await User.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================================================
// Community management
// ============================================================================
const serializePost = (post) => {
  const obj = post.toObject ? post.toObject() : { ...post };
  obj.commentsCount = post.comments?.length || 0;
  obj.likesCount = post.likes?.length || 0;
  obj.authorName = post.createdBy === 'admin'
    ? post.authorName || 'Health AI'
    : post.user?.name || post.authorName || 'Unknown User';
  return obj;
};

adminRouter.get('/community/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const query = {};
    const { search, status, createdBy, sortBy, sortOrder } = req.query;
    if (status) query.status = status;
    else query.status = { $ne: 'deleted' };
    if (createdBy) query.createdBy = createdBy;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { caption: { $regex: search, $options: 'i' } },
        { foodName: { $regex: search, $options: 'i' } },
        { authorName: { $regex: search, $options: 'i' } },
      ];
    }

    const allowedSort = ['createdAt', 'status', 'title'];
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const [total, posts] = await Promise.all([
      Post.countDocuments(query),
      Post.find(query)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email profileImage')
        .populate('comments.user', 'name email profileImage'),
    ]);

    return res.json({
      success: true,
      data: {
        items: posts.map(serializePost),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Create a post as an administrator (optional custom author name, no user account required).
adminRouter.post('/community/posts', async (req, res) => {
  try {
    const { content, caption, foodName, title, isPublic, authorName, status } = req.body;

    if (!content && !caption && !title) {
      return res.status(400).json({ success: false, message: 'Post content is required' });
    }

    const post = await Post.create({
      user: null,
      createdBy: 'admin',
      authorName: (authorName || '').trim() || null,
      title: (title || '').trim() || null,
      content: content || '',
      caption: caption || '',
      foodName: foodName || '',
      isPublic: isPublic !== false,
      status: ['active', 'hidden', 'deleted'].includes(status) ? status : 'active',
    });

    await post.populate('user', 'name email profileImage');
    ActivityEvent.create({ user: req.user._id, type: 'community_post', meta: { createdBy: 'admin' } }).catch(() => {});

    return res.status(201).json({ success: true, data: serializePost(post) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.put('/community/posts/:id', async (req, res) => {
  try {
    const { content, caption, foodName, title, isPublic, authorName, status } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post || post.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (content !== undefined) post.content = content;
    if (caption !== undefined) post.caption = caption;
    if (foodName !== undefined) post.foodName = foodName;
    if (title !== undefined) post.title = title;
    if (isPublic !== undefined) post.isPublic = isPublic;
    if (authorName !== undefined) post.authorName = authorName;
    if (['active', 'hidden', 'deleted'].includes(status)) post.status = status;

    await post.save();
    await post.populate('user', 'name email profileImage');
    return res.json({ success: true, data: serializePost(post) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Publish / hide / delete a post.
adminRouter.patch('/community/posts/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'hidden', 'deleted'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const post = await Post.findById(req.params.id);
    if (!post || post.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.status = status;
    await post.save();
    await post.populate('user', 'name email profileImage');

    const labels = { active: 'published', hidden: 'hidden', deleted: 'deleted' };
    return res.json({ success: true, message: `Post ${labels[status]} successfully`, data: serializePost(post) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.delete('/community/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.status = 'deleted';
    await post.save();
    return res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.post('/community/posts/:postId/comments', async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post || post.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (!text || !String(text).trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    post.comments.push({
      user: req.user._id,
      text: String(text).trim(),
      createdAt: new Date(),
    });

    await post.save();
    await post.populate('comments.user', 'name email profileImage');
    return res.status(201).json({ success: true, data: post.comments[post.comments.length - 1] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.put('/community/posts/:postId/comments/:commentId', async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post || post.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (!text || !String(text).trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    comment.text = String(text).trim();
    await post.save();
    return res.json({ success: true, data: comment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.delete('/community/posts/:postId/comments/:commentId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post || post.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    post.comments = post.comments.filter((item) => item._id.toString() !== req.params.commentId);
    await post.save();
    return res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default adminRouter;
