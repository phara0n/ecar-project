import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const currentLanguage = i18n.language;

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex items-center space-x-1">
      <Button
        variant={currentLanguage === 'en' ? "secondary" : "ghost"}
        size="sm"
        onClick={() => changeLanguage('en')}
        className={cn("px-2", currentLanguage === 'en' && "font-semibold")}
      >
        EN
      </Button>
      <Button
        variant={currentLanguage === 'fr' ? "secondary" : "ghost"}
        size="sm"
        onClick={() => changeLanguage('fr')}
        className={cn("px-2", currentLanguage === 'fr' && "font-semibold")}
      >
        FR
      </Button>
    </div>
  );
} 