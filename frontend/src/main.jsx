import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* AuthProvider wraps everything — every component
        inside can now call useAuth() */}
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default route — redirect root path to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public routes — no protection needed */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected route — requires valid session */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all — unknown URLs redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);