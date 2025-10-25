import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminBootstrap from "./pages/AdminBootstrap";
import EmployeeDashboard from "./pages/employee/Dashboard";
import HRDashboard from "./pages/hr/Dashboard";
import CreateSurvey from "./pages/hr/CreateSurvey";
import Analytics from "./pages/hr/Analytics";
import Commitments from "./pages/hr/Commitments";
import Settings from "./pages/hr/Settings";
import NotFound from "./pages/NotFound";
import EmployeeProfile from "./pages/employee/Profile";
import PublicSurvey from "./pages/PublicSurvey";
import AcceptInvitation from "./pages/AcceptInvitation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin-bootstrap" element={<AdminBootstrap />} />
            <Route path="/survey/:linkToken" element={<PublicSurvey />} />
            <Route path="/invite/:token" element={<AcceptInvitation />} />
          <Route 
            path="/employee/dashboard" 
            element={
              <ProtectedRoute>
                <EmployeeDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employee/profile" 
            element={
              <ProtectedRoute>
                <EmployeeProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/dashboard" 
            element={
              <ProtectedRoute requiredRole="hr_admin">
                <HRDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/create-survey" 
            element={
              <ProtectedRoute requiredRole="hr_admin">
                <CreateSurvey />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/analytics" 
            element={
              <ProtectedRoute requiredRole="hr_admin">
                <Analytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/commitments" 
            element={
              <ProtectedRoute requiredRole="hr_admin">
                <Commitments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/hr/settings" 
            element={
              <ProtectedRoute requiredRole="hr_admin">
                <Settings />
              </ProtectedRoute>
            } 
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
