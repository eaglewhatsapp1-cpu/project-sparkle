import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CountryCard } from '@/components/CountryCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { CountryData } from '@/data/countriesData';

interface SummaryTabProps {
  onViewCountry: (country: CountryData) => void;
}

export function SummaryTab({ onViewCountry }: SummaryTabProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: countries = [] } = useQuery({
    queryKey: ['countries', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map((country) => ({
        id: country.code,
        name: {
          en: country.name_en,
          ar: country.name_ar || country.name_en,
        },
        kpi: country.kpi || '0%',
        volume: {
          en: country.volume_en || '',
          ar: country.volume_ar || '',
        },
        details: {
          strategy: {
            en: country.strategy_en || '',
            ar: country.strategy_ar || '',
          },
          opportunities: {
            en: country.opportunities_en || [],
            ar: country.opportunities_ar || [],
          },
          focused_qa: country.qa_data || [],
        },
      })) as CountryData[];
    },
    enabled: !!user,
  });

  const generateSummary = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [
            {
              role: 'user',
              content: 'Generate an executive summary based on my uploaded documents and knowledge base',
            },
          ],
          type: 'summary',
        },
      });

      if (error) throw error;

      let responseText = '';
      if (typeof data.response === 'string') {
        responseText = data.response;
      } else if (Array.isArray(data.response)) {
        responseText = data.response.map((block: any) => block.content || '').join('\n');
      }
      setSummary(responseText);
    } catch (error: any) {
      console.error('Summary error:', error);
      toast.error(error.message || 'Failed to generate summary');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-primary/20 shadow-card">
        <CardHeader>
          <CardTitle className="text-2xl">{t('overview')}</CardTitle>
          <CardDescription className="text-base">{t('overviewText')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-hero rounded-lg border border-primary/20">
            <h3 className="text-lg font-semibold">{t('quickSummary')}</h3>
            <Button onClick={generateSummary} disabled={isLoading} className="gap-2 shadow-glow">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {t('generateSummary')}
            </Button>
          </div>

          {summary && (
            <Alert className="border-primary/30 bg-card animate-in slide-in-from-top duration-300">
              <AlertDescription className="text-sm whitespace-pre-line leading-relaxed">
                {summary}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {countries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {countries.map((country) => (
            <CountryCard key={country.id} country={country} onViewDetails={onViewCountry} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t('noCountries')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
