import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeHero() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- SETUP SCENE, CAMERA, RENDERER ---
    const scene = new THREE.Scene();
    
    // Add atmospheric ambient fog
    scene.background = null; // Transparent background to show the CSS gradient underneath
    scene.fog = new THREE.FogExp2('#050B18', 0.08);

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // --- OBJECTS ---
    const group = new THREE.Group();
    scene.add(group);

    // 1. Central Core Wireframe Icosahedron (Representing Serverless Network Database)
    const coreGeometry = new THREE.IcosahedronGeometry(2.3, 1);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x00D4FF,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(coreMesh);

    // 2. Glowing Nodes at Vertices
    const vertexGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const vertexMaterial = new THREE.MeshBasicMaterial({
      color: 0x7C3AED,
      transparent: true,
      opacity: 0.8,
    });

    const positions = coreGeometry.attributes.position;
    const vertexGroup = new THREE.Group();
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      const vMesh = new THREE.Mesh(vertexGeometry, vertexMaterial);
      vMesh.position.set(x, y, z);
      vertexGroup.add(vMesh);
    }
    group.add(vertexGroup);

    // 3. Floating Orbiting Bots (Octahedrons)
    const botCount = 3;
    const bots: THREE.Mesh[] = [];
    const botAngles: number[] = [];
    const botSpeeds: number[] = [0.008, 0.005, 0.006];
    const botRadii: number[] = [3.8, 4.4, 4.1];
    const botColors = [0x00FF87, 0x00D4FF, 0xFF3B6B];

    for (let i = 0; i < botCount; i++) {
      const botGeom = new THREE.OctahedronGeometry(0.3, 0);
      const botMat = new THREE.MeshBasicMaterial({
        color: botColors[i],
        wireframe: true,
        transparent: true,
        opacity: 0.9,
      });
      const botMesh = new THREE.Mesh(botGeom, botMat);
      
      // Floating initial offsets
      botAngles.push((i * Math.PI * 2) / botCount);
      group.add(botMesh);
      bots.push(botMesh);
    }

    // 4. Glowing Data Packet Particles (Rising / Orbiting Telemetry Stream)
    const particleCount = 280;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Position particles in a spherical region surrounding our core network
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.5 + Math.random() * 4.5; // distance from core

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;

      particleSpeeds.push(0.01 + Math.random() * 0.015);
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    // Custom Canvas Texture for beautiful round particles (instead of square boxes)
    const createCircleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(0, 212, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 16, 16);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x00D4FF,
      size: 0.16,
      map: createCircleTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.6,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    // --- LIGHTS ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00D4FF, 1.5, 30);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x7C3AED, 1.5, 30);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // --- MOUSE PARALLAX & SCROLL DEPTH TRACKING ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const scroll = { y: 0, targetY: 0 };
    let requestIndex: number;

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse to [-1, 1] range
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleScroll = () => {
      scroll.targetY = window.scrollY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    // --- TRIGGERED WEBHOOK ANIMATION SIGNAL ---
    // Accelerates particles and creates a beautiful pulsing wave on test updates
    let pulseProgress = 0;
    let isPulsing = false;

    const handleWebhookSignal = () => {
      isPulsing = true;
      pulseProgress = 0;
    };

    window.addEventListener('test-webhook-triggered', handleWebhookSignal);

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();

    const animate = () => {
      requestIndex = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Smooth interpolation for mouse coordinates (Lerp)
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Smooth scroll interpolation (Lerp)
      scroll.y += (scroll.targetY - scroll.y) * 0.05;

      // Camera parallax
      camera.position.x = mouse.x * 1.5;
      camera.position.y = mouse.y * 1.5;
      
      // Move camera away or tilt on scroll
      camera.position.z = 7 + (scroll.y * 0.003);
      group.position.y = -scroll.y * 0.002;
      group.rotation.x = scroll.y * 0.0005;

      // Continuous Core Rotations
      coreMesh.rotation.y += 0.003;
      coreMesh.rotation.x += 0.0015;
      vertexGroup.rotation.y += 0.003;
      vertexGroup.rotation.x += 0.0015;

      // Orbiting Bots Coordinates Update
      for (let i = 0; i < botCount; i++) {
        botAngles[i] += botSpeeds[i];
        const angle = botAngles[i];
        const radius = botRadii[i];
        
        // Complex vertical sin-wave floating motion
        const botY = Math.sin(time + i) * 0.5;
        
        bots[i].position.x = Math.cos(angle) * radius;
        bots[i].position.z = Math.sin(angle) * radius;
        bots[i].position.y = botY;

        // Individual Bot Spins
        bots[i].rotation.y += 0.015;
        bots[i].rotation.x += 0.01;
      }

      // Live Telemetry Particle drift up and wave rotations
      const posArr = particles.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
        // Slow rising swirl motion
        posArr[i * 3 + 1] += particleSpeeds[i] * (isPulsing ? 4.5 : 1.0); // Speed up in a pulse
        
        // Loop particles when they float too high
        if (posArr[i * 3 + 1] > 6) {
          posArr[i * 3 + 1] = -6;
        }

        // Add subtle waving sway
        posArr[i * 3] += Math.sin(time + i) * 0.0015;
      }
      particles.geometry.attributes.position.needsUpdate = true;

      // Pulse expansion effect triggered by /start hook simulator
      if (isPulsing) {
        pulseProgress += 0.02;
        const scale = 1.0 + Math.sin(pulseProgress * Math.PI) * 0.15;
        
        coreMesh.scale.set(scale, scale, scale);
        vertexGroup.scale.set(scale, scale, scale);
        particleMaterial.size = 0.16 + Math.sin(pulseProgress * Math.PI) * 0.2;

        if (pulseProgress >= 1.0) {
          isPulsing = false;
          coreMesh.scale.set(1, 1, 1);
          vertexGroup.scale.set(1, 1, 1);
          particleMaterial.size = 0.16;
        }
      }

      // Group overall ambient tilt
      group.rotation.y = time * 0.03 + mouse.x * 0.12;

      renderer.render(scene, camera);
    };

    animate();

    // --- WINDOW RESIZE LISTENER ---
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    
    resizeObserver.observe(containerRef.current);

    // --- CLEANUP DISPOSAL ---
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('test-webhook-triggered', handleWebhookSignal);
      resizeObserver.disconnect();
      cancelAnimationFrame(requestIndex);

      if (containerRef.current && renderer.domElement) {
        try {
          containerRef.current.removeChild(renderer.domElement);
        } catch (e) {
          // Pass
        }
      }

      // Explicitly dispose of Three.js objects to avoid WebGL context leaks
      coreGeometry.dispose();
      coreMaterial.dispose();
      vertexGeometry.dispose();
      vertexMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();

      bots.forEach((bot) => {
        bot.geometry.dispose();
        if (Array.isArray(bot.material)) {
          bot.material.forEach((mat) => mat.dispose());
        } else {
          bot.material.dispose();
        }
      });
      
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
