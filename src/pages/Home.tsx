import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RoutePlanner } from '@/components/ui/route-planner';
import { HomeFilterModal } from '@/components/ui/home-filter-modal';
import { LineCard } from '@/components/ui/line-card';
import { AlertsModal } from '@/components/ui/alerts-modal';
import { AlertOfferModal } from '@/components/ui/alert-offer-modal';
import { Header } from '@/components/layout/header';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Card } from '@/components/ui/card';
import { Bus, Clock, X, ArrowRight } from 'lucide-react';
import { lines, findLinesByRoute, detectDirection, stops, getStopName } from '@/data/busData';
import { calculateLineStatus as getLineStatus } from '@/utils/timeUtils';
import { getBusDisplayName } from '@/utils/displayUtils';
import { FilterState, Direction, Line, Stop } from '@/types/bus';
import { motion } from 'framer-motion';
import { useFollows } from '@/hooks/useFollows';
import { useWelcome } from '@/hooks/useWelcome';
import { WelcomeModal } from '@/components/ui/welcome-modal';

const Home: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDirection, setSelectedDirection] = useState<Direction>('ida');
  const [routeFilter, setRouteFilter] = useState<{ origin?: string; destination?: string }>({});
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'nextDeparture'
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [routeHistory, setRouteHistory] = useState<Array<{origin: string, destination: string, originName: string, destinationName: string}>>([]);
  
  // Estados para alertas
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [selectedAlertItem, setSelectedAlertItem] = useState<{
    type: 'line' | 'stop';
    id: string;
    name: string;
  } | null>(null);

  // Hook para favoritos e alertas
  const {
    follows,
    showAlertOffer,
    setShowAlertOffer,
    alertOfferItem,
    setAlertOfferItem,
    toggleFollow,
    toggleFollowLine
  } = useFollows();

  const [isAlertOfferOpen, setIsAlertOfferOpen] = useState(false);
  const [currentAlertItem, setCurrentAlertItem] = useState<{
    type: 'line' | 'stop';
    id: string;
    name: string;
  } | null>(null);

  // Estado para controlar qual linha deve abrir o modal
  const [lineToShowModal, setLineToShowModal] = useState<string | null>(null);
  const [modalDirection, setModalDirection] = useState<Direction>('ida');

  // Efeito para lidar com o parâmetro showModal da URL
  useEffect(() => {
    const showModal = searchParams.get('showModal');
    const direction = searchParams.get('direction') as Direction;
    if (showModal) {
      setLineToShowModal(showModal);
      if (direction === 'volta') {
        setModalDirection('volta');
        setSelectedDirection('volta'); // Também muda a tab ativa
      } else {
        setModalDirection('ida');
        setSelectedDirection('ida');
      }
      // Remove os parâmetros da URL após processar
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('showModal');
      newSearchParams.delete('direction');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Efeito para monitorar mudanças no estado de oferta de alerta do hook useFollows
  useEffect(() => {
    console.log('useEffect - showAlertOffer mudou:', showAlertOffer, 'item:', alertOfferItem);
    
    if (showAlertOffer && alertOfferItem) {
      // Verificar se o usuário desabilitou o modal de oferta
      const hideAlertOffer = localStorage.getItem('borabuz-hide-alert-offer') === 'true';
      
      if (!hideAlertOffer) {
        console.log('Mostrando modal de oferta para:', alertOfferItem);
        setCurrentAlertItem(alertOfferItem);
        setIsAlertOfferOpen(true);
      }
      // Reseta o estado do hook para evitar loops
      setShowAlertOffer(false);
    }
  }, [showAlertOffer, alertOfferItem, setShowAlertOffer]);

  // Função para lidar com o clique na linha (não no coração)
  const handleLineClick = (lineId: string) => {
    console.log('Linha clicada:', lineId);
    // Aqui você pode adicionar a lógica para mostrar detalhes da linha
    // Por exemplo, navegar para a página de detalhes da linha
  };

  // Função para lidar com a configuração do alerta
  const handleAlertOfferConfigure = () => {
    if (currentAlertItem) {
      setSelectedAlertItem(currentAlertItem);
      setIsAlertOfferOpen(false);
      setIsAlertsModalOpen(true);
    }
  };

  // Atualiza a função handleFavoriteClick para incluir a direção
  const handleFavoriteClick = (lineId: string, lineName: string, direction: 'ida' | 'volta') => {
    console.log('Chamando handleFavoriteClick com:', { lineId, lineName, direction });
    
    // Primeiro verifica se já é favorito
    const isCurrentlyFavorite = Array.from(follows).some(follow => 
      follow.startsWith(`${lineId}::home::${direction}`) || 
      follow === lineId ||
      follow.startsWith(`${lineId}::home`)
    );
    
    console.log('Linha atual:', lineId, 'Direção:', direction, 'Já é favorita?', isCurrentlyFavorite);
    
    // Se não for favorito, mostra o modal de oferta
    if (!isCurrentlyFavorite) {
      console.log('Preparando para mostrar modal para linha:', lineId, 'Direção:', direction, 'Nome:', lineName);
      const alertItem = { 
        type: 'line' as const, 
        id: lineId, 
        name: lineName || `Linha ${lineId.toUpperCase()}`,
        direction
      };
      
      // Atualiza o estado do hook para disparar o efeito
      setAlertOfferItem(alertItem);
      setShowAlertOffer(true);
    }
    
    // Alterna o favorito com a direção
    toggleFollowLine(lineId, 'home', lineName, direction);
  };

  // Forçar re-render para resolver problemas de network/cache
  const [updateKey, setUpdateKey] = useState(0);

  // Atualização automática a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateKey(prev => prev + 1);
    }, 5000); // 5 segundos

    return () => clearInterval(interval);
  }, []);

  // Carregar histórico salvo ao iniciar
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('boraBuzRouteHistory');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        // Validar o formato dos dados
        if (Array.isArray(parsed) && parsed.every(item => 
          item && 
          typeof item === 'object' && 
          'origin' in item && 
          'destination' in item &&
          'originName' in item &&
          'destinationName' in item
        )) {
          setRouteHistory(parsed.slice(0, 5)); // Limitar a 5 itens
        }
      }
    } catch (e) {
      console.error('Erro ao carregar histórico de rotas:', e);
      localStorage.removeItem('boraBuzRouteHistory');
    }
  }, []);

  // Salvar histórico quando ele for atualizado
  useEffect(() => {
    if (routeHistory.length > 0) {
      localStorage.setItem('boraBuzRouteHistory', JSON.stringify(routeHistory));
    } else {
      localStorage.removeItem('boraBuzRouteHistory');
    }
  }, [routeHistory]);

  // Linhas filtradas por rota DE-PARA
  const routeFilteredLines = useMemo(() => {
    if (!routeFilter.origin || !routeFilter.destination) {
      return lines;
    }
    const filtered = findLinesByRoute(routeFilter.origin, routeFilter.destination);
    return filtered;
  }, [routeFilter.origin, routeFilter.destination, updateKey]);

  // Linhas disponíveis por direção
  const linesByDirection = useMemo(() => {
    const idaLines = routeFilteredLines.filter(line => {
      if (routeFilter.origin && routeFilter.destination) {
        return detectDirection(line, routeFilter.origin, routeFilter.destination) === 'ida';
      }
      return line.routeIda.length > 0;
    });

    const voltaLines = routeFilteredLines.filter(line => {
      if (routeFilter.origin && routeFilter.destination) {
        return detectDirection(line, routeFilter.origin, routeFilter.destination) === 'volta';
      }
      return line.routeVolta.length > 0;
    });

    return { ida: idaLines, volta: voltaLines };
  }, [routeFilteredLines, routeFilter, updateKey]);

  // Contagem por direção após aplicar filtros (apenas filtros que alteram quantidade)
  const filteredCounts = useMemo(() => {
    const countFor = (direction: Direction) => {
      let arr = linesByDirection[direction];
      if (filters.selectedLines && filters.selectedLines.length > 0) {
        arr = arr.filter(line => filters.selectedLines!.includes(line.id));
      }
      if (filters.selectedStop) {
        arr = arr.filter(line => {
          const route = direction === 'ida' ? line.routeIda : line.routeVolta;
          return route.includes(filters.selectedStop!);
        });
      }
      return arr.length;
    };
    return { ida: countFor('ida'), volta: countFor('volta') };
  }, [linesByDirection, filters.selectedLines, filters.selectedStop]);

  const isFilterActive = Boolean((filters.selectedLines && filters.selectedLines.length > 0) || filters.selectedStop);

  // Aplicar filtros adicionais
  const filteredLines = useMemo(() => {
    let lines = linesByDirection[selectedDirection];

    // Filtrar por linhas selecionadas (nova funcionalidade)
    if (filters.selectedLines && filters.selectedLines.length > 0) {
      lines = lines.filter(line => filters.selectedLines!.includes(line.id));
    }

    // Filtrar por ponto específico
    if (filters.selectedStop) {
      lines = lines.filter(line => {
        const route = selectedDirection === 'ida' ? line.routeIda : line.routeVolta;
        return route.includes(filters.selectedStop!);
      });
    }

    // Ordenar linhas por número ou horário de saída
    if (filters.orderBy === 'departureTime') {
      // Ordenar por horário de saída da garagem (primeiro horário)
      lines = lines.sort((a, b) => {
        const aFirstTime = a.schedules[0] || '23:59';
        const bFirstTime = b.schedules[0] || '23:59';
        return aFirstTime.localeCompare(bFirstTime);
      });
    } else if (filters.orderBy === 'lineNumber') {
      // Ordenar por número da linha (B1, B2, B3...)
      lines = lines.sort((a, b) => {
        const numA = parseInt(a.name.replace(/\D/g, ''), 10);
        const numB = parseInt(b.name.replace(/\D/g, ''), 10);
        return numA - numB;
      });
    } else {
      // Ordenar por próxima saída ou alfabética
      if (filters.sortBy === 'alphabetical') {
        lines = lines.sort((a, b) => getBusDisplayName(a, selectedDirection).localeCompare(getBusDisplayName(b, selectedDirection)));
      } else {
        // Ordenar por próxima saída (apenas para ida)
        if (selectedDirection === 'ida') {
          lines = lines.sort((a, b) => {
            const aStatus = getLineStatus(a.schedules);
            const bStatus = getLineStatus(b.schedules);
            
            // Priorizar "Agora" no topo
            if (aStatus.status === 'Agora' && bStatus.status !== 'Agora') return -1;
            if (aStatus.status !== 'Agora' && bStatus.status === 'Agora') return 1;

            // Lógica especial para ônibus que saíram - manter no topo por 5 minutos
            const aJustLeft = aStatus.status === 'Saiu' && aStatus.timeSinceDeparture !== undefined && aStatus.timeSinceDeparture <= 5;
            const bJustLeft = bStatus.status === 'Saiu' && bStatus.timeSinceDeparture !== undefined && bStatus.timeSinceDeparture <= 5;
            
            // Se ambos acabaram de sair, ordenar por tempo desde saída (mais recente primeiro)
            if (aJustLeft && bJustLeft) {
              return (aStatus.timeSinceDeparture || 0) - (bStatus.timeSinceDeparture || 0);
            }
            
            // Se apenas A acabou de sair, A fica no topo
            if (aJustLeft && !bJustLeft) return -1;
            
            // Se apenas B acabou de sair, B fica no topo
            if (!aJustLeft && bJustLeft) return 1;
            
            // Para o resto, usar a lógica original de timeRemaining
            if (!aStatus.timeRemaining && !bStatus.timeRemaining) return 0;
            if (!aStatus.timeRemaining) return 1;
            if (!bStatus.timeRemaining) return -1;
            
            return aStatus.timeRemaining - bStatus.timeRemaining;
          });
        }
      }
    }

    return lines;
  }, [linesByDirection, selectedDirection, filters]);

  // Função para adicionar uma rota ao histórico
  const addToRouteHistory = (origin?: string, destination?: string) => {
    // Só adiciona ao histórico se ambos origem e destino estiverem definidos
    if (!origin || !destination) return;
    
    const originStop = stops.find(s => s.id === origin);
    const destinationStop = stops.find(s => s.id === destination);
    
    // Verifica se ambos os pontos são válidos
    if (!originStop || !destinationStop) return;
    
    const originName = originStop.name;
    const destinationName = destinationStop.name;
    
    setRouteHistory(prev => {
      // Remover duplicatas
      const filtered = prev.filter(
        item => !(item.origin === origin && item.destination === destination)
      );
      
      // Adicionar no início e limitar a 5 itens
      return [
        { origin, destination, originName, destinationName },
        ...filtered
      ].slice(0, 5);
    });
  };

  // Função para selecionar uma rota do histórico
  const selectRouteFromHistory = (origin: string, destination: string) => {
    const currentRoute = routeFilter.origin === origin && routeFilter.destination === destination;
    
    if (currentRoute) {
      // Se clicar na mesma rota, limpa a seleção
      setRouteFilter({ origin: undefined, destination: undefined });
    } else {
      // Se for uma rota diferente, seleciona ela
      setRouteFilter({ origin, destination });
      setSelectedDirection('ida');
      setUpdateKey(prev => prev + 1);
    }
  };

  // Atualizar histórico de rotas quando uma nova rota for selecionada
  const handleRouteSelect = (origin?: string, destination?: string) => {
    setRouteFilter({ origin, destination });
    
    // Forçar re-render para garantir atualização na versão network
    setUpdateKey(prev => prev + 1);
    
    // Resetar para a aba de ida quando selecionar uma nova rota
    if (origin && destination) {
      setSelectedDirection('ida');
      // Adiciona ao histórico apenas se ambos estiverem definidos
      addToRouteHistory(origin, destination);
    }
  };

  // Limpar histórico
  const clearHistory = () => {
    setRouteHistory([]);
  };

  const isTabDisabled = (direction: Direction) => {
    return linesByDirection[direction].length === 0;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  useEffect(() => {
    if (lineToShowModal) {
      const lineId = lineToShowModal;
      if (lineId) {
        handleLineClick(lineId);
      }
    }
  }, [lineToShowModal]);

  const { showWelcome, closeWelcome } = useWelcome();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header integrado com Route Planner */}
      <div className="bg-gradient-primary text-white relative overflow-hidden">
        {/* Subtle background pattern for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
        
        {/* Header Content */}
        <div className="relative px-6 pt-4 pb-3">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between">
              {/* Spacer for balance */}
              <div className="w-10"></div>
              
              {/* Main title - centered */}
              <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm text-center">
                BoraBuzufba
              </h1>
              
              {/* Theme toggle in right corner */}
              <div className="flex justify-end">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>

        {/* Route Planner integrado */}
        <div className="relative px-6 pb-10">
          <div className="max-w-md mx-auto">
            <RoutePlanner onRouteSelect={handleRouteSelect} />
            
            {/* Histórico de Rotas */}
            {routeHistory.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 mb-2 bg-white/5 backdrop-blur-md rounded-xl p-3 shadow-sm border border-white/5 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-white/80" />
                    <h3 className="text-sm font-medium text-white/90">Histórico de Rotas</h3>
                  </div>
                  <button 
                    onClick={clearHistory}
                    className="text-xs text-white/60 hover:text-white/90 hover:bg-white/10 px-2 py-1 rounded transition-colors flex items-center gap-1"
                    title="Limpar histórico"
                  >
                    <span className="text-xs">Limpar</span>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {routeHistory.map((item, index) => {
                    const isActive = routeFilter.origin === item.origin && 
                                  routeFilter.destination === item.destination;
                    
                    return (
                      <motion.button
                        key={`${item.origin}-${item.destination}-${index}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ 
                          opacity: 1, 
                          x: 0,
                          backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'
                        }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => selectRouteFromHistory(item.origin, item.destination)}
                        className={`relative w-32 h-12 flex-shrink-0 border rounded-lg p-2 text-xs text-white/90 transition-all duration-200 ${
                          isActive 
                            ? 'border-white/30 bg-white/20' 
                            : 'border-white/10 hover:border-white/20 hover:bg-white/10'
                        }`}
                        title={`${item.originName} → ${item.destinationName}`}
                      >
                        <div className="h-full flex flex-col justify-center items-center">
                          <div className="text-center mb-0.5">
                            <div className="line-clamp-1 break-words text-[0.65rem] leading-tight">
                              {item.originName}
                            </div>
                          </div>
                          <div className="flex justify-center mb-0.5">
                            <ArrowRight className="w-2.5 h-2.5 text-white/60 flex-shrink-0 rotate-90" />
                          </div>
                          <div className="text-center">
                            <div className="line-clamp-1 break-words text-[0.65rem] leading-tight">
                              {item.destinationName}
                            </div>
                          </div>
                        </div>
                        {isActive && (
                          <motion.div 
                            className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-white"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Bottom rounded corners */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-background rounded-t-3xl"></div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6 -mt-6">
        {/* Lines Section */}
        <div id="lines-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Linhas Disponíveis
            </h2>
            <HomeFilterModal 
              filters={filters} 
              onFiltersChange={setFilters}
              open={isFilterOpen}
              onOpenChange={setIsFilterOpen}
            />
          </div>

          {routeFilteredLines.length > 0 ? (
            <Tabs 
              value={selectedDirection} 
              onValueChange={(value) => setSelectedDirection(value as Direction)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger 
                  value="ida" 
                  disabled={isTabDisabled('ida')}
                  className="data-[state=active]:bg-bus-blue data-[state=active]:text-white"
                >
                  Ida ({isFilterActive ? filteredCounts.ida : linesByDirection.ida.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="volta" 
                  disabled={isTabDisabled('volta')}
                  className="data-[state=active]:bg-bus-blue data-[state=active]:text-white"
                >
                  Volta ({isFilterActive ? filteredCounts.volta : linesByDirection.volta.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ida" className="space-y-3 mt-4">
                {filteredLines.map((line, index) => (
                  <LineCard
                    key={`${line.id}-${selectedDirection}`}
                    line={line}
                    stops={stops}
                    direction={selectedDirection}
                    getStopName={getStopName}
                    routeOrigin={routeFilter.origin}
                    routeDestination={routeFilter.destination}
                    favoriteSource="home"
                    tick={updateKey}
                    onFavoriteClick={handleFavoriteClick}
                    onLineClick={handleLineClick}
                    shouldShowModal={lineToShowModal === line.id && modalDirection === 'ida'}
                    onModalShown={() => setLineToShowModal(null)}
                  />
                ))}
              </TabsContent>

              <TabsContent value="volta" className="space-y-3 mt-4">
                {filteredLines.map((line, index) => (
                  <LineCard
                    key={`${line.id}-${selectedDirection}`}
                    line={line}
                    stops={stops}
                    direction={selectedDirection}
                    getStopName={getStopName}
                    routeOrigin={routeFilter.origin}
                    routeDestination={routeFilter.destination}
                    favoriteSource="home"
                    tick={updateKey}
                    onFavoriteClick={handleFavoriteClick}
                    onLineClick={handleLineClick}
                    shouldShowModal={lineToShowModal === line.id && modalDirection === 'volta'}
                    onModalShown={() => setLineToShowModal(null)}
                  />
                ))}
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="p-6 text-center">
              <Bus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma linha encontrada</h3>
              <p className="text-muted-foreground">
                Não há linhas disponíveis para esta rota. Tente selecionar outros pontos.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de oferta de alerta */}
      <AlertOfferModal
        open={isAlertOfferOpen}
        onOpenChange={setIsAlertOfferOpen}
        itemType={currentAlertItem?.type || 'line'}
        itemName={currentAlertItem?.name || ''}
        onConfigureAlert={handleAlertOfferConfigure}
      />

      {/* Modal de configuração de alertas */}
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

      <WelcomeModal open={showWelcome} onClose={closeWelcome} />

      <BottomNavigation />
    </div>
  );
};

export default Home;