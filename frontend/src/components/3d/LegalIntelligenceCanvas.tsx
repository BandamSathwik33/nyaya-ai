import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface LegalIntelligenceCanvasProps {
  className?: string;
}

export const LegalIntelligenceCanvas: React.FC<LegalIntelligenceCanvasProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 7;

    // 2. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.6);
    scene.add(ambientLight);

    const cyanPointLight = new THREE.PointLight(0x38bdf8, 3, 20);
    cyanPointLight.position.set(4, 3, 4);
    scene.add(cyanPointLight);

    const indigoPointLight = new THREE.PointLight(0x818cf8, 3, 20);
    indigoPointLight.position.set(-4, -3, -2);
    scene.add(indigoPointLight);

    const goldPointLight = new THREE.PointLight(0xfbbf24, 2.5, 20);
    goldPointLight.position.set(0, 4, 2);
    scene.add(goldPointLight);

    // 4. Central Group
    const centralGroup = new THREE.Group();
    scene.add(centralGroup);

    // --- Inner Knowledge Core (Icosahedron + Wireframe) ---
    const coreGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x0c4a6e,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.85,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    centralGroup.add(coreMesh);

    const wireGeo = new THREE.WireframeGeometry(coreGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      linewidth: 1,
    });
    const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
    centralGroup.add(wireMesh);

    // --- Outer Gyroscopic Knowledge Rings (BNS, BNSS, BSA) ---
    // Ring 1: BNS Outer Ring (Golden)
    const ring1Geo = new THREE.TorusGeometry(2.1, 0.03, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xd97706,
      emissiveIntensity: 0.3,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    centralGroup.add(ring1);

    // Ring 2: BNSS Middle Ring (Electric Cyan)
    const ring2Geo = new THREE.TorusGeometry(1.8, 0.03, 16, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.y = Math.PI / 4;
    centralGroup.add(ring2);

    // Ring 3: BSA Inner Ring (Cyber Indigo)
    const ring3Geo = new THREE.TorusGeometry(1.5, 0.025, 16, 100);
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x4f46e5,
      emissiveIntensity: 0.4,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.z = Math.PI / 6;
    centralGroup.add(ring3);

    // --- 5. Legal Knowledge Node Particles ---
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.4 + Math.random() * 1.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = radius * Math.cos(phi);
      particleScales[i] = Math.random() * 0.06 + 0.02;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.08,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    centralGroup.add(particles);

    // --- 6. Mouse Interaction & Parallax ---
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x * 0.8;
      mouseY = y * 0.8;
    };

    window.addEventListener("mousemove", onMouseMove);

    // --- 7. Animation Loop ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth lerp towards mouse
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      // Group floating & mouse response
      centralGroup.position.y = Math.sin(elapsedTime * 0.8) * 0.12;
      centralGroup.rotation.y = elapsedTime * 0.15 + targetX * 0.6;
      centralGroup.rotation.x = Math.cos(elapsedTime * 0.5) * 0.08 + -targetY * 0.6;

      // Gyroscopic Ring Rotations
      ring1.rotation.z = elapsedTime * 0.25;
      ring1.rotation.x = Math.PI / 3 + Math.sin(elapsedTime * 0.4) * 0.1;

      ring2.rotation.y = elapsedTime * -0.3;
      ring2.rotation.z = Math.cos(elapsedTime * 0.3) * 0.15;

      ring3.rotation.x = elapsedTime * 0.35;
      ring3.rotation.y = Math.PI / 4 + Math.sin(elapsedTime * 0.2) * 0.1;

      // Pulse Core
      const scale = 1 + Math.sin(elapsedTime * 1.5) * 0.03;
      coreMesh.scale.set(scale, scale, scale);
      wireMesh.scale.set(scale, scale, scale);

      // Rotate Particles
      particles.rotation.y = elapsedTime * 0.05;
      particles.rotation.x = elapsedTime * -0.03;

      renderer.render(scene, camera);
    };

    animate();

    // --- 8. Window Resize Handler ---
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    // Clean up on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        pointerEvents: "auto",
      }}
    />
  );
};
