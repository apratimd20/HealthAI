// App.jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FeedProvider } from './context/FeedContext'; 
import AppRouter from './routes/AppRouter';
import { Toaster } from 'react-hot-toast';

function App() {
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