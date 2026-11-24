import { PetSpecies, PET_SPECIES } from '../data/speedyPetCatalog';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextCtor) audioCtx = new AudioContextCtor();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playPetReactionSound(
  species: PetSpecies,
  kind: 'giggle' | 'eat' | 'hop' | 'faint' | 'levelup' | 'evolve'
): void {
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const spMeta = PET_SPECIES.find((s) => s.id === species) ?? PET_SPECIES[0];
  const baseHz = 360 * spMeta.voicePitch;

  if (kind === 'evolve' || kind === 'levelup') {
    const notes = kind === 'evolve' ? [523.25, 659.25, 783.99, 1046.5, 1318.5] : [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = kind === 'evolve' ? 'triangle' : 'sine';
      const t = now + idx * 0.085;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.3);
    });
    return;
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (kind === 'eat') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseHz * 0.7, now);
    osc.frequency.exponentialRampToValueAtTime(baseHz * 1.45, now + 0.14);
    osc.frequency.exponentialRampToValueAtTime(baseHz * 1.9, now + 0.28);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc.start(now);
    osc.stop(now + 0.34);
  } else if (kind === 'hop') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseHz * 0.8, now);
    osc.frequency.exponentialRampToValueAtTime(baseHz * 2.1, now + 0.18);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.start(now);
    osc.stop(now + 0.24);
  } else if (kind === 'faint') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseHz, now);
    osc.frequency.exponentialRampToValueAtTime(baseHz * 0.35, now + 0.4);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    osc.start(now);
    osc.stop(now + 0.45);
  } else {
    // Playful character reaction chirp
    osc.type = species === 'shadow_tux' || species === 'reverse_bolt' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(baseHz, now);
    osc.frequency.exponentialRampToValueAtTime(baseHz * 1.55, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(baseHz * 1.1, now + 0.2);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.start(now);
    osc.stop(now + 0.26);
  }
}

export function speakAsPet(
  text: string,
  species: PetSpecies,
  onStart?: () => void,
  onEnd?: () => void
): void {
  const clean = text.trim();
  if (!clean) return;
  const spMeta = PET_SPECIES.find((s) => s.id === species) ?? PET_SPECIES[0];

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(clean);
      utter.pitch = Math.min(2.0, Math.max(1.15, spMeta.voicePitch * 1.15));
      utter.rate = 1.14;
      utter.onstart = () => onStart?.();
      utter.onend = () => onEnd?.();
      utter.onerror = () => onEnd?.();
      window.speechSynthesis.speak(utter);
      return;
    } catch {
      // fall through
    }
  }

  onStart?.();
  playPetReactionSound(species, 'giggle');
  setTimeout(() => onEnd?.(), 1400);
}
