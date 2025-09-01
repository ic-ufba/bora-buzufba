import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Info, Clock, Bell, Users } from 'lucide-react';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[90%] sm:max-w-md mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-bold text-center text-bus-blue flex flex-col items-center gap-2">
            <Info className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Boas vindas ao BoraBUZUFBA!</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 py-2 sm:py-4">
          {/* Explicação do sistema */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 sm:p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2 sm:gap-3">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 text-sm">
                  Sistema de Previsão
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Este <strong>não é um sistema de rastreamento em tempo real</strong>. 
                  Reunimos informações de saída e horários para fazer previsões de partidas 
                  e enviar alertas úteis.
                </p>
              </div>
            </div>
          </div>

          {/* Alertas */}
          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 sm:p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2 sm:gap-3">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm">
                  Alertas Inteligentes
                </h3>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Configure alertas para receber notificações sobre os horários 
                  de saída das suas linhas e pontos favoritos.
                </p>
              </div>
            </div>
          </div>

          {/* Projeto independente */}
          <div className="bg-green-50 dark:bg-green-950/20 p-3 sm:p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-2 sm:gap-3">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200 text-sm">
                  Projeto Independente
                </h3>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  <strong>Importante:</strong> Este é um projeto <strong>100% independente</strong>, 
                  desenvolvido <strong>por aluno para alunos</strong>. <br />
                  <strong>Não possui qualquer vínculo</strong> com a UFBA ou empresas de ônibus. Está na <strong>versão de teste</strong> e buscando evolução constante 
                  com a colaboração dos usuários. Sua opinião é muito importante!
                </p>
              </div>
            </div>
          </div>

          {/* Aviso sobre horários */}
          <div className="bg-gray-50 dark:bg-gray-800 p-2 sm:p-3 rounded-lg border">
            <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 text-center">
              <strong>Importante:</strong> Os horários podem variar conforme o trânsito 
              e condições operacionais da UFBA.
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-1 sm:pt-2">
          <Button 
            onClick={onClose}
            className="bg-bus-blue hover:bg-bus-blue/90 text-white px-6 sm:px-8 text-sm sm:text-base"
          >
            Entendi, vamos começar!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
