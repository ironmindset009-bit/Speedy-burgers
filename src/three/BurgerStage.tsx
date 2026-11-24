import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  BurgerBuildState,
  CHEESE_OPTIONS,
  MEAT_OPTIONS,
  SAUCE_OPTIONS,
} from "../data/menu";
import { MenuItemRecord } from "../data/siteConfig";
import {
  createBaconLayer,
  createBeefPatty,
  createBottomBun,
  createCaramelizedOnionsLayer,
  createCrispyChicken,
  createFriesSide,
  createLettuceLayer,
  createLettuceWrapBun,
  createMeltingCheese,
  createNuggetsLayer,
  createOnionLayer,
  createPicklesLayer,
  createSauceLayer,
  createScotchBonnetLayer,
  createSlicedBread,
  createTomatoLayer,
  createTopBun,
} from "./burgerGeometries";
import { BurgerTextureSet, createBurgerTextures } from "./proceduralTextures";

export type CameraPreset = "photo" | "hero" | "top" | "under";
export type StudioTheme = "studio" | "amber" | "grill";

export interface BurgerStageHandle {
  exportPng: () => Promise<Blob | null>;
  exportGlbBuffer: () => Promise<ArrayBuffer>;
  getBackdropCss: () => string;
}

interface BurgerStageProps {
  build: BurgerBuildState;
  explodeAmount: number; // 0 = stacked, 1 = exploded studio shot
  autoRotate: boolean;
  cameraPreset: CameraPreset;
  presetVersion: number;
  studioTheme: StudioTheme;
  showLabels?: boolean;
  catalogItems?: MenuItemRecord[];
  animationsEnabled?: boolean;
  onHoverLayer: (label: string | null) => void;
}

interface LayerSpec {
  key: string;
  kind: string;
  variant: string;
  calloutText: string;
  side: "left" | "right";
  elbow: "top" | "bottom" | "flat";
  anchorY: number;
  edgeR: number;
}

interface LayerEntry {
  key: string;
  kind: string;
  group: THREE.Group;
  targetY: number;
  currentY: number;
  targetScale: number;
  currentScale: number;
  removing: boolean;
  calloutText: string;
  side: "left" | "right";
  elbow: "top" | "bottom" | "flat";
  anchorY: number;
  edgeR: number;
}

interface LabelPoolNode {
  polyline: SVGPolylineElement;
  dot: SVGCircleElement;
  box: HTMLDivElement;
}

interface ProjectedCallout {
  entry: LayerEntry;
  ax: number;
  ay: number;
  lx: number;
  ly: number;
  elbowX: number;
  elbowY: number;
  side: "left" | "right";
  elbow: "top" | "bottom" | "flat";
}

const LAYER_SPACING: Record<string, { stacked: number; exploded: number }> = {
  bunBottom: { stacked: 0.48, exploded: 0.76 },
  lettuce: { stacked: 0.14, exploded: 0.48 },
  onion: { stacked: 0.12, exploded: 0.44 },
  caramelized_onions: { stacked: 0.12, exploded: 0.44 },
  pickles: { stacked: 0.10, exploded: 0.42 },
  scotch_bonnet: { stacked: 0.10, exploded: 0.42 },
  tomato: { stacked: 0.18, exploded: 0.52 },
  patty: { stacked: 0.46, exploded: 0.86 },
  chicken: { stacked: 0.44, exploded: 0.84 },
  nuggets: { stacked: 0.36, exploded: 0.74 },
  cheese: { stacked: 0.06, exploded: 0.68 },
  bacon: { stacked: 0.24, exploded: 0.78 },
  sauce: { stacked: 0.08, exploded: 0.42 },
  bunTop: { stacked: 0.96, exploded: 1.04 },
};

const CALLOUT_ANCHORS: Record<string, { anchorY: number; edgeR: number }> = {
  bunTop: { anchorY: 0.64, edgeR: 0.88 },
  bunBottom: { anchorY: 0.20, edgeR: 0.92 },
  bacon: { anchorY: 0.18, edgeR: 1.32 },
  cheese: { anchorY: 0.24, edgeR: 1.36 },
  patty: { anchorY: 0.28, edgeR: 1.42 },
  chicken: { anchorY: 0.26, edgeR: 1.44 },
  nuggets: { anchorY: 0.22, edgeR: 1.15 },
  tomato: { anchorY: 0.16, edgeR: 1.28 },
  pickles: { anchorY: 0.12, edgeR: 1.22 },
  scotch_bonnet: { anchorY: 0.10, edgeR: 0.92 },
  onion: { anchorY: 0.10, edgeR: 1.18 },
  caramelized_onions: { anchorY: 0.09, edgeR: 1.05 },
  lettuce: { anchorY: 0.14, edgeR: 1.56 },
  sauce: { anchorY: 0.08, edgeR: 1.18 },
};

export const THEME_COLORS: Record<
  StudioTheme,
  {
    bg: number;
    css: string;
    gradientStops: [string, string, string];
    labelColor: string;
    lineColor: string;
    dotColor: string;
    labelShadow: string;
  }
> = {
  studio: {
    bg: 0xd9b892,
    css: "radial-gradient(ellipse at 50% 42%, #e7caa6 0%, #d9b892 58%, #c49e76 100%)",
    gradientStops: ["#e7caa6", "#d9b892", "#c49e76"],
    labelColor: "#2b0d06",
    lineColor: "rgba(43, 13, 6, 0.56)",
    dotColor: "#2b0d06",
    labelShadow: "0 1px 6px rgba(255, 245, 228, 0.72)",
  },
  amber: {
    bg: 0xfdb105,
    css: "radial-gradient(ellipse at 50% 42%, #ffd76a 0%, #fdb105 62%, #e09500 100%)",
    gradientStops: ["#ffd76a", "#fdb105", "#e09500"],
    labelColor: "#2b0d06",
    lineColor: "rgba(43, 13, 6, 0.58)",
    dotColor: "#2b0d06",
    labelShadow: "0 1px 6px rgba(255, 240, 185, 0.75)",
  },
  grill: {
    bg: 0x160a05,
    css: "radial-gradient(ellipse at 50% 42%, #32180c 0%, #160a05 64%, #080402 100%)",
    gradientStops: ["#32180c", "#160a05", "#080402"],
    labelColor: "#f8f4ee",
    lineColor: "rgba(255, 255, 255, 0.65)",
    dotColor: "#ffffff",
    labelShadow: "0 2px 8px rgba(0, 0, 0, 0.85)",
  },
};

const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();
const _mouse = new THREE.Vector2();
const _raycaster = new THREE.Raycaster();
const _instMat = new THREE.Matrix4();
const _camRight = new THREE.Vector3();
const _worldAnchor = new THREE.Vector3();
const _projVec = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function disposeObject3D(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh || (child as THREE.InstancedMesh).isInstancedMesh) {
      const mesh = child as THREE.Mesh;
      mesh.geometry?.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material?.dispose();
      }
    }
  });
}

function buildLayerGroup(
  kind: string,
  variant: string,
  tex: BurgerTextureSet
): THREE.Group {
  switch (kind) {
    case "bunBottom":
      if (variant === "original_bun") return createBottomBun(tex, false);
      if (variant === "sliced_bread") return createSlicedBread(tex, false);
      if (variant === "lettuce_wrap") return createLettuceWrapBun(tex, false);
      return createBottomBun(tex, true);
    case "bunTop":
      if (variant === "original_bun") return createTopBun(tex, false);
      if (variant === "sliced_bread") return createSlicedBread(tex, true);
      if (variant === "lettuce_wrap") return createLettuceWrapBun(tex, true);
      return createTopBun(tex, true);
    case "lettuce":
      return createLettuceLayer(tex);
    case "onion":
      return createOnionLayer(tex);
    case "caramelized_onions":
      return createCaramelizedOnionsLayer();
    case "pickles":
      return createPicklesLayer(tex);
    case "scotch_bonnet":
      return createScotchBonnetLayer();
    case "tomato":
      return createTomatoLayer(tex);
    case "patty":
      return createBeefPatty(tex);
    case "chicken":
      return createCrispyChicken(tex);
    case "nuggets":
      return createNuggetsLayer(tex);
    case "cheese":
      return createMeltingCheese(tex, variant);
    case "bacon":
      return createBaconLayer(tex);
    case "sauce":
      return createSauceLayer(variant);
    default:
      return new THREE.Group();
  }
}

function getBaseCalloutName(kind: string, variant: string): string {
  switch (kind) {
    case "bunTop":
      if (variant === "original_bun") return "TOP BRIOCHE BUN";
      if (variant === "sliced_bread") return "TOP SLICED BREAD";
      if (variant === "lettuce_wrap") return "TOP LETTUCE WRAP";
      return "TOP SESAME BUN";
    case "bunBottom":
      if (variant === "original_bun") return "BOTTOM BRIOCHE HEEL";
      if (variant === "sliced_bread") return "BOTTOM SLICED BREAD";
      if (variant === "lettuce_wrap") return "BOTTOM LETTUCE WRAP";
      return "BOTTOM BUN HEEL";
    case "bacon":
      return "CRISPY SMOKY BACON";
    case "cheese": {
      const ch = CHEESE_OPTIONS.find((c) => c.id === variant);
      if (variant === "american_cheese") return "MELTED CHEDDAR CHEESE LAYER";
      return `MELTED ${(ch?.name ?? "CHEDDAR").toUpperCase()}`;
    }
    case "patty":
      return "GRILLED BEEF PATTY";
    case "chicken":
      return "CRISPY CHICKEN FILLET";
    case "nuggets":
      return "CRISPY CHICKEN NUGGETS";
    case "tomato":
      return "FRESH TOMATO SLICES";
    case "pickles":
      return "GLOSSY PICKLE SLICES";
    case "scotch_bonnet":
      return "SCOTCH BONNET PEPPERS";
    case "onion":
      return "PURPLE-RED ONION RINGS";
    case "caramelized_onions":
      return "CARAMELIZED ONIONS";
    case "lettuce":
      return "CRISP CURLY LETTUCE";
    case "sauce": {
      const sc = SAUCE_OPTIONS.find((s) => s.id === variant);
      return `${(sc?.name ?? "SIGNATURE").toUpperCase()} SAUCE`;
    }
    default:
      return kind.toUpperCase();
  }
}

// Convert any InstancedMesh children into a merged Mesh for universal .glb compatibility
function cloneGroupForGlbExport(source: THREE.Object3D): {
  exportRoot: THREE.Group;
  tempGeometries: THREE.BufferGeometry[];
} {
  const exportRoot = new THREE.Group();
  const tempGeometries: THREE.BufferGeometry[] = [];

  function cloneNode(node: THREE.Object3D, parent: THREE.Object3D) {
    if (!node.visible) return;
    if ((node as THREE.Sprite).isSprite) return; // skip steam sprites in GLB

    if ((node as THREE.InstancedMesh).isInstancedMesh) {
      const inst = node as THREE.InstancedMesh;
      const baked: THREE.BufferGeometry[] = [];
      for (let i = 0; i < inst.count; i++) {
        inst.getMatrixAt(i, _instMat);
        const g = inst.geometry.clone();
        g.applyMatrix4(_instMat);
        baked.push(g);
      }
      const merged = mergeGeometries(baked, false);
      baked.forEach((g) => g.dispose());
      if (merged) {
        tempGeometries.push(merged);
        const m = new THREE.Mesh(merged, inst.material);
        m.name = inst.name;
        m.position.copy(inst.position);
        m.rotation.copy(inst.rotation);
        m.scale.copy(inst.scale);
        parent.add(m);
      }
      return;
    }

    if ((node as THREE.Mesh).isMesh) {
      const srcMesh = node as THREE.Mesh;
      const m = new THREE.Mesh(srcMesh.geometry, srcMesh.material);
      m.name = srcMesh.name;
      m.position.copy(srcMesh.position);
      m.rotation.copy(srcMesh.rotation);
      m.scale.copy(srcMesh.scale);
      parent.add(m);
      return;
    }

    const g = new THREE.Group();
    g.name = node.name;
    g.position.copy(node.position);
    g.rotation.copy(node.rotation);
    g.scale.copy(node.scale);
    parent.add(g);
    for (const child of node.children) {
      cloneNode(child, g);
    }
  }

  for (const child of source.children) {
    cloneNode(child, exportRoot);
  }
  return { exportRoot, tempGeometries };
}

const BurgerStage = forwardRef<BurgerStageHandle, BurgerStageProps>(function BurgerStage(
  {
    build,
    explodeAmount,
    autoRotate,
    cameraPreset,
    presetVersion,
    studioTheme,
    showLabels = true,
    catalogItems = [],
    animationsEnabled = true,
    onHoverLayer,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const svgOverlayRef = useRef<SVGSVGElement>(null);
  const labelOverlayRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({
    build,
    explodeAmount,
    autoRotate,
    cameraPreset,
    presetVersion,
    studioTheme,
    showLabels,
    catalogItems,
    animationsEnabled,
    onHoverLayer,
  });
  stateRef.current = {
    build,
    explodeAmount,
    autoRotate,
    cameraPreset,
    presetVersion,
    studioTheme,
    showLabels,
    catalogItems,
    animationsEnabled,
    onHoverLayer,
  };

  const syncTriggerRef = useRef<(() => void) | null>(null);
  const presetTriggerRef = useRef<((preset: CameraPreset) => void) | null>(null);
  const themeTriggerRef = useRef<((theme: StudioTheme) => void) | null>(null);
  const exportActionsRef = useRef<BurgerStageHandle | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      exportPng: async () => {
        if (!exportActionsRef.current) return null;
        return exportActionsRef.current.exportPng();
      },
      exportGlbBuffer: async () => {
        if (!exportActionsRef.current) {
          throw new Error("3D scene is not ready yet.");
        }
        return exportActionsRef.current.exportGlbBuffer();
      },
      getBackdropCss: () => THEME_COLORS[stateRef.current.studioTheme].css,
    }),
    []
  );

  useEffect(() => {
    syncTriggerRef.current?.();
  }, [build, explodeAmount, catalogItems]);

  useEffect(() => {
    presetTriggerRef.current?.(cameraPreset);
  }, [cameraPreset, presetVersion]);

  useEffect(() => {
    themeTriggerRef.current?.(studioTheme);
  }, [studioTheme]);

  useEffect(() => {
    const container = containerRef.current;
    const svgRef = svgOverlayRef.current;
    const labelsRef = labelOverlayRef.current;
    if (!container || !svgRef || !labelsRef) return;
    const svgEl: SVGSVGElement = svgRef;
    const labelsEl: HTMLDivElement = labelsRef;

    const isSoftwareGl = detectSoftwareWebGL();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    let stageW = container.clientWidth || window.innerWidth;
    let stageH = container.clientHeight || window.innerHeight;
    renderer.setSize(stageW, stageH);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const initialTheme = THEME_COLORS[stateRef.current.studioTheme];
    scene.fog = new THREE.FogExp2(initialTheme.bg, 0.012);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    scene.environmentIntensity = 0.62;
    pmremGenerator.dispose();

    // Telephoto 85mm studio food-photography lens (minimal perspective distortion)
    const FOV_DEG = 28;
    const TAN_HALF_FOV = Math.tan(THREE.MathUtils.degToRad(FOV_DEG * 0.5));
    const camera = new THREE.PerspectiveCamera(
      FOV_DEG,
      stageW / Math.max(1, stageH),
      0.1,
      100
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 6.0;
    controls.maxDistance = 36;
    controls.minPolarAngle = 0.15;
    controls.maxPolarAngle = Math.PI * 0.78;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_ROTATE,
    };

    // Commercial Studio Softbox Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xfff4e6, 0x9b6e46, 0.88);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff0da, 2.25);
    keyLight.position.set(-4.8, 8.2, 6.2);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 28;
    keyLight.shadow.camera.left = -4.8;
    keyLight.shadow.camera.right = 4.8;
    keyLight.shadow.camera.top = 7.8;
    keyLight.shadow.camera.bottom = -3.5;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffe4be, 1.35);
    rimLight.position.set(4.5, 4.5, -5.5);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xfff5ea, 0.65);
    fillLight.position.set(5.2, 2.2, 4.8);
    scene.add(fillLight);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const mainSoftbox = new THREE.RectAreaLight(0xfff5e6, 3.2, 6, 6);
      mainSoftbox.position.set(-3.2, 5.2, 5.2);
      mainSoftbox.lookAt(0, 2.7, 0);
      scene.add(mainSoftbox);
    }

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const tex = createBurgerTextures(maxAniso);

    const shadowGeo = new THREE.PlaneGeometry(5.8, 5.8);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: tex.shadowMap,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.position.y = -0.38;
    scene.add(shadowPlane);

    const burgerRoot = new THREE.Group();
    scene.add(burgerRoot);

    const floatGroup = new THREE.Group();
    burgerRoot.add(floatGroup);

    const sidesGroup = new THREE.Group();
    scene.add(sidesGroup);

    const friesGroup = createFriesSide(tex, false);
    friesGroup.position.set(-2.95, -0.36, -0.45);
    friesGroup.rotation.y = 0.32;
    friesGroup.visible = false;
    sidesGroup.add(friesGroup);

    const seasonedFriesGroup = createFriesSide(tex, true);
    seasonedFriesGroup.position.set(2.95, -0.36, -0.45);
    seasonedFriesGroup.rotation.y = -0.28;
    seasonedFriesGroup.visible = false;
    sidesGroup.add(seasonedFriesGroup);

    // Rising Steam Particles
    const steamCount = 9;
    const steamGroup = new THREE.Group();
    floatGroup.add(steamGroup);
    const steamSprites: THREE.Sprite[] = [];
    const steamData = Array.from({ length: steamCount }, (_, idx) => ({
      phase: idx / steamCount,
      xOff: Math.sin(idx * 2.4) * 1.15,
      zOff: Math.cos(idx * 3.1) * 0.75,
      speed: 0.22 + (idx % 3) * 0.05,
      scaleBase: 1.1 + (idx % 4) * 0.22,
    }));

    for (let i = 0; i < steamCount; i++) {
      const sMat = new THREE.SpriteMaterial({
        map: tex.steamMap,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(sMat);
      steamGroup.add(sprite);
      steamSprites.push(sprite);
    }

    const layerMap = new Map<string, LayerEntry>();
    const labelPool = new Map<string, LabelPoolNode>();
    let stackCenterY = 2.7;
    let stackTotalHeight = 5.6;
    let hotZoneY = 2.8;
    let userManualZoom = false;

    function computeIdealDistance(): number {
      const aspect = stageW / Math.max(1, stageH);
      const halfH = Math.max(2.7, (stackTotalHeight + 1.1) * 0.52);
      const distH = (halfH / TAN_HALF_FOV) * 1.24;
      // Leave horizontal margin so leader-line callout labels fit comfortably on both sides
      const halfW = stateRef.current.showLabels ? (stageW < 520 ? 3.2 : 3.7) : 2.3;
      const distW = halfW / (TAN_HALF_FOV * Math.max(0.45, aspect));
      return THREE.MathUtils.clamp(Math.max(distH, distW), 11.5, 32);
    }

    function buildKeySequence(b: BurgerBuildState): LayerSpec[] {
      const catalog = stateRef.current.catalogItems;
      const itemMap = new Map(catalog.map((it) => [it.id, it]));
      const resolveVisual = (id: string) => itemMap.get(id)?.visualKey || id;
      const resolveCustomLabel = (id: string) => itemMap.get(id)?.name?.toUpperCase();

      const bunVisual = resolveVisual(b.bun);
      const raw: Array<{ key: string; kind: string; variant: string; customLabel?: string }> = [
        {
          key: `bunBottom-${b.bun}`,
          kind: "bunBottom",
          variant: bunVisual,
          customLabel: itemMap.has(b.bun) && b.bun !== bunVisual ? `BOTTOM ${resolveCustomLabel(b.bun)}` : undefined,
        },
      ];

      const toppingsEntries = Object.entries(b.toppings as Record<string, number | undefined>).filter(
        ([k, v]) => k !== "bacon" && (v ?? 0) > 0
      );
      for (const [tid, qty] of toppingsEntries) {
        const count = qty ?? 0;
        const vis = resolveVisual(tid);
        const mappedKind =
          vis === "lettuce" ||
          vis === "onion" ||
          vis === "caramelized_onions" ||
          vis === "pickles" ||
          vis === "scotch_bonnet" ||
          vis === "tomato"
            ? vis
            : vis === "american_cheese"
              ? "cheese"
              : "tomato";
        for (let i = 0; i < count; i++) {
          if (vis === "bacon") {
            continue;
          }
          raw.push({
            key: `${tid}-${i}`,
            kind: mappedKind,
            variant: vis,
            customLabel: itemMap.has(tid) && tid !== vis ? resolveCustomLabel(tid) : undefined,
          });
        }
      }

      const meatEntries = Object.entries(b.meats as Record<string, number | undefined>).filter(
        ([, v]) => (v ?? 0) > 0
      );
      for (const [mid, qty] of meatEntries) {
        const count = qty ?? 0;
        const vis = resolveVisual(mid);
        const customLbl = itemMap.has(mid) && mid !== vis ? resolveCustomLabel(mid) : undefined;
        for (let i = 0; i < count; i++) {
          if (vis === "double_beef") {
            raw.push({ key: `${mid}-${i}-a`, kind: "patty", variant: "beef", customLabel: customLbl });
            raw.push({ key: `${mid}-${i}-b`, kind: "patty", variant: "beef", customLabel: customLbl });
          } else if (vis === "beef" || (vis !== "chicken" && vis !== "nuggets")) {
            raw.push({ key: `${mid}-${i}`, kind: "patty", variant: "beef", customLabel: customLbl });
          } else {
            raw.push({ key: `${mid}-${i}`, kind: vis, variant: vis, customLabel: customLbl });
          }
        }
      }

      const cheeseEntries = Object.entries(b.cheeses as Record<string, number | undefined>).filter(
        ([, v]) => (v ?? 0) > 0
      );
      for (const [cid, qty] of cheeseEntries) {
        const count = qty ?? 0;
        const vis = resolveVisual(cid);
        const customLbl = itemMap.has(cid) && cid !== vis ? resolveCustomLabel(cid) : undefined;
        for (let i = 0; i < count; i++) {
          raw.push({ key: `cheese-${cid}-${i}`, kind: "cheese", variant: vis, customLabel: customLbl });
        }
      }

      const baconEntries = Object.entries(b.toppings as Record<string, number | undefined>).filter(
        ([k, v]) => (k === "bacon" || resolveVisual(k) === "bacon") && (v ?? 0) > 0
      );
      for (const [bid, qty] of baconEntries) {
        const count = qty ?? 0;
        const customLbl = itemMap.has(bid) && bid !== "bacon" ? resolveCustomLabel(bid) : undefined;
        for (let i = 0; i < count; i++) {
          raw.push({ key: `${bid}-${i}`, kind: "bacon", variant: "bacon", customLabel: customLbl });
        }
      }

      const sauceEntries = Object.entries(b.sauces as Record<string, number | undefined>).filter(
        ([, v]) => (v ?? 0) > 0
      );
      for (const [sid, qty] of sauceEntries) {
        const count = qty ?? 0;
        const vis = resolveVisual(sid);
        const customLbl = itemMap.has(sid) && sid !== vis ? resolveCustomLabel(sid) : undefined;
        for (let i = 0; i < count; i++) {
          raw.push({ key: `sauce-${sid}-${i}`, kind: "sauce", variant: vis, customLabel: customLbl });
        }
      }

      raw.push({
        key: `bunTop-${b.bun}`,
        kind: "bunTop",
        variant: bunVisual,
        customLabel: itemMap.has(b.bun) && b.bun !== bunVisual ? `TOP ${resolveCustomLabel(b.bun)}` : undefined,
      });

      // Count occurrences by kind so stacked duplicates get UPPER / LOWER prefixes like the reference diagram
      const kindTotals = new Map<string, number>();
      for (const item of raw) {
        kindTotals.set(item.kind, (kindTotals.get(item.kind) ?? 0) + 1);
      }
      const kindSeen = new Map<string, number>();

      // Assign editorial side placement: Top & Bottom buns on right with angled elbows; middle layers alternate right/left cleanly
      let middleIdx = 0;
      return raw.map((item) => {
        const total = kindTotals.get(item.kind) ?? 1;
        const idxInKind = kindSeen.get(item.kind) ?? 0;
        kindSeen.set(item.kind, idxInKind + 1);

        let calloutText = item.customLabel || getBaseCalloutName(item.kind, item.variant);
        if (total === 2 && item.kind !== "bunTop" && item.kind !== "bunBottom") {
          calloutText = `${idxInKind === 1 ? "UPPER" : "LOWER"} ${calloutText}`;
        } else if (total > 2 && item.kind !== "bunTop" && item.kind !== "bunBottom") {
          calloutText = `${calloutText} #${idxInKind + 1}`;
        }

        let side: "left" | "right" = "right";
        let elbow: "top" | "bottom" | "flat" = "flat";
        if (item.kind === "bunTop") {
          side = "right";
          elbow = "top";
        } else if (item.kind === "bunBottom") {
          side = "right";
          elbow = "bottom";
        } else {
          // Alternate sides on middle ingredients so labels never crowd on one side
          side = middleIdx % 2 === 0 ? "right" : "left";
          middleIdx++;
        }

        const anchorCfg = CALLOUT_ANCHORS[item.kind] ?? { anchorY: 0.2, edgeR: 1.3 };
        return {
          ...item,
          calloutText,
          side,
          elbow,
          anchorY: anchorCfg.anchorY,
          edgeR: anchorCfg.edgeR,
        };
      });
    }

    function ensureLabelNode(key: string): LabelPoolNode {
      let node = labelPool.get(key);
      if (!node) {
        const ns = "http://www.w3.org/2000/svg";
        const polyline = document.createElementNS(ns, "polyline");
        polyline.setAttribute("fill", "none");
        polyline.setAttribute("stroke-width", "1.15");
        polyline.setAttribute("stroke-linecap", "round");
        polyline.setAttribute("stroke-linejoin", "round");

        const dot = document.createElementNS(ns, "circle");
        dot.setAttribute("r", "2.4");

        svgEl.appendChild(polyline);
        svgEl.appendChild(dot);

        const box = document.createElement("div");
        box.style.position = "absolute";
        box.style.top = "0";
        box.style.left = "0";
        box.style.pointerEvents = "none";
        box.style.fontFamily = '"Barlow", system-ui, sans-serif';
        box.style.fontWeight = "700";
        box.style.letterSpacing = "0.06em";
        box.style.lineHeight = "1.15";
        box.style.textTransform = "uppercase";
        box.style.transformOrigin = "0 50%";
        labelsEl.appendChild(box);

        node = { polyline, dot, box };
        labelPool.set(key, node);
      }
      return node;
    }

    function removeLabelNode(key: string) {
      const node = labelPool.get(key);
      if (!node) return;
      node.polyline.remove();
      node.dot.remove();
      node.box.remove();
      labelPool.delete(key);
    }

    function syncLayers() {
      const { build: b, explodeAmount: ex } = stateRef.current;
      const desired = buildKeySequence(b);
      const desiredKeys = new Set(desired.map((d) => d.key));

      layerMap.forEach((entry, key) => {
        if (!desiredKeys.has(key)) {
          entry.removing = true;
          entry.targetScale = 0.2;
          entry.targetY = entry.currentY + 1.8;
          removeLabelNode(key);
        }
      });

      let cursorY = 0;
      let pattyY = -1;
      for (let idx = 0; idx < desired.length; idx++) {
        const spec = desired[idx];
        const spacing = LAYER_SPACING[spec.kind] ?? { stacked: 0.2, exploded: 0.55 };
        const stepH = THREE.MathUtils.lerp(spacing.stacked, spacing.exploded, ex);

        let entry = layerMap.get(spec.key);
        if (!entry) {
          const group = buildLayerGroup(spec.kind, spec.variant, tex);
          group.userData.layerLabel = spec.calloutText;
          group.traverse((child) => {
            child.userData.layerLabel = spec.calloutText;
          });
          floatGroup.add(group);
          entry = {
            key: spec.key,
            kind: spec.kind,
            group,
            targetY: cursorY,
            currentY: cursorY + 2.2,
            targetScale: 1,
            currentScale: 0.72,
            removing: false,
            calloutText: spec.calloutText,
            side: spec.side,
            elbow: spec.elbow,
            anchorY: spec.anchorY,
            edgeR: spec.edgeR,
          };
          group.position.y = entry.currentY;
          group.scale.setScalar(entry.currentScale);
          layerMap.set(spec.key, entry);
        } else {
          entry.removing = false;
          entry.targetScale = 1;
          entry.targetY = cursorY;
          entry.calloutText = spec.calloutText;
          entry.side = spec.side;
          entry.elbow = spec.elbow;
          entry.anchorY = spec.anchorY;
          entry.edgeR = spec.edgeR;
        }

        const labelNode = ensureLabelNode(spec.key);
        labelNode.box.textContent = spec.calloutText;

        if (
          spec.kind === "patty" ||
          spec.kind === "chicken" ||
          spec.kind === "nuggets" ||
          spec.kind === "cheese"
        ) {
          pattyY = cursorY;
        }
        cursorY += stepH;
      }

      stackTotalHeight = Math.max(2.2, cursorY);
      stackCenterY = stackTotalHeight * 0.48;
      hotZoneY = pattyY >= 0 ? pattyY + 0.35 : stackCenterY;

      const sideCatalogMap = new Map(stateRef.current.catalogItems.map((it) => [it.id, it.visualKey]));
      const activeSideVisuals = Object.entries(b.sides as Record<string, number | undefined>)
        .filter(([, q]) => (q ?? 0) > 0)
        .map(([id]) => sideCatalogMap.get(id) || id);
      friesGroup.visible = activeSideVisuals.includes("fries");
      seasonedFriesGroup.visible = activeSideVisuals.includes("seasoned_fries");
    }

    syncTriggerRef.current = syncLayers;
    syncLayers();

    // Initial auto-fitted camera position
    const initDist = computeIdealDistance();
    camera.position.set(0.25, stackCenterY + 0.35, initDist);
    controls.target.set(0, stackCenterY, 0);
    controls.update();

    let lastCallouts: ProjectedCallout[] = [];

    function updateCallouts() {
      const show = stateRef.current.showLabels;
      svgEl.style.display = show ? "block" : "none";
      labelsEl.style.display = show ? "block" : "none";
      if (!show) {
        lastCallouts = [];
        return;
      }

      const theme = THEME_COLORS[stateRef.current.studioTheme];
      const isNarrow = stageW < 540;
      const fontSize = isNarrow ? 9 : stageW < 900 ? 10 : 11;
      const maxLabelW = isNarrow ? 100 : 142;
      const minGap = isNarrow ? 26 : 34;
      const topSafe = isNarrow ? 58 : 70;
      const bottomSafe = stageH - (isNarrow ? 18 : 26);

      _camRight.setFromMatrixColumn(camera.matrixWorld, 0).normalize();

      const leftItems: ProjectedCallout[] = [];
      const rightItems: ProjectedCallout[] = [];

      layerMap.forEach((entry) => {
        if (entry.removing) return;
        const sign = entry.side === "left" ? -1 : 1;
        const worldY = floatGroup.position.y + entry.currentY + entry.anchorY * entry.currentScale;
        _worldAnchor
          .copy(_camRight)
          .multiplyScalar(sign * entry.edgeR * entry.currentScale);
        _worldAnchor.y += worldY;

        _projVec.copy(_worldAnchor).project(camera);
        const ax = (_projVec.x * 0.5 + 0.5) * stageW;
        const ay = (-_projVec.y * 0.5 + 0.5) * stageH;

        const arm = isNarrow ? 24 : 44;
        const diagY = entry.elbow === "top" ? (isNarrow ? -20 : -28) : entry.elbow === "bottom" ? (isNarrow ? 20 : 28) : 0;
        const diagX = entry.elbow === "flat" ? 0 : sign * (isNarrow ? 16 : 24);

        const elbowX = ax + diagX;
        const elbowY = ay + diagY;
        const rawLx =
          entry.side === "right"
            ? Math.min(stageW - maxLabelW - 10, Math.max(elbowX + arm, stageW * 0.5 + (isNarrow ? 44 : 88)))
            : Math.max(maxLabelW + 10, Math.min(elbowX - arm, stageW * 0.5 - (isNarrow ? 44 : 88)));

        const item: ProjectedCallout = {
          entry,
          ax,
          ay,
          lx: rawLx,
          ly: elbowY,
          elbowX,
          elbowY,
          side: entry.side,
          elbow: entry.elbow,
        };
        if (entry.side === "left") leftItems.push(item);
        else rightItems.push(item);
      });

      const resolveColumn = (items: ProjectedCallout[]) => {
        items.sort((a, b) => a.ly - b.ly);
        for (let i = 0; i < items.length; i++) {
          items[i].ly = THREE.MathUtils.clamp(items[i].ly, topSafe, bottomSafe);
          if (i > 0 && items[i].ly - items[i - 1].ly < minGap) {
            items[i].ly = items[i - 1].ly + minGap;
          }
        }
        // Push upward pass if bottom overflowed
        for (let i = items.length - 1; i >= 0; i--) {
          if (items[i].ly > bottomSafe) {
            items[i].ly = bottomSafe;
          }
          if (i > 0 && items[i].ly - items[i - 1].ly < minGap) {
            items[i - 1].ly = Math.max(topSafe, items[i].ly - minGap);
          }
        }
      };

      resolveColumn(leftItems);
      resolveColumn(rightItems);

      const all = [...rightItems, ...leftItems];
      lastCallouts = all;

      for (const item of all) {
        const node = labelPool.get(item.entry.key);
        if (!node) continue;

        const opacity = THREE.MathUtils.clamp((item.entry.currentScale - 0.3) / 0.7, 0, 1);
        node.polyline.setAttribute("stroke", theme.lineColor);
        node.polyline.setAttribute("opacity", opacity.toFixed(2));
        node.dot.setAttribute("fill", theme.dotColor);
        node.dot.setAttribute("opacity", opacity.toFixed(2));
        node.dot.setAttribute("cx", item.ax.toFixed(1));
        node.dot.setAttribute("cy", item.ay.toFixed(1));

        const pts =
          item.elbow === "flat"
            ? `${item.ax.toFixed(1)},${item.ay.toFixed(1)} ${(item.ax + (item.side === "right" ? 12 : -12)).toFixed(1)},${item.ly.toFixed(1)} ${item.lx.toFixed(1)},${item.ly.toFixed(1)}`
            : `${item.ax.toFixed(1)},${item.ay.toFixed(1)} ${item.elbowX.toFixed(1)},${item.ly.toFixed(1)} ${item.lx.toFixed(1)},${item.ly.toFixed(1)}`;
        node.polyline.setAttribute("points", pts);

        const box = node.box;
        box.style.color = theme.labelColor;
        box.style.textShadow = theme.labelShadow;
        box.style.fontSize = `${fontSize}px`;
        box.style.maxWidth = `${maxLabelW}px`;
        box.style.opacity = opacity.toFixed(2);
        if (item.side === "right") {
          box.style.textAlign = "left";
          box.style.transform = `translate3d(${(item.lx + 7).toFixed(1)}px, ${item.ly.toFixed(1)}px, 0) translateY(-50%)`;
        } else {
          box.style.textAlign = "right";
          box.style.transform = `translate3d(${(item.lx - 7).toFixed(1)}px, ${item.ly.toFixed(1)}px, 0) translate(-100%, -50%)`;
        }
      }
    }

    // Export actions (PNG studio snapshot & GLB 3D binary)
    exportActionsRef.current = {
      getBackdropCss: () => THEME_COLORS[stateRef.current.studioTheme].css,
      exportPng: async () => {
        renderer.render(scene, camera);
        updateCallouts();
        const srcCanvas = renderer.domElement;
        const out = document.createElement("canvas");
        out.width = srcCanvas.width;
        out.height = srcCanvas.height;
        const ctx = out.getContext("2d");
        if (!ctx) return null;

        const theme = THEME_COLORS[stateRef.current.studioTheme];
        const [c0, c1, c2] = theme.gradientStops;
        const cx = out.width * 0.5;
        const cy = out.height * 0.42;
        const grad = ctx.createRadialGradient(
          cx,
          cy,
          out.width * 0.04,
          cx,
          cy,
          Math.max(out.width, out.height) * 0.75
        );
        grad.addColorStop(0, c0);
        grad.addColorStop(0.58, c1);
        grad.addColorStop(1, c2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(srcCanvas, 0, 0);

        if (stateRef.current.showLabels && lastCallouts.length > 0) {
          const sx = out.width / Math.max(1, stageW);
          const sy = out.height / Math.max(1, stageH);
          const fontPx = Math.round(11 * sx);
          ctx.font = `700 ${fontPx}px Barlow, system-ui, sans-serif`;
          ctx.lineWidth = Math.max(1.2, 1.15 * sx);
          for (const item of lastCallouts) {
            ctx.strokeStyle = theme.lineColor;
            ctx.beginPath();
            ctx.moveTo(item.ax * sx, item.ay * sy);
            if (item.elbow === "flat") {
              ctx.lineTo((item.ax + (item.side === "right" ? 12 : -12)) * sx, item.ly * sy);
            } else {
              ctx.lineTo(item.elbowX * sx, item.ly * sy);
            }
            ctx.lineTo(item.lx * sx, item.ly * sy);
            ctx.stroke();

            ctx.fillStyle = theme.dotColor;
            ctx.beginPath();
            ctx.arc(item.ax * sx, item.ay * sy, 2.5 * sx, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = theme.labelColor;
            ctx.textBaseline = "middle";
            ctx.textAlign = item.side === "right" ? "left" : "right";
            const tx = (item.lx + (item.side === "right" ? 7 : -7)) * sx;
            ctx.fillText(item.entry.calloutText, tx, item.ly * sy);
          }
        }

        return new Promise<Blob | null>((resolve) => {
          out.toBlob((blob) => resolve(blob), "image/png");
        });
      },
      exportGlbBuffer: async () => {
        const exportAssembly = new THREE.Group();
        exportAssembly.name = "SpeedyBurger3D";

        const { exportRoot: burgerClone, tempGeometries: burgerTemp } =
          cloneGroupForGlbExport(floatGroup);
        exportAssembly.add(burgerClone);

        const sidesTemps: THREE.BufferGeometry[] = [];
        if (sidesGroup.children.some((c) => c.visible)) {
          const { exportRoot: sidesClone, tempGeometries } =
            cloneGroupForGlbExport(sidesGroup);
          exportAssembly.add(sidesClone);
          sidesTemps.push(...tempGeometries);
        }

        const exporter = new GLTFExporter();
        return new Promise<ArrayBuffer>((resolve, reject) => {
          exporter.parse(
            exportAssembly,
            (result) => {
              burgerTemp.forEach((g) => g.dispose());
              sidesTemps.forEach((g) => g.dispose());
              if (result instanceof ArrayBuffer) {
                resolve(result);
              } else {
                const json = JSON.stringify(result);
                resolve(new TextEncoder().encode(json).buffer);
              }
            },
            (err) => {
              burgerTemp.forEach((g) => g.dispose());
              sidesTemps.forEach((g) => g.dispose());
              reject(err);
            },
            { binary: true }
          );
        });
      },
    };

    let transitionActive = false;
    function applyCameraPreset(preset: CameraPreset) {
      transitionActive = true;
      userManualZoom = false;
      const dist = computeIdealDistance();
      const center = stackCenterY;
      _camGoalTarget.set(0, center, 0);
      if (preset === "photo") {
        _camGoalPos.set(0.25, center + 0.35, dist);
      } else if (preset === "hero") {
        _camGoalPos.set(dist * 0.38, center + 2.4, dist * 0.84);
      } else if (preset === "top") {
        _camGoalPos.set(0, center + dist * 0.85, dist * 0.22);
      } else if (preset === "under") {
        _camGoalPos.set(dist * 0.18, center - 3.2, dist * 0.86);
      }
    }
    presetTriggerRef.current = applyCameraPreset;

    function applyTheme(theme: StudioTheme) {
      const cfg = THEME_COLORS[theme];
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.setHex(cfg.bg);
      }
      if (bgRef.current) {
        bgRef.current.style.background = cfg.css;
      }
    }
    themeTriggerRef.current = applyTheme;
    applyTheme(stateRef.current.studioTheme);

    const handleControlsStart = () => {
      transitionActive = false;
      userManualZoom = true;
    };
    controls.addEventListener("start", handleControlsStart);

    let lastRaycast = 0;
    let lastHovered: string | null = null;
    const inspectAtPointer = (ev: PointerEvent, throttle: boolean) => {
      if (throttle) {
        const now = performance.now();
        if (now - lastRaycast < 50) return;
        lastRaycast = now;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_mouse, camera);
      const hits = _raycaster.intersectObjects(floatGroup.children, true);
      let label: string | null = null;
      for (const hit of hits) {
        if (hit.object.userData?.layerLabel) {
          label = hit.object.userData.layerLabel;
          break;
        }
      }
      if (label !== lastHovered) {
        lastHovered = label;
        renderer.domElement.style.cursor = label ? "grab" : "default";
        stateRef.current.onHoverLayer(label);
      }
    };
    const handlePointerMove = (ev: PointerEvent) => {
      if (ev.pointerType === "touch") return;
      inspectAtPointer(ev, true);
    };
    const handlePointerDown = (ev: PointerEvent) => {
      inspectAtPointer(ev, false);
    };
    const handlePointerLeave = () => {
      if (lastHovered !== null) {
        lastHovered = null;
        renderer.domElement.style.cursor = "default";
        stateRef.current.onHoverLayer(null);
      }
    };
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const updateSize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      if (w < 10 || h < 10) return;
      stageW = w;
      stageH = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    window.addEventListener("resize", updateSize);

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const _offsetVec = new THREE.Vector3();

    function tick() {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      layerMap.forEach((entry, key) => {
        const lambda = entry.removing ? 12 : 9;
        entry.currentY = THREE.MathUtils.damp(entry.currentY, entry.targetY, lambda, dt);
        entry.currentScale = THREE.MathUtils.damp(
          entry.currentScale,
          entry.targetScale,
          lambda,
          dt
        );
        entry.group.position.y = entry.currentY;
        entry.group.scale.setScalar(entry.currentScale);

        if (entry.removing && entry.currentScale < 0.25) {
          floatGroup.remove(entry.group);
          disposeObject3D(entry.group);
          layerMap.delete(key);
        }
      });

      const animOff = reducedMotion || !stateRef.current.animationsEnabled;
      const bob = animOff ? 0 : Math.sin(elapsed * 1.45) * 0.085;
      floatGroup.position.y = bob;
      const shadowScale = 1 - bob * 0.45;
      shadowPlane.scale.set(shadowScale, 1, shadowScale);
      shadowMat.opacity = 0.85 - bob * 0.4;

      const { build: b, explodeAmount: ex } = stateRef.current;
      const hasHot =
        Object.values(b.meats).some((v) => (v ?? 0) > 0) ||
        Object.values(b.cheeses).some((v) => (v ?? 0) > 0) ||
        (b.toppings.bacon ?? 0) > 0;
      steamGroup.visible = hasHot && !animOff;
      if (steamGroup.visible) {
        const steamBaseY = hotZoneY;
        for (let i = 0; i < steamCount; i++) {
          const d = steamData[i];
          const t = (d.phase + elapsed * d.speed) % 1;
          const sprite = steamSprites[i];
          sprite.position.set(
            d.xOff + Math.sin(elapsed * 1.1 + i) * 0.2,
            steamBaseY + t * (1.2 + ex * 0.9),
            d.zOff + Math.cos(elapsed * 0.9 + i) * 0.15
          );
          const s = d.scaleBase * (0.7 + t * 0.95);
          sprite.scale.set(s, s * 1.25, 1);
          const fadeIn = Math.min(t * 4, 1);
          const fadeOut = Math.pow(1 - t, 1.4);
          (sprite.material as THREE.SpriteMaterial).opacity =
            fadeIn * fadeOut * (0.28 + ex * 0.14);
        }
      }

      if (!transitionActive) {
        controls.target.y = THREE.MathUtils.damp(controls.target.y, stackCenterY, 5.5, dt);
        if (!userManualZoom) {
          const desiredDist = computeIdealDistance();
          _offsetVec.copy(camera.position).sub(controls.target);
          const curDist = _offsetVec.length();
          if (curDist > 0.01) {
            const nextDist = THREE.MathUtils.damp(curDist, desiredDist, 5.5, dt);
            _offsetVec.multiplyScalar(nextDist / curDist);
            camera.position.copy(controls.target).add(_offsetVec);
          }
        }
      } else {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoalPos.x, 6, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoalPos.y, 6, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoalPos.z, 6, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, _camGoalTarget.y, 6, dt);
        if (camera.position.distanceTo(_camGoalPos) < 0.03) {
          transitionActive = false;
        }
      }

      controls.autoRotate = stateRef.current.autoRotate && !isSoftwareGl && !reducedMotion;
      controls.autoRotateSpeed = 1.6;
      controls.update();

      renderer.render(scene, camera);
      updateCallouts();

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      exportActionsRef.current = null;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateSize);
      controls.removeEventListener("start", handleControlsStart);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      labelPool.forEach((node) => {
        node.polyline.remove();
        node.dot.remove();
        node.box.remove();
      });
      labelPool.clear();
      controls.dispose();
      disposeObject3D(scene);
      tex.dispose();
      envTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        ref={bgRef}
        className="absolute inset-0 transition-colors duration-300"
        style={{ background: THEME_COLORS[studioTheme].css }}
      />
      <div ref={containerRef} className="relative w-full h-full" />
      <svg
        ref={svgOverlayRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full z-10"
      />
      <div
        ref={labelOverlayRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden z-10"
      />
    </div>
  );
});

export default BurgerStage;
