// src/pages/Feed.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFeed } from "../context/FeedContext";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";
import CreatePost from "../components/feed/CreatePost";
import PostCard from "../components/feed/PostCard";
import SkeletonCard from "../components/ui/SkeletonCard";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import {
  IoTrendingUp,
  IoRefreshOutline,
  IoFitnessOutline,
} from "react-icons/io5";

export default function Feed() {
  const { user } = useAuth();
  const { posts, trending, loading, hasMore, loadFeed, loadTrending } =
    useFeed();

  const [refreshing, setRefreshing] = useState(false);
  const [showTrending, setShowTrending] = useState(false);

  useEffect(() => {
    const cachedFeed = sessionStorage.getItem('healthai_feed_cache');
    const cachedTrending = sessionStorage.getItem('healthai_trending_cache');

    if (cachedFeed) {
      try {
        const parsedFeed = JSON.parse(cachedFeed);
        if (parsedFeed.posts) {
          const feedCtx = JSON.parse(JSON.stringify(parsedFeed.posts));
          // useFeed context is not directly settable here, so fallback refresh is used when needed
          if (feedCtx.length && posts.length === 0) {
            window.__HEALTHAI_FEED_CACHE__ = feedCtx;
          }
        }
      } catch (error) {
        console.warn('Feed cache parse failed:', error);
      }
    }

    if (cachedFeed && cachedTrending) {
      return;
    }

    loadFeed(true);
    loadTrending();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFeed(true);
    await loadTrending();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadFeed(false);
    }
  };

  if (loading && posts.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} rows={4} />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-fg">Health Community</h1>
            <p className="text-sm text-fg-muted">
              Share workouts, meals, progress, and health tips
            </p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              size="sm"
              variant={showTrending ? "primary" : "secondary"}
              onClick={() => setShowTrending(!showTrending)}
              className="flex gap-1 sm:flex-none">
              <IoTrendingUp size={16} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex-1 gap-1 sm:flex-none">
              <IoRefreshOutline
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
            </Button>
          </div>
        </div>

        {/* Trending */}
        <AnimatePresence>
          {showTrending && trending.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6">
              <Card className="p-4 border-brand/20" glow>
                <h3 className="font-semibold text-fg mb-3 flex items-center gap-2">
                  <IoTrendingUp className="text-brand" />
                  Trending Posts
                </h3>
                <div className="space-y-2">
                  {trending.slice(0, 3).map((post) => (
                    <div
                      key={post._id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-muted transition-colors cursor-pointer"
                      onClick={() =>
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }>
                      {post.image ? (
                        <div className="h-12 w-12 rounded-lg bg-surface-muted shrink-0 overflow-hidden">
                          <img
                            src={post.image}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-brand/10 shrink-0 flex items-center justify-center text-brand">
                          <IoFitnessOutline size={20} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-fg truncate">
                          {post.foodName ||
                            post.content?.slice(0, 50) ||
                            "Health post"}
                        </p>
                        <p className="text-xs text-fg-muted truncate">
                          {post.user?.name} • ❤️ {post.likes?.length || 0}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Post */}
        <CreatePost onPostCreated={() => loadFeed(true)} />

        {/* Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card className="p-12 text-center">
              <IoFitnessOutline
                size={48}
                className="mx-auto text-fg-subtle/40"
              />
              <h3 className="mt-4 text-lg font-semibold text-fg">
                No posts yet
              </h3>
              <p className="text-sm text-fg-muted">
                Be the first to share your health journey!
              </p>
            </Card>
          ) : (
            posts.map((post) => <PostCard key={post._id} post={post} />)
          )}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="mt-6 text-center">
            <Button
              variant="secondary"
              onClick={handleLoadMore}
              disabled={loading}>
              {loading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
