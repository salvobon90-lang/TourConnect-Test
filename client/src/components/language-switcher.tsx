import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Globe, Check } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'it', name: 'Italiano' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-9 w-9"
          data-testid="button-language-switcher"
        >
          <Globe className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="space-y-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover-elevate active-elevate-2 ${
                i18n.language === lang.code
                  ? 'bg-accent text-accent-foreground'
                  : ''
              }`}
              data-testid={`language-option-${lang.code}`}
            >
              <Globe className="w-4 h-4" />
              <span className="flex-1 text-left font-medium">{lang.name}</span>
              {i18n.language === lang.code && (
                <Check className="w-4 h-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}