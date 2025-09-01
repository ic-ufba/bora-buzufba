import { Line } from '@/types/bus';

// Nomes específicos para o sentido 'volta' de cada linha
const voltaNames: { [key: string]: string } = {
  b1: 'Reitoria - São Lázaro',
  b2: 'Residência I - Ondina',
  b3: 'Reitoria - Ondina',
  b4: 'Piedade - Ondina',
  b5: 'Residência I - Geociências',
};

/**
 * Retorna o nome de exibição customizado para uma linha, especialmente para o sentido 'volta'.
 * @param line - O objeto da linha.
 * @param direction - A direção da linha (opcional).
 * @returns O nome de exibição da linha.
 */
export const getBusDisplayName = (line: Line, direction?: 'ida' | 'volta'): string => {
  const dir = direction ?? (line as any)?.direction;
  const key = (line.id || '').toString().trim().toLowerCase();
  // Para o sentido 'volta', usa o nome customizado se existir
  if (dir === 'volta' && voltaNames[key]) {
    return voltaNames[key];
  }
  // Caso contrário, retorna o nome de exibição padrão (para 'ida' ou se não houver customização)
  return line.displayName;
};
