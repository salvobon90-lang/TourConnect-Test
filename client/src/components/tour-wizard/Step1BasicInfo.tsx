import { useTranslation } from 'react-i18next';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useTourWizard } from './TourWizardContext';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'jp', name: 'Japanese', flag: '🇯🇵' },
  { code: 'cn', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
];

export default function Step1BasicInfo() {
  const { t } = useTranslation();
  const { form } = useTourWizard();

  if (!form) return null;

  const selectedLanguages = form.watch('languages') || [];

  const toggleLanguage = (langCode: string) => {
    const current = selectedLanguages;
    const newLanguages = current.includes(langCode)
      ? current.filter(l => l !== langCode)
      : [...current, langCode];
    form.setValue('languages', newLanguages);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Basic Information</h2>
        <p className="text-muted-foreground">Tell us about your tour</p>
      </div>

      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('forms.title')} *</FormLabel>
            <FormControl>
              <Input 
                placeholder="e.g., Historical Walking Tour of Rome" 
                {...field}
                data-testid="input-title"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('forms.description')} *</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Describe your tour in detail. What makes it unique? What will participants experience?"
                {...field}
                rows={6}
                data-testid="input-description"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('forms.category')} *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder={t('forms.selectCategory')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="walking">Walking</SelectItem>
                <SelectItem value="food">Food & Culinary</SelectItem>
                <SelectItem value="adventure">Adventure</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="historical">Historical</SelectItem>
                <SelectItem value="nature">Nature</SelectItem>
                <SelectItem value="art">Art</SelectItem>
                <SelectItem value="nightlife">Nightlife</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="languages"
        render={() => (
          <FormItem>
            <FormLabel>Languages (Select at least one) *</FormLabel>
            <p className="text-sm text-muted-foreground mb-3">
              ✨ Content will be automatically translated to selected languages using AI
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {LANGUAGES.map((lang) => (
                <div
                  key={lang.code}
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedLanguages.includes(lang.code)
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => toggleLanguage(lang.code)}
                  data-testid={`language-${lang.code}`}
                >
                  <Checkbox
                    checked={selectedLanguages.includes(lang.code)}
                    onCheckedChange={() => toggleLanguage(lang.code)}
                  />
                  <Label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-2xl">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </Label>
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
