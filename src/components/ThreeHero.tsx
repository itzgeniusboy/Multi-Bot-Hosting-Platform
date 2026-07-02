import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeHeroProps {
  reduceAnimation?: boolean;
}

export default function ThreeHero({ reduceAnimation }: ThreeHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduceAnimation || !containerRef.current) return;

    // --- SETUP SCENE, CAMERA, RENDERER ---
    const scene = new THREE.Scene();
    
    // Ambient fog
    scene.background = null; 
    scene.fog = new THREE.FogExp2('#050B18', 0.07);

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;
    
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // --- CENTRAL CORE STRUCTURE (GLOWING HOST SYNC GRID) ---
    const coreGeometry = new THREE.IcosahedronGeometry(2.0, 1);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x00D4FF,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(coreMesh);

    // --- CORE GLOW VERTICES ---
    const vertexGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const vertexMaterial = new THREE.MeshBasicMaterial({
      color: 0x7C3AED,
      transparent: true,
      opacity: 0.6,
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

    // --- DYNAMIC PARTICLE GENERATOR TEXTURE ---
    const createCircleTexture = (colorStr: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, colorStr);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 16, 16);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const cyanTexture = createCircleTexture('rgba(0, 212, 255, 0.8)');
    const violetTexture = createCircleTexture('rgba(124, 58, 237, 0.8)');
    const roseTexture = createCircleTexture('rgba(255, 59, 107, 0.8)');

    // --- DEPTH LAYERING (THREE SEPARATE PARTICLE CLOUDS) ---
    // Layer 1: Front / Fast / Cyan-Teal
    const pCount1 = 80;
    const geom1 = new THREE.BufferGeometry();
    const pos1 = new Float32Array(pCount1 * 3);
    const speeds1: number[] = [];
    
    // Layer 2: Middle / Medium Speed / Purple (Connecting Lines Layer)
    const pCount2 = 140;
    const geom2 = new THREE.BufferGeometry();
    const pos2 = new Float32Array(pCount2 * 3);
    const speeds2: number[] = [];

    // Layer 3: Background / Slow / Rose-Pink
    const pCount3 = 200;
    const geom3 = new THREE.BufferGeometry();
    const pos3 = new Float32Array(pCount3 * 3);
    const speeds3: number[] = [];

    const initializePositions = (positionsArr: Float32Array, speedsArr: number[], radiusMin: number, radiusMax: number, baseSpeed: number) => {
      const count = positionsArr.length / 3;
      for (let i = 0; i < count; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = radiusMin + Math.random() * (radiusMax - radiusMin);

        positionsArr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positionsArr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positionsArr[i * 3 + 2] = r * Math.cos(phi);

        speedsArr.push(baseSpeed * (0.6 + Math.random() * 0.8));
      }
    };

    initializePositions(pos1, speeds1, 2.5, 6.0, 0.012);
    initializePositions(pos2, speeds2, 3.5, 8.5, 0.006);
    initializePositions(pos3, speeds3, 5.5, 12.0, 0.003);

    geom1.setAttribute('position', new THREE.BufferAttribute(pos1, 3));
    geom2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
    geom3.setAttribute('position', new THREE.BufferAttribute(pos3, 3));

    const mat1 = new THREE.PointsMaterial({
      color: 0x00D4FF,
      size: 0.28,
      map: cyanTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.7,
    });

    const mat2 = new THREE.PointsMaterial({
      color: 0x00D4FF,
      size: 0.18,
      map: cyanTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.5,
    });

    const mat3 = new THREE.PointsMaterial({
      color: 0x00D4FF,
      size: 0.09,
      map: cyanTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.35,
    });

    const points1 = new THREE.Points(geom1, mat1);
    const points2 = new THREE.Points(geom2, mat2);
    const points3 = new THREE.Points(geom3, mat3);

    group.add(points1);
    group.add(points2);
    group.add(points3);

    // --- CONNECTING LINE SEGMENTS FOR MIDDLE LAYER (VERCEL/LINEAR LOOK) ---
    const lineMaxConnections = 150;
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(lineMaxConnections * 2 * 3);
    const lineColors = new Float32Array(lineMaxConnections * 2 * 3);
    
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    
    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const connectionLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    group.add(connectionLines);

    // --- LIGHTS ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00D4FF, 1.8, 30);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x7C3AED, 1.8, 30);
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    // --- MOUSE PARALLAX & SCROLL DEPTH ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const scroll = { y: 0, targetY: 0 };
    let requestIndex: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleScroll = () => {
      scroll.targetY = window.scrollY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    // Pulse feedback trigger (on manual events)
    let pulseProgress = 0;
    let isPulsing = false;
    const handleWebhookSignal = () => {
      isPulsing = true;
      pulseProgress = 0;
    };
    window.addEventListener('test-webhook-triggered', handleWebhookSignal);

    // Tab Focus Check
    let isTabVisible = true;
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();

    const animate = () => {
      requestIndex = requestAnimationFrame(animate);
      if (!isTabVisible) return; // Completely throttle when not active!

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Mouse Parallax Lerping
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      // Scroll Lerping
      scroll.y += (scroll.targetY - scroll.y) * 0.05;

      // Subtle camera offsets
      camera.position.x = mouse.x * 2.2;
      camera.position.y = mouse.y * 2.2;
      camera.position.z = 8 + (scroll.y * 0.002);
      
      group.position.y = -scroll.y * 0.001;
      group.rotation.x = scroll.y * 0.0002;

      // Continuous Core wireframe updates
      coreMesh.rotation.y += 0.0015;
      coreMesh.rotation.x += 0.0008;
      vertexGroup.rotation.y += 0.0015;
      vertexGroup.rotation.x += 0.0008;

      // Swirl & rising drift for points
      const p1Arr = points1.geometry.attributes.position.array as Float32Array;
      const p2Arr = points2.geometry.attributes.position.array as Float32Array;
      const p3Arr = points3.geometry.attributes.position.array as Float32Array;

      const updateLayerParticles = (arr: Float32Array, speeds: number[], limitY: number, pulseFactor: number) => {
        const count = arr.length / 3;
        for (let i = 0; i < count; i++) {
          arr[i * 3 + 1] += speeds[i] * pulseFactor; // Rise up
          
          if (arr[i * 3 + 1] > limitY) {
            arr[i * 3 + 1] = -limitY; // Loop back
          }
          arr[i * 3] += Math.sin(time * 0.5 + i) * 0.0015; // Sway side to side
        }
      };

      const pulseFactor = isPulsing ? 4.5 : 1.0;
      updateLayerParticles(p1Arr, speeds1, 6.0, pulseFactor);
      updateLayerParticles(p2Arr, speeds2, 8.5, pulseFactor);
      updateLayerParticles(p3Arr, speeds3, 12.0, pulseFactor);

      points1.geometry.attributes.position.needsUpdate = true;
      points2.geometry.attributes.position.needsUpdate = true;
      points3.geometry.attributes.position.needsUpdate = true;

      // Dynamic Connecting Lines calculation (Middle layer)
      const linePosArr = connectionLines.geometry.attributes.position.array as Float32Array;
      const lineColArr = connectionLines.geometry.attributes.color.array as Float32Array;
      let lineIndex = 0;

      for (let i = 0; i < pCount2; i++) {
        if (lineIndex >= lineMaxConnections) break;

        const x1 = p2Arr[i * 3];
        const y1 = p2Arr[i * 3 + 1];
        const z1 = p2Arr[i * 3 + 2];

        // Find close neighbors
        for (let j = i + 1; j < pCount2; j++) {
          if (lineIndex >= lineMaxConnections) break;

          const x2 = p2Arr[j * 3];
          const y2 = p2Arr[j * 3 + 1];
          const z2 = p2Arr[j * 3 + 2];

          const dx = x1 - x2;
          const dy = y1 - y2;
          const dz = z1 - z2;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          // Connect if close enough
          if (dist < 1.7) {
            const alpha = (1.0 - dist / 1.7) * 0.25;

            // Segment start coordinate
            linePosArr[lineIndex * 6] = x1;
            linePosArr[lineIndex * 6 + 1] = y1;
            linePosArr[lineIndex * 6 + 2] = z1;

            // Segment end coordinate
            linePosArr[lineIndex * 6 + 3] = x2;
            linePosArr[lineIndex * 6 + 4] = y2;
            linePosArr[lineIndex * 6 + 5] = z2;

            // Segment start color (cyan)
            lineColArr[lineIndex * 6] = 0.0;      // R
            lineColArr[lineIndex * 6 + 1] = 0.83; // G
            lineColArr[lineIndex * 6 + 2] = 1.0;  // B

            // Segment end color (cyan)
            lineColArr[lineIndex * 6 + 3] = 0.0;  // R
            lineColArr[lineIndex * 6 + 4] = 0.83; // G
            lineColArr[lineIndex * 6 + 5] = 1.0;  // B

            lineIndex++;
          }
        }
      }

      // Fill remaining connection slots with zero to hide them
      for (let k = lineIndex; k < lineMaxConnections; k++) {
        linePosArr[k * 6] = 0;
        linePosArr[k * 6 + 1] = 0;
        linePosArr[k * 6 + 2] = 0;
        linePosArr[k * 6 + 3] = 0;
        linePosArr[k * 6 + 4] = 0;
        linePosArr[k * 6 + 5] = 0;
      }

      connectionLines.geometry.attributes.position.needsUpdate = true;
      connectionLines.geometry.attributes.color.needsUpdate = true;

      // Pulse physics animation
      if (isPulsing) {
        pulseProgress += 0.02;
        const scale = 1.0 + Math.sin(pulseProgress * Math.PI) * 0.12;
        coreMesh.scale.set(scale, scale, scale);
        vertexGroup.scale.set(scale, scale, scale);
        mat1.size = 0.22 + Math.sin(pulseProgress * Math.PI) * 0.15;

        if (pulseProgress >= 1.0) {
          isPulsing = false;
          coreMesh.scale.set(1, 1, 1);
          vertexGroup.scale.set(1, 1, 1);
          mat1.size = 0.22;
        }
      }

      // Group ambient rotation
      group.rotation.y = time * 0.015 + mouse.x * 0.1;

      renderer.render(scene, camera);
    };

    animate();

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

    // --- DISPOSAL CLEANUP ---
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('test-webhook-triggered', handleWebhookSignal);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resizeObserver.disconnect();
      cancelAnimationFrame(requestIndex);

      if (containerRef.current && renderer.domElement) {
        try {
          containerRef.current.removeChild(renderer.domElement);
        } catch (e) {
          // Pass
        }
      }

      coreGeometry.dispose();
      coreMaterial.dispose();
      vertexGeometry.dispose();
      vertexMaterial.dispose();
      geom1.dispose();
      geom2.dispose();
      geom3.dispose();
      mat1.dispose();
      mat2.dispose();
      mat3.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      cyanTexture.dispose();
      violetTexture.dispose();
      roseTexture.dispose();

      renderer.dispose();
    };
  }, [reduceAnimation]);

  if (reduceAnimation) return null;

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
      style={{ mixBlendMode: 'screen', opacity: 0.35 }}
    />
  );
}
