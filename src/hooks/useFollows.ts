import { useState, useEffect } from 'react';
import { LineSource } from './useFavoritesMeta';

const FOLLOWS_STORAGE_KEY = 'borabuzufba-follows';

export type FollowId = string; // can be stopId or composite lineId::source

export const useFollows = () => {
  const [follows, setFollows] = useState<Set<FollowId>>(new Set());
  const [showAlertOffer, setShowAlertOffer] = useState(false);
  const [alertOfferItem, setAlertOfferItem] = useState<{
    type: 'line' | 'stop';
    id: string;
    name: string;
    direction?: 'ida' | 'volta';
  } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(FOLLOWS_STORAGE_KEY);
    if (stored) {
      try {
        const followsArray = JSON.parse(stored);
        setFollows(new Set(followsArray));
      } catch (error) {
        console.error('Erro ao carregar linhas seguidas:', error);
      }
    }
  }, []);

  const saveFollows = (newFollows: Set<FollowId>) => {
    localStorage.setItem(FOLLOWS_STORAGE_KEY, JSON.stringify(Array.from(newFollows)));
    setFollows(newFollows);
  };

  const toggleFollow = (id: FollowId, itemName?: string) => {
    const newFollows = new Set(follows);
    const wasFollowing = newFollows.has(id);
    
    if (wasFollowing) {
      newFollows.delete(id);
    } else {
      newFollows.add(id);
      console.log('Adicionando aos favoritos:', id, 'Nome do item:', itemName);
      console.log('Novo estado de follows:', newFollows);
      if (!wasFollowing) {
        console.log('Item não estava sendo seguido, adicionando e exibindo alerta.');
      }
      // Mostrar oferta de alerta apenas quando adicionar aos favoritos
      if (itemName) {
        // Verificar se o usuário desabilitou o modal de oferta
        const hideAlertOffer = localStorage.getItem('borabuz-hide-alert-offer') === 'true';
        
        if (!hideAlertOffer) {
          setAlertOfferItem({
            type: 'stop',
            id: id,
            name: itemName
          });
          console.log('Chamando setShowAlertOffer(true) para:', id);
          setShowAlertOffer(true);
        }
      }
    }
    
    saveFollows(newFollows);
    console.log('Estado de follows:', follows);
    console.log('Exibindo oferta de alerta:', showAlertOffer, 'Item de alerta:', alertOfferItem);
  };

  const isFollowing = (id: FollowId) => {
    return follows.has(id);
  };

  const makeComposite = (lineId: string, source: string, direction?: 'ida' | 'volta') => {
    return direction ? `${lineId}::${source}::${direction}` : `${lineId}::${source}`;
  };

  const isFollowingLineSource = (lineId: string, source: LineSource, direction?: 'ida' | 'volta'): boolean => {
    const composite = makeComposite(lineId, source, direction);
    const isFollowing = follows.has(composite);
    console.log(`isFollowingLineSource - Verificando linha ${lineId} com source ${source}:`);
    console.log('  - Composite:', composite);
    console.log('  - follows atual:', Array.from(follows));
    console.log('  - Resultado:', isFollowing);
    return isFollowing;
  };

  const toggleFollowLine = (lineId: string, source: string, lineName?: string, direction?: 'ida' | 'volta') => {
    const composite = makeComposite(lineId, source, direction);
    const newFollows = new Set(follows);
    
    // Remove any legacy keys without direction
    if (direction) {
      const legacyComposite = makeComposite(lineId, source);
      if (newFollows.has(legacyComposite)) {
        newFollows.delete(legacyComposite);
      }
    }
    
    // cleanup legacy plain id if present
    if (newFollows.has(lineId)) newFollows.delete(lineId);
    const wasFollowing = newFollows.has(composite);
    
    console.log('toggleFollowLine - Estado ANTES:');
    console.log('  - composite:', composite);
    console.log('  - wasFollowing:', wasFollowing);
    console.log('  - follows:', Array.from(follows));
    
    if (wasFollowing) {
      newFollows.delete(composite);
      console.log('  - Ação: Removendo dos favoritos');
    } else {
      newFollows.add(composite);
      console.log('  - Ação: Adicionando aos favoritos');
      
      // Mostrar oferta de alerta apenas quando adicionar aos favoritos
      if (lineName) {
        // Verificar se o usuário desabilitou o modal de oferta
        const hideAlertOffer = localStorage.getItem('borabuz-hide-alert-offer') === 'true';
        
        if (!hideAlertOffer) {
          setAlertOfferItem({
            type: 'line',
            id: lineId,
            name: lineName,
            direction
          });
          setShowAlertOffer(true);
        }
      }
    }
    
    // Atualiza o estado e o localStorage
    saveFollows(newFollows);
    
    console.log('toggleFollowLine - Estado DEPOIS:');
    console.log('  - follows atualizado:', Array.from(newFollows));
    console.log('  - showAlertOffer:', showAlertOffer);
  };

  const isFollowingLineAnySource = (lineId: string) => {
    // any follow that starts with `${lineId}::`
    const prefix = `${lineId}::`;
    for (const id of follows) {
      if (typeof id === 'string' && id.startsWith(prefix)) return true;
    }
    return false;
  };

  return {
    follows,
    toggleFollow,
    isFollowing,
    toggleFollowLine,
    isFollowingLineSource,
    isFollowingLineAnySource,
    showAlertOffer,
    setShowAlertOffer,
    alertOfferItem,
    setAlertOfferItem
  };
};