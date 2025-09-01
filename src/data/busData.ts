import { Line, Stop } from '@/types/bus';

// ===== PONTOS DE PARADA CENTRALIZADOS =====
export const stops: Stop[] = [
  // Pontos principais dos campi
  { id: 'estacionamento-sao-lazaro', name: 'Estacionamento São Lázaro', location: 'Campus São Lázaro' },
  { id: 'politecnica', name: 'Politécnica', location: 'Escola Politécnica' },
  { id: 'arquitetura', name: 'Arquitetura', location: 'Faculdade de Arquitetura' },
  { id: 'residencia-5', name: 'Residência 5', location: 'Residência Universitária' },
  { id: 'campus-vale-canela', name: 'Campus Vale do Canela (Entrada ICS)', location: 'Instituto de Ciências da Saúde' },
  { id: 'isc-canela', name: 'ISC Canela', location: 'Instituto de Ciências da Saúde', isNew: true },
  { id: 'odontologia', name: 'Odontologia', location: 'Faculdade de Odontologia', isNew: true },
  { id: 'reitoria', name: 'Reitoria', location: 'Campus Ondina' },
  { id: 'creche-canela', name: 'Creche — Canela', location: 'Creche UFBA' },
  { id: 'graca-r2', name: 'Graça R2 (Delícia)', location: 'Bairro Graça' },
  { id: 'faculdade-direito', name: 'Faculdade de Direito', location: 'Faculdade de Direito', isNew: true },
  { id: 'faced', name: 'Faced', location: 'Faculdade de Educação' },
  { id: 'estacionamento-paf-matematica', name: 'Estacionamento PAF I (Matemática)', location: 'Campus Ondina' },
  { id: 'proae', name: 'PROAE', location: 'Pró-Reitoria de Assistência Estudantil' },
  
  // Pontos específicos B2
  { id: 'av-garibaldi-r5', name: 'Av. Garibaldi R5', location: 'Avenida Garibaldi' },
  { id: 'sao-lazaro', name: 'São Lázaro', location: 'Campus São Lázaro' },
  { id: 'creche-canela-acesso', name: 'Creche / Canela/Acesso: ADM / FACED / FMB', location: 'Vale do Canela' },
  { id: 'residencia-1-vitoria', name: 'Residência I - Ponto de Distribuição Vitória', location: 'Residência Universitária' },
  { id: 'isc-nova-parada', name: 'ISC', location: 'Instituto de Ciências da Saúde', isNew: true },
  { id: 'estacionamento-geociencias', name: 'Estacionamento Geociências', location: 'Instituto de Geociências' },
  
  // Pontos específicos B3
  { id: 'av-garibaldi', name: 'Av. Garibaldi', location: 'Avenida Garibaldi' },
  { id: 'campus-vale-canela-economia', name: 'Campus Vale do Canela', location: 'Faculdade de Economia' },
  { id: 'avenida-7-setembro', name: 'Avenida 7 de Setembro / Faculdade de Economia', location: 'Faculdade de Economia' },
  { id: 'belas-artes', name: 'Belas Artes', location: 'Escola de Belas Artes' },
  
  // Pontos específicos B4
  { id: 'rua-direita-piedade', name: 'Rua Direita da Piedade / Faculdade de Economia', location: 'Piedade' },
  { id: 'piedade', name: 'Piedade', location: 'Estação Piedade' },
  { id: 'residencia-1-dist-vitoria', name: 'Residência I - P. de Dist. Vitória', location: 'Residência Universitária' },
  { id: 'graca-r2', name: 'Graça R2 (Delícia)', location: 'Bairro Graça' },
  
  // Pontos específicos B5
  { id: 'instituto-geociencias', name: 'Instituto de Geociências', location: 'Instituto de Geociências' },
  { id: 'facom', name: 'Facom', location: 'Faculdade de Comunicação' },
  { id: 'portaria-principal', name: 'Portaria Principal', location: 'Campus Ondina' },
  { id: 'centro-esportes', name: 'Centro Esportes', location: 'Centro de Esportes UFBA' },
  { id: 'ics', name: 'ICS', location: 'Instituto de Ciências da Saúde' },
  { id: 'p-odontologia', name: 'Odontologia', location: 'Faculdade de Odontologia' }
];

// ===== LINHAS CENTRALIZADAS COM DADOS COMPLETOS =====
export const lines: Line[] = [
  // ROTA B1 - São Lázaro ↔ Odontologia/Reitoria (17,0 km)
  {
    id: 'b1',
    name: 'B1',
    displayName: 'São Lázaro - Odontologia',
    color: '#3B82F6',
    route: ['estacionamento-sao-lazaro', 'reitoria'],
    routeIda: [
      'estacionamento-sao-lazaro',
      'politecnica',
      'arquitetura',
      'residencia-5',
      'campus-vale-canela',
      'isc-canela',
      'odontologia'
    ],
    routeVolta: [
      'reitoria',
      'creche-canela',
      'graca-r2',
      'faculdade-direito',
      'faced',
      'estacionamento-paf-matematica',
      'proae',
      'politecnica',
      'estacionamento-sao-lazaro'
    ],
    schedules: [
      '06:10', '07:10', '08:10', '09:10', '10:10', '11:10', '12:10', '13:10', '14:10',
      '15:10', '16:10', '17:10', '18:10', '19:10', '20:10', '21:10', '22:10'
    ]
  },

  // ROTA B2 - Ondina ↔ Reitoria (15 km)
  {
    id: 'b2',
    name: 'B2',
    displayName: 'Ondina - Reitoria',
    color: '#F59E0B',
    route: ['estacionamento-paf-matematica', 'residencia-1-vitoria'],
    routeIda: [
      'estacionamento-paf-matematica',
      'av-garibaldi-r5',
      'proae',
      'politecnica',
      'sao-lazaro',
      'creche-canela-acesso',
      'reitoria'
    ],
    routeVolta: [
      'residencia-1-vitoria',
      'faculdade-direito',
      'isc-nova-parada',
      'odontologia',
      'reitoria',
      'creche-canela',
      'politecnica',
      'sao-lazaro',
      'arquitetura',
      'estacionamento-geociencias',
      'estacionamento-paf-matematica'
    ],
    schedules: [
      '06:00', '07:10', '08:20', '09:30', '10:40', '11:50', '13:00', '14:10',
      '15:20', '16:30', '17:40', '18:50', '20:00', '21:10', '22:20'
    ]
  },

  // ROTA B3 - Ondina ↔ Belas Artes (13 km)
  {
    id: 'b3',
    name: 'B3',
    displayName: 'Ondina - Belas Artes',
    color: '#10B981',
    route: ['estacionamento-paf-matematica', 'reitoria'],
    routeIda: [
      'estacionamento-paf-matematica',
      'av-garibaldi',
      'campus-vale-canela-economia',
      'avenida-7-setembro',
      'belas-artes'
    ],
    routeVolta: [
      'reitoria',
      'creche-canela',
      'politecnica',
      'arquitetura',
      'estacionamento-geociencias',
      'estacionamento-paf-matematica'
    ],
    schedules: [
      '06:30', '07:20', '08:10', '09:00', '09:50', '10:40', '11:30', '12:20', '13:10', '14:00',
      '14:50', '15:40', '16:30', '17:20', '18:10', '19:00', '19:50', '20:40', '21:30', '22:20'
    ]
  },

  // ROTA B4 - Ondina ↔ Economia (14 km)
  {
    id: 'b4',
    name: 'B4',
    displayName: 'Ondina - Economia',
    color: '#EF4444',
    route: ['estacionamento-paf-matematica', 'piedade'],
    routeIda: [
      'estacionamento-paf-matematica',
      'av-garibaldi-r5',
      'proae',
      'politecnica',
      'creche-canela',
      'reitoria',
      'rua-direita-piedade'
    ],
    routeVolta: [
      'piedade',
      'residencia-1-dist-vitoria',
      'graca-r2',
      'sao-lazaro',
      'arquitetura',
      'estacionamento-geociencias',
      'estacionamento-paf-matematica'
    ],
    schedules: [
      '06:50', '08:05', '09:20', '10:35', '11:50', '13:05', '14:20',
      '15:35', '16:50', '18:05', '19:20', '20:35', '21:50'
    ]
  },

  // ROTA B5 - Geociências ↔ Reitoria (17 km)
  {
    id: 'b5',
    name: 'B5',
    displayName: 'Geociências - Reitoria',
    color: '#8B5CF6',
    route: ['instituto-geociencias', 'residencia-1-vitoria'],
    routeIda: [
      'instituto-geociencias',
      'facom',
      'portaria-principal',
      'centro-esportes',
      'av-garibaldi-r5',
      'proae',
      'sao-lazaro',
      'politecnica',
      'creche-canela',
      'reitoria'
    ],
    routeVolta: [
      'residencia-1-vitoria',
      'faculdade-direito',
      'ics',
      'p-odontologia',
      'reitoria',
      'creche-canela',
      'politecnica',
      'sao-lazaro',
      'arquitetura',
      'facom',
      'instituto-geociencias'
    ],
    schedules: [
      '06:40', '07:55', '09:10', '10:25', '11:40', '12:55', '14:10',
      '15:25', '16:40', '17:55', '19:10', '20:25', '21:40', '22:55'
    ]
  }
];

// ===== NOMES CUSTOMIZADOS PARA VOLTA =====
export const voltaDisplayNames: Record<string, string> = {
  'b1': 'Reitoria - São Lázaro',
  'b2': 'Residência I - Ondina',
  'b3': 'Reitoria - Ondina',
  'b4': 'Piedade - Ondina',
  'b5': 'Residência I - Geociências'
};

// ===== FUNÇÕES UTILITÁRIAS CENTRALIZADAS =====
export const findLinesByRoute = (origin: string, destination: string): Line[] => {
  return lines.filter(line => {
    const hasIdaRoute = line.routeIda.includes(origin) && line.routeIda.includes(destination);
    const hasVoltaRoute = line.routeVolta.includes(origin) && line.routeVolta.includes(destination);
    
    if (hasIdaRoute) {
      const originIndex = line.routeIda.indexOf(origin);
      const destIndex = line.routeIda.indexOf(destination);
      return originIndex < destIndex;
    }
    
    if (hasVoltaRoute) {
      const originIndex = line.routeVolta.indexOf(origin);
      const destIndex = line.routeVolta.indexOf(destination);
      return originIndex < destIndex;
    }
    
    return false;
  });
};

export const getValidDestinations = (origin: string): Stop[] => {
  const destinationIds = new Set<string>();
  
  lines.forEach(line => {
    const idaIndex = line.routeIda.indexOf(origin);
    const voltaIndex = line.routeVolta.indexOf(origin);
    
    if (idaIndex !== -1) {
      line.routeIda.slice(idaIndex + 1).forEach(stop => {
        if (stop && stop.trim()) { // Validar que o ID não é vazio
          destinationIds.add(stop);
        }
      });
    }
    
    if (voltaIndex !== -1) {
      line.routeVolta.slice(voltaIndex + 1).forEach(stop => {
        if (stop && stop.trim()) { // Validar que o ID não é vazio
          destinationIds.add(stop);
        }
      });
    }
  });
  
  // Converter IDs para objetos Stop válidos
  const validDestinations: Stop[] = [];
  destinationIds.forEach(id => {
    const stop = stops.find(s => s.id === id);
    if (stop) { // Só adicionar se o stop existir
      validDestinations.push(stop);
    }
  });
  
  return validDestinations;
};

export const getStopName = (stopId: string): string => {
  return stops.find(s => s.id === stopId)?.name || stopId;
}

// Função para detectar a direção (ida ou volta) com base na origem e destino
export const detectDirection = (line: Line, originId: string, destinationId: string): 'ida' | 'volta' | null => {
  const idaIndexOrigin = line.routeIda.indexOf(originId);
  const idaIndexDest = line.routeIda.indexOf(destinationId);
  
  if (idaIndexOrigin !== -1 && idaIndexDest !== -1 && idaIndexOrigin < idaIndexDest) {
    return 'ida';
  }
  
  const voltaIndexOrigin = line.routeVolta.indexOf(originId);
  const voltaIndexDest = line.routeVolta.indexOf(destinationId);
  
  if (voltaIndexOrigin !== -1 && voltaIndexDest !== -1 && voltaIndexOrigin < voltaIndexDest) {
    return 'volta';
  }
  
  return null;
};

// ===== FUNÇÃO PARA OBTER TRAJETO ENTRE ORIGEM E DESTINO =====
export const getRouteSegment = (line: Line, origin: string, destination: string): {
  stops: Stop[];
  direction: 'ida' | 'volta' | null;
  intermediateCount: number;
} => {
  // Verificar direção ida
  const idaOriginIndex = line.routeIda.indexOf(origin);
  const idaDestIndex = line.routeIda.indexOf(destination);
  
  if (idaOriginIndex !== -1 && idaDestIndex !== -1 && idaOriginIndex < idaDestIndex) {
    const segmentIds = line.routeIda.slice(idaOriginIndex, idaDestIndex + 1);
    const segmentStops = segmentIds.map(id => stops.find(s => s.id === id)).filter(Boolean) as Stop[];
    
    return {
      stops: segmentStops,
      direction: 'ida',
      intermediateCount: Math.max(0, segmentStops.length - 2) // Excluir origem e destino
    };
  }
  
  // Verificar direção volta
  const voltaOriginIndex = line.routeVolta.indexOf(origin);
  const voltaDestIndex = line.routeVolta.indexOf(destination);
  
  if (voltaOriginIndex !== -1 && voltaDestIndex !== -1 && voltaOriginIndex < voltaDestIndex) {
    const segmentIds = line.routeVolta.slice(voltaOriginIndex, voltaDestIndex + 1);
    const segmentStops = segmentIds.map(id => stops.find(s => s.id === id)).filter(Boolean) as Stop[];
    
    return {
      stops: segmentStops,
      direction: 'volta',
      intermediateCount: Math.max(0, segmentStops.length - 2) // Excluir origem e destino
    };
  }
  
  return {
    stops: [],
    direction: null,
    intermediateCount: 0
  };
};

// ===== FUNÇÃO PARA OBTER INFORMAÇÕES COMPLETAS DE UMA LINHA =====
export const getLineInfo = (lineId: string) => {
  const line = lines.find(l => l.id === lineId);
  if (!line) return null;
  
  return {
    ...line,
    voltaDisplayName: voltaDisplayNames[lineId],
    idaStops: line.routeIda.map(stopId => stops.find(s => s.id === stopId)).filter(Boolean),
    voltaStops: line.routeVolta.map(stopId => stops.find(s => s.id === stopId)).filter(Boolean)
  };
};

// ===== ESTATÍSTICAS DO SISTEMA =====
export const getSystemStats = () => {
  return {
    totalLines: lines.length,
    totalStops: stops.length,
    totalSchedules: lines.reduce((acc, line) => acc + line.schedules.length, 0),
    averageSchedulesPerLine: Math.round(lines.reduce((acc, line) => acc + line.schedules.length, 0) / lines.length)
  };
};