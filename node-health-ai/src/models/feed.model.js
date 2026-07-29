// models/Feed.js
import mongoose from 'mongoose';

const feedSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    posts: [
      {
        post: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Post',
        },
        seen: {
          type: Boolean,
          default: false,
        },
        seenAt: Date,
      }
    ],
    lastFetched: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Feed', feedSchema);