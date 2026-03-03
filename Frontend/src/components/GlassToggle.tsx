import React, { FC } from 'react';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const GlassToggle: FC<Props> = ({ checked, onChange, label }) => {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-14 h-8 rounded-full backdrop-blur-md border ${
          checked
            ? 'bg-ice/30 border-ice/50'
            : 'bg-white/10 border-white/20'
        } transition-all duration-300`}
      >
        <div
          className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white/40 transition-transform duration-300 ${
            checked ? 'translate-x-6' : ''
          }`}
        />
      </button>
      {label && <span className="text-sm text-white">{label}</span>}
    </div>
  );
};
