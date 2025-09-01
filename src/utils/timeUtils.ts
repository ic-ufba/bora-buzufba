import { LineStatus } from '@/types/bus';

export const calculateLineStatus = (schedules: string[]): LineStatus => {
  if (!schedules || schedules.length === 0) {
    return { 
      status: 'Encerrado',
      nextDeparture: undefined,
      timeRemaining: undefined,
      timeSinceDeparture: undefined,
      isLastTrip: true
    };
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const scheduleTimes = schedules
    .map((schedule, index) => {
      const [hours, minutes] = schedule.split(':').map(Number);
      const time = hours * 60 + minutes;
      return { 
        time,
        original: schedule,
        isLast: index === schedules.length - 1
      };
    })
    .filter(({ time }) => !isNaN(time));

  if (scheduleTimes.length === 0) {
    return { 
      status: 'Encerrado',
      nextDeparture: undefined,
      timeRemaining: undefined,
      timeSinceDeparture: undefined,
      isLastTrip: true
    };
  }

  const pastSchedules = scheduleTimes.filter(({ time }) => time < currentTime);
  const futureSchedules = scheduleTimes.filter(({ time }) => time >= currentTime);

  // Verifica se um ônibus acabou de sair (status 'Saiu')
  if (pastSchedules.length > 0) {
    const lastDeparture = pastSchedules[pastSchedules.length - 1];
    const timeSinceDeparture = currentTime - lastDeparture.time;
    if (timeSinceDeparture <= 5) {
      return {
        status: 'Saiu',
        nextDeparture: futureSchedules[0]?.original,
        timeSinceDeparture,
        timeRemaining: undefined,
        isLastTrip: false
      };
    }
  }

  // Verifica os próximos horários
  if (futureSchedules.length > 0) {
    const nextSchedule = futureSchedules[0];
    const timeRemaining = nextSchedule.time - currentTime;

    if (timeRemaining === 0) {
      return { 
        status: 'Agora', 
        nextDeparture: nextSchedule.original, 
        timeRemaining, 
        timeSinceDeparture: undefined,
        isLastTrip: nextSchedule.isLast
      };
    }
    if (timeRemaining <= 5) {
      return { 
        status: 'Saindo', 
        nextDeparture: nextSchedule.original, 
        timeRemaining, 
        timeSinceDeparture: undefined,
        isLastTrip: nextSchedule.isLast
      };
    }
    if (timeRemaining <= 15) {
      return { 
        status: 'Próximo', 
        nextDeparture: nextSchedule.original, 
        timeRemaining, 
        timeSinceDeparture: undefined,
        isLastTrip: nextSchedule.isLast
      };
    }
    // Para 'Aguardando', também retornamos o tempo
    return { 
      status: 'Aguardando', 
      nextDeparture: nextSchedule.original, 
      timeRemaining, 
      timeSinceDeparture: undefined,
      isLastTrip: nextSchedule.isLast
    };
  }

  // Se não há mais horários para hoje
  return { 
    status: 'Encerrado',
    nextDeparture: undefined,
    timeRemaining: undefined,
    timeSinceDeparture: undefined,
    isLastTrip: true
  };
};

export const formatTimeRemaining = (minutes: number): string => {
  if (minutes <= 0) return 'Agora';
  if (minutes < 60) return `${minutes}min`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}min`;
};

export const formatTimeSince = (minutes: number): string => {
  if (minutes < 1) return 'há instantes';
  return `há ${minutes} min`;
};

export const getStatusColor = (status: LineStatus['status']): string => {
  switch (status) {
    case 'Agora':
      return 'bus-green';
    case 'Saindo':
      return 'bus-yellow';
    case 'Saiu':
      return 'bus-orange';
    case 'Próximo':
      return 'bus-blue';
    case 'Aguardando':
      return 'bus-gray';
    case 'Encerrado':
      return 'bus-gray';
    default:
      return 'bus-gray';
  }
};