import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export const LoadingOrbital3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = 120;
    const height = 120;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);

    // 1. Central Icosahedron Wireframe
    const coreGeo = new THREE.IcosahedronGeometry(0.9, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // 2. Outer Gyroscopic Ring 1 (Gold/Champagne)
    const ringGeo1 = new THREE.TorusGeometry(1.6, 0.02, 16, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.6,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    scene.add(ring1);

    // 3. Middle Gyroscopic Ring 2 (Titanium White)
    const ringGeo2 = new THREE.TorusGeometry(1.3, 0.02, 16, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 3;
    scene.add(ring2);

    // 4. Orbital Particles
    const particleCount = 40;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 1.7 + (Math.random() - 0.5) * 0.4;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.04,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      core.rotation.x += 0.015;
      core.rotation.y += 0.02;

      ring1.rotation.x += 0.02;
      ring1.rotation.y += 0.01;

      ring2.rotation.y += 0.015;
      ring2.rotation.z += 0.02;

      particles.rotation.y += 0.008;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "120px",
        height: "120px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  );
};
