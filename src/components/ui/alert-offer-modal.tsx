import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Bell, Heart, Bus, MapPin } from 'lucide-react';

interface AlertOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: 'line' | 'stop';
  itemName: string;
  onConfigureAlert: () => void;
}

export const AlertOfferModal: React.FC<AlertOfferModalProps> = ({
  open,
  onOpenChange,
  itemType,
  itemName,
  onConfigureAlert
}) => {
  const navigate = useNavigate();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfigureAlert = () => {
    if (dontShowAgain) {
      localStorage.setItem('borabuz-hide-alert-offer', 'true');
    }
    onOpenChange(false);
    onConfigureAlert();
  };

  const handleSkip = () => {
    if (dontShowAgain) {
      localStorage.setItem('borabuz-hide-alert-offer', 'true');
    }
    onOpenChange(false);
    // Não navegar para favorites - ficar na tela atual
  };

  const handleModalClose = (open: boolean) => {
    if (!open && dontShowAgain) {
      localStorage.setItem('borabuz-hide-alert-offer', 'true');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Heart className="w-5 h-5 text-red-500 fill-current" />
            Favorito Adicionado!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <Bell className="w-8 h-8 text-white" />
            </div>
            
            <h3 className="font-semibold text-lg mb-2">
              Quer receber alertas?
            </h3>
            
            <div className="flex items-center justify-center gap-2 mb-3">
              {itemType === 'line' ? (
                <Bus className="w-4 h-4 text-bus-blue" />
              ) : (
                <MapPin className="w-4 h-4 text-bus-blue" />
              )}
              <span className="text-sm font-medium">{itemName}</span>
            </div>

            <p className="text-sm text-muted-foreground">
              {itemType === 'line' 
                ? 'Configure alertas para ser notificado quando a linha começar o percurso.'
                : 'Configure alertas para ser notificado quando a linha que passa por esse ponto começar o percurso.'
              }
            </p>
          </div>

          {/* Opção "Não mostrar mais" */}
          <div className="flex items-center space-x-2 justify-center">
            <Checkbox
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <Label 
              htmlFor="dont-show-again" 
              className="text-sm text-muted-foreground"
            >
              Não mostrar mais esse aviso
            </Label>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleSkip} 
              className="flex-1"
            >
              Agora não
            </Button>
            <Button 
              onClick={handleConfigureAlert} 
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Bell className="w-4 h-4 mr-2" />
              Configurar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
