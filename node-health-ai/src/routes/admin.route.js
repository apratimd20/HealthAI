import express from 'express';
import User from '../models/user.models.js';
import Post from '../models/post.models.js';
import { authUser } from '../middleware/user.middleware.js';

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

adminRouter.get('/stats', async (req, res) => {
  try {
    const [totalUsers, admins, activeUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
    ]);

    return res.json({
      success: true,
      data: {
        totalUsers,
        admins,
        activeUsers,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json({ success: true, data: users });
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
    const { name, email, password, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (password && password.length >= 6) user.password = password;
    if (role === 'admin' || role === 'user') user.role = role;

    await user.save();
    const safeUser = await User.findById(user._id).select('-password');
    return res.json({ success: true, data: safeUser });
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

adminRouter.get('/community/posts', async (req, res) => {
  try {
    const posts = await Post.find({ status: { $ne: 'deleted' } })
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('comments.user', 'name email');

    return res.json({
      success: true,
      data: posts.map((post) => ({
        ...post.toObject(),
        commentsCount: post.comments?.length || 0,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.post('/community/posts', async (req, res) => {
  try {
    const { content, caption, foodName, isPublic } = req.body;

    if (!content && !caption) {
      return res.status(400).json({ success: false, message: 'Post content is required' });
    }

    const post = await Post.create({
      user: req.user._id,
      content: content || '',
      caption: caption || '',
      foodName: foodName || '',
      isPublic: isPublic !== false,
      status: 'active',
    });

    await post.populate('user', 'name email');
    return res.status(201).json({ success: true, data: post });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

adminRouter.put('/community/posts/:id', async (req, res) => {
  try {
    const { content, caption, foodName, isPublic } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post || post.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (content !== undefined) post.content = content;
    if (caption !== undefined) post.caption = caption;
    if (foodName !== undefined) post.foodName = foodName;
    if (isPublic !== undefined) post.isPublic = isPublic;

    await post.save();
    await post.populate('user', 'name email');
    return res.json({ success: true, data: post });
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
    await post.populate('comments.user', 'name email');
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
