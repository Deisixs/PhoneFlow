import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import { PINLogin } from './components/PINLogin';
import { PINLock } from './components/PINLock';
import { Layout } from './components/Layout';
import { Inventory } from './pages/Inventory';
import { Repairs } from './pages/Repairs';
import { Analytics } from './pages/Analytics';
import { Scanner } from './pages/Scanner';
import { Settings } from './pages/Settings';
import Stock from './pages/Stock';
import Materiel from './pages/Materiel';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isLocked } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isLocked) {
    return <PINLock />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/inventory" replace /> : <PINLogin />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/inventory" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <Layout>
              <Inventory />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/repairs"
        element={
          <ProtectedRoute>
            <Layout>
              <Repairs />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Layout>
              <Analytics />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/scanner"
        element={
          <ProtectedRoute>
            <Layout>
              <Scanner />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock"
        element={
          <ProtectedRoute>
            <Layout>
              <Stock />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/materiel"
        element={
          <ProtectedRoute>
            <Layout>
              <Materiel />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/inventory" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
