import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { SPEEDY_BURGER_LOGO } from '../data/logo';
import {
  ACCESSORY_ITEMS,
  getEvolutionInfo,
  getLevelProgress,
  PET_SPECIES,
  SpeedyPetConfig,
} from '../data/speedyPetCatalog';
import {
  animateSpeedyPetRig,
  buildSpeedyPetCharacter,
  disposeSpeedyPetRig,
  PetAnimMode,
  PetAnimState,
  SpeedyPetRig,
} from './speedyPetCharacter';
import { createFabricNormalMap, createHairNormalMap } from './speedyPetTextures';

export type PetCameraPreset = 'full' | 'face' | 'back' | 'shoes';

export interface SpeedyPetStageHandle {
  playAnim: (mode: Exclude<PetAnimMode, 'idle' | 'fainted'>, duration?: number) => void;
  exportShareCardPng: (pet: SpeedyPetConfig, shopName?: string) => Promise<Blob | null>;
}

interface SpeedyPetStageProps {
  config: SpeedyPetConfig;
  fullness: number;
  cameraPreset: PetCameraPreset;
  presetVersion: number;
  autoRotate: boolean;
  darkStudio?: boolean;
  brandColor?: string;
  accentColor?: string;
  onTapPetZone?: (zone: 'head' | 'belly' | 'feet') => void;
}

const CAMERA_PRESETS: Record<
  PetCameraPreset,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  full: { pos: [0.14, 1.05, 3.05], target: [0, 0.85, 0] },
  face: { pos: [0.04, 1.38, 1.32], target: [0, 1.33, 0] },
  back: { pos: [0.14, 1.05, -3.05], target: [0, 0.85, 0] },
  shoes: { pos: [0.58, 0.36, 1.55], target: [0, 0.24, 0] },
};

const _rayMouse = new THREE.Vector2();
const _raycaster = new THREE.Raycaster();

function detectSoftwareGl(): boolean {
  try {
    const probe = document.createElement('canvas');
    const glProbe = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!glProbe) return false;
    const dbg = glProbe.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = dbg
      ? String(glProbe.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
      : '';
    glProbe.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|Software|Mesa/i.test(rendererStr);
  } catch {
    return false;
  }
}

function afterDraw(gl: WebGLRenderingContext | WebGL2RenderingContext, done: () => void) {
  if ('fenceSync' in gl && typeof gl.fenceSync === 'function') {
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (sync) {
      gl.flush();
      const poll = () => {
        const res = gl.clientWaitSync(sync, 0, 0);
        if (res === gl.ALREADY_SIGNALED || res === gl.CONDITION_SATISFIED || res === gl.WAIT_FAILED) {
          gl.deleteSync(sync);
          setTimeout(done, 80);
        } else {
          setTimeout(poll, 4);
        }
      };
      setTimeout(poll, 0);
      return;
    }
  }
  setTimeout(done, 80);
}

const SpeedyPetStage = forwardRef<SpeedyPetStageHandle, SpeedyPetStageProps>(
  function SpeedyPetStage(
    {
      config,
      fullness,
      cameraPreset,
      presetVersion,
      autoRotate,
      darkStudio = false,
      brandColor = '#E1000F',
      accentColor = '#FDB105',
      onTapPetZone,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const rigRef = useRef<SpeedyPetRig | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const fabricNormalRef = useRef<THREE.CanvasTexture | null>(null);
    const hairNormalRef = useRef<THREE.CanvasTexture | null>(null);
    const anisotropyRef = useRef<number>(4);

    const configRef = useRef(config);
    configRef.current = config;
    const fullnessRef = useRef(fullness);
    fullnessRef.current = fullness;
    const autoRotateRef = useRef(autoRotate);
    autoRotateRef.current = autoRotate;
    const onTapZoneRef = useRef(onTapPetZone);
    onTapZoneRef.current = onTapPetZone;

    const animStateRef = useRef<PetAnimState>({
      mode: 'idle',
      timer: 0,
      duration: 0,
      fullness,
    });

    const goalPosRef = useRef(new THREE.Vector3(...CAMERA_PRESETS.full.pos));
    const goalTargetRef = useRef(new THREE.Vector3(...CAMERA_PRESETS.full.target));
    const transitioningRef = useRef(false);

    useEffect(() => {
      const p = CAMERA_PRESETS[cameraPreset];
      goalPosRef.current.set(...p.pos);
      goalTargetRef.current.set(...p.target);
      transitioningRef.current = true;
    }, [cameraPreset, presetVersion]);

    useEffect(() => {
      if (sceneRef.current) {
        sceneRef.current.background = new THREE.Color(
          darkStudio ? '#24140D' : '#F4E2C9'
        );
      }
    }, [darkStudio]);

    useImperativeHandle(ref, () => ({
      playAnim: (mode, duration = 1.6) => {
        animStateRef.current.mode = mode;
        animStateRef.current.timer = 0;
        animStateRef.current.duration = duration;
      },
      exportShareCardPng: async (pet, shopName = 'SPEEDY BURGER') => {
        const renderer = rendererRef.current;
        const scene = sceneRef.current;
        const camera = cameraRef.current;
        if (!renderer || !scene || !camera) return null;

        renderer.render(scene, camera);
        const glCanvas = renderer.domElement;

        const cardW = 1080;
        const cardH = 1350;
        const out = document.createElement('canvas');
        out.width = cardW;
        out.height = cardH;
        const ctx = out.getContext('2d');
        if (!ctx) return null;

        const grad = ctx.createLinearGradient(0, 0, 0, cardH);
        grad.addColorStop(0, '#FFF5E4');
        grad.addColorStop(0.7, '#F0D3AE');
        grad.addColorStop(1, '#3A0B08');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cardW, cardH);

        ctx.fillStyle = brandColor;
        ctx.fillRect(0, 0, cardW, 130);
        ctx.fillStyle = accentColor;
        ctx.fillRect(0, 124, cardW, 8);

        try {
          const logoImg = new Image();
          logoImg.src = SPEEDY_BURGER_LOGO;
          await new Promise<void>((resolve) => {
            if (logoImg.complete) return resolve();
            logoImg.onload = () => resolve();
            logoImg.onerror = () => resolve();
          });
          if (logoImg.naturalWidth > 0) {
            ctx.drawImage(logoImg, 44, 22, 86, 86);
          }
        } catch {
          // ignore logo draw failure
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 48px "Barlow Condensed", Impact, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('SPEEDY PET · COLLECTOR CARD', 152, 76);
        ctx.fillStyle = '#FFE299';
        ctx.font = 'bold 22px Barlow, sans-serif';
        ctx.fillText(`${shopName} TALKING MASCOT`, 154, 106);

        const viewBoxY = 165;
        const viewBoxH = 820;
        const aspect = glCanvas.width / Math.max(1, glCanvas.height);
        let drawW = cardW - 96;
        let drawH = drawW / aspect;
        if (drawH > viewBoxH) {
          drawH = viewBoxH;
          drawW = drawH * aspect;
        }
        const drawX = (cardW - drawW) / 2;
        const drawY = viewBoxY + (viewBoxH - drawH) / 2;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(48, viewBoxY, cardW - 96, viewBoxH, 28);
        ctx.clip();
        ctx.fillStyle = darkStudio ? '#24140D' : '#F4E2C9';
        ctx.fillRect(48, viewBoxY, cardW - 96, viewBoxH);
        ctx.drawImage(glCanvas, drawX, drawY, drawW, drawH);
        ctx.restore();

        ctx.strokeStyle = 'rgba(58, 11, 8, 0.16)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(48, viewBoxY, cardW - 96, viewBoxH, 28);
        ctx.stroke();

        const speciesOption = PET_SPECIES.find((s) => s.id === pet.species);
        const speciesLabel = speciesOption?.label ?? 'Hero';
        const prog = getLevelProgress(pet.xp || 0);
        const evoMeta = getEvolutionInfo(pet.species, prog.stage);
        const accNames = pet.accessories
          .map((id) => ACCESSORY_ITEMS.find((a) => a.id === id)?.name)
          .filter(Boolean)
          .join(', ');

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 60px "Barlow Condensed", Impact, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${pet.name.toUpperCase()} · LVL ${prog.level}`, 58, 1068);

        ctx.fillStyle = accentColor;
        ctx.font = 'bold 25px Barlow, sans-serif';
        ctx.fillText(
          `${evoMeta.title.toUpperCase()} (${speciesLabel.toUpperCase()}) · ${prog.xp} XP · ${pet.streakDays}D STREAK`,
          58,
          1112
        );

        ctx.fillStyle = '#FFEFE0';
        ctx.font = '600 24px Barlow, sans-serif';
        ctx.fillText(
          `Character: ${speciesLabel}   ·   Meals Eaten: ${pet.totalMealsEaten}`,
          58,
          1168
        );
        ctx.fillText(
          `Last Meal: ${pet.lastMealName}   ·   Stage ${prog.stage} of 3`,
          58,
          1208
        );
        if (accNames) {
          ctx.fillStyle = '#FDB105';
          ctx.fillText(`Gear: ${accNames.slice(0, 68)}`, 58, 1248);
        }

        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.font = '600 20px Barlow, sans-serif';
        ctx.fillText('speedyburgersja.com', 58, 1304);

        return await new Promise<Blob | null>((resolve) =>
          out.toBlob((blob) => resolve(blob), 'image/png')
        );
      },
    }));

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const isSoftwareGl = detectSoftwareGl();

      const renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      renderer.setSize(
        Math.max(1, container.clientWidth),
        Math.max(1, container.clientHeight)
      );
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.shadowMap.enabled = !isSoftwareGl;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      anisotropyRef.current = anisotropy;
      const fabricNormal = createFabricNormalMap(anisotropy);
      const hairNormal = createHairNormalMap(anisotropy);
      fabricNormalRef.current = fabricNormal;
      hairNormalRef.current = hairNormal;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(darkStudio ? '#24140D' : '#F4E2C9');
      sceneRef.current = scene;

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;
      scene.environmentIntensity = 0.72;
      pmrem.dispose();

      const camera = new THREE.PerspectiveCamera(
        38,
        Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight),
        0.1,
        40
      );
      camera.position.set(...CAMERA_PRESETS.full.pos);
      cameraRef.current = camera;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(...CAMERA_PRESETS.full.target);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;
      controls.enablePan = false;
      controls.minDistance = 1.05;
      controls.maxDistance = 5.0;
      controls.minPolarAngle = 0.35;
      controls.maxPolarAngle = Math.PI * 0.56;
      controls.addEventListener('start', () => {
        transitioningRef.current = false;
      });
      controlsRef.current = controls;

      const hemi = new THREE.HemisphereLight('#FFF5E8', '#C49A76', 0.58);
      scene.add(hemi);

      const keyLight = new THREE.DirectionalLight('#FFF7EC', 2.1);
      keyLight.position.set(2.8, 4.5, 3.6);
      keyLight.castShadow = !isSoftwareGl;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 12;
      keyLight.shadow.camera.left = -2;
      keyLight.shadow.camera.right = 2;
      keyLight.shadow.camera.top = 2.6;
      keyLight.shadow.camera.bottom = -0.5;
      keyLight.shadow.bias = -0.0005;
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight('#DCEBFF', 1.1);
      rimLight.position.set(-2.6, 2.8, -3.0);
      scene.add(rimLight);

      if (!isSoftwareGl) {
        RectAreaLightUniformsLib.init();
        const fillPanel = new THREE.RectAreaLight('#FFF1DA', 1.8, 3.5, 3.5);
        fillPanel.position.set(-3.0, 2.2, 2.4);
        fillPanel.lookAt(0, 0.9, 0);
        scene.add(fillPanel);
      } else {
        const fillFallback = new THREE.DirectionalLight('#FFF1DA', 0.85);
        fillFallback.position.set(-3.0, 2.2, 2.4);
        scene.add(fillFallback);
      }

      const podiumGroup = new THREE.Group();
      const topDiskGeo = new THREE.CylinderGeometry(0.92, 0.96, 0.06, 48);
      const topDiskMat = new THREE.MeshStandardMaterial({
        color: '#FFF8EE',
        roughness: 0.42,
        metalness: 0.04,
      });
      const topDisk = new THREE.Mesh(topDiskGeo, topDiskMat);
      topDisk.position.y = -0.03;
      topDisk.receiveShadow = true;
      podiumGroup.add(topDisk);

      const rimGeo = new THREE.TorusGeometry(0.94, 0.018, 12, 64);
      rimGeo.rotateX(Math.PI * 0.5);
      const rimMat = new THREE.MeshStandardMaterial({
        color: accentColor,
        roughness: 0.3,
        metalness: 0.35,
      });
      const rimRing = new THREE.Mesh(rimGeo, rimMat);
      rimRing.position.y = -0.004;
      podiumGroup.add(rimRing);

      const innerRingGeo = new THREE.TorusGeometry(0.74, 0.008, 10, 48);
      innerRingGeo.rotateX(Math.PI * 0.5);
      const innerRingMat = new THREE.MeshStandardMaterial({
        color: brandColor,
        roughness: 0.35,
      });
      const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
      innerRing.position.y = 0.001;
      podiumGroup.add(innerRing);

      scene.add(podiumGroup);

      const initialRig = buildSpeedyPetCharacter(
        configRef.current,
        fabricNormal,
        hairNormal,
        anisotropy
      );
      scene.add(initialRig.root);
      rigRef.current = initialRig;

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }

      // Tap / Click Raycasting on Pet Body Zones (Talking Tom style!)
      let pointerDownX = 0;
      let pointerDownY = 0;
      const onPointerDown = (e: PointerEvent) => {
        pointerDownX = e.clientX;
        pointerDownY = e.clientY;
      };
      const onPointerUp = (e: PointerEvent) => {
        const dist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);
        if (dist > 8 || !rigRef.current) return;
        const rect = renderer.domElement.getBoundingClientRect();
        _rayMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        _rayMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        _raycaster.setFromCamera(_rayMouse, camera);
        const hits = _raycaster.intersectObject(rigRef.current.root, true);
        if (hits.length > 0) {
          const zone = (hits[0].object.userData.petZone as 'head' | 'belly' | 'feet') || 'belly';
          onTapZoneRef.current?.(zone);
        }
      };
      renderer.domElement.addEventListener('pointerdown', onPointerDown);
      renderer.domElement.addEventListener('pointerup', onPointerUp);

      const resizeObs = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = Math.max(1, entry.contentRect.width);
          const h = Math.max(1, entry.contentRect.height);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      });
      resizeObs.observe(container);

      let disposed = false;
      let rafId = 0;
      let prevTime = performance.now();
      let elapsed = 0;

      const tick = (now = performance.now()) => {
        if (disposed) return;
        const dt = Math.min(0.05, Math.max(0.001, (now - prevTime) / 1000));
        prevTime = now;
        elapsed += dt;

        const anim = animStateRef.current;
        anim.fullness = fullnessRef.current;
        if (anim.mode !== 'idle' && anim.mode !== 'fainted') {
          anim.timer += dt;
          if (anim.timer >= anim.duration) {
            anim.mode = 'idle';
            anim.timer = 0;
          }
        }

        if (rigRef.current) {
          animateSpeedyPetRig(rigRef.current, elapsed, configRef.current, anim);
        }

        if (transitioningRef.current) {
          const alpha = 6;
          camera.position.x = THREE.MathUtils.damp(
            camera.position.x,
            goalPosRef.current.x,
            alpha,
            dt
          );
          camera.position.y = THREE.MathUtils.damp(
            camera.position.y,
            goalPosRef.current.y,
            alpha,
            dt
          );
          camera.position.z = THREE.MathUtils.damp(
            camera.position.z,
            goalPosRef.current.z,
            alpha,
            dt
          );
          controls.target.x = THREE.MathUtils.damp(
            controls.target.x,
            goalTargetRef.current.x,
            alpha,
            dt
          );
          controls.target.y = THREE.MathUtils.damp(
            controls.target.y,
            goalTargetRef.current.y,
            alpha,
            dt
          );
          controls.target.z = THREE.MathUtils.damp(
            controls.target.z,
            goalTargetRef.current.z,
            alpha,
            dt
          );

          if (camera.position.distanceTo(goalPosRef.current) < 0.01) {
            transitioningRef.current = false;
          }
        }

        controls.autoRotate = autoRotateRef.current;
        controls.autoRotateSpeed = 1.65;
        controls.update();

        renderer.render(scene, camera);

        if (isSoftwareGl) {
          afterDraw(renderer.getContext(), () => {
            if (!disposed) rafId = requestAnimationFrame(tick);
          });
        } else {
          rafId = requestAnimationFrame(tick);
        }
      };

      rafId = requestAnimationFrame(tick);

      return () => {
        disposed = true;
        cancelAnimationFrame(rafId);
        resizeObs.disconnect();
        renderer.domElement.removeEventListener('pointerdown', onPointerDown);
        renderer.domElement.removeEventListener('pointerup', onPointerUp);
        controls.dispose();
        if (rigRef.current) {
          scene.remove(rigRef.current.root);
          disposeSpeedyPetRig(rigRef.current);
          rigRef.current = null;
        }
        topDiskGeo.dispose();
        topDiskMat.dispose();
        rimGeo.dispose();
        rimMat.dispose();
        innerRingGeo.dispose();
        innerRingMat.dispose();
        fabricNormal.dispose();
        hairNormal.dispose();
        envTex.dispose();
        renderer.dispose();
        if (renderer.domElement.parentElement === container) {
          container.removeChild(renderer.domElement);
        }
      };
    }, [accentColor, brandColor]);

    useEffect(() => {
      const scene = sceneRef.current;
      const fabricNormal = fabricNormalRef.current;
      const hairNormal = hairNormalRef.current;
      if (!scene || !fabricNormal || !hairNormal) return;

      if (rigRef.current) {
        scene.remove(rigRef.current.root);
        disposeSpeedyPetRig(rigRef.current);
        rigRef.current = null;
      }

      const nextRig = buildSpeedyPetCharacter(
        config,
        fabricNormal,
        hairNormal,
        anisotropyRef.current
      );
      scene.add(nextRig.root);
      rigRef.current = nextRig;
    }, [config]);

    return (
      <div
        ref={containerRef}
        className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
        aria-label="Interactive 3D Speedy Pet Animal Viewport"
      />
    );
  }
);

export default SpeedyPetStage;
