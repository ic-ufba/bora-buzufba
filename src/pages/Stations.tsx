import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilterModal } from '@/components/ui/filter-modal';
import { AlertsModal } from '@/components/ui/alerts-modal';
import { AlertOfferModal } from '@/components/ui/alert-offer-modal';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { MapPin, Bus, Clock, Navigation, Search, ChevronDown, ChevronUp, Star, Heart } from 'lucide-react';
import { stops, lines } from '@/data/busData';
import { Direction, FilterState } from '@/types/bus';
import { calculateLineStatus, formatTimeRemaining } from '@/utils/timeUtils';
import { getBusDisplayName } from '@/utils/displayUtils';
import { useFollows } from '@/hooks/useFollows';
import { useLocation } from 'react-router-dom';

const Stations: React.FC = () => {
  const [selectedDirection, setSelectedDirection] = useState<Direction>('ida');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStations, setExpandedStations] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'nextDeparture'
  });

  // Estados para alertas
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [selectedAlertItem, setSelectedAlertItem] = useState<{
    type: 'line' | 'stop';
    id: string;
    name: string;
  } | null>(null);

  const { 
    isFollowing, 
    toggleFollow,
    showAlertOffer,
    setShowAlertOffer,
    alertOfferItem,
    setAlertOfferItem
  } = useFollows();

  const location = useLocation();

  // Função para verificar se é um ponto inicial na direção específica
  const isStartingPoint = (stopId: string, direction: Direction): boolean => {
    // Mapeamento correto dos pontos iniciais fornecidos pelo usuário
    const startingPointsMap = {
      ida: {
        'b1': 'Estacionamento São Lázaro',
        'b2': 'Estacionamento PAF I (Matemática)',
        'b3': 'Estacionamento PAF I (Matemática)',
        'b4': 'Estacionamento PAF I (Matemática)',
        'b5': 'Instituto de Geociências'
      },
      volta: {
        'b1': 'Reitoria',
        'b2': 'Residência I - Ponto de Distribuição Vitória',
        'b3': 'Piedade',
        'b4': 'Piedade',
        'b5': 'Residência I - Ponto de Distribuição Vitória'
      }
    };

    // Verificar se o ponto é inicial de alguma linha na direção específica
    return Object.entries(startingPointsMap[direction]).some(([lineId, startingPointName]) => {
      // Encontrar o ponto pelo nome
      const startingPoint = stops.find(stop => stop.name === startingPointName);
      return startingPoint && startingPoint.id === stopId;
    });
  };

  const stationLines = useMemo(() => {
    return stops.map(stop => {
      const idaLines = lines.filter(line => line.routeIda.includes(stop.id));
      const voltaLines = lines.filter(line => line.routeVolta.includes(stop.id));
      
      return {
        stop,
        lines: { ida: idaLines, volta: voltaLines },
        isStartingIda: isStartingPoint(stop.id, 'ida'),
        isStartingVolta: isStartingPoint(stop.id, 'volta')
      };
    });
  }, []);

  // Filtrar estações por busca
  const filteredStations = useMemo(() => {
    let filtered = stationLines;

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(station => 
        station.stop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.stop.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtros adicionais do FilterModal
    if (filters.selectedLines && filters.selectedLines.length > 0) {
      filtered = filtered.filter(station => {
        const currentLines = station.lines[selectedDirection];
        return currentLines.some(line => filters.selectedLines!.includes(line.id));
      });
    }

    // Filtro por ponto inicial
    if (filters.onlyStartingPoints) {
      filtered = filtered.filter(station => {
        const isStarting = selectedDirection === 'ida' ? station.isStartingIda : station.isStartingVolta;
        return isStarting;
      });
    }

    // Ordenação
    if (filters.sortBy === 'alphabetical') {
      filtered = [...filtered].sort((a, b) => a.stop.name.localeCompare(b.stop.name));
    } else if (filters.sortBy === 'nextDeparture') {
      filtered = [...filtered].sort((a, b) => {
        // Ordena pelo menor tempo restante da primeira linha de cada ponto
        const getNextTime = (station) => {
          const currentLines = station.lines[selectedDirection];
          if (currentLines.length === 0) return Infinity;
          
          let minTime = Infinity;
          for (const line of currentLines) {
            const status = calculateLineStatus(line.schedules);
            if (status && typeof status.timeRemaining === 'number' && status.timeRemaining >= 0) {
              minTime = Math.min(minTime, status.timeRemaining);
            }
          }
          return minTime === Infinity ? 999999 : minTime; // Pontos sem horário vão para o final
        };
        
        const timeA = getNextTime(a);
        const timeB = getNextTime(b);
        
        // Se ambos têm horários válidos, ordena por tempo
        if (timeA !== 999999 && timeB !== 999999) {
          return timeA - timeB;
        }
        // Se apenas A tem horário válido, A vem primeiro
        if (timeA !== 999999 && timeB === 999999) return -1;
        // Se apenas B tem horário válido, B vem primeiro
        if (timeA === 999999 && timeB !== 999999) return 1;
        // Se nenhum tem horário válido, mantém ordem original
        return 0;
      });
    }

    return filtered;
  }, [stationLines, searchTerm, selectedDirection, filters]);

  // Contagem correta considerando filtros aplicados
  const getFilteredCount = (direction: Direction) => {
    // Reaplica todos os filtros relevantes para a direção informada
    let filtered = stationLines;

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(station => 
        station.stop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.stop.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de linhas
    if (filters.selectedLines && filters.selectedLines.length > 0) {
      filtered = filtered.filter(station => {
        const currentLines = station.lines[direction];
        return currentLines.some(line => filters.selectedLines!.includes(line.id));
      });
    }

    // Filtro por ponto inicial
    if (filters.onlyStartingPoints) {
      filtered = filtered.filter(station => {
        const isStarting = direction === 'ida' ? station.isStartingIda : station.isStartingVolta;
        return isStarting;
      });
    }

    // Retorna a contagem de pontos que têm pelo menos uma linha na direção
    return filtered.filter(station => station.lines[direction].length > 0).length;
  };

  const toggleStationExpansion = (stationId: string) => {
    const newExpanded = new Set(expandedStations);
    if (newExpanded.has(stationId)) {
      newExpanded.delete(stationId);
    } else {
      newExpanded.add(stationId);
    }
    setExpandedStations(newExpanded);
  };

  const StationCard = ({ stationData }: { stationData: typeof filteredStations[0] }) => {
    const { stop, lines: stationLines, isStartingIda, isStartingVolta } = stationData;
    const isExpanded = expandedStations.has(stop.id);
    // Determinar se é ponto inicial baseado na direção atual
    const isStarting = selectedDirection === 'ida' ? isStartingIda : isStartingVolta;
    // Linhas a serem exibidas
    let currentLines = stationLines[selectedDirection];
    // Se o filtro de pontos iniciais está ativo, mostrar só as linhas cujo ponto é inicial
    if (filters.onlyStartingPoints) {
      currentLines = currentLines.filter(line => {
        const route = selectedDirection === 'ida' ? line.routeIda : line.routeVolta;
        return route.length > 0 && route[0] === stop.id;
      });
    }

    if (currentLines.length === 0) return null;

    return (
      <Card id={`station-${stop.id}`} className="shadow-card overflow-hidden relative">
        {/* Coração de favoritos no topo direito */}
        <button
          className="absolute top-3 right-3 z-10 p-1 rounded-full"
          onClick={e => { e.stopPropagation(); toggleFollow(stop.id, stop.name); }}
          aria-label={isFollowing(stop.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart className={`w-5 h-5 transition-colors ${isFollowing(stop.id) ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
        </button>
        {/* Header da estação - sempre visível */}
        <div 
          className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
          onClick={() => toggleStationExpansion(stop.id)}
        >
          <div className="flex items-start gap-3">
            {/* Ícone do ponto, amarelo se for ponto inicial */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isStarting ? 'bg-yellow-200' : 'bg-bus-blue'}`}>
              <MapPin className={`w-5 h-5 ${isStarting ? 'text-yellow-600' : 'text-white'}`} />
            </div>
            <div className="flex-1 pr-10">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-bus-text break-words leading-tight">{stop.name}</h3>
              </div>
              
              {stop.location && (
                <p className="text-sm text-muted-foreground break-words">{stop.location}</p>
              )}
              
              {/* Linhas em bolinhas - sempre visíveis */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex flex-wrap gap-2">
                  {currentLines.map(line => (
                    <div
                      key={`${line.id}-${selectedDirection}`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: line.color }}
                    >
                      {line.name}
                    </div>
                  ))}
                </div>
                {/* Removido botão de coração daqui */}
              </div>
            </div>
          </div>
        </div>

        {/* Detalhes expandidos */}
        {isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="p-4 space-y-2">
              {/* Sinalização de ponto inicial */}
              {isStarting && (
                <div className="mb-2 text-yellow-700 text-xs font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3" /> Este é o ponto inicial da linha!
                </div>
              )}
              {currentLines.map(line => {
                const lineStatus = calculateLineStatus(line.schedules);
                
                // Verificar se esta linha é a linha inicial deste ponto na direção atual
                const isLineStarting =
                  (selectedDirection === 'ida' && line.routeIda[0] === stop.id) ||
                  (selectedDirection === 'volta' && line.routeVolta[0] === stop.id);
                
                return (
                  <div
                    key={`${line.id}-${selectedDirection}-expanded`}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg relative"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: line.color }}
                      >
                        {line.name}
                      </div>
                      <div>
                        <p className="font-medium text-bus-text">{getBusDisplayName(line, selectedDirection)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                    {selectedDirection === 'ida' && isLineStarting && lineStatus.nextDeparture && (
                      <div className="text-center">
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 mb-1">
                          {lineStatus.nextDeparture}
                        </div>
                        {lineStatus.timeRemaining && (
                          <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                            {formatTimeRemaining(lineStatus.timeRemaining)}
                          </div>
                        )}
                      </div>
                    )}
                      {/* Estrelinha amarela vazada para linha inicial */}
                      {isLineStarting && (
                        <div className="flex-shrink-0">
                          <Star className="w-5 h-5 text-yellow-500 fill-none stroke-2" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Mensagem de aviso no rodapé para pontos iniciais */}
            {isStarting && selectedDirection === 'ida' && (
              <div className="px-4 pb-3 pt-0">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 text-center bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border-l-2 border-yellow-400">
                  Os horários referem-se à saída no ponto inicial e estão sujeitos a alterações.
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  const totalLinesByDirection = useMemo(() => {
    return {
      ida: filteredStations.reduce((acc, station) => acc + station.lines.ida.length, 0),
      volta: filteredStations.reduce((acc, station) => acc + station.lines.volta.length, 0)
    };
  }, [filteredStations]);

  // Abrir e rolar para o ponto destacado vindo de outras telas
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlightStop = params.get('highlightStop');
    if (highlightStop) {
      setExpandedStations(prev => new Set(prev).add(highlightStop));
      // Scroll suave após expandir
      setTimeout(() => {
        const el = document.getElementById(`station-${highlightStop}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  }, [location.search]);

  const handleAlertOfferConfigure = () => {
    if (alertOfferItem) {
      setSelectedAlertItem(alertOfferItem);
      setIsAlertsModalOpen(true);
      setAlertOfferItem(null);
    }
  };

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
                  Pontos de Parada
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

      <div className="max-w-md mx-auto p-4 mt-0">
        {/* Campo de busca e filtros */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <FilterModal filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedDirection} onValueChange={(value) => setSelectedDirection(value as Direction)}>
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 dark:bg-transparent rounded-lg p-1">
            <TabsTrigger 
              value="ida"
              className="data-[state=active]:bg-bus-blue data-[state=active]:text-white"
            >
              Ida ({getFilteredCount('ida')})
            </TabsTrigger>
            <TabsTrigger 
              value="volta"
              className="data-[state=active]:bg-bus-blue data-[state=active]:text-white"
            >
              Volta ({getFilteredCount('volta')})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ida" className="space-y-4">
            {filteredStations
              .filter(station => station.lines.ida.length > 0)
              .map(stationData => (
                <StationCard key={stationData.stop.id} stationData={stationData} />
              ))
            }
            {filteredStations.filter(station => station.lines.ida.length > 0).length === 0 && (
              <Card className="p-6 text-center">
                <Bus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum ponto encontrado</h3>
                <p className="text-muted-foreground">
                  Não há pontos disponíveis com os filtros aplicados.
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="volta" className="space-y-4">
            {filteredStations
              .filter(station => station.lines.volta.length > 0)
              .map(stationData => (
                <StationCard key={stationData.stop.id} stationData={stationData} />
              ))
            }
            {filteredStations.filter(station => station.lines.volta.length > 0).length === 0 && (
              <Card className="p-6 text-center">
                <Bus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhum ponto encontrado</h3>
                <p className="text-muted-foreground">
                  Não há pontos disponíveis com os filtros aplicados.
                </p>
              </Card>
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
      />

      <AlertOfferModal
        open={showAlertOffer}
        onOpenChange={setShowAlertOffer}
        itemType={alertOfferItem?.type || 'stop'}
        itemName={alertOfferItem?.name || ''}
        onConfigureAlert={handleAlertOfferConfigure}
      />

      <BottomNavigation />
    </div>
  );
};

export default Stations;