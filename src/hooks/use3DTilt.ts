import { useRef, useEffect } from 'react';

export function use3DTilt(enabled: boolean = true) {
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const card = elementRef.current;
    if (!card || !enabled) return;

    // Detect touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    // Set up initial style for transitions
    card.style.transition = 'transform 0.2s ease-out, border-color 0.3s ease, shadow 0.3s ease';
    card.style.transformStyle = 'preserve-3d';

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotX = (y - 0.5) * -8;
      const rotY = (x - 0.5) * 8;
      card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(4px)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
      if (card) {
        card.style.transform = '';
      }
    };
  }, [enabled]);

  return elementRef;
}
