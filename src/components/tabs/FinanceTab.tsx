import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { financialData, fundingAllocation } from '@/data/financialData';
import { useLanguage } from '@/contexts/LanguageContext';
import { DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function FinanceTab() {
  const { t, language } = useLanguage();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const chartData = [1, 2, 3, 4, 5].map((year) => {
    const yearData: any = { year: `${t('year')} ${year}` };
    financialData.forEach((row) => {
      yearData[row.indicator.en] = row[`year${year}` as keyof typeof row];
    });
    return yearData;
  });

  const metricColors: Record<string, string> = {
    Revenue: 'hsl(var(--primary))',
    'Gross Profit': 'hsl(var(--success))',
    'Operating Expenses': 'hsl(var(--warning))',
    EBITDA: 'hsl(var(--info))',
    'Net Profit': 'hsl(var(--accent))',
  };

  const visibleMetrics = selectedMetric
    ? [selectedMetric]
    : financialData.map((row) => row.indicator.en);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="shadow-card border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              {t('financialForecast')} - {language === 'ar' ? 'رسم بياني تفاعلي' : 'Interactive Chart'}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'خطي' : 'Line'}
              </Button>
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('bar')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'عمودي' : 'Bar'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={selectedMetric === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric(null)}
            >
              {language === 'ar' ? 'الكل' : 'All Metrics'}
            </Button>
            {financialData.map((row) => (
              <Button
                key={row.indicator.en}
                variant={selectedMetric === row.indicator.en ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedMetric(row.indicator.en)}
              >
                {row.indicator[language]}
              </Button>
            ))}
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    label={{
                      value: language === 'ar' ? 'مليون دولار' : 'Million $',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: 'hsl(var(--muted-foreground))' },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                    }}
                    formatter={(value: number) => [`$${value}M`, '']}
                  />
                  <Legend />
                  {visibleMetrics.map((metric) => (
                    <Line
                      key={metric}
                      type="monotone"
                      dataKey={metric}
                      stroke={metricColors[metric]}
                      strokeWidth={2}
                      dot={{ fill: metricColors[metric], r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    label={{
                      value: language === 'ar' ? 'مليون دولار' : 'Million $',
                      angle: -90,
                      position: 'insideLeft',
                      style: { fill: 'hsl(var(--muted-foreground))' },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))',
                    }}
                    formatter={(value: number) => [`$${value}M`, '']}
                  />
                  <Legend />
                  {visibleMetrics.map((metric) => (
                    <Bar key={metric} dataKey={metric} fill={metricColors[metric]} />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-2xl">
            {language === 'ar' ? 'البيانات التفصيلية' : 'Detailed Data'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">
                    {language === 'ar' ? 'المؤشر' : 'Indicator'}
                  </th>
                  {[1, 2, 3, 4, 5].map((year) => (
                    <th key={year} className="text-left py-3 px-4 font-semibold text-muted-foreground">
                      {t('year')} {year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {financialData.map((row, idx) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{row.indicator[language]}</td>
                    <td className={`py-3 px-4 ${row.year1 < 0 ? 'text-destructive' : 'text-green-500'}`}>
                      ${row.year1}M
                    </td>
                    <td className={`py-3 px-4 ${row.year2 < 0 ? 'text-destructive' : 'text-green-500'}`}>
                      ${row.year2}M
                    </td>
                    <td className={`py-3 px-4 ${row.year3 < 0 ? 'text-destructive' : 'text-green-500'}`}>
                      ${row.year3}M
                    </td>
                    <td className={`py-3 px-4 ${row.year4 < 0 ? 'text-destructive' : 'text-green-500'}`}>
                      ${row.year4}M
                    </td>
                    <td className={`py-3 px-4 ${row.year5 < 0 ? 'text-destructive' : 'text-green-500'}`}>
                      ${row.year5}M
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            {t('fundingDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fundingAllocation.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors bg-gradient-hero"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{item.category[language]}</h3>
                  <Badge variant="secondary" className="text-lg font-bold">
                    {item.amount}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.description[language]}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
