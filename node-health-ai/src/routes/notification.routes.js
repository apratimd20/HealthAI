// routes/notification.routes.js
import express from 'express';
import { 
  subscribeToPush,
  unsubscribeFromPush,
  sendTimedNotifications,
  sendTestNotification 
} from '../controllers/notification.controller.js';
import { authUser } from '../middleware/user.middleware.js';

export const NotificationRouter = express.Router();

NotificationRouter.post('/subscribe', authUser, subscribeToPush);
NotificationRouter.post('/unsubscribe', authUser, unsubscribeFromPush);
NotificationRouter.post('/send-timed', authUser, sendTimedNotifications);

// Test endpoint (remove in production)
NotificationRouter.post('/test', authUser, async (req, res) => {
  try {
    const { sendPushNotification } = await import('../controllers/notification.controller.js');
    await sendPushNotification(
      req.user._id,
      'Test Notification',
      'This is a test push notification from Health AI!',
      { tag: 'test', requireInteraction: true }
    );
    return res.status(200).json({
      success: true,
      message: 'Test notification sent'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});