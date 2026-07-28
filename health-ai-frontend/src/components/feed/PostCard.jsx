// src/components/feed/PostCard.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoHeart,
  IoHeartOutline,
  IoChatbubbleOutline,
  IoShareOutline,
  IoTrashOutline,
  IoCloseOutline,
  IoTimeOutline,
  IoPersonCircleOutline,
} from 'react-icons/io5';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useFeed } from '../../context/FeedContext';
import toast from 'react-hot-toast';

export default function PostCard({ post }) {
  const { user } = useAuth();
  const { toggleLike, addComment, deletePost } = useFeed();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const commentInputRef = useRef(null);

  // ✅ Safe checks - handle undefined post or user
  if (!post) {
    return null;
  }

  const postUser = post.user || {};
  const userId = postUser._id || post.userId || '';
  const isOwner = userId === user?._id;

  // ✅ Safe navigation for user name
  const userName = postUser.name || 'Unknown User';
  const userInitial = userName.charAt(0).toUpperCase();

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    await toggleLike(post._id);
    setIsLiking(false);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsCommenting(true);
    await addComment(post._id, commentText);
    setCommentText('');
    setIsCommenting(false);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deletePost(post._id);
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Just now';
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // ✅ Safe check for comments
  const comments = post.comments || [];
  const commentsCount = post.commentsCount || comments.length;
  const likesCount = post.likesCount || post.likes?.length || 0;
  const isLiked = post.isLiked || false;

  return (
    <Card className="overflow-hidden" glow>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-0">
        <div className="h-10 w-10 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold flex-shrink-0">
          {userInitial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-fg truncate">
            {userName}
          </p>
          <div className="flex items-center gap-2 text-xs text-fg-muted">
            <span className="truncate">{post.foodName || 'Food'}</span>
            <span>•</span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <IoTimeOutline size={12} />
              {formatTime(post.createdAt)}
            </span>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            className="text-fg-muted hover:text-danger transition-colors"
          >
            <IoTrashOutline size={18} />
          </button>
        )}
      </div>

      {/* Image */}
      <div className="mt-3 bg-surface-muted">
        {post.image ? (
          <img
            src={post.image}
            alt={post.foodName || 'Food'}
            className="w-full max-h-[400px] object-contain"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x300?text=Food+Image';
            }}
          />
        ) : (
          <div className="h-48 w-full bg-surface-muted flex items-center justify-center text-fg-subtle">
            <IoPersonCircleOutline size={48} />
          </div>
        )}
      </div>

      {/* Nutrition Info */}
      {post.nutrition && (
        <div className="flex flex-wrap gap-3 px-4 py-2 text-xs text-fg-muted border-b border-border-default">
          {post.nutrition.calories > 0 && (
            <span>🔥 {post.nutrition.calories} kcal</span>
          )}
          {post.nutrition.protein > 0 && (
            <span>💪 {post.nutrition.protein}g protein</span>
          )}
          {post.nutrition.carbohydrates > 0 && (
            <span>🍞 {post.nutrition.carbohydrates}g carbs</span>
          )}
          {post.nutrition.fat > 0 && (
            <span>🥑 {post.nutrition.fat}g fat</span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {post.caption && (
          <p className="text-sm text-fg">{post.caption}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-6 pt-2 border-t border-border-default">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-danger transition-colors group"
          >
            {isLiked ? (
              <IoHeart className="text-danger" size={20} />
            ) : (
              <IoHeartOutline size={20} className="group-hover:text-danger" />
            )}
            <span className={isLiked ? 'text-danger' : ''}>
              {likesCount}
            </span>
          </button>

          <button
            onClick={() => {
              setShowComments(!showComments);
              setTimeout(() => commentInputRef.current?.focus(), 100);
            }}
            className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-brand transition-colors group"
          >
            <IoChatbubbleOutline size={20} className="group-hover:text-brand" />
            <span>{commentsCount}</span>
          </button>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast.success('Link copied to clipboard!');
            }}
            className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-water transition-colors group"
          >
            <IoShareOutline size={20} className="group-hover:text-water" />
            <span>Share</span>
          </button>
        </div>

        {/* Comments */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 pt-2 border-t border-border-default"
            >
              {comments.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment._id} className="flex gap-2 text-sm">
                      <span className="font-semibold text-brand/80 flex-shrink-0">
                        {comment.user?.name || 'User'}:
                      </span>
                      <span className="text-fg break-words">{comment.text}</span>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleComment} className="flex gap-2">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 rounded-lg border border-border-default bg-surface-muted px-3 py-2 text-sm text-fg placeholder-fg-subtle focus:border-brand focus:outline-none"
                  disabled={isCommenting}
                />
                <Button
                  size="sm"
                  type="submit"
                  disabled={!commentText.trim() || isCommenting}
                >
                  {isCommenting ? '...' : 'Post'}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}