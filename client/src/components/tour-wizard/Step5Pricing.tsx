import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { useTourWizard } from './TourWizardContext';

export default function Step5Pricing() {
  const { t } = useTranslation();
  const { form } = useTourWizard();

  if (!form) return null;

  const communityMode = form.watch('communityMode') || false;
  const discountRules = (form.watch('discountRules') || []) as Array<{ threshold: number; discount: number }>;
  const addons = (form.watch('addons') || []) as Array<{ id: string; name: string; description: string; price: number }>;

  const addDiscountRule = () => {
    const newRule = { threshold: 5, discount: 10 };
    form.setValue('discountRules', [...discountRules, newRule] as any);
  };

  const updateDiscountRule = (index: number, field: 'threshold' | 'discount', value: number) => {
    const updated = [...discountRules];
    updated[index] = { ...updated[index], [field]: value };
    form.setValue('discountRules', updated as any);
  };

  const removeDiscountRule = (index: number) => {
    form.setValue('discountRules', discountRules.filter((_, i) => i !== index) as any);
  };

  const addAddon = () => {
    const newAddon = { 
      id: `addon-${Date.now()}`,
      name: '', 
      description: '', 
      price: 0 
    };
    form.setValue('addons', [...addons, newAddon] as any);
  };

  const updateAddon = (index: number, field: string, value: any) => {
    const updated = [...addons];
    updated[index] = { ...updated[index], [field]: value };
    form.setValue('addons', updated as any);
  };

  const removeAddon = (index: number) => {
    form.setValue('addons', addons.filter((_, i) => i !== index) as any);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Pricing & Options</h2>
        <p className="text-muted-foreground">Set your pricing and additional options</p>
      </div>

      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Base Price (per person) *</FormLabel>
            <FormControl>
              <Input 
                type="number"
                step="0.01"
                min="0"
                placeholder="50.00"
                {...field}
                data-testid="input-price"
              />
            </FormControl>
            <FormDescription>
              Price in USD per participant
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="communityMode"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <FormLabel>Community Mode</FormLabel>
              <FormDescription>
                Enable group booking with minimum participants requirement
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value || false}
                onCheckedChange={field.onChange}
                data-testid="switch-community-mode"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {communityMode && (
        <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
          <FormField
            control={form.control}
            name="minParticipants"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Participants</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    min="1"
                    placeholder="5"
                    {...field}
                    value={field.value || 1}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    data-testid="input-min-participants"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxGroupSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Participants</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    min="1"
                    placeholder="15"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    data-testid="input-max-participants"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Group Discounts</h3>
            <p className="text-sm text-muted-foreground">
              Offer discounts for larger groups
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDiscountRule}
            data-testid="button-add-discount"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Discount
          </Button>
        </div>

        {discountRules.length > 0 && (
          <div className="space-y-2">
            {discountRules.map((rule: any, index: number) => (
              <Card key={index} className="p-4">
                <div className="flex gap-4 items-start">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Participants ≥</Label>
                      <Input
                        type="number"
                        min="2"
                        value={rule.threshold}
                        onChange={(e) => updateDiscountRule(index, 'threshold', parseInt(e.target.value))}
                        data-testid={`input-discount-threshold-${index}`}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Discount %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={rule.discount}
                        onChange={(e) => updateDiscountRule(index, 'discount', parseInt(e.target.value))}
                        data-testid={`input-discount-percent-${index}`}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDiscountRule(index)}
                    data-testid={`button-remove-discount-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Add-ons & Extras</h3>
            <p className="text-sm text-muted-foreground">
              Optional add-ons participants can purchase
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAddon}
            data-testid="button-add-addon"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Extra
          </Button>
        </div>

        {addons.length > 0 && (
          <div className="space-y-3">
            {addons.map((addon: any, index: number) => (
              <Card key={addon.id || index} className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-3">
                    <Input
                      placeholder="Add-on name (e.g., Lunch included)"
                      value={addon.name}
                      onChange={(e) => updateAddon(index, 'name', e.target.value)}
                      data-testid={`input-addon-name-${index}`}
                    />
                    <Textarea
                      placeholder="Description"
                      value={addon.description}
                      onChange={(e) => updateAddon(index, 'description', e.target.value)}
                      rows={2}
                      data-testid={`input-addon-description-${index}`}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={addon.price}
                      onChange={(e) => updateAddon(index, 'price', parseFloat(e.target.value))}
                      data-testid={`input-addon-price-${index}`}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeAddon(index)}
                    data-testid={`button-remove-addon-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
