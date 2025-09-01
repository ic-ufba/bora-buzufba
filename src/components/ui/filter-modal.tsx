import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './dialog';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Checkbox } from './checkbox';
import { Filter, RotateCcw, Check, ChevronsUpDown, X } from 'lucide-react';
import { FilterState } from '@/types/bus';
import { stops, lines } from '@/data/busData';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FilterModalProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ filters, onFiltersChange }) => {
  const [pointOpen, setPointOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const badgeCount = getFilterBadgeCount();

  return (
    <Dialog>
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
                value={filters.sortBy || 'alphabetical'}
                onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value as 'alphabetical' | 'nextDeparture' })}
              >
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder="Selecione a ordem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">Ordem alfabética</SelectItem>
                  <SelectItem value="nextDeparture">Próxima saída</SelectItem>
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

            {/* FILTRAR POR PONTO INICIAL */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">
                Filtrar por ponto inicial
              </h3>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="only-starting-points"
                  checked={filters.onlyStartingPoints || false}
                  onCheckedChange={(checked) => onFiltersChange({ 
                    ...filters, 
                    onlyStartingPoints: checked ? true : undefined 
                  })}
                  className="rounded-md"
                />
                <label
                  htmlFor="only-starting-points"
                  className="flex items-center gap-2 cursor-pointer flex-1 text-sm"
                >
                  <span className="text-muted-foreground">
                    Mostrar apenas pontos iniciais
                  </span>
                </label>
              </div>
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