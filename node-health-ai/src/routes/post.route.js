// routes/post.route.js
import express from 'express';
import multer from 'multer';
import { authUser } from '../middleware/user.middleware.js';
import {
  createPost,
  getFeed,
  getUserPosts,
  getPost,
  toggleLike,
  addComment,
  deleteComment,
  deletePost,
  getTrendingPosts,
} from '../controllers/post.controller.js';

const router = express.Router();

// Configure multer for image upload
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ============ PUBLIC ROUTES ============
router.get('/feed', authUser, getFeed);
router.get('/trending', authUser, getTrendingPosts);
router.get('/:postId', authUser, getPost);

// ============ USER POSTS ============
// ✅ Two separate routes instead of optional parameter
router.get('/user/me', authUser, getUserPosts);  // Current user's posts
router.get('/user/:userId', authUser, getUserPosts);  // Specific user's posts

// ============ CREATE POST ============
router.post('/create', authUser, upload.single('image'), createPost);

// ============ INTERACTIONS ============
router.post('/:postId/like', authUser, toggleLike);
router.post('/:postId/comment', authUser, addComment);
router.delete('/:postId/comment/:commentId', authUser, deleteComment);

// ============ DELETE POST ============
router.delete('/:postId', authUser, deletePost);

export default router;
