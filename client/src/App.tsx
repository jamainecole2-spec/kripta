import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Markets from "./pages/Markets";
import Trading from "./pages/Trading";
import Wallet from "./pages/Wallet";
import { useAuth } from "./_core/hooks/useAuth";
import { Button } from "./components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";

function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-primary">Kripta</h1>
          <div className="hidden md:flex gap-6">
            <a href="/" className="text-sm font-medium hover:text-primary transition-colors">Dashboard</a>
            <a href="/markets" className="text-sm font-medium hover:text-primary transition-colors">Markets</a>
            <a href="/trading" className="text-sm font-medium hover:text-primary transition-colors">Trading</a>
            <a href="/wallet" className="text-sm font-medium hover:text-primary transition-colors">Wallet</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline">{user?.name}</span>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <a href="/" className="block py-2 text-sm font-medium hover:text-primary">Dashboard</a>
            <a href="/markets" className="block py-2 text-sm font-medium hover:text-primary">Markets</a>
            <a href="/trading" className="block py-2 text-sm font-medium hover:text-primary">Trading</a>
            <a href="/wallet" className="block py-2 text-sm font-medium hover:text-primary">Wallet</a>
          </div>
        </div>
      )}
    </nav>
  );
}

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <Switch>
          <Route path={"/"} component={isAuthenticated ? Dashboard : Home} />
          <Route path={"/markets"} component={isAuthenticated ? Markets : Home} />
          <Route path={"/trading"} component={isAuthenticated ? Trading : Home} />
          <Route path={"/wallet"} component={isAuthenticated ? Wallet : Home} />
          <Route path={"/404"} component={NotFound} />
          {/* Final fallback route */}
          <Route component={NotFound} />
        </Switch>
      </div>
    </>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
