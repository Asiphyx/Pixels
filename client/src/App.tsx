import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Tavern from "@/pages/Tavern";
import ClearLocalData from "@/components/ClearLocalData";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Tavern} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClearLocalData />
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
