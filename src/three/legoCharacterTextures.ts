import * as THREE from 'three';
import { PetSpecies } from '../data/speedyPetCatalog';

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return [c, ctx];
}

function finalizeTex(c: HTMLCanvasElement, anisotropy: number): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createLegoFaceTexture(
  species: PetSpecies,
  expression: string,
  eyeColor: string,
  anisotropy = 4
): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512, 512);

  // Base face skin / head fill wrapped around front cylinder arc
  const skinColors: Record<PetSpecies, string> = {
    shadow_tux: '#4B2819',
    pink_hero: '#FF64A4',
    kid_speed: '#5D3623',
    reverse_bolt: '#F5C9A6',
    blue_dash: '#0B68D6',
    crimson_bolt: '#F6CCA8',
  };

  ctx.fillStyle = skinColors[species];
  ctx.fillRect(0, 0, 512, 512);

  // Front center of UV cylinder wrap is around x = 256, y = 256
  const cx = 256;
  const cy = 256;

  if (species === 'shadow_tux') {
    // Forehead kanji '愛'
    ctx.fillStyle = '#120B08';
    ctx.font = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('愛', cx - 54, cy - 118);

    // Intense black eyeliner mask + glowing red eyes
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(cx + side * 62, cy - 32);
      ctx.fillStyle = '#0D0B0C';
      ctx.beginPath();
      ctx.moveTo(-42 * side, -22);
      ctx.lineTo(36 * side, -6);
      ctx.lineTo(28 * side, 22);
      ctx.lineTo(-34 * side, 16);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(0, 4, 24, 13, side * -0.1, 0, Math.PI * 2);
      ctx.fill();

      const grad = ctx.createRadialGradient(0, 4, 2, 0, 4, 15);
      grad.addColorStop(0, '#FF9E9E');
      grad.addColorStop(0.55, '#FF151C');
      grad.addColorStop(1, '#7A0005');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 4, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Center brow furrow & nose
    ctx.strokeStyle = '#120B08';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx - 28, cy - 52);
    ctx.lineTo(cx, cy - 34);
    ctx.lineTo(cx + 28, cy - 52);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 4, cy + 2);
    ctx.lineTo(cx + 6, cy + 16);
    ctx.lineTo(cx - 6, cy + 22);
    ctx.stroke();

    // Fierce clenched white teeth smirk
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - 62, cy + 66);
    ctx.quadraticCurveTo(cx + 10, cy + 36, cx + 66, cy + 72);
    ctx.quadraticCurveTo(cx + 12, cy + 76, cx - 54, cy + 88);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (species === 'blue_dash' || species === 'pink_hero') {
    const isPink = species === 'pink_hero';
    // Connected white eye mask
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#1A1A1E';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(cx - 42, cy - 28, 44, 60, -0.08, 0, Math.PI * 2);
    ctx.ellipse(cx + 42, cy - 28, 44, 60, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Green or black irises
    for (const side of [-1, 1]) {
      ctx.fillStyle = isPink ? '#18A83A' : '#141418';
      ctx.beginPath();
      ctx.ellipse(cx + side * 34, cy - 24, 17, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.ellipse(cx + side * 34, cy - 24, 9, 17, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx + side * 34 - 5, cy - 35, 6, 0, Math.PI * 2);
      ctx.fill();

      if (isPink) {
        ctx.strokeStyle = '#111111';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx + side * 66, cy - 58);
        ctx.lineTo(cx + side * 90, cy - 72);
        ctx.moveTo(cx + side * 72, cy - 42);
        ctx.lineTo(cx + side * 94, cy - 48);
        ctx.stroke();
      }
    }

    // Tan muzzle oval lower half
    ctx.fillStyle = '#FAD3AD';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 56, 108, 66, 0, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#141414';
    ctx.lineWidth = 6;
    if (isPink) {
      ctx.fillStyle = '#751220';
      ctx.beginPath();
      ctx.arc(cx, cy + 66, 36, 0.08 * Math.PI, 0.92 * Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(cx - 58, cy + 60);
      ctx.quadraticCurveTo(cx - 24, cy + 88, cx + 18, cy + 72);
      ctx.stroke();
    }
  } else {
    // Speedsters (kid_speed, reverse_bolt, crimson_bolt)
    const isReverse = species === 'reverse_bolt';
    const isKid = species === 'kid_speed';

    for (const side of [-1, 1]) {
      const ex = cx + side * 44;
      const ey = cy - 20;

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 22, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isReverse ? '#DF0F18' : isKid ? '#2B160D' : eyeColor || '#1A1A1E';
      ctx.beginPath();
      ctx.arc(ex, ey, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0D0D10';
      ctx.beginPath();
      ctx.arc(ex, ey, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex - 4, ey - 5, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Eyebrow
      ctx.strokeStyle = '#141010';
      ctx.lineWidth = 7;
      ctx.beginPath();
      if (isReverse) {
        ctx.moveTo(ex - side * 24, ey - 24);
        ctx.lineTo(ex + side * 24, ey - 36);
      } else {
        ctx.moveTo(ex - 20, ey - 34);
        ctx.quadraticCurveTo(ex, ey - 42, ex + 20, ey - 32);
      }
      ctx.stroke();
    }

    // Mouth expression
    ctx.strokeStyle = '#161212';
    ctx.lineWidth = 6;
    if (isReverse || expression === 'cool') {
      ctx.beginPath();
      ctx.moveTo(cx - 34, cy + 56);
      ctx.quadraticCurveTo(cx, cy + 50, cx + 34, cy + 56);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(cx - 42, cy + 44);
      ctx.quadraticCurveTo(cx, cy + 72, cx + 42, cy + 44);
      ctx.quadraticCurveTo(cx, cy + 48, cx - 42, cy + 44);
      ctx.fill();
      ctx.stroke();
    }
  }

  return finalizeTex(c, anisotropy);
}

export function createLegoTorsoTexture(species: PetSpecies, anisotropy = 4): THREE.CanvasTexture {
  const [c, ctx] = makeCanvas(512, 512);

  if (species === 'shadow_tux') {
    // Crisp black tuxedo + white shirt V + buttons
    ctx.fillStyle = '#141418';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#F7F8FA';
    ctx.beginPath();
    ctx.moveTo(155, 0);
    ctx.lineTo(357, 0);
    ctx.lineTo(256, 360);
    ctx.closePath();
    ctx.fill();

    // Tuxedo lapels
    ctx.strokeStyle = '#2B2B32';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(148, 0);
    ctx.lineTo(256, 360);
    ctx.lineTo(364, 0);
    ctx.stroke();

    // Shirt buttons
    ctx.fillStyle = '#141418';
    for (const y of [175, 235, 295]) {
      ctx.beginPath();
      ctx.arc(256, y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (species === 'pink_hero') {
    ctx.fillStyle = '#D90E18';
    ctx.fillRect(0, 0, 512, 512);
    // White dress collar band
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(256, 0, 128, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#FF9AC6';
    ctx.beginPath();
    ctx.arc(256, 0, 96, 0, Math.PI);
    ctx.fill();
  } else if (species === 'blue_dash') {
    ctx.fillStyle = '#0B68D6';
    ctx.fillRect(0, 0, 512, 512);
    // Tan oval belly patch
    ctx.fillStyle = '#FAD3AD';
    ctx.beginPath();
    ctx.ellipse(256, 285, 138, 165, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Speedsters: kid_speed, reverse_bolt, crimson_bolt
    const isCrimson = species === 'crimson_bolt';
    const isReverse = species === 'reverse_bolt';
    const base = isCrimson ? '#C80E16' : '#FFD000';
    const boltCol = isCrimson ? '#FFE100' : '#D40E18';
    const circleCol = isCrimson ? '#FFFFFF' : isReverse ? '#141416' : '#FFFFFF';

    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle heroic abs linework
    ctx.strokeStyle = isCrimson ? 'rgba(40,0,0,0.45)' : 'rgba(130,90,0,0.38)';
    ctx.lineWidth = 6;
    ctx.strokeRect(184, 210, 66, 75);
    ctx.strokeRect(262, 210, 66, 75);
    ctx.strokeRect(192, 295, 58, 62);
    ctx.strokeRect(262, 295, 58, 62);

    // Belt lightning trim
    ctx.fillStyle = boltCol;
    ctx.strokeStyle = '#141414';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 395);
    ctx.lineTo(190, 445);
    ctx.lineTo(256, 412);
    ctx.lineTo(322, 445);
    ctx.lineTo(512, 395);
    ctx.lineTo(512, 455);
    ctx.lineTo(322, 495);
    ctx.lineTo(256, 464);
    ctx.lineTo(190, 495);
    ctx.lineTo(0, 455);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Chest Lightning Emblem Circle
    ctx.fillStyle = circleCol;
    ctx.strokeStyle = '#141414';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(256, 156, 72, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Iconic Lightning Bolt inside circle
    ctx.fillStyle = boltCol;
    ctx.beginPath();
    ctx.moveTo(278, 72);
    ctx.lineTo(222, 152);
    ctx.lineTo(256, 152);
    ctx.lineTo(234, 240);
    ctx.lineTo(298, 146);
    ctx.lineTo(262, 146);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  return finalizeTex(c, anisotropy);
}
