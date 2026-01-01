import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios';

axios.defaults.withCredentials = true; // Ensure cookies are sent


import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/auth';
import { SettingsProvider } from './context/SettingsContext';
import { AccountProvider } from './context/AccountContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <AccountProvider>
          <SettingsProvider>
            <App />
          </SettingsProvider>
        </AccountProvider>
      </AuthProvider>
    </Router>
  </StrictMode>,
)
