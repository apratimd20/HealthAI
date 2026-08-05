// models/activityEvent.model.js
// Lightweight, generic event log used to power admin analytics for
// actions that do not have their own collection (food scans, logins, etc.).
import mongoose from 'mongoose';

const activityEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    type: {
      type: String,
      enum: [
        'food_scan',
        'login',
        'symptom_check',
        'community_post',
        'community_comment',
        'community_like',
      ],
      required: true,
      index: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

activityEventSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model('ActivityEvent', activityEventSchema);
