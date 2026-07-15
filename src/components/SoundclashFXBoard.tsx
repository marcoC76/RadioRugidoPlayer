import React from 'react';
import { Play, RotateCcw, Volume2, Sparkles, AlertTriangle, Zap, VolumeX } from 'lucide-react';
import { 
  playDubSiren, 
  playSpaceLaser, 
  playAirhorn, 
  playVinylRewind 
} from '../utils/audioEffects';

interface SoundclashFXBoardProps {
  onPullUp?: () => void;
  isPlaying: boolean;
  onTriggerFlashMessage?: (msg: string) => void;
}

export const SoundclashFXBoard: React.FC<SoundclashFXBoardProps> = ({
  onPullUp,
  isPlaying,
  onTriggerFlashMessage,
}) => {
  const [fxVolume, setFxVolume] = React.useState<number>(0.55);
  const [activeFX, setActiveFX] = React.useState<string | null>(null);

  const triggerFX = (name: string, playFn: (vol: number) => void) => {
    setActiveFX(name);
    playFn(fxVolume);
    
    if (onTriggerFlashMessage) {
      onTriggerFlashMessage(`EFECTO ACTIVADO: ${name.toUpperCase()} ⚡🔊`);
    }

    setTimeout(() => {
      setActiveFX(null);
    }, 450);
  };

  const handlePullUp = () => {
    setActiveFX('pullup');
    
    // Play vinyl scratch sound
    playVinylRewind(fxVolume * 1.3);
    
    if (onTriggerFlashMessage) {
      onTriggerFlashMessage("¡PULL UP! REBOBINANDO EL DUBPLATE 🔥🔊");
    }

    // Call the pull up rewind function
    if (onPullUp) {
      onPullUp();
    }

    setTimeout(() => {
      setActiveFX(null);
    }, 800);
  };

  return (
    <div className="bg-[#0e1013] border border-[#1b1c1e] rounded-lg p-5 flex flex-col gap-4 relative overflow-hidden">
      {/* Background wood texture overlay representation or subtle grids */}
      <div className="absolute inset-0 bg-[radial-gradient(#151820_1px,transparent_1px)] bg-[size:16px_16px] opacity-20 pointer-events-none" />

      <div className="flex justify-between items-center z-10">
        <h2 className="font-display font-medium text-xs uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
          <Zap size={14} className="text-amber-500 animate-bounce" />
          <span>Soundclash FX Dub Controller</span>
        </h2>
        
        {/* Compact Volume Slider for Effects */}
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#8a939e]">
          <Volume2 size={10} />
          <input 
            type="range"
            min={0}
            max={100}
            value={fxVolume * 100}
            onChange={(e) => setFxVolume(parseFloat(e.target.value) / 100)}
            className="w-16 accent-amber-500 bg-[#1f2126] h-1 rounded appearance-none cursor-pointer"
            title="FX Master Vol"
          />
          <span className="w-6 text-right">{Math.round(fxVolume * 100)}%</span>
        </div>
      </div>

      <p className="text-[11px] text-[#8a939e] leading-relaxed z-10">
        Controla los efectos del Sound System en tiempo real. Activa alarmas y sirenas dub clásicas de Kingston sobre la marcha.
      </p>

      {/* Button Pads Matrix */}
      <div className="grid grid-cols-2 gap-3 z-10">
        {/* DUB SIREN Button */}
        <button
          onClick={() => triggerFX('siren', playDubSiren)}
          className={`relative p-4 rounded border flex flex-col items-center justify-center text-center transition-all cursor-pointer h-20 ${
            activeFX === 'siren'
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 scale-[0.98]'
              : 'bg-[#121519] border-[#23272f] text-[#f5f4f0] hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:-translate-y-0.5'
          }`}
        >
          <span className="text-base mb-1">🚨</span>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider">SIRENA DUB</span>
          <span className="text-[7px] text-[#8a939e] uppercase mt-0.5 tracking-widest font-sans">Synthesized Echo</span>
        </button>

        {/* LASER Button */}
        <button
          onClick={() => triggerFX('laser', playSpaceLaser)}
          className={`relative p-4 rounded border flex flex-col items-center justify-center text-center transition-all cursor-pointer h-20 ${
            activeFX === 'laser'
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 scale-[0.98]'
              : 'bg-[#121519] border-[#23272f] text-[#f5f4f0] hover:border-cyan-500/40 hover:bg-cyan-500/5 hover:-translate-y-0.5'
          }`}
        >
          <span className="text-base mb-1">💥</span>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider">LASER OSC</span>
          <span className="text-[7px] text-[#8a939e] uppercase mt-0.5 tracking-widest font-sans">Space Pitch Sweep</span>
        </button>

        {/* AIRHORN Button */}
        <button
          onClick={() => triggerFX('airhorn', playAirhorn)}
          className={`relative p-4 rounded border flex flex-col items-center justify-center text-center transition-all cursor-pointer h-20 ${
            activeFX === 'airhorn'
              ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 scale-[0.98]'
              : 'bg-[#121519] border-[#23272f] text-[#f5f4f0] hover:border-yellow-500/40 hover:bg-yellow-500/5 hover:-translate-y-0.5'
          }`}
        >
          <span className="text-base mb-1">🎺</span>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider">AIRHORN</span>
          <span className="text-[7px] text-[#8a939e] uppercase mt-0.5 tracking-widest font-sans">Brassy Pulsed Horn</span>
        </button>

        {/* PULL UP / REWIND Button */}
        <button
          onClick={handlePullUp}
          disabled={!isPlaying}
          className={`relative p-4 rounded border flex flex-col items-center justify-center text-center transition-all h-20 ${
            !isPlaying
              ? 'bg-[#0b0c0e] border-[#181a1d] text-[#474e5a] cursor-not-allowed opacity-45'
              : activeFX === 'pullup'
              ? 'bg-red-500/20 border-red-500 text-red-400 scale-[0.98]'
              : 'bg-[#1e1416]/50 border-red-500/20 text-red-400 hover:border-red-500/40 hover:bg-red-500/5 hover:-translate-y-0.5 cursor-pointer'
          }`}
        >
          <RotateCcw size={16} className={`mb-1.5 ${activeFX === 'pullup' ? 'animate-spin' : ''}`} />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider">PULL UP !</span>
          <span className="text-[7px] text-[#8a939e] uppercase mt-0.5 tracking-widest font-sans">Vinyl Rewind</span>
        </button>
      </div>
    </div>
  );
};
