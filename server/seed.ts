import { db } from './db';
import { users, tours, services } from '@shared/schema';
import { sql } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding database for Siracusa, Italy...');

  try {
    console.log('📝 Clearing existing data...');
    await db.delete(services);
    await db.delete(tours);
    await db.delete(users);

    console.log('👥 Creating test users...');

    const [adminUser] = await db.insert(users).values({
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'Test',
      role: 'supervisor',
      approvalStatus: 'approved',
      city: 'Siracusa',
      country: 'Italy',
      latitude: 37.0755,
      longitude: 15.2866,
      bio: 'Platform administrator for TourConnect',
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✓ Admin user created:', adminUser.email);

    const [guide1] = await db.insert(users).values({
      email: 'guide1@test.com',
      firstName: 'Marco',
      lastName: 'Rossi',
      role: 'guide',
      approvalStatus: 'approved',
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      city: 'Siracusa',
      country: 'Italy',
      latitude: 37.0755,
      longitude: 15.2866,
      bio: 'Expert guide specializing in historical and cultural tours of Siracusa. Licensed guide with 10 years of experience.',
      phone: '+39 320 1234567',
      guideLanguages: ['it', 'en', 'fr'],
      guideSpecialties: ['historical', 'cultural'],
      guideExperience: 10,
      guideLicenseNumber: 'SR-GUIDE-001',
      verified: true,
      trustLevel: 85,
      completedToursCount: 150,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✓ Guide 1 created:', guide1.email);

    const [guide2] = await db.insert(users).values({
      email: 'guide2@test.com',
      firstName: 'Giulia',
      lastName: 'Bianchi',
      role: 'guide',
      approvalStatus: 'approved',
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      city: 'Siracusa',
      country: 'Italy',
      latitude: 37.0755,
      longitude: 15.2866,
      bio: 'Passionate food and walking tour guide. Discover the authentic flavors and hidden gems of Sicily.',
      phone: '+39 320 7654321',
      guideLanguages: ['it', 'en', 'es'],
      guideSpecialties: ['food', 'walking'],
      guideExperience: 7,
      guideLicenseNumber: 'SR-GUIDE-002',
      verified: true,
      trustLevel: 90,
      completedToursCount: 120,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✓ Guide 2 created:', guide2.email);

    const [provider1] = await db.insert(users).values({
      email: 'provider1@test.com',
      firstName: 'Giuseppe',
      lastName: 'Marino',
      role: 'provider',
      approvalStatus: 'approved',
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      city: 'Siracusa',
      country: 'Italy',
      latitude: 37.0755,
      longitude: 15.2866,
      businessName: 'Sicilian Adventures',
      businessType: 'transport',
      businessAddress: 'Via Roma 45, 96100 Siracusa SR, Italy',
      bio: 'Your adventure partner in Sicily. We provide transport, kayak rentals, and outdoor activities.',
      phone: '+39 320 5555555',
      website: 'https://sicilianadventures.com',
      verified: true,
      trustLevel: 80,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✓ Provider 1 created:', provider1.email);

    const [provider2] = await db.insert(users).values({
      email: 'provider2@test.com',
      firstName: 'Maria',
      lastName: 'Fontana',
      role: 'provider',
      approvalStatus: 'approved',
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      city: 'Siracusa',
      country: 'Italy',
      latitude: 37.0755,
      longitude: 15.2866,
      businessName: 'Taste of Sicily',
      businessType: 'restaurant',
      businessAddress: 'Piazza Duomo 12, 96100 Siracusa SR, Italy',
      bio: 'Authentic Sicilian cuisine and cooking experiences. Taste the real Sicily with us!',
      phone: '+39 320 6666666',
      website: 'https://tasteofsicily.it',
      verified: true,
      trustLevel: 95,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✓ Provider 2 created:', provider2.email);

    const touristData = [
      { email: 'tourist1@test.com', firstName: 'John', lastName: 'Smith', country: 'United States', city: 'New York' },
      { email: 'tourist2@test.com', firstName: 'Emma', lastName: 'Johnson', country: 'United Kingdom', city: 'London' },
      { email: 'tourist3@test.com', firstName: 'Hans', lastName: 'Mueller', country: 'Germany', city: 'Berlin' },
      { email: 'tourist4@test.com', firstName: 'Sophie', lastName: 'Dubois', country: 'France', city: 'Paris' },
      { email: 'tourist5@test.com', firstName: 'Carlos', lastName: 'Garcia', country: 'Spain', city: 'Madrid' },
    ];

    for (const tourist of touristData) {
      await db.insert(users).values({
        ...tourist,
        role: 'tourist',
        approvalStatus: 'approved',
        bio: `Passionate traveler from ${tourist.city}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✓ Tourist created:', tourist.email);
    }

    console.log('\n🗺️ Creating tours...');

    const [tour1] = await db.insert(tours).values({
      guideId: guide1.id,
      title: 'Ortigia Walking Tour',
      description: 'Explore the enchanting island of Ortigia, the historical heart of Syracuse. Walk through ancient Greek ruins, admire stunning Baroque architecture, and discover the legends of this UNESCO World Heritage Site. Visit the Temple of Apollo, the Cathedral, and the Fountain of Arethusa.',
      itinerary: `
- Meet at Piazza Pancali (Temple of Apollo)
- Walk through the Jewish Quarter (Giudecca)
- Visit the Cathedral of Syracuse (Duomo)
- Explore the Fountain of Arethusa
- Stroll along the waterfront promenade
- End at Piazza Archimede
      `.trim(),
      category: 'historical',
      price: '30.00',
      duration: 180,
      maxGroupSize: 15,
      images: [],
      videos: [],
      meetingPoint: 'Piazza Pancali, Temple of Apollo, Ortigia, Siracusa',
      latitude: 37.0625,
      longitude: 15.2935,
      radius: 1.0,
      languages: ['it', 'en'],
      included: ['Licensed guide', 'Cathedral entrance fee', 'Historical photos'],
      excluded: ['Food and drinks', 'Personal expenses', 'Tips'],
      availableDates: [
        new Date('2025-12-01').toISOString(),
        new Date('2025-12-03').toISOString(),
        new Date('2025-12-05').toISOString(),
        new Date('2025-12-08').toISOString(),
        new Date('2025-12-10').toISOString(),
      ],
      difficulty: 'easy',
      cancellationPolicy: 'Free cancellation up to 24 hours before the tour starts. No refund for cancellations within 24 hours.',
      i18n_payload: {
        en: {
          title: 'Ortigia Walking Tour',
          description: 'Explore the enchanting island of Ortigia, the historical heart of Syracuse. Walk through ancient Greek ruins, admire stunning Baroque architecture, and discover the legends of this UNESCO World Heritage Site. Visit the Temple of Apollo, the Cathedral, and the Fountain of Arethusa.',
          itinerary: `
- Meet at Piazza Pancali (Temple of Apollo)
- Walk through the Jewish Quarter (Giudecca)
- Visit the Cathedral of Syracuse (Duomo)
- Explore the Fountain of Arethusa
- Stroll along the waterfront promenade
- End at Piazza Archimede
          `.trim(),
          included: ['Licensed guide', 'Cathedral entrance fee', 'Historical photos'],
          excluded: ['Food and drinks', 'Personal expenses', 'Tips'],
          cancellationPolicy: 'Free cancellation up to 24 hours before the tour starts. No refund for cancellations within 24 hours.',
        },
        it: {
          title: 'Tour a Piedi di Ortigia',
          description: 'Scopri l\'incantevole isola di Ortigia, il cuore storico di Siracusa. Passeggia tra antiche rovine greche, ammira la splendida architettura barocca e scopri le leggende di questo sito UNESCO Patrimonio dell\'Umanità. Visita il Tempio di Apollo, il Duomo e la Fontana di Aretusa.',
          itinerary: `
- Incontro a Piazza Pancali (Tempio di Apollo)
- Passeggiata nel Quartiere Ebraico (Giudecca)
- Visita del Duomo di Siracusa
- Esplorazione della Fontana di Aretusa
- Passeggiata lungo il lungomare
- Fine del tour a Piazza Archimede
          `.trim(),
          included: ['Guida autorizzata', 'Biglietto d\'ingresso al Duomo', 'Foto storiche'],
          excluded: ['Cibo e bevande', 'Spese personali', 'Mance'],
          cancellationPolicy: 'Cancellazione gratuita fino a 24 ore prima dell\'inizio del tour. Nessun rimborso per cancellazioni entro 24 ore.',
        },
      },
      status: 'active',
      approvalStatus: 'approved',
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✓ Tour created:', tour1.title);

    const [tour2] = await db.insert(tours).values({
      guideId: guide1.id,
      title: 'Syracuse Boat Tour',
      description: 'Experience Syracuse from the sea! A unique boat tour along the stunning coastline of Ortigia and the Porto Grande. Discover sea caves, crystal-clear waters, and enjoy swimming stops in hidden coves. Perfect for nature and adventure lovers.',
      itinerary: `
- Departure from Porto Piccolo
- Sail around Ortigia Island
- Visit the Ear of Dionysius sea cave
- Swimming stop at Plemmirio Marine Reserve
- Coastal exploration and wildlife spotting
- Return to Porto Piccolo
      `.trim(),
      category: 'adventure',
      price: '50.00',
      duration: 240,
      maxGroupSize: 8,
      images: [],
      videos: [],
      meetingPoint: 'Porto Piccolo Marina, Siracusa',
      latitude: 37.0600,
      longitude: 15.2900,
      radius: 5.0,
      languages: ['en', 'fr'],
      included: ['Boat captain and guide', 'Snorkeling equipment', 'Drinks and snacks', 'Life jackets'],
      excluded: ['Towels', 'Underwater camera', 'Hotel pickup'],
      availableDates: [
        new Date('2025-12-02').toISOString(),
        new Date('2025-12-04').toISOString(),
        new Date('2025-12-07').toISOString(),
        new Date('2025-12-09').toISOString(),
      ],
      difficulty: 'easy',
      cancellationPolicy: 'Free cancellation up to 48 hours before departure. 50% refund for cancellations within 48 hours. Weather-dependent - full refund if cancelled due to bad weather.',
      i18n_payload: {
        en: {
          title: 'Syracuse Boat Tour',
          description: 'Experience Syracuse from the sea! A unique boat tour along the stunning coastline of Ortigia and the Porto Grande. Discover sea caves, crystal-clear waters, and enjoy swimming stops in hidden coves. Perfect for nature and adventure lovers.',
          itinerary: `
- Departure from Porto Piccolo
- Sail around Ortigia Island
- Visit the Ear of Dionysius sea cave
- Swimming stop at Plemmirio Marine Reserve
- Coastal exploration and wildlife spotting
- Return to Porto Piccolo
          `.trim(),
          included: ['Boat captain and guide', 'Snorkeling equipment', 'Drinks and snacks', 'Life jackets'],
          excluded: ['Towels', 'Underwater camera', 'Hotel pickup'],
          cancellationPolicy: 'Free cancellation up to 48 hours before departure. 50% refund for cancellations within 48 hours. Weather-dependent - full refund if cancelled due to bad weather.',
        },
        fr: {
          title: 'Excursion en Bateau à Syracuse',
          description: 'Découvrez Syracuse depuis la mer ! Une excursion en bateau unique le long de la magnifique côte d\'Ortigia et du Porto Grande. Explorez les grottes marines, les eaux cristallines et profitez d\'arrêts baignade dans des criques cachées. Parfait pour les amoureux de la nature et de l\'aventure.',
          itinerary: `
- Départ de Porto Piccolo
- Navigation autour de l'île d'Ortigia
- Visite de la grotte marine Oreille de Denys
- Arrêt baignade à la Réserve Marine de Plemmirio
- Exploration côtière et observation de la faune
- Retour à Porto Piccolo
          `.trim(),
          included: ['Capitaine et guide', 'Équipement de plongée', 'Boissons et collations', 'Gilets de sauvetage'],
          excluded: ['Serviettes', 'Caméra sous-marine', 'Transfert hôtel'],
          cancellationPolicy: 'Annulation gratuite jusqu\'à 48 heures avant le départ. Remboursement de 50% pour les annulations dans les 48 heures. Dépendant de la météo - remboursement complet en cas d\'annulation pour mauvais temps.',
        },
      },
      status: 'active',
      approvalStatus: 'approved',
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✓ Tour created:', tour2.title);

    const [tour3] = await db.insert(tours).values({
      guideId: guide2.id,
      title: 'Plemmirio Sunset Photography Tour',
      description: 'Capture the magical sunset at the Plemmirio Marine Reserve. This photography tour takes you to the most scenic spots along the coast, where you\'ll learn photography techniques while enjoying breathtaking views of the Mediterranean sunset.',
      itinerary: `
- Meet at Plemmirio Reserve entrance
- Nature walk to the best viewpoints
- Photography workshop and tips
- Sunset watching at the lighthouse
- Golden hour photography session
- Return with stunning photos
      `.trim(),
      category: 'nature',
      price: '35.00',
      duration: 150,
      maxGroupSize: 12,
      images: [],
      videos: [],
      meetingPoint: 'Plemmirio Marine Reserve, Siracusa',
      latitude: 37.0100,
      longitude: 15.3200,
      radius: 2.0,
      languages: ['it', 'de'],
      included: ['Professional photographer guide', 'Photography tips', 'Reserve entrance'],
      excluded: ['Camera equipment', 'Tripod', 'Transportation'],
      availableDates: [
        new Date('2025-12-01').toISOString(),
        new Date('2025-12-03').toISOString(),
        new Date('2025-12-06').toISOString(),
        new Date('2025-12-08').toISOString(),
      ],
      difficulty: 'moderate',
      cancellationPolicy: 'Free cancellation up to 24 hours before the tour. Weather-dependent.',
      i18n_payload: {
        it: {
          title: 'Tour Fotografico al Tramonto a Plemmirio',
          description: 'Cattura il magico tramonto presso la Riserva Marina di Plemmirio. Questo tour fotografico ti porta nei punti panoramici più scenografici lungo la costa, dove imparerai tecniche fotografiche godendo di viste mozzafiato sul tramonto mediterraneo.',
          itinerary: `
- Incontro all'ingresso della Riserva di Plemmirio
- Passeggiata naturalistica verso i migliori punti panoramici
- Workshop fotografico e consigli tecnici
- Osservazione del tramonto al faro
- Sessione fotografica dell'ora dorata
- Ritorno con foto spettacolari
          `.trim(),
          included: ['Guida fotografo professionista', 'Consigli fotografici', 'Ingresso alla riserva'],
          excluded: ['Attrezzatura fotografica', 'Treppiede', 'Trasporto'],
          cancellationPolicy: 'Cancellazione gratuita fino a 24 ore prima del tour. Dipendente dalle condizioni meteo.',
        },
        de: {
          title: 'Sonnenuntergangs-Fototour in Plemmirio',
          description: 'Halten Sie den magischen Sonnenuntergang im Meeresschutzgebiet Plemmirio fest. Diese Fototour führt Sie zu den schönsten Aussichtspunkten entlang der Küste, wo Sie Fototechniken lernen und atemberaubende Ausblicke auf den mediterranen Sonnenuntergang genießen.',
          itinerary: `
- Treffpunkt am Eingang des Plemmirio-Reservats
- Naturwanderung zu den besten Aussichtspunkten
- Fotografie-Workshop und Tipps
- Sonnenuntergang am Leuchtturm beobachten
- Goldene Stunde Fotosession
- Rückkehr mit beeindruckenden Fotos
          `.trim(),
          included: ['Professioneller Fotografen-Guide', 'Fotografie-Tipps', 'Eintritt ins Reservat'],
          excluded: ['Kameraausrüstung', 'Stativ', 'Transport'],
          cancellationPolicy: 'Kostenlose Stornierung bis 24 Stunden vor der Tour. Wetterabhängig.',
        },
      },
      status: 'active',
      approvalStatus: 'approved',
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✓ Tour created:', tour3.title);

    const [tour4] = await db.insert(tours).values({
      guideId: guide2.id,
      title: 'Food and History Tour',
      description: 'A delicious journey through Syracuse\'s history and cuisine! Taste traditional Sicilian street food while learning about the city\'s rich cultural heritage. Visit local markets, historic bakeries, and family-run trattorias.',
      itinerary: `
- Start at Ortigia Market
- Taste arancini and street food
- Visit historic bakery for cannoli
- Explore ancient Greek quarter
- Wine tasting at local enoteca
- End with gelato at Piazza Duomo
      `.trim(),
      category: 'food',
      price: '45.00',
      duration: 210,
      maxGroupSize: 10,
      images: [],
      videos: [],
      meetingPoint: 'Ortigia Market, Via de Benedictis, Siracusa',
      latitude: 37.0640,
      longitude: 15.2920,
      radius: 1.5,
      languages: ['es', 'it'],
      included: ['Food guide', 'All food tastings', 'Wine tasting', 'Recipe cards'],
      excluded: ['Additional drinks', 'Full meals', 'Gratuity'],
      availableDates: [
        new Date('2025-12-02').toISOString(),
        new Date('2025-12-04').toISOString(),
        new Date('2025-12-07').toISOString(),
        new Date('2025-12-09').toISOString(),
      ],
      difficulty: 'easy',
      cancellationPolicy: 'Free cancellation up to 48 hours before the tour starts.',
      i18n_payload: {
        es: {
          title: 'Tour de Comida e Historia',
          description: '¡Un viaje delicioso por la historia y la cocina de Siracusa! Prueba la comida callejera tradicional siciliana mientras aprendes sobre el rico patrimonio cultural de la ciudad. Visita mercados locales, panaderías históricas y trattorias familiares.',
          itinerary: `
- Inicio en el Mercado de Ortigia
- Degustación de arancini y comida callejera
- Visita a panadería histórica para cannoli
- Exploración del antiguo barrio griego
- Cata de vinos en enoteca local
- Final con gelato en Piazza Duomo
          `.trim(),
          included: ['Guía gastronómico', 'Todas las degustaciones', 'Cata de vinos', 'Tarjetas de recetas'],
          excluded: ['Bebidas adicionales', 'Comidas completas', 'Propinas'],
          cancellationPolicy: 'Cancelación gratuita hasta 48 horas antes del inicio del tour.',
        },
        it: {
          title: 'Tour Cibo e Storia',
          description: 'Un delizioso viaggio attraverso la storia e la cucina di Siracusa! Assaggia il tradizionale street food siciliano mentre scopri il ricco patrimonio culturale della città. Visita mercati locali, panifici storici e trattorie a conduzione familiare.',
          itinerary: `
- Partenza dal Mercato di Ortigia
- Assaggio di arancini e street food
- Visita al panificio storico per cannoli
- Esplorazione dell'antico quartiere greco
- Degustazione vini all'enoteca locale
- Conclusione con gelato a Piazza Duomo
          `.trim(),
          included: ['Guida gastronomica', 'Tutte le degustazioni', 'Degustazione vini', 'Schede ricette'],
          excluded: ['Bevande extra', 'Pasti completi', 'Mance'],
          cancellationPolicy: 'Cancellazione gratuita fino a 48 ore prima dell\'inizio del tour.',
        },
      },
      status: 'active',
      approvalStatus: 'approved',
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✓ Tour created:', tour4.title);

    const [tour5] = await db.insert(tours).values({
      guideId: guide1.id,
      title: 'Neapolis Archaeological Park Experience',
      description: 'Step back in time at the magnificent Neapolis Archaeological Park. Explore the ancient Greek Theatre, the Roman Amphitheatre, and the famous Ear of Dionysius cave. A must-see for history enthusiasts!',
      itinerary: `
- Meet at Park entrance
- Visit the Greek Theatre (5th century BC)
- Explore the Ear of Dionysius
- See the Roman Amphitheatre
- Walk through the Latomie quarries
- Visit the Altar of Hieron II
      `.trim(),
      category: 'historical',
      price: '25.00',
      duration: 120,
      maxGroupSize: 20,
      images: [],
      videos: [],
      meetingPoint: 'Neapolis Archaeological Park, Viale Paradiso, Siracusa',
      latitude: 37.0760,
      longitude: 15.2750,
      radius: 0.8,
      languages: ['en', 'it', 'fr'],
      included: ['Licensed archaeological guide', 'Park entrance ticket', 'Detailed map'],
      excluded: ['Audio guide', 'Museum entrance', 'Transportation'],
      availableDates: [
        new Date('2025-12-01').toISOString(),
        new Date('2025-12-03').toISOString(),
        new Date('2025-12-05').toISOString(),
        new Date('2025-12-08').toISOString(),
        new Date('2025-12-10').toISOString(),
      ],
      difficulty: 'easy',
      cancellationPolicy: 'Free cancellation up to 24 hours before the tour. Park tickets are non-refundable.',
      i18n_payload: {
        en: {
          title: 'Neapolis Archaeological Park Experience',
          description: 'Step back in time at the magnificent Neapolis Archaeological Park. Explore the ancient Greek Theatre, the Roman Amphitheatre, and the famous Ear of Dionysius cave. A must-see for history enthusiasts!',
          itinerary: `
- Meet at Park entrance
- Visit the Greek Theatre (5th century BC)
- Explore the Ear of Dionysius
- See the Roman Amphitheatre
- Walk through the Latomie quarries
- Visit the Altar of Hieron II
          `.trim(),
          included: ['Licensed archaeological guide', 'Park entrance ticket', 'Detailed map'],
          excluded: ['Audio guide', 'Museum entrance', 'Transportation'],
          cancellationPolicy: 'Free cancellation up to 24 hours before the tour. Park tickets are non-refundable.',
        },
        it: {
          title: 'Esperienza al Parco Archeologico della Neapolis',
          description: 'Fai un viaggio nel tempo al magnifico Parco Archeologico della Neapolis. Esplora l\'antico Teatro Greco, l\'Anfiteatro Romano e la famosa grotta dell\'Orecchio di Dionisio. Un must per gli appassionati di storia!',
          itinerary: `
- Incontro all'ingresso del Parco
- Visita del Teatro Greco (V secolo a.C.)
- Esplorazione dell'Orecchio di Dionisio
- Visita dell'Anfiteatro Romano
- Passeggiata nelle Latomie (cave antiche)
- Visita all'Altare di Ierone II
          `.trim(),
          included: ['Guida archeologica autorizzata', 'Biglietto d\'ingresso al Parco', 'Mappa dettagliata'],
          excluded: ['Audioguida', 'Ingresso al museo', 'Trasporto'],
          cancellationPolicy: 'Cancellazione gratuita fino a 24 ore prima del tour. I biglietti del parco non sono rimborsabili.',
        },
        fr: {
          title: 'Expérience au Parc Archéologique de Néapolis',
          description: 'Voyagez dans le temps au magnifique Parc Archéologique de Néapolis. Explorez l\'ancien Théâtre Grec, l\'Amphithéâtre Romain et la célèbre grotte de l\'Oreille de Denys. Un incontournable pour les passionnés d\'histoire !',
          itinerary: `
- Rendez-vous à l'entrée du Parc
- Visite du Théâtre Grec (5e siècle av. J.-C.)
- Exploration de l'Oreille de Denys
- Visite de l'Amphithéâtre Romain
- Promenade dans les Latomies (anciennes carrières)
- Visite de l'Autel de Hiéron II
          `.trim(),
          included: ['Guide archéologique agréé', 'Billet d\'entrée au Parc', 'Plan détaillé'],
          excluded: ['Audioguide', 'Entrée du musée', 'Transport'],
          cancellationPolicy: 'Annulation gratuite jusqu\'à 24 heures avant le tour. Les billets du parc ne sont pas remboursables.',
        },
      },
      status: 'active',
      approvalStatus: 'approved',
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✓ Tour created:', tour5.title);

    console.log('\n🏪 Creating services...');

    const [service1] = await db.insert(services).values({
      providerId: provider1.id,
      title: 'Bike Rental Syracuse',
      name: 'Bike Rental Syracuse',
      description: 'Rent a bike and explore Syracuse at your own pace! High-quality city bikes and e-bikes available. Perfect for discovering Ortigia and the coastal paths. Helmets, locks, and maps included.',
      category: 'transport',
      type: 'transport',
      price: '€15/day',
      images: [],
      address: 'Via Roma 45, 96100 Siracusa SR, Italy',
      latitude: 37.0755,
      longitude: 15.2866,
      languages: ['it', 'en'],
      operatingHours: 'Mon-Sun: 8:00 AM - 8:00 PM',
      i18n_payload: {
        en: {
          title: 'Bike Rental Syracuse',
          description: 'Rent a bike and explore Syracuse at your own pace! High-quality city bikes and e-bikes available. Perfect for discovering Ortigia and the coastal paths. Helmets, locks, and maps included.',
        },
        it: {
          title: 'Noleggio Bici Siracusa',
          description: 'Noleggia una bici ed esplora Siracusa al tuo ritmo! Disponibili biciclette da città e e-bike di alta qualità. Perfetto per scoprire Ortigia e i percorsi costieri. Caschi, lucchetti e mappe inclusi.',
        },
      },
      approvalStatus: 'approved',
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✓ Service created:', service1.name);

    const [service2] = await db.insert(services).values({
      providerId: provider1.id,
      title: 'Kayak Tour Ognina',
      name: 'Kayak Tour Ognina',
      description: 'Explore the beautiful coast of Ognina by kayak! Guided kayak tours through crystal-clear waters, sea caves, and hidden beaches. Suitable for beginners. All equipment provided, no experience necessary.',
      category: 'adventure',
      type: 'adventure',
      price: '€40',
      images: [],
      address: 'Ognina Beach, 96100 Siracusa SR, Italy',
      latitude: 37.0500,
      longitude: 15.3100,
      languages: ['en', 'fr'],
      operatingHours: 'Daily: 9:00 AM - 6:00 PM (weather permitting)',
      i18n_payload: {
        en: {
          title: 'Kayak Tour Ognina',
          description: 'Explore the beautiful coast of Ognina by kayak! Guided kayak tours through crystal-clear waters, sea caves, and hidden beaches. Suitable for beginners. All equipment provided, no experience necessary.',
        },
        fr: {
          title: 'Excursion en Kayak à Ognina',
          description: 'Explorez la magnifique côte d\'Ognina en kayak ! Visites guidées en kayak à travers des eaux cristallines, des grottes marines et des plages cachées. Adapté aux débutants. Tout l\'équipement fourni, aucune expérience nécessaire.',
        },
      },
      approvalStatus: 'approved',
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✓ Service created:', service2.name);

    const [service3] = await db.insert(services).values({
      providerId: provider2.id,
      title: 'Sicilian Street Food Experience',
      name: 'Sicilian Street Food Experience',
      description: 'Authentic Sicilian street food experience! Taste the best arancini, panelle, sfincione, and cannoli in Syracuse. Our food tour takes you to local favorites and hidden gems. Perfect for foodies!',
      category: 'food',
      type: 'food',
      price: '€20',
      images: [],
      address: 'Piazza Duomo 12, 96100 Siracusa SR, Italy',
      latitude: 37.0590,
      longitude: 15.2935,
      languages: ['it', 'de'],
      operatingHours: 'Mon-Sat: 11:00 AM - 10:00 PM, Sun: 12:00 PM - 9:00 PM',
      specialOffer: '10% discount for groups of 4 or more!',
      i18n_payload: {
        it: {
          title: 'Esperienza Street Food Siciliano',
          description: 'Autentica esperienza di street food siciliano! Assaggia i migliori arancini, panelle, sfincione e cannoli di Siracusa. Il nostro tour gastronomico ti porta ai locali preferiti e alle gemme nascoste. Perfetto per i buongustai!',
          specialOffer: 'Sconto del 10% per gruppi di 4 o più persone!',
        },
        de: {
          title: 'Sizilianisches Streetfood-Erlebnis',
          description: 'Authentisches sizilianisches Streetfood-Erlebnis! Probieren Sie die besten Arancini, Panelle, Sfincione und Cannoli in Syrakus. Unsere kulinarische Tour führt Sie zu lokalen Favoriten und versteckten Perlen. Perfekt für Feinschmecker!',
          specialOffer: '10% Rabatt für Gruppen ab 4 Personen!',
        },
      },
      approvalStatus: 'approved',
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✓ Service created:', service3.name);

    const [service4] = await db.insert(services).values({
      providerId: provider2.id,
      title: 'Sicilian Cooking Class',
      name: 'Sicilian Cooking Class',
      description: 'Learn to cook authentic Sicilian dishes with our expert chefs! Hands-on cooking class where you\'ll prepare traditional recipes like pasta alla Norma, caponata, and cassata. Includes wine pairing and recipe booklet.',
      category: 'food',
      type: 'food',
      price: '€60',
      images: [],
      address: 'Piazza Duomo 12, 96100 Siracusa SR, Italy',
      latitude: 37.0590,
      longitude: 15.2935,
      languages: ['es', 'it'],
      operatingHours: 'Classes: Tue, Thu, Sat at 10:00 AM and 4:00 PM',
      i18n_payload: {
        es: {
          title: 'Clase de Cocina Siciliana',
          description: '¡Aprende a cocinar platos sicilianos auténticos con nuestros chefs expertos! Clase de cocina práctica donde prepararás recetas tradicionales como pasta alla Norma, caponata y cassata. Incluye maridaje de vinos y libro de recetas.',
        },
        it: {
          title: 'Corso di Cucina Siciliana',
          description: 'Impara a cucinare autentici piatti siciliani con i nostri chef esperti! Corso di cucina pratico dove preparerai ricette tradizionali come pasta alla Norma, caponata e cassata. Include abbinamento vini e ricettario.',
        },
      },
      approvalStatus: 'approved',
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✓ Service created:', service4.name);

    const [service5] = await db.insert(services).values({
      providerId: provider1.id,
      title: 'Airport Transfer Catania → Syracuse',
      name: 'Airport Transfer Catania → Syracuse',
      description: 'Comfortable and reliable airport transfer from Catania Airport (CTA) to Syracuse. Professional drivers, modern vehicles, door-to-door service. Fixed price, no hidden costs. Meet & greet service included.',
      category: 'transport',
      type: 'transport',
      price: '€50',
      images: [],
      address: 'Catania Airport - Fontanarossa (CTA)',
      latitude: 37.4668,
      longitude: 15.0664,
      languages: ['en', 'it', 'fr'],
      operatingHours: '24/7 service',
      i18n_payload: {
        en: {
          title: 'Airport Transfer Catania → Syracuse',
          description: 'Comfortable and reliable airport transfer from Catania Airport (CTA) to Syracuse. Professional drivers, modern vehicles, door-to-door service. Fixed price, no hidden costs. Meet & greet service included.',
        },
        it: {
          title: 'Transfer Aeroporto Catania → Siracusa',
          description: 'Transfer aeroportuale comodo e affidabile dall\'Aeroporto di Catania (CTA) a Siracusa. Autisti professionisti, veicoli moderni, servizio porta a porta. Prezzo fisso, nessun costo nascosto. Servizio meet & greet incluso.',
        },
        fr: {
          title: 'Transfert Aéroport Catane → Syracuse',
          description: 'Transfert aéroport confortable et fiable de l\'aéroport de Catane (CTA) à Syracuse. Chauffeurs professionnels, véhicules modernes, service porte-à-porte. Prix fixe, pas de frais cachés. Service d\'accueil inclus.',
        },
      },
      approvalStatus: 'approved',
      approvedBy: adminUser.id,
      approvedAt: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    console.log('✓ Service created:', service5.name);

    console.log('\n✅ Database seeded successfully!');
    console.log(`
📊 Seed Summary:
- Users: 10 (1 Admin, 2 Guides, 2 Providers, 5 Tourists)
- Tours: 5 (all in Siracusa, Sicily)
- Services: 5 (all in Siracusa, Sicily)

🌍 Location: Siracusa, Sicily, Italy
📍 Coordinates: 37.0755°N, 15.2866°E

You can now log in with:
- Admin: admin@test.com
- Guide 1: guide1@test.com (Marco Rossi)
- Guide 2: guide2@test.com (Giulia Bianchi)
- Provider 1: provider1@test.com (Sicilian Adventures)
- Provider 2: provider2@test.com (Taste of Sicily)
- Tourists: tourist1@test.com through tourist5@test.com
    `);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
