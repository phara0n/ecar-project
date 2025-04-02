import polyglotI18nProvider from 'ra-i18n-polyglot';
import englishMessages from 'ra-language-english';
import frenchMessages from 'ra-language-french';

// Dynamic message loading to fix 500 error
const getMessages = async (locale: string) => {
  switch (locale) {
    case 'fr':
      return import('./fr').then(module => module.default);
    default:
      return import('./en').then(module => module.default);
  }
};

const i18nProvider = polyglotI18nProvider(
  locale => {
    // Use a sync fallback for initial load
    if (locale === 'fr') return frenchMessages;
    return englishMessages;
  },
  'en',
  {
    allowMissing: true,
    warnOnMissing: process.env.NODE_ENV === 'development',
  }
);

export default i18nProvider; 