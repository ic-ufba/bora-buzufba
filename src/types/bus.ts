export interface Line {
  id: string;
  name: string;
  displayName: string;
  color: string;
  route: string[];
  routeIda: string[];
  routeVolta: string[];
  schedules: string[];
  direction?: Direction; // Adicionada para refletir a direção dinâmica
}

export interface Stop {
  id: string;
  name: string;
  location?: string;
  isNew?: boolean;
}

export type Direction = 'ida' | 'volta';

export type LineStatusName = 
  | 'Aguardando'
  | 'Próximo'
  | 'Saindo'
  | 'Agora'
  | 'Saiu'
  | 'Encerrado'
  | 'Info';

export type LineStatus = {
  status: LineStatusName;
  nextDeparture?: string;
  timeRemaining?: number;
  timeSinceDeparture?: number;
  isLastTrip?: boolean;
};

export interface FilterState {
  selectedStop?: string;
  sortBy?: 'lineNumber' | 'alphabetical' | 'nextDeparture';
  direction?: Direction;
  selectedLines?: string[];
  orderBy?: 'lineNumber' | 'departureTime';
  onlyStartingPoints?: boolean;
}

export interface RoutePlannerState {
  origin?: string;
  destination?: string;
  isActive: boolean;
}