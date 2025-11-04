import { db } from "../db";
import { users, services } from "../../shared/schema";

async function seedServices() {
  console.log("🌍 Avvio popolamento database TourConnect (Servizi + Fornitori)...");

  // 1️⃣ Creazione di 5 fornitori di servizi (providers)
  // Nota: Questi utenti dovranno fare login via OAuth, non hanno password
  const providerData = [
    {
      email: "info@syrrentals.it",
      firstName: "Syr",
      lastName: "Rentals",
      role: "provider",
      approvalStatus: "approved",
      businessName: "Syr Rentals",
      businessType: "transport",
      businessAddress: "Via Corso Umberto I, 22, 96100 Siracusa SR",
      bio: "Noleggio scooter e auto nel cuore di Siracusa. Mobilità semplice e conveniente per i turisti!",
      phone: "+39 0931 123456",
      city: "Siracusa",
      country: "Italia",
      latitude: 37.0755,
      longitude: 15.2866,
      website: "https://www.syrrentals.it",
    },
    {
      email: "booking@ortigiaboat.it",
      firstName: "Ortigia",
      lastName: "Boat",
      role: "provider",
      approvalStatus: "approved",
      businessName: "Ortigia Boat Experience",
      businessType: "other",
      businessAddress: "Porto Piccolo, Lungomare di Ortigia, 96100 Siracusa SR",
      bio: "Esperienze in barca tra Ortigia e il Plemmirio con skipper professionisti e guide esperte.",
      phone: "+39 0931 234567",
      city: "Siracusa",
      country: "Italia",
      latitude: 37.0651,
      longitude: 15.2906,
      website: "https://www.ortigiaboat.it",
    },
    {
      email: "info@etnatransfer.com",
      firstName: "Etna",
      lastName: "Transfer",
      role: "provider",
      approvalStatus: "approved",
      businessName: "Etna Transfer & Tours",
      businessType: "transport",
      businessAddress: "Via Etnea, 150, 95131 Catania CT",
      bio: "Trasferimenti privati e tour organizzati tra Siracusa, Catania ed Etna Sud con autisti professionali.",
      phone: "+39 095 345678",
      city: "Catania",
      country: "Italia",
      latitude: 37.5079,
      longitude: 15.0830,
      website: "https://www.etnatransfer.com",
    },
    {
      email: "info@siciliataste.it",
      firstName: "Sicilia",
      lastName: "Taste",
      role: "provider",
      approvalStatus: "approved",
      businessName: "Sicilia Taste Experience",
      businessType: "restaurant",
      businessAddress: "Contrada Vendicari, 96017 Noto SR",
      bio: "Esperienze gastronomiche autentiche in antiche masserie siciliane con produttori locali certificati.",
      phone: "+39 0931 456789",
      city: "Noto",
      country: "Italia",
      latitude: 36.8927,
      longitude: 15.0707,
      website: "https://www.siciliataste.it",
    },
    {
      email: "guide@visitsiracusa.it",
      firstName: "Guide",
      lastName: "Siracusa",
      role: "provider",
      approvalStatus: "approved",
      businessName: "Guide Siracusa Official",
      businessType: "other",
      businessAddress: "Piazza Duomo, 14, 96100 Siracusa SR",
      bio: "Visite guidate certificate in italiano, inglese, francese e tedesco ai luoghi UNESCO di Siracusa.",
      phone: "+39 0931 567890",
      city: "Siracusa",
      country: "Italia",
      latitude: 37.0603,
      longitude: 15.2933,
      website: "https://www.visitsiracusa.it",
    },
  ];

  console.log("👥 Creazione 5 utenti fornitori di servizi...");
  const providers = await db.insert(users).values(providerData).returning();
  console.log(`✅ Creati ${providers.length} fornitori con approval status 'approved'`);

  // 2️⃣ Creazione di 5 servizi collegati ai fornitori
  const serviceData = [
    {
      providerId: providers[0].id,
      title: "Noleggio Scooter Giornaliero 125cc",
      name: "Noleggio Scooter Giornaliero 125cc",
      description: "Scopri Siracusa e dintorni in totale libertà con uno scooter 125cc. Caschi, bauletti e assicurazione compresi nel prezzo!",
      category: "Mobilità",
      type: "transport",
      price: "35",
      priceRange: "$",
      address: "Via Corso Umberto I, 22, 96100 Siracusa SR",
      latitude: 37.0755,
      longitude: 15.2866,
      operatingHours: "Lun-Dom: 08:00-20:00",
      images: ["https://images.unsplash.com/photo-1598970434795-0c54fe7c0642"],
      specialOffer: "Sconto 10% per noleggi superiori a 3 giorni",
      approvalStatus: "approved",
      isActive: true,
    },
    {
      providerId: providers[1].id,
      title: "Mini Crociera Ortigia & Plemmirio",
      name: "Mini Crociera Ortigia & Plemmirio",
      description: "Escursione in barca di 2 ore tra le grotte marine e le acque cristalline di Ortigia. Include aperitivo a bordo e attrezzatura snorkeling.",
      category: "Esperienze",
      type: "other",
      price: "55",
      priceRange: "$$",
      address: "Porto Piccolo, Lungomare di Ortigia, 96100 Siracusa SR",
      latitude: 37.0651,
      longitude: 15.2906,
      operatingHours: "Partenze: 10:00, 14:00, 17:00 (Lun-Dom)",
      images: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e"],
      specialOffer: "Gratis aperitivo siciliano incluso",
      approvalStatus: "approved",
      isActive: true,
    },
    {
      providerId: providers[2].id,
      title: "Transfer Privato Siracusa - Etna Sud",
      name: "Transfer Privato Siracusa - Etna Sud",
      description: "Servizio transfer diretto con autista professionista, auto climatizzata Mercedes e acqua in omaggio. Durata circa 1h 30min.",
      category: "Trasporti",
      type: "transport",
      price: "90",
      priceRange: "$$",
      address: "Via Etnea, 150, 95131 Catania CT",
      latitude: 37.5079,
      longitude: 15.0830,
      operatingHours: "Disponibile 24/7 con prenotazione",
      images: ["https://images.unsplash.com/photo-1500048993953-d23a436266cf"],
      specialOffer: "Transfer aeroporto Catania-Fontanarossa incluso su richiesta",
      approvalStatus: "approved",
      isActive: true,
    },
    {
      providerId: providers[3].id,
      title: "Tour Enogastronomico in Masseria Storica",
      name: "Tour Enogastronomico in Masseria Storica",
      description: "Visita una masseria tipica del '700 siciliano e degusta vini DOC, formaggi artigianali, oli extravergini e dolci della tradizione.",
      category: "Gastronomia",
      type: "restaurant",
      price: "60",
      priceRange: "$$",
      address: "Contrada Vendicari, 96017 Noto SR",
      latitude: 36.8927,
      longitude: 15.0707,
      operatingHours: "Mar-Dom: 10:00-18:00 (solo su prenotazione)",
      images: ["https://images.unsplash.com/photo-1504674900247-0877df9cc836"],
      specialOffer: "Include degustazione di 5 vini locali e lunch box",
      approvalStatus: "approved",
      isActive: true,
    },
    {
      providerId: providers[4].id,
      title: "Tour Guidato Parco Archeologico Neapolis",
      name: "Tour Guidato Parco Archeologico Neapolis",
      description: "Visita guidata completa al Teatro Greco, Orecchio di Dionisio, Anfiteatro Romano e Latomie del Paradiso con archeologo certificato.",
      category: "Cultura",
      type: "other",
      price: "25",
      priceRange: "$",
      address: "Piazza Duomo, 14, 96100 Siracusa SR",
      latitude: 37.0603,
      longitude: 15.2933,
      operatingHours: "Lun-Dom: 09:00, 11:00, 15:00, 17:00",
      images: ["https://images.unsplash.com/photo-1560264418-c4445382edbc"],
      specialOffer: "Biglietto d'ingresso al Parco incluso nel prezzo",
      approvalStatus: "approved",
      isActive: true,
    },
  ];

  console.log("🧭 Creazione 5 servizi demo localizzati a Siracusa e provincia...");
  const createdServices = await db.insert(services).values(serviceData).returning();
  console.log(`✅ Creati ${createdServices.length} servizi con approval status 'approved'`);

  console.log("\n📊 RIEPILOGO SEEDING:");
  console.log("┌─────────────────────────────────────────┬────────────┬──────────────┬──────────┐");
  console.log("│ Fornitore                               │ Servizio   │ Prezzo (€)   │ Città    │");
  console.log("├─────────────────────────────────────────┼────────────┼──────────────┼──────────┤");
  console.log("│ Syr Rentals                             │ Scooter    │ 35           │ Siracusa │");
  console.log("│ Ortigia Boat Experience                 │ Crociera   │ 55           │ Siracusa │");
  console.log("│ Etna Transfer & Tours                   │ Transfer   │ 90           │ Catania  │");
  console.log("│ Sicilia Taste Experience                │ Gastronomia│ 60           │ Noto     │");
  console.log("│ Guide Siracusa Official                 │ Tour UNESCO│ 25           │ Siracusa │");
  console.log("└─────────────────────────────────────────┴────────────┴──────────────┴──────────┘");

  console.log("\n✅ Seeding completato con successo!");
  console.log("🔍 I servizi sono ora visibili in:");
  console.log("   - Pagina /search con ricerca e filtri");
  console.log("   - Mappa interattiva con marker geolocalizzati");
  console.log("   - Dashboard provider per gestione");
  console.log("\n💡 Per testare: cerca 'Siracusa', 'boat', 'food' o filtra per categoria!");

  process.exit(0);
}

// Esegui seeding con gestione errori
seedServices().catch((err) => {
  console.error("❌ Errore durante il seeding:", err);
  console.error("\nStack trace:", err.stack);
  process.exit(1);
});
