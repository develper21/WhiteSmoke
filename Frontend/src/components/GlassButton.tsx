import React, { FC, ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export const GlassButton: FC<Props> = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseClasses =
    'px-6 py-2 rounded-xl backdrop-blur-md border font-medium transition-all duration-300';

  const variantClasses = {
    primary: 'bg-white/10 border-white/20 text-white hover:bg-white/20',
    secondary: 'bg-ice/10 border-ice/30 text-ice hover:bg-ice/20',
    danger: 'bg-red-500/10 border-red-500/30 text-red-200 hover:bg-red-500/20',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
