import React from 'react';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { 
  Info, 
  FileText, 
  GraduationCap, 
  Mail,
  ExternalLink,
  Shield,
  Clock,
  Users,
  BookOpen,
  MessageCircle,
  Lock,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const Notes: React.FC = () => {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header customizado */}
      <div className="bg-gradient-primary text-white relative overflow-hidden">
        {/* Subtle background pattern for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
        
        <div className="relative px-6 pt-4 pb-8">
          <div className="max-w-md mx-auto">
            <div className="relative">
              {/* Main title - mais próximo do topo */}
              <div className="text-center">
                <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-sm">
                  Notas e Informações
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom rounded corners - efeito da tela Lines */}
      <div className="relative">
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-background rounded-t-3xl -mt-6"></div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-8 -mt-6 pt-6">
        
        {/* Seção de Avisos Importantes */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Avisos Importantes</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Sinalizações, mensagens e atualizações relacionadas ao uso do sistema.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Este sistema é independente e não tem vínculo com a UFBA ou a empresa de transporte.
              </p>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
              As informações são de caráter colaborativo e indicativo, não é um sistema de rastreamento em tempo real.
                </p>
              </div>
            
            <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                 As rotas e horários disponibilizados são de responsabilidade da PROAE. Lembrem-se de que podem sofrer alterações sem aviso prévio.
              </p>
            </div>
          </div>
        </div>

        {/* Seção de Informações do Sistema */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-bus-blue/10 dark:bg-bus-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="w-8 h-8 text-bus-blue" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Informações do Sistema</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Dados básicos sobre recursos e funcionamento do sistema.
                </p>
              </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Clock className="w-5 h-5 text-bus-blue" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Funcionalidade:</strong> Previsão de horário de saída
              </span>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <FileText className="w-5 h-5 text-bus-blue" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Função:</strong> Visão das rotas e horários mais amigável
              </span>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Shield className="w-5 h-5 text-bus-blue" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Foco:</strong> Interface simples e pensada para uso rápido 
              </span>
            </div>
          </div>
        </div>

        {/* Seção de Documentação */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-bus-blue/10 dark:bg-bus-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-bus-blue" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Documentação Oficial</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Acesso aos documentos oficiais que servem como base para as informações do sistema.
            </p>
          </div>
          
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <a
              href="https://proae.ufba.br/sites/proae.ufba.br/files/comunicado_41_2025_informa_sobre_mudanca_de_empresa_prestadora_do_servico_de_transporte_intercampi.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-bus-blue/5 dark:bg-bus-blue/10 rounded-xl hover:bg-bus-blue/10 dark:hover:bg-bus-blue/20 transition-all duration-200 group border border-bus-blue/20"
            >
              <div>
                <span className="font-semibold text-bus-blue dark:text-bus-blue/80">Comunicado 41/2025</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">PROAE UFBA</p>
              </div>
              <ExternalLink className="w-5 h-5 text-bus-blue group-hover:text-bus-blue/80 transition-colors" />
            </a>
          </div>
        </div>

        {/* Seção do Projeto */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-bus-blue/10 dark:bg-bus-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-bus-blue" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Sobre o Projeto</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Breve apresentação e objetivos da iniciativa.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-bus-blue dark:text-bus-blue/80">IdeaLab.ic UFBA</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Criadora: Eduarda Almeida</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">Versão</div>
                <div className="font-semibold text-bus-blue">1.0.0-beta.27</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-bus-blue" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Motivação:</strong> Ajudar a todos os estudantes
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-bus-blue" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Objetivo:</strong> Dados centralizados e acessíveis
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-bus-blue" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Ideal:</strong> Fortalecer a autonomia estudantil
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <ExternalLink className="w-5 h-5 text-bus-blue flex-shrink-0" />
                <a 
                  href="https://github.com/ic-ufba/bora-buzufba.git" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-bus-blue hover:underline"
                >
                  Acessar repositório no GitHub
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Contato */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-bus-blue/10 dark:bg-bus-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-bus-blue" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Entre em Contato</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Dúvidas, sugestões ou reporte de erros. Estamos aqui para ajudar.
            </p>
          </div>
          
            <div className="space-y-3">
            <a
              href="https://forms.gle/vZnnLbvFKeiaHa6a6"
                    target="_blank"
                    rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl hover:bg-bus-blue/5 dark:hover:bg-bus-blue/10 transition-all duration-200 group border border-gray-200 dark:border-gray-700"
            >
              <div>
                <span className="font-semibold text-gray-800 dark:text-gray-200">Formulário de Contato</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">Envie sua mensagem, sugestões ou reporte erros</p>
              </div>
              <ExternalLink className="w-5 h-5 text-bus-blue group-hover:text-bus-blue/80 transition-colors" />
            </a>
            
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-bus-blue" />
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Email direto:</span>
                    <a 
                      href="mailto:idealab.ic.ufba@gmail.com"
                    className="block font-semibold text-bus-blue hover:text-bus-blue/80 dark:text-bus-blue/80 dark:hover:text-bus-blue transition-colors"
                    >
                      idealab.ic.ufba@gmail.com
                    </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Notes;
