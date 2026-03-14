import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ManagePinRequests from "@/pages/admin/ManagePinRequests";
import ManageUsers from "@/pages/admin/ManageUsers";
import ManageWithdrawals from "@/pages/admin/ManageWithdrawals";
import ManageComplaintsAndFeedback from "@/pages/admin/ManageComplaintsAndFeedback";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isLoggedIn || !isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isLoggedIn, isAdmin, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={isLoggedIn && isAdmin ? <Navigate to="/admin/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<Navigate to={isLoggedIn && isAdmin ? "/admin/dashboard" : "/login"} replace />} />
      <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/pin-requests" element={<ProtectedRoute><ManagePinRequests /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute><ManageUsers /></ProtectedRoute>} />
      <Route path="/admin/withdrawals" element={<ProtectedRoute><ManageWithdrawals /></ProtectedRoute>} />
      <Route path="/admin/complaints" element={<ProtectedRoute><ManageComplaintsAndFeedback /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
