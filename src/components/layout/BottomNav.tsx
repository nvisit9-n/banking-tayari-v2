import React from 'react';
import { BookOpen, Building2, Newspaper, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NavigationTab } from '../../types';
import { BrandLogo } from '../common/BrandLogo';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems: { tab: NavigationTab; label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
    { tab: 'home', label: 'Home' },
    { tab: 'courses', label: 'Courses', icon: BookOpen },
    { tab: 'quiz', label: 'संस्थान', icon: Building2 },
    { tab: 'current-affairs', label: 'Affairs', icon: Newspaper },
    { tab: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 safe-bottom">
      <nav className="flex items-center justify-around h-16 px-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;

          return (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`flex-1 flex flex-col items-center justify-center h-full py-1 transition-all ${
                isActive 
                  ? 'text-[#DC2626] font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-red-50 dark:bg-red-950/40 scale-105' : ''}`}>
                {item.tab === 'home' ? (
                  <BrandLogo variant="icon" className="w-5 h-5" />
                ) : (
                  Icon && <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
