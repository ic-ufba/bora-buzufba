import React from 'react';
import { ThemeToggle } from '@/components/theme/theme-toggle';

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
  toggleClassName?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  className = "bg-gradient-primary",
  contentClassName = "relative px-6 pt-8 pb-4 rounded-b-[2rem] shadow-xl",
  titleClassName = "text-2xl font-bold text-white tracking-tight drop-shadow-sm pt-1",
  toggleClassName = "absolute right-3 top-3"
}) => {
  return (
    <div className={`${className} text-white relative overflow-hidden`}>
      {/* Subtle background pattern for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
      
      <div className={contentClassName}>
        <div className="max-w-md mx-auto">
          <div className="relative">
            {/* Theme toggle positioned at the top right */}
            <div className={toggleClassName}>
              <ThemeToggle />
            </div>
            
            {/* Main title */}
            <div className="text-center">
              <h1 className={titleClassName}>
                {title}
              </h1>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom highlight line */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/30 rounded-full" />
    </div>
  );
};