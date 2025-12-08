import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { ArrowRight, TrendingUp, Lock, Zap, BarChart3 } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to Kripta</h1>
        <p className="text-muted-foreground text-lg">Your modern cryptocurrency exchange</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Kripta</h1>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 container mx-auto px-4 py-20 flex flex-col justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">Trade Crypto with Confidence</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Kripta Asset Exchange is a modern, secure, and intuitive platform for buying, selling, and managing cryptocurrencies.
          </p>
          <Button size="lg" asChild className="mb-12">
            <a href={getLoginUrl()}>
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="bg-accent py-20">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Why Choose Kripta?</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-lg">
              <Lock className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Secure</h4>
              <p className="text-muted-foreground">Industry-leading security protocols protect your assets 24/7.</p>
            </div>
            <div className="bg-background p-6 rounded-lg">
              <Zap className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Fast</h4>
              <p className="text-muted-foreground">Execute trades instantly with our optimized trading engine.</p>
            </div>
            <div className="bg-background p-6 rounded-lg">
              <BarChart3 className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Transparent</h4>
              <p className="text-muted-foreground">Real-time market data and transparent pricing for all trades.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h3 className="text-3xl font-bold mb-6">Ready to start trading?</h3>
        <Button size="lg" asChild>
          <a href={getLoginUrl()}>
            Sign Up Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </a>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background mt-auto">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2025 Kripta Asset Exchange. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
