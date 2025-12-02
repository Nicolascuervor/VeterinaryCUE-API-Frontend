
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import LoginPage from '@/pages/LoginPage';
import AdminDashboard from '@/pages/AdminDashboard';
import VeterinarianDashboard from '@/pages/VeterinarianDashboard';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <BrowserRouter>
      <Helmet>
        <title>Veterinaria CUE</title>
        <meta name="description" content="Sistema de Gestión Veterinaria CUE" />
      </Helmet>
      
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/dashboard/veterinarian" element={<VeterinarianDashboard />} />
        
        {/* Redirect generic dashboard based on role logic (simplified here) */}
        {/* This route will only be hit if someone directly navigates to /dashboard without a role-based redirect from login. */}
        {/* The primary role-based redirection now happens in LoginPage.jsx */}
        <Route path="/dashboard" element={<Navigate to="/dashboard/admin" replace />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster />
    </BrowserRouter>
  );
}

export default App;
