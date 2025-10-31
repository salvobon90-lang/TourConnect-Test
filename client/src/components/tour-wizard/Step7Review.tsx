import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, MapPin, Clock, Users, DollarSign, Calendar, Globe, Image as ImageIcon } from 'lucide-react';
import { useTourWizard } from './TourWizardContext';

export default function Step7Review() {
  const { t } = useTranslation();
  const { form, goToStep } = useTourWizard();

  if (!form) return null;

  const values = form.getValues();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Review & Submit</h2>
        <p className="text-muted-foreground">Review your tour details before publishing</p>
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => goToStep(1)}
            data-testid="edit-step-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Title</p>
            <p className="font-medium">{values.title || 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="text-sm line-clamp-3">{values.description || 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Category</p>
            <Badge variant="secondary">{values.category}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Languages</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {values.languages?.map((lang: string) => (
                <Badge key={lang} variant="outline">{lang.toUpperCase()}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">Tour Details</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => goToStep(2)}
            data-testid="edit-step-2"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{values.duration} minutes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Max Group</p>
              <p className="font-medium">{values.maxGroupSize} people</p>
            </div>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-muted-foreground">Difficulty</p>
            <Badge variant="outline">{values.difficulty || 'easy'}</Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">Media</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => goToStep(3)}
            data-testid="edit-step-3"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Images ({values.images?.length || 0})</p>
            {values.images && values.images.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {values.images.slice(0, 4).map((url: string, index: number) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Preview ${index}`}
                    className="w-full h-20 object-cover rounded border"
                  />
                ))}
                {values.images.length > 4 && (
                  <div className="w-full h-20 rounded border bg-muted flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">+{values.images.length - 4}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm">No images added</p>
            )}
          </div>
          {values.videos && values.videos.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Videos ({values.videos.length})</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">Location</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => goToStep(4)}
            data-testid="edit-step-4"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
            <div>
              <p className="text-sm text-muted-foreground">Meeting Point</p>
              <p className="font-medium">{values.meetingPoint || 'Not set'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Coordinates</p>
              <p>{values.latitude?.toFixed(6)}, {values.longitude?.toFixed(6)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Coverage Radius</p>
              <p>{values.radius?.toFixed(1)} km</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">Pricing</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => goToStep(5)}
            data-testid="edit-step-5"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Base Price</p>
              <p className="font-medium text-lg">${values.price}</p>
            </div>
          </div>
          {values.communityMode && (
            <div>
              <Badge variant="secondary">Community Mode Active</Badge>
              <p className="text-sm mt-1">
                Min: {values.minParticipants}, Max: {values.maxGroupSize}
              </p>
            </div>
          )}
          {values.discountRules && values.discountRules.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Group Discounts</p>
              <div className="space-y-1 mt-1">
                {values.discountRules.map((rule: any, index: number) => (
                  <p key={index} className="text-sm">
                    {rule.discount}% off for {rule.threshold}+ participants
                  </p>
                ))}
              </div>
            </div>
          )}
          {values.addons && values.addons.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Add-ons ({values.addons.length})</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">Availability</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => goToStep(6)}
            data-testid="edit-step-6"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge>{values.status || 'draft'}</Badge>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
            <div>
              <p className="text-sm text-muted-foreground">Available Dates</p>
              <p className="font-medium">{values.availableDates?.length || 0} dates selected</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h4 className="font-semibold mb-2">Ready to Publish?</h4>
        <p className="text-sm text-muted-foreground">
          Once you submit, your tour will be {values.status === 'active' ? 'published immediately' : 'saved as ' + values.status}. 
          You can always edit it later from your dashboard.
        </p>
      </div>
    </div>
  );
}
