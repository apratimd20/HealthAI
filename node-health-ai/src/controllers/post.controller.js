// controllers/post.controller.js
import Post from '../models/post.models.js';
import User from '../models/user.models.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

// ============================================================
// CREATE POST
// ============================================================
export const createPost = async (req, res) => {
  try {
    const { caption, foodName, nutrition, isPublic } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image is required',
      });
    }

    if (!foodName) {
      return res.status(400).json({
        success: false,
        message: 'Food name is required',
      });
    }

    // Upload image to Cloudinary (or local storage)
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'community-posts',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto' },
      ],
    });

    // Parse nutrition if provided
    let nutritionData = null;
    if (nutrition) {
      try {
        nutritionData = typeof nutrition === 'string' 
          ? JSON.parse(nutrition) 
          : nutrition;
      } catch (e) {
        nutritionData = nutrition;
      }
    }

    // Create post
    const post = await Post.create({
      user: req.user._id,
      image: result.secure_url,
      caption: caption || '',
      foodName,
      nutrition: nutritionData,
      isPublic: isPublic !== false,
    });

    // Populate user info
    await post.populate('user', 'name email profileImage');

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post,
    });

  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.warn('Could not delete file:', err);
      });
    }
  }
};

// ============================================================
// GET FEED (Public Timeline)
// ============================================================
export const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get posts (public + user's own posts)
    const query = {
      status: 'active',
      $or: [
        { isPublic: true },
        { user: req.user._id }, // Include user's own posts
      ],
    };

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1) // Fetch one extra to check if more exist
      .populate('user', 'name email profileImage')
      .populate('comments.user', 'name email profileImage');

    const hasMore = posts.length > limit;
    const results = hasMore ? posts.slice(0, limit) : posts;

    // Check if current user liked each post
    const postsWithLikeStatus = results.map(post => {
      const postObj = post.toObject();
      postObj.isLiked = post.likes?.includes(req.user._id) || false;
      postObj.likesCount = post.likes?.length || 0;
      postObj.commentsCount = post.comments?.length || 0;
      return postObj;
    });

    return res.status(200).json({
      success: true,
      data: postsWithLikeStatus,
      pagination: {
        page,
        limit,
        hasMore,
        total: posts.length,
      },
    });

  } catch (error) {
    console.error('Get feed error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET USER POSTS
// ============================================================

export const getUserPosts = async (req, res) => {
    try {
        // ✅ Check if userId is provided in params, otherwise use current user
        const userId = req.params.userId || req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const posts = await Post.find({
            user: userId,
            status: 'active',
            isPublic: true,
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'name email profileImage')
            .populate('comments.user', 'name email profileImage');

        const postsWithStatus = posts.map(post => {
            const postObj = post.toObject();
            postObj.isLiked = post.likes?.includes(req.user._id) || false;
            postObj.likesCount = post.likes?.length || 0;
            postObj.commentsCount = post.comments?.length || 0;
            return postObj;
        });

        return res.status(200).json({
            success: true,
            data: postsWithStatus,
        });

    } catch (error) {
        console.error('Get user posts error:', error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
// ============================================================
// GET SINGLE POST
// ============================================================
export const getPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findOne({
      _id: postId,
      status: 'active',
    })
      .populate('user', 'name email profileImage')
      .populate('comments.user', 'name email profileImage');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const postObj = post.toObject();
    postObj.isLiked = post.likes?.includes(req.user._id) || false;
    postObj.likesCount = post.likes?.length || 0;
    postObj.commentsCount = post.comments?.length || 0;

    return res.status(200).json({
      success: true,
      data: postObj,
    });

  } catch (error) {
    console.error('Get post error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// LIKE/UNLIKE POST
// ============================================================
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findOne({
      _id: postId,
      status: 'active',
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const userIndex = post.likes.indexOf(req.user._id);
    let isLiked = false;

    if (userIndex === -1) {
      // Like
      post.likes.push(req.user._id);
      isLiked = true;
    } else {
      // Unlike
      post.likes.splice(userIndex, 1);
      isLiked = false;
    }

    await post.save();

    return res.status(200).json({
      success: true,
      message: isLiked ? 'Post liked' : 'Post unliked',
      data: {
        isLiked,
        likesCount: post.likes.length,
      },
    });

  } catch (error) {
    console.error('Toggle like error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// ADD COMMENT
// ============================================================
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required',
      });
    }

    if (text.length > 300) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 300 characters',
      });
    }

    const post = await Post.findOne({
      _id: postId,
      status: 'active',
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const comment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();

    // Populate user info for the new comment
    const populatedPost = await Post.findById(post._id)
      .populate('comments.user', 'name email profileImage');

    const newComment = populatedPost.comments[populatedPost.comments.length - 1];

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment,
    });

  } catch (error) {
    console.error('Add comment error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// DELETE COMMENT
// ============================================================
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findOne({
      _id: postId,
      status: 'active',
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const commentIndex = post.comments.findIndex(
      (c) => c._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    // Check if user owns the comment or the post
    const comment = post.comments[commentIndex];
    if (
      comment.user.toString() !== req.user._id.toString() &&
      post.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this comment',
      });
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// DELETE POST
// ============================================================
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findOne({
      _id: postId,
      user: req.user._id, // Only post owner can delete
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found or you do not have permission',
      });
    }

    // Soft delete
    post.status = 'deleted';
    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });

  } catch (error) {
    console.error('Delete post error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET TRENDING POSTS
// ============================================================
export const getTrendingPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const posts = await Post.aggregate([
      { $match: { status: 'active', isPublic: true } },
      {
        $addFields: {
          engagementScore: {
            $add: [
              { $size: '$likes' },
              { $multiply: [{ $size: '$comments' }, 2] },
            ],
          },
        },
      },
      { $sort: { engagementScore: -1, createdAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          'user.password': 0,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: posts,
    });

  } catch (error) {
    console.error('Get trending posts error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};