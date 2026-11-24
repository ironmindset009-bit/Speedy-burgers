export type PetGender = 'male' | 'female';

export type PetSpecies =
  | 'shadow_tux'
  | 'pink_hero'
  | 'kid_speed'
  | 'reverse_bolt'
  | 'blue_dash'
  | 'crimson_bolt';

export type ClothingCollection =
  | 'all'
  | 'uniform'
  | 'godspeed'
  | 'casual'
  | 'sport'
  | 'special';

export type TopSilhouette =
  | 'polo'
  | 'oversized_tee'
  | 'graphic_tee'
  | 'hoodie'
  | 'zip_hoodie'
  | 'crewneck'
  | 'longsleeve'
  | 'button_up'
  | 'sleeveless'
  | 'jersey';

export type BottomSilhouette =
  | 'shorts'
  | 'cargo_shorts'
  | 'denim_shorts'
  | 'athletic_shorts'
  | 'joggers'
  | 'sweatpants'
  | 'jeans'
  | 'cargo_pants'
  | 'trousers';

export type FootwearSilhouette =
  | 'slides'
  | 'sandals'
  | 'low_sneakers'
  | 'high_tops'
  | 'chunky_sneakers'
  | 'minimal_sneakers'
  | 'designer_casual';

export type AccessoryId =
  | 'baseball_cap'
  | 'bucket_hat'
  | 'beanie'
  | 'sunglasses'
  | 'watch'
  | 'necklace'
  | 'backpack'
  | 'crossbody_bag'
  | 'headphones'
  | 'bracelet';

export interface SpeedyPetConfig {
  id: string;
  name: string;
  species: PetSpecies;
  gender: PetGender;
  furColor: string;
  hairStyle: string;
  hairColor: string;
  eyeStyle: string;
  eyeColor: string;
  eyebrowStyle: string;
  expression: string;
  facialHair: string;
  topId: string;
  bottomId: string;
  footwearId: string;
  accessories: AccessoryId[];
  lastFedAt: number;
  happiness: number;
  streakDays: number;
  totalMealsEaten: number;
  xp: number;
  level: number;
  lastMealName: string;
  lastMealItems: string[];
}

export interface FurColorOption {
  id: string;
  label: string;
  hex: string;
  muzzleHex: string;
}

export interface PetSpeciesOption {
  id: PetSpecies;
  label: string;
  tagline: string;
  defaultFur: string;
  voicePitch: number;
}

export interface HairstyleOption {
  id: string;
  label: string;
  recommended?: PetGender | 'both';
}

export interface ClothingItemDef<S extends string = string> {
  id: string;
  name: string;
  collection: Exclude<ClothingCollection, 'all'>;
  silhouette: S;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  graphicTag:
    | 'speedy_crest'
    | 'speedy_burger_art'
    | 'speedy_varsity'
    | 'godspeed_wing'
    | 'deus_vitesse'
    | 'dv_crest'
    | 'plain'
    | 'sunset_graphic'
    | 'sport_07'
    | 'sport_10'
    | 'christmas'
    | 'halloween'
    | 'summer'
    | 'valentines'
    | 'jamaica';
}

export interface AccessoryDef {
  id: AccessoryId;
  name: string;
  slot: 'head' | 'eyewear' | 'neck' | 'wrist_left' | 'wrist_right' | 'back' | 'body' | 'ears';
  swatch: string;
}

export const PET_SPECIES: PetSpeciesOption[] = [
  {
    id: 'shadow_tux',
    label: 'Shadow Tux',
    tagline: 'Black Tux · Red Eyes · Gold Crest',
    defaultFur: 'cocoa',
    voicePitch: 0.94,
  },
  {
    id: 'pink_hero',
    label: 'Pink Hammer',
    tagline: 'Pink Quills · Piko Hammer · Red Dress',
    defaultFur: 'cream',
    voicePitch: 1.54,
  },
  {
    id: 'kid_speed',
    label: 'Kid Bolt',
    tagline: 'Yellow & Red Cowl · Speedster Suit',
    defaultFur: 'caramel',
    voicePitch: 1.26,
  },
  {
    id: 'reverse_bolt',
    label: 'Reverse Bolt',
    tagline: 'Yellow Cowl · Crimson Bolt · Wings',
    defaultFur: 'golden',
    voicePitch: 0.98,
  },
  {
    id: 'blue_dash',
    label: 'Blue Dash',
    tagline: 'Blue Quills · Red Sneakers · Hero',
    defaultFur: 'tuxedo_gray',
    voicePitch: 1.38,
  },
  {
    id: 'crimson_bolt',
    label: 'Crimson Bolt',
    tagline: 'Crimson Helmet · Gold Bolt · Wings',
    defaultFur: 'cream',
    voicePitch: 1.15,
  },
];

export const FUR_COLORS: FurColorOption[] = [
  { id: 'snow', label: 'Snow White', hex: '#F6F2EA', muzzleHex: '#FFFDF9' },
  { id: 'cream', label: 'Vanilla Cream', hex: '#F3DFBE', muzzleHex: '#FFF8EC' },
  { id: 'golden', label: 'Golden Honey', hex: '#E8A849', muzzleHex: '#FCE6BC' },
  { id: 'ginger', label: 'Ginger Fox', hex: '#D96D34', muzzleHex: '#FAE5D3' },
  { id: 'caramel', label: 'Caramel Tan', hex: '#C68854', muzzleHex: '#F7E1C8' },
  { id: 'cocoa', label: 'Cocoa Brown', hex: '#7D4B2E', muzzleHex: '#DEC2AA' },
  { id: 'tuxedo_gray', label: 'Tom Silver', hex: '#858E99', muzzleHex: '#ECEEF2' },
  { id: 'charcoal', label: 'Midnight Fur', hex: '#2D3038', muzzleHex: '#B6BBC4' },
];

export const HAIR_COLORS: Array<{ id: string; label: string; hex: string }> = [
  { id: 'jet_black', label: 'Jet Black', hex: '#181414' },
  { id: 'espresso', label: 'Espresso', hex: '#342219' },
  { id: 'chestnut', label: 'Chestnut', hex: '#6B3E26' },
  { id: 'honey', label: 'Honey Blonde', hex: '#D4A14E' },
  { id: 'burgundy', label: 'Burgundy', hex: '#7A1C24' },
  { id: 'platinum', label: 'Platinum', hex: '#EAE4DA' },
  { id: 'speedy_red', label: 'Speedy Red', hex: '#E1000F' },
  { id: 'speedy_gold', label: 'Speedy Gold', hex: '#FDB105' },
];

export const HAIRSTYLES: HairstyleOption[] = [
  { id: 'low_fade', label: 'Low Fade', recommended: 'male' },
  { id: 'high_fade', label: 'High Fade', recommended: 'male' },
  { id: 'afro', label: 'Afro', recommended: 'both' },
  { id: 'short_curls', label: 'Short Curls', recommended: 'both' },
  { id: 'braids', label: 'Braids', recommended: 'both' },
  { id: 'dreadlocks', label: 'Dreadlocks', recommended: 'both' },
  { id: 'waves', label: 'Waves', recommended: 'male' },
  { id: 'buzz_cut', label: 'Buzz Cut', recommended: 'male' },
  { id: 'long_straight', label: 'Long Straight', recommended: 'female' },
  { id: 'curly_hair', label: 'Curly Hair', recommended: 'female' },
  { id: 'ponytail', label: 'Ponytail', recommended: 'female' },
  { id: 'braided_styles', label: 'Braided Styles', recommended: 'female' },
];

export const EYE_STYLES = [
  { id: 'classic', label: 'Classic Friendly' },
  { id: 'almond', label: 'Stylish Almond' },
  { id: 'bright_wide', label: 'Bright & Wide' },
  { id: 'chill', label: 'Relaxed Chill' },
  { id: 'sparkle', label: 'Starlight Eyes' },
];

export const EYE_COLORS: Array<{ id: string; label: string; hex: string }> = [
  { id: 'dark_brown', label: 'Dark Brown', hex: '#3A2116' },
  { id: 'amber', label: 'Hazel Amber', hex: '#8B5A2B' },
  { id: 'emerald', label: 'Emerald Green', hex: '#287A52' },
  { id: 'ocean', label: 'Ocean Blue', hex: '#2A6BB5' },
  { id: 'slate', label: 'Cool Gray', hex: '#5A6775' },
  { id: 'violet', label: 'Deep Violet', hex: '#5A3A94' },
];

export const EYEBROW_STYLES = [
  { id: 'natural', label: 'Natural' },
  { id: 'thick', label: 'Bold Thick' },
  { id: 'arched', label: 'Clean Arched' },
  { id: 'trimmed', label: 'Sharp Fade' },
  { id: 'expressive', label: 'Playful Raised' },
];

export const EXPRESSIONS = [
  { id: 'happy', label: 'Happy Smile' },
  { id: 'grin', label: 'Big Grin' },
  { id: 'cool', label: 'Cool Smirk' },
  { id: 'excited', label: 'Excited' },
  { id: 'wink', label: 'Playful Wink' },
  { id: 'chill', label: 'Calm Chill' },
];

export const FACIAL_HAIR_OPTIONS = [
  { id: 'none', label: 'Clean Shaven' },
  { id: 'stubble', label: 'Light Stubble' },
  { id: 'mustache', label: 'Classic Mustache' },
  { id: 'goatee', label: 'Clean Goatee' },
  { id: 'full_beard', label: 'Full Beard' },
];

export const TOP_ITEMS: ClothingItemDef<TopSilhouette>[] = [
  // Category A: Speedy Burger Uniform (5)
  {
    id: 'sb_polo',
    name: 'Speedy Burger Polo',
    collection: 'uniform',
    silhouette: 'polo',
    primaryColor: '#E1000F',
    secondaryColor: '#FDB105',
    accentColor: '#FFFFFF',
    graphicTag: 'speedy_crest',
  },
  {
    id: 'sb_oversized_tee',
    name: 'Speedy Oversized Tee',
    collection: 'uniform',
    silhouette: 'oversized_tee',
    primaryColor: '#FFF7E8',
    secondaryColor: '#E1000F',
    accentColor: '#FDB105',
    graphicTag: 'speedy_crest',
  },
  {
    id: 'sb_graphic_tee',
    name: 'Speedy Graphic Tee',
    collection: 'uniform',
    silhouette: 'graphic_tee',
    primaryColor: '#2B110B',
    secondaryColor: '#FDB105',
    accentColor: '#E1000F',
    graphicTag: 'speedy_burger_art',
  },
  {
    id: 'sb_hoodie',
    name: 'Speedy Burger Hoodie',
    collection: 'uniform',
    silhouette: 'hoodie',
    primaryColor: '#E1000F',
    secondaryColor: '#FDB105',
    accentColor: '#3A0B08',
    graphicTag: 'speedy_varsity',
  },
  {
    id: 'sb_crewneck',
    name: 'Speedy Crewneck',
    collection: 'uniform',
    silhouette: 'crewneck',
    primaryColor: '#FDB105',
    secondaryColor: '#E1000F',
    accentColor: '#3A0B08',
    graphicTag: 'speedy_varsity',
  },

  // Category B: Godspeed / Deus Vitesse Collection (5)
  {
    id: 'gd_graphic_tee',
    name: 'Godspeed Graphic Tee',
    collection: 'godspeed',
    silhouette: 'graphic_tee',
    primaryColor: '#161618',
    secondaryColor: '#EDE7DC',
    accentColor: '#D62828',
    graphicTag: 'godspeed_wing',
  },
  {
    id: 'dv_oversized_tee',
    name: 'Deus Vitesse Oversized Tee',
    collection: 'godspeed',
    silhouette: 'oversized_tee',
    primaryColor: '#2E2D32',
    secondaryColor: '#F5EFE6',
    accentColor: '#E5A93B',
    graphicTag: 'deus_vitesse',
  },
  {
    id: 'gd_hoodie',
    name: 'Godspeed Hoodie',
    collection: 'godspeed',
    silhouette: 'hoodie',
    primaryColor: '#141316',
    secondaryColor: '#E1000F',
    accentColor: '#EFECE6',
    graphicTag: 'godspeed_wing',
  },
  {
    id: 'dv_zip_hoodie',
    name: 'Deus Vitesse Zip Hoodie',
    collection: 'godspeed',
    silhouette: 'zip_hoodie',
    primaryColor: '#22242A',
    secondaryColor: '#D4AF37',
    accentColor: '#F5F2EB',
    graphicTag: 'dv_crest',
  },
  {
    id: 'gd_longsleeve',
    name: 'Godspeed Long-Sleeve',
    collection: 'godspeed',
    silhouette: 'longsleeve',
    primaryColor: '#EFEAE0',
    secondaryColor: '#171717',
    accentColor: '#D62828',
    graphicTag: 'deus_vitesse',
  },

  // Category C: Casual Collection (5)
  {
    id: 'cas_polo',
    name: 'Basic Polo Shirt',
    collection: 'casual',
    silhouette: 'polo',
    primaryColor: '#29587A',
    secondaryColor: '#FFFFFF',
    accentColor: '#D9E4EC',
    graphicTag: 'plain',
  },
  {
    id: 'cas_oversized_tee',
    name: 'Plain Oversized Tee',
    collection: 'casual',
    silhouette: 'oversized_tee',
    primaryColor: '#C9BBA8',
    secondaryColor: '#3A322B',
    accentColor: '#EAE0D2',
    graphicTag: 'plain',
  },
  {
    id: 'cas_graphic_tee',
    name: 'Sunset Graphic Tee',
    collection: 'casual',
    silhouette: 'graphic_tee',
    primaryColor: '#FAF5EC',
    secondaryColor: '#E86A33',
    accentColor: '#FDB105',
    graphicTag: 'sunset_graphic',
  },
  {
    id: 'cas_button_up',
    name: 'Casual Button-Up',
    collection: 'casual',
    silhouette: 'button_up',
    primaryColor: '#6D8C7A',
    secondaryColor: '#F4F1EA',
    accentColor: '#3B4D42',
    graphicTag: 'plain',
  },
  {
    id: 'cas_sleeveless',
    name: 'Casual Sleeveless Tank',
    collection: 'casual',
    silhouette: 'sleeveless',
    primaryColor: '#2C2C30',
    secondaryColor: '#FFFFFF',
    accentColor: '#9E9EA8',
    graphicTag: 'plain',
  },

  // Category D: Sport Collection (5)
  {
    id: 'spt_football_jersey',
    name: 'Football Jersey',
    collection: 'sport',
    silhouette: 'jersey',
    primaryColor: '#106B47',
    secondaryColor: '#FDB105',
    accentColor: '#FFFFFF',
    graphicTag: 'sport_10',
  },
  {
    id: 'spt_basketball_jersey',
    name: 'Basketball Jersey',
    collection: 'sport',
    silhouette: 'sleeveless',
    primaryColor: '#C81E2B',
    secondaryColor: '#111111',
    accentColor: '#FDB105',
    graphicTag: 'sport_07',
  },
  {
    id: 'spt_athletic_tee',
    name: 'Athletic Performance Tee',
    collection: 'sport',
    silhouette: 'graphic_tee',
    primaryColor: '#1E3A5F',
    secondaryColor: '#5CC8FF',
    accentColor: '#FFFFFF',
    graphicTag: 'sport_10',
  },
  {
    id: 'spt_polo',
    name: 'Sports Team Polo',
    collection: 'sport',
    silhouette: 'polo',
    primaryColor: '#1C1D22',
    secondaryColor: '#FDB105',
    accentColor: '#FFFFFF',
    graphicTag: 'sport_07',
  },
  {
    id: 'spt_training_hoodie',
    name: 'Training Zip Hoodie',
    collection: 'sport',
    silhouette: 'zip_hoodie',
    primaryColor: '#253242',
    secondaryColor: '#38BDF8',
    accentColor: '#FFFFFF',
    graphicTag: 'sport_07',
  },

  // Category E: Special Edition (5)
  {
    id: 'se_christmas',
    name: 'Christmas Edition Knit',
    collection: 'special',
    silhouette: 'crewneck',
    primaryColor: '#B81D24',
    secondaryColor: '#186A3B',
    accentColor: '#FFFDF7',
    graphicTag: 'christmas',
  },
  {
    id: 'se_halloween',
    name: 'Halloween Street Hoodie',
    collection: 'special',
    silhouette: 'hoodie',
    primaryColor: '#18141C',
    secondaryColor: '#FF6B1A',
    accentColor: '#9C42F5',
    graphicTag: 'halloween',
  },
  {
    id: 'se_summer',
    name: 'Summer Island Shirt',
    collection: 'special',
    silhouette: 'button_up',
    primaryColor: '#1CA3B8',
    secondaryColor: '#FFE066',
    accentColor: '#FF6F61',
    graphicTag: 'summer',
  },
  {
    id: 'se_valentines',
    name: "Valentine's Crewneck",
    collection: 'special',
    silhouette: 'crewneck',
    primaryColor: '#F48FB1',
    secondaryColor: '#C2185B',
    accentColor: '#FFF5F7',
    graphicTag: 'valentines',
  },
  {
    id: 'se_jamaica',
    name: 'Jamaican Independence Tee',
    collection: 'special',
    silhouette: 'graphic_tee',
    primaryColor: '#121412',
    secondaryColor: '#009B3A',
    accentColor: '#FED100',
    graphicTag: 'jamaica',
  },
];

export const BOTTOM_ITEMS: ClothingItemDef<BottomSilhouette>[] = [
  // Uniform Bottoms (5)
  {
    id: 'sb_uniform_shorts',
    name: 'Speedy Uniform Shorts',
    collection: 'uniform',
    silhouette: 'shorts',
    primaryColor: '#2F150E',
    secondaryColor: '#FDB105',
    accentColor: '#E1000F',
    graphicTag: 'speedy_crest',
  },
  {
    id: 'sb_cargo_shorts',
    name: 'Black Cargo Shorts',
    collection: 'uniform',
    silhouette: 'cargo_shorts',
    primaryColor: '#1E1E20',
    secondaryColor: '#3A3A3E',
    accentColor: '#FDB105',
    graphicTag: 'plain',
  },
  {
    id: 'sb_denim_shorts',
    name: 'Casual Denim Shorts',
    collection: 'uniform',
    silhouette: 'denim_shorts',
    primaryColor: '#486C96',
    secondaryColor: '#8FB0D4',
    accentColor: '#D69F4E',
    graphicTag: 'plain',
  },
  {
    id: 'sb_joggers',
    name: 'Speedy Track Joggers',
    collection: 'uniform',
    silhouette: 'joggers',
    primaryColor: '#261411',
    secondaryColor: '#E1000F',
    accentColor: '#FDB105',
    graphicTag: 'speedy_crest',
  },
  {
    id: 'sb_trousers',
    name: 'Relaxed Crew Trousers',
    collection: 'uniform',
    silhouette: 'trousers',
    primaryColor: '#2C2623',
    secondaryColor: '#463C37',
    accentColor: '#E1000F',
    graphicTag: 'plain',
  },

  // Godspeed / Deus Vitesse Bottoms (5)
  {
    id: 'gd_cargo_shorts',
    name: 'Godspeed Cargo Shorts',
    collection: 'godspeed',
    silhouette: 'cargo_shorts',
    primaryColor: '#272926',
    secondaryColor: '#18181A',
    accentColor: '#D62828',
    graphicTag: 'godspeed_wing',
  },
  {
    id: 'dv_sweatpants',
    name: 'Deus Vitesse Sweatpants',
    collection: 'godspeed',
    silhouette: 'sweatpants',
    primaryColor: '#1F1E22',
    secondaryColor: '#EFEAE0',
    accentColor: '#D4AF37',
    graphicTag: 'dv_crest',
  },
  {
    id: 'gd_jeans',
    name: 'Relaxed Street Jeans',
    collection: 'godspeed',
    silhouette: 'jeans',
    primaryColor: '#344B68',
    secondaryColor: '#6E8AAD',
    accentColor: '#E5A93B',
    graphicTag: 'plain',
  },
  {
    id: 'dv_cargo_trousers',
    name: 'Deus Vitesse Cargo Pants',
    collection: 'godspeed',
    silhouette: 'cargo_pants',
    primaryColor: '#393B35',
    secondaryColor: '#232420',
    accentColor: '#D4AF37',
    graphicTag: 'dv_crest',
  },
  {
    id: 'gd_athletic_shorts',
    name: 'Godspeed Mesh Shorts',
    collection: 'godspeed',
    silhouette: 'athletic_shorts',
    primaryColor: '#151517',
    secondaryColor: '#E1000F',
    accentColor: '#FFFFFF',
    graphicTag: 'godspeed_wing',
  },

  // Casual Bottoms (5)
  {
    id: 'cas_denim_shorts',
    name: 'Denim Shorts',
    collection: 'casual',
    silhouette: 'denim_shorts',
    primaryColor: '#567CA8',
    secondaryColor: '#A1C0E2',
    accentColor: '#C89246',
    graphicTag: 'plain',
  },
  {
    id: 'cas_athletic_shorts',
    name: 'Athletic Shorts',
    collection: 'casual',
    silhouette: 'athletic_shorts',
    primaryColor: '#353C47',
    secondaryColor: '#E5E7EB',
    accentColor: '#60A5FA',
    graphicTag: 'plain',
  },
  {
    id: 'cas_cargo_shorts',
    name: 'Khaki Cargo Shorts',
    collection: 'casual',
    silhouette: 'cargo_shorts',
    primaryColor: '#8B795E',
    secondaryColor: '#6A5C46',
    accentColor: '#3D3529',
    graphicTag: 'plain',
  },
  {
    id: 'cas_trousers',
    name: 'Casual Chinos',
    collection: 'casual',
    silhouette: 'trousers',
    primaryColor: '#A89477',
    secondaryColor: '#7D6D56',
    accentColor: '#3D3529',
    graphicTag: 'plain',
  },
  {
    id: 'cas_joggers',
    name: 'Heather Gray Joggers',
    collection: 'casual',
    silhouette: 'joggers',
    primaryColor: '#7B8087',
    secondaryColor: '#555A61',
    accentColor: '#FFFFFF',
    graphicTag: 'plain',
  },

  // Sport & Special Edition Bottoms
  {
    id: 'spt_track_pants',
    name: 'Pro Track Pants',
    collection: 'sport',
    silhouette: 'joggers',
    primaryColor: '#182436',
    secondaryColor: '#38BDF8',
    accentColor: '#FFFFFF',
    graphicTag: 'sport_10',
  },
  {
    id: 'spt_hoop_shorts',
    name: 'Court Basketball Shorts',
    collection: 'sport',
    silhouette: 'athletic_shorts',
    primaryColor: '#B81D2B',
    secondaryColor: '#FDB105',
    accentColor: '#111111',
    graphicTag: 'sport_07',
  },
  {
    id: 'se_jamaica_shorts',
    name: 'Jamaica Celebration Shorts',
    collection: 'special',
    silhouette: 'athletic_shorts',
    primaryColor: '#009B3A',
    secondaryColor: '#FED100',
    accentColor: '#111111',
    graphicTag: 'jamaica',
  },
  {
    id: 'se_summer_shorts',
    name: 'Island Breeze Shorts',
    collection: 'special',
    silhouette: 'shorts',
    primaryColor: '#F59E0B',
    secondaryColor: '#1CA3B8',
    accentColor: '#FFFFFF',
    graphicTag: 'summer',
  },
];

export const FOOTWEAR_ITEMS: ClothingItemDef<FootwearSilhouette>[] = [
  // Speedy Burger Uniform Footwear (5)
  {
    id: 'sb_slides',
    name: 'Speedy Burger Slides',
    collection: 'uniform',
    silhouette: 'slides',
    primaryColor: '#E1000F',
    secondaryColor: '#FDB105',
    accentColor: '#FFFFFF',
    graphicTag: 'speedy_crest',
  },
  {
    id: 'sb_white_sneakers',
    name: 'White Sneakers',
    collection: 'uniform',
    silhouette: 'low_sneakers',
    primaryColor: '#F8F7F4',
    secondaryColor: '#E1000F',
    accentColor: '#E5E2DC',
    graphicTag: 'plain',
  },
  {
    id: 'sb_black_sneakers',
    name: 'Black Sneakers',
    collection: 'uniform',
    silhouette: 'low_sneakers',
    primaryColor: '#1D1D20',
    secondaryColor: '#F5F5F5',
    accentColor: '#E1000F',
    graphicTag: 'plain',
  },
  {
    id: 'sb_sandals',
    name: 'Casual Sandals',
    collection: 'uniform',
    silhouette: 'sandals',
    primaryColor: '#6B4226',
    secondaryColor: '#3A2112',
    accentColor: '#D4A373',
    graphicTag: 'plain',
  },
  {
    id: 'sb_sport_slides',
    name: 'Sport Slides',
    collection: 'uniform',
    silhouette: 'slides',
    primaryColor: '#1E242E',
    secondaryColor: '#FFFFFF',
    accentColor: '#FDB105',
    graphicTag: 'plain',
  },

  // Godspeed / Deus Vitesse Footwear (5)
  {
    id: 'gd_slides',
    name: 'Godspeed Street Slides',
    collection: 'godspeed',
    silhouette: 'slides',
    primaryColor: '#151517',
    secondaryColor: '#D62828',
    accentColor: '#EFECE6',
    graphicTag: 'godspeed_wing',
  },
  {
    id: 'dv_hightops',
    name: 'Deus Vitesse High-Tops',
    collection: 'godspeed',
    silhouette: 'high_tops',
    primaryColor: '#1B1B1F',
    secondaryColor: '#EAE4D8',
    accentColor: '#D4AF37',
    graphicTag: 'dv_crest',
  },
  {
    id: 'gd_chunky_sneakers',
    name: 'Godspeed Chunky Runners',
    collection: 'godspeed',
    silhouette: 'chunky_sneakers',
    primaryColor: '#EAE5DB',
    secondaryColor: '#232226',
    accentColor: '#D62828',
    graphicTag: 'godspeed_wing',
  },
  {
    id: 'dv_minimal_sneakers',
    name: 'Deus Vitesse Court Low',
    collection: 'godspeed',
    silhouette: 'minimal_sneakers',
    primaryColor: '#F3F0E9',
    secondaryColor: '#2B2B2F',
    accentColor: '#D4AF37',
    graphicTag: 'plain',
  },
  {
    id: 'gd_designer_casual',
    name: 'Designer Street Loafers',
    collection: 'godspeed',
    silhouette: 'designer_casual',
    primaryColor: '#241B18',
    secondaryColor: '#D4AF37',
    accentColor: '#141212',
    graphicTag: 'dv_crest',
  },

  // Sport & Special Footwear
  {
    id: 'spt_pro_kicks',
    name: 'Pro Court High-Tops',
    collection: 'sport',
    silhouette: 'high_tops',
    primaryColor: '#C81E2B',
    secondaryColor: '#FFFFFF',
    accentColor: '#FDB105',
    graphicTag: 'sport_07',
  },
  {
    id: 'se_jamaica_kicks',
    name: 'Yard Pride Runners',
    collection: 'special',
    silhouette: 'chunky_sneakers',
    primaryColor: '#009B3A',
    secondaryColor: '#FED100',
    accentColor: '#141414',
    graphicTag: 'jamaica',
  },
];

export const ACCESSORY_ITEMS: AccessoryDef[] = [
  { id: 'baseball_cap', name: 'Baseball Cap', slot: 'head', swatch: '#E1000F' },
  { id: 'bucket_hat', name: 'Bucket Hat', slot: 'head', swatch: '#1F1E22' },
  { id: 'beanie', name: 'Knit Beanie', slot: 'head', swatch: '#D62828' },
  { id: 'sunglasses', name: 'Sunglasses', slot: 'eyewear', swatch: '#151517' },
  { id: 'headphones', name: 'Studio Headphones', slot: 'ears', swatch: '#28282E' },
  { id: 'necklace', name: 'Gold Chain', slot: 'neck', swatch: '#E5B83B' },
  { id: 'watch', name: 'Luxury Watch', slot: 'wrist_left', swatch: '#C0C5CE' },
  { id: 'bracelet', name: 'Wrist Bracelets', slot: 'wrist_right', swatch: '#009B3A' },
  { id: 'backpack', name: 'Street Backpack', slot: 'back', swatch: '#2B2B30' },
  { id: 'crossbody_bag', name: 'Crossbody Bag', slot: 'body', swatch: '#1C1C20' },
];

export interface OutfitComboPreset {
  id: string;
  name: string;
  subtitle: string;
  topId: string;
  bottomId: string;
  footwearId: string;
  accessories: AccessoryId[];
}

export const OUTFIT_COMBOS: OutfitComboPreset[] = [
  {
    id: 'speedy_crew',
    name: 'Speedy Crew Uniform',
    subtitle: 'Branded Polo · Uniform Shorts · Speedy Slides',
    topId: 'sb_polo',
    bottomId: 'sb_uniform_shorts',
    footwearId: 'sb_slides',
    accessories: ['baseball_cap', 'watch'],
  },
  {
    id: 'godspeed_street',
    name: 'Godspeed Street',
    subtitle: 'Godspeed Hoodie · Cargo Shorts · Chunky Runners',
    topId: 'gd_hoodie',
    bottomId: 'gd_cargo_shorts',
    footwearId: 'gd_chunky_sneakers',
    accessories: ['sunglasses', 'crossbody_bag', 'necklace'],
  },
  {
    id: 'deus_vitesse_atelier',
    name: 'Deus Vitesse Noir',
    subtitle: 'DV Zip Hoodie · Cargo Pants · High-Tops',
    topId: 'dv_zip_hoodie',
    bottomId: 'dv_cargo_trousers',
    footwearId: 'dv_hightops',
    accessories: ['beanie', 'watch', 'backpack'],
  },
  {
    id: 'jamaica_pride',
    name: 'Jamaican Independence',
    subtitle: 'JA Tee · Celebration Shorts · Yard Runners',
    topId: 'se_jamaica',
    bottomId: 'se_jamaica_shorts',
    footwearId: 'se_jamaica_kicks',
    accessories: ['sunglasses', 'bracelet', 'bucket_hat'],
  },
  {
    id: 'court_mvp',
    name: 'Court MVP',
    subtitle: 'Basketball Jersey · Hoop Shorts · Pro Kicks',
    topId: 'spt_basketball_jersey',
    bottomId: 'spt_hoop_shorts',
    footwearId: 'spt_pro_kicks',
    accessories: ['headphones', 'bracelet'],
  },
  {
    id: 'chill_weekend',
    name: 'Island Summer Chill',
    subtitle: 'Summer Shirt · Denim Shorts · White Sneakers',
    topId: 'se_summer',
    bottomId: 'cas_denim_shorts',
    footwearId: 'sb_white_sneakers',
    accessories: ['sunglasses', 'bucket_hat'],
  },
];

export const PET_DAILY_MEALS = [
  {
    id: 'jr_burger',
    name: 'Speedy Jr. Burger',
    items: ['Brioche Bun', 'Beef Patty', 'Cheddar Cheese'],
    swatch: '#E1000F',
  },
  {
    id: 'double_bacon',
    name: 'Double Bacon Cheeseburger',
    items: ['Sesame Bun', '2 × Beef Patty', 'Bacon', 'Double Cheddar', 'Lettuce & Tomato'],
    swatch: '#D97B29',
  },
  {
    id: 'crispy_chicken',
    name: 'Crispy Chicken Crunch',
    items: ['Brioche Bun', 'Crispy Chicken', 'Pickles', 'Speedy Sauce'],
    swatch: '#FDB105',
  },
  {
    id: 'loaded_fries',
    name: 'Cheesy Fries & Drink',
    items: ['French Fries', 'Melted Cheddar', 'Speedy Fizz'],
    swatch: '#FFC226',
  },
];

export const FEED_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface PetCareStatus {
  fullness: number;
  msRemaining: number;
  isHungry: boolean;
  isCritical: boolean;
  isFainted: boolean;
  timeLeftText: string;
}

export function computePetCareStatus(pet: SpeedyPetConfig, now = Date.now()): PetCareStatus {
  const lastFed = Number.isFinite(pet.lastFedAt) && pet.lastFedAt > 0 ? pet.lastFedAt : now;
  const elapsed = Math.max(0, now - lastFed);
  const ratio = Math.max(0, Math.min(1, 1 - elapsed / FEED_WINDOW_MS));
  const fullness = Math.round(ratio * 100);
  const msRemaining = Math.max(0, FEED_WINDOW_MS - elapsed);
  const isFainted = fullness <= 0;
  const isCritical = fullness > 0 && fullness <= 25;
  const isHungry = fullness <= 50;

  let timeLeftText = 'Expired — Feed now to revive!';
  if (msRemaining > 0) {
    const totalMins = Math.ceil(msRemaining / 60000);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    timeLeftText = hrs > 0 ? `${hrs}h ${mins}m left today` : `${mins}m left today`;
  }

  return {
    fullness,
    msRemaining,
    isHungry,
    isCritical,
    isFainted,
    timeLeftText,
  };
}

export type EvolutionStage = 1 | 2 | 3;

export interface EvolutionStageMeta {
  stage: EvolutionStage;
  title: string;
  badge: string;
  description: string;
}

const SPECIES_EVOLUTION_TITLES: Record<PetSpecies, [string, string, string]> = {
  shadow_tux: ['Shadow Rookie', 'Dapper Knight', 'Lord of Shadows'],
  pink_hero: ['Pink Dash', 'Hammer Striker', 'Starlight Queen'],
  kid_speed: ['Young Bolt', 'Turbo Kid', 'Hyper Speedster'],
  reverse_bolt: ['Yellow Spark', 'Negative Bolt', 'Omega Reverse'],
  blue_dash: ['Blue Blur', 'Sonic Dash', 'Super Gold Dash'],
  crimson_bolt: ['Red Runner', 'Lightning Hero', 'Speed Force King'],
};

const LEVEL_XP_THRESHOLDS = [0, 0, 100, 250, 450, 700, 1000, 1400, 1900, 2500];

export function xpThresholdForLevel(level: number): number {
  const lvl = Math.max(1, Math.min(100, Math.round(level)));
  if (lvl < LEVEL_XP_THRESHOLDS.length) {
    return LEVEL_XP_THRESHOLDS[lvl];
  }
  const extra = lvl - (LEVEL_XP_THRESHOLDS.length - 1);
  return LEVEL_XP_THRESHOLDS[LEVEL_XP_THRESHOLDS.length - 1] + extra * 650;
}

export function getEvolutionStageForLevel(level: number): EvolutionStage {
  if (level >= 6) return 3;
  if (level >= 3) return 2;
  return 1;
}

export function getEvolutionInfo(species: PetSpecies, stage: EvolutionStage): EvolutionStageMeta {
  const titles = SPECIES_EVOLUTION_TITLES[species] ?? SPECIES_EVOLUTION_TITLES.shadow_tux;
  if (stage === 1) {
    return {
      stage: 1,
      title: titles[0],
      badge: 'Stage 1',
      description: 'Classic minifigure hero · Evolves at Lv. 3',
    };
  }
  if (stage === 2) {
    return {
      stage: 2,
      title: titles[1],
      badge: 'Stage 2 Evolved',
      description: 'Golden shoulder pauldrons & wrist cuffs · Final form at Lv. 6',
    };
  }
  return {
    stage: 3,
    title: titles[2],
    badge: 'Stage 3 Alpha',
    description: 'Champion golden crown & speed wings with Speedy crest',
  };
}

export interface LevelProgressInfo {
  xp: number;
  level: number;
  stage: EvolutionStage;
  currentLevelFloorXp: number;
  nextLevelXp: number;
  xpIntoLevel: number;
  xpNeededForLevel: number;
  progressPct: number;
  nextEvolutionLevel: number | null;
}

export function getLevelProgress(rawXp: number): LevelProgressInfo {
  const xp = Math.max(0, Math.min(1000000, Math.round(Number(rawXp) || 0)));
  let level = 1;
  while (level < 100 && xp >= xpThresholdForLevel(level + 1)) {
    level++;
  }
  const currentLevelFloorXp = xpThresholdForLevel(level);
  const nextLevelXp = level >= 100 ? currentLevelFloorXp + 650 : xpThresholdForLevel(level + 1);
  const xpIntoLevel = Math.max(0, xp - currentLevelFloorXp);
  const xpNeededForLevel = Math.max(1, nextLevelXp - currentLevelFloorXp);
  const progressPct = level >= 100 ? 100 : Math.min(100, Math.round((xpIntoLevel / xpNeededForLevel) * 100));
  const stage = getEvolutionStageForLevel(level);
  const nextEvolutionLevel = stage === 1 ? 3 : stage === 2 ? 6 : null;

  return {
    xp,
    level,
    stage,
    currentLevelFloorXp,
    nextLevelXp,
    xpIntoLevel,
    xpNeededForLevel,
    progressPct,
    nextEvolutionLevel,
  };
}

export interface FeedProgressionResult {
  pet: SpeedyPetConfig;
  xpGained: number;
  prevLevel: number;
  newLevel: number;
  prevStage: EvolutionStage;
  newStage: EvolutionStage;
  leveledUp: boolean;
  evolved: boolean;
}

export function feedPetWithProgression(
  pet: SpeedyPetConfig,
  mealName: string,
  mealItems: string[],
  now = Date.now(),
  xpBonus = 0
): FeedProgressionResult {
  const prevDate = new Date(pet.lastFedAt || 0);
  const nextDate = new Date(now);
  const sameDay =
    prevDate.getFullYear() === nextDate.getFullYear() &&
    prevDate.getMonth() === nextDate.getMonth() &&
    prevDate.getDate() === nextDate.getDate();

  const missedDay = now - (pet.lastFedAt || now) > FEED_WINDOW_MS;
  const nextStreak = missedDay
    ? 1
    : sameDay
      ? Math.max(1, pet.streakDays || 1)
      : (pet.streakDays || 1) + 1;

  const prevProg = getLevelProgress(pet.xp || 0);
  const streakBonus = nextStreak >= 2 ? 15 : 0;
  const xpGained = 60 + Math.max(0, Math.round(xpBonus)) + streakBonus;
  const nextXp = Math.min(1000000, prevProg.xp + xpGained);
  const nextProg = getLevelProgress(nextXp);

  const updated = sanitizeSpeedyPet({
    ...pet,
    lastFedAt: now,
    happiness: 100,
    streakDays: nextStreak,
    totalMealsEaten: (pet.totalMealsEaten || 0) + 1,
    xp: nextXp,
    level: nextProg.level,
    lastMealName: mealName || 'Speedy Burger Meal',
    lastMealItems: mealItems.length > 0 ? mealItems : [mealName || 'Speedy Burger'],
  });

  return {
    pet: updated,
    xpGained,
    prevLevel: prevProg.level,
    newLevel: nextProg.level,
    prevStage: prevProg.stage,
    newStage: nextProg.stage,
    leveledUp: nextProg.level > prevProg.level,
    evolved: nextProg.stage > prevProg.stage,
  };
}

export function applyFeedMealToPet(
  pet: SpeedyPetConfig,
  mealName: string,
  mealItems: string[],
  now = Date.now(),
  xpBonus = 0
): SpeedyPetConfig {
  return feedPetWithProgression(pet, mealName, mealItems, now, xpBonus).pet;
}

export function createDefaultPetConfig(
  gender: PetGender = 'male',
  species: PetSpecies = 'shadow_tux'
): SpeedyPetConfig {
  const spMeta = PET_SPECIES.find((s) => s.id === species) ?? PET_SPECIES[0];
  return {
    id: `pet_${Date.now()}`,
    name: spMeta.label,
    species: spMeta.id,
    gender: spMeta.id === 'pink_hero' ? 'female' : gender,
    furColor: spMeta.defaultFur,
    hairStyle: 'buzz_cut',
    hairColor: '#181414',
    eyeStyle: 'bright_wide',
    eyeColor: '#287A52',
    eyebrowStyle: 'natural',
    expression: 'happy',
    facialHair: 'none',
    topId: 'sb_hoodie',
    bottomId: 'sb_joggers',
    footwearId: 'sb_white_sneakers',
    accessories: [],
    lastFedAt: Date.now(),
    happiness: 92,
    streakDays: 1,
    totalMealsEaten: 1,
    xp: 0,
    level: 1,
    lastMealName: 'Speedy Jr. Burger',
    lastMealItems: ['Brioche Bun', 'Beef Patty', 'Cheddar Cheese'],
  };
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function createRandomPetConfig(currentName?: string, prevPet?: SpeedyPetConfig): SpeedyPetConfig {
  const chosen = pickRandom(PET_SPECIES);
  const gender: PetGender = chosen.id === 'pink_hero' ? 'female' : 'male';
  const prevProg = getLevelProgress(prevPet?.xp ?? 0);

  return {
    id: prevPet?.id || `pet_${Date.now()}`,
    name: currentName?.trim() || chosen.label,
    species: chosen.id,
    gender,
    furColor: chosen.defaultFur,
    hairStyle: 'buzz_cut',
    hairColor: '#181414',
    eyeStyle: 'bright_wide',
    eyeColor: pickRandom(EYE_COLORS).hex,
    eyebrowStyle: 'natural',
    expression: pickRandom(EXPRESSIONS).id,
    facialHair: 'none',
    topId: 'sb_hoodie',
    bottomId: 'sb_joggers',
    footwearId: 'sb_white_sneakers',
    accessories: [],
    lastFedAt: prevPet?.lastFedAt ?? Date.now(),
    happiness: prevPet?.happiness ?? 95,
    streakDays: prevPet?.streakDays ?? 1,
    totalMealsEaten: prevPet?.totalMealsEaten ?? 1,
    xp: prevProg.xp,
    level: prevProg.level,
    lastMealName: prevPet?.lastMealName ?? 'Speedy Jr. Burger',
    lastMealItems: prevPet?.lastMealItems ?? ['Brioche Bun', 'Beef Patty', 'Cheddar Cheese'],
  };
}

const LEGACY_SPECIES_MAP: Record<string, PetSpecies> = {
  cat: 'blue_dash',
  dog: 'kid_speed',
  bunny: 'pink_hero',
  bear: 'shadow_tux',
  fox: 'crimson_bolt',
  lion: 'reverse_bolt',
};

export function sanitizeSpeedyPet(
  input: Partial<SpeedyPetConfig> & { skinTone?: string; species?: string }
): SpeedyPetConfig {
  const validTop = input.topId && TOP_ITEMS.some((t) => t.id === input.topId) ? input.topId : 'sb_hoodie';
  const validBottom =
    input.bottomId && BOTTOM_ITEMS.some((b) => b.id === input.bottomId) ? input.bottomId : 'sb_joggers';
  const validFoot =
    input.footwearId && FOOTWEAR_ITEMS.some((f) => f.id === input.footwearId)
      ? input.footwearId
      : 'sb_white_sneakers';

  const validAccSet = new Set(ACCESSORY_ITEMS.map((a) => a.id));
  const rawAcc = Array.isArray(input.accessories) ? input.accessories : [];
  const cleanAcc = Array.from(new Set(rawAcc.filter((a) => validAccSet.has(a)))).slice(0, 10);

  const rawSpecies = typeof input.species === 'string' ? input.species : '';
  const validSpecies: PetSpecies = PET_SPECIES.some((s) => s.id === rawSpecies)
    ? (rawSpecies as PetSpecies)
    : LEGACY_SPECIES_MAP[rawSpecies] ?? 'shadow_tux';

  const validFur =
    input.furColor && FUR_COLORS.some((f) => f.id === input.furColor)
      ? input.furColor
      : 'tuxedo_gray';

  const rawMeals = Array.isArray(input.lastMealItems) ? input.lastMealItems : [];
  const cleanMealItems = rawMeals
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim().slice(0, 120))
    .slice(0, 25);

  return {
    id: (input.id || `pet_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128),
    name: ((input.name ?? '').trim() || 'Speedy Pet').slice(0, 50),
    species: validSpecies,
    gender: input.gender === 'female' ? 'female' : 'male',
    furColor: validFur,
    hairStyle: input.hairStyle && HAIRSTYLES.some((h) => h.id === input.hairStyle) ? input.hairStyle : 'buzz_cut',
    hairColor:
      input.hairColor && /^#[0-9a-fA-F]{6}$/.test(input.hairColor)
        ? input.hairColor.toUpperCase()
        : '#181414',
    eyeStyle: input.eyeStyle && EYE_STYLES.some((e) => e.id === input.eyeStyle) ? input.eyeStyle : 'bright_wide',
    eyeColor:
      input.eyeColor && /^#[0-9a-fA-F]{6}$/.test(input.eyeColor)
        ? input.eyeColor.toUpperCase()
        : '#287A52',
    eyebrowStyle:
      input.eyebrowStyle && EYEBROW_STYLES.some((b) => b.id === input.eyebrowStyle)
        ? input.eyebrowStyle
        : 'natural',
    expression: input.expression && EXPRESSIONS.some((x) => x.id === input.expression) ? input.expression : 'happy',
    facialHair:
      input.gender === 'female'
        ? 'none'
        : input.facialHair && FACIAL_HAIR_OPTIONS.some((f) => f.id === input.facialHair)
          ? input.facialHair
          : 'none',
    topId: validTop,
    bottomId: validBottom,
    footwearId: validFoot,
    accessories: cleanAcc,
    lastFedAt:
      typeof input.lastFedAt === 'number' && Number.isFinite(input.lastFedAt) && input.lastFedAt > 0
        ? Math.round(input.lastFedAt)
        : Date.now(),
    happiness:
      typeof input.happiness === 'number' && Number.isFinite(input.happiness)
        ? Math.max(0, Math.min(100, Math.round(input.happiness)))
        : 92,
    streakDays:
      typeof input.streakDays === 'number' && Number.isFinite(input.streakDays)
        ? Math.max(0, Math.min(10000, Math.round(input.streakDays)))
        : 1,
    totalMealsEaten:
      typeof input.totalMealsEaten === 'number' && Number.isFinite(input.totalMealsEaten)
        ? Math.max(0, Math.min(100000, Math.round(input.totalMealsEaten)))
        : 1,
    xp: (() => {
      const rawXp =
        typeof input.xp === 'number' && Number.isFinite(input.xp)
          ? Math.max(0, Math.min(1000000, Math.round(input.xp)))
          : 0;
      return rawXp;
    })(),
    level: (() => {
      const rawXp =
        typeof input.xp === 'number' && Number.isFinite(input.xp)
          ? Math.max(0, Math.min(1000000, Math.round(input.xp)))
          : 0;
      return getLevelProgress(rawXp).level;
    })(),
    lastMealName: (input.lastMealName ?? 'Speedy Jr. Burger').trim().slice(0, 120),
    lastMealItems: cleanMealItems,
  };
}

