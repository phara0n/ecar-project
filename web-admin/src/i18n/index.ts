import polyglotI18nProvider from 'ra-i18n-polyglot';
import englishMessages from 'ra-language-english';
import frenchMessages from 'ra-language-french';

// Import our custom messages
import customEnglishMessages from './en';
import customFrenchMessages from './fr';

// Get the user's preferred language from localStorage or use browser language
const getInitialLocale = (): string => {
  // Try to get from localStorage first
  const savedLocale = localStorage.getItem('preferredLanguage');
  if (savedLocale && ['en', 'fr'].includes(savedLocale)) {
    console.log('Using saved language preference:', savedLocale);
    return savedLocale;
  }
  
  // Use browser language if possible
  const browserLocale = navigator.language.split('-')[0];
  if (browserLocale === 'fr') {
    console.log('Using browser language:', browserLocale);
    localStorage.setItem('preferredLanguage', browserLocale);
    return 'fr';
  }
  
  // Default to English
  console.log('Using default language: en');
  localStorage.setItem('preferredLanguage', 'en');
  return 'en';
};

// Merge default translations with our custom ones
const mergedMessages = {
  en: { ...englishMessages, ...customEnglishMessages },
  fr: { ...frenchMessages, ...customFrenchMessages },
};

// Initial locale to use
const initialLocale = getInitialLocale();
console.log('Initial locale set to:', initialLocale);

// Create the i18n provider with the merged messages
const i18nProvider = polyglotI18nProvider(
  locale => {
    // Ensure we're using a supported locale
    const safeLocale = ['en', 'fr'].includes(locale) ? locale : 'en';
    console.log('Setting locale to:', safeLocale);
    return mergedMessages[safeLocale as keyof typeof mergedMessages];
  },
  initialLocale,
  {
    allowMissing: true,
    warnOnMissing: process.env.NODE_ENV === 'development',
  }
);

export default i18nProvider; 