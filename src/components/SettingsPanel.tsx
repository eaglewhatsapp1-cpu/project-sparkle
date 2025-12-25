import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, Sparkles, Wand2, Globe, FolderOpen } from 'lucide-react';
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
  projectId?: string;
  projectName?: string;
}

export function SettingsPanel({ projectId, projectName }: SettingsPanelProps) {
  const { t, language } = useLanguage();
  const { profile, user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [activeTab, setActiveTab] = useState<'global' | 'project'>('global');
  
  // Global settings
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [globalPrompt, setGlobalPrompt] = useState('');
  
  // Project-specific settings
  const [projectInstructions, setProjectInstructions] = useState('');
  
  // Enhancement state
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [showEnhancePopover, setShowEnhancePopover] = useState(false);
  const [enhanceTarget, setEnhanceTarget] = useState<'global' | 'project'>('global');

  // Load global profile settings
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setCompanyName(profile.company_name || '');
      setGlobalPrompt(profile.system_prompt || '');
    }
  }, [profile]);

  // Load project-specific instructions dynamically
  useEffect(() => {
    const loadProjectInstructions = async () => {
      if (!projectId || !user) {
        setProjectInstructions('');
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('ai_instructions')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setProjectInstructions(data.ai_instructions || '');
      }
    };

    loadProjectInstructions();
  }, [projectId, user]);

  // Auto-switch to project tab when a project is selected
  useEffect(() => {
    if (projectId && projectName) {
      setActiveTab('project');
    }
  }, [projectId, projectName]);

  const handleSaveGlobal = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          company_name: companyName,
          system_prompt: globalPrompt,
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

  const handleSaveProject = async () => {
    if (!user || !projectId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ ai_instructions: projectInstructions })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(t('settingsSaved'));
    } catch (error: any) {
      toast.error(error.message || t('saveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const enhancePrompt = async (target: 'global' | 'project') => {
    const promptToEnhance = target === 'global' ? globalPrompt : projectInstructions;
    
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
            content: `You are an expert at crafting effective AI system prompts. Enhance this ${target === 'global' ? 'global AI instruction' : 'project-specific'} prompt to be more comprehensive, clear, and effective while keeping the core intent:

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
    if (enhanceTarget === 'global') {
      setGlobalPrompt(enhancedPrompt);
    } else {
      setProjectInstructions(enhancedPrompt);
    }
    setShowEnhancePopover(false);
    setEnhancedPrompt('');
    toast.success(t('promptEnhanced'));
  };

  const renderEnhanceButton = (target: 'global' | 'project') => {
    const currentPrompt = target === 'global' ? globalPrompt : projectInstructions;
    
    return (
      <Popover open={showEnhancePopover && enhanceTarget === target} onOpenChange={setShowEnhancePopover}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => enhancePrompt(target)}
            disabled={isEnhancing || !currentPrompt.trim()}
          >
            {isEnhancing && enhanceTarget === target ? (
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
    );
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
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'global' | 'project')}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="global" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {language === 'ar' ? 'إعدادات عامة' : 'Global Settings'}
            </TabsTrigger>
            <TabsTrigger 
              value="project" 
              className="flex items-center gap-2"
              disabled={!projectId}
            >
              <FolderOpen className="h-4 w-4" />
              {projectName || (language === 'ar' ? 'المشروع' : 'Project')}
            </TabsTrigger>
          </TabsList>

          {/* Global Settings Tab */}
          <TabsContent value="global" className="space-y-4">
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
                <Label htmlFor="globalPrompt">{t('customAIInstructions')}</Label>
                {renderEnhanceButton('global')}
              </div>
              <Textarea
                id="globalPrompt"
                value={globalPrompt}
                onChange={(e) => setGlobalPrompt(e.target.value)}
                placeholder={t('customPromptPlaceholder')}
                rows={6}
                className="resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {language === 'ar' 
                  ? 'هذه التعليمات عامة وتطبق على جميع محادثات الذكاء الاصطناعي في جميع المشاريع.'
                  : 'These global instructions apply to all AI conversations across all projects.'}
              </p>
            </div>

            <Button onClick={handleSaveGlobal} disabled={isLoading} className="shadow-glow">
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t('saveSettings')}
            </Button>
          </TabsContent>

          {/* Project Settings Tab */}
          <TabsContent value="project" className="space-y-4">
            {projectId ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="projectInstructions">
                      {language === 'ar' ? 'تعليمات خاصة بالمشروع' : 'Project-Specific Instructions'}
                    </Label>
                    {renderEnhanceButton('project')}
                  </div>
                  <Textarea
                    id="projectInstructions"
                    value={projectInstructions}
                    onChange={(e) => setProjectInstructions(e.target.value)}
                    placeholder={language === 'ar' 
                      ? 'أضف تعليمات مخصصة لهذا المشروع...'
                      : 'Add custom instructions for this project...'}
                    rows={8}
                    className="resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' 
                      ? 'هذه التعليمات تطبق فقط على هذا المشروع وتضاف إلى التعليمات العامة.'
                      : 'These instructions apply only to this project and are combined with global instructions.'}
                  </p>
                </div>

                <Button onClick={handleSaveProject} disabled={isLoading} className="shadow-glow">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('saveSettings')}
                </Button>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{language === 'ar' ? 'اختر مشروعاً لتخصيص إعداداته' : 'Select a project to customize its settings'}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
