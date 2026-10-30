import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BUILDING_CONFIG, FLOORS, Floor, Exhibit, SUBJECTS, ARCHITECTURAL_ROOM_OUTLINES } from '../data';
import { createRoomMockup, AnimatedElement } from './ThreeMockupModels';
import { createArchitecturalModel, ArchitecturalModelBundle, createRoomLabelSprite, drawRoomLabelCanvas, createFloorLabelSprite } from './ThreeArchitecturalModel';
import { NavRoute, TourPlan } from '../utils/navigation';
import { getLiveStatus } from '../utils/schedule';

export type CameraViewPreset = 'iso' | 'top_down' | 'front' | 'exhibit';

type RoomActivity = 'live' | 'upcoming' | 'ended' | null;

/** Base material state of one mesh inside a room's procedural mockup. */
interface RoomMaterialSnapshot {
  mat: THREE.Material;
  baseColor: THREE.Color;
  baseEmissive?: THREE.Color;
  baseEmissiveIntensity?: number;
}

interface ThreeCanvasProps {
  activeFloorId: string | null;
  activeExhibitId: string | null;
  activeSubjectFilter: string;
  viewPreset?: CameraViewPreset;
  activeRoute?: NavRoute | null;
  activeTour?: TourPlan | null;
  currentTourStopIndex?: number;
  resetTrigger?: number;
  onSelectExhibit: (exhibit: Exhibit | null, floor: Floor | null) => void;
  onSelectFloor: (floorId: string | null) => void;
  onHoverExhibit: (exhibit: Exhibit | null) => void;
}

function matchesFilterSubject(filterSubject: string, exhibitSubject: string, department?: string): boolean {
  if (filterSubject === 'all') return true;
  if (exhibitSubject === filterSubject) return true;
  if (department && department.toLowerCase().includes(filterSubject.toLowerCase())) return true;
  if (filterSubject === 'science' && (exhibitSubject === 'physics' || exhibitSubject === 'chemistry' || exhibitSubject === 'biology')) return true;
  return false;
}

function createSportsCourtTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Ground base: Concrete court buff/grey matching satellite photo
  ctx.fillStyle = '#b8aba0';
  ctx.fillRect(0, 0, 1024, 700);

  // Inner court playing surfaces
  // Left: Basketball court
  ctx.fillStyle = '#af9f92';
  ctx.fillRect(40, 40, 440, 620);

  // Right: Badminton / Volleyball courts
  ctx.fillStyle = '#b3a498';
  ctx.fillRect(520, 40, 464, 290);
  ctx.fillRect(520, 370, 464, 290);

  // Court line markings in crisp architectural off-white
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 4;

  // Basketball court markings (West side)
  ctx.strokeRect(40, 40, 440, 620);
  ctx.beginPath();
  ctx.moveTo(40, 350); ctx.lineTo(480, 350); // half court
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(260, 350, 65, 0, Math.PI * 2); // center circle
  ctx.stroke();

  // Top Key & Free Throw Arc
  ctx.strokeRect(200, 40, 120, 130);
  ctx.beginPath();
  ctx.arc(260, 170, 60, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(260, 70, 155, 0.16 * Math.PI, 0.84 * Math.PI);
  ctx.stroke();

  // Bottom Key & Free Throw Arc
  ctx.strokeRect(200, 530, 120, 130);
  ctx.beginPath();
  ctx.arc(260, 530, 60, Math.PI, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(260, 630, 155, 1.16 * Math.PI, 1.84 * Math.PI);
  ctx.stroke();

  // Badminton / Volleyball Courts (East side)
  // Court 1 (North)
  ctx.strokeRect(520, 40, 464, 290);
  ctx.beginPath();
  ctx.moveTo(752, 40); ctx.lineTo(752, 330);
  ctx.moveTo(520, 85); ctx.lineTo(984, 85);
  ctx.moveTo(520, 285); ctx.lineTo(984, 285);
  ctx.moveTo(700, 40); ctx.lineTo(700, 330);
  ctx.moveTo(804, 40); ctx.lineTo(804, 330);
  ctx.stroke();

  // Court 2 (South)
  ctx.strokeRect(520, 370, 464, 290);
  ctx.beginPath();
  ctx.moveTo(752, 370); ctx.lineTo(752, 660);
  ctx.moveTo(520, 415); ctx.lineTo(984, 415);
  ctx.moveTo(520, 615); ctx.lineTo(984, 615);
  ctx.moveTo(700, 370); ctx.lineTo(700, 660);
  ctx.moveTo(804, 370); ctx.lineTo(804, 660);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

export default function ThreeCanvas({
  activeFloorId,
  activeExhibitId,
  activeSubjectFilter,
  viewPreset = 'iso',
  activeRoute = null,
  activeTour = null,
  currentTourStopIndex = 0,
  resetTrigger = 0,
  onSelectExhibit,
  onSelectFloor,
  onHoverExhibit
}: ThreeCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // WebGL context loss recovery (GPU driver resets on crowded exhibition-day phones)
  const [contextLost, setContextLost] = useState(false);
  const contextLostRef = useRef(false);

  // References to communicate with render loop without re-mounting
  const stateRef = useRef({
    activeFloorId,
    activeExhibitId,
    activeSubjectFilter,
    viewPreset,
    activeRoute,
    activeTour,
    currentTourStopIndex,
    onSelectExhibit,
    onSelectFloor,
    onHoverExhibit
  });

  useEffect(() => {
    stateRef.current = {
      activeFloorId,
      activeExhibitId,
      activeSubjectFilter,
      viewPreset,
      activeRoute,
      activeTour,
      currentTourStopIndex,
      onSelectExhibit,
      onSelectFloor,
      onHoverExhibit
    };
  }, [activeFloorId, activeExhibitId, activeSubjectFilter, viewPreset, activeRoute, activeTour, currentTourStopIndex, onSelectExhibit, onSelectFloor, onHoverExhibit]);

  // Smooth Camera Arc Transition Controller
  const transitionRef = useRef<{
    active: boolean;
    startTime: number;
    duration: number;
    fromPos: THREE.Vector3;
    toPos: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    arcHeight: number;
  }>({
    active: false,
    startTime: 0,
    duration: 850,
    fromPos: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3(),
    arcHeight: 0
  });

  interface FloorAnimatedElement extends AnimatedElement {
    floorId: string;
    exhibitId?: string;
  }

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animElementsRef = useRef<FloorAnimatedElement[]>([]);
  const floorGroupsRef = useRef<Map<string, THREE.Group>>(new Map());
  const columnsGroupRef = useRef<THREE.Group | null>(null);
  const archModelRef = useRef<ArchitecturalModelBundle | null>(null);
  const navGroupRef = useRef<THREE.Group | null>(null);
  const navLineRef = useRef<THREE.Line | null>(null);
  const navStartPinRef = useRef<THREE.Group | null>(null);
  const navEndPinRef = useRef<THREE.Group | null>(null);

  // Helper: Create 3D Waypoint Pin Marker
  const create3DNavPin = (colorHex: number, _label: string): THREE.Group => {
    const g = new THREE.Group();

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.8, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    stem.position.y = 0.9;
    g.add(stem);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 16, 16),
      new THREE.MeshBasicMaterial({ color: colorHex })
    );
    head.position.y = 1.8;
    g.add(head);

    const ringGeo = new THREE.RingGeometry(0.35, 0.75, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    g.add(ring);
    g.userData.ring = ring;

    return g;
  };

  // Trigger camera flight and floor isolation on floor or exhibit changes
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    // 1. Manage Floor & Architectural Shell Visibility
    const floorGroups = floorGroupsRef.current;
    let targetFloorLevel: number | null = null;

    if (activeExhibitId) {
      for (const f of FLOORS) {
        if (f.exhibits.some(e => e.id === activeExhibitId)) {
          targetFloorLevel = f.level;
          break;
        }
      }
    } else if (activeFloorId) {
      const f = FLOORS.find(item => item.id === activeFloorId);
      if (f) targetFloorLevel = f.level;
    }

    // Hide upper floors so camera never clips into ceilings or slabs
    floorGroups.forEach((group, fId) => {
      const fl = FLOORS.find(f => f.id === fId);
      if (!fl) return;

      if (targetFloorLevel === null) {
        // Aerial view: all floors fully visible
        group.visible = true;
      } else {
        if (fl.level > targetFloorLevel) {
          group.visible = false;
        } else {
          group.visible = true;
        }
      }
    });

    // Update Architectural Shell cutaway state
    if (archModelRef.current) {
      if (activeExhibitId !== null || activeFloorId !== null) {
        archModelRef.current.setExteriorVisible(false);
      } else {
        archModelRef.current.setExteriorVisible(true);
        archModelRef.current.setFloorIsolation(null);
      }
    }

    // Hide structural corner columns during floor/exhibit focus
    if (columnsGroupRef.current) {
      columnsGroupRef.current.visible = activeExhibitId === null && activeFloorId === null;
    }

    // 2. Adaptive Phone Framing - Adjusts camera distance automatically for portrait smartphones
    const isPortrait = camera.aspect < 1.0;

    let targetCamPos = new THREE.Vector3();
    let targetLookAt = new THREE.Vector3();
    let arcH = 1.5;

    if (activeExhibitId) {
      let foundExhibit: Exhibit | null = null;
      let foundFloor: Floor | null = null;
      for (const floor of FLOORS) {
        const ex = floor.exhibits.find(e => e.id === activeExhibitId);
        if (ex) {
          foundExhibit = ex;
          foundFloor = floor;
          break;
        }
      }

      if (foundExhibit && foundFloor) {
        const wx = foundExhibit.px;
        const wy = foundFloor.baseY;
        const wz = foundExhibit.pz;

        // Position camera with an elevated isometric view looking down directly into the room
        // Above mobile bottom sheet on phones, left-center on desktop. Scales for large arenas (Quad/Cemented)
        const roomSpan = Math.max(foundExhibit.w, foundExhibit.d);
        const isLargeArea = roomSpan > 14.0;
        const scaleFactor = isLargeArea ? Math.min(2.5, roomSpan / 10.0) : 1.0;

        if (isPortrait) {
          // Looking slightly below room lifts room into upper 45% of mobile screen
          targetLookAt.set(wx, wy - 1.2, wz);
          targetCamPos.set(wx - 5.5 * scaleFactor, wy + 8.5 * scaleFactor, wz - 7.5 * scaleFactor);
        } else {
          // On desktop: offset target slightly right so room stays in open left 70% away from right panel
          targetLookAt.set(wx + 2.5, wy, wz);
          targetCamPos.set(wx + 2.5 - 6.5 * scaleFactor, wy + 8.0 * scaleFactor, wz - 8.5 * scaleFactor);
        }

        controls.minDistance = 1.5;
        controls.maxDistance = isLargeArea ? 75 : 24;
        arcH = 0.4;
      }
    } else if (activeFloorId) {
      const floor = FLOORS.find(f => f.id === activeFloorId);
      if (floor) {
        if (isPortrait) {
          targetLookAt.set(0, floor.baseY + 0.5, 0);
          targetCamPos.set(-46, floor.baseY + 38, -50);
          controls.minDistance = 3.0;
          controls.maxDistance = 95;
        } else {
          targetLookAt.set(0, floor.baseY + 1.0, 0);
          if (viewPreset === 'top_down') {
            targetCamPos.set(0.001, (floor.baseY + 44), 0.4);
          } else if (viewPreset === 'front') {
            targetCamPos.set(0, (floor.baseY + 14), -34);
          } else {
            targetCamPos.set(24, floor.baseY + 22, -26);
          }
          controls.minDistance = 2.0;
          controls.maxDistance = 65;
        }
        arcH = 1.2;
      }
    } else {
      // Aerial view: Full architectural building model fitted without clipping
      if (isPortrait) {
        // Fits entire building centered between header and chips on phone
        targetLookAt.set(0, 7.5, 0);
        targetCamPos.set(-78, 52, -84);
        controls.minDistance = 5.0;
        controls.maxDistance = 180;
      } else {
        targetLookAt.set(0, 7.5, 0);
        targetCamPos.set(-44, 30, -48);
        controls.minDistance = 4.0;
        controls.maxDistance = 110;
      }
      arcH = 1.5;
    }

    // Launch smooth transition
    controls.enabled = false;
    transitionRef.current = {
      active: true,
      startTime: performance.now(),
      duration: 850,
      fromPos: camera.position.clone(),
      toPos: targetCamPos,
      fromTarget: controls.target.clone(),
      toTarget: targetLookAt,
      arcHeight: arcH
    };
  }, [activeFloorId, activeExhibitId, viewPreset, resetTrigger]);

  // Update 3D Navigation Path & Waypoints
  useEffect(() => {
    const navGroup = navGroupRef.current;
    if (!navGroup) return;

    // Clear previous path objects
    while (navGroup.children.length > 0) {
      const child = navGroup.children[0];
      navGroup.remove(child);
    }
    navLineRef.current = null;
    navStartPinRef.current = null;
    navEndPinRef.current = null;

    const buildOrthogonal3DPath = (
      waypoints: { x: number; y: number; z: number }[],
      colorHex: number
    ) => {
      if (waypoints.length < 2) return;

      const pts = waypoints.map(p => new THREE.Vector3(p.x, p.y + 0.16, p.z));

      // 1. Straight cylinder segments & rounded elbow beads for clean right angles
      const segMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.90
      });
      const elbowMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.95
      });

      const radius = 0.13;
      const elbowGeo = new THREE.SphereGeometry(radius, 12, 12);

      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const len = p1.distanceTo(p2);
        if (len < 0.04) continue;

        // Straight cylinder connecting p1 directly to p2
        const cylGeo = new THREE.CylinderGeometry(radius, radius, len, 12);
        const cylMesh = new THREE.Mesh(cylGeo, segMat);

        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        cylMesh.position.copy(mid);

        const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
        cylMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        navGroup.add(cylMesh);

        // Corner elbow bead at p1
        const elbow = new THREE.Mesh(elbowGeo, elbowMat);
        elbow.position.copy(p1);
        navGroup.add(elbow);
      }

      // Final elbow bead at the end of the path
      const lastElbow = new THREE.Mesh(elbowGeo, elbowMat);
      lastElbow.position.copy(pts[pts.length - 1]);
      navGroup.add(lastElbow);

      // 2. Animated straight dashed core runner line on top of the straight cylinders
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineDashedMaterial({
        color: 0xffffff,
        dashSize: 0.6,
        gapSize: 0.35,
        scale: 1,
        transparent: true,
        opacity: 0.95
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      line.position.y += 0.04;
      navGroup.add(line);
      navLineRef.current = line;
    };

    if (activeRoute && activeRoute.points.length > 1) {
      // High-visibility electric blue path with animated dashed runner
      buildOrthogonal3DPath(activeRoute.points, 0x2563eb);

      // Start Pin (Emerald Green)
      const startPin = create3DNavPin(0x10b981, 'START');
      startPin.position.set(activeRoute.points[0].x, activeRoute.points[0].y + 0.16, activeRoute.points[0].z);
      navGroup.add(startPin);
      navStartPinRef.current = startPin;

      // Destination Pin (Vibrant Crimson Red)
      const endPin = create3DNavPin(0xef4444, 'TARGET');
      const lastPt = activeRoute.points[activeRoute.points.length - 1];
      endPin.position.set(lastPt.x, lastPt.y + 0.16, lastPt.z);
      navGroup.add(endPin);
      navEndPinRef.current = endPin;
    } else if (activeTour && activeTour.fullPathPoints.length > 1) {
      // All-Exhibits Tour Path: Electric Blue with Stop Pin
      buildOrthogonal3DPath(activeTour.fullPathPoints, 0x2563eb);

      // Current tour stop pin (Emerald Green)
      const curStop = activeTour.stops[currentTourStopIndex || 0];
      if (curStop) {
        const stopPin = create3DNavPin(0x10b981, 'STOP');
        stopPin.position.set(curStop.exhibit.px, curStop.floor.baseY + 0.16, curStop.exhibit.pz);
        navGroup.add(stopPin);
        navEndPinRef.current = stopPin;
      }
    }
  }, [activeRoute, activeTour, currentTourStopIndex]);

  // Main Three.js setup
  useEffect(() => {
    const container = mountRef.current;
    // Honors the OS-level reduced motion preference across the render loop
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (!container) return;

    // 1. Scene & Atmosphere (Warm, calm daylight matching school palette - gentle on eyes)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcdd9e2);
    scene.fog = new THREE.FogExp2(0xcdd9e2, 0.0032);

    // Daylight sky dome (Soft architectural atmosphere)
    const skyGeo = new THREE.SphereGeometry(220, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0xb0c4d3) },
        midColor: { value: new THREE.Color(0xc0d2df) },
        bottomColor: { value: new THREE.Color(0xcdd9e2) },
        glowColor: { value: new THREE.Color(0xcdd9e2) },
        offset: { value: 20 },
        exponent: { value: 0.65 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 bottomColor;
        uniform vec3 glowColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          vec3 col = mix(bottomColor, midColor, max(pow(max(h, 0.0), exponent), 0.0));
          col = mix(col, topColor, max(pow(max(h - 0.2, 0.0), 1.2), 0.0));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyDome);

    // 2. Camera & OrbitControls
    const initialAspect = container.clientWidth / container.clientHeight;
    const initialPortrait = initialAspect < 1.0;

    // Near plane 0.05 prevents camera clipping
    const fov = initialPortrait ? 52 : 45;
    const camera = new THREE.PerspectiveCamera(fov, initialAspect, 0.05, 1200);
    if (initialPortrait) {
      camera.position.set(-78, 52, -84);
    } else {
      camera.position.set(-44, 30, -48);
    }
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.98;
    container.appendChild(renderer.domElement);

    // three.js re-initializes its GL state after a restored context, but the
    // loss event must be prevented and rendering paused while it is gone.
    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLostRef.current = true;
      setContextLost(true);
    };
    const onContextRestored = () => {
      contextLostRef.current = false;
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored, false);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Prevent going below ground
    controls.minDistance = 3.0;
    controls.maxDistance = initialPortrait ? 140 : 70;
    controls.target.set(0, 7.5, 0);
    controlsRef.current = controls;

    // 3D Navigation Path Group
    const navGroup = new THREE.Group();
    navGroup.name = 'NavigationRouteGroup';
    navGroupRef.current = navGroup;
    scene.add(navGroup);

    // 3. Calm Daylight Architectural Lighting - Zero harsh glare, comfortable for eyes
    const hemiLight = new THREE.HemisphereLight(0xf5ede4, 0xc0d0dc, 0.72);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff3e6, 1.15);
    keyLight.position.set(28, 48, -25);
    keyLight.castShadow = false;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xb4c5d6, 0.50);
    fillLight.position.set(-25, 24, 28);
    scene.add(fillLight);

    // 4. Clean Architectural Pedestal Plinth under the building (Slate tone #94A3B8)
    const baseGeo = new THREE.BoxGeometry(BUILDING_CONFIG.SLAB_W + 1.2, 0.25, BUILDING_CONFIG.SLAB_D + 1.2);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.88,
      metalness: 0.05
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.15;
    baseMesh.receiveShadow = true;
    scene.add(baseMesh);

    // 5. Structural Columns (Clean slate steel #334155)
    const columnsGroup = new THREE.Group();
    columnsGroupRef.current = columnsGroup;
    scene.add(columnsGroup);

    const colHeight = 26.5;
    const colGeo = new THREE.BoxGeometry(0.5, colHeight, 0.5);
    const colMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.6,
      metalness: 0.2
    });

    const halfW = BUILDING_CONFIG.SLAB_W / 2 - 0.4;
    const halfD = BUILDING_CONFIG.SLAB_D / 2 - 0.4;
    [
      [-halfW, colHeight / 2 - 0.2, -halfD],
      [halfW, colHeight / 2 - 0.2, -halfD],
      [-halfW, colHeight / 2 - 0.2, halfD],
      [halfW, colHeight / 2 - 0.2, halfD]
    ].forEach(([cx, cy, cz]) => {
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(cx, cy, cz);
      col.castShadow = true;
      col.receiveShadow = true;
      columnsGroup.add(col);
    });

    // 6. Realistic 3D Architectural Exterior Model (Semi-transparent shell)
    const architecturalModel = createArchitecturalModel();
    archModelRef.current = architecturalModel;
    scene.add(architecturalModel.group);

    // 6b. "You Are Here" Landmark Marker at Ground Floor Main Entrance (Monochrome Obsidian + Apple Font)
    const yohGroup = new THREE.Group();
    yohGroup.name = 'YouAreHereLandmark';

    const yohRingGeo = new THREE.RingGeometry(0.65, 0.95, 32);
    const yohRingMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const yohRing = new THREE.Mesh(yohRingGeo, yohRingMat);
    yohRing.rotation.x = -Math.PI / 2;
    yohRing.position.y = 0.05;
    yohGroup.add(yohRing);

    const yohDot = new THREE.Mesh(
      new THREE.CircleGeometry(0.38, 24),
      new THREE.MeshBasicMaterial({ color: 0x18181b, side: THREE.DoubleSide })
    );
    yohDot.rotation.x = -Math.PI / 2;
    yohDot.position.y = 0.06;
    yohGroup.add(yohDot);

    const yohPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 2.2, 12),
      new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.75 })
    );
    yohPole.position.y = 1.1;
    yohGroup.add(yohPole);

    const yohCanvas = document.createElement('canvas');
    yohCanvas.width = 1024;
    yohCanvas.height = 240;
    const yohCtx = yohCanvas.getContext('2d');
    if (yohCtx) {
      yohCtx.clearRect(0, 0, 1024, 240);
      yohCtx.save();
      yohCtx.imageSmoothingEnabled = true;
      yohCtx.imageSmoothingQuality = 'high';
      yohCtx.shadowColor = 'rgba(15, 23, 42, 0.35)';
      yohCtx.shadowBlur = 24;
      yohCtx.fillStyle = '#09090B';
      yohCtx.beginPath();
      const rx = 32, ry = 32, rw = 960, rh = 176, rr = 40;
      yohCtx.moveTo(rx + rr, ry);
      yohCtx.lineTo(rx + rw - rr, ry);
      yohCtx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr);
      yohCtx.lineTo(rx + rw, ry + rh - rr);
      yohCtx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rr, ry + rh);
      yohCtx.lineTo(rx + rr, ry + rh);
      yohCtx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rr);
      yohCtx.lineTo(rx, ry + rr);
      yohCtx.quadraticCurveTo(rx, ry, rx + rr, ry);
      yohCtx.closePath();
      yohCtx.fill();

      // Border 6px soft border
      yohCtx.strokeStyle = '#D4D4D8';
      yohCtx.lineWidth = 6;
      yohCtx.stroke();

      yohCtx.fillStyle = '#FFFFFF';
      yohCtx.font = '800 56px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';
      yohCtx.textAlign = 'center';
      yohCtx.textBaseline = 'middle';
      yohCtx.fillText('📍 Main Entrance (You Are Here)', 512, 120);
      yohCtx.restore();
    }
    const yohTexture = new THREE.CanvasTexture(yohCanvas);
    yohTexture.colorSpace = THREE.SRGBColorSpace;
    yohTexture.generateMipmaps = false;
    yohTexture.minFilter = THREE.LinearFilter;
    yohTexture.magFilter = THREE.LinearFilter;
    yohTexture.anisotropy = 16;
    const yohSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: yohTexture, transparent: true, depthTest: false }));
    yohSprite.scale.set(3.4, 0.8, 1.0);
    yohSprite.position.y = 2.6;
    yohGroup.add(yohSprite);

    yohGroup.position.set(0.0, 6.5, -21.0); // Ground Floor main entrance foyer
    scene.add(yohGroup);

    // 7. Build Floors, Cutout Slabs, Procedural Models, and Floating Room Labels
    const roomMeshes = new Map<string, {
      mesh: THREE.Mesh;
      outline: THREE.LineSegments;
      floor: Floor;
      exhibit: Exhibit;
      baseMaterial: THREE.MeshStandardMaterial;
      wireColor: number;
      floorMaterial?: THREE.MeshStandardMaterial;
    }>();
    const floorGroups = new Map<string, THREE.Group>();
    floorGroupsRef.current = floorGroups;
    const animElements: FloorAnimatedElement[] = [];
    const labelSprites = new Map<string, THREE.Sprite>();
    const floorLabelSprites = new Map<string, THREE.Sprite>();
    // Time-reactive exhibits: base material colors per room + clock-derived state
    const mockupMaterials = new Map<string, RoomMaterialSnapshot[]>();
    const roomActivityStates = new Map<string, RoomActivity>();

    const ACTIVITY_DIM = new THREE.Color(0x9aa3ad);
    const applyRoomActivity = (exhibitId: string, status: RoomActivity) => {
      const snapshots = mockupMaterials.get(exhibitId);
      if (!snapshots) return;
      for (const snap of snapshots) {
        const std = snap.mat as THREE.MeshStandardMaterial;
        if (status === 'ended') {
          // Show is over: desaturate the model and cut its glow
          std.color.copy(snap.baseColor).lerp(ACTIVITY_DIM, 0.72);
          if (snap.baseEmissive && snap.baseEmissiveIntensity !== undefined) {
            std.emissive.copy(snap.baseEmissive).lerp(ACTIVITY_DIM, 0.5);
            std.emissiveIntensity = snap.baseEmissiveIntensity * 0.1;
          }
        } else if (status === 'live') {
          // Running right now: full color with a boosted luminous glow
          std.color.copy(snap.baseColor);
          if (snap.baseEmissive && snap.baseEmissiveIntensity !== undefined) {
            std.emissive.copy(snap.baseEmissive);
            std.emissiveIntensity = Math.min(1.6, snap.baseEmissiveIntensity * 1.4);
          }
        } else {
          std.color.copy(snap.baseColor);
          if (snap.baseEmissive && snap.baseEmissiveIntensity !== undefined) {
            std.emissive.copy(snap.baseEmissive);
            std.emissiveIntensity = snap.baseEmissiveIntensity;
          }
        }
      }
    };

    FLOORS.forEach((floor) => {
      const floorGroup = new THREE.Group();
      floorGroup.name = `Floor_${floor.id}`;
      scene.add(floorGroup);
      floorGroups.set(floor.id, floorGroup);

      // Floor internal accent point light
      const floorPointLight = new THREE.PointLight(floor.color, 0.35, 36);
      floorPointLight.position.set(0, floor.baseY + 3.2, 0);
      floorGroup.add(floorPointLight);

      // Floor Level Badge for Aerial / ALL building view
      const floorBadge = createFloorLabelSprite(
        `${floor.shortName} · ${floor.name}`,
        floor.theme,
        floor.css
      );
      floorBadge.position.set(-25.5, floor.baseY + 2.5, -14.0);
      floorBadge.visible = true;
      scene.add(floorBadge);
      floorLabelSprites.set(floor.id, floorBadge);

      // Floor Slabs (Clean Architectural Matte Slate tone - zero eye strain)
      let slabMesh: THREE.Mesh;
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0xcfd6dc,
        roughness: 0.88,
        metalness: 0.02
      });

      if (floor.level >= 2) {
        const shape = new THREE.Shape();
        const sw2 = BUILDING_CONFIG.SLAB_W / 2;
        const sd2 = BUILDING_CONFIG.SLAB_D / 2;
        shape.moveTo(-sw2, -sd2);
        shape.lineTo(sw2, -sd2);
        shape.lineTo(sw2, sd2);
        shape.lineTo(-sw2, sd2);
        shape.closePath();

        // Small Quad Hole
        const sq = BUILDING_CONFIG.SMALL_QUAD;
        const holeSmall = new THREE.Path();
        holeSmall.moveTo(sq.x - sq.w / 2, sq.z - sq.d / 2);
        holeSmall.lineTo(sq.x + sq.w / 2, sq.z - sq.d / 2);
        holeSmall.lineTo(sq.x + sq.w / 2, sq.z + sq.d / 2);
        holeSmall.lineTo(sq.x - sq.w / 2, sq.z + sq.d / 2);
        holeSmall.closePath();
        shape.holes.push(holeSmall);

        // Big Quad Hole
        const bq = BUILDING_CONFIG.BIG_QUAD;
        const holeBig = new THREE.Path();
        holeBig.moveTo(bq.x - bq.w / 2, bq.z - bq.d / 2);
        holeBig.lineTo(bq.x + bq.w / 2, bq.z - bq.d / 2);
        holeBig.lineTo(bq.x + bq.w / 2, bq.z + bq.d / 2);
        holeBig.lineTo(bq.x - bq.w / 2, bq.z + bq.d / 2);
        holeBig.closePath();
        shape.holes.push(holeBig);

        const extrudeSettings = {
          depth: BUILDING_CONFIG.SLAB_H,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 1,
          bevelSize: 0.08,
          bevelThickness: 0.08
        };

        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geom.rotateX(Math.PI / 2);
        slabMesh = new THREE.Mesh(geom, slabMat);
        slabMesh.position.set(0, floor.baseY + BUILDING_CONFIG.SLAB_H, 0);
        slabMesh.receiveShadow = true;
        slabMesh.castShadow = true;
        floorGroup.add(slabMesh);

        // Protective safety railings around Courtyard voids (matching DXF RAILINGS layer)
        const voidRailMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          roughness: 0.6,
          metalness: 0.2
        });
        const addVoidRailings = (qx: number, qz: number, qw: number, qd: number) => {
          const rH = 0.85;
          const rThick = 0.08;
          // North edge
          const rn = new THREE.Mesh(new THREE.BoxGeometry(qw, rH, rThick), voidRailMat);
          rn.position.set(qx, floor.baseY + BUILDING_CONFIG.SLAB_H + rH / 2, qz - qd / 2);
          floorGroup.add(rn);
          // South edge
          const rs = new THREE.Mesh(new THREE.BoxGeometry(qw, rH, rThick), voidRailMat);
          rs.position.set(qx, floor.baseY + BUILDING_CONFIG.SLAB_H + rH / 2, qz + qd / 2);
          floorGroup.add(rs);
          // West edge - inset slightly to prevent corner railing overlap
          const rw = new THREE.Mesh(new THREE.BoxGeometry(rThick, rH, Math.max(0.1, qd - rThick * 2)), voidRailMat);
          rw.position.set(qx - qw / 2, floor.baseY + BUILDING_CONFIG.SLAB_H + rH / 2, qz);
          floorGroup.add(rw);
          // East edge - inset slightly to prevent corner railing overlap
          const re = new THREE.Mesh(new THREE.BoxGeometry(rThick, rH, Math.max(0.1, qd - rThick * 2)), voidRailMat);
          re.position.set(qx + qw / 2, floor.baseY + BUILDING_CONFIG.SLAB_H + rH / 2, qz);
          floorGroup.add(re);
        };
        addVoidRailings(sq.x, sq.z, sq.w, sq.d);
        addVoidRailings(bq.x, bq.z, bq.w, bq.d);
      } else {
        const slabGeo = new THREE.BoxGeometry(BUILDING_CONFIG.SLAB_W, BUILDING_CONFIG.SLAB_H, BUILDING_CONFIG.SLAB_D);
        slabMesh = new THREE.Mesh(slabGeo, slabMat);
        slabMesh.position.set(0, floor.baseY, 0);
        slabMesh.receiveShadow = true;
        slabMesh.castShadow = true;
        floorGroup.add(slabMesh);

        // Ground Floor Entrance Stage slab extension matching DXF STAGE layer
        if (floor.id === 'ground') {
          const stageGeo = new THREE.BoxGeometry(BUILDING_CONFIG.STAGE.w, BUILDING_CONFIG.SLAB_H, BUILDING_CONFIG.STAGE.d);
          const stageMesh = new THREE.Mesh(stageGeo, slabMat);
          stageMesh.position.set(BUILDING_CONFIG.STAGE.x, floor.baseY, BUILDING_CONFIG.STAGE.z);
          stageMesh.receiveShadow = true;
          stageMesh.castShadow = true;
          floorGroup.add(stageMesh);

          // Front open-air cemented sports court plaza (matches satellite photo red outline)
          const courtTexture = createSportsCourtTexture();
          const cementedGeo = new THREE.BoxGeometry(38.0, BUILDING_CONFIG.SLAB_H, 26.0);
          const cementedMat = new THREE.MeshStandardMaterial({
            color: 0xb8aba0,
            roughness: 0.85,
            metalness: 0.05
          });
          const cementedMesh = new THREE.Mesh(cementedGeo, cementedMat);
          cementedMesh.position.set(-1.5, floor.baseY, -47.25);
          cementedMesh.receiveShadow = true;
          cementedMesh.castShadow = true;
          floorGroup.add(cementedMesh);

          // Top sports court surface with authentic basketball & volleyball lines
          const courtTopMat = new THREE.MeshStandardMaterial({
            map: courtTexture,
            roughness: 0.85,
            metalness: 0.05
          });
          const courtTop = new THREE.Mesh(new THREE.PlaneGeometry(37.6, 25.6), courtTopMat);
          courtTop.rotation.x = -Math.PI / 2;
          courtTop.position.set(-1.5, floor.baseY + BUILDING_CONFIG.SLAB_H / 2 + 0.005, -47.25);
          courtTop.receiveShadow = true;
          floorGroup.add(courtTop);
        }
      }

      // Perimeter Handrails
      const railGeo = new THREE.BoxGeometry(BUILDING_CONFIG.SLAB_W, 0.85, 0.08);
      const railMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.6,
        metalness: 0.2
      });
      const capMat = new THREE.MeshBasicMaterial({ color: floor.color });

      [-BUILDING_CONFIG.SLAB_D / 2, BUILDING_CONFIG.SLAB_D / 2].forEach(rz => {
        const rail = new THREE.Mesh(railGeo, railMat);
        rail.position.set(0, floor.baseY + 0.45, rz);
        floorGroup.add(rail);

        const cap = new THREE.Mesh(new THREE.BoxGeometry(BUILDING_CONFIG.SLAB_W, 0.06, 0.14), capMat);
        cap.position.set(0, floor.baseY + 0.88, rz);
        floorGroup.add(cap);
      });

      // Render Architectural Non-Clickable Room Outlines (matching DXF blueprints)
      // Provides authentic structural partitioning on all floors (including 1F and unassigned classroom wings)
      // Strictly without interior models, text, or click/hover interaction.
      const floorOutlines = ARCHITECTURAL_ROOM_OUTLINES.filter(o => o.floorId === floor.id);

      if (floorOutlines.length > 0) {
        const passiveWallMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          roughness: 0.85,
          metalness: 0.05,
          transparent: true,
          opacity: 0.65
        });
        const passiveFloorMat = new THREE.MeshStandardMaterial({
          color: 0xd8e0e7,
          roughness: 0.95,
          metalness: 0.0,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1
        });
        const passiveLineMat = new THREE.LineBasicMaterial({
          color: 0x64748b,
          transparent: true,
          opacity: 0.60
        });

        const slabTopY = floor.level >= 2 ? floor.baseY + BUILDING_CONFIG.SLAB_H : floor.baseY + BUILDING_CONFIG.SLAB_H / 2;

        floorOutlines.forEach(outline => {
          const outlineGroup = new THREE.Group();
          outlineGroup.position.set(outline.x, slabTopY, outline.z);

          // Subtle interior floor tile
          const roomFloorGeo = new THREE.PlaneGeometry(outline.w * 0.96, outline.d * 0.96);
          const roomFloor = new THREE.Mesh(roomFloorGeo, passiveFloorMat);
          roomFloor.rotation.x = -Math.PI / 2;
          roomFloor.position.y = 0.02;
          roomFloor.receiveShadow = true;
          outlineGroup.add(roomFloor);

          // Low cutaway partition walls (height 0.50m, thickness 0.12m)
          // Inset by wallThickness / 2 to keep strictly within perimeter and prevent overlapping adjacent rooms
          const wallH = 0.50;
          const wallThickness = 0.12;

          const nw = new THREE.Mesh(new THREE.BoxGeometry(outline.w, wallH, wallThickness), passiveWallMat);
          nw.position.set(0, wallH / 2, -outline.d / 2 + wallThickness / 2);
          outlineGroup.add(nw);

          const sw = new THREE.Mesh(new THREE.BoxGeometry(outline.w, wallH, wallThickness), passiveWallMat);
          sw.position.set(0, wallH / 2, outline.d / 2 - wallThickness / 2);
          outlineGroup.add(sw);

          const sideWallD = Math.max(0.01, outline.d - wallThickness * 2);
          const ew = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallH, sideWallD), passiveWallMat);
          ew.position.set(-outline.w / 2 + wallThickness / 2, wallH / 2, 0);
          outlineGroup.add(ew);

          const ww = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallH, sideWallD), passiveWallMat);
          ww.position.set(outline.w / 2 - wallThickness / 2, wallH / 2, 0);
          outlineGroup.add(ww);

          // Top architectural wire outline
          const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(outline.w, wallH, outline.d));
          const wireOutline = new THREE.LineSegments(edgeGeo, passiveLineMat);
          wireOutline.position.y = wallH / 2;
          outlineGroup.add(wireOutline);

          floorGroup.add(outlineGroup);
        });
      }

      // Render Each Exhibit Room with CUTAWAY WALLS, 3D PROCEDURAL MOCKUPS & FLOATING LABELS
      floor.exhibits.forEach((exhibit) => {
        const isStairs = exhibit.id.includes('_str') || exhibit.id.includes('stairs');
        const subjInfo = SUBJECTS[exhibit.subject] || SUBJECTS.general;

        const roomGroup = new THREE.Group();
        roomGroup.position.set(exhibit.px, floor.baseY, exhibit.pz);
        floorGroup.add(roomGroup);

        const slabTopSurfaceY = floor.level >= 2
          ? floor.baseY + BUILDING_CONFIG.SLAB_H
          : floor.baseY + BUILDING_CONFIG.SLAB_H / 2;
        const localFloorY = slabTopSurfaceY - floor.baseY;

        // Room Floor Plate (Tint active exhibit rooms with bright vibrant department color)
        const isQuad = exhibit.id.includes('quad') || exhibit.room.toLowerCase().includes('quadrangle');
        const isStage = exhibit.id === 'g_stage' || exhibit.id.includes('stage');
        const isCemented = exhibit.id === 'g_cemented' || exhibit.id.includes('cemented');
        const categoryHex = isQuad ? 0x06b6d4 : (parseInt(subjInfo.css.replace('#', '0x'), 16) || subjInfo.color);

        const floorBaseColor = isQuad
          ? new THREE.Color(0xc4b7a8)
          : isCemented
          ? new THREE.Color(0xd1d5db)
          : isStairs
          ? new THREE.Color(0xd8e0e7)
          : new THREE.Color(categoryHex).lerp(new THREE.Color(0xffffff), 0.45);

        const roomFloorGeo = new THREE.PlaneGeometry(exhibit.w * 0.96, exhibit.d * 0.96);
        const roomFloorMat = new THREE.MeshStandardMaterial({
          color: floorBaseColor,
          roughness: 0.50,
          metalness: 0.05,
          emissive: isStairs || isQuad || isCemented ? new THREE.Color(0x000000) : new THREE.Color(categoryHex),
          emissiveIntensity: isStairs || isQuad || isCemented ? 0.0 : 0.22,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1
        });
        const roomFloor = new THREE.Mesh(roomFloorGeo, roomFloorMat);
        roomFloor.rotation.x = -Math.PI / 2;
        roomFloor.position.y = localFloorY + 0.02;
        roomFloor.receiveShadow = true;
        if (!isCemented) {
          roomGroup.add(roomFloor);
        }

        // Low Cutaway Perimeter Walls (Skip stairs, covered stage & cemented plaza to prevent clipping)
        const wallH = isStairs || isStage || isCemented ? 0.0 : 0.65;
        const wallThickness = 0.12;
        const wallMat = new THREE.MeshStandardMaterial({
          color: categoryHex,
          roughness: 0.2,
          metalness: 0.2,
          emissive: new THREE.Color(isStairs ? 0x000000 : categoryHex),
          emissiveIntensity: isStairs ? 0.0 : 0.35,
          transparent: true,
          opacity: 0.95
        });

        if (!isStairs && !isStage && !isCemented) {
          const nw = new THREE.Mesh(new THREE.BoxGeometry(exhibit.w, wallH, wallThickness), wallMat);
          nw.position.set(0, localFloorY + wallH / 2, -exhibit.d / 2 + wallThickness / 2);
          roomGroup.add(nw);

          // 2nd Floor North exterior classroom windows
          // Inset cleanly on top of cutaway wall aperture with depthWrite: false to eliminate z-fighting
          if (floor.id === 'second' && exhibit.pz <= -15.0) {
            const winMat = new THREE.MeshStandardMaterial({
              color: 0x93c5fd,
              roughness: 0.1,
              metalness: 0.7,
              transparent: true,
              opacity: 0.65,
              depthWrite: false
            });
            const winPane = new THREE.Mesh(new THREE.BoxGeometry(exhibit.w * 0.72, 0.45, 0.02), winMat);
            winPane.position.set(0, localFloorY + wallH + 0.25, -exhibit.d / 2 + wallThickness / 2);
            roomGroup.add(winPane);

            const winFrameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 });
            const winFrameTop = new THREE.Mesh(new THREE.BoxGeometry(exhibit.w * 0.74, 0.04, 0.04), winFrameMat);
            winFrameTop.position.set(0, localFloorY + wallH + 0.48, -exhibit.d / 2 + wallThickness / 2);
            roomGroup.add(winFrameTop);
          }

          const sw = new THREE.Mesh(new THREE.BoxGeometry(exhibit.w, wallH, wallThickness), wallMat);
          sw.position.set(0, localFloorY + wallH / 2, exhibit.d / 2 - wallThickness / 2);
          roomGroup.add(sw);

          const sideWallD = Math.max(0.01, exhibit.d - wallThickness * 2);
          const ew = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallH, sideWallD), wallMat);
          ew.position.set(-exhibit.w / 2 + wallThickness / 2, localFloorY + wallH / 2, 0);
          roomGroup.add(ew);

          const ww = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallH, sideWallD), wallMat);
          ww.position.set(exhibit.w / 2 - wallThickness / 2, localFloorY + wallH / 2, 0);
          roomGroup.add(ww);
        }

        // 3D Procedural Exhibit Mockup Model inside the room
        const { group: mockupGroup, anims } = createRoomMockup(exhibit.mockup, exhibit.w, exhibit.d, floor.level);
        if (exhibit.rotation !== undefined) {
          mockupGroup.rotation.y = exhibit.rotation;
        }
        roomGroup.add(mockupGroup);
        if (anims.length > 0) {
          anims.forEach(anim => animElements.push({ update: anim.update, floorId: floor.id, exhibitId: exhibit.id }));
        }

        // Remember the mockup's base material colors so the render loop can
        // grey out finished rooms and energize live ones from the clock
        if (!isStairs) {
          const snapshots: RoomMaterialSnapshot[] = [];
          mockupGroup.traverse(obj => {
            const mesh = obj as THREE.Mesh;
            if (!(mesh as any).isMesh) return;
            const mat = mesh.material as THREE.Material | THREE.Material[];
            const mats = Array.isArray(mat) ? mat : [mat];
            for (const m of mats) {
              const std = m as THREE.MeshStandardMaterial;
              // MeshPhysicalMaterial extends MeshStandardMaterial, so one
              // isMeshStandardMaterial check covers both emissive-capable types
              if (std.isMeshStandardMaterial) {
                snapshots.push({
                  mat: std,
                  baseColor: std.color.clone(),
                  baseEmissive: std.emissive.clone(),
                  baseEmissiveIntensity: std.emissiveIntensity
                });
              } else if ((m as THREE.MeshBasicMaterial).isMeshBasicMaterial) {
                snapshots.push({ mat: m, baseColor: (m as THREE.MeshBasicMaterial).color.clone() });
              }
            }
          });
          mockupMaterials.set(exhibit.id, snapshots);
        }

        // Raycasting Hit-Box spanning exact room volume (resting directly on floor slab surface)
        const hitBoxGeo = new THREE.BoxGeometry(exhibit.w, exhibit.h, exhibit.d);
        const hitBoxMat = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0.001,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
        hitBox.position.set(exhibit.px, slabTopSurfaceY + exhibit.h / 2, exhibit.pz);
        hitBox.userData = {
          floorId: floor.id,
          exhibitId: exhibit.id
        };
        floorGroup.add(hitBox);

        // Top Roof Accent Line - Color-coded by category (prominent 3D outline for open-air quads matching DXF)
        let outline: THREE.LineSegments;
        if (isQuad) {
          const quadBorderGeo = new THREE.EdgesGeometry(hitBoxGeo);
          const quadBorderMat = new THREE.LineBasicMaterial({
            color: 0x06b6d4, // Cyan matching LibreCAD DXF COURTYARD_VOID layer
            transparent: true,
            opacity: 1.0
          });
          outline = new THREE.LineSegments(quadBorderGeo, quadBorderMat);
          outline.position.y = 0.04; // Elevated 4cm above floor slab surface so bottom perimeter loop is crisp and never submerged
        } else {
          const edgeGeo = new THREE.EdgesGeometry(hitBoxGeo);
          const edgeMat = new THREE.LineBasicMaterial({
            color: isStairs ? 0x8c7e73 : categoryHex,
            transparent: true,
            opacity: isStairs ? 0.45 : 1.0
          });
          outline = new THREE.LineSegments(edgeGeo, edgeMat);
          outline.position.y = 0.04;
        }
        hitBox.add(outline);

        roomMeshes.set(exhibit.id, {
          mesh: hitBox,
          outline,
          floor,
          exhibit,
          baseMaterial: wallMat,
          wireColor: categoryHex,
          floorMaterial: roomFloorMat
        });

        // Room Name Label Sprite (Floating strictly on top of room with transparent background)
        if (!isStairs) {
          const labelSprite = createRoomLabelSprite(exhibit.room, subjInfo.css);
          const basePos = new THREE.Vector3(exhibit.px, floor.baseY + exhibit.h + 0.55, exhibit.pz);
          labelSprite.position.copy(basePos);
          labelSprite.userData = {
            floorId: floor.id,
            exhibitId: exhibit.id,
            subject: exhibit.subject,
            department: exhibit.department,
            roomName: exhibit.room,
            subjectColorHex: subjInfo.css,
            canvas: labelSprite.userData.canvas,
            texture: labelSprite.userData.texture
          };
          floorGroup.add(labelSprite);
          labelSprites.set(exhibit.id, labelSprite);
        }
      });
    });

    // Re-draw canvas textures when Apple/Google sans fonts finish loading
    if (typeof document !== 'undefined' && (document as any).fonts) {
      (document as any).fonts.ready.then(() => {
        labelSprites.forEach((sprite) => {
          const { canvas, texture, roomName, subjectColorHex } = sprite.userData;
          if (canvas && texture) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              drawRoomLabelCanvas(ctx, roomName, subjectColorHex);
              texture.needsUpdate = true;
            }
          }
        });
      });
    }

    animElementsRef.current = animElements;

    // 8. Robust Click & Pointer Selection Handlers
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downPointerPos = { x: 0, y: 0 };


    let cachedRect: DOMRect | null = null;
    let pointerNeedsRaycast = false;
    let isUserOrbiting = false;
    let lastRaycastCheckTime = 0;
    let lastHoveredExhibitId: string | null = null;

    controls.addEventListener('start', () => {
      isUserOrbiting = true;
    });

    controls.addEventListener('end', () => {
      isUserOrbiting = false;
      pointerNeedsRaycast = true;
    });

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isUserOrbiting = true;
      cachedRect = renderer.domElement.getBoundingClientRect();
      if ('touches' in e) {
        if (e.touches.length > 1) return;
        downPointerPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else {
        downPointerPos = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if ('touches' in e) return;
      if (!cachedRect) {
        cachedRect = renderer.domElement.getBoundingClientRect();
      }
      mouse.x = ((e.clientX - cachedRect.left) / cachedRect.width) * 2 - 1;
      mouse.y = -((e.clientY - cachedRect.top) / cachedRect.height) * 2 + 1;
      if (!isUserOrbiting) {
        pointerNeedsRaycast = true;
      }
    };

    const onPointerUp = (e: MouseEvent | TouchEvent) => {
      isUserOrbiting = false;
      let clientX: number;
      let clientY: number;

      if ('changedTouches' in e) {
        if (e.changedTouches.length === 0) return;
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const dx = clientX - downPointerPos.x;
      const dy = clientY - downPointerPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 22) {
        return;
      }

      if (!cachedRect) {
        cachedRect = renderer.domElement.getBoundingClientRect();
      }
      mouse.x = ((clientX - cachedRect.left) / cachedRect.width) * 2 - 1;
      mouse.y = -((clientY - cachedRect.top) / cachedRect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const curFloorId = stateRef.current.activeFloorId;
      const testEntries = Array.from(roomMeshes.values()).filter(r => {
        const parentGroup = floorGroups.get(r.floor.id);
        if (!parentGroup || !parentGroup.visible) return false;
        if (curFloorId !== null) {
          return r.floor.id === curFloorId;
        }
        return true;
      });

      const meshesToTest = testEntries.map(r => r.mesh);
      const intersects = raycaster.intersectObjects(meshesToTest, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const exId = hit.userData.exhibitId;
        const entry = roomMeshes.get(exId);
        if (entry) {
          stateRef.current.onSelectExhibit(entry.exhibit, entry.floor);
        }
      } else {
        if (stateRef.current.activeExhibitId) {
          stateRef.current.onSelectExhibit(null, null);
        } else if (stateRef.current.activeFloorId) {
          stateRef.current.onSelectFloor(null);
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onPointerDown);
    dom.addEventListener('mousemove', onPointerMove);
    dom.addEventListener('mouseup', onPointerUp);
    dom.addEventListener('touchstart', onPointerDown, { passive: true });
    dom.addEventListener('touchmove', onPointerMove, { passive: true });
    dom.addEventListener('touchend', onPointerUp, { passive: true });

    // 9. Resize Handling
    const handleResize = () => {
      if (!container) return;
      cachedRect = renderer.domElement.getBoundingClientRect();
      const aspect = container.clientWidth / container.clientHeight;
      const isPortrait = aspect < 1.0;
      camera.aspect = aspect;
      camera.fov = isPortrait ? 52 : 45;
      camera.updateProjectionMatrix();
      controls.maxDistance = isPortrait ? 140 : 70;
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation & Dynamic Zoom Auto-Fade Loop (Optimized 60/120 FPS)
    let animationFrameId: number;
    let lastStateExhibitId: string | null = null;
    let lastStateSubject: string = '';
    let lastLabelFloorId: string | null | undefined = undefined;
    let lastLabelExhibitId: string | null | undefined = undefined;
    let lastLabelSubject: string = '';
    let lastDistBucket: number = -1;
    let lastExteriorState: 'visible' | 'fading' | 'hidden' = 'visible';
    let lastExteriorOpacity: number = 1.0;
    let lastActivityRefresh: number = -Infinity;

    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);

      const curFloorId = stateRef.current.activeFloorId;
      const curExhibitId = stateRef.current.activeExhibitId;
      const curSubject = stateRef.current.activeSubjectFilter;
      const distToControlsTarget = camera.position.distanceTo(controls.target);

      // Update 3D Mock-up procedural animations (skip in distant aerial or during orbit drag to maintain silky 60+ FPS)
      const isDistantAerial = curFloorId === null && distToControlsTarget > 40.0;
      if (!isDistantAerial && !isUserOrbiting) {
        const allAnims = animElementsRef.current;
        for (let i = 0; i < allAnims.length; i++) {
          const anim = allAnims[i];
          if (curFloorId !== null && anim.floorId !== curFloorId) continue;
          // Rooms whose show has ended freeze mid-scene, dimmed like the schedule list
          if (anim.exhibitId && roomActivityStates.get(anim.exhibitId) === 'ended') continue;
          anim.update(time);
        }
      }

      // Refresh every room's clock-derived activity every 5 seconds: ended
      // rooms desaturate and freeze, live rooms glow brighter — mirroring the
      // schedule drawer's greyed-out past sessions.
      if (time - lastActivityRefresh > 5000) {
        lastActivityRefresh = time;
        const clockNow = new Date();
        roomMeshes.forEach((entry, exId) => {
          if (exId.includes('_str') || exId.includes('stairs')) return;
          const status = getLiveStatus(entry.exhibit, clockNow);
          if (roomActivityStates.get(exId) !== status) {
            roomActivityStates.set(exId, status);
            applyRoomActivity(exId, status);
          }
        });
      }

      // Handle Smooth Camera Flight
      const transition = transitionRef.current;
      if (transition.active) {
        const elapsed = time - transition.startTime;
        const rawT = Math.min(elapsed / transition.duration, 1.0);
        // Buttery smooth cubic ease in-out
        const ease = rawT < 0.5 ? 4 * rawT * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

        controls.enabled = false;
        camera.position.lerpVectors(transition.fromPos, transition.toPos, ease);
        controls.target.lerpVectors(transition.fromTarget, transition.toTarget, ease);

        if (transition.arcHeight > 0) {
          const arcLift = Math.sin(rawT * Math.PI) * transition.arcHeight;
          camera.position.y += arcLift;
        }

        camera.lookAt(controls.target);

        if (rawT >= 1.0) {
          transition.active = false;
          camera.position.copy(transition.toPos);
          controls.target.copy(transition.toTarget);
          controls.enabled = true;
          controls.update();
        }
      } else {
        controls.update();
      }

      // DYNAMIC ZOOM AUTO-FADE FOR ARCHITECTURAL EXTERIOR SHELL (Threshold-cached to prevent per-frame traversals)
      if (archModelRef.current) {
        const hasSpecificFocus = curFloorId !== null || curExhibitId !== null;
        if (hasSpecificFocus) {
          if (lastExteriorState !== 'hidden') {
            archModelRef.current.setExteriorVisible(false);
            lastExteriorState = 'hidden';
            lastExteriorOpacity = 0;
          }
        } else {
          // In aerial ALL view: calculate camera distance to target
          const distToTarget = camera.position.distanceTo(controls.target);
          const zoomFadeThreshold = 26.0;
          const fullHideThreshold = 18.0;

          if (distToTarget < fullHideThreshold) {
            if (lastExteriorState !== 'hidden') {
              archModelRef.current.setExteriorVisible(false);
              lastExteriorState = 'hidden';
              lastExteriorOpacity = 0;
            }
          } else if (distToTarget < zoomFadeThreshold) {
            if (lastExteriorState !== 'fading') {
              archModelRef.current.setExteriorVisible(true);
              lastExteriorState = 'fading';
            }
            const fadeFactor = (distToTarget - fullHideThreshold) / (zoomFadeThreshold - fullHideThreshold);
            if (Math.abs(fadeFactor - lastExteriorOpacity) > 0.03) {
              archModelRef.current.setOpacity(fadeFactor);
              lastExteriorOpacity = fadeFactor;
            }
          } else {
            if (lastExteriorState !== 'visible' || lastExteriorOpacity !== 1.0) {
              archModelRef.current.setExteriorVisible(true);
              archModelRef.current.setOpacity(1.0);
              lastExteriorState = 'visible';
              lastExteriorOpacity = 1.0;
            }
          }
        }
      }

      // Adjust Active Room Highlights (Bright, vibrant, noticeable active exhibit rooms)
      if (curExhibitId !== lastStateExhibitId || curSubject !== lastStateSubject) {
        lastStateExhibitId = curExhibitId;
        lastStateSubject = curSubject;

        roomMeshes.forEach(({ outline, exhibit, wireColor, baseMaterial, floorMaterial }) => {
          const matchesSubject = matchesFilterSubject(curSubject, exhibit.subject, exhibit.department);
          const isSelected = curExhibitId === exhibit.id;
          const outlineMat = outline.material as THREE.LineBasicMaterial;
          const isStairs = exhibit.id.includes('_str') || exhibit.id.includes('stairs');

          if (!isSelected) {
            if (matchesSubject) {
              baseMaterial.emissive.setHex(isStairs ? 0x000000 : wireColor);
              baseMaterial.emissiveIntensity = isStairs ? 0.0 : 0.35;
              baseMaterial.opacity = 0.95;
              if (floorMaterial && !isStairs && !exhibit.id.includes('quad') && !exhibit.id.includes('cemented')) {
                floorMaterial.emissive.setHex(wireColor);
                floorMaterial.emissiveIntensity = 0.22;
                floorMaterial.opacity = 1.0;
              }
              outlineMat.color.setHex(wireColor);
              outlineMat.opacity = isStairs ? 0.45 : 1.0;
            } else {
              baseMaterial.emissive.setHex(0x000000);
              baseMaterial.emissiveIntensity = 0.0;
              baseMaterial.opacity = 0.12;
              if (floorMaterial && !isStairs) {
                floorMaterial.emissive.setHex(0x000000);
                floorMaterial.emissiveIntensity = 0.0;
                floorMaterial.opacity = 0.20;
              }
              outlineMat.color.setHex(0xcbd5e1);
              outlineMat.opacity = 0.25;
            }
          }
        });
      }

      // Animate pulsing glow on selected room only
      if (curExhibitId) {
        const selEntry = roomMeshes.get(curExhibitId);
        if (selEntry) {
          const pulse = (Math.sin(time * 0.007) + 1) * 0.5;
          selEntry.baseMaterial.emissive.setHex(selEntry.wireColor);
          selEntry.baseMaterial.emissiveIntensity = 0.6 + pulse * 0.4;
          selEntry.baseMaterial.opacity = 1.0;
          if (selEntry.floorMaterial) {
            selEntry.floorMaterial.emissive.setHex(selEntry.wireColor);
            selEntry.floorMaterial.emissiveIntensity = 0.4 + pulse * 0.3;
          }
          (selEntry.outline.material as THREE.LineBasicMaterial).color.setHex(0xa4502f);
          (selEntry.outline.material as THREE.LineBasicMaterial).opacity = 1.0;
        }
      }

      // Throttled Raycaster Check (~25 FPS when hovering, paused during orbit rotation to prevent stutter)
      if (!isUserOrbiting && pointerNeedsRaycast && time - lastRaycastCheckTime > 36) {
        pointerNeedsRaycast = false;
        lastRaycastCheckTime = time;
        raycaster.setFromCamera(mouse, camera);

        let topHitExhibit: Exhibit | null = null;

        for (const entry of roomMeshes.values()) {
          const parentGroup = floorGroups.get(entry.floor.id);
          if (!parentGroup || !parentGroup.visible) continue;
          if (curFloorId !== null && entry.floor.id !== curFloorId) continue;

          const hit = raycaster.intersectObject(entry.mesh, false);
          if (hit.length > 0) {
            topHitExhibit = entry.exhibit;
            break;
          }
        }

        if (topHitExhibit) {
          if (topHitExhibit.id !== lastHoveredExhibitId) {
            lastHoveredExhibitId = topHitExhibit.id;
            container.style.cursor = 'pointer';
            stateRef.current.onHoverExhibit(topHitExhibit);
            window.dispatchEvent(new CustomEvent('scientifica-hover-exhibit', { detail: topHitExhibit }));
          }
        } else if (lastHoveredExhibitId !== null) {
          lastHoveredExhibitId = null;
          container.style.cursor = 'default';
          stateRef.current.onHoverExhibit(null);
          window.dispatchEvent(new CustomEvent('scientifica-hover-exhibit', { detail: null }));
        }
      }

      // Dynamic Floor & Room Label Visibility (cached to avoid looping & mutating 50 materials every single frame)
      const isAllBuildingView = curFloorId === null && curExhibitId === null;
      const distBucket = Math.round(distToControlsTarget * 0.2); // 5m buckets

      if (
        curFloorId !== lastLabelFloorId ||
        curExhibitId !== lastLabelExhibitId ||
        curSubject !== lastLabelSubject ||
        distBucket !== lastDistBucket
      ) {
        lastLabelFloorId = curFloorId;
        lastLabelExhibitId = curExhibitId;
        lastLabelSubject = curSubject;
        lastDistBucket = distBucket;

        // In "ALL" building view: show floor-level badges
        const showFloorBadges = isAllBuildingView && distToControlsTarget >= 22.0;
        floorLabelSprites.forEach((fSprite) => {
          if (fSprite.visible !== showFloorBadges) {
            fSprite.visible = showFloorBadges;
          }
        });

        // Room labels hovering on top of rooms
        labelSprites.forEach((sprite) => {
          const sFloor = sprite.userData.floorId;
          const sSubj = sprite.userData.subject;
          const sExId = sprite.userData.exhibitId;
          const isSelected = curExhibitId === sExId;

          let shouldShow = false;

          if (curFloorId === null) {
            // In ALL building aerial view: show when matching subject filter or approaching room
            if (curSubject !== 'all') {
              shouldShow = matchesFilterSubject(curSubject, sSubj, sprite.userData.department);
            } else {
              // Always show room labels as camera approaches or zooms in (< 52m)
              const distToCam = camera.position.distanceTo(sprite.position);
              shouldShow = distToCam < 48 || distToControlsTarget < 52;
            }
          } else if (curFloorId === sFloor) {
            // When focusing on this floor:
            // ALWAYS KEEP VISIBLE on zoom in! (Never disappear when close!)
            const matchesSubject = matchesFilterSubject(curSubject, sSubj, sprite.userData.department);
            shouldShow = matchesSubject || isSelected;
          }

          if (sprite.visible !== shouldShow) {
            sprite.visible = shouldShow;
          }
          if (shouldShow) {
            const mat = sprite.material as THREE.SpriteMaterial;
            const targetOpacity = curExhibitId && !isSelected ? 0.45 : 1.0;
            if (mat.opacity !== targetOpacity) {
              mat.opacity = targetOpacity;
            }
          }
        });
      }

      // Animate 3D Navigation Path Flow & Pin Beacons (suppressed when the
      // visitor prefers reduced motion — continuous oscillation is the part
      // that causes vestibular discomfort)
      if (!reducedMotion) {
        if (navLineRef.current) {
          const mat = navLineRef.current.material as THREE.LineDashedMaterial;
          mat.scale = 1.0 + Math.sin(time * 0.005) * 0.15;
        }
        if (navStartPinRef.current?.userData?.ring) {
          const ring = navStartPinRef.current.userData.ring as THREE.Mesh;
          const pulse = 1.0 + Math.sin(time * 0.006) * 0.25;
          ring.scale.set(pulse, pulse, 1.0);
        }
        if (navEndPinRef.current?.userData?.ring) {
          const ring = navEndPinRef.current.userData.ring as THREE.Mesh;
          const pulse = 1.0 + Math.sin(time * 0.008) * 0.3;
          ring.scale.set(pulse, pulse, 1.0);
        }
      }

      // Animate You Are Here landmark marker
      yohGroup.visible = (curFloorId === null || curFloorId === 'ground') && !curExhibitId;
      if (yohGroup.visible && !reducedMotion) {
        const ringPulse = 1.0 + Math.sin(time * 0.005) * 0.25;
        yohRing.scale.set(ringPulse, ringPulse, 1.0);
        yohRingMat.opacity = 0.5 + Math.sin(time * 0.005) * 0.35;
      } else if (yohGroup.visible) {
        yohRingMat.opacity = 0.7;
      }

      if (!contextLostRef.current) {
        renderer.render(scene, camera);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onPointerDown);
      dom.removeEventListener('mousemove', onPointerMove);
      dom.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('touchstart', onPointerDown);
      dom.removeEventListener('touchmove', onPointerMove);
      dom.removeEventListener('touchend', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost, false);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored, false);

      // Free all GPU resources. three.js re-uploads disposed geometries,
      // materials and canvas textures on demand, so module-level shared
      // resources (e.g. computer screen sims) survive a remount safely.
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (!mat) return;
        const mats = Array.isArray(mat) ? mat : [mat];
        for (const m of mats) {
          for (const value of Object.values(m)) {
            if (value && (value as THREE.Texture).isTexture) {
              (value as THREE.Texture).dispose();
            }
          }
          m.dispose();
        }
      });
      scene.clear();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing touch-none"
      role="application"
      aria-label="Interactive 3D map of the Scientifica exhibition building. Drag to orbit, scroll to zoom, tap a room for details."
    >
      {contextLost && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100/70 backdrop-blur-md">
          <div className="liquid-glass-panel rounded-3xl px-8 py-6 text-center animate-in fade-in duration-300">
            <p className="text-sm font-extrabold tracking-tight text-slate-900">Restoring graphics…</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              The display engine was interrupted by your device. It will resume automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
