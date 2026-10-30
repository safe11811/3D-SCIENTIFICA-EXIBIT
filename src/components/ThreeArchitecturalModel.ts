import * as THREE from 'three';
import { BUILDING_CONFIG } from '../data';

export interface ArchitecturalModelBundle {
  group: THREE.Group;
  setFloorIsolation: (floorLevel: number | null) => void;
  getExteriorVisible: () => boolean;
  setExteriorVisible: (visible: boolean) => void;
  setOpacity: (alpha: number) => void;
}

/**
 * Builds the realistic 3D architectural building model matching the Sun Designers perspective rendering
 * and real NPS Yeshwanthpur photos:
 * - Iconic front protruding portico / cantilever box ("the parapet") in front of Reception
 * - 2 front rectangular supporting pillars holding up the portico
 * - 3 vertical narrow slot windows on the side walls of the protruding box
 * - Deep brown protruding shadow-box window surrounds on classroom wings
 * - Upper continuous brown horizontal ribbon bands
 * - Pitched / sloped gable roof profile on the rear-left auditorium wing
 * - Rooftop parapet with brown coping and central elevator penthouse
 * - Semi-transparent architectural materials allowing interior rooms to show through
 */
export function createArchitecturalModel(): ArchitecturalModelBundle {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'ArchitecturalSchoolModel';

  let isExteriorVisible = true;
  let currentFloorLevel: number | null = null;

  // 1. Architectural Materials Palette (Real NPS Yeshwanthpur colors)
  const baseCreamAlpha = 0.44;
  const baseBrownAlpha = 0.60;
  const baseWhiteAlpha = 0.72;
  const baseGlassAlpha = 0.35;
  const baseRoofAlpha  = 0.50;

  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xf4eee3,
    roughness: 0.80,
    metalness: 0.04,
    transparent: true,
    opacity: baseCreamAlpha,
    depthWrite: true,
    side: THREE.FrontSide
  });

  const brownMat = new THREE.MeshStandardMaterial({
    color: 0x5b3a2e,
    roughness: 0.65,
    metalness: 0.10,
    transparent: true,
    opacity: baseBrownAlpha,
    depthWrite: true,
    side: THREE.FrontSide
  });

  const whiteTrimMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.70,
    metalness: 0.05,
    transparent: true,
    opacity: baseWhiteAlpha,
    depthWrite: true
  });

  // Lightweight glass material (standard material instead of transmission physical pass)
  // A soft emissive tint keeps every window reading as lit interior glass
  // instead of a black hole at glancing camera angles
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xdce6ec,
    transparent: true,
    opacity: baseGlassAlpha,
    roughness: 0.20,
    metalness: 0.10,
    emissive: 0x8fb8d4,
    emissiveIntensity: 0.30,
    depthWrite: false
  });

  const windowFrameMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.70,
    metalness: 0.05,
    transparent: true,
    opacity: baseWhiteAlpha,
    depthWrite: false
  });

  const roofTileMat = new THREE.MeshStandardMaterial({
    color: 0x6b5a4e,
    roughness: 0.75,
    metalness: 0.10,
    transparent: true,
    opacity: baseRoofAlpha,
    depthWrite: false,
    side: THREE.FrontSide
  });

  const lineMat = new THREE.LineBasicMaterial({
    color: 0x94877e,
    transparent: false
  });

  // CAD wireframes for clean architectural lines
  function addCadEdges(mesh: THREE.Mesh, parent: THREE.Object3D) {
    const edges = new THREE.EdgesGeometry(mesh.geometry);
    const line = new THREE.LineSegments(edges, lineMat);
    line.position.copy(mesh.position);
    line.rotation.copy(mesh.rotation);
    line.scale.copy(mesh.scale);
    parent.add(line);
  }

  // Groups for smart floor isolation and cutaway
  const facadeFrontGroup = new THREE.Group();
  facadeFrontGroup.name = 'FacadeFront';
  rootGroup.add(facadeFrontGroup);

  const facadeRearGroup = new THREE.Group();
  facadeRearGroup.name = 'FacadeRear';
  rootGroup.add(facadeRearGroup);

  const facadeSidesGroup = new THREE.Group();
  facadeSidesGroup.name = 'FacadeSides';
  rootGroup.add(facadeSidesGroup);

  const roofGroup = new THREE.Group();
  roofGroup.name = 'RoofParapet';
  rootGroup.add(roofGroup);

  const W = BUILDING_CONFIG.SLAB_W; // 36
  const D = BUILDING_CONFIG.SLAB_D; // 28
  const halfW = W / 2; // 18
  const halfD = D / 2; // 14
  const baseGroundY = 6.5;
  const topRoofY = 26.0;
  const totalH = topRoofY - baseGroundY; // 19.5

  // =========================================================================
  // 1. FRONT PROTRUDING PORTICO & PARAPET CANOPY (Holding Library, Y: 13.1 to 18.9)
  // Matching real photos, Sun Designers rendering & DXF Stage (16.0m x 6.0m)
  // =========================================================================
  const porticoBoxW = BUILDING_CONFIG.STAGE.w; // 16.0
  const porticoBoxH = 5.8;
  const porticoBoxD = BUILDING_CONFIG.STAGE.d; // 6.0 deep architectural cantilever
  const boxCenterY = 16.0;
  const boxCenterZ = BUILDING_CONFIG.STAGE.z; // -24.25

  const porticoGroup = new THREE.Group();
  porticoGroup.name = 'FrontParapetPortico';
  facadeFrontGroup.add(porticoGroup);

  // A. White Outer Border Framing
  const frameThickness = 0.45;

  // Top Frame
  const topFrame = new THREE.Mesh(new THREE.BoxGeometry(porticoBoxW, frameThickness, porticoBoxD), whiteTrimMat);
  topFrame.position.set(0, boxCenterY + porticoBoxH / 2 - frameThickness / 2, boxCenterZ);
  porticoGroup.add(topFrame);
  addCadEdges(topFrame, porticoGroup);

  // Bottom Frame / Soffit
  const bottomFrame = new THREE.Mesh(new THREE.BoxGeometry(porticoBoxW, frameThickness, porticoBoxD), whiteTrimMat);
  bottomFrame.position.set(0, boxCenterY - porticoBoxH / 2 + frameThickness / 2, boxCenterZ);
  porticoGroup.add(bottomFrame);
  addCadEdges(bottomFrame, porticoGroup);

  // Left & Right Outer Side Frame Walls
  [-porticoBoxW / 2 + frameThickness / 2, porticoBoxW / 2 - frameThickness / 2].forEach(fx => {
    const sideFrame = new THREE.Mesh(new THREE.BoxGeometry(frameThickness, porticoBoxH - frameThickness * 2, porticoBoxD), whiteTrimMat);
    sideFrame.position.set(fx, boxCenterY, boxCenterZ);
    porticoGroup.add(sideFrame);
    addCadEdges(sideFrame, porticoGroup);
  });

  // B. Three Vertical Slot Windows on BOTH Left and Right Side Walls of the Cantilever Box!
  const slotZOffsets = [-1.5, 0.0, 1.5];
  const slotW = 0.5;
  const slotH = 2.6;

  [-porticoBoxW / 2, porticoBoxW / 2].forEach(sx => {
    const isLeft = sx < 0;
    slotZOffsets.forEach(sz => {
      // Dark brown surround frame for slot - cleanly offset to exterior face without clipping white side frame
      const slotFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, slotH + 0.25, slotW + 0.25), brownMat);
      slotFrame.position.set(sx + (isLeft ? -0.08 : 0.08), boxCenterY, boxCenterZ + sz);
      porticoGroup.add(slotFrame);
      addCadEdges(slotFrame, porticoGroup);

      // Glass inside the slot
      const slotGlass = new THREE.Mesh(new THREE.BoxGeometry(0.08, slotH, slotW), glassMat);
      slotGlass.position.set(sx + (isLeft ? -0.08 : 0.08), boxCenterY, boxCenterZ + sz);
      porticoGroup.add(slotGlass);
    });
  });

  // C. Front Panoramic Glass Ribbon Windows
  const frontGlassPane = new THREE.Mesh(new THREE.BoxGeometry(porticoBoxW - frameThickness * 2, porticoBoxH - frameThickness * 2, 0.08), glassMat);
  frontGlassPane.position.set(0, boxCenterY, boxCenterZ - porticoBoxD / 2 + 0.08);
  porticoGroup.add(frontGlassPane);

  // White Vertical Mullions on front ribbon
  const numPanes = 10;
  const mullionSpacing = (porticoBoxW - frameThickness * 2) / numPanes;
  for (let i = 1; i < numPanes; i++) {
    const mx = -(porticoBoxW - frameThickness * 2) / 2 + i * mullionSpacing;
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.08, porticoBoxH - frameThickness * 2, 0.12), windowFrameMat);
    mullion.position.set(mx, boxCenterY, boxCenterZ - porticoBoxD / 2 + 0.08);
    porticoGroup.add(mullion);
  }

  // Horizontal Mid-Transom
  const transom = new THREE.Mesh(new THREE.BoxGeometry(porticoBoxW - frameThickness * 2, 0.08, 0.12), windowFrameMat);
  transom.position.set(0, boxCenterY, boxCenterZ - porticoBoxD / 2 + 0.08);
  porticoGroup.add(transom);

  // D. Ground Floor Covered Entrance, Portico Deck & EXACTLY 2 PILLARS
  // 1. Raised Parapet Platform Deck directly in front of Reception
  const stageDeck = new THREE.Mesh(new THREE.BoxGeometry(porticoBoxW + 0.8, 0.6, porticoBoxD + 0.8), creamMat);
  stageDeck.position.set(0, baseGroundY + 0.3, boxCenterZ);
  stageDeck.receiveShadow = true;
  porticoGroup.add(stageDeck);
  addCadEdges(stageDeck, porticoGroup);

  // Low Apron Steps leading down from Parapet
  const apronSteps = new THREE.Mesh(new THREE.BoxGeometry(porticoBoxW + 1.6, 0.25, 1.2), creamMat);
  apronSteps.position.set(0, baseGroundY + 0.125, boxCenterZ - (porticoBoxD + 0.8) / 2 - 0.6);
  porticoGroup.add(apronSteps);

  // 2. EXACTLY 2 SUPPORTING PILLARS AT THE FRONT CORNERS OF THE PORTICO
  const pillarGeo = new THREE.BoxGeometry(0.9, 6.0, 0.9);
  [-7.0, 7.0].forEach(px => {
    const pillar = new THREE.Mesh(pillarGeo, creamMat);
    pillar.position.set(px, baseGroundY + 3.0, boxCenterZ - porticoBoxD / 2 + 0.55);
    pillar.castShadow = true;
    porticoGroup.add(pillar);
    addCadEdges(pillar, porticoGroup);

    // Dark plinth base at bottom of pillar
    const pBase = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.5, 1.05), brownMat);
    pBase.position.set(px, baseGroundY + 0.25, boxCenterZ - porticoBoxD / 2 + 0.55);
    porticoGroup.add(pBase);
  });

  // 3. Ground Floor Reception Facade & Main Entrance Doors (directly behind the Parapet)
  const recepWall = new THREE.Mesh(new THREE.BoxGeometry(porticoBoxW - 0.2, 5.8, 0.3), creamMat);
  recepWall.position.set(0, baseGroundY + 3.2, -halfD + 0.15);
  porticoGroup.add(recepWall);

  // Main School Entrance Double Glass Doors
  const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.2, 0.12), glassMat);
  doorMesh.position.set(0, baseGroundY + 2.2, -halfD + 0.32);
  porticoGroup.add(doorMesh);

  // Dark door surround frame
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(4.8, 3.5, 0.15), brownMat);
  doorFrame.position.set(0, baseGroundY + 2.3, -halfD + 0.3);
  porticoGroup.add(doorFrame);

  // Flanking Reception Windows on either side of the entrance doors
  [-4.8, 4.8].forEach(wx => {
    const rWin = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.2, 0.1), glassMat);
    rWin.position.set(wx, baseGroundY + 2.5, -halfD + 0.32);
    porticoGroup.add(rWin);

    const rFrame = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.5, 0.14), brownMat);
    rFrame.position.set(wx, baseGroundY + 2.5, -halfD + 0.3);
    porticoGroup.add(rFrame);
  });

  // =========================================================================
  // 2. FRONT FACADE ELEVATION (Z = -halfD = -21.25)
  // Deep brown protruding shadow boxes & upper horizontal bands
  // =========================================================================

  // A. Vertical Espresso Brown Pilaster Towers - terminate cleanly at roofline to prevent parapet clipping
  const pilasterH = totalH;
  const pilasterPositions: [number, number, number, boolean][] = [
    [-8.2, baseGroundY + pilasterH / 2, -halfD - 0.22, false],
    [8.2, baseGroundY + pilasterH / 2, -halfD - 0.22, false],
    [-halfW + 0.45, baseGroundY + pilasterH / 2, -halfD - 0.22, true],
    [halfW - 0.45, baseGroundY + pilasterH / 2, -halfD - 0.22, true]
  ];

  pilasterPositions.forEach(([px, py, pz, isCorner]) => {
    const pilMesh = new THREE.Mesh(new THREE.BoxGeometry(isCorner ? 0.9 : 1.2, pilasterH, 0.65), brownMat);
    pilMesh.position.set(px, py, pz);
    pilMesh.castShadow = true;
    facadeFrontGroup.add(pilMesh);
    addCadEdges(pilMesh, facadeFrontGroup);
  });

  // B. Left and Right Classroom Wings with PROTRUDING BROWN SHADOW-BOX WINDOWS
  const flankW = 14.4;
  [-15.6, 15.6].forEach(fx => {
    // Cream wall backing
    const flankWall = new THREE.Mesh(new THREE.BoxGeometry(flankW, totalH, 0.35), creamMat);
    flankWall.position.set(fx, baseGroundY + totalH / 2, -halfD - 0.1);
    flankWall.castShadow = true;
    facadeFrontGroup.add(flankWall);
    addCadEdges(flankWall, facadeFrontGroup);

    // Ground Floor: 2 pairs of crisp windows per classroom wing
    [-3.8, 3.8].forEach(mx => {
      const gWin = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.8, 0.1), glassMat);
      gWin.position.set(fx + mx, baseGroundY + 2.0, -halfD - 0.2);
      facadeFrontGroup.add(gWin);

      const gFrame = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.1, 0.18), whiteTrimMat);
      gFrame.position.set(fx + mx, baseGroundY + 2.0, -halfD - 0.16);
      facadeFrontGroup.add(gFrame);
    });

    // 1st Floor & 2nd Floor: Protruding Shadow Boxes per wing
    [15.0, 21.5].forEach(boxY => {
      [-3.8, 3.8].forEach(mx => {
        const shadowBox = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.4, 0.55), brownMat);
        shadowBox.position.set(fx + mx, boxY, -halfD - 0.28);
        facadeFrontGroup.add(shadowBox);
        addCadEdges(shadowBox, facadeFrontGroup);

        // Windows inside the shadow box
        [-1.2, 1.2].forEach(wx => {
          const win = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.7, 0.1), glassMat);
          win.position.set(fx + mx + wx, boxY, -halfD - 0.45);
          facadeFrontGroup.add(win);

          const mul = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.7, 0.12), windowFrameMat);
          mul.position.set(fx + mx + wx, boxY, -halfD - 0.45);
          facadeFrontGroup.add(mul);
        });
      });
    });
  });

  // C. Second Floor Center Facade & Continuous Classroom Ribbon Windows (Above the Portico Cantilever Box)
  // Derived directly from the real NPS Yeshwanthpur building architecture (public/school.jpg)
  const center2FWallH = 6.5; // spans from 1F roof/2F slab (Y=19.5) up to roof (Y=26.0)
  const center2FY = 19.5 + center2FWallH / 2; // Y = 22.75
  const center2FW = 15.2; // between pilasters at x = -8.2 and +8.2

  // Cream wall backing
  const center2FWall = new THREE.Mesh(new THREE.BoxGeometry(center2FW, center2FWallH, 0.35), creamMat);
  center2FWall.position.set(0, center2FY, -halfD - 0.1);
  center2FWall.castShadow = true;
  facadeFrontGroup.add(center2FWall);
  addCadEdges(center2FWall, facadeFrontGroup);

  // Prominent deep brown horizontal window surround band matching preview_school.png
  const center2FSurround = new THREE.Mesh(new THREE.BoxGeometry(center2FW - 0.4, 2.5, 0.55), brownMat);
  center2FSurround.position.set(0, 22.5, -halfD - 0.28);
  facadeFrontGroup.add(center2FSurround);
  addCadEdges(center2FSurround, facadeFrontGroup);

  // Panoramic classroom ribbon glass pane inside the surround
  const center2FGlass = new THREE.Mesh(new THREE.BoxGeometry(center2FW - 0.8, 1.9, 0.1), glassMat);
  center2FGlass.position.set(0, 22.5, -halfD - 0.45);
  facadeFrontGroup.add(center2FGlass);

  // White window sill underneath
  const center2FSill = new THREE.Mesh(new THREE.BoxGeometry(center2FW - 0.2, 0.12, 0.22), whiteTrimMat);
  center2FSill.position.set(0, 22.5 - 1.0, -halfD - 0.38);
  facadeFrontGroup.add(center2FSill);

  // Vertical white mullions dividing ribbon window into 6 balanced panes
  const numCenter2FMullions = 5;
  const center2FMullionSpacing = (center2FW - 0.8) / (numCenter2FMullions + 1);
  for (let i = 1; i <= numCenter2FMullions; i++) {
    const mx = -(center2FW - 0.8) / 2 + i * center2FMullionSpacing;
    const mul = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.9, 0.12), windowFrameMat);
    mul.position.set(mx, 22.5, -halfD - 0.45);
    facadeFrontGroup.add(mul);
  }

  // Horizontal white transom bar
  const center2FTransom = new THREE.Mesh(new THREE.BoxGeometry(center2FW - 0.8, 0.08, 0.12), windowFrameMat);
  center2FTransom.position.set(0, 22.5 + 0.45, -halfD - 0.45);
  facadeFrontGroup.add(center2FTransom);

  // D. 2nd Floor & 1st Floor Outer Corner Windows (matching vertical column in preview_school.png)
  // Sits PROUD of the flank wall face (wall front at -halfD - 0.275) — embedding
  // the frames inside the wall slab made them z-fight into dark smudges
  [-21.2, 21.2].forEach(cx => {
    [15.0, 22.0].forEach(cy => {
      const cornerWin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 0.1), glassMat);
      cornerWin.position.set(cx, cy, -halfD - 0.18);
      facadeFrontGroup.add(cornerWin);

      const cornerFrame = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.3, 0.18), whiteTrimMat);
      cornerFrame.position.set(cx, cy, -halfD - 0.15);
      facadeFrontGroup.add(cornerFrame);
    });
  });

  // =========================================================================
  // 3. REAR ELEVATION (Z = +halfD = +21.25)
  // =========================================================================
  const rearWall = new THREE.Mesh(new THREE.BoxGeometry(W, totalH, 0.35), creamMat);
  rearWall.position.set(0, baseGroundY + totalH / 2, halfD + 0.1);
  rearWall.castShadow = true;
  facadeRearGroup.add(rearWall);
  addCadEdges(rearWall, facadeRearGroup);

  [-22.0, -11.0, 0, 11.0, 22.0].forEach(rx => {
    const rPil = new THREE.Mesh(new THREE.BoxGeometry(1.4, pilasterH, 0.6), brownMat);
    rPil.position.set(rx, baseGroundY + pilasterH / 2, halfD + 0.2);
    facadeRearGroup.add(rPil);
    addCadEdges(rPil, facadeRearGroup);
  });

  [9.0, 15.5, 22.0].forEach(floorY => {
    [-16.0, -5.5, 5.5, 16.0].forEach(bx => {
      const brownBand = new THREE.Mesh(new THREE.BoxGeometry(8.5, 2.2, 0.45), brownMat);
      brownBand.position.set(bx, floorY, halfD + 0.1);
      facadeRearGroup.add(brownBand);
      addCadEdges(brownBand, facadeRearGroup);

      const rGlass = new THREE.Mesh(new THREE.BoxGeometry(8.0, 1.6, 0.1), glassMat);
      rGlass.position.set(bx, floorY, halfD + 0.22);
      facadeRearGroup.add(rGlass);

      const rSill = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.12, 0.22), whiteTrimMat);
      rSill.position.set(bx, floorY - 1.15, halfD + 0.2);
      facadeRearGroup.add(rSill);
    });
  });

  // =========================================================================
  // 4. SIDE ELEVATIONS (West X = -23.0 & East X = +23.0)
  // =========================================================================
  [-halfW, halfW].forEach(sx => {
    const isWest = sx < 0;
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.35, totalH, D), creamMat);
    sideWall.position.set(sx + (isWest ? -0.1 : 0.1), baseGroundY + totalH / 2, 0);
    sideWall.castShadow = true;
    facadeSidesGroup.add(sideWall);
    addCadEdges(sideWall, facadeSidesGroup);

    // Rhythm of classroom windows with dark brown frames
    [-14.0, -7.0, 0, 7.0, 14.0].forEach(sz => {
      [9.0, 15.5, 22.0].forEach(sy => {
        const sideSurround = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.8, 3.8), brownMat);
        sideSurround.position.set(sx + (isWest ? -0.15 : 0.15), sy, sz);
        facadeSidesGroup.add(sideSurround);
        addCadEdges(sideSurround, facadeSidesGroup);

        const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.4, 3.4), glassMat);
        sideGlass.position.set(sx + (isWest ? -0.22 : 0.22), sy, sz);
        facadeSidesGroup.add(sideGlass);

        const sideSill = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 4.0), whiteTrimMat);
        sideSill.position.set(sx + (isWest ? -0.2 : 0.2), sy - 0.95, sz);
        facadeSidesGroup.add(sideSill);
      });
    });
  });

  // =========================================================================
  // 5. ROOF SILHOUETTE & PERIMETER PARAPET
  // =========================================================================
  const parapetH = 1.0;
  const parapetWallGeoNorth = new THREE.BoxGeometry(W + 0.6, parapetH, 0.35);
  const parapetWallGeoEast = new THREE.BoxGeometry(0.35, parapetH, D + 0.6);

  // Perimeter parapet walls
  const pNorth = new THREE.Mesh(parapetWallGeoNorth, creamMat);
  pNorth.position.set(0, topRoofY + parapetH / 2, -halfD - 0.1);
  roofGroup.add(pNorth);
  addCadEdges(pNorth, roofGroup);

  const pSouth = new THREE.Mesh(parapetWallGeoNorth, creamMat);
  pSouth.position.set(0, topRoofY + parapetH / 2, halfD + 0.1);
  roofGroup.add(pSouth);
  addCadEdges(pSouth, roofGroup);

  const pWest = new THREE.Mesh(parapetWallGeoEast, creamMat);
  pWest.position.set(-halfW - 0.1, topRoofY + parapetH / 2, 0);
  roofGroup.add(pWest);
  addCadEdges(pWest, roofGroup);

  const pEast = new THREE.Mesh(parapetWallGeoEast, creamMat);
  pEast.position.set(halfW + 0.1, topRoofY + parapetH / 2, 0);
  roofGroup.add(pEast);
  addCadEdges(pEast, roofGroup);

  // Continuous brown parapet coping clasping top perimeter (snug overlap eliminates z-fighting)
  const copingNorth = new THREE.Mesh(new THREE.BoxGeometry(W + 1.2, 0.14, 0.52), brownMat);
  copingNorth.position.set(0, topRoofY + parapetH + 0.05, -halfD - 0.1);
  roofGroup.add(copingNorth);

  const copingSouth = new THREE.Mesh(new THREE.BoxGeometry(W + 1.2, 0.14, 0.52), brownMat);
  copingSouth.position.set(0, topRoofY + parapetH + 0.05, halfD + 0.1);
  roofGroup.add(copingSouth);

  const copingWest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.14, D + 1.2), brownMat);
  copingWest.position.set(-halfW - 0.1, topRoofY + parapetH + 0.05, 0);
  roofGroup.add(copingWest);

  const copingEast = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.14, D + 1.2), brownMat);
  copingEast.position.set(halfW + 0.1, topRoofY + parapetH + 0.05, 0);
  roofGroup.add(copingEast);

  // Flat clean architectural parapet roof matching school building (No pitched hut or chimney)

  // =========================================================================
  // SMART CONTROLLERS & CUTAWAY HANDLERS
  // =========================================================================
  function setFloorIsolation(floorLevel: number | null) {
    currentFloorLevel = floorLevel;

    if (!isExteriorVisible) {
      rootGroup.visible = false;
      return;
    }

    if (floorLevel === null) {
      // Full complete aerial building model showing parapets and transparent shell
      rootGroup.visible = true;
      facadeFrontGroup.visible = true;
      facadeRearGroup.visible = true;
      facadeSidesGroup.visible = true;
      roofGroup.visible = true;
    } else {
      // Cutaway view for floor focus:
      // Completely hide exterior shell and roof so interior rooms are 100% visible with zero foreground clipping
      rootGroup.visible = false;
      roofGroup.visible = false;
      facadeFrontGroup.visible = false;
      facadeRearGroup.visible = false;
      facadeSidesGroup.visible = false;
    }
  }

  function setExteriorVisible(visible: boolean) {
    isExteriorVisible = visible;
    if (!visible) {
      rootGroup.visible = false;
    } else {
      setFloorIsolation(currentFloorLevel);
    }
  }

  function setOpacity(alpha: number) {
    const clamped = Math.max(0, Math.min(1, alpha));
    creamMat.opacity = baseCreamAlpha * clamped;
    brownMat.opacity = baseBrownAlpha * clamped;
    whiteTrimMat.opacity = baseWhiteAlpha * clamped;
    glassMat.opacity = baseGlassAlpha * clamped;
    glassMat.emissiveIntensity = 0.30 * clamped;
    windowFrameMat.opacity = baseWhiteAlpha * clamped;
    roofTileMat.opacity = baseRoofAlpha * clamped;
    lineMat.opacity = 0.35 * clamped;
  }

  return {
    group: rootGroup,
    setFloorIsolation,
    getExteriorVisible: () => isExteriorVisible,
    setExteriorVisible,
    setOpacity
  };
}

/**
 * Renders the room label onto a 2D canvas with an Apple VisionOS frosted glass capsule
 * and crisp SF Pro typography for legible, high-taste 3D spatial labels.
 */
export function drawRoomLabelCanvas(
  ctx: CanvasRenderingContext2D,
  roomName: string,
  subjectColorHex: string
) {
  ctx.clearRect(0, 0, 1536, 384);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  let displayText = roomName;
  if (displayText.length > 26) {
    displayText = displayText.slice(0, 24) + '...';
  }

  // SF Pro / Apple Sans Typography
  ctx.font = '600 80px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Plus Jakarta Sans", system-ui, sans-serif';
  const metrics = ctx.measureText(displayText);
  const textWidth = metrics.width;

  const padX = 52;
  const dotR = 22;
  const gap = 24;
  const pillHeight = 156;
  const pillWidth = Math.min(1440, padX * 2 + dotR * 2 + gap + textWidth);
  const pillX = (1536 - pillWidth) / 2;
  const pillY = (384 - pillHeight) / 2;
  const pillR = pillHeight / 2;

  // 1. Soft Ambient Diffuse Shadow (Floating Glass Lift)
  ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;

  // 2. Translucent Apple Frosted Whitish Capsule Fill
  const glassGrad = ctx.createLinearGradient(pillX, pillY, pillX, pillY + pillHeight);
  glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
  glassGrad.addColorStop(1, 'rgba(245, 248, 252, 0.90)');
  ctx.fillStyle = glassGrad;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillWidth, pillHeight, pillR);
  ctx.fill();

  // Reset shadow for crisp border & text rendering
  ctx.shadowColor = 'transparent';

  // 3. Subtle Clean Linear Gradient Stroke
  const strokeGrad = ctx.createLinearGradient(pillX, pillY, pillX, pillY + pillHeight);
  strokeGrad.addColorStop(0, '#ffffff');
  strokeGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.90)');
  strokeGrad.addColorStop(1, 'rgba(203, 213, 225, 0.80)');
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = strokeGrad;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillWidth, pillHeight, pillR);
  ctx.stroke();

  // Inner Specular Inset Rim
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.roundRect(pillX + 1.5, pillY + 1.5, pillWidth - 3, pillHeight - 3, pillR - 1.5);
  ctx.stroke();

  // 4. Vibrant Category Dot with Soft Halo
  const dotCenterX = pillX + padX + dotR;
  const dotCenterY = 192;

  // Halo
  ctx.fillStyle = (subjectColorHex || '#0284C7') + '33';
  ctx.beginPath();
  ctx.arc(dotCenterX, dotCenterY, dotR + 8, 0, Math.PI * 2);
  ctx.fill();

  // Core Dot
  ctx.fillStyle = subjectColorHex || '#0284C7';
  ctx.beginPath();
  ctx.arc(dotCenterX, dotCenterY, dotR, 0, Math.PI * 2);
  ctx.fill();

  // 5. Crisp Obsidian Text (#09090B)
  ctx.fillStyle = '#09090B';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayText, dotCenterX + dotR + gap, dotCenterY);

  ctx.restore();
}

/**
 * Creates a razor-sharp, high-DPI room label sprite hovering strictly on top of the room.
 * - 1536x384 canvas texture with mipmapping disabled to eliminate oblique distance blur.
 * - Linear filtering with 16x anisotropy for crisp text rendering at all angles.
 * - Anchored in 3D world space at the room center.
 * - depthTest: false ensures label is NEVER occluded or clipped when zooming in close!
 */
export function createRoomLabelSprite(
  roomName: string,
  subjectColorHex: string
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    drawRoomLabelCanvas(ctx, roomName, subjectColorHex);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  // Crucial: disable mipmaps to prevent WebGL downsampling text textures to blurry low-res mips!
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16;
  texture.needsUpdate = true;

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(4.2, 1.05, 1.0);
  sprite.renderOrder = 999;
  sprite.userData = {
    roomName,
    subjectColorHex,
    canvas,
    texture
  };

  return sprite;
}

// Backward-compatibility alias
export const createRoomLabelMesh = createRoomLabelSprite;

/**
 * Floor-level prominent badge displayed in the ALL-building view (High DPI & Crisp)
 */
export function createFloorLabelSprite(
  floorName: string,
  floorTheme: string,
  floorColorHex: string
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 280;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, 1280, 280);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const x = 32;
    const y = 32;
    const w = 1216;
    const h = 216;

    ctx.save();

    // Soft rounded card background
    ctx.shadowColor = 'rgba(15, 23, 42, 0.18)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = 'rgba(244, 246, 249, 0.97)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 32);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.9)';
    ctx.lineWidth = 3.0;
    ctx.stroke();

    // Floor Color Indicator
    const dotX = 96;
    const dotY = y + h / 2;
    ctx.fillStyle = floorColorHex || '#0F172A';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 32, 0, Math.PI * 2);
    ctx.fill();

    // Floor Name Text (Clean slate typography, not bold, larger size)
    const nameFont = '500 72px system-ui, "Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.font = nameFont;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#0F172A';
    ctx.fillText(floorName, dotX + 56, dotY - 28);

    // Floor Theme Subtitle
    const themeFont = '400 44px system-ui, "Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.font = themeFont;
    ctx.fillStyle = '#64748B';
    ctx.fillText(floorTheme, dotX + 56, dotY + 36);

    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16;
  texture.needsUpdate = true;

  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });

  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(5.2, 1.14, 1.0);
  return sprite;
}

