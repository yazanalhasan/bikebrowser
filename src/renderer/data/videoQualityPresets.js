export const VIDEO_QUALITY_PRESETS = [
  {
    id: 'bike-mechanics',
    label: 'Bike Mechanics',
    tileTitle: 'Drivetrain Service',
    tileSubtitle: 'Cassette, chain & shifting work',
    tileEmoji: '🚴',
    tileColor: 'from-blue-400 to-blue-600',
    query: 'Park Tool cassette removal installation chain replacement derailleur adjustment drivetrain maintenance service',
    helper: 'Park Tool-style cassette, chain, and shifting service'
  },
  {
    id: 'brake-systems',
    label: 'Brake Systems',
    tileTitle: 'Brake Systems',
    tileSubtitle: 'Pads, rotors, calipers & bleed basics',
    tileEmoji: '🛑',
    tileColor: 'from-sky-400 to-cyan-600',
    query: 'Park Tool bicycle brake adjustment disc brake pads rotor hydraulic bleed torque',
    helper: 'Brake pads, rotors, calipers, and hydraulic service'
  },
  {
    id: 'ebike-power',
    label: 'E-Bike Power',
    tileTitle: 'E-Bike Power',
    tileSubtitle: 'Motors, batteries & controllers',
    tileEmoji: '⚡',
    tileColor: 'from-green-400 to-green-600',
    query: 'Johnny Nerd Out Grin Technologies ebike controller battery motor wiring troubleshooting conversion',
    helper: 'Motors, controllers, batteries, and wiring'
  },
  {
    id: 'dirt-bike-shop',
    label: 'Dirt Bike Shop',
    tileTitle: 'Dirt Bike Shop',
    tileSubtitle: 'Engines, suspension & rebuilds',
    tileEmoji: '🏍️',
    tileColor: 'from-orange-400 to-orange-600',
    query: 'Rocky Mountain ATV MC dirt bike maintenance engine suspension rebuild troubleshooting tutorial',
    helper: 'Maintenance, suspension, and rebuilds'
  },
  {
    id: 'electrical-diagnostics',
    label: 'Electrical Diagnostics',
    tileTitle: 'Electrical Diagnostics',
    tileSubtitle: 'MOSFETs, capacitors & controllers',
    tileEmoji: '🔌',
    tileColor: 'from-teal-400 to-cyan-600',
    query: 'Learn Electronics Repair Big Clive ebike controller MOSFET capacitor battery diagnostics repair',
    helper: 'Failure analysis and electrical troubleshooting'
  },
  {
    id: 'mtb-builds',
    label: 'MTB Builds',
    tileTitle: 'MTB Builds',
    tileSubtitle: 'Trail builds, suspension & stress tests',
    tileEmoji: '⛰️',
    tileColor: 'from-purple-400 to-purple-600',
    query: 'Berm Peak mountain bike build suspension drivetrain brakes trail repair setup',
    helper: 'Mountain bike builds and real-world testing'
  },
  {
    id: 'build-planning',
    label: 'Build Planning',
    tileTitle: 'Build Planning',
    tileSubtitle: 'Parts, tools & compatibility',
    tileEmoji: '🔧',
    tileColor: 'from-yellow-400 to-yellow-600',
    query: 'Park Tool Johnny Nerd Out bike build parts compatibility tools torque step by step',
    helper: 'Tools, compatibility, and step-by-step builds'
  },
  {
    id: 'shop-class-lessons',
    label: 'Shop Class Lessons',
    tileTitle: 'Shop Class Lessons',
    tileSubtitle: 'Repair training inside BikeBrowser',
    tileEmoji: '🏫',
    tileColor: 'from-slate-400 to-slate-600',
    query: 'RJ The Bike Guy Park Tool bicycle motorcycle repair maintenance shop class training',
    helper: 'Shop-class style repair and maintenance practice'
  }
];

export const VIDEO_TOPIC_TILES = VIDEO_QUALITY_PRESETS.map((preset) => ({
  id: preset.id,
  title: preset.tileTitle || preset.label,
  subtitle: preset.tileSubtitle || preset.helper,
  emoji: preset.tileEmoji || '🎥',
  query: preset.query,
  color: preset.tileColor || 'from-blue-400 to-blue-600'
}));
