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
  ArrowLeft,
  TestTube
} from 'lucide-react';
import { lines, stops } from '@/data/busData';
import { useAlerts } from '@/hooks/useAlerts';

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

  // Use the new alerts hook
  const { 
    isSupported, 
    permission, 
    requestPermission, 
    scheduleNotifications, 
    cancelNotifications, 
    sendTestNotification 
  } = useAlerts();

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

    // Use the new notification system
    if (alertEnabled && recurringTimes.length > 0) {
      const success = await scheduleNotifications(config);
      if (!success) {
        alert('Erro ao agendar notificações. Verifique se as permissões estão habilitadas.');
        return;
      }
    } else if (!alertEnabled) {
      await cancelNotifications(itemType, itemId);
    }

    onOpenChange(false);
  };

  const handleTestNotification = async () => {
    const success = await sendTestNotification(
      'Teste de Notificação',
      `Notificação de teste para ${itemName}`
    );
    
    if (!success) {
      alert('Erro ao enviar notificação de teste. Verifique se as permissões estão habilitadas.');
    }
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
            {!isSupported && (
              <p className="text-xs text-red-500 mt-2">
                Notificações não suportadas neste navegador
              </p>
            )}
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

              {!isSupported && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-600 dark:text-red-400">
                    ⚠️ Notificações não suportadas neste navegador
                  </p>
                </div>
              )}

              {permission === 'denied' && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-xs text-red-600 dark:text-red-400">
                    ⚠️ Permissão de notificação negada. Habilite nas configurações do navegador.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="alert-enabled" className="text-sm">Ativar alertas</Label>
                <Switch
                  id="alert-enabled"
                  checked={alertEnabled}
                  onCheckedChange={handleToggleAlert}
                  disabled={!isSupported}
                />
              </div>

              {alertEnabled && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between" 
                    onClick={() => setShowAdvanced(true)}
                  >
                    <span>Configurar alertas</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-center gap-2" 
                    onClick={handleTestNotification}
                    size="sm"
                  >
                    <TestTube className="w-4 h-4" />
                    <span>Testar notificação</span>
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
