import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Optional so administrators can create posts without a user account.
      required: false,
      default: null,
    },
    title: {
      type: String,
      maxlength: 200,
    },
    createdBy: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    authorName: {
      type: String,
      maxlength: 120,
      default: null,
    },
    image: {
      type: String,
      required: false,
    },
    content: {
      type: String,
      maxlength: 2000,
    },
    caption: {
      type: String,
      maxlength: 500,
    },
    foodName: {
      type: String,
    },
    nutrition: {
      calories: Number,
      protein: Number,
      carbohydrates: Number,
      fat: Number,
      fiber: Number,
      sugar: Number,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        text: {
          type: String,
          required: true,
          maxlength: 300,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        }
      }
    ],
    isPublic: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['active', 'hidden', 'deleted'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ title: 'text', content: 'text', caption: 'text', foodName: 'text' });

postSchema.virtual('postId').get(function () {
  return this._id;
});

export default mongoose.model('Post', postSchema);
