export type BunId = "sesame_bun" | "original_bun" | "sliced_bread" | "lettuce_wrap";

export type MeatId = "beef" | "chicken" | "nuggets" | "double_beef";

export type CheeseId =
  | "american_cheese"
  | "cheddar"
  | "pepper_jack"
  | "havarti"
  | "gouda"
  | "colby_jack"
  | "mild_cheddar";

export type ToppingId =
  | "lettuce"
  | "tomato"
  | "onion"
  | "pickles"
  | "scotch_bonnet"
  | "caramelized_onions"
  | "bacon";

export type SauceId =
  | "signature"
  | "sweet_chilli"
  | "ranch"
  | "tangy_bbq"
  | "ketchup"
  | "mustard"
  | "mayo"
  | "bbq";

export type SideId = "fries" | "seasoned_fries";

export type MenuCategoryKey = "bun" | "meat" | "cheese" | "toppings" | "sauces" | "sides";
export type OrderMode = "Pickup" | "Delivery";

export interface MenuOption<T extends string = string> {
  id: T;
  name: string;
  price: number;
  description?: string;
  swatch: string;
  category: MenuCategoryKey;
}

export interface ComboItem {
  id: string;
  name: string;
  price: number;
  description: string;
  build: BurgerBuildState;
}

export interface BurgerBuildState {
  bun: BunId;
  meats: Partial<Record<MeatId, number>>;
  cheeses: Partial<Record<CheeseId, number>>;
  toppings: Partial<Record<ToppingId, number>>;
  sauces: Partial<Record<SauceId, number>>;
  sides: Partial<Record<SideId, number>>;
  activeComboId: string | null;
}

// Exact live settings from https://speedyburgersja.com/
export const WHATSAPP_NUMBER = "18764685461";
export const ESTIMATED_WAIT_MINS = 30;

export const BUN_OPTIONS: MenuOption<BunId>[] = [
  { id: "original_bun", name: "Original bun", price: 300, swatch: "#d27d2d", category: "bun" },
  { id: "sesame_bun", name: "Sesame bun", price: 350, swatch: "#c87124", category: "bun" },
  { id: "sliced_bread", name: "Sliced bread", price: 150, swatch: "#dfab64", category: "bun" },
  { id: "lettuce_wrap", name: "Lettuce wrap", price: 250, swatch: "#6ab536", category: "bun" },
];

export const MEAT_OPTIONS: MenuOption<MeatId>[] = [
  { id: "beef", name: "Beef", price: 500, swatch: "#6e3824", category: "meat" },
  { id: "chicken", name: "Chicken", price: 450, swatch: "#c98132", category: "meat" },
  {
    id: "nuggets",
    name: "Nuggets",
    price: 300,
    description: "Serving size 3 pieces",
    swatch: "#d99238",
    category: "meat",
  },
  { id: "double_beef", name: "Double beef", price: 650, swatch: "#592b1a", category: "meat" },
];

export const CHEESE_OPTIONS: MenuOption<CheeseId>[] = [
  { id: "cheddar", name: "Cheddar", price: 200, swatch: "#f59e16", category: "cheese" },
  { id: "pepper_jack", name: "Pepper jack", price: 200, swatch: "#efe5c8", category: "cheese" },
  { id: "havarti", name: "Havarti Cheese", price: 200, swatch: "#f6df9e", category: "cheese" },
  { id: "gouda", name: "Gouda Cheese", price: 200, swatch: "#e79f32", category: "cheese" },
  {
    id: "colby_jack",
    name: "Colby & Monterey Jack Cheese",
    price: 200,
    swatch: "#f2be54",
    category: "cheese",
  },
  {
    id: "mild_cheddar",
    name: "Mild cheddar cheese",
    price: 200,
    swatch: "#f8b434",
    category: "cheese",
  },
  {
    id: "american_cheese",
    name: "American Cheese",
    price: 200,
    swatch: "#ffc034",
    category: "cheese",
  },
];

export const TOPPING_OPTIONS: MenuOption<ToppingId>[] = [
  { id: "lettuce", name: "Lettuce", price: 100, swatch: "#6ab536", category: "toppings" },
  { id: "tomato", name: "Tomato", price: 50, swatch: "#df3624", category: "toppings" },
  { id: "onion", name: "Onion", price: 50, swatch: "#9f3676", category: "toppings" },
  { id: "pickles", name: "Pickles", price: 50, swatch: "#7c9b32", category: "toppings" },
  {
    id: "scotch_bonnet",
    name: "Scotch bonnet pepper",
    price: 25,
    swatch: "#ea4d15",
    category: "toppings",
  },
  {
    id: "caramelized_onions",
    name: "Caramelized onions",
    price: 50,
    swatch: "#8a4618",
    category: "toppings",
  },
  { id: "bacon", name: "Bacon", price: 150, swatch: "#a83324", category: "toppings" },
];

export const SAUCE_OPTIONS: MenuOption<SauceId>[] = [
  { id: "signature", name: "Signature", price: 50, swatch: "#e28238", category: "sauces" },
  { id: "sweet_chilli", name: "Sweet chilli", price: 50, swatch: "#c72a18", category: "sauces" },
  { id: "ranch", name: "Ranch", price: 50, swatch: "#eee9d8", category: "sauces" },
  { id: "tangy_bbq", name: "Tangy BBQ", price: 50, swatch: "#5d1f10", category: "sauces" },
  { id: "ketchup", name: "Ketchup", price: 0, swatch: "#c41612", category: "sauces" },
  { id: "mustard", name: "Mustard", price: 0, swatch: "#dca812", category: "sauces" },
  { id: "mayo", name: "Mayo", price: 0, swatch: "#f7f2df", category: "sauces" },
  { id: "bbq", name: "BBQ", price: 0, swatch: "#48160c", category: "sauces" },
];

export const SIDE_OPTIONS: MenuOption<SideId>[] = [
  { id: "fries", name: "Fries", price: 250, swatch: "#fdb105", category: "sides" },
  {
    id: "seasoned_fries",
    name: "Seasoned fries",
    price: 300,
    swatch: "#df7918",
    category: "sides",
  },
];

export const COMBOS: ComboItem[] = [
  {
    id: "speedy_classic_combo",
    name: "Speedy Classic burger combo",
    price: 1250,
    description:
      "1 burger patty, American cheese, lettuce, tomatoes, caramelized onions, signature sauce. Comes with regular fries.",
    build: {
      bun: "sesame_bun",
      meats: { beef: 1 },
      cheeses: { american_cheese: 1 },
      toppings: { lettuce: 1, tomato: 1, caramelized_onions: 1 },
      sauces: { signature: 1 },
      sides: { fries: 1 },
      activeComboId: "speedy_classic_combo",
    },
  },
  {
    id: "turbo_bbq_combo",
    name: "Turbo BBQ burger combo",
    price: 1250,
    description:
      "1 burger patty, American cheese, lettuce, tomatoes, crispy onions, BBQ sauce. Comes with regular fries.",
    build: {
      bun: "sesame_bun",
      meats: { beef: 1 },
      cheeses: { american_cheese: 1 },
      toppings: { lettuce: 1, tomato: 1, onion: 1 },
      sauces: { bbq: 1 },
      sides: { fries: 1 },
      activeComboId: "turbo_bbq_combo",
    },
  },
  {
    id: "diablo_combo",
    name: "Diablo burger combo",
    price: 1250,
    description:
      "1 burger patty, mixed cheese, lettuce, tomatoes, hot pepper, spicy mayo. Comes with regular fries.",
    build: {
      bun: "sesame_bun",
      meats: { beef: 1 },
      cheeses: { pepper_jack: 1, cheddar: 1 },
      toppings: { lettuce: 1, tomato: 1, scotch_bonnet: 1 },
      sauces: { mayo: 1 },
      sides: { fries: 1 },
      activeComboId: "diablo_combo",
    },
  },
  {
    id: "bbq_crispy_chicken_combo",
    name: "BBQ Crispy Chicken combo",
    price: 1250,
    description:
      "Crispy BBQ chicken, signature homemade BBQ sauce, American cheese, lettuce, tomatoes, burger bun. Comes with regular fries.",
    build: {
      bun: "original_bun",
      meats: { chicken: 1 },
      cheeses: { american_cheese: 1 },
      toppings: { lettuce: 1, tomato: 1 },
      sauces: { tangy_bbq: 1 },
      sides: { fries: 1 },
      activeComboId: "bbq_crispy_chicken_combo",
    },
  },
  {
    id: "nugget_crunch_combo",
    name: "Nugget Crunch combo",
    price: 900,
    description:
      "Crispy chicken nuggets, American cheese, lettuce, tomatoes, burger bun, signature sauce. Comes with regular fries.",
    build: {
      bun: "original_bun",
      meats: { nuggets: 1 },
      cheeses: { american_cheese: 1 },
      toppings: { lettuce: 1, tomato: 1 },
      sauces: { signature: 1 },
      sides: { fries: 1 },
      activeComboId: "nugget_crunch_combo",
    },
  },
];

// Default burger matches the exact exploded stack in the reference studio photograph
export function createSignatureBuild(): BurgerBuildState {
  return {
    bun: "sesame_bun",
    meats: { beef: 1 },
    cheeses: { american_cheese: 1 },
    toppings: {
      lettuce: 1,
      onion: 1,
      pickles: 1,
      tomato: 1,
      bacon: 1,
    },
    sauces: {},
    sides: {},
    activeComboId: null,
  };
}

export function createStarterBuild(): BurgerBuildState {
  return {
    bun: "sesame_bun",
    meats: { beef: 1 },
    cheeses: {},
    toppings: {},
    sauces: {},
    sides: {},
    activeComboId: null,
  };
}

export function formatJMD(amount: number): string {
  if (amount === 0) return "Free";
  return "J$" + amount.toLocaleString("en-US");
}

export function formatTotalJMD(amount: number): string {
  return "J$" + amount.toLocaleString("en-US");
}

export function getActiveCombo(build: BurgerBuildState): ComboItem | undefined {
  if (!build.activeComboId) return undefined;
  return COMBOS.find((c) => c.id === build.activeComboId);
}

export function calculateBuildPrice(build: BurgerBuildState): number {
  const combo = getActiveCombo(build);
  if (combo) return combo.price;

  const bunPrice = BUN_OPTIONS.find((b) => b.id === build.bun)?.price ?? 0;
  let total = bunPrice;

  for (const opt of MEAT_OPTIONS) {
    total += (build.meats[opt.id] ?? 0) * opt.price;
  }
  for (const opt of CHEESE_OPTIONS) {
    total += (build.cheeses[opt.id] ?? 0) * opt.price;
  }
  for (const opt of TOPPING_OPTIONS) {
    total += (build.toppings[opt.id] ?? 0) * opt.price;
  }
  for (const opt of SAUCE_OPTIONS) {
    total += (build.sauces[opt.id] ?? 0) * opt.price;
  }
  for (const opt of SIDE_OPTIONS) {
    total += (build.sides[opt.id] ?? 0) * opt.price;
  }
  return total;
}

export function buildOrderLines(
  build: BurgerBuildState
): Array<{ label: string; amount: number }> {
  const combo = getActiveCombo(build);
  if (combo) {
    return [{ label: combo.name, amount: combo.price }];
  }

  const lines: Array<{ label: string; amount: number }> = [];
  const bunOpt = BUN_OPTIONS.find((b) => b.id === build.bun);
  if (bunOpt) {
    lines.push({ label: bunOpt.name, amount: bunOpt.price });
  }

  const groups: Array<{ options: MenuOption[]; map: Partial<Record<string, number>> }> = [
    { options: MEAT_OPTIONS, map: build.meats },
    { options: CHEESE_OPTIONS, map: build.cheeses },
    { options: TOPPING_OPTIONS, map: build.toppings },
    { options: SAUCE_OPTIONS, map: build.sauces },
    { options: SIDE_OPTIONS, map: build.sides },
  ];

  for (const { options, map } of groups) {
    for (const opt of options) {
      const qty = map[opt.id] ?? 0;
      if (qty > 0) {
        lines.push({
          label: (qty > 1 ? `${qty} × ` : "") + opt.name,
          amount: qty * opt.price,
        });
      }
    }
  }
  return lines;
}

export function buildWhatsAppUrl(build: BurgerBuildState, mode: OrderMode): string {
  const combo = getActiveCombo(build);
  const lines = buildOrderLines(build);
  const total = calculateBuildPrice(build);
  const msg =
    `Hi Speedy Burger! I'd like to order (${mode}):\n` +
    (combo ? `- ${combo.name} (${combo.description})\n` : lines.map((l) => `- ${l.label}`).join("\n") + "\n") +
    `Total: ${formatTotalJMD(total)}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}
