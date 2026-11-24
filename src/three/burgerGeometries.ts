import * as THREE from "three";
import { BurgerTextureSet } from "./proceduralTextures";

function hash3(x: number, y: number, z: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function fbm3D(x: number, y: number, z: number): number {
  return (
    Math.sin(x * 3.1 + y * 4.3 + z * 2.7) * 0.42 +
    Math.cos(x * 7.3 - y * 6.1 + z * 8.2) * 0.28 +
    Math.sin(x * 13.7 + z * 11.4 - y * 9.1) * 0.18 +
    Math.cos(x * 23.1 - z * 19.7 + y * 15.3) * 0.12
  );
}

function createSesameSeedGeometry(): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [];
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = (t - 0.5) * 0.115;
    const r = Math.sin(Math.pow(t, 0.72) * Math.PI) * 0.032;
    pts.push(new THREE.Vector2(Math.max(0.0005, r), y));
  }
  const geo = new THREE.LatheGeometry(pts, 10);
  geo.scale(1.0, 1.0, 0.48);
  geo.rotateX(Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

export function createBottomBun(
  tex: BurgerTextureSet,
  withSeeds = true
): THREE.Group {
  const group = new THREE.Group();
  group.name = withSeeds ? "Bottom Brioche Bun" : "Original Bottom Bun";

  // Plump golden-brown brioche bottom bun (height 0.52)
  const profile: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(1.02, 0.0),
    new THREE.Vector2(1.26, 0.04),
    new THREE.Vector2(1.39, 0.12),
    new THREE.Vector2(1.45, 0.26),
    new THREE.Vector2(1.43, 0.42),
    new THREE.Vector2(1.39, 0.51),
    new THREE.Vector2(1.35, 0.52),
  ];
  const crustGeo = new THREE.LatheGeometry(profile, 64);
  crustGeo.computeVertexNormals();

  const crustMat = new THREE.MeshPhysicalMaterial({
    map: tex.bunBottomMap,
    normalMap: tex.bunNormalMap,
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughness: 0.48,
    metalness: 0.0,
    clearcoat: 0.22,
    clearcoatRoughness: 0.42,
  });

  const crustMesh = new THREE.Mesh(crustGeo, crustMat);
  crustMesh.castShadow = true;
  crustMesh.receiveShadow = true;
  group.add(crustMesh);

  // Toasted crumb cut interior
  const crumbGeo = new THREE.CircleGeometry(1.36, 64);
  crumbGeo.rotateX(-Math.PI / 2);
  const crumbMat = new THREE.MeshStandardMaterial({
    map: tex.bunCrumbMap,
    normalMap: tex.bunCrumbNormalMap,
    normalScale: new THREE.Vector2(1.1, 1.1),
    roughness: 0.88,
    metalness: 0.0,
  });
  const crumbMesh = new THREE.Mesh(crumbGeo, crumbMat);
  crumbMesh.position.y = 0.522;
  crumbMesh.receiveShadow = true;
  group.add(crumbMesh);

  if (withSeeds) {
    // Subtle scattered sesame seeds along bottom rim
    const seedGeo = createSesameSeedGeometry();
    const seedMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.0,
    });
    const seedCount = 12;
    const seeds = new THREE.InstancedMesh(seedGeo, seedMat, seedCount);
    const dummy = new THREE.Object3D();
    const pos = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const up = new THREE.Vector3(0, 0, 1);
    const tint = new THREE.Color();

    for (let i = 0; i < seedCount; i++) {
      const theta = (i / seedCount) * Math.PI * 2 + hash3(i, 2, 1) * 0.25;
      const y = 0.16 + hash3(i, 3, 2) * 0.16;
      const r = 1.435;
      pos.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
      normal.set(Math.cos(theta), -0.1, Math.sin(theta)).normalize();
      dummy.position.copy(pos);
      dummy.quaternion.setFromUnitVectors(up, normal);
      dummy.rotateZ(hash3(i, 4, 5) * Math.PI);
      dummy.scale.setScalar(0.75 + hash3(i, 6, 7) * 0.28);
      dummy.updateMatrix();
      seeds.setMatrixAt(i, dummy.matrix);
      tint.setHSL(0.1, 0.35 + hash3(i, 8, 9) * 0.2, 0.88 + hash3(i, 1, 5) * 0.08);
      seeds.setColorAt(i, tint);
    }
    seeds.instanceMatrix.needsUpdate = true;
    if (seeds.instanceColor) seeds.instanceColor.needsUpdate = true;
    seeds.computeBoundingSphere();
    group.add(seeds);
  }

  return group;
}

export function createTopBun(tex: BurgerTextureSet, withSeeds = true): THREE.Group {
  const group = new THREE.Group();
  group.name = withSeeds ? "Top Brioche Sesame Bun" : "Original Top Bun";

  // Soft pillowy brioche dome profile (height 1.02)
  const profile: THREE.Vector2[] = [];
  const domeSteps = 24;
  for (let i = 0; i <= domeSteps; i++) {
    const t = i / domeSteps;
    if (i === 0) {
      profile.push(new THREE.Vector2(1.42, 0.02));
    } else {
      const ang = t * (Math.PI / 2);
      const r = Math.cos(ang) * 1.49;
      const y = Math.pow(Math.sin(ang), 0.78) * 1.0 + 0.02;
      profile.push(new THREE.Vector2(Math.max(0.0, r), y));
    }
  }
  const ordered = [...profile].reverse();
  const domeGeo = new THREE.LatheGeometry(ordered, 64);
  domeGeo.computeVertexNormals();

  const domeMat = new THREE.MeshPhysicalMaterial({
    map: tex.bunTopMap,
    normalMap: tex.bunNormalMap,
    normalScale: new THREE.Vector2(0.45, 0.45),
    roughness: 0.32,
    metalness: 0.0,
    clearcoat: 0.42,
    clearcoatRoughness: 0.26,
  });
  const domeMesh = new THREE.Mesh(domeGeo, domeMat);
  domeMesh.castShadow = true;
  domeMesh.receiveShadow = true;
  group.add(domeMesh);

  // Lightly toasted underside crumb
  const crumbGeo = new THREE.CircleGeometry(1.42, 64);
  crumbGeo.rotateX(Math.PI / 2);
  const crumbMat = new THREE.MeshStandardMaterial({
    map: tex.bunCrumbMap,
    normalMap: tex.bunCrumbNormalMap,
    normalScale: new THREE.Vector2(1.15, 1.15),
    roughness: 0.88,
  });
  const crumbMesh = new THREE.Mesh(crumbGeo, crumbMat);
  crumbMesh.position.y = 0.02;
  crumbMesh.receiveShadow = true;
  group.add(crumbMesh);

  if (withSeeds) {
    // Natural white-to-cream sesame seeds sprinkled generously across dome
    const seedGeo = createSesameSeedGeometry();
    const seedMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.45,
      metalness: 0.0,
    });
    const count = 115;
    const seeds = new THREE.InstancedMesh(seedGeo, seedMat, count);
    const dummy = new THREE.Object3D();
    const pos = new THREE.Vector3();
    const norm = new THREE.Vector3();
    const zAxis = new THREE.Vector3(0, 0, 1);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const tint = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const frac = (i + 0.5) / count;
      const phi = Math.acos(1 - frac * 0.74) + (hash3(i, 9, 1) - 0.5) * 0.07;
      const theta = i * goldenAngle + (hash3(i, 1, 2) - 0.5) * 0.38;

      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const rx = 1.485 * sinPhi;
      const ry = 1.0 * Math.pow(Math.max(0.01, cosPhi), 0.78) + 0.02;

      pos.set(Math.cos(theta) * rx, ry, Math.sin(theta) * rx);
      norm
        .set(Math.cos(theta) * sinPhi, cosPhi * 1.28, Math.sin(theta) * sinPhi)
        .normalize();

      dummy.position.copy(pos).addScaledVector(norm, 0.006);
      dummy.quaternion.setFromUnitVectors(zAxis, norm);
      dummy.rotateZ(hash3(i, 3, 4) * Math.PI * 2);
      const s = 0.78 + hash3(i, 5, 6) * 0.38;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      seeds.setMatrixAt(i, dummy.matrix);

      // Subtle organic variation between crisp white and toasted cream seeds
      tint.setHSL(0.1, 0.25 + hash3(i, 7, 8) * 0.28, 0.90 + hash3(i, 2, 7) * 0.08);
      seeds.setColorAt(i, tint);
    }
    seeds.instanceMatrix.needsUpdate = true;
    if (seeds.instanceColor) seeds.instanceColor.needsUpdate = true;
    seeds.computeBoundingSphere();
    seeds.castShadow = true;
    group.add(seeds);
  }

  return group;
}

export function createSlicedBread(tex: BurgerTextureSet, isTop: boolean): THREE.Group {
  const group = new THREE.Group();
  group.name = isTop ? "Top Toasted Sliced Bread" : "Bottom Toasted Sliced Bread";

  const shape = new THREE.Shape();
  const w = 1.38;
  const d = 1.32;
  const r = 0.22;
  shape.moveTo(-w + r, -d);
  shape.lineTo(w - r, -d);
  shape.quadraticCurveTo(w, -d, w, -d + r);
  shape.lineTo(w, d - r);
  shape.quadraticCurveTo(w, d, w - r, d);
  shape.lineTo(-w + r, d);
  shape.quadraticCurveTo(-w, d, -w, d - r);
  shape.lineTo(-w, -d + r);
  shape.quadraticCurveTo(-w, -d, -w + r, -d);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.03,
    bevelSegments: 3,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0.04, 0);
  geo.computeVertexNormals();

  const crumbMat = new THREE.MeshStandardMaterial({
    map: tex.bunCrumbMap,
    normalMap: tex.bunCrumbNormalMap,
    normalScale: new THREE.Vector2(1.1, 1.1),
    roughness: 0.86,
  });
  const crustMat = new THREE.MeshStandardMaterial({
    map: tex.slicedBreadCrustMap,
    normalMap: tex.bunNormalMap,
    normalScale: new THREE.Vector2(0.5, 0.5),
    roughness: 0.7,
  });
  const mesh = new THREE.Mesh(geo, [crumbMat, crustMat]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return group;
}

export function createLettuceWrapBun(tex: BurgerTextureSet, isTop: boolean): THREE.Group {
  const group = createLettuceLayer(tex);
  group.name = isTop ? "Top Lettuce Wrap" : "Bottom Lettuce Wrap";
  if (isTop) {
    group.rotation.x = Math.PI;
    group.position.y = 0.42;
  } else {
    group.position.y = 0.04;
  }
  return group;
}

export function createLettuceLayer(tex: BurgerTextureSet): THREE.Group {
  const group = new THREE.Group();
  group.name = "Crisp Curly Lettuce";

  const lettuceMat = new THREE.MeshPhysicalMaterial({
    map: tex.lettuceMap,
    normalMap: tex.lettuceNormalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    alphaMap: tex.lettuceAlphaMap,
    alphaTest: 0.45,
    roughness: 0.34,
    metalness: 0.0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.32,
    sheen: 0.35,
    sheenColor: new THREE.Color(0xc2f27a),
    side: THREE.DoubleSide,
  });

  // Central ruffled leaf crown
  const mainGeo = new THREE.CircleGeometry(1.78, 120);
  mainGeo.rotateX(-Math.PI / 2);
  const pos = mainGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    const a = Math.atan2(z, x);
    const ef = Math.pow(THREE.MathUtils.clamp((r - 0.25) / 1.5, 0, 1), 1.25);

    const ruffle =
      Math.sin(a * 11 + 0.4) * 0.14 +
      Math.cos(a * 23 - 1.1) * 0.09 +
      Math.sin(a * 37) * 0.045;
    const cup = Math.pow(r / 1.78, 2) * 0.11;
    pos.setY(i, 0.12 + cup + ruffle * ef);
  }
  mainGeo.computeVertexNormals();
  const mainMesh = new THREE.Mesh(mainGeo, lettuceMat);
  mainMesh.castShadow = true;
  mainMesh.receiveShadow = true;
  group.add(mainMesh);

  // 7 Overlapping ruffled outer leaf petals for crisp 3D curls
  for (let l = 0; l < 7; l++) {
    const leafGeo = new THREE.PlaneGeometry(1.85, 1.85, 28, 28);
    leafGeo.rotateX(-Math.PI / 2);
    const lPos = leafGeo.attributes.position;
    for (let i = 0; i < lPos.count; i++) {
      const x = lPos.getX(i);
      const z = lPos.getZ(i);
      const r = Math.hypot(x, z);
      const a = Math.atan2(z, x);
      const ef = Math.pow(THREE.MathUtils.clamp(r / 0.9, 0, 1), 1.3);
      const wave =
        Math.sin(a * 9 + l * 1.9) * 0.11 +
        Math.cos(a * 19 - l) * 0.06;
      lPos.setY(i, 0.04 + wave * ef + ef * 0.05);
    }
    leafGeo.computeVertexNormals();
    const leaf = new THREE.Mesh(leafGeo, lettuceMat);
    const angle = (l / 7) * Math.PI * 2 + 0.25;
    leaf.position.set(
      Math.cos(angle) * 0.72,
      0.04 + (l % 2) * 0.06,
      Math.sin(angle) * 0.72
    );
    leaf.rotation.set(
      Math.sin(angle) * 0.12,
      -angle,
      Math.cos(angle) * 0.12
    );
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    group.add(leaf);
  }

  return group;
}

export function createOnionLayer(tex: BurgerTextureSet): THREE.Group {
  const group = new THREE.Group();
  group.name = "Purple-Red Onion Rings";

  const onionMat = new THREE.MeshPhysicalMaterial({
    map: tex.onionMap,
    normalMap: tex.onionNormalMap,
    normalScale: new THREE.Vector2(0.4, 0.4),
    roughness: 0.22,
    metalness: 0.0,
    clearcoat: 0.62,
    clearcoatRoughness: 0.18,
  });

  // Flat-cut annular onion ring via ExtrudeGeometry (realistic sliced cross-section, not a fat torus)
  const makeSliceRing = (outerR: number, thickness: number, height: number) => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerR, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, outerR - thickness, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 2,
      curveSegments: 64,
    });
    geo.rotateX(-Math.PI / 2);
    // Normalize UVs so outer wall shows purple skin and faces show crisp white rings
    const uv = geo.attributes.uv;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      const pz = pos.getZ(i);
      const ang = (Math.atan2(pz, px) + Math.PI) / (Math.PI * 2);
      const r = Math.hypot(px, pz);
      const v = THREE.MathUtils.clamp(
        0.5 + (py / height - 0.5) * 0.25 + (r > outerR - 0.012 ? 0.42 : 0),
        0.02,
        0.98
      );
      uv.setXY(i, ang * 2, v);
    }
    uv.needsUpdate = true;
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, onionMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const r1 = makeSliceRing(1.06, 0.075, 0.075);
  r1.position.set(-0.28, 0.06, 0.10);
  r1.rotation.set(0.05, 0.1, -0.04);
  group.add(r1);

  const r2 = makeSliceRing(0.94, 0.07, 0.075);
  r2.position.set(0.30, 0.14, -0.10);
  r2.rotation.set(-0.06, -0.2, 0.06);
  group.add(r2);

  return group;
}

export function createPicklesLayer(tex: BurgerTextureSet): THREE.Group {
  const group = new THREE.Group();
  group.name = "Three Glossy Pickle Slices";

  const faceMat = new THREE.MeshPhysicalMaterial({
    map: tex.pickleMap,
    normalMap: tex.pickleNormalMap,
    normalScale: new THREE.Vector2(1.1, 1.1),
    roughness: 0.18,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  });
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: 0x3b5c0e,
    normalMap: tex.pickleNormalMap,
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughness: 0.28,
    clearcoat: 0.65,
  });

  const makePickle = () => {
    const geo = new THREE.CylinderGeometry(0.56, 0.56, 0.135, 44, 2, false);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const crinkle = Math.sin(x * 24.0) * 0.017;
      const organic = 1 + Math.sin(Math.atan2(z, x) * 5) * 0.04;
      pos.setXYZ(i, x * organic, y + crinkle, z * organic);
    }
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, [skinMat, faceMat, faceMat]);
  };

  // Three horizontal pickle slices arranged across front arc like the photo
  const placements: Array<{ pos: [number, number, number]; rot: [number, number, number] }> = [
    { pos: [-0.88, 0.09, 0.22], rot: [0.05, 0.4, -0.05] },
    { pos: [0.05, 0.11, 0.44], rot: [0.14, 0.1, 0.06] },
    { pos: [0.88, 0.10, 0.12], rot: [-0.04, -0.6, 0.05] },
  ];

  for (const p of placements) {
    const m = makePickle();
    m.position.set(...p.pos);
    m.rotation.set(...p.rot);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  }

  return group;
}

export function createTomatoLayer(tex: BurgerTextureSet): THREE.Group {
  const group = new THREE.Group();
  group.name = "Two Fresh Tomato Slices";

  const fleshMat = new THREE.MeshPhysicalMaterial({
    map: tex.tomatoMap,
    normalMap: tex.tomatoNormalMap,
    normalScale: new THREE.Vector2(0.9, 0.9),
    roughness: 0.14,
    metalness: 0.0,
    clearcoat: 0.96,
    clearcoatRoughness: 0.07,
  });
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: 0xb0150b,
    roughness: 0.18,
    clearcoat: 0.88,
    clearcoatRoughness: 0.1,
  });

  const makeSlice = () => {
    const geo = new THREE.CylinderGeometry(1.02, 1.00, 0.20, 56, 1, false);
    const mesh = new THREE.Mesh(geo, [skinMat, fleshMat, fleshMat]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const s1 = makeSlice();
  s1.position.set(-0.42, 0.09, 0.14);
  s1.rotation.set(0.05, 0.3, -0.05);
  group.add(s1);

  const s2 = makeSlice();
  s2.position.set(0.42, 0.21, -0.14);
  s2.rotation.set(-0.04, -0.5, 0.06);
  group.add(s2);

  return group;
}

export function createBeefPatty(tex: BurgerTextureSet): THREE.Group {
  const group = new THREE.Group();
  group.name = "Grilled Beef Patty";

  // Squashed high-resolution sphere gives concentric vertex rings across top, bottom & craggy sides
  const geo = new THREE.SphereGeometry(1.0, 128, 44);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Flatten sphere into thick cylindrical patty silhouette with softly rounded edges
    const flatY = Math.sign(y) * Math.pow(Math.abs(y), 0.42) * 0.27;
    const radialExpand = 1.46 * (1 - 0.08 * Math.pow(Math.abs(y), 4));

    const px = x * radialExpand;
    const pz = z * radialExpand;

    // Multi-octave organic ground-beef lumpiness & crispy irregular edges
    const lump = fbm3D(px * 1.6, flatY * 3.5, pz * 1.6);
    const coarse = Math.sin(Math.atan2(pz, px) * 7 + flatY * 5) * 0.035;
    const edgeFactor = Math.hypot(x, z);

    const dispR = 1 + (lump * 0.055 + coarse) * edgeFactor;
    const dispY = lump * 0.032 * (0.4 + Math.abs(y) * 0.6);

    pos.setXYZ(i, px * dispR, flatY + dispY + 0.28, pz * dispR);
  }
  geo.computeVertexNormals();

  const pattyMat = new THREE.MeshStandardMaterial({
    map: tex.pattyMap,
    normalMap: tex.pattyNormalMap,
    normalScale: new THREE.Vector2(1.45, 1.45),
    roughnessMap: tex.pattyRoughnessMap,
    roughness: 0.78,
    metalness: 0.02,
  });

  const mesh = new THREE.Mesh(geo, pattyMat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  return group;
}

export function createCrispyChicken(tex: BurgerTextureSet): THREE.Group {
  const group = new THREE.Group();
  group.name = "Crispy Fried Chicken Fillet";

  const geo = new THREE.SphereGeometry(1.0, 96, 36);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const flatY = Math.sign(y) * Math.pow(Math.abs(y), 0.45) * 0.24;
    const taperX = 1.54 * (1 + Math.sin(z * 1.8) * 0.08);
    const taperZ = 1.28 * (1 - x * 0.14);
    const crunch = fbm3D(x * 3.8, y * 4.5, z * 3.8) * 0.095;
    pos.setXYZ(i, x * taperX + crunch * 0.6, flatY + crunch * 0.55 + 0.26, z * taperZ + crunch * 0.6);
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    map: tex.chickenMap,
    normalMap: tex.chickenNormalMap,
    normalScale: new THREE.Vector2(1.5, 1.5),
    roughness: 0.72,
    metalness: 0.0,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return group;
}

export function createNuggetsLayer(tex: BurgerTextureSet): THREE.Group {
  const group = new THREE.Group();
  group.name = "Crispy Chicken Nuggets (3 Pieces)";

  const mat = new THREE.MeshStandardMaterial({
    map: tex.chickenMap,
    normalMap: tex.chickenNormalMap,
    normalScale: new THREE.Vector2(1.35, 1.35),
    roughness: 0.68,
    metalness: 0.0,
  });

  const makeNugget = (seed: number) => {
    const geo = new THREE.SphereGeometry(0.46, 40, 24);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const bump = fbm3D(x * 4 + seed, y * 4, z * 4 - seed) * 0.065;
      pos.setXYZ(i, x * 1.28 + bump, y * 0.58 + bump * 0.5, z * 0.96 + bump);
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const placements: Array<{ pos: [number, number, number]; rot: [number, number, number]; seed: number }> = [
    { pos: [-0.68, 0.22, 0.34], rot: [0.05, 0.35, -0.04], seed: 1.2 },
    { pos: [0.68, 0.24, 0.26], rot: [-0.04, -0.45, 0.05], seed: 3.7 },
    { pos: [0.02, 0.23, -0.56], rot: [0.04, 0.15, 0.02], seed: 5.9 },
  ];

  for (const p of placements) {
    const n = makeNugget(p.seed);
    n.position.set(...p.pos);
    n.rotation.set(...p.rot);
    group.add(n);
  }
  return group;
}

const CHEESE_TINTS: Record<string, { color: number; label: string }> = {
  american_cheese: { color: 0xffc034, label: "Melted American Cheese" },
  cheddar: { color: 0xf7a219, label: "Melted Aged Cheddar" },
  mild_cheddar: { color: 0xffcb52, label: "Melted Mild Cheddar" },
  pepper_jack: { color: 0xf4ecd4, label: "Melted Pepper Jack Cheese" },
  havarti: { color: 0xf7e7b8, label: "Melted Havarti Cheese" },
  gouda: { color: 0xf0ab42, label: "Melted Gouda Cheese" },
  colby_jack: { color: 0xf7c962, label: "Melted Colby & Monterey Jack" },
};

export function createMeltingCheese(
  tex: BurgerTextureSet,
  cheeseId = "american_cheese"
): THREE.Group {
  const cfg = CHEESE_TINTS[cheeseId] ?? CHEESE_TINTS.american_cheese;
  const group = new THREE.Group();
  group.name = cfg.label;

  // Seamless single-manifold melted cheddar blanket + thick rounded hanging drips!
  const geo = new THREE.SphereGeometry(1.0, 160, 48);
  const pos = geo.attributes.position;

  // Drip lobe angles & lengths matching the photo's dramatic front/side cheese drips
  const drips = [
    { angle: 1.98, width: 0.24, len: 0.74 },
    { angle: 1.42, width: 0.20, len: 0.56 },
    { angle: 0.92, width: 0.23, len: 0.66 },
    { angle: 0.34, width: 0.22, len: 0.44 },
    { angle: 2.75, width: 0.24, len: 0.48 },
    { angle: -0.95, width: 0.25, len: 0.48 },
    { angle: -2.25, width: 0.24, len: 0.46 },
  ];

  function getDripDepth(theta: number): number {
    let d = 0.15 + 0.06 * Math.sin(theta * 4 + 0.6); // base scalloped curtain
    for (const lobe of drips) {
      let diff = Math.atan2(Math.sin(theta - lobe.angle), Math.cos(theta - lobe.angle));
      const g = Math.exp(-(diff * diff) / (2 * lobe.width * lobe.width));
      d += lobe.len * g;
    }
    return d;
  }

  for (let i = 0; i < pos.count; i++) {
    const ux = pos.getX(i);
    const uy = pos.getY(i);
    const uz = pos.getZ(i);
    const theta = Math.atan2(uz, ux);
    const rHoriz = Math.hypot(ux, uz);

    // Soft rounded-square cheddar silhouette
    const squircle = 1 + 0.075 * Math.cos(theta * 4 - 0.9);
    const baseR = 1.44 * squircle;

    if (uy >= 0) {
      // Upper surface: smooth gently arched melted cap
      const px = ux * baseR;
      const pz = uz * baseR;
      const dome = Math.pow(uy, 0.55) * 0.16;
      const subtleFold = Math.sin(px * 2.4 + pz * 1.9) * 0.015 * rHoriz;
      pos.setXYZ(i, px, 0.26 + dome + subtleFold, pz);
    } else {
      // Lower skirt + thick bulbous drips
      const t = Math.min(1, -uy); // 0 = rim shoulder, 1 = bottom tip
      const dripDepth = getDripDepth(theta);

      // Keep drips hugging near the rim (r ≈ 0.92..1.04) and tapering cleanly to bulbous droplets
      const neckPinch = 1 - Math.sin(t * Math.PI) * 0.045;
      const tipClose = t > 0.85 ? 1 - Math.pow((t - 0.85) / 0.15, 2) * 0.06 : 1;
      const radialFactor = Math.max(0.001, rHoriz) < 0.001 ? 0 : neckPinch * tipClose;

      const px = ux * baseR * radialFactor;
      const pz = uz * baseR * radialFactor;

      // Smooth vertical falloff along the curtain & drips
      const dropY = Math.sin(t * Math.PI * 0.5) * dripDepth;
      // Tuck center underside up so it doesn't bulge underneath like a ball
      const edgeWeight = Math.pow(THREE.MathUtils.clamp(rHoriz, 0, 1), 1.8);
      const py = 0.26 - dropY * edgeWeight - (1 - edgeWeight) * 0.05;

      pos.setXYZ(i, px, py, pz);
    }
  }
  geo.computeVertexNormals();

  const useYellowTexture =
    cheeseId === "american_cheese" || cheeseId === "cheddar" || cheeseId === "mild_cheddar";

  const cheeseMat = new THREE.MeshPhysicalMaterial({
    map: useYellowTexture ? tex.cheeseMap : null,
    normalMap: tex.cheeseNormalMap,
    normalScale: new THREE.Vector2(0.3, 0.3),
    color: cfg.color,
    roughness: 0.22,
    metalness: 0.0,
    clearcoat: 0.78,
    clearcoatRoughness: 0.15,
    sheen: 0.25,
    sheenColor: new THREE.Color(0xffe082),
  });

  const mesh = new THREE.Mesh(geo, cheeseMat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  return group;
}

export function createCaramelizedOnionsLayer(): THREE.Group {
  const group = new THREE.Group();
  group.name = "Caramelized Onions";

  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x73320e,
    roughness: 0.22,
    clearcoat: 0.72,
    clearcoatRoughness: 0.16,
  });

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const pts: THREE.Vector3[] = [];
    for (let s = 0; s <= 16; s++) {
      const t = s / 16;
      const ang = a + (t - 0.5) * 1.45;
      const rad = 0.65 + Math.sin(t * Math.PI * 2 + i) * 0.34;
      pts.push(
        new THREE.Vector3(
          Math.cos(ang) * rad,
          0.07 + Math.sin(t * Math.PI * 3 + i) * 0.035,
          Math.sin(ang) * rad
        )
      );
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.TubeGeometry(curve, 24, 0.045, 8, false);
    const mesh = new THREE.Mesh(tube, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}

export function createScotchBonnetLayer(): THREE.Group {
  const group = new THREE.Group();
  group.name = "Scotch Bonnet Pepper Rings";

  const redMat = new THREE.MeshPhysicalMaterial({
    color: 0xe63612,
    roughness: 0.18,
    clearcoat: 0.85,
  });
  const amberMat = new THREE.MeshPhysicalMaterial({
    color: 0xf48c14,
    roughness: 0.18,
    clearcoat: 0.85,
  });

  const placements: Array<{ pos: [number, number, number]; rot: [number, number, number]; mat: THREE.Material }> = [
    { pos: [-0.56, 0.08, 0.25], rot: [0.06, 0.2, -0.05], mat: redMat },
    { pos: [0.48, 0.10, 0.36], rot: [-0.05, -0.4, 0.06], mat: amberMat },
    { pos: [0.04, 0.09, -0.42], rot: [0.04, 0.7, 0.04], mat: redMat },
  ];

  for (const p of placements) {
    const geo = new THREE.TorusGeometry(0.28, 0.065, 14, 28);
    geo.rotateX(Math.PI / 2);
    const ring = new THREE.Mesh(geo, p.mat);
    ring.position.set(...p.pos);
    ring.rotation.set(...p.rot);
    ring.castShadow = true;
    ring.receiveShadow = true;
    group.add(ring);
  }
  return group;
}

const SAUCE_STYLES: Record<string, { color: number; label: string }> = {
  signature: { color: 0xe27e30, label: "Speedy Signature Sauce" },
  sweet_chilli: { color: 0xc22514, label: "Sweet Chilli Sauce" },
  ranch: { color: 0xf2ede0, label: "Creamy Ranch" },
  tangy_bbq: { color: 0x52190c, label: "Tangy BBQ Sauce" },
  ketchup: { color: 0xc41410, label: "Tomato Ketchup" },
  mustard: { color: 0xdca512, label: "Yellow Mustard" },
  mayo: { color: 0xf9f3df, label: "Creamy Mayo" },
  bbq: { color: 0x421208, label: "Smoky BBQ Sauce" },
};

export function createSauceLayer(sauceId: string): THREE.Group {
  const cfg = SAUCE_STYLES[sauceId] ?? SAUCE_STYLES.signature;
  const group = new THREE.Group();
  group.name = cfg.label;

  const pts: THREE.Vector3[] = [];
  const turns = 2.6;
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ang = t * Math.PI * 2 * turns;
    const r = 0.18 + t * 1.02 + Math.sin(ang * 2) * 0.06;
    pts.push(new THREE.Vector3(Math.cos(ang) * r, 0.075, Math.sin(ang) * r));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const tubeGeo = new THREE.TubeGeometry(curve, 84, 0.065, 10, false);
  tubeGeo.scale(1, 0.55, 1);
  tubeGeo.computeVertexNormals();

  const mat = new THREE.MeshPhysicalMaterial({
    color: cfg.color,
    roughness: 0.12,
    clearcoat: 0.92,
    clearcoatRoughness: 0.08,
  });
  const mesh = new THREE.Mesh(tubeGeo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return group;
}

export function createBaconLayer(tex: BurgerTextureSet): THREE.Group {
  const group = new THREE.Group();
  group.name = "Crispy Smoky Bacon (2 Strips)";

  const baconMat = new THREE.MeshPhysicalMaterial({
    map: tex.baconMap,
    normalMap: tex.baconNormalMap,
    normalScale: new THREE.Vector2(1.25, 1.25),
    roughnessMap: tex.baconRoughnessMap,
    roughness: 0.36,
    metalness: 0.0,
    clearcoat: 0.58,
    clearcoatRoughness: 0.18,
  });

  // Sculpt real 3D jagged wavy edges into BoxGeometry (no alpha holes on sides)
  const makeStrip = (seedOffset: number) => {
    const geo = new THREE.BoxGeometry(2.86, 0.046, 0.66, 72, 2, 12);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      const nx = x / 1.43; // -1..1
      const nz = z / 0.33; // -1..1

      // Natural jagged crispy edge outline
      const jaggedZ =
        1 +
        Math.sin(x * 7.2 + seedOffset) * 0.12 +
        Math.cos(x * 15.1 - seedOffset) * 0.06;
      const endTaper = 1 - Math.pow(Math.abs(nx), 4) * 0.25;

      // Flowing smoky fried bacon curl along X and twist across Z
      const waveY =
        Math.sin(x * 3.1 + seedOffset) * 0.095 +
        Math.cos(x * 6.8 - seedOffset * 1.3) * 0.038;
      const waveZ = Math.sin(x * 2.1 + seedOffset * 1.4) * 0.11;
      const edgeCurl =
        Math.pow(Math.abs(nz), 2) * 0.032 * Math.sin(x * 4.8 + seedOffset);

      pos.setXYZ(
        i,
        x,
        y + waveY + edgeCurl + 0.06,
        z * jaggedZ * endTaper + waveZ
      );
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, baconMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  // Stacked vertically one above the other, matching the photo composition!
  const stripBottom = makeStrip(0.5);
  stripBottom.position.set(-0.04, 0.0, 0.14);
  stripBottom.rotation.set(0.06, 0.12, -0.02);
  group.add(stripBottom);

  const stripTop = makeStrip(2.6);
  stripTop.position.set(0.05, 0.25, -0.14);
  stripTop.rotation.set(-0.04, -0.16, 0.02);
  group.add(stripTop);

  return group;
}

export function createFriesSide(tex: BurgerTextureSet, seasoned = false): THREE.Group {
  const group = new THREE.Group();
  group.name = seasoned ? "Seasoned Fries" : "Speedy Fries";

  const boxGeo = new THREE.CylinderGeometry(0.68, 0.48, 1.35, 4, 1);
  boxGeo.rotateY(Math.PI / 4);
  boxGeo.scale(1.15, 1.0, 0.65);
  const boxMat = new THREE.MeshStandardMaterial({
    map: tex.friesBoxMap,
    roughness: 0.55,
  });
  const boxMesh = new THREE.Mesh(boxGeo, boxMat);
  boxMesh.position.y = 0.675;
  boxMesh.castShadow = true;
  boxMesh.receiveShadow = true;
  group.add(boxMesh);

  const fryGeo = new THREE.BoxGeometry(0.11, 0.92, 0.11);
  const fryMat = new THREE.MeshStandardMaterial({
    map: seasoned ? tex.seasonedFryStickMap : tex.fryStickMap,
    roughness: 0.65,
  });
  const count = 18;
  const fries = new THREE.InstancedMesh(fryGeo, fryMat, count);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const col = i % 6;
    const row = Math.floor(i / 6);
    dummy.position.set(
      (col - 2.5) * 0.16 + (row - 1) * 0.04,
      1.32 + (i % 3) * 0.11,
      (row - 1) * 0.15
    );
    dummy.rotation.set((row - 1) * 0.15, (i * 0.5) % 1, (col - 2.5) * -0.08);
    dummy.scale.set(1, 0.85 + (i % 4) * 0.12, 1);
    dummy.updateMatrix();
    fries.setMatrixAt(i, dummy.matrix);
  }
  fries.instanceMatrix.needsUpdate = true;
  fries.computeBoundingSphere();
  fries.castShadow = true;
  group.add(fries);

  return group;
}

export function createDrinkSide(tex: BurgerTextureSet): THREE.Group {
  const group = new THREE.Group();
  group.name = "Speedy Drink";

  const cupGeo = new THREE.CylinderGeometry(0.62, 0.44, 1.75, 32);
  const cupMat = new THREE.MeshStandardMaterial({
    map: tex.drinkCupMap,
    roughness: 0.45,
  });
  const cup = new THREE.Mesh(cupGeo, cupMat);
  cup.position.y = 0.875;
  cup.castShadow = true;
  cup.receiveShadow = true;
  group.add(cup);

  const lidGeo = new THREE.CylinderGeometry(0.66, 0.65, 0.1, 32);
  const lidMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.25,
    clearcoat: 0.4,
  });
  const lid = new THREE.Mesh(lidGeo, lidMat);
  lid.position.y = 1.77;
  lid.castShadow = true;
  group.add(lid);

  const strawGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.85, 16);
  const strawMat = new THREE.MeshStandardMaterial({
    color: 0xe1000f,
    roughness: 0.3,
  });
  const straw = new THREE.Mesh(strawGeo, strawMat);
  straw.position.set(0.08, 2.15, 0);
  straw.rotation.z = -0.14;
  straw.castShadow = true;
  group.add(straw);

  return group;
}
