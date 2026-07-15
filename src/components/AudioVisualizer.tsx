import React, { useEffect, useRef } from 'react';
import { RadioThemeId, VisualizerType } from '../types';

interface AudioVisualizerProps {
  isPlaying: boolean;
  volume: number;
  genre?: string;
  speedMultiplier?: number;
  themeId?: RadioThemeId;
  visualizerType?: VisualizerType;
  mode?: 'all' | 'speakers-only' | 'visualizer-only';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  volume,
  genre = 'Roots',
  speedMultiplier = 1,
  themeId = 'roots',
  visualizerType = 'spectrogram',
  mode = 'all',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Keep track of random walk / phase variables for fluid simulation
  const phaseRef = useRef<number>(0);
  const levelsRef = useRef<number[]>(new Array(16).fill(0).map(() => Math.random()));
  const peakLevelsRef = useRef<number[]>(new Array(16).fill(0));
  const peakHoldRef = useRef<number[]>(new Array(16).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let resizeObserver: ResizeObserver | null = null;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    if (canvas.parentElement) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(canvas.parentElement);
    }

    // Set initial size
    canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth * window.devicePixelRatio : 400;
    canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight * window.devicePixelRatio : 200;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const render = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;

      // 1. CLEAR & BACKGROUND SELECTION
      if (mode === 'visualizer-only' || mode === 'speakers-only') {
        ctx.clearRect(0, 0, w, h);
      } else {
        if (themeId === 'roots') {
        ctx.fillStyle = '#0b0c0e';
        ctx.fillRect(0, 0, w, h);
        
        // Classic Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 1;
        const gridSize = 30;
        for (let x = 0; x < w; x += gridSize) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
      } else if (themeId === 'dub') {
        // Deep Space Cosmic Dub background
        ctx.fillStyle = '#020306';
        ctx.fillRect(0, 0, w, h);

        // Ambient moving neon radial glow behind
        const gradGlow = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h));
        gradGlow.addColorStop(0, 'rgba(30, 27, 75, 0.2)'); // Deep indigo
        gradGlow.addColorStop(0.5, 'rgba(8, 47, 73, 0.1)'); // Deep ocean
        gradGlow.addColorStop(1, '#020306');
        ctx.fillStyle = gradGlow;
        ctx.fillRect(0, 0, w, h);

        // Slow floating star particles for ambient motion
        ctx.fillStyle = 'rgba(6, 182, 212, 0.3)'; // Cyan stars
        const phaseVal = phaseRef.current * 0.2;
        for (let s = 0; s < 12; s++) {
          const starX = ((s * 137.5 + phaseVal * 5) % w);
          const starY = ((s * 224.7 + Math.sin(phaseVal + s) * 15) % h);
          const starSize = 1 + Math.sin(phaseVal + s) * 0.5;
          ctx.fillRect(starX, starY, starSize, starSize);
        }

        // Circular digital grid radar lines
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.03)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.5, 0, Math.PI * 2);
        ctx.stroke();

      } else if (themeId === 'steppers') {
        // Dark metallic industrial clash
        ctx.fillStyle = '#08090b';
        ctx.fillRect(0, 0, w, h);

        // Steel grid
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.03)';
        ctx.lineWidth = 1;
        const stepperGrid = 15;
        for (let x = 0; x < w; x += stepperGrid) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += stepperGrid) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // Left/Right side warning stripes on border
        ctx.fillStyle = '#f59e0b'; // Hazard gold
        const stripeW = 8;
        if (isPlaying && Math.floor(phaseRef.current * 2) % 2 === 0) {
          ctx.fillStyle = '#f59e0b';
        } else {
          ctx.fillStyle = '#b45309';
        }
        // Minimal corner warning ticks
        ctx.fillRect(4, 4, stripeW, 16);
        ctx.fillRect(4, 4, 16, stripeW);
        ctx.fillRect(w - 12, 4, stripeW, 16);
        ctx.fillRect(w - 20, 4, 16, stripeW);
        ctx.fillRect(4, h - 20, stripeW, 16);
        ctx.fillRect(4, h - 12, 16, stripeW);
        ctx.fillRect(w - 12, h - 20, stripeW, 16);
        ctx.fillRect(w - 20, h - 12, 16, stripeW);

      } else if (themeId === 'retro') {
        // Warm 70s organic studio slate
        ctx.fillStyle = '#141310'; // Warm charcoal sepia
        ctx.fillRect(0, 0, w, h);

        // Circular vinyl record grooved rings on backgrounds
        ctx.strokeStyle = 'rgba(139, 92, 26, 0.02)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(w/2, h/2, 40, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(w/2, h/2, 80, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(w/2, h/2, 120, 0, Math.PI*2); ctx.stroke();

        // Warm cozy vertical pin stripe
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 20; x < w; x += 40) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
      }
    }

      // Progress phase
      const deltaSpeed = isPlaying ? 0.06 * speedMultiplier : 0.015;
      phaseRef.current += deltaSpeed;

      // Update frequency levels for spectrum (reggae vibes level generator)
      const targetLevels = levelsRef.current;
      const peakLevels = peakLevelsRef.current;
      const peakHold = peakHoldRef.current;

      for (let i = 0; i < targetLevels.length; i++) {
        let target = 0;
        if (isPlaying) {
          let genreMultiplier = 1;
          if (genre === 'Dub') genreMultiplier = 1.25;
          if (genre === 'Steppers') genreMultiplier = 1.4;
          if (genre === 'Dancehall') genreMultiplier = 1.3;

          const isBass = i < 4;
          const bassMod = isBass ? (1.5 + Math.sin(phaseRef.current * 2.8) * 0.5) : 0.7;

          target = (Math.sin(phaseRef.current * (1 + i * 0.15)) * 0.4 + 0.6) * volume * genreMultiplier * bassMod;
          target = Math.max(0.05, Math.min(0.95, target + (Math.random() - 0.5) * 0.15));
        } else {
          // Idle ambient wave
          target = (Math.sin(phaseRef.current * 0.5 + i * 0.4) * 0.05 + 0.04);
        }

        // Smooth interpolating
        targetLevels[i] += (target - targetLevels[i]) * 0.2;

        // Peak tracking
        if (targetLevels[i] > peakLevels[i]) {
          peakLevels[i] = targetLevels[i];
          peakHold[i] = 15;
        } else {
          if (peakHold[i] > 0) {
            peakHold[i]--;
          } else {
            peakLevels[i] = Math.max(0, peakLevels[i] - 0.02);
          }
        }
      }

      const isWide = w > 500;
      const activeTheme = themeId as RadioThemeId;

      if (mode === 'speakers-only') {
        // Render speaker stack only
        if (isWide) {
          drawSpeakerStack(ctx, 65, h / 2, Math.min(100, h * 0.8), isPlaying, volume, phaseRef.current, genre, activeTheme);
          drawSpeakerStack(ctx, w - 65, h / 2, Math.min(100, h * 0.8), isPlaying, volume, phaseRef.current, genre, activeTheme);
        } else {
          drawSpeakerStack(ctx, w / 2, h * 0.5, Math.min(130, h * 0.7), isPlaying, volume, phaseRef.current, genre, activeTheme);
        }
      } else if (mode === 'visualizer-only') {
        // Render visualizers only, using full canvas width
        const specWidth = w - 40;
        const specX = 20;
        
        if (visualizerType === 'spectrogram') {
          drawSpectrogram(ctx, specX, h - 35, specWidth, h * 0.65, targetLevels, peakLevels, activeTheme);
        } else if (visualizerType === 'oscilloscope') {
          drawOscilloscope(ctx, specX, h - 10, specWidth, h * 0.65, targetLevels, activeTheme);
        } else if (visualizerType === 'radial') {
          drawRadialVisualizer(ctx, w / 2, h / 2, Math.min(w, h) * 0.8, Math.min(w, h) * 0.8, targetLevels, peakLevels, activeTheme);
        } else if (visualizerType === 'vu-analog') {
          drawVUMeterDedicated(ctx, specX, h - 10, specWidth, h * 0.75, targetLevels, activeTheme);
        } else if (visualizerType === 'matrix') {
          drawMatrixRain(ctx, specX, h - 10, specWidth, h * 0.85, targetLevels, activeTheme);
        } else if (visualizerType === 'grid-3d') {
          drawGrid3D(ctx, specX, h - 15, specWidth, h * 0.75, targetLevels, activeTheme);
        }
      } else {
        // Mode 'all' (default)
        if (isWide) {
          drawSpeakerStack(ctx, 65, h / 2, Math.min(100, h * 0.8), isPlaying, volume, phaseRef.current, genre, activeTheme);
          drawSpeakerStack(ctx, w - 65, h / 2, Math.min(100, h * 0.8), isPlaying, volume, phaseRef.current, genre, activeTheme);
          const specWidth = w - 260;
          const specX = 130;
          
          if (visualizerType === 'spectrogram') {
            drawSpectrogram(ctx, specX, h - 35, specWidth, h * 0.5, targetLevels, peakLevels, activeTheme);
          } else if (visualizerType === 'oscilloscope') {
            drawOscilloscope(ctx, specX, h - 10, specWidth, h * 0.65, targetLevels, activeTheme);
          } else if (visualizerType === 'radial') {
            drawRadialVisualizer(ctx, specX, h - 10, specWidth, h * 0.75, targetLevels, peakLevels, activeTheme);
          } else if (visualizerType === 'vu-analog') {
            drawVUMeterDedicated(ctx, specX, h - 10, specWidth, h * 0.75, targetLevels, activeTheme);
          } else if (visualizerType === 'matrix') {
            drawMatrixRain(ctx, specX, h - 10, specWidth, h * 0.75, targetLevels, activeTheme);
          } else if (visualizerType === 'grid-3d') {
            drawGrid3D(ctx, specX, h - 15, specWidth, h * 0.65, targetLevels, activeTheme);
          }

          drawVUHardware(ctx, specX + specWidth / 2, 40, specWidth * 0.85, isPlaying, volume, phaseRef.current, activeTheme);
        } else {
          drawSpeakerStack(ctx, w / 2, h * 0.36, Math.min(110, h * 0.46), isPlaying, volume, phaseRef.current, genre, activeTheme);
          
          if (visualizerType === 'spectrogram') {
            drawSpectrogram(ctx, 20, h - 15, w - 40, h * 0.38, targetLevels, peakLevels, activeTheme);
          } else if (visualizerType === 'oscilloscope') {
            drawOscilloscope(ctx, 20, h - 10, w - 40, h * 0.38, targetLevels, activeTheme);
          } else if (visualizerType === 'radial') {
            drawRadialVisualizer(ctx, 20, h - 10, w - 40, h * 0.38, targetLevels, peakLevels, activeTheme);
          } else if (visualizerType === 'vu-analog') {
            drawVUMeterDedicated(ctx, 20, h - 10, w - 40, h * 0.38, targetLevels, activeTheme);
          } else if (visualizerType === 'matrix') {
            drawMatrixRain(ctx, 20, h - 10, w - 40, h * 0.38, targetLevels, activeTheme);
          } else if (visualizerType === 'grid-3d') {
            drawGrid3D(ctx, 20, h - 10, w - 40, h * 0.38, targetLevels, activeTheme);
          }
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [isPlaying, volume, genre, speedMultiplier, themeId, visualizerType, mode]);

  // Helper to draw a style-specific Speaker Stack
  const drawSpeakerStack = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    active: boolean,
    vol: number,
    phase: number,
    gen: string,
    theme: RadioThemeId
  ) => {
    const width = size * 0.9;
    const height = size * 1.35;
    const rx = cx - width / 2;
    const ry = cy - height / 2;

    // Dynamic thump vibration
    let thump = 0;
    if (active) {
      const speed = gen === 'Steppers' ? 4 : 2.5;
      thump = Math.max(0, Math.sin(phase * speed) * 0.08 * vol);
    }

    const padding = 8;
    const cellW = width - padding * 2;

    if (theme === 'roots') {
      // Classic Wooden Plywood Cabinet
      ctx.fillStyle = '#1e1610';
      ctx.strokeStyle = '#2d2218';
      ctx.lineWidth = 3.5;
      ctx.fillRect(rx, ry, width, height);
      ctx.strokeRect(rx, ry, width, height);

      // Top Horn (Horn Tweeter)
      ctx.fillStyle = '#0c0d0f';
      ctx.fillRect(rx + padding, ry + padding, cellW, 26);
      ctx.strokeStyle = '#2a3b29'; // Deep Green ring
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rx + padding, ry + padding, cellW, 26);
      
      // Golden core horn
      ctx.fillStyle = 'rgba(217, 119, 6, 0.85)';
      ctx.beginPath();
      ctx.moveTo(cx - 12, ry + padding + 13);
      ctx.lineTo(cx + 12, ry + padding + 13);
      ctx.lineTo(cx + 20, ry + padding + 4);
      ctx.lineTo(cx - 20, ry + padding + 4);
      ctx.closePath();
      ctx.fill();

      // Middle Midrange Cone
      const midY = ry + height * 0.42;
      const midR = size * 0.19;
      ctx.fillStyle = '#060708';
      ctx.beginPath(); ctx.arc(cx, midY, midR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ef4444'; // Red edge
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner cone
      ctx.fillStyle = '#131416';
      ctx.beginPath();
      ctx.arc(cx, midY, midR * 0.65 * (1 + thump * 0.4), 0, Math.PI * 2);
      ctx.fill();
      
      // Dust Cap
      ctx.fillStyle = '#d97706'; // Gold center
      ctx.beginPath();
      ctx.arc(cx, midY, midR * 0.22 * (1 + thump), 0, Math.PI * 2);
      ctx.fill();

      // Bottom Heavy Subwoofer
      const subY = ry + height * 0.77;
      const subR = size * 0.27;
      ctx.fillStyle = '#040506';
      ctx.beginPath(); ctx.arc(cx, subY, subR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#10b981'; // Roots Green ring
      ctx.lineWidth = 2;
      ctx.stroke();

      // Woofer thumping paper cone
      ctx.fillStyle = '#111215';
      ctx.beginPath();
      ctx.arc(cx, subY, subR * 0.76 * (1 + thump * 0.8), 0, Math.PI * 2);
      ctx.fill();

      // Core cap
      ctx.fillStyle = '#1e2126';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, subY, subR * 0.25 * (1 + thump * 1.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Emitted soundwave ripples
      if (active && thump > 0.03) {
        ctx.strokeStyle = `rgba(16, 185, 129, ${thump * 3.5})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, subY, subR * 1.3, -Math.PI/3, Math.PI/3); ctx.stroke();
        ctx.strokeStyle = `rgba(239, 68, 68, ${thump * 2.5})`;
        ctx.beginPath(); ctx.arc(cx, subY, subR * 1.5, -Math.PI/4, Math.PI/4); ctx.stroke();
      }

    } else if (theme === 'dub') {
      // Space Lounge Acrylic Glowing Cabinet
      ctx.fillStyle = '#0b0e14';
      ctx.strokeStyle = '#06b6d4'; // Cyan neon shell
      ctx.lineWidth = 2.5;
      
      // Draw neon drop shadow effect
      ctx.shadowColor = '#4f46e5';
      ctx.shadowBlur = active ? 12 : 5;
      ctx.fillRect(rx, ry, width, height);
      ctx.strokeRect(rx, ry, width, height);
      ctx.shadowBlur = 0; // reset shadow

      // Cyan neon acrylic screws on corners
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(rx + 3, ry + 3, 3, 3);
      ctx.fillRect(rx + width - 6, ry + 3, 3, 3);
      ctx.fillRect(rx + 3, ry + height - 6, 3, 3);
      ctx.fillRect(rx + width - 6, ry + height - 6, 3, 3);

      // Top Treble Ring (Modern compression driver)
      const topH = 26;
      ctx.fillStyle = '#05070a';
      ctx.fillRect(rx + padding, ry + padding, cellW, topH);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)'; // Indigo ring
      ctx.strokeRect(rx + padding, ry + padding, cellW, topH);

      // Glowing cyber horn circle
      ctx.fillStyle = active ? '#06b6d4' : '#0369a1';
      ctx.beginPath(); ctx.arc(cx, ry + padding + topH/2, 6 * (1 + thump), 0, Math.PI*2); ctx.fill();

      // Middle Midrange cyber dome
      const midY = ry + height * 0.42;
      const midR = size * 0.19;
      ctx.fillStyle = '#030508';
      ctx.beginPath(); ctx.arc(cx, midY, midR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a855f7'; // Purple neon
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cyber concentric rings expanding outwards from center
      if (active) {
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 - thump})`;
        ctx.beginPath(); ctx.arc(cx, midY, midR * (1.1 + thump * 2), 0, Math.PI*2); ctx.stroke();
      }

      ctx.fillStyle = '#0b0f19';
      ctx.beginPath(); ctx.arc(cx, midY, midR * 0.7 * (1 + thump * 0.2), 0, Math.PI*2); ctx.fill();

      // Neon cyan dust cap
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath(); ctx.arc(cx, midY, midR * 0.2 * (1 + thump * 0.6), 0, Math.PI * 2); ctx.fill();

      // Bottom Heavy Subwoofer (Concentric Dub sound waves)
      const subY = ry + height * 0.77;
      const subR = size * 0.27;
      ctx.fillStyle = '#010305';
      ctx.beginPath(); ctx.arc(cx, subY, subR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#6366f1'; // Indigo ring
      ctx.stroke();

      // Woofer thumping cone
      ctx.fillStyle = '#0b0c10';
      ctx.beginPath(); ctx.arc(cx, subY, subR * 0.78 * (1 + thump * 0.9), 0, Math.PI * 2); ctx.fill();

      // Cyan focal core
      const gradientSub = ctx.createRadialGradient(cx, subY, 2, cx, subY, subR * 0.35 * (1 + thump));
      gradientSub.addColorStop(0, '#ffffff');
      gradientSub.addColorStop(0.5, '#06b6d4');
      gradientSub.addColorStop(1, '#05070a');
      ctx.fillStyle = gradientSub;
      ctx.beginPath(); ctx.arc(cx, subY, subR * 0.3 * (1 + thump), 0, Math.PI * 2); ctx.fill();

      // High dimensional neon expanding pulses (Dub echo feedback waves!)
      if (active) {
        ctx.strokeStyle = `rgba(6, 182, 212, ${0.7 - thump * 6})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, subY, subR * (1.2 + thump * 3), 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 - thump * 4})`;
        ctx.beginPath(); ctx.arc(cx, subY, subR * (1.5 + thump * 4), 0, Math.PI * 2); ctx.stroke();
      }

    } else if (theme === 'steppers') {
      // Industrial Soundclash Steel Cage Cabinet
      ctx.fillStyle = '#1c1e24';
      ctx.strokeStyle = '#4b5563'; // Iron frame
      ctx.lineWidth = 3.5;
      ctx.fillRect(rx, ry, width, height);
      ctx.strokeRect(rx, ry, width, height);

      // Hazard industrial corner highlights
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(rx, ry, 6, 6);
      ctx.fillRect(rx + width - 6, ry, 6, 6);
      ctx.fillRect(rx, ry + height - 6, 6, 6);
      ctx.fillRect(rx + width - 6, ry + height - 6, 6, 6);

      // Warning hazard stripes on cabinet frame
      ctx.fillStyle = '#111317';
      ctx.fillRect(rx + 4, ry + height - 12, width - 8, 8);
      ctx.fillStyle = '#f59e0b'; // Hazard stripes
      const stripeSpacing = 12;
      for (let sX = rx + 8; sX < rx + width - 8; sX += stripeSpacing) {
        ctx.beginPath();
        ctx.moveTo(sX, ry + height - 4);
        ctx.lineTo(sX + 6, ry + height - 12);
        ctx.lineTo(sX + 10, ry + height - 12);
        ctx.lineTo(sX + 4, ry + height - 4);
        ctx.closePath();
        ctx.fill();
      }

      // Middle Midrange (Tough metal cone)
      const midY = ry + height * 0.42;
      const midR = size * 0.19;
      ctx.fillStyle = '#0e1013';
      ctx.beginPath(); ctx.arc(cx, midY, midR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ea580c'; // Intense orange
      ctx.lineWidth = 2;
      ctx.stroke();

      // Metal mesh grills overlay
      ctx.fillStyle = '#2d3139';
      ctx.beginPath(); ctx.arc(cx, midY, midR * 0.7 * (1 + thump * 0.3), 0, Math.PI * 2); ctx.fill();

      // Bright white central spark core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(cx, midY, midR * 0.22 * (1 + thump * 0.8), 0, Math.PI * 2); ctx.fill();

      // Bottom Subwoofer (Heavy duty iron driver)
      const subY = ry + height * 0.74;
      const subR = size * 0.26;
      ctx.fillStyle = '#0b0c0e';
      ctx.beginPath(); ctx.arc(cx, subY, subR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#f59e0b'; // Warning gold ring
      ctx.stroke();

      // Orange thumping woofer cone
      ctx.fillStyle = '#d97706';
      ctx.beginPath(); ctx.arc(cx, subY, subR * 0.78 * (1 + thump * 1.1), 0, Math.PI * 2); ctx.fill();

      // Black metal dust cap
      ctx.fillStyle = '#1c1e24';
      ctx.beginPath(); ctx.arc(cx, subY, subR * 0.28 * (1 + thump * 1.4), 0, Math.PI * 2); ctx.fill();

      // Sound Clash Visualizer Shaking Spark Lines!
      if (active && thump > 0.04) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        // Draw 3 tiny dynamic lightning spark paths
        for (let s = 0; s < 3; s++) {
          const angle = (s * Math.PI * 2 / 3) + phase;
          const outerR = subR * 1.35;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(angle) * subR, subY + Math.sin(angle) * subR);
          ctx.lineTo(cx + Math.cos(angle + 0.1) * (outerR - 5), subY + Math.sin(angle + 0.1) * (outerR - 5));
          ctx.lineTo(cx + Math.cos(angle - 0.05) * outerR, subY + Math.sin(angle - 0.05) * outerR);
          ctx.stroke();
        }
      }

    } else if (theme === 'retro') {
      // 70s Vintage Oak Speaker Cabinet
      ctx.fillStyle = '#3a271c'; // Oak wood brown
      ctx.strokeStyle = '#1e140e';
      ctx.lineWidth = 4;
      ctx.fillRect(rx, ry, width, height);
      ctx.strokeRect(rx, ry, width, height);

      // Outer golden metal bezel border trim
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1;
      ctx.strokeRect(rx + 3, ry + 3, width - 6, height - 6);

      // Top Horn (Vintage circular dome tweeter)
      const hornY = ry + padding + 15;
      const hornR = size * 0.12;
      ctx.fillStyle = '#1e1a17';
      ctx.beginPath(); ctx.arc(cx, hornY, hornR, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#5c4033';
      ctx.stroke();

      // Brass metal core
      ctx.fillStyle = '#b45309';
      ctx.beginPath(); ctx.arc(cx, hornY, hornR * 0.45 * (1 + thump * 0.2), 0, Math.PI*2); ctx.fill();

      // Middle Midrange (Vintage straw paper style)
      const midY = ry + height * 0.43;
      const midR = size * 0.19;
      ctx.fillStyle = '#2d241e'; // Muted dark brown paper
      ctx.beginPath(); ctx.arc(cx, midY, midR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#854d0e'; // Muted dark amber edge
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Cream yellow paper cone ring
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, midY, midR * 0.65 * (1 + thump * 0.3), 0, Math.PI * 2); ctx.stroke();

      // Vintage black fabric center dome
      ctx.fillStyle = '#14110f';
      ctx.beginPath(); ctx.arc(cx, midY, midR * 0.3 * (1 + thump), 0, Math.PI * 2); ctx.fill();

      // Bottom Big Paper Woofer
      const subY = ry + height * 0.77;
      const subR = size * 0.28;
      ctx.fillStyle = '#1b1613';
      ctx.beginPath(); ctx.arc(cx, subY, subR, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.stroke();

      // Dusty paper cone
      ctx.fillStyle = '#2d231d';
      ctx.beginPath(); ctx.arc(cx, subY, subR * 0.76 * (1 + thump * 0.7), 0, Math.PI * 2); ctx.fill();

      // Circular concentric ribbed grooves (Vintage style)
      ctx.strokeStyle = '#1b1613';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, subY, subR * 0.5 * (1 + thump * 0.7), 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, subY, subR * 0.3 * (1 + thump * 0.7), 0, Math.PI * 2); ctx.stroke();

      // Felt center cap
      ctx.fillStyle = '#14100e';
      ctx.beginPath(); ctx.arc(cx, subY, subR * 0.22 * (1 + thump * 1.2), 0, Math.PI * 2); ctx.fill();

      // Gentle warm vintage glow emitting
      if (active && thump > 0.03) {
        ctx.strokeStyle = `rgba(217, 119, 6, ${thump * 2.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, subY, subR * 1.2, 0, Math.PI * 2); ctx.stroke();
      }
    }
  };

  // Helper to draw the spectrum analyzer bars
  const drawSpectrogram = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    levels: number[],
    peaks: number[],
    theme: RadioThemeId
  ) => {
    const numBars = levels.length;
    const gap = 3;
    const barWidth = (w - (numBars - 1) * gap) / numBars;

    for (let i = 0; i < numBars; i++) {
      const barH = levels[i] * h;
      const peakH = peaks[i] * h;
      const bx = x + i * (barWidth + gap);

      let grad = ctx.createLinearGradient(bx, y, bx, y - h);

      if (theme === 'roots') {
        // Red, Gold, Green
        grad.addColorStop(0, '#10b981');   // Green
        grad.addColorStop(0.5, '#f59e0b'); // Gold
        grad.addColorStop(1, '#ef4444');   // Red
        ctx.fillStyle = grad;
        ctx.fillRect(bx, y - barH, barWidth, barH);

        // Peak line
        ctx.fillStyle = '#f5f4f0';
        ctx.fillRect(bx, y - peakH - 2, barWidth, 2);

      } else if (theme === 'dub') {
        // Cosmic Cyber Gradient (Cyan -> Indigo -> Magenta)
        grad.addColorStop(0, '#06b6d4');   // Cyan
        grad.addColorStop(0.5, '#6366f1'); // Indigo
        grad.addColorStop(1, '#ec4899');   // Pink/Magenta
        ctx.fillStyle = grad;
        ctx.fillRect(bx, y - barH, barWidth, barH);

        // Peak cyan glowing box
        ctx.fillStyle = '#a5f3fc';
        ctx.fillRect(bx, y - peakH - 2.5, barWidth, 2.5);

      } else if (theme === 'steppers') {
        // High Contrast Alert (Hazard Black & Hazard Orange segments)
        const segments = 10;
        const segmentH = h / segments;
        const activeSegments = Math.round(levels[i] * segments);

        for (let s = 0; s < segments; s++) {
          const sy = y - s * segmentH;
          if (s < activeSegments) {
            // Alternating warning segments
            if (s > 7) {
              ctx.fillStyle = '#ef4444'; // Red clipping
            } else if (s > 4) {
              ctx.fillStyle = '#f59e0b'; // Gold Warning
            } else {
              ctx.fillStyle = '#facc15'; // Yellow
            }
            ctx.fillRect(bx, sy - segmentH + 1, barWidth, segmentH - 1);
          } else {
            ctx.fillStyle = 'rgba(251, 191, 36, 0.05)'; // Ghost dim
            ctx.fillRect(bx, sy - segmentH + 1, barWidth, segmentH - 1);
          }
        }

        // Peak horizontal steel dash
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx, y - peakH - 2.5, barWidth, 2);

      } else if (theme === 'retro') {
        // Monochromatic warm glowing gold needle bars
        grad.addColorStop(0, '#78350f');   // Muted brown amber
        grad.addColorStop(0.6, '#b45309'); // Amber
        grad.addColorStop(1, '#f59e0b');   // Bright warm gold
        ctx.fillStyle = grad;
        ctx.fillRect(bx, y - barH, barWidth, barH);

        // Vintage warm cream peak dot
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(bx, y - peakH - 2, barWidth, 2);
      }
    }
  };

  // Helper to draw VU hardware (LED or Analog Mechanical!)
  const drawVUHardware = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    width: number,
    active: boolean,
    vol: number,
    phase: number,
    theme: RadioThemeId
  ) => {
    const rx = cx - width / 2;
    const ry = cy - 15;
    const h = 26;

    // Standard calculations for bounce deflection values
    let leftBounce = 0;
    let rightBounce = 0;
    if (active) {
      leftBounce = (Math.sin(phase * 3.3) * 0.35 + 0.65) * vol;
      rightBounce = (Math.cos(phase * 2.8) * 0.35 + 0.65) * vol;
      leftBounce = Math.max(0, Math.min(1, leftBounce + (Math.random() - 0.5) * 0.12));
      rightBounce = Math.max(0, Math.min(1, rightBounce + (Math.random() - 0.5) * 0.12));
    } else {
      leftBounce = 0.04 + Math.sin(phase * 0.4) * 0.02;
      rightBounce = 0.04 + Math.cos(phase * 0.3) * 0.02;
    }

    if (theme === 'retro') {
      // --- EXTREMELY COOL MECHANICAL ANALOG DIALS (70s style) ---
      // Draw left and right circular/arc needles
      const dialRadius = 35;
      const dialSpacing = width * 0.28;
      
      // Draw Left Dial
      drawAnalogDial(ctx, cx - dialSpacing, cy + 5, dialRadius, leftBounce, 'LEFT CH (dB)', active);
      
      // Draw Right Dial
      drawAnalogDial(ctx, cx + dialSpacing, cy + 5, dialRadius, rightBounce, 'RIGHT CH (dB)', active);

    } else {
      // --- LED/OLED ELECTRONIC VU METERS (roots, dub, steppers) ---
      // Frame
      if (theme === 'roots') {
        ctx.fillStyle = '#14161a';
        ctx.strokeStyle = '#232830';
      } else if (theme === 'dub') {
        ctx.fillStyle = '#05070c';
        ctx.strokeStyle = '#0e1726';
      } else { // steppers
        ctx.fillStyle = '#1c1e24';
        ctx.strokeStyle = '#374151';
      }
      ctx.lineWidth = 1.5;
      ctx.fillRect(rx, ry, width, h);
      ctx.strokeRect(rx, ry, width, h);

      // Left/Right texts
      ctx.fillStyle = theme === 'dub' ? '#06b6d4' : '#8a939e';
      ctx.font = '8px var(--font-mono)';
      ctx.textAlign = 'left';
      ctx.fillText('L', rx + 6, ry + 16);
      ctx.fillText('R', rx + width - 11, ry + 16);

      const ledCount = 20;
      const startX = rx + 16;
      const ledW = (width - 34) / ledCount - 1.5;

      // Draw horizontal double LED matrix rows
      for (let ch = 0; ch < 2; ch++) {
        const isLeft = ch === 0;
        const activeLeds = Math.round((isLeft ? leftBounce : rightBounce) * ledCount);
        const ly = ry + (isLeft ? 4 : 14);
        const lh = 6;

        for (let i = 0; i < ledCount; i++) {
          const lx = startX + i * (ledW + 1.5);
          let color = '';

          if (theme === 'roots') {
            if (i < activeLeds) {
              if (i < 12) color = '#10b981'; // Green
              else if (i < 17) color = '#f59e0b'; // Gold
              else color = '#ef4444'; // Red
            } else {
              if (i < 12) color = 'rgba(16, 185, 129, 0.06)';
              else if (i < 17) color = 'rgba(245, 158, 11, 0.06)';
              else color = 'rgba(239, 68, 68, 0.06)';
            }
          } else if (theme === 'dub') {
            if (i < activeLeds) {
              if (i < 14) color = '#06b6d4'; // Cyan
              else color = '#d946ef'; // Magenta
            } else {
              if (i < 14) color = 'rgba(6, 182, 212, 0.06)';
              else color = 'rgba(217, 70, 239, 0.06)';
            }
          } else { // steppers
            if (i < activeLeds) {
              if (i < 15) color = '#f59e0b'; // Gold
              else color = '#ef4444'; // Extreme alert red
            } else {
              if (i < 15) color = 'rgba(245, 158, 11, 0.05)';
              else color = 'rgba(239, 68, 68, 0.05)';
            }
          }

          ctx.fillStyle = color;
          ctx.fillRect(lx, ly, ledW, lh);
        }
      }
    }
  };

  // Dedicated Circular Analog Mechanical Gauge rendering
  const drawAnalogDial = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    deflection: number, // 0 to 1
    labelText: string,
    active: boolean
  ) => {
    // 1. Dial plate backdrop (warm aged yellow paper gauge)
    ctx.fillStyle = '#fefaf0';
    ctx.strokeStyle = '#3e2d21';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.4, r, Math.PI * 1.15, Math.PI * 1.85);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Dial tick lines (arc scale)
    ctx.strokeStyle = '#4e3a2c';
    ctx.lineWidth = 1;
    const startAngle = Math.PI * 1.25;
    const endAngle = Math.PI * 1.75;
    const totalTicks = 8;
    
    for (let t = 0; t <= totalTicks; t++) {
      const angle = startAngle + (endAngle - startAngle) * (t / totalTicks);
      const innerR = r - 6;
      const outerR = r - 1;
      
      // Paint high level ticks in red
      if (t >= 6) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = '#4e3a2c';
        ctx.lineWidth = 1;
      }

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * (innerR + r * 0.4), cy + Math.sin(angle) * (innerR + r * 0.4) + r * 0.4);
      ctx.lineTo(cx + Math.cos(angle) * (outerR + r * 0.4), cy + Math.sin(angle) * (outerR + r * 0.4) + r * 0.4);
      ctx.stroke();
    }

    // 3. Labels on Dial
    ctx.fillStyle = '#6b5847';
    ctx.font = '7px var(--font-mono)';
    ctx.textAlign = 'center';
    ctx.fillText(labelText, cx, cy + r * 0.2);

    // Warm glow on dial bulb when active
    if (active) {
      ctx.fillStyle = 'rgba(217, 119, 6, 0.08)';
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.4, r - 5, Math.PI * 1.15, Math.PI * 1.85);
      ctx.fill();
    }

    // 4. Draw Mechanical pivoting needle
    const pivotX = cx;
    const pivotY = cy + r * 1.1; // pivot lies below
    const needleLen = r * 1.2;
    
    // Needle angle calculation (damped deflection)
    const targetAngle = startAngle + (endAngle - startAngle) * deflection;

    ctx.strokeStyle = '#dc2626'; // Bright vintage red needle
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(pivotX + Math.cos(targetAngle) * needleLen, pivotY + Math.sin(targetAngle) * needleLen);
    ctx.stroke();

    // 5. Black core pivot cap
    ctx.fillStyle = '#1e140e';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawOscilloscope = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    levels: number[],
    theme: RadioThemeId
  ) => {
    const cy = y - h / 2;
    ctx.save();
    
    // Draw background grid lines for oscilloscope screen
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    const gridSpacing = 20;
    for (let gx = x; gx < x + w; gx += gridSpacing) {
      ctx.beginPath(); ctx.moveTo(gx, y - h); ctx.lineTo(gx, y); ctx.stroke();
    }
    for (let gy = y - h; gy < y; gy += gridSpacing) {
      ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
    }

    // Set line glow based on theme
    let strokeColor = '#10b981'; // roots green
    let shadowColor = 'rgba(16, 185, 129, 0.6)';
    if (theme === 'dub') {
      strokeColor = '#06b6d4'; // cyan
      shadowColor = 'rgba(6, 182, 212, 0.8)';
    } else if (theme === 'steppers') {
      strokeColor = '#ea580c'; // orange
      shadowColor = 'rgba(234, 88, 12, 0.8)';
    } else if (theme === 'retro') {
      strokeColor = '#f59e0b'; // gold
      shadowColor = 'rgba(245, 158, 11, 0.8)';
    }

    // Draw main glowing wave
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const points = 60;
    const step = w / (points - 1);
    
    for (let i = 0; i < points; i++) {
      const px = x + i * step;
      
      // Interpolate audio levels to form a continuous wave
      const levelIdx = Math.floor((i / points) * levels.length);
      const level = levels[levelIdx] || 0.1;
      
      // Sine wave modulated by the level
      const phase = phaseRef.current * 4;
      const angle = (i / points) * Math.PI * 6 + phase;
      const py = cy + Math.sin(angle) * (h * 0.4) * level;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Draw a secondary thinner out-of-phase background wave for analog phosphor look
    ctx.shadowBlur = 0;
    ctx.strokeStyle = theme === 'dub' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const px = x + i * step;
      const levelIdx = (i + 3) % levels.length;
      const level = levels[levelIdx] || 0.1;
      const phase = phaseRef.current * 3.5;
      const angle = (i / points) * Math.PI * 8 + phase + Math.PI / 4;
      const py = cy + Math.sin(angle) * (h * 0.3) * level;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.restore();
  };

  const drawRadialVisualizer = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    levels: number[],
    peaks: number[],
    theme: RadioThemeId
  ) => {
    const cx = x + w / 2;
    const cy = y - h / 2;
    const maxRadius = Math.min(w, h) * 0.42;
    const minRadius = maxRadius * 0.4;

    ctx.save();
    
    // Average volume to drive central pulsing and particle emission
    const avgVol = levels.reduce((a, b) => a + b, 0) / levels.length;
    
    // Theme colors
    let primaryColor = '#10b981'; // green
    let accentColor = '#ef4444';  // red
    let glowColor = 'rgba(16, 185, 129, 0.3)';
    if (theme === 'dub') {
      primaryColor = '#06b6d4'; // cyan
      accentColor = '#ec4899';  // pink
      glowColor = 'rgba(6, 182, 212, 0.3)';
    } else if (theme === 'steppers') {
      primaryColor = '#ea580c'; // orange
      accentColor = '#facc15';  // gold yellow
      glowColor = 'rgba(234, 88, 12, 0.3)';
    } else if (theme === 'retro') {
      primaryColor = '#f59e0b'; // amber
      accentColor = '#78350f';  // dark amber
      glowColor = 'rgba(245, 158, 11, 0.3)';
    }

    // Draw ambient background pulsing circles
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, minRadius + avgVol * 40, 0, Math.PI * 2);
    ctx.stroke();

    // Draw radiating spikes (radial frequency bars)
    const numSpikes = 64;
    const angleStep = (Math.PI * 2) / numSpikes;

    for (let i = 0; i < numSpikes; i++) {
      const levelIdx = Math.floor((i < numSpikes / 2 ? i : numSpikes - i) * (levels.length / (numSpikes / 2)));
      const level = levels[levelIdx] || 0.1;
      const peak = peaks[levelIdx] || 0.1;

      const angle = i * angleStep + phaseRef.current * 0.1; // Rotate slowly
      
      const rStart = minRadius + (avgVol * 10);
      const rEnd = rStart + level * (maxRadius - minRadius);
      const rPeak = rStart + peak * (maxRadius - minRadius);

      const xStart = cx + Math.cos(angle) * rStart;
      const yStart = cy + Math.sin(angle) * rStart;
      const xEnd = cx + Math.cos(angle) * rEnd;
      const yEnd = cy + Math.sin(angle) * rEnd;

      const xPeak = cx + Math.cos(angle) * rPeak;
      const yPeak = cy + Math.sin(angle) * rPeak;

      // Draw Spike line
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xStart, yStart);
      ctx.lineTo(xEnd, yEnd);
      ctx.stroke();

      // Draw Peak indicator dot
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(xPeak, yPeak, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw solid center disk that pumps with the bass
    const centerDiskR = minRadius * 0.7 * (1 + avgVol * 0.3);
    const gradCenter = ctx.createRadialGradient(cx, cy, 2, cx, cy, centerDiskR);
    gradCenter.addColorStop(0, '#ffffff');
    gradCenter.addColorStop(0.4, primaryColor);
    gradCenter.addColorStop(1, '#050608');
    ctx.fillStyle = gradCenter;
    ctx.beginPath();
    ctx.arc(cx, cy, centerDiskR, 0, Math.PI * 2);
    ctx.fill();

    // Sound ring golden/cyan core outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, centerDiskR, 0, Math.PI * 2);
    ctx.stroke();

    // Tiny star sparkles shooting out when playing
    if (isPlaying && avgVol > 0.1) {
      ctx.fillStyle = primaryColor;
      const phaseVal = phaseRef.current * 2;
      for (let s = 0; s < 8; s++) {
        const starAngle = s * (Math.PI / 4) + phaseVal * 0.5;
        const starDist = minRadius + ((phaseVal * 15 + s * 25) % (maxRadius * 0.9));
        const starX = cx + Math.cos(starAngle) * starDist;
        const starY = cy + Math.sin(starAngle) * starDist;
        const starSize = 1.5 * (1 - (starDist / maxRadius));
        if (starSize > 0) {
          ctx.beginPath();
          ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore();
  };

  const drawVUMeterDedicated = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    levels: number[],
    theme: RadioThemeId
  ) => {
    const cx = x + w / 2;
    const cy = y - h / 2;
    
    // We render dual meters inside the available box
    const spacing = w * 0.26;
    const dialRadius = Math.min(w * 0.22, h * 0.45);

    // Bouncing values based on low / high frequency spectrum
    const leftVal = levels[2] || 0.1;
    const rightVal = levels[6] || 0.1;

    // Use existing drawAnalogDial helper, but scale dialRadius beautifully
    drawAnalogDial(ctx, cx - spacing, cy - dialRadius * 0.2, dialRadius, leftVal, 'CH.1 (dB)', isPlaying);
    drawAnalogDial(ctx, cx + spacing, cy - dialRadius * 0.2, dialRadius, rightVal, 'CH.2 (dB)', isPlaying);
  };

  const drawMatrixRain = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    levels: number[],
    theme: RadioThemeId
  ) => {
    ctx.save();
    
    // Set colors
    let headColor = '#ffffff';
    let trailColor = '#10b981'; // green
    if (theme === 'dub') {
      trailColor = '#06b6d4'; // cyan
    } else if (theme === 'steppers') {
      trailColor = '#ea580c'; // orange
    } else if (theme === 'retro') {
      trailColor = '#f59e0b'; // amber gold
    }

    const cols = levels.length;
    const colW = w / cols;
    const phaseVal = phaseRef.current;

    for (let c = 0; c < cols; c++) {
      const level = levels[c] || 0.1;
      const barH = level * h;
      const cx = x + c * colW + colW / 2;

      // Draw vertical rain drop stream
      const streamCount = 5;
      for (let s = 0; s < streamCount; s++) {
        // Falling speed based on level and index
        const fallOffset = (phaseVal * 80 + s * (h / streamCount)) % h;
        // Cap the fall offset within the active signal height (level)
        if (fallOffset < barH) {
          const cy = y - barH + fallOffset;
          const alpha = 1 - (fallOffset / barH);
          
          ctx.fillStyle = s === 0 ? headColor : trailColor;
          ctx.globalAlpha = alpha;
          
          // Draw a small cyber square raindrop block
          const size = Math.max(1.5, colW * 0.6);
          ctx.fillRect(cx - size / 2, cy, size, size * 2);

          // Draw digital glowing aura
          if (s === 0) {
            ctx.shadowColor = trailColor;
            ctx.shadowBlur = 4;
            ctx.fillRect(cx - size / 2, cy, size, size);
            ctx.shadowBlur = 0;
          }
        }
      }
    }

    ctx.restore();
  };

  const drawGrid3D = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    levels: number[],
    theme: RadioThemeId
  ) => {
    ctx.save();
    const cols = levels.length;
    const barW = (w / cols) * 0.75;
    const gap = (w / cols) * 0.25;

    // Isometric tilt parameters
    const skewX = -0.15;
    ctx.transform(1, 0, skewX, 1, 0, 0);

    for (let i = 0; i < cols; i++) {
      const level = levels[i] || 0.1;
      const colH = level * h * 0.8;
      const bx = x + i * (barW + gap) - skewX * (y - h / 2);

      // Colors for 3D faces
      let frontGrad = ctx.createLinearGradient(bx, y, bx, y - colH);
      let sideColor = '';
      let topColor = '';

      if (theme === 'roots') {
        frontGrad.addColorStop(0, '#047857');
        frontGrad.addColorStop(0.6, '#d97706');
        frontGrad.addColorStop(1, '#dc2626');
        sideColor = '#b45309';
        topColor = '#fef3c7';
      } else if (theme === 'dub') {
        frontGrad.addColorStop(0, '#1e1b4b');
        frontGrad.addColorStop(0.6, '#4f46e5');
        frontGrad.addColorStop(1, '#06b6d4');
        sideColor = '#312e81';
        topColor = '#a5f3fc';
      } else if (theme === 'steppers') {
        frontGrad.addColorStop(0, '#451a03');
        frontGrad.addColorStop(0.6, '#b45309');
        frontGrad.addColorStop(1, '#f97316');
        sideColor = '#78350f';
        topColor = '#ffedd5';
      } else {
        frontGrad.addColorStop(0, '#1c1917');
        frontGrad.addColorStop(0.6, '#78350f');
        frontGrad.addColorStop(1, '#d97706');
        sideColor = '#451a03';
        topColor = '#fef3c7';
      }

      // Draw Front Face of columns
      ctx.fillStyle = frontGrad;
      ctx.fillRect(bx, y - colH, barW, colH);

      // Draw Side 3D extrusion Face
      const ext3d = Math.max(1.5, barW * 0.3);
      ctx.fillStyle = sideColor;
      ctx.beginPath();
      ctx.moveTo(bx + barW, y - colH);
      ctx.lineTo(bx + barW + ext3d, y - colH - ext3d);
      ctx.lineTo(bx + barW + ext3d, y - ext3d);
      ctx.lineTo(bx + barW, y);
      ctx.closePath();
      ctx.fill();

      // Draw Top Face
      ctx.fillStyle = topColor;
      ctx.beginPath();
      ctx.moveTo(bx, y - colH);
      ctx.lineTo(bx + ext3d, y - colH - ext3d);
      ctx.lineTo(bx + barW + ext3d, y - colH - ext3d);
      ctx.lineTo(bx + barW, y - colH);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  };

  return (
    <div id="visualizer-container" className="w-full h-full relative overflow-hidden rounded-lg">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};
