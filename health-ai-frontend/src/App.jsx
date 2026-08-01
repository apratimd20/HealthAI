// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FeedProvider } from './context/FeedContext'; 
import AppRouter from './routes/AppRouter';
import { Toaster } from 'react-hot-toast';
import { notificationService } from './services/notificationService';

function App() {
  useEffect(() => {
    // Initialize push notifications
    const initNotifications = async () => {
      try {
        if (notificationService.isSupported) {
          const granted = await notificationService.init();
          if (granted) {
            console.log('Push notifications enabled');
          } else {
            console.log('Push notifications not granted');
          }
        }
      } catch (error) {
        console.error('Notification initialization error:', error);
      }
    };
    
    // Only initialize if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      initNotifications();
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <FeedProvider> 
          <AppRouter />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#18181b',
                color: '#fafafa',
                border: '1px solid #27272a',
                borderRadius: '12px',
                fontFamily: 'Inter, system-ui, sans-serif',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#09090b',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#09090b',
                },
              },
            }}
          />
        </FeedProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
