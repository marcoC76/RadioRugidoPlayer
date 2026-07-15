import React from 'react';
import { RadioThemeId, ThemeDefinition } from '@/src/types';

const GRADIENT_COLORS: Record<RadioThemeId, string[]> = {
  roots: ['#10b981', '#f59e0b', '#ef4444'],
  dub: ['#06b6d4', '#6366f1', '#ec4899'],
  steppers: ['#facc15', '#f97316', '#ef4444'],
  retro: ['#78350f', '#b45309', '#f59e0b'],
};

const BAR_CONFIG: Record<RadioThemeId, number[]> = {
  roots: [70, 45, 90, 55],
  dub: [55, 80, 40, 75],
  steppers: [85, 50, 75, 60],
  retro: [40, 65, 50, 80],
};

interface ThemeCardProps {
  theme: ThemeDefinition;
  isActive: boolean;
  onChange: (id: RadioThemeId) => void;
}

export const ThemeCard: React.FC<ThemeCardProps> = ({ theme, isActive, onChange }) => {
  const colors = GRADIENT_COLORS[theme.id];
  const bars = BAR_CONFIG[theme.id];

  return (
    <button
      onClick={() => onChange(theme.id)}
      className={`w-full text-left rounded-lg border transition-all duration-200 cursor-pointer overflow-hidden
        ${isActive
          ? 'border-amber-500 bg-amber-500/[0.03] shadow-[0_0_20px_rgba(245,158,11,0.08)]'
          : 'border-[#1b1c1e] bg-[#0e1013] hover:border-[#2c2e33]'
        }`}
    >
      <div className="flex gap-4">
        {/* Preview visual panel */}
        <div
          className="w-[120px] h-[96px] shrink-0 rounded-l-lg relative overflow-hidden"
          style={{ backgroundImage: theme.cabin.previewGradient }}
        >
          {/* Color dots */}
          <div className="absolute top-2 left-2 flex gap-1">
            {colors.map((c, i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* VU bars */}
          <div className="absolute bottom-4 inset-x-2 flex items-end gap-[3px] h-10">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm opacity-80"
                style={{
                  height: `${h}%`,
                  backgroundColor: colors[i % colors.length],
                  boxShadow: `0 0 6px ${colors[i % colors.length]}40`,
                }}
              />
            ))}
          </div>

          {/* Baseline */}
          <div className="absolute bottom-2 inset-x-2 h-[1px] opacity-30"
            style={{ backgroundColor: colors[1] }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 py-3 pr-3 flex flex-col justify-center gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-[#f5f4f0] truncate">
              {theme.name}
            </span>
            {isActive && (
              <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono uppercase tracking-widest">
                Activo
              </span>
            )}
          </div>
          <p className="text-[10px] text-[#8a939e] leading-relaxed line-clamp-2">
            {theme.desc}
          </p>
        </div>
      </div>
    </button>
  );
};
