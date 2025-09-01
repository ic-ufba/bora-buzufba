import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './dialog';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Checkbox } from './checkbox';
import { Filter, RotateCcw, Check, X, MapPin } from 'lucide-react';
import { FilterState } from '@/types/bus';
import { stops, lines } from '@/data/busData';
import { cn } from '@/lib/utils';

console.log('Lista de paradas:', JSON.stringify(stops, null, 2));

interface HomeFilterModalProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const HomeFilterModal: React.FC<HomeFilterModalProps> = ({ filters, onFiltersChange, open, onOpenChange }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPointList, setShowPointList] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (showPointList && listRef.current) {
      // Rola a tela para mostrar a lista de pontos com um pouco mais de espaço
      listRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }
  }, [showPointList]);

  const selectedLines = filters.selectedLines || [];
  const selectedLinesCount = selectedLines.length;
  const allLinesSelected = selectedLines.length === 0;

  const handleReset = () => {
    onFiltersChange({
      selectedStop: undefined,
      sortBy: 'nextDeparture',
      selectedLines: undefined,
      orderBy: undefined,
      onlyStartingPoints: undefined
    });
    setSearchTerm('');
    setShowPointList(false);
  };

  const handleLineToggle = (lineId: string) => {
    const currentLines = filters.selectedLines || [];
    const newLines = currentLines.includes(lineId)
      ? currentLines.filter(id => id !== lineId)
      : [...currentLines, lineId];
    
    onFiltersChange({
      ...filters,
      selectedLines: newLines.length === 0 ? undefined : newLines
    });
  };

  const handleSelectAllLines = () => {
    if (selectedLines.length === 0) {
      // Se nenhuma linha está selecionada, selecionar todas
      onFiltersChange({ ...filters, selectedLines: lines.map(line => line.id) });
    } else {
      // Se alguma linha está selecionada, desmarcar todas
      onFiltersChange({ ...filters, selectedLines: [] });
    }
  };

  const getSelectedPointName = () => {
    if (!filters.selectedStop) return null;
    const stop = stops.find(s => s.id === filters.selectedStop);
    return stop?.name;
  };

  const getFilterBadgeCount = () => {
    let count = 0;
    if (filters.selectedLines && filters.selectedLines.length < lines.length && filters.selectedLines.length > 0) count++;
    if (filters.selectedStop) count++;
    if (filters.sortBy !== 'nextDeparture') count++;
    if (filters.onlyStartingPoints) count++;
    return count;
  };

  const handleApplyFilters = () => {
    // Verificar se pelo menos uma linha está selecionada
    if (filters.selectedLines && filters.selectedLines.length === 0) {
      alert('Selecione pelo menos uma linha para aplicar os filtros.');
      return false;
    }
    return true;
  };

  // Função para remover acentos e caracteres especiais
  const normalizeString = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  // Filtrar pontos baseado no termo de pesquisa
  const filteredStops = useMemo(() => {
    // Remover duplicatas baseado no ID
    const uniqueStops = Array.from(new Map(stops.map(stop => [stop.id, stop])).values());
    
    return uniqueStops.filter((stop) => {
      const normalizedSearch = normalizeString(searchTerm);
      const normalizedName = normalizeString(stop.name);
      const normalizedLocation = stop.location ? normalizeString(stop.location) : '';
      
      return (
        normalizedName.includes(normalizedSearch) ||
        normalizedLocation.includes(normalizedSearch)
      );
    });
  }, [searchTerm]);

  const badgeCount = getFilterBadgeCount();

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsInputFocused(true);
    // Não mostra a lista imediatamente, só quando começar a digitar
    
    // Rola a tela para o campo de busca quando o teclado é aberto (mobile)
    if (window.innerWidth < 768) {
      setTimeout(() => {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Mostra a lista apenas quando começar a digitar
    setShowPointList(value.length > 0);
  };

  const handleInputBlur = () => {
    // Pequeno atraso para permitir cliques nos itens da lista
    setTimeout(() => {
      setShowPointList(false);
      setIsInputFocused(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 relative">
          <Filter className="w-4 h-4" />
          Filtros
          {badgeCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {badgeCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className={cn(
        "max-h-[85vh] overflow-hidden flex flex-col rounded-2xl",
        isMobile ? "w-[90vw] max-w-xs" : "sm:max-w-md w-full"
      )}>
        <DialogHeader className="flex-shrink-0 px-3 pt-3">
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-3 pb-1">
          <div className="space-y-4">
            {/* ORDENAÇÃO */}
            <div className="space-y-2">
              <label className="font-medium text-sm">Ordenar por</label>
              <Select
                value={filters.sortBy || 'nextDeparture'}
                onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value as 'alphabetical' | 'nextDeparture' | 'lineNumber' })}
              >
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder="Selecione a ordem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">Ordem alfabética</SelectItem>
                  <SelectItem value="nextDeparture">Próxima saída</SelectItem>
                  <SelectItem value="lineNumber">Linhas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* FILTRAR POR LINHA */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  Filtrar por linha
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllLines}
                  className="text-xs h-7 rounded-lg"
                >
                  {selectedLines.length === 0 ? 'Selecionar todas' : 'Desmarcar todas'}
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground mb-2">
                {selectedLines.length === 0 ? 'Nenhuma linha selecionada' : `${selectedLinesCount} de ${lines.length} linhas selecionadas`}
              </div>

              <div className="border rounded-xl p-3 space-y-2">
                {lines.map((line) => {
                  const isSelected = selectedLines.includes(line.id);
                  return (
                    <div key={line.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`line-${line.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleLineToggle(line.id)}
                        className="rounded-md"
                      />
                      <label
                        htmlFor={`line-${line.id}`}
                        className="flex items-center gap-2 cursor-pointer flex-1 text-sm"
                      >
                        <span className="font-medium">{line.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {line.displayName}
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FILTRAR POR PONTO */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">
                Filtrar por ponto
              </h3>
              
              <div className="relative">
                {/* Campo de busca integrado */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Pesquisar ponto..."
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    ref={inputRef}
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Lista de pontos */}
                {showPointList && isInputFocused && (
                  <div 
                    ref={listRef}
                    className="absolute left-0 right-0 mt-1 border rounded-lg bg-popover text-popover-foreground shadow-lg z-50 max-h-60 overflow-y-auto"
                    onTouchMove={(e) => e.stopPropagation()}
                  >
                    {filteredStops.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground">
                        Nenhum ponto encontrado
                      </div>
                    ) : (
                      filteredStops.map((stop) => (
                        <button
                          key={stop.id}
                          type="button"
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${filters.selectedStop === stop.id ? 'bg-blue-50 dark:bg-blue-900/50' : ''}`}
                          onMouseDown={(e) => {
                            // Usar onMouseDown em vez de onClick para evitar o blur imediato
                            e.preventDefault();
                            onFiltersChange({ ...filters, selectedStop: stop.id });
                            setShowPointList(false);
                            // Fecha o teclado móvel
                            if (inputRef.current) {
                              inputRef.current.blur();
                            }
                          }}
                        >
                          {stop.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              {filters.selectedStop && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    {getSelectedPointName()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFiltersChange({ ...filters, selectedStop: undefined })}
                    className="ml-auto h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="flex-shrink-0 flex gap-2 px-4 pb-4 pt-3 border-t">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 gap-2 rounded-xl"
          >
            <RotateCcw className="w-4 h-4" />
            Limpar tudo
          </Button>
          <DialogTrigger asChild>
            <Button 
              onClick={handleApplyFilters} 
              className="flex-1 rounded-xl"
            >
              Aplicar filtros
            </Button>
          </DialogTrigger>
        </div>
      </DialogContent>
    </Dialog>
  );
};
