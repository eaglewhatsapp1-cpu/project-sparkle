export interface FinancialRow {
  indicator: { en: string; ar: string };
  year1: number;
  year2: number;
  year3: number;
  year4: number;
  year5: number;
}

export const financialData: FinancialRow[] = [
  {
    indicator: { en: 'Revenue', ar: 'الإيرادات' },
    year1: 1.2,
    year2: 3.5,
    year3: 7.8,
    year4: 12.5,
    year5: 18.2,
  },
  {
    indicator: { en: 'Gross Profit', ar: 'إجمالي الربح' },
    year1: 0.36,
    year2: 1.05,
    year3: 2.34,
    year4: 3.75,
    year5: 5.46,
  },
  {
    indicator: { en: 'Operating Expenses', ar: 'المصروفات التشغيلية' },
    year1: 0.8,
    year2: 1.4,
    year3: 2.0,
    year4: 2.5,
    year5: 3.0,
  },
  {
    indicator: { en: 'EBITDA', ar: 'الأرباح قبل الفوائد والضرائب' },
    year1: -0.44,
    year2: -0.35,
    year3: 0.34,
    year4: 1.25,
    year5: 2.46,
  },
  {
    indicator: { en: 'Net Profit', ar: 'صافي الربح' },
    year1: -0.52,
    year2: -0.48,
    year3: 0.18,
    year4: 0.95,
    year5: 2.05,
  },
];

export interface FundingItem {
  category: { en: string; ar: string };
  amount: string;
  description: { en: string; ar: string };
}

export const fundingAllocation: FundingItem[] = [
  {
    category: { en: 'Market Entry & Distribution', ar: 'دخول السوق والتوزيع' },
    amount: '$800K',
    description: {
      en: 'Establishing distribution centers, partnerships, and initial logistics',
      ar: 'إنشاء مراكز توزيع، شراكات، ولوجستيات أولية',
    },
  },
  {
    category: { en: 'Production Scale-up', ar: 'توسيع الإنتاج' },
    amount: '$600K',
    description: {
      en: 'Increasing production capacity to meet export demand',
      ar: 'زيادة القدرة الإنتاجية لتلبية طلب التصدير',
    },
  },
  {
    category: { en: 'Marketing & Brand Building', ar: 'التسويق وبناء العلامة التجارية' },
    amount: '$400K',
    description: {
      en: 'Brand awareness campaigns, trade shows, and promotional activities',
      ar: 'حملات توعية بالعلامة التجارية، معارض تجارية، وأنشطة ترويجية',
    },
  },
  {
    category: { en: 'Working Capital', ar: 'رأس المال العامل' },
    amount: '$500K',
    description: {
      en: 'Inventory management, receivables, and operational expenses',
      ar: 'إدارة المخزون، المستحقات، والمصروفات التشغيلية',
    },
  },
  {
    category: { en: 'Quality & Compliance', ar: 'الجودة والامتثال' },
    amount: '$200K',
    description: {
      en: 'Meeting international standards and certifications',
      ar: 'تلبية المعايير والشهادات الدولية',
    },
  },
];
