import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ar';

const translations = {
  en: {
    appName: 'Market Analyzer',
    dashboard: 'Dashboard',
    overview: 'Market Overview',
    overviewText: 'Comprehensive analysis of your target markets',
    quickSummary: 'AI Quick Summary',
    generateSummary: 'Generate Summary',
    suggestedQuestions: 'Suggested Questions',
    generate: 'Generate',
    aiAdvisor: 'AI Advisor',
    aiWelcome: 'Hello! I\'m your AI research assistant. Ask me anything about your markets or upload documents for analysis.',
    askQuestion: 'Ask a question...',
    enhancePrompt: 'Enhance prompt',
    export: 'Export',
    textFile: 'Text File',
    exportedAs: 'Exported as',
    exportFailed: 'Export failed',
    year: 'Year',
    financialForecast: 'Financial Forecast',
    fundingDetails: 'Funding Allocation',
    knowledgeBase: 'Knowledge Base',
    knowledgeBaseDescription: 'Upload documents to enhance AI analysis',
    dragDropFiles: 'Click or drag files to upload',
    fileUploaded: 'File uploaded successfully',
    uploadFailed: 'Upload failed',
    fileDeleted: 'File deleted',
    deleteFailed: 'Delete failed',
    invalidFileType: 'Invalid file type',
    fileTooLarge: 'File too large (max 20MB)',
    noDocuments: 'No documents uploaded yet',
    settings: 'Settings',
    settingsDescription: 'Customize your experience',
    displayName: 'Display Name',
    yourName: 'Your name',
    companyName: 'Company Name',
    yourCompany: 'Your company',
    customAIInstructions: 'Custom AI Instructions',
    customPromptPlaceholder: 'Add custom instructions for the AI...',
    customPromptHint: 'These instructions will be included in every AI interaction',
    saveSettings: 'Save Settings',
    settingsSaved: 'Settings saved',
    saveFailed: 'Save failed',
    enhancedPrompt: 'Enhanced Prompt',
    apply: 'Apply',
    cancel: 'Cancel',
    promptEnhanced: 'Prompt enhanced',
    enhanceFailed: 'Enhancement failed',
    enterPromptFirst: 'Enter a prompt first',
    noQuestionsGenerated: 'No questions generated',
    questionsFailed: 'Failed to generate questions',
    chatFailed: 'Chat failed',
    noCountries: 'No market data yet. Upload documents to get started.',
    login: 'Login',
    signup: 'Sign Up',
    email: 'Email',
    password: 'Password',
    loginFailed: 'Login failed',
    signupFailed: 'Signup failed',
    logout: 'Logout',
    viewDetails: 'View Details',
  },
  ar: {
    appName: 'محلل السوق',
    dashboard: 'لوحة التحكم',
    overview: 'نظرة عامة على السوق',
    overviewText: 'تحليل شامل للأسواق المستهدفة',
    quickSummary: 'ملخص AI سريع',
    generateSummary: 'إنشاء ملخص',
    suggestedQuestions: 'أسئلة مقترحة',
    generate: 'إنشاء',
    aiAdvisor: 'مستشار AI',
    aiWelcome: 'مرحباً! أنا مساعدك البحثي AI. اسألني أي شيء عن أسواقك أو ارفع مستندات للتحليل.',
    askQuestion: 'اطرح سؤالاً...',
    enhancePrompt: 'تحسين السؤال',
    export: 'تصدير',
    textFile: 'ملف نصي',
    exportedAs: 'تم التصدير كـ',
    exportFailed: 'فشل التصدير',
    year: 'السنة',
    financialForecast: 'التوقعات المالية',
    fundingDetails: 'توزيع التمويل',
    knowledgeBase: 'قاعدة المعرفة',
    knowledgeBaseDescription: 'ارفع مستندات لتحسين تحليل AI',
    dragDropFiles: 'انقر أو اسحب ملفات للرفع',
    fileUploaded: 'تم رفع الملف بنجاح',
    uploadFailed: 'فشل الرفع',
    fileDeleted: 'تم حذف الملف',
    deleteFailed: 'فشل الحذف',
    invalidFileType: 'نوع ملف غير صالح',
    fileTooLarge: 'الملف كبير جداً (الحد الأقصى 20 ميجا)',
    noDocuments: 'لم يتم رفع مستندات بعد',
    settings: 'الإعدادات',
    settingsDescription: 'تخصيص تجربتك',
    displayName: 'اسم العرض',
    yourName: 'اسمك',
    companyName: 'اسم الشركة',
    yourCompany: 'شركتك',
    customAIInstructions: 'تعليمات AI مخصصة',
    customPromptPlaceholder: 'أضف تعليمات مخصصة لـ AI...',
    customPromptHint: 'سيتم تضمين هذه التعليمات في كل تفاعل مع AI',
    saveSettings: 'حفظ الإعدادات',
    settingsSaved: 'تم حفظ الإعدادات',
    saveFailed: 'فشل الحفظ',
    enhancedPrompt: 'سؤال محسّن',
    apply: 'تطبيق',
    cancel: 'إلغاء',
    promptEnhanced: 'تم تحسين السؤال',
    enhanceFailed: 'فشل التحسين',
    enterPromptFirst: 'أدخل سؤالاً أولاً',
    noQuestionsGenerated: 'لم يتم إنشاء أسئلة',
    questionsFailed: 'فشل إنشاء الأسئلة',
    chatFailed: 'فشل المحادثة',
    noCountries: 'لا توجد بيانات سوق بعد. ارفع مستندات للبدء.',
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    loginFailed: 'فشل تسجيل الدخول',
    signupFailed: 'فشل إنشاء الحساب',
    logout: 'تسجيل الخروج',
    viewDetails: 'عرض التفاصيل',
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
