import React, { createContext, useReducer, useContext } from 'react';

const AppContext = createContext();

const initialState = {
  currency: 'USD',
  viewCurrency: 'USD', // Currency for display/viewing
  supportedCurrencies: ['USD', 'EUR', 'GBP', 'NGN', 'ZAR', 'KES', 'GHS', 'UGX', 'EGP', 'MAD', 'TZS'],
  exchangeRates: {
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    NGN: 1500,
    ZAR: 18,
    KES: 140,
    GHS: 12,
    UGX: 3720,
    EGP: 31,
    MAD: 10,
    TZS: 2300,
  },
  notifications: [],
  theme: 'light',
  currencyPreferences: {
    showBothCurrencies: false,
    autoConvert: true,
    hideZeroAmounts: false
  }
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_CURRENCY':
      return {
        ...state,
        currency: action.payload,
      };
    case 'SET_VIEW_CURRENCY':
      return {
        ...state,
        viewCurrency: action.payload,
      };
    case 'TOGGLE_CURRENCY_VIEW':
      // Toggle between USD and local currency
      const newViewCurrency = state.viewCurrency === 'USD' ? state.currency : 'USD';
      return {
        ...state,
        viewCurrency: newViewCurrency,
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload,
      };
    case 'UPDATE_EXCHANGE_RATES':
      return {
        ...state,
        exchangeRates: {
          ...state.exchangeRates,
          ...action.payload,
        },
      };
    case 'UPDATE_CURRENCY_PREFERENCES':
      return {
        ...state,
        currencyPreferences: {
          ...state.currencyPreferences,
          ...action.payload,
        },
      };
    default:
      return state;
  }
}

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setCurrency = (currency) => {
    dispatch({ type: 'SET_CURRENCY', payload: currency });
  };

  const setViewCurrency = (currency) => {
    dispatch({ type: 'SET_VIEW_CURRENCY', payload: currency });
  };

  const toggleCurrencyView = () => {
    dispatch({ type: 'TOGGLE_CURRENCY_VIEW' });
  };

  const updateCurrencyPreferences = (preferences) => {
    dispatch({ type: 'UPDATE_CURRENCY_PREFERENCES', payload: preferences });
  };

  const addNotification = (notification) => {
    const notificationWithId = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_NOTIFICATION', payload: notificationWithId });
  };

  const removeNotification = (id) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    const fromRate = state.exchangeRates[fromCurrency] || 1;
    const toRate = state.exchangeRates[toCurrency] || 1;
    return (amount / fromRate) * toRate;
  };

  const formatCurrency = (amount, currency = state.currency, options = {}) => {
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      NGN: '₦',
      ZAR: 'R',
      KES: 'KSh',
      GHS: '₵',
      UGX: 'USh',
      EGP: 'E£',
      MAD: 'د.م.',
      TZS: 'TSh',
    };
    
    const { showSymbol = true, precision = 2 } = options;
    const formattedAmount = amount.toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
    
    if (showSymbol) {
      return `${symbols[currency] || ''}${formattedAmount}`;
    }
    return formattedAmount;
  };

  const formatCurrencyWithToggle = (amount, originalCurrency) => {
    const displayCurrency = state.viewCurrency;
    if (originalCurrency === displayCurrency) {
      return formatCurrency(amount, displayCurrency);
    }
    
    const convertedAmount = convertCurrency(amount, originalCurrency, displayCurrency);
    return formatCurrency(convertedAmount, displayCurrency);
  };

  const value = {
    ...state,
    setCurrency,
    setViewCurrency,
    toggleCurrencyView,
    updateCurrencyPreferences,
    addNotification,
    removeNotification,
    convertCurrency,
    formatCurrency,
    formatCurrencyWithToggle,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};