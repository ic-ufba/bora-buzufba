import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Bell, 
  Clock, 
  Plus, 
  Trash2, 
  Calendar,
  MapPin,
  Bus,
  Settings,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { lines, stops } from '@/data/busData';

interface AlertConfig {
  id: string;
  itemType: 'line' | 'stop';
  itemId: string;
  itemName: string;
  enabled: boolean;
  advanceTimes: number[]; // múltiplos tempos de antecedência
  afterDepartureTimes: number[]; // múltiplos tempos após início
  recurringTimes: string[]; // horários recorrentes baseados nos horários reais
  stopDirections?: ('ida' | 'volta')[]; // direções específicas para pontos
  // Para alertas de pontos
  selectedLines?: Array<{
    lineId: string;
    lineName: string;
    directions: ('ida' | 'volta')[];
  }>;
  alertAllLines?: boolean; // Se true, alerta para todas as linhas
}

interface AlertsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType?: 'line' | 'stop';
  itemId?: string;
  itemName?: string;
  direction?: 'ida' | 'volta'; // Add direction prop
}

const ADVANCE_TIME_OPTIONS = [
  { value: 0, label: 'Na hora' },
  { value: 5, label: '5 minutos antes' },
  { value: 10, label: '10 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' }
];

const AFTER_DEPARTURE_OPTIONS = [
  { value: 5, label: '5 minutos após início' },
  { value: 10, label: '10 minutos após início' },
  { value: 15, label: '15 minutos após início' },
  { value: 20, label: '20 minutos após início' },
  { value: 30, label: '30 minutos após início' }
];

// Função para solicitar permissão de notificação
const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Este navegador não suporta notificações');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Função para enviar notificação
const sendNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  }
};

// Função para agendar notificações baseadas nos horários
const scheduleNotifications = (config: AlertConfig) => {
  // Limpar notificações anteriores para este item
  const existingKey = `borabuz-notifications-${config.itemType}-${config.itemId}`;
  const existingTimeouts = JSON.parse(localStorage.getItem(existingKey) || '[]');
  existingTimeouts.forEach((timeoutId: number) => clearTimeout(timeoutId));

  if (!config.enabled) {
    localStorage.removeItem(existingKey);
    return;
  }

  const timeouts: number[] = [];
  const now = new Date();
  const today = now.toDateString();

  config.recurringTimes.forEach(time => {
    config.advanceTimes.forEach(advanceMinutes => {
      const [hours, minutes] = time.split(':').map(Number);
      const notificationTime = new Date();
      notificationTime.setHours(hours, minutes - advanceMinutes, 0, 0);

      // Se o horário já passou hoje, agendar para amanhã
      if (notificationTime <= now) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }

      const delay = notificationTime.getTime() - now.getTime();
      
      if (delay > 0) {
        const timeoutId = window.setTimeout(() => {
          const notificationMessage = generateNotificationMessage(config, time);
          sendNotification(notificationMessage.title, {
            body: notificationMessage.body,
            tag: `borabuz-${config.itemType}-${config.itemId}-${time}`,
            requireInteraction: true
          });
        }, delay);

        timeouts.push(timeoutId);
      }
    });

    config.afterDepartureTimes.forEach(afterDepartureMinutes => {
      const [hours, minutes] = time.split(':').map(Number);
      const notificationTime = new Date();
      notificationTime.setHours(hours, minutes, 0, 0);

      // Se o horário já passou hoje, agendar para amanhã
      if (notificationTime <= now) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }

      const delay = notificationTime.getTime() - now.getTime() + afterDepartureMinutes * 60 * 1000;
      
      if (delay > 0) {
        const timeoutId = window.setTimeout(() => {
          const notificationMessage = generateNotificationMessage(config, time, afterDepartureMinutes);
          sendNotification(notificationMessage.title, {
            body: notificationMessage.body,
            tag: `borabuz-${config.itemType}-${config.itemId}-${time}`,
            requireInteraction: true
          });
        }, delay);

        timeouts.push(timeoutId);
      }
    });
  });

  localStorage.setItem(existingKey, JSON.stringify(timeouts));
};

// Função para calcular número de paradas até o ponto alvo
const calculateStopsToTarget = (lineId: string, targetStopId: string, direction: 'ida' | 'volta'): number => {
  const line = lines.find(l => l.id === lineId);
  if (!line) return 0;

  const route = direction === 'ida' ? line.routeIda : line.routeVolta;
  const targetIndex = route.indexOf(targetStopId);
  
  if (targetIndex === -1) {
    // Se não encontrou na direção especificada, verificar se passa na outra direção
    const otherRoute = direction === 'ida' ? line.routeVolta : line.routeIda;
    const otherIndex = otherRoute.indexOf(targetStopId);
    
    if (otherIndex !== -1) {
      // Conta todas as paradas da primeira direção + paradas até o ponto na segunda direção
      return route.length + otherIndex;
    }
    return 0;
  }
  
  return targetIndex;
};

// Função para gerar mensagem de notificação com contagem de paradas
const generateNotificationMessage = (config: AlertConfig, time: string, afterMinutes?: number): { title: string, body: string } => {
  if (config.itemType === 'line') {
    const title = ` Linha ${config.itemName}`;
    const body = afterMinutes 
      ? `Saída iniciada há ${afterMinutes} minutos (${time})`
      : `Saída agora às ${time}`;
    return { title, body };
  } else {
    // Para pontos, verificar direções selecionadas
    const title = ` Ponto ${config.itemName}`;
    let body = '';
    
    // Obter linhas que passam no ponto
    const linesAtStop = lines.filter(line => 
      line.routeIda.includes(config.itemId) || line.routeVolta.includes(config.itemId)
    );
    
    // Se tem direções específicas selecionadas, filtrar por elas
    if (config.stopDirections && config.stopDirections.length > 0) {
      linesAtStop.forEach(line => {
        const passesInIda = line.routeIda.includes(config.itemId);
        const passesInVolta = line.routeVolta.includes(config.itemId);
        
        config.stopDirections!.forEach(direction => {
          if ((direction === 'ida' && passesInIda) || (direction === 'volta' && passesInVolta)) {
            const stopsCount = calculateStopsToTarget(line.id, config.itemId, direction);
            const directionName = direction === 'ida' ? 'Ida' : 'Volta';
            
            if (afterMinutes) {
              body += `${line.name} (${directionName}) iniciou há ${afterMinutes}min - ${stopsCount} paradas até você. `;
            } else {
              body += `${line.name} (${directionName}) - ${stopsCount} paradas até você. `;
            }
          }
        });
      });
    } else {
      // Se não tem direções específicas, mostrar todas
      linesAtStop.forEach(line => {
        const passesInIda = line.routeIda.includes(config.itemId);
        const passesInVolta = line.routeVolta.includes(config.itemId);
        
        if (passesInIda) {
          const stopsCount = calculateStopsToTarget(line.id, config.itemId, 'ida');
          if (afterMinutes) {
            body += `${line.name} (Ida) iniciou há ${afterMinutes}min - ${stopsCount} paradas até você. `;
          } else {
            body += `${line.name} (Ida) - ${stopsCount} paradas até você. `;
          }
        }
        
        if (passesInVolta) {
          const stopsCount = calculateStopsToTarget(line.id, config.itemId, 'volta');
          if (afterMinutes) {
            body += `${line.name} (Volta) iniciou há ${afterMinutes}min - ${stopsCount} paradas até você. `;
          } else {
            body += `${line.name} (Volta) - ${stopsCount} paradas até você. `;
          }
        }
      });
    }
    
    return { title, body: body.trim() || `Horário: ${time}` };
  }
};

export const AlertsModal: React.FC<AlertsModalProps> = ({
  open,
  onOpenChange,
  itemType,
  itemId,
  itemName,
  direction, // Add direction prop
}) => {
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advanceTimes, setAdvanceTimes] = useState<number[]>([0]); // padrão: na hora
  const [afterDepartureTimes, setAfterDepartureTimes] = useState<number[]>([]); // padrão: nenhum
  const [recurringTimes, setRecurringTimes] = useState<string[]>([]);
  const [selectedLines, setSelectedLines] = useState<Array<{
    lineId: string;
    lineName: string;
    directions: ('ida' | 'volta')[];
  }>>([]);
  const [alertAllLines, setAlertAllLines] = useState(false);
  const [stopDirections, setStopDirections] = useState<('ida' | 'volta')[]>([]);

  // Carregar configurações ao abrir modal
  useEffect(() => {
    if (open && itemType && itemId) {
      const alertKey = itemType === 'line' && direction 
        ? `borabuz-alert-${itemType}-${itemId}-${direction}`
        : `borabuz-alert-${itemType}-${itemId}`;
      
      const savedAlert = localStorage.getItem(alertKey);
      
      if (savedAlert) {
        try {
          const config = JSON.parse(savedAlert);
          setAlertEnabled(config.enabled || false);
          setAdvanceTimes(config.advanceTimes || [0]);
          setAfterDepartureTimes(config.afterDepartureTimes || []);
          setRecurringTimes(config.recurringTimes || []);
          setSelectedLines(config.selectedLines || []);
          setAlertAllLines(config.alertAllLines || false);
          setStopDirections(config.stopDirections || []);
          setShowAdvanced(config.enabled || false);
        } catch (error) {
          console.error('Erro ao carregar configuração de alerta:', error);
        }
      } else {
        // Reset para valores padrão
        setAlertEnabled(false);
        setAdvanceTimes([0]);
        setAfterDepartureTimes([]);
        setRecurringTimes([]);
        setSelectedLines([]);
        setAlertAllLines(false);
        setStopDirections([]);
        setShowAdvanced(false);
      }
    }
  }, [open, itemType, itemId, direction]);

  const saveAlertConfig = async () => {
    if (!itemType || !itemId || !itemName) return;

    // Solicitar permissão de notificação se alerta estiver ativado
    if (alertEnabled) {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        alert('Para receber alertas, você precisa permitir notificações no seu navegador.');
        return;
      }
    }

    const alertKey = itemType === 'line' && direction 
      ? `borabuz-alert-${itemType}-${itemId}-${direction}`
      : `borabuz-alert-${itemType}-${itemId}`;
    
    const config: AlertConfig = {
      id: alertKey,
      itemType,
      itemId,
      itemName,
      enabled: alertEnabled,
      advanceTimes,
      afterDepartureTimes,
      recurringTimes,
      stopDirections,
      selectedLines,
      alertAllLines
    };

    localStorage.setItem(alertKey, JSON.stringify(config));

    // Agendar notificações se ativo
    if (alertEnabled && recurringTimes.length > 0) {
      scheduleNotifications(config);
    }

    onOpenChange(false);
  };

  const toggleAdvanceTime = (time: number) => {
    if (advanceTimes.includes(time)) {
      setAdvanceTimes(advanceTimes.filter(t => t !== time));
    } else {
      setAdvanceTimes([...advanceTimes, time]);
    }
  };

  const toggleAfterDepartureTime = (time: number) => {
    if (afterDepartureTimes.includes(time)) {
      setAfterDepartureTimes(afterDepartureTimes.filter(t => t !== time));
    } else {
      setAfterDepartureTimes([...afterDepartureTimes, time]);
    }
  };

  const toggleRecurringTime = (time: string) => {
    if (recurringTimes.includes(time)) {
      setRecurringTimes(recurringTimes.filter(t => t !== time));
    } else {
      setRecurringTimes([...recurringTimes, time]);
    }
  };

  const toggleSelectedLine = (lineId: string, lineName: string, direction: 'ida' | 'volta') => {
    const existingLine = selectedLines.find(line => line.lineId === lineId);
    if (existingLine) {
      if (existingLine.directions.includes(direction)) {
        existingLine.directions = existingLine.directions.filter(dir => dir !== direction);
      } else {
        existingLine.directions.push(direction);
      }
    } else {
      setSelectedLines([...selectedLines, { lineId, lineName, directions: [direction] }]);
    }
  };

  const toggleAlertAllLines = (enabled: boolean) => {
    setAlertAllLines(enabled);
    if (!enabled) {
      setSelectedLines([]);
    }
  };

  const toggleStopDirection = (direction: 'ida' | 'volta') => {
    if (stopDirections.includes(direction)) {
      setStopDirections(stopDirections.filter(dir => dir !== direction));
    } else {
      setStopDirections([...stopDirections, direction]);
    }
  };

  // Obter horários reais da linha
  const getLineSchedules = (): string[] => {
    if (itemType !== 'line' || !itemId) return [];
    
    // Extrair o ID real da linha se estiver no formato composto
    const actualLineId = itemId.includes('::') ? itemId.split('::')[0] : itemId;
    
    const line = lines.find(l => l.id === actualLineId);
    return line?.schedules || [];
  };

  // Calcular quantos pontos até chegar ao destino
  const calculateStopsToDestination = (lineId: string, stopId: string): number => {
    const line = lines.find(l => l.id === lineId);
    if (!line) return 0;

    const idaIndex = line.routeIda.indexOf(stopId);
    if (idaIndex !== -1) {
      return idaIndex;
    }

    const voltaIndex = line.routeVolta.indexOf(stopId);
    if (voltaIndex !== -1) {
      return line.routeIda.length + voltaIndex;
    }

    return 0;
  };

  const getAlertDescription = (): string => {
    if (!itemType || !itemName) return '';

    if (itemType === 'line') {
      return `Receba notificações quando a ${itemName} começar o percurso`;
    } else {
      const linesAtStop = lines.filter(line => 
        line.routeIda.includes(itemId!) || line.routeVolta.includes(itemId!)
      );
      
      if (linesAtStop.length > 0) {
        const firstLine = linesAtStop[0];
        const stopsCount = calculateStopsToDestination(firstLine.id, itemId!);
        return `Receba notificações quando a linha começar o percurso e sair do ponto inicial (${stopsCount} pontos até chegar no seu favorito)`;
      }
      
      return `Receba notificações quando a linha começar o percurso e passar por ${itemName}`;
    }
  };

  const handleToggleAlert = (enabled: boolean) => {
    setAlertEnabled(enabled);
    if (enabled) {
      setShowAdvanced(true);
    } else {
      setShowAdvanced(false);
    }
  };

  const handleSave = () => {
    saveAlertConfig();
    onOpenChange(false);
  };

  const handleBack = () => {
    setShowAdvanced(false);
  };

  if (!itemType || !itemId || !itemName) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Sistema de Alertas</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Selecione um item favorito para configurar alertas
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {showAdvanced && (
              <Button variant="ghost" size="sm" onClick={handleBack} className="p-1 h-auto">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Bell className="w-4 h-4" />
            {showAdvanced ? 'Configurar Alerta' : 'Alerta'}
          </DialogTitle>
        </DialogHeader>

        {!showAdvanced ? (
          // Tela inicial simplificada
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                {itemType === 'line' ? (
                  <Bus className="w-5 h-5 text-bus-blue" />
                ) : (
                  <MapPin className="w-5 h-5 text-bus-blue" />
                )}
                <div className="flex-1">
                  <h3 className="font-medium">{itemName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {itemType === 'line' ? 'Linha' : 'Ponto de parada'}
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">
                {getAlertDescription()}
              </p>

              <div className="flex items-center justify-between">
                <Label htmlFor="alert-enabled" className="text-sm">Ativar alertas</Label>
                <Switch
                  id="alert-enabled"
                  checked={alertEnabled}
                  onCheckedChange={handleToggleAlert}
                />
              </div>

              {alertEnabled && (
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between" 
                    onClick={() => setShowAdvanced(true)}
                  >
                    <span>Configurar alertas</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="flex-1">
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          // Tela de configuração avançada
          <div className="space-y-4">
            {/* Tempo de Antecedência */}
            <Card className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Tempo de Antecedência
              </h3>
              
              <div className="space-y-2">
                <Label className="text-sm">Receber notificação (pode selecionar múltiplas opções):</Label>
                <div className="space-y-2">
                  {ADVANCE_TIME_OPTIONS.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`advance-${option.value}`}
                        checked={advanceTimes.includes(option.value)}
                        onCheckedChange={() => toggleAdvanceTime(option.value)}
                      />
                      <Label 
                        htmlFor={`advance-${option.value}`} 
                        className="text-sm font-normal"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Tempo após início */}
            <Card className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Tempo após início
              </h3>
              
              <div className="space-y-2">
                <Label className="text-sm">Receber notificação (pode selecionar múltiplas opções):</Label>
                <div className="space-y-2">
                  {AFTER_DEPARTURE_OPTIONS.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`after-departure-${option.value}`}
                        checked={afterDepartureTimes.includes(option.value)}
                        onCheckedChange={() => toggleAfterDepartureTime(option.value)}
                      />
                      <Label 
                        htmlFor={`after-departure-${option.value}`} 
                        className="text-sm font-normal"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Horários Recorrentes */}
            <Card className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Horários Recorrentes
              </h3>
              
              <div className="space-y-3">
                {itemType === 'line' ? (
                  <div>
                    <Label className="text-sm">Horários da linha {itemName}:</Label>
                    <div className="text-xs text-muted-foreground mt-1 mb-2">
                      Selecione os horários em que deseja ser notificado
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {getLineSchedules().map((time, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Checkbox
                            id={`line-schedule-${time}`}
                            checked={recurringTimes.includes(time)}
                            onCheckedChange={() => toggleRecurringTime(time)}
                          />
                          <Label 
                            htmlFor={`line-schedule-${time}`} 
                            className="text-sm font-normal"
                          >
                            {time}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="text-sm">Horários por linha:</Label>
                    <div className="text-xs text-muted-foreground mt-1 mb-2">
                      Horários organizados por linha que passa no ponto
                    </div>
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {lines
                        .filter(line => 
                          line.routeIda.includes(itemId!) || line.routeVolta.includes(itemId!)
                        )
                        .map(line => (
                          <div key={line.id} className="border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div 
                                className="w-4 h-4 rounded" 
                                style={{ backgroundColor: line.color }}
                              />
                              <Label className="font-medium text-sm">{line.name}</Label>
                              <Badge variant="outline" className="text-xs">
                                {line.schedules.length} horários
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              {line.schedules.map((time, timeIndex) => (
                                <div key={timeIndex} className="flex items-center space-x-1">
                                  <Checkbox
                                    id={`line-${line.id}-schedule-${time}`}
                                    checked={recurringTimes.includes(time)}
                                    onCheckedChange={() => toggleRecurringTime(time)}
                                    className="scale-75"
                                  />
                                  <Label 
                                    htmlFor={`line-${line.id}-schedule-${time}`} 
                                    className="text-xs font-normal"
                                  >
                                    {time}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="mt-3">
                      <Label className="text-sm">Horários selecionados:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {recurringTimes.map((time, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Direções */}
            {itemType === 'stop' && (
              <Card className="p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Direções
                </h3>
                
                <div className="space-y-2">
                  <Label className="text-sm">Selecione as direções para as quais deseja ser notificado:</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="direction-ida"
                        checked={stopDirections.includes('ida')}
                        onCheckedChange={() => toggleStopDirection('ida')}
                      />
                      <Label 
                        htmlFor="direction-ida" 
                        className="text-sm font-normal"
                      >
                        Ida
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="direction-volta"
                        checked={stopDirections.includes('volta')}
                        onCheckedChange={() => toggleStopDirection('volta')}
                      />
                      <Label 
                        htmlFor="direction-volta" 
                        className="text-sm font-normal"
                      >
                        Volta
                      </Label>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Voltar
              </Button>
              <Button onClick={handleSave} className="flex-1">
                Salvar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
