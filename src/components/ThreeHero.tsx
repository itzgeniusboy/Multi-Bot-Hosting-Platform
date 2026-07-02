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

    const width = window.innerWidth;
    const height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 250);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Canvas position: fixed, top:0, left:0, z-index:0
    const canvasElement = renderer.domElement;
    canvasElement.style.position = 'fixed';
    canvasElement.style.top = '0';
    canvasElement.style.left = '0';
    canvasElement.style.zIndex = '0';
    canvasElement.style.width = '100vw';
    canvasElement.style.height = '100vh';
    canvasElement.style.pointerEvents = 'none';
    
    containerRef.current.appendChild(canvasElement);

    // --- GENERATE 600 PARTICLE POINTS ---
    const pCount = 600;
    const positions = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      // x,y in (-500,500), z in (-300,300)
      positions[i * 3] = (Math.random() - 0.5) * 1000;     // x (-500 to 500)
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1000; // y (-500 to 500)
      positions[i * 3 + 2] = (Math.random() - 0.5) * 600;  // z (-300 to 300)
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x00D4FF,
      size: 1.5,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // --- MOUSE PARALLAX CONTROLS (desktop only) ---
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const mouse = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return;
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 30;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 30;
    };

    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    // --- RENDER LOOP ---
    const animate = () => {
      // slow auto rotate
      scene.rotation.y += 0.0002;
      scene.rotation.x += 0.0001;

      if (!isMobile) {
        // Smooth lerp
        camera.position.x += (mouse.x - camera.position.x) * 0.05;
        camera.position.y += (-mouse.y - camera.position.y) * 0.05;
        camera.lookAt(scene.position);
      } else {
        camera.lookAt(scene.position);
      }

      renderer.render(scene, camera);
    };

    // Always render first frame
    renderer.render(scene, camera);

    if (reduceAnimation) {
      renderer.setAnimationLoop(null);
    } else {
      renderer.setAnimationLoop(animate);
    }

    // --- RESIZE HANDLER ---
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    };

    window.addEventListener('resize', handleResize);

    // --- CLEANUP ---
    return () => {
      if (!isMobile) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      window.removeEventListener('resize', handleResize);
      renderer.setAnimationLoop(null);

      if (containerRef.current && canvasElement) {
        try {
          containerRef.current.removeChild(canvasElement);
        } catch (e) {
          // Ignore
        }
      }

      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [reduceAnimation]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
    />
  );
}
