import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppDataProvider } from './state/AppDataContext';
import { ToastProvider } from './components/Toast';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppDataProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AppDataProvider>
    </BrowserRouter>
  </React.StrictMode>
);
