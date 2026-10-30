import * as THREE from 'three';
import { MockupType } from '../data';

/**
 * Procedural 3D Mock-up exhibits rendered inside school rooms
 * Harmonized with NPS Yeshwanthpur warm architectural palette and category tokens:
 * - Cyber CS #3E5C76
 * - Physics #6B4E8A
 * - Chemistry #B5762A
 * - Biology #4F7A45
 * - Robotics #A4502F
 * - Ecology #2F7A72
 * - Stage & AV #8A3B4D
 * - Warm Wood & Stone: #5B3A2E, #6B5A4E, #E8DFD1, #D8CBB6
 */

export interface AnimatedElement {
  update: (time: number) => void;
}

/** Builds a classic folded-paper dart from two wing triangles meeting at a keel. */
function createPaperPlane(span: number, len: number, keel: number): THREE.Mesh {
  const nose: [number, number, number] = [0, 0, -len / 2];
  const tailLeft: [number, number, number] = [-span, 0, len / 2];
  const tailRight: [number, number, number] = [span, 0, len / 2];
  const keelBack: [number, number, number] = [0, -keel, len / 2];

  const verts = new Float32Array([
    ...nose, ...tailLeft, ...keelBack,   // left wing
    ...nose, ...keelBack, ...tailRight   // right wing
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  geometry.computeVertexNormals();

  const paper = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.85,
    side: THREE.DoubleSide,
    flatShading: true
  });
  return new THREE.Mesh(geometry, paper);
}

export function createRoomMockup(
  type: MockupType,
  roomW: number,
  roomD: number,
  floorLevel?: number
): { group: THREE.Group; anims: AnimatedElement[] } {
  const group = new THREE.Group();
  const anims: AnimatedElement[] = [];

  switch (type) {
    case 'robotics_arena': {
      // 1. Arena Boundary Fence (Warm brown perimeter #5B3A2E)
      const fenceMat = new THREE.MeshStandardMaterial({
        color: 0x5b3a2e,
        roughness: 0.6,
        metalness: 0.2
      });
      const fenceH = 0.5;
      const fenceGeo = new THREE.BoxGeometry(roomW * 0.85, fenceH, 0.08);
      
      const f1 = new THREE.Mesh(fenceGeo, fenceMat);
      f1.position.set(0, fenceH / 2, -roomD * 0.4);
      group.add(f1);

      const f2 = new THREE.Mesh(fenceGeo, fenceMat);
      f2.position.set(0, fenceH / 2, roomD * 0.4);
      group.add(f2);

      // Arena Mat Floor (Terracotta grid on cream mat #A4502F / #F4EEE3)
      const matGeo = new THREE.PlaneGeometry(roomW * 0.84, roomD * 0.8);
      const matTex = createGridTexture(0xa4502f, 0xf4eee3);
      const arenaMat = new THREE.MeshStandardMaterial({
        map: matTex,
        roughness: 0.7
      });
      const arenaFloor = new THREE.Mesh(matGeo, arenaMat);
      arenaFloor.rotation.x = -Math.PI / 2;
      arenaFloor.position.y = 0.02;
      group.add(arenaFloor);

      // 2. Autonomous Roving Robot (Cyber CS #3E5C76)
      const botGroup = new THREE.Group();
      botGroup.position.set(-1.2, 0.25, 0);

      // Chassis
      const chassis = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.35, 1.6),
        new THREE.MeshStandardMaterial({ color: 0x3e5c76, roughness: 0.4, metalness: 0.3 })
      );
      botGroup.add(chassis);

      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.16, 16);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x5b3a2e, roughness: 0.8 });
      wheelGeo.rotateZ(Math.PI / 2);

      [-0.7, 0.7].forEach(wx => {
        [-0.6, 0.6].forEach(wz => {
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.position.set(wx, -0.05, wz);
          botGroup.add(wheel);
        });
      });

      // Rotating LiDAR Dome (Terracotta accent #A4502F)
      const lidar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.25, 16),
        new THREE.MeshStandardMaterial({ color: 0xa4502f, emissive: 0x5b3a2e, emissiveIntensity: 0.4 })
      );
      lidar.position.y = 0.35;
      botGroup.add(lidar);

      // Headlight LEDs (Warm Amber #B5762A)
      const headlightMat = new THREE.MeshBasicMaterial({ color: 0xb5762a });
      const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.05), headlightMat);
      hl1.position.set(-0.35, 0.05, 0.82);
      const hl2 = hl1.clone();
      hl2.position.set(0.35, 0.05, 0.82);
      botGroup.add(hl1, hl2);

      group.add(botGroup);

      // Obstacle Cones (Robotics Terracotta #A4502F)
      const coneGeo = new THREE.ConeGeometry(0.25, 0.6, 12);
      const coneMat = new THREE.MeshStandardMaterial({ color: 0xa4502f, roughness: 0.4 });
      const c1 = new THREE.Mesh(coneGeo, coneMat);
      c1.position.set(1.5, 0.3, -1.0);
      const c2 = new THREE.Mesh(coneGeo, coneMat);
      c2.position.set(1.2, 0.3, 1.2);
      group.add(c1, c2);

      // Animation: Bot slowly patrolling & lidar rotating
      anims.push({
        update: (time) => {
          lidar.rotation.y = time * 0.008;
          botGroup.position.x = Math.sin(time * 0.0015) * 1.5;
          botGroup.rotation.y = Math.cos(time * 0.0015) * 0.4;
        }
      });
      break;
    }

    case 'stage_show': {
      // Street-play venue on the cemented court: warm wooden stage with a
      // painted backdrop, prop crates, pennant line, mic stand, lantern posts
      // and audience bench rows (replaces the old dark slab + flasks)
      const stageW = Math.min(9.0, roomW * 0.5);
      const stageD = Math.min(4.5, roomD * 0.32);
      const stageRiserH = 0.45;
      const stageZ = -roomD * 0.22;

      const stage = new THREE.Mesh(
        new THREE.BoxGeometry(stageW, stageRiserH, stageD),
        new THREE.MeshStandardMaterial({ color: 0x8c5a3c, roughness: 0.6 })
      );
      stage.position.set(0, 0.1 + stageRiserH / 2, stageZ);
      group.add(stage);

      // Stage skirting trim
      const trim = new THREE.Mesh(
        new THREE.BoxGeometry(stageW + 0.12, 0.07, stageD + 0.12),
        new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4 })
      );
      trim.position.set(0, 0.1 + stageRiserH + 0.03, stageZ);
      group.add(trim);

      // Painted "STREET PLAYS" backdrop on poles at the stage rear
      const backCanvas = document.createElement('canvas');
      backCanvas.width = 512;
      backCanvas.height = 160;
      const spCtx = backCanvas.getContext('2d');
      if (spCtx) {
        spCtx.fillStyle = '#7c2d12';
        spCtx.fillRect(0, 0, 512, 160);
        spCtx.fillStyle = '#fdba74';
        spCtx.fillRect(0, 144, 512, 8);
        spCtx.font = '800 54px "Plus Jakarta Sans", "Inter", sans-serif';
        spCtx.textAlign = 'center';
        spCtx.fillStyle = '#FFF7ED';
        spCtx.fillText('STREET PLAYS', 256, 74);
        spCtx.font = '600 30px "Plus Jakarta Sans", "Inter", sans-serif';
        spCtx.fillStyle = '#FED7AA';
        spCtx.fillText('SOCIAL AWARENESS', 256, 122);
      }
      const backTex = new THREE.CanvasTexture(backCanvas);
      backTex.colorSpace = THREE.SRGBColorSpace;
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x6b5a4e, roughness: 0.55 });
      [-stageW / 2 + 0.2, stageW / 2 - 0.2].forEach(px => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.7, 8), poleMat);
        pole.position.set(px, 1.35, stageZ - stageD / 2 + 0.15);
        group.add(pole);
      });
      const backdrop = new THREE.Mesh(
        new THREE.PlaneGeometry(stageW * 0.92, 1.7),
        new THREE.MeshStandardMaterial({ map: backTex, side: THREE.DoubleSide, roughness: 0.7 })
      );
      backdrop.position.set(0, 1.85, stageZ - stageD / 2 + 0.18);
      group.add(backdrop);

      // Prop crates and microphone stand on the deck
      const crateMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.7 });
      const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), crateMat);
      crate1.position.set(-stageW * 0.28, 0.1 + stageRiserH + 0.28, stageZ + 0.4);
      crate1.rotation.y = 0.3;
      const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), crateMat);
      crate2.position.set(stageW * 0.24, 0.1 + stageRiserH + 0.23, stageZ - 0.3);
      crate2.rotation.y = -0.25;
      group.add(crate1, crate2);
      const micStand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 1.3, 8),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.35 })
      );
      micStand.position.set(0.3, 0.1 + stageRiserH + 0.65, stageZ + 0.8);
      group.add(micStand);
      const micHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
      );
      micHead.position.set(0.3, 0.1 + stageRiserH + 1.34, stageZ + 0.8);
      group.add(micHead);

      // Pennant line strung between the backdrop poles
      const pennantColors = [0xf59e0b, 0x0ea5e9, 0x10b981, 0xef4444, 0xa855f7];
      for (let i = 0; i < 7; i++) {
        const t = i / 6;
        const px = -stageW / 2 + 0.2 + t * (stageW - 0.4);
        const py = 2.55 - Math.sin(t * Math.PI) * 0.22;
        const pennant = new THREE.Mesh(
          new THREE.ConeGeometry(0.09, 0.26, 4),
          new THREE.MeshStandardMaterial({ color: pennantColors[i % pennantColors.length], side: THREE.DoubleSide })
        );
        pennant.position.set(px, py - 0.13, stageZ - stageD / 2 + 0.18);
        pennant.rotation.x = Math.PI;
        group.add(pennant);
      }

      // Lantern posts flanking the stage with warm flickering lamps
      const lampMats: THREE.MeshStandardMaterial[] = [];
      [-stageW / 2 - 1.1, stageW / 2 + 1.1].forEach(lx => {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.06, 2.2, 8),
          new THREE.MeshStandardMaterial({ color: 0x5b3a2e, roughness: 0.5 })
        );
        post.position.set(lx, 1.1, stageZ + stageD / 2 + 0.5);
        group.add(post);
        const lampMat = new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.9
        });
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), lampMat);
        lamp.position.set(lx, 2.28, stageZ + stageD / 2 + 0.5);
        group.add(lamp);
        lampMats.push(lampMat);
      });

      anims.push({
        update: (time) => {
          const flicker = 0.75 + Math.sin(time * 0.011) * 0.15 + Math.sin(time * 0.023) * 0.1;
          lampMats.forEach(m => { m.emissiveIntensity = flicker; });
        }
      });
      break;
    }

    case 'chemistry_bench': {
      // Lab island tables (Warm wood/composite #5B3A2E)
      const benchMat = new THREE.MeshStandardMaterial({ color: 0x5b3a2e, roughness: 0.5 });
      const table1 = new THREE.Mesh(new THREE.BoxGeometry(roomW * 0.75, 0.7, 1.0), benchMat);
      table1.position.set(0, 0.35, -0.8);
      group.add(table1);

      const table2 = new THREE.Mesh(new THREE.BoxGeometry(roomW * 0.75, 0.7, 1.0), benchMat);
      table2.position.set(0, 0.35, 0.8);
      group.add(table2);

      // Glowing Glassware & Test-tube rack (School subject colors: Chemistry, Biology, Physics)
      [-1.2, 0, 1.2].forEach((xPos, idx) => {
        const colors = [0xb5762a, 0x4f7a45, 0x6b4e8a];
        const gMat = new THREE.MeshStandardMaterial({
          color: colors[idx],
          emissive: colors[idx],
          emissiveIntensity: 0.6,
          roughness: 0.1
        });
        const beaker = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.45, 16), gMat);
        beaker.position.set(xPos, 0.95, -0.8);
        group.add(beaker);
      });

      // LUMINOUS rotating molecular model floating above the benches —
      // glowing atoms bonded into a 3D lattice ("Luminiscence" showcase)
      const molecule = new THREE.Group();
      molecule.position.set(0, 2.05, 0);

      const atomColors = [0x38bdf8, 0xf59e0b, 0x34d399, 0xf43f5e, 0xa78bfa];
      const atomGeos = [
        new THREE.SphereGeometry(0.16, 16, 16),
        new THREE.SphereGeometry(0.12, 16, 16)
      ];
      const bondMat = new THREE.MeshStandardMaterial({
        color: 0xd8cbb6,
        emissive: 0x8c7e73,
        emissiveIntensity: 0.35,
        roughness: 0.4
      });

      // Icosahedral-ish cluster: 6 atoms around a glowing core
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 1.1,
        roughness: 0.15
      });
      const coreAtom = new THREE.Mesh(atomGeos[0], coreMat);
      molecule.add(coreAtom);

      const shellPositions: [number, number, number][] = [
        [0.62, 0.35, 0], [-0.62, 0.35, 0],
        [0.35, -0.5, 0.5], [-0.35, -0.5, 0.5],
        [0.35, -0.5, -0.5], [-0.35, -0.5, -0.5]
      ];
      shellPositions.forEach((pos, i) => {
        const color = atomColors[(i + 1) % atomColors.length];
        const atom = new THREE.Mesh(
          atomGeos[1],
          new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.95,
            roughness: 0.2
          })
        );
        atom.position.set(pos[0], pos[1], pos[2]);
        molecule.add(atom);

        // Glowing bond from core to shell atom
        const bondLen = Math.hypot(pos[0], pos[1], pos[2]);
        const bond = new THREE.Mesh(
          new THREE.CylinderGeometry(0.028, 0.028, bondLen, 8),
          bondMat
        );
        bond.position.set(pos[0] / 2, pos[1] / 2, pos[2] / 2);
        bond.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(pos[0], pos[1], pos[2]).normalize()
        );
        molecule.add(bond);
      });

      group.add(molecule);

      anims.push({
        update: (time) => {
          molecule.rotation.y = time * 0.0012;
          molecule.rotation.x = Math.sin(time * 0.0008) * 0.18;
          coreMat.emissiveIntensity = 0.85 + Math.sin(time * 0.004) * 0.3;
        }
      });
      break;
    }

    case 'laser_optics': {
      // Optics demonstration table (Warm wood #6B5A4E)
      const bench = new THREE.Mesh(
        new THREE.BoxGeometry(roomW * 0.72, 0.72, roomD * 0.4),
        new THREE.MeshStandardMaterial({ color: 0x6b5a4e, roughness: 0.5 })
      );
      bench.position.set(0, 0.36, 0);
      group.add(bench);

      // Laser source emitter (Cyber CS steel blue #3E5C76)
      const emitter = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.28, 0.34),
        new THREE.MeshStandardMaterial({ color: 0x3e5c76, roughness: 0.35, metalness: 0.55 })
      );
      emitter.position.set(-roomW * 0.28, 0.88, 0);
      group.add(emitter);

      const aperture = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 })
      );
      aperture.rotation.z = Math.PI / 2;
      aperture.position.set(-roomW * 0.28 + 0.28, 0.88, 0);
      group.add(aperture);

      // Glowing laser beam running the length of the bench
      const beamLen = roomW * 0.5;
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, beamLen, 8),
        new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.85 })
      );
      beam.rotation.z = Math.PI / 2;
      beam.position.set(-roomW * 0.28 + 0.3 + beamLen / 2, 0.88, 0);
      group.add(beam);

      // Two steering mirrors on posts
      [0.3, -0.25].forEach((mz, i) => {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 })
        );
        post.position.set(-roomW * 0.05 + i * roomW * 0.2, 0.36 + 0.25, mz);
        group.add(post);

        const mirror = new THREE.Mesh(
          new THREE.BoxGeometry(0.03, 0.22, 0.16),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.08 })
        );
        mirror.position.set(post.position.x, 0.36 + 0.55, mz);
        mirror.rotation.y = i === 0 ? 0.5 : -0.5;
        group.add(mirror);
      });

      // Glass prism splitting the beam into a luminous spectrum fan
      const prism = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.42, 3),
        new THREE.MeshPhysicalMaterial({
          color: 0xdce6ec,
          transmission: 0.85,
          transparent: true,
          roughness: 0.1,
          metalness: 0.05
        })
      );
      prism.position.set(roomW * 0.26, 0.36 + 0.21 + 0.16, 0);
      prism.rotation.y = Math.PI / 6;
      group.add(prism);

      // Spectrum fan: 5 thin glowing planes fanning out of the prism
      const spectrumColors = [0xef4444, 0xf59e0b, 0xfacc15, 0x22c55e, 0x3b82f6];
      const spectrum: THREE.Mesh[] = [];
      spectrumColors.forEach((color, i) => {
        const ray = new THREE.Mesh(
          new THREE.PlaneGeometry(1.15, 0.045),
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.72,
            side: THREE.DoubleSide
          })
        );
        const angle = (i - 2) * 0.16;
        ray.position.set(roomW * 0.26 + Math.cos(angle) * 0.72, 0.94 + Math.sin(angle) * 0.7, 0.06);
        ray.rotation.z = angle;
        group.add(ray);
        spectrum.push(ray);
      });

      anims.push({
        update: (time) => {
          const pulse = 0.55 + Math.sin(time * 0.005) * 0.35;
          (beam.material as THREE.MeshBasicMaterial).opacity = pulse;
          spectrum.forEach((ray, i) => {
            (ray.material as THREE.MeshBasicMaterial).opacity = 0.45 + Math.sin(time * 0.004 + i) * 0.25;
          });
        }
      });
      break;
    }

    case 'spectrometer_optics': {
      // Wind tunnel demonstration rig (Physics amber #F59E0B accents)
      const tunnelMat = new THREE.MeshPhysicalMaterial({
        color: 0xdce6ec,
        transmission: 0.75,
        transparent: true,
        opacity: 0.55,
        roughness: 0.15
      });
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x5b3a2e, roughness: 0.5 });
      const standMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.4 });

      // Support stands holding the tunnel tube
      [-0.9, 0.9].forEach(zx => {
        const stand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.9, 0.5), standMat);
        stand.position.set(zx, 0.45, 0);
        group.add(stand);
      });

      // Transparent wind tunnel tube
      const tunnel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 2.6, 20, 1, true),
        tunnelMat
      );
      tunnel.rotation.z = Math.PI / 2;
      tunnel.position.y = 1.25;
      group.add(tunnel);

      // Tunnel rim rings
      [-1.2, 0, 1.2].forEach(rx => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.43, 0.035, 10, 24),
          frameMat
        );
        ring.rotation.y = Math.PI / 2;
        ring.position.set(rx, 1.25, 0);
        group.add(ring);
      });

      // Airfoil wing model suspended in the tunnel
      const wing = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.13, 0.7, 6, 14),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.2 })
      );
      wing.rotation.z = Math.PI / 2;
      wing.scale.set(1, 1, 1.6);
      wing.position.set(0.1, 1.25, 0);
      group.add(wing);

      // Animated air-flow streaks streaming past the wing
      const flowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 });
      const flows: THREE.Mesh[] = [];
      for (let i = 0; i < 7; i++) {
        const streak = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.3, 4, 8), flowMat);
        streak.rotation.z = Math.PI / 2;
        streak.position.set(-1.1, 1.25 + Math.sin(i * 2.4) * 0.26, Math.cos(i * 1.7) * 0.26);
        group.add(streak);
        flows.push(streak);
      }

      // Measuring console beside the tunnel
      const console_ = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.75, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.3 })
      );
      console_.position.set(1.55, 0.38, 0.45);
      group.add(console_);
      const consoleScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, 0.26),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      consoleScreen.position.set(1.55, 0.55, 0.68);
      group.add(consoleScreen);

      anims.push({
        update: (time) => {
          flows.forEach((streak, i) => {
            let x = ((time * 0.0012 + i * 0.45) % 2.6) - 1.3;
            // Streaks lift over the wing section (simple airfoil deflection)
            const nearWing = Math.max(0, 1 - Math.abs(x - 0.1) / 0.55);
            streak.position.x = x;
            streak.position.y = 1.25 + Math.sign(streak.position.y - 1.25) * nearWing * 0.16 + (streak.position.y - 1.25) * 0.82;
            (streak.material as THREE.MeshBasicMaterial).opacity = 0.35 + Math.sin(time * 0.008 + i) * 0.3;
          });
          wing.rotation.x = Math.sin(time * 0.001) * 0.12;
        }
      });
      break;
    }

    case 'dance_studio': {
      // Commerce presentation set: stage riser, Monopoly-style board table & podium
      const stageRiser = new THREE.Mesh(
        new THREE.BoxGeometry(Math.min(7.0, roomW * 0.7), 0.3, Math.min(3.4, roomD * 0.42)),
        new THREE.MeshStandardMaterial({ color: 0x5b3a2e, roughness: 0.55 })
      );
      stageRiser.position.set(0, 0.15, -roomD * 0.18);
      group.add(stageRiser);

      // Presentation podium
      const podium = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 1.1, 0.45),
        new THREE.MeshStandardMaterial({ color: 0x6b5a4e, roughness: 0.5 })
      );
      podium.position.set(-Math.min(2.4, roomW * 0.26), 0.3 + 0.55, -roomD * 0.18);
      group.add(podium);
      const podiumTop = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, 0.05, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4 })
      );
      podiumTop.position.set(podium.position.x, 0.3 + 1.12, -roomD * 0.18);
      group.add(podiumTop);

      // Monopoly-style board game table (Commerce "Monopoly Game" exhibit)
      const gameTable = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.72, 1.1),
        new THREE.MeshStandardMaterial({ color: 0x6b5a4e, roughness: 0.5 })
      );
      gameTable.position.set(Math.min(1.8, roomW * 0.2), 0.36, roomD * 0.14);
      group.add(gameTable);

      // Board with colored property squares around a green center
      const boardCanvas = document.createElement('canvas');
      boardCanvas.width = 256;
      boardCanvas.height = 256;
      const bCtx = boardCanvas.getContext('2d');
      if (bCtx) {
        bCtx.fillStyle = '#c8e6c0';
        bCtx.fillRect(0, 0, 256, 256);
        const sideColors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#eab308'];
        const cell = 34;
        for (let i = 0; i < 7; i++) {
          bCtx.fillStyle = sideColors[i % sideColors.length];
          bCtx.fillRect(20 + i * cell, 20, cell - 3, cell - 3);          // top row
          bCtx.fillRect(20 + i * cell, 236 - cell + 3, cell - 3, cell - 3); // bottom row
          bCtx.fillStyle = sideColors[(i + 3) % sideColors.length];
          bCtx.fillRect(20, 20 + i * cell, cell - 3, cell - 3);          // left col
          bCtx.fillRect(236 - cell + 3, 20 + i * cell, cell - 3, cell - 3); // right col
        }
        bCtx.fillStyle = '#0f172a';
        bCtx.font = '700 22px "Plus Jakarta Sans", "Inter", sans-serif';
        bCtx.textAlign = 'center';
        bCtx.fillText('MONOPOLY', 128, 122);
        bCtx.font = '600 15px "Plus Jakarta Sans", "Inter", sans-serif';
        bCtx.fillText('COMMERCE', 128, 148);
      }
      const boardTex = new THREE.CanvasTexture(boardCanvas);
      boardTex.colorSpace = THREE.SRGBColorSpace;
      const board = new THREE.Mesh(
        new THREE.PlaneGeometry(1.15, 1.15),
        new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.6 })
      );
      board.rotation.x = -Math.PI / 2;
      board.position.set(gameTable.position.x, 0.36 + 0.365, roomD * 0.14);
      group.add(board);

      // Standing venture-pitch banner behind the stage
      const banner = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 1.0),
        new THREE.MeshStandardMaterial({
          color: 0x3b82f6,
          emissive: 0x1d4ed8,
          emissiveIntensity: 0.35,
          side: THREE.DoubleSide,
          roughness: 0.6
        })
      );
      banner.position.set(0, 1.35, -roomD * 0.38);
      group.add(banner);
      const bannerPostL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 1.9, 8),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.3 })
      );
      bannerPostL.position.set(-0.8, 0.95, -roomD * 0.38);
      const bannerPostR = bannerPostL.clone();
      bannerPostR.position.x = 0.8;
      group.add(bannerPostL, bannerPostR);

      anims.push({
        update: (time) => {
          const glow = 0.3 + Math.sin(time * 0.003) * 0.15;
          (banner.material as THREE.MeshStandardMaterial).emissiveIntensity = glow;
        }
      });
      break;
    }

    case 'computer_lab': {
      // Workstation desks (Modern school maple/slate surface #6B5A4E)
      const deskMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
      const deskGeo = new THREE.BoxGeometry(roomW * 0.78, 0.65, 0.95);
      const desk1 = new THREE.Mesh(deskGeo, deskMat);
      desk1.position.set(0, 0.32, -0.9);
      group.add(desk1);

      const desk2 = new THREE.Mesh(deskGeo, deskMat);
      desk2.position.set(0, 0.32, 0.9);
      group.add(desk2);

      // Living Computer Screen Canvas Textures (Shared singletons: ultra-fast, zero GPU lag)
      if (!sharedScreenSim1 || !sharedScreenSim2) {
        sharedScreenSim1 = createLiveComputerScreenTexture(0);
        sharedScreenSim2 = createLiveComputerScreenTexture(1);
      }

      const screenMat1 = new THREE.MeshBasicMaterial({ map: sharedScreenSim1.texture });
      const screenMat2 = new THREE.MeshBasicMaterial({ map: sharedScreenSim2.texture });

      // Hardware materials
      const bezelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.3 });
      const standMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.7 });
      const kbMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.4 });
      const pcLedMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

      [-1.4, 0, 1.4].forEach((x) => {
        // ---- ROW 1 (Facing +Z) ----
        // 1. Monitor Bezel & Living Screen
        const mon1 = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.48, 0.04), bezelMat);
        mon1.position.set(x, 0.96, -0.85);
        const scr1 = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.44), screenMat1);
        scr1.position.set(x, 0.96, -0.825);
        group.add(mon1, scr1);

        // Neck & Plinth Base
        const neck1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 12), standMat);
        neck1.position.set(x, 0.75, -0.85);
        const base1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.16), bezelMat);
        base1.position.set(x, 0.66, -0.82);
        group.add(neck1, base1);

        // Desktop Keyboard & Mouse
        const kb1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.015, 0.14), kbMat);
        kb1.position.set(x, 0.655, -0.62);
        const mouse1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.018, 0.09), bezelMat);
        mouse1.position.set(x + 0.26, 0.655, -0.62);
        group.add(kb1, mouse1);

        // Under-desk PC Mini-Tower
        const pc1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.44, 0.38), towerMat);
        pc1.position.set(x - 0.35, 0.22, -0.88);
        const led1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.01), pcLedMat);
        led1.position.set(x - 0.35, 0.38, -0.685);
        group.add(pc1, led1);

        // ---- ROW 2 (Facing -Z) ----
        // 1. Monitor Bezel & Living Screen
        const mon2 = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.48, 0.04), bezelMat);
        mon2.position.set(x, 0.96, 0.85);
        mon2.rotation.y = Math.PI;
        const scr2 = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.44), screenMat2);
        scr2.position.set(x, 0.96, 0.825);
        scr2.rotation.y = Math.PI;
        group.add(mon2, scr2);

        // Neck & Plinth Base
        const neck2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 12), standMat);
        neck2.position.set(x, 0.75, 0.85);
        const base2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.16), bezelMat);
        base2.position.set(x, 0.66, 0.82);
        group.add(neck2, base2);

        // Desktop Keyboard & Mouse
        const kb2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.015, 0.14), kbMat);
        kb2.position.set(x, 0.655, 0.62);
        kb2.rotation.y = Math.PI;
        const mouse2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.018, 0.09), bezelMat);
        mouse2.position.set(x - 0.26, 0.655, 0.62);
        group.add(kb2, mouse2);

        // Under-desk PC Mini-Tower
        const pc2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.44, 0.38), towerMat);
        pc2.position.set(x + 0.35, 0.22, 0.88);
        const led2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.01), pcLedMat);
        led2.position.set(x + 0.35, 0.38, 0.685);
        group.add(pc2, led2);
      });

      // Central Rack Hub / Enterprise Switch
      const server = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 1.8, 0.7),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.4 })
      );
      server.position.set(roomW * 0.36, 0.9, 0);
      group.add(server);

      // Blinking rack activity LED bar
      const ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
      const rackLed = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8, 0.02), ledMat);
      rackLed.position.set(roomW * 0.36 - 0.46, 0.9, 0);
      group.add(rackLed);

      // Register live screen animation singleton (only one update loop)
      if (!sharedScreenAnimRegistered) {
        sharedScreenAnimRegistered = true;
        anims.push({
          update: (time) => {
            sharedScreenSim1?.update(time);
            sharedScreenSim2?.update(time);
            ledMat.color.setHex(Math.sin(time * 0.006) > 0 ? 0x10b981 : 0x38bdf8);
          }
        });
      }
      break;
    }

    case 'dna_biology': {
      // Lab Bench
      const bench = new THREE.Mesh(
        new THREE.BoxGeometry(roomW * 0.8, 0.7, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x6b5a4e, roughness: 0.5 })
      );
      bench.position.set(0, 0.35, 0);
      group.add(bench);

      // Rotating DNA Double Helix Model (Biology #4F7A45 + Chemistry #B5762A)
      const dnaGroup = new THREE.Group();
      dnaGroup.position.set(0, 1.5, 0);

      const r = 0.5;
      const numNodes = 14;
      const sphereGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const sMat1 = new THREE.MeshBasicMaterial({ color: 0x4f7a45 });
      const sMat2 = new THREE.MeshBasicMaterial({ color: 0xb5762a });

      for (let i = 0; i < numNodes; i++) {
        const theta = (i / numNodes) * Math.PI * 2.5;
        const y = (i / numNodes) * 1.4 - 0.7;

        const node1 = new THREE.Mesh(sphereGeo, sMat1);
        node1.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);

        const node2 = new THREE.Mesh(sphereGeo, sMat2);
        node2.position.set(Math.cos(theta + Math.PI) * r, y, Math.sin(theta + Math.PI) * r);

        // Connector bridge
        const bridgeGeo = new THREE.CylinderGeometry(0.02, 0.02, r * 2, 8);
        bridgeGeo.rotateZ(Math.PI / 2);
        bridgeGeo.rotateY(-theta);
        const bridge = new THREE.Mesh(bridgeGeo, new THREE.MeshBasicMaterial({ color: 0xd8cbb6, transparent: true, opacity: 0.6 }));
        bridge.position.set(0, y, 0);

        dnaGroup.add(node1, node2, bridge);
      }
      group.add(dnaGroup);

      // Microscope model
      const scopeGroup = new THREE.Group();
      scopeGroup.position.set(-1.4, 0.7, 0);
      const scopeBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.6), new THREE.MeshStandardMaterial({ color: 0x5b3a2e }));
      const scopeArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 12), new THREE.MeshStandardMaterial({ color: 0x8c7e73, metalness: 0.6 }));
      scopeArm.position.set(0, 0.4, -0.15);
      const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0x4f7a45 }));
      scopeTube.rotation.x = 0.4;
      scopeTube.position.set(0, 0.65, 0.05);
      scopeGroup.add(scopeBase, scopeArm, scopeTube);
      group.add(scopeGroup);

      anims.push({
        update: (time) => {
          dnaGroup.rotation.y = time * 0.002;
        }
      });
      break;
    }

    case 'telescope_space': {
      // 1. Astronomical Telescope on Tripod (Physics #6B4E8A)
      const teleGroup = new THREE.Group();
      teleGroup.position.set(-0.8, 0, 0);

      // Tripod legs
      const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8);
      const legMat = new THREE.MeshStandardMaterial({ color: 0x6b5a4e, metalness: 0.5, roughness: 0.5 });
      [-0.4, 0.4].forEach(x => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(x, 0.7, 0);
        leg.rotation.z = x > 0 ? -0.25 : 0.25;
        teleGroup.add(leg);
      });

      // Telescope Barrel
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.22, 1.5, 16),
        new THREE.MeshStandardMaterial({ color: 0x6b4e8a, metalness: 0.5, roughness: 0.3 })
      );
      barrel.position.set(0, 1.4, 0);
      barrel.rotation.z = -0.55;
      barrel.rotation.y = 0.3;
      teleGroup.add(barrel);
      group.add(teleGroup);

      // 2. Glowing Ringed Planet Display (Warm Amber #B5762A)
      const planetGroup = new THREE.Group();
      planetGroup.position.set(1.4, 1.4, 0);

      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xb5762a, emissive: 0xa4502f, emissiveIntensity: 0.3 })
      );
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.65, 1.0, 32),
        new THREE.MeshBasicMaterial({ color: 0xd8cbb6, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
      );
      ring.rotation.x = Math.PI / 2.3;
      planetGroup.add(planet, ring);
      group.add(planetGroup);

      anims.push({
        update: (time) => {
          planetGroup.rotation.y = time * 0.001;
        }
      });
      break;
    }

    case 'quadcopter_drone': {
      // Landing pad on table (Warm wood #6B5A4E)
      const pad = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.2, 0.05, 24),
        new THREE.MeshStandardMaterial({ color: 0x6b5a4e, roughness: 0.6 })
      );
      pad.position.y = 0.02;
      group.add(pad);

      // Hovering Drone (Robotics Terracotta #A4502F)
      const drone = new THREE.Group();
      drone.position.set(0, 1.3, 0);

      // Central Hub
      const hub = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.18, 0.6),
        new THREE.MeshStandardMaterial({ color: 0xa4502f, roughness: 0.3, metalness: 0.5 })
      );
      drone.add(hub);

      // 4 Arms
      const armMat = new THREE.MeshStandardMaterial({ color: 0x5b3a2e, metalness: 0.6, roughness: 0.4 });
      const rotors: THREE.Mesh[] = [];
      const rotorGeo = new THREE.BoxGeometry(0.6, 0.02, 0.06);
      const rotorMat = new THREE.MeshBasicMaterial({ color: 0x3e5c76 });

      [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].forEach(([rx, rz]) => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), armMat);
        arm.position.set(rx / 2, 0, rz / 2);
        arm.rotation.y = Math.atan2(rz, rx);
        arm.rotation.z = Math.PI / 2;
        drone.add(arm);

        const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.15, 12), armMat);
        motor.position.set(rx, 0.08, rz);
        drone.add(motor);

        const prop = new THREE.Mesh(rotorGeo, rotorMat);
        prop.position.set(rx, 0.16, rz);
        drone.add(prop);
        rotors.push(prop);
      });

      group.add(drone);

      anims.push({
        update: (time) => {
          drone.position.y = 1.3 + Math.sin(time * 0.004) * 0.15;
          drone.rotation.y = Math.sin(time * 0.001) * 0.2;
          rotors.forEach(r => r.rotation.y += 0.45);
        }
      });
      break;
    }

    case 'math_games': {
      // Class 12B Math Games arena: prize wheel, giant dice & ring-toss cones
      const matTex = createGridTexture(0x6366f1, 0xf4eee3);
      const mat = new THREE.Mesh(
        new THREE.PlaneGeometry(roomW * 0.85, roomD * 0.7),
        new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.7 })
      );
      mat.rotation.x = -Math.PI / 2;
      mat.position.y = 0.02;
      group.add(mat);

      // Spinning prize wheel (indigo segments on cream disc)
      const wheelCanvas = document.createElement('canvas');
      wheelCanvas.width = 256;
      wheelCanvas.height = 256;
      const wCtx = wheelCanvas.getContext('2d');
      if (wCtx) {
        const segColors = ['#6366f1', '#f4eee3', '#f59e0b', '#f4eee3', '#0ea5e9', '#f4eee3', '#10b981', '#f4eee3'];
        for (let i = 0; i < 8; i++) {
          wCtx.beginPath();
          wCtx.moveTo(128, 128);
          wCtx.arc(128, 128, 120, (i * Math.PI) / 4, ((i + 1) * Math.PI) / 4);
          wCtx.closePath();
          wCtx.fillStyle = segColors[i];
          wCtx.fill();
        }
        wCtx.fillStyle = '#0f172a';
        wCtx.beginPath();
        wCtx.arc(128, 128, 22, 0, Math.PI * 2);
        wCtx.fill();
      }
      const wheelTex = new THREE.CanvasTexture(wheelCanvas);
      wheelTex.colorSpace = THREE.SRGBColorSpace;
      const wheelPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 1.5, 10),
        new THREE.MeshStandardMaterial({ color: 0x5b3a2e, roughness: 0.5 })
      );
      wheelPost.position.set(-roomW * 0.28, 0.75, -roomD * 0.22);
      group.add(wheelPost);
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75, 0.75, 0.07, 28),
        new THREE.MeshStandardMaterial({ map: wheelTex, roughness: 0.4 })
      );
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wheelPost.position.x, 1.55, wheelPost.position.z);
      group.add(wheel);
      const wheelPin = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.16, 8),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b })
      );
      wheelPin.rotation.x = Math.PI;
      wheelPin.position.set(wheelPost.position.x, 2.32, wheelPost.position.z);
      group.add(wheelPin);

      // Game table with two giant dice
      const gameTable = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.75, 1.1),
        new THREE.MeshStandardMaterial({ color: 0x6b5a4e, roughness: 0.5 })
      );
      gameTable.position.set(roomW * 0.15, 0.38, roomD * 0.12);
      group.add(gameTable);
      const diceMat = new THREE.MeshStandardMaterial({ color: 0xf4eee3, roughness: 0.35 });
      const die1 = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), diceMat);
      die1.position.set(gameTable.position.x - 0.3, 0.93, gameTable.position.z - 0.1);
      die1.rotation.set(0.4, 0.5, 0.2);
      const die2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), diceMat);
      die2.position.set(gameTable.position.x + 0.35, 0.92, gameTable.position.z + 0.15);
      die2.rotation.set(-0.3, 0.8, 0.5);
      group.add(die1, die2);

      // Ring-toss cones on the mat
      const coneGeo = new THREE.ConeGeometry(0.16, 0.42, 12);
      const coneMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
      [[-0.2, -0.15], [0.6, -0.3], [1.1, 0.3], [0.1, 0.35]].forEach(([cx, cz]) => {
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.set(roomW * 0.15 + cx, 0.23, roomD * 0.12 + cz);
        group.add(cone);
      });

      // Scoreboard stand
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.6, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
      );
      board.position.set(-roomW * 0.05, 1.35, roomD * 0.3);
      group.add(board);
      const boardLegs = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 1.05, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5, roughness: 0.4 })
      );
      boardLegs.position.set(-roomW * 0.05, 0.52, roomD * 0.3);
      group.add(boardLegs);

      anims.push({
        update: (time) => {
          wheel.rotation.y = time * 0.0016;
          const spin = Math.sin(time * 0.004) * 0.15;
          die2.rotation.y = 0.8 + spin;
        }
      });
      break;
    }

    case 'math_models': {
      // Class 12B Centum: rotating polyhedra gallery on pedestals
      const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x5b3a2e, roughness: 0.5 });
      const solidMats = [
        new THREE.MeshStandardMaterial({ color: 0x6366f1, emissive: 0x6366f1, emissiveIntensity: 0.45, roughness: 0.25 }),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.45, roughness: 0.25 }),
        new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0ea5e9, emissiveIntensity: 0.45, roughness: 0.25 })
      ];
      const solids: THREE.Mesh[] = [];

      const pedestalXs = [-roomW * 0.28, roomW * 0.28, 0];
      pedestalXs.forEach((px, i) => {
        const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 0.6), pedestalMat);
        pedestal.position.set(px, 0.5, i === 2 ? roomD * 0.26 : -roomD * 0.1);
        group.add(pedestal);

        let solid: THREE.Mesh;
        if (i === 0) solid = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 0), solidMats[0]);
        else if (i === 1) solid = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), solidMats[1]);
        else solid = new THREE.Mesh(new THREE.TorusKnotGeometry(0.22, 0.07, 64, 10), solidMats[2]);
        solid.position.set(px, 1.42, pedestal.position.z);
        group.add(solid);
        solids.push(solid);
      });

      // Central rotating wireframe sphere with orbiting satellites
      const orbitGroup = new THREE.Group();
      orbitGroup.position.set(0, 1.7, -roomD * 0.22);
      const wireSphere = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.42, 1),
        new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true, transparent: true, opacity: 0.75 })
      );
      orbitGroup.add(wireSphere);
      const satMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.8 });
      const sat1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), satMat);
      sat1.position.x = 0.62;
      const sat2 = sat1.clone();
      sat2.position.set(-0.5, 0.3, 0.35);
      orbitGroup.add(sat1, sat2);
      group.add(orbitGroup);

      anims.push({
        update: (time) => {
          solids[0].rotation.y = time * 0.0011;
          solids[0].rotation.x = time * 0.0006;
          solids[1].rotation.y = -time * 0.0013;
          solids[2].rotation.y = time * 0.0009;
          orbitGroup.rotation.y = time * 0.0014;
        }
      });
      break;
    }

    case 'amphitheatre_stage': {
      // Flagship Quadrangle amphitheatre: stage, backdrop, seating arcs & flags
      const stageW = Math.min(9.0, roomW * 0.92);
      const stageD = 4.2;
      const stageRiser = new THREE.Mesh(
        new THREE.BoxGeometry(stageW, 0.55, stageD),
        new THREE.MeshStandardMaterial({ color: 0x5b3a2e, roughness: 0.55 })
      );
      stageRiser.position.set(0, 0.28, -roomD * 0.34);
      group.add(stageRiser);

      const stageDeckTop = new THREE.Mesh(
        new THREE.BoxGeometry(stageW + 0.1, 0.06, stageD + 0.1),
        new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4 })
      );
      stageDeckTop.position.set(0, 0.58, -roomD * 0.34);
      group.add(stageDeckTop);

      // Show backdrop banner on the stage rear
      const backCanvas = document.createElement('canvas');
      backCanvas.width = 512;
      backCanvas.height = 160;
      const bkCtx = backCanvas.getContext('2d');
      if (bkCtx) {
        bkCtx.fillStyle = '#09090B';
        bkCtx.fillRect(0, 0, 512, 160);
        bkCtx.fillStyle = '#06B6D4';
        bkCtx.fillRect(0, 140, 512, 8);
        bkCtx.font = '800 52px "Plus Jakarta Sans", "Inter", sans-serif';
        bkCtx.textAlign = 'center';
        bkCtx.fillStyle = '#FFFFFF';
        bkCtx.fillText('FLAGSHIP SHOWS', 256, 72);
        bkCtx.font = '600 34px "Plus Jakarta Sans", "Inter", sans-serif';
        bkCtx.fillStyle = '#06B6D4';
        bkCtx.fillText('SCIENTIFICA 2026', 256, 122);
      }
      const backTex = new THREE.CanvasTexture(backCanvas);
      backTex.colorSpace = THREE.SRGBColorSpace;
      const backdrop = new THREE.Mesh(
        new THREE.PlaneGeometry(stageW * 0.9, 2.3),
        new THREE.MeshBasicMaterial({ map: backTex, side: THREE.DoubleSide })
      );
      backdrop.position.set(0, 1.75, -roomD * 0.34 - stageD / 2 + 0.1);
      group.add(backdrop);
      const backFrame = new THREE.Mesh(
        new THREE.BoxGeometry(stageW * 0.92, 2.4, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
      );
      backFrame.position.set(0, 1.7, -roomD * 0.34 - stageD / 2 - 0.02);
      group.add(backFrame);

      // Speaker stacks flanking the stage
      const speakerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
      [-stageW / 2 - 0.5, stageW / 2 + 0.5].forEach(sx => {
        const stack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 0.5), speakerMat);
        stack.position.set(sx, 0.75, -roomD * 0.34);
        group.add(stack);
      });

      // Flag poles with vibrant pennants
      const flagColors = [0xf59e0b, 0x0ea5e9, 0x10b981, 0xef4444];
      const flags: THREE.Mesh[] = [];
      [-1, 1].forEach((side, i) => {
        [-1, 1].forEach((end, j) => {
          const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 2.6, 8),
            new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.3 })
          );
          pole.position.set(side * (roomW / 2 - 0.5), 1.3, -roomD * 0.1 + end * roomD * 0.3);
          group.add(pole);
          const flag = new THREE.Mesh(
            new THREE.PlaneGeometry(0.8, 0.45),
            new THREE.MeshStandardMaterial({
              color: flagColors[(i * 2 + j) % flagColors.length],
              side: THREE.DoubleSide,
              roughness: 0.6
            })
          );
          flag.position.set(pole.position.x + side * 0.42, 2.32, pole.position.z);
          group.add(flag);
          flags.push(flag);
        });
      });

      anims.push({
        update: (time) => {
          flags.forEach((flag, i) => {
            flag.rotation.y = Math.sin(time * 0.002 + i * 1.3) * 0.35;
            flag.scale.x = 0.85 + Math.sin(time * 0.003 + i) * 0.15;
          });
        }
      });

      // The show faces the entrance: rotate the whole amphitheatre 180° so the
      // stage sits at the quad's south end with the backdrop behind it and the
      // seating arcs opening north toward the main walkway
      group.rotation.y = Math.PI;
      break;
    }

    case 'food_truck': {
      // Front-court food truck on a paved plaza pad
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(Math.max(roomW + 1.6, 7.0), 0.1, Math.max(roomD + 1.6, 4.6)),
        new THREE.MeshStandardMaterial({ color: 0xb8aba0, roughness: 0.85 })
      );
      pad.position.y = 0.05;
      group.add(pad);

      const truckLen = Math.min(4.6, roomW * 0.8);
      const truckH = 1.9;
      const truckW = 1.7;
      // White body with a warm red service stripe
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(truckLen, truckH, truckW),
        new THREE.MeshStandardMaterial({ color: 0xf4eee3, roughness: 0.45 })
      );
      body.position.set(-0.3, 0.1 + 0.32 + truckH / 2, 0);
      group.add(body);
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(truckLen + 0.02, 0.34, truckW + 0.04),
        new THREE.MeshStandardMaterial({ color: 0xb5452f, roughness: 0.45 })
      );
      stripe.position.set(body.position.x, body.position.y - 0.2, 0);
      group.add(stripe);

      // Cab at the front (+x)
      const cab = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.15, truckW - 0.1),
        new THREE.MeshStandardMaterial({ color: 0xd8cbb6, roughness: 0.5 })
      );
      cab.position.set(body.position.x + truckLen / 2 + 0.5, 0.1 + 0.32 + 0.58, 0);
      group.add(cab);
      const windshield = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x9fc4dd, metalness: 0.6, roughness: 0.2 })
      );
      windshield.position.set(cab.position.x + 0.56, cab.position.y + 0.15, 0);
      windshield.rotation.y = Math.PI / 2;
      group.add(windshield);

      // Wheels
      const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 14);
      wheelGeo.rotateZ(Math.PI / 2);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
      [[-1.5, -truckW / 2 - 0.05], [-1.5, truckW / 2 + 0.05], [1.4, -truckW / 2 - 0.05], [1.4, truckW / 2 + 0.05]].forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(wx - 0.3, 0.42, wz);
        group.add(wheel);
      });

      // Serving window + striped awning on the court-facing side (+z)
      const servingWindow = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.75, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
      );
      servingWindow.position.set(body.position.x - 0.6, body.position.y + 0.25, truckW / 2 + 0.03);
      group.add(servingWindow);
      const counter = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 0.08, 0.55),
        new THREE.MeshStandardMaterial({ color: 0x6b5a4e, roughness: 0.5 })
      );
      counter.position.set(servingWindow.position.x, body.position.y - 0.18, truckW / 2 + 0.3);
      group.add(counter);

      const awningCanvas = document.createElement('canvas');
      awningCanvas.width = 256;
      awningCanvas.height = 64;
      const aCtx = awningCanvas.getContext('2d');
      if (aCtx) {
        for (let i = 0; i < 8; i++) {
          aCtx.fillStyle = i % 2 === 0 ? '#b5452f' : '#f4eee3';
          aCtx.fillRect(i * 32, 0, 32, 64);
        }
      }
      const awningTex = new THREE.CanvasTexture(awningCanvas);
      awningTex.colorSpace = THREE.SRGBColorSpace;
      const awning = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.05, 0.9),
        new THREE.MeshStandardMaterial({ map: awningTex, roughness: 0.6 })
      );
      awning.position.set(servingWindow.position.x, body.position.y + 0.78, truckW / 2 + 0.42);
      awning.rotation.x = 0.28;
      group.add(awning);

      // Menu board on a post
      const menu = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 1.0, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 })
      );
      menu.position.set(body.position.x + 1.2, 1.35, truckW / 2 + 0.6);
      group.add(menu);
      const menuPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 1.0, 8),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5, roughness: 0.4 })
      );
      menuPost.position.set(menu.position.x, 0.85, menu.position.z);
      group.add(menuPost);

      // Queue barrier rails
      const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5, roughness: 0.4 });
      for (let i = 0; i < 3; i++) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), railMat);
        post.position.set(servingWindow.position.x + 1.4 - i * 0.9, 0.45, truckW / 2 + 1.3);
        group.add(post);
        if (i > 0) {
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.04), railMat);
          bar.position.set(servingWindow.position.x + 1.85 - i * 0.9, 0.82, truckW / 2 + 1.3);
          group.add(bar);
        }
      }
      break;
    }

    case 'planter_stall': {
      // APD (Association of People with Disability) planters sale stall
      const pad = new THREE.Mesh(
        new THREE.BoxGeometry(Math.max(roomW + 1.4, 6.4), 0.1, Math.max(roomD + 1.6, 4.4)),
        new THREE.MeshStandardMaterial({ color: 0xb8aba0, roughness: 0.85 })
      );
      pad.position.y = 0.05;
      group.add(pad);

      // Striped canopy on four posts
      const canopyCanvas = document.createElement('canvas');
      canopyCanvas.width = 256;
      canopyCanvas.height = 128;
      const cCtx = canopyCanvas.getContext('2d');
      if (cCtx) {
        cCtx.fillStyle = '#10b981';
        cCtx.fillRect(0, 0, 256, 128);
        cCtx.fillStyle = '#f4eee3';
        for (let i = 0; i < 8; i += 2) {
          cCtx.fillRect(i * 32, 0, 32, 128);
        }
      }
      const canopyTex = new THREE.CanvasTexture(canopyCanvas);
      canopyTex.colorSpace = THREE.SRGBColorSpace;
      const postMat = new THREE.MeshStandardMaterial({ color: 0x6b5a4e, roughness: 0.5 });
      const canopyW = Math.min(4.4, roomW * 0.85);
      const canopyD = Math.min(2.8, roomD * 0.9);
      [-canopyW / 2, canopyW / 2].forEach(px => {
        [-canopyD / 2, canopyD / 2].forEach(pz => {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.0, 8), postMat);
          post.position.set(px, 1.0, pz);
          group.add(post);
        });
      });
      const canopy = new THREE.Mesh(
        new THREE.BoxGeometry(canopyW + 0.5, 0.06, canopyD + 0.5),
        new THREE.MeshStandardMaterial({ map: canopyTex, roughness: 0.6 })
      );
      canopy.position.y = 2.06;
      group.add(canopy);

      // Banner rail across the front
      const bannerCanvas = document.createElement('canvas');
      bannerCanvas.width = 512;
      bannerCanvas.height = 96;
      const bnrCtx = bannerCanvas.getContext('2d');
      if (bnrCtx) {
        bnrCtx.fillStyle = '#09090B';
        bnrCtx.fillRect(0, 0, 512, 96);
        bnrCtx.fillStyle = '#10b981';
        bnrCtx.fillRect(0, 84, 512, 6);
        bnrCtx.font = '800 44px "Plus Jakarta Sans", "Inter", sans-serif';
        bnrCtx.textAlign = 'center';
        bnrCtx.fillStyle = '#FFFFFF';
        bnrCtx.fillText('APD PLANTERS', 256, 62);
      }
      const bannerTex = new THREE.CanvasTexture(bannerCanvas);
      bannerTex.colorSpace = THREE.SRGBColorSpace;
      const banner = new THREE.Mesh(
        new THREE.PlaneGeometry(canopyW * 0.85, 0.55),
        new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide })
      );
      banner.position.set(0, 1.72, canopyD / 2 + 0.05);
      group.add(banner);

      // Display tables with potted planters
      const tableMat = new THREE.MeshStandardMaterial({ color: 0x6b5a4e, roughness: 0.5 });
      const potMat = new THREE.MeshStandardMaterial({ color: 0xb5762a, roughness: 0.6 });
      const plantMats = [
        new THREE.MeshStandardMaterial({ color: 0x2f7a45, roughness: 0.6 }),
        new THREE.MeshStandardMaterial({ color: 0x4f7a45, roughness: 0.6 }),
        new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.6 })
      ];
      const plants: THREE.Mesh[] = [];
      [-1.0, 1.0].forEach(tx => {
        const table = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.72, 0.8), tableMat);
        table.position.set(tx, 0.41, 0.25);
        group.add(table);
        for (let p = 0; p < 3; p++) {
          const potX = tx - 0.55 + p * 0.55;
          const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.2, 10), potMat);
          pot.position.set(potX, 0.87, 0.25);
          group.add(pot);
          const plant = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), plantMats[p % plantMats.length]);
          plant.position.set(potX, 1.06, 0.25);
          group.add(plant);
          plants.push(plant);
        }
      });

      // Tiered plant rack on the side
      const rack = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x8c7e73, roughness: 0.6 }));
      rack.position.set(-canopyW / 2 - 0.75, 0.8, 0);
      group.add(rack);
      for (let tier = 0; tier < 3; tier++) {
        const plant = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0), plantMats[tier % plantMats.length]);
        plant.position.set(rack.position.x, 0.55 + tier * 0.42, 0.3);
        group.add(plant);
        plants.push(plant);
      }

      anims.push({
        update: (time) => {
          plants.forEach((plant, i) => {
            plant.rotation.y = time * 0.0006 + i;
            plant.position.y += Math.sin(time * 0.003 + i * 1.7) * 0.0006;
          });
        }
      });
      break;
    }

    case 'social_diorama': {
      // Social Science exhibit: heritage relief-map diorama, miniature civic
      // settlement, monument and a rotating globe
      const tableMat = new THREE.MeshStandardMaterial({ color: 0x6b5a4e, roughness: 0.5 });
      const table = new THREE.Mesh(
        new THREE.BoxGeometry(roomW * 0.62, 0.72, roomD * 0.52),
        tableMat
      );
      table.position.set(-roomW * 0.14, 0.36, 0.2);
      group.add(table);

      // Layered relief map on the table (terrain contours, earth tones)
      const terrainLayers = [
        { w: 0.92, d: 0.9, y: 0.14, color: 0x8a9a5b },
        { w: 0.72, d: 0.68, y: 0.26, color: 0xb08954 },
        { w: 0.48, d: 0.44, y: 0.38, color: 0x9c7a4a }
      ];
      terrainLayers.forEach(layer => {
        const slab = new THREE.Mesh(
          new THREE.BoxGeometry(roomW * 0.62 * layer.w, 0.12, roomD * 0.52 * layer.d),
          new THREE.MeshStandardMaterial({ color: layer.color, roughness: 0.8 })
        );
        slab.position.set(-roomW * 0.14, 0.72 + layer.y, 0.2);
        group.add(slab);
      });
      // River strip winding across the base layer
      const river = new THREE.Mesh(
        new THREE.BoxGeometry(roomW * 0.56, 0.03, roomD * 0.1),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.25, metalness: 0.3 })
      );
      river.position.set(-roomW * 0.14, 0.925, 0.2 + roomD * 0.14);
      river.rotation.y = 0.12;
      group.add(river);

      // Miniature settlement: houses with pitched roofs + civic hall
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xf4eee3, roughness: 0.7 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xb5452f, roughness: 0.6 });
      const houseGeo = new THREE.BoxGeometry(0.16, 0.14, 0.14);
      const roofGeo = new THREE.ConeGeometry(0.13, 0.12, 4);
      [
        [-0.62, -0.18], [-0.3, -0.32], [-0.18, 0.3], [0.2, -0.28], [0.42, 0.26]
      ].forEach(([hx, hz], i) => {
        const house = new THREE.Mesh(houseGeo, wallMat);
        house.position.set(-roomW * 0.14 + hx, 0.99, 0.2 + hz);
        house.rotation.y = i * 0.4;
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(house.position.x, 1.1, house.position.z);
        roof.rotation.y = house.rotation.y;
        group.add(house, roof);
      });
      // Civic hall with a small flag on top
      const hall = new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.2, 0.18),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.6 })
      );
      hall.position.set(-roomW * 0.14 - 0.05, 1.03, 0.2 - 0.02);
      group.add(hall);
      const hallRoof = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.04, 0.22),
        new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 })
      );
      hallRoof.position.set(hall.position.x, 1.15, hall.position.z);
      group.add(hallRoof);
      const flagPole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.3, 6),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.3 })
      );
      flagPole.position.set(hall.position.x, 1.3, hall.position.z);
      group.add(flagPole);
      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(0.14, 0.08),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, side: THREE.DoubleSide, roughness: 0.6 })
      );
      flag.position.set(hall.position.x + 0.075, 1.4, hall.position.z);
      group.add(flag);

      // Trees scattered on the relief
      const treeTopMat = new THREE.MeshStandardMaterial({ color: 0x2f7a45, roughness: 0.7 });
      const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5b3a2e, roughness: 0.8 });
      [[-0.85, 0.35], [-0.05, -0.05], [0.55, -0.1], [-0.45, 0.42], [0.75, 0.4]].forEach(([tx, tz]) => {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.024, 0.09, 6), treeTrunkMat);
        trunk.position.set(-roomW * 0.14 + tx, 1.0, 0.2 + tz);
        const crown = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), treeTopMat);
        crown.position.set(trunk.position.x, 1.08, trunk.position.z);
        group.add(trunk, crown);
      });

      // Monument obelisk on a plinth at the diorama's edge
      const plinth = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.08, 0.22),
        new THREE.MeshStandardMaterial({ color: 0xd8cbb6, roughness: 0.7 })
      );
      plinth.position.set(-roomW * 0.14 + 0.62, 0.96, 0.2 - 0.34);
      group.add(plinth);
      const obelisk = new THREE.Mesh(
        new THREE.ConeGeometry(0.055, 0.42, 4),
        new THREE.MeshStandardMaterial({ color: 0xd8cbb6, roughness: 0.6 })
      );
      obelisk.position.set(plinth.position.x, 1.2, plinth.position.z);
      obelisk.rotation.y = Math.PI / 4;
      group.add(obelisk);

      // Rotating globe on a side pedestal
      const pedestal = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.95, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x5b3a2e, roughness: 0.5 })
      );
      pedestal.position.set(roomW * 0.3, 0.48, roomD * 0.18);
      group.add(pedestal);
      const globeGroup = new THREE.Group();
      globeGroup.position.set(pedestal.position.x, 1.32, pedestal.position.z);
      const oceanMat = new THREE.MeshStandardMaterial({
        color: 0x1d6fa5,
        roughness: 0.35,
        metalness: 0.1
      });
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 20), oceanMat);
      globeGroup.add(globe);
      // Simplified continents as low-poly patches hugging the sphere
      const landMat = new THREE.MeshStandardMaterial({ color: 0x4f7a45, roughness: 0.6 });
      const landShapes: [number, number, number][] = [
        [0.2, 0.55, 0.32], [-0.5, 0.15, 0.28], [0.45, -0.35, 0.3],
        [-0.15, -0.6, 0.24], [0.05, 0.1, 0.42]
      ];
      landShapes.forEach(([lx, ly, ls]) => {
        const patch = new THREE.Mesh(new THREE.SphereGeometry(0.11 * ls + 0.05, 8, 8), landMat);
        patch.position.set(lx * 0.28, ly * 0.28, Math.sqrt(Math.max(0, 0.09 - (lx * 0.28) ** 2 - (ly * 0.28) ** 2) * 0.9));
        patch.scale.set(1, 0.7, 0.4);
        patch.lookAt(0, 0, 0);
        globeGroup.add(patch);
      });
      const globeAxis = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.78, 8),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 })
      );
      globeAxis.rotation.z = 0.41;
      globeGroup.add(globeAxis);
      globeGroup.rotation.z = -0.41;
      group.add(globeGroup);

      // Timeline banner standing beside the table
      const bannerCanvas = document.createElement('canvas');
      bannerCanvas.width = 256;
      bannerCanvas.height = 128;
      const soCtx = bannerCanvas.getContext('2d');
      if (soCtx) {
        soCtx.fillStyle = '#7c2d12';
        soCtx.fillRect(0, 0, 256, 128);
        soCtx.fillStyle = '#fdba74';
        soCtx.fillRect(0, 112, 256, 6);
        soCtx.font = '800 26px "Plus Jakarta Sans", "Inter", sans-serif';
        soCtx.textAlign = 'center';
        soCtx.fillStyle = '#FFF7ED';
        soCtx.fillText('HERITAGE', 128, 52);
        soCtx.fillText('& CIVICS', 128, 88);
      }
      const bannerTex = new THREE.CanvasTexture(bannerCanvas);
      bannerTex.colorSpace = THREE.SRGBColorSpace;
      const banner = new THREE.Mesh(
        new THREE.PlaneGeometry(1.05, 0.55),
        new THREE.MeshStandardMaterial({ map: bannerTex, side: THREE.DoubleSide, roughness: 0.7 })
      );
      banner.position.set(-roomW * 0.14, 1.5, -roomD * 0.34);
      group.add(banner);
      [-0.5, 0.5].forEach(bx => {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 1.15, 6),
          new THREE.MeshStandardMaterial({ color: 0x6b5a4e, roughness: 0.55 })
        );
        post.position.set(banner.position.x + bx, 0.58, banner.position.z);
        group.add(post);
      });

      anims.push({
        update: (time) => {
          globeGroup.rotation.y = time * 0.0009;
          flag.rotation.y = Math.sin(time * 0.004) * 0.5;
        }
      });
      break;
    }

    case 'aerodynamics_lab': {
      // Physics aerodynamics room: museum plane model on a stand, paper darts
      // circling on flight paths, launch ramp and a desk wind fan
      const floorMat = new THREE.MeshStandardMaterial({ color: 0xeef1f5, roughness: 0.9 });
      const floorPad = new THREE.Mesh(
        new THREE.PlaneGeometry(roomW * 0.86, roomD * 0.8),
        floorMat
      );
      floorPad.rotation.x = -Math.PI / 2;
      floorPad.position.y = 0.02;
      group.add(floorPad);
      // Runway stripe down the pad centre
      const runway = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, roomD * 0.72),
        new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 })
      );
      runway.rotation.x = -Math.PI / 2;
      runway.position.set(0, 0.03, 0);
      group.add(runway);
      [-0.35, 0.35].forEach(mx => {
        const dashRow = new THREE.Mesh(
          new THREE.PlaneGeometry(0.06, roomD * 0.66),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 })
        );
        dashRow.rotation.x = -Math.PI / 2;
        dashRow.position.set(mx, 0.035, 0);
        group.add(dashRow);
      });

      // Museum display plane on a rod stand (slowly rotating)
      const displayGroup = new THREE.Group();
      displayGroup.position.set(-roomW * 0.26, 0, roomD * 0.12);
      const standRod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.05, 1.35, 10),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 })
      );
      standRod.position.y = 0.675;
      displayGroup.add(standRod);
      const standBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.34, 0.06, 20),
        new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 })
      );
      standBase.position.y = 0.03;
      displayGroup.add(standBase);

      const fuselage = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.09, 0.85, 6, 14),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, metalness: 0.15 })
      );
      fuselage.rotation.z = Math.PI / 2;
      displayGroup.add(fuselage);
      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 1.55, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 })
      );
      wing.position.y = 0.04;
      displayGroup.add(wing);
      const tailFin = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.26, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45 })
      );
      tailFin.position.set(0, 0.14, -0.52);
      displayGroup.add(tailFin);
      const tailPlane = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.55, 0.14),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
      );
      tailPlane.position.set(0, 0.02, -0.52);
      displayGroup.add(tailPlane);
      const cockpit = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0x1d6fa5, roughness: 0.2, metalness: 0.4 })
      );
      cockpit.position.set(0, 0.05, 0.28);
      cockpit.scale.set(0.7, 0.7, 1.4);
      displayGroup.add(cockpit);
      displayGroup.position.y = 1.42;
      group.add(displayGroup);

      // Launch ramp with a dart waiting at the tip
      const rampGroup = new THREE.Group();
      rampGroup.position.set(roomW * 0.28, 0, -roomD * 0.22);
      const ramp = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.06, 1.1),
        new THREE.MeshStandardMaterial({ color: 0x5b3a2e, roughness: 0.55 })
      );
      ramp.rotation.x = -0.42;
      ramp.position.y = 0.42;
      rampGroup.add(ramp);
      [-0.22, 0.22].forEach(rx => {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.52, 0.05),
          new THREE.MeshStandardMaterial({ color: 0x6b5a4e, roughness: 0.6 })
        );
        leg.position.set(rx, 0.26, 0.32);
        rampGroup.add(leg);
        const legLow = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.22, 0.05),
          new THREE.MeshStandardMaterial({ color: 0x6b5a4e, roughness: 0.6 })
        );
        legLow.position.set(rx, 0.11, -0.42);
        rampGroup.add(legLow);
      });
      const launchDart = createPaperPlane(0.16, 0.42, 0.09);
      launchDart.rotation.x = 0.42;
      launchDart.position.set(0, 0.78, 0.24);
      rampGroup.add(launchDart);
      group.add(rampGroup);

      // Desk fan pointing down the runway
      const fanGroup = new THREE.Group();
      fanGroup.position.set(roomW * 0.28, 0, roomD * 0.3);
      const fanBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.2, 0.06, 16),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 })
      );
      fanBase.position.y = 0.03;
      fanGroup.add(fanBase);
      const fanPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.035, 0.5, 10),
        new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4, metalness: 0.4 })
      );
      fanPost.position.y = 0.31;
      fanGroup.add(fanPost);
      const fanCage = new THREE.Mesh(
        new THREE.TorusGeometry(0.22, 0.018, 8, 28),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.35 })
      );
      fanCage.position.y = 0.66;
      fanGroup.add(fanCage);
      const fanHub = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 10, 10),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
      );
      fanHub.position.y = 0.66;
      fanGroup.add(fanHub);
      const fanBlades: THREE.Mesh[] = [];
      for (let b = 0; b < 4; b++) {
        const blade = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.18, 0.015),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 })
        );
        blade.position.y = 0.66;
        blade.rotation.z = (b / 4) * Math.PI * 2;
        blade.translateY(0.11);
        blade.rotation.x = 0.5;
        fanGroup.add(blade);
        fanBlades.push(blade);
      }
      fanGroup.rotation.y = Math.PI; // faces the runway / flying darts
      group.add(fanGroup);

      // Paper darts circling the room on banked flight paths
      const flightGroup = new THREE.Group();
      group.add(flightGroup);
      const darts: { mesh: THREE.Mesh; radius: number; height: number; speed: number; phase: number }[] = [];
      const dartSpecs = [
        { radius: Math.min(roomW, roomD) * 0.3, height: 1.9, speed: 0.00055, phase: 0 },
        { radius: Math.min(roomW, roomD) * 0.3, height: 2.2, speed: 0.00045, phase: 2.2 },
        { radius: Math.min(roomW, roomD) * 0.19, height: 1.7, speed: 0.00062, phase: 4.1 }
      ];
      dartSpecs.forEach(spec => {
        const dart = createPaperPlane(0.2, 0.55, 0.12);
        flightGroup.add(dart);
        darts.push({ mesh: dart, ...spec });
      });

      anims.push({
        update: (time) => {
          displayGroup.rotation.y = time * 0.0004;
          fanBlades.forEach(blade => { blade.rotation.z += 0.3; });
          darts.forEach(({ mesh, radius, height, speed, phase }) => {
            const angle = time * speed + phase;
            mesh.position.set(
              Math.cos(angle) * radius,
              height + Math.sin(time * 0.002 + phase) * 0.08,
              Math.sin(angle) * radius
            );
            // Nose points along the flight direction with a slight bank
            mesh.rotation.y = -angle - Math.PI / 2;
            mesh.rotation.z = 0.28;
          });
        }
      });
      break;
    }

    case 'av_screen': {
      // Big Projection Screen on wall (Stage & AV tone #8A3B4D)
      const screenW = roomW * 0.85;
      const screenH = 1.8;
      const screenMat = new THREE.MeshBasicMaterial({
        color: 0x8a3b4d,
        transparent: true,
        opacity: 0.9
      });
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(screenW, screenH), screenMat);
      screen.position.set(0, 1.4, -roomD * 0.38);
      group.add(screen);

      // Audience Bench Rows (Warm wood #6B5A4E)
      const benchMat = new THREE.MeshStandardMaterial({ color: 0x6b5a4e, roughness: 0.6 });
      [-0.4, 0.4, 1.2].forEach(z => {
        const b = new THREE.Mesh(new THREE.BoxGeometry(screenW * 0.8, 0.35, 0.45), benchMat);
        b.position.set(0, 0.18 + (z * 0.1), z);
        group.add(b);
      });
      break;
    }

    case 'music_sound': {
      // Speaker Towers (Chocolate Brown #5B3A2E)
      const spkGeo = new THREE.BoxGeometry(0.5, 1.4, 0.5);
      const spkMat = new THREE.MeshStandardMaterial({ color: 0x5b3a2e, roughness: 0.5 });
      const s1 = new THREE.Mesh(spkGeo, spkMat);
      s1.position.set(-roomW * 0.35, 0.7, -0.6);
      const s2 = new THREE.Mesh(spkGeo, spkMat);
      s2.position.set(roomW * 0.35, 0.7, -0.6);
      group.add(s1, s2);

      // Synthesizer Table (Warm wood #6B5A4E)
      const synthTable = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 0.8), new THREE.MeshStandardMaterial({ color: 0x6b5a4e }));
      synthTable.position.set(0, 0.35, 0.2);
      group.add(synthTable);

      // Keyboard (Cream #FBF8F2)
      const kb = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.45), new THREE.MeshBasicMaterial({ color: 0xfbf8f2 }));
      kb.position.set(0, 0.74, 0.2);
      group.add(kb);
      break;
    }

    case 'cloud_chamber_physics': {
      // Cylinder Chamber (Physics #6B4E8A / Wood #5B3A2E)
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.3, 24), new THREE.MeshStandardMaterial({ color: 0x5b3a2e }));
      base.position.y = 0.15;
      group.add(base);

      const glassCylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.9, 0.9, 24),
        new THREE.MeshPhysicalMaterial({ color: 0xdce6ec, transmission: 0.9, transparent: true, roughness: 0.15 })
      );
      glassCylinder.position.y = 0.75;
      group.add(glassCylinder);

      // Glowing Muon Track Line (Physics violet #6B4E8A)
      const trackMat = new THREE.MeshBasicMaterial({ color: 0x6b4e8a });
      const track = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), trackMat);
      track.position.set(0.2, 0.75, 0.1);
      track.rotation.z = 0.4;
      group.add(track);

      anims.push({
        update: (time) => {
          track.rotation.y = time * 0.002;
          track.position.x = Math.sin(time * 0.003) * 0.3;
        }
      });
      break;
    }

    case 'sports_physics': {
      // Court Grid Mat (Ecology green #2F7A72)
      const court = new THREE.Mesh(
        new THREE.PlaneGeometry(roomW * 0.8, roomD * 0.75),
        new THREE.MeshStandardMaterial({ color: 0x2f7a72, roughness: 0.6 })
      );
      court.rotation.x = -Math.PI / 2;
      court.position.y = 0.02;
      group.add(court);

      // High-speed camera tripod
      const camTripod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0x5b3a2e }));
      camTripod.position.set(-roomW * 0.3, 0.6, roomD * 0.25);
      group.add(camTripod);
      break;
    }

    case 'stairs_core':
    case 'stairs_circulation': {
      const stairGroup = new THREE.Group();

      // Materials Palette matching NPS Yeshwanthpur warm architectural theme & DXF CAD layers
      const treadMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,      // Clean architectural crisp light stone / terrazzo
        roughness: 0.35,
        metalness: 0.1
      });
      const riserMat = new THREE.MeshStandardMaterial({
        color: 0x334155,      // Charcoal slate riser backing for bold contrast
        roughness: 0.65,
        metalness: 0.2
      });
      const stringerMat = new THREE.MeshStandardMaterial({
        color: 0x475569,      // Slate steel structural stringers & posts
        roughness: 0.5,
        metalness: 0.3
      });
      const handrailMat = new THREE.MeshStandardMaterial({
        color: 0xb45309,      // Warm amber teak hardwood handrail
        roughness: 0.35,
        metalness: 0.1
      });
      const balustradeMat = new THREE.MeshStandardMaterial({
        color: 0xdce6ec,      // Tempered safety glass
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        opacity: 0.55
      });
      const ledMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b }); // Vibrant amber/yellow LED nosing (matching DXF STAIRS layer)

      const isTopFloor = floorLevel === 3;
      const isDogLeg = roomW > 6.0; // West Stairs (7.5m x 7.5m) is dog-leg switchback

      if (isDogLeg) {
        // =========================================================================
        // WEST STAIRS CORE (7.5m x 7.5m Dog-leg / Switchback Staircase)
        // DXF shows flight 1 ascending, wide mid-landing, flight 2 ascending back
        // Facing towards the south corridor / user arrow (+Z direction)
        stairGroup.rotation.y = 0;
        const flightW = roomW * 0.42; // ~3.15m wide each flight
        const landingD = roomD * 0.32; // ~2.4m deep landing across the rear
        const landingY = 1.6;
        const landingZ = -roomD * 0.4 + landingD / 2;
        const runD = roomD * 0.46; // depth of the step runs
        const numSteps = 9;
        const stepRise = landingY / numSteps; // ~0.177m comfortable rise
        const stepRun = runD / numSteps;     // ~0.38m tread run

        if (isTopFloor) {
          // --- First Floor / Top Floor Arrival Core ---
          const topLandingGeo = new THREE.BoxGeometry(roomW * 0.9, 0.12, roomD * 0.45);
          const topLanding = new THREE.Mesh(topLandingGeo, treadMat);
          topLanding.position.set(0, 0.06, roomD * 0.15);
          stairGroup.add(topLanding);

          const wellMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
          const stairWell = new THREE.Mesh(new THREE.BoxGeometry(flightW * 1.05, 0.2, runD + landingD * 0.5), wellMat);
          stairWell.position.set(-roomW * 0.23, -0.08, landingZ + runD * 0.3);
          stairGroup.add(stairWell);

          for (let i = 0; i < numSteps; i++) {
            const sy = -(i + 1) * stepRise;
            const sz = roomD * 0.05 - i * stepRun;
            const tread = new THREE.Mesh(new THREE.BoxGeometry(flightW * 0.95, 0.08, stepRun * 1.05), treadMat);
            tread.position.set(-roomW * 0.23, sy, sz);
            stairGroup.add(tread);

            const led = new THREE.Mesh(new THREE.BoxGeometry(flightW * 0.9, 0.02, 0.02), ledMat);
            led.position.set(-roomW * 0.23, sy + 0.04, sz + stepRun * 0.5);
            stairGroup.add(led);
          }

          const bH = 0.95;
          const glassGeoRear = new THREE.BoxGeometry(roomW * 0.88, bH, 0.04);
          const bgRear = new THREE.Mesh(glassGeoRear, balustradeMat);
          bgRear.position.set(0, bH / 2 + 0.12, -roomD * 0.38);
          stairGroup.add(bgRear);

          const railRear = new THREE.Mesh(new THREE.BoxGeometry(roomW * 0.9, 0.06, 0.08), handrailMat);
          railRear.position.set(0, bH + 0.12, -roomD * 0.38);
          stairGroup.add(railRear);

          const glassGeoCenter = new THREE.BoxGeometry(0.04, bH, runD + landingD);
          const bgCenter = new THREE.Mesh(glassGeoCenter, balustradeMat);
          bgCenter.position.set(0, bH / 2 + 0.12, landingZ + runD * 0.2);
          stairGroup.add(bgCenter);

          const railCenter = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, runD + landingD), handrailMat);
          railCenter.position.set(0, bH + 0.12, landingZ + runD * 0.2);
          stairGroup.add(railCenter);

          const bgOuter = new THREE.Mesh(glassGeoCenter, balustradeMat);
          bgOuter.position.set(-roomW * 0.44, bH / 2 + 0.12, landingZ + runD * 0.2);
          stairGroup.add(bgOuter);

          const railOuter = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, runD + landingD), handrailMat);
          railOuter.position.set(-roomW * 0.44, bH + 0.12, landingZ + runD * 0.2);
          stairGroup.add(railOuter);

        } else {
          // --- Ground Floor & Basement Ascending Dog-Leg Staircase ---
          const midLandingGeo = new THREE.BoxGeometry(roomW * 0.88, 0.14, landingD);
          const midLanding = new THREE.Mesh(midLandingGeo, treadMat);
          midLanding.position.set(0, landingY, landingZ);
          stairGroup.add(midLanding);

          const landingSoffit = new THREE.Mesh(new THREE.BoxGeometry(roomW * 0.88, landingY, landingD), stringerMat);
          landingSoffit.position.set(0, landingY / 2, landingZ);
          stairGroup.add(landingSoffit);

          const f1X = -roomW * 0.23;
          for (let i = 0; i < numSteps; i++) {
            const sy = (i + 1) * stepRise;
            const sz = roomD * 0.35 - i * stepRun;

            const tread = new THREE.Mesh(new THREE.BoxGeometry(flightW * 0.95, 0.08, stepRun * 1.08), treadMat);
            tread.position.set(f1X, sy, sz);
            stairGroup.add(tread);

            const riser = new THREE.Mesh(new THREE.BoxGeometry(flightW * 0.95, stepRise, 0.04), riserMat);
            riser.position.set(f1X, sy - stepRise / 2, sz + stepRun / 2);
            stairGroup.add(riser);

            const led = new THREE.Mesh(new THREE.BoxGeometry(flightW * 0.9, 0.02, 0.02), ledMat);
            led.position.set(f1X, sy + 0.04, sz - stepRun * 0.5);
            stairGroup.add(led);
          }

          const f2X = roomW * 0.23;
          for (let i = 0; i < numSteps; i++) {
            const sy = landingY + (i + 1) * stepRise;
            const sz = landingZ + landingD / 2 + (i + 0.5) * stepRun;

            const tread = new THREE.Mesh(new THREE.BoxGeometry(flightW * 0.95, 0.08, stepRun * 1.08), treadMat);
            tread.position.set(f2X, sy, sz);
            stairGroup.add(tread);

            const riser = new THREE.Mesh(new THREE.BoxGeometry(flightW * 0.95, stepRise, 0.04), riserMat);
            riser.position.set(f2X, sy - stepRise / 2, sz - stepRun / 2);
            stairGroup.add(riser);

            const led = new THREE.Mesh(new THREE.BoxGeometry(flightW * 0.9, 0.02, 0.02), ledMat);
            led.position.set(f2X, sy + 0.04, sz + stepRun * 0.5);
            stairGroup.add(led);
          }

          const bH = 0.92;
          const glassLanding = new THREE.Mesh(new THREE.BoxGeometry(roomW * 0.88, bH, 0.04), balustradeMat);
          glassLanding.position.set(0, landingY + bH / 2 + 0.07, landingZ - landingD / 2);
          stairGroup.add(glassLanding);

          const railLanding = new THREE.Mesh(new THREE.BoxGeometry(roomW * 0.9, 0.06, 0.08), handrailMat);
          railLanding.position.set(0, landingY + bH + 0.07, landingZ - landingD / 2);
          stairGroup.add(railLanding);

          const glassCenterF1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, bH, runD * 0.9), balustradeMat);
          glassCenterF1.position.set(0, landingY * 0.5 + bH / 2, roomD * 0.12);
          glassCenterF1.rotation.x = -Math.atan2(landingY, runD) * 0.5;
          stairGroup.add(glassCenterF1);

          const railCenterF1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, runD * 0.9), handrailMat);
          railCenterF1.position.copy(glassCenterF1.position);
          railCenterF1.position.y += bH / 2;
          railCenterF1.rotation.copy(glassCenterF1.rotation);
          stairGroup.add(railCenterF1);

          const outerRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, runD * 0.95), handrailMat);
          outerRail.position.set(-roomW * 0.44, landingY * 0.5 + 0.9, roomD * 0.12);
          outerRail.rotation.x = glassCenterF1.rotation.x;
          stairGroup.add(outerRail);
        }

      } else {
        // =========================================================================
        // STRAIGHT RUN / LANDING STAIRS (East Stairs 4m x 6m & Central Stairs 5m x 8m)
        // =========================================================================
        const stairW = roomW * 0.82;
        const totalRise = 3.0;
        const numSteps = 12;
        const stepRise = totalRise / numSteps;
        const stepRun = (roomD * 0.75) / numSteps;

        if (isTopFloor) {
          // --- First Floor / Top Floor Arrival Mezzanine ---
          const platGeo = new THREE.BoxGeometry(stairW * 1.05, 0.12, roomD * 0.4);
          const plat = new THREE.Mesh(platGeo, treadMat);
          plat.position.set(0, 0.06, roomD * 0.2);
          stairGroup.add(plat);

          const bH = 0.95;
          const bgFront = new THREE.Mesh(new THREE.BoxGeometry(stairW * 1.05, bH, 0.04), balustradeMat);
          bgFront.position.set(0, bH / 2 + 0.12, roomD * 0.02);
          stairGroup.add(bgFront);

          const railFront = new THREE.Mesh(new THREE.BoxGeometry(stairW * 1.08, 0.06, 0.08), handrailMat);
          railFront.position.set(0, bH + 0.12, roomD * 0.02);
          stairGroup.add(railFront);

          for (let i = 0; i < numSteps; i++) {
            const sy = -(i + 1) * stepRise;
            const sz = roomD * 0.02 - i * stepRun;
            const tread = new THREE.Mesh(new THREE.BoxGeometry(stairW, 0.08, stepRun * 1.08), treadMat);
            tread.position.set(0, sy, sz);
            stairGroup.add(tread);

            const led = new THREE.Mesh(new THREE.BoxGeometry(stairW * 0.9, 0.02, 0.02), ledMat);
            led.position.set(0, sy + 0.04, sz + stepRun * 0.5);
            stairGroup.add(led);
          }

        } else {
          // --- Ground Floor & Basement Ascending Straight Flight ---
          const stringerThick = 0.08;
          const stringerH = 0.35;
          const stringerLen = Math.hypot(totalRise, roomD * 0.75);
          const stringerAng = Math.atan2(totalRise, roomD * 0.75);

          [-stairW / 2 - stringerThick / 2, stairW / 2 + stringerThick / 2].forEach(sx => {
            const str = new THREE.Mesh(new THREE.BoxGeometry(stringerThick, stringerH, stringerLen), stringerMat);
            str.position.set(sx, totalRise / 2, -roomD * 0.02);
            str.rotation.x = stringerAng;
            stairGroup.add(str);

            const hr = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, stringerLen), handrailMat);
            hr.position.set(sx, totalRise / 2 + 0.85, -roomD * 0.02);
            hr.rotation.x = stringerAng;
            stairGroup.add(hr);

            const gb = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.8, stringerLen), balustradeMat);
            gb.position.set(sx, totalRise / 2 + 0.45, -roomD * 0.02);
            gb.rotation.x = stringerAng;
            stairGroup.add(gb);
          });

          for (let i = 0; i < numSteps; i++) {
            const sy = (i + 1) * stepRise;
            const sz = roomD * 0.35 - i * stepRun;

            const tread = new THREE.Mesh(new THREE.BoxGeometry(stairW, 0.08, stepRun * 1.1), treadMat);
            tread.position.set(0, sy, sz);
            stairGroup.add(tread);

            const riser = new THREE.Mesh(new THREE.BoxGeometry(stairW, stepRise, 0.04), riserMat);
            riser.position.set(0, sy - stepRise / 2, sz + stepRun / 2);
            stairGroup.add(riser);

            const led = new THREE.Mesh(new THREE.BoxGeometry(stairW * 0.9, 0.02, 0.02), ledMat);
            led.position.set(0, sy + 0.04, sz - stepRun * 0.5);
            stairGroup.add(led);
          }

          const topPlat = new THREE.Mesh(new THREE.BoxGeometry(stairW * 1.05, 0.12, roomD * 0.22), treadMat);
          topPlat.position.set(0, totalRise, -roomD * 0.38);
          stairGroup.add(topPlat);
        }
      }

      group.add(stairGroup);

      anims.push({
        update: (time) => {
          const intensity = Math.sin(time * 0.003) * 0.25 + 0.75;
          ledMat.color.setRGB(0.99 * intensity, 0.94 * intensity, 0.54 * intensity);
        }
      });
      break;
    }

    case 'restroom_amenities': {
      const amGroup = new THREE.Group();

      // 1. Hygienic Porcelain Flooring Mat (Crisp Slate Tile)
      const tileMat = new THREE.MeshStandardMaterial({
        color: 0xd8e0e7,
        roughness: 0.85,
        metalness: 0.05
      });
      const tileFloor = new THREE.Mesh(new THREE.PlaneGeometry(roomW * 0.9, roomD * 0.85), tileMat);
      tileFloor.rotation.x = -Math.PI / 2;
      tileFloor.position.y = 0.02;
      amGroup.add(tileFloor);

      // 2. Modesty / Cubicle Partition Stalls
      const partMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.6,
        metalness: 0.1
      });
      const chromeMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.3,
        metalness: 0.8
      });

      const numStalls = Math.max(2, Math.floor(roomW / 1.8));
      const stallW = (roomW * 0.75) / numStalls;
      const stallD = roomD * 0.35;
      const stallH = 2.0;

      for (let i = 0; i <= numStalls; i++) {
        const divider = new THREE.Mesh(new THREE.BoxGeometry(0.06, stallH, stallD), partMat);
        const px = -roomW * 0.375 + i * stallW;
        divider.position.set(px, stallH / 2, -roomD * 0.4 + stallD / 2);
        amGroup.add(divider);
      }

      for (let i = 0; i < numStalls; i++) {
        const door = new THREE.Mesh(new THREE.BoxGeometry(stallW * 0.88, stallH * 0.9, 0.04), partMat);
        const px = -roomW * 0.375 + i * stallW + stallW / 2;
        door.position.set(px, stallH * 0.9 / 2 + 0.1, -roomD * 0.4 + stallD);
        amGroup.add(door);

        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8), chromeMat);
        handle.position.set(px + stallW * 0.35, 1.0, -roomD * 0.4 + stallD + 0.03);
        amGroup.add(handle);
      }

      // 3. Vanity Counter with Sinks & Faucets
      const vanityMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.2 });
      const basinMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      const mirrorMat = new THREE.MeshStandardMaterial({ color: 0xdce6ec, roughness: 0.1, metalness: 0.9 });

      const vanityW = roomW * 0.75;
      const vanityH = 0.85;
      const vanityD = 0.65;
      const vZ = roomD * 0.25;

      const vanity = new THREE.Mesh(new THREE.BoxGeometry(vanityW, vanityH, vanityD), vanityMat);
      vanity.position.set(0, vanityH / 2, vZ);
      amGroup.add(vanity);

      const numBasins = Math.min(3, Math.max(2, Math.floor(vanityW / 1.5)));
      for (let b = 0; b < numBasins; b++) {
        const bx = -vanityW / 2 + (b + 1) * (vanityW / (numBasins + 1));
        const basin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.42), basinMat);
        basin.position.set(bx, vanityH + 0.03, vZ);
        amGroup.add(basin);

        const faucet = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 12), chromeMat);
        faucet.position.set(bx, vanityH + 0.16, vZ - 0.14);
        amGroup.add(faucet);
      }

      const mirror = new THREE.Mesh(new THREE.BoxGeometry(vanityW * 0.95, 1.1, 0.04), mirrorMat);
      mirror.position.set(0, vanityH + 0.7, vZ + vanityD / 2 + 0.03);
      amGroup.add(mirror);

      // 4. Filtered Chilled Drinking Water Fountain Station
      const waterGroup = new THREE.Group();
      waterGroup.position.set(-roomW * 0.38, 0, 0);

      const dispenserPedestal = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 1.1, 0.4),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4, metalness: 0.5 })
      );
      dispenserPedestal.position.y = 0.55;
      waterGroup.add(dispenserPedestal);

      const alcove = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.4, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
      );
      alcove.position.set(0, 0.85, 0.1);
      waterGroup.add(alcove);

      const waterLed = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.03, 0.02),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      waterLed.position.set(0, 1.12, 0.21);
      waterGroup.add(waterLed);

      amGroup.add(waterGroup);

      group.add(amGroup);
      break;
    }

    case 'elevator_utility': {
      const elevGroup = new THREE.Group();

      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        roughness: 0.5,
        metalness: 0.4
      });
      const steelMat = new THREE.MeshStandardMaterial({
        color: 0xa8b2bc,
        roughness: 0.35,
        metalness: 0.75
      });

      const towerW = Math.min(2.8, roomW * 0.7);
      const towerH = 2.8;
      const towerD = Math.min(2.4, roomD * 0.65);

      const tower = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerD), frameMat);
      tower.position.set(-roomW * 0.1, towerH / 2, -roomD * 0.1);
      elevGroup.add(tower);

      const portalTrim = new THREE.Mesh(
        new THREE.BoxGeometry(towerW * 0.75, 2.2, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
      );
      portalTrim.position.set(-roomW * 0.1, 1.1, -roomD * 0.1 + towerD / 2 + 0.04);
      elevGroup.add(portalTrim);

      const doorW = towerW * 0.65;
      const doorH = 2.05;
      const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(doorW / 2 - 0.02, doorH, 0.05), steelMat);
      leftDoor.position.set(-roomW * 0.1 - doorW / 4, doorH / 2, -roomD * 0.1 + towerD / 2 + 0.08);
      elevGroup.add(leftDoor);

      const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(doorW / 2 - 0.02, doorH, 0.05), steelMat);
      rightDoor.position.set(-roomW * 0.1 + doorW / 4, doorH / 2, -roomD * 0.1 + towerD / 2 + 0.08);
      elevGroup.add(rightDoor);

      const dispScreen = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.18, 0.04),
        new THREE.MeshBasicMaterial({ color: 0x0f172a })
      );
      dispScreen.position.set(-roomW * 0.1, 2.3, -roomD * 0.1 + towerD / 2 + 0.08);
      elevGroup.add(dispScreen);

      const arrowLed = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.08, 0.02),
        new THREE.MeshBasicMaterial({ color: 0x10b981 })
      );
      arrowLed.position.set(-roomW * 0.1, 2.3, -roomD * 0.1 + towerD / 2 + 0.11);
      elevGroup.add(arrowLed);

      const callPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.28, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 })
      );
      callPlate.position.set(-roomW * 0.1 + towerW / 2 + 0.25, 1.1, -roomD * 0.1 + towerD / 2);
      elevGroup.add(callPlate);

      const callBtn = new THREE.Mesh(
        new THREE.SphereGeometry(0.025, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      callBtn.position.set(-roomW * 0.1 + towerW / 2 + 0.25, 1.1, -roomD * 0.1 + towerD / 2 + 0.03);
      elevGroup.add(callBtn);

      const panelMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.5,
        metalness: 0.3
      });

      const numPanels = 2;
      for (let p = 0; p < numPanels; p++) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.4, 0.35), panelMat);
        const px = roomW * 0.32;
        const pz = -roomD * 0.25 + p * 0.75;
        panel.position.set(px, 1.0, pz);
        elevGroup.add(panel);

        const ledMatA = new THREE.MeshBasicMaterial({ color: 0x10b981 });
        const ledMatB = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const ledA = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), ledMatA);
        ledA.position.set(px - 0.29, 1.5, pz - 0.08);
        const ledB = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), ledMatB);
        ledB.position.set(px - 0.29, 1.5, pz + 0.08);
        elevGroup.add(ledA, ledB);
      }

      group.add(elevGroup);

      anims.push({
        update: (time) => {
          const pulse = Math.sin(time * 0.003) * 0.2 + 0.8;
          arrowLed.scale.set(pulse, pulse, 1);
        }
      });
      break;
    }

    default:
      break;
  }

  return { group, anims };
}

function createGridTexture(lineColorHex: number, bgHex: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = `#${bgHex.toString(16).padStart(6, '0')}`;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = `#${lineColorHex.toString(16).padStart(6, '0')}`;
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 240, 240);
  ctx.beginPath();
  ctx.moveTo(128, 8);
  ctx.lineTo(128, 248);
  ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

interface LiveScreenTextureBundle {
  texture: THREE.CanvasTexture;
  update: (time: number) => void;
}

// Module-level singletons for computer lab screens (shared across all rooms)
let sharedScreenSim1: LiveScreenTextureBundle | null = null;
let sharedScreenSim2: LiveScreenTextureBundle | null = null;
let sharedScreenAnimRegistered = false;

function createLiveComputerScreenTexture(seed: number = 0): LiveScreenTextureBundle {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  // Pre-render static editor background, window chrome, and syntax code ONCE
  const staticCanvas = document.createElement('canvas');
  staticCanvas.width = 512;
  staticCanvas.height = 320;
  const sCtx = staticCanvas.getContext('2d');
  if (sCtx) {
    // Real student project files shown in the lab explorer (per exhibit brief)
    const projectFiles = [
      'sangam.py',
      'mukund.py',
      'mayank.py',
      'shaurya.py',
      'neha.py',
      'annaya.py'
    ];
    const filename = projectFiles[seed % projectFiles.length];

    // 1. Dark IDE Desktop Background (Deep Obsidian)
    sCtx.fillStyle = '#121215';
    sCtx.fillRect(0, 0, 512, 320);

    // 2. Top Window Titlebar
    sCtx.fillStyle = '#1E1E24';
    sCtx.fillRect(0, 0, 512, 28);
    sCtx.fillStyle = '#2E2E36';
    sCtx.fillRect(0, 27, 512, 1);

    // macOS window dots (Vivid Apple traffic lights)
    const dots = ['#ef4444', '#f59e0b', '#10b981'];
    dots.forEach((color, i) => {
      sCtx.fillStyle = color;
      sCtx.beginPath();
      sCtx.arc(14 + i * 14, 14, 4.5, 0, Math.PI * 2);
      sCtx.fill();
    });

    // Window Title in Apple sans
    sCtx.fillStyle = '#94a3b8';
    sCtx.font = '600 12px "Plus Jakarta Sans", "Inter", -apple-system, sans-serif';
    sCtx.textAlign = 'center';
    sCtx.fillText(`${filename} — CS Projects`, 300, 18);

    // 3. Left File Explorer Sidebar listing every student project file
    sCtx.fillStyle = '#0f172a';
    sCtx.fillRect(0, 28, 128, 268);
    sCtx.fillStyle = '#1e293b';
    sCtx.fillRect(127, 28, 1, 268);

    sCtx.textAlign = 'left';
    sCtx.fillStyle = '#64748b';
    sCtx.font = '700 9px "Plus Jakarta Sans", "Inter", -apple-system, sans-serif';
    sCtx.fillText('EXPLORER — CS PROJECTS', 10, 46);

    projectFiles.forEach((file, i) => {
      const isActive = file === filename;
      const rowY = 58 + i * 24;
      if (isActive) {
        sCtx.fillStyle = 'rgba(56, 189, 248, 0.18)';
        sCtx.beginPath();
        sCtx.roundRect(5, rowY - 13, 117, 20, 5);
        sCtx.fill();
      }
      // Python file icon dot + name
      sCtx.fillStyle = isActive ? '#38bdf8' : '#475569';
      sCtx.beginPath();
      sCtx.arc(15, rowY - 3, 3, 0, Math.PI * 2);
      sCtx.fill();
      sCtx.fillStyle = isActive ? '#e2e8f0' : '#94a3b8';
      sCtx.font = `${isActive ? '700' : '500'} 11px ui-monospace, Menlo, Monaco, Consolas, monospace`;
      sCtx.fillText(file, 24, rowY);
    });

    // 4. Code Editor Line Numbers & Syntax Highlighting
    const lineNumbers = ['1', '2', '3', '4', '5', '6', '7', '8'];
    sCtx.fillStyle = '#475569';
    sCtx.font = '500 11px ui-monospace, Menlo, Monaco, Consolas, monospace';
    sCtx.textAlign = 'right';
    lineNumbers.forEach((num, i) => {
      sCtx.fillText(num, 146, 52 + i * 22);
    });

    // Vertical line separator
    sCtx.fillStyle = '#1e293b';
    sCtx.fillRect(152, 28, 1, 268);

    // Syntax Highlighted Code Lines (Vivid Cyber / Electric IDE Colors)
    sCtx.textAlign = 'left';
    sCtx.font = '600 11px ui-monospace, Menlo, Monaco, Consolas, monospace';

    sCtx.fillStyle = '#64748b'; // comment
    sCtx.fillText(`# ${filename}`, 162, 52);

    sCtx.fillStyle = '#c084fc'; // keyword: purple
    sCtx.fillText('import', 162, 74);
    sCtx.fillStyle = '#38bdf8'; // identifier: cyan
    sCtx.fillText('student', 204, 74);

    sCtx.fillStyle = '#c084fc';
    sCtx.fillText('def', 162, 96);
    sCtx.fillStyle = '#fbbf24'; // function: amber
    sCtx.fillText('main', 186, 96);
    sCtx.fillStyle = '#e2e8f0';
    sCtx.fillText('():', 212, 96);

    sCtx.fillStyle = '#e2e8f0';
    sCtx.fillText('proj = ', 162, 118);
    sCtx.fillStyle = '#38bdf8';
    sCtx.fillText('student.load()', 200, 118);

    sCtx.fillStyle = '#e2e8f0';
    sCtx.fillText('proj.run(', 162, 140);
    sCtx.fillStyle = '#4ade80'; // number/arg: emerald
    sCtx.fillText('live=True', 212, 140);
    sCtx.fillStyle = '#e2e8f0';
    sCtx.fillText(')', 262, 140);

    sCtx.fillStyle = '#e2e8f0';
    sCtx.fillText('print(', 162, 162);
    sCtx.fillStyle = '#fbbf24';
    sCtx.fillText('"Luminiscence!"', 192, 162);
    sCtx.fillStyle = '#e2e8f0';
    sCtx.fillText(')', 282, 162);

    sCtx.fillStyle = '#10b981';
    sCtx.fillText(`>>> run ${filename}`, 162, 190);
    sCtx.fillStyle = '#4ade80';
    sCtx.fillText('[OK] executed', 162, 212);

    // 5. Telemetry & Waveform HUD Panel Frame
    const hudX = 330;
    const hudY = 38;
    const hudW = 170;
    const hudH = 155;

    sCtx.fillStyle = '#090d16';
    sCtx.fillRect(hudX, hudY, hudW, hudH);
    sCtx.strokeStyle = '#1e3a8a';
    sCtx.lineWidth = 1.5;
    sCtx.strokeRect(hudX, hudY, hudW, hudH);

    sCtx.fillStyle = '#38bdf8';
    sCtx.font = '700 10px "Plus Jakarta Sans", "Inter", -apple-system, sans-serif';
    sCtx.fillText('LIVE PROJECT TELEMETRY', hudX + 8, hudY + 16);

    sCtx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    sCtx.lineWidth = 1;
    for (let gy = 26; gy < hudH; gy += 24) {
      sCtx.beginPath();
      sCtx.moveTo(hudX + 8, hudY + gy);
      sCtx.lineTo(hudX + hudW - 8, hudY + gy);
      sCtx.stroke();
    }

    // 6. Bottom Status Bar
    sCtx.fillStyle = '#18181B';
    sCtx.fillRect(0, 296, 512, 24);
    sCtx.fillStyle = '#A1A1AA';
    sCtx.font = '500 10px "Plus Jakarta Sans", "Inter", -apple-system, sans-serif';
    sCtx.fillText('● UTF-8   Python 3.12   CS Department · Scientifica 2026', 12, 312);
  }

  let lastDrawTime = 0;

  const update = (time: number) => {
    // Throttle canvas draw & GPU texture upload to ~12 FPS (85ms) for 120+ FPS main loop
    if (time - lastDrawTime < 85) return;
    lastDrawTime = time;

    if (!ctx) return;

    // Fast blit pre-rendered static background (sub-millisecond copy)
    ctx.drawImage(staticCanvas, 0, 0);

    const t = time * 0.001;

    // Blinking electric cursor prompt (after the [OK] executed line)
    const showBlink = Math.floor(time / 450) % 2 === 0;
    if (showBlink) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(256, 204, 8, 12);
    }

    // Dynamic Live Waveform (Right side HUD in electric cyan)
    const hudX = 330;
    const hudY = 38;
    const hudW = 170;
    ctx.beginPath();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.2;
    for (let x = 0; x < hudW - 16; x += 4) {
      const freq1 = Math.sin(t * 3.5 + x * 0.08) * 18;
      const freq2 = Math.cos(t * 2.2 + x * 0.15) * 8;
      const py = hudY + 70 + freq1 + freq2;
      if (x === 0) {
        ctx.moveTo(hudX + 8 + x, py);
      } else {
        ctx.lineTo(hudX + 8 + x, py);
      }
    }
    ctx.stroke();

    // Telemetry metric pills
    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 11px ui-monospace, monospace';
    const metricVal = (84.5 + Math.sin(t * 1.5) * 4.2).toFixed(1);
    ctx.fillText(`FLUX: ${metricVal}%`, hudX + 8, hudY + 124);

    ctx.fillStyle = '#4ade80';
    ctx.fillText(`LATENCY: 1.2ms`, hudX + 8, hudY + 142);

    // SMOOTH LIVING MOUSE CURSOR WITH CLICK RIPPLES (roams the editor column)
    const curX = 240 + Math.sin(t * 1.1 + seed) * 70 + Math.cos(t * 2.3) * 20;
    const curY = 150 + Math.cos(t * 0.9 + seed) * 70 + Math.sin(t * 1.7) * 25;

    const clickPhase = (t * 0.4 + seed * 0.3) % 1.0;
    if (clickPhase < 0.25) {
      const pingR = (clickPhase / 0.25) * 22;
      const pingAlpha = 1.0 - clickPhase / 0.25;
      ctx.save();
      ctx.beginPath();
      ctx.arc(curX, curY, pingR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${pingAlpha})`;
      ctx.lineWidth = 2.0;
      ctx.stroke();
      ctx.restore();
    }

    // Render White OS Pointer Arrow Cursor
    ctx.save();
    ctx.translate(curX, curY);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 18);
    ctx.lineTo(4.5, 14);
    ctx.lineTo(8.5, 22);
    ctx.lineTo(12, 20.5);
    ctx.lineTo(8, 12.5);
    ctx.lineTo(14, 12.5);
    ctx.closePath();

    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#0F172A';
    ctx.stroke();
    ctx.restore();

    texture.needsUpdate = true;
  };

  return { texture, update };
}
