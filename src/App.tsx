
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Jobs from "./pages/Jobs";
import Applications from "./pages/Applications";
import VoiceAgent from "./pages/VoiceAgent";
import TenstreetIntegration from "./pages/TenstreetIntegration";
import RoutesPage from "./pages/Routes";
import Platforms from "./pages/Platforms";
import Clients from "./pages/Clients";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import AdminLanding from "./pages/AdminLanding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<AdminLanding />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Index />} />
                <Route path="jobs" element={<Jobs />} />
                <Route path="applications" element={<Applications />} />
                <Route path="voice-agent" element={<VoiceAgent />} />
                <Route path="tenstreet" element={<TenstreetIntegration />} />
                <Route path="routes" element={<RoutesPage />} />
                <Route path="platforms" element={<Platforms />} />
                <Route path="clients" element={<Clients />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
