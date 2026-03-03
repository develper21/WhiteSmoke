import React, { useContext } from 'react';
import { ThemeContext } from '../theme';
import { GlassToggle } from './GlassToggle';

export const ThemeToggle: React.FC = () => {
  const { theme, toggle } = useContext(ThemeContext);
  return <GlassToggle checked={theme === 'dark'} onChange={() => toggle()} label="Dark mode" />;
};
