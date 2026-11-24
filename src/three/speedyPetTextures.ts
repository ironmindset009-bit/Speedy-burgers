import * as THREE from 'three';
import { ClothingItemDef } from '../data/speedyPetCatalog';

// Generates crisp procedural textile normal map (fabric weave + subtle fold creases)
export function createFabricNormalMap(anisotropy = 4): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const d = img.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const weaveX = Math.sin(x * 1.45) * 0.45;
      const weaveY = Math.cos(y * 1.45) * 0.45;
      // Subtle diagonal drapery fold waves
      const fold = Math.sin(x * 0.08 + y * 0.05) * 0.55;
      const nx = Math.max(-1, Math.min(1, weaveX * 0.25 + fold * 0.25));
      const ny = Math.max(-1, Math.min(1, weaveY * 0.25 + fold * 0.15));
      const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));

      d[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      d[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      d[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.anisotropy = anisotropy;
  return tex;
}

export function createHairNormalMap(anisotropy = 4): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const d = img.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const strand = Math.sin(x * 0.95 + Math.sin(y * 0.08) * 1.8) * 0.45;
      const nx = strand * 0.42;
      const ny = Math.cos(y * 0.3) * 0.08;
      const nz = Math.sqrt(Math.max(0.1, 1 - nx * nx - ny * ny));
      d[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      d[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      d[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = anisotropy;
  return tex;
}

// Draws detailed front & back graphic textures for Speedy Burger, Godspeed, Deus Vitesse, Sport, and Special Editions
export function createTopClothingTexture(
  item: ClothingItemDef,
  anisotropy = 4
): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Base cloth fill
  ctx.fillStyle = item.primaryColor;
  ctx.fillRect(0, 0, w, h);

  // Subtle fabric texture grain & soft fold shading
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  for (let y = 0; y < h; y += 4) {
    ctx.fillRect(0, y, w, 1);
  }
  const foldGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
  foldGrad.addColorStop(0, 'rgba(0,0,0,0)');
  foldGrad.addColorStop(1, 'rgba(0,0,0,0.16)');
  ctx.fillStyle = foldGrad;
  ctx.fillRect(0, h * 0.55, w, h * 0.45);

  // Cylinder UV wraps front at x = 0.5*w (256) and back near edges (0 / 512)
  const cx = 256;

  // Ribbed hem trim
  if (item.silhouette === 'crewneck' || item.silhouette === 'hoodie' || item.silhouette === 'polo') {
    ctx.fillStyle = item.secondaryColor;
    ctx.fillRect(0, h - 22, w, 10);
  }

  // Graphic artwork centered on chest (x = 256, y ~ 180..320)
  if (item.graphicTag === 'speedy_crest') {
    // Left-chest embroidered Speedy Burger badge
    const bx = 308;
    const by = 188;
    ctx.fillStyle = '#FDB105';
    ctx.beginPath();
    ctx.arc(bx, by, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3A0B08';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Mini burger silhouette inside crest
    ctx.fillStyle = '#D97B29';
    ctx.beginPath();
    ctx.arc(bx, by - 4, 13, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#4B2314';
    ctx.fillRect(bx - 13, by - 1, 26, 5);
    ctx.fillStyle = '#E1000F';
    ctx.fillRect(bx - 14, by + 4, 28, 4);
    ctx.fillStyle = '#D97B29';
    ctx.fillRect(bx - 12, by + 8, 24, 5);
  } else if (item.graphicTag === 'speedy_burger_art') {
    // Center bold Speedy Burger graphic print
    ctx.fillStyle = '#FDB105';
    ctx.font = 'italic 900 42px "Barlow Condensed", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPEEDY', cx, 168);

    // Stylized stacked burger badge
    ctx.fillStyle = '#D67B28';
    ctx.beginPath();
    ctx.ellipse(cx, 206, 48, 24, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#6BBF3B';
    ctx.fillRect(cx - 52, 212, 104, 10);
    ctx.fillStyle = '#FFC226';
    ctx.fillRect(cx - 50, 224, 100, 9);
    ctx.fillStyle = '#5B2B1A';
    ctx.fillRect(cx - 54, 234, 108, 16);
    ctx.fillStyle = '#D67B28';
    ctx.fillRect(cx - 46, 254, 92, 14);

    ctx.fillStyle = '#E1000F';
    ctx.font = 'italic 900 32px "Barlow Condensed", Impact, sans-serif';
    ctx.fillText('BURGER JA', cx, 304);
  } else if (item.graphicTag === 'speedy_varsity') {
    ctx.fillStyle = item.secondaryColor;
    ctx.font = 'italic 900 44px "Barlow Condensed", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPEEDY', cx, 198);
    ctx.fillStyle = item.accentColor;
    ctx.fillRect(cx - 64, 212, 128, 6);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Barlow, sans-serif';
    ctx.fillText('BURGER CLUB', cx, 242);
  } else if (item.graphicTag === 'godspeed_wing') {
    // Godspeed streetwear winged crest
    ctx.strokeStyle = item.secondaryColor;
    ctx.fillStyle = item.secondaryColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 70, 198);
    ctx.lineTo(cx - 18, 214);
    ctx.lineTo(cx + 18, 214);
    ctx.lineTo(cx + 70, 198);
    ctx.lineTo(cx + 38, 228);
    ctx.lineTo(cx - 38, 228);
    ctx.closePath();
    ctx.stroke();

    ctx.font = '900 38px "Barlow Condensed", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GODSPEED', cx, 190);
    ctx.fillStyle = item.accentColor;
    ctx.font = 'bold 16px Barlow, sans-serif';
    ctx.fillText('VITESSE · STUDIO EDITION', cx, 260);
  } else if (item.graphicTag === 'deus_vitesse') {
    ctx.fillStyle = item.secondaryColor;
    ctx.textAlign = 'center';
    ctx.font = '900 34px "Barlow Condensed", Impact, sans-serif';
    ctx.fillText('DEUS VITESSE', cx, 188);
    ctx.fillStyle = item.accentColor;
    ctx.fillRect(cx - 72, 200, 144, 4);
    ctx.fillStyle = item.secondaryColor;
    ctx.font = '700 18px Barlow, sans-serif';
    ctx.fillText('ATELIER RACING 876', cx, 226);

    // Racing stripe chevron
    ctx.strokeStyle = item.accentColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - 46, 250);
    ctx.lineTo(cx, 286);
    ctx.lineTo(cx + 46, 250);
    ctx.stroke();
  } else if (item.graphicTag === 'dv_crest') {
    ctx.fillStyle = item.secondaryColor;
    ctx.beginPath();
    ctx.arc(305, 192, 24, 0, Math.PI * 2);
    ctx.strokeStyle = item.secondaryColor;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.font = '900 22px "Barlow Condensed", serif';
    ctx.textAlign = 'center';
    ctx.fillText('DV', 305, 200);
  } else if (item.graphicTag === 'sport_07' || item.graphicTag === 'sport_10') {
    const num = item.graphicTag === 'sport_07' ? '07' : '10';
    // Horizontal chest band
    ctx.fillStyle = item.secondaryColor;
    ctx.fillRect(0, 148, w, 26);
    ctx.fillStyle = item.accentColor;
    ctx.font = '900 96px "Barlow Condensed", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(num, cx, 268);
  } else if (item.graphicTag === 'sunset_graphic') {
    const grad = ctx.createLinearGradient(cx, 150, cx, 250);
    grad.addColorStop(0, '#FDB105');
    grad.addColorStop(1, '#E8533F');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, 206, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = item.primaryColor;
    ctx.fillRect(cx - 52, 214, 104, 6);
    ctx.fillRect(cx - 52, 228, 104, 6);
  } else if (item.graphicTag === 'christmas') {
    // Festive diamond fair-isle band
    ctx.fillStyle = item.secondaryColor;
    ctx.fillRect(0, 170, w, 64);
    ctx.fillStyle = '#FFFFFF';
    for (let x = 24; x < w; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 180);
      ctx.lineTo(x + 16, 202);
      ctx.lineTo(x, 224);
      ctx.lineTo(x - 16, 202);
      ctx.closePath();
      ctx.fill();
    }
  } else if (item.graphicTag === 'halloween') {
    ctx.fillStyle = '#FF6B1A';
    ctx.beginPath();
    ctx.arc(cx, 212, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#18141C';
    // Jack-o-lantern eyes & grin
    ctx.beginPath();
    ctx.moveTo(cx - 24, 202);
    ctx.lineTo(cx - 12, 186);
    ctx.lineTo(cx - 4, 202);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 24, 202);
    ctx.lineTo(cx + 12, 186);
    ctx.lineTo(cx + 4, 202);
    ctx.fill();
    ctx.fillRect(cx - 24, 222, 48, 12);
  } else if (item.graphicTag === 'summer') {
    // Tropical botanical print patches across shirt
    ctx.fillStyle = item.secondaryColor;
    for (let i = 0; i < 16; i++) {
      const px = ((i * 97) % 460) + 26;
      const py = ((i * 131) % 420) + 40;
      ctx.beginPath();
      ctx.ellipse(px, py, 24, 10, (i * 0.7) % Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = item.accentColor;
    for (let i = 0; i < 10; i++) {
      const px = ((i * 149 + 40) % 460) + 26;
      const py = ((i * 107 + 30) % 420) + 40;
      ctx.beginPath();
      ctx.arc(px, py, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (item.graphicTag === 'valentines') {
    ctx.fillStyle = item.secondaryColor;
    ctx.beginPath();
    ctx.moveTo(cx, 248);
    ctx.bezierCurveTo(cx - 60, 208, cx - 52, 162, cx, 188);
    ctx.bezierCurveTo(cx + 52, 162, cx + 60, 208, cx, 248);
    ctx.fill();
  } else if (item.graphicTag === 'jamaica') {
    // Jamaican Independence black, green & gold diagonal cross sash
    ctx.fillStyle = '#009B3A';
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.lineTo(w, 240);
    ctx.lineTo(w, 340);
    ctx.lineTo(0, 160);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#FED100';
    ctx.lineWidth = 24;
    ctx.beginPath();
    ctx.moveTo(0, 95);
    ctx.lineTo(w, 275);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'italic 900 44px "Barlow Condensed", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('JAMAICA', cx, 218);
  }

  // Button placket line for polos & button-ups
  if (item.silhouette === 'polo' || item.silhouette === 'button_up') {
    const placketH = item.silhouette === 'polo' ? 140 : 480;
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(cx - 8, 12, 16, placketH);
    ctx.fillStyle = '#FFFFFF';
    const btnCount = item.silhouette === 'polo' ? 3 : 6;
    for (let b = 0; b < btnCount; b++) {
      ctx.beginPath();
      ctx.arc(cx, 38 + b * 44, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Center zipper for zip hoodies
  if (item.silhouette === 'zip_hoodie') {
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(cx - 5, 0, 10, h);
    ctx.fillStyle = '#333333';
    for (let y = 12; y < h; y += 16) {
      ctx.fillRect(cx - 4, y, 8, 4);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export function createBottomClothingTexture(
  item: ClothingItemDef,
  anisotropy = 4
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = item.primaryColor;
  ctx.fillRect(0, 0, size, size);

  // Subtle denim/cotton grain
  if (item.silhouette === 'jeans' || item.silhouette === 'denim_shorts') {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    for (let i = -size; i < size * 2; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
      ctx.stroke();
    }
  }

  // Side stripe on joggers / athletic shorts
  if (item.silhouette === 'joggers' || item.silhouette === 'athletic_shorts') {
    ctx.fillStyle = item.secondaryColor;
    ctx.fillRect(118, 0, 20, size);
    ctx.fillStyle = item.accentColor;
    ctx.fillRect(125, 0, 6, size);
  }

  // Seam stitching
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, size - 8, size - 8);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}
