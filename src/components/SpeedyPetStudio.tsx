import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Check,
  Crown,
  Flame,
  Glasses,
  Heart,
  MessageCircle,
  Mic,
  Palette,
  PawPrint,
  RotateCcw,
  RotateCw,
  Save,
  Send,
  Share2,
  Shield,
  Shuffle,
  Star,
  Trash2,
  Utensils,
} from 'lucide-react';
import { SPEEDY_BURGER_LOGO } from '../data/logo';
import { SiteSettings } from '../data/siteConfig';
import {
  ACCESSORY_ITEMS,
  AccessoryId,
  computePetCareStatus,
  createDefaultPetConfig,
  createRandomPetConfig,
  EYE_COLORS,
  EXPRESSIONS,
  feedPetWithProgression,
  getEvolutionInfo,
  getLevelProgress,
  PET_DAILY_MEALS,
  PET_SPECIES,
  PetSpecies,
  sanitizeSpeedyPet,
  SpeedyPetConfig,
} from '../data/speedyPetCatalog';
import {
  deleteSpeedyPetFromFirestore,
  saveSpeedyPetToFirestore,
} from '../services/storefrontService';
import SpeedyPetStage, {
  PetCameraPreset,
  SpeedyPetStageHandle,
} from '../three/SpeedyPetStage';
import { playPetReactionSound, speakAsPet } from '../utils/petAudio';

type StudioCategory = 'animal' | 'appearance' | 'accessories' | 'care';

const HERO_SWATCHES: Record<PetSpecies, string> = {
  shadow_tux: '#141418',
  pink_hero: '#FF64A4',
  kid_speed: '#FFD000',
  reverse_bolt: '#FFC800',
  blue_dash: '#0B68D6',
  crimson_bolt: '#C80E16',
};

const SUPPORTED_GEAR_IDS: AccessoryId[] = ['sunglasses', 'headphones', 'backpack'];

export interface OrderMealCelebration {
  mealName: string;
  xpGained: number;
  leveledUpTo: number | null;
  evolvedTitle: string | null;
}

interface SpeedyPetStudioProps {
  settings: SiteSettings;
  user: User | null;
  isAdmin: boolean;
  pet: SpeedyPetConfig;
  savedPets: SpeedyPetConfig[];
  justAteOrderMeal: OrderMealCelebration | null;
  onAcknowledgeOrderMeal: () => void;
  onChangePet: (next: SpeedyPetConfig) => void;
  onPersistSavedList: (nextList: SpeedyPetConfig[]) => void;
  onSwitchToBurger: () => void;
  onOpenAdmin: () => void;
}

export function SpeedyPetStudio({
  settings,
  user,
  isAdmin,
  pet,
  savedPets,
  justAteOrderMeal,
  onAcknowledgeOrderMeal,
  onChangePet,
  onPersistSavedList,
  onSwitchToBurger,
  onOpenAdmin,
}: SpeedyPetStudioProps) {
  const stageRef = useRef<SpeedyPetStageHandle>(null);

  const [activeCat, setActiveCat] = useState<StudioCategory>('animal');
  const [cameraPreset, setCameraPreset] = useState<PetCameraPreset>('full');
  const [presetVersion, setPresetVersion] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [talkText, setTalkText] = useState<string>('');
  const [listeningMic, setListeningMic] = useState<boolean>(false);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const bubbleTimeoutRef = useRef<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const brand = settings.brandColor || '#E1000F';
  const accent = settings.accentColor || '#FDB105';
  const isDark = settings.darkMode;

  // Refresh live hunger countdown every 30 seconds
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const careStatus = useMemo(
    () => computePetCareStatus(pet, nowMs),
    [pet, nowMs]
  );

  const levelProg = useMemo(() => getLevelProgress(pet.xp || 0), [pet.xp]);
  const evoMeta = useMemo(
    () => getEvolutionInfo(pet.species, levelProg.stage),
    [pet.species, levelProg.stage]
  );

  const showBubble = useCallback((msg: string, ms = 3200) => {
    setSpeechBubble(msg);
    if (bubbleTimeoutRef.current) window.clearTimeout(bubbleTimeoutRef.current);
    bubbleTimeoutRef.current = window.setTimeout(() => setSpeechBubble(null), ms);
  }, []);

  // Celebrate when customer arrives after ordering a burger!
  useEffect(() => {
    if (!justAteOrderMeal) return;
    const t = window.setTimeout(() => {
      if (justAteOrderMeal.evolvedTitle) {
        stageRef.current?.playAnim('evolve', 2.4);
        playPetReactionSound(pet.species, 'evolve');
        showBubble(
          `WHOA!! Your ${justAteOrderMeal.mealName} evolved me into ${justAteOrderMeal.evolvedTitle}!`,
          4800
        );
      } else if (justAteOrderMeal.leveledUpTo) {
        stageRef.current?.playAnim('eat', 2.2);
        playPetReactionSound(pet.species, 'levelup');
        showBubble(
          `LEVEL UP to Lv.${justAteOrderMeal.leveledUpTo}! Best ${justAteOrderMeal.mealName} ever!`,
          4400
        );
      } else {
        stageRef.current?.playAnim('eat', 2.2);
        playPetReactionSound(pet.species, 'eat');
        showBubble(
          `Yum!! Thanks for sharing your ${justAteOrderMeal.mealName}! (+${justAteOrderMeal.xpGained} XP)`,
          4200
        );
      }
      onAcknowledgeOrderMeal();
    }, 240);
    return () => window.clearTimeout(t);
  }, [justAteOrderMeal, onAcknowledgeOrderMeal, pet.species, showBubble]);

  const triggerCamera = useCallback((preset: PetCameraPreset) => {
    setCameraPreset(preset);
    setPresetVersion((v) => v + 1);
  }, []);

  const handleSelectSpecies = (species: PetSpecies) => {
    const spMeta = PET_SPECIES.find((s) => s.id === species) ?? PET_SPECIES[0];
    onChangePet({
      ...pet,
      species,
      furColor: spMeta.defaultFur,
    });
    playPetReactionSound(species, 'giggle');
    stageRef.current?.playAnim('head_pat', 1.1);
  };

  const toggleAccessory = (id: AccessoryId) => {
    const exists = pet.accessories.includes(id);
    if (exists) {
      onChangePet({ ...pet, accessories: pet.accessories.filter((a) => a !== id) });
      return;
    }
    onChangePet({ ...pet, accessories: [...pet.accessories, id] });
  };

  const handleFeedMeal = async (mealName: string, mealItems: string[]) => {
    const wasFainted = careStatus.isFainted;
    const result = feedPetWithProgression(pet, mealName, mealItems, Date.now(), 0);
    const updated = result.pet;
    setNowMs(Date.now());
    onChangePet(updated);

    const nextList = [updated, ...savedPets.filter((p) => p.id !== updated.id)];
    onPersistSavedList(nextList);

    if (user && user.emailVerified) {
      void saveSpeedyPetToFirestore(user, updated).catch(() => undefined);
    }

    const nextEvo = getEvolutionInfo(updated.species, result.newStage);
    if (result.evolved) {
      stageRef.current?.playAnim('evolve', 2.4);
      playPetReactionSound(updated.species, 'evolve');
      showBubble(
        `EVOLVED into ${nextEvo.title} (Stage ${result.newStage})!!`,
        4500
      );
      setStatusBanner(
        `EVOLVED! ${updated.name} transformed into ${nextEvo.title} (Lv.${result.newLevel})!`
      );
    } else if (result.leveledUp) {
      stageRef.current?.playAnim('eat', 2.0);
      playPetReactionSound(updated.species, 'levelup');
      showBubble(
        `LEVEL UP! Reached Level ${result.newLevel}! (+${result.xpGained} XP)`,
        3800
      );
      setStatusBanner(
        `${updated.name} leveled up to Lv.${result.newLevel}! (+${result.xpGained} XP)`
      );
    } else {
      stageRef.current?.playAnim('eat', 2.0);
      playPetReactionSound(updated.species, 'eat');
      showBubble(
        wasFainted
          ? `Whew! That ${mealName} saved me! (+${result.xpGained} XP)`
          : `Chomp chomp! Best ${mealName} ever! (+${result.xpGained} XP)`,
        3600
      );
      setStatusBanner(
        wasFainted
          ? `${updated.name} revived with ${mealName}! (+${result.xpGained} XP)`
          : `Fed ${updated.name} a ${mealName}! (+${result.xpGained} XP · ${updated.streakDays}d streak)`
      );
    }
  };

  const handleTapZone = useCallback(
    (zone: 'head' | 'belly' | 'feet') => {
      if (careStatus.isFainted) {
        playPetReactionSound(pet.species, 'faint');
        showBubble("So hungry... Feed me today's burger to wake up!", 3000);
        return;
      }
      if (zone === 'head') {
        stageRef.current?.playAnim('head_pat', 1.3);
        playPetReactionSound(pet.species, 'giggle');
        showBubble('Hehe! Ear scratches feel amazing!', 2400);
      } else if (zone === 'belly') {
        stageRef.current?.playAnim('belly_rub', 1.4);
        playPetReactionSound(pet.species, 'giggle');
        showBubble('Haha! Ready for a Speedy Burger!', 2400);
      } else {
        stageRef.current?.playAnim('feet_hop', 1.1);
        playPetReactionSound(pet.species, 'hop');
        showBubble('Boing! Ready for high-speed action!', 2400);
      }
    },
    [careStatus.isFainted, pet.species, showBubble]
  );

  const handleSpeakPhrase = (phrase: string) => {
    const text = phrase.trim();
    if (!text) return;
    if (careStatus.isFainted) {
      showBubble('Feed me first so I have energy to talk!', 2600);
      return;
    }
    showBubble(`"${text}"`, Math.max(2200, text.length * 90));
    speakAsPet(
      text,
      pet.species,
      () => stageRef.current?.playAnim('talk', Math.max(1.4, text.length * 0.08)),
      () => undefined
    );
    setTalkText('');
  };

  const handleMicTalkBack = () => {
    if (careStatus.isFainted) {
      showBubble('Feed me first so I can listen & talk back!', 2600);
      return;
    }
    const SpeechRecCtor =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown })
        .webkitSpeechRecognition;

    if (!SpeechRecCtor) {
      handleSpeakPhrase(`Hi! I am ${pet.name}! Got any Speedy Burgers today?`);
      return;
    }

    try {
      const rec = new SpeechRecCtor() as {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
      };
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      setListeningMic(true);
      showBubble('Listening... Say something!', 5000);

      rec.onresult = (ev) => {
        const heard = ev.results?.[0]?.[0]?.transcript || 'Speedy Burger!';
        handleSpeakPhrase(heard);
      };
      rec.onerror = () => {
        setListeningMic(false);
        handleSpeakPhrase(`Meow! Feed me a Speedy Burger!`);
      };
      rec.onend = () => setListeningMic(false);
      rec.start();
    } catch {
      setListeningMic(false);
      handleSpeakPhrase(`Hey there! Don't forget to feed me today!`);
    }
  };

  const handleRandomize = () => {
    onChangePet(createRandomPetConfig(pet.name, pet));
    stageRef.current?.playAnim('feet_hop', 1.0);
    setStatusBanner('Picked a random Speedy Pet character!');
  };

  const handleReset = () => {
    onChangePet(createDefaultPetConfig(pet.gender, pet.species));
    triggerCamera('full');
    setStatusBanner('Reset character to Speedy starter.');
  };

  const handleSavePet = async () => {
    setSaving(true);
    setStatusBanner(null);
    const toSave = sanitizeSpeedyPet({
      ...pet,
      id: pet.id || `pet_${Date.now()}`,
    });
    try {
      const nextList = [toSave, ...savedPets.filter((p) => p.id !== toSave.id)];
      onPersistSavedList(nextList);

      if (user && user.emailVerified) {
        await saveSpeedyPetToFirestore(user, toSave);
        setStatusBanner(`Saved "${toSave.name}" to your Speedy account!`);
      } else {
        setStatusBanner(`Saved "${toSave.name}" to this device!`);
      }
      onChangePet(toSave);
    } catch (e) {
      setStatusBanner(e instanceof Error ? e.message : 'Could not save pet.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSaved = async (petId: string) => {
    const nextList = savedPets.filter((p) => p.id !== petId);
    onPersistSavedList(nextList);
    if (user && user.emailVerified) {
      await deleteSpeedyPetFromFirestore(petId).catch(() => undefined);
    }
    setStatusBanner('Removed saved Speedy Pet.');
  };

  const handleShareImage = async () => {
    if (!stageRef.current || exporting) return;
    setExporting(true);
    setStatusBanner(null);
    try {
      const blob = await stageRef.current.exportShareCardPng(pet, settings.shopName);
      if (!blob) {
        setStatusBanner('Could not render share card.');
        return;
      }
      const safeFile = `${pet.name.replace(/[^a-zA-Z0-9_-]+/g, '_') || 'Speedy_Pet'}.png`;
      const file = new File([blob], safeFile, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            title: `${pet.name} — Speedy Pet`,
            text: `Meet ${pet.name}, my Speedy Burger Talking Pet!`,
            files: [file],
          });
          setStatusBanner('Shared Speedy Pet collector card!');
          return;
        } catch {
          // fall through to download
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeFile;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatusBanner(`Downloaded ${safeFile} collector card!`);
    } finally {
      setExporting(false);
    }
  };

  const categoryNavItems: Array<{
    id: StudioCategory;
    label: string;
    icon: typeof PawPrint;
    mobileOnly?: boolean;
  }> = [
    { id: 'animal', label: 'Hero', icon: PawPrint },
    { id: 'appearance', label: 'Face', icon: Palette },
    { id: 'accessories', label: 'Gear', icon: Glasses },
    { id: 'care', label: 'Feed & Talk', icon: Utensils, mobileOnly: true },
  ];

  const surfaceCls = isDark
    ? 'bg-[#2a140c] text-[#fff1d6] border-[#fff1d6]/14'
    : 'bg-[#fffaf2] text-[#3a0b08] border-[#3a0b08]/12';

  const cardBtnCls = (active: boolean) =>
    `min-h-[44px] rounded-xl px-3 py-2.5 border text-left transition-colors cursor-pointer ${
      active
        ? 'border-transparent text-white shadow-sm'
        : isDark
          ? 'border-[#fff1d6]/14 bg-white/5 hover:border-[#fff1d6]/35'
          : 'border-[#3a0b08]/14 bg-white/80 hover:border-[#3a0b08]/35'
    }`;

  const renderCategoryContent = (cat: StudioCategory) => {
    if (cat === 'animal') {
      return (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-bold opacity-70 mb-2">Choose Your Character</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {PET_SPECIES.map((sp) => {
                const active = pet.species === sp.id;
                const swatch = HERO_SWATCHES[sp.id];
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => handleSelectSpecies(sp.id)}
                    className={cardBtnCls(active)}
                    style={active ? { backgroundColor: brand } : undefined}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-7 h-7 rounded-lg border border-black/20 shrink-0 shadow-inner"
                          style={{ backgroundColor: swatch }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{sp.label}</div>
                          <div
                            className={`text-[10px] mt-0.5 truncate ${
                              active ? 'text-white/85' : 'opacity-65'
                            }`}
                          >
                            {sp.tagline}
                          </div>
                        </div>
                      </div>
                      {active && <Check className="w-4 h-4 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-current/14 p-3 space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider opacity-70">
              Evolution Path
            </div>
            {([1, 2, 3] as const).map((stg) => {
              const info = getEvolutionInfo(pet.species, stg);
              const unlocked = levelProg.stage >= stg;
              return (
                <div
                  key={stg}
                  className="flex items-center justify-between gap-2 text-xs py-0.5"
                  style={{ opacity: unlocked ? 1 : 0.6 }}
                >
                  <span className="font-bold">
                    {stg === 1 ? 'Lv.1' : stg === 2 ? 'Lv.3' : 'Lv.6'} · {info.title}
                  </span>
                  <span className="text-[10px] opacity-75">{info.badge}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (cat === 'appearance') {
      return (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-bold opacity-70 mb-2">Facial Expression</div>
            <div className="grid grid-cols-2 gap-2">
              {EXPRESSIONS.map((exp) => {
                const active = pet.expression === exp.id;
                return (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => {
                      onChangePet({ ...pet, expression: exp.id });
                      triggerCamera('face');
                    }}
                    className={cardBtnCls(active)}
                    style={active ? { backgroundColor: brand } : undefined}
                  >
                    <span className="text-xs font-bold">{exp.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold opacity-70 mb-2">Eye Tint</div>
            <div className="flex flex-wrap gap-2">
              {EYE_COLORS.map((c) => {
                const active = pet.eyeColor === c.hex;
                return (
                  <button
                    key={c.id}
                    type="button"
                    title={c.label}
                    onClick={() => {
                      onChangePet({ ...pet, eyeColor: c.hex });
                      triggerCamera('face');
                    }}
                    className={`w-9 h-9 rounded-full border-2 cursor-pointer transition-transform ${
                      active ? 'scale-110 ring-2 ring-offset-1' : 'border-black/20'
                    }`}
                    style={{
                      backgroundColor: c.hex,
                      borderColor: active ? brand : undefined,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (cat === 'accessories') {
      const visibleGear = ACCESSORY_ITEMS.filter((a) =>
        SUPPORTED_GEAR_IDS.includes(a.id)
      );
      return (
        <div className="space-y-2.5">
          <div className="text-xs font-bold opacity-70">
            Optional Gear ({pet.accessories.filter((a) => SUPPORTED_GEAR_IDS.includes(a)).length} equipped)
          </div>
          <div className="grid grid-cols-1 gap-2">
            {visibleGear.map((acc) => {
              const active = pet.accessories.includes(acc.id);
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => toggleAccessory(acc.id)}
                  className={cardBtnCls(active)}
                  style={active ? { backgroundColor: brand } : undefined}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-4 h-4 rounded-full border border-black/15 shrink-0"
                        style={{ backgroundColor: acc.swatch }}
                      />
                      <span className="text-xs font-bold truncate">{acc.name}</span>
                    </div>
                    {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return renderRightCareAndOutfitPanel();
  };

  const renderRightCareAndOutfitPanel = () => (
    <div className="space-y-4">
      {/* Level-Up & Evolution Tracker */}
      <div
        className="rounded-2xl border p-3.5 space-y-2.5"
        style={{
          borderColor: levelProg.stage === 3 ? '#D4AF37' : `${accent}88`,
          backgroundColor: levelProg.stage === 3 ? '#FDB1051E' : `${brand}0D`,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5" style={{ color: accent }} />
            <span>Lv. {levelProg.level} · {evoMeta.title}</span>
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-md text-[#3a0b08]"
            style={{ backgroundColor: accent }}
          >
            {evoMeta.badge}
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${levelProg.progressPct}%`,
              backgroundColor: accent,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] opacity-80 tabular-nums">
          <span>
            {levelProg.xpIntoLevel} / {levelProg.xpNeededForLevel} XP
          </span>
          <span className="font-bold">
            {levelProg.nextEvolutionLevel
              ? `Next Evolve: Lv.${levelProg.nextEvolutionLevel}`
              : 'Max Evolution Reached'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          {([1, 2, 3] as const).map((stg) => {
            const stgMeta = getEvolutionInfo(pet.species, stg);
            const unlocked = levelProg.stage >= stg;
            return (
              <div
                key={stg}
                className="rounded-lg px-2 py-1.5 border text-center"
                style={{
                  borderColor: unlocked ? accent : 'rgba(58,11,8,0.12)',
                  backgroundColor: unlocked ? `${accent}24` : 'transparent',
                  opacity: unlocked ? 1 : 0.55,
                }}
              >
                <div className="text-[10px] font-bold">
                  {stg === 1 ? 'Lv.1' : stg === 2 ? 'Lv.3' : 'Lv.6'}
                </div>
                <div className="text-[10px] font-bold truncate">{stgMeta.title}</div>
              </div>
            );
          })}
        </div>

        <div className="text-[10px] opacity-75">{evoMeta.description}</div>
      </div>

      {/* Daily Feed & Order-Sync Box */}
      <div
        className="rounded-2xl border p-3.5 space-y-3"
        style={{
          borderColor: careStatus.isFainted ? '#E1000F' : `${brand}30`,
          backgroundColor: careStatus.isFainted ? '#E1000F12' : `${accent}16`,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider">
            Daily Feeding Care
          </span>
          <span className="text-xs font-bold tabular-nums" style={{ color: brand }}>
            {careStatus.isFainted ? '0% — Faint!' : `${careStatus.fullness}% Full`}
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${careStatus.fullness}%`,
              backgroundColor:
                careStatus.fullness > 50
                  ? '#16A34A'
                  : careStatus.fullness > 25
                    ? '#F59E0B'
                    : '#E1000F',
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] opacity-80">
          <span>{careStatus.timeLeftText}</span>
          <span className="font-bold tabular-nums">{pet.streakDays}d Streak</span>
        </div>

        <div className="text-[11px] opacity-80">
          Feed regularly (+60 XP) to grow & evolve your pet! Ordering real food on the
          3D Burger menu also feeds your pet the exact meal (+100 XP).
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {PET_DAILY_MEALS.map((meal) => (
            <button
              key={meal.id}
              type="button"
              onClick={() => void handleFeedMeal(meal.name, meal.items)}
              className="min-h-[42px] rounded-xl px-2.5 py-2 border border-current/16 bg-white text-[#3a0b08] text-left cursor-pointer hover:border-[#E1000F] transition-colors"
            >
              <div className="text-[11px] font-bold leading-tight truncate">
                {careStatus.isFainted ? `Revive: ${meal.name}` : meal.name}
              </div>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onSwitchToBurger}
          className="w-full min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white cursor-pointer"
          style={{ backgroundColor: brand }}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Order Food on Menu (+100 XP!)</span>
        </button>

        {pet.lastMealName && (
          <div className="text-[11px] opacity-75 pt-0.5">
            Last Meal: <span className="font-bold">{pet.lastMealName}</span> ({pet.totalMealsEaten} total)
          </div>
        )}
      </div>

      {/* Talking Tom Voice & Pet Interactions */}
      <div className="rounded-2xl border border-current/14 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider opacity-75">
            Talk & Play (Talking Pet)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            maxLength={80}
            value={talkText}
            onChange={(e) => setTalkText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSpeakPhrase(talkText);
            }}
            placeholder="Type for your pet to say..."
            className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl border border-current/18 bg-white text-[#3a0b08] text-xs"
          />
          <button
            type="button"
            onClick={() => handleSpeakPhrase(talkText)}
            aria-label="Speak phrase"
            className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-white cursor-pointer shrink-0"
            style={{ backgroundColor: brand }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={handleMicTalkBack}
            className="min-h-[40px] inline-flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-bold border border-current/18 cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5" style={{ color: brand }} />
            <span>{listeningMic ? 'Listening' : 'Talk Back'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleTapZone('belly')}
            className="min-h-[40px] inline-flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-bold border border-current/18 cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5" style={{ color: brand }} />
            <span>Tickle</span>
          </button>
          <button
            type="button"
            onClick={() => handleTapZone('feet')}
            className="min-h-[40px] inline-flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-bold border border-current/18 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" style={{ color: brand }} />
            <span>Jump</span>
          </button>
        </div>
      </div>

      {/* Name & Outfit Summary */}
      <div>
        <label className="text-xs font-bold opacity-75 block mb-1">Pet Name</label>
        <input
          type="text"
          maxLength={50}
          value={pet.name}
          onChange={(e) => onChangePet({ ...pet, name: e.target.value })}
          placeholder="Name your Speedy Pet"
          className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-current/20 bg-white text-[#3a0b08] text-sm font-bold"
        />
      </div>

      <div className="rounded-xl border border-current/14 p-3 space-y-1 text-xs">
        <div className="flex justify-between gap-2">
          <span className="opacity-70">Character</span>
          <span className="font-bold">
            {PET_SPECIES.find((s) => s.id === pet.species)?.label}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="opacity-70">Evolution</span>
          <span className="font-bold truncate">{evoMeta.title}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="opacity-70">Meals Shared</span>
          <span className="font-bold tabular-nums">{pet.totalMealsEaten}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleRandomize}
          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold border border-current/20 hover:border-current/45 cursor-pointer"
        >
          <Shuffle className="w-3.5 h-3.5" style={{ color: brand }} />
          <span>Randomize</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold border border-current/20 hover:border-current/45 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSavePet()}
          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: brand }}
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : 'Save Pet'}</span>
        </button>

        <button
          type="button"
          disabled={exporting}
          onClick={() => void handleShareImage()}
          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-[#3a0b08] cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: accent }}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{exporting ? 'Rendering...' : 'Share Card'}</span>
        </button>
      </div>

      {statusBanner && (
        <div
          className="rounded-xl px-3 py-2 text-xs font-bold text-center"
          style={{ backgroundColor: `${brand}14`, color: brand }}
        >
          {statusBanner}
        </div>
      )}

      {savedPets.length > 0 && (
        <div>
          <div className="text-xs font-bold opacity-70 mb-2">
            Saved Speedy Pets ({savedPets.length})
          </div>
          <div className="space-y-1.5">
            {savedPets.map((saved) => (
              <div
                key={saved.id}
                className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 border border-current/14"
              >
                <button
                  type="button"
                  onClick={() => {
                    onChangePet(saved);
                    triggerCamera('full');
                    setStatusBanner(`Loaded ${saved.name}`);
                  }}
                  className="flex-1 text-left min-w-0 cursor-pointer"
                >
                  <div className="text-xs font-bold truncate">
                    {saved.name} · Lv.{getLevelProgress(saved.xp || 0).level}
                  </div>
                  <div className="text-[10px] opacity-65">
                    {getEvolutionInfo(saved.species, getLevelProgress(saved.xp || 0).stage).title} ·{' '}
                    {saved.streakDays}d streak
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteSaved(saved.id)}
                  aria-label={`Delete ${saved.name}`}
                  className="w-9 h-9 rounded-lg flex items-center justify-center opacity-60 hover:opacity-100 hover:text-red-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col w-screen h-dvh overflow-hidden select-none">
      {/* Compact Branded Top Bar */}
      <header
        className={`shrink-0 h-14 px-3 sm:px-4 border-b flex items-center justify-between gap-2 z-20 ${surfaceCls}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={settings.logoUrl || SPEEDY_BURGER_LOGO}
            alt={settings.shopName}
            className="h-8 w-auto rounded-md object-contain shrink-0"
          />
          <div className="min-w-0">
            <h1
              className="font-display text-xl sm:text-2xl leading-none whitespace-nowrap truncate"
              style={{ color: brand }}
            >
              SPEEDY PET
            </h1>
            <p className="text-[10px] font-semibold opacity-65 hidden sm:block whitespace-nowrap">
              Tap your pet to talk & play · Feed daily or order food to share!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSwitchToBurger}
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white cursor-pointer whitespace-nowrap"
            style={{ backgroundColor: brand }}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Order Burgers</span>
          </button>

          <button
            type="button"
            onClick={onOpenAdmin}
            className={`min-h-[40px] inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold border cursor-pointer ${
              isAdmin ? 'text-white border-transparent' : 'border-current/18'
            }`}
            style={isAdmin ? { backgroundColor: brand } : undefined}
            title="Admin Dashboard"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Admin</span>
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT SIDE (Desktop): Animal, Face, Hair, Wardrobe */}
        <aside
          className={`hidden lg:flex w-[340px] xl:w-[375px] shrink-0 border-r h-full overflow-hidden ${surfaceCls}`}
        >
          <nav
            aria-label="Character categories"
            className="w-[84px] shrink-0 border-r border-current/12 p-2 flex flex-col gap-1.5 overflow-y-auto"
          >
            {categoryNavItems
              .filter((c) => !c.mobileOnly)
              .map(({ id, label, icon: Icon }) => {
                const active = activeCat === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveCat(id)}
                    className={`min-h-[54px] rounded-xl px-1.5 py-2 flex flex-col items-center justify-center gap-1 text-[11px] font-bold cursor-pointer transition-colors ${
                      active ? 'text-white shadow-sm' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={active ? { backgroundColor: brand } : undefined}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="leading-none">{label}</span>
                  </button>
                );
              })}
          </nav>

          <div className="flex-1 min-w-0 overflow-y-auto p-3.5">
            {renderCategoryContent(activeCat)}
          </div>
        </aside>

        {/* CENTER: Interactive 3D Talking Animal Viewport */}
        <main className="relative flex-1 min-w-0 min-h-[38dvh] overflow-hidden">
          <SpeedyPetStage
            ref={stageRef}
            config={pet}
            fullness={careStatus.fullness}
            cameraPreset={cameraPreset}
            presetVersion={presetVersion}
            autoRotate={autoRotate}
            darkStudio={isDark}
            brandColor={brand}
            accentColor={accent}
            onTapPetZone={handleTapZone}
          />

          {/* Top-Left Compact Hunger, Level & Evolution HUD */}
          <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col gap-1.5 max-w-[235px]">
            <div
              className={`pointer-events-auto rounded-xl px-3 py-2 shadow-md border ${surfaceCls}`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                <span className="truncate">{pet.name}</span>
                <span className="tabular-nums shrink-0" style={{ color: brand }}>
                  {careStatus.isFainted ? 'Fainted!' : `${careStatus.fullness}% Full`}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/10 mt-1 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${careStatus.fullness}%`,
                    backgroundColor:
                      careStatus.fullness > 50
                        ? '#16A34A'
                        : careStatus.fullness > 25
                          ? '#F59E0B'
                          : '#E1000F',
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-2 text-[10px] font-bold mt-2">
                <span className="inline-flex items-center gap-1 truncate">
                  <Star className="w-3 h-3 shrink-0" style={{ color: accent }} />
                  <span className="truncate">Lv.{levelProg.level} · {evoMeta.title}</span>
                </span>
                <span className="tabular-nums opacity-75 shrink-0">
                  {levelProg.progressPct}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/10 mt-1 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${levelProg.progressPct}%`,
                    backgroundColor: accent,
                  }}
                />
              </div>

              <div className="text-[10px] opacity-70 mt-1">{careStatus.timeLeftText}</div>
            </div>

            {careStatus.isFainted && (
              <button
                type="button"
                onClick={() =>
                  void handleFeedMeal(PET_DAILY_MEALS[0].name, PET_DAILY_MEALS[0].items)
                }
                className="pointer-events-auto min-h-[40px] rounded-xl px-3 py-2 text-xs font-bold text-white shadow-lg cursor-pointer"
                style={{ backgroundColor: brand }}
              >
                Revive {pet.name} with Burger!
              </button>
            )}
          </div>

          {/* Talking Tom Speech Bubble */}
          {speechBubble && (
            <div className="pointer-events-none absolute top-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-20 max-w-[260px] rounded-2xl bg-white text-[#3a0b08] border border-[#3a0b08]/15 px-3.5 py-2 shadow-xl text-xs font-bold text-center">
              {speechBubble}
            </div>
          )}

          {/* Bottom-Center Quick Actions & Camera */}
          <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex items-center justify-center px-2 z-10">
            <div
              className={`pointer-events-auto flex items-center gap-1 p-1 rounded-xl shadow-lg border overflow-x-auto no-scrollbar max-w-full ${surfaceCls}`}
            >
              <button
                type="button"
                onClick={() =>
                  void handleFeedMeal(
                    PET_DAILY_MEALS[1].name,
                    PET_DAILY_MEALS[1].items
                  )
                }
                className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white cursor-pointer whitespace-nowrap shrink-0"
                style={{ backgroundColor: brand }}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>{careStatus.isFainted ? 'Revive' : 'Feed'}</span>
              </button>

              <button
                type="button"
                onClick={handleMicTalkBack}
                className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#3a0b08] cursor-pointer whitespace-nowrap shrink-0"
                style={{ backgroundColor: accent }}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Talk</span>
              </button>

              <span className="w-px h-5 bg-current/15 mx-0.5 shrink-0" />

              {(
                [
                  { id: 'full', label: 'Full' },
                  { id: 'face', label: 'Face' },
                  { id: 'back', label: 'Back' },
                  { id: 'shoes', label: 'Boots' },
                ] as const
              ).map((cam) => {
                const active = cameraPreset === cam.id;
                return (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => triggerCamera(cam.id)}
                    className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 ${
                      active ? 'text-white' : 'opacity-75 hover:opacity-100'
                    }`}
                    style={active ? { backgroundColor: brand } : undefined}
                  >
                    {cam.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setAutoRotate((r) => !r)}
                aria-pressed={autoRotate}
                className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                style={
                  autoRotate
                    ? { backgroundColor: accent, color: '#3a0b08' }
                    : undefined
                }
              >
                <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </main>

        {/* RIGHT SIDE (Desktop): Daily Feed Care, Talking Pet, Combos, Save & Share */}
        <aside
          className={`hidden lg:block w-[335px] xl:w-[360px] shrink-0 border-l h-full overflow-y-auto p-3.5 ${surfaceCls}`}
        >
          {renderRightCareAndOutfitPanel()}
        </aside>

        {/* MOBILE BOTTOM DECK (< lg) */}
        <section
          aria-label="Mobile animal pet customizer"
          className={`lg:hidden shrink-0 h-[44dvh] border-t flex flex-col pb-[env(safe-area-inset-bottom)] ${surfaceCls}`}
        >
          <div className="no-scrollbar shrink-0 flex items-center gap-1.5 px-2.5 py-2 border-b border-current/12 overflow-x-auto">
            {categoryNavItems.map(({ id, label, icon: Icon }) => {
              const active = activeCat === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveCat(id)}
                  className={`min-h-[42px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                    active ? 'text-white shadow-sm' : 'border border-current/14 opacity-80'
                  }`}
                  style={active ? { backgroundColor: brand } : undefined}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            {renderCategoryContent(activeCat)}
          </div>
        </section>
      </div>
    </div>
  );
}
