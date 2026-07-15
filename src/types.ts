export type ReggaeGenre = 'Roots' | 'Dub' | 'Steppers' | 'Dancehall';

export type RadioThemeId = 'roots' | 'dub' | 'steppers' | 'retro';

export interface BroadcastThemeConfig {
  bgGradient: string;
  accentClass: string;
  h1Class: string;
  subtitle: string;
  progressClass: string;
  badgeText: string;
  badgeStyle: string;
  indicatorStyle: string;
  glowPulseColor: string;
  textColor: string;
}

export interface CabinThemeConfig {
  borderClass: string;
  activeClass: string;
  accentDot: string;
  vuClass: string;
  barClass: string;
  previewGradient: string;
}

export interface ThemeDefinition {
  id: RadioThemeId;
  name: string;
  desc: string;
  broadcast: BroadcastThemeConfig;
  cabin: CabinThemeConfig;
}

export type VisualizerType = 'spectrogram' | 'oscilloscope' | 'radial' | 'vu-analog' | 'matrix' | 'grid-3d';

export interface Track {
  id: string;
  title: string;
  artist: string;
  genre: ReggaeGenre;
  file: File;
  objectUrl: string;
  duration: number; // in seconds
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0 to 1
  isMuted: boolean;
  loop: boolean;
}
