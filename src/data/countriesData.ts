export interface CountryData {
  id: string;
  name: { en: string; ar: string };
  kpi: string;
  volume: { en: string; ar: string };
  details: {
    strategy: { en: string; ar: string };
    opportunities: { en: string[]; ar: string[] };
    focused_qa: Array<{
      q: { en: string; ar: string };
      a: { en: string; ar: string };
    }>;
  };
}

export const countriesData: CountryData[] = [
  {
    id: 'kenya',
    name: { en: 'Kenya', ar: 'كينيا' },
    kpi: '85%',
    volume: { en: '120K units', ar: '120 ألف وحدة' },
    details: {
      strategy: {
        en: 'Focus on Mombasa Port as a regional logistics hub. Target taxi sector and heavy trucking services that require powerful batteries capable of withstanding high heat.',
        ar: 'التركيز على ميناء مومباسا كمركز لوجستي إقليمي. استهداف قطاع سيارات الأجرة (Taxis) وخدمات النقل الثقيل (Trucking) التي تتطلب بطاريات قوية تتحمل الحرارة العالية.',
      },
      opportunities: {
        en: [
          'Partnerships with major distributors in Nairobi',
          'Supply cross-border transport fleets in East Africa',
        ],
        ar: [
          'شراكات مع موزعين كبار في نيروبي',
          'إمداد أساطيل النقل بين الدول في شرق أفريقيا',
        ],
      },
      focused_qa: [
        {
          q: {
            en: 'What are the logistical challenges in reaching inland markets in Kenya?',
            ar: 'ما هي التحديات اللوجستية في الوصول إلى الأسواق الداخلية بكينيا؟',
          },
          a: {
            en: 'Challenges lie in road infrastructure outside major cities. We will rely on decentralized warehousing to reduce delivery time.',
            ar: 'تكمن التحديات في البنية التحتية الطرقية خارج المدن الرئيسية. سنعتمد على التخزين الموزع (Decentralized Warehousing) لتقليل زمن التسليم.',
          },
        },
        {
          q: {
            en: 'Are there customs barriers hindering exports from Egypt?',
            ar: 'هل هناك حواجز جمركية تعيق التصدير من مصر؟',
          },
          a: {
            en: 'Egypt and Kenya benefit from preferential trade agreements (COMESA), reducing tariffs and giving us a competitive advantage over Asian imports.',
            ar: 'تتمتع مصر وكينيا باتفاقيات تجارة تفضيلية (COMESA)، مما يخفف من الرسوم الجمركية ويمنحنا ميزة تنافسية على الواردات الآسيوية.',
          },
        },
      ],
    },
  },
  {
    id: 'nigeria',
    name: { en: 'Nigeria', ar: 'نيجيريا' },
    kpi: '70%',
    volume: { en: '150K units', ar: '150 ألف وحدة' },
    details: {
      strategy: {
        en: 'Target Lagos and Abuja. Focus on aftermarket and providing a more durable product to face power fluctuations and poor vehicle maintenance. We will appoint a local business development manager.',
        ar: 'استهداف لاغوس وأبوجا. التركيز على أسواق ما بعد البيع (Aftermarket) وتوفير منتج أكثر متانة لمواجهة التقلبات في التيار الكهربائي وتدني صيانة المركبات. سنقوم بتعيين مدير تطوير أعمال محلي.',
      },
      opportunities: {
        en: [
          'Partnership with small power generation companies (Generator sets)',
          'Leverage huge population for increased overall sales',
        ],
        ar: [
          'شراكة مع شركات توليد الطاقة الصغيرة (Generator sets)',
          'الاستفادة من الحجم السكاني الهائل لزيادة المبيعات الإجمالية',
        ],
      },
      focused_qa: [
        {
          q: {
            en: 'How do you deal with currency fluctuation risks (Naira)?',
            ar: 'كيف تتعاملون مع مخاطر تقلب العملة (النايرا)؟',
          },
          a: {
            en: 'We will adopt flexible pricing strategy with monthly reviews, and maintain minimum revenues in USD to ensure coverage of import costs and raw materials.',
            ar: 'سنعتمد استراتيجية تسعير مرنة مع مراجعات شهرية، والاحتفاظ بحد أدنى من الإيرادات بالدولار (USD) لضمان تغطية تكاليف الاستيراد والمواد الخام.',
          },
        },
        {
          q: {
            en: 'What are the regulatory risks related to import?',
            ar: 'ما هي المخاطر التنظيمية المتعلقة بالاستيراد؟',
          },
          a: {
            en: 'There is bureaucracy and non-tariff barriers. We will work with an experienced customs clearance agent to avoid delays and unexpected fines.',
            ar: 'هناك بيروقراطية وعوائق غير جمركية. سنعمل مع وكيل تخليص جمركي ذي خبرة واسعة لتجنب التأخير والغرامات غير المتوقعة.',
          },
        },
      ],
    },
  },
  {
    id: 'south_africa',
    name: { en: 'South Africa', ar: 'جنوب أفريقيا' },
    kpi: '90%',
    volume: { en: '80K units', ar: '80 ألف وحدة' },
    details: {
      strategy: {
        en: 'Highly competitive market requiring very high quality and European standards. We will target modern vehicles and battery replacement market through major retail chains in Johannesburg and Cape Town.',
        ar: 'سوق تنافسي للغاية ويتطلب جودة عالية جداً ومعايير أوروبية. سنستهدف المركبات الحديثة وسوق استبدال البطاريات (Battery Replacement Market) عبر سلاسل تجزئة كبرى في جوهانسبرغ وكيب تاون.',
      },
      opportunities: {
        en: [
          'Possibility of expanding into small solar power storage batteries',
          'Leverage European quality reputation achieved by our products',
        ],
        ar: [
          'إمكانية التوسع في بطاريات الطاقة الشمسية الصغيرة (Solar Power Storage)',
          'الاستفادة من سمعة الجودة الأوروبية التي تحققها منتجاتنا',
        ],
      },
      focused_qa: [
        {
          q: {
            en: 'How do you plan to compete against locally established brands?',
            ar: 'كيف تخططون للمنافسة ضد العلامات التجارية الراسخة محلياً؟',
          },
          a: {
            en: 'Our advantage is competitive pricing versus quality matching European specifications, plus long-term warranty to conquer customers looking for value for money.',
            ar: 'ميزتنا هي السعر التنافسي مقابل الجودة المطابقة للمواصفات الأوروبية، بالإضافة إلى ضمان طويل الأمد لغزو شريحة العملاء الذين يبحثون عن قيمة مقابل سعر.',
          },
        },
        {
          q: {
            en: 'Does load shedding affect sales?',
            ar: 'هل تؤثر مشاكل الطاقة (Load Shedding) على المبيعات؟',
          },
          a: {
            en: "It's actually an opportunity. We will exploit growing demand for backup batteries for alarm systems and simple home systems as a side product.",
            ar: 'بل إنها فرصة. سنستغل الطلب المتزايد على بطاريات الأمان (Backup Batteries) لأجهزة الإنذار والأنظمة المنزلية البسيطة كمنتج جانبي.',
          },
        },
      ],
    },
  },
  {
    id: 'angola',
    name: { en: 'Angola', ar: 'أنغولا' },
    kpi: '65%',
    volume: { en: '50K units', ar: '50 ألف وحدة' },
    details: {
      strategy: {
        en: 'Emerging market heavily dependent on imports. Focus on potential government partnerships (B2G) and mining sector that requires high-capacity batteries for heavy machinery.',
        ar: 'سوق ناشئ معتمد بشكل كبير على الواردات. التركيز على شراكات حكومية محتملة (B2G) وقطاع التعدين الذي يتطلب بطاريات ذات سعة عالية للآليات الثقيلة.',
      },
      opportunities: {
        en: [
          'Portuguese language facilitates communication and business',
          'Mining sector requires premium heavy-duty batteries',
        ],
        ar: [
          'اللغة البرتغالية تسهل التواصل والأعمال',
          'قطاع التعدين يتطلب بطاريات ثقيلة متميزة',
        ],
      },
      focused_qa: [
        {
          q: {
            en: 'What is the political and economic risk in Angola?',
            ar: 'ما هي المخاطر السياسية والاقتصادية في أنغولا؟',
          },
          a: {
            en: 'Angola is working on economic diversification away from oil. We will work through reputable local partners to mitigate regulatory risks.',
            ar: 'أنغولا تعمل على تنويع اقتصادي بعيداً عن النفط. سنعمل عبر شركاء محليين ذوي سمعة طيبة لتخفيف المخاطر التنظيمية.',
          },
        },
      ],
    },
  },
  {
    id: 'ethiopia',
    name: { en: 'Ethiopia', ar: 'إثيوبيا' },
    kpi: '75%',
    volume: { en: '70K units', ar: '70 ألف وحدة' },
    details: {
      strategy: {
        en: 'Fast-growing automotive sector. Target Addis Ababa and emerging manufacturing sector. Focus on local assembly partnerships.',
        ar: 'قطاع سيارات سريع النمو. استهداف أديس أبابا والقطاع التصنيعي الناشئ. التركيز على شراكات التجميع المحلي.',
      },
      opportunities: {
        en: [
          'Government incentives for local manufacturing',
          'Growing middle class with increasing vehicle ownership',
        ],
        ar: [
          'حوافز حكومية للتصنيع المحلي',
          'نمو الطبقة المتوسطة وزيادة ملكية المركبات',
        ],
      },
      focused_qa: [
        {
          q: {
            en: 'How stable is the Ethiopian market?',
            ar: 'ما مدى استقرار السوق الإثيوبي؟',
          },
          a: {
            en: 'Ethiopia is experiencing rapid growth and industrial development. We will establish strong local partnerships to navigate the market effectively.',
            ar: 'إثيوبيا تشهد نمواً سريعاً وتطوراً صناعياً. سنقيم شراكات محلية قوية للتنقل في السوق بفعالية.',
          },
        },
      ],
    },
  },
  {
    id: 'ghana',
    name: { en: 'Ghana', ar: 'غانا' },
    kpi: '80%',
    volume: { en: '90K units', ar: '90 ألف وحدة' },
    details: {
      strategy: {
        en: 'Stable market with English-speaking advantage. Target Accra and Kumasi. Focus on commercial fleet operators and public transport.',
        ar: 'سوق مستقر مع ميزة التحدث بالإنجليزية. استهداف أكرا وكوماسي. التركيز على مشغلي الأساطيل التجارية والنقل العام.',
      },
      opportunities: {
        en: [
          'English-speaking market reduces operational complexity',
          'Strong commercial transport sector',
        ],
        ar: [
          'السوق الناطق بالإنجليزية يقلل من التعقيد التشغيلي',
          'قطاع نقل تجاري قوي',
        ],
      },
      focused_qa: [
        {
          q: {
            en: 'What makes Ghana attractive for battery exports?',
            ar: 'ما الذي يجعل غانا جذابة لتصدير البطاريات؟',
          },
          a: {
            en: 'Political stability, English language, and growing automotive sector make Ghana an ideal market for our expansion strategy.',
            ar: 'الاستقرار السياسي واللغة الإنجليزية وقطاع السيارات المتنامي يجعل غانا سوقاً مثالياً لاستراتيجية التوسع لدينا.',
          },
        },
      ],
    },
  },
];
