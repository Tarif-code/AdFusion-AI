import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import DashboardPage from "./pages/DashboardPage";
import CampaignsPage from "./pages/CampaignsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import CreateAdPage from "./pages/CreateAdPage";
import CreateAdAIPage from "./pages/CreateAdAIPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import IntegrationsPage from "./pages/IntegrationsPage";
import IntegrationCallbackPage from "./pages/IntegrationCallbackPage";
import MainLayout from "./components/layout/MainLayout";
import HomePage from "./pages/HomePage"; // Import the new HomePage component


function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />

      <Route path="/campaigns">
        <MainLayout>
          <CampaignsPage />
        </MainLayout>
      </Route>

      <Route path="/analytics">
        <MainLayout>
          <AnalyticsPage />
        </MainLayout>
      </Route>

      <Route path="/create-ad-ai">
        <MainLayout>
          <CreateAdAIPage />
        </MainLayout>
      </Route>
      
      <Route path="/create-ad">
        <MainLayout>
          <CreateAdPage />
        </MainLayout>
      </Route>

      <Route path="/integrations">
        <MainLayout>
          <IntegrationsPage />
        </MainLayout>
      </Route>

      <Route path="/integrations/success">
        <IntegrationCallbackPage />
      </Route>

      <Route path="/integrations/error">
        <IntegrationCallbackPage />
      </Route>

      <Route path="/dashboard">
        <MainLayout>
          <DashboardPage />
        </MainLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;