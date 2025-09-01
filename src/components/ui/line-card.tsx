import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Stop, LineStatus } from '@/types/bus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calculateLineStatus, formatTimeRemaining, formatTimeSince } from '@/utils/timeUtils';
import { LineDetailsModal } from './line-details-modal';
import { getRouteSegment } from '@/data/busData';
import { getBusDisplayName } from '@/utils/displayUtils';
import { Heart, Eye, Clock, MapPin, ChevronDown, ChevronUp, Route } from 'lucide-react';
import { useFollows } from '@/hooks/useFollows';
import { useFavoritesMeta, LineSource } from '@/hooks/useFavoritesMeta';

interface LineCardProps {
  line: Line;
  stops: Stop[];
  direction: 'ida' | 'volta';
  getStopName: (stopId: string) => string;
  routeOrigin?: string;
  routeDestination?: string;
  favoriteSource?: LineSource;
  tick?: number;
  onFavoriteClick?: (lineId: string, lineName: string, direction: 'ida' | 'volta') => void;
  onLineClick?: (lineId: string) => void;
  shouldShowModal?: boolean;
  onModalShown?: () => void;
}

export const LineCard: React.FC<LineCardProps> = ({ 
  line, 
  stops, 
  direction, 
  getStopName, 
  routeOrigin, 
  routeDestination,
  favoriteSource = 'home',
  tick,
  onFavoriteClick,
  onLineClick,
  shouldShowModal,
  onModalShown
}) => {
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(shouldShowModal || false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { isFollowingLineSource, toggleFollowLine } = useFollows();
  const { setLineSource, clearLine } = useFavoritesMeta();

  // Estado local para controlar o coração
  const [isFavorited, setIsFavorited] = useState(false);
  
  // Atualiza o estado local quando as dependências mudarem
  useEffect(() => {
    const checkFavorite = () => {
      const favorited = isFollowingLineSource(line.id, favoriteSource, direction);
      console.log(`Atualizando estado do favorito para linha ${line.id} (${direction}):`, favorited);
      setIsFavorited(favorited);
    };
    
    checkFavorite();
    
    // Adiciona um listener para mudanças no localStorage
    const handleStorageChange = () => {
      checkFavorite();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [line.id, favoriteSource, direction, isFollowingLineSource]);

  const lineStatus: LineStatus = useMemo(() => {
    if (direction === 'ida') {
      return calculateLineStatus(line.schedules);
    }
    return { status: 'Info', nextDeparture: undefined };
  }, [line.schedules, direction, tick]);

  const statusColorMap: { [key: string]: { bg: string, lightBg: string, darkBg: string, text: string, darkText: string, badgeBg: string, darkBadgeBg: string, extra?: string } } = {
    'Saindo': { 
      bg: 'bg-green-50 dark:bg-green-900/30',
      lightBg: 'bg-green-50',
      darkBg: 'bg-green-900/30',
      text: 'text-green-700 dark:text-green-300',
      darkText: 'text-green-300',
      badgeBg: 'bg-green-100 border border-green-600 dark:border-green-400 dark:bg-green-800/50',
      darkBadgeBg: 'bg-green-800/50 border border-green-400',
      extra: 'border border-green-600 dark:border-green-400 rounded-md'
    },
    'Próximo': { 
      bg: 'bg-orange-50 dark:bg-orange-900/30',
      lightBg: 'bg-orange-50',
      darkBg: 'bg-orange-900/30',
      text: 'text-orange-400 dark:text-orange-300',
      darkText: 'text-orange-300',
      badgeBg: 'bg-orange-100 border border-orange-400 dark:border-orange-400 dark:bg-orange-800/50',
      darkBadgeBg: 'bg-orange-800/50 border border-orange-400',
      extra: 'border border-orange-400 dark:border-orange-400 rounded-md'
    },
    'Aguardando': {
      bg: 'bg-gray-50 dark:bg-gray-900/30',
      lightBg: 'bg-gray-100',
      darkBg: 'bg-gray-700/30',
      text: 'text-gray-500 dark:text-gray-100',
      darkText: 'text-gray-300',
      badgeBg: 'bg-gray-100 border border-gray-500 dark:border-gray-500 dark:bg-gray-500/50',
      darkBadgeBg: 'bg-gray-500/50 border border-gray-300',
      extra: 'border border-gray-500 dark:border-gray-300 rounded-md'
    },
    'Encerrado': { 
      bg: 'bg-gray-50 dark:bg-gray-900/30',
      lightBg: 'bg-gray-100',
      darkBg: 'bg-gray-700/30',
      text: 'text-gray-800 dark:text-gray-100',
      darkText: 'text-gray-100',
      badgeBg: 'bg-gray-400 border border-gray-200 dark:border-gray-200 dark:bg-gray-200/50',
      darkBadgeBg: 'bg-gray-200/50 border border-gray-100',
      extra: 'border border-gray-800 dark:border-gray-100 rounded-md'
    },
    'Saiu': { 
      bg: 'bg-red-100 dark:bg-red-900/30',
      lightBg: 'bg-red-100',
      darkBg: 'bg-red-900/30',
      text: 'text-red-600 dark:text-red-300',
      darkText: 'text-red-300',
      badgeBg: 'bg-red-100 border border-red-400 dark:border-red-400 dark:bg-red-800/50',
      darkBadgeBg: 'bg-red-800/50 border border-red-400',
      extra: 'border border-red-400 dark:border-red-400 rounded-md'
    },
    'Agora': {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      lightBg: 'bg-blue-50',
      darkBg: 'bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      darkText: 'text-blue-300',
      badgeBg: 'bg-blue-100 border border-blue-600 dark:border-blue-400 dark:bg-blue-800/50',
      darkBadgeBg: 'bg-blue-800/50 border border-blue-400',
      extra: 'border border-blue-600 dark:border-blue-400 rounded-md'
    },
  };

  const statusStyle = statusColorMap[lineStatus.status] || statusColorMap['Info'];

  const renderTimeInfo = () => {
    if (direction === 'volta') return null;

    if (lineStatus.status === 'Saiu' && lineStatus.timeSinceDeparture !== undefined) {
      return (
        <span className="text-sm text-gray-500 dark:text-gray-300 font-medium">
          {formatTimeSince(lineStatus.timeSinceDeparture)}
        </span>
      );
    }

    if (lineStatus.timeRemaining !== undefined) {
      return (
        <span className="text-sm text-gray-500 dark:text-gray-300 font-medium">
          {formatTimeRemaining(lineStatus.timeRemaining)}
        </span>
      );
    }

    return null;
  };

  const routeStops = direction === 'ida' ? line.routeIda : line.routeVolta;
  const startStopName = getStopName(routeStops[0]);
  const endStopName = getStopName(routeStops[routeStops.length - 1]);

  // Calcular trajeto detalhado quando há origem e destino selecionados
  const routeSegment = useMemo(() => {
    if (routeOrigin && routeDestination) {
      return getRouteSegment(line, routeOrigin, routeDestination);
    }
    return null;
  }, [line, routeOrigin, routeDestination]);

  const hasRouteSelected = routeOrigin && routeDestination;

  // Remover animação de entrada do card na lista (mantemos apenas animação de expandir detalhes)

  const expandVariants = {
    collapsed: { height: 0, opacity: 0 },
    expanded: { height: 'auto', opacity: 1 }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('Botão de favorito clicado para linha:', line.id, 'Direção:', direction);
    
    // Atualiza o estado local imediatamente para feedback visual
    setIsFavorited(!isFavorited);
    
    // Chama a função de toggle global
    toggleFollowLine(line.id, favoriteSource, line.name, direction);
    
    // Chama o callback do componente pai se existir
    if (onFavoriteClick) {
      onFavoriteClick(line.id, line.name, direction);
    }
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDetailsModalOpen(true);
    if (onModalShown) {
      onModalShown();
    }
  };

  const handleCardClick = () => {
    if (hasRouteSelected) {
      setIsExpanded(!isExpanded);
    } else {
      setDetailsModalOpen(true);
      if (onModalShown) {
        onModalShown();
      }
    }
    if (onLineClick) {
      onLineClick(line.id);
    }
  };

  // Nome exibido da linha, usando nomes customizados para 'volta'
  const displayedName = direction === 'volta'
    ? getBusDisplayName(line, 'volta')
    : line.displayName;

  // Efeito para abrir modal automaticamente quando shouldShowModal for true
  useEffect(() => {
    if (shouldShowModal) {
      setDetailsModalOpen(true);
      if (onModalShown) {
        onModalShown();
      }
    }
  }, [shouldShowModal, onModalShown]);

  return (
    <>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md w-full hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Conteúdo principal do card */}
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Bloco da linha com gradiente */}
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-md bg-gradient-to-br ${direction === 'ida' ? 'mt-[-35px]' : 'mt-[-20px]'}`}
                style={{ 
                  background: `linear-gradient(135deg, ${line.color} 0%, ${line.color}dd 100%)`,
                  boxShadow: `0 4px 12px ${line.color}40`
                }}
              >
                {line.name}
              </div>
              
              <div className="flex flex-col flex-1 min-w-0">
                <h3 className="font-semibold text-bus-text text-base dark:text-gray-200">
                  {displayedName}
                </h3>

                {/* Selo de status menor, largura automática, só se não for Info */}
                {lineStatus.status !== 'Info' && (
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.text} ${statusStyle.badgeBg} border ${statusStyle.text.replace('text-', 'border-')} dark:${statusStyle.darkText} dark:${statusStyle.darkBadgeBg} dark:${statusStyle.darkText.replace('text-', 'border-')}`}>
                      {lineStatus.status}
                    </span>
                  </div>
                )}

                {/* Rota em duas linhas: "Origem →" em cima e "Destino" embaixo */}
                <div className="flex items-start text-xs text-gray-500 dark:text-gray-300 gap-1 mt-2 min-w-0">
                  <div className="relative flex flex-col items-center mr-0 w-1.5 select-none">
                    {/* Origem: ponto maior (menor que antes para caber melhor em mobile) */}
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-200 block mt-1" />
                    {/* Trilho pontilhado com dois pontos menores, distribuídos */}
                    <div className="relative w-px my-1 h-1">
                      <span className="absolute left-1/2 -translate-x-1/2 top-[1%] w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-500" />
                    </div>
                    {/* Destino: ponto maior (mesmo tamanho da origem) */}
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-200 block" />
                  </div>
                  <div className="flex flex-col leading-tight space-y-1 min-w-0">
                    <span className="font-medium text-[0.93em] truncate whitespace-nowrap dark:text-gray-200">{startStopName}</span>
                    <span className="font-medium text-[0.93em] truncate whitespace-nowrap dark:text-gray-200">{endStopName}</span>
                  </div>
                </div>

                {/* Mostrar rota selecionada quando houver */}
                {hasRouteSelected && (
                  <div className="flex items-center text-xs text-blue-600 dark:text-blue-300 mt-2">
                    {routeSegment && (
                      <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                        <Route className="w-3 h-3" />
                        {routeSegment.intermediateCount} pontos entre origem e destino
                      </span>
                    )}
                    <div className="ml-auto text-gray-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Área de ações e tempo */}
            <div className="flex flex-col items-end gap-2">
              {/* Botão de favoritos */}
              <div className="relative z-10" onClick={handleFavoriteClick}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 p-0 hover:bg-transparent hover:scale-110 transition-transform focus:outline-none focus:ring-0 focus:ring-offset-0"
                  aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <Heart 
                    className={`h-5 w-5 transition-colors ${
                      isFavorited 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-400 hover:text-red-400'
                    }`} 
                  />
                </Button>
              </div>

              {/* Informações de tempo */}
              {direction === 'ida' && (
                <div className="text-right">
                  {renderTimeInfo() && (
                    <div className="mt-1 flex items-center gap-1 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-md justify-center">
                      <Clock className="w-3 h-3" />
                      {renderTimeInfo()}
                    </div>
                  )}
                </div>
              )}

              {direction === 'volta' && (
                <div className="text-right">
                  {/* Sem selos para volta */}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trajeto Detalhado Expansível */}
        <AnimatePresence>
          {hasRouteSelected && isExpanded && routeSegment && (
            <motion.div
              variants={expandVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="border-t border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Trajeto detalhado
                  </span>
                </div>

                <div className="space-y-3">
                  {routeSegment.stops.map((stop, index) => {
                    const isOrigin = index === 0;
                    const isDestination = index === routeSegment.stops.length - 1;
                    const isIntermediate = !isOrigin && !isDestination;

                    return (
                      <div key={stop.id} className="flex items-center gap-3">
                        {/* Círculo indicador */}
                        <div className="flex flex-col items-center">
                          <div 
                            className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              isOrigin 
                                ? 'bg-green-500' 
                                : isDestination 
                                ? 'bg-red-500' 
                                : 'bg-gray-400'
                            }`}
                          />
                          {index < routeSegment.stops.length - 1 && (
                            <div className="w-0.5 h-6 bg-gray-300 dark:bg-gray-500 mt-1" />
                          )}
                        </div>

                        {/* Informações da parada */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              (isOrigin || isDestination)
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-gray-700 dark:text-gray-200'
                            }`}>
                              {stop.name}
                            </span>
                            {isOrigin && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-800/20 dark:text-blue-300 dark:border-blue-600">
                                Origem
                              </Badge>
                            )}
                            {isDestination && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-800/20 dark:text-blue-300 dark:border-blue-600">
                                Destino
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">
                            {stop.location}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rodapé com botão Detalhes expandido */}
        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <Button
            variant="ghost"
            className="w-full h-10 text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-800/20 rounded-none font-medium"
            onClick={handleDetailsClick}
          >
            Detalhes
          </Button>
        </div>
      </div>

      <LineDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        line={line}
        direction={direction}
        lineStatus={lineStatus}
      />
    </>
  );
};