import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeHeroProps {
  reduceAnimation?: boolean;
}

export default function ThreeHero({ reduceAnimation }: ThreeHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- SETUP SCENE, CAMERA, RENDERER ---
    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.FogExp2('#050B18', 0.0035);

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 250);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // --- CREATE CYAN PARTICLE GLOW TEXTURE ---
    const createCircleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(0, 212, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const cyanTexture = createCircleTexture();

    // --- GENERATE 600 PARTICLE POINTS ---
    const pCount = 600;
    const positions = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      // Spread in 3D box coordinates
      positions[i * 3] = (Math.random() - 0.5) * 260;     // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 260; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400; // z: from -200 to +200
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x00D4FF,
      size: 5.5,
      map: cyanTexture,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    group.add(points);

    // --- GENERATE CONNECTING LINES ---
    // Connect points that are close to each other in 3D space
    const linePositions: number[] = [];
    const maxConnections = 350;
    let connectionCount = 0;

    for (let i = 0; i < pCount; i++) {
      if (connectionCount >= maxConnections) break;
      const x1 = positions[i * 3];
      const y1 = positions[i * 3 + 1];
      const z1 = positions[i * 3 + 2];

      for (let j = i + 1; j < pCount; j++) {
        if (connectionCount >= maxConnections) break;
        const x2 = positions[j * 3];
        const y2 = positions[j * 3 + 1];
        const z2 = positions[j * 3 + 2];

        const dx = x1 - x2;
        const dy = y1 - y2;
        const dz = z1 - z2;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Connect if close enough (e.g. within 35 units)
        if (dist < 35) {
          linePositions.push(x1, y1, z1);
          linePositions.push(x2, y2, z2);
          connectionCount++;
        }
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00D4FF,
      transparent: true,
      opacity: 0.3, // Opacity 0.3 as requested
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const connectionLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    group.add(connectionLines);

    // --- MOUSE PARALLAX CONTROLS ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- RENDER LOOP ---
    const animate = () => {
      // Rotate 0.0003 radians per frame on Y axis as requested
      group.rotation.y += 0.0003;

      // Mouse Parallax smooth lerp (max ±30 units on x,y)
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      camera.position.x = mouse.x * 30;
      camera.position.y = mouse.y * 30;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    // Always render a single frame first so it shows static particles if reduceAnimation is enabled
    renderer.render(scene, camera);

    // --- START/STOP LOOP BASED ON REDUCE MOTION TOGGLE ---
    if (reduceAnimation) {
      renderer.setAnimationLoop(null);
    } else {
      renderer.setAnimationLoop(animate);
    }

    // --- RESIZE HANDLER ---
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(containerRef.current);

    // --- CLEANUP ---
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();
      renderer.setAnimationLoop(null);

      if (containerRef.current && renderer.domElement) {
        try {
          containerRef.current.removeChild(renderer.domElement);
        } catch (e) {
          // Ignore
        }
      }

      geometry.dispose();
      material.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      cyanTexture.dispose();
      renderer.dispose();
    };
  }, [reduceAnimation]);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
      style={{ mixBlendMode: 'screen', opacity: 0.5 }}
    />
  );
}
