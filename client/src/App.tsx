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
import Analytics from "./pages/Analytics";
import { useAuth } from "./_core/hooks/useAuth";
import { Button } from "./components/ui/button";
import { Menu, X, LogOut, BarChart3, TrendingUp, Wallet as WalletIcon } from "lucide-react";
import { useState } from "react";

function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-primary hidden sm:inline">Kripta</h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-1">
          <a href="/" className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Dashboard
          </a>
          <a href="/markets" className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Markets
          </a>
          <a href="/trading" className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trading
          </a>
          <a href="/wallet" className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors flex items-center gap-2">
            <WalletIcon className="w-4 h-4" />
            Wallet
          </a>
          <a href="/analytics" className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </a>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline font-medium">{user?.name}</span>
          <Button variant="outline" size="sm" onClick={logout} className="hidden sm:flex">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
          <button className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            <a href="/" className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors">Dashboard</a>
            <a href="/markets" className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors">Markets</a>
            <a href="/trading" className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors">Trading</a>
            <a href="/wallet" className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors">Wallet</a>
            <a href="/analytics" className="block px-4 py-2 text-sm font-medium hover:bg-accent rounded-lg transition-colors">Analytics</a>
            <div className="pt-2 border-t">
              <Button variant="outline" size="sm" onClick={logout} className="w-full justify-start">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
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
      <div className="bg-background min-h-screen">
        <Switch>
          <Route path={"/"} component={isAuthenticated ? Dashboard : Home} />
          <Route path={"/markets"} component={isAuthenticated ? Markets : Home} />
          <Route path={"/trading"} component={isAuthenticated ? Trading : Home} />
          <Route path={"/wallet"} component={isAuthenticated ? Wallet : Home} />
          <Route path={"/analytics"} component={isAuthenticated ? Analytics : Home} />
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
