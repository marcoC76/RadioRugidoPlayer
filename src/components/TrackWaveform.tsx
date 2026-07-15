import React, { useEffect, useRef, useState } from 'react';
import { Track, RadioThemeId } from '../types';

interface TrackWaveformProps {
  currentTrack: Track | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  themeId: RadioThemeId;
}

// Simple seedable pseudo-random number generator (LCG)
const createPRNG = (seedString: string) => {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let seed = Math.abs(hash) || 123456789;
  
  return () => {
    // LCG parameters
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
};

export const TrackWaveform: React.FC<TrackWaveformProps> = ({
  currentTrack,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  themeId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 300, height: 60 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoverX, setHoverX] = useState<number | null>(null);
  
  // Cache for generated waveform bars per track ID
  const waveformCacheRef = useRef<Record<string, number[]>>({});

  // Resize handler
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 100),
          height: Math.max(height, 20),
        });
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Get or generate waveform bar heights
  const getWaveformHeights = (track: Track | null, count: number): number[] => {
    if (!track) {
      // Empty waveform
      return Array(count).fill(0.05);
    }

    if (waveformCacheRef.current[track.id]) {
      return waveformCacheRef.current[track.id];
    }

    const rng = createPRNG(track.id + track.title);
    const heights: number[] = [];
    
    // Generate envelope and frequencies
    for (let i = 0; i < count; i++) {
      // Normal distribution envelope to make the ends fade out nicely like real song files
      const x = i / (count - 1);
      const envelope = Math.sin(x * Math.PI); // Half-sine envelope
      
      // Multi-frequency synthesis for organic waveform look
      const f1 = Math.sin(x * Math.PI * 4.5) * 0.15;
      const f2 = Math.cos(x * Math.PI * 12) * 0.1;
      const f3 = Math.sin(x * Math.PI * 28) * 0.05;
      const noise = rng() * 0.45;
      
      // Combine base amplitude with frequencies and random peaks
      let val = (0.2 + f1 + f2 + f3 + noise) * envelope;
      
      // Keep within bounds
      val = Math.max(0.04, Math.min(0.95, val));
      heights.push(val);
    }

    waveformCacheRef.current[track.id] = heights;
    return heights;
  };

  // Draw Waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Support high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const w = dimensions.width;
    const h = dimensions.height;

    // Clear background
    ctx.clearRect(0, 0, w, h);

    // Theme active colors
    let activeColor = '#f59e0b'; // retro (amber)
    let activeGlow = 'rgba(245, 158, 11, 0.4)';
    if (themeId === 'roots') {
      activeColor = '#10b981'; // roots (emerald)
      activeGlow = 'rgba(16, 185, 129, 0.4)';
    } else if (themeId === 'dub') {
      activeColor = '#06b6d4'; // dub (cyan)
      activeGlow = 'rgba(6, 182, 212, 0.4)';
    } else if (themeId === 'steppers') {
      activeColor = '#ea580c'; // steppers (orange)
      activeGlow = 'rgba(234, 88, 12, 0.4)';
    }

    const inactiveColor = '#1f2229'; // dark gray
    const hoverColor = '#3f4452'; // lighter gray

    // Calculate dynamic bar counts based on width (1 bar every 4px approx)
    const barWidth = 2.5;
    const barGap = 1.5;
    const barStep = barWidth + barGap;
    const barCount = Math.floor(w / barStep);

    const heights = getWaveformHeights(currentTrack, barCount);
    const progress = duration > 0 ? currentTime / duration : 0;
    const currentBarIndex = Math.floor(progress * barCount);

    // Subtle center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Draw individual waveform bars
    for (let i = 0; i < barCount; i++) {
      const heightPercent = heights[i] || 0.1;
      
      // Dynamic scaling: active bar breathes when playing
      let scaleMultiplier = 1;
      if (isPlaying && i === currentBarIndex) {
        // Pulse the active playhead bar
        scaleMultiplier = 1 + Math.sin(Date.now() * 0.015) * 0.15;
      }
      
      const barHeight = h * heightPercent * scaleMultiplier;
      const bx = i * barStep;
      const by = (h - barHeight) / 2;

      const isPlayed = i <= currentBarIndex;
      const isHoveredPast = hoverX !== null && bx <= hoverX;

      // Select bar styling
      if (currentTrack) {
        if (isPlayed) {
          ctx.fillStyle = activeColor;
          
          // Glow effect for played area
          if (i === currentBarIndex) {
            ctx.shadowColor = activeColor;
            ctx.shadowBlur = 4;
          } else {
            ctx.shadowBlur = 0;
          }
        } else if (hoverX !== null && isHoveredPast) {
          ctx.fillStyle = hoverColor;
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = inactiveColor;
          ctx.shadowBlur = 0;
        }
      } else {
        ctx.fillStyle = '#111317';
        ctx.shadowBlur = 0;
      }

      // Draw rounded bar
      ctx.beginPath();
      // Rounded rect using arcTo or roundRect if supported, or manually
      if (ctx.roundRect) {
        ctx.roundRect(bx, by, barWidth, barHeight, 1.2);
      } else {
        ctx.rect(bx, by, barWidth, barHeight);
      }
      ctx.fill();
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw Hover Playhead & Tooltip if user is hovering
    if (hoverX !== null && currentTrack && duration > 0) {
      // Draw vertical dash line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, h);
      ctx.stroke();
      ctx.setLineDash([]); // Reset
    }
  }, [dimensions, currentTrack, currentTime, duration, isPlaying, themeId, hoverX]);

  // Handle Click / Drag Seeking
  const handleSeekEvent = (clientX: number) => {
    if (!canvasRef.current || !currentTrack || duration <= 0) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(percent * duration);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    handleSeekEvent(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverX(Math.max(0, Math.min(rect.width, x)));

    if (isDragging) {
      handleSeekEvent(e.clientX);
    }
  };

  const handleMouseLeave = () => {
    setHoverX(null);
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile devices
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) return;
    setIsDragging(true);
    handleSeekEvent(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) return;
    handleSeekEvent(e.touches[0].clientX);
  };

  // Helper to format hovered time inside playhead area
  const getHoverTimeText = (): string => {
    if (hoverX === null || !canvasRef.current || duration <= 0) return '';
    const rect = canvasRef.current.getBoundingClientRect();
    const percent = hoverX / rect.width;
    const secs = percent * duration;
    
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-12 bg-[#060709] border border-[#14161a] rounded relative group overflow-visible"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        className={`w-full h-full block ${currentTrack ? 'cursor-pointer' : 'cursor-not-allowed opacity-30'}`}
      />
      
      {/* Dynamic Hover Tooltip */}
      {hoverX !== null && currentTrack && duration > 0 && (
        <div 
          className="absolute -top-7 px-1.5 py-0.5 bg-[#171a21] border border-[#2b313e] text-[9px] font-mono text-white rounded shadow-lg pointer-events-none transition-all duration-75 shrink-0"
          style={{ 
            left: `${hoverX}px`, 
            transform: 'translateX(-50%)',
          }}
        >
          {getHoverTimeText()}
        </div>
      )}
    </div>
  );
};
