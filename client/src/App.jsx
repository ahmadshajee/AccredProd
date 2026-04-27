import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import DashboardPage from './pages/DashboardPage';
import BlockchainPage from './pages/BlockchainPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import RegisterPage from './pages/RegisterPage';
import VerifyPage from './pages/VerifyPage';
import VerifyResultPage from './pages/VerifyResultPage';
import LoadingSpinner from './components/LoadingSpinner';

function GuestOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner label="Loading session..." />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <Routes>
        <Route element={<LandingPage />} path="/" />
        <Route element={<BlockchainPage />} path="/blockchain" />
        <Route element={<VerifyPage />} path="/verify" />
        <Route
          element={
            <GuestOnlyRoute>
              <LoginPage />
            </GuestOnlyRoute>
          }
          path="/login"
        />
        <Route
          element={
            <GuestOnlyRoute>
              <RegisterPage />
            </GuestOnlyRoute>
          }
          path="/register"
        />
        <Route
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
          path="/dashboard"
        />
        <Route element={<VerifyResultPage />} path="/verify/:tokenId" />
        <Route element={<VerifyResultPage />} path="/verify/*" />
        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </div>
  );
}
