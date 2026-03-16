import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('hayyak_lang') || 'en';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', lang);
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('hayyak_lang', lang);
  }, [lang]);

  const toggleLang = () => setLang(l => l === 'en' ? 'ar' : 'en');

  const t = (key) => translations[lang]?.[key] ?? translations.en[key] ?? key;

  return (
    <LangContext.Provider value={{ lang, toggleLang, t, isRtl: lang === 'ar' }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
