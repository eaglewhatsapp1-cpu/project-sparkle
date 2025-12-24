import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { Button } from './ui/button';
import { LogOut, Globe2 } from 'lucide-react';
export function Header() {
  const {
    t
  } = useLanguage();
  const {
    profile,
    signOut
  } = useAuth();
  return <header className="border-b bg-card shadow-card sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-primary items-center justify-center flex flex-row">
              <Globe2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold bg-gradient-primary bg-clip-text text-transparent text-4xl font-mono bg-transparent">
                {profile?.company_name || t('appName')}
              </h1>
              <p className="text-sm text-muted-foreground px-0 py-[14px]">{t('dashboard')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {profile?.display_name && <span className="text-sm hidden md:inline text-primary">
                {profile.display_name}
              </span>}
            <LanguageToggle />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>;
}