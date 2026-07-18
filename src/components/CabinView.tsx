import React, { useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Square, 
  Upload, 
  Music, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Radio, 
  FileAudio, 
  Plus, 
  ChevronUp, 
  ChevronDown, 
  FolderOpen, 
  RotateCcw,
  Shuffle,
  Sliders,
  Palette,
  GripVertical
} from 'lucide-react';
import { Track, PlaybackState, RadioThemeId, VisualizerType } from '../types';
import { AudioVisualizer } from './AudioVisualizer';
import { TrackWaveform } from './TrackWaveform';
import { SoundclashFXBoard } from './SoundclashFXBoard';
import { ThemeCard } from './ThemeCard';
import { THEMES } from '@/src/data/themes';

interface CabinViewProps {
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  playbackState: PlaybackState;
  onAddTracks: (files: FileList) => void;
  onRemoveTrack: (id: string) => void;
  onClearPlaylist: () => void;
  onSelectTrack: (index: number) => void;
  onUpdateTrackMetadata: (id: string, updatedFields: Partial<Track>) => void;
  onTogglePlay: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleLoop: () => void;
  onSwitchToBroadcast: () => void;
  themeId: RadioThemeId;
  onChangeTheme: (themeId: RadioThemeId) => void;
  visualizerType: VisualizerType;
  onChangeVisualizer: (visualizerType: VisualizerType) => void;
  onReorderTracks: (startIndex: number, endIndex: number) => void;
  shuffle: boolean;
  onToggleShuffle: () => void;
  onPullUp?: () => void;
  flashMessage: string | null;
  onTriggerFlashMessage: (msg: string) => void;
  tickerText: string;
  onUpdateTickerText: (text: string) => void;
}

export const CabinView: React.FC<CabinViewProps> = ({
  tracks,
  currentTrackIndex,
  isPlaying,
  playbackState,
  onAddTracks,
  onRemoveTrack,
  onClearPlaylist,
  onSelectTrack,
  onUpdateTrackMetadata,
  onTogglePlay,
  onStop,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleLoop,
  onSwitchToBroadcast,
  themeId,
  onChangeTheme,
  visualizerType,
  onChangeVisualizer,
  onReorderTracks,
  shuffle,
  onToggleShuffle,
  onPullUp,
  flashMessage,
  onTriggerFlashMessage,
  tickerText,
  onUpdateTickerText,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentTrack = tracks[currentTrackIndex] || null;

  // Handle file dragging
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddTracks(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddTracks(e.target.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop event handlers for track reordering
  const handleTrackDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleTrackDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleTrackDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIdx !== null && draggedIdx !== targetIndex) {
      onReorderTracks(draggedIdx, targetIndex);
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleTrackDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // Helper to format track duration
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Move tracks up or down in queue (optional but extremely professional helper)
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [tempArtist, setTempArtist] = useState('');
  const [tempGenre, setTempGenre] = useState<'Roots' | 'Dub' | 'Steppers' | 'Dancehall'>('Roots');

  const startEditing = (track: Track) => {
    setEditingTrackId(track.id);
    setTempTitle(track.title);
    setTempArtist(track.artist);
    setTempGenre(track.genre);
  };

  const saveMetadata = () => {
    if (editingTrackId) {
      onUpdateTrackMetadata(editingTrackId, {
        title: tempTitle || 'Unknown Track',
        artist: tempArtist || 'Unknown Artist',
        genre: tempGenre,
      });
      setEditingTrackId(null);
    }
  };

  // Total tracks duration calculation
  const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0);

  return (
    <div id="cabin-view" className="min-h-screen bg-[#0b0c0e] text-[#f5f4f0] font-sans flex flex-col">
      {/* Station Header */}
      <header className="border-b border-[#1b1c1e] bg-[#0e1013] py-4 px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-display font-bold text-xl tracking-tight text-[#f5f4f0] uppercase">
              Radio Rugido <span className="text-amber-500 font-sans text-xs lowercase font-normal ml-1">Player</span>
            </h1>
          </div>
          <p className="text-xs text-[#a2a8b3] font-mono tracking-widest mt-0.5">
            by <span className="text-[#ef4444] font-semibold">Negus Selecter</span> — Dub, Roots & Sound System
          </p>
        </div>

        <div className="flex items-center gap-4">
          
          <button 
            id="go-to-broadcast-btn"
            disabled={tracks.length === 0}
            onClick={onSwitchToBroadcast}
            className={`flex items-center gap-2 px-5 py-2.5 rounded font-display font-semibold uppercase text-xs tracking-wider transition-all duration-300 ${
              tracks.length > 0 
                ? 'bg-amber-500 hover:bg-amber-600 text-[#0b0c0e] cursor-pointer shadow-lg shadow-amber-500/10 hover:-translate-y-0.5' 
                : 'bg-[#1b1c1e] text-[#505763] cursor-not-allowed'
            }`}
          >
            <Radio size={14} />
            Ir a modo transmisión
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <div className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] w-full mx-auto">
        
        {/* LEFT COLUMN: Track Loading & Queue Management (7 cols) */}
        <section className="lg:col-span-7 order-2 lg:order-1 flex flex-col gap-6">
          
          {/* File Importer and Drag Area */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 relative flex flex-col items-center justify-center min-h-[140px] ${
              dragActive 
                ? 'border-amber-500 bg-amber-500/5' 
                : 'border-[#2c2e33] bg-[#0e1013] hover:border-[#42464f]'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden" 
            />
            
            <FolderOpen className="text-amber-500/80 mb-3" size={28} />
            <div className="text-sm font-medium">
              Carga tus temas Reggae, Dub o Dubplates locales
            </div>
            <p className="text-xs text-[#8a939e] mt-1 max-w-sm">
              Arrastra archivos de audio directamente aquí, o haz clic para explorar tu dispositivo.
            </p>
            
            <button 
              onClick={triggerFileInput}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-[#1b1c1e] hover:bg-[#27292f] border border-[#2e3137] rounded text-xs uppercase tracking-wider text-[#f5f4f0] font-semibold transition-colors cursor-pointer"
            >
              <Upload size={14} />
              Seleccionar archivos
            </button>
          </div>

          {/* Playlist Panel */}
          <div className="bg-[#0e1013] border border-[#1b1c1e] rounded-lg flex-1 flex flex-col overflow-hidden min-h-[300px]">
            {/* Header of Panel */}
            <div className="bg-[#121519] border-b border-[#1b1c1e] px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Music size={16} className="text-amber-500" />
                <h2 className="font-display font-medium text-xs uppercase tracking-wider text-[#e2e8f0]">
                  Playlist de la Cabina ({tracks.length} temas)
                </h2>
              </div>
              
              {tracks.length > 0 && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={onToggleShuffle}
                    className={`flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider transition-colors cursor-pointer ${
                      shuffle
                        ? 'text-emerald-400 font-bold'
                        : 'text-emerald-400/60 hover:text-emerald-400'
                    }`}
                    title={shuffle ? 'Aleatorio ON — Sin repetición' : 'Activar Aleatorio'}
                  >
                    <Shuffle size={11} />
                    {shuffle ? 'Aleatorio ON' : 'Aleatorio'}
                  </button>
                  <button 
                    onClick={onClearPlaylist}
                    className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider text-rose-400/80 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={11} />
                    Limpiar Playlist
                  </button>
                </div>
              )}
            </div>

            {/* Playlist Queue */}
            <div className="flex-1 overflow-y-auto max-h-[460px] divide-y divide-[#16181b]">
              {tracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 px-4 text-center text-[#8a939e]">
                  <FileAudio size={36} className="opacity-20 mb-3" />
                  <p className="text-sm">No hay canciones cargadas en la playlist</p>
                  <p className="text-xs mt-1 opacity-60">Arrastra archivos mp3, wav o flac para comenzar la sesión.</p>
                </div>
              ) : (
                tracks.map((track, idx) => {
                  const isCurrent = idx === currentTrackIndex;
                  return (
                    <div 
                      key={track.id}
                      draggable
                      onDragStart={(e) => handleTrackDragStart(e, idx)}
                      onDragOver={(e) => handleTrackDragOver(e, idx)}
                      onDrop={(e) => handleTrackDrop(e, idx)}
                      onDragEnd={handleTrackDragEnd}
                      className={`relative flex items-center justify-between p-3.5 transition-all group ${
                        isCurrent 
                          ? 'bg-amber-500/5 border-l-2 border-amber-500' 
                          : 'hover:bg-[#121519]/50 border-l-2 border-transparent'
                      } ${draggedIdx === idx ? 'opacity-30 border-dashed border-2 border-amber-500/50 bg-[#121519]/30' : ''} ${
                        dragOverIdx === idx && draggedIdx !== idx
                          ? 'border-t-2 border-t-amber-500 bg-amber-500/5'
                          : ''
                      }`}
                    >
                      {/* Left: Info and Select click area */}
                      <div 
                        onClick={() => onSelectTrack(idx)}
                        className="flex-1 min-w-0 flex items-center gap-2 cursor-pointer"
                      >
                        {/* Drag Handle & Index */}
                        <div className="flex items-center gap-1.5 text-[#5e6675] group-hover:text-amber-500/80 transition-colors shrink-0">
                          <GripVertical size={13} className="cursor-grab active:cursor-grabbing opacity-40 group-hover:opacity-100 transition-opacity" />
                          <div className="font-mono text-[10px] w-4 text-right shrink-0">
                            {(idx + 1).toString().padStart(2, '0')}
                          </div>
                        </div>
                        
                        <div className="min-w-0 ml-1">
                          <div className={`text-sm truncate font-medium ${isCurrent ? 'text-amber-500 font-semibold' : 'text-[#f5f4f0]'}`}>
                            {track.title}
                          </div>
                          <div className="text-xs text-[#a2a8b3] flex items-center gap-2 truncate mt-0.5">
                            <span className="font-semibold">{track.artist}</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-[#1b1c1e] text-amber-500/90 font-mono rounded-sm border border-[#27292f]">
                              {track.genre}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-3 pl-2">
                        {/* Status / Duration */}
                        <div className="font-mono text-xs text-[#8a939e]">
                          {isCurrent && isPlaying ? (
                            <span className="text-emerald-500 animate-pulse text-[10px] font-semibold tracking-wider mr-1">
                              SONANDO
                            </span>
                          ) : null}
                          {formatTime(track.duration)}
                        </div>

                        {/* Inline Edit Button */}
                        <button 
                          onClick={() => startEditing(track)}
                          className="p-2.5 text-[#8a939e] hover:text-[#f5f4f0] rounded hover:bg-[#202329] transition-colors cursor-pointer"
                          title="Editar Metadata"
                        >
                          <Sliders size={14} />
                        </button>

                        {/* Remove Button */}
                        <button 
                          onClick={() => onRemoveTrack(track.id)}
                          className="p-2.5 text-rose-400/70 hover:text-rose-400 rounded hover:bg-[#221719] transition-colors cursor-pointer"
                          title="Quitar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Statistics */}
            {tracks.length > 0 && (
              <div className="bg-[#121519] border-t border-[#1b1c1e] px-4 py-2.5 flex justify-between items-center text-[10px] font-mono text-[#8a939e]">
                <div>TOTAL: {tracks.length} PISTAS</div>
                <div>DURACIÓN TOTAL ESTIMADA: {formatTime(totalDuration)}</div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: Control Panel & Track Editor (5 cols) */}
        <section className="lg:col-span-5 order-1 lg:order-2 flex flex-col gap-6">
          
          {/* Central Playback Controller */}
          <div className="bg-[#0e1013] border border-[#1b1c1e] rounded-lg p-5 flex flex-col gap-4">
            <h2 className="font-display font-medium text-xs uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              Consola del Operador
            </h2>

            {/* Display Active Track */}
            <div className="bg-[#07080a] border border-[#181a1d] rounded p-4 flex items-center gap-3.5 relative overflow-hidden">
              <div className="p-3 bg-amber-500/5 rounded border border-amber-500/20 text-amber-500">
                <Music size={24} className={isPlaying ? "animate-spin" : ""} style={{ animationDuration: '6s' }} />
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-mono text-emerald-500 tracking-wider uppercase font-bold flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                  {isPlaying ? 'ON AIR' : 'PAUSADO'}
                </div>
                <h3 className="text-base font-bold text-[#f5f4f0] truncate mt-0.5">
                  {currentTrack ? currentTrack.title : 'Ninguna pista cargada'}
                </h3>
                <p className="text-xs text-[#a2a8b3] truncate font-medium">
                  {currentTrack ? currentTrack.artist : 'Sube música desde la izquierda'}
                </p>
              </div>
            </div>

            {/* Simulated Live Visualizer for Operator */}
            <div className="h-28 bg-[#07080a] border border-[#181a1d] rounded overflow-hidden relative">
              <AudioVisualizer 
                isPlaying={isPlaying} 
                volume={playbackState.volume} 
                genre={currentTrack?.genre || 'Roots'} 
                speedMultiplier={1}
                themeId={themeId}
                visualizerType={visualizerType}
              />
              {flashMessage && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 transition-all duration-300">
                  <div className="text-center font-mono font-bold text-[10px] text-amber-500 uppercase tracking-widest border border-amber-500/30 px-3 py-1.5 rounded bg-black/80 shadow-lg shadow-amber-500/10 animate-pulse">
                    {flashMessage}
                  </div>
                </div>
              )}
            </div>

            {/* Scrub Seek Bar with Waveform Visualization */}
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex justify-between items-center text-[10px] font-mono text-[#8a939e]">
                <span>{formatTime(playbackState.currentTime)}</span>
                <span className="text-[8px] opacity-40 uppercase font-sans tracking-widest animate-pulse">HAZ CLIC O ARRASTRA PARA BUSCAR</span>
                <span>{formatTime(playbackState.duration)}</span>
              </div>
              <TrackWaveform
                currentTrack={currentTrack}
                currentTime={playbackState.currentTime}
                duration={playbackState.duration}
                isPlaying={isPlaying}
                onSeek={onSeek}
                themeId={themeId}
              />
            </div>

            {/* Transport controls layout */}
            <div className="flex justify-center items-center gap-4 mt-2">
              <button 
                onClick={onPrev}
                disabled={tracks.length <= 1}
                className="p-3 bg-[#17191d] hover:bg-[#23272e] border border-[#2b3038] rounded-full text-[#f5f4f0] hover:text-amber-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Pista Anterior"
              >
                <SkipBack size={16} />
              </button>

              <button 
                onClick={onTogglePlay}
                disabled={tracks.length === 0}
                className="p-5 bg-amber-500 hover:bg-amber-600 text-[#0b0c0e] rounded-full transition-transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-amber-500/10"
                title={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
              </button>

              <button 
                onClick={onStop}
                disabled={tracks.length === 0}
                className="p-3 bg-[#17191d] hover:bg-[#23272e] border border-[#2b3038] rounded-full text-[#f5f4f0] hover:text-rose-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Detener"
              >
                <Square size={16} fill="currentColor" />
              </button>

              <button 
                onClick={onNext}
                disabled={tracks.length <= 1}
                className="p-3 bg-[#17191d] hover:bg-[#23272e] border border-[#2b3038] rounded-full text-[#f5f4f0] hover:text-amber-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Siguiente Pista"
              >
                <SkipForward size={16} />
              </button>
            </div>

            {/* Volume and utility row */}
            <div className="flex items-center justify-between border-t border-[#181a1d] pt-4 mt-1 gap-4">
              <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                <button 
                  onClick={onToggleMute}
                  className="text-[#8a939e] hover:text-[#f5f4f0] transition-colors cursor-pointer"
                >
                  {playbackState.isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input 
                  type="range"
                  min={0}
                  max={100}
                  value={playbackState.isMuted ? 0 : playbackState.volume * 100}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value) / 100)}
                  className="w-full accent-emerald-500 bg-[#1f2126] h-1 rounded-lg appearance-none cursor-pointer"
                  title="Volumen"
                />
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={onToggleLoop}
                  className={`text-[10px] font-mono font-bold tracking-wider px-2 py-1 rounded border uppercase transition-colors cursor-pointer ${
                    playbackState.loop 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' 
                      : 'bg-[#121519] text-[#5e6675] border-[#22252a] hover:text-[#f5f4f0]'
                  }`}
                >
                  Bucle {playbackState.loop ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* Style Themes & Animated Graphics Selection */}
          <div className="bg-[#0e1013] border border-[#1b1c1e] rounded-lg p-5">
            <h2 className="font-display font-medium text-xs uppercase tracking-wider text-[#e2e8f0] border-b border-[#1b1c1e] pb-3 mb-4 flex items-center gap-2">
              <Palette size={14} className="text-amber-500 animate-pulse" />
              <span>Estilo Visual & Animaciones</span>
            </h2>
            
            <p className="text-[11px] text-[#8a939e] leading-relaxed mb-4">
              Personaliza el entorno del reproductor y los elementos gráficos de la transmisión. Cada estilo tiene su propio fondo, ecualizadores y cajas de sonido.
            </p>

            <div className="grid gap-3">
              {THEMES.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isActive={themeId === theme.id}
                  onChange={onChangeTheme}
                />
              ))}
            </div>
          </div>

          {/* Audio Analyzer Type Selection */}
          <div className="bg-[#0e1013] border border-[#1b1c1e] rounded-lg p-5">
            <h2 className="font-display font-medium text-xs uppercase tracking-wider text-[#e2e8f0] border-b border-[#1b1c1e] pb-3 mb-4 flex items-center gap-2">
              <Sliders size={14} className="text-emerald-500 animate-pulse" />
              <span>Tipo de Analizador de Audio</span>
            </h2>
            
            <p className="text-[11px] text-[#8a939e] leading-relaxed mb-4">
              Cambia el motor gráfico del ecualizador central en tiempo real. Configura la estética visual que mejor se adapte a tu sesión o transmisión.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  id: 'spectrogram' as const,
                  name: 'Barras de Espectro',
                  tag: 'CLASSIC VU',
                  desc: 'Clásico ecualizador de frecuencias con barras y picos de retención.',
                  color: 'border-emerald-500/25 text-emerald-400 hover:border-emerald-500/40 bg-emerald-500/5',
                  activeColor: 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold shadow-md',
                },
                {
                  id: 'oscilloscope' as const,
                  name: 'Osciloscopio',
                  tag: 'PHOSPHOR WAVE',
                  desc: 'Línea de onda sinusoidal brillante y fluida estilo fósforo analógico.',
                  color: 'border-cyan-500/25 text-cyan-400 hover:border-cyan-500/40 bg-cyan-500/5',
                  activeColor: 'border-cyan-400 bg-cyan-400/10 text-cyan-400 font-semibold shadow-md',
                },
                {
                  id: 'radial' as const,
                  name: 'Frecuencia Radial',
                  tag: 'SOUND RING',
                  desc: 'Anillo circular reactivo que se expande y expulsa partículas al ritmo.',
                  color: 'border-purple-500/25 text-purple-400 hover:border-purple-500/40 bg-purple-500/5',
                  activeColor: 'border-purple-400 bg-purple-400/10 text-purple-400 font-semibold shadow-md',
                },
                {
                  id: 'vu-analog' as const,
                  name: 'Agujas Analógicas',
                  tag: 'RETRO NEEDLE',
                  desc: 'Par de agujas físicas electromecánicas clásicas de alta fidelidad.',
                  color: 'border-amber-500/25 text-amber-400 hover:border-amber-500/40 bg-amber-500/5',
                  activeColor: 'border-amber-500 bg-amber-500/10 text-amber-500 font-semibold shadow-md',
                },
                {
                  id: 'matrix' as const,
                  name: 'Lluvia Digital',
                  tag: 'SOUND MATRIX',
                  desc: 'Bloques de código digital binario cayendo según la amplitud de sonido.',
                  color: 'border-teal-500/25 text-teal-400 hover:border-teal-500/40 bg-teal-500/5',
                  activeColor: 'border-teal-400 bg-teal-400/10 text-teal-400 font-semibold shadow-md',
                },
                {
                  id: 'grid-3d' as const,
                  name: 'Rejilla LED 3D',
                  tag: '3D GRID',
                  desc: 'Bloques de píxeles LED con extrusión e inclinación isométrica 3D.',
                  color: 'border-rose-500/25 text-rose-400 hover:border-rose-500/40 bg-rose-500/5',
                  activeColor: 'border-rose-500 bg-rose-500/10 text-rose-400 font-semibold shadow-md',
                },
              ].map((viz) => {
                const isActive = visualizerType === viz.id;
                return (
                  <button
                    key={viz.id}
                    onClick={() => onChangeVisualizer(viz.id)}
                    className={`text-left p-3 rounded border flex flex-col justify-between transition-all duration-300 cursor-pointer h-[100px] ${
                      isActive ? viz.activeColor : viz.color
                    }`}
                  >
                    <div className="w-full flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider truncate mr-1">{viz.name}</span>
                      <span className="text-[7px] font-mono font-extrabold px-1.5 py-0.2 bg-white/10 rounded tracking-widest shrink-0">{viz.tag}</span>
                    </div>
                    <p className="text-[9px] text-[#8a939e] leading-snug mt-1 flex-1">
                      {viz.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Soundclash FX Synthesizer Board */}
          <SoundclashFXBoard 
            onPullUp={onPullUp}
            isPlaying={isPlaying}
            onTriggerFlashMessage={onTriggerFlashMessage}
          />

          {/* Custom scrolling news ticker (cintillo) editor */}
          <div className="bg-[#0e1013] border border-[#1b1c1e] rounded-lg p-5 flex flex-col gap-3.5">
            <h2 className="font-display font-medium text-xs uppercase tracking-wider text-[#e2e8f0] border-b border-[#1b1c1e] pb-3 mb-2 flex items-center gap-2">
              <Sliders size={14} className="text-amber-500 animate-pulse" />
              <span>Cintillo de Transmisión</span>
            </h2>
            <p className="text-[11px] text-[#8a939e] leading-relaxed">
              Edita el texto continuo que se desplaza en la parte inferior de la pantalla del Modo Transmisión (ideal para avisos, redes o saludos).
            </p>
            <div className="flex flex-col gap-2">
              <textarea 
                value={tickerText}
                onChange={(e) => onUpdateTickerText(e.target.value)}
                rows={3}
                className="w-full bg-[#121519] border border-[#27292f] rounded px-3 py-2 text-xs font-mono text-[#f5f4f0] focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                placeholder="Escribe el texto aquí..."
              />
              <div className="flex justify-between items-center text-[9px] font-mono text-[#5e6675]">
                <span>Sugerencia: Puedes usar emojis de leones (🦁) y radios (📻) para decorar.</span>
                <span>{tickerText.length} caracteres</span>
              </div>
            </div>
          </div>

          {/* Dedicated Metadata Inspector/Editor */}
          <div className="bg-[#0e1013] border border-[#1b1c1e] rounded-lg p-5">
            <h2 className="font-display font-medium text-xs uppercase tracking-wider text-[#e2e8f0] border-b border-[#1b1c1e] pb-3 mb-4 flex justify-between items-center">
              <span>Editor de Metadata</span>
              {editingTrackId && (
                <span className="text-[9px] px-2 py-0.5 bg-amber-500/10 text-amber-500 font-mono rounded uppercase">
                  Editando
                </span>
              )}
            </h2>

            {editingTrackId ? (
              <div className="flex flex-col gap-3.5">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#8a939e] mb-1.5">Título del Tema</label>
                  <input 
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="w-full bg-[#121519] border border-[#27292f] rounded px-3 py-2 text-sm text-[#f5f4f0] focus:outline-none focus:border-amber-500"
                    placeholder="None Shall Escape the Judgment"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#8a939e] mb-1.5">Artista / Sound System</label>
                  <input 
                    type="text"
                    value={tempArtist}
                    onChange={(e) => setTempArtist(e.target.value)}
                    className="w-full bg-[#121519] border border-[#27292f] rounded px-3 py-2 text-sm text-[#f5f4f0] focus:outline-none focus:border-amber-500"
                    placeholder="Johnny Clarke"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#8a939e] mb-1.5">Estilo Reggae</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Roots', 'Dub', 'Steppers', 'Dancehall'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setTempGenre(g as any)}
                        className={`text-xs px-2.5 py-2 rounded border uppercase font-mono tracking-wider transition-all cursor-pointer ${
                          tempGenre === g 
                            ? 'bg-amber-500 border-amber-500 text-[#0b0c0e] font-bold' 
                            : 'bg-[#121519] border-[#22252a] text-[#8a939e] hover:border-[#383d47]'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={saveMetadata}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-[#0b0c0e] font-display font-semibold uppercase text-xs py-2.5 rounded transition-colors cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                  <button 
                    onClick={() => setEditingTrackId(null)}
                    className="px-4 bg-[#1b1c1e] hover:bg-[#27292f] border border-[#2c2e33] text-[#8a939e] hover:text-[#f5f4f0] font-display uppercase text-xs py-2.5 rounded transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : currentTrack ? (
              <div className="text-center py-4">
                <p className="text-xs text-[#8a939e] italic mb-3">
                  ¿La metadata no vino perfecta? Puedes corregirla aquí.
                </p>
                <button 
                  onClick={() => startEditing(currentTrack)}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#17191d] hover:bg-[#23272e] border border-[#272a30] text-amber-500 hover:text-amber-400 text-xs uppercase tracking-wider rounded font-medium transition-colors cursor-pointer"
                >
                  <Sliders size={12} />
                  Editar Tema Actual
                </button>
              </div>
            ) : (
              <div className="text-center py-6 text-[#5e6675]">
                <Sliders size={24} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs">Carga y selecciona un tema para editar su metadata</p>
              </div>
            )}
          </div>
        </section>

      </div>

      {/* Operator Footer Status */}
      <footer className="border-t border-[#121519] bg-[#07080a] py-3 px-6 text-center text-[10px] font-mono text-[#5e6675] flex flex-col sm:flex-row justify-between items-center gap-2 mt-auto">
        <div>RADIO RUGIDO PLAYER v1.0.0 — CABIN INTERFACE</div>
        <div>STABLE WEB AUDIO EMULATION — OPERATED BY NEGUS SELECTER</div>
      </footer>
    </div>
  );
};
