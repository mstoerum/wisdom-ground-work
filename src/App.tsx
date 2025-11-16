import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminBootstrap from "./pages/AdminBootstrap";
import Demo from "./pages/Demo";
import DemoEmployee from "./pages/demo/DemoEmployee";
import DemoHR from "./pages/demo/DemoHR";
import DesignPreview from "./pages/demo/DesignPreview";
import EmployeeDashboard from "./pages/employee/Dashboard";
import HRDashboard from "./pages/hr/Dashboard";
import CreateSurvey from "./pages/hr/CreateSurvey";
import Analytics from "./pages/hr/Analytics";
import Commitments from "./pages/hr/Commitments";
import Settings from "./pages/hr/Settings";
import SpradleyEvaluations from "./pages/hr/SpradleyEvaluations";
import NotFound from "./pages/NotFound";
import EmployeeProfile from "./pages/employee/Profile";
import PublicSurvey from "./pages/PublicSurvey";
import AcceptInvitation from "./pages/AcceptInvitation";
import TestTrustFlow from "./pages/TestTrustFlow";
import TestSurveyChat from "./pages/hr/TestSurveyChat";

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
            
            {/* Demo Routes */}
            <Route path="/demo" element={<Demo />} />
            <Route path="/demo/employee" element={<DemoEmployee />} />
            <Route path="/demo/hr" element={<DemoHR />} />
            <Route path="/demo/design-preview" element={<DesignPreview />} />
            
            {/* Test Routes */}
            <Route path="/test/trust-flow" element={<TestTrustFlow />} />
            
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
            path="/hr/test-survey-chat" 
            element={
              <ProtectedRoute requiredRole="hr_admin">
                <TestSurveyChat />
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
          <Route 
            path="/hr/evaluations" 
            element={
              <ProtectedRoute requiredRole="hr_admin">
                <SpradleyEvaluations />
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
