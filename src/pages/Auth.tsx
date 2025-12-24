import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Brain, BarChart3, TrendingUp, Zap, Shield, Globe } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Account created! You can now login.');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Brain, label: 'AI-Powered Insights' },
    { icon: BarChart3, label: 'Real-time Analytics' },
    { icon: TrendingUp, label: 'Market Intelligence' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Branding & Graphics */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-1/2 -left-20 w-60 h-60 bg-accent/20 rounded-full blur-3xl animate-pulse delay-700" />
            <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-pulse delay-1000" />
            
            {/* Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
                backgroundSize: '60px 60px'
              }}
            />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
            {/* Logo & Title */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                  <Brain className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl xl:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Smart Business
                  </h1>
                  <h1 className="text-3xl xl:text-4xl font-bold text-foreground">
                    Analyzer
                  </h1>
                </div>
              </div>
              
              {/* Tagline */}
              <p className="text-xl xl:text-2xl text-muted-foreground max-w-md leading-relaxed">
                Transform your business decisions with 
                <span className="text-primary font-semibold"> AI-powered intelligence</span>
              </p>
            </div>

            {/* Features */}
            <div className="space-y-6 mb-12">
              {features.map((feature, index) => (
                <div 
                  key={feature.label}
                  className="flex items-center gap-4 group"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="h-12 w-12 rounded-xl bg-card border border-border/50 flex items-center justify-center group-hover:border-primary/50 group-hover:shadow-glow transition-all duration-300">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-lg text-foreground/80 group-hover:text-foreground transition-colors">
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">50+</div>
                <div className="text-sm text-muted-foreground">Markets</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">24/7</div>
                <div className="text-sm text-muted-foreground">AI Analysis</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">99%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm">Enterprise Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-sm">Global Coverage</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-sm">Real-time Data</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Auth Form */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-12 bg-background">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                  <Brain className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Smart Business
                  </h1>
                  <h1 className="text-xl font-bold text-foreground">
                    Analyzer
                  </h1>
                </div>
              </div>
              <p className="text-muted-foreground">
                AI-powered business intelligence platform
              </p>
            </div>

            <Card className="shadow-card border-border/50 backdrop-blur-sm">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">
                  {isLogin ? 'Welcome Back' : 'Get Started'}
                </CardTitle>
                <CardDescription className="text-base">
                  {isLogin 
                    ? 'Sign in to access your analytics dashboard' 
                    : 'Create your account to start analyzing'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="h-11"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-medium shadow-glow bg-gradient-primary hover:opacity-90 transition-opacity" 
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {isLogin 
                      ? "Don't have an account? " 
                      : 'Already have an account? '}
                    <span className="font-medium text-primary">
                      {isLogin ? 'Sign up' : 'Sign in'}
                    </span>
                  </button>
                </div>

                {/* Divider with Trust Message */}
                <div className="mt-8 pt-6 border-t border-border/50">
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span>Secure</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span>Fast</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <span>Global</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-border/30 bg-card/50 backdrop-blur-sm">
        <div className="text-center text-sm text-muted-foreground">
          <span className="font-medium">Designed and Created by </span>
          <span className="text-primary font-semibold">Elhamy Sobhy</span>
          <span className="text-muted-foreground/60"> @ </span>
          <span className="bg-gradient-primary bg-clip-text text-transparent font-bold">Eagle_DevOps2</span>
        </div>
      </footer>
    </div>
  );
}