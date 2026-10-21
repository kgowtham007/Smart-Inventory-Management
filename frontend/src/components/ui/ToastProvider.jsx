import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#363636',
          color: '#fff',
        },
        success: {
          style: {
            background: '#166534',
          },
        },
        error: {
          style: {
            background: '#991b1b',
          },
        },
      }}
    />
  );
};

export default ToastProvider;
