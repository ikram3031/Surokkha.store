import React from 'react';
import { Layers, Shield, Zap, Droplets, Gift } from 'lucide-react';
import { toBengaliNumber } from '../utils/formatters';

export const CategoryFilter = ({ activeCategory, onSelectCategory, categoryCounts }) => {
  const categories = [
    { id: 'all', label: 'সকল প্রোডাক্ট', icon: Layers },
    { id: 'condom', label: 'কনডম', icon: Shield },
    { id: 'spray', label: 'লং টাইম স্প্রে', icon: Zap },
    { id: 'lubricant', label: 'লুব্রিকেন্ট জেল', icon: Droplets },
    { id: 'combo', label: 'কম্বো অফার', icon: Gift },
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-3">
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-max px-1">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count = categoryCounts[cat.id] ?? 0;
          const Icon = cat.icon;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40 ring-2 ring-emerald-400/40'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-600'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{cat.label}</span>
              <span
                className={`text-[11px] sm:text-xs px-1.5 py-0.2 rounded-full font-bold ml-1 ${
                  isActive
                    ? 'bg-emerald-700/80 text-white'
                    : 'bg-slate-700/70 text-slate-400'
                }`}
              >
                {toBengaliNumber(count)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
