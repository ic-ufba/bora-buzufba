import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, MapPin, Bus, Heart, Info } from 'lucide-react';

const navigationItems = [
  {
    id: 'home',
    label: 'Início',
    icon: Home,
    path: '/'
  },
  {
    id: 'stations',
    label: 'Pontos',
    icon: MapPin,
    path: '/stations'
  },
  {
    id: 'lines',
    label: 'Linhas',
    icon: Bus,
    path: '/lines'
  },
  {
    id: 'favorites',
    label: 'Favoritos',
    icon: Heart,
    path: '/favorites'
  },
  {
    id: 'notes',
    label: 'Notas',
    icon: Info,
    path: '/notes'
  }
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="max-w-md mx-auto">
        <div className="flex overflow-x-auto scrollbar-hide">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex-1 flex flex-col items-center py-3 px-2 transition-colors ${
                  active 
                    ? 'text-bus-blue' 
                    : 'text-muted-foreground hover:text-bus-text'
                }`}
              >
                <Icon 
                  className={`w-6 h-6 mb-1 ${active ? 'text-bus-blue' : ''}`} 
                />
                <span className={`text-xs font-medium ${active ? 'text-bus-blue' : ''}`}>
                  {item.label}
                </span>
                {active && (
                  <div className="w-8 h-0.5 bg-bus-blue rounded-full mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};