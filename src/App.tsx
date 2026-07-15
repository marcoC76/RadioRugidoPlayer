import { useState, useEffect, useRef } from 'react';
import { Track, PlaybackState, ReggaeGenre, RadioThemeId, VisualizerType } from './types';
import { CabinView } from './components/CabinView';
import { BroadcastView } from './components/BroadcastView';

// Helper to extract audio duration using offscreen element
const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;
    
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
      URL.revokeObjectURL(objectUrl);
    });
    
    audio.addEventListener('error', () => {
      resolve(180); // Default to 3 minutes fallback
      URL.revokeObjectURL(objectUrl);
    });
  });
};

// Smart parser for Reggae track names
const parseFileName = (fileName: string) => {
  // Strip extension
  const lastDot = fileName.lastIndexOf('.');
  const nameWithoutExt = lastDot !== -1 ? fileName.substring(0, lastDot) : fileName;
  
  // Clean bracket info (e.g. [1975 Roots], (Dub Edit))
  const cleanName = nameWithoutExt.replace(/[\[\(].*?[\]\)]/g, '').trim();

  // Try splitting by common separator (e.g., -)
  const parts = cleanName.split(/\s*-\s*/);
  if (parts.length >= 2) {
    const artist = parts[0].trim();
    const title = parts.slice(1).join(' - ').trim();
    return { artist, title };
  }
  
  return { artist: 'Negus Selecter Dubplate', title: cleanName };
};

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'cabin' | 'broadcast'>('cabin');
  const [themeId, setThemeId] = useState<RadioThemeId>('roots');
  const [visualizerType, setVisualizerType] = useState<VisualizerType>('spectrogram');
  const [tickerText, setTickerText] = useState<string>(
    "🦁 ¡ÚNETE A LA MANADA! SÍGUENOS EN INSTAGRAM, TIKTOK Y YOUTUBE: @RADIORUGIDO 🦁 | 📻 TRANSMITIENDO EN VIVO CON LO MEJOR DEL REGGAE, ROOTS, DUBPLATE & SOUND SYSTEM POR NEGUS SELECTER 📻 | 🔥 SESIÓN EN DIRECTO - ENTRANDO EN SINTONÍA DESDE LA CABINA OFICIAL 🔥"
  );
  
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    loop: false,
  });

  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const flashTimeoutRef = useRef<any | null>(null);

  const triggerFlashMessage = (msg: string) => {
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }
    setFlashMessage(msg);
    flashTimeoutRef.current = setTimeout(() => {
      setFlashMessage(null);
    }, 3500);
  };

  const handlePullUp = () => {
    const audio = audioRef.current;
    if (audio) {
      // Pause track immediately for dramatic sound clash effect
      audio.pause();
      setIsPlaying(false);
      
      // Reset position to 0
      audio.currentTime = 0;
      setPlaybackState(prev => ({
        ...prev,
        currentTime: 0,
        isPlaying: false,
      }));

      // Delay playing to let the vinyl rewind effect play out
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => {
              setIsPlaying(true);
              setPlaybackState(prev => ({ ...prev, isPlaying: true }));
            })
            .catch(e => {
              console.log("Play failed after pullup:", e);
              setIsPlaying(false);
            });
        }
      }, 950);
    }
  };

  // Clean up flash timer
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedTrackIdRef = useRef<string | null>(null);

  // Initialize Audio element once
  if (typeof window !== 'undefined' && !audioRef.current) {
    audioRef.current = new Audio();
  }

  // Effect to load and play selected track
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentTrack = tracks[currentTrackIndex];
    if (currentTrack) {
      if (loadedTrackIdRef.current !== currentTrack.id) {
        loadedTrackIdRef.current = currentTrack.id;
        const wasPlaying = isPlaying;
        
        audio.src = currentTrack.objectUrl;
        audio.volume = playbackState.isMuted ? 0 : playbackState.volume;
        audio.muted = playbackState.isMuted;
        audio.loop = playbackState.loop;
        audio.load();
        
        if (wasPlaying) {
          audio.play().catch(err => {
            console.warn("Autoplay deferred:", err);
            setIsPlaying(false);
          });
        } else {
          setPlaybackState(prev => ({
            ...prev,
            currentTime: 0,
            duration: currentTrack.duration,
          }));
        }
      }
    } else {
      loadedTrackIdRef.current = null;
      audio.src = '';
      setIsPlaying(false);
      setPlaybackState(prev => ({
        ...prev,
        currentTime: 0,
        duration: 0,
      }));
    }
  }, [currentTrackIndex, tracks]);

  // Sync event listeners with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    
    const onTimeUpdate = () => {
      setPlaybackState(prev => ({
        ...prev,
        currentTime: audio.currentTime,
      }));
    };

    const onDurationChange = () => {
      setPlaybackState(prev => ({
        ...prev,
        duration: audio.duration || 0,
      }));
    };

    const onEnded = () => {
      if (audio.loop) {
        try {
          audio.currentTime = 0;
        } catch (e) {}
        audio.play().catch(e => console.log("Loop replay failed:", e));
      } else {
        // Autoplay next track in queue
        if (tracks.length > 1) {
          setCurrentTrackIndex(prevIndex => {
            const nextIdx = (prevIndex + 1) % tracks.length;
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.play().catch(e => {
                  console.log("Autoplay next failed:", e);
                  setIsPlaying(false);
                });
              }
            }, 50);
            return nextIdx;
          });
        } else {
          setIsPlaying(false);
          try {
            audio.currentTime = 0;
          } catch (e) {}
        }
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
    };
  }, [tracks]);

  // Clean up Object URLs on unmount
  useEffect(() => {
    return () => {
      tracks.forEach(t => URL.revokeObjectURL(t.objectUrl));
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Handler functions for cabin controls
  const handleAddTracks = async (files: FileList) => {
    const newTracks: Track[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const duration = await getAudioDuration(file);
      const { artist, title } = parseFileName(file.name);
      const objectUrl = URL.createObjectURL(file);
      
      // Auto assign tags based on keywords
      let defaultGenre: ReggaeGenre = 'Roots';
      const lowercaseName = file.name.toLowerCase();
      if (lowercaseName.includes('dub')) defaultGenre = 'Dub';
      else if (lowercaseName.includes('stepper')) defaultGenre = 'Steppers';
      else if (lowercaseName.includes('dancehall')) defaultGenre = 'Dancehall';

      newTracks.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
        title,
        artist,
        genre: defaultGenre,
        file,
        objectUrl,
        duration,
      });
    }

    setTracks(prev => {
      const updated = [...prev, ...newTracks];
      return updated;
    });
  };

  const handleRemoveTrack = (id: string) => {
    const trackToRemove = tracks.find(t => t.id === id);
    if (trackToRemove) {
      URL.revokeObjectURL(trackToRemove.objectUrl);
    }

    const updatedTracks = tracks.filter(t => t.id !== id);
    setTracks(updatedTracks);

    // If currently playing track was removed, handle index shifts
    const isPlayingCurrentRemoved = tracks[currentTrackIndex]?.id === id;
    if (isPlayingCurrentRemoved) {
      if (updatedTracks.length === 0) {
        setCurrentTrackIndex(0);
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
      } else {
        const nextIdx = Math.max(0, currentTrackIndex - 1);
        setCurrentTrackIndex(nextIdx % updatedTracks.length);
      }
    } else if (currentTrackIndex >= updatedTracks.length && updatedTracks.length > 0) {
      setCurrentTrackIndex(updatedTracks.length - 1);
    }
  };

  const handleClearPlaylist = () => {
    tracks.forEach(t => URL.revokeObjectURL(t.objectUrl));
    setTracks([]);
    setCurrentTrackIndex(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };

  const handleSelectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setTimeout(() => {
      const audio = audioRef.current;
      if (audio) {
        audio.volume = playbackState.isMuted ? 0 : playbackState.volume;
        audio.muted = playbackState.isMuted;
        audio.loop = playbackState.loop;
        audio.play().catch(e => {
          console.warn("Play failed:", e);
          setIsPlaying(false);
        });
      }
    }, 50);
  };

  const handleUpdateTrackMetadata = (id: string, updatedFields: Partial<Track>) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updatedFields } : t));
  };

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio || tracks.length === 0) return;

    const currentTrack = tracks[currentTrackIndex];
    if (!currentTrack) return;

    if (!audio.src || audio.src === '' || loadedTrackIdRef.current !== currentTrack.id) {
      audio.src = currentTrack.objectUrl;
      loadedTrackIdRef.current = currentTrack.id;
      audio.load();
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.volume = playbackState.isMuted ? 0 : playbackState.volume;
      audio.muted = playbackState.isMuted;
      audio.loop = playbackState.loop;

      audio.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(err => {
          console.warn("Audio play failed, reloading...", err);
          try {
            audio.load();
            audio.play()
              .then(() => setIsPlaying(true))
              .catch(retryErr => {
                console.error("Audio block persistent after reload:", retryErr);
                setIsPlaying(false);
              });
          } catch (e) {
            console.error("Error reloading audio:", e);
            setIsPlaying(false);
          }
        });
    }
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch (e) {
      console.warn("Stop set currentTime error:", e);
    }
    setIsPlaying(false);
    setPlaybackState(prev => ({ ...prev, currentTime: 0 }));
  };

  const handleNext = () => {
    if (tracks.length === 0) return;
    const nextIdx = (currentTrackIndex + 1) % tracks.length;
    handleSelectTrack(nextIdx);
  };

  const handlePrev = () => {
    if (tracks.length === 0) return;
    const prevIdx = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    handleSelectTrack(prevIdx);
  };

  const handleSeek = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.currentTime = time;
    } catch (e) {
      console.warn("Seek error:", e);
    }
    setPlaybackState(prev => ({ ...prev, currentTime: time }));
  };

  const handleVolumeChange = (vol: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = vol;
    setPlaybackState(prev => ({
      ...prev,
      volume: vol,
      isMuted: vol === 0,
    }));
  };

  const handleToggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextMute = !playbackState.isMuted;
    audio.muted = nextMute;
    setPlaybackState(prev => ({ ...prev, isMuted: nextMute }));
  };

  const handleToggleLoop = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextLoop = !playbackState.loop;
    audio.loop = nextLoop;
    setPlaybackState(prev => ({ ...prev, loop: nextLoop }));
  };

  const handleReorderTracks = (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) return;
    const result = Array.from(tracks);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    // Keep the active track selected by adjusting currentTrackIndex
    let nextIndex = currentTrackIndex;
    if (currentTrackIndex === startIndex) {
      nextIndex = endIndex;
    } else if (currentTrackIndex > startIndex && currentTrackIndex <= endIndex) {
      nextIndex = currentTrackIndex - 1;
    } else if (currentTrackIndex < startIndex && currentTrackIndex >= endIndex) {
      nextIndex = currentTrackIndex + 1;
    }

    setTracks(result);
    setCurrentTrackIndex(nextIndex);
  };

  // Keyboard shortcuts for playback control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when user is typing in form inputs, textareas, or editable elements
      const target = e.target as HTMLElement;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handleTogglePlay();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          handlePrev();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleTogglePlay, handleNext, handlePrev]);

  // Switch modes
  const handleSwitchToBroadcast = () => {
    if (tracks.length > 0) {
      setViewMode('broadcast');
    }
  };

  const handleReturnToCabin = () => {
    setViewMode('cabin');
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-[#f5f4f0] antialiased selection:bg-amber-500/30 selection:text-white">
      {viewMode === 'cabin' ? (
        <CabinView 
          tracks={tracks}
          currentTrackIndex={currentTrackIndex}
          isPlaying={isPlaying}
          playbackState={{ ...playbackState, isPlaying }}
          onAddTracks={handleAddTracks}
          onRemoveTrack={handleRemoveTrack}
          onClearPlaylist={handleClearPlaylist}
          onSelectTrack={handleSelectTrack}
          onUpdateTrackMetadata={handleUpdateTrackMetadata}
          onTogglePlay={handleTogglePlay}
          onStop={handleStop}
          onNext={handleNext}
          onPrev={handlePrev}
          onSeek={handleSeek}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onToggleLoop={handleToggleLoop}
          onSwitchToBroadcast={handleSwitchToBroadcast}
          themeId={themeId}
          onChangeTheme={setThemeId}
          visualizerType={visualizerType}
          onChangeVisualizer={setVisualizerType}
          onReorderTracks={handleReorderTracks}
          onPullUp={handlePullUp}
          flashMessage={flashMessage}
          onTriggerFlashMessage={triggerFlashMessage}
          tickerText={tickerText}
          onUpdateTickerText={setTickerText}
        />
      ) : (
        <BroadcastView 
          tracks={tracks}
          currentTrackIndex={currentTrackIndex}
          isPlaying={isPlaying}
          playbackState={{ ...playbackState, isPlaying }}
          onReturnToCabin={handleReturnToCabin}
          themeId={themeId}
          visualizerType={visualizerType}
          flashMessage={flashMessage}
          onTriggerFlashMessage={triggerFlashMessage}
          tickerText={tickerText}
          onSeek={handleSeek}
        />
      )}
    </div>
  );
}
