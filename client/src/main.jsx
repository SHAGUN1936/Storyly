/* TEMP: scroll-debug instrument — imported FIRST so its addEventListener
   patch is installed before Lenis/React register any touch listeners.
   Remove this import (and src/lib/scrollDebug.js) once the bug is found. */
import { installScrollDebug } from './lib/scrollDebug';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { MotionProvider } from './motion/MotionProvider';
import 'lenis/dist/lenis.css';
import './index.css';

installScrollDebug();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <MotionProvider>
          <App />
        </MotionProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
