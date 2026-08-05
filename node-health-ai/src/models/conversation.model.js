// models/conversation.model.js
// Stores per-conversation analytics for the AI doctor / health chats so the
// admin dashboard can show topics, sentiment, summaries, duration, and more.
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    // Time the AI took to respond to the preceding user message (ms).
    responseTimeMs: {
      type: Number,
      default: null,
    },
    // How long the user took to send this message after the assistant reply (ms).
    userThinkMs: {
      type: Number,
      default: null,
    },
  },
  { _id: true }
);

const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    type: {
      type: String,
      enum: ['general', 'doctor'],
      default: 'general',
      index: true,
    },
    sessionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['active', 'ended'],
      default: 'active',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    totalMessages: {
      type: Number,
      default: 0,
    },
    userMessages: {
      type: Number,
      default: 0,
    },
    aiMessages: {
      type: Number,
      default: 0,
    },
    // AI-generated analytics (populated asynchronously on finalize).
    topic: {
      type: String,
      default: null,
      index: true,
    },
    sentiment: {
      type: String,
      enum: [
        'Happy',
        'Satisfied',
        'Neutral',
        'Confused',
        'Angry',
        'Frustrated',
        'Emergency',
      ],
      default: 'Neutral',
      index: true,
    },
    mood: {
      type: String,
      default: null,
    },
    summary: {
      type: String,
      default: null,
    },
    keywords: {
      type: [String],
      default: [],
    },
    mentionedSymptoms: {
      type: [String],
      default: [],
    },
    mentionedMedicines: {
      type: [String],
      default: [],
    },
    mentionedDiseases: {
      type: [String],
      default: [],
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    satisfactionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    avgAiResponseMs: {
      type: Number,
      default: 0,
    },
    avgUserResponseMs: {
      type: Number,
      default: 0,
    },
    lastActiveAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ user: 1, status: 1, startedAt: -1 });
conversationSchema.index({ status: 1, lastActiveAt: 1 });
conversationSchema.index({ startedAt: -1 });
conversationSchema.index({ sentiment: 1, startedAt: -1 });
conversationSchema.index({ topic: 1, startedAt: -1 });

export default mongoose.model('Conversation', conversationSchema);