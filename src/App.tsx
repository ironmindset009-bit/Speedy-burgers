import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  Award,
  Box,
  Camera,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  Eye,
  FileCode,
  Flame,
  Info,
  Layers,
  LogIn,
  Minus,
  Plus,
  RotateCw,
  Shield,
  ShoppingBag,
  SlidersHorizontal,
  Smile,
  Tag,
} from "lucide-react";
import { AdminDashboard } from "./components/AdminDashboard";
import { OrderMealCelebration, SpeedyPetStudio } from "./components/SpeedyPetStudio";
import {
  CustomerInfoModal,
  CustomerSheetTab,
  OrderTicketCard,
  SplashScreenOverlay,
} from "./components/CustomerViews";
import { SPEEDY_BURGER_LOGO } from "./data/logo";
import {
  BurgerBuildState,
  createSignatureBuild,
  createStarterBuild,
  MenuCategoryKey,
  OrderMode,
} from "./data/menu";
import {
  AdminCategoryKey,
  BurgerClubMemberRecord,
  DEFAULT_CATEGORIES,
  DEFAULT_MENU_ITEMS,
  DEFAULT_SITE_SETTINGS,
  formatCurrency,
  MenuCategoryRecord,
  MenuItemRecord,
  OrderRecord,
  parseComboBuild,
  SiteSettings,
} from "./data/siteConfig";
import {
  computePetCareStatus,
  createDefaultPetConfig,
  feedPetWithProgression,
  getEvolutionInfo,
  sanitizeSpeedyPet,
  SpeedyPetConfig,
} from "./data/speedyPetCatalog";
import { auth, signInWithGoogle, signOutUser } from "./firebase";
import {
  checkIsAdmin,
  createOrder,
  saveSpeedyPetToFirestore,
  subscribeCategories,
  subscribeMenuItems,
  subscribeSiteSettings,
  subscribeUserBurgerClub,
  subscribeUserOrders,
  subscribeUserSpeedyPets,
} from "./services/storefrontService";
import BurgerStage, {
  BurgerStageHandle,
  CameraPreset,
  StudioTheme,
} from "./three/BurgerStage";
import { buildStandaloneBurgerHtml } from "./utils/standaloneHtml";

type DockTab = "build" | "combos" | "studio" | "order" | "download";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunks: string[] = [];
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + chunkSize)));
  }
  return btoa(chunks.join(""));
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const stageRef = useRef<BurgerStageHandle>(null);

  // Live CMS & Firestore state
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [rawCategories, setRawCategories] = useState<MenuCategoryRecord[]>([]);
  const [rawItems, setRawItems] = useState<MenuItemRecord[]>([]);

  // Auth & Role state
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [userOrders, setUserOrders] = useState<OrderRecord[]>([]);
  const [clubMember, setClubMember] = useState<BurgerClubMemberRecord | null>(null);

  // Overlays & Studio Mode
  const [appMode, setAppMode] = useState<"burger" | "pet">("burger");
  const [splashDismissed, setSplashDismissed] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [infoSheetTab, setInfoSheetTab] = useState<CustomerSheetTab | null>(null);

  // 3D Builder state
  const [build, setBuild] = useState<BurgerBuildState>(createSignatureBuild);
  const [buildCategory, setBuildCategory] = useState<MenuCategoryKey>("toppings");
  const [orderMode, setOrderMode] = useState<OrderMode>("Pickup");
  const [explodeAmount, setExplodeAmount] = useState<number>(1);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("photo");
  const [presetVersion, setPresetVersion] = useState<number>(0);
  const [studioTheme, setStudioTheme] = useState<StudioTheme>("studio");
  const [dockTab, setDockTab] = useState<DockTab>("build");
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);
  const [exportingType, setExportingType] = useState<"png" | "glb" | "html" | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Order checkout form & ticket state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<OrderRecord | null>(null);

  // Speedy Pet Animal Buddy & Order-to-Feed Sync
  const [activePet, setActivePet] = useState<SpeedyPetConfig>(() => {
    try {
      const raw = localStorage.getItem("speedy_active_pet_v1");
      if (raw) return sanitizeSpeedyPet(JSON.parse(raw) as Partial<SpeedyPetConfig>);
    } catch {
      // ignore
    }
    return createDefaultPetConfig("male", "shadow_tux");
  });
  const [localSavedPets, setLocalSavedPets] = useState<SpeedyPetConfig[]>(() => {
    try {
      const raw = localStorage.getItem("speedy_pets_v1");
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          return arr.map((p) => sanitizeSpeedyPet(p as Partial<SpeedyPetConfig>));
        }
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [cloudSavedPets, setCloudSavedPets] = useState<SpeedyPetConfig[]>([]);
  const [justAteOrderMeal, setJustAteOrderMeal] = useState<OrderMealCelebration | null>(null);
  const [petFedNotice, setPetFedNotice] = useState<string | null>(null);

  // Subscribe to public storefront CMS data
  useEffect(() => {
    const unsubSettings = subscribeSiteSettings((next) => {
      setSettings(next);
    });
    const unsubCats = subscribeCategories(setRawCategories);
    const unsubItems = subscribeMenuItems(setRawItems);
    return () => {
      unsubSettings();
      unsubCats();
      unsubItems();
    };
  }, []);

  // Sync dark mode preference from CMS appearance when settings update
  useEffect(() => {
    setStudioTheme(settings.darkMode ? "grill" : "studio");
  }, [settings.darkMode]);

  // Sync pickup/delivery defaults if one mode is disabled by admin
  useEffect(() => {
    if (!settings.pickupEnabled && settings.deliveryEnabled) {
      setOrderMode("Delivery");
    } else if (settings.pickupEnabled && !settings.deliveryEnabled) {
      setOrderMode("Pickup");
    }
  }, [settings.deliveryEnabled, settings.pickupEnabled]);

  // Auth listener & RBAC check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (currentUser?.displayName) {
        setCustomerName((prev) => prev || currentUser.displayName || "");
      }
      if (!currentUser) {
        setIsAdmin(false);
        setAdminCheckLoading(false);
        return;
      }
      setAdminCheckLoading(true);
      void checkIsAdmin(currentUser)
        .then((allowed) => setIsAdmin(allowed))
        .catch(() => setIsAdmin(false))
        .finally(() => setAdminCheckLoading(false));
    });
    return () => unsub();
  }, []);

  // Authenticated user's own orders, Burger Club card & saved Speedy Pets
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setUserOrders([]);
      setClubMember(null);
      setCloudSavedPets([]);
      return;
    }
    const unsubOrders = subscribeUserOrders(user.uid, setUserOrders);
    const unsubClub = subscribeUserBurgerClub(user.uid, setClubMember);
    const unsubPets = subscribeUserSpeedyPets(user.uid, (pets) => {
      setCloudSavedPets(pets);
    });
    return () => {
      unsubOrders();
      unsubClub();
      unsubPets();
    };
  }, [authReady, user]);

  const savedPets = useMemo(() => {
    if (user && user.emailVerified) {
      const merged = new Map<string, SpeedyPetConfig>();
      for (const c of cloudSavedPets) merged.set(c.id, c);
      for (const l of localSavedPets) {
        if (!merged.has(l.id)) merged.set(l.id, l);
      }
      return Array.from(merged.values());
    }
    return localSavedPets;
  }, [cloudSavedPets, localSavedPets, user]);

  const persistLocalPetList = useCallback((nextList: SpeedyPetConfig[]) => {
    setLocalSavedPets(nextList);
    try {
      localStorage.setItem("speedy_pets_v1", JSON.stringify(nextList.slice(0, 20)));
    } catch {
      // ignore
    }
  }, []);

  const handleChangePet = useCallback((next: SpeedyPetConfig) => {
    setActivePet(next);
    try {
      localStorage.setItem("speedy_active_pet_v1", JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const feedPetSameOrderFood = useCallback(
    (mealTitle: string, mealItems: string[]) => {
      const res = feedPetWithProgression(activePet, mealTitle, mealItems, Date.now(), 40);
      const updated = res.pet;
      handleChangePet(updated);
      const nextList = [updated, ...localSavedPets.filter((p) => p.id !== updated.id)];
      persistLocalPetList(nextList);
      if (user && user.emailVerified) {
        void saveSpeedyPetToFirestore(user, updated).catch(() => undefined);
      }
      const nextEvo = getEvolutionInfo(updated.species, res.newStage);
      setJustAteOrderMeal({
        mealName: mealTitle,
        xpGained: res.xpGained,
        leveledUpTo: res.leveledUp ? res.newLevel : null,
        evolvedTitle: res.evolved ? nextEvo.title : null,
      });
      if (res.evolved) {
        setPetFedNotice(
          `${updated.name} ate your ${mealTitle} & EVOLVED into ${nextEvo.title} (Lv.${res.newLevel})!`
        );
      } else if (res.leveledUp) {
        setPetFedNotice(
          `${updated.name} ate your ${mealTitle} & reached Level ${res.newLevel}! (+${res.xpGained} XP)`
        );
      } else {
        setPetFedNotice(
          `${updated.name} ate your ${mealTitle}! (+${res.xpGained} XP · 100% Full)`
        );
      }
    },
    [activePet, handleChangePet, localSavedPets, persistLocalPetList, user]
  );

  const petCareStatus = useMemo(() => computePetCareStatus(activePet), [activePet]);

  // Active catalog (Firestore live data, falling back cleanly to Speedy Burger defaults before first seed)
  const effectiveCategories = useMemo(
    () => (rawCategories.length > 0 ? rawCategories : DEFAULT_CATEGORIES),
    [rawCategories]
  );
  const effectiveItems = useMemo(
    () => (rawItems.length > 0 ? rawItems : DEFAULT_MENU_ITEMS),
    [rawItems]
  );

  const visibleBuildCategories = useMemo(() => {
    const allowedKeys: MenuCategoryKey[] = ["bun", "meat", "cheese", "toppings", "sauces", "sides"];
    return effectiveCategories
      .filter((c) => c.available && allowedKeys.includes(c.key as MenuCategoryKey))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [effectiveCategories]);

  useEffect(() => {
    if (
      visibleBuildCategories.length > 0 &&
      !visibleBuildCategories.some((c) => c.key === buildCategory)
    ) {
      setBuildCategory(visibleBuildCategories[0].key as MenuCategoryKey);
    }
  }, [buildCategory, visibleBuildCategories]);

  const combosAvailable = useMemo(() => {
    const cat = effectiveCategories.find((c) => c.key === "combos");
    if (cat && !cat.available) return [];
    return effectiveItems
      .filter((it) => it.categoryKey === "combos" && it.available)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [effectiveCategories, effectiveItems]);

  const itemsByCategory = useMemo(() => {
    const map: Record<AdminCategoryKey, MenuItemRecord[]> = {
      bun: [],
      meat: [],
      cheese: [],
      toppings: [],
      sauces: [],
      sides: [],
      combos: [],
    };
    for (const item of effectiveItems) {
      if (item.available) {
        map[item.categoryKey]?.push(item);
      }
    }
    for (const key of Object.keys(map) as AdminCategoryKey[]) {
      map[key].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return map;
  }, [effectiveItems]);

  const itemLookup = useMemo(() => {
    return new Map(effectiveItems.map((it) => [it.id, it]));
  }, [effectiveItems]);

  const activeComboItem = useMemo(() => {
    if (!build.activeComboId) return undefined;
    return combosAvailable.find((c) => c.id === build.activeComboId);
  }, [build.activeComboId, combosAvailable]);

  const { totalPrice, orderLines } = useMemo(() => {
    if (activeComboItem) {
      return {
        totalPrice: activeComboItem.price,
        orderLines: [{ label: activeComboItem.name, amount: activeComboItem.price }],
      };
    }

    const lines: Array<{ label: string; amount: number }> = [];
    let total = 0;

    const bunOpt = itemLookup.get(build.bun);
    if (bunOpt) {
      lines.push({ label: bunOpt.name, amount: bunOpt.price });
      total += bunOpt.price;
    }

    const maps: Array<Partial<Record<string, number>>> = [
      build.meats,
      build.cheeses,
      build.toppings,
      build.sauces,
      build.sides,
    ];
    for (const m of maps) {
      for (const [id, qty] of Object.entries(m)) {
        if (!qty || qty <= 0) continue;
        const opt = itemLookup.get(id);
        if (!opt) continue;
        const amt = qty * opt.price;
        total += amt;
        lines.push({
          label: `${qty > 1 ? `${qty} × ` : ""}${opt.name}`,
          amount: amt,
        });
      }
    }
    return { totalPrice: total, orderLines: lines };
  }, [activeComboItem, build, itemLookup]);

  const whatsappUrl = useMemo(() => {
    const ticketPart = activeTicket ? `Ticket #${activeTicket.ticketCode}\n` : "";
    const msg =
      `Hi ${settings.shopName}! I'd like to order (${orderMode}):\n` +
      ticketPart +
      (activeComboItem
        ? `- ${activeComboItem.name} (${activeComboItem.description})\n`
        : orderLines.map((l) => `- ${l.label}`).join("\n") + "\n") +
      `Total: ${formatCurrency(totalPrice, settings.currencySymbol)}`;
    const cleanPhone = settings.whatsappNumber.replace(/[^0-9]/g, "") || "18764685461";
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  }, [
    activeComboItem,
    activeTicket,
    orderLines,
    orderMode,
    settings.currencySymbol,
    settings.shopName,
    settings.whatsappNumber,
    totalPrice,
  ]);

  const selectBun = useCallback((bunId: string) => {
    setActiveTicket(null);
    setBuild((prev) => ({
      ...prev,
      bun: bunId as BurgerBuildState["bun"],
      activeComboId: null,
    }));
  }, []);

  const updateItemQty = useCallback(
    (category: Exclude<MenuCategoryKey, "bun">, id: string, delta: number, maxQty = 2) => {
      setActiveTicket(null);
      setBuild((prev) => {
        const next: BurgerBuildState = {
          ...prev,
          meats: { ...prev.meats },
          cheeses: { ...prev.cheeses },
          toppings: { ...prev.toppings },
          sauces: { ...prev.sauces },
          sides: { ...prev.sides },
          activeComboId: null,
        };
        const targetMap = (
          category === "meat"
            ? next.meats
            : category === "cheese"
              ? next.cheeses
              : category === "toppings"
                ? next.toppings
                : category === "sauces"
                  ? next.sauces
                  : next.sides
        ) as Record<string, number>;

        const val = Math.max(0, Math.min(maxQty, (targetMap[id] ?? 0) + delta));
        if (val === 0) delete targetMap[id];
        else targetMap[id] = val;
        return next;
      });
    },
    []
  );

  const selectCombo = useCallback(
    (comboId: string) => {
      const combo = combosAvailable.find((c) => c.id === comboId);
      if (!combo) return;
      setActiveTicket(null);
      setBuild(parseComboBuild(combo));
    },
    [combosAvailable]
  );

  const triggerPreset = useCallback((preset: CameraPreset) => {
    setCameraPreset(preset);
    setPresetVersion((v) => v + 1);
  }, []);

  const resetToPhotoStack = useCallback(() => {
    setActiveTicket(null);
    setBuild(createSignatureBuild());
    setExplodeAmount(1);
    setAutoRotate(false);
    setShowLabels(true);
    setStudioTheme(settings.darkMode ? "grill" : "studio");
    triggerPreset("photo");
  }, [settings.darkMode, triggerPreset]);

  const startOver = useCallback(() => {
    setActiveTicket(null);
    setBuild(createStarterBuild());
  }, []);

  const handleSubmitOrder = async () => {
    if (!user) return;
    if (!settings.orderingEnabled) {
      setOrderError("Online ordering is currently paused by the kitchen.");
      return;
    }
    if (!customerName.trim() || customerPhone.trim().length < 5) {
      setOrderError("Please enter your name and a valid phone number.");
      return;
    }
    if (orderMode === "Delivery" && !deliveryAddress.trim()) {
      setOrderError("Please enter your delivery address.");
      return;
    }

    setPlacingOrder(true);
    setOrderError(null);
    try {
      const orderSummaryName = activeComboItem?.name || "Custom Speedy Burger";
      const orderSummaryItems = orderLines.map((l) => l.label);
      const created = await createOrder(user, {
        customerName,
        customerPhone,
        deliveryAddress: orderMode === "Delivery" ? deliveryAddress : "",
        orderMode,
        comboName: activeComboItem?.name ?? "",
        items: orderSummaryItems,
        total: totalPrice,
        notes: orderNotes,
      });
      setActiveTicket(created);
      feedPetSameOrderFood(orderSummaryName, orderSummaryItems);
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : "Could not place order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleDownloadPng = useCallback(async () => {
    if (!stageRef.current || exportingType) return;
    setExportingType("png");
    setExportMessage(null);
    try {
      const blob = await stageRef.current.exportPng();
      if (blob) {
        triggerBlobDownload(blob, "Speedy_Burger_3D.png");
        setExportMessage("Downloaded studio PNG snapshot.");
      }
    } catch {
      setExportMessage("Could not capture PNG snapshot.");
    } finally {
      setExportingType(null);
    }
  }, [exportingType]);

  const handleDownloadGlb = useCallback(async () => {
    if (!stageRef.current || exportingType) return;
    setExportingType("glb");
    setExportMessage(null);
    try {
      const buffer = await stageRef.current.exportGlbBuffer();
      const blob = new Blob([buffer], { type: "model/gltf-binary" });
      triggerBlobDownload(blob, "Speedy_Burger_3D.glb");
      setExportMessage("Downloaded 3D GLB model.");
    } catch {
      setExportMessage("Could not export 3D GLB file.");
    } finally {
      setExportingType(null);
    }
  }, [exportingType]);

  const handleDownloadHtml = useCallback(async () => {
    if (!stageRef.current || exportingType) return;
    setExportingType("html");
    setExportMessage(null);
    try {
      const buffer = await stageRef.current.exportGlbBuffer();
      const glbBase64 = arrayBufferToBase64(buffer);
      const html = buildStandaloneBurgerHtml({
        glbBase64,
        logoDataUri: settings.logoUrl || SPEEDY_BURGER_LOGO,
        backdropCss: stageRef.current.getBackdropCss(),
        orderLines,
        totalFormatted: formatCurrency(totalPrice, settings.currencySymbol),
        whatsappUrl,
        comboName: activeComboItem?.name,
      });
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      triggerBlobDownload(blob, "Speedy_Burger_3D.html");
      setExportMessage("Downloaded standalone 3D HTML file.");
    } catch {
      setExportMessage("Could not generate HTML file.");
    } finally {
      setExportingType(null);
    }
  }, [
    activeComboItem?.name,
    exportingType,
    orderLines,
    settings.currencySymbol,
    settings.logoUrl,
    totalPrice,
    whatsappUrl,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "h" || e.key === "H") {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isDarkStudio = studioTheme === "grill";
  const activeCategoryOptions = itemsByCategory[buildCategory] ?? [];

  const getQtyForOption = (cat: MenuCategoryKey, id: string): number => {
    if (cat === "bun") return build.bun === id ? 1 : 0;
    if (cat === "meat") return (build.meats as Record<string, number>)[id] ?? 0;
    if (cat === "cheese") return (build.cheeses as Record<string, number>)[id] ?? 0;
    if (cat === "toppings") return (build.toppings as Record<string, number>)[id] ?? 0;
    if (cat === "sauces") return (build.sauces as Record<string, number>)[id] ?? 0;
    return (build.sides as Record<string, number>)[id] ?? 0;
  };

  const brand = settings.brandColor || "#E1000F";
  const accent = settings.accentColor || "#FDB105";
  const fontStyles = {
    fontFamily: settings.bodyFont ? `"${settings.bodyFont}", Barlow, sans-serif` : undefined,
  };

  return (
    <div
      style={fontStyles}
      className="flex flex-col md:flex-row w-screen h-dvh overflow-hidden select-none"
    >
      {/* Optional CMS Splash Screen */}
      {settings.splashEnabled && !splashDismissed && (
        <SplashScreenOverlay settings={settings} onEnter={() => setSplashDismissed(true)} />
      )}

      {/* Customer Info / About / Contact / Burger Club / Orders Sheet */}
      {infoSheetTab && (
        <CustomerInfoModal
          initialTab={infoSheetTab}
          settings={settings}
          user={user}
          clubMember={clubMember}
          userOrders={userOrders}
          onSignIn={async () => {
            await signInWithGoogle();
          }}
          onSignOut={signOutUser}
          onClose={() => setInfoSheetTab(null)}
        />
      )}

      {/* Secure Staff Admin Dashboard */}
      {adminOpen && (
        <AdminDashboard
          user={user}
          isAdmin={isAdmin}
          authLoading={adminCheckLoading}
          settings={settings}
          categories={effectiveCategories}
          items={effectiveItems}
          onSignIn={async () => {
            await signInWithGoogle();
          }}
          onSignOut={signOutUser}
          onClose={() => setAdminOpen(false)}
        />
      )}

      {appMode === "pet" ? (
        <SpeedyPetStudio
          settings={settings}
          user={user}
          isAdmin={isAdmin}
          pet={activePet}
          savedPets={savedPets}
          justAteOrderMeal={justAteOrderMeal}
          onAcknowledgeOrderMeal={() => setJustAteOrderMeal(null)}
          onChangePet={handleChangePet}
          onPersistSavedList={persistLocalPetList}
          onSwitchToBurger={() => setAppMode("burger")}
          onOpenAdmin={() => setAdminOpen(true)}
        />
      ) : (
        <>
          {/* Dedicated Non-Overlapping 3D Burger Viewport */}
          <main className="relative flex-1 min-w-0 min-h-0 overflow-hidden">
        <BurgerStage
          ref={stageRef}
          build={build}
          explodeAmount={explodeAmount}
          autoRotate={autoRotate}
          cameraPreset={cameraPreset}
          presetVersion={presetVersion}
          studioTheme={studioTheme}
          showLabels={showLabels}
          catalogItems={effectiveItems}
          animationsEnabled={settings.animationsEnabled}
          onHoverLayer={setHoveredLayer}
        />

        {/* Compact Top Header Strip Inside 3D Stage */}
        <header className="pointer-events-none absolute top-0 left-0 right-0 pt-[max(10px,env(safe-area-inset-top))] px-2.5 sm:px-4 z-20 flex items-start justify-between gap-2 sm:gap-3">
          <div
            className="pointer-events-auto flex items-center gap-2 sm:gap-2.5 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-1.5 shadow-md border border-[#3a0b08]/10 min-w-0"
            style={{ backgroundColor: accent }}
          >
            <img
              src={settings.logoUrl || SPEEDY_BURGER_LOGO}
              alt={`${settings.shopName} logo`}
              className="h-6 sm:h-8 w-auto rounded-md object-contain shrink-0"
            />
            <div className="leading-tight min-w-0">
              <h1
                className="font-display text-lg sm:text-2xl leading-none whitespace-nowrap"
                style={{
                  color: brand,
                  fontFamily: settings.headingFont
                    ? `"${settings.headingFont}", "Barlow Condensed", sans-serif`
                    : undefined,
                }}
              >
                {settings.shopName}
              </h1>
              <p className="text-[10px] font-semibold text-[#3a0b08]/80 whitespace-nowrap truncate">
                {settings.tagline || "Drag 360° · Build to order"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setAppMode("pet")}
              title="Open Speedy Pet 3D Talking Animal Buddy"
              className="pointer-events-auto inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold shadow-md border border-[#3a0b08]/15 cursor-pointer transition-colors text-[#3a0b08]"
              style={{
                backgroundColor: petCareStatus.isHungry ? "#FFE1DF" : accent,
                borderColor: petCareStatus.isHungry ? brand : undefined,
              }}
            >
              <Smile className="w-3.5 h-3.5" style={{ color: brand }} />
              <span>
                {petCareStatus.isFainted
                  ? "Revive Pet!"
                  : petCareStatus.isHungry
                    ? "Feed Pet"
                    : "Speedy Pet"}
              </span>
            </button>

            {settings.clubEnabled && (
              <button
                type="button"
                onClick={() => setInfoSheetTab("club")}
                title={settings.tabClub}
                className={`pointer-events-auto inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold shadow-md border cursor-pointer transition-colors ${
                  isDarkStudio
                    ? "bg-[#341a10] text-[#fff1d6] border-[#fff1d6]/15"
                    : "bg-[#fffaf2] text-[#3a0b08] border-[#3a0b08]/12"
                }`}
              >
                <Award className="w-3.5 h-3.5" style={{ color: brand }} />
                <span className="hidden lg:inline">{settings.tabClub}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setInfoSheetTab("about")}
              title="About, Contact & My Orders"
              className={`pointer-events-auto inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold shadow-md border cursor-pointer transition-colors ${
                isDarkStudio
                  ? "bg-[#341a10] text-[#fff1d6] border-[#fff1d6]/15"
                  : "bg-[#fffaf2] text-[#3a0b08] border-[#3a0b08]/12"
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Info</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              title="Staff Admin Dashboard"
              className={`pointer-events-auto inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold shadow-md border cursor-pointer transition-colors ${
                isAdmin
                  ? "text-white border-transparent"
                  : isDarkStudio
                    ? "bg-[#341a10] text-[#fff1d6] border-[#fff1d6]/15"
                    : "bg-[#fffaf2] text-[#3a0b08] border-[#3a0b08]/12"
              }`}
              style={isAdmin ? { backgroundColor: brand } : undefined}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLabels((s) => !s)}
              aria-pressed={showLabels}
              title="Toggle ingredient diagram labels"
              className={`pointer-events-auto inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold shadow-md border cursor-pointer transition-colors ${
                showLabels
                  ? "text-white border-transparent"
                  : isDarkStudio
                    ? "bg-[#341a10] text-[#fff1d6] border-[#fff1d6]/15"
                    : "bg-[#fffaf2] text-[#3a0b08] border-[#3a0b08]/12"
              }`}
              style={showLabels ? { backgroundColor: brand } : undefined}
            >
              <Tag className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Labels</span>
            </button>

            <div className="flex flex-col items-end gap-1 max-w-[36vw] sm:max-w-none">
              <div
                className={`pointer-events-auto flex items-baseline gap-1.5 sm:gap-2 rounded-xl px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 shadow-md border max-w-full ${
                  isDarkStudio
                    ? "bg-[#341a10] text-[#fff1d6] border-[#fff1d6]/15"
                    : "bg-[#fffaf2] text-[#3a0b08] border-[#3a0b08]/12"
                }`}
              >
                <span className="text-[10px] sm:text-xs font-semibold opacity-70 truncate max-w-[68px] sm:max-w-[155px]">
                  {activeComboItem ? activeComboItem.name : "Total"}
                </span>
                <span
                  className="font-display text-lg sm:text-2xl tabular-nums leading-none whitespace-nowrap shrink-0"
                  style={{ color: brand }}
                >
                  {formatCurrency(totalPrice, settings.currencySymbol)}
                </span>
              </div>

              {hoveredLayer && (
                <div
                  className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-semibold shadow-sm border whitespace-nowrap max-w-full truncate ${
                    isDarkStudio
                      ? "bg-[#341a10] text-[#fff1d6] border-[#fff1d6]/15"
                      : "bg-[#fffaf2] text-[#3a0b08] border-[#3a0b08]/12"
                  }`}
                >
                  {hoveredLayer}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Restore Control Center Button When Collapsed */}
        {dockCollapsed && (
          <button
            type="button"
            onClick={() => setDockCollapsed(false)}
            className={`fixed md:absolute bottom-[max(12px,env(safe-area-inset-bottom))] md:bottom-4 right-3 md:right-4 z-30 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg border cursor-pointer ${
              isDarkStudio
                ? "bg-[#341a10] text-[#fff1d6] border-[#fff1d6]/20 hover:bg-[#442316]"
                : "bg-[#fffaf2] text-[#3a0b08] border-[#3a0b08]/15 hover:bg-white"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: brand }} />
            <span>Open Builder</span>
            <ChevronUp className="w-3.5 h-3.5 md:hidden" />
          </button>
        )}
      </main>

      {/* Non-Blocking Docked Control Center (Bottom on Mobile, Right Side Panel on Desktop) */}
      {!dockCollapsed && (
        <aside
          aria-label="Burger builder controls"
          style={
            !isDarkStudio
              ? {
                  backgroundColor: settings.backgroundColor === "#DFBE98" ? "#fffaf2" : settings.backgroundColor,
                  color: settings.textColor || "#3a0b08",
                }
              : undefined
          }
          className={`shrink-0 z-30 flex flex-col w-full max-h-[46dvh] md:max-h-none md:w-[375px] lg:w-[415px] md:h-full border-t md:border-t-0 md:border-l pb-[env(safe-area-inset-bottom)] md:pb-0 shadow-2xl ${
            isDarkStudio
              ? "bg-[#2f160c] text-[#fff1d6] border-[#fff1d6]/16"
              : "bg-[#fffaf2] text-[#3a0b08] border-[#3a0b08]/14"
          }`}
        >
          {/* Control Center Header + Collapse + Quick Checkout */}
          <div className="flex items-center justify-between gap-2 px-3 pt-2 pb-2 border-b border-current/12 shrink-0">
            <button
              type="button"
              onClick={() => setDockCollapsed(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-current/15 hover:border-current/35 cursor-pointer whitespace-nowrap"
              title="Hide builder controls (H)"
            >
              <ChevronDown className="w-3.5 h-3.5 md:hidden" />
              <ChevronRight className="w-3.5 h-3.5 hidden md:block" />
              <span>Hide</span>
            </button>

            <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-center">
              <button
                type="button"
                onClick={() => setExplodeAmount(0)}
                className="text-[10px] font-bold opacity-70 hover:opacity-100 whitespace-nowrap cursor-pointer"
              >
                Stack
              </button>
              <input
                type="range"
                aria-label="Exploded view separation"
                min={0}
                max={1}
                step={0.01}
                value={explodeAmount}
                onChange={(e) => setExplodeAmount(parseFloat(e.target.value))}
                className="studio-range w-full max-w-[110px]"
              />
              <button
                type="button"
                onClick={() => setExplodeAmount(1)}
                className="text-[10px] font-bold opacity-70 hover:opacity-100 whitespace-nowrap cursor-pointer"
              >
                Explode
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setAutoRotate((r) => !r)}
                title="Toggle 360° auto-rotation"
                aria-pressed={autoRotate}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer whitespace-nowrap transition-colors"
                style={
                  autoRotate
                    ? { backgroundColor: accent, color: "#3a0b08", borderColor: accent }
                    : { borderColor: "currentColor" }
                }
              >
                <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? "animate-spin" : ""}`} />
                <span className="hidden lg:inline">Spin</span>
              </button>
              <button
                type="button"
                onClick={() => setDockTab("order")}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-white font-display text-base leading-none whitespace-nowrap shadow-sm cursor-pointer"
                style={{ backgroundColor: brand }}
              >
                {formatCurrency(totalPrice, settings.currencySymbol)}
              </button>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="px-3 pt-2 pb-1.5 border-b border-current/10 shrink-0">
            <div
              role="tablist"
              aria-label="Builder sections"
              className="no-scrollbar flex items-center gap-1 p-1 rounded-xl bg-current/6 overflow-x-auto"
            >
              {(
                [
                  { id: "build", label: settings.tabBuild || "Build", icon: Layers },
                  { id: "combos", label: settings.tabCombos || "Combos", icon: Flame },
                  { id: "studio", label: "3D View", icon: Eye },
                  { id: "order", label: settings.tabOrders || "Order", icon: ShoppingBag },
                  { id: "download", label: "Save", icon: Download },
                ] as const
              ).map(({ id, label, icon: Icon }) => {
                const active = dockTab === id;
                return (
                  <button
                    key={id}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => setDockTab(id)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      active ? "text-white shadow-sm" : "opacity-75 hover:opacity-100"
                    }`}
                    style={active ? { backgroundColor: brand } : undefined}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable Panel Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            {dockTab === "build" && (
              <div className="space-y-2.5">
                {settings.pickBarBuildText && (
                  <div className="text-[11px] font-bold opacity-65 px-0.5">
                    {settings.pickBarBuildText}
                  </div>
                )}

                <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  {visibleBuildCategories.map((cat) => {
                    const active = buildCategory === cat.key;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setBuildCategory(cat.key as MenuCategoryKey)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer border transition-colors shrink-0"
                        style={
                          active
                            ? { backgroundColor: accent, color: "#3a0b08", borderColor: accent }
                            : undefined
                        }
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {activeCategoryOptions.length === 0 ? (
                    <div className="rounded-xl border border-current/12 p-4 text-center text-xs opacity-65">
                      No items currently available in this category.
                    </div>
                  ) : (
                    activeCategoryOptions.map((opt) => {
                      const count = getQtyForOption(buildCategory, opt.id);
                      const isBun = buildCategory === "bun";

                      if (isBun) {
                        const selected = build.bun === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => selectBun(opt.id)}
                            aria-pressed={selected}
                            className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 border text-left cursor-pointer transition-colors ${
                              selected ? "bg-[#E1000F]/10" : "border-current/12 hover:border-current/30"
                            }`}
                            style={selected ? { borderColor: brand } : undefined}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: opt.swatch }}
                                />
                                <span className="text-xs font-bold truncate">{opt.name}</span>
                              </div>
                              <span className="text-[11px] opacity-65 tabular-nums block pl-4">
                                {formatCurrency(opt.price, settings.currencySymbol, "Free")}
                              </span>
                            </div>
                            <span
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-md shrink-0 ${
                                selected ? "text-white" : "opacity-50"
                              }`}
                              style={selected ? { backgroundColor: brand } : undefined}
                            >
                              {selected ? "Selected" : "Pick"}
                            </span>
                          </button>
                        );
                      }

                      return (
                        <div
                          key={opt.id}
                          className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 border transition-colors"
                          style={
                            count > 0
                              ? { borderColor: brand, backgroundColor: `${brand}12` }
                              : undefined
                          }
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: opt.swatch }}
                              />
                              <span className="text-xs font-bold truncate" title={opt.name}>
                                {opt.name}
                              </span>
                            </div>
                            <span className="text-[11px] opacity-65 tabular-nums block pl-4 truncate">
                              {opt.price === 0
                                ? "Free"
                                : `+${formatCurrency(opt.price, settings.currencySymbol)}`}
                              {opt.description ? ` · ${opt.description}` : ""}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => updateItemQty(buildCategory, opt.id, -1, opt.maxQty)}
                              disabled={count <= 0}
                              aria-label={`Remove ${opt.name}`}
                              className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-25 cursor-pointer disabled:cursor-default transition-colors"
                              style={{ borderColor: brand, color: brand }}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <output className="w-4 text-center text-xs font-bold tabular-nums">
                              {count}
                            </output>
                            <button
                              type="button"
                              onClick={() => updateItemQty(buildCategory, opt.id, 1, opt.maxQty)}
                              disabled={count >= opt.maxQty}
                              aria-label={`Add ${opt.name}`}
                              className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-25 cursor-pointer disabled:cursor-default transition-colors"
                              style={{ borderColor: brand, color: brand }}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {dockTab === "combos" && (
              <div className="grid grid-cols-1 gap-2">
                {settings.pickBarComboText && (
                  <div className="text-[11px] font-bold opacity-65 px-0.5">
                    {settings.pickBarComboText}
                  </div>
                )}
                {combosAvailable.length === 0 ? (
                  <div className="rounded-xl border border-current/12 p-4 text-center text-xs opacity-65">
                    No combos currently available.
                  </div>
                ) : (
                  combosAvailable.map((combo) => {
                    const selected = activeComboItem?.id === combo.id;
                    return (
                      <button
                        key={combo.id}
                        type="button"
                        onClick={() => selectCombo(combo.id)}
                        aria-pressed={selected}
                        className="text-left rounded-xl p-3 border-2 cursor-pointer transition-colors"
                        style={
                          selected
                            ? { borderColor: brand, backgroundColor: `${brand}14` }
                            : undefined
                        }
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className="font-display text-lg leading-tight"
                            style={{ color: brand }}
                          >
                            {combo.name}
                          </span>
                          <span
                            className="font-display text-lg tabular-nums leading-tight shrink-0"
                            style={{ color: brand }}
                          >
                            {formatCurrency(combo.price, settings.currencySymbol)}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-75 mt-1">{combo.description}</p>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {dockTab === "studio" && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold opacity-70 mb-1.5">Camera Angle</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { id: "photo", label: "Photo Angle" },
                        { id: "hero", label: "Hero 3/4" },
                        { id: "top", label: "Top Down" },
                        { id: "under", label: "Underneath" },
                      ] as const
                    ).map((cam) => (
                      <button
                        key={cam.id}
                        type="button"
                        onClick={() => triggerPreset(cam.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer whitespace-nowrap transition-colors ${
                          cameraPreset === cam.id ? "text-white" : "border-current/18"
                        }`}
                        style={
                          cameraPreset === cam.id
                            ? { backgroundColor: brand, borderColor: brand }
                            : undefined
                        }
                      >
                        {cam.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold opacity-70 mb-1.5">Studio Backdrop</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: "studio", label: "Warm Sand" },
                        { id: "amber", label: "Speedy Gold" },
                        { id: "grill", label: "Dark Grill" },
                      ] as const
                    ).map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setStudioTheme(theme.id)}
                        className="px-2.5 py-2 rounded-lg text-xs font-bold border cursor-pointer whitespace-nowrap transition-colors"
                        style={
                          studioTheme === theme.id
                            ? { backgroundColor: accent, color: "#3a0b08", borderColor: accent }
                            : undefined
                        }
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowLabels((s) => !s)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer ${
                      showLabels ? "text-white" : "border-current/18"
                    }`}
                    style={
                      showLabels ? { backgroundColor: brand, borderColor: brand } : undefined
                    }
                  >
                    {showLabels ? "Diagram Labels: On" : "Diagram Labels: Off"}
                  </button>
                  <button
                    type="button"
                    onClick={resetToPhotoStack}
                    className="px-3 py-2 rounded-lg text-xs font-bold underline opacity-80 hover:opacity-100 cursor-pointer whitespace-nowrap"
                  >
                    Reset to Photo Stack
                  </button>
                </div>
              </div>
            )}

            {dockTab === "order" && (
              <div className="space-y-3">
                {petFedNotice && (
                  <div
                    className="rounded-xl p-2.5 border flex items-center justify-between gap-2 text-xs"
                    style={{ backgroundColor: `${accent}26`, borderColor: brand }}
                  >
                    <span className="font-bold">{petFedNotice}</span>
                    <button
                      type="button"
                      onClick={() => setAppMode("pet")}
                      className="px-2.5 py-1 rounded-lg text-white font-bold shrink-0 cursor-pointer"
                      style={{ backgroundColor: brand }}
                    >
                      Watch Eat
                    </button>
                  </div>
                )}
                {activeTicket ? (
                  <OrderTicketCard
                    ticket={activeTicket}
                    settings={settings}
                    whatsappUrl={whatsappUrl}
                    onBack={() => {
                      setActiveTicket(null);
                      setDockTab("build");
                    }}
                  />
                ) : (
                  <>
                    <div className="space-y-1.5 text-xs">
                      {orderLines.map((line, i) => (
                        <div key={`${line.label}-${i}`} className="flex items-center justify-between gap-4">
                          <span>{line.label}</span>
                          <span className="font-semibold tabular-nums">
                            {formatCurrency(line.amount, settings.currencySymbol, "Free")}
                          </span>
                        </div>
                      ))}
                      {activeComboItem && (
                        <p className="text-[11px] opacity-70 pt-1">{activeComboItem.description}</p>
                      )}
                    </div>

                    <div className="border-t border-current/12 pt-3 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] opacity-70">
                          {settings.ticketWaitLabel}: ~{settings.estimatedWaitMins} min
                        </span>
                        <div
                          role="group"
                          aria-label="Order type"
                          className="flex items-center gap-1 p-1 rounded-xl bg-current/6"
                        >
                          {settings.pickupEnabled && (
                            <button
                              type="button"
                              aria-pressed={orderMode === "Pickup"}
                              onClick={() => setOrderMode("Pickup")}
                              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                                orderMode === "Pickup" ? "text-white" : "opacity-75"
                              }`}
                              style={orderMode === "Pickup" ? { backgroundColor: brand } : undefined}
                            >
                              Pickup
                            </button>
                          )}
                          {settings.deliveryEnabled && (
                            <button
                              type="button"
                              aria-pressed={orderMode === "Delivery"}
                              onClick={() => setOrderMode("Delivery")}
                              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                                orderMode === "Delivery" ? "text-white" : "opacity-75"
                              }`}
                              style={orderMode === "Delivery" ? { backgroundColor: brand } : undefined}
                            >
                              Delivery
                            </button>
                          )}
                        </div>
                      </div>

                      {!settings.orderingEnabled ? (
                        <div className="rounded-xl bg-amber-100 text-amber-950 p-3 text-xs font-semibold">
                          Kitchen ordering is temporarily paused. Please check back shortly!
                        </div>
                      ) : (
                        <>
                          {user ? (
                            <div className="space-y-2 text-xs">
                              <input
                                type="text"
                                placeholder="Your name"
                                maxLength={80}
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-current/15 bg-white/80 text-[#3a0b08]"
                              />
                              <input
                                type="tel"
                                placeholder="Phone number (e.g. 876-555-1234)"
                                maxLength={30}
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-current/15 bg-white/80 text-[#3a0b08]"
                              />
                              {orderMode === "Delivery" && (
                                <input
                                  type="text"
                                  placeholder="Delivery address"
                                  maxLength={240}
                                  value={deliveryAddress}
                                  onChange={(e) => setDeliveryAddress(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-current/15 bg-white/80 text-[#3a0b08]"
                                />
                              )}
                              <input
                                type="text"
                                placeholder="Order notes (optional)"
                                maxLength={300}
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-current/15 bg-white/80 text-[#3a0b08]"
                              />
                              {orderError && (
                                <p className="text-[11px] font-bold text-red-600">{orderError}</p>
                              )}
                              <button
                                type="button"
                                disabled={placingOrder}
                                onClick={() => void handleSubmitOrder()}
                                className="w-full py-2.5 px-4 rounded-xl text-white font-display text-lg leading-none cursor-pointer disabled:opacity-50"
                                style={{ backgroundColor: brand }}
                              >
                                {placingOrder
                                  ? "Sending to kitchen..."
                                  : `${settings.viewOrderText || "Place Order"} · ${formatCurrency(totalPrice, settings.currencySymbol)}`}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void signInWithGoogle()}
                              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-current/20 text-xs font-bold cursor-pointer hover:bg-black/5"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                              <span>Sign in with Google for Kitchen Ticket</span>
                            </button>
                          )}

                          <div className="flex items-center justify-between gap-3 pt-1">
                            <button
                              type="button"
                              onClick={startOver}
                              className="text-xs font-semibold underline opacity-70 hover:opacity-100 cursor-pointer whitespace-nowrap"
                            >
                              Start over
                            </button>
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() =>
                                feedPetSameOrderFood(
                                  activeComboItem?.name || "Custom Speedy Burger",
                                  orderLines.map((l) => l.label)
                                )
                              }
                              className="flex-1 text-center px-4 py-2 rounded-xl border font-bold text-xs whitespace-nowrap"
                              style={{ borderColor: brand, color: brand }}
                            >
                              {settings.ticketWhatsappText || "Send on WhatsApp"} ·{" "}
                              {formatCurrency(totalPrice, settings.currencySymbol)}
                            </a>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {dockTab === "download" && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  disabled={exportingType !== null}
                  className="w-full flex items-center gap-3 rounded-xl p-3 border border-current/16 hover:border-[#E1000F] text-left cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#E1000F]/12 text-[#E1000F] flex items-center justify-center shrink-0">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold whitespace-nowrap">
                      {exportingType === "html" ? "Packaging HTML..." : "Standalone HTML"}
                    </div>
                    <div className="text-[11px] opacity-70 truncate">
                      Interactive 3D webpage (.html)
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadGlb}
                  disabled={exportingType !== null}
                  className="w-full flex items-center gap-3 rounded-xl p-3 border border-current/16 hover:border-[#E1000F] text-left cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#FDB105]/25 text-[#3a0b08] flex items-center justify-center shrink-0">
                    <Box className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold whitespace-nowrap">
                      {exportingType === "glb" ? "Exporting 3D..." : "3D Model File"}
                    </div>
                    <div className="text-[11px] opacity-70 truncate">
                      Universal binary model (.glb)
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={exportingType !== null}
                  className="w-full flex items-center gap-3 rounded-xl p-3 border border-current/16 hover:border-[#E1000F] text-left cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-current/10 flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold whitespace-nowrap">
                      {exportingType === "png" ? "Rendering PNG..." : "Studio Photo"}
                    </div>
                    <div className="text-[11px] opacity-70 truncate">
                      High-res snapshot (.png)
                    </div>
                  </div>
                </button>

                {exportMessage && (
                  <p className="text-xs font-semibold text-center pt-1" style={{ color: brand }}>
                    {exportMessage}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Compact Storefront Footer Links */}
          <footer className="shrink-0 border-t border-current/10 px-3 py-2 flex items-center justify-between gap-2 text-[10px] opacity-75">
            <span className="truncate">{settings.footerText}</span>
            <div className="flex items-center gap-2.5 shrink-0 font-bold">
              <button
                type="button"
                onClick={() => setInfoSheetTab("about")}
                className="hover:underline cursor-pointer"
              >
                About
              </button>
              <button
                type="button"
                onClick={() => setInfoSheetTab("contact")}
                className="hover:underline cursor-pointer"
              >
                Contact
              </button>
              {settings.clubEnabled && (
                <button
                  type="button"
                  onClick={() => setInfoSheetTab("club")}
                  className="hover:underline cursor-pointer"
                >
                  {settings.tabCard || "My card"}
                </button>
              )}
            </div>
          </footer>
        </aside>
      )}
        </>
      )}
    </div>
  );
}
