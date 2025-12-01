import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/DashboardNew';
import Constructions from '@/pages/Constructions';
import Inspections from '@/pages/Inspections';
import Payments from '@/pages/Payments';
import WorkPlans from '@/pages/WorkPlans';
import Licenses from '@/pages/Licenses';
import Activities from '@/pages/Activities';
import Users from '@/pages/Users';
import Reports from '@/pages/Reports';
import Companies from '@/pages/Companies';
import HakedisEvrak from '@/pages/HakedisEvrak';
import Mesajlasma from '@/pages/MesajlasmaNew';
import AylikRaporlar from '@/pages/AylikRaporlar';
import YilSonuRaporlar from '@/pages/YilSonuRaporlar';
import SuperAdminReports from '@/pages/SuperAdminReports';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Yükleniyor...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Yükleniyor...</div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" /> : children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      <Route path="/dashboard" element={
        <PrivateRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/constructions" element={
        <PrivateRoute>
          <Layout>
            <Constructions />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/inspections" element={
        <PrivateRoute>
          <Layout>
            <Inspections />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/payments" element={
        <PrivateRoute>
          <Layout>
            <Payments />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/workplans" element={
        <PrivateRoute>
          <Layout>
            <WorkPlans />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/licenses" element={
        <PrivateRoute>
          <Layout>
            <Licenses />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/activities" element={
        <PrivateRoute>
          <Layout>
            <Activities />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/users" element={
        <PrivateRoute>
          <Layout>
            <Users />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/reports" element={
        <PrivateRoute>
          <Layout>
            <Reports />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/companies" element={
        <PrivateRoute>
          <Layout>
            <Companies />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/hakedis-evrak" element={
        <PrivateRoute>
          <Layout>
            <HakedisEvrak />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/mesajlasma" element={
        <PrivateRoute>
          <Layout>
            <Mesajlasma />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/aylik-raporlar" element={
        <PrivateRoute>
          <Layout>
            <AylikRaporlar />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/yilsonu-raporlar" element={
        <PrivateRoute>
          <Layout>
            <YilSonuRaporlar />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/super-admin-reports" element={
        <PrivateRoute>
          <Layout>
            <SuperAdminReports />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

function App() {
  useEffect(() => {
    // Load Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;