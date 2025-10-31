import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon, Video } from 'lucide-react';
import { useTourWizard } from './TourWizardContext';
import { Badge } from '@/components/ui/badge';

export default function Step3Media() {
  const { t } = useTranslation();
  const { form } = useTourWizard();
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  if (!form) return null;

  const images = form.watch('images') || [];
  const videos = form.watch('videos') || [];

  const addImage = () => {
    if (imageUrl && imageUrl.trim()) {
      const currentImages = images;
      if (!currentImages.includes(imageUrl)) {
        form.setValue('images', [...currentImages, imageUrl]);
        setImageUrl('');
      }
    }
  };

  const removeImage = (urlToRemove: string) => {
    form.setValue('images', images.filter(url => url !== urlToRemove));
  };

  const addVideo = () => {
    if (videoUrl && videoUrl.trim()) {
      const currentVideos = videos;
      if (!currentVideos.includes(videoUrl)) {
        form.setValue('videos', [...currentVideos, videoUrl]);
        setVideoUrl('');
      }
    }
  };

  const removeVideo = (urlToRemove: string) => {
    form.setValue('videos', videos.filter(url => url !== urlToRemove));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Media & Photos</h2>
        <p className="text-muted-foreground">Add images and videos to showcase your tour</p>
      </div>

      <FormField
        control={form.control}
        name="images"
        render={() => (
          <FormItem>
            <FormLabel>Tour Images *</FormLabel>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addImage();
                    }
                  }}
                  data-testid="input-image-url"
                />
                <Button
                  type="button"
                  onClick={addImage}
                  disabled={!imageUrl.trim()}
                  data-testid="button-add-image"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Tour ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg border"
                        data-testid={`image-preview-${index}`}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(url)}
                        data-testid={`button-remove-image-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      {index === 0 && (
                        <Badge className="absolute bottom-2 left-2">Cover Photo</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {images.length === 0 && (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No images added yet</p>
                </div>
              )}
            </div>
            <FormDescription>
              Add at least one image. The first image will be used as the cover photo.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="videos"
        render={() => (
          <FormItem>
            <FormLabel>Tour Videos (Optional)</FormLabel>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addVideo();
                    }
                  }}
                  data-testid="input-video-url"
                />
                <Button
                  type="button"
                  onClick={addVideo}
                  variant="outline"
                  disabled={!videoUrl.trim()}
                  data-testid="button-add-video"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              {videos.length > 0 && (
                <div className="space-y-2">
                  {videos.map((url, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      data-testid={`video-item-${index}`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Video className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm truncate">{url}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVideo(url)}
                        data-testid={`button-remove-video-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <FormDescription>
              Add video URLs from YouTube, Vimeo, or direct links
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
