import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

import App from './App.jsx';
import ProfilePage from './pages/ProfilePage.jsx'; // adjust path if needed

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="users/:identifier/profile" element={<ProfilePage />} />
          <Route path="*" element={<div style={{ padding: 40 }}>404</div>} />
        </Route>
      </Routes>
    </Router>
  </StrictMode>
);