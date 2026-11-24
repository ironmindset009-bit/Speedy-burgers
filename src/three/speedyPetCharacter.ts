import * as THREE from 'three';
import {
  getLevelProgress,
  PetSpecies,
  SpeedyPetConfig,
} from '../data/speedyPetCatalog';
import {
  createLegoFaceTexture,
  createLegoTorsoTexture,
} from './legoCharacterTextures';

export type PetAnimMode =
  | 'idle'
  | 'eat'
  | 'talk'
  | 'head_pat'
  | 'belly_rub'
  | 'feet_hop'
  | 'evolve'
  | 'fainted';

export interface PetAnimState {
  mode: PetAnimMode;
  timer: number;
  duration: number;
  fullness: number;
}

export interface SpeedyPetRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  jawGroup: THREE.Group;
  leftEarGroup: THREE.Group;
  rightEarGroup: THREE.Group;
  tailGroup: THREE.Group;
  leftEyeGroup: THREE.Group;
  rightEyeGroup: THREE.Group;
  leftEyelid: THREE.Mesh;
  rightEyelid: THREE.Mesh;
  leftArmPivot: THREE.Group;
  rightArmPivot: THREE.Group;
  leftLegPivot: THREE.Group;
  rightLegPivot: THREE.Group;
  foodGroup: THREE.Group;
  haloMesh: THREE.Mesh;
  ponytailGroup?: THREE.Group;
  mouthY: number;
  disposables: {
    geometries: THREE.BufferGeometry[];
    materials: THREE.Material[];
    textures: THREE.Texture[];
  };
}

function tagZone(obj: THREE.Object3D, zone: 'head' | 'belly' | 'feet') {
  obj.traverse((child) => {
    child.userData.petZone = zone;
  });
}

interface CharacterPalette {
  skinHex: string;
  torsoHex: string;
  armHex: string;
  handHex: string;
  legHex: string;
  bootHex: string;
  sockHex: string | null;
  cowlHex: string | null;
  wingHex: string | null;
}

const CHAR_PALETTES: Record<PetSpecies, CharacterPalette> = {
  shadow_tux: {
    skinHex: '#4B2819',
    torsoHex: '#141418',
    armHex: '#141418',
    handHex: '#4B2819',
    legHex: '#141418',
    bootHex: '#101014',
    sockHex: null,
    cowlHex: null,
    wingHex: null,
  },
  pink_hero: {
    skinHex: '#FF64A4',
    torsoHex: '#D90E18',
    armHex: '#FAD3AD',
    handHex: '#FFFFFF',
    legHex: '#FF5AA0',
    bootHex: '#D90E18',
    sockHex: '#FFFFFF',
    cowlHex: null,
    wingHex: null,
  },
  kid_speed: {
    skinHex: '#5D3623',
    torsoHex: '#FFD000',
    armHex: '#FFD000',
    handHex: '#D40E18',
    legHex: '#D40E18',
    bootHex: '#FFD000',
    sockHex: '#FFD000',
    cowlHex: '#FFD000',
    wingHex: '#D40E18',
  },
  reverse_bolt: {
    skinHex: '#F5C9A6',
    torsoHex: '#FFC800',
    armHex: '#FFC800',
    handHex: '#FFC800',
    legHex: '#FFC800',
    bootHex: '#FFC800',
    sockHex: null,
    cowlHex: '#FFC800',
    wingHex: '#D40E18',
  },
  blue_dash: {
    skinHex: '#0B68D6',
    torsoHex: '#0B68D6',
    armHex: '#FAD3AD',
    handHex: '#FFFFFF',
    legHex: '#0B68D6',
    bootHex: '#D90E18',
    sockHex: '#FFFFFF',
    cowlHex: null,
    wingHex: null,
  },
  crimson_bolt: {
    skinHex: '#F6CCA8',
    torsoHex: '#C80E16',
    armHex: '#C80E16',
    handHex: '#C80E16',
    legHex: '#C80E16',
    bootHex: '#C80E16',
    sockHex: null,
    cowlHex: '#C80E16',
    wingHex: '#FFE100',
  },
};

export function buildSpeedyPetCharacter(
  config: SpeedyPetConfig,
  _fabricNormal: THREE.CanvasTexture,
  _hairNormal: THREE.CanvasTexture,
  anisotropy = 4
): SpeedyPetRig {
  const disposables = {
    geometries: [] as THREE.BufferGeometry[],
    materials: [] as THREE.Material[],
    textures: [] as THREE.Texture[],
  };

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    disposables.materials.push(m);
    return m;
  };
  const trackTex = <T extends THREE.Texture>(t: T): T => {
    disposables.textures.push(t);
    return t;
  };

  const sp = config.species;
  const pal = CHAR_PALETTES[sp] ?? CHAR_PALETTES.shadow_tux;
  const evoStage = getLevelProgress(config.xp || 0).stage;
  const isStage2Plus = evoStage >= 2;
  const isStage3 = evoStage >= 3;

  // Glossy Injection-Molded LEGO ABS Plastic PBR helper
  const makeAbsMat = (hex: string, roughness = 0.2) =>
    trackMat(
      new THREE.MeshPhysicalMaterial({
        color: hex,
        roughness,
        metalness: 0.04,
        clearcoat: 0.88,
        clearcoatRoughness: 0.1,
      })
    );

  const skinMat = makeAbsMat(pal.skinHex, 0.22);
  const torsoBaseMat = makeAbsMat(pal.torsoHex, 0.2);
  const armMat = makeAbsMat(pal.armHex, 0.22);
  const handMat = makeAbsMat(pal.handHex, 0.2);
  const legMat = makeAbsMat(pal.legHex, 0.2);
  const bootMat = makeAbsMat(pal.bootHex, 0.22);
  const sockMat = pal.sockHex ? makeAbsMat(pal.sockHex, 0.22) : legMat;
  const muzzleMat = makeAbsMat('#FAD3AD', 0.26);
  const darkHairMat = makeAbsMat(config.hairColor || '#151517', 0.24);
  const goldMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#FDB105',
      roughness: 0.18,
      metalness: 0.9,
      emissive: isStage3 ? '#6E4500' : '#000000',
      emissiveIntensity: isStage3 ? 0.22 : 0,
    })
  );

  const faceTex = trackTex(
    createLegoFaceTexture(sp, config.expression, config.eyeColor, anisotropy)
  );
  const faceMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      map: faceTex,
      roughness: 0.2,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
    })
  );

  const torsoTex = trackTex(createLegoTorsoTexture(sp, anisotropy));
  const torsoFrontMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      map: torsoTex,
      roughness: 0.2,
      clearcoat: 0.88,
      clearcoatRoughness: 0.1,
    })
  );

  // Evolutionary scale: Stage 1 (Classic) -> Stage 2 (+6%) -> Stage 3 (+12%)
  const stageScale = isStage3 ? 1.12 : isStage2Plus ? 1.06 : 1.0;

  const root = new THREE.Group();
  root.name = 'speedy_pet_root';

  const bodyGroup = new THREE.Group();
  bodyGroup.scale.setScalar(stageScale);
  root.add(bodyGroup);

  const torsoGroup = new THREE.Group();
  bodyGroup.add(torsoGroup);

  // ==========================================================
  // 1. ICONIC TRAPEZOIDAL LEGO TORSO + PRINTED CHEST PLATE
  // ==========================================================
  const legHeight = 0.44;
  const hipHeight = 0.08;
  const torsoBaseY = legHeight + hipHeight; // 0.52
  const torsoH = 0.44;

  const trapShape = new THREE.Shape();
  trapShape.moveTo(-0.21, 0);
  trapShape.lineTo(0.21, 0);
  trapShape.lineTo(0.165, torsoH);
  trapShape.lineTo(-0.165, torsoH);
  trapShape.closePath();

  const torsoGeo = trackGeo(
    new THREE.ExtrudeGeometry(trapShape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.014,
      bevelSegments: 3,
    })
  );
  torsoGeo.translate(0, 0, -0.11);
  const torsoMesh = new THREE.Mesh(torsoGeo, torsoBaseMat);
  torsoMesh.position.y = torsoBaseY;
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torsoGroup.add(torsoMesh);

  // Printed Front Chest Graphic (tilted cleanly flush with front sloped torso face)
  const frontPlaneGeo = trackGeo(new THREE.PlaneGeometry(0.32, 0.40));
  const frontPlane = new THREE.Mesh(frontPlaneGeo, torsoFrontMat);
  frontPlane.position.set(0, torsoBaseY + torsoH * 0.5, 0.128);
  torsoGroup.add(frontPlane);

  // Shadow Tux: 3D Black Bow Tie + Gold Medallion Chain
  if (sp === 'shadow_tux') {
    const knot = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.036, 0.03, 0.03)), torsoBaseMat);
    knot.position.set(0, torsoBaseY + torsoH - 0.04, 0.138);
    torsoGroup.add(knot);
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.034, 0.058, 4)), torsoBaseMat);
      wing.rotation.z = side * -Math.PI * 0.5;
      wing.scale.set(0.7, 1, 0.45);
      wing.position.set(side * 0.036, torsoBaseY + torsoH - 0.04, 0.138);
      torsoGroup.add(wing);
    }

    const chain = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.088, 0.0085, 8, 24, Math.PI * 1.15)),
      goldMat
    );
    chain.rotation.z = Math.PI * 0.92;
    chain.position.set(0, torsoBaseY + torsoH - 0.03, 0.128);
    torsoGroup.add(chain);

    const pendant = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 0.012, 16)),
      goldMat
    );
    pendant.rotation.x = Math.PI * 0.5;
    pendant.position.set(0, torsoBaseY + torsoH - 0.125, 0.138);
    torsoGroup.add(pendant);
  }

  // Pink Hero: Flared Red Dress Skirt with crisp White Bottom Trim
  if (sp === 'pink_hero') {
    const skirt = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.225, 0.305, 0.19, 24)),
      torsoBaseMat
    );
    skirt.scale.set(1.04, 1, 0.78);
    skirt.position.set(0, torsoBaseY - 0.06, 0);
    skirt.castShadow = true;
    torsoGroup.add(skirt);

    const trim = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.30, 0.312, 0.032, 24)),
      handMat
    );
    trim.scale.set(1.04, 1, 0.78);
    trim.position.set(0, torsoBaseY - 0.145, 0);
    torsoGroup.add(trim);
  }

  // Evolution Stage 2 & 3 Shoulder Armor / Golden Speed Force Wings!
  if (isStage2Plus) {
    for (const side of [-1, 1]) {
      const pauldron = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.072, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55)),
        goldMat
      );
      pauldron.position.set(side * 0.195, torsoBaseY + torsoH - 0.02, 0);
      pauldron.rotation.z = side * -0.4;
      pauldron.castShadow = true;
      torsoGroup.add(pauldron);

      if (isStage3) {
        const wingBlade = new THREE.Mesh(
          trackGeo(new THREE.ConeGeometry(0.042, 0.24, 6)),
          goldMat
        );
        wingBlade.scale.set(0.55, 1, 0.25);
        wingBlade.position.set(side * 0.18, torsoBaseY + torsoH - 0.01, -0.145);
        wingBlade.rotation.z = side * -0.58;
        wingBlade.rotation.x = -0.35;
        torsoGroup.add(wingBlade);
      }
    }
  }

  // Cylindrical LEGO Neck post
  const neckMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.078, 0.082, 0.08, 20)),
    skinMat
  );
  neckMesh.position.y = torsoBaseY + torsoH + 0.03;
  torsoGroup.add(neckMesh);

  tagZone(torsoGroup, 'belly');

  // ==========================================================
  // 2. CURVED LEGO ARMS & ICONIC C-GRIP CLAW HANDS
  // ==========================================================
  const shoulderY = torsoBaseY + torsoH - 0.07;

  const buildArm = (side: -1 | 1): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.19, shoulderY, 0);

    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(side * 0.045, -0.12, 0.01),
      new THREE.Vector3(side * 0.055, -0.25, 0.04),
    ]);
    const armGeo = trackGeo(new THREE.TubeGeometry(armCurve, 14, 0.052, 14, false));
    const armMesh = new THREE.Mesh(armGeo, armMat);
    armMesh.castShadow = true;
    pivot.add(armMesh);

    const shoulderBall = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.054, 14, 12)),
      armMat
    );
    pivot.add(shoulderBall);

    // Stage 2+ Golden Power Wrist Cuffs
    if (isStage2Plus) {
      const cuff = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(0.054, 0.012, 8, 16)),
        goldMat
      );
      cuff.rotation.x = Math.PI * 0.5;
      cuff.position.set(side * 0.054, -0.24, 0.036);
      pivot.add(cuff);
    }

    // Wrist Peg + Classic C-Shaped LEGO Claw Hand
    const wrist = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.028, 0.028, 0.05, 12)),
      handMat
    );
    wrist.position.set(side * 0.056, -0.275, 0.048);
    wrist.rotation.x = 0.2;
    pivot.add(wrist);

    const claw = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.044, 0.018, 12, 20, Math.PI * 1.48)),
      handMat
    );
    claw.position.set(side * 0.056, -0.335, 0.058);
    claw.rotation.y = Math.PI * 0.5;
    claw.rotation.z = -Math.PI * 0.24;
    claw.castShadow = true;
    pivot.add(claw);

    // Pink Hero Signature Oversized Red & Yellow Piko Hammer!
    if (sp === 'pink_hero' && side === -1) {
      const hammerGroup = new THREE.Group();
      hammerGroup.position.set(side * 0.056, -0.335, 0.058);
      hammerGroup.rotation.x = -0.35;

      const handle = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.62, 14)),
        makeAbsMat('#FFD000', 0.22)
      );
      handle.rotation.x = Math.PI * 0.5;
      handle.position.set(0, 0, 0.14);
      handle.castShadow = true;
      hammerGroup.add(handle);

      const headCyl = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.115, 0.115, 0.25, 20)),
        makeAbsMat('#D90E18', 0.18)
      );
      headCyl.rotation.z = Math.PI * 0.5;
      headCyl.position.set(0, 0.02, 0.42);
      headCyl.castShadow = true;
      hammerGroup.add(headCyl);

      for (const hSide of [-1, 1]) {
        const cap = new THREE.Mesh(
          trackGeo(new THREE.CylinderGeometry(0.125, 0.125, 0.036, 20)),
          makeAbsMat('#FFD000', 0.18)
        );
        cap.rotation.z = Math.PI * 0.5;
        cap.position.set(hSide * 0.135, 0.02, 0.42);
        hammerGroup.add(cap);
      }

      pivot.add(hammerGroup);
    }

    pivot.rotation.z = side * 0.08;
    return pivot;
  };

  const leftArmPivot = buildArm(-1);
  const rightArmPivot = buildArm(1);
  torsoGroup.add(leftArmPivot);
  torsoGroup.add(rightArmPivot);

  // ==========================================================
  // 3. BLOCKY ARTICULATED LEGO HIPS & LEGS (Grounded at y = 0)
  // ==========================================================
  const waistBar = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.41, hipHeight, 0.21)),
    legMat
  );
  waistBar.position.y = legHeight + hipHeight * 0.5;
  waistBar.castShadow = true;
  bodyGroup.add(waistBar);

  const centerJoint = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.075, 14)),
    legMat
  );
  centerJoint.rotation.z = Math.PI * 0.5;
  centerJoint.position.set(0, legHeight - 0.03, 0);
  bodyGroup.add(centerJoint);

  // Hedgehog Tail (subtle cute stub for blue_dash / pink_hero)
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, legHeight + 0.05, -0.11);
  if (sp === 'blue_dash' || sp === 'pink_hero') {
    const quillTail = new THREE.Mesh(
      trackGeo(new THREE.ConeGeometry(0.042, 0.13, 12)),
      skinMat
    );
    quillTail.rotation.x = -Math.PI * 0.42;
    quillTail.position.set(0, 0.02, -0.05);
    tailGroup.add(quillTail);
  }
  bodyGroup.add(tailGroup);

  const buildLeg = (side: -1 | 1): THREE.Group => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.108, legHeight, 0);

    // Upper thigh + shin block
    const legMainH = legHeight - 0.095;
    const upperLeg = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.185, legMainH, 0.19)),
      legMat
    );
    upperLeg.position.y = -legMainH * 0.5;
    upperLeg.castShadow = true;
    upperLeg.receiveShadow = true;
    legPivot.add(upperLeg);

    // Painted sock cuff band (blue_dash, pink_hero, kid_speed)
    if (pal.sockHex) {
      const sockBand = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.189, 0.055, 0.194)),
        sockMat
      );
      sockBand.position.y = -legHeight + 0.115;
      legPivot.add(sockBand);
    }

    // Classic LEGO Boot / Foot protruding slightly forward at y = 0
    const footMesh = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.188, 0.095, 0.255)),
      bootMat
    );
    footMesh.position.set(0, -legHeight + 0.0475, 0.032);
    footMesh.castShadow = true;
    footMesh.receiveShadow = true;
    legPivot.add(footMesh);

    // Pink Hero white boot stripe
    if (sp === 'pink_hero') {
      const stripe = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.05, 0.06, 0.26)),
        handMat
      );
      stripe.position.set(0, -legHeight + 0.0475, 0.032);
      legPivot.add(stripe);
    }

    tagZone(legPivot, 'feet');
    return legPivot;
  };

  const leftLegPivot = buildLeg(-1);
  const rightLegPivot = buildLeg(1);
  bodyGroup.add(leftLegPivot);
  bodyGroup.add(rightLegPivot);

  // ==========================================================
  // 4. ICONIC LEGO MINIFIGURE HEAD, COWLS & HEDGEHOG QUILLS
  // ==========================================================
  const headCenterY = torsoBaseY + torsoH + 0.215; // ~1.175
  const headGroup = new THREE.Group();
  headGroup.position.set(0, headCenterY, 0);
  torsoGroup.add(headGroup);

  const isHedgehog = sp === 'blue_dash' || sp === 'pink_hero';

  // Dummy eyelid & eye groups kept for blink compatibility
  const leftEyeGroup = new THREE.Group();
  const rightEyeGroup = new THREE.Group();
  const eyelidGeo = trackGeo(new THREE.BoxGeometry(0.001, 0.001, 0.001));
  const leftEyelid = new THREE.Mesh(eyelidGeo, skinMat);
  const rightEyelid = new THREE.Mesh(eyelidGeo, skinMat);
  leftEyelid.visible = false;
  rightEyelid.visible = false;
  headGroup.add(leftEyeGroup, rightEyeGroup, leftEyelid, rightEyelid);

  // Cylindrical LEGO Head Core (rotated so canvas x=256 faces +Z front!)
  const headCylinder = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.195, 0.195, 0.27, 32)),
    faceMat
  );
  headCylinder.rotation.y = -Math.PI * 0.5;
  headCylinder.castShadow = true;
  headCylinder.receiveShadow = true;
  headGroup.add(headCylinder);

  // Rounded top & bottom LEGO head caps
  const topDome = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.195, 28, 12, 0, Math.PI * 2, 0, Math.PI * 0.5)),
    skinMat
  );
  topDome.scale.set(1, 0.36, 1);
  topDome.position.y = 0.132;
  headGroup.add(topDome);

  const botCap = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.195, 28, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5)),
    skinMat
  );
  botCap.scale.set(1, 0.25, 1);
  botCap.position.y = -0.132;
  headGroup.add(botCap);

  // Classic LEGO Stud on top (when not covered by hair/cowl)
  const stud = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.088, 0.088, 0.055, 20)),
    skinMat
  );
  stud.position.y = 0.21;
  headGroup.add(stud);

  // Molded Hedgehog Nose + Snout & Swept Quills for blue_dash / pink_hero
  const leftEarGroup = new THREE.Group();
  const rightEarGroup = new THREE.Group();
  headGroup.add(leftEarGroup, rightEarGroup);

  if (isHedgehog) {
    // 3D Rounded Nose sticking cleanly out of muzzle
    const nose = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.028, 14, 12)),
      makeAbsMat('#141418', 0.15)
    );
    nose.scale.set(1.1, 0.85, 1.2);
    nose.position.set(0, -0.005, 0.205);
    headGroup.add(nose);

    if (sp === 'blue_dash') {
      // Swept-back Sonic blue hedgehog quills + ears
      const dome = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.215, 24, 16)),
        skinMat
      );
      dome.position.set(0, 0.055, -0.02);
      headGroup.add(dome);

      for (const [yOff, rotX, len] of [
        [0.12, -0.35, 0.28],
        [0.01, -0.58, 0.27],
        [-0.08, -0.78, 0.23],
      ]) {
        const quill = new THREE.Mesh(
          trackGeo(new THREE.ConeGeometry(0.115, len, 16)),
          skinMat
        );
        quill.rotation.x = rotX - Math.PI * 0.5;
        quill.position.set(0, yOff, -0.18);
        quill.castShadow = true;
        headGroup.add(quill);
      }
    } else {
      // Pink Hero bobbed hedgehog quills + top bang tufts
      const dome = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.22, 24, 16)),
        skinMat
      );
      dome.position.set(0, 0.06, -0.025);
      headGroup.add(dome);

      for (const side of [-1, 1]) {
        const bob = new THREE.Mesh(
          trackGeo(new THREE.CapsuleGeometry(0.065, 0.17, 6, 12)),
          skinMat
        );
        bob.position.set(side * 0.185, -0.02, -0.01);
        bob.rotation.z = side * 0.18;
        bob.castShadow = true;
        headGroup.add(bob);
      }

      for (const ang of [-0.28, 0, 0.28]) {
        const bang = new THREE.Mesh(
          trackGeo(new THREE.ConeGeometry(0.042, 0.13, 12)),
          skinMat
        );
        bang.position.set(Math.sin(ang) * 0.055, 0.23, 0.08);
        bang.rotation.x = 0.5;
        bang.rotation.z = -ang;
        headGroup.add(bang);
      }
    }

    // Triangular LEGO Hedgehog Ears
    for (const [side, earGrp] of [
      [-1, leftEarGroup],
      [1, rightEarGroup],
    ] as const) {
      earGrp.position.set(side * 0.145, 0.20, 0.01);
      const outer = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.065, 0.115, 12)), skinMat);
      outer.rotation.z = side * -0.35;
      outer.castShadow = true;
      earGrp.add(outer);

      const inner = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.036, 0.075, 10)), muzzleMat);
      inner.position.set(side * 0.005, -0.005, 0.022);
      inner.rotation.z = side * -0.35;
      earGrp.add(inner);
    }
  } else if (sp === 'shadow_tux') {
    // Spiky Glossy Black Anime LEGO Hairpiece
    const baseCap = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.21, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.56)),
      darkHairMat
    );
    baseCap.position.set(0, 0.06, -0.015);
    baseCap.castShadow = true;
    headGroup.add(baseCap);

    // Layered swept anime spikes all around crown
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const spike = new THREE.Mesh(
        trackGeo(new THREE.ConeGeometry(0.052, 0.16, 8)),
        darkHairMat
      );
      spike.position.set(Math.cos(a) * 0.145, 0.19 + (i % 2) * 0.025, Math.sin(a) * 0.145 - 0.01);
      spike.rotation.z = -Math.cos(a) * 0.65;
      spike.rotation.x = Math.sin(a) * 0.55;
      spike.castShadow = true;
      headGroup.add(spike);
    }

    // Center tall anime crest spikes
    for (const [x, y, z, rx] of [
      [0, 0.26, 0.02, -0.25],
      [-0.06, 0.24, -0.05, -0.45],
      [0.06, 0.24, -0.05, -0.45],
    ]) {
      const topSpike = new THREE.Mesh(
        trackGeo(new THREE.ConeGeometry(0.058, 0.175, 8)),
        darkHairMat
      );
      topSpike.position.set(x, y, z);
      topSpike.rotation.x = rx;
      topSpike.castShadow = true;
      headGroup.add(topSpike);
    }
  } else {
    // Speedster Cowls & Helmets (kid_speed, reverse_bolt, crimson_bolt)
    const cowlMat = makeAbsMat(pal.cowlHex || '#C80E16', 0.18);
    const wingMat = makeAbsMat(pal.wingHex || '#FFE100', 0.18);
    const isOpenCrown = sp === 'kid_speed';

    // Outer Helmet / Cowl Wrap (open at front face window)
    const helmetWrap = new THREE.Mesh(
      trackGeo(
        new THREE.CylinderGeometry(
          0.218,
          0.218,
          0.265,
          28,
          1,
          false,
          Math.PI * 0.28,
          Math.PI * 1.44
        )
      ),
      cowlMat
    );
    helmetWrap.castShadow = true;
    headGroup.add(helmetWrap);

    // Brow & Nose Bridge Rim across top of face cutout
    const browBar = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.32, 0.065, 0.075)),
      cowlMat
    );
    browBar.position.set(0, 0.085, 0.185);
    headGroup.add(browBar);

    const chinStrap = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.28, 0.045, 0.06)),
      cowlMat
    );
    chinStrap.position.set(0, -0.115, 0.178);
    headGroup.add(chinStrap);

    if (isOpenCrown) {
      // Curly Black Hair Dome peeking through top of Kid Bolt's yellow cowl
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const r = i < 10 ? 0.125 : 0.055;
        const puff = new THREE.Mesh(
          trackGeo(new THREE.SphereGeometry(0.062, 10, 8)),
          darkHairMat
        );
        puff.position.set(
          Math.cos(a) * r,
          0.185 + (i >= 10 ? 0.032 : 0),
          Math.sin(a) * r
        );
        puff.castShadow = true;
        headGroup.add(puff);
      }
    } else {
      // Smooth Glossy Full Speedster Helmet Dome
      const helmetCap = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.218, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.56)),
        cowlMat
      );
      helmetCap.scale.set(1, 0.68, 1);
      helmetCap.position.y = 0.125;
      helmetCap.castShadow = true;
      headGroup.add(helmetCap);
    }

    // Iconic Side Lightning Ear Wings on Speedster Helmet
    for (const [side, earGrp] of [
      [-1, leftEarGroup],
      [1, rightEarGroup],
    ] as const) {
      earGrp.position.set(side * 0.22, 0.02, 0);
      const disc = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.022, 14)),
        wingMat
      );
      disc.rotation.z = Math.PI * 0.5;
      earGrp.add(disc);

      const wing = new THREE.Mesh(
        trackGeo(new THREE.ConeGeometry(0.038, 0.17, 6)),
        wingMat
      );
      wing.scale.set(0.45, 1, 0.85);
      wing.position.set(side * 0.015, 0.085, -0.025);
      wing.rotation.x = -0.38;
      wing.rotation.z = side * -0.18;
      wing.castShadow = true;
      earGrp.add(wing);
    }
  }

  // Stage 3 Champion Golden Crown Crest
  if (isStage3) {
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, isHedgehog ? 0.285 : 0.255, 0);
    const band = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.088, 0.082, 0.032, 16)),
      goldMat
    );
    crownGroup.add(band);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const spike = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.02, 0.055, 8)), goldMat);
      spike.position.set(Math.cos(a) * 0.07, 0.038, Math.sin(a) * 0.07);
      crownGroup.add(spike);
    }
    headGroup.add(crownGroup);
  }

  // Optional Extra Accessories (Cap, Sunglasses, Headphones, Watch, Bracelet, Chain, Backpack)
  const acc = new Set(config.accessories);
  if (acc.has('sunglasses')) {
    const frameMat = makeAbsMat('#141416', 0.2);
    for (const side of [-1, 1]) {
      const lens = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.11, 0.062, 0.02)), frameMat);
      lens.position.set(side * 0.075, 0.02, 0.215);
      lens.rotation.y = side * 0.14;
      headGroup.add(lens);
    }
    const bridge = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.05, 0.016, 0.02)), frameMat);
    bridge.position.set(0, 0.028, 0.218);
    headGroup.add(bridge);
  }
  if (acc.has('headphones')) {
    const hpMat = makeAbsMat('#22242A', 0.25);
    const band = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.245, 0.018, 10, 28, Math.PI)), hpMat);
    band.position.set(0, 0.04, 0);
    headGroup.add(band);
    for (const side of [-1, 1]) {
      const cup = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.062, 0.062, 0.04, 16)), hpMat);
      cup.rotation.z = Math.PI * 0.5;
      cup.position.set(side * 0.245, 0, 0);
      headGroup.add(cup);
    }
  }
  if (acc.has('backpack')) {
    const pack = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.26, 0.3, 0.11)),
      makeAbsMat('#24252A', 0.25)
    );
    pack.position.set(0, torsoBaseY + 0.22, -0.17);
    pack.castShadow = true;
    torsoGroup.add(pack);
  }

  // Animated Moving Jaw / Lip Overlay (for Talking Tom sync!)
  const jawGroup = new THREE.Group();
  jawGroup.position.set(0, -0.078, 0.185);
  headGroup.add(jawGroup);

  const talkMouth = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.036, 0.028, 0.014, 12)),
    makeAbsMat('#5A0F1A', 0.5)
  );
  talkMouth.rotation.x = Math.PI * 0.5;
  talkMouth.scale.set(1.2, 0.01, 1);
  jawGroup.add(talkMouth);
  jawGroup.visible = false;

  // Angelic Rescue Halo (visible only when pet passed out from missing daily food!)
  const haloMesh = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.165, 0.016, 10, 28)),
    trackMat(
      new THREE.MeshStandardMaterial({
        color: '#FDB105',
        emissive: '#FDB105',
        emissiveIntensity: 0.55,
        roughness: 0.2,
      })
    )
  );
  haloMesh.rotation.x = Math.PI * 0.5;
  haloMesh.position.set(0, 0.34, 0);
  haloMesh.visible = false;
  headGroup.add(haloMesh);

  tagZone(headGroup, 'head');

  // ==========================================================
  // 5. 3D MEAL PROP (Matches what the customer ordered / fed!)
  // ==========================================================
  const foodGroup = new THREE.Group();
  foodGroup.visible = false;
  foodGroup.position.set(0, 1.05, 0.5);

  const mealLabel = (config.lastMealName || '').toLowerCase();
  const mealTokens = (config.lastMealItems || []).join(' ').toLowerCase();
  const hasBacon = mealLabel.includes('bacon') || mealTokens.includes('bacon');
  const isChicken = mealLabel.includes('chicken') || mealTokens.includes('chicken');
  const isFries = mealLabel.includes('fries') && !mealLabel.includes('burger');

  const bunMat = trackMat(new THREE.MeshStandardMaterial({ color: '#D98532', roughness: 0.55 }));
  const cheeseMat = trackMat(new THREE.MeshStandardMaterial({ color: '#FFC226', roughness: 0.35 }));
  const pattyMat = trackMat(
    new THREE.MeshStandardMaterial({ color: isChicken ? '#E39D3E' : '#4E2314', roughness: 0.72 })
  );
  const lettuceMat = trackMat(new THREE.MeshStandardMaterial({ color: '#61B836', roughness: 0.65 }));
  const tomatoMat = trackMat(new THREE.MeshStandardMaterial({ color: '#DF2922', roughness: 0.35 }));

  if (isFries) {
    const cup = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.08, 0.06, 0.14, 16)),
      trackMat(new THREE.MeshStandardMaterial({ color: '#E1000F', roughness: 0.45 }))
    );
    foodGroup.add(cup);
    for (let i = -3; i <= 3; i++) {
      const fry = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.016, 0.12, 0.016)),
        cheeseMat
      );
      fry.position.set(i * 0.016, 0.09 + Math.abs(i % 2) * 0.02, (i % 2) * 0.015);
      fry.rotation.z = i * 0.05;
      foodGroup.add(fry);
    }
  } else {
    const botBun = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.11, 0.10, 0.032, 20)), bunMat);
    botBun.position.y = -0.04;
    foodGroup.add(botBun);

    const lettuce = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.125, 0.125, 0.014, 16)), lettuceMat);
    lettuce.position.y = -0.016;
    foodGroup.add(lettuce);

    const tomato = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.10, 0.10, 0.014, 18)), tomatoMat);
    tomato.position.y = -0.002;
    foodGroup.add(tomato);

    const patty = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.115, 0.115, 0.03, 20)), pattyMat);
    patty.position.y = 0.02;
    foodGroup.add(patty);

    const cheese = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.19, 0.012, 0.19)), cheeseMat);
    cheese.position.y = 0.04;
    cheese.rotation.y = 0.35;
    foodGroup.add(cheese);

    if (hasBacon) {
      const bacon = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(0.20, 0.012, 0.05)),
        trackMat(new THREE.MeshStandardMaterial({ color: '#9E2A1B', roughness: 0.38 }))
      );
      bacon.position.y = 0.054;
      foodGroup.add(bacon);
    }

    const topBun = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.112, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5)),
      bunMat
    );
    topBun.scale.set(1, 0.72, 1);
    topBun.position.y = hasBacon ? 0.06 : 0.048;
    foodGroup.add(topBun);
  }

  root.add(foodGroup);

  const mouthY = (headCenterY - 0.06) * stageScale;

  return {
    root,
    bodyGroup,
    torsoGroup,
    headGroup,
    jawGroup,
    leftEarGroup,
    rightEarGroup,
    tailGroup,
    leftEyeGroup,
    rightEyeGroup,
    leftEyelid,
    rightEyelid,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    foodGroup,
    haloMesh,
    mouthY,
    disposables,
  };
}

export function animateSpeedyPetRig(
  rig: SpeedyPetRig,
  elapsed: number,
  _config: SpeedyPetConfig,
  anim: PetAnimState
): void {
  const isFainted = anim.mode === 'fainted' || anim.fullness <= 0;

  if (isFainted) {
    rig.bodyGroup.position.y = -0.12;
    rig.bodyGroup.rotation.x = 0.56;
    rig.bodyGroup.rotation.z = 0.16;
    rig.headGroup.rotation.x = 0.3;
    rig.headGroup.rotation.z = Math.sin(elapsed * 1.4) * 0.05;
    rig.leftArmPivot.rotation.z = -0.55;
    rig.rightArmPivot.rotation.z = 0.55;
    rig.haloMesh.visible = true;
    rig.haloMesh.position.y = 0.35 + Math.sin(elapsed * 2.5) * 0.015;
    rig.foodGroup.visible = false;
    rig.jawGroup.visible = false;
    return;
  }

  rig.haloMesh.visible = false;
  rig.bodyGroup.rotation.x = 0;
  rig.bodyGroup.rotation.z = 0;

  const progress = anim.duration > 0 ? Math.min(1, anim.timer / anim.duration) : 0;
  const breath = Math.sin(elapsed * 2.4);
  rig.torsoGroup.position.y = breath * 0.008;
  rig.bodyGroup.rotation.y = Math.sin(elapsed * 0.9) * 0.04;

  const hungryFactor = anim.fullness < 35 ? 1 : 0;
  let hopY = 0;
  let mouthOpen = 0;

  if (anim.mode === 'eat') {
    rig.foodGroup.visible = true;
    const mY = rig.mouthY || 1.1;
    if (progress < 0.35) {
      const t = progress / 0.35;
      rig.foodGroup.position.set(0, mY - 0.28 + t * 0.28, 0.54 - t * 0.24);
      rig.foodGroup.scale.setScalar(1);
    } else {
      const chewT = (progress - 0.35) / 0.65;
      rig.foodGroup.position.set(0, mY, 0.29);
      rig.foodGroup.scale.setScalar(Math.max(0.01, 1 - chewT * 1.1));
      mouthOpen = Math.abs(Math.sin(chewT * Math.PI * 6));
      hopY = Math.abs(Math.sin(chewT * Math.PI * 3)) * 0.04;
    }
    rig.leftArmPivot.rotation.x = -0.85;
    rig.rightArmPivot.rotation.x = -0.85;
  } else {
    rig.foodGroup.visible = false;

    if (anim.mode === 'evolve') {
      hopY = Math.abs(Math.sin(progress * Math.PI * 2)) * 0.26;
      rig.bodyGroup.rotation.y = progress * Math.PI * 4;
      rig.leftArmPivot.rotation.z = -1.25;
      rig.rightArmPivot.rotation.z = 1.25;
      rig.leftArmPivot.rotation.x = -0.4;
      rig.rightArmPivot.rotation.x = -0.4;
      mouthOpen = 0.8;
    } else if (anim.mode === 'talk') {
      mouthOpen = Math.abs(Math.sin(elapsed * 18));
      rig.headGroup.rotation.y = Math.sin(elapsed * 6) * 0.16;
      rig.leftArmPivot.rotation.x = -0.45 + Math.sin(elapsed * 10) * 0.25;
      rig.rightArmPivot.rotation.x = -0.45 - Math.sin(elapsed * 10) * 0.25;
      rig.leftArmPivot.rotation.z = -0.15;
      rig.rightArmPivot.rotation.z = 0.15;
    } else if (anim.mode === 'head_pat') {
      hopY = Math.abs(Math.sin(progress * Math.PI * 2)) * 0.045;
      rig.headGroup.rotation.z = Math.sin(elapsed * 12) * 0.16;
      mouthOpen = 0.55;
      rig.leftArmPivot.rotation.z = -0.42;
      rig.rightArmPivot.rotation.z = 0.42;
    } else if (anim.mode === 'belly_rub') {
      rig.torsoGroup.rotation.z = Math.sin(elapsed * 15) * 0.12;
      rig.headGroup.rotation.x = -0.14;
      mouthOpen = 0.65;
      rig.leftArmPivot.rotation.x = -0.55;
      rig.rightArmPivot.rotation.x = -0.55;
      rig.leftArmPivot.rotation.z = -0.28;
      rig.rightArmPivot.rotation.z = 0.28;
    } else if (anim.mode === 'feet_hop') {
      hopY = Math.sin(progress * Math.PI) * 0.24;
      rig.leftLegPivot.rotation.x = -hopY * 1.4;
      rig.rightLegPivot.rotation.x = hopY * 1.1;
      rig.leftArmPivot.rotation.z = -0.82;
      rig.rightArmPivot.rotation.z = 0.82;
      mouthOpen = 0.5;
    } else {
      rig.torsoGroup.rotation.z = 0;
      rig.leftLegPivot.rotation.x = 0;
      rig.rightLegPivot.rotation.x = 0;
      rig.headGroup.rotation.y = Math.sin(elapsed * 0.95) * 0.08;
      rig.headGroup.rotation.x = hungryFactor ? 0.14 : Math.sin(elapsed * 1.6) * 0.03;
      rig.headGroup.rotation.z = 0;
      rig.leftArmPivot.rotation.x = Math.sin(elapsed * 1.4) * 0.07;
      rig.rightArmPivot.rotation.x = -Math.sin(elapsed * 1.4) * 0.07;
      rig.leftArmPivot.rotation.z = -0.09 - breath * 0.015;
      rig.rightArmPivot.rotation.z = 0.09 + breath * 0.015;
    }
  }

  rig.bodyGroup.position.y = hopY;
  if (mouthOpen > 0.08) {
    rig.jawGroup.visible = true;
    rig.jawGroup.scale.y = 0.35 + mouthOpen * 1.45;
  } else {
    rig.jawGroup.visible = false;
  }
}

export function disposeSpeedyPetRig(rig: SpeedyPetRig): void {
  rig.disposables.textures.forEach((t) => t.dispose());
  rig.disposables.materials.forEach((m) => m.dispose());
  rig.disposables.geometries.forEach((g) => g.dispose());
}
