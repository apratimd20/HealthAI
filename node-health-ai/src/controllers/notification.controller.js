// src/controllers/notification.controller.js
import webpush from 'web-push';
import NotificationSubscription from '../models/NotificationSubscription.model.js';
import Goal from '../models/goal.models.js';

// Check if VAPID keys are set
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const emailFrom = process.env.EMAIL_FROM;

if (!publicKey || !privateKey || !emailFrom) {
  console.warn('⚠️ VAPID keys or EMAIL_FROM not set. Push notifications will not work.');
  console.warn('Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and EMAIL_FROM in .env file');
} else {
  const vapidKeys = {
    publicKey: publicKey,
    privateKey: privateKey,
  };

  webpush.setVapidDetails(
    'mailto:' + emailFrom,
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  console.log('✅ VAPID configured for push notifications');
}

// Helper function to get notification icon emoji based on type
function getNotificationEmoji(type) {
  const emojis = {
    'eat': '🍽️',
    'drink': '💧',
    'exercise': '💪',
    'sleep': '😴',
    'health': '🏥',
    'breakfast': '🌅',
    'lunch': '🥗',
    'dinner': '🌙',
    'snack': '🍎',
    'hydration': '💧',
    'fitness': '💪',
    'default': '🏥'
  };
  return emojis[type] || emojis.default;
}

export const subscribeToPush = async (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: 'Subscription data is required'
      });
    }

    await NotificationSubscription.findOneAndUpdate(
      { userId: req.user._id },
      { 
        subscription: subscription,
        userId: req.user._id,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: '✅ Push subscription saved successfully'
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.log('VAPID not configured, skipping push notification');
      return false;
    }

    const subscription = await NotificationSubscription.findOne({ userId });
    if (!subscription) {
      console.log('No push subscription found for user');
      return false;
    }

    // Get emoji for notification type
    const emoji = getNotificationEmoji(data.type || 'default');
    
    // Build notification title with emoji
    const notificationTitle = `${emoji} ${title}`;
    
    const payload = JSON.stringify({
      title: notificationTitle,
      body: body,
      tag: data.tag || `health-${Date.now()}`,
      requireInteraction: true,
      renotify: true,
      data: {
        url: data.url || '/dashboard',
        timestamp: new Date().toISOString(),
        type: data.type || 'default'
      }
    });

    await webpush.sendNotification(
      subscription.subscription,
      payload
    );

    console.log(`✅ Push notification sent to user ${userId}`);
    return true;
  } catch (error) {
    console.error('Push notification error:', error);
    
    if (error.statusCode === 410) {
      await NotificationSubscription.findOneAndDelete({ userId });
      console.log('Removed expired subscription');
    }
    
    return false;
  }
};

export const sendTestNotification = async (req, res) => {
  try {
    const result = await sendPushNotification(
      req.user._id,
      'Test Notification',
      '🎉 Your notifications are working perfectly!',
      { type: 'health', tag: 'test' }
    );

    return res.status(200).json({
      success: result,
      message: result ? '✅ Test notification sent successfully' : '❌ Failed to send notification'
    });
  } catch (error) {
    console.error('Test notification error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const sendTimedNotifications = async (req, res) => {
  try {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return res.status(200).json({
        success: true,
        message: 'VAPID not configured, skipping notifications',
        sentCount: 0
      });
    }

    const currentHour = new Date().getHours();
    
    const subscriptions = await NotificationSubscription.find()
      .populate('userId', 'name email');
    
    let sentCount = 0;
    
    for (const sub of subscriptions) {
      if (!sub.userId) continue;
      
      const goal = await Goal.findOne({
        user: sub.userId._id,
        status: 'active'
      });
      
      if (!goal) continue;
      
      const notifications = await getTimeBasedNotifications(goal, currentHour);
      
      if (notifications.length > 0) {
        const topNotification = notifications[0];
        
        // Get appropriate title with emoji
        const title = getNotificationTitle(topNotification.category);
        const body = topNotification.text;
        const type = topNotification.type || 'default';
        
        await sendPushNotification(
          sub.userId._id,
          title,
          body,
          {
            type: type,
            tag: `health-${topNotification.type}-${Date.now()}`,
            requireInteraction: true,
            url: '/dashboard'
          }
        );
        sentCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Sent ${sentCount} notifications`,
      sentCount
    });
  } catch (error) {
    console.error('Timed notifications error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to get notification title with emoji
function getNotificationTitle(category) {
  const titles = {
    'Breakfast': '🌅 Breakfast Time',
    'Lunch': '🥗 Lunch Time',
    'Dinner': '🌙 Dinner Time',
    'Snack': '🍎 Snack Break',
    'Hydration': '💧 Stay Hydrated',
    'Sleep': '😴 Time to Sleep',
    'Fitness': '💪 Workout Time',
    'Health': '🏥 Health Reminder',
  };
  return titles[category] || '🏥 Health AI';
}

// Helper function to get time-based notifications
async function getTimeBasedNotifications(goal, hour) {
  const recommendations = [];
  const foodPreference = goal.foodPreference || "non-vegetarian";

  const mealTimes = {
    breakfast: { start: 6, end: 10 },
    lunch: { start: 12, end: 15 },
    snack: { start: 16, end: 18 },
    dinner: { start: 19, end: 22 },
  };

  const getMealRecommendation = (mealType, preference) => {
    const meals = {
      vegetarian: {
        breakfast: ["🌾 Oatmeal with berries and nuts", "🍞 Whole grain toast with avocado"],
        lunch: ["🥙 Chickpea salad wrap", "🥗 Quinoa and roasted vegetable bowl"],
        dinner: ["🍝 Grilled vegetable pasta", "🍠 Sweet potato and black bean bowl"],
        snack: ["🍎 Apple slices with peanut butter", "🥜 Trail mix"],
      },
      "non-vegetarian": {
        breakfast: ["🍳 Scrambled eggs with whole grain toast", "🍗 Grilled chicken breast with vegetables"],
        lunch: ["🥗 Grilled chicken Caesar salad", "🐟 Tuna and quinoa bowl"],
        dinner: ["🐟 Grilled salmon with quinoa", "🍗 Chicken breast with roasted vegetables"],
        snack: ["🥚 Hard-boiled eggs", "🥤 Protein shake with fruit"],
      },
      vegan: {
        breakfast: ["🥤 Vegan smoothie bowl", "🥣 Chia seed pudding"],
        lunch: ["🍛 Chickpea and vegetable curry", "🥬 Tofu and vegetable stir-fry"],
        dinner: ["🍝 Vegan lentil bolognese", "🥬 Tempeh and vegetable skewers"],
        snack: ["🥜 Fruit and nut bars", "🥕 Hummus with vegetable sticks"],
      },
    };
    return meals[preference]?.[mealType] || meals["non-vegetarian"][mealType];
  };

  // Time-based recommendations with better formatting
  if (hour >= mealTimes.breakfast.start && hour < mealTimes.breakfast.end) {
    const options = getMealRecommendation('breakfast', foodPreference.toLowerCase());
    recommendations.push({
      type: "eat",
      text: `🌅 Start your day right! Choose from:\n${options.slice(0, 2).join('\n• ')}`,
      category: "Breakfast",
      priority: "high",
    });
    recommendations.push({
      type: "drink",
      text: "💧 Drink 500ml of water to rehydrate",
      category: "Hydration",
      priority: "high",
    });
  } else if (hour >= mealTimes.lunch.start && hour < mealTimes.lunch.end) {
    const options = getMealRecommendation('lunch', foodPreference.toLowerCase());
    recommendations.push({
      type: "eat",
      text: `🥗 Lunch time! Try:\n${options.slice(0, 2).join('\n• ')}`,
      category: "Lunch",
      priority: "high",
    });
    recommendations.push({
      type: "drink",
      text: "💧 Have 300ml of water with your meal",
      category: "Hydration",
      priority: "medium",
    });
  } else if (hour >= mealTimes.snack.start && hour < mealTimes.snack.end) {
    const options = getMealRecommendation('snack', foodPreference.toLowerCase());
    recommendations.push({
      type: "eat",
      text: `🍎 Healthy snack break:\n${options.slice(0, 2).join('\n• ')}`,
      category: "Snack",
      priority: "medium",
    });
  } else if (hour >= mealTimes.dinner.start && hour < mealTimes.dinner.end) {
    const options = getMealRecommendation('dinner', foodPreference.toLowerCase());
    recommendations.push({
      type: "eat",
      text: `🌙 Dinner suggestion:\n${options.slice(0, 2).join('\n• ')}`,
      category: "Dinner",
      priority: "high",
    });
    recommendations.push({
      type: "sleep",
      text: `😴 Finish eating 2-3 hours before bed. Target: ${goal.sleepHours || 8}h sleep`,
      category: "Sleep",
      priority: "high",
    });
  } else {
    recommendations.push({
      type: "sleep",
      text: `🌙 Wind down time! Prepare for ${goal.sleepHours || 8} hours of quality sleep`,
      category: "Sleep",
      priority: "high",
    });
  }

  // Hydration reminder
  const waterNeeded = goal.waterIntake || 2.5;
  recommendations.push({
    type: "drink",
    text: `💧 Daily water target: ${waterNeeded}L. Stay hydrated!`,
    category: "Hydration",
    priority: "medium",
  });

  // Exercise reminder
  const today = new Date().getDay();
  const exerciseSchedule = [1, 3, 5];
  if (exerciseSchedule.includes(today)) {
    recommendations.push({
      type: "exercise",
      text: `💪 Workout day! Your ${goal.preferredWorkoutType || 'mixed'} workout is scheduled`,
      category: "Fitness",
      priority: "medium",
    });
  }

  return recommendations;
}

