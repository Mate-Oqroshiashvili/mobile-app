import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { T } from './translations';

type Language = 'ka' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: keyof typeof T.en) => string; // თარგმნის ფუნქცია
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('ka'); // ნაგულისხმევი ენა

  // აპლიკაციის ჩართვისას ვამოწმებთ შენახულ ენას
  useEffect(() => {
    AsyncStorage.getItem('app_lang').then(saved => {
      if (saved === 'en' || saved === 'ka') setLangState(saved);
    });
  }, []);

  // ენის შეცვლა და შენახვა
  const setLang = async (newLang: Language) => {
    setLangState(newLang);
    await AsyncStorage.setItem('app_lang', newLang);
  };

  // ტექსტის მთარგმნელი ფუნქცია
  const t = (key: keyof typeof T.en) => {
    return T[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// მარტივი Hook-ი ნებისმიერი გვერდიდან გამოსაძახებლად
export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};