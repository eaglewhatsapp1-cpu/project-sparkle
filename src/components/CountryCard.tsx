import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, TrendingUp, Eye } from 'lucide-react';
import type { CountryData } from '@/data/countriesData';

interface CountryCardProps {
  country: CountryData;
  onViewDetails: (country: CountryData) => void;
}

export function CountryCard({ country, onViewDetails }: CountryCardProps) {
  const { t, language } = useLanguage();

  return (
    <Card className="border-primary/20 shadow-card hover:shadow-lg transition-all duration-300 hover:border-primary/40 group">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            {country.name[language]}
          </CardTitle>
          <Badge 
            variant="secondary" 
            className="bg-primary/10 text-primary font-bold"
          >
            {country.kpi}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          <span>{country.volume[language]}</span>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2">
          {country.details.strategy[language]}
        </p>
        
        <div className="flex flex-wrap gap-1">
          {country.details.opportunities[language].slice(0, 2).map((opp, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {opp.length > 30 ? `${opp.slice(0, 30)}...` : opp}
            </Badge>
          ))}
        </div>
        
        <Button 
          onClick={() => onViewDetails(country)}
          variant="outline"
          size="sm"
          className="w-full mt-2 gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
        >
          <Eye className="h-4 w-4" />
          {t('viewDetails')}
        </Button>
      </CardContent>
    </Card>
  );
}
