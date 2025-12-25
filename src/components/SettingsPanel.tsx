import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Sparkles, Wand2, FolderCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SettingsPanelProps {
  projectId?: string | null;
  projectName?: string;
}

export function SettingsPanel({ projectId, projectName }: SettingsPanelProps) {
  const { t, language } = useLanguage();
  const { profile, user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [projectInstructions, setProjectInstructions] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [showEnhancePopover, setShowEnhancePopover] = useState(false);
  const [enhanceTarget, setEnhanceTarget] = useState<'user' | 'project'>('user');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setCompanyName(profile.company_name || '');
      setSystemPrompt(profile.system_prompt || '');
    }
  }, [profile]);

  // Load project-specific instructions
  useEffect(() => {
    const loadProjectInstructions = async () => {
      if (!projectId) {
        setProjectInstructions('');
        return;
      }
      
      const { data, error } = await supabase
        .from('projects')
        .select('ai_instructions')
        .eq('id', projectId)
        .maybeSingle();
      
      if (!error && data) {
        setProjectInstructions(data.ai_instructions || '');
      }
    };
    
    loadProjectInstructions();
  }, [projectId]);

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Save user profile settings
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          company_name: companyName,
          system_prompt: systemPrompt,
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Save project-specific instructions if project is selected
      if (projectId) {
        const { error: projectError } = await supabase
          .from('projects')
          .update({ ai_instructions: projectInstructions || null })
          .eq('id', projectId);

        if (projectError) throw projectError;
      }

      await refreshProfile();
      toast.success(t('settingsSaved'));
    } catch (error: any) {
      toast.error(error.message || t('saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const enhancePrompt = async (target: 'user' | 'project') => {
    const promptToEnhance = target === 'user' ? systemPrompt : projectInstructions;
    
    if (!promptToEnhance.trim()) {
      toast.error(t('enterPromptFirst'));
      return;
    }

    setIsEnhancing(true);
    setEnhanceTarget(target);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: [{ 
            role: 'user', 
            content: `You are an expert at crafting effective AI system prompts. Enhance this ${target === 'project' ? 'project-specific' : 'user-level'} prompt to be more comprehensive, clear, and effective while keeping the core intent:

Original prompt: "${promptToEnhance}"

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
        : promptToEnhance;
      
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
    if (enhanceTarget === 'user') {
      setSystemPrompt(enhancedPrompt);
    } else {
      setProjectInstructions(enhancedPrompt);
    }
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

        {/* AI Instructions Tabs */}
        <Tabs defaultValue="user" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="user" className="gap-2">
              <Settings className="h-4 w-4" />
              {language === 'ar' ? 'التعليمات العامة' : 'User Instructions'}
            </TabsTrigger>
            <TabsTrigger value="project" className="gap-2" disabled={!projectId}>
              <FolderCog className="h-4 w-4" />
              {language === 'ar' ? 'تعليمات المشروع' : 'Project Instructions'}
            </TabsTrigger>
          </TabsList>

          {/* User-Level Instructions */}
          <TabsContent value="user" className="space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="systemPrompt">{t('customAIInstructions')}</Label>
              <Popover open={showEnhancePopover && enhanceTarget === 'user'} onOpenChange={(open) => {
                if (!open) setShowEnhancePopover(false);
              }}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => enhancePrompt('user')}
                    disabled={isEnhancing || !systemPrompt.trim()}
                  >
                    {isEnhancing && enhanceTarget === 'user' ? (
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
              {t('customPromptHint')}
            </p>
          </TabsContent>

          {/* Project-Level Instructions */}
          <TabsContent value="project" className="space-y-2 mt-4">
            {projectId ? (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="projectInstructions">
                    {language === 'ar' ? 'تعليمات المشروع' : 'Project AI Instructions'}
                    {projectName && (
                      <span className="ml-2 text-xs text-primary">({projectName})</span>
                    )}
                  </Label>
                  <Popover open={showEnhancePopover && enhanceTarget === 'project'} onOpenChange={(open) => {
                    if (!open) setShowEnhancePopover(false);
                  }}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => enhancePrompt('project')}
                        disabled={isEnhancing || !projectInstructions.trim()}
                      >
                        {isEnhancing && enhanceTarget === 'project' ? (
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
                  id="projectInstructions"
                  value={projectInstructions}
                  onChange={(e) => setProjectInstructions(e.target.value)}
                  placeholder={language === 'ar' 
                    ? 'أدخل تعليمات مخصصة لهذا المشروع. هذه التعليمات ستتجاوز التعليمات العامة...'
                    : 'Enter custom instructions for this project. These will override user-level instructions...'}
                  rows={8}
                  className="resize-none font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' 
                    ? 'تعليمات المشروع لها الأولوية على التعليمات العامة وتطبق فقط على هذا المشروع.'
                    : 'Project instructions take priority over user-level instructions and apply only to this project.'}
                </p>
              </>
            ) : (
              <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
                <FolderCog className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>
                  {language === 'ar' 
                    ? 'اختر مشروعًا لتخصيص تعليمات الذكاء الاصطناعي الخاصة به'
                    : 'Select a project to customize its AI instructions'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

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