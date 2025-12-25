import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function SettingsPanel() {
  const { t, language } = useLanguage();
  const { profile, user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [showEnhancePopover, setShowEnhancePopover] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setCompanyName(profile.company_name || '');
      setSystemPrompt(profile.system_prompt || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          company_name: companyName,
          system_prompt: systemPrompt,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      await refreshProfile();
      toast.success(t('settingsSaved'));
    } catch (error: any) {
      toast.error(error.message || t('saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const enhancePrompt = async () => {
    if (!systemPrompt.trim()) {
      toast.error(t('enterPromptFirst'));
      return;
    }

    setIsEnhancing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: [{ 
            role: 'user', 
            content: `You are an expert at crafting effective AI system prompts. Enhance this global AI instruction prompt to be more comprehensive, clear, and effective while keeping the core intent:

Original prompt: "${systemPrompt}"

Create an enhanced version that:
1. Is more specific and actionable
2. Includes clear guidelines for the AI
3. Defines the tone and style expected
4. Adds any missing context that would help
5. Keeps the user's original intent

Return ONLY the enhanced prompt, no explanations or meta-commentary.`
          }],
          type: 'enhance'
        }
      });

      if (error) throw error;

      const enhanced = typeof data.response === 'string' 
        ? data.response.replace(/^["']|["']$/g, '').trim()
        : systemPrompt;
      
      setEnhancedPrompt(enhanced);
      setShowEnhancePopover(true);
    } catch (error: any) {
      console.error('Enhance error:', error);
      toast.error(error.message || t('enhanceFailed'));
    } finally {
      setIsEnhancing(false);
    }
  };

  const applyEnhancement = () => {
    setSystemPrompt(enhancedPrompt);
    setShowEnhancePopover(false);
    setEnhancedPrompt('');
    toast.success(t('promptEnhanced'));
  };

  return (
    <Card className="border-primary/20 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          {t('settings')}
        </CardTitle>
        <CardDescription>{t('settingsDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Settings */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="displayName">{t('displayName')}</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('yourName')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">{t('companyName')}</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={t('yourCompany')}
            />
          </div>
        </div>

        {/* Global AI Instructions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="systemPrompt">{t('customAIInstructions')}</Label>
            <Popover open={showEnhancePopover} onOpenChange={setShowEnhancePopover}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={enhancePrompt}
                  disabled={isEnhancing || !systemPrompt.trim()}
                >
                  {isEnhancing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {t('enhancePrompt')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-4" align="end">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Wand2 className="h-4 w-4 text-primary" />
                    {t('enhancedPrompt')}
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-sm max-h-60 overflow-y-auto whitespace-pre-wrap">
                    {enhancedPrompt}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowEnhancePopover(false)}
                      className="flex-1"
                    >
                      {t('cancel')}
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={applyEnhancement}
                      className="flex-1"
                    >
                      {t('apply')}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Textarea
            id="systemPrompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder={t('customPromptPlaceholder')}
            rows={8}
            className="resize-none font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {language === 'ar' 
              ? 'هذه التعليمات عامة وتطبق على جميع محادثات الذكاء الاصطناعي في جميع المشاريع.'
              : 'These instructions are global and apply to all AI conversations across all projects.'}
          </p>
        </div>

        <Button onClick={handleSave} disabled={isLoading} className="shadow-glow">
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {t('saveSettings')}
        </Button>
      </CardContent>
    </Card>
  );
}