import * as THREE from 'three';

export interface AutoRickshaw3DRig {
  root: THREE.Group;
  chassisGroup: THREE.Group;
  canopyGroup: THREE.Group;
  frontForkGroup: THREE.Group;
  frontWheel: THREE.Group;
  rearLeftWheel: THREE.Group;
  rearRightWheel: THREE.Group;
  nitroFlameGroup: THREE.Group;
  shieldSphere: THREE.Mesh;
  magnetHalo: THREE.Mesh;
  brakeLightLeft: THREE.MeshStandardMaterial;
  brakeLightRight: THREE.MeshStandardMaterial;
}

function createHornOkPleaseTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FACC15';
  ctx.fillRect(0, 0, 256, 128);

  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 10;
  ctx.strokeRect(6, 6, 244, 116);

  ctx.fillStyle = '#1C1008';
  ctx.font = '900 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HORN OK', 128, 42);

  ctx.fillStyle = '#DC2626';
  ctx.font = '900 34px sans-serif';
  ctx.fillText('PLEASE', 128, 88);

  ctx.fillStyle = '#16A34A';
  ctx.beginPath();
  ctx.arc(30, 64, 11, 0, Math.PI * 2);
  ctx.arc(226, 64, 11, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWheelMesh(): THREE.Group {
  const wheelGroup = new THREE.Group();

  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.85,
    metalness: 0.1,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.3,
    metalness: 0.6,
  });
  const hubMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.4,
    metalness: 0.3,
  });

  const tireGeo = new THREE.CylinderGeometry(5.2, 5.2, 3.6, 18);
  tireGeo.rotateX(Math.PI / 2);
  const tire = new THREE.Mesh(tireGeo, tireMat);
  wheelGroup.add(tire);

  const rimGeo = new THREE.CylinderGeometry(3.1, 3.1, 3.8, 14);
  rimGeo.rotateX(Math.PI / 2);
  const rim = new THREE.Mesh(rimGeo, rimMat);
  wheelGroup.add(rim);

  const hubGeo = new THREE.CylinderGeometry(1.2, 1.2, 4.1, 10);
  hubGeo.rotateX(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, hubMat);
  wheelGroup.add(hub);

  const spokeGeo = new THREE.BoxGeometry(5.0, 0.8, 3.95);
  const spoke = new THREE.Mesh(spokeGeo, hubMat);
  wheelGroup.add(spoke);

  return wheelGroup;
}

/**
 * Builds a composite 12+ part 3D Indian Auto-Rickshaw model (`THREE.Group`)
 * oriented with +X as Forward, +Y as Up, and +Z as Right, pivoted at ground level (y = 0).
 */
export function createAutoRickshaw3DGroup(): AutoRickshaw3DRig {
  const root = new THREE.Group();

  // Contact shadow disc on ground
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sctx = shadowCanvas.getContext('2d')!;
  const grad = sctx.createRadialGradient(64, 64, 12, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.28)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 128, 128);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 34),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(-1, 0.25, 0);
  root.add(shadowPlane);

  const greenBodyMat = new THREE.MeshStandardMaterial({
    color: 0x16a34a,
    roughness: 0.28,
    metalness: 0.18,
  });
  const yellowCanopyMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.45,
    metalness: 0.08,
  });
  const redAccentMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.38,
    metalness: 0.15,
  });
  const darkFrameMat = new THREE.MeshStandardMaterial({
    color: 0x1c1008,
    roughness: 0.7,
    metalness: 0.2,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf4f4f5,
    roughness: 0.18,
    metalness: 0.85,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.12,
    metalness: 0.25,
    transparent: true,
    opacity: 0.82,
  });
  const seatLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.65,
    metalness: 0.05,
  });

  // 1. Main Sprung Chassis Group
  const chassisGroup = new THREE.Group();
  root.add(chassisGroup);

  const floorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(30, 2.2, 20),
    darkFrameMat
  );
  floorMesh.position.set(-1, 4.6, 0);
  chassisGroup.add(floorMesh);

  // Rear Green Lower Tub
  const rearTubMesh = new THREE.Mesh(
    new THREE.BoxGeometry(19, 9.8, 22),
    greenBodyMat
  );
  rearTubMesh.position.set(-7.5, 9.9, 0);
  chassisGroup.add(rearTubMesh);

  // Yellow Side Trim Molding (sides only so rear HORN OK PLEASE plaque is 100% unobstructed)
  const sideTrimGeo = new THREE.BoxGeometry(18.5, 1.8, 22.8);
  const trimBandMesh = new THREE.Mesh(sideTrimGeo, yellowCanopyMat);
  trimBandMesh.position.set(-6.8, 12.6, 0);
  chassisGroup.add(trimBandMesh);

  // Rear Wheel Arch Fenders (Left & Right)
  const fenderGeo = new THREE.CylinderGeometry(
    6.4,
    6.4,
    4.4,
    16,
    1,
    false,
    0,
    Math.PI
  );
  fenderGeo.rotateX(Math.PI / 2);
  const leftFender = new THREE.Mesh(fenderGeo, yellowCanopyMat);
  leftFender.position.set(-10.5, 5.2, -10.8);
  chassisGroup.add(leftFender);

  const rightFender = new THREE.Mesh(fenderGeo, yellowCanopyMat);
  rightFender.position.set(-10.5, 5.2, 10.8);
  chassisGroup.add(rightFender);

  // Front Curved Green Nose Cowl
  const frontCowlGeo = new THREE.CylinderGeometry(4.8, 9.5, 12, 16);
  frontCowlGeo.rotateZ(Math.PI / 2);
  const frontCowl = new THREE.Mesh(frontCowlGeo, greenBodyMat);
  frontCowl.position.set(11.5, 9.6, 0);
  chassisGroup.add(frontCowl);

  // Front Vertical Leg Shield Apron
  const apronMesh = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 10.5, 18.8),
    greenBodyMat
  );
  apronMesh.position.set(8.8, 10.2, 0);
  chassisGroup.add(apronMesh);

  // Interior Passenger Bench Seat & Driver Figure
  const passengerSeat = new THREE.Mesh(
    new THREE.BoxGeometry(8, 5, 17.5),
    seatLeatherMat
  );
  passengerSeat.position.set(-7.5, 8.2, 0);
  chassisGroup.add(passengerSeat);

  const seatBack = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 7.5, 17.5),
    seatLeatherMat
  );
  seatBack.position.set(-12.2, 13.5, 0);
  chassisGroup.add(seatBack);

  const driverTorso = new THREE.Mesh(
    new THREE.CylinderGeometry(2.8, 3.3, 7.5, 12),
    new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.55 })
  );
  driverTorso.position.set(3.2, 12.2, 0);
  chassisGroup.add(driverTorso);

  const driverHead = new THREE.Mesh(
    new THREE.SphereGeometry(2.8, 14, 14),
    new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 })
  );
  driverHead.position.set(3.2, 17.8, 0);
  chassisGroup.add(driverHead);

  // Rear "HORN OK PLEASE" Plaque on Back Panel (unobstructed!)
  const hornPlaqueMat = new THREE.MeshBasicMaterial({
    map: createHornOkPleaseTexture(),
  });
  const hornPlaque = new THREE.Mesh(
    new THREE.PlaneGeometry(13.2, 6.6),
    hornPlaqueMat
  );
  hornPlaque.rotation.y = -Math.PI / 2;
  hornPlaque.position.set(-17.2, 10.4, 0);
  chassisGroup.add(hornPlaque);

  // Side Decorative Plaques so side view is equally ornate
  const sidePlaqueLeft = new THREE.Mesh(
    new THREE.PlaneGeometry(11.5, 5.2),
    hornPlaqueMat
  );
  sidePlaqueLeft.rotation.y = Math.PI;
  sidePlaqueLeft.position.set(-6.5, 9.8, -11.15);
  chassisGroup.add(sidePlaqueLeft);

  const sidePlaqueRight = new THREE.Mesh(
    new THREE.PlaneGeometry(11.5, 5.2),
    hornPlaqueMat
  );
  sidePlaqueRight.position.set(-6.5, 9.8, 11.15);
  chassisGroup.add(sidePlaqueRight);

  // Chrome Rear Bumper Tube
  const rearBumper = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.05, 23.2, 12),
    chromeMat
  );
  rearBumper.rotation.x = Math.PI / 2;
  rearBumper.position.set(-17.6, 5.8, 0);
  chassisGroup.add(rearBumper);

  // Dual Glowing Ruby Brake / Tail Lights on Back
  const brakeLightLeft = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.75,
    roughness: 0.2,
  });
  const brakeLightRight = brakeLightLeft.clone();

  const tailGeo = new THREE.BoxGeometry(1.4, 2.6, 3.8);
  const tailL = new THREE.Mesh(tailGeo, brakeLightLeft);
  tailL.position.set(-17.2, 7.6, -8.2);
  chassisGroup.add(tailL);

  const tailR = new THREE.Mesh(tailGeo, brakeLightRight);
  tailR.position.set(-17.2, 7.6, 8.2);
  chassisGroup.add(tailR);

  // Chrome Exhaust Pipe on Rear Left
  const exhaustPipe = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.3, 5.5, 12),
    chromeMat
  );
  exhaustPipe.rotation.z = Math.PI / 2;
  exhaustPipe.position.set(-18.2, 4.6, -6.5);
  chassisGroup.add(exhaustPipe);

  // Front Headlight Housing & Glowing Lamp
  const headlightRim = new THREE.Mesh(
    new THREE.CylinderGeometry(2.8, 2.8, 2.4, 16),
    chromeMat
  );
  headlightRim.rotation.z = Math.PI / 2;
  headlightRim.position.set(17.5, 10.2, 0);
  chassisGroup.add(headlightRim);

  const headlightBulb = new THREE.Mesh(
    new THREE.SphereGeometry(2.3, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  headlightBulb.position.set(18.3, 10.2, 0);
  chassisGroup.add(headlightBulb);

  // 2. Canopy & Windshield Upper Assembly
  const canopyGroup = new THREE.Group();
  chassisGroup.add(canopyGroup);

  const pillarGeo = new THREE.CylinderGeometry(0.75, 0.75, 13.5, 8);
  const pillarPositions: [number, number, number][] = [
    [8.2, 19.2, -8.6],
    [8.2, 19.2, 8.6],
    [-14.5, 19.2, -9.6],
    [-14.5, 19.2, 9.6],
  ];
  for (const [px, py, pz] of pillarPositions) {
    const post = new THREE.Mesh(pillarGeo, darkFrameMat);
    post.position.set(px, py, pz);
    canopyGroup.add(post);
  }

  // Slanted Front Cyan Windshield Pane
  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 11.5, 17.8),
    glassMat
  );
  windshield.position.set(9.6, 19.2, 0);
  windshield.rotation.z = 0.22;
  canopyGroup.add(windshield);

  // Left & Right Chrome Wing Mirrors
  const mirrorGeo = new THREE.CylinderGeometry(2.0, 2.0, 0.7, 14);
  mirrorGeo.rotateZ(Math.PI / 2);
  const mirrorL = new THREE.Mesh(mirrorGeo, chromeMat);
  mirrorL.position.set(9.5, 18.5, -11.4);
  canopyGroup.add(mirrorL);

  const mirrorR = new THREE.Mesh(mirrorGeo, chromeMat);
  mirrorR.position.set(9.5, 18.5, 11.4);
  canopyGroup.add(mirrorR);

  // Domed Golden-Yellow Tuk-Tuk Roof Canopy
  const roofMain = new THREE.Mesh(
    new THREE.BoxGeometry(27.5, 3.4, 21.0),
    yellowCanopyMat
  );
  roofMain.position.set(-2.5, 26.2, 0);
  canopyGroup.add(roofMain);

  // 360-degree Red Festive Roof Band (visible from Rear, Sides, and Front!)
  const roofRedBand = new THREE.Mesh(
    new THREE.BoxGeometry(28.0, 2.1, 21.4),
    redAccentMat
  );
  roofRedBand.position.set(-2.5, 24.4, 0);
  canopyGroup.add(roofRedBand);

  const roofCrown = new THREE.Mesh(
    new THREE.BoxGeometry(24.5, 2.2, 17.6),
    yellowCanopyMat
  );
  roofCrown.position.set(-2.5, 28.2, 0);
  canopyGroup.add(roofCrown);

  // Rear Yellow Fabric Back Curtain with Viewing Window
  const rearCurtain = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 10.6, 20.4),
    yellowCanopyMat
  );
  rearCurtain.position.set(-15.8, 19.2, 0);
  canopyGroup.add(rearCurtain);

  const rearWindow = new THREE.Mesh(
    new THREE.BoxGeometry(2.0, 5.4, 12.8),
    glassMat
  );
  rearWindow.position.set(-15.9, 20.2, 0);
  canopyGroup.add(rearWindow);

  // Roof Luggage Carrier Rack + Red Chai Crate Prop on Top
  const rackRailGeo = new THREE.BoxGeometry(16, 0.9, 0.9);
  const rackL = new THREE.Mesh(rackRailGeo, chromeMat);
  rackL.position.set(-3, 29.7, -6.5);
  canopyGroup.add(rackL);
  const rackR = new THREE.Mesh(rackRailGeo, chromeMat);
  rackR.position.set(-3, 29.7, 6.5);
  canopyGroup.add(rackR);

  const chaiCrate = new THREE.Mesh(
    new THREE.BoxGeometry(9.2, 4.6, 10.2),
    redAccentMat
  );
  chaiCrate.position.set(-4, 31.5, 0);
  canopyGroup.add(chaiCrate);

  // 3. Steerable Front Fork & 3 Rotating Wheels
  const frontForkGroup = new THREE.Group();
  frontForkGroup.position.set(14.8, 5.0, 0);
  root.add(frontForkGroup);

  const frontMudguard = new THREE.Mesh(
    new THREE.CylinderGeometry(5.8, 5.8, 4.0, 14, 1, false, 0, Math.PI),
    yellowCanopyMat
  );
  frontMudguard.rotation.x = Math.PI / 2;
  frontMudguard.position.set(0, 0.6, 0);
  frontForkGroup.add(frontMudguard);

  const frontWheel = createWheelMesh();
  frontForkGroup.add(frontWheel);

  const rearLeftWheel = createWheelMesh();
  rearLeftWheel.position.set(-10.5, 5.0, -11.2);
  root.add(rearLeftWheel);

  const rearRightWheel = createWheelMesh();
  rearRightWheel.position.set(-10.5, 5.0, 11.2);
  root.add(rearRightWheel);

  // 4. Chai Nitro Dual Exhaust Plumes
  const nitroFlameGroup = new THREE.Group();
  nitroFlameGroup.position.set(-19.2, 4.6, 0);
  nitroFlameGroup.visible = false;
  chassisGroup.add(nitroFlameGroup);

  const outerFlameGeo = new THREE.ConeGeometry(2.0, 8.5, 12);
  outerFlameGeo.rotateZ(Math.PI / 2);
  const outerFlameMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.9,
  });

  const innerFlameGeo = new THREE.ConeGeometry(1.2, 5.5, 10);
  innerFlameGeo.rotateZ(Math.PI / 2);
  const innerFlameMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
  });

  for (const sideZ of [-5.8, 5.8]) {
    const outerFlame = new THREE.Mesh(outerFlameGeo, outerFlameMat);
    outerFlame.position.set(-3.5, 0, sideZ);
    const innerFlame = new THREE.Mesh(innerFlameGeo, innerFlameMat);
    innerFlame.position.set(-2.2, 0, sideZ);
    nitroFlameGroup.add(outerFlame, innerFlame);
  }

  // 5. Nimbu Shield Bubble & Coin Magnet Halo
  const shieldSphere = new THREE.Mesh(
    new THREE.IcosahedronGeometry(23, 2),
    new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    })
  );
  shieldSphere.position.set(-1, 14, 0);
  shieldSphere.visible = false;
  root.add(shieldSphere);

  const magnetHalo = new THREE.Mesh(
    new THREE.TorusGeometry(15, 1.2, 10, 32),
    new THREE.MeshBasicMaterial({
      color: 0xec4899,
    })
  );
  magnetHalo.rotation.x = Math.PI / 2;
  magnetHalo.position.set(-2, 33, 0);
  magnetHalo.visible = false;
  root.add(magnetHalo);

  return {
    root,
    chassisGroup,
    canopyGroup,
    frontForkGroup,
    frontWheel,
    rearLeftWheel,
    rearRightWheel,
    nitroFlameGroup,
    shieldSphere,
    magnetHalo,
    brakeLightLeft,
    brakeLightRight,
  };
}
