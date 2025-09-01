import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { AlertsModal } from '@/components/ui/alerts-modal';
import { AlertOfferModal } from '@/components/ui/alert-offer-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Heart, HeartOff, Clock, MapPin, Bell, Info, Zap, GripVertical, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { lines, stops } from '@/data/busData';
import { calculateLineStatus, formatTimeRemaining, formatTimeSince } from '@/utils/timeUtils';
import { getBusDisplayName } from '@/utils/displayUtils';
import { useFollows } from '@/hooks/useFollows';
import { useFavoritesMeta, LineSource } from '@/hooks/useFavoritesMeta';
import { Line } from '@/types/bus';

const ORDER_STORAGE_KEY = 'borabuzufba-favorites-order';

const Favorites: React.FC = () => {
  const { 
    follows, 
    toggleFollow, 
    isFollowing, 
    toggleFollowLine, 
    isFollowingLineSource,
    showAlertOffer,
    setShowAlertOffer,
    alertOfferItem,
    setAlertOfferItem
  } = useFollows();
  const navigate = useNavigate();
  const { getLineSource } = useFavoritesMeta();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'lines' | 'stops'>('all');
  const [expandedLineIds, setExpandedLineIds] = useState<Set<string>>(new Set());
  const [expandedStopIds, setExpandedStopIds] = useState<Set<string>>(new Set());
  const [lineOrder, setLineOrder] = useState<string[]>([]);
  const [stopOrder, setStopOrder] = useState<string[]>([]);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [selectedAlertItem, setSelectedAlertItem] = useState<{
    type: 'line' | 'stop';
    id: string;
    name: string;
    direction?: 'ida' | 'volta';
  } | null>(null);
  const [removedItems, setRemovedItems] = useState<Set<string>>(new Set());
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showAlertOfferSetting, setShowAlertOfferSetting] = useState(() => {
    return localStorage.getItem('borabuz-hide-alert-offer') !== 'true';
  });

  // Function to toggle alert offer setting
  const toggleAlertOfferSetting = (enabled: boolean) => {
    setShowAlertOfferSetting(enabled);
    if (enabled) {
      localStorage.removeItem('borabuz-hide-alert-offer');
    } else {
      localStorage.setItem('borabuz-hide-alert-offer', 'true');
    }
  };

  // Initialize orders from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ORDER_STORAGE_KEY);
      if (stored) {
        const { lines: storedLines = [], stops: storedStops = [] } = JSON.parse(stored);
        setLineOrder(Array.isArray(storedLines) ? storedLines : []);
        setStopOrder(Array.isArray(storedStops) ? storedStops : []);
      }
    } catch (error) {
      console.error('Error loading favorites order:', error);
    }
  }, []);

  // Atualiza a lógica para extrair a direção do ID composto
  const favoriteLines = useMemo(() => {
    return Array.from(follows)
      .filter(follow => typeof follow === 'string' && follow.includes('::home::'))
      .map(follow => {
        const [lineId, , direction] = follow.split('::');
        const line = lines.find(l => l.id === lineId);
        if (!line) return null;
        
        // Nome da linha com a direção
        const displayName = direction === 'ida' || direction === 'volta'
          ? `${line.name} (${direction === 'ida' ? 'Ida' : 'Volta'})`
          : `${line.name} (Ida)`; // Padrão para itens legados
        
        return {
          ...line,
          displayName,
          direction: (direction as 'ida' | 'volta') || 'ida',
          compositeId: follow,
          originalLine: line // Keep reference to original line for function calls
        };
      })
      .filter(Boolean) as Array<Line & { 
        displayName: string; 
        direction: 'ida' | 'volta';
        compositeId: string; 
        originalLine: Line;
      }>;
  }, [follows, lines]);

  const followedLineKeys = useMemo(() => favoriteLines.map(e => e.compositeId), [favoriteLines]);
  const followedStopIds = useMemo(() =>
    Array.from(follows).filter(id => typeof id === 'string' && stops.some(s => s.id === id)), [follows]
  );

  // Keep orders in sync with actual follows (lines use composite keys)
  useEffect(() => {
    const normalizedLineOrder = lineOrder.filter(key => followedLineKeys.includes(key));
    const missingLines = followedLineKeys.filter(key => !normalizedLineOrder.includes(key));
    const newLineOrder = [...normalizedLineOrder, ...missingLines];

    const normalizedStopOrder = stopOrder.filter(id => followedStopIds.includes(id));
    const missingStops = followedStopIds.filter(id => !normalizedStopOrder.includes(id));
    const newStopOrder = [...normalizedStopOrder, ...missingStops];

    if (
      newLineOrder.join(',') !== lineOrder.join(',') ||
      newStopOrder.join(',') !== stopOrder.join(',')
    ) {
      setLineOrder(newLineOrder);
      setStopOrder(newStopOrder);
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify({ lines: newLineOrder, stops: newStopOrder }));
    }
  }, [followedLineKeys, followedStopIds]);

  const onBellClick = (e: React.MouseEvent, type: 'line' | 'stop', id: string, name: string, direction?: 'ida' | 'volta') => {
    e.stopPropagation();
    
    // Para linhas, usar apenas o ID da linha (não modificar)
    const itemId = id;
    const displayName = type === 'line' && direction 
      ? `${name} (${direction === 'ida' ? 'Ida' : 'Volta'})` 
      : name;
    
    setSelectedAlertItem({
      type,
      id: itemId,
      name: displayName,
      direction
    });
    
    setIsAlertsModalOpen(true);
  };

  // Verificar se alerta está ativo para um item
  const isAlertActive = (type: 'line' | 'stop', id: string, direction?: 'ida' | 'volta'): boolean => {
    if (type === 'line') {
      // Se uma direção específica foi fornecida, verificar apenas essa direção
      if (direction) {
        const alertKeyWithDirection = `borabuz-alert-${type}-${id}-${direction}`;
        const savedAlertWithDirection = localStorage.getItem(alertKeyWithDirection);
        
        if (savedAlertWithDirection) {
          try {
            const config = JSON.parse(savedAlertWithDirection);
            return config.enabled === true;
          } catch (error) {
            return false;
          }
        }
        
        // Verificar também sem direção (alertas legados) apenas para a direção específica
        const alertKey = `borabuz-alert-${type}-${id}`;
        const savedAlert = localStorage.getItem(alertKey);
        
        if (savedAlert) {
          try {
            const config = JSON.parse(savedAlert);
            return config.enabled === true;
          } catch (error) {
            return false;
          }
        }
      } else {
        // Se nenhuma direção foi fornecida, verificar se existe alerta ATIVO em qualquer direção
        const directions = ['ida', 'volta'] as const;
        
        for (const dir of directions) {
          const alertKeyWithDirection = `borabuz-alert-${type}-${id}-${dir}`;
          const savedAlertWithDirection = localStorage.getItem(alertKeyWithDirection);
          
          if (savedAlertWithDirection) {
            try {
              const config = JSON.parse(savedAlertWithDirection);
              if (config.enabled === true) return true;
            } catch (error) {
              // Continue verificando outras direções
            }
          }
        }
        
        // Verificar também sem direção (alertas legados)
        const alertKey = `borabuz-alert-${type}-${id}`;
        const savedAlert = localStorage.getItem(alertKey);
        
        if (savedAlert) {
          try {
            const config = JSON.parse(savedAlert);
            return config.enabled === true;
          } catch (error) {
            return false;
          }
        }
      }
    } else {
      // Para pontos, verificação padrão
      const alertKey = `borabuz-alert-${type}-${id}`;
      const savedAlert = localStorage.getItem(alertKey);
      
      if (savedAlert) {
        try {
          const config = JSON.parse(savedAlert);
          return config.enabled === true;
        } catch (error) {
          return false;
        }
      }
    }
    
    return false;
  };

  const reorderByIds = (arr: string[], fromId: string, toId: string) => {
    if (fromId === toId) return arr;
    const fromIdx = arr.indexOf(fromId);
    const toIdx = arr.indexOf(toId);
    if (fromIdx === -1 || toIdx === -1) return arr;
    const copy = [...arr];
    copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, fromId);
    return copy;
  };

  // Lines DnD
  const [draggingLineId, setDraggingLineId] = useState<string | null>(null);
  const onLineDragStart = (e: React.DragEvent, id: string) => {
    setDraggingLineId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onLineDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onLineDrop = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    if (draggingLineId) {
      const newOrder = reorderByIds(lineOrder, draggingLineId, overId);
      if (newOrder !== lineOrder) {
        setLineOrder(newOrder);
        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify({ lines: newOrder, stops: stopOrder }));
      }
    }
    setDraggingLineId(null);
  };
  const onLineDragEnd = () => setDraggingLineId(null);

  // Stops DnD
  const [draggingStopId, setDraggingStopId] = useState<string | null>(null);
  const onStopDragStart = (e: React.DragEvent, id: string) => {
    setDraggingStopId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onStopDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onStopDrop = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    if (draggingStopId) {
      const newOrder = reorderByIds(stopOrder, draggingStopId, overId);
      if (newOrder !== stopOrder) {
        setStopOrder(newOrder);
        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify({ lines: lineOrder, stops: newOrder }));
      }
    }
    setDraggingStopId(null);
  };
  const onStopDragEnd = () => setDraggingStopId(null);

  const toggleLineExpanded = (key: string) => {
    const copy = new Set(expandedLineIds);
    if (copy.has(key)) copy.delete(key); else copy.add(key);
    setExpandedLineIds(copy);
  };
  const toggleStopExpanded = (stopId: string) => {
    const copy = new Set(expandedStopIds);
    if (copy.has(stopId)) copy.delete(stopId); else copy.add(stopId);
    setExpandedStopIds(copy);
  };

  // Renderização do status da linha
  const renderLineStatus = (line: Line) => {
    const status = calculateLineStatus(line.schedules);
    
    return (
      <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-300">
        <Clock className="w-3 h-3" />
        <span className="font-medium">{status.status}</span>
        {typeof status.timeRemaining === 'number' && (
          <span>• {formatTimeRemaining(status.timeRemaining)}</span>
        )}
        {status.status === 'Saiu' && typeof status.timeSinceDeparture === 'number' && (
          <span>• {formatTimeSince(status.timeSinceDeparture)}</span>
        )}
      </div>
    );
  };

  const orderedFavoriteLines = useMemo(() => lineOrder
    .map(key => favoriteLines.find(e => e.compositeId === key))
    .filter((e): e is NonNullable<typeof e> => Boolean(e))
    .filter(e => !removedItems.has(e.compositeId))
    .filter(e => !search ? true : (
      e.displayName.toLowerCase().includes(search.toLowerCase())
    )), [lineOrder, favoriteLines, removedItems, search]
  );

  const orderedFavoriteStops = useMemo(() => stopOrder
    .map(id => stops.find(s => s.id === id)!)
    .filter(Boolean)
    .filter(stop => !removedItems.has(stop.id))
    .filter(stop => !search ? true : (stop.name.toLowerCase().includes(search.toLowerCase()) || stop.location?.toLowerCase().includes(search.toLowerCase()))), [stopOrder, removedItems, search]
  );

  const handleAlertOfferConfigure = () => {
    if (alertOfferItem) {
      setSelectedAlertItem(alertOfferItem);
      setIsAlertsModalOpen(true);
      setAlertOfferItem(null);
    }
  };

  const handleLineHeartClick = (e: React.MouseEvent, line: Line & { compositeId?: string }, direction?: 'ida' | 'volta') => {
    e.stopPropagation();
    
    // Get the composite ID - either from the line object or construct it
    const actualDirection = direction || 'ida';
    const compositeId = line.compositeId || `${line.id}::home::${actualDirection}`;
    
    // Immediately mark as removed for UI update
    setRemovedItems(prev => new Set([...prev, compositeId]));
    
    // Update line order state
    const newLineOrder = lineOrder.filter(id => id !== compositeId);
    setLineOrder(newLineOrder);
    
    // Update localStorage
    const stored = localStorage.getItem(ORDER_STORAGE_KEY);
    if (stored) {
      const { stops = [] } = JSON.parse(stored);
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify({ lines: newLineOrder, stops }));
    }
    
    // Update the follows state through the hook
    const parts = compositeId.split('::');
    if (parts.length >= 3) {
      const [lineId, , dir] = parts;
      toggleFollowLine(lineId, 'home', line.name, dir as 'ida' | 'volta');
    } else {
      // Fallback for malformed compositeId
      toggleFollowLine(line.id, 'home', line.name, actualDirection);
    }
  };

  const handleStopHeartClick = (e: React.MouseEvent, stopId: string) => {
    e.stopPropagation();
    
    // Immediately mark as removed for UI update
    setRemovedItems(prev => new Set([...prev, stopId]));
    
    // Update stop order state
    const newStopOrder = stopOrder.filter(id => id !== stopId);
    setStopOrder(newStopOrder);
    
    // Update localStorage
    const stored = localStorage.getItem(ORDER_STORAGE_KEY);
    if (stored) {
      const { lines = [] } = JSON.parse(stored);
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify({ lines, stops: newStopOrder }));
    }
    
    // Update the follows state
    toggleFollow(stopId);
  };

  if (followedLineKeys.length === 0 && followedStopIds.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Header customizado */}
        <div className="bg-gradient-primary text-white relative overflow-hidden">
          {/* Subtle background pattern for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
          
          <div className="relative px-6 pt-4 pb-8">
            <div className="max-w-md mx-auto">
              <div className="relative">
                {/* Main title - mais próximo do topo */}
                <div className="text-center">
                  <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-sm">
                    Favoritos
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom rounded corners - efeito da tela Lines */}
        <div className="relative">
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-background rounded-t-3xl -mt-6"></div>
        </div>

        <div className="max-w-md mx-auto p-4 -mt-6">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <HeartOff className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Nenhum favorito ainda</h3>
              <p className="text-muted-foreground max-w-sm">Você ainda não favoritou linhas nem pontos.</p>
            </div>
          </div>
        </div>

        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-primary text-white relative overflow-hidden">
        {/* Subtle background pattern for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
        
        <div className="relative px-6 pt-4 pb-8">
          <div className="max-w-md mx-auto">
            <div className="relative">
              {/* Main title - mais próximo do topo */}
              <div className="text-center">
                <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-sm">
                  Favoritos
                </h1>
              </div>
              
              {/* Settings gear icon - subtle in top right */}
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="absolute -top-0.5 right-0 p-2 text-white/60 hover:text-white/90 transition-colors"
                aria-label="Configurações"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom rounded corners - efeito da tela Lines */}
      <div className="relative">
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-background rounded-t-3xl -mt-6"></div>
      </div>

      <div className="max-w-md mx-auto p-4 -mt-8 space-y-4">
        {/* Busca */}
        <div className="mt-4">
          <Input
            placeholder="Buscar por linha ou ponto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Abas: Todos / Linhas / Pontos */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all" className="data-[state=active]:bg-bus-blue data-[state=active]:text-white">Todos</TabsTrigger>
            <TabsTrigger value="lines" className="data-[state=active]:bg-bus-blue data-[state=active]:text-white">Linhas</TabsTrigger>
            <TabsTrigger value="stops" className="data-[state=active]:bg-bus-blue data-[state=active]:text-white">Pontos</TabsTrigger>
          </TabsList>

          {/* TODOS */}
          <TabsContent value="all" className="space-y-6">
            {/* Bloco Linhas */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">Linhas</div>
              {orderedFavoriteLines.length === 0 ? (
                <Card className="p-4 text-center text-sm text-muted-foreground">Nenhuma linha favorita</Card>
              ) : (
                <div className="space-y-3">
                  {orderedFavoriteLines.map((entry) => {
                    const { compositeId, displayName, direction, originalLine, ...line } = entry;
                    return (
                      <Card
                        key={compositeId}
                        className={`p-3 ${draggingLineId === compositeId ? 'opacity-80 ring-2 ring-bus-blue/40' : ''}`}
                        draggable
                        onDragStart={(e) => onLineDragStart(e, compositeId)}
                        onDragOver={(e) => onLineDragOver(e, compositeId)}
                        onDrop={(e) => onLineDrop(e, compositeId)}
                        onDragEnd={onLineDragEnd}
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex items-start justify-between gap-3" onClick={() => toggleLineExpanded(compositeId)}>
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: originalLine.color }}>{originalLine.name}</div>
                              <div className="min-w-0">
                                <div className="font-semibold text-bus-text text-sm">
                                  {getBusDisplayName(originalLine, 'volta')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {direction === 'ida' ? 'Ida' : 'Volta'}
                                </div>
                                {renderLineStatus(originalLine)}
                              </div>
                            </div>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => onBellClick(e, 'line', originalLine.id, originalLine.name, direction)} aria-label="Configurar alerta">
                                <Bell className={`w-4 h-4 ${isAlertActive('line', originalLine.id, direction) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleLineHeartClick(e, originalLine, direction)} aria-label="Remover favorito">
                                <Heart className="w-4 h-4 fill-current text-red-500" />
                              </Button>
                            </div>
                          </div>
                          
                          {expandedLineIds.has(compositeId) && (
                            <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>Próximas saídas (hoje)</span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {(() => {
                                    const now = new Date();
                                    const current = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
                                    const upcoming = originalLine.schedules.filter(s => s > current).slice(0,3);
                                    return upcoming.map((s) => (
                                      <span
                                        key={s}
                                        className="px-2 py-1 rounded-md text-[11px] bg-white border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 shadow-sm font-medium"
                                      >
                                        {s}
                                      </span>
                                    ));
                                  })()}
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button 
                                  variant="ghost" 
                                  className="h-8 text-xs" 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    navigate(`/?highlightLine=${originalLine.id}&expandLine=${originalLine.id}&showModal=${originalLine.id}&direction=${direction}`); 
                                  }}
                                >
                                  Mais detalhes
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bloco Pontos */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">Pontos</div>
              {orderedFavoriteStops.length === 0 ? (
                <Card className="p-4 text-center text-sm text-muted-foreground">Nenhum ponto favorito</Card>
              ) : (
                <div className="space-y-3">
                  {orderedFavoriteStops.map((stop) => {
                    const linesHereIda = lines.filter(l => l.routeIda.includes(stop.id));
                    const linesHereVolta = lines.filter(l => l.routeVolta.includes(stop.id));
                    return (
                      <Card
                        key={stop.id}
                        className={`p-3 ${draggingStopId === stop.id ? 'opacity-80 ring-2 ring-bus-blue/40' : ''}`}
                        draggable
                        onDragStart={(e) => onStopDragStart(e, stop.id)}
                        onDragOver={(e) => onStopDragOver(e, stop.id)}
                        onDrop={(e) => onStopDrop(e, stop.id)}
                        onDragEnd={onStopDragEnd}
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex items-start justify-between gap-3" onClick={() => toggleStopExpanded(stop.id)}>
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-bus-blue/90 text-white">
                                <MapPin className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-semibold text-bus-text text-sm">{stop.name}</div>
                                {stop.location && <div className="text-xs text-muted-foreground">{stop.location}</div>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => onBellClick(e, 'stop', stop.id, stop.name)} aria-label="Configurar alerta">
                                <Bell className={`w-4 h-4 ${isAlertActive('stop', stop.id) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleStopHeartClick(e, stop.id)} aria-label="Remover favorito">
                                <Heart className="w-4 h-4 fill-current text-red-500" />
                              </Button>
                            </div>
                          </div>
                          
                          {expandedStopIds.has(stop.id) && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="space-y-2">
                                <div className="text-[11px] text-muted-foreground">Linhas (Ida):</div>
                                <div className="flex flex-wrap gap-1">
                                  {linesHereIda.map(l => (
                                    <button 
                                      key={l.id} 
                                      className="text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                      onClick={(e) => { e.stopPropagation(); navigate('/lines'); }}
                                    >
                                      {l.name}
                                    </button>
                                  ))}
                                </div>
                                <div className="text-[11px] text-muted-foreground">Linhas (Volta):</div>
                                <div className="flex flex-wrap gap-1">
                                  {linesHereVolta.map(l => (
                                    <button 
                                      key={l.id} 
                                      className="text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                      onClick={(e) => { e.stopPropagation(); navigate('/lines'); }}
                                    >
                                      {l.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button 
                                  variant="ghost" 
                                  className="h-8 text-xs" 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    navigate(`/stations?highlightStop=${stop.id}&expandStop=${stop.id}`); 
                                  }}
                                >
                                  Mais detalhes
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* LINHAS */}
          <TabsContent value="lines" className="space-y-3">
            {orderedFavoriteLines.length === 0 ? (
              <Card className="p-4 text-center text-sm text-muted-foreground">Nenhuma linha favorita</Card>
            ) : (
              orderedFavoriteLines.map((entry) => {
                const { compositeId, displayName, direction, originalLine, ...line } = entry;
                return (
                  <Card
                    key={compositeId}
                    className={`p-3 ${draggingLineId === compositeId ? 'opacity-80 ring-2 ring-bus-blue/40' : ''}`}
                    draggable
                    onDragStart={(e) => onLineDragStart(e, compositeId)}
                    onDragOver={(e) => onLineDragOver(e, compositeId)}
                    onDrop={(e) => onLineDrop(e, compositeId)}
                    onDragEnd={onLineDragEnd}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between gap-3" onClick={() => toggleLineExpanded(compositeId)}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: originalLine.color }}>{originalLine.name}</div>
                          <div className="min-w-0">
                            <div className="font-semibold text-bus-text text-sm">
                              {getBusDisplayName(originalLine, 'volta')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {direction === 'ida' ? 'Ida' : 'Volta'}
                            </div>
                            {renderLineStatus(originalLine)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => onBellClick(e, 'line', originalLine.id, originalLine.name, direction)} aria-label="Configurar alerta">
                            <Bell className={`w-4 h-4 ${isAlertActive('line', originalLine.id, direction) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleLineHeartClick(e, originalLine, direction)} aria-label="Remover favorito">
                            <Heart className="w-4 h-4 fill-current text-red-500" />
                          </Button>
                        </div>
                      </div>
                      
                      {expandedLineIds.has(compositeId) && (
                        <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>Próximas saídas (hoje)</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {(() => {
                                const now = new Date();
                                const current = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
                                const upcoming = originalLine.schedules.filter(s => s > current).slice(0,3);
                                return upcoming.map((s) => (
                                  <span
                                    key={s}
                                    className="px-2 py-1 rounded-md text-[11px] bg-white border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 shadow-sm font-medium"
                                  >
                                    {s}
                                  </span>
                                ));
                              })()}
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button 
                              variant="ghost" 
                              className="h-8 text-xs" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                navigate(`/?highlightLine=${originalLine.id}&expandLine=${originalLine.id}&showModal=${originalLine.id}&direction=${direction}`); 
                              }}
                            >
                              Mais detalhes
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* PONTOS */}
          <TabsContent value="stops" className="space-y-3">
            {orderedFavoriteStops.length === 0 ? (
              <Card className="p-4 text-center text-sm text-muted-foreground">Nenhum ponto favorito</Card>
            ) : (
              orderedFavoriteStops.map((stop) => {
                const linesHereIda = lines.filter(l => l.routeIda.includes(stop.id));
                const linesHereVolta = lines.filter(l => l.routeVolta.includes(stop.id));
                return (
                  <Card
                    key={stop.id}
                    className={`p-3 ${draggingStopId === stop.id ? 'opacity-80 ring-2 ring-bus-blue/40' : ''}`}
                    draggable
                    onDragStart={(e) => onStopDragStart(e, stop.id)}
                    onDragOver={(e) => onStopDragOver(e, stop.id)}
                    onDrop={(e) => onStopDrop(e, stop.id)}
                    onDragEnd={onStopDragEnd}
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex items-start justify-between gap-3" onClick={() => toggleStopExpanded(stop.id)}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-bus-blue/90 text-white">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-bus-text text-sm">{stop.name}</div>
                            {stop.location && <div className="text-xs text-muted-foreground">{stop.location}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => onBellClick(e, 'stop', stop.id, stop.name)} aria-label="Configurar alerta">
                            <Bell className={`w-4 h-4 ${isAlertActive('stop', stop.id) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleStopHeartClick(e, stop.id)} aria-label="Remover favorito">
                            <Heart className="w-4 h-4 fill-current text-red-500" />
                          </Button>
                        </div>
                      </div>
                      
                      {expandedStopIds.has(stop.id) && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="space-y-2">
                            <div className="text-[11px] text-muted-foreground">Linhas (Ida):</div>
                            <div className="flex flex-wrap gap-1">
                              {linesHereIda.map(l => (
                                <button 
                                  key={l.id} 
                                  className="text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                  onClick={(e) => { e.stopPropagation(); navigate('/lines'); }}
                                >
                                  {l.name}
                                </button>
                              ))}
                            </div>
                            <div className="text-[11px] text-muted-foreground">Linhas (Volta):</div>
                            <div className="flex flex-wrap gap-1">
                              {linesHereVolta.map(l => (
                                <button 
                                  key={l.id} 
                                  className="text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                  onClick={(e) => { e.stopPropagation(); navigate('/lines'); }}
                                >
                                  {l.name}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button 
                              variant="ghost" 
                              className="h-8 text-xs" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                navigate(`/stations?highlightStop=${stop.id}&expandStop=${stop.id}`); 
                              }}
                            >
                              Mais detalhes
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertsModal 
        open={isAlertsModalOpen} 
        onOpenChange={(open) => {
          setIsAlertsModalOpen(open);
          if (!open) setSelectedAlertItem(null);
        }}
        itemType={selectedAlertItem?.type}
        itemId={selectedAlertItem?.id}
        itemName={selectedAlertItem?.name}
        direction={selectedAlertItem?.direction}
      />

      <AlertOfferModal
        open={showAlertOffer}
        onOpenChange={setShowAlertOffer}
        itemType={alertOfferItem?.type || 'line'}
        itemName={alertOfferItem?.name || ''}
        onConfigureAlert={handleAlertOfferConfigure}
      />

      <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-bus-blue" />
              Configurações
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="alert-offer-toggle" className="text-sm font-medium">
                  Oferecer alertas ao favoritar
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Mostrar mensagem para adicionar alertas quando adicionar aos favoritos
                </p>
              </div>
              <Switch
                id="alert-offer-toggle"
                checked={showAlertOfferSetting}
                onCheckedChange={toggleAlertOfferSetting}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  )
};

export default Favorites;