import {
  BUN_OPTIONS,
  BurgerBuildState,
  CHEESE_OPTIONS,
  COMBOS,
  ESTIMATED_WAIT_MINS,
  MEAT_OPTIONS,
  SAUCE_OPTIONS,
  SIDE_OPTIONS,
  TOPPING_OPTIONS,
  WHATSAPP_NUMBER,
} from './menu';

export type AdminCategoryKey = 'bun' | 'meat' | 'cheese' | 'toppings' | 'sauces' | 'sides' | 'combos';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type RevenueCategory = 'walk_in' | 'whatsapp' | 'club_fee' | 'catering' | 'other';

export interface SiteSettings {
  // Shop settings
  shopName: string;
  whatsappNumber: string;
  estimatedWaitMins: number;
  orderingEnabled: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  currencySymbol: string;

  // Loyalty & Burger Club
  ordersNeededForReward: number;
  rewardText: string;
  membershipPrice: number;
  clubEnabled: boolean;

  // Appearance
  darkMode: boolean;
  brandColor: string;
  accentColor: string;
  crownColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  animationsEnabled: boolean;
  animationScale: number;
  logoUrl: string;

  // About page
  aboutHeading: string;
  aboutBody: string;
  aboutHighlight: string;

  // Contact page
  contactHeading: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  contactHours: string;
  contactNote: string;

  // Splash screen
  splashEnabled: boolean;
  splashTitle: string;
  splashTagline: string;
  splashCtaText: string;
  splashImageUrl: string;

  // Footer
  footerText: string;
  footerSubtext: string;

  // Customer-facing labels
  tagline: string;
  tabCombos: string;
  tabBuild: string;
  tabOrders: string;
  tabCard: string;
  tabClub: string;
  pickBarComboText: string;
  pickBarBuildText: string;
  viewOrderText: string;

  // Order-ticket text
  ticketHeading: string;
  ticketWaitLabel: string;
  ticketWhatsappText: string;
  ticketBackText: string;
  ticketFooterNote: string;
}

export interface MenuCategoryRecord {
  id: string;
  key: AdminCategoryKey;
  name: string;
  selectionMode: 'single' | 'multi';
  sortOrder: number;
  available: boolean;
}

export interface MenuItemRecord {
  id: string;
  categoryKey: AdminCategoryKey;
  name: string;
  price: number;
  description: string;
  swatch: string;
  visualKey: string;
  maxQty: number;
  sortOrder: number;
  available: boolean;
  comboBun: string;
  comboIngredients: string[];
}

export interface OrderRecord {
  id: string;
  userId: string;
  ticketCode: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  orderMode: 'Pickup' | 'Delivery';
  comboName: string;
  items: string[];
  total: number;
  status: OrderStatus;
  notes: string;
  staffNote: string;
  approved?: boolean;
  approvedBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RevenueEntryRecord {
  id: string;
  title: string;
  category: RevenueCategory;
  amount: number;
  note: string;
  approved: boolean;
  createdBy: string;
  approvedBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BurgerClubMemberRecord {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  stamps: number;
  lifetimeOrders: number;
  rewardsRedeemed: number;
  firstInLine: boolean;
  status: 'active' | 'paused';
  notes: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AdminUserRecord {
  uid: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'staff';
  addedBy: string;
  createdAt?: unknown;
}

export const BOOTSTRAPPED_ADMIN_EMAIL = 'jahvain795@gmail.com';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  shopName: 'Speedy Burger',
  whatsappNumber: WHATSAPP_NUMBER,
  estimatedWaitMins: ESTIMATED_WAIT_MINS,
  orderingEnabled: true,
  pickupEnabled: true,
  deliveryEnabled: true,
  currencySymbol: 'J$',

  ordersNeededForReward: 10,
  rewardText: 'a free burger',
  membershipPrice: 1500,
  clubEnabled: true,

  darkMode: false,
  brandColor: '#E1000F',
  accentColor: '#FDB105',
  crownColor: '#E0B400',
  backgroundColor: '#DFBE98',
  textColor: '#3A0B08',
  headingFont: 'Barlow Condensed',
  bodyFont: 'Barlow',
  animationsEnabled: true,
  animationScale: 2.5,
  logoUrl: '',

  aboutHeading: 'About Speedy Burger',
  aboutBody:
    'Speedy Burger is a mobile-first ordering app built for burger lovers across Jamaica. From any phone, customers can browse combo meals, build a custom burger from patty to sauce in 3D, and send an order straight to the kitchen.',
  aboutHighlight: 'Freshly grilled patties, crisp toppings, and made-to-order Jamaican heat.',

  contactHeading: 'Contact & Hours',
  contactPhone: '+1 (876) 468-5461',
  contactEmail: 'orders@speedyburgersja.com',
  contactAddress: 'Kingston, Jamaica',
  contactHours: 'Mon–Sun · 11:00 AM – 10:00 PM',
  contactNote: 'Tap Send on WhatsApp at checkout or show your ticket code at pickup.',

  splashEnabled: false,
  splashTitle: 'SPEEDY BURGER',
  splashTagline: 'Crafted in 3D. Grilled fresh to order.',
  splashCtaText: 'Build Your Burger',
  splashImageUrl: '',

  footerText: '© Speedy Burger Jamaica · Freshly grilled to order',
  footerSubtext: 'Pickup & Delivery · Prices in JMD',

  tagline: 'Drag 360° · Build to order',
  tabCombos: 'Combos',
  tabBuild: 'Build',
  tabOrders: 'Order',
  tabCard: 'My card',
  tabClub: 'Burger Club',
  pickBarComboText: 'Pick a combo',
  pickBarBuildText: 'Pick bun & meat',
  viewOrderText: 'View order',

  ticketHeading: 'Your ticket',
  ticketWaitLabel: 'Estimated wait',
  ticketWhatsappText: 'Send on WhatsApp',
  ticketBackText: 'Back to menu',
  ticketFooterNote: 'Show this ticket code on WhatsApp or at the counter.',
};

export const DEFAULT_CATEGORIES: MenuCategoryRecord[] = [
  { id: 'cat_bun', key: 'bun', name: 'Bun', selectionMode: 'single', sortOrder: 1, available: true },
  { id: 'cat_meat', key: 'meat', name: 'Meat', selectionMode: 'multi', sortOrder: 2, available: true },
  { id: 'cat_cheese', key: 'cheese', name: 'Cheese', selectionMode: 'multi', sortOrder: 3, available: true },
  { id: 'cat_toppings', key: 'toppings', name: 'Toppings', selectionMode: 'multi', sortOrder: 4, available: true },
  { id: 'cat_sauces', key: 'sauces', name: 'Sauces', selectionMode: 'multi', sortOrder: 5, available: true },
  { id: 'cat_sides', key: 'sides', name: 'Sides', selectionMode: 'multi', sortOrder: 6, available: true },
  { id: 'cat_combos', key: 'combos', name: 'Combos', selectionMode: 'single', sortOrder: 7, available: true },
];

function serializeComboTokens(build: BurgerBuildState): string[] {
  const tokens: string[] = [];
  for (const [k, v] of Object.entries(build.meats)) {
    if (v && v > 0) tokens.push(`meat:${k}:${v}`);
  }
  for (const [k, v] of Object.entries(build.cheeses)) {
    if (v && v > 0) tokens.push(`cheese:${k}:${v}`);
  }
  for (const [k, v] of Object.entries(build.toppings)) {
    if (v && v > 0) tokens.push(`toppings:${k}:${v}`);
  }
  for (const [k, v] of Object.entries(build.sauces)) {
    if (v && v > 0) tokens.push(`sauces:${k}:${v}`);
  }
  for (const [k, v] of Object.entries(build.sides)) {
    if (v && v > 0) tokens.push(`sides:${k}:${v}`);
  }
  return tokens.slice(0, 20);
}

export function parseComboBuild(comboItem: MenuItemRecord): BurgerBuildState {
  const build: BurgerBuildState = {
    bun: (comboItem.comboBun || 'sesame_bun') as BurgerBuildState['bun'],
    meats: {},
    cheeses: {},
    toppings: {},
    sauces: {},
    sides: {},
    activeComboId: comboItem.id,
  };
  for (const token of comboItem.comboIngredients) {
    const [cat, id, qtyStr] = token.split(':');
    const qty = Math.max(1, Math.min(5, Number(qtyStr) || 1));
    if (cat === 'meat' && id) (build.meats as Record<string, number>)[id] = qty;
    else if (cat === 'cheese' && id) (build.cheeses as Record<string, number>)[id] = qty;
    else if (cat === 'toppings' && id) (build.toppings as Record<string, number>)[id] = qty;
    else if (cat === 'sauces' && id) (build.sauces as Record<string, number>)[id] = qty;
    else if (cat === 'sides' && id) (build.sides as Record<string, number>)[id] = qty;
  }
  return build;
}

export const DEFAULT_MENU_ITEMS: MenuItemRecord[] = [
  ...BUN_OPTIONS.map((o, idx) => ({
    id: o.id,
    categoryKey: 'bun' as const,
    name: o.name,
    price: o.price,
    description: o.description ?? '',
    swatch: o.swatch,
    visualKey: o.id,
    maxQty: 1,
    sortOrder: idx + 1,
    available: true,
    comboBun: '',
    comboIngredients: [],
  })),
  ...MEAT_OPTIONS.map((o, idx) => ({
    id: o.id,
    categoryKey: 'meat' as const,
    name: o.name,
    price: o.price,
    description: o.description ?? '',
    swatch: o.swatch,
    visualKey: o.id,
    maxQty: 2,
    sortOrder: idx + 1,
    available: true,
    comboBun: '',
    comboIngredients: [],
  })),
  ...CHEESE_OPTIONS.map((o, idx) => ({
    id: o.id,
    categoryKey: 'cheese' as const,
    name: o.name,
    price: o.price,
    description: o.description ?? '',
    swatch: o.swatch,
    visualKey: o.id,
    maxQty: 2,
    sortOrder: idx + 1,
    available: true,
    comboBun: '',
    comboIngredients: [],
  })),
  ...TOPPING_OPTIONS.map((o, idx) => ({
    id: o.id,
    categoryKey: 'toppings' as const,
    name: o.name,
    price: o.price,
    description: o.description ?? '',
    swatch: o.swatch,
    visualKey: o.id,
    maxQty: o.id === 'bacon' ? 2 : 1,
    sortOrder: idx + 1,
    available: true,
    comboBun: '',
    comboIngredients: [],
  })),
  {
    id: 'fried_egg',
    categoryKey: 'toppings',
    name: 'Fried egg',
    price: 100,
    description: '',
    swatch: '#F7D046',
    visualKey: 'american_cheese',
    maxQty: 1,
    sortOrder: 8,
    available: false,
    comboBun: '',
    comboIngredients: [],
  },
  ...SAUCE_OPTIONS.map((o, idx) => ({
    id: o.id,
    categoryKey: 'sauces' as const,
    name: o.name,
    price: o.price,
    description: o.description ?? '',
    swatch: o.swatch,
    visualKey: o.id,
    maxQty: 1,
    sortOrder: idx + 1,
    available: true,
    comboBun: '',
    comboIngredients: [],
  })),
  ...SIDE_OPTIONS.map((o, idx) => ({
    id: o.id,
    categoryKey: 'sides' as const,
    name: o.name,
    price: o.price,
    description: o.description ?? '',
    swatch: o.swatch,
    visualKey: o.id,
    maxQty: 2,
    sortOrder: idx + 1,
    available: true,
    comboBun: '',
    comboIngredients: [],
  })),
  ...COMBOS.map((c, idx) => ({
    id: c.id,
    categoryKey: 'combos' as const,
    name: c.name,
    price: c.price,
    description: c.description,
    swatch: '#E1000F',
    visualKey: 'beef',
    maxQty: 1,
    sortOrder: idx + 1,
    available: true,
    comboBun: c.build.bun,
    comboIngredients: serializeComboTokens(c.build),
  })),
];

export const VISUAL_KEY_CHOICES: Array<{ value: string; label: string }> = [
  { value: 'sesame_bun', label: 'Sesame Bun (3D)' },
  { value: 'original_bun', label: 'Original Brioche Bun (3D)' },
  { value: 'sliced_bread', label: 'Sliced Bread (3D)' },
  { value: 'lettuce_wrap', label: 'Lettuce Wrap (3D)' },
  { value: 'beef', label: 'Grilled Beef Patty (3D)' },
  { value: 'double_beef', label: 'Double Beef Patty (3D)' },
  { value: 'chicken', label: 'Crispy Chicken Fillet (3D)' },
  { value: 'nuggets', label: 'Crispy Chicken Nuggets (3D)' },
  { value: 'american_cheese', label: 'American Cheese (3D)' },
  { value: 'cheddar', label: 'Cheddar Cheese (3D)' },
  { value: 'pepper_jack', label: 'Pepper Jack Cheese (3D)' },
  { value: 'gouda', label: 'Gouda / Havarti Cheese (3D)' },
  { value: 'lettuce', label: 'Crisp Lettuce (3D)' },
  { value: 'tomato', label: 'Fresh Tomato (3D)' },
  { value: 'onion', label: 'Red Onion Rings (3D)' },
  { value: 'caramelized_onions', label: 'Caramelized Onions (3D)' },
  { value: 'pickles', label: 'Pickles (3D)' },
  { value: 'scotch_bonnet', label: 'Scotch Bonnet Pepper (3D)' },
  { value: 'bacon', label: 'Crispy Bacon (3D)' },
  { value: 'signature', label: 'Signature Sauce (3D)' },
  { value: 'sweet_chilli', label: 'Sweet Chilli / Red Sauce (3D)' },
  { value: 'ranch', label: 'Ranch / Mayo Sauce (3D)' },
  { value: 'tangy_bbq', label: 'BBQ Sauce (3D)' },
  { value: 'mustard', label: 'Mustard Sauce (3D)' },
  { value: 'fries', label: 'Regular Fries Side (3D)' },
  { value: 'seasoned_fries', label: 'Seasoned Fries Side (3D)' },
];

// Defensive payload sanitizers synchronized with firebase-blueprint.json & firestore.rules
function clampStr(val: unknown, fallback: string, maxLen: number): string {
  const s = typeof val === 'string' ? val.trim() : fallback;
  return s.slice(0, maxLen);
}

function clampHex(val: unknown, fallback: string): string {
  if (typeof val === 'string' && /^#[0-9a-fA-F]{6}$/.test(val.trim())) {
    return val.trim().toUpperCase();
  }
  return fallback;
}

export function sanitizeId(raw: string, fallback = 'item'): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
  return cleaned || fallback;
}

export function sanitizeSiteSettings(input: Partial<SiteSettings>): SiteSettings {
  const d = DEFAULT_SITE_SETTINGS;
  const phoneClean = clampStr(input.whatsappNumber, d.whatsappNumber, 24).replace(/[^0-9+\-\s()]/g, '');
  return {
    shopName: clampStr(input.shopName, d.shopName, 80) || d.shopName,
    whatsappNumber: phoneClean.length >= 5 ? phoneClean : d.whatsappNumber,
    estimatedWaitMins: Math.max(1, Math.min(240, Math.round(Number(input.estimatedWaitMins) || d.estimatedWaitMins))),
    orderingEnabled: input.orderingEnabled ?? d.orderingEnabled,
    pickupEnabled: input.pickupEnabled ?? d.pickupEnabled,
    deliveryEnabled: input.deliveryEnabled ?? d.deliveryEnabled,
    currencySymbol: clampStr(input.currencySymbol, d.currencySymbol, 8) || d.currencySymbol,

    ordersNeededForReward: Math.max(1, Math.min(100, Math.round(Number(input.ordersNeededForReward) || d.ordersNeededForReward))),
    rewardText: clampStr(input.rewardText, d.rewardText, 160),
    membershipPrice: Math.max(0, Math.min(100000, Number(input.membershipPrice ?? d.membershipPrice) || 0)),
    clubEnabled: input.clubEnabled ?? d.clubEnabled,

    darkMode: input.darkMode ?? d.darkMode,
    brandColor: clampHex(input.brandColor, d.brandColor),
    accentColor: clampHex(input.accentColor, d.accentColor),
    crownColor: clampHex(input.crownColor, d.crownColor),
    backgroundColor: clampHex(input.backgroundColor, d.backgroundColor),
    textColor: clampHex(input.textColor, d.textColor),
    headingFont: clampStr(input.headingFont, d.headingFont, 80),
    bodyFont: clampStr(input.bodyFont, d.bodyFont, 80),
    animationsEnabled: input.animationsEnabled ?? d.animationsEnabled,
    animationScale: Math.max(0.5, Math.min(5, Number(input.animationScale ?? d.animationScale) || d.animationScale)),
    logoUrl: clampStr(input.logoUrl, d.logoUrl, 500),

    aboutHeading: clampStr(input.aboutHeading, d.aboutHeading, 120),
    aboutBody: clampStr(input.aboutBody, d.aboutBody, 2000),
    aboutHighlight: clampStr(input.aboutHighlight, d.aboutHighlight, 300),

    contactHeading: clampStr(input.contactHeading, d.contactHeading, 120),
    contactPhone: clampStr(input.contactPhone, d.contactPhone, 40),
    contactEmail: clampStr(input.contactEmail, d.contactEmail, 120),
    contactAddress: clampStr(input.contactAddress, d.contactAddress, 240),
    contactHours: clampStr(input.contactHours, d.contactHours, 160),
    contactNote: clampStr(input.contactNote, d.contactNote, 600),

    splashEnabled: input.splashEnabled ?? d.splashEnabled,
    splashTitle: clampStr(input.splashTitle, d.splashTitle, 120),
    splashTagline: clampStr(input.splashTagline, d.splashTagline, 240),
    splashCtaText: clampStr(input.splashCtaText, d.splashCtaText, 60),
    splashImageUrl: clampStr(input.splashImageUrl, d.splashImageUrl, 500),

    footerText: clampStr(input.footerText, d.footerText, 240),
    footerSubtext: clampStr(input.footerSubtext, d.footerSubtext, 240),

    tagline: clampStr(input.tagline, d.tagline, 120),
    tabCombos: clampStr(input.tabCombos, d.tabCombos, 40),
    tabBuild: clampStr(input.tabBuild, d.tabBuild, 40),
    tabOrders: clampStr(input.tabOrders, d.tabOrders, 40),
    tabCard: clampStr(input.tabCard, d.tabCard, 40),
    tabClub: clampStr(input.tabClub, d.tabClub, 40),
    pickBarComboText: clampStr(input.pickBarComboText, d.pickBarComboText, 60),
    pickBarBuildText: clampStr(input.pickBarBuildText, d.pickBarBuildText, 60),
    viewOrderText: clampStr(input.viewOrderText, d.viewOrderText, 60),

    ticketHeading: clampStr(input.ticketHeading, d.ticketHeading, 80),
    ticketWaitLabel: clampStr(input.ticketWaitLabel, d.ticketWaitLabel, 60),
    ticketWhatsappText: clampStr(input.ticketWhatsappText, d.ticketWhatsappText, 60),
    ticketBackText: clampStr(input.ticketBackText, d.ticketBackText, 60),
    ticketFooterNote: clampStr(input.ticketFooterNote, d.ticketFooterNote, 200),
  };
}

export function sanitizeCategory(input: MenuCategoryRecord): MenuCategoryRecord {
  return {
    id: sanitizeId(input.id, `cat_${input.key}`),
    key: input.key,
    name: clampStr(input.name, 'Category', 60) || 'Category',
    selectionMode: input.selectionMode === 'single' ? 'single' : 'multi',
    sortOrder: Math.max(0, Math.min(1000, Math.round(Number(input.sortOrder) || 0))),
    available: Boolean(input.available),
  };
}

export function sanitizeMenuItem(input: MenuItemRecord): MenuItemRecord {
  const vk = sanitizeId(input.visualKey || input.id, 'beef');
  return {
    id: sanitizeId(input.id, 'menu_item'),
    categoryKey: input.categoryKey,
    name: clampStr(input.name, 'Item', 80) || 'Item',
    price: Math.max(0, Math.min(100000, Math.round(Number(input.price) || 0))),
    description: clampStr(input.description, '', 300),
    swatch: clampHex(input.swatch, '#E1000F'),
    visualKey: vk,
    maxQty: Math.max(1, Math.min(10, Math.round(Number(input.maxQty) || 1))),
    sortOrder: Math.max(0, Math.min(1000, Math.round(Number(input.sortOrder) || 0))),
    available: Boolean(input.available),
    comboBun: clampStr(input.comboBun, '', 64),
    comboIngredients: Array.isArray(input.comboIngredients)
      ? input.comboIngredients
          .filter((x): x is string => typeof x === 'string' && x.length > 0)
          .map((x) => x.slice(0, 80))
          .slice(0, 20)
      : [],
  };
}

export function formatCurrency(amount: number, symbol = 'J$', zeroLabel?: string): string {
  if (amount === 0 && zeroLabel) return zeroLabel;
  return `${symbol}${amount.toLocaleString('en-US')}`;
}

export function timestampToMillis(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'object') {
    const obj = ts as { toMillis?: () => number; seconds?: number };
    if (typeof obj.toMillis === 'function') {
      return obj.toMillis();
    }
    if (typeof obj.seconds === 'number') {
      return obj.seconds * 1000;
    }
  }
  return 0;
}
