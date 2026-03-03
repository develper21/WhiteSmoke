import React, { FC } from 'react';

interface NavItem {
  label: string;
  icon?: string;
  active?: boolean;
  onClick?: () => void;
}

interface Props {
  items: NavItem[];
  title?: string;
}

export const GlassSidebar: FC<Props> = ({ items, title = 'Menu' }) => {
  return (
    <div className="h-screen w-64 bg-white/5 backdrop-blur-md border-r border-white/10 flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">{title}</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {items.map((item, idx) => (
          <button
            key={idx}
            onClick={item.onClick}
            className={`w-full px-4 py-3 rounded-lg text-left transition-colors ${
              item.active
                ? 'bg-white/20 text-white'
                : 'text-gray-300 hover:bg-white/10'
            }`}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};
