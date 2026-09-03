import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { ChallengeDetails } from './pages/ChallengeDetails';
import { ParticipantDashboard } from './pages/ParticipantDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { CreateChallenge } from './pages/admin/CreateChallenge';
import { ReviewSubmission } from './pages/admin/ReviewSubmission';
import { ChannelsList } from './pages/channels/ChannelsList';
import { ChannelProfile } from './pages/channels/ChannelProfile';
import { MyChannelDashboard } from './pages/channels/MyChannelDashboard';
import { VideoPlayer } from './pages/channels/VideoPlayer';
import { VideoDashboard } from './pages/channels/VideoDashboard';

// Protected Route wrappers
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Only participant can see participant dashboard
const RequireParticipant = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== 'participant') return <Navigate to="/" replace />;
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public/Participant Routes */}
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="challenge/:id" element={<ChallengeDetails />} />
        
        {/* Public Channels Routes */}
        <Route path="channels" element={<ChannelsList />} />
        <Route path="channels/:id" element={<ChannelProfile />} />
        <Route path="reels" element={<VideoDashboard />} />
        <Route path="reels/:id" element={<VideoPlayer />} />

        {/* Participant Protected */}
        <Route 
          path="dashboard" 
          element={
            <RequireParticipant>
              <ParticipantDashboard />
            </RequireParticipant>
          } 
        />
        
        <Route 
          path="my-channel" 
          element={
            <RequireAuth>
              <MyChannelDashboard />
            </RequireAuth>
          } 
        />

        {/* Admin Protected Routes */}
        <Route 
          path="admin" 
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          } 
        />
        <Route 
          path="admin/create-challenge" 
          element={
            <RequireAdmin>
              <CreateChallenge />
            </RequireAdmin>
          } 
        />
        <Route 
          path="admin/review/:id" 
          element={
            <RequireAdmin>
              <ReviewSubmission />
            </RequireAdmin>
          } 
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
