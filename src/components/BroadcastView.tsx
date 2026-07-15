import React, { useEffect, useState } from 'react';
import { ArrowLeft, Disc, Volume2, Instagram, Youtube, Tv, Sparkles, Music } from 'lucide-react';
import { Track, PlaybackState, RadioThemeId, VisualizerType } from '../types';
import { AudioVisualizer } from './AudioVisualizer';
import { TrackWaveform } from './TrackWaveform';
import { motion, AnimatePresence } from 'motion/react';

interface BroadcastViewProps {
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  playbackState: PlaybackState;
  onReturnToCabin: () => void;
  themeId?: RadioThemeId;
  visualizerType?: VisualizerType;
  flashMessage: string | null;
  onTriggerFlashMessage: (msg: string) => void;
  tickerText?: string;
  onSeek?: (time: number) => void;
}

export const BroadcastView: React.FC<BroadcastViewProps> = ({
  tracks,
  currentTrackIndex,
  isPlaying,
  playbackState,
  onReturnToCabin,
  themeId = 'roots',
  visualizerType = 'spectrogram',
  flashMessage,
  onTriggerFlashMessage,
  tickerText = '',
  onSeek,
}) => {
  const currentTrack = tracks[currentTrackIndex] || null;
  const [showExitTip, setShowExitTip] = useState(true);

  // Auto-hide exit tip after 6 seconds so it doesn't clutter the OBS frame
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowExitTip(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  // Listen to Escape key to easily return to cabin mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onReturnToCabin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onReturnToCabin]);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Theme-specific config helper
  const getThemeConfig = (tId: RadioThemeId) => {
    switch (tId) {
      case 'dub':
        return {
          bgGradient: 'radial-gradient(circle at center, #060b1e 0%, #020306 100%)',
          title: (
            <h1 className="font-display font-extrabold text-2xl md:text-3xl lg:text-4xl tracking-tight uppercase leading-none text-[#f5f4f0] drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              RADIO <span className="text-cyan-400">RUGIDO</span>
            </h1>
          ),
          subtitle: 'NEGUS SELECTER',
          progressClass: 'bg-gradient-to-r from-[#06b6d4] via-[#6366f1] to-[#ec4899]',
          badgeText: 'RADIO RUGIDO DUB',
          badgeStyle: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
          indicatorStyle: 'border-[#111c30] bg-[#05070c] text-cyan-400',
          glowPulseColor: 'bg-cyan-500',
          textColor: 'text-cyan-400',
        };
      case 'steppers':
        return {
          bgGradient: 'radial-gradient(circle at center, #15171d 0%, #06070a 100%)',
          title: (
            <h1 className="font-display font-extrabold text-2xl md:text-3xl lg:text-4xl tracking-tight uppercase leading-none text-[#f5f4f0] tracking-wider">
              RADIO <span className="text-[#ea580c]">RUGIDO</span>
            </h1>
          ),
          subtitle: 'NEGUS SELECTER',
          progressClass: 'bg-gradient-to-r from-[#facc15] via-[#f97316] to-[#ef4444]',
          badgeText: 'RADIO RUGIDO STEPPERS',
          badgeStyle: 'border-orange-500/30 bg-orange-500/10 text-orange-500',
          indicatorStyle: 'border-[#2d3039] bg-[#14161d] text-[#f59e0b]',
          glowPulseColor: 'bg-amber-500',
          textColor: 'text-[#ea580c]',
        };
      case 'retro':
        return {
          bgGradient: 'radial-gradient(circle at center, #1b1915 0%, #0a0907 100%)',
          title: (
            <h1 className="font-display font-extrabold text-2xl md:text-3xl lg:text-4xl tracking-tight uppercase leading-none text-amber-100">
              RADIO <span className="text-amber-600">RUGIDO</span>
            </h1>
          ),
          subtitle: 'NEGUS SELECTER',
          progressClass: 'bg-gradient-to-r from-[#78350f] via-[#b45309] to-[#f59e0b]',
          badgeText: 'RADIO RUGIDO RETRO',
          badgeStyle: 'border-amber-600/30 bg-amber-600/5 text-amber-500',
          indicatorStyle: 'border-[#2b251d] bg-[#14120f] text-amber-500',
          glowPulseColor: 'bg-amber-600',
          textColor: 'text-amber-500',
        };
      default: // roots
        return {
          bgGradient: 'radial-gradient(circle at center, #12141a 0%, #050608 100%)',
          title: (
            <h1 className="font-display font-extrabold text-2xl md:text-3xl lg:text-4xl tracking-tight uppercase leading-none text-[#f5f4f0]">
              RADIO <span className="text-amber-500">RUGIDO</span>
            </h1>
          ),
          subtitle: 'NEGUS SELECTER',
          progressClass: 'bg-gradient-to-r from-[#10b981] via-[#f59e0b] to-[#ef4444]',
          badgeText: 'RADIO RUGIDO ROOTS',
          badgeStyle: 'border-emerald-500/20 bg-emerald-500/10 text-[#10b981]',
          indicatorStyle: 'border-[#1d222e] bg-[#0d0f14]/85 text-rose-500',
          glowPulseColor: 'bg-rose-500',
          textColor: 'text-amber-500',
        };
    }
  };

  const config = getThemeConfig(themeId as RadioThemeId);
  const percentPlayed = playbackState.duration ? (playbackState.currentTime / playbackState.duration) * 100 : 0;

  // Prepare custom crawler content incorporating playing track info
  const trackPrefix = currentTrack 
    ? `🔴 SONANDO AHORA: ${currentTrack.title.toUpperCase()} - ${currentTrack.artist.toUpperCase()} (${currentTrack.genre.toUpperCase()}) ✦ ` 
    : '';
  
  const textToScroll = `${trackPrefix}${tickerText || "BIENVENIDOS A RADIO RUGIDO - MODO TRANSMISIÓN EN DIRECTO 🦁 SÍGUENOS EN NUESTRAS REDES SOCIALES 📻"}`;
  
  // Dynamically calculate speed based on content length. Let's aim for ~8-10 chars per second.
  const scrollDuration = Math.max(15, Math.floor(textToScroll.length / 8));

  return (
    <div 
      id="broadcast-view" 
      className="w-full h-screen bg-[#07080a] text-[#f5f4f0] font-sans flex flex-col justify-between overflow-hidden relative"
      style={{
        backgroundImage: config.bgGradient,
      }}
    >
      {/* Background Audio Visualizer - Low Opacity */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <AudioVisualizer 
          isPlaying={isPlaying} 
          volume={playbackState.volume} 
          genre={currentTrack?.genre || 'Roots'} 
          speedMultiplier={0.8}
          themeId={themeId}
          visualizerType={visualizerType}
          mode="visualizer-only"
        />
      </div>
      {/* Full-screen high-impact FLASH FX notification */}
      <AnimatePresence>
        {flashMessage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -15 }}
            className="absolute inset-x-4 top-20 md:top-6 md:right-8 md:left-auto z-40 max-w-sm"
          >
            <div className="p-4 bg-[#0c0d12]/95 border-2 border-amber-500/80 rounded-xl shadow-[0_0_40px_rgba(245,158,11,0.25)] backdrop-blur-md flex items-center gap-4 relative overflow-hidden">
              {/* Dynamic flashing background */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
              
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 animate-pulse border border-amber-500/30">
                <Sparkles size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-mono text-amber-500 font-bold uppercase tracking-widest animate-pulse flex items-center gap-1">
                  🔴 LIVE ALERT FX
                </span>
                <p className="text-sm font-bold text-[#f5f4f0] mt-0.5 uppercase tracking-wide leading-snug">
                  {flashMessage}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Floating Escape Controls - ultra-discreet at the top corner to maximize screen real estate */}
      <div className="absolute top-3 right-3 z-50 transition-opacity duration-300 opacity-30 hover:opacity-100 flex items-center gap-1.5">
        <button 
          onClick={onReturnToCabin}
          className="flex items-center gap-1 px-2 py-1 bg-black/40 hover:bg-black/75 text-[#8a939e] hover:text-[#f5f4f0] border border-white/5 hover:border-white/10 text-[9px] uppercase tracking-widest rounded-full font-mono transition-all cursor-pointer backdrop-blur-xs active:scale-95 shadow-sm"
        >
          <ArrowLeft size={10} />
          <span>Cabina</span>
        </button>
        <span className="hidden md:inline text-[8px] text-[#5e6675] font-mono select-none bg-black/20 px-1.5 py-0.5 rounded-full border border-white/5">[Esc]</span>
      </div>

      {/* Temporary User Tip */}
      <AnimatePresence>
        {showExitTip && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 z-50 w-[90%] md:w-auto bg-[#161a22]/95 border border-amber-500/35 px-3 py-1.5 rounded shadow-2xl text-center flex items-center justify-center gap-1.5"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${config.glowPulseColor} animate-ping`} />
            <p className="text-[10px] font-mono text-[#e2e8f0]">
              <span className="text-amber-500 font-bold uppercase">MODO TRANSMISIÓN:</span> Para OBS o Directos. Cabina arriba a la derecha.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP DECK: Station Branding Header */}
      <header className="px-4 pt-6 pb-1 md:px-8 md:pt-5 md:pb-2 flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 w-full max-w-[1500px] mx-auto z-10">
        <div>
          {/* Tri-color reggae aesthetic or themed accent line */}
          {themeId === 'roots' ? (
            <div className="flex gap-1 h-1 w-12 mb-1.5 rounded-full overflow-hidden">
              <span className="bg-[#ef4444] flex-1" />
              <span className="bg-[#f59e0b] flex-1" />
              <span className="bg-[#10b981] flex-1" />
            </div>
          ) : themeId === 'grid' ? (
            <div className="flex gap-1 h-1 w-12 mb-1.5 rounded-full overflow-hidden bg-gradient-to-r from-cyan-400 to-indigo-500" />
          ) : themeId === 'steppers' ? (
            <div className="flex gap-1 h-1 w-12 mb-1.5 rounded-full overflow-hidden bg-gradient-to-r from-amber-500 to-red-600" />
          ) : (
            <div className="flex gap-1 h-1 w-12 mb-1.5 rounded-full overflow-hidden bg-gradient-to-r from-[#78350f] to-[#f59e0b]" />
          )}

          {config.title}
          <p className="text-[9px] md:text-[10px] font-mono tracking-widest text-[#8a939e] uppercase mt-0.5 flex items-center gap-1">
            BY <span className="text-[#ef4444] font-bold">{config.subtitle}</span>
          </p>
        </div>

        {/* Live Indicator */}
        <div className={`flex items-center gap-1.5 border px-2.5 py-1 md:py-1.5 rounded-md backdrop-blur-sm shadow-xl ${config.indicatorStyle}`}>
          <span className="relative flex h-1.5 w-1.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.glowPulseColor} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${themeId === 'roots' ? 'bg-rose-600' : themeId === 'dub' ? 'bg-cyan-500' : themeId === 'steppers' ? 'bg-amber-500' : 'bg-amber-600'}`}></span>
          </span>
          <span className="text-[8px] md:text-[10px] font-mono font-bold tracking-widest uppercase">
            LIVE / ON AIR
          </span>
        </div>
      </header>

      {/* CENTER DECK: Heavy Sound System Stack Visualizer */}
      <main className="flex-1 w-full max-w-[1300px] mx-auto grid grid-cols-1 md:grid-cols-12 items-center gap-4 md:gap-6 px-4 md:px-8 z-10 py-2 overflow-hidden">
        
        {/* Left Side: Massive Speaker Visualizer (7 cols) */}
        <section className="md:col-span-7 h-40 xs:h-56 sm:h-64 md:h-[320px] lg:h-[380px] flex items-center justify-center relative">
          <div className="w-full h-full p-1.5 bg-[#0c0d12]/40 border border-[#1a1d26]/40 rounded-xl relative">
            {/* Real audio reactive visualizer - Speakers only */}
            <AudioVisualizer 
              isPlaying={isPlaying} 
              volume={playbackState.volume} 
              genre={currentTrack?.genre || 'Roots'} 
              speedMultiplier={1.2}
              themeId={themeId}
              visualizerType={visualizerType}
              mode="speakers-only"
            />

            {/* Glowing dub filter / echo overlay */}
            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#07080a]/80 to-transparent pointer-events-none" />
          </div>
        </section>

        {/* Right Side: Track Info, Spinning Vinyl with Music Notes, and Waveform (5 cols) */}
        <section className="md:col-span-5 flex flex-col justify-center gap-3 md:gap-4">
          
          {/* Style Tag / Indicator Banner */}
          <div className="flex items-center justify-between">
            <span className={`text-[8px] md:text-[10px] font-mono font-bold tracking-widest px-2.5 py-1 rounded uppercase border ${config.badgeStyle} flex items-center gap-1 shadow-lg`}>
              <Disc className="animate-spin text-inherit" size={10} style={{ animationDuration: '4s' }} />
              {config.badgeText}
            </span>
            
            {/* Live Playback Indicator badge */}
            {isPlaying && (
              <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-400 font-mono text-[8px] tracking-wider uppercase animate-pulse">
                <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block" />
                <span>On Air</span>
              </div>
            )}
          </div>

          {/* Now Playing Giant Title Card */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] md:text-[10px] font-mono tracking-widest text-[#8a939e] uppercase font-bold">
              NOW PLAYING / AL AIRE
            </span>
            <h2 className="text-xl xs:text-2xl md:text-3xl lg:text-4xl font-display font-extrabold text-[#f5f4f0] leading-tight tracking-tight uppercase">
              {currentTrack ? currentTrack.title : 'ESPERANDO SEÑAL'}
            </h2>
            <h3 className={`text-base xs:text-lg md:text-xl font-sans font-medium mt-0.5 ${config.textColor}`}>
              {currentTrack ? currentTrack.artist : 'CONECTANDO REPRODUCTOR'}
            </h3>
          </div>

          {/* Spinning Vinyl Deck & Animated Notes Effect */}
          <div className="flex items-center gap-3.5 bg-black/35 border border-[#1b1e26]/50 rounded-xl p-3 relative overflow-hidden shadow-lg">
            {/* Background ambient lighting */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.03)_0%,transparent_70%)] pointer-events-none" />

            {/* Rotating Vinyl Record */}
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              {/* Outer Record Plate */}
              <div 
                className={`absolute inset-0 rounded-full border-2 border-[#12151c] bg-[#0c0d12] shadow-lg flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`} 
                style={{ animationDuration: '4s' }}
              >
                {/* Micro Grooves */}
                <div className="w-10 h-10 rounded-full border border-dashed border-white/5 flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full border border-white/10 bg-[#14171f] flex items-center justify-center" />
                </div>
              </div>
              
              {/* Spinning Central Record Label */}
              <div 
                className={`absolute w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-md z-10 ${isPlaying ? 'animate-spin' : ''}`} 
                style={{ animationDuration: '2s' }}
              >
                {themeId === 'roots' ? (
                  <span className="text-[9px] select-none">🇯🇲</span>
                ) : (
                  <Music className="text-[#07080a]" size={9} />
                )}
              </div>

              {/* Holographic Spinning Musical Notes Particles */}
              {isPlaying && (
                <>
                  <motion.div 
                    className="absolute text-emerald-400 text-xs pointer-events-none z-20"
                    initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                    animate={{ 
                      opacity: [0, 1, 0], 
                      scale: [0.5, 1.2, 0.8], 
                      x: [15, 35, 45], 
                      y: [-8, -25, -35],
                      rotate: [0, 360] 
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0 }}
                  >
                    ♩
                  </motion.div>
                  <motion.div 
                    className="absolute text-amber-400 text-xs pointer-events-none z-20"
                    initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                    animate={{ 
                      opacity: [0, 1, 0], 
                      scale: [0.5, 1.1, 0.7], 
                      x: [12, 28, 40], 
                      y: [12, 24, 32],
                      rotate: [0, -360] 
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
                  >
                    ♪
                  </motion.div>
                  <motion.div 
                    className="absolute text-rose-400 text-xs pointer-events-none z-20"
                    initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                    animate={{ 
                      opacity: [0, 1, 0], 
                      scale: [0.4, 1, 0.6], 
                      x: [-12, -28, -36], 
                      y: [-8, -18, -26],
                      rotate: [0, 180] 
                    }}
                    transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
                  >
                    ♫
                  </motion.div>
                </>
              )}
            </div>

            {/* Deck signal metadata */}
            <div className="min-w-0 flex-1">
              <span className="text-[8px] font-mono uppercase tracking-wider text-amber-500/80 font-bold block">SIGNAL MONITOR DECK</span>
              <p className="text-[10px] font-sans text-[#f5f4f0]/90 font-semibold truncate uppercase mt-0.5">
                {currentTrack ? currentTrack.title : 'ESPERANDO SEÑAL'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 text-[8px] font-mono text-[#8a939e]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>33 RPM</span>
                <span>•</span>
                <span>Stereo Analog Output</span>
              </div>
            </div>
          </div>

          {/* Timeline / Interactive Track Waveform */}
          {currentTrack && (
            <div className="flex flex-col gap-1.5 bg-[#0c0d12]/80 border border-[#1b1e26] p-2.5 md:p-3 rounded-lg shadow-xl relative overflow-hidden">
              {/* Sleek track time progress */}
              <div className="flex justify-between items-center text-[9px] md:text-[10px] font-mono text-[#8a939e]">
                <div className="flex items-center gap-1 text-[#10b981]">
                  <Volume2 size={10} />
                  <span>{formatTime(playbackState.currentTime)}</span>
                </div>
                <span>{formatTime(playbackState.duration)}</span>
              </div>

              {/* Dynamic waveform seek bar */}
              <div className="h-14 mt-1">
                <TrackWaveform
                  currentTrack={currentTrack}
                  currentTime={playbackState.currentTime}
                  duration={playbackState.duration}
                  isPlaying={isPlaying}
                  onSeek={onSeek || (() => {})}
                  themeId={themeId}
                />
              </div>

              {/* Grid backdrop */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
            </div>
          )}


        </section>

      </main>

      {/* Dynamic continuous Scrolling Marquee News Ticker - Seamless Teletipo / Crawl */}
      <div className="w-full bg-[#08090c]/90 border-y border-white/10 py-2.5 overflow-hidden whitespace-nowrap z-10 relative flex items-center shadow-[0_-4px_30px_rgba(0,0,0,0.65)] backdrop-blur-xs">
        {/* Ticker CSS Keyframes for seamless infinite scrolling */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes ticker-scroll {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          .ticker-content-wrapper {
            display: flex;
            white-space: nowrap;
            animation: ticker-scroll var(--ticker-duration, 35s) linear infinite;
            will-change: transform;
            flex-shrink: 0;
            min-width: max-content;
          }
          .ticker-text-item {
            display: inline-block;
            padding-right: 8rem;
            flex-shrink: 0;
          }
          .ticker-dot-pattern {
            background-image: radial-gradient(rgba(245, 158, 11, 0.15) 1px, transparent 1px);
            background-size: 5px 5px;
          }
        `}} />

        {/* Decorative scanlines for the ticker bar */}
        <div className="absolute inset-0 ticker-dot-pattern opacity-40 pointer-events-none" />

        {/* Ticker Title Badge - Matches theme aesthetic */}
        <div className={`font-mono font-black text-[10px] px-3.5 py-1.5 rounded-r-md uppercase tracking-[0.2em] animate-pulse z-20 shrink-0 border-r-4 ${
          themeId === 'roots' ? 'bg-[#ef4444] text-white border-[#f59e0b] shadow-[0_0_15px_rgba(239,68,68,0.4)]' :
          themeId === 'dub' ? 'bg-cyan-950 text-cyan-400 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-500/20' :
          themeId === 'steppers' ? 'bg-orange-600 text-white border-yellow-500 shadow-[0_0_15px_rgba(234,88,12,0.4)]' :
          'bg-amber-800 text-amber-100 border-amber-500 shadow-[0_0_15px_rgba(180,83,9,0.4)] border border-amber-600/25'
        }`}>
          TELETIPO / CRAWL
        </div>
        
        {/* Scrolling text container - Seamless Teletipo Implementation */}
        <div className="relative flex-1 overflow-hidden h-6 flex items-center">
          <div 
            className="ticker-content-wrapper text-[12.5px] font-mono font-bold uppercase tracking-widest drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]"
            style={{ 
              '--ticker-duration': `${scrollDuration}s`,
              color: themeId === 'roots' ? '#f59e0b' : themeId === 'dub' ? '#22d3ee' : themeId === 'steppers' ? '#f97316' : '#f59e0b'
            } as React.CSSProperties}
          >
            {/* We repeat the text twice for a seamless loop, separated by a distinct symbol */}
            <div className="ticker-text-item flex items-center gap-2">
              <span>{textToScroll}</span>
            </div>
            <div className="ticker-text-item flex items-center gap-2">
              <span>{textToScroll}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
