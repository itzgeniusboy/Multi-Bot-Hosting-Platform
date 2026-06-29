import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { audio } from '../utils/audio';

export default function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false);
  const [isClickable, setIsClickable] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Position of mouse
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Spring settings for smooth lag effect
  const springConfig = { damping: 30, stiffness: 350, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Disable on mobile/tablet devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    setIsVisible(true);

    const moveCursor = (e: MouseEvent) => {
      mouseX.set(e.clientX - 16);
      mouseY.set(e.clientY - 16);
    };

    window.addEventListener('mousemove', moveCursor);

    // Track clickables and buttons for hover state changes
    const addHoverListeners = () => {
      const clickables = document.querySelectorAll(
        'button, a, select, input, [role="button"], .server-rack-card, .premium-glass-card'
      );

      clickables.forEach((el) => {
        // Clear old ones first to prevent duplicates
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
        el.removeEventListener('mousedown', handleMouseDown);

        el.addEventListener('mouseenter', handleMouseEnter);
        el.addEventListener('mouseleave', handleMouseLeave);
        el.addEventListener('mousedown', handleMouseDown);
      });
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
      setIsClickable(true);
      audio.playHover();
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      setIsClickable(false);
    };

    const handleMouseDown = () => {
      audio.playClick();
    };

    // Watch DOM changes to re-bind events to dynamically created items (like bots cards)
    const observer = new MutationObserver(() => {
      addHoverListeners();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    addHoverListeners();

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      observer.disconnect();
      const clickables = document.querySelectorAll(
        'button, a, select, input, [role="button"], .server-rack-card, .premium-glass-card'
      );
      clickables.forEach((el) => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
        el.removeEventListener('mousedown', handleMouseDown);
      });
    };
  }, [mouseX, mouseY]);

  if (!isVisible) return null;

  return (
    <>
      {/* Outer follow-cursor ring */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-[#00D4FF]/40 pointer-events-none z-[9999] mix-blend-screen"
        style={{
          x: cursorX,
          y: cursorY,
        }}
        animate={{
          scale: isHovered ? 1.6 : 1,
          backgroundColor: isHovered ? 'rgba(0, 212, 255, 0.05)' : 'rgba(0, 212, 255, 0)',
          borderColor: isHovered ? '#7C3AED' : '#00D4FF',
          boxShadow: isHovered 
            ? '0 0 15px rgba(124, 58, 237, 0.5)' 
            : '0 0 4px rgba(0, 212, 255, 0.1)',
        }}
        transition={{ type: 'tween', ease: 'backOut', duration: 0.2 }}
      />

      {/* Inner precise-cursor dot */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full bg-[#00D4FF] pointer-events-none z-[10000]"
        style={{
          x: useSpring(mouseX, { damping: 40, stiffness: 500 }),
          y: useSpring(mouseY, { damping: 40, stiffness: 500 }),
          translateX: '13px',
          translateY: '13px',
        }}
        animate={{
          scale: isHovered ? 0.5 : 1,
          backgroundColor: isHovered ? '#7C3AED' : '#00D4FF',
          boxShadow: isHovered ? '0 0 8px #7C3AED' : '0 0 6px #00D4FF',
        }}
      />
    </>
  );
}
