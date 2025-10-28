import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Camera, Save, Loader2, MapPin, Briefcase, Globe, Award, BadgeCheck } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SiFacebook, SiInstagram, SiX } from 'react-icons/si';
import { SEO } from '@/components/seo';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';
import { TrustLevel } from '@/components/badges/TrustLevel';
import { BADGE_CONFIG } from '@/lib/badges';

export default function Profile() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');

  // Guide-specific fields
  const [guideLanguages, setGuideLanguages] = useState<string[]>([]);
  const [guideSpecialties, setGuideSpecialties] = useState<string[]>([]);
  const [guideExperience, setGuideExperience] = useState<number>(0);
  const [guideLicenseNumber, setGuideLicenseNumber] = useState('');

  // Provider-specific fields
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [website, setWebsite] = useState('');

  // Social links
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialWebsite, setSocialWebsite] = useState('');

  // Multi-select state for arrays
  const [languageInput, setLanguageInput] = useState('');
  const [specialtyInput, setSpecialtyInput] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: t('system.unauthorized'),
        description: t('system.unauthorizedDesc'),
        variant: 'destructive',
      });
      setTimeout(() => {
        window.location.href = '/api/login';
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast, t]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setBio(user.bio || '');
      setPhone(user.phone || '');
      setCountry(user.country || '');
      setCity(user.city || '');
      setProfileImageUrl(user.profileImageUrl || '');

      if (user.role === 'guide') {
        setGuideLanguages(user.guideLanguages || []);
        setGuideSpecialties(user.guideSpecialties || []);
        setGuideExperience(user.guideExperience || 0);
        setGuideLicenseNumber(user.guideLicenseNumber || '');
      }

      if (user.role === 'provider') {
        setBusinessName(user.businessName || '');
        setBusinessType(user.businessType || '');
        setBusinessAddress(user.businessAddress || '');
        setWebsite(user.website || '');
      }

      // Load social links
      if (user.socialLinks) {
        setSocialFacebook(user.socialLinks.facebook || '');
        setSocialInstagram(user.socialLinks.instagram || '');
        setSocialTwitter(user.socialLinks.twitter || '');
        setSocialWebsite(user.socialLinks.website || '');
      }
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('PATCH', '/api/auth/update-profile', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: t('profile.updateSuccess'),
        description: t('profile.updateSuccessDesc'),
      });
    },
    onError: () => {
      toast({
        title: t('system.error'),
        description: t('profile.updateError'),
        variant: 'destructive',
      });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ imageData, fileName }: { imageData: string; fileName: string }) => {
      const res = await apiRequest('POST', '/api/auth/upload-profile-image', { imageData, fileName });
      return await res.json();
    },
    onSuccess: (data: any) => {
      setProfileImageUrl(data.imageUrl);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: t('profile.photoUploadSuccess'),
        description: t('profile.photoUploadSuccessDesc'),
      });
    },
    onError: () => {
      toast({
        title: t('system.error'),
        description: t('profile.photoUploadError'),
        variant: 'destructive',
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: t('system.error'),
        description: t('profile.invalidImageType'),
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('system.error'),
        description: t('profile.imageTooLarge'),
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result as string;
      uploadImageMutation.mutate({ imageData, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const profileData: any = {
      firstName,
      lastName,
      bio: bio || null,
      phone: phone || null,
      country: country || null,
      city: city || null,
      socialLinks: {
        facebook: socialFacebook || undefined,
        instagram: socialInstagram || undefined,
        twitter: socialTwitter || undefined,
        website: socialWebsite || undefined,
      },
    };

    if (user?.role === 'guide') {
      profileData.guideLanguages = guideLanguages.length > 0 ? guideLanguages : null;
      profileData.guideSpecialties = guideSpecialties.length > 0 ? guideSpecialties : null;
      profileData.guideExperience = guideExperience || null;
      profileData.guideLicenseNumber = guideLicenseNumber || null;
    }

    if (user?.role === 'provider') {
      profileData.businessName = businessName || null;
      profileData.businessType = businessType || null;
      profileData.businessAddress = businessAddress || null;
      profileData.website = website || null;
    }

    updateProfileMutation.mutate(profileData);
  };

  const addLanguage = () => {
    if (languageInput.trim() && !guideLanguages.includes(languageInput.trim())) {
      setGuideLanguages([...guideLanguages, languageInput.trim()]);
      setLanguageInput('');
    }
  };

  const removeLanguage = (lang: string) => {
    setGuideLanguages(guideLanguages.filter(l => l !== lang));
  };

  const addSpecialty = () => {
    if (specialtyInput.trim() && !guideSpecialties.includes(specialtyInput.trim())) {
      setGuideSpecialties([...guideSpecialties, specialtyInput.trim()]);
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setGuideSpecialties(guideSpecialties.filter(s => s !== specialty));
  };

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      toast({
        title: t('auth.logoutSuccess'),
        description: t('auth.logoutSuccessDesc'),
      });
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      toast({
        title: t('system.error'),
        description: t('auth.logoutError'),
        variant: 'destructive',
      });
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <>
      <SEO 
        title={t('seo.profile.title')}
        description={t('seo.profile.description')}
      />
      <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-serif font-semibold">{t('common.appName')}</h1>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button
              variant="outline"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              {t('auth.logout')}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-serif font-semibold">{t('profile.title')}</h2>
            {user?.verified && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="default" className="bg-primary text-primary-foreground gap-1" data-testid="badge-verified">
                      <BadgeCheck className="w-3 h-3" />
                      {t('profile.verified')}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('profile.verifiedTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-muted-foreground">{t('profile.subtitle')}</p>
          
          {/* Trust Level and Badges Display */}
          <div className="mt-4 space-y-3">
            {user?.trustLevel !== undefined && user.trustLevel !== null && user.trustLevel > 0 && (
              <TrustLevel level={user.trustLevel} variant="full" />
            )}
            
            {user?.badges && user.badges.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Achievements</p>
                <BadgeDisplay badges={user.badges} showLabels size="lg" />
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t('profile.photoSection')}
              </CardTitle>
              <CardDescription>{t('profile.photoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileImageUrl} alt={`${user?.firstName} ${user?.lastName}`} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="input-profile-image"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadImageMutation.isPending}
                  data-testid="button-upload-photo"
                >
                  {uploadImageMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      {t('profile.uploading')}
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 w-4 h-4" />
                      {t('profile.changePhoto')}
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('profile.photoRequirements')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {t('profile.basicInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">{t('profile.firstName')}</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  data-testid="input-first-name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">{t('profile.lastName')}</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  data-testid="input-last-name"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="bio">{t('profile.bio')}</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t('profile.bioPlaceholder')}
                  rows={4}
                  maxLength={1000}
                  data-testid="input-bio"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {bio.length}/1000 {t('profile.characters')}
                </p>
              </div>
              <div>
                <Label htmlFor="phone">{t('profile.phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('profile.phonePlaceholder')}
                  data-testid="input-phone"
                />
              </div>
              <div>
                <Label htmlFor="email">{t('profile.email')}</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                  data-testid="input-email"
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {t('profile.location')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">{t('profile.country')}</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder={t('profile.countryPlaceholder')}
                  data-testid="input-country"
                />
              </div>
              <div>
                <Label htmlFor="city">{t('profile.city')}</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t('profile.cityPlaceholder')}
                  data-testid="input-city"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Links Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {t('profile.socialLinks')}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="socialFacebook" className="flex items-center gap-2">
                  <SiFacebook className="w-4 h-4" />
                  {t('profile.facebook')}
                </Label>
                <Input
                  id="socialFacebook"
                  type="url"
                  value={socialFacebook}
                  onChange={(e) => setSocialFacebook(e.target.value)}
                  placeholder="https://facebook.com/username"
                  data-testid="input-social-facebook"
                />
              </div>
              <div>
                <Label htmlFor="socialInstagram" className="flex items-center gap-2">
                  <SiInstagram className="w-4 h-4" />
                  {t('profile.instagram')}
                </Label>
                <Input
                  id="socialInstagram"
                  type="url"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  placeholder="https://instagram.com/username"
                  data-testid="input-social-instagram"
                />
              </div>
              <div>
                <Label htmlFor="socialTwitter" className="flex items-center gap-2">
                  <SiX className="w-4 h-4" />
                  {t('profile.twitter')}
                </Label>
                <Input
                  id="socialTwitter"
                  type="url"
                  value={socialTwitter}
                  onChange={(e) => setSocialTwitter(e.target.value)}
                  placeholder="https://x.com/username"
                  data-testid="input-social-twitter"
                />
              </div>
              <div>
                <Label htmlFor="socialWebsite" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {t('profile.socialWebsite')}
                </Label>
                <Input
                  id="socialWebsite"
                  type="url"
                  value={socialWebsite}
                  onChange={(e) => setSocialWebsite(e.target.value)}
                  placeholder={t('profile.websitePlaceholder')}
                  data-testid="input-social-website"
                />
              </div>
            </CardContent>
          </Card>

          {/* Guide-specific Fields */}
          {user?.role === 'guide' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  {t('profile.guideInfo')}
                </CardTitle>
                <CardDescription>{t('profile.guideInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="guideLanguages">{t('profile.guideLanguages')}</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="guideLanguages"
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                      placeholder={t('profile.addLanguage')}
                      data-testid="input-guide-languages"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addLanguage}
                      data-testid="button-add-language"
                    >
                      {t('common.add')}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {guideLanguages.map((lang) => (
                      <Badge
                        key={lang}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeLanguage(lang)}
                        data-testid={`badge-language-${lang}`}
                      >
                        {lang} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="guideSpecialties">{t('profile.guideSpecialties')}</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      id="guideSpecialties"
                      value={specialtyInput}
                      onChange={(e) => setSpecialtyInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                      placeholder={t('profile.addSpecialty')}
                      data-testid="input-guide-specialties"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addSpecialty}
                      data-testid="button-add-specialty"
                    >
                      {t('common.add')}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {guideSpecialties.map((specialty) => (
                      <Badge
                        key={specialty}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeSpecialty(specialty)}
                        data-testid={`badge-specialty-${specialty}`}
                      >
                        {specialty} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guideExperience">{t('profile.guideExperience')}</Label>
                    <Input
                      id="guideExperience"
                      type="number"
                      min="0"
                      value={guideExperience}
                      onChange={(e) => setGuideExperience(parseInt(e.target.value) || 0)}
                      placeholder={t('profile.yearsPlaceholder')}
                      data-testid="input-guide-experience"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guideLicenseNumber">{t('profile.guideLicense')}</Label>
                    <Input
                      id="guideLicenseNumber"
                      value={guideLicenseNumber}
                      onChange={(e) => setGuideLicenseNumber(e.target.value)}
                      placeholder={t('profile.licensePlaceholder')}
                      data-testid="input-guide-license"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Provider-specific Fields */}
          {user?.role === 'provider' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  {t('profile.businessInfo')}
                </CardTitle>
                <CardDescription>{t('profile.businessInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="businessName">{t('profile.businessName')}</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={t('profile.businessNamePlaceholder')}
                    data-testid="input-business-name"
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">{t('profile.businessType')}</Label>
                  <Select
                    value={businessType}
                    onValueChange={setBusinessType}
                  >
                    <SelectTrigger data-testid="select-business-type">
                      <SelectValue placeholder={t('profile.selectBusinessType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">{t('common.restaurant')}</SelectItem>
                      <SelectItem value="shop">{t('common.shop')}</SelectItem>
                      <SelectItem value="transport">{t('common.transport')}</SelectItem>
                      <SelectItem value="other">{t('common.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="businessAddress">{t('profile.businessAddress')}</Label>
                  <Textarea
                    id="businessAddress"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder={t('profile.businessAddressPlaceholder')}
                    rows={3}
                    data-testid="input-business-address"
                  />
                </div>
                <div>
                  <Label htmlFor="website">{t('profile.website')}</Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder={t('profile.websitePlaceholder')}
                    data-testid="input-website"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              data-testid="button-cancel"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  {t('profile.saving')}
                </>
              ) : (
                <>
                  <Save className="mr-2 w-4 h-4" />
                  {t('profile.saveChanges')}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Achievements Showcase Section */}
        {(user?.badges && user.badges.length > 0) || user?.trustLevel !== undefined && (
          <Card className="p-6 mt-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Achievements
            </h3>
            
            {user?.badges && user.badges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.badges.map((badgeKey) => {
                  const config = BADGE_CONFIG[badgeKey];
                  if (!config) return null;
                  
                  const Icon = config.icon;
                  
                  return (
                    <Card key={badgeKey} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className={`h-6 w-6 ${config.color}`} />
                        </div>
                        <div>
                          <h4 className="font-medium">{config.label}</h4>
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No badges earned yet. Keep exploring to unlock achievements!
              </p>
            )}
          </Card>
        )}
      </main>
    </div>
    </>
  );
}
