import * as THREE from 'three';
import {
  AutoRickshaw3DRig,
  createAutoRickshaw3DGroup,
} from './autoModel3D';
import {
  normalizeAngleDiff,
  ObstacleEntity,
  PowerUpType,
  RaceSessionState,
} from './rules';
import {
  CURB_WIDTH,
  getActiveTrack,
  getClosestTrackProjection,
  getTrackPointAtProgress,
  ROAD_HALF_WIDTH,
  TRACK_SAMPLES,
} from './track';

export type CameraMode = 'straight' | 'horizon' | 'overview';

interface Particle3D {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  active: boolean;
}

const ASSET_URLS = {
  grass: [
    '/assets/textures/grass.jpg',
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/terrain/grasslight-big.jpg',
  ],
  water: [
    '/assets/textures/water.jpg',
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/water.jpg',
  ],
  brick: [
    '/assets/textures/terracotta_brick.jpg',
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/brick_diffuse.jpg',
  ],
  wood: [
    '/assets/textures/wood.jpg',
    'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/hardwood2_diffuse.jpg',
  ],
};

function createSkyEquirectTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, '#0C4A6E');
    grad.addColorStop(0.32, '#0284C7');
    grad.addColorStop(0.58, '#38BDF8');
    grad.addColorStop(0.76, '#FDE68A');
    grad.addColorStop(0.88, '#FDBA74');
    grad.addColorStop(1.0, '#3F6212');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Soft clouds near horizon
    ctx.fillStyle = 'rgba(255, 251, 235, 0.22)';
    for (let i = 0; i < 18; i++) {
      const cx = (i * 73) % 512;
      const cy = 115 + ((i * 29) % 45);
      const rx = 28 + ((i * 19) % 36);
      const ry = 6 + ((i * 11) % 8);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createF1AsphaltRoadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Base dark F1 tarmac
    ctx.fillStyle = '#22252A';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle rubbered-in racing line groove in center of road
    const grooveGrad = ctx.createLinearGradient(0, 0, 512, 0);
    grooveGrad.addColorStop(0.0, 'rgba(15, 17, 21, 0.35)');
    grooveGrad.addColorStop(0.18, 'rgba(38, 41, 48, 0.0)');
    grooveGrad.addColorStop(0.5, 'rgba(12, 14, 18, 0.42)');
    grooveGrad.addColorStop(0.82, 'rgba(38, 41, 48, 0.0)');
    grooveGrad.addColorStop(1.0, 'rgba(15, 17, 21, 0.35)');
    ctx.fillStyle = grooveGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Fine stone aggregate micro-grain
    for (let i = 0; i < 7000; i++) {
      const x = (i * 97) % 512;
      const y = (i * 53 + Math.floor(i / 512) * 19) % 512;
      const shade = i % 3 === 0 ? 48 : i % 2 === 0 ? 22 : 34;
      ctx.fillStyle = `rgba(${shade}, ${shade + 2}, ${shade + 5}, 0.24)`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Crisp FIA white track-limit edge lines (left & right)
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(14, 0, 10, 512);
    ctx.fillRect(488, 0, 10, 512);

    // Subtle warm gold center racing dashes
    ctx.fillStyle = 'rgba(250, 204, 21, 0.72)';
    ctx.fillRect(252, 36, 8, 170);
    ctx.fillRect(252, 292, 8, 170);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createF1KerbTexture(
  primaryColor: string,
  secondaryColor: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = secondaryColor;
    ctx.fillRect(0, 128, 128, 128);

    // Subtle bevel & tire scuff marks on kerb edge
    const bevel = ctx.createLinearGradient(0, 0, 128, 0);
    bevel.addColorStop(0, 'rgba(0,0,0,0.28)');
    bevel.addColorStop(0.25, 'rgba(255,255,255,0.14)');
    bevel.addColorStop(0.85, 'rgba(0,0,0,0.08)');
    bevel.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = bevel;
    ctx.fillRect(0, 0, 128, 256);

    ctx.fillStyle = 'rgba(24, 24, 27, 0.35)';
    ctx.fillRect(0, 124, 128, 4);
    ctx.fillRect(0, 252, 128, 4);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createCheckeredTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const cols = 16;
    const rows = 4;
    const cw = 256 / cols;
    const ch = 64 / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#F8FAFC' : '#18181B';
        ctx.fillRect(c * cw, r * ch, cw, ch);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createGantryBannerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, 512, 96);
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 504, 88);

    ctx.fillStyle = '#DC2626';
    ctx.fillRect(14, 14, 96, 68);
    ctx.fillRect(402, 14, 96, 68);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('F1 GP', 62, 48);
    ctx.fillText('INDIA', 450, 48);

    ctx.fillStyle = '#FEF08A';
    ctx.font = '900 32px sans-serif';
    ctx.fillText('AUTO RALLY GP', 256, 50);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createRupeeCoinFaceTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(64, 64, 62, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#78350F';
    ctx.font = '900 68px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('₹', 64, 68);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export class WorldRenderer {
  private cameraMode: CameraMode = 'straight';

  private camPos = new THREE.Vector3(0, 80, 780);
  private camLookAt = new THREE.Vector3(120, 10, 780);
  private camHeading = 0;
  private camInitialized = false;

  // Full-Viewport Three.js WebGL Engine
  private webglCanvas: HTMLCanvasElement | null = null;
  private webglRenderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private autoRig: AutoRickshaw3DRig | null = null;
  private webglSupported = false;
  private currentRenderW = 0;
  private currentRenderH = 0;

  // Dynamic 3D Groups
  private trackGroup: THREE.Group | null = null;
  private coinsGroup: THREE.Group | null = null;
  private powerUpsGroup: THREE.Group | null = null;
  private obstaclesGroup: THREE.Group | null = null;
  private particlesGroup: THREE.Group | null = null;

  private coinMeshes = new Map<number, THREE.Group>();
  private powerUpMeshes = new Map<number, THREE.Group>();
  private obstacleMeshes = new Map<number, THREE.Group>();
  private gantryLightMeshes: THREE.Mesh[] = [];
  private particlePool: Particle3D[] = [];

  // Shared Loaded & Procedural Textures
  private grassTex: THREE.Texture | null = null;
  private waterTex: THREE.Texture | null = null;
  private brickTex: THREE.Texture | null = null;
  private woodTex: THREE.Texture | null = null;
  private asphaltTex: THREE.CanvasTexture | null = null;
  private checkeredTex: THREE.CanvasTexture | null = null;
  private gantryBannerTex: THREE.CanvasTexture | null = null;
  private coinFaceTex: THREE.CanvasTexture | null = null;
  private groundMaterial: THREE.MeshStandardMaterial | null = null;
  private lakeMaterial: THREE.MeshStandardMaterial | null = null;

  constructor() {
    this.initWebGLScene();
  }

  public getCameraMode(): CameraMode {
    return this.cameraMode;
  }

  public setCameraMode(mode: CameraMode): void {
    this.cameraMode = mode;
  }

  public cycleCameraMode(): CameraMode {
    if (this.cameraMode === 'straight') {
      this.cameraMode = 'horizon';
    } else if (this.cameraMode === 'horizon') {
      this.cameraMode = 'overview';
    } else {
      this.cameraMode = 'straight';
    }
    return this.cameraMode;
  }

  private loadTextureWithFallback(
    loader: THREE.TextureLoader,
    urls: string[],
    repeatX: number,
    repeatY: number,
    onLoaded: (tex: THREE.Texture) => void
  ): void {
    const tryLoad = (idx: number) => {
      if (idx >= urls.length) return;
      loader.load(
        urls[idx],
        (tex) => {
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          tex.repeat.set(repeatX, repeatY);
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.magFilter = THREE.LinearFilter;
          tex.anisotropy = 8;
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.needsUpdate = true;
          onLoaded(tex);
        },
        undefined,
        () => tryLoad(idx + 1)
      );
    };
    tryLoad(0);
  }

  private initWebGLScene(): void {
    if (typeof document === 'undefined') return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(1280, 720, false);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;

      const scene = new THREE.Scene();
      const skyTex = createSkyEquirectTexture();
      scene.background = skyTex;
      scene.fog = new THREE.FogExp2(0xdbeafe, 0.00038);

      const camera = new THREE.PerspectiveCamera(54, 1280 / 720, 4, 4800);

      // Warm realistic sunlight + sky-to-turf bounce illumination
      const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x3f6212, 1.05);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.55);
      sunLight.position.set(450, 900, 620);
      scene.add(sunLight);

      const fillLight = new THREE.DirectionalLight(0xbae6fd, 0.55);
      fillLight.position.set(-500, 420, -480);
      scene.add(fillLight);

      // Procedural & Real Web Textures
      this.asphaltTex = createF1AsphaltRoadTexture();
      this.checkeredTex = createCheckeredTexture();
      this.gantryBannerTex = createGantryBannerTexture();
      this.coinFaceTex = createRupeeCoinFaceTexture();

      // Immediate procedural turf texture so offline / file:// builds always have rich grass detail
      const grassCanvas = document.createElement('canvas');
      grassCanvas.width = 256;
      grassCanvas.height = 256;
      const gCtx = grassCanvas.getContext('2d');
      if (gCtx) {
        gCtx.fillStyle = '#3F6212';
        gCtx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 2400; i++) {
          const gx = (i * 73) % 256;
          const gy = (i * 41 + Math.floor(i / 256) * 17) % 256;
          gCtx.fillStyle = i % 2 === 0 ? '#4D7C0F' : '#365314';
          gCtx.fillRect(gx, gy, 3, 3);
        }
      }
      const fallbackGrass = new THREE.CanvasTexture(grassCanvas);
      fallbackGrass.wrapS = THREE.RepeatWrapping;
      fallbackGrass.wrapT = THREE.RepeatWrapping;
      fallbackGrass.repeat.set(95, 95);
      fallbackGrass.colorSpace = THREE.SRGBColorSpace;
      this.grassTex = fallbackGrass;

      if (
        typeof window !== 'undefined' &&
        window.location.protocol !== 'file:'
      ) {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');

        this.loadTextureWithFallback(
          loader,
          ASSET_URLS.grass,
          95,
          95,
          (tex) => {
            this.grassTex = tex;
            if (this.groundMaterial) {
              this.groundMaterial.map = tex;
              this.groundMaterial.color.set('#A3E635');
              this.groundMaterial.needsUpdate = true;
            }
          }
        );

        this.loadTextureWithFallback(loader, ASSET_URLS.water, 12, 8, (tex) => {
          this.waterTex = tex;
          if (this.lakeMaterial) {
            this.lakeMaterial.map = tex;
            this.lakeMaterial.needsUpdate = true;
          }
        });

        this.loadTextureWithFallback(loader, ASSET_URLS.brick, 4, 2, (tex) => {
          this.brickTex = tex;
        });

        this.loadTextureWithFallback(loader, ASSET_URLS.wood, 2, 2, (tex) => {
          this.woodTex = tex;
        });
      }

      // Distant Mountain & Stadium Horizon Ring
      this.buildHorizonBackdrop(scene);

      // Dynamic Scene Groups
      this.trackGroup = new THREE.Group();
      this.coinsGroup = new THREE.Group();
      this.powerUpsGroup = new THREE.Group();
      this.obstaclesGroup = new THREE.Group();
      this.particlesGroup = new THREE.Group();

      scene.add(this.trackGroup);
      scene.add(this.coinsGroup);
      scene.add(this.powerUpsGroup);
      scene.add(this.obstaclesGroup);
      scene.add(this.particlesGroup);

      // Player Small 3D Auto-Rickshaw Rig on the F1 Track
      const rig = createAutoRickshaw3DGroup();
      rig.root.scale.setScalar(0.86);

      // Soft contact shadow disc under the auto-rickshaw
      const shadowGeo = new THREE.CircleGeometry(18, 28);
      shadowGeo.rotateX(-Math.PI / 2);
      shadowGeo.scale(1.15, 1.0, 0.78);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x090a0f,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.position.set(-1.5, 0.08, 0);
      rig.root.add(shadowMesh);

      scene.add(rig.root);

      // Pre-allocate 3D Particle Pool
      const partGeo = new THREE.SphereGeometry(1.5, 8, 8);
      for (let i = 0; i < 65; i++) {
        const partMat = new THREE.MeshBasicMaterial({
          color: 0xfacc15,
          transparent: true,
          opacity: 0.9,
        });
        const mesh = new THREE.Mesh(partGeo, partMat);
        mesh.visible = false;
        this.particlesGroup.add(mesh);
        this.particlePool.push({
          mesh,
          vx: 0,
          vy: 0,
          vz: 0,
          life: 0,
          maxLife: 1,
          active: false,
        });
      }

      this.webglCanvas = canvas;
      this.webglRenderer = renderer;
      this.scene = scene;
      this.camera = camera;
      this.autoRig = rig;
      this.webglSupported = true;

      this.rebuildSceneryForActiveTrack();
    } catch {
      this.webglSupported = false;
    }
  }

  private buildHorizonBackdrop(scene: THREE.Scene): void {
    // Expansive Turf Ground Plane
    const groundGeo = new THREE.PlaneGeometry(12000, 12000);
    groundGeo.rotateX(-Math.PI / 2);
    this.groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x4d7c0f,
      roughness: 0.92,
      metalness: 0.02,
    });
    if (this.grassTex) {
      this.groundMaterial.map = this.grassTex;
      this.groundMaterial.color.set('#A3E635');
    }
    const groundMesh = new THREE.Mesh(groundGeo, this.groundMaterial);
    groundMesh.position.y = -0.2;
    scene.add(groundMesh);

    // Smooth Distant Rolling Hills & Foothills Ring around the F1 Circuit
    const hillMatDark = new THREE.MeshStandardMaterial({
      color: 0x365314,
      roughness: 0.92,
      metalness: 0.02,
    });
    const hillMatMid = new THREE.MeshStandardMaterial({
      color: 0x3f6212,
      roughness: 0.9,
      metalness: 0.02,
    });

    const numHills = 28;
    const ringRadius = 3100;
    const hillGeo = new THREE.SphereGeometry(1, 20, 14);
    for (let i = 0; i < numHills; i++) {
      const ang = (i / numHills) * Math.PI * 2;
      const dist = ringRadius + ((i * 173) % 380);
      const height = 135 + ((i * 67) % 110);
      const width = 460 + ((i * 97) % 220);

      const hill = new THREE.Mesh(
        hillGeo,
        i % 2 === 0 ? hillMatDark : hillMatMid
      );
      hill.scale.set(width, height, width * 0.65);
      hill.position.set(
        Math.cos(ang) * dist,
        -height * 0.25,
        Math.sin(ang) * dist
      );
      hill.rotation.y = -ang + Math.PI / 2;
      scene.add(hill);
    }
  }

  public rebuildSceneryForActiveTrack(): void {
    if (!this.webglSupported || !this.trackGroup) return;

    // Clear previous track meshes
    while (this.trackGroup.children.length > 0) {
      const child = this.trackGroup.children[0];
      this.trackGroup.remove(child);
    }
    this.gantryLightMeshes = [];
    this.coinMeshes.clear();
    this.powerUpMeshes.clear();
    this.obstacleMeshes.clear();
    if (this.coinsGroup) {
      while (this.coinsGroup.children.length > 0) {
        this.coinsGroup.remove(this.coinsGroup.children[0]);
      }
    }
    if (this.powerUpsGroup) {
      while (this.powerUpsGroup.children.length > 0) {
        this.powerUpsGroup.remove(this.powerUpsGroup.children[0]);
      }
    }
    if (this.obstaclesGroup) {
      while (this.obstaclesGroup.children.length > 0) {
        this.obstaclesGroup.remove(this.obstaclesGroup.children[0]);
      }
    }

    const activeTrack = getActiveTrack();
    const samples = TRACK_SAMPLES;
    const n = samples.length;
    if (n < 4) return;

    // Compute cumulative arc length for seamless texture tiling
    const arcLengths: number[] = [0];
    for (let i = 1; i <= n; i++) {
      const prev = samples[(i - 1) % n];
      const curr = samples[i % n];
      const segLen = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      arcLengths.push(arcLengths[i - 1] + segLen);
    }
    const totalLength = arcLengths[n] || 7000;

    // 1. 3D Asphalt & Gravel FIA Runoff Apron Ribbon
    const apronHalfW = ROAD_HALF_WIDTH + CURB_WIDTH + 24;
    const apronGeo = this.createRibbonGeometry(
      samples,
      arcLengths,
      -apronHalfW,
      apronHalfW,
      0.08,
      0.08,
      totalLength / 260
    );
    const apronMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    this.trackGroup.add(new THREE.Mesh(apronGeo, apronMat));

    // 2. 3D Raised Left & Right F1 Apex Rumble Kerbs
    const kerbTex = createF1KerbTexture(
      activeTrack.kerbPrimaryColor,
      activeTrack.kerbSecondaryColor
    );
    const kerbMat = new THREE.MeshStandardMaterial({
      map: kerbTex,
      roughness: 0.65,
      metalness: 0.08,
      side: THREE.DoubleSide,
    });

    const leftKerbGeo = this.createRibbonGeometry(
      samples,
      arcLengths,
      -(ROAD_HALF_WIDTH + CURB_WIDTH),
      -(ROAD_HALF_WIDTH - 3),
      1.6,
      0.38,
      totalLength / 68
    );
    const rightKerbGeo = this.createRibbonGeometry(
      samples,
      arcLengths,
      ROAD_HALF_WIDTH - 3,
      ROAD_HALF_WIDTH + CURB_WIDTH,
      0.38,
      1.6,
      totalLength / 68
    );
    this.trackGroup.add(new THREE.Mesh(leftKerbGeo, kerbMat));
    this.trackGroup.add(new THREE.Mesh(rightKerbGeo, kerbMat));

    // 3. 3D Main Grained F1 Asphalt Road Surface
    const roadGeo = this.createRibbonGeometry(
      samples,
      arcLengths,
      -ROAD_HALF_WIDTH,
      ROAD_HALF_WIDTH,
      0.35,
      0.35,
      totalLength / 190
    );
    const roadMat = new THREE.MeshStandardMaterial({
      map: this.asphaltTex,
      roughness: 0.72,
      metalness: 0.12,
      side: THREE.DoubleSide,
    });
    this.trackGroup.add(new THREE.Mesh(roadGeo, roadMat));

    // 4. 3D Checkered Start/Finish Strip & Staggered F1 Starting Grid Boxes
    this.buildStartFinishGridAndGantry();

    // 5. 3D Infield Oasis Lake with Real Water Texture
    this.buildInfieldLake(activeTrack.waterColor);

    // 6. 3D Trackside Grandstands, Tire Barriers & Trees
    this.buildTracksideScenery();
  }

  private createRibbonGeometry(
    samples: typeof TRACK_SAMPLES,
    arcLengths: number[],
    offsetLeft: number,
    offsetRight: number,
    yLeft: number,
    yRight: number,
    vRepeat: number
  ): THREE.BufferGeometry {
    const n = samples.length;
    const totalLen = arcLengths[n] || 1;
    const positions = new Float32Array((n + 1) * 2 * 3);
    const normals = new Float32Array((n + 1) * 2 * 3);
    const uvs = new Float32Array((n + 1) * 2 * 2);
    const indices: number[] = [];

    for (let i = 0; i <= n; i++) {
      const s = samples[i % n];
      const v = (arcLengths[i] / totalLen) * vRepeat;

      const lx = s.x + s.normalX * offsetLeft;
      const lz = s.y + s.normalY * offsetLeft;
      const rx = s.x + s.normalX * offsetRight;
      const rz = s.y + s.normalY * offsetRight;

      const vIdx = i * 2;
      positions[vIdx * 3 + 0] = lx;
      positions[vIdx * 3 + 1] = yLeft;
      positions[vIdx * 3 + 2] = lz;

      positions[(vIdx + 1) * 3 + 0] = rx;
      positions[(vIdx + 1) * 3 + 1] = yRight;
      positions[(vIdx + 1) * 3 + 2] = rz;

      normals[vIdx * 3 + 0] = 0;
      normals[vIdx * 3 + 1] = 1;
      normals[vIdx * 3 + 2] = 0;

      normals[(vIdx + 1) * 3 + 0] = 0;
      normals[(vIdx + 1) * 3 + 1] = 1;
      normals[(vIdx + 1) * 3 + 2] = 0;

      uvs[vIdx * 2 + 0] = 0;
      uvs[vIdx * 2 + 1] = v;

      uvs[(vIdx + 1) * 2 + 0] = 1;
      uvs[(vIdx + 1) * 2 + 1] = v;

      if (i < n) {
        const a = i * 2;
        const b = a + 1;
        const c = (i + 1) * 2;
        const d = c + 1;
        indices.push(a, b, c);
        indices.push(b, d, c);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return geo;
  }

  private buildStartFinishGridAndGantry(): void {
    if (!this.trackGroup) return;
    const startSample = TRACK_SAMPLES[0];

    // Checkered Start/Finish Line on Asphalt
    const checkGeo = new THREE.PlaneGeometry(ROAD_HALF_WIDTH * 1.92, 24);
    checkGeo.rotateX(-Math.PI / 2);
    const checkMat = new THREE.MeshStandardMaterial({
      map: this.checkeredTex,
      roughness: 0.6,
    });
    const checkMesh = new THREE.Mesh(checkGeo, checkMat);
    checkMesh.position.set(startSample.x, 0.44, startSample.y);
    checkMesh.rotation.y = -startSample.angle - Math.PI / 2;
    this.trackGroup.add(checkMesh);

    // 8 Staggered F1 Starting Grid Brackets on the Main Straight
    const bracketMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    for (let slot = 1; slot <= 8; slot++) {
      const prog = (1 - slot * 0.009 + 1) % 1;
      const sample = getTrackPointAtProgress(prog);
      const lat = slot % 2 === 1 ? -34 : 34;
      const bx = sample.x + sample.normalX * lat;
      const bz = sample.y + sample.normalY * lat;

      const boxGroup = new THREE.Group();
      boxGroup.position.set(bx, 0.45, bz);
      boxGroup.rotation.y = -sample.angle - Math.PI / 2;

      const frontLine = new THREE.Mesh(
        new THREE.BoxGeometry(28, 0.1, 2.6),
        bracketMat
      );
      const leftWing = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 0.1, 16),
        bracketMat
      );
      leftWing.position.set(-12.7, 0, 8);
      const rightWing = new THREE.Mesh(
        new THREE.BoxGeometry(2.6, 0.1, 16),
        bracketMat
      );
      rightWing.position.set(12.7, 0, 8);

      boxGroup.add(frontLine, leftWing, rightWing);
      this.trackGroup.add(boxGroup);
    }

    // 3D Formula 1 Start/Finish Gantry Bridge
    const gantry = new THREE.Group();
    gantry.position.set(startSample.x, 0, startSample.y);
    gantry.rotation.y = -startSample.angle - Math.PI / 2;

    const spanHalf = ROAD_HALF_WIDTH + CURB_WIDTH + 18;
    const gantryHeight = 92;
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.45,
      metalness: 0.65,
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.35,
      metalness: 0.4,
    });

    // Left & Right Vertical Towers
    const pillarGeo = new THREE.CylinderGeometry(4.2, 5.2, gantryHeight, 12);
    const leftPillar = new THREE.Mesh(pillarGeo, steelMat);
    leftPillar.position.set(-spanHalf, gantryHeight * 0.5, 0);
    const rightPillar = new THREE.Mesh(pillarGeo, steelMat);
    rightPillar.position.set(spanHalf, gantryHeight * 0.5, 0);

    // Overhead Crossbeam Truss
    const beamGeo = new THREE.BoxGeometry(spanHalf * 2 + 16, 11, 10);
    const beam = new THREE.Mesh(beamGeo, steelMat);
    beam.position.set(0, gantryHeight - 2, 0);

    const topTrim = new THREE.Mesh(
      new THREE.BoxGeometry(spanHalf * 2 + 18, 2.2, 11.5),
      goldTrimMat
    );
    topTrim.position.set(0, gantryHeight + 4.2, 0);

    // Banner Board facing approaching drivers (+Z in gantry local space)
    const bannerMat = new THREE.MeshBasicMaterial({
      map: this.gantryBannerTex,
    });
    const bannerFront = new THREE.Mesh(
      new THREE.PlaneGeometry(spanHalf * 1.55, 22),
      bannerMat
    );
    bannerFront.position.set(0, gantryHeight + 1, 5.6);

    const bannerBack = new THREE.Mesh(
      new THREE.PlaneGeometry(spanHalf * 1.55, 22),
      bannerMat
    );
    bannerBack.position.set(0, gantryHeight + 1, -5.6);
    bannerBack.rotation.y = Math.PI;

    gantry.add(
      leftPillar,
      rightPillar,
      beam,
      topTrim,
      bannerFront,
      bannerBack
    );

    // 5 Formula 1 Start Light Pods hanging under the gantry bridge
    const podGeo = new THREE.BoxGeometry(11, 15, 6);
    const lightSphereGeo = new THREE.SphereGeometry(2.8, 12, 12);
    for (let i = -2; i <= 2; i++) {
      const lx = i * 24;
      const pod = new THREE.Mesh(podGeo, steelMat);
      pod.position.set(lx, gantryHeight - 13, 2);
      gantry.add(pod);

      const redMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const topBulb = new THREE.Mesh(lightSphereGeo, redMat);
      topBulb.position.set(lx, gantryHeight - 10, 5.2);
      gantry.add(topBulb);

      const bottomMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      const bottomBulb = new THREE.Mesh(lightSphereGeo, bottomMat);
      bottomBulb.position.set(lx, gantryHeight - 16, 5.2);
      gantry.add(bottomBulb);
      this.gantryLightMeshes.push(bottomBulb);
    }

    this.trackGroup.add(gantry);
  }

  private buildInfieldLake(waterColor: string): void {
    if (!this.trackGroup) return;

    // Sandy Shoreline Ring
    const shoreGeo = new THREE.CircleGeometry(305, 48);
    shoreGeo.rotateX(-Math.PI / 2);
    shoreGeo.scale(1.0, 1.0, 0.54);
    const shoreMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.88,
    });
    const shore = new THREE.Mesh(shoreGeo, shoreMat);
    shore.position.set(-60, 0.06, 60);
    this.trackGroup.add(shore);

    // Reflective Water Surface
    const lakeGeo = new THREE.CircleGeometry(285, 48);
    lakeGeo.rotateX(-Math.PI / 2);
    lakeGeo.scale(1.0, 1.0, 0.52);
    this.lakeMaterial = new THREE.MeshStandardMaterial({
      color: waterColor,
      map: this.waterTex ?? null,
      roughness: 0.16,
      metalness: 0.38,
    });
    const lake = new THREE.Mesh(lakeGeo, this.lakeMaterial);
    lake.position.set(-60, 0.14, 60);
    this.trackGroup.add(lake);
  }

  private buildTracksideScenery(): void {
    if (!this.trackGroup) return;

    // 1. 3D Covered F1 Grandstands along the Main Straight & Key Sectors
    const grandstandSpots = [
      { prog: 0.96, side: 1, dist: 165 },
      { prog: 0.99, side: 1, dist: 165 },
      { prog: 0.02, side: 1, dist: 165 },
      { prog: 0.05, side: 1, dist: 165 },
      { prog: 0.97, side: -1, dist: 165 },
      { prog: 0.03, side: -1, dist: 165 },
      { prog: 0.34, side: 1, dist: 170 },
      { prog: 0.64, side: 1, dist: 170 },
    ];

    for (const spot of grandstandSpots) {
      const s = getTrackPointAtProgress(spot.prog);
      const gx = s.x + s.normalX * spot.side * spot.dist;
      const gz = s.y + s.normalY * spot.side * spot.dist;
      const stand = this.createGrandstandMesh();
      stand.position.set(gx, 0, gz);
      // Face toward the track
      stand.rotation.y =
        -s.angle + (spot.side > 0 ? Math.PI : 0);
      this.trackGroup.add(stand);
    }

    // 2. 3D Red-and-White F1 Tire Barrier Stacks on Sharp Corners
    const tirewallProgs = [
      0.11, 0.19, 0.28, 0.42, 0.51, 0.61, 0.74, 0.84, 0.91,
    ];
    for (const prog of tirewallProgs) {
      const s = getTrackPointAtProgress(prog);
      const wx = s.x + s.normalX * (ROAD_HALF_WIDTH + CURB_WIDTH + 22);
      const wz = s.y + s.normalY * (ROAD_HALF_WIDTH + CURB_WIDTH + 22);
      const wall = this.createTireBarrierMesh();
      wall.position.set(wx, 0, wz);
      wall.rotation.y = -s.angle - Math.PI / 2;
      this.trackGroup.add(wall);
    }

    // 3. 3D Lush Trees around the Circuit Outfield & Infield
    for (let i = 0; i < 64; i++) {
      const prog = (i / 64) % 1;
      // Leave start/finish grandstand zone clear
      if (prog > 0.94 || prog < 0.07) continue;
      const s = getTrackPointAtProgress(prog);
      const side = i % 3 === 0 ? -1 : 1;
      const dist = 175 + ((i * 47) % 140);
      const tx = s.x + s.normalX * side * dist;
      const tz = s.y + s.normalY * side * dist;

      // Avoid placing trees inside the infield lake
      if (Math.hypot(tx + 60, tz - 60) < 330) continue;
      // Avoid overlapping another part of the winding F1 track
      const proj = getClosestTrackProjection(tx, tz);
      if (proj.distanceFromCenter < ROAD_HALF_WIDTH + CURB_WIDTH + 48) continue;

      const scale = 0.85 + ((i * 19) % 40) / 100;
      const tree = this.createTree3D(i % 2 === 0, scale);
      tree.position.set(tx, 0, tz);
      this.trackGroup.add(tree);
    }
  }

  private createGrandstandMesh(): THREE.Group {
    const group = new THREE.Group();

    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      map: this.brickTex ?? null,
      roughness: 0.8,
    });
    const base = new THREE.Mesh(new THREE.BoxGeometry(108, 14, 44), baseMat);
    base.position.set(0, 7, 0);
    group.add(base);

    // 3 Tiered Seating Steps (Red, Gold, Blue spectator rows)
    const tierColors = [0xdc2626, 0xfacc15, 0x0284c7];
    for (let t = 0; t < 3; t++) {
      const tierMat = new THREE.MeshStandardMaterial({
        color: tierColors[t],
        roughness: 0.6,
      });
      const tier = new THREE.Mesh(
        new THREE.BoxGeometry(102, 6, 12),
        tierMat
      );
      tier.position.set(0, 16 + t * 5.5, -10 + t * 11);
      group.add(tier);
    }

    // White Cantilevered Stadium Roof Canopy
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
      metalness: 0.15,
    });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(114, 3.2, 50), roofMat);
    roof.position.set(0, 38, 2);
    roof.rotation.x = 0.14;
    group.add(roof);

    const fasciaMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.5,
    });
    const fascia = new THREE.Mesh(
      new THREE.BoxGeometry(114.5, 4.2, 3),
      fasciaMat
    );
    fascia.position.set(0, 34.5, -22);
    group.add(fascia);

    // Rear Roof Support Pillars
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.5,
    });
    for (const px of [-46, 0, 46]) {
      const p = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 26, 8),
        pillarMat
      );
      p.position.set(px, 26, 16);
      group.add(p);
    }

    return group;
  }

  private createTireBarrierMesh(): THREE.Group {
    const group = new THREE.Group();
    const redMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.75,
    });
    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.75,
    });
    const tireGeo = new THREE.CylinderGeometry(5.5, 5.5, 4.2, 12);

    for (let i = -3; i <= 3; i++) {
      const mat = Math.abs(i) % 2 === 0 ? redMat : whiteMat;
      const bottomTire = new THREE.Mesh(tireGeo, mat);
      bottomTire.position.set(0, 2.1, i * 11);
      const topTire = new THREE.Mesh(
        tireGeo,
        Math.abs(i) % 2 === 0 ? whiteMat : redMat
      );
      topTire.position.set(0, 6.4, i * 11);
      group.add(bottomTire, topTire);
    }
    return group;
  }

  private createTree3D(isPalm: boolean, scale: number): THREE.Group {
    const group = new THREE.Group();
    group.scale.setScalar(scale);

    // Soft tree shadow disc
    const shadowGeo = new THREE.CircleGeometry(18, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x090d06,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = 0.05;
    group.add(shadow);

    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      map: this.woodTex ?? null,
      roughness: 0.88,
    });
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 3.8, 26, 8),
      trunkMat
    );
    trunk.position.y = 13;
    group.add(trunk);

    const leafMatDark = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.78,
    });
    const leafMatLight = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.72,
    });

    if (isPalm) {
      for (let f = 0; f < 6; f++) {
        const ang = (f / 6) * Math.PI * 2;
        const frond = new THREE.Mesh(
          new THREE.ConeGeometry(5.5, 18, 6),
          f % 2 === 0 ? leafMatLight : leafMatDark
        );
        frond.position.set(Math.cos(ang) * 7, 26, Math.sin(ang) * 7);
        frond.rotation.z = -Math.cos(ang) * 1.1;
        frond.rotation.x = Math.sin(ang) * 1.1;
        group.add(frond);
      }
    } else {
      const mainCrown = new THREE.Mesh(
        new THREE.DodecahedronGeometry(14, 1),
        leafMatDark
      );
      mainCrown.position.y = 28;
      const topCrown = new THREE.Mesh(
        new THREE.DodecahedronGeometry(10, 1),
        leafMatLight
      );
      topCrown.position.set(3, 35, -2);
      group.add(mainCrown, topCrown);
    }

    return group;
  }

  private getOrCreateCoinMesh(id: number): THREE.Group {
    let group = this.coinMeshes.get(id);
    if (!group && this.coinsGroup) {
      group = new THREE.Group();

      // Ground glow ring
      const ringGeo = new THREE.RingGeometry(6, 9.5, 20);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.y = 0.45;
      group.add(ring);

      // Upright 3D Golden Rupee Coin Cylinder
      const rimMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.25,
        metalness: 0.75,
      });
      const faceMat = new THREE.MeshStandardMaterial({
        map: this.coinFaceTex,
        roughness: 0.3,
        metalness: 0.4,
      });
      const coinGeo = new THREE.CylinderGeometry(8.5, 8.5, 2.6, 24);
      coinGeo.rotateZ(Math.PI / 2);
      const coinMesh = new THREE.Mesh(coinGeo, [rimMat, faceMat, faceMat]);
      coinMesh.position.y = 11.5;
      coinMesh.name = 'coinDisc';
      group.add(coinMesh);

      this.coinsGroup.add(group);
      this.coinMeshes.set(id, group);
    }
    return group!;
  }

  private getOrCreatePowerUpMesh(id: number, type: PowerUpType): THREE.Group {
    let group = this.powerUpMeshes.get(id);
    if (!group && this.powerUpsGroup) {
      group = new THREE.Group();

      const colorHex =
        type === 'chai_nitro'
          ? 0xf97316
          : type === 'magnet'
          ? 0xec4899
          : 0x22c55e;

      const coreMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.45,
        roughness: 0.2,
        metalness: 0.3,
      });
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(9.5, 1),
        coreMat
      );
      core.position.y = 13;
      core.name = 'orbCore';
      group.add(core);

      const haloGeo = new THREE.TorusGeometry(12.5, 1.4, 10, 28);
      haloGeo.rotateX(Math.PI / 2);
      const haloMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.y = 13;
      halo.name = 'orbHalo';
      group.add(halo);

      this.powerUpsGroup.add(group);
      this.powerUpMeshes.set(id, group);
    }
    return group!;
  }

  private getOrCreateObstacleMesh(obs: ObstacleEntity): THREE.Group {
    let group = this.obstacleMeshes.get(obs.id);
    if (!group && this.obstaclesGroup) {
      group = new THREE.Group();

      if (obs.type === 'puddle') {
        const puddleGeo = new THREE.CircleGeometry(obs.radius * 1.15, 28);
        puddleGeo.rotateX(-Math.PI / 2);
        const puddleMat = new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          map: this.waterTex ?? null,
          roughness: 0.1,
          metalness: 0.5,
          transparent: true,
          opacity: 0.82,
        });
        const puddle = new THREE.Mesh(puddleGeo, puddleMat);
        puddle.position.y = 0.46;
        group.add(puddle);
      } else if (obs.type === 'cone') {
        const baseMat = new THREE.MeshStandardMaterial({
          color: 0x18181b,
          roughness: 0.85,
        });
        const coneMat = new THREE.MeshStandardMaterial({
          color: 0xf97316,
          roughness: 0.45,
        });
        const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });

        const base = new THREE.Mesh(
          new THREE.BoxGeometry(16, 2.2, 16),
          baseMat
        );
        base.position.y = 1.1;
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(6.8, 19, 16),
          coneMat
        );
        cone.position.y = 10.5;
        const stripe = new THREE.Mesh(
          new THREE.CylinderGeometry(3.4, 4.8, 4.5, 16),
          stripeMat
        );
        stripe.position.y = 11.5;
        group.add(base, cone, stripe);
      } else if (obs.type === 'cart') {
        const woodMat = new THREE.MeshStandardMaterial({
          color: 0xb45309,
          map: this.woodTex ?? null,
          roughness: 0.8,
        });
        const bed = new THREE.Mesh(
          new THREE.BoxGeometry(36, 9, 24),
          woodMat
        );
        bed.position.y = 10;
        group.add(bed);

        // Colorful Spice Sacks on Cart
        const sackColors = [0xef4444, 0xfacc15, 0x22c55e];
        for (let i = 0; i < 3; i++) {
          const sack = new THREE.Mesh(
            new THREE.SphereGeometry(6.2, 12, 10),
            new THREE.MeshStandardMaterial({
              color: sackColors[i],
              roughness: 0.7,
            })
          );
          sack.position.set(-10 + i * 10, 16, 0);
          group.add(sack);
        }

        const wheelMat = new THREE.MeshStandardMaterial({
          color: 0x1c1917,
          roughness: 0.7,
        });
        const wheelGeo = new THREE.CylinderGeometry(5.5, 5.5, 2.5, 14);
        wheelGeo.rotateX(Math.PI / 2);
        for (const wx of [-12, 12]) {
          for (const wz of [-13, 13]) {
            const w = new THREE.Mesh(wheelGeo, wheelMat);
            w.position.set(wx, 5.5, wz);
            group.add(w);
          }
        }
      } else if (obs.type === 'cow') {
        const bodyMat = new THREE.MeshStandardMaterial({
          color: 0xfafaf9,
          roughness: 0.65,
        });
        const darkMat = new THREE.MeshStandardMaterial({
          color: 0x292524,
          roughness: 0.7,
        });
        const garlandMat = new THREE.MeshStandardMaterial({
          color: 0xf97316,
          roughness: 0.5,
        });

        const torso = new THREE.Mesh(
          new THREE.BoxGeometry(28, 14, 16),
          bodyMat
        );
        torso.position.y = 13;
        const head = new THREE.Mesh(
          new THREE.BoxGeometry(11, 10, 11),
          bodyMat
        );
        head.position.set(16, 18, 0);
        const garland = new THREE.Mesh(
          new THREE.TorusGeometry(6.5, 1.6, 8, 16),
          garlandMat
        );
        garland.position.set(11, 15, 0);
        garland.rotation.y = Math.PI / 2;

        const legGeo = new THREE.CylinderGeometry(2.1, 1.8, 10, 8);
        for (const lx of [-9, 9]) {
          for (const lz of [-5, 5]) {
            const leg = new THREE.Mesh(legGeo, darkMat);
            leg.position.set(lx, 5, lz);
            group.add(leg);
          }
        }
        group.add(torso, head, garland);
      }

      this.obstaclesGroup.add(group);
      this.obstacleMeshes.set(obs.id, group);
    }
    return group!;
  }

  public spawnBurst(
    x: number,
    y: number,
    count: number,
    color: string,
    speed = 110,
    _size = 5
  ): void {
    const threeColor = new THREE.Color(color);
    let spawned = 0;
    for (const p of this.particlePool) {
      if (p.active) continue;
      const angle = (Math.PI * 2 * spawned) / count + (Math.random() - 0.5) * 0.4;
      const spd = speed * (0.45 + Math.random() * 0.7);
      p.active = true;
      p.life = 0.25 + Math.random() * 0.35;
      p.maxLife = p.life;
      p.vx = Math.cos(angle) * spd;
      p.vy = 28 + Math.random() * 45;
      p.vz = Math.sin(angle) * spd;
      p.mesh.position.set(x, 6, y);
      (p.mesh.material as THREE.MeshBasicMaterial).color.copy(threeColor);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.95;
      p.mesh.scale.setScalar(1);
      p.mesh.visible = true;
      spawned++;
      if (spawned >= count) break;
    }
  }

  public updateVisualEffects(
    state: RaceSessionState,
    dt: number,
    timeSec: number
  ): void {
    // Animate water normal ripples
    if (this.waterTex) {
      this.waterTex.offset.x = (timeSec * 0.03) % 1;
      this.waterTex.offset.y = (timeSec * 0.02) % 1;
    }

    // Continuous Chai Nitro 3D flame trail particles
    const p = state.player;
    const isNitro = p.activePowerUp === 'chai_nitro' && p.powerUpTimer > 0;
    if (state.phase === 'playing' && isNitro) {
      const rearX = p.x - Math.cos(p.angle) * 24;
      const rearZ = p.y - Math.sin(p.angle) * 24;
      this.spawnBurst(
        rearX,
        rearZ,
        2,
        Math.random() > 0.4 ? '#F97316' : '#FEF08A',
        65,
        4
      );
    }

    // Step active 3D particles
    for (const part of this.particlePool) {
      if (!part.active) continue;
      part.life -= dt;
      if (part.life <= 0) {
        part.active = false;
        part.mesh.visible = false;
        continue;
      }
      part.mesh.position.x += part.vx * dt;
      part.mesh.position.y += part.vy * dt;
      part.mesh.position.z += part.vz * dt;
      part.vy -= 95 * dt;
      const ratio = Math.max(0, part.life / part.maxLife);
      part.mesh.scale.setScalar(0.4 + ratio * 0.8);
      (part.mesh.material as THREE.MeshBasicMaterial).opacity = ratio;
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    viewportW: number,
    viewportH: number,
    state: RaceSessionState,
    timeSec: number
  ): void {
    if (
      !this.webglSupported ||
      !this.webglRenderer ||
      !this.webglCanvas ||
      !this.scene ||
      !this.camera ||
      !this.autoRig
    ) {
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.max(1, Math.floor(viewportW * dpr));
    const targetH = Math.max(1, Math.floor(viewportH * dpr));
    if (targetW !== this.currentRenderW || targetH !== this.currentRenderH) {
      this.currentRenderW = targetW;
      this.currentRenderH = targetH;
      this.webglRenderer.setSize(targetW, targetH, false);
    }

    const aspect = viewportW / Math.max(1, viewportH);
    if (Math.abs(this.camera.aspect - aspect) > 0.001) {
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
    }

    const p = state.player;
    const isNitro = p.activePowerUp === 'chai_nitro' && p.powerUpTimer > 0;

    // 1. Update 3D Auto-Rickshaw Pose & Wheel Animation on the F1 Track
    const wheelSpin = -timeSec * (p.speed * 0.055);
    this.autoRig.frontWheel.rotation.z = wheelSpin;
    this.autoRig.rearLeftWheel.rotation.z = wheelSpin;
    this.autoRig.rearRightWheel.rotation.z = wheelSpin;

    // Steer front fork & lean chassis into corners
    this.autoRig.frontForkGroup.rotation.y = -p.leanAngle * 1.4;
    this.autoRig.chassisGroup.rotation.x = p.leanAngle * 0.55;
    // Subtle pitch squat under acceleration
    const pitchSquat = Math.min(0.05, Math.max(-0.04, p.speed * 0.0001));
    this.autoRig.chassisGroup.rotation.z = pitchSquat;

    // Engine idle & driving vibration
    const vibe =
      Math.abs(p.speed) > 5
        ? Math.sin(timeSec * 44) * 0.22
        : Math.sin(timeSec * 22) * 0.12;
    this.autoRig.canopyGroup.position.y = vibe;

    // Chai Nitro Dual 3D Flame Cones
    this.autoRig.nitroFlameGroup.visible = isNitro;
    if (isNitro) {
      const pulse = 0.88 + Math.sin(timeSec * 38) * 0.24;
      this.autoRig.nitroFlameGroup.scale.set(pulse, 1, 1);
    }

    // Power-up 3D Shield & Magnet Halos on Rig
    this.autoRig.shieldSphere.visible = p.hasShield;
    if (p.hasShield) {
      this.autoRig.shieldSphere.rotation.y = timeSec * 1.8;
    }
    const isMagnet = p.activePowerUp === 'magnet' && p.powerUpTimer > 0;
    this.autoRig.magnetHalo.visible = isMagnet;
    if (isMagnet) {
      this.autoRig.magnetHalo.rotation.z = timeSec * 4.0;
    }

    this.autoRig.root.position.set(p.x, 0.36, p.y);
    // Align 3D Auto-Rickshaw forward (+X in local rig) with simulation heading (cos(angle), sin(angle))
    this.autoRig.root.rotation.y = -p.angle - p.leanAngle * 0.3;

    // 2. Sync 3D Coins, Power-Ups, Obstacles & Gantry Lights
    this.syncDynamicEntities3D(state, timeSec);

    // 3. Smooth 3D Camera Controller (Straight View Default, Horizon, Overview, or Title Orbit)
    this.updateCamera3D(state, timeSec, viewportW < 640);

    // 4. Render Full-Viewport 3D WebGL Frame & Blit to Screen Canvas
    this.webglRenderer.render(this.scene, this.camera);
    ctx.drawImage(this.webglCanvas, 0, 0, viewportW, viewportH);
  }

  private syncDynamicEntities3D(
    state: RaceSessionState,
    timeSec: number
  ): void {
    // Pulse Gantry Start Lights
    for (let i = 0; i < this.gantryLightMeshes.length; i++) {
      const bulb = this.gantryLightMeshes[i];
      const on = Math.sin(timeSec * 4 + i) > -0.2;
      (bulb.material as THREE.MeshBasicMaterial).color.setHex(
        on ? 0x4ade80 : 0x14532d
      );
    }

    // Sync 3D Rupee Coins
    for (const coin of state.coins) {
      const group = this.getOrCreateCoinMesh(coin.id);
      if (coin.collected) {
        group.visible = false;
        continue;
      }
      group.visible = true;
      const bob = Math.sin(timeSec * 4.5 + coin.bobPhase) * 2.2;
      group.position.set(coin.x, 0, coin.y);
      const disc = group.getObjectByName('coinDisc');
      if (disc) {
        disc.position.y = 11.5 + bob;
        disc.rotation.y = timeSec * 3.2 + coin.bobPhase;
      }
    }

    // Sync 3D Power-Up Orbs
    for (const pu of state.powerUps) {
      const group = this.getOrCreatePowerUpMesh(pu.id, pu.type);
      if (!pu.active) {
        group.visible = false;
        continue;
      }
      group.visible = true;
      const bob = Math.sin(timeSec * 5 + pu.id) * 2.5;
      group.position.set(pu.x, bob, pu.y);
      const core = group.getObjectByName('orbCore');
      if (core) {
        core.rotation.y = timeSec * 2.8;
        core.rotation.x = timeSec * 1.6;
      }
      const halo = group.getObjectByName('orbHalo');
      if (halo) {
        halo.rotation.z = timeSec * 3.5;
      }
    }

    // Sync 3D Track Obstacles
    for (const obs of state.obstacles) {
      const group = this.getOrCreateObstacleMesh(obs);
      group.position.set(obs.x, 0, obs.y);
      group.rotation.y = -obs.angle;
    }
  }

  private updateCamera3D(
    state: RaceSessionState,
    timeSec: number,
    isMobile: boolean
  ): void {
    if (!this.camera) return;
    const p = state.player;

    if (state.phase === 'title') {
      // Smooth Aerial Showroom Orbit over the Selected F1 Grand Prix Circuit
      const orbitAngle = timeSec * 0.18;
      const radius = 1280;
      const targetPos = new THREE.Vector3(
        Math.cos(orbitAngle) * radius,
        680,
        Math.sin(orbitAngle) * radius + 120
      );
      const targetLook = new THREE.Vector3(0, 0, 80);
      this.camPos.lerp(targetPos, 0.08);
      this.camLookAt.lerp(targetLook, 0.08);
      this.camera.fov = 52;
      this.camera.updateProjectionMatrix();
      this.camera.position.copy(this.camPos);
      this.camera.lookAt(this.camLookAt);
      this.camInitialized = false;
      return;
    }

    // Blend player heading with track tangent so the road ahead stays smoothly aligned
    const proj = getClosestTrackProjection(p.x, p.y);
    const roadDiff = normalizeAngleDiff(proj.roadAngle, p.angle);
    const desiredHeading =
      Math.abs(roadDiff) < Math.PI * 0.55
        ? p.angle + roadDiff * 0.28
        : p.angle;

    if (!this.camInitialized) {
      this.camHeading = desiredHeading;
      this.camInitialized = true;
    } else {
      const angleDelta = normalizeAngleDiff(desiredHeading, this.camHeading);
      this.camHeading += angleDelta * 0.14;
    }

    const fwdX = Math.cos(this.camHeading);
    const fwdZ = Math.sin(this.camHeading);

    let behindDist = isMobile ? 142 : 128;
    let camHeight = isMobile ? 74 : 66;
    let lookAheadDist = 175;
    let lookHeight = 8;
    let baseFov = isMobile ? 56 : 50;

    if (this.cameraMode === 'horizon') {
      behindDist = isMobile ? 104 : 92;
      camHeight = isMobile ? 46 : 40;
      lookAheadDist = 230;
      lookHeight = 12;
      baseFov = isMobile ? 60 : 54;
    } else if (this.cameraMode === 'overview') {
      behindDist = 205;
      camHeight = 270;
      lookAheadDist = 90;
      lookHeight = 0;
      baseFov = 50;
    }

    const isNitro = p.activePowerUp === 'chai_nitro' && p.powerUpTimer > 0;
    const speedRatio = Math.min(1, Math.abs(p.speed) / 420);
    const targetFov = baseFov + speedRatio * 5 + (isNitro ? 5 : 0);
    this.camera.fov += (targetFov - this.camera.fov) * 0.12;
    this.camera.updateProjectionMatrix();

    let shakeX = 0;
    let shakeY = 0;
    if (state.cameraTrauma > 0) {
      const mag = state.cameraTrauma * state.cameraTrauma * 6;
      shakeX = (Math.random() - 0.5) * mag;
      shakeY = (Math.random() - 0.5) * mag;
    }

    // Lock camera anchor smoothly relative to the player so there is zero positional jitter
    const desiredCamX = p.x - fwdX * behindDist + shakeX;
    const desiredCamY = camHeight + shakeY;
    const desiredCamZ = p.y - fwdZ * behindDist;

    const desiredLookX = p.x + fwdX * lookAheadDist;
    const desiredLookY = lookHeight;
    const desiredLookZ = p.y + fwdZ * lookAheadDist;

    this.camPos.set(desiredCamX, desiredCamY, desiredCamZ);
    this.camLookAt.set(desiredLookX, desiredLookY, desiredLookZ);

    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLookAt);
  }

  public dispose(): void {
    if (this.webglRenderer) {
      this.webglRenderer.dispose();
      this.webglRenderer = null;
    }
  }
}
