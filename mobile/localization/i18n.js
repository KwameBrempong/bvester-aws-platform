// Multi-language Internationalization for Bvester
// Supports 10+ languages with RTL support and dynamic loading

import * as Localization from 'expo-localization';
import i18n from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Translation files
const translations = {
  en: {
    // English
    common: {
      welcome: 'Welcome to Bvester',
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Retry',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      share: 'Share',
      close: 'Close',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      refresh: 'Pull to refresh',
      noData: 'No data available',
      offline: 'You are offline',
      online: 'Back online',
      syncing: 'Syncing...',
      syncComplete: 'Sync complete',
    },
    auth: {
      login: 'Login',
      signup: 'Sign Up',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password',
      biometricAuth: 'Use Biometric Authentication',
      faceId: 'Use Face ID',
      touchId: 'Use Touch ID',
      authFailed: 'Authentication failed',
      invalidCredentials: 'Invalid email or password',
      accountCreated: 'Account created successfully',
      verifyEmail: 'Please verify your email',
    },
    dashboard: {
      title: 'Dashboard',
      portfolio: 'Portfolio',
      totalValue: 'Total Portfolio Value',
      dayChange: '24h Change',
      totalReturn: 'Total Return',
      investments: 'Investments',
      watchlist: 'Watchlist',
      recentActivity: 'Recent Activity',
      marketOverview: 'Market Overview',
      quickActions: 'Quick Actions',
      invest: 'Invest',
      withdraw: 'Withdraw',
      transfer: 'Transfer',
    },
    investment: {
      aiAdvisor: 'AI Investment Advisor',
      recommendations: 'Recommendations',
      riskProfile: 'Risk Profile',
      conservative: 'Conservative',
      moderate: 'Moderate',
      aggressive: 'Aggressive',
      expectedReturn: 'Expected Return',
      minimumInvestment: 'Minimum Investment',
      investNow: 'Invest Now',
      learnMore: 'Learn More',
      performance: 'Performance',
      allocation: 'Asset Allocation',
      rebalance: 'Rebalance Portfolio',
      autoInvest: 'Auto-Invest',
      stopLoss: 'Stop Loss',
      takeProfit: 'Take Profit',
    },
    market: {
      title: 'Markets',
      stocks: 'Stocks',
      bonds: 'Bonds',
      crypto: 'Cryptocurrency',
      commodities: 'Commodities',
      indices: 'Indices',
      trending: 'Trending',
      gainers: 'Top Gainers',
      losers: 'Top Losers',
      volume: 'Most Active',
      news: 'Market News',
      analysis: 'Analysis',
      sentiment: 'Market Sentiment',
      bullish: 'Bullish',
      bearish: 'Bearish',
      neutral: 'Neutral',
    },
    social: {
      feed: 'Activity Feed',
      following: 'Following',
      followers: 'Followers',
      posts: 'Posts',
      likes: 'Likes',
      comments: 'Comments',
      share: 'Share',
      groups: 'Investment Groups',
      discussions: 'Discussions',
      mentors: 'Find Mentors',
      achievements: 'Achievements',
      leaderboard: 'Leaderboard',
      invite: 'Invite Friends',
      referralCode: 'Referral Code',
      rewards: 'Rewards',
    },
    notifications: {
      title: 'Notifications',
      all: 'All',
      unread: 'Unread',
      markAsRead: 'Mark as read',
      clear: 'Clear all',
      priceAlert: 'Price Alert',
      tradeExecuted: 'Trade Executed',
      newsAlert: 'Breaking News',
      socialActivity: 'Social Activity',
      systemUpdate: 'System Update',
      settings: 'Notification Settings',
      push: 'Push Notifications',
      email: 'Email Notifications',
      sms: 'SMS Notifications',
    },
    settings: {
      title: 'Settings',
      profile: 'Profile',
      account: 'Account',
      security: 'Security',
      privacy: 'Privacy',
      notifications: 'Notifications',
      language: 'Language',
      currency: 'Currency',
      theme: 'Theme',
      lightMode: 'Light',
      darkMode: 'Dark',
      autoMode: 'Auto',
      biometric: 'Biometric Lock',
      twoFactor: 'Two-Factor Authentication',
      changePassword: 'Change Password',
      exportData: 'Export Data',
      deleteAccount: 'Delete Account',
      about: 'About',
      help: 'Help & Support',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      version: 'Version',
    },
    errors: {
      networkError: 'Network error. Please check your connection.',
      serverError: 'Server error. Please try again later.',
      validationError: 'Please check your input.',
      authError: 'Authentication required.',
      permissionError: 'Permission denied.',
      notFound: 'Resource not found.',
      timeout: 'Request timeout.',
      unknown: 'An unknown error occurred.',
    },
  },
  es: {
    // Spanish
    common: {
      welcome: 'Bienvenido a Bvester',
      loading: 'Cargando...',
      error: 'Ocurrió un error',
      retry: 'Reintentar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      share: 'Compartir',
      close: 'Cerrar',
      search: 'Buscar',
      filter: 'Filtrar',
      sort: 'Ordenar',
      refresh: 'Desliza para actualizar',
      noData: 'No hay datos disponibles',
      offline: 'Estás sin conexión',
      online: 'Conectado nuevamente',
      syncing: 'Sincronizando...',
      syncComplete: 'Sincronización completa',
    },
    dashboard: {
      title: 'Panel de Control',
      portfolio: 'Cartera',
      totalValue: 'Valor Total de la Cartera',
      dayChange: 'Cambio 24h',
      totalReturn: 'Retorno Total',
      investments: 'Inversiones',
      watchlist: 'Lista de Seguimiento',
      recentActivity: 'Actividad Reciente',
      marketOverview: 'Resumen del Mercado',
      quickActions: 'Acciones Rápidas',
      invest: 'Invertir',
      withdraw: 'Retirar',
      transfer: 'Transferir',
    },
  },
  fr: {
    // French
    common: {
      welcome: 'Bienvenue à Bvester',
      loading: 'Chargement...',
      error: 'Une erreur est survenue',
      retry: 'Réessayer',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      save: 'Enregistrer',
      delete: 'Supprimer',
      edit: 'Modifier',
      share: 'Partager',
      close: 'Fermer',
      search: 'Rechercher',
      filter: 'Filtrer',
      sort: 'Trier',
      refresh: 'Glisser pour actualiser',
      noData: 'Aucune donnée disponible',
      offline: 'Vous êtes hors ligne',
      online: 'De retour en ligne',
      syncing: 'Synchronisation...',
      syncComplete: 'Synchronisation terminée',
    },
  },
  de: {
    // German
    common: {
      welcome: 'Willkommen bei Bvester',
      loading: 'Wird geladen...',
      error: 'Ein Fehler ist aufgetreten',
      retry: 'Wiederholen',
      cancel: 'Abbrechen',
      confirm: 'Bestätigen',
      save: 'Speichern',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      share: 'Teilen',
      close: 'Schließen',
      search: 'Suchen',
      filter: 'Filtern',
      sort: 'Sortieren',
    },
  },
  zh: {
    // Chinese (Simplified)
    common: {
      welcome: '欢迎来到 Bvester',
      loading: '加载中...',
      error: '发生错误',
      retry: '重试',
      cancel: '取消',
      confirm: '确认',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      share: '分享',
      close: '关闭',
      search: '搜索',
      filter: '筛选',
      sort: '排序',
    },
    dashboard: {
      title: '仪表板',
      portfolio: '投资组合',
      totalValue: '投资组合总价值',
      dayChange: '24小时变化',
      totalReturn: '总回报',
      investments: '投资',
    },
  },
  ar: {
    // Arabic (RTL)
    common: {
      welcome: 'مرحباً بك في Bvester',
      loading: 'جاري التحميل...',
      error: 'حدث خطأ',
      retry: 'إعادة المحاولة',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      save: 'حفظ',
      delete: 'حذف',
      edit: 'تعديل',
      share: 'مشاركة',
      close: 'إغلاق',
      search: 'بحث',
    },
  },
  pt: {
    // Portuguese
    common: {
      welcome: 'Bem-vindo ao Bvester',
      loading: 'Carregando...',
      error: 'Ocorreu um erro',
      retry: 'Tentar novamente',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      save: 'Salvar',
      delete: 'Excluir',
      edit: 'Editar',
      share: 'Compartilhar',
    },
  },
  ru: {
    // Russian
    common: {
      welcome: 'Добро пожаловать в Bvester',
      loading: 'Загрузка...',
      error: 'Произошла ошибка',
      retry: 'Повторить',
      cancel: 'Отмена',
      confirm: 'Подтвердить',
      save: 'Сохранить',
      delete: 'Удалить',
      edit: 'Редактировать',
      share: 'Поделиться',
    },
  },
  ja: {
    // Japanese
    common: {
      welcome: 'Bvesterへようこそ',
      loading: '読み込み中...',
      error: 'エラーが発生しました',
      retry: '再試行',
      cancel: 'キャンセル',
      confirm: '確認',
      save: '保存',
      delete: '削除',
      edit: '編集',
      share: '共有',
    },
  },
  hi: {
    // Hindi
    common: {
      welcome: 'Bvester में आपका स्वागत है',
      loading: 'लोड हो रहा है...',
      error: 'एक त्रुटि हुई',
      retry: 'पुन: प्रयास करें',
      cancel: 'रद्द करें',
      confirm: 'पुष्टि करें',
      save: 'सहेजें',
      delete: 'हटाएं',
      edit: 'संपादित करें',
      share: 'साझा करें',
    },
  },
  sw: {
    // Swahili
    common: {
      welcome: 'Karibu Bvester',
      loading: 'Inapakia...',
      error: 'Kosa limetokea',
      retry: 'Jaribu tena',
      cancel: 'Ghairi',
      confirm: 'Thibitisha',
      save: 'Hifadhi',
      delete: 'Futa',
      edit: 'Hariri',
      share: 'Shiriki',
    },
  },
};

// RTL languages
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

class I18nManager {
  constructor() {
    this.currentLocale = Localization.locale;
    this.isRTL = false;
    this.init();
  }

  init() {
    // Set fallback
    i18n.fallbacks = true;
    i18n.translations = translations;
    
    // Set initial locale
    this.setLocale(this.currentLocale);
    
    // Load saved language preference
    this.loadSavedLanguage();
  }

  async loadSavedLanguage() {
    try {
      const savedLang = await AsyncStorage.getItem('@language');
      if (savedLang) {
        this.setLocale(savedLang);
      }
    } catch (error) {
      console.error('Failed to load saved language:', error);
    }
  }

  setLocale(locale) {
    // Extract language code (e.g., 'en' from 'en-US')
    const langCode = locale.split('-')[0];
    
    // Check if translation exists
    if (translations[langCode]) {
      i18n.locale = langCode;
    } else {
      i18n.locale = 'en'; // Fallback to English
    }
    
    // Check if RTL
    this.isRTL = RTL_LANGUAGES.includes(langCode);
    
    // Save preference
    AsyncStorage.setItem('@language', langCode);
    
    this.currentLocale = langCode;
  }

  // Get translated text
  t(key, options = {}) {
    return i18n.t(key, options);
  }

  // Get current locale
  getLocale() {
    return this.currentLocale;
  }

  // Check if current language is RTL
  isRTLLanguage() {
    return this.isRTL;
  }

  // Get available languages
  getAvailableLanguages() {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
    ];
  }

  // Format currency based on locale
  formatCurrency(amount, currency = 'USD') {
    const formatter = new Intl.NumberFormat(this.currentLocale, {
      style: 'currency',
      currency: currency,
    });
    return formatter.format(amount);
  }

  // Format number based on locale
  formatNumber(number, options = {}) {
    const formatter = new Intl.NumberFormat(this.currentLocale, options);
    return formatter.format(number);
  }

  // Format date based on locale
  formatDate(date, options = {}) {
    const formatter = new Intl.DateTimeFormat(this.currentLocale, options);
    return formatter.format(date);
  }

  // Format relative time
  formatRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return this.t('common.daysAgo', { count: days });
    } else if (hours > 0) {
      return this.t('common.hoursAgo', { count: hours });
    } else if (minutes > 0) {
      return this.t('common.minutesAgo', { count: minutes });
    } else {
      return this.t('common.justNow');
    }
  }

  // Get text direction for styling
  getTextDirection() {
    return this.isRTL ? 'rtl' : 'ltr';
  }

  // Get flex direction for RTL support
  getFlexDirection(direction = 'row') {
    if (this.isRTL && direction === 'row') {
      return 'row-reverse';
    }
    return direction;
  }

  // Get alignment for RTL support
  getAlignment(alignment) {
    if (this.isRTL) {
      if (alignment === 'left') return 'right';
      if (alignment === 'right') return 'left';
    }
    return alignment;
  }

  // Translate error codes
  translateError(errorCode) {
    const errorKey = `errors.${errorCode}`;
    const translation = this.t(errorKey);
    
    // If no translation found, return a generic error message
    if (translation === errorKey) {
      return this.t('errors.unknown');
    }
    
    return translation;
  }

  // Load additional language pack dynamically
  async loadLanguagePack(langCode) {
    try {
      // In production, this would fetch from a CDN
      const response = await fetch(`https://cdn.bvester.com/lang/${langCode}.json`);
      if (response.ok) {
        const langPack = await response.json();
        translations[langCode] = langPack;
        i18n.translations = translations;
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to load language pack for ${langCode}:`, error);
      return false;
    }
  }

  // Get locale-specific configuration
  getLocaleConfig() {
    const configs = {
      en: {
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        firstDayOfWeek: 0, // Sunday
        decimalSeparator: '.',
        thousandsSeparator: ',',
      },
      es: {
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        firstDayOfWeek: 1, // Monday
        decimalSeparator: ',',
        thousandsSeparator: '.',
      },
      de: {
        dateFormat: 'DD.MM.YYYY',
        timeFormat: '24h',
        firstDayOfWeek: 1,
        decimalSeparator: ',',
        thousandsSeparator: '.',
      },
      zh: {
        dateFormat: 'YYYY/MM/DD',
        timeFormat: '24h',
        firstDayOfWeek: 1,
        decimalSeparator: '.',
        thousandsSeparator: ',',
      },
      ar: {
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        firstDayOfWeek: 6, // Saturday
        decimalSeparator: '.',
        thousandsSeparator: ',',
      },
    };

    return configs[this.currentLocale] || configs.en;
  }
}

// Export singleton instance
const i18nManager = new I18nManager();

// Export convenience functions
export const t = (key, options) => i18nManager.t(key, options);
export const setLocale = (locale) => i18nManager.setLocale(locale);
export const getLocale = () => i18nManager.getLocale();
export const isRTL = () => i18nManager.isRTLLanguage();
export const formatCurrency = (amount, currency) => i18nManager.formatCurrency(amount, currency);
export const formatNumber = (number, options) => i18nManager.formatNumber(number, options);
export const formatDate = (date, options) => i18nManager.formatDate(date, options);

export default i18nManager;