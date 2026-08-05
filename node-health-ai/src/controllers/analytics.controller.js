// controllers/analytics.controller.js
// Admin analytics: dashboard overview, activity series, distributions, and
// searchable conversation history. All routes are admin-only (see admin.route.js).
import User from '../models/user.models.js';
import Post from '../models/post.models.js';
import Conversation from '../models/conversation.model.js';
import ActivityEvent from '../models/activityEvent.model.js';

const START_WEEK = { $dateToString: { format: '%Y-W%V', date: '$startedAt' } };
const START_DAY = { $dateToString: { format: '%Y-%m-%d', date: '$startedAt' } };
const START_MONTH = { $dateToString: { format: '%Y-%m', date: '$startedAt' } };

const toBucket = (granularity) =>
  granularity === 'weekly' ? START_WEEK : granularity === 'monthly' ? START_MONTH : START_DAY;

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

function buildLabels(granularity, count) {
  const labels = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    if (granularity === 'monthly') {
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      labels.push(d.toISOString().slice(0, 7));
    } else if (granularity === 'weekly') {
      d.setDate(d.getDate() - i * 7);
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay() + 1); // Monday
      const pad = (n) => String(n).padStart(2, '0');
      const year = start.getUTCFullYear();
      const jan1 = new Date(Date.UTC(year, 0, 1));
      const week = Math.ceil(((start - jan1) / 86400000 + jan1.getUTCDay() + 1) / 7);
      labels.push(`${year}-W${pad(week)}`);
    } else {
      d.setDate(d.getDate() - i);
      labels.push(d.toISOString().slice(0, 10));
    }
  }
  return labels;
}

function fillSeries(buckets, labels) {
  const map = new Map(buckets.map((b) => [b._id, b.count]));
  return labels.map((label) => ({ label, count: map.get(label) || 0 }));
}

// ============================================================================
// Overview stats for the dashboard cards
// ============================================================================
export const getOverview = async (req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalChats,
      totalPosts,
      totalFoodScans,
      totalDoctorChats,
      avgDurationAgg,
      avgMessagesAgg,
      satisfactionAgg,
      newUsersThisWeek,
      newUsersPrevWeek,
      chatsThisWeek,
      chatsPrevWeek,
      returningUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      Conversation.countDocuments(),
      Post.countDocuments({ status: { $ne: 'deleted' } }),
      ActivityEvent.countDocuments({ type: 'food_scan' }),
      Conversation.countDocuments({ type: 'doctor' }),
      Conversation.aggregate([{ $match: { status: 'ended' } }, { $group: { _id: null, avg: { $avg: '$durationSeconds' } } }]),
      Conversation.aggregate([{ $group: { _id: null, avg: { $avg: '$totalMessages' } } }]),
      Conversation.aggregate([{ $group: { _id: null, avg: { $avg: '$satisfactionScore' } } }]),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: twoWeeksAgo, $lt: weekAgo } }),
      Conversation.countDocuments({ startedAt: { $gte: weekAgo } }),
      Conversation.countDocuments({ startedAt: { $gte: twoWeeksAgo, $lt: weekAgo } }),
      Conversation.aggregate([
        { $match: { startedAt: { $gte: weekAgo } } },
        { $group: { _id: '$user', count: { $sum: 1 } } },
      ]),
    ]);

    const prevUsers = newUsersPrevWeek[0]?.count || 0;
    const userGrowth = prevUsers > 0
      ? Math.round(((newUsersThisWeek - prevUsers) / prevUsers) * 100)
      : newUsersThisWeek > 0 ? 100 : 0;

    const prevChats = chatsPrevWeek[0]?.count || 0;
    const chatGrowth = prevChats > 0
      ? Math.round(((chatsThisWeek - prevChats) / prevChats) * 100)
      : chatsThisWeek > 0 ? 100 : 0;

    return res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalChats,
        totalCommunityPosts: totalPosts,
        totalFoodScans,
        totalSymptomsChecked: totalDoctorChats,
        averageChatDurationSeconds: Math.round(avgDurationAgg[0]?.avg || 0),
        averageMessagesPerConversation: Math.round((avgMessagesAgg[0]?.avg || 0) * 10) / 10,
        satisfactionScore: Math.round((satisfactionAgg[0]?.avg || 0) * 10) / 10,
        userGrowth,
        chatGrowth,
        weeklyGrowth: userGrowth,
        returningUsers: returningUsers.length,
        newUsersThisWeek,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Activity series (daily / weekly / monthly)
// ============================================================================
export const getChatActivity = async (req, res) => {
  try {
    const granularity = ['daily', 'weekly', 'monthly'].includes(req.query.granularity)
      ? req.query.granularity
      : 'daily';
    const count = Math.min(parseInt(req.query.count) || 30, 90);

    const buckets = await Conversation.aggregate([
      { $match: { startedAt: { $gte: daysAgo(granularity === 'monthly' ? 180 : granularity === 'weekly' ? 90 : count) } } },
      { $group: { _id: toBucket(granularity), count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    return res.json({
      success: true,
      data: { granularity, series: fillSeries(buckets, buildLabels(granularity, count)) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRegistrations = async (req, res) => {
  try {
    const granularity = ['daily', 'weekly', 'monthly'].includes(req.query.granularity)
      ? req.query.granularity
      : 'daily';
    const count = Math.min(parseInt(req.query.count) || 30, 90);
    const dateExpr = granularity === 'weekly'
      ? { $dateToString: { format: '%Y-W%V', date: '$createdAt' } }
      : granularity === 'monthly'
        ? { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
        : { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

    const buckets = await User.aggregate([
      { $match: { createdAt: { $gte: daysAgo(granularity === 'monthly' ? 180 : granularity === 'weekly' ? 90 : count) } } },
      { $group: { _id: dateExpr, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    return res.json({
      success: true,
      data: { granularity, series: fillSeries(buckets, buildLabels(granularity, count)) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCommunityActivity = async (req, res) => {
  try {
    const granularity = ['daily', 'weekly', 'monthly'].includes(req.query.granularity)
      ? req.query.granularity
      : 'daily';
    const count = Math.min(parseInt(req.query.count) || 30, 90);
    const since = daysAgo(granularity === 'monthly' ? 180 : granularity === 'weekly' ? 90 : count);
    const bucket = (field) =>
      granularity === 'weekly'
        ? { $dateToString: { format: '%Y-W%V', date: `$${field}` } }
        : granularity === 'monthly'
          ? { $dateToString: { format: '%Y-%m', date: `$${field}` } }
          : { $dateToString: { format: '%Y-%m-%d', date: `$${field}` } };

    const [postBuckets, commentBuckets] = await Promise.all([
      Post.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: bucket('createdAt'), count: { $sum: 1 } } },
      ]),
      Post.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $unwind: '$comments' },
        { $match: { 'comments.createdAt': { $gte: since } } },
        { $group: { _id: bucket('comments.createdAt'), count: { $sum: 1 } } },
      ]),
    ]);

    const labels = buildLabels(granularity, count);
    return res.json({
      success: true,
      data: {
        granularity,
        posts: fillSeries(postBuckets, labels),
        comments: fillSeries(commentBuckets, labels),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Peak usage hours (based on all stored chat messages)
// ============================================================================
export const getPeakHours = async (req, res) => {
  try {
    const buckets = await Conversation.aggregate([
      { $unwind: '$messages' },
      {
        $group: {
          _id: { $hour: { date: '$messages.timestamp', timezone: 'UTC' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${String(i).padStart(2, '0')}:00`,
      count: buckets.find((b) => b._id === i)?.count || 0,
    }));

    return res.json({ success: true, data: hours });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Sentiment & topic distributions
// ============================================================================
export const getSentimentDistribution = async (req, res) => {
  try {
    const buckets = await Conversation.aggregate([
      { $match: { sentiment: { $ne: null } } },
      { $group: { _id: '$sentiment', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    const total = buckets.reduce((a, b) => a + b.count, 0) || 1;
    return res.json({
      success: true,
      data: buckets.map((b) => ({ name: b._id, value: b.count, pct: Math.round((b.count / total) * 100) })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTopicDistribution = async (req, res) => {
  try {
    const buckets = await Conversation.aggregate([
      { $match: { topic: { $ne: null } } },
      { $group: { _id: '$topic', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return res.json({
      success: true,
      data: buckets.map((b) => ({ name: b._id, value: b.count })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Insights: symptoms / medicines / diseases / questions
// ============================================================================
const unwindCount = (field) => async () => {
  const buckets = await Conversation.aggregate([
    { $unwind: { path: `$${field}`, preserveNullAndEmptyArrays: false } },
    { $match: { [field]: { $nin: [null, ''] } } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 12 },
  ]);
  return buckets.map((b) => ({ name: b._id, count: b.count }));
};

const getSymptoms = unwindCount('mentionedSymptoms');
const getMedicines = unwindCount('mentionedMedicines');
const getDiseases = unwindCount('mentionedDiseases');

const getQuestions = async () => {
  const buckets = await Conversation.aggregate([
    { $unwind: '$messages' },
    { $match: { 'messages.role': 'user', 'messages.content': { $regex: /\?/, $options: 'i' } } },
    { $group: { _id: { $toLower: { $trim: { input: '$messages.content' } } }, count: { $sum: 1 }, last: { $max: '$messages.timestamp' } } },
    { $sort: { count: -1, last: -1 } },
    { $limit: 10 },
    { $project: { _id: 0, question: { $substrBytes: ['$_id', 0, 160] }, count: 1 } },
  ]);
  return buckets;
};

export const getInsights = async (req, res) => {
  try {
    const [symptoms, medicines, diseases, questions] = await Promise.all([
      getSymptoms(),
      getMedicines(),
      getDiseases(),
      getQuestions(),
    ]);
    return res.json({
      success: true,
      data: { symptoms, medicines, diseases, questions },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// Conversation list / detail / delete
// ============================================================================
export const getConversations = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const query = {};
    const { search, type, sentiment, status, topic, from, to, sortBy, sortOrder } = req.query;

    if (type) query.type = type;
    if (sentiment) query.sentiment = sentiment;
    if (status) query.status = status;
    if (topic) query.topic = topic;
    if (from || to) {
      query.startedAt = {};
      if (from) query.startedAt.$gte = new Date(from);
      if (to) query.startedAt.$lte = new Date(to);
    }

    if (search) {
      const users = await User.find({ $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }).select('_id');
      query.$or = [
        { user: { $in: users.map((u) => u._id) } },
        { summary: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } },
        { keywords: { $regex: search, $options: 'i' } },
      ];
    }

    const allowedSort = ['startedAt', 'endedAt', 'durationSeconds', 'totalMessages', 'sentiment', 'satisfactionScore'];
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'startedAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const [total, items] = await Promise.all([
      Conversation.countDocuments(query),
      Conversation.find(query)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email profileImage status'),
    ]);

    return res.json({
      success: true,
      data: { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id).populate('user', 'name email profileImage');
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
    return res.json({ success: true, data: conversation });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found' });
    await Conversation.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
