import * as THREE from "three";

export interface BurgerTextureSet {
  bunTopMap: THREE.CanvasTexture;
  bunBottomMap: THREE.CanvasTexture;
  bunCrumbMap: THREE.CanvasTexture;
  bunNormalMap: THREE.CanvasTexture;
  bunCrumbNormalMap: THREE.CanvasTexture;
  pattyMap: THREE.CanvasTexture;
  pattyNormalMap: THREE.CanvasTexture;
  pattyRoughnessMap: THREE.CanvasTexture;
  cheeseMap: THREE.CanvasTexture;
  cheeseNormalMap: THREE.CanvasTexture;
  baconMap: THREE.CanvasTexture;
  baconNormalMap: THREE.CanvasTexture;
  baconRoughnessMap: THREE.CanvasTexture;
  baconAlphaMap: THREE.CanvasTexture;
  tomatoMap: THREE.CanvasTexture;
  tomatoNormalMap: THREE.CanvasTexture;
  pickleMap: THREE.CanvasTexture;
  pickleNormalMap: THREE.CanvasTexture;
  onionMap: THREE.CanvasTexture;
  onionNormalMap: THREE.CanvasTexture;
  lettuceMap: THREE.CanvasTexture;
  lettuceNormalMap: THREE.CanvasTexture;
  lettuceAlphaMap: THREE.CanvasTexture;
  friesBoxMap: THREE.CanvasTexture;
  fryStickMap: THREE.CanvasTexture;
  seasonedFryStickMap: THREE.CanvasTexture;
  chickenMap: THREE.CanvasTexture;
  chickenNormalMap: THREE.CanvasTexture;
  slicedBreadCrustMap: THREE.CanvasTexture;
  drinkCupMap: THREE.CanvasTexture;
  shadowMap: THREE.CanvasTexture;
  steamMap: THREE.CanvasTexture;
  dispose: () => void;
}

// Fast deterministic 2D value noise + fBm for photographic micro-detail
function hash2(ix: number, iy: number, seed: number): number {
  let n = ix * 374761393 + iy * 668265263 + seed * 1442695041;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

function smoothNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += smoothNoise(x * freq, y * freq, seed + i * 31) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.02;
  }
  return sum / norm;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

// Convert a grayscale height buffer (0..1) into a tangent-space normal map canvas
function heightBufferToNormalCanvas(
  heights: Float32Array,
  size: number,
  strength: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  const data = img.data;

  for (let y = 0; y < size; y++) {
    const ym = (y - 1 + size) % size;
    const yp = (y + 1) % size;
    for (let x = 0; x < size; x++) {
      const xm = (x - 1 + size) % size;
      const xp = (x + 1) % size;

      const tl = heights[ym * size + xm];
      const t = heights[ym * size + x];
      const tr = heights[ym * size + xp];
      const l = heights[y * size + xm];
      const r = heights[y * size + xp];
      const bl = heights[yp * size + xm];
      const b = heights[yp * size + x];
      const br = heights[yp * size + xp];

      const dx = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
      const dy = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
      const dz = 1.0;
      const invLen = 1 / Math.hypot(dx, dy, dz);

      const idx = (y * size + x) * 4;
      data[idx] = clampByte((-dx * invLen * 0.5 + 0.5) * 255);
      data[idx + 1] = clampByte((-dy * invLen * 0.5 + 0.5) * 255);
      data[idx + 2] = clampByte((dz * invLen * 0.5 + 0.5) * 255);
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function makeCanvas(size = 512): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  isColor: boolean,
  repeat = false
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = anisotropy;
  tex.wrapS = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  tex.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function createBurgerTextures(maxAnisotropy: number): BurgerTextureSet {
  const allTextures: THREE.CanvasTexture[] = [];
  const track = (t: THREE.CanvasTexture) => {
    allTextures.push(t);
    return t;
  };

  // ---------------------------------------------------------------------------
  // 1. BRIOCHE TOP & BOTTOM BUNS (Photographic Egg-Wash Crust + Micro-Blisters)
  // ---------------------------------------------------------------------------
  const bunSize = 512;
  const [bunTopC, bunTopCtx] = makeCanvas(bunSize);
  const [bunBotC, bunBotCtx] = makeCanvas(bunSize);
  const bunHeights = new Float32Array(bunSize * bunSize);
  const bunTopImg = bunTopCtx.createImageData(bunSize, bunSize);
  const bunBotImg = bunBotCtx.createImageData(bunSize, bunSize);

  for (let y = 0; y < bunSize; y++) {
    const v = y / (bunSize - 1); // 0 = crown apex, 1 = bottom cut rim
    for (let x = 0; x < bunSize; x++) {
      const u = x / (bunSize - 1);
      const n1 = fbm(u * 14, v * 14, 11, 4);
      const n2 = fbm(u * 48, v * 48, 29, 3);
      const blister = Math.pow(n2, 2.2) * 0.35;
      bunHeights[y * bunSize + x] = n1 * 0.6 + n2 * 0.4;

      // Top bun: deep roasted mahogany-caramel at crown, warm honey-gold mid, lighter baked ring near cut edge
      let r: number, g: number, b: number;
      if (v < 0.72) {
        const t = v / 0.72;
        r = 162 + t * 56 + (n1 - 0.5) * 28 - blister * 18;
        g = 84 + t * 52 + (n1 - 0.5) * 22 - blister * 14;
        b = 22 + t * 34 + (n1 - 0.5) * 14;
      } else {
        const t = (v - 0.72) / 0.28;
        r = 218 + t * 22 + (n1 - 0.5) * 18;
        g = 136 + t * 48 + (n1 - 0.5) * 16;
        b = 56 + t * 52 + (n1 - 0.5) * 14;
      }
      const idx = (y * bunSize + x) * 4;
      bunTopImg.data[idx] = clampByte(r);
      bunTopImg.data[idx + 1] = clampByte(g);
      bunTopImg.data[idx + 2] = clampByte(b);
      bunTopImg.data[idx + 3] = 255;

      // Bottom bun: lighter golden-tan crust transitioning to toasted amber bottom
      const bt = v;
      const br = 226 - bt * 48 + (n1 - 0.5) * 24;
      const bg = 172 - bt * 68 + (n1 - 0.5) * 20;
      const bb = 98 - bt * 58 + (n1 - 0.5) * 14;
      bunBotImg.data[idx] = clampByte(br);
      bunBotImg.data[idx + 1] = clampByte(bg);
      bunBotImg.data[idx + 2] = clampByte(bb);
      bunBotImg.data[idx + 3] = 255;
    }
  }
  bunTopCtx.putImageData(bunTopImg, 0, 0);
  bunBotCtx.putImageData(bunBotImg, 0, 0);
  const bunTopMap = track(finalizeTexture(bunTopC, maxAnisotropy, true, true));
  const bunBottomMap = track(finalizeTexture(bunBotC, maxAnisotropy, true, true));
  const bunNormalMap = track(
    finalizeTexture(heightBufferToNormalCanvas(bunHeights, bunSize, 1.4), maxAnisotropy, false, true)
  );

  // ---------------------------------------------------------------------------
  // 2. TOASTED POROUS BRIOCHE CRUMB (Cellular bread air pockets + browned toast)
  // ---------------------------------------------------------------------------
  const [crumbC, crumbCtx] = makeCanvas(bunSize);
  const crumbImg = crumbCtx.createImageData(bunSize, bunSize);
  const crumbHeights = new Float32Array(bunSize * bunSize);

  for (let y = 0; y < bunSize; y++) {
    const dy = (y / bunSize - 0.5) * 2;
    for (let x = 0; x < bunSize; x++) {
      const dx = (x / bunSize - 0.5) * 2;
      const rad = Math.hypot(dx, dy);

      // Multi-scale cellular bread pores
      const poreFine = fbm(x * 0.095, y * 0.095, 53, 4);
      const poreMed = fbm(x * 0.038, y * 0.038, 71, 3);
      const toastMottle = fbm(x * 0.015, y * 0.015, 97, 3);

      // Carve deep pores where noise dips below threshold
      const poreDepth = Math.max(0, 0.52 - poreFine) * 1.9;
      const height = 1.0 - poreDepth * 0.75 - Math.max(0, 0.45 - poreMed) * 0.45;
      crumbHeights[y * bunSize + x] = height;

      // Toasted golden-brown griddle spots + darker rim
      const toast = THREE.MathUtils.clamp((toastMottle - 0.36) * 2.1 + Math.pow(rad, 2.2) * 0.55, 0, 1);
      const shade = 1.0 - poreDepth * 0.52;
      const r = (242 - toast * 64) * shade;
      const g = (204 - toast * 92) * shade;
      const b = (132 - toast * 86) * shade;

      const idx = (y * bunSize + x) * 4;
      crumbImg.data[idx] = clampByte(r);
      crumbImg.data[idx + 1] = clampByte(g);
      crumbImg.data[idx + 2] = clampByte(b);
      crumbImg.data[idx + 3] = 255;
    }
  }
  crumbCtx.putImageData(crumbImg, 0, 0);
  const bunCrumbMap = track(finalizeTexture(crumbC, maxAnisotropy, true, false));
  const bunCrumbNormalMap = track(
    finalizeTexture(heightBufferToNormalCanvas(crumbHeights, bunSize, 3.2), maxAnisotropy, false, false)
  );

  // ---------------------------------------------------------------------------
  // 3. CHAR-GRILLED BEEF PATTY (Photographic ground beef, Maillard char & rendered fat)
  // ---------------------------------------------------------------------------
  const pSize = 512;
  const [pattyC, pattyCtx] = makeCanvas(pSize);
  const [pattyRoughC, pattyRoughCtx] = makeCanvas(pSize);
  const pattyImg = pattyCtx.createImageData(pSize, pSize);
  const pattyRoughImg = pattyRoughCtx.createImageData(pSize, pSize);
  const pattyHeights = new Float32Array(pSize * pSize);

  for (let y = 0; y < pSize; y++) {
    const ny = y / pSize - 0.5;
    for (let x = 0; x < pSize; x++) {
      const nx = x / pSize - 0.5;

      // Ground beef pebble grain + crispy crevices
      const coarse = fbm(x * 0.032, y * 0.032, 211, 4);
      const fine = fbm(x * 0.11, y * 0.11, 239, 3);
      const micro = fbm(x * 0.24, y * 0.24, 263, 2);

      // Diagonal grill sear bands
      const rotX = nx * Math.cos(-0.48) - ny * Math.sin(-0.48);
      const grillWave = Math.pow(Math.max(0, Math.cos(rotX * Math.PI * 10.5)), 6.0);

      const h = coarse * 0.55 + fine * 0.3 + micro * 0.15;
      pattyHeights[y * pSize + x] = h - grillWave * 0.14;

      // Char in deep ridges & grill marks, juicy browned meat on raised nuggets
      const charFactor = THREE.MathUtils.clamp(
        grillWave * 0.78 + Math.max(0, coarse - 0.62) * 1.4,
        0,
        1
      );
      const fatSparkle = THREE.MathUtils.clamp((fine - 0.64) * 3.2, 0, 1);

      let r = 108 * (0.55 + h * 0.75) - charFactor * 68 + fatSparkle * 46;
      let g = 56 * (0.52 + h * 0.72) - charFactor * 38 + fatSparkle * 32;
      let b = 38 * (0.5 + h * 0.68) - charFactor * 26 + fatSparkle * 22;

      // Subtle pink-brown rendered juice tint in crevices
      if (h < 0.42 && charFactor < 0.35) {
        r += 16;
        g += 4;
      }

      const idx = (y * pSize + x) * 4;
      pattyImg.data[idx] = clampByte(r);
      pattyImg.data[idx + 1] = clampByte(g);
      pattyImg.data[idx + 2] = clampByte(b);
      pattyImg.data[idx + 3] = 255;

      // Roughness: glossy oil/juice on raised nuggets (65-95), matte dry char (205-235)
      const roughVal = clampByte(165 - fatSparkle * 105 + charFactor * 72 - (h - 0.5) * 45);
      pattyRoughImg.data[idx] = roughVal;
      pattyRoughImg.data[idx + 1] = roughVal;
      pattyRoughImg.data[idx + 2] = roughVal;
      pattyRoughImg.data[idx + 3] = 255;
    }
  }
  pattyCtx.putImageData(pattyImg, 0, 0);
  pattyRoughCtx.putImageData(pattyRoughImg, 0, 0);
  const pattyMap = track(finalizeTexture(pattyC, maxAnisotropy, true, true));
  const pattyRoughnessMap = track(finalizeTexture(pattyRoughC, maxAnisotropy, false, true));
  const pattyNormalMap = track(
    finalizeTexture(heightBufferToNormalCanvas(pattyHeights, pSize, 4.8), maxAnisotropy, false, true)
  );

  // ---------------------------------------------------------------------------
  // 4. MELTED GOLDEN-YELLOW AMERICAN CHEDDAR
  // ---------------------------------------------------------------------------
  const cSize = 256;
  const [cheeseC, cheeseCtx] = makeCanvas(cSize);
  const cheeseImg = cheeseCtx.createImageData(cSize, cSize);
  const cheeseHeights = new Float32Array(cSize * cSize);

  for (let y = 0; y < cSize; y++) {
    for (let x = 0; x < cSize; x++) {
      const n = fbm(x * 0.035, y * 0.035, 311, 3);
      const micro = fbm(x * 0.12, y * 0.12, 337, 2);
      cheeseHeights[y * cSize + x] = n * 0.7 + micro * 0.3;

      // Rich creamy cheddar yellow-orange with subtle warm depth
      const r = 247 + (n - 0.5) * 14;
      const g = 171 + (n - 0.5) * 28;
      const b = 22 + (n - 0.5) * 16;

      const idx = (y * cSize + x) * 4;
      cheeseImg.data[idx] = clampByte(r);
      cheeseImg.data[idx + 1] = clampByte(g);
      cheeseImg.data[idx + 2] = clampByte(b);
      cheeseImg.data[idx + 3] = 255;
    }
  }
  cheeseCtx.putImageData(cheeseImg, 0, 0);
  const cheeseMap = track(finalizeTexture(cheeseC, maxAnisotropy, true, true));
  const cheeseNormalMap = track(
    finalizeTexture(heightBufferToNormalCanvas(cheeseHeights, cSize, 0.9), maxAnisotropy, false, true)
  );

  // ---------------------------------------------------------------------------
  // 5. CRISPY SMOKY REDDISH-BROWN BACON (Organic marbling + blistered edges)
  // ---------------------------------------------------------------------------
  const bSize = 512;
  const [baconC, baconCtx] = makeCanvas(bSize);
  const [baconRoughC, baconRoughCtx] = makeCanvas(bSize);
  const [baconAlphaC, baconAlphaCtx] = makeCanvas(bSize);
  const baconImg = baconCtx.createImageData(bSize, bSize);
  const baconRoughImg = baconRoughCtx.createImageData(bSize, bSize);
  const baconAlphaImg = baconAlphaCtx.createImageData(bSize, bSize);
  const baconHeights = new Float32Array(bSize * bSize);

  for (let y = 0; y < bSize; y++) {
    const v = y / (bSize - 1); // across width of strip
    for (let x = 0; x < bSize; x++) {
      const u = x / (bSize - 1); // along length of strip
      const warp = fbm(u * 6, v * 6, 401, 3) * 0.24;
      const vW = v + warp - 0.12;
      const blister = fbm(u * 26, v * 26, 433, 3);
      const fine = fbm(u * 64, v * 64, 457, 2);

      // Alternating wavy fat & smoky meat bands
      const bandSignal =
        Math.sin(vW * Math.PI * 3.4) * 0.55 + Math.cos(vW * Math.PI * 7.2 + u * 4) * 0.25;
      const isFat = THREE.MathUtils.smoothstep(bandSignal, 0.12, 0.45);
      const isCrispyEdge = THREE.MathUtils.smoothstep(Math.abs(v - 0.5) * 2, 0.68, 0.96);

      // Jagged natural bacon edge alpha cutout
      const edgeNoise = fbm(u * 14, v * 8, 491, 3);
      const edgeDist = Math.abs(v - 0.5) * 2 + (edgeNoise - 0.5) * 0.24;
      const endFade = Math.abs(u - 0.5) * 2 + (edgeNoise - 0.5) * 0.12;
      const alpha = edgeDist < 0.88 && endFade < 0.95 ? 255 : 0;

      baconHeights[y * bSize + x] =
        blister * 0.65 + fine * 0.35 + isFat * 0.15 - isCrispyEdge * 0.1;

      // Smoky mahogany-crimson lean meat + translucent golden-ivory rendered fat
      const leanR = 148 + (blister - 0.5) * 44 - isCrispyEdge * 55;
      const leanG = 42 + (blister - 0.5) * 24 - isCrispyEdge * 22;
      const leanB = 26 + (blister - 0.5) * 14 - isCrispyEdge * 12;

      const fatR = 232 + (blister - 0.5) * 24 - isCrispyEdge * 40;
      const fatG = 184 + (blister - 0.5) * 32 - isCrispyEdge * 55;
      const fatB = 132 + (blister - 0.5) * 26 - isCrispyEdge * 50;

      const idx = (y * bSize + x) * 4;
      baconImg.data[idx] = clampByte(THREE.MathUtils.lerp(leanR, fatR, isFat));
      baconImg.data[idx + 1] = clampByte(THREE.MathUtils.lerp(leanG, fatG, isFat));
      baconImg.data[idx + 2] = clampByte(THREE.MathUtils.lerp(leanB, fatB, isFat));
      baconImg.data[idx + 3] = 255;

      // Oily shine on rendered fat (roughness ~55), crispier matte edges (~145)
      const rough = clampByte(95 - isFat * 45 + isCrispyEdge * 65 + (1 - blister) * 25);
      baconRoughImg.data[idx] = rough;
      baconRoughImg.data[idx + 1] = rough;
      baconRoughImg.data[idx + 2] = rough;
      baconRoughImg.data[idx + 3] = 255;

      baconAlphaImg.data[idx] = alpha;
      baconAlphaImg.data[idx + 1] = alpha;
      baconAlphaImg.data[idx + 2] = alpha;
      baconAlphaImg.data[idx + 3] = 255;
    }
  }
  baconCtx.putImageData(baconImg, 0, 0);
  baconRoughCtx.putImageData(baconRoughImg, 0, 0);
  baconAlphaCtx.putImageData(baconAlphaImg, 0, 0);
  const baconMap = track(finalizeTexture(baconC, maxAnisotropy, true, false));
  const baconRoughnessMap = track(finalizeTexture(baconRoughC, maxAnisotropy, false, false));
  const baconAlphaMap = track(finalizeTexture(baconAlphaC, maxAnisotropy, false, false));
  const baconNormalMap = track(
    finalizeTexture(heightBufferToNormalCanvas(baconHeights, bSize, 2.8), maxAnisotropy, false, false)
  );

  // ---------------------------------------------------------------------------
  // 6. JUICY RED TOMATO SLICE (Realistic septa, gel locules & seeds)
  // ---------------------------------------------------------------------------
  const tSize = 512;
  const [tomC, tomCtx] = makeCanvas(tSize);
  const [tomH, tomHCtx] = makeCanvas(tSize);
  const tomGrad = tomCtx.createRadialGradient(256, 256, 8, 256, 256, 254);
  tomGrad.addColorStop(0.0, "#eb6f5a");
  tomGrad.addColorStop(0.16, "#dc3826");
  tomGrad.addColorStop(0.76, "#c92416");
  tomGrad.addColorStop(0.92, "#ae190e");
  tomGrad.addColorStop(1.0, "#871108");
  tomCtx.fillStyle = tomGrad;
  tomCtx.fillRect(0, 0, tSize, tSize);

  tomHCtx.fillStyle = "#c0c0c0";
  tomHCtx.fillRect(0, 0, tSize, tSize);

  const randTom = mulberry32(606);
  // Radial fleshy septa spokes
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.18;
    tomCtx.save();
    tomCtx.translate(256, 256);
    tomCtx.rotate(a);

    // Translucent dark crimson seed chamber gel
    const gelGrad = tomCtx.createRadialGradient(124, 0, 6, 124, 0, 64);
    gelGrad.addColorStop(0, "rgba(104, 14, 9, 0.85)");
    gelGrad.addColorStop(0.75, "rgba(135, 22, 12, 0.72)");
    gelGrad.addColorStop(1, "rgba(180, 42, 26, 0.0)");
    tomCtx.fillStyle = gelGrad;
    tomCtx.beginPath();
    tomCtx.ellipse(124, 0, 62, 42, 0, 0, Math.PI * 2);
    tomCtx.fill();

    tomHCtx.save();
    tomHCtx.translate(256, 256);
    tomHCtx.rotate(a);
    tomHCtx.fillStyle = "rgba(65, 65, 65, 0.85)";
    tomHCtx.beginPath();
    tomHCtx.ellipse(124, 0, 58, 38, 0, 0, Math.PI * 2);
    tomHCtx.fill();

    // Realistic teardrop pale-yellow seeds suspended in gel
    for (let s = 0; s < 9; s++) {
      const sx = 86 + randTom() * 68;
      const sy = (randTom() - 0.5) * 46;
      const ang = randTom() * 0.8 - 0.4;
      tomCtx.fillStyle = "#f2cf72";
      tomCtx.beginPath();
      tomCtx.ellipse(sx, sy, 7.2, 3.6, ang, 0, Math.PI * 2);
      tomCtx.fill();

      tomHCtx.fillStyle = "#ececec";
      tomHCtx.beginPath();
      tomHCtx.ellipse(sx, sy, 7.2, 3.6, ang, 0, Math.PI * 2);
      tomHCtx.fill();
    }
    tomHCtx.restore();
    tomCtx.restore();
  }
  const tomImgData = tomHCtx.getImageData(0, 0, tSize, tSize);
  const tomHeights = new Float32Array(tSize * tSize);
  for (let i = 0; i < tSize * tSize; i++) {
    tomHeights[i] = tomImgData.data[i * 4] / 255;
  }
  const tomatoMap = track(finalizeTexture(tomC, maxAnisotropy, true, false));
  const tomatoNormalMap = track(
    finalizeTexture(heightBufferToNormalCanvas(tomHeights, tSize, 2.2), maxAnisotropy, false, false)
  );

  // ---------------------------------------------------------------------------
  // 7. GLOSSY CRINKLED DILL PICKLE SLICES
  // ---------------------------------------------------------------------------
  const pkSize = 512;
  const [pickC, pickCtx] = makeCanvas(pkSize);
  const pickBase = pickCtx.createRadialGradient(256, 256, 10, 256, 256, 254);
  pickBase.addColorStop(0.0, "#b9cf6f");
  pickBase.addColorStop(0.48, "#94ad42");
  pickBase.addColorStop(0.84, "#678722");
  pickBase.addColorStop(0.95, "#425d12");
  pickBase.addColorStop(1.0, "#2f470b");
  pickCtx.fillStyle = pickBase;
  pickCtx.fillRect(0, 0, pkSize, pkSize);

  const randPick = mulberry32(707);
  for (let s = 0; s < 22; s++) {
    const a = (s / 22) * Math.PI * 2 + randPick() * 0.25;
    const rad = 46 + randPick() * 88;
    const sx = 256 + Math.cos(a) * rad;
    const sy = 256 + Math.sin(a) * rad;
    pickCtx.fillStyle = "rgba(226, 238, 168, 0.85)";
    pickCtx.beginPath();
    pickCtx.ellipse(sx, sy, 9.5, 4.5, a, 0, Math.PI * 2);
    pickCtx.fill();
  }

  const pickHeights = new Float32Array(pkSize * pkSize);
  for (let y = 0; y < pkSize; y++) {
    for (let x = 0; x < pkSize; x++) {
      const crinkle = Math.sin((x / pkSize) * Math.PI * 26) * 0.32 + 0.5;
      const cell = fbm(x * 0.08, y * 0.08, 733, 3) * 0.25;
      pickHeights[y * pkSize + x] = crinkle + cell;
    }
  }
  const pickleMap = track(finalizeTexture(pickC, maxAnisotropy, true, false));
  const pickleNormalMap = track(
    finalizeTexture(heightBufferToNormalCanvas(pickHeights, pkSize, 2.4), maxAnisotropy, false, false)
  );

  // ---------------------------------------------------------------------------
  // 8. CRISP PURPLE-RED ONION RINGS (Fibrous cellular striation)
  // ---------------------------------------------------------------------------
  const oSize = 256;
  const [onionC, onionCtx] = makeCanvas(oSize);
  const onionImg = onionCtx.createImageData(oSize, oSize);
  const onionHeights = new Float32Array(oSize * oSize);
  for (let y = 0; y < oSize; y++) {
    const v = y / (oSize - 1);
    for (let x = 0; x < oSize; x++) {
      const u = x / (oSize - 1);
      const fiber = fbm(u * 42, v * 10, 809, 2);
      onionHeights[y * oSize + x] = fiber;

      // Deep magenta outer skin on top/bottom edges & crisp translucent white-lavender center
      const skinEdge = Math.min(v, 1 - v);
      const isSkin = 1 - THREE.MathUtils.smoothstep(skinEdge, 0.04, 0.18);
      const ringBand = Math.sin(v * Math.PI * 4) * 0.5 + 0.5;

      const r = THREE.MathUtils.lerp(244 - ringBand * 18, 128, isSkin) + (fiber - 0.5) * 12;
      const g = THREE.MathUtils.lerp(224 - ringBand * 44, 24, isSkin) + (fiber - 0.5) * 10;
      const b = THREE.MathUtils.lerp(238 - ringBand * 22, 92, isSkin) + (fiber - 0.5) * 12;

      const idx = (y * oSize + x) * 4;
      onionImg.data[idx] = clampByte(r);
      onionImg.data[idx + 1] = clampByte(g);
      onionImg.data[idx + 2] = clampByte(b);
      onionImg.data[idx + 3] = 255;
    }
  }
  onionCtx.putImageData(onionImg, 0, 0);
  const onionMap = track(finalizeTexture(onionC, maxAnisotropy, true, true));
  const onionNormalMap = track(
    finalizeTexture(heightBufferToNormalCanvas(onionHeights, oSize, 1.1), maxAnisotropy, false, true)
  );

  // ---------------------------------------------------------------------------
  // 9. VIBRANT CURLY GREEN LETTUCE (Veined leaf albedo + scalloped alpha cutout)
  // ---------------------------------------------------------------------------
  const lSize = 512;
  const [letC, letCtx] = makeCanvas(lSize);
  const [letAlphaC, letAlphaCtx] = makeCanvas(lSize);
  const letImg = letCtx.createImageData(lSize, lSize);
  const letAlphaImg = letAlphaCtx.createImageData(lSize, lSize);
  const letHeights = new Float32Array(lSize * lSize);

  for (let y = 0; y < lSize; y++) {
    const dy = (y / lSize - 0.5) * 2;
    for (let x = 0; x < lSize; x++) {
      const dx = (x / lSize - 0.5) * 2;
      const r = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);

      // Scalloped curly outer boundary for natural crisp leaf silhouettes
      const scallop =
        Math.sin(a * 11 + 0.3) * 0.065 +
        Math.cos(a * 23 - 0.9) * 0.04 +
        (fbm(dx * 5 + 4, dy * 5 + 4, 907, 3) - 0.5) * 0.12;
      const alpha = r < 0.88 + scallop ? 255 : 0;

      // Branching central leaf veins
      const veinWave = Math.abs(Math.sin(a * 9 + r * 2.2));
      const vein = Math.pow(1 - veinWave, 8) * (1 - r * 0.35);
      const leafTex = fbm(x * 0.055, y * 0.055, 929, 4);
      const crinkle = fbm(x * 0.14, y * 0.14, 953, 2);

      letHeights[y * lSize + x] = leafTex * 0.45 + crinkle * 0.25 + vein * 0.45;

      // Crisp pale yellow-green inner ribs -> lush vibrant leaf green -> crisp lime margins
      const margin = THREE.MathUtils.smoothstep(r, 0.58, 0.92);
      const baseR = THREE.MathUtils.lerp(182, 74, THREE.MathUtils.smoothstep(r, 0.1, 0.65)) + margin * 34;
      const baseG = THREE.MathUtils.lerp(222, 148, THREE.MathUtils.smoothstep(r, 0.1, 0.65)) + margin * 32;
      const baseB = THREE.MathUtils.lerp(116, 26, THREE.MathUtils.smoothstep(r, 0.1, 0.65)) + margin * 12;

      const idx = (y * lSize + x) * 4;
      letImg.data[idx] = clampByte(baseR + vein * 48 + (leafTex - 0.5) * 26);
      letImg.data[idx + 1] = clampByte(baseG + vein * 42 + (leafTex - 0.5) * 24);
      letImg.data[idx + 2] = clampByte(baseB + vein * 36 + (leafTex - 0.5) * 14);
      letImg.data[idx + 3] = 255;

      letAlphaImg.data[idx] = alpha;
      letAlphaImg.data[idx + 1] = alpha;
      letAlphaImg.data[idx + 2] = alpha;
      letAlphaImg.data[idx + 3] = 255;
    }
  }
  letCtx.putImageData(letImg, 0, 0);
  letAlphaCtx.putImageData(letAlphaImg, 0, 0);
  const lettuceMap = track(finalizeTexture(letC, maxAnisotropy, true, false));
  const lettuceAlphaMap = track(finalizeTexture(letAlphaC, maxAnisotropy, false, false));
  const lettuceNormalMap = track(
    finalizeTexture(heightBufferToNormalCanvas(letHeights, lSize, 2.2), maxAnisotropy, false, false)
  );

  // ---------------------------------------------------------------------------
  // 10. SIDE ITEMS (Fries & Drink) + SHADOW & STEAM
  // ---------------------------------------------------------------------------
  const [fBoxC, fBoxCtx] = makeCanvas(256);
  fBoxCtx.fillStyle = "#e1000f";
  fBoxCtx.fillRect(0, 0, 256, 256);
  fBoxCtx.fillStyle = "#fdb105";
  fBoxCtx.fillRect(0, 170, 256, 36);
  fBoxCtx.fillStyle = "#ffffff";
  fBoxCtx.font = "italic 900 42px Impact, sans-serif";
  fBoxCtx.textAlign = "center";
  fBoxCtx.fillText("SPEEDY", 128, 128);
  const friesBoxMap = track(finalizeTexture(fBoxC, maxAnisotropy, true, false));

  const [fryC, fryCtx] = makeCanvas(128);
  fryCtx.fillStyle = "#f2b638";
  fryCtx.fillRect(0, 0, 128, 128);
  const randFry = mulberry32(808);
  for (let i = 0; i < 160; i++) {
    fryCtx.fillStyle = randFry() > 0.4 ? "rgba(182, 108, 18, 0.25)" : "rgba(255, 232, 160, 0.3)";
    fryCtx.fillRect(randFry() * 128, randFry() * 128, 6, 12);
  }
  const fryStickMap = track(finalizeTexture(fryC, maxAnisotropy, true, false));

  const [sfryC, sfryCtx] = makeCanvas(128);
  sfryCtx.fillStyle = "#e2912b";
  sfryCtx.fillRect(0, 0, 128, 128);
  const randSFry = mulberry32(809);
  for (let i = 0; i < 240; i++) {
    const rVal = randSFry();
    sfryCtx.fillStyle =
      rVal > 0.65
        ? "rgba(165, 42, 16, 0.42)"
        : rVal > 0.3
        ? "rgba(74, 98, 28, 0.34)"
        : "rgba(255, 224, 152, 0.3)";
    sfryCtx.fillRect(randSFry() * 128, randSFry() * 128, 4, 6);
  }
  const seasonedFryStickMap = track(finalizeTexture(sfryC, maxAnisotropy, true, false));

  // Crispy Golden Fried Chicken Batter + Spices
  const chkSize = 256;
  const [chkC, chkCtx] = makeCanvas(chkSize);
  const chkImg = chkCtx.createImageData(chkSize, chkSize);
  const chkHeights = new Float32Array(chkSize * chkSize);
  for (let y = 0; y < chkSize; y++) {
    for (let x = 0; x < chkSize; x++) {
      const n1 = fbm(x * 0.055, y * 0.055, 511, 4);
      const n2 = fbm(x * 0.16, y * 0.16, 541, 3);
      const crunch = Math.pow(n1 * 0.6 + n2 * 0.4, 1.35);
      chkHeights[y * chkSize + x] = crunch;
      const pepper = n2 > 0.72 ? 1 : 0;
      const r = 198 + (crunch - 0.5) * 65 - pepper * 48;
      const g = 122 + (crunch - 0.5) * 52 - pepper * 42;
      const b = 42 + (crunch - 0.5) * 32 - pepper * 20;
      const idx = (y * chkSize + x) * 4;
      chkImg.data[idx] = clampByte(r);
      chkImg.data[idx + 1] = clampByte(g);
      chkImg.data[idx + 2] = clampByte(b);
      chkImg.data[idx + 3] = 255;
    }
  }
  chkCtx.putImageData(chkImg, 0, 0);
  const chickenMap = track(finalizeTexture(chkC, maxAnisotropy, true, true));
  const chickenNormalMap = track(
    finalizeTexture(heightBufferToNormalCanvas(chkHeights, chkSize, 4.2), maxAnisotropy, false, true)
  );

  // Sliced Bread Golden Crust
  const [sbC, sbCtx] = makeCanvas(128);
  const sbGrad = sbCtx.createLinearGradient(0, 0, 0, 128);
  sbGrad.addColorStop(0, "#9f551d");
  sbGrad.addColorStop(0.5, "#ba6c2c");
  sbGrad.addColorStop(1, "#994e18");
  sbCtx.fillStyle = sbGrad;
  sbCtx.fillRect(0, 0, 128, 128);
  const slicedBreadCrustMap = track(finalizeTexture(sbC, maxAnisotropy, true, true));

  const [cupC, cupCtx] = makeCanvas(256);
  cupCtx.fillStyle = "#fff9ef";
  cupCtx.fillRect(0, 0, 256, 256);
  cupCtx.fillStyle = "#e1000f";
  cupCtx.fillRect(0, 48, 256, 90);
  cupCtx.fillStyle = "#fdb105";
  cupCtx.fillRect(0, 138, 256, 22);
  cupCtx.fillStyle = "#ffffff";
  cupCtx.font = "italic 900 32px Impact, sans-serif";
  cupCtx.textAlign = "center";
  cupCtx.fillText("SPEEDY", 128, 106);
  const drinkCupMap = track(finalizeTexture(cupC, maxAnisotropy, true, false));

  const [shadC, shadCtx] = makeCanvas(256);
  const shadGrad = shadCtx.createRadialGradient(128, 128, 10, 128, 128, 124);
  shadGrad.addColorStop(0.0, "rgba(48, 24, 8, 0.52)");
  shadGrad.addColorStop(0.45, "rgba(62, 32, 12, 0.28)");
  shadGrad.addColorStop(0.78, "rgba(78, 42, 18, 0.08)");
  shadGrad.addColorStop(1.0, "rgba(78, 42, 18, 0)");
  shadCtx.fillStyle = shadGrad;
  shadCtx.fillRect(0, 0, 256, 256);
  const shadowMap = track(finalizeTexture(shadC, maxAnisotropy, true, false));

  const [steamC, steamCtx] = makeCanvas(256);
  const blobs = [
    [128, 136, 74, 0.20],
    [98, 114, 54, 0.14],
    [156, 108, 52, 0.14],
    [122, 82, 46, 0.11],
  ];
  for (const [bx, by, br, alpha] of blobs) {
    const g = steamCtx.createRadialGradient(bx, by, 2, bx, by, br);
    g.addColorStop(0, `rgba(255, 250, 244, ${alpha})`);
    g.addColorStop(0.55, `rgba(255, 248, 240, ${alpha * 0.45})`);
    g.addColorStop(1, "rgba(255, 248, 240, 0)");
    steamCtx.fillStyle = g;
    steamCtx.beginPath();
    steamCtx.arc(bx, by, br, 0, Math.PI * 2);
    steamCtx.fill();
  }
  const steamMap = track(finalizeTexture(steamC, maxAnisotropy, true, false));

  return {
    bunTopMap,
    bunBottomMap,
    bunCrumbMap,
    bunNormalMap,
    bunCrumbNormalMap,
    pattyMap,
    pattyNormalMap,
    pattyRoughnessMap,
    cheeseMap,
    cheeseNormalMap,
    baconMap,
    baconNormalMap,
    baconRoughnessMap,
    baconAlphaMap,
    tomatoMap,
    tomatoNormalMap,
    pickleMap,
    pickleNormalMap,
    onionMap,
    onionNormalMap,
    lettuceMap,
    lettuceNormalMap,
    lettuceAlphaMap,
    friesBoxMap,
    fryStickMap,
    seasonedFryStickMap,
    chickenMap,
    chickenNormalMap,
    slicedBreadCrustMap,
    drinkCupMap,
    shadowMap,
    steamMap,
    dispose: () => {
      allTextures.forEach((t) => t.dispose());
    },
  };
}
