import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { Button } from './ui/button';
import { LogOut, Layers, Briefcase, Sparkles } from 'lucide-react';

interface HeaderProps {
  workspaceName?: string;
  projectName?: string;
}

export function Header({ workspaceName, projectName }: HeaderProps) {
  const { t } = useLanguage();
  const { profile, signOut } = useAuth();

  return (
    <header className="border-b bg-card shadow-card sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: App Branding */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Sparkles className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-accent flex items-center justify-center">
                <span className="text-[10px] font-bold text-accent-foreground">AI</span>
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="font-bold text-xl md:text-2xl bg-gradient-primary bg-clip-text text-transparent tracking-tight">
                {t('appName')}
              </h1>
              <p className="text-xs text-muted-foreground">{t('dashboard')}</p>
            </div>
          </div>

          {/* Center: Workspace & Project Display */}
          {(workspaceName || projectName) && (
            <div className="hidden lg:flex items-center gap-3 px-6 py-2 rounded-2xl bg-muted/50 border border-border/50">
              {workspaceName && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Workspace</span>
                    <span className="text-sm font-semibold text-foreground">{workspaceName}</span>
                  </div>
                </div>
              )}
              {workspaceName && projectName && (
                <div className="h-8 w-px bg-border/50" />
              )}
              {projectName && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-accent/20">
                    <Briefcase className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">Project</span>
                    <span className="text-sm font-semibold text-foreground">{projectName}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right: User Actions */}
          <div className="flex items-center gap-2">
            {profile?.display_name && (
              <span className="text-sm hidden md:inline text-primary font-medium">
                {profile.display_name}
              </span>
            )}
            <LanguageToggle />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={signOut} className="hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile: Workspace & Project Display */}
        {(workspaceName || projectName) && (
          <div className="lg:hidden mt-3 flex items-center gap-2 text-sm">
            {workspaceName && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-primary">{workspaceName}</span>
              </div>
            )}
            {projectName && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                <Briefcase className="h-3.5 w-3.5 text-accent" />
                <span className="font-medium text-accent">{projectName}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
