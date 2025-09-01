import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './dialog';
import { Button } from './button';
import { Badge } from './badge';
import { Info, Clock, MapPin, Route, Calendar, AlertCircle, Navigation } from 'lucide-react';
import { Line, Stop, LineStatus } from '@/types/bus';
import { stops } from '@/data/busData';
import { cn } from '@/lib/utils';
import { getBusDisplayName } from '@/utils/displayUtils';

interface LineDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  line: Line;
  direction: 'ida' | 'volta';
  lineStatus: LineStatus;
}

export const LineDetailsModal: React.FC<LineDetailsModalProps> = ({ 
  isOpen,
  onClose,
  line, 
  direction, 
  lineStatus
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentRoute = direction === 'ida' ? line.routeIda : line.routeVolta;
  const routeStops = currentRoute?.map(stopId => stops.find(s => s.id === stopId)).filter(Boolean) as Stop[];

  const getNextThreeSchedules = useMemo(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Encontrar horários restantes hoje
    const upcomingSchedules = line.schedules
      .filter(schedule => schedule > currentTime);
    
    // Se não há horários restantes hoje, ou se passou 5min do último horário, usar horários de amanhã
    const lastScheduleOfDay = line.schedules[line.schedules.length - 1];
    const lastScheduleTime = new Date();
    const [lastHours, lastMinutes] = lastScheduleOfDay.split(':').map(Number);
    lastScheduleTime.setHours(lastHours, lastMinutes + 5, 0, 0); // +5 minutos após último horário
    
    if (upcomingSchedules.length === 0 || now > lastScheduleTime) {
      // Usar os primeiros 3 horários de amanhã
      return line.schedules.slice(0, 3).map(schedule => ({ schedule, isNextDay: true }));
    }
    
    // Se há menos de 3 horários restantes hoje, mostrar apenas os que existem (não complementar)
    if (upcomingSchedules.length < 3) {
      return upcomingSchedules.map(schedule => ({ schedule, isNextDay: false }));
    }
    
    return upcomingSchedules.slice(0, 3).map(schedule => ({ schedule, isNextDay: false }));
  }, [line.schedules]);

  if (!isOpen) return null;

  const calculateTimeUntil = (schedule: string, isNextDay: boolean = false) => {
    const now = new Date();
    const [hours, minutes] = schedule.split(':').map(Number);
    const scheduleTime = new Date();
    scheduleTime.setHours(hours, minutes, 0, 0);
    
    if (isNextDay || scheduleTime < now) {
      scheduleTime.setDate(scheduleTime.getDate() + 1);
    }
    
    const diffMs = scheduleTime.getTime() - now.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}min`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    }
  };

  const getRemainingSchedulesCount = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return line.schedules.filter(schedule => schedule > currentTime).length;
  };

  const isLastScheduleOfDay = (scheduleIndex: number) => {
    const remainingCount = getRemainingSchedulesCount();
    return remainingCount === 1 && scheduleIndex === 0;
  };

  const getScheduleLabel = (scheduleIndex: number) => {
    const remainingCount = getRemainingSchedulesCount();
    
    if (remainingCount <= 3 && remainingCount > 0) {
      const position = remainingCount - scheduleIndex;
      if (position === 1) {
        return "último horário";
      } else if (position <= 3) {
        return `${position}º restante`;
      }
    }
    
    return null;
  };

  const getStopName = (stop: Stop) => {
    return stop.name;
  };

  const getStopLocation = (stop: Stop) => {
    return stop.location;
  };

  const directionName = direction === 'ida' ? 'Ida' : 'Volta';
  const totalStops = routeStops.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
          "max-h-[85vh] overflow-hidden flex flex-col rounded-2xl",
          isMobile ? "w-[95vw] max-w-sm" : "sm:max-w-2xl w-full"
        )}
        onInteractOutside={onClose}
      >
        <DialogHeader className="flex-shrink-0 px-4 pt-4">
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0" 
              style={{ backgroundColor: line.color }}
            />
            <span className="font-bold">{line.name}</span>
            <span className="text-muted-foreground">—</span>
            <span className="text-sm">{getBusDisplayName(line, direction)}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-4 pb-2">
          <div className="space-y-4">
            {/* INFORMAÇÕES GERAIS */}
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Info className="w-4 h-4" />
                Informações Gerais
              </h3>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted/50 rounded-lg p-2.5 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground text-xs">Sentido</div>
                    <div className="font-medium">{directionName}</div>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2.5 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground text-xs">Total de Paradas</div>
                    <div className="font-medium">{totalStops} pontos</div>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-2.5 flex items-center gap-2 col-span-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground text-xs">Horários Diários</div>
                    <div className="font-medium">{line.schedules.length} saídas programadas</div>
                  </div>
                </div>
              </div>
            </div>

            {/* PRÓXIMOS HORÁRIOS */}
            {direction === 'ida' && (
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Próximas Saídas da Garagem
                </h3>
                
                <div className="space-y-1.5">
                  {getNextThreeSchedules.map((schedule, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className={cn(
                          "font-mono text-sm",
                          isMobile ? "font-bold" : "font-semibold"
                        )}>{schedule.schedule}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-muted-foreground/10 rounded-md px-2.5 py-1.5">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-foreground font-semibold">
                          {calculateTimeUntil(schedule.schedule, schedule.isNextDay)}
                        </span>
                        {getScheduleLabel(index) && (
                          <span className="text-xs text-foreground font-semibold ml-2">
                            {getScheduleLabel(index)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-amber-800 dark:text-amber-200">
                    <strong>Aviso:</strong> Horários programados fornecidos pela UFBA, sujeitos a alterações devido ao trânsito e condições operacionais.
                  </div>
                </div>
              </div>
            )}
            
            {/* ROTEIRO COMPLETO */}
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Route className="w-4 h-4" />
                Roteiro - {directionName}
              </h3>
              
              <div className="space-y-1">
                {routeStops.map((stop, index) => (
                  <div key={stop.id} className="flex items-start gap-2.5">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full flex-shrink-0",
                        index === 0 ? "bg-green-500" : 
                        index === routeStops.length - 1 ? "bg-red-500" : 
                        "bg-blue-500"
                      )} />
                      {index < routeStops.length - 1 && (
                        <div className="w-0.5 h-4 bg-muted-foreground/30 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{getStopName(stop)}</span>
                        {stop.isNew && (
                          <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:bg-blue-900/40">
                            Novo
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {getStopLocation(stop)}
                      </div>
                    </div>
                    <div className={cn(
                      "text-xs text-muted-foreground/60 font-mono tracking-tightest",
                      isMobile && "tracking-[-0.05em]"
                    )}>
                      {index + 1}/{totalStops}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BOTÃO DE FECHAR */}
        {/* REMOVIDO CONFORME SOLICITAÇÃO */}
      </DialogContent>
    </Dialog>
  );
};
