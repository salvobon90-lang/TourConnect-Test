import { useTranslation } from 'react-i18next';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTourWizard } from './TourWizardContext';

export default function Step2Details() {
  const { t } = useTranslation();
  const { form } = useTourWizard();

  if (!form) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Tour Details</h2>
        <p className="text-muted-foreground">Provide detailed information about the tour experience</p>
      </div>

      <FormField
        control={form.control}
        name="itinerary"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Itinerary *</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Describe the tour itinerary step by step. Include all stops and activities."
                {...field}
                rows={8}
                data-testid="input-itinerary"
              />
            </FormControl>
            <FormDescription>
              Provide a detailed breakdown of what participants will experience
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes) *</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  min="30"
                  step="15"
                  placeholder="120"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  data-testid="input-duration"
                />
              </FormControl>
              <FormDescription>Tour duration in minutes</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxGroupSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Group Size *</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  min="1"
                  max="50"
                  placeholder="10"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  data-testid="input-max-group"
                />
              </FormControl>
              <FormDescription>Maximum participants per tour</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="difficulty"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Difficulty Level *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || 'easy'}>
              <FormControl>
                <SelectTrigger data-testid="select-difficulty">
                  <SelectValue placeholder="Select difficulty level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="easy">Easy - Suitable for all fitness levels</SelectItem>
                <SelectItem value="moderate">Moderate - Some walking required</SelectItem>
                <SelectItem value="challenging">Challenging - Good fitness required</SelectItem>
                <SelectItem value="expert">Expert - Excellent fitness required</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="cancellationPolicy"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cancellation Policy</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="e.g., Free cancellation up to 24 hours before the tour starts. Cancellations within 24 hours are non-refundable."
                {...field}
                value={field.value || ''}
                rows={4}
                data-testid="input-cancellation-policy"
              />
            </FormControl>
            <FormDescription>
              Specify your refund and cancellation terms
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
