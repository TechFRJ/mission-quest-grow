import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GameProvider } from "@/contexts/GameContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
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

function AppRoutes() {
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

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-background">
              <Header />
              <Index />
              <BottomNav />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/missions"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-background">
              <Header />
              <Missions />
              <BottomNav />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shop"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-background">
              <Header />
              <Shop />
              <BottomNav />
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-background">
              <Header />
              <Profile />
              <BottomNav />
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="/workouts" element={<ProtectedRoute><div className="min-h-screen bg-background"><Header /><WorkoutsPage /><BottomNav /></div></ProtectedRoute>} />
      <Route path="/diet" element={<ProtectedRoute><div className="min-h-screen bg-background"><Header /><DietPage /><BottomNav /></div></ProtectedRoute>} />
      <Route path="/goals" element={<ProtectedRoute><div className="min-h-screen bg-background"><Header /><GoalsPage /><BottomNav /></div></ProtectedRoute>} />
      <Route path="/finance" element={<ProtectedRoute><div className="min-h-screen bg-background"><Header /><FinancePage /><BottomNav /></div></ProtectedRoute>} />
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
