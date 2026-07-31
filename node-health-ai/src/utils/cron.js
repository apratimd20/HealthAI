import cron from 'node-cron';
import { sendTimedNotifications } from '../controllers/notification.controller.js';

// Only start cron if not in test environment
if (process.env.NODE_ENV !== 'test') {
  // Run at the start of every hour (e.g., 9:00, 10:00, 11:00, etc.)
  cron.schedule('0 * * * *', async () => {
    console.log('Running timed notifications check at:', new Date().toISOString());
    try {
      const req = { user: { _id: 'system' } };
      const res = {
        status: (code) => ({
          json: (data) => {
            if (data.sentCount > 0) {
              console.log(`Sent ${data.sentCount} timed notifications`);
            }
          }
        })
      };
      await sendTimedNotifications(req, res);
    } catch (error) {
      console.error('Cron job error:', error);
    }
  });

  console.log('Cron job scheduled for timed notifications (hourly)');
} else {
  console.log('Cron job disabled in test environment');
}

export default cron;