import React, { useState, useMemo } from 'react';
import { Button } from './button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Card } from './card';
import { Badge } from './badge';
import { ArrowUpDown, Navigation, Route, Check, ChevronsUpDown } from 'lucide-react';
import { stops, findLinesByRoute, getValidDestinations } from '@/data/busData';
import { RoutePlannerState } from '@/types/bus';
import { cn } from '@/lib/utils';

interface RoutePlannerProps {
  onRouteSelect: (origin?: string, destination?: string) => void;
  className?: string;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({ onRouteSelect, className }) => {
  const [state, setState] = useState<RoutePlannerState>({
    origin: undefined,
    destination: undefined,
    isActive: false
  });

  // Estados para controlar abertura dos popovers
  const [originOpen, setOriginOpen] = useState(false);
  const [destinationOpen, setDestinationOpen] = useState(false);

  const availableDestinations = useMemo(() => {
    if (!state.origin) return [];
    return getValidDestinations(state.origin);
  }, [state.origin]);

  const foundLines = useMemo(() => {
    if (!state.origin || !state.destination) return [];
    return findLinesByRoute(state.origin, state.destination);
  }, [state.origin, state.destination]);

  const [renderKey, setRenderKey] = useState(0);

  const getOriginName = () => {
    if (!state.origin) return '';
    const originStop = stops.find(stop => stop.id === state.origin);
    return originStop?.name || '';
  };

  const getDestinationName = () => {
    if (!state.destination) return '';
    const destinationStop = stops.find(stop => stop.id === state.destination);
    return destinationStop?.name || '';
  };

  // Função para truncar texto longo mantendo legibilidade
  const truncateText = (text: string, maxLength: number = 25) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  const handleOriginChange = (originId: string) => {
    setState(prev => ({
      ...prev,
      origin: originId,
      destination: undefined,
      isActive: false
    }));
    setOriginOpen(false); 
    setRenderKey(prev => prev + 1); 
    onRouteSelect(originId, undefined);
  };

  const handleDestinationChange = (destinationId: string) => {
    setState(prev => ({
      ...prev,
      destination: destinationId,
      isActive: true
    }));
    setDestinationOpen(false); 
    setRenderKey(prev => prev + 1); 
    onRouteSelect(state.origin, destinationId);
  };

  const handleSwap = () => {
    if (state.origin && state.destination) {
      setState(prev => ({
        ...prev,
        origin: prev.destination,
        destination: prev.origin
      }));
      onRouteSelect(state.destination, state.origin);
    }
  };

  const handleClear = () => {
    setState({
      origin: undefined,
      destination: undefined,
      isActive: false
    });
    onRouteSelect(undefined, undefined);
  };

  return (
    <div key={renderKey} className={`p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <Route className="w-5 h-5 text-white" />
          <h3 className="font-semibold text-white">Planejar Rota</h3>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <label className="text-sm font-medium text-white/90 mb-1 block">
              De onde você está?
            </label>
            <Popover open={originOpen} onOpenChange={setOriginOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={originOpen}
                  key={`origin-button-${state.origin}-${renderKey}`}
                  className={cn(
                    'w-full justify-between bg-white/20 border-white/30 text-white hover:bg-white/25 hover:text-white',
                    !state.origin && 'text-white/70'
                  )}
                >
                  {state.origin ? truncateText(getOriginName()) : "Selecione o ponto de origem"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0">
                <Command>
                  <CommandInput placeholder="Buscar ponto..." />
                  <CommandEmpty>Nenhum ponto encontrado.</CommandEmpty>
                  <CommandGroup>
                    <div className="max-h-60 overflow-y-auto">
                      {stops.map((stop) => (
                        <CommandItem
                          key={`origin-${stop.id}`}
                          value={stop.name}
                          onSelect={() => handleOriginChange(stop.id)}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              state.origin === stop.id ? 'opacity-100 text-blue-500' : 'opacity-0'
                            )}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium">{stop.name}</div>
                              {stop.isNew && (
                                <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:bg-blue-900/40">
                                  Novo
                                </Badge>
                              )}
                            </div>
                            {stop.location && (
                              <div className="text-sm text-muted-foreground">{stop.location}</div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </div>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Botão de troca só aparece quando ambos campos estão preenchidos */}
          {state.origin && state.destination && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSwap}
                className="p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200"
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Campo de destino só aparece após origem ser selecionada */}
          {state.origin && (
            <div className="relative animate-in slide-in-from-top-2 duration-300">
              <label className="text-sm font-medium text-white/90 mb-1 block">
                Para onde você vai?
              </label>
              <Popover open={destinationOpen} onOpenChange={setDestinationOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={destinationOpen}
                    className={cn(
                      'w-full justify-between bg-white/20 border-white/30 text-white hover:bg-white/25 hover:text-white',
                      !state.destination && 'text-white/70'
                    )}
                  >
                    {state.destination ? truncateText(getDestinationName()) : "Selecione o destino"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0">
                  <Command>
                    <CommandInput placeholder="Buscar destino..." />
                    <CommandEmpty>Nenhum destino encontrado.</CommandEmpty>
                    <CommandGroup>
                      <div className="max-h-60 overflow-y-auto">
                        {availableDestinations.map((stop) => (
                          <CommandItem
                            key={`destination-${stop.id}`}
                            value={stop.name}
                            onSelect={() => handleDestinationChange(stop.id)}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                state.destination === stop.id ? 'opacity-100 text-blue-500' : 'opacity-0'
                              )}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{stop.name}</div>
                                {stop.isNew && (
                                  <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:bg-blue-900/40">
                                    Novo
                                  </Badge>
                                )}
                              </div>
                              {stop.location && (
                                <div className="text-sm text-muted-foreground">{stop.location}</div>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </div>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {state.isActive && (
            <div className="flex items-center justify-between p-3 bg-white/15 rounded-xl border border-white/20 animate-in slide-in-from-top-2 duration-300 shadow-sm">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Navigation className="w-4 h-4 text-white flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/80 font-medium mb-0.5">Rota ativa</div>
                  <div className="text-sm text-white font-medium break-words leading-tight">
                    {getOriginName()} → {getDestinationName()}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-white/80 hover:text-white hover:bg-white/20 h-8 px-2 ml-2 flex-shrink-0"
              >
                Limpar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};