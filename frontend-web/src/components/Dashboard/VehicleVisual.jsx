import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { T, componentFor, overallUrgency, temperatureUrgency, urgencyStyle } from "./dashboardUtils";
import BrandLogo from "./BrandLogo";
import { resolveVehicleProfile } from "../../data/vehicleCatalog";

const MARKER_ICONS = {
  engine: (
    <path d="M4 12h2l1.5-3h4L13 12h2.5l2 2.5V18h-2v2h-2v-2H9v2H7v-2H5a1 1 0 0 1-1-1v-5Zm11-3V7h3v2" />
  ),
  brakes: (
    <>
      <circle cx="9" cy="13" r="4.5" />
      <path d="M9 8.5v9M4.5 13h9M6 10l6 6M12 10l-6 6" />
    </>
  ),
  battery: (
    <>
      <rect x="3" y="8" width="15" height="9" rx="2" />
      <path d="M18 11h2v3h-2M6 6v2M15 6v2" />
      <path d="m9 12 2-2v3h2l-2 2v-3Z" />
    </>
  ),
  climate: (
    <path d="M10 3v14M4 8l12 4M16 8l-12 4M10 6l2-2M10 6 8 4M10 14l2 2M10 14l-2 2" />
  ),
  camera: (
    <>
      <rect x="3" y="7" width="14" height="10" rx="2" />
      <circle cx="10" cy="12" r="2.5" />
      <path d="m15 11 2.5-1.5v5L15 13M17 4.5 15 7" />
    </>
  ),
  radar: (
    <>
      <path d="M10 15a5 5 0 1 0-5-5" />
      <path d="M10 12a2 2 0 1 0-2-2" />
      <path d="M10 10 4 4" />
    </>
  ),
};

function makeShadowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(256, 128, 18, 256, 128, 226);
  gradient.addColorStop(0, "rgba(15, 23, 42, 0.34)");
  gradient.addColorStop(0.4, "rgba(15, 23, 42, 0.16)");
  gradient.addColorStop(0.72, "rgba(15, 23, 42, 0.05)");
  gradient.addColorStop(1, "rgba(15, 23, 42, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createVehicleModel(profile) {
  const geometrySpec = profile.geometry;
  const paint = new THREE.Color(profile.paint || "#DDE3EA");
  const trimColor = 0x1e293b;
  const glassColor = 0x0c1729;
  const accent = new THREE.Color(profile.accent || "#2563EB");
  const vehicle = new THREE.Group();
  vehicle.name = profile.displayName;

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: paint,
    metalness: profile.bodyType === "f1" ? 0.45 : 0.62,
    roughness: profile.bodyType === "f1" ? 0.32 : 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.55,
  });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: trimColor, metalness: 0.5, roughness: 0.48, envMapIntensity: 0.7,
  });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: glassColor, metalness: 0.25, roughness: 0.055, transmission: 0.16,
    transparent: true, opacity: 0.94, clearcoat: 1, clearcoatRoughness: 0.05,
    envMapIntensity: 2,
  });
  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1, metalness: 1, roughness: 0.18, envMapIntensity: 1.6,
  });
  const tyreMaterial = new THREE.MeshStandardMaterial({
    color: 0x080f1e, metalness: 0.05, roughness: 0.86, envMapIntensity: 0.25,
  });
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xd8e0ea, metalness: 0.96, roughness: 0.16, envMapIntensity: 1.8,
  });
  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xdbeafe, emissive: 0x9ec9ff, emissiveIntensity: 3,
    metalness: 0.25, roughness: 0.12,
  });
  const taillightMaterial = new THREE.MeshStandardMaterial({
    color: 0x7f1d1d, emissive: accent.clone().lerp(new THREE.Color(0xff0000), 0.5),
    emissiveIntensity: 2.7, metalness: 0.2, roughness: 0.18,
  });

  const L = geometrySpec.length;
  const W = geometrySpec.width;
  const halfW = W / 2;
  const ride = geometrySpec.ride;
  const bottom = ride * 0.45;
  const bodyTop = geometrySpec.bodyTop;
  const roofTop = geometrySpec.roofTop;
  const front = L / 2;
  const rear = -L / 2;
  const hoodX = front - geometrySpec.frontSlope * L;
  const deckX = rear + geometrySpec.rearSlope * L;
  const noseY = bodyTop - geometrySpec.noseDrop;
  const tailY = bodyTop - (geometrySpec.rearStyle === "van" ? 0.04 : 0.1);
  const shellWidth = halfW - 0.04;

  // Body shell
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(rear + 0.06, bottom);
  bodyShape.lineTo(rear + 0.02, bodyTop * 0.55);
  bodyShape.quadraticCurveTo(rear + 0.03, tailY, deckX, bodyTop);
  bodyShape.lineTo(hoodX, bodyTop);
  bodyShape.quadraticCurveTo(front - 0.18, noseY, front - 0.04, bodyTop * 0.52);
  bodyShape.lineTo(front - 0.06, bottom);
  bodyShape.quadraticCurveTo(front - 0.35, bottom - 0.02, front - 0.55, ride * 0.25);
  bodyShape.lineTo(rear + 0.55, ride * 0.25);
  bodyShape.quadraticCurveTo(rear + 0.35, bottom - 0.02, rear + 0.06, bottom);
  bodyShape.closePath();

  const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, {
    depth: shellWidth * 2, bevelEnabled: true, bevelSegments: 6, steps: 1,
    bevelSize: Math.min(0.09, W * 0.045), bevelThickness: 0.06, curveSegments: 28,
  });
  bodyGeometry.translate(0, 0, -shellWidth);
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.castShadow = true;
  body.receiveShadow = true;
  vehicle.add(body);

  // Cabin / greenhouse
  const isOpen = geometrySpec.openTop;
  const cabinMat = isOpen ? bodyMaterial : glassMaterial;
  const cabinBottom = bodyTop - 0.02;
  const rf = geometrySpec.roofFront;
  const rr = geometrySpec.roofRear;
  const cHalf = halfW - 0.08;
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(rr, cabinBottom);
  cabinShape.lineTo(rr + (rf - rr) * 0.18, roofTop);
  cabinShape.quadraticCurveTo((rf + rr) * 0.5, roofTop + 0.02, rf - (rf - rr) * 0.12, roofTop - (isOpen ? 0.18 : 0.02));
  cabinShape.lineTo(rf, cabinBottom);
  cabinShape.closePath();

  const cabinGeometry = new THREE.ExtrudeGeometry(cabinShape, {
    depth: cHalf * 2, bevelEnabled: !isOpen, bevelSegments: 5, steps: 1,
    bevelSize: 0.03, bevelThickness: 0.03, curveSegments: 28,
  });
  cabinGeometry.translate(0, 0, -cHalf);
  const cabin = new THREE.Mesh(cabinGeometry, cabinMat);
  cabin.castShadow = true;
  vehicle.add(cabin);

  if (!isOpen) {
    const roofSpan = Math.max(0.4, rf - rr - 0.12);
    const roofWidth = Math.max(0.6, (cHalf - 0.02) * 2);
    const roof = new THREE.Mesh(new RoundedBoxGeometry(roofSpan, 0.04, roofWidth, 4, 0.02), glassMaterial);
    roof.position.set((rf + rr) / 2, roofTop + 0.005, 0);
    roof.castShadow = true;
    vehicle.add(roof);

    [-cHalf + 0.05, cHalf - 0.05].forEach((z) => {
      const rail = new THREE.Mesh(new RoundedBoxGeometry(roofSpan + 0.08, 0.03, 0.045, 3, 0.015), bodyMaterial);
      rail.position.set((rf + rr) / 2, roofTop + 0.008, z);
      vehicle.add(rail);
    });
  } else {
    // convertible tonneau
    const tonneau = new THREE.Mesh(new RoundedBoxGeometry(Math.max(0.3, rr - rear - 0.5), 0.05, cHalf * 1.6, 3, 0.02), trimMaterial);
    tonneau.position.set(rear + (rr - rear) * 0.55, bodyTop + 0.02, 0);
    vehicle.add(tonneau);
    // windshield frame
    const frame = new THREE.Mesh(new RoundedBoxGeometry(0.05, roofTop - bodyTop + 0.05, cHalf * 1.7, 3, 0.02), trimMaterial);
    frame.position.set(rf - 0.02, (roofTop + bodyTop) / 2, 0);
    frame.rotation.z = -0.35;
    vehicle.add(frame);
  }

  // Side details (beltline, handles, mirrors, sills)
  [-cHalf - 0.02, cHalf + 0.02].forEach((z) => {
    const side = z < 0 ? -1 : 1;
    const beltline = new THREE.Mesh(new RoundedBoxGeometry(L * 0.52, 0.022, 0.016, 2, 0.008), chromeMaterial);
    beltline.position.set(0, bodyTop - 0.02, z);
    vehicle.add(beltline);

    const rocker = new THREE.Mesh(new RoundedBoxGeometry(L * 0.62, 0.07, 0.04, 3, 0.02), trimMaterial);
    rocker.position.set(0, ride * 1.15, side * (halfW + 0.01));
    vehicle.add(rocker);

    if (!isOpen) {
      const pillar = new THREE.Mesh(new RoundedBoxGeometry(0.05, roofTop - bodyTop - 0.05, 0.028, 3, 0.01), bodyMaterial);
      pillar.position.set(rf * 0.55, (roofTop + bodyTop) / 2, z);
      pillar.rotation.z = -0.12;
      vehicle.add(pillar);
    }

    if (profile.bodyType !== "f1") {
      const frontHandle = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.03, 0.02, 2, 0.01), chromeMaterial);
      frontHandle.position.set(L * 0.08, bodyTop * 0.78, z);
      vehicle.add(frontHandle);
      const rearHandle = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.03, 0.02, 2, 0.01), chromeMaterial);
      rearHandle.position.set(-L * 0.18, bodyTop * 0.78, z);
      vehicle.add(rearHandle);
    }

    const mirrorArm = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.035, 0.04, 2, 0.012), trimMaterial);
    mirrorArm.position.set(rf - 0.05, bodyTop + 0.12, side * (halfW + 0.02));
    vehicle.add(mirrorArm);
    const mirror = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.085, 0.12, 4, 0.035), bodyMaterial);
    mirror.position.set(rf - 0.03, bodyTop + 0.14, side * (halfW + 0.1));
    mirror.castShadow = true;
    vehicle.add(mirror);
  });

  // Front fascia
  const noseX = front - 0.03;
  const grilleY = ride * 0.9;
  if (profile.grille !== "none") {
    const grilleW = profile.grille === "twin" ? W * 0.18 : (profile.grille === "wide" ? W * 0.42 : W * 0.28);
    const grilleH = profile.grille === "wide" ? 0.14 : 0.16;
    if (profile.grille === "twin") {
      [-grilleW * 0.6, grilleW * 0.6].forEach((z) => {
        const kidney = new THREE.Mesh(new RoundedBoxGeometry(0.04, grilleH, grilleW * 0.95, 3, 0.04), trimMaterial);
        kidney.position.set(noseX, grilleY, z);
        vehicle.add(kidney);
      });
    } else {
      const grille = new THREE.Mesh(new RoundedBoxGeometry(0.04, grilleH, grilleW, 3, 0.04), trimMaterial);
      grille.position.set(noseX, grilleY, 0);
      vehicle.add(grille);
    }
  } else {
    // EV smooth nose / accent bar
    const noseBar = new THREE.Mesh(new RoundedBoxGeometry(0.03, 0.05, W * 0.5, 3, 0.02), chromeMaterial);
    noseBar.position.set(noseX, grilleY + 0.08, 0);
    vehicle.add(noseBar);
  }

  // Brand accent strip on hood edge
  const accentStrip = new THREE.Mesh(new RoundedBoxGeometry(0.02, 0.018, W * 0.22, 2, 0.008), new THREE.MeshStandardMaterial({
    color: accent, metalness: 0.5, roughness: 0.3, emissive: accent, emissiveIntensity: 0.15,
  }));
  accentStrip.position.set(noseX - 0.01, bodyTop - 0.03, 0);
  vehicle.add(accentStrip);

  // Headlights
  const lightBar = new THREE.Mesh(new RoundedBoxGeometry(0.035, 0.03, W * 0.62, 3, 0.014), headlightMaterial);
  lightBar.position.set(noseX, bodyTop * 0.86, 0);
  vehicle.add(lightBar);
  [-W * 0.27, W * 0.27].forEach((z) => {
    const headlight = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.1, W * 0.18, 4, 0.03), headlightMaterial);
    headlight.position.set(noseX, bodyTop * 0.78, z);
    vehicle.add(headlight);
  });

  // Rear fascia
  const rearX = rear + 0.03;
  const rearBar = new THREE.Mesh(new RoundedBoxGeometry(0.035, 0.06, W * 0.72, 3, 0.02), taillightMaterial);
  rearBar.position.set(rearX, bodyTop * 0.78, 0);
  vehicle.add(rearBar);
  [-W * 0.3, W * 0.3].forEach((z) => {
    const tail = new THREE.Mesh(new RoundedBoxGeometry(0.04, 0.11, W * 0.12, 3, 0.03), taillightMaterial);
    tail.position.set(rearX, bodyTop * 0.76, z);
    vehicle.add(tail);
  });

  if (geometrySpec.rearStyle !== "bed") {
    const diffuser = new THREE.Mesh(new RoundedBoxGeometry(0.045, 0.14, W * 0.55, 3, 0.04), trimMaterial);
    diffuser.position.set(rearX, ride * 0.8, 0);
    vehicle.add(diffuser);
  } else {
    // Pickup bed
    const bedFloor = bodyTop * 0.62;
    const bed = new THREE.Mesh(new RoundedBoxGeometry(Math.abs(rr - rear) - 0.2, 0.06, W * 0.78, 3, 0.02), trimMaterial);
    bed.position.set((rr + rear) / 2, bedFloor, 0);
    vehicle.add(bed);
    [-W * 0.39, W * 0.39, 0].forEach((z, i) => {
      if (i === 2) return;
      const wall = new THREE.Mesh(new RoundedBoxGeometry(Math.abs(rr - rear) - 0.15, bodyTop - bedFloor, 0.04, 2, 0.015), bodyMaterial);
      wall.position.set((rr + rear) / 2, (bodyTop + bedFloor) / 2, z);
      vehicle.add(wall);
    });
    const tailgate = new THREE.Mesh(new RoundedBoxGeometry(0.04, bodyTop - bedFloor, W * 0.78, 2, 0.015), bodyMaterial);
    tailgate.position.set(rear + 0.08, (bodyTop + bedFloor) / 2, 0);
    vehicle.add(tailgate);
  }

  // Spoiler / aero
  if (geometrySpec.spoiler === "wing") {
    const wing = new THREE.Mesh(new RoundedBoxGeometry(0.35, 0.03, W * 0.78, 3, 0.012), trimMaterial);
    wing.position.set(rear + L * 0.16, roofTop + 0.02, 0);
    wing.castShadow = true;
    vehicle.add(wing);
    [-W * 0.22, W * 0.22].forEach((z) => {
      const upright = new THREE.Mesh(new RoundedBoxGeometry(0.04, 0.18, 0.03, 2, 0.01), trimMaterial);
      upright.position.set(rear + L * 0.16, bodyTop + 0.05, z);
      vehicle.add(upright);
    });
  } else if (geometrySpec.spoiler === "lip") {
    const lip = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.03, W * 0.7, 3, 0.012), trimMaterial);
    lip.position.set(rear + L * 0.12, bodyTop + 0.01, 0);
    lip.rotation.z = 0.08;
    lip.castShadow = true;
    vehicle.add(lip);
  } else if (geometrySpec.spoiler === "f1") {
    const rearWing = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.04, W * 0.7, 3, 0.015), bodyMaterial);
    rearWing.position.set(rear + 0.25, roofTop + 0.25, 0);
    vehicle.add(rearWing);
    const frontWing = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.03, W * 0.95, 3, 0.012), bodyMaterial);
    frontWing.position.set(front - 0.15, ride * 0.6, 0);
    vehicle.add(frontWing);
    const fin = new THREE.Mesh(new RoundedBoxGeometry(0.35, 0.28, 0.03, 2, 0.01), bodyMaterial);
    fin.position.set(rear + 0.35, bodyTop + 0.1, 0);
    vehicle.add(fin);
  } else if (profile.bodyType === "sport" || profile.bodyType === "coupe") {
    const lip = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.025, W * 0.62, 3, 0.01), trimMaterial);
    lip.position.set(rear + L * 0.1, bodyTop - 0.02, 0);
    lip.rotation.z = 0.06;
    vehicle.add(lip);
  }

  // Roof rack
  if (geometrySpec.roofRack && !isOpen) {
    [-0.18, 0.18].forEach((dx) => {
      const bar = new THREE.Mesh(new RoundedBoxGeometry(0.04, 0.04, W * 0.86, 2, 0.015), trimMaterial);
      bar.position.set((rf + rr) / 2 + dx * (rf - rr), roofTop + 0.07, 0);
      vehicle.add(bar);
    });
  }

  // Spare wheel (offroad / SUV rear)
  if (geometrySpec.spare) {
    const spare = new THREE.Mesh(new THREE.CylinderGeometry(geometrySpec.wheelRadius * 0.85, geometrySpec.wheelRadius * 0.85, 0.22, 28), tyreMaterial);
    spare.rotation.x = Math.PI / 2;
    spare.rotation.z = Math.PI / 2;
    spare.position.set(rear - 0.02, bodyTop * 0.72, 0);
    vehicle.add(spare);
    const cover = new THREE.Mesh(new THREE.CylinderGeometry(geometrySpec.wheelRadius * 0.55, geometrySpec.wheelRadius * 0.55, 0.23, 24), bodyMaterial);
    cover.rotation.x = Math.PI / 2;
    cover.rotation.z = Math.PI / 2;
    cover.position.set(rear - 0.03, bodyTop * 0.72, 0);
    vehicle.add(cover);
  }

  // Wheels
  const wheelZ = halfW - geometrySpec.tyreWidth * 0.2;
  const axleOffset = Math.max(L * 0.3, geometrySpec.wheelbase / 2);
  const spokes = profile.bodyType === "f1" ? 0 : (profile.bodyType === "offroad" ? 6 : 5);
  [-axleOffset, axleOffset].forEach((x) => {
    [-1, 1].forEach((side) => {
      const wheel = new THREE.Group();
      wheel.position.set(x, geometrySpec.wheelRadius, side * wheelZ);

      const tyre = new THREE.Mesh(new THREE.CylinderGeometry(geometrySpec.wheelRadius, geometrySpec.wheelRadius, geometrySpec.tyreWidth, 40), tyreMaterial);
      tyre.rotation.x = Math.PI / 2;
      tyre.castShadow = true;
      tyre.receiveShadow = true;
      wheel.add(tyre);

      const sidewall = new THREE.Mesh(new THREE.TorusGeometry(geometrySpec.wheelRadius * 0.8, geometrySpec.wheelRadius * 0.18, 12, 40), tyreMaterial);
      sidewall.position.z = side * (geometrySpec.tyreWidth * 0.52);
      wheel.add(sidewall);

      const rimBarrel = new THREE.Mesh(new THREE.CylinderGeometry(geometrySpec.wheelRadius * 0.64, geometrySpec.wheelRadius * 0.64, geometrySpec.tyreWidth * 1.05, 36), rimMaterial);
      rimBarrel.rotation.x = Math.PI / 2;
      rimBarrel.castShadow = true;
      wheel.add(rimBarrel);

      for (let index = 0; index < spokes; index += 1) {
        const angle = (index / spokes) * Math.PI * 2 + Math.PI / 10;
        const spoke = new THREE.Mesh(new RoundedBoxGeometry(geometrySpec.wheelRadius * 0.62, 0.034, 0.024, 2, 0.011), rimMaterial);
        spoke.position.set(Math.cos(angle) * geometrySpec.wheelRadius * 0.24, Math.sin(angle) * geometrySpec.wheelRadius * 0.24, side * (geometrySpec.tyreWidth * 0.58));
        spoke.rotation.z = angle;
        wheel.add(spoke);
      }

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(geometrySpec.wheelRadius * 0.14, geometrySpec.wheelRadius * 0.14, 0.022, 24), chromeMaterial);
      hub.rotation.x = Math.PI / 2;
      hub.position.z = side * (geometrySpec.tyreWidth * 0.62);
      wheel.add(hub);

      vehicle.add(wheel);

      const arch = new THREE.Mesh(new THREE.TorusGeometry(geometrySpec.wheelRadius * 1.08, 0.034, 9, 34, Math.PI), trimMaterial);
      arch.position.set(x, geometrySpec.wheelRadius, side * (wheelZ - geometrySpec.tyreWidth * 0.1));
      vehicle.add(arch);
    });
  });

  vehicle.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return vehicle;
}

function buildMarkers(report, vehicle, profile) {
  const g = profile.geometry;
  const engine = componentFor(report, "engine", "engine_oil", "motor");
  const brakes = componentFor(report, "brakes");
  const battery = componentFor(report, "battery");
  const climateUrgency = temperatureUrgency(vehicle) || overallUrgency(report);
  const general = overallUrgency(report);
  const radarUrgency = report ? "good" : general;
  const cameraUrgency = report ? "good" : general;
  const front = g.length / 2;
  const rear = -g.length / 2;
  const axle = Math.max(g.length * 0.3, g.wheelbase / 2);

  return [
    {
      key: profile.electric ? "motor" : "engine", label: profile.electric ? "Motor" : "Engine",
      urgency: engine?.urgency || general, score: engine?.health_score,
      anchor: new THREE.Vector3(profile.electric ? axle * 0.6 : front * 0.45, g.bodyTop * 0.85, 0),
    },
    {
      key: "radar", label: "Radar", urgency: radarUrgency, score: null,
      anchor: new THREE.Vector3(front - 0.02, g.bodyTop * 0.6, 0),
    },
    {
      key: "camera", label: "Camera", urgency: cameraUrgency, score: null,
      anchor: new THREE.Vector3(g.roofFront * 0.5, g.roofTop * 0.92, 0),
    },
    {
      key: "climate", label: "Climate", urgency: climateUrgency, score: null,
      anchor: new THREE.Vector3((g.roofFront + g.roofRear) * 0.5, g.roofTop + 0.02, 0),
    },
    {
      key: "battery", label: "Battery", urgency: battery?.urgency || general, score: battery?.health_score,
      anchor: new THREE.Vector3(profile.electric ? -axle * 0.1 : rear * 0.35, g.ride * 1.15, g.width * 0.48),
    },
    {
      key: "brakes", label: "Brakes", urgency: brakes?.urgency || general, score: brakes?.health_score,
      anchor: new THREE.Vector3(axle, g.wheelRadius, g.width * 0.52),
    },
  ];
}

function Marker({ marker, active, onHover, onSelect, markerRef }) {
  const style = urgencyStyle(marker.urgency || "good");
  return (
    <div
      ref={markerRef}
      data-vehicle-marker
      className="absolute left-0 top-0"
      style={{ willChange: "transform, opacity" }}
    >
      <button
        type="button"
        data-vehicle-marker
        onMouseEnter={() => onHover(marker.key)}
        onMouseLeave={() => onHover(null)}
        onClick={(event) => { event.stopPropagation(); onSelect(marker.key); }}
        className="group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 bg-white/95 transition-transform hover:scale-110"
        style={{ borderColor: style.color, boxShadow: `0 8px 18px ${style.color}33, 0 0 0 5px #FFFFFFAA` }}
        aria-label={`${marker.label} diagnostics`}
      >
        {marker.urgency === "critical" && (
          <span className="absolute -inset-2 animate-ping rounded-full border opacity-40"
            style={{ borderColor: style.color }} />
        )}
        <span className="absolute inset-0 rounded-full opacity-20" style={{ background: style.color }} />
        <span className="absolute -inset-2 rounded-full border opacity-40"
          style={{ borderColor: style.color, borderStyle: "dashed" }} />
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none"
          stroke={style.color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          {MARKER_ICONS[marker.key]}
        </svg>
      </button>
      <div className={`pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border bg-white px-2.5 py-1.5 text-[10px] font-bold shadow-lg transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
        style={{ borderColor: T.border, color: T.text }}>
        <span style={{ color: style.color }}>{marker.label}</span>
        {marker.score != null && <span style={{ color: T.faint }}> · {Math.round(marker.score)}%</span>}
      </div>
    </div>
  );
}

export default function VehicleVisual({ report, vehicle, className = "", onSelect = () => {} }) {
  const [active, setActive] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef(null);
  const canvasHostRef = useRef(null);
  const markerElementsRef = useRef({});
  const profile = useMemo(() => resolveVehicleProfile(vehicle), [vehicle]);
  const markers = useMemo(() => buildMarkers(report, vehicle, profile), [report, vehicle, profile]);

  useEffect(() => {
    const container = containerRef.current;
    const host = canvasHostRef.current;
    if (!container || !host) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch (renderError) {
      setError(true);
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    const cameraDirection = new THREE.Vector3(0.64, 0.3, 0.71).normalize();
    const car = createVehicleModel(profile);
    scene.add(car);

    // Exact 3D asset support: when a catalog entry provides `model3D`, load the
    // real GLTF/GLB and swap it in. If it is missing or fails to load, the
    // procedural body-type model above remains as the fallback.
    let modelCancelled = false;
    if (profile.model3D) {
      const loader = new GLTFLoader();
      loader.load(
        profile.model3D,
        (gltf) => {
          if (modelCancelled) return;
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const scale = size.x > 0 ? profile.geometry.length / size.x : 1;
          model.scale.setScalar(scale);
          box.setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          model.position.x -= center.x;
          model.position.z -= center.z;
          model.position.y -= box.min.y;
          model.traverse((object) => {
            if (object.isMesh) {
              object.castShadow = true;
              object.receiveShadow = true;
            }
          });
          car.clear();
          car.add(model);
          renderScene();
        },
        undefined,
        () => {
          // Keep the procedural fallback when the asset is unavailable.
        }
      );
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.outline = "none";
    host.appendChild(renderer.domElement);

    const environment = new RoomEnvironment(renderer);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environmentMap = pmrem.fromScene(environment, 0.04).texture;
    scene.environment = environmentMap;
    pmrem.dispose();

    scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x94a3b8, 1.15));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(4.5, 7.5, 5);
    const shadowMapSize = window.innerWidth < 768 ? 1024 : 2048;
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    keyLight.shadow.camera.left = -6;
    keyLight.shadow.camera.right = 6;
    keyLight.shadow.camera.top = 6;
    keyLight.shadow.camera.bottom = -6;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.bias = -0.00025;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.45);
    fillLight.position.set(-5, 3.5, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xdbeafe, 1.6);
    rimLight.position.set(-2, 5.5, -6);
    scene.add(rimLight);

    const shadowFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 18),
      new THREE.ShadowMaterial({ color: 0x0f172a, opacity: 0.14 })
    );
    shadowFloor.rotation.x = -Math.PI / 2;
    shadowFloor.receiveShadow = true;
    scene.add(shadowFloor);

    const contactTexture = makeShadowTexture();
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(profile.geometry.length * 1.15, profile.geometry.width * 1.45),
      new THREE.MeshBasicMaterial({ map: contactTexture, transparent: true, depthWrite: false })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.012;
    scene.add(contactShadow);

    let rotation = 0;
    let targetRotation = 0;
    let velocity = 0;
    let draggingNow = false;
    let lastX = 0;
    let lastTime = 0;
    let frame = 0;
    let width = 1;
    let height = 1;
    let disposed = false;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      width = Math.max(rect.width, 1);
      height = Math.max(rect.height, 1);
      const aspect = width / height;
      const distance = Math.max(7.0, (profile.geometry.length * 2.15) / aspect);
      camera.aspect = aspect;
      camera.position.copy(cameraDirection).multiplyScalar(distance);
      camera.lookAt(0, profile.geometry.bodyTop * 0.75, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
      updateMarkers();
    };

    const updateMarkers = () => {
      if (disposed) return;
      car.updateMatrixWorld(true);
      const projected = new THREE.Vector3();
      markers.forEach((marker) => {
        const element = markerElementsRef.current[marker.key];
        if (!element) return;
        projected.copy(marker.anchor).applyMatrix4(car.matrixWorld).project(camera);
        const x = (projected.x * 0.5 + 0.5) * width;
        const y = (-projected.y * 0.5 + 0.5) * height;
        const visible = projected.z < 1 && projected.z > -1 && x > -80 && x < width + 80 && y > -80 && y < height + 80;
        const scale = Math.min(1.08, Math.max(0.82, 1.12 - projected.z * 0.18));
        element.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
        element.style.opacity = visible ? "1" : "0";
        element.style.pointerEvents = visible ? "auto" : "none";
      });
    };

    const renderScene = () => {
      car.rotation.y = rotation;
      container.dataset.vehicleRotation = ((rotation * 180) / Math.PI).toFixed(1);
      renderer.render(scene, camera);
      updateMarkers();
    };

    const tick = () => {
      frame = 0;
      const difference = targetRotation - rotation;
      rotation += difference * 0.18;
      if (!draggingNow) {
        targetRotation += velocity;
        velocity *= 0.93;
      }
      renderScene();
      const settled = !draggingNow && Math.abs(targetRotation - rotation) < 0.0006 && Math.abs(velocity) < 0.0004;
      if (!settled) frame = requestAnimationFrame(tick);
    };

    const ensureLoop = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onPointerDown = (event) => {
      if (event.target.closest?.("[data-vehicle-marker]")) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (event.pointerType === "mouse") event.preventDefault();
      draggingNow = true;
      setDragging(true);
      lastX = event.clientX;
      lastTime = performance.now();
      velocity = 0;
      try {
        container.setPointerCapture(event.pointerId);
      } catch (captureError) {
        // Pointer capture is optional.
      }
      ensureLoop();
    };

    const onPointerMove = (event) => {
      if (!draggingNow) return;
      const now = performance.now();
      const deltaX = event.clientX - lastX;
      const deltaTime = Math.max(8, now - lastTime);
      lastX = event.clientX;
      lastTime = now;
      const change = deltaX * 0.0085;
      targetRotation += change;
      velocity = Math.max(-0.24, Math.min(0.24, (change / deltaTime) * 16.67));
      ensureLoop();
    };

    const finishDrag = (event) => {
      if (!draggingNow) return;
      draggingNow = false;
      setDragging(false);
      if (event && event.pointerId != null) {
        try {
          container.releasePointerCapture(event.pointerId);
        } catch (captureError) {
          // Already released by the browser.
        }
      }
      ensureLoop();
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(host);
    resize();
    ensureLoop();

    return () => {
      disposed = true;
      modelCancelled = true;
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
      scene.traverse((object) => {
        if (object.isMesh) {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material?.dispose());
        }
      });
      contactTexture.dispose();
      environmentMap.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [markers, profile]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden ${dragging ? "cursor-grabbing" : "cursor-grab"} ${className}`}
      style={{ touchAction: "pan-y", WebkitUserSelect: "none", userSelect: "none" }}
      aria-label="Interactive 3D vehicle. Drag left or right to rotate through 360 degrees."
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[56%] h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,0.14) 0%, rgba(37,99,235,0.045) 40%, rgba(37,99,235,0) 72%)" }} />
        <div className="absolute left-1/2 top-[57%] h-[330px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border"
          style={{ borderColor: "#DBEAFE" }} />
        <div className="absolute left-1/2 top-[57%] h-[390px] w-[850px] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border opacity-60"
          style={{ borderColor: "#E2E8F0" }} />
        <svg className="absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="none">
          <defs>
            <pattern id="vehicle3dGrid" width="34" height="34" patternUnits="userSpaceOnUse">
              <path d="M 34 0 L 0 0 0 34" fill="none" stroke="#E8EEF6" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#vehicle3dGrid)" />
        </svg>
      </div>

      <div ref={canvasHostRef} className="absolute inset-0 z-10" />

      <div className="pointer-events-none absolute left-4 top-4 z-30 flex items-center gap-2 rounded-xl border bg-white/90 px-3 py-2 shadow-sm backdrop-blur"
        style={{ borderColor: T.border }}>
        <BrandLogo brandKey={profile.brandKey} brand={profile.brand} size={28} />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-black leading-tight" style={{ color: T.text }}>{profile.displayName}</p>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: T.faint }}>
            {profile.bodyLabel}{profile.electric ? " · EV" : ""}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-20">
        {markers.map((marker) => (
          <Marker key={marker.key} marker={marker} active={active === marker.key}
            onHover={setActive} onSelect={onSelect}
            markerRef={(element) => { if (element) markerElementsRef.current[marker.key] = element; }} />
        ))}
      </div>

      {error && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: T.blueSoft, color: T.blue }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.7"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 11 1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
              <path d="M3 16v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" />
              <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M9 17h6" />
            </svg>
          </span>
          <p className="text-xs font-bold" style={{ color: T.text }}>3D vehicle view unavailable</p>
          <p className="max-w-xs text-[11px]" style={{ color: T.muted }}>This browser could not start WebGL. Diagnostic markers remain available below.</p>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full border bg-white/85 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] backdrop-blur"
        style={{ borderColor: T.border, color: T.faint }}>
        Drag left or right · 360° rotation
      </div>
    </div>
  );
}
