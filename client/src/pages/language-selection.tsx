import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import { Logo } from '@/components/logo';

const SUPPORTED_LANGUAGES = [
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'it', flag: '🇮🇹', name: 'Italiano' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
];

const LANGUAGE_TITLES = [
  'Select your language',
  'Seleziona la tua lingua',
  'Wähle deine Sprache',
  'Sélectionnez votre langue',
  'Selecciona tu idioma',
];

interface LanguageSelectionProps {
  onLanguageSelected: () => void;
}

export default function LanguageSelection({ onLanguageSelected }: LanguageSelectionProps) {
  const { t, i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [titleIndex, setTitleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % LANGUAGE_TITLES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleLanguageSelect = (code: string) => {
    setSelectedLang(code);
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
    setTimeout(() => {
      onLanguageSelected();
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <div className="mb-8">
            <Logo className="h-16 mx-auto mb-6" />
          </div>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Globe className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-foreground mb-8 transition-opacity duration-500">
            {LANGUAGE_TITLES[titleIndex]}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Card
              key={lang.code}
              className={`p-6 cursor-pointer transition-all hover-elevate active-elevate-2 ${
                selectedLang === lang.code ? 'border-primary border-2' : ''
              }`}
              onClick={() => handleLanguageSelect(lang.code)}
              data-testid={`language-${lang.code}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-4xl bg-muted/50">
                  {lang.flag}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground">
                    {lang.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {lang.code.toUpperCase()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
