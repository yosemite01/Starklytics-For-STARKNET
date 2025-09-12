import ContractEventsEDA from "./pages/ContractEventsEDA";
import Docs from "./pages/Docs";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CavosProvider } from "@/contexts/CavosContext";
import { DataProvider } from "@/contexts/DataContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import CreateBounty from "./pages/CreateBounty";
import QueryEditor from "./pages/QueryEditor";
import Analytics from "./pages/Analytics";
import Bounties from "./pages/Bounties";
import DashboardBuilder from "./pages/DashboardBuilder";
import DataVisualization from "./pages/DataVisualization";
import Wallet from "./pages/Wallet";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import JoinBounty from "./pages/JoinBounty";
import PlaceBounty from "./pages/PlaceBounty";
import SystemStatus from "./pages/SystemStatus";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CavosProvider clientId={import.meta.env.VITE_CAVOS_CLIENT_ID || 'demo'}>
      <AuthProvider>
        <DataProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={
              <ProtectedRoute requireAuth={false}>
                <Auth />
              </ProtectedRoute>
            } />
            
            <Route path="/docs" element={
                <Docs />
            } />

            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/join-bounty" element={
              <ProtectedRoute>
                <JoinBounty />
              </ProtectedRoute>
            } />
            <Route path="/place-bounty" element={
              <ProtectedRoute>
                <PlaceBounty />
              </ProtectedRoute>
            } />
            <Route path="/create-bounty" element={
              <ProtectedRoute>
                <CreateBounty />
              </ProtectedRoute>
            } />
            <Route path="/query" element={
              <ProtectedRoute>
                <QueryEditor />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } />
            <Route path="/bounties" element={
              <ProtectedRoute>
                <Bounties />
              </ProtectedRoute>
            } />
            <Route path="/builder" element={
              <ProtectedRoute>
                <DashboardBuilder />
              </ProtectedRoute>
            } />
            <Route path="/charts" element={
              <ProtectedRoute>
                <DataVisualization />
              </ProtectedRoute>
            } />
            <Route path="/wallet" element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            } />
            <Route path="/contract-events-eda" element={
              <ProtectedRoute>
                <ContractEventsEDA />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/status" element={
              <ProtectedRoute>
                <SystemStatus />
              </ProtectedRoute>
            } />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
          </TooltipProvider>
        </DataProvider>
      </AuthProvider>
    </CavosProvider>
  </QueryClientProvider>
);

export default App;
