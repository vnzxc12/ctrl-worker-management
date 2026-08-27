import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './components/common/Toast';
import { PWAProvider } from './context/PWAContext';
import IOSInstallModal from './components/common/IOSInstallModal';

import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeProfile from './pages/EmployeeProfile';
import Sites from './pages/Sites';
import SiteDetail from './pages/SiteDetail';
import Designations from './pages/Designations';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import PayrollPeriodDetail from './pages/PayrollPeriodDetail';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ToastProvider>
          <PWAProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />

                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="employees" element={<Employees />} />
                  <Route path="employees/:id" element={<EmployeeProfile />} />
                  <Route path="sites" element={<Sites />} />
                  <Route path="sites/:id" element={<SiteDetail />} />
                  <Route path="designations" element={<Designations />} />
                  <Route path="attendance" element={<Attendance />} />
                  <Route path="payroll" element={<Payroll />} />
                  <Route path="payroll/:periodId" element={<PayrollPeriodDetail />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                </Route>

                {/* Fallback to Dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              {/* iOS Install Prompt Guide */}
              <IOSInstallModal />
            </BrowserRouter>
          </PWAProvider>
        </ToastProvider>
      </DataProvider>
    </AuthProvider>
  );
}
