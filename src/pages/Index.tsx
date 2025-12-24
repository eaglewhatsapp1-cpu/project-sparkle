import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { WorkspaceSelector } from '@/components/WorkspaceSelector';
import { SummaryTab } from '@/components/tabs/SummaryTab';
import { ChatTab } from '@/components/tabs/ChatTab';
import { FinanceTab } from '@/components/tabs/FinanceTab';
import { KnowledgeBaseTab } from '@/components/tabs/KnowledgeBaseTab';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, MessageSquare, TrendingUp, Database, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CountryData } from '@/data/countriesData';

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  workspace_id: string | null;
  created_at: string;
}

const Index = () => {
  const { t, language } = useLanguage();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Workspace & Project Selector */}
        <div className="mb-6">
          <WorkspaceSelector
            selectedWorkspace={selectedWorkspace}
            selectedProject={selectedProject}
            onWorkspaceChange={setSelectedWorkspace}
            onProjectChange={setSelectedProject}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('overview')}</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">{t('knowledgeBase')}</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t('aiAdvisor')}</span>
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">{t('financialForecast')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-0">
            <SummaryTab onViewCountry={setSelectedCountry} />
          </TabsContent>

          <TabsContent value="knowledge" className="mt-0">
            <KnowledgeBaseTab
              workspaceId={selectedWorkspace?.id}
              projectId={selectedProject?.id}
            />
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <ChatTab
              workspaceId={selectedWorkspace?.id}
              projectId={selectedProject?.id}
              projectName={selectedProject?.name}
            />
          </TabsContent>

          <TabsContent value="finance" className="mt-0">
            <FinanceTab />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!selectedCountry} onOpenChange={() => setSelectedCountry(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedCountry && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedCountry.name[language]}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="font-semibold mb-2">Strategy</h4>
                  <p className="text-muted-foreground">{selectedCountry.details.strategy[language]}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Opportunities</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {selectedCountry.details.opportunities[language].map((opp, idx) => (
                      <li key={idx}>{opp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
