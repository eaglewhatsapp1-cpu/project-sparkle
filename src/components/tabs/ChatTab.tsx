import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Lightbulb, Loader2, Download, FileText, FileType, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { exportToText, exportToPDF, exportToWord, generateExportId } from '@/utils/exportUtils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AgentSelector, WorkflowDisplay } from '@/components/AgentSelector';
import { cn } from '@/lib/utils';

const transformLinkUri = (uri: string): string => {
  const allowedProtocols = ['http:', 'https:', 'mailto:'];
  try {
    if (!uri || uri.trim().length === 0) return '';
    const url = new URL(uri, window.location.href);
    if (!allowedProtocols.includes(url.protocol)) return '';
    return uri;
  } catch {
    return '';
  }
};

const ALLOWED_MARKDOWN_ELEMENTS = [
  'p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody',
  'tr', 'th', 'td', 'blockquote', 'hr',
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  logId?: string;
  agentId?: string;
  agentName?: string;
  workflow?: any;
}

interface ChatTabProps {
  workspaceId?: string | null;
  projectId?: string | null;
  projectName?: string;
}

export function ChatTab({ workspaceId, projectId, projectName }: ChatTabProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t('aiWelcome') },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [autoWorkflow, setAutoWorkflow] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Valid agent IDs that exist in the backend
  const validAgentIds = ['research', 'analyst', 'writer', 'strategist'];
  
  // Handler that validates agent selection
  const handleSelectAgent = (agentId: string | null) => {
    if (agentId === null || validAgentIds.includes(agentId)) {
      setSelectedAgent(agentId);
    } else {
      console.warn(`Invalid agent ID: ${agentId}, clearing selection`);
      setSelectedAgent(null);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const suggestQuestions = async () => {
    setIsLoadingQuestions(true);
    setSuggestedQuestions([]);
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [
            {
              role: 'user',
              content: 'Based on my uploaded documents and knowledge base, suggest 5 important analytical questions I should consider. Return as JSON array.',
            },
          ],
          type: 'questions',
          workspaceId,
          projectId,
        },
      });

      if (error) throw error;

      if (data.questions && Array.isArray(data.questions)) {
        // Handle both array of strings and array of objects with question property
        const questions = data.questions.slice(0, 5).map((q: any) => 
          typeof q === 'string' ? q : (q.question || q.text || String(q))
        );
        setSuggestedQuestions(questions);
        return;
      }

      const responseText = typeof data.response === 'string' ? data.response : '';

      try {
        const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed)) {
            setSuggestedQuestions(parsed.slice(0, 5));
            return;
          }
        }
      } catch {}

      const lines = responseText.split('\n');
      const questions = lines
        .filter((line: string) => /^\d+[\.\)]\s/.test(line.trim()) || /^[-*]\s/.test(line.trim()))
        .map((line: string) => line.replace(/^[\d\.\)\-*\s]+/, '').trim())
        .filter((q: string) => q.length > 10)
        .slice(0, 5);

      if (questions.length > 0) {
        setSuggestedQuestions(questions);
      } else {
        toast.info(t('noQuestionsGenerated'));
      }
    } catch (error: any) {
      console.error('Questions error:', error);
      toast.error(error.message || t('questionsFailed'));
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const enhancePrompt = async () => {
    if (!input.trim()) {
      toast.error(t('enterPromptFirst'));
      return;
    }
    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [
            {
              role: 'user',
              content: `Enhance this question to be more specific and comprehensive: "${input}"\n\nReturn ONLY the enhanced question, nothing else.`,
            },
          ],
          type: 'enhance',
        },
      });

      if (error) throw error;

      const enhanced = typeof data.response === 'string'
        ? data.response.replace(/^["']|["']$/g, '').trim()
        : input;
      setInput(enhanced);
      toast.success(t('promptEnhanced'));
    } catch (error: any) {
      console.error('Enhance error:', error);
      toast.error(error.message || t('enhanceFailed'));
    } finally {
      setIsEnhancing(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentWorkflow(null);

    try {
      let responseData: any;

      if (selectedAgent || autoWorkflow) {
        const { data, error } = await supabase.functions.invoke('multi-agent', {
          body: {
            action: autoWorkflow ? 'workflow' : 'chat',
            agentId: selectedAgent,
            message: text,
            workspaceId,
            projectId,
            autoWorkflow,
          },
        });

        if (error) throw error;
        responseData = data;

        if (data.workflow) {
          setCurrentWorkflow(data.workflow);
        }
      } else {
        const { data, error } = await supabase.functions.invoke('ai-chat', {
          body: {
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            type: 'chat',
            workspaceId,
            projectId,
          },
        });

        if (error) throw error;
        responseData = data;
      }

      const logId = generateExportId();
      const responseText = typeof responseData.response === 'string'
        ? responseData.response
        : JSON.stringify(responseData.response);

      const assistantMessage: Message = {
        role: 'assistant',
        content: responseText,
        logId,
        agentId: responseData.agentId,
        agentName: responseData.agentName,
        workflow: responseData.workflow,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      await supabase.from('chat_logs').insert({
        message: text,
        response: responseText,
        country_code: selectedAgent || 'general',
        user_id: user?.id || null,
        workspace_id: workspaceId || null,
        project_id: projectId || null,
      });
    } catch (error: any) {
      console.error('Chat error:', error);
      toast.error(error.message || t('chatFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (message: Message, format: 'text' | 'pdf' | 'word') => {
    if (!message.logId) return;
    const userMsgIndex = messages.findIndex((m) => m === message) - 1;
    const question = userMsgIndex >= 0 ? messages[userMsgIndex].content : 'General inquiry';
    const exportData = {
      question,
      response: message.content,
      timestamp: new Date(),
      id: message.logId,
      projectName: projectName || 'Analysis',
    };
    try {
      if (format === 'text') exportToText(exportData);
      else if (format === 'pdf') exportToPDF(exportData);
      else if (format === 'word') exportToWord(exportData);
      toast.success(`${t('exportedAs')} ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('exportFailed'));
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      <AgentSelector
        selectedAgent={selectedAgent}
        onSelectAgent={handleSelectAgent}
        autoWorkflow={autoWorkflow}
        onToggleAutoWorkflow={() => setAutoWorkflow(!autoWorkflow)}
      />

      {currentWorkflow && <WorkflowDisplay workflow={currentWorkflow} />}

      <Card className="border-primary/20 shadow-card">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-4 w-4 text-primary" />
              {t('suggestedQuestions')}
            </CardTitle>
            <Button onClick={suggestQuestions} disabled={isLoadingQuestions} variant="secondary" size="sm" className="gap-2">
              {isLoadingQuestions ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
              {t('generate')}
            </Button>
          </div>
        </CardHeader>
        {suggestedQuestions.length > 0 && (
          <CardContent className="pt-0">
            <div className="grid gap-2 sm:grid-cols-2">
              {suggestedQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(question)}
                  className="text-left p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-sm"
                >
                  {question}
                </button>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="flex-1 flex flex-col shadow-card min-h-0 overflow-hidden">
        <CardHeader className="py-3 border-b border-border/30 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-base">
            {selectedAgent ? (
              <>
                <Zap className="h-4 w-4 text-accent" />
                {language === 'ar' ? 'محادثة مع الوكيل' : 'Agent Chat'}
              </>
            ) : autoWorkflow ? (
              <>
                <Zap className="h-4 w-4 text-primary animate-pulse" />
                {language === 'ar' ? 'سير العمل التلقائي' : 'Auto Workflow'}
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 text-primary" />
                {t('aiAdvisor')}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4 h-full" ref={scrollRef} style={{ maxHeight: 'calc(100% - 80px)' }}>
            <div className="space-y-4">
              {messages.map((message, idx) => (
                <div key={idx} className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {message.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 space-y-2 max-w-[85%]">
                    <div className={`p-4 rounded-lg ${message.role === 'assistant' ? 'bg-muted' : 'bg-primary/10 border border-primary/20'}`}>
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            allowedElements={ALLOWED_MARKDOWN_ELEMENTS}
                            unwrapDisallowed={true}
                            urlTransform={transformLinkUri}
                            className="text-base"
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                      )}
                    </div>
                    {message.role === 'assistant' && message.logId && (
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 h-7">
                              <Download className="h-3 w-3" />
                              {t('export')}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExport(message, 'text')}>
                              <FileText className="h-4 w-4 mr-2" />
                              {t('textFile')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport(message, 'pdf')}>
                              <FileType className="h-4 w-4 mr-2" />
                              PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport(message, 'word')}>
                              <FileType className="h-4 w-4 mr-2" />
                              Word
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex-1 p-3 rounded-lg bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t flex-shrink-0 bg-background">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder={t('askQuestion')}
                  disabled={isLoading}
                  className="pr-10"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={enhancePrompt}
                        disabled={isEnhancing || !input.trim() || isLoading}
                      >
                        {isEnhancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('enhancePrompt')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} size="icon" className="shadow-glow">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
