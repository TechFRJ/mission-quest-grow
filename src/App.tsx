import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GameProvider } from "@/contexts/GameContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppSidebar, MobileTopNav } from "@/components/AppSidebar";
import Index from "./pages/Index";
import { Missions } from "./pages/Missions";
import { Shop } from "./pages/Shop";
import { Profile } from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import WorkoutsPage from "./pages/WorkoutsPage";
import DietPage from "./pages/DietPage";
import GoalsPage from "./pages/GoalsPage";
import FinancePage from "./pages/FinancePage";
import FocusPage from "./pages/FocusPage";
import { useSeedExercises } from "./hooks/useSeedExercises";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <MobileTopNav />
      {/* Content offset: sidebar on desktop, topbar on mobile */}
      <main className="md:pl-60 pt-14 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  useSeedExercises();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route path="/" element={<ProtectedRoute><AppLayout><Index /></AppLayout></ProtectedRoute>} />
      <Route path="/missions" element={<ProtectedRoute><AppLayout><Missions /></AppLayout></ProtectedRoute>} />
      <Route path="/shop" element={<ProtectedRoute><AppLayout><Shop /></AppLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
      <Route path="/workouts" element={<ProtectedRoute><AppLayout><WorkoutsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/diet" element={<ProtectedRoute><AppLayout><DietPage /></AppLayout></ProtectedRoute>} />
      <Route path="/goals" element={<ProtectedRoute><AppLayout><GoalsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/finance" element={<ProtectedRoute><AppLayout><FinancePage /></AppLayout></ProtectedRoute>} />
      <Route path="/focus" element={<ProtectedRoute><AppLayout><FocusPage /></AppLayout></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <GameProvider>
          <Toaster />
          <Sonner position="top-center" />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </GameProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
