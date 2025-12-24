import { useState } from 'react';
import { Bot, Zap, Users, CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  icon: string;
  color: string;
}

const agents: Agent[] = [
  {
    id: 'analyst',
    name: { en: 'Market Analyst', ar: 'محلل السوق' },
    description: { en: 'Deep market research and competitor analysis', ar: 'أبحاث السوق المعمقة وتحليل المنافسين' },
    icon: '📊',
    color: 'text-blue-500',
  },
  {
    id: 'strategist',
    name: { en: 'Strategy Expert', ar: 'خبير الاستراتيجية' },
    description: { en: 'Business strategy and expansion planning', ar: 'استراتيجية الأعمال وتخطيط التوسع' },
    icon: '🎯',
    color: 'text-purple-500',
  },
  {
    id: 'financial',
    name: { en: 'Financial Advisor', ar: 'مستشار مالي' },
    description: { en: 'Financial projections and investment analysis', ar: 'التوقعات المالية وتحليل الاستثمار' },
    icon: '💰',
    color: 'text-green-500',
  },
  {
    id: 'risk',
    name: { en: 'Risk Assessor', ar: 'مقيم المخاطر' },
    description: { en: 'Risk identification and mitigation strategies', ar: 'تحديد المخاطر واستراتيجيات التخفيف' },
    icon: '⚠️',
    color: 'text-amber-500',
  },
];

interface AgentSelectorProps {
  selectedAgent: string | null;
  onSelectAgent: (agentId: string | null) => void;
  autoWorkflow: boolean;
  onToggleAutoWorkflow: () => void;
}

export function AgentSelector({ 
  selectedAgent, 
  onSelectAgent, 
  autoWorkflow, 
  onToggleAutoWorkflow 
}: AgentSelectorProps) {
  const { language } = useLanguage();

  return (
    <Card className="border-primary/20 shadow-card">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            {language === 'ar' ? 'وكلاء الذكاء الاصطناعي' : 'AI Agents'}
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch 
                id="auto-workflow" 
                checked={autoWorkflow} 
                onCheckedChange={onToggleAutoWorkflow}
              />
              <Label htmlFor="auto-workflow" className="text-sm cursor-pointer">
                {language === 'ar' ? 'سير عمل تلقائي' : 'Auto Workflow'}
              </Label>
            </div>
            {selectedAgent && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onSelectAgent(null)}
              >
                {language === 'ar' ? 'إلغاء التحديد' : 'Clear'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => onSelectAgent(selectedAgent === agent.id ? null : agent.id)}
              className={cn(
                "p-3 rounded-lg border text-left transition-all",
                selectedAgent === agent.id 
                  ? "border-primary bg-primary/10" 
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{agent.icon}</span>
                <span className={cn("text-sm font-medium", agent.color)}>
                  {agent.name[language]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {agent.description[language]}
              </p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface WorkflowStep {
  agentId: string;
  status: 'pending' | 'active' | 'completed';
  output?: string;
}

interface WorkflowDisplayProps {
  workflow: {
    steps: WorkflowStep[];
    currentStep: number;
  };
}

export function WorkflowDisplay({ workflow }: WorkflowDisplayProps) {
  const { language } = useLanguage();
  
  const getAgentById = (id: string) => agents.find(a => a.id === id);

  return (
    <Card className="border-accent/30 bg-accent/5">
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="h-4 w-4 text-accent animate-pulse" />
          {language === 'ar' ? 'سير العمل النشط' : 'Active Workflow'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {workflow.steps.map((step, idx) => {
            const agent = getAgentById(step.agentId);
            if (!agent) return null;
            
            return (
              <div key={idx} className="flex items-center">
                <div className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border whitespace-nowrap",
                  step.status === 'completed' && "border-green-500 bg-green-500/10",
                  step.status === 'active' && "border-primary bg-primary/10 animate-pulse",
                  step.status === 'pending' && "border-border bg-muted/50"
                )}>
                  {step.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {step.status === 'active' && <Circle className="h-4 w-4 text-primary animate-spin" />}
                  {step.status === 'pending' && <Circle className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-lg">{agent.icon}</span>
                  <span className="text-sm font-medium">{agent.name[language]}</span>
                </div>
                {idx < workflow.steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
