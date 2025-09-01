import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { ChevronDown, ChevronUp, Clock, MapPin, Star, Info } from 'lucide-react';
import { lines, stops } from '@/data/busData';
import { calculateLineStatus, formatTimeRemaining } from '@/utils/timeUtils';
import { getBusDisplayName } from '@/utils/displayUtils';
import { useTheme } from '@/components/theme/theme-provider';

const Lines: React.FC = () => {
  const { theme } = useTheme();
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());

  const toggleLineExpansion = (lineId: string) => {
    const newExpanded = new Set(expandedLines);
    if (newExpanded.has(lineId)) {
      newExpanded.delete(lineId);
    } else {
      newExpanded.add(lineId);
    }
    setExpandedLines(newExpanded);
  };

  const closeLineExpansion = (lineId: string) => {
    if (expandedLines.has(lineId)) {
      const newExpanded = new Set(expandedLines);
      newExpanded.delete(lineId);
      setExpandedLines(newExpanded);
    }
  };

  const LineCard = ({ line }: { line: typeof lines[0] }) => {
    const lineStatusIda = calculateLineStatus(line.schedules);
    const isExpanded = expandedLines.has(line.id);

    const getStopName = (stopId: string) => {
        const stop = stops.find(s => s.id === stopId);
        return stop?.name || stopId;
    };

    return (
      <Card className="shadow-card overflow-hidden rounded-2xl">
        {/* Header da linha - sempre visível */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: line.color }}
              >
                {line.name}
              </div>
              <div className="flex-1">
                {/* Nome da linha IDA */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2 py-0.5 text-gray-400 dark:text-gray-300 text-[10px] font-medium tracking-tight shadow-none" style={{minWidth: 36, justifyContent: 'center', background: 'none', border: 'none'}}>
                    Ida
                  </span>
                  <h3 className="font-semibold text-bus-text text-base">
                    {getBusDisplayName(line, 'ida')}
                  </h3>
                </div>
                {/* Nome da linha VOLTA */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 text-gray-400 dark:text-gray-400 text-[10px] font-medium tracking-tight shadow-none" style={{minWidth: 36, justifyContent: 'center', background: 'none', border: 'none'}}>
                    Volta
                  </span>
                  <h4 className="font-medium text-bus-text text-sm text-gray-600 dark:text-gray-400">
                    {getBusDisplayName(line, 'volta')}
                  </h4>
                </div>
              </div>
            </div>
          </div>
          </div>

        {/* Detalhes expandidos */}
        {isExpanded && (
          <div 
            className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 cursor-pointer"
            onClick={() => closeLineExpansion(line.id)}
          >
            <div className="p-3 space-y-3">
              {/* Rotas */}
              <div className="space-y-2">
                <h4 className="font-semibold text-bus-text text-sm">Roteiro</h4>
                {/* Rota IDA */}
          <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-bus-blue rounded-full"></div>
                    <span className="text-sm font-medium text-bus-text">Ida</span>
                  </div>
                  <div className="ml-5 space-y-0.5">
                    {line.routeIda.map((stopId, index) => (
                      <div key={stopId} className="flex items-start gap-2">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full ${
                            index === 0 ? 'bg-green-500' : 
                            index === line.routeIda.length - 1 ? 'bg-red-500' : 
                            'bg-blue-500'
                          }`} />
                          {index < line.routeIda.length - 1 && (
                            <div className="w-0.5 h-2 bg-gray-300 mt-0.5" />
                          )}
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {getStopName(stopId)}
                  </span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Rota VOLTA */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-bus-blue/90 rounded-full"></div>
                    <span className="text-sm font-medium text-bus-text">Volta</span>
                  </div>
                  <div className="ml-5 space-y-0.5">
                    {line.routeVolta.map((stopId, index) => (
                      <div key={stopId} className="flex items-start gap-2">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full ${
                            index === 0 ? 'bg-green-500' : 
                            index === line.routeVolta.length - 1 ? 'bg-red-500' : 
                            'bg-blue-500'
                          }`} />
                          {index < line.routeVolta.length - 1 && (
                            <div className="w-0.5 h-2 bg-gray-300 mt-0.5" />
                          )}
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {getStopName(stopId)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Horários */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-bus-blue" />
                  <h4 className="font-semibold text-bus-text text-sm">Horários de Saída</h4>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {line.schedules.map((time, index) => (
                    <div
                      key={index}
                      className="p-1.5 bg-white dark:bg-gray-800 rounded-lg border text-center"
                    >
                      <div className="font-mono font-bold text-sm text-bus-text">
                        {time}
                      </div>
                </div>
              ))}
                </div>
                {/* Aviso sobre horários */}
                <div className="p-1.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-[10px] text-blue-700 dark:text-blue-300 text-center flex items-center justify-center gap-1">
                    <Info className="w-3 h-3 inline-block" />
                    Os horários são fornecidos pela UFBA e podem variar conforme o trânsito.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Botão de detalhes como rodapé do card */}
        <button
          onClick={() => toggleLineExpansion(line.id)}
          className={`w-full text-center font-medium transition-all duration-150 py-2 text-sm border-0 border-t ${
            theme === 'dark' 
              ? 'text-gray-300 bg-gray-800 border-t-gray-700 hover:bg-gray-700' 
              : 'text-gray-500 bg-[#f6f7fa] border-t-[#f1f3f6] hover:bg-gray-100'
          }`}
          style={{marginBottom: 0, borderRadius: 0}}
        >
          {isExpanded ? 'Ocultar Detalhes' : 'Detalhes'}
        </button>
      </Card>
    );
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
                  Linhas de Ônibus
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
        <div className="space-y-4">
            {lines.map((line) => (
            <LineCard key={line.id} line={line} />
          ))}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Lines;