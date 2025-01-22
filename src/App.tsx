import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { Auth } from "@/pages/Auth";
import { Dashboard } from "@/pages/Dashboard";
import { Index } from "@/pages/Index";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import EditExpense from "@/pages/EditExpense";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-expense/:id"
            element={
              <ProtectedRoute>
                <EditExpense />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
