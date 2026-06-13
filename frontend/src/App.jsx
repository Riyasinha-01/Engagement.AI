import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Pages Imports
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreateCampaign from './pages/CreateCampaign';
import CampaignDetails from './pages/CampaignDetails';
import AIInsights from './pages/AIInsights';
import EmailEditor from './pages/EmailEditor';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import CustomerTracking from './pages/CustomerTracking';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg text-gray-100 flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="text-gray-400 mt-4 font-medium">Validating security session...</p>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Public Customer Tracking Landing Page */}
            <Route path="/customer/:customerId" element={<CustomerTracking />} />

            {/* Protected Marketer Console Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/campaigns/new" element={
              <ProtectedRoute>
                <CreateCampaign />
              </ProtectedRoute>
            } />
            <Route path="/campaigns/:id" element={
              <ProtectedRoute>
                <CampaignDetails />
              </ProtectedRoute>
            } />
            <Route path="/campaigns/:id/insights" element={
              <ProtectedRoute>
                <AIInsights />
              </ProtectedRoute>
            } />
            <Route path="/campaigns/:id/email-editor" element={
              <ProtectedRoute>
                <EmailEditor />
              </ProtectedRoute>
            } />
            <Route path="/campaigns/:id/analytics" element={
              <ProtectedRoute>
                <AnalyticsDashboard />
              </ProtectedRoute>
            } />

            {/* Fallback Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
