import React from "react";
import { Routes } from "react-router-dom";
import { publicRoutes } from './routes/publicRoutes';
import { authRoutes } from './routes/authRoutes';
import { dashboardRoutes } from './routes/dashboardRoutes';
import { candidateRoutes } from './routes/candidateRoutes';
import { adminRoutes } from './routes/adminRoutes';

/**
 * Main application routing configuration
 * 
 * Route organization:
 * - Public: Marketing pages, landing, features, pricing
 * - Auth: Login, signup, onboarding, application forms
 * - Dashboard: Main authenticated user dashboard
 * - Candidate: Candidate portal (/my-jobs/*)
 * - Admin: Admin panel (/admin/*)
 */
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public marketing & info pages */}
      {publicRoutes}
      
      {/* Authentication & application flows */}
      {authRoutes}
      
      {/* Main dashboard */}
      {dashboardRoutes}
      
      {/* Candidate portal */}
      {candidateRoutes}
      
      {/* Admin panel */}
      {adminRoutes}
    </Routes>
  );
};

export default AppRoutes;
