// backend/utils/cron.js
import cron from 'node-cron';
import { sendTimedNotifications } from '../controllers/notification.controller.js';

// Only start cron if not in test environment
if (process.env.NODE_ENV !== 'test') {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('Running timed notifications check at:', new Date().toISOString());
    try {
      // Create mock request/response for internal call
      const req = { user: { _id: 'system' } };
      const res = {
        status: (code) => ({
          json: (data) => {
            console.log('Notifications sent:', data);
          }
        })
      };
      await sendTimedNotifications(req, res);
    } catch (error) {
      console.error('Cron job error:', error);
    }
  });

  console.log('Cron job scheduled for timed notifications');
} else {
  console.log('Cron job disabled in test environment');
}

// Optional: Run once on startup to send immediate notifications
setTimeout(async () => {
  console.log('Running initial notification check...');
  try {
    const req = { user: { _id: 'system' } };
    const res = {
      status: (code) => ({
        json: (data) => {
          console.log('Initial notifications sent:', data);
        }
      })
    };
    await sendTimedNotifications(req, res);
  } catch (error) {
    console.error('Initial notification check error:', error);
  }
}, 5000); // Wait 5 seconds after server starts

export default cron;