import { useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Loader2, Brain, BarChart3, TrendingUp, Zap, Shield, 
  Users, ArrowRight, Eye, EyeOff, Mail, Lock, Sparkles
} from 'lucide-react';
import FloatingChart3D from '@/components/auth/FloatingChart3D';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
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
    { 
      icon: Shield, 
      title: 'Enterprise Security', 
      description: 'Bank-grade encryption protecting your data with advanced security layers.'
    },
    { 
      icon: Zap, 
      title: 'Lightning Fast', 
      description: 'Optimized performance ensuring zero latency operations across all devices.'
    },
    { 
      icon: BarChart3, 
      title: 'Advanced Analytics', 
      description: 'AI-powered insights that transform raw data into actionable strategies.'
    },
  ];

  const stats = [
    { value: '50K+', label: 'Active Users' },
    { value: '99.9%', label: 'Uptime' },
    { value: 'SOC2', label: 'Certified' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(250,30%,8%)]">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Panel - Branding */}
        <div className="relative lg:w-[55%] xl:w-[60%] overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,80%,25%)] via-[hsl(280,70%,15%)] to-[hsl(250,30%,8%)]" />
          
          {/* Animated gradient orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-[hsl(262,80%,50%)] rounded-full blur-[150px] opacity-30 animate-pulse" />
            <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-[hsl(330,70%,50%)] rounded-full blur-[150px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute -bottom-1/4 left-1/3 w-[400px] h-[400px] bg-[hsl(200,90%,50%)] rounded-full blur-[150px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
          </div>
          
          {/* Grid overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />

          {/* Content Container */}
          <div className="relative z-10 flex flex-col h-full px-8 lg:px-12 xl:px-20 py-8 lg:py-12">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-auto">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(262,80%,60%)] to-[hsl(330,70%,55%)] shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white/90 tracking-wide">
                NEXT GEN PLATFORM
              </span>
            </div>

            {/* Main Content - Center */}
            <div className="flex-1 flex flex-col justify-center py-12 lg:py-16">
              {/* Hero Text */}
              <div className="mb-10 lg:mb-14">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] mb-6">
                  Experience the
                  <br />
                  <span className="bg-gradient-to-r from-[hsl(262,80%,70%)] via-[hsl(330,70%,65%)] to-[hsl(200,90%,60%)] bg-clip-text text-transparent">
                    Future of Analytics
                  </span>
                </h1>
                <p className="text-lg lg:text-xl text-white/60 max-w-lg leading-relaxed">
                  Access a powerful suite of AI tools designed to elevate your business decisions with stunning intelligence.
                </p>
              </div>

              {/* 3D Model */}
              <div className="hidden lg:block w-full h-[280px] xl:h-[320px] mb-10">
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-[hsl(262,80%,60%)] border-t-transparent rounded-full animate-spin" />
                  </div>
                }>
                  <FloatingChart3D />
                </Suspense>
              </div>

              {/* Feature Cards */}
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div 
                    key={feature.title}
                    className="group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:translate-x-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(168,85,247,0.05) 100%)',
                      border: '1px solid rgba(168,85,247,0.2)',
                      backdropFilter: 'blur(10px)',
                      animationDelay: `${index * 150}ms`
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(262,80%,60%)] to-[hsl(330,70%,55%)] flex items-center justify-center shadow-lg group-hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-shadow">
                        <feature.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                        <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Row - Bottom */}
            <div className="mt-auto pt-8 border-t border-white/10">
              <div className="flex items-center justify-start gap-12">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[rgba(168,85,247,0.15)] flex items-center justify-center">
                      {stat.label === 'Active Users' && <Users className="w-5 h-5 text-[hsl(262,80%,70%)]" />}
                      {stat.label === 'Uptime' && <TrendingUp className="w-5 h-5 text-[hsl(262,80%,70%)]" />}
                      {stat.label === 'Certified' && <Shield className="w-5 h-5 text-[hsl(262,80%,70%)]" />}
                    </div>
                    <div>
                      <div className="text-xl font-bold text-white">{stat.value}</div>
                      <div className="text-xs text-white/40">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Auth Form */}
        <div className="lg:w-[45%] xl:w-[40%] flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-[hsl(250,25%,6%)]">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-10">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(262,80%,60%)] to-[hsl(330,70%,55%)] flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white">Smart Business Analyzer</h1>
              <p className="text-white/50 text-sm mt-2">AI-powered business intelligence</p>
            </div>

            {/* Auth Card */}
            <div 
              className="rounded-3xl p-8 lg:p-10"
              style={{
                background: 'linear-gradient(145deg, rgba(30,25,45,0.9) 0%, rgba(20,18,30,0.95) 100%)',
                border: '1px solid rgba(168,85,247,0.15)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(168,85,247,0.1)'
              }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {isLogin ? 'Welcome Back' : 'Get Started'}
                </h2>
                <p className="text-white/50">
                  {isLogin 
                    ? 'Enter your details to access your workspace' 
                    : 'Create your account to start analyzing'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-white/70 uppercase tracking-wider">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      className="h-14 pl-12 pr-4 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[hsl(262,80%,60%)] focus:ring-2 focus:ring-[hsl(262,80%,60%)]/20 transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm text-white/70 uppercase tracking-wider">
                      Password
                    </Label>
                    {isLogin && (
                      <button type="button" className="text-sm text-[hsl(262,80%,70%)] hover:text-[hsl(262,80%,80%)] transition-colors">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="h-14 pl-12 pr-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[hsl(262,80%,60%)] focus:ring-2 focus:ring-[hsl(262,80%,60%)]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                {isLogin && (
                  <div className="flex items-center gap-3">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      className="border-white/20 data-[state=checked]:bg-[hsl(262,80%,60%)] data-[state=checked]:border-[hsl(262,80%,60%)]"
                    />
                    <Label htmlFor="remember" className="text-sm text-white/50 cursor-pointer">
                      Remember me for 30 days
                    </Label>
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-[hsl(262,80%,60%)] to-[hsl(330,70%,55%)] hover:from-[hsl(262,80%,65%)] hover:to-[hsl(330,70%,60%)] text-white shadow-lg hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all duration-300" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[hsl(250,25%,10%)] px-4 text-sm text-white/30">
                    Protected by enterprise-grade encryption
                  </span>
                </div>
              </div>

              {/* Toggle Auth Mode */}
              <div className="text-center">
                <p className="text-white/50">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-[hsl(262,80%,70%)] hover:text-[hsl(262,80%,80%)] font-semibold transition-colors"
                  >
                    {isLogin ? 'Create Account' : 'Sign In'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-5 px-6 border-t border-white/5 bg-[hsl(250,25%,5%)]">
        <div className="text-center text-sm text-white/40">
          <span className="font-medium">Designed and Created by </span>
          <span className="text-[hsl(262,80%,70%)] font-semibold">Elhamy Sobhy</span>
          <span className="text-white/20"> @ </span>
          <span className="bg-gradient-to-r from-[hsl(262,80%,70%)] to-[hsl(330,70%,65%)] bg-clip-text text-transparent font-bold">
            Eagle_DevOps2
          </span>
        </div>
      </footer>
    </div>
  );
}
