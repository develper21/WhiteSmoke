import React, { FC } from 'react';

interface Props {
  className?: string;
  children: React.ReactNode;
}

export const GlassCard: FC<Props> = ({ children, className = '' }) => (
  <div
    className={`bg-white/10 backdrop-blur-md rounded-2xl shadow-inner border border-white/20 ${className}`}
  >
    {children}
  </div>
);
