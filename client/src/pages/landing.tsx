import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, Search, Star, Users, Calendar, Globe2, Shield, Compass } from 'lucide-react';
import { Link } from 'wouter';

export default function Landing() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2835)',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6">
            {t('landing.heroTitle')}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
            {t('landing.heroSubtitle')}
          </p>
          
          {/* Search Bar */}
          <Card className="p-4 bg-white/95 backdrop-blur-md max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder={t('landing.searchPlaceholderLocation')}
                  className="pl-10"
                  data-testid="input-search-location"
                />
              </div>
              <div className="flex-1 relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-10"
                  data-testid="input-search-date"
                />
              </div>
              <Button size="lg" className="md:w-auto" data-testid="button-search">
                <Search className="w-5 h-5 mr-2" />
                {t('landing.searchButton')}
              </Button>
            </div>
          </Card>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/tours">
                <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20" data-testid="button-browse-tours">
                  <Compass className="w-5 h-5 mr-2" />
                  {t('landing.exploreTours')}
                </Button>
              </Link>
              <a href="/api/login">
                <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20" data-testid="button-login">
                  <Globe2 className="w-5 h-5 mr-2" />
                  {t('navigation.login')}
                </Button>
              </a>
            </div>
            
            <a href="/api/login" className="text-white/70 hover:text-white text-sm flex items-center gap-2 transition-colors" data-testid="link-supervisor-login">
              <Shield className="w-4 h-4" />
              {t('roles.supervisor')}
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-4">
              {t('landing.whyChooseUs')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('landing.secureBookingDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-8 hover-elevate">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">{t('landing.localGuides')}</h3>
              <p className="text-muted-foreground">
                {t('landing.localGuidesDesc')}
              </p>
            </Card>

            <Card className="p-8 hover-elevate">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">{t('landing.verifiedServices')}</h3>
              <p className="text-muted-foreground">
                {t('landing.verifiedServicesDesc')}
              </p>
            </Card>

            <Card className="p-8 hover-elevate">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">{t('landing.secureBooking')}</h3>
              <p className="text-muted-foreground">
                {t('landing.secureBookingDesc')}
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-semibold mb-6">
            {t('landing.joinCommunity')}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t('landing.trustedBy')}
          </p>
          <a href="/api/login">
            <Button size="lg" data-testid="button-get-started">
              {t('common.getStarted')}
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
