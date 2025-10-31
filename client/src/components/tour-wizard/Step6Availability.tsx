import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, X } from 'lucide-react';
import { useTourWizard } from './TourWizardContext';

export default function Step6Availability() {
  const { t } = useTranslation();
  const { form } = useTourWizard();
  const [currentDate, setCurrentDate] = useState('');

  if (!form) return null;

  const availableDates = form.watch('availableDates') || [];

  const handleAddDate = () => {
    if (currentDate) {
      const dateISO = new Date(currentDate).toISOString();
      if (!availableDates.includes(dateISO)) {
        form.setValue('availableDates', [...availableDates, dateISO]);
        setCurrentDate('');
      }
    }
  };

  const handleRemoveDate = (dateToRemove: string) => {
    form.setValue('availableDates', availableDates.filter(d => d !== dateToRemove));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Availability & Status</h2>
        <p className="text-muted-foreground">Set tour dates and publication status</p>
      </div>

      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tour Status *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || 'draft'}>
              <FormControl>
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="draft">Draft - Save without publishing</SelectItem>
                <SelectItem value="pending">Pending - Submit for review</SelectItem>
                <SelectItem value="active">Active - Publish immediately</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Draft tours can be edited later. Active tours are visible to users.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="availableDates"
        render={() => (
          <FormItem>
            <FormLabel>Available Dates *</FormLabel>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  data-testid="input-available-date"
                />
                <Button
                  type="button"
                  onClick={handleAddDate}
                  disabled={!currentDate}
                  data-testid="button-add-date"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Add Date
                </Button>
              </div>

              {availableDates.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected Dates ({availableDates.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {availableDates.map((date: string, index: number) => (
                      <Badge 
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-2 px-3 py-1"
                        data-testid={`badge-date-${index}`}
                      >
                        {new Date(date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                        <button
                          type="button"
                          onClick={() => handleRemoveDate(date)}
                          className="ml-1 hover:text-destructive"
                          data-testid={`button-remove-date-${index}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {availableDates.length === 0 && (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No dates added yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Add at least one available date</p>
                </div>
              )}
            </div>
            <FormDescription>
              Add all dates when this tour will be available
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <FormItem className="hidden">
            <FormControl>
              <input type="hidden" {...field} value={field.value ? "true" : "false"} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
