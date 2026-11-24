export function buildStandaloneBurgerHtml(params: {
  glbBase64: string;
  logoDataUri: string;
  backdropCss: string;
  orderLines: Array<{ label: string; amount: number }>;
  totalFormatted: string;
  whatsappUrl: string;
  comboName?: string;
}): string {
  const {
    glbBase64,
    logoDataUri,
    backdropCss,
    orderLines,
    totalFormatted,
    whatsappUrl,
    comboName,
  } = params;

  const summaryRows = orderLines
    .map(
      (l) =>
        `<div style="display:flex;justify-content:space-between;gap:16px"><span>${escapeHtml(
          l.label
        )}</span><b>${l.amount === 0 ? "Free" : "J$" + l.amount.toLocaleString("en-US")}</b></div>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Speedy Burger 3D – Interactive Burger</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@1,900&family=Barlow:wght@500;700&display=swap">
<style>
  *{box-sizing:border-box}
  html,body{margin:0;width:100%;height:100dvh;overflow:hidden;overscroll-behavior:none;font-family:Barlow,system-ui,sans-serif;background:${backdropCss};color:#3a0b08}
  #canvas-wrap{position:fixed;inset:0;touch-action:none}
  .brand{position:fixed;top:max(12px,env(safe-area-inset-top));left:12px;z-index:10;display:flex;align-items:center;gap:10px;background:#FDB105;padding:7px 12px;border-radius:14px;box-shadow:0 6px 20px rgba(58,11,8,.16)}
  .brand img{height:32px;width:auto;border-radius:6px}
  .brand h1{margin:0;font:900 24px/1 "Barlow Condensed",Impact,sans-serif;font-style:italic;color:#E1000F}
  .brand p{margin:2px 0 0;font-size:10px;font-weight:700;opacity:.8}
  .card{position:fixed;bottom:max(12px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:10;width:min(560px,calc(100vw - 20px));background:#fffaf2;border:1px solid rgba(58,11,8,.14);border-radius:16px;padding:12px 14px;box-shadow:0 12px 30px rgba(58,11,8,.18)}
  .card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(58,11,8,.12);padding-bottom:8px;margin-bottom:8px}
  .total{font:900 26px/1 "Barlow Condensed",Impact,sans-serif;font-style:italic;color:#E1000F}
  .lines{font-size:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:4px 14px;margin-bottom:10px;max-height:20dvh;overflow-y:auto}
  .actions{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
  .btn{display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;border-radius:12px;font-weight:700;font-size:13px;border:1px solid rgba(58,11,8,.2);background:transparent;color:#3a0b08;cursor:pointer;text-decoration:none}
  .btn.primary{background:#E1000F;border-color:#E1000F;color:#fff;font:900 18px/1 "Barlow Condensed",Impact,sans-serif;font-style:italic}
</style>
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.174.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/"
  }
}
</script>
</head>
<body>
<div id="canvas-wrap"></div>
<header class="brand">
  <img src="${logoDataUri}" alt="Speedy Burger">
  <div>
    <h1>Speedy Burger</h1>
    <p>Drag 360° · Pinch or scroll to zoom</p>
  </div>
</header>
<aside class="card">
  <div class="card-head">
    <strong>${comboName ? escapeHtml(comboName) : "Custom 3D Burger"}</strong>
    <span class="total">${escapeHtml(totalFormatted)}</span>
  </div>
  <div class="lines">${summaryRows}</div>
  <div class="actions">
    <button class="btn" id="spinBtn" type="button">Toggle Spin</button>
    <a class="btn primary" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener">Send order on WhatsApp</a>
  </div>
</aside>
<script type="module">
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const wrap = document.getElementById("canvas-wrap");
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
wrap.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.72;
pmrem.dispose();

const aspect = window.innerWidth / Math.max(1, window.innerHeight);
const distMult = aspect < 0.85 ? Math.min(1.55, Math.max(1, 0.82 / Math.max(0.45, aspect))) : 1;
const yOff = aspect < 0.85 ? -0.95 : 0;

const camera = new THREE.PerspectiveCamera(32, aspect, 0.1, 100);
camera.position.set(0.4, 3.6 + yOff, 11.4 * distMult);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };
controls.target.set(0, 2.55 + yOff, 0);

scene.add(new THREE.HemisphereLight(0xfff5e8, 0x9b6b42, 0.95));
const key = new THREE.DirectionalLight(0xfff1dc, 2.35);
key.position.set(4.5, 9.5, 5.5);
key.castShadow = true;
scene.add(key);
const rim = new THREE.DirectionalLight(0xffe0b2, 1.4);
rim.position.set(-4.5, 4.2, -5.5);
scene.add(rim);

const b64 = "${glbBase64}";
const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
const loader = new GLTFLoader();
let root = null;
loader.parse(bin.buffer, "", (gltf) => {
  root = gltf.scene;
  scene.add(root);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  controls.target.set(center.x, center.y + yOff, center.z);
  camera.position.set(0.4, center.y + 0.9 + yOff, 11.4 * distMult);
  controls.update();
});

document.getElementById("spinBtn").addEventListener("click", () => {
  controls.autoRotate = !controls.autoRotate;
  controls.autoRotateSpeed = 1.6;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  if (root) root.position.y = Math.sin(t * 1.45) * 0.08;
  controls.update();
  renderer.render(scene, camera);
}
animate();
</script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
