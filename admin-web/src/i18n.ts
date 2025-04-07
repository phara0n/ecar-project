import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend'; // To load translations via http
import LanguageDetector from 'i18next-browser-languagedetector'; // To detect user language

i18n
  // Use i18next-http-backend to load translation files from public/locales
  .use(HttpApi)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // Initialize i18next
  .init({
    supportedLngs: ['en', 'fr'], // Supported languages
    fallbackLng: 'en', // Fallback language if detection fails or translation missing
    debug: process.env.NODE_ENV === 'development', // Enable debug output in development

    // Options for language detection
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'], // Where to cache detected language
    },

    // Options for react-i18next
    react: {
      useSuspense: true, // Recommended: use React Suspense for loading translations
    },

    // Options for i18next-http-backend
    backend: {
      loadPath: '/locales/{{lng}}/translation.json', // Path to translation files
    },
  });

export default i18n; 