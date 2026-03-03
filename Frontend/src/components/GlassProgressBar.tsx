import React, { FC } from 'react';

interface Props {
  progress: number; // 0-100
  label?: string;
}

export const GlassProgressBar: FC<Props> = ({ progress, label }) => {
  return (
    <div>
      {label && <p className="text-sm text-gray-300 mb-2">{label}</p>}
      <div className="w-full h-2 bg-white/10 rounded-full border border-white/20 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-ice/40 to-ice/80 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">{progress}%</p>
    </div>
  );
};
