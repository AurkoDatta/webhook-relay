import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ApplicationsList from './pages/ApplicationsList';
import ApplicationDetail from './pages/ApplicationDetail';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/applications" element={<ApplicationsList />} />
          <Route path="/applications/:appId" element={<ApplicationDetail />} />
        </Route>

        <Route path="/" element={<Navigate to="/applications" replace />} />
        <Route path="*" element={<Navigate to="/applications" replace />} />
      </Routes>
    </AuthProvider>
  );
}
