import React, { FC, useEffect } from 'react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Props {
  type: NotificationType;
  message: string;
  onClose?: () => void;
  duration?: number;
}

export const GlassNotification: FC<Props> = ({
  type,
  message,
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const colorClasses = {
    info: 'bg-blue-500/20 border-blue-500/50 text-blue-200',
    success: 'bg-green-500/20 border-green-500/50 text-green-200',
    warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200',
    error: 'bg-red-500/20 border-red-500/50 text-red-200',
  };

  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  return (
    <div
      className={`fixed top-4 right-4 px-6 py-4 rounded-lg backdrop-blur-md border ${colorClasses[type]} shadow-lg max-w-sm`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{icons[type]}</span>
        <div className="flex-1">
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white ml-2"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
